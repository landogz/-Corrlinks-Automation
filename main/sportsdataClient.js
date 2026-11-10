const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { getSportsDataConfig } = require('./config');

function extractCsrfToken(html) {
  if (!html || typeof html !== 'string') return null;

  const patterns = [
    /name="_token"\s+value="([^"]+)"/i,
    /name='_token'\s+value='([^']+)'/i,
    /value="([^"]+)"\s+name="_token"/i,
    /<meta\s+name="csrf-token"\s+content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function mapCredential(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const email = raw.email || raw.gmail || raw.corrlinks_email || '';
  const password = raw.password || '';
  if (!email && !password) return null;
  return {
    email: email || null,
    gmail: raw.gmail || email || null,
    corrlinks_email: raw.corrlinks_email || email || null,
    password: password || null,
    google_password: raw.google_password || null,
  };
}

/**
 * New API shape: data.inmate_accounts[] with nested corrlinks_account + second_corrlinks_account.
 * Legacy shape data.groups{} is still accepted as a fallback.
 */
function normalizeInmateAccounts(payload) {
  const data = payload?.data || {};
  const { normalizeExchangeFiles } = require('./exchangeFiles');

  if (Array.isArray(data.inmate_accounts)) {
    return data.inmate_accounts.map((inmate) => ({
      id: inmate.id,
      name: inmate.name || '',
      inmate_id: inmate.inmate_id || null,
      sub_options: inmate.sub_options || null,
      sub_exp_date: inmate.sub_exp_date || null,
      status: inmate.status || 'none',
      facility: inmate.facility || null,
      corrlinks_account: mapCredential(inmate.corrlinks_account),
      second_corrlinks_account: mapCredential(inmate.second_corrlinks_account),
      inmate_exchange: normalizeExchangeFiles(inmate.inmate_exchange),
    }));
  }

  // Legacy grouped shape → flatten to inmate rows when possible.
  const groups = data.groups || {};
  const flattened = [];
  for (const [key, group] of Object.entries(groups)) {
    const primary = mapCredential({
      email: group.gmail || group.corrlinks_email || key,
      password: group.password,
      google_password: group.google_password,
    });
    const inmates = Array.isArray(group.inmate_accounts) ? group.inmate_accounts : [];
    if (!inmates.length) {
      flattened.push({
        id: key,
        name: key,
        inmate_id: null,
        sub_options: null,
        sub_exp_date: null,
        status: 'none',
        facility: null,
        corrlinks_account: primary,
        second_corrlinks_account: null,
      });
      continue;
    }
    for (const inmate of inmates) {
      flattened.push({
        id: inmate.id,
        name: inmate.name || '',
        inmate_id: inmate.inmate_id || null,
        sub_options: inmate.sub_options || null,
        sub_exp_date: inmate.sub_exp_date || null,
        status: inmate.status || 'none',
        facility: inmate.facility || null,
        corrlinks_account: primary,
        second_corrlinks_account: mapCredential(
          inmate.second_corrlinks_account
            ? { email: inmate.second_corrlinks_account, password: null }
            : null
        ),
      });
    }
  }
  return flattened;
}

/** @deprecated use normalizeInmateAccounts */
function normalizeGroups(payload) {
  return normalizeInmateAccounts(payload);
}

function asCookieList(setCookie) {
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
}

