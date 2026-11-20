/**
 * Local Exchange history — TXT parts archived after auto-send slots
 * with Save file locally enabled. No SportsData history list.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeSendTime, normalizeNyDate } = require('./loopSchedule');

const MAX_ROWS = 200;

function getArchiveRoot() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'exchange-history');
    }
  } catch (_) {}
  return path.join(__dirname, '..', 'exchange-history');
}

function getIndexPath() {
  return path.join(getArchiveRoot(), 'index.json');
}

function newRowId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `exh_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeFilename(name) {
  const base = String(name || 'part.txt')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return base || 'part.txt';
}

function timeFolderSegment(sendTime) {
  const t = normalizeSendTime(sendTime, '00:00');
  return t.replace(':', '-');
}

function normalizeArchiveRow(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nyDate = normalizeNyDate(src.nyDate || src.date);
  const sendTime = normalizeSendTime(src.sendTime, null);
  const filename = String(src.filename || src.file || '').trim() || 'part.txt';
  const localPath = String(src.localPath || '').trim() || null;
  if (!nyDate || !localPath) return null;
  const characters =
    src.characters != null && Number.isFinite(Number(src.characters))
      ? Number(src.characters)
      : null;
  return {
    id: String(src.id || newRowId()),
    nyDate,
    date: nyDate,
    sendTime: sendTime || null,
    filename,
    file: filename,
    characters,
    localPath,
    sourceUrl: src.sourceUrl ? String(src.sourceUrl) : null,
    archivedAt: src.archivedAt ? String(src.archivedAt) : new Date().toISOString(),
  };
}

function capRows(rows, max = MAX_ROWS) {
  const list = Array.isArray(rows) ? rows.slice() : [];
  list.sort((a, b) => {
    const d = String(b.nyDate || '').localeCompare(String(a.nyDate || ''));
    if (d) return d;
    const t = String(b.sendTime || '').localeCompare(String(a.sendTime || ''));
    if (t) return t;
    return String(b.archivedAt || '').localeCompare(String(a.archivedAt || ''));
  });
  return list.slice(0, Math.max(1, Number(max) || MAX_ROWS));
}

function loadIndex() {
  try {
    const filePath = getIndexPath();
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rows = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
    return capRows(rows.map(normalizeArchiveRow).filter(Boolean));
  } catch (_) {
    return [];
  }
}

function saveIndex(rows) {
  const next = capRows(rows);
  const root = getArchiveRoot();
  const filePath = getIndexPath();
  try {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify({ rows: next }, null, 2)}\n`, 'utf8');
  } catch (_) {}
  return next;
}

function listArchive() {
  return loadIndex();
}

function getArchiveRow(id) {
  const key = String(id || '');
  return loadIndex().find((row) => row.id === key) || null;
}

function readArchivedText(idOrPath) {
  const key = String(idOrPath || '').trim();
  if (!key) throw new Error('Archive id or path is required');
  let localPath = key;
  if (!path.isAbsolute(key) || !fs.existsSync(key)) {
    const row = getArchiveRow(key);
    if (!row?.localPath) throw new Error('Archived file not found');
    localPath = row.localPath;
  }
  if (!fs.existsSync(localPath)) throw new Error('Archived file missing on disk');
  const text = fs.readFileSync(localPath, 'utf8');
  return { text, characters: text.length, localPath };
}

/**
 * Write unique TXT parts for a finished auto-send slot.
 * @param {{ nyDate: string, sendTime: string, files: Array<{ filename?: string, url?: string, text?: string, characters?: number }> }} payload
 * @param {{ resolveText?: (url: string) => Promise<{ text: string, characters?: number }|null> }} [opts]
 */
async function archiveSentFiles(payload = {}, opts = {}) {
  const nyDate = normalizeNyDate(payload.nyDate);
  const sendTime = normalizeSendTime(payload.sendTime, null);
  if (!nyDate) throw new Error('nyDate is required');
  if (!sendTime) throw new Error('sendTime is required');
  const files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length) {
    return { ok: true, count: 0, rows: [] };
  }

  const root = getArchiveRoot();
  const dayDir = path.join(root, nyDate);
  fs.mkdirSync(dayDir, { recursive: true });

  const resolveText =
    typeof opts.resolveText === 'function'
      ? opts.resolveText
      : async () => null;

  const existing = loadIndex();
  const byKey = new Map(
    existing.map((row) => [`${row.nyDate}|${row.sendTime}|${row.filename}`, row])
  );
  const written = [];
  const seen = new Set();

  for (const file of files) {
    const filename = safeFilename(file?.filename || file?.file || 'part.txt');
    const dedupeKey = `${nyDate}|${sendTime}|${filename}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    let text = file?.text != null ? String(file.text) : '';
    const sourceUrl = file?.url ? String(file.url) : null;
    if (!text && sourceUrl) {
      try {
        const resolved = await resolveText(sourceUrl);
        if (resolved?.text != null) text = String(resolved.text);
      } catch (_) {
        /* skip this file if body cannot be resolved */
      }
    }
    if (!text) continue;

    const diskName = `${timeFolderSegment(sendTime)}__${filename}`;
    const localPath = path.join(dayDir, diskName);
    fs.writeFileSync(localPath, text, 'utf8');
    const characters = text.length;
    const prev = byKey.get(dedupeKey);
    const row = normalizeArchiveRow({
      id: prev?.id || newRowId(),
      nyDate,
      sendTime,
      filename,
      characters,
      localPath,
      sourceUrl: sourceUrl || prev?.sourceUrl || null,
      archivedAt: new Date().toISOString(),
    });
    byKey.set(dedupeKey, row);
    written.push(row);
  }

  const next = capRows([...byKey.values()]);
  saveIndex(next);
  return { ok: true, count: written.length, rows: written };
}

module.exports = {
  MAX_ROWS,
  getArchiveRoot,
  getIndexPath,
  listArchive,
  getArchiveRow,
  readArchivedText,
  archiveSentFiles,
  normalizeArchiveRow,
  safeFilename,
};
