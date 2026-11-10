/**
 * Inmate Exchange TXT files from SportsData API inmate_exchange.files[]
 */

function isEmptyExchangeFilename(filename) {
  return /(?:^|[_\-.])empty(?:[_\-.]|$)/i.test(String(filename || ''));
}

function normalizeExchangeFiles(inmateExchange) {
  const files = Array.isArray(inmateExchange?.files) ? inmateExchange.files : [];
  const normalized = files
    .map((f, index) => ({
      part: Number(f.part) || index + 1,
      filename: f.filename || '',
      path: f.path || null,
      url: f.url || null,
      characters: Number(f.characters) || 0,
      empty: isEmptyExchangeFilename(f.filename),
    }))
    .filter((f) => f.url);

  const sendable = normalized
    .filter((f) => !f.empty)
    .sort((a, b) => a.part - b.part);

  const skipped = normalized.filter((f) => f.empty);

  return {
    date: inmateExchange?.date || null,
    dates: inmateExchange?.dates || [],
    early_morning_window: Boolean(inmateExchange?.early_morning_window),
    leagues: inmateExchange?.leagues || [],
    character_count: inmateExchange?.character_count ?? null,
    directory_url: inmateExchange?.directory_url || null,
    all: normalized,
    sendable,
    skipped,
    sendCount: sendable.length,
  };
}

module.exports = {
  isEmptyExchangeFilename,
  normalizeExchangeFiles,
};