class SportsDataClient {
  constructor() {
    this.jar = new CookieJar();
    this.authenticated = false;
    this.lastError = null;

    this.http = axios.create({
      timeout: 30000,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    this.http.interceptors.request.use(async (config) => {
      const url = this.resolveUrl(config);
      const cookie = await this.jar.getCookieString(url);
      if (cookie) {
        config.headers = config.headers || {};
        config.headers.Cookie = cookie;
      }
      return config;
    });

    this.http.interceptors.response.use(async (response) => {
      const url = this.resolveUrl(response.config);
      for (const cookie of asCookieList(response.headers['set-cookie'])) {
        await this.jar.setCookie(cookie, url);
      }
      return response;
    });
  }

  resetSession() {
    this.jar = new CookieJar();
    this.authenticated = false;
    this.lastError = null;
  }

  resolveUrl(config) {
    const base = config.baseURL || '';
    if (/^https?:\/\//i.test(config.url)) return config.url;
    return `${base}${config.url}`;
  }

  getConfig() {
    return getSportsDataConfig();
  }

  async requestWithRedirects(method, url, options = {}, maxHops = 8) {
    let currentUrl = url;
    let currentMethod = method;
    let currentOptions = { ...options };
    let lastResponse = null;

    for (let hop = 0; hop < maxHops; hop += 1) {
      const response = await this.http.request({
        method: currentMethod,
        url: currentUrl,
        ...currentOptions,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      lastResponse = response;

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }

      const location = response.headers.location;
      if (!location) return response;

      currentUrl = new URL(location, currentUrl).toString();
      if ([301, 302, 303].includes(response.status) && currentMethod.toUpperCase() !== 'HEAD') {
        // Browser-like: POST redirects become GET without body.
        currentMethod = 'GET';
        currentOptions = {
          headers: {
            ...(currentOptions.headers || {}),
            Accept: currentOptions.headers?.Accept || 'text/html,application/xhtml+xml',
          },
        };
        delete currentOptions.data;
      }
    }

    return lastResponse;
  }

  async login() {
    const { baseUrl, email, password } = this.getConfig();
    if (!email || !password) {
      throw new Error('SPORTSDATA_EMAIL and SPORTSDATA_PASSWORD must be set in .env');
    }

    this.authenticated = false;
    this.lastError = null;

    const loginPage = await this.requestWithRedirects('GET', `${baseUrl}/login`);
    const html = typeof loginPage.data === 'string' ? loginPage.data : '';
    const csrf = extractCsrfToken(html);
    if (!csrf) {
      throw new Error('Could not find CSRF token on SportsData login page');
    }

    const body = new URLSearchParams({
      _token: csrf,
      email,
      password,
      remember: 'true',
    });

    const authResponse = await this.http.post(`${baseUrl}/authenticate`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: baseUrl,
        Referer: `${baseUrl}/login`,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const location = authResponse.headers.location || '';
    let finalHtml = typeof authResponse.data === 'string' ? authResponse.data : '';
    let redirectedTo = location || null;

    if (location) {
      const follow = await this.requestWithRedirects('GET', new URL(location, baseUrl).toString(), {
        headers: {
          Referer: `${baseUrl}/login`,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      redirectedTo = follow.request?.res?.responseUrl || follow.config.url || redirectedTo;
      finalHtml = typeof follow.data === 'string' ? follow.data : finalHtml;
    }

    const stillOnLogin =
      /\/login/i.test(String(redirectedTo || '')) ||
      (/name="password"/i.test(finalHtml) &&
        /loginForm|Authenticate|Login to your account/i.test(finalHtml));

    if (stillOnLogin && !location) {
      this.lastError = 'SportsData login failed — check email/password';
      throw new Error(this.lastError);
    }

    // If we got a redirect away from login, treat as success even if HTML sniff is ambiguous.
    if (/\/login/i.test(String(redirectedTo || '')) && /invalid|credentials|incorrect/i.test(finalHtml)) {
      this.lastError = 'SportsData login failed — check email/password';
      throw new Error(this.lastError);
    }

    if (!location && stillOnLogin) {
      this.lastError = 'SportsData login failed — check email/password';
      throw new Error(this.lastError);
    }

    this.authenticated = true;
    return { ok: true, email, redirectedTo };
  }

  async ensureAuth() {
    if (!this.authenticated) {
      await this.login();
    }
  }

  async fetchCorrlinksAccounts(retry = true) {
    const { baseUrl } = this.getConfig();
    await this.ensureAuth();

    try {
      const response = await this.http.get(`${baseUrl}/api/v1/insidescore/corrlinks-accounts`, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${baseUrl}/insidescore/corrlinks-accounts`,
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const isLoginRedirect =
        [301, 302, 303].includes(response.status) ||
        response.status === 401 ||
        response.status === 419 ||
        (typeof response.data === 'string' && /Login to your account/i.test(response.data));

      if (isLoginRedirect) {
        this.authenticated = false;
        if (!retry) {
          throw new Error('SportsData session expired and re-login failed');
        }
        await this.login();
        return this.fetchCorrlinksAccounts(false);
      }

      if (response.status !== 200 || !response.data?.status) {
        const message =
          (typeof response.data === 'object' && response.data?.message) ||
          `Unexpected SportsData response (HTTP ${response.status})`;
        throw new Error(message);
      }

      const accounts = normalizeInmateAccounts(response.data);
      return {
        ok: true,
        message: response.data.message || 'Corrlinks accounts loaded.',
        accounts,
        inmateCount: response.data?.data?.inmate_count ?? accounts.length,
        exchangeDate: response.data?.data?.exchange_date || null,
      };
    } catch (error) {
      this.lastError = error.message;
      throw error;
    }
  }

  /**
   * Download an Inmate Exchange TXT file (session cookie required for some storage paths).
   */
  async fetchExchangeFileText(url) {
    if (!url) throw new Error('Exchange file URL is required');
    await this.ensureAuth();

    const response = await this.http.get(url, {
      headers: {
        Accept: 'text/plain,text/*,*/*',
        Referer: `${this.getConfig().baseUrl}/insidescore/inmate-exchange`,
      },
      responseType: 'text',
      transformResponse: [(data) => data],
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const text = typeof response.data === 'string' ? response.data : String(response.data ?? '');
    if (/Login to your account/i.test(text) && /name="password"/i.test(text)) {
      this.authenticated = false;
      await this.login();
      return this.fetchExchangeFileText(url);
    }

    return {
      ok: true,
      url,
      text,
      characters: text.length,
    };
  }

  /**
   * GET /api/v1/insidescore/inmate-exchange/all
   * Supports a single data object or an array of { date, file, url }.
   */
  async fetchInmateExchangeAll(retry = true) {
    const { baseUrl } = this.getConfig();
    await this.ensureAuth();

    const response = await this.http.get(`${baseUrl}/api/v1/insidescore/inmate-exchange/all`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${baseUrl}/insidescore/inmate-exchange`,
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    const isLoginRedirect =
      [301, 302, 303].includes(response.status) ||
      response.status === 401 ||
      response.status === 419 ||
      (typeof response.data === 'string' && /Login to your account/i.test(response.data));

    if (isLoginRedirect) {
      this.authenticated = false;
      if (!retry) throw new Error('SportsData session expired and re-login failed');
      await this.login();
      return this.fetchInmateExchangeAll(false);
    }

    if (response.status !== 200 || !response.data?.status) {
      const message =
        (typeof response.data === 'object' && response.data?.message) ||
        `Unexpected SportsData response (HTTP ${response.status})`;
      return { ok: false, items: [], message };
    }

    const raw = response.data.data;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const items = list
      .filter((item) => item && item.url)
      .map((item) => ({
        date: item.date || null,
        file: item.file || null,
        url: item.url,
      }));

    if (!items.length) {
      return {
        ok: false,
        items: [],
        message: response.data.message || 'No Inmate Exchange All file available',
      };
    }

    return {
      ok: true,
      items,
      // Convenience fields for the common single-file response
      date: items[0].date,
      file: items[0].file,
      url: items[0].url,
      message: response.data.message || 'Inmate Exchange All generated.',
    };
  }

  /**
   * History rows from /inmate-exchange/all only — no multi-day probing.
   */
  async fetchInmateExchangeHistory({ withCharacters = true } = {}) {
    const meta = await this.fetchInmateExchangeAll();
    if (!meta.ok || !meta.items?.length) {
      return {
        ok: true,
        count: 0,
        rows: [],
        message: meta.message || 'No Inmate Exchange All file available',
      };
    }

    const rows = [];
    for (const item of meta.items) {
      let characters = null;
      if (withCharacters) {
        try {
          const file = await this.fetchExchangeFileText(item.url);
          characters = file.characters;
        } catch (_) {
          characters = null;
        }
      }
      rows.push({
        date: item.date || null,
        file: item.file || 'all.txt',
        filename: String(item.file || '').split('/').pop() || 'all.txt',
        url: item.url,
        characters,
        ok: true,
      });
    }

    rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return {
      ok: true,
      count: rows.length,
      rows,
      message: meta.message || null,
    };
  }
}

module.exports = {
  SportsDataClient,
  normalizeInmateAccounts,
  normalizeGroups,
  mapCredential,
  extractCsrfToken,
};
