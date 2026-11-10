const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Bump when fingerprint shape changes so old caches re-validate once. */
const CACHE_VERSION = 2;

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

/**
 * Hash of every inmate’s CorrLinks credential assignment.
 * Changes when inmates are added/removed or any primary/second email|password changes.
 * Exchange-file-only edits do not affect this fingerprint.
 * @param {Array<object>} inmates
 */
function fingerprintCorrlinksAccounts(inmates = []) {
  const rows = (Array.isArray(inmates) ? inmates : [])
    .map((inmate) => {
      const primary = inmate?.corrlinks_account || {};
      const second = inmate?.second_corrlinks_account || {};
      const primaryEmail = emailKey(primary.email || primary.gmail || primary.corrlinks_email);
      const secondEmail = emailKey(second.email || second.gmail || second.corrlinks_email);
      // Unique-account payload fallback: { email, password } only.
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
  return crypto.createHash('sha256').update(rows.join('\n'), 'utf8').digest('hex');
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
      probes,
      savedAt: Number(raw.savedAt) || 0,
      path: filePath,
    };
  } catch (_) {
    return null;
  }
}

function saveCorrlinksVerifyCache({ fingerprint, probes } = {}) {
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
      cached: true,
      persistent: true,
    };
  }
  const filePath = getCachePath();
  const payload = {
    version: CACHE_VERSION,
    fingerprint: fp,
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
  fingerprintCorrlinksAccounts,
  loadCorrlinksVerifyCache,
  saveCorrlinksVerifyCache,
  clearCorrlinksVerifyCache,
  getCachePath,
};
