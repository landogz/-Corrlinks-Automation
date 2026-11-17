const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Bump when fingerprint shape changes so old caches re-validate once. */
const CACHE_VERSION = 4;

function getCachePath() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'corrlinks-verify-cache.json');
    }
  } catch (_) {
    /* ignore */
  }
  return path.join(__dirname, '..', 'corrlinks-verify-cache.json');
}

function emailKey(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function hashText(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

/**
 * Per-login credential hash so we can detect password changes for one email
 * without invalidating every other saved probe.
 */
function credentialHashFor(email, password) {
  const key = emailKey(email);
  if (!key) return '';
  return hashText(`${key}\t${String(password || '')}`);
}

/**
 * Collect unique CorrLinks email+password rows from inmate list or unique-account payloads.
 * @param {Array<object>} inmatesOrAccounts
 * @returns {Array<{ email: string, password: string }>}
 */
function collectUniqueCredentialRows(inmatesOrAccounts = []) {
  const byEmail = new Map();

  function add(email, password) {
    const key = emailKey(email);
    const pass = String(password || '');
    if (!key || !pass) return;
    // Last write wins if the same email appears with different passwords (treat as changed).
    byEmail.set(key, { email: key, password: pass });
  }

  for (const row of Array.isArray(inmatesOrAccounts) ? inmatesOrAccounts : []) {
    if (!row || typeof row !== 'object') continue;
    if (row.corrlinks_account || row.second_corrlinks_account) {
      const primary = row.corrlinks_account || {};
      const second = row.second_corrlinks_account || {};
      add(primary.email || primary.gmail || primary.corrlinks_email, primary.password);
      add(second.email || second.gmail || second.corrlinks_email, second.password);
      continue;
    }
    // Unique-account / flat payload: { email, password }
    add(row.email, row.password);
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Hash of unique CorrLinks email+password pairs only.
 * New inmates that reuse an existing login do NOT change this fingerprint.
 * Adding a new login email or changing a password does.
 */
function fingerprintCorrlinksCredentials(inmatesOrAccounts = []) {
  const rows = collectUniqueCredentialRows(inmatesOrAccounts).map(
    (row) => `${row.email}\t${row.password}`
  );
  return hashText(rows.join('\n'));
}

/**
 * Legacy roster fingerprint (per-inmate id + credentials). Kept for logging only.
 * @param {Array<object>} inmates
 */
function fingerprintCorrlinksRoster(inmates = []) {
  const rows = (Array.isArray(inmates) ? inmates : [])
    .map((inmate) => {
      const primary = inmate?.corrlinks_account || {};
      const second = inmate?.second_corrlinks_account || {};
      const primaryEmail = emailKey(primary.email || primary.gmail || primary.corrlinks_email);
      const secondEmail = emailKey(second.email || second.gmail || second.corrlinks_email);
      if (!inmate?.corrlinks_account && (inmate?.email || inmate?.password)) {
        const email = emailKey(inmate.email);
        const password = String(inmate.password || '');
        if (!email || !password) return null;
        return `account\t${email}\t${password}`;
      }
      return [
        inmate?.id ?? '',
        inmate?.inmate_id ?? '',
        primaryEmail,
        String(primary.password || ''),
        secondEmail,
        String(second.password || ''),
      ].join('\t');
    })
    .filter(Boolean)
    .sort();
  return hashText(rows.join('\n'));
}

/**
 * Primary fingerprint used by the app = unique credentials.
 * Alias kept so existing IPC / renderer call sites keep working.
 */
function fingerprintCorrlinksAccounts(inmates = []) {
  return fingerprintCorrlinksCredentials(inmates);
}

function loadCorrlinksVerifyCache() {
  try {
    const filePath = getCachePath();
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return null;
    if (Number(raw.version) !== CACHE_VERSION) return null;
    const fingerprint = typeof raw.fingerprint === 'string' ? raw.fingerprint : '';
    if (!fingerprint) return null;
    const probes =
      raw.probes && typeof raw.probes === 'object' && !Array.isArray(raw.probes) ? raw.probes : {};
    return {
      version: CACHE_VERSION,
      fingerprint,
      rosterFingerprint:
        typeof raw.rosterFingerprint === 'string' ? raw.rosterFingerprint : '',
      probes,
      savedAt: Number(raw.savedAt) || 0,
      path: filePath,
    };
  } catch (_) {
    return null;
  }
}

function saveCorrlinksVerifyCache({ fingerprint, rosterFingerprint, probes } = {}) {
  const fp = typeof fingerprint === 'string' ? fingerprint.trim() : '';
  if (!fp) throw new Error('CorrLinks verify cache requires a fingerprint');
  const cleanProbes = {};
  const source = probes && typeof probes === 'object' ? probes : {};
  for (const [key, value] of Object.entries(source)) {
    const keyEmail = emailKey(key);
    if (!keyEmail || !value || typeof value !== 'object') continue;
    cleanProbes[keyEmail] = {
      state: value.state || 'error',
      loggedIn: Boolean(value.loggedIn),
      email: typeof value.email === 'string' ? value.email : keyEmail,
      message: typeof value.message === 'string' ? value.message : '',
      attempt: value.attempt || null,
      usedSecondAccount: Boolean(value.usedSecondAccount),
      verifiedAt: Number(value.verifiedAt) || Date.now(),
      credentialHash: typeof value.credentialHash === 'string' ? value.credentialHash : '',
      cached: true,
      persistent: true,
    };
  }
  const filePath = getCachePath();
  const payload = {
    version: CACHE_VERSION,
    fingerprint: fp,
    rosterFingerprint:
      typeof rosterFingerprint === 'string' ? rosterFingerprint.trim() : '',
    probes: cleanProbes,
    savedAt: Date.now(),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return {
    ok: true,
    path: filePath,
    savedAt: payload.savedAt,
    probeCount: Object.keys(cleanProbes).length,
    version: CACHE_VERSION,
  };
}

function clearCorrlinksVerifyCache() {
  const filePath = getCachePath();
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {
    /* ignore */
  }
  return { ok: true, path: filePath };
}

module.exports = {
  CACHE_VERSION,
  emailKey,
  credentialHashFor,
  collectUniqueCredentialRows,
  fingerprintCorrlinksCredentials,
  fingerprintCorrlinksRoster,
  fingerprintCorrlinksAccounts,
  loadCorrlinksVerifyCache,
  saveCorrlinksVerifyCache,
  clearCorrlinksVerifyCache,
  getCachePath,
};
