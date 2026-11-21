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

/** 2026-11-20 → 11202026 (MMDDYYYY). */
function archiveDateStamp(nyDate) {
  const m = String(nyDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(nyDate || '').replace(/\D/g, '') || '00000000';
  return `${m[2]}${m[3]}${m[1]}`;
}

function normalizePartNumber(part, fallback = 1) {
  const n = Number(part);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return Math.max(1, Math.floor(Number(fallback) || 1));
}

/** One archive name per day + part: 11202026_1.txt */
function archivePartFilename(nyDate, part) {
  const p = normalizePartNumber(part);
  return `${archiveDateStamp(nyDate)}_${p}.txt`;
}

function normalizeArchiveRow(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nyDate = normalizeNyDate(src.nyDate || src.date);
  const sendTime = normalizeSendTime(src.sendTime, null);
  const part = src.part != null ? normalizePartNumber(src.part) : null;
  const filename =
    String(src.filename || src.file || '').trim() ||
    (nyDate && part ? archivePartFilename(nyDate, part) : 'part.txt');
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
    part,
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
    const pa = Number(a.part) || 0;
    const pb = Number(b.part) || 0;
    if (pa !== pb) return pa - pb;
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
 * Write one TXT per NY date + part (not per recipient).
 * Disk name: MMDDYYYY_part.txt (e.g. 11202026_1.txt).
 * @param {{ nyDate: string, sendTime: string, files: Array<{ part?: number, filename?: string, url?: string, text?: string }> }} payload
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
  // One row per date+part — never one copy per inmate filename.
  const byKey = new Map(
    existing.map((row) => {
      const part =
        row.part != null
          ? normalizePartNumber(row.part)
          : normalizePartNumber(String(row.filename || '').match(/_(\d+)\.txt$/i)?.[1]);
      return [`${row.nyDate}|${part}`, row];
    })
  );
  const written = [];
  const seen = new Set();

  for (const file of files) {
    const part = normalizePartNumber(file?.part, seen.size + 1);
    const dedupeKey = `${nyDate}|${part}`;
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

    const filename = archivePartFilename(nyDate, part);
    const localPath = path.join(dayDir, safeFilename(filename));
    fs.writeFileSync(localPath, text, 'utf8');
    const characters = text.length;
    const prev = byKey.get(dedupeKey);
    const row = normalizeArchiveRow({
      id: prev?.id || newRowId(),
      nyDate,
      sendTime,
      part,
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
  archiveDateStamp,
  archivePartFilename,
  normalizePartNumber,
};
