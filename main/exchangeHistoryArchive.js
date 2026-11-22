/**
 * Local Exchange history — TXT parts archived after auto-send slots
 * with Save file locally enabled. No SportsData history list.
 *
 * One file per NY date + part only (not per recipient).
 * Disk name: MMDDYYYY_part.txt (e.g. 11212026_1.txt).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeSendTime, normalizeNyDate } = require('./loopSchedule');

const MAX_ROWS = 200;

function getArchiveRoot() {
  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      try {
        return path.join(app.getPath('userData'), 'exchange-history');
      } catch (_) {
        /* app not ready yet */
      }
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

/** inmate_…_part2.txt or 11212026_2.txt → 2 */
function extractPartFromFilename(name) {
  const s = String(name || '');
  const m = s.match(/_part(\d+)\.txt$/i) || s.match(/^(\d{8})_(\d+)\.txt$/i);
  if (m) return normalizePartNumber(m[m.length - 1]);
  return null;
}

/** One archive name per day + part: 11202026_1.txt */
function archivePartFilename(nyDate, part) {
  const p = normalizePartNumber(part);
  return `${archiveDateStamp(nyDate)}_${p}.txt`;
}

function canonicalLocalPath(nyDate, part) {
  return path.join(getArchiveRoot(), nyDate, safeFilename(archivePartFilename(nyDate, part)));
}

function isCanonicalArchiveName(name, nyDate, part) {
  return String(name || '') === archivePartFilename(nyDate, part);
}

function isLegacyRecipientFilename(name) {
  return /_part\d+\.txt$/i.test(String(name || '')) && !/^\d{8}_\d+\.txt$/i.test(String(name || ''));
}

function normalizeArchiveRow(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nyDate = normalizeNyDate(src.nyDate || src.date);
  const sendTime = normalizeSendTime(src.sendTime, null);
  let part =
    src.part != null
      ? normalizePartNumber(src.part)
      : extractPartFromFilename(src.filename || src.file);
  if (part == null && src.filename) part = extractPartFromFilename(src.filename);
  const filename =
    nyDate && part
      ? archivePartFilename(nyDate, part)
      : String(src.filename || src.file || '').trim() || 'part.txt';
  let localPath = String(src.localPath || '').trim() || null;
  if (nyDate && part) {
    const canonical = canonicalLocalPath(nyDate, part);
    if (!localPath || isLegacyRecipientFilename(path.basename(localPath))) {
      localPath = canonical;
    }
  }
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

/**
 * Collapse legacy per-recipient rows into one row per date|part.
 * Copies the first readable body onto MMDDYYYY_N.txt and drops extra inmate copies from the index.
 */
function consolidateArchiveRows(rows) {
  const byKey = new Map();
  const legacyPaths = [];

  for (const raw of rows || []) {
    const nyDate = normalizeNyDate(raw?.nyDate || raw?.date);
    if (!nyDate) continue;
    const part =
      raw?.part != null
        ? normalizePartNumber(raw.part)
        : extractPartFromFilename(raw?.filename || raw?.file || raw?.localPath);
    if (!part) continue;

    const key = `${nyDate}|${part}`;
    const canonicalName = archivePartFilename(nyDate, part);
    const canonicalPath = canonicalLocalPath(nyDate, part);
    const oldPath = String(raw.localPath || '').trim();

    try {
      fs.mkdirSync(path.dirname(canonicalPath), { recursive: true });
      if (!fs.existsSync(canonicalPath)) {
        if (oldPath && fs.existsSync(oldPath)) {
          fs.copyFileSync(oldPath, canonicalPath);
        } else {
          // Search day folder for any *_partN.txt for this part.
          const dayDir = path.join(getArchiveRoot(), nyDate);
          if (fs.existsSync(dayDir)) {
            for (const name of fs.readdirSync(dayDir)) {
              if (extractPartFromFilename(name) !== part) continue;
              const candidate = path.join(dayDir, name);
              if (fs.existsSync(candidate)) {
                fs.copyFileSync(candidate, canonicalPath);
                break;
              }
            }
          }
        }
      }
      if (oldPath && oldPath !== canonicalPath && fs.existsSync(oldPath) && isLegacyRecipientFilename(path.basename(oldPath))) {
        legacyPaths.push(oldPath);
      }
    } catch (_) {
      /* keep going */
    }

    const localPath = fs.existsSync(canonicalPath)
      ? canonicalPath
      : oldPath && fs.existsSync(oldPath)
        ? oldPath
        : canonicalPath;

    let characters = raw.characters;
    if ((characters == null || !Number.isFinite(Number(characters))) && fs.existsSync(localPath)) {
      try {
        characters = fs.readFileSync(localPath, 'utf8').length;
      } catch (_) {}
    }

    const prev = byKey.get(key);
    const row = normalizeArchiveRow({
      id: prev?.id || raw.id || newRowId(),
      nyDate,
      sendTime: raw.sendTime || prev?.sendTime,
      part,
      filename: canonicalName,
      characters: characters ?? prev?.characters,
      localPath: fs.existsSync(canonicalPath) ? canonicalPath : localPath,
      sourceUrl: prev?.sourceUrl || raw.sourceUrl,
      archivedAt: prev?.archivedAt || raw.archivedAt,
    });
    if (!row) continue;
    // Keep the first row we saw for this date|part (one “recipient” body).
    if (!prev) byKey.set(key, row);
  }

  const root = getArchiveRoot();
  for (const p of legacyPaths) {
    try {
      if (!p.startsWith(root)) continue;
      if (!isLegacyRecipientFilename(path.basename(p))) continue;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }

  return [...byKey.values()];
}

function rowsNeedConsolidate(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return false;
  const keys = new Set();
  for (const row of list) {
    const part =
      row.part != null
        ? normalizePartNumber(row.part)
        : extractPartFromFilename(row.filename || row.file);
    if (!part || !row.nyDate) return true;
    const key = `${row.nyDate}|${part}`;
    if (keys.has(key)) return true;
    keys.add(key);
    if (!isCanonicalArchiveName(row.filename || row.file, row.nyDate, part)) return true;
  }
  return false;
}

function loadIndex() {
  try {
    const filePath = getIndexPath();
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rows = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
    const normalized = rows.map(normalizeArchiveRow).filter(Boolean);
    if (!rowsNeedConsolidate(normalized)) {
      return capRows(normalized);
    }
    const consolidated = consolidateArchiveRows(normalized);
    return saveIndex(consolidated);
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

  const tryRead = (localPath) => {
    if (!localPath || !fs.existsSync(localPath)) return null;
    const text = fs.readFileSync(localPath, 'utf8');
    return { text, characters: text.length, localPath };
  };

  if (path.isAbsolute(key)) {
    const direct = tryRead(key);
    if (direct) return direct;
  }

  const row = getArchiveRow(key);
  if (row) {
    const candidates = [row.localPath];
    if (row.nyDate && row.part != null) {
      candidates.push(canonicalLocalPath(row.nyDate, row.part));
    }
    for (const p of candidates) {
      const hit = tryRead(p);
      if (hit) return hit;
    }
    if (row.nyDate && row.part != null) {
      const dayDir = path.join(getArchiveRoot(), row.nyDate);
      if (fs.existsSync(dayDir)) {
        const want = normalizePartNumber(row.part);
        for (const name of fs.readdirSync(dayDir)) {
          if (extractPartFromFilename(name) !== want) continue;
          const hit = tryRead(path.join(dayDir, name));
          if (hit) return hit;
        }
      }
    }
  }

  throw new Error('Archived file not found');
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

  // Start from consolidated index so legacy recipient rows collapse first.
  const existing = loadIndex();
  const byKey = new Map(
    existing.map((row) => {
      const part =
        row.part != null
          ? normalizePartNumber(row.part)
          : normalizePartNumber(extractPartFromFilename(row.filename));
      return [`${row.nyDate}|${part}`, row];
    })
  );
  const written = [];
  const seen = new Set();

  for (const file of files) {
    const part = normalizePartNumber(
      file?.part != null ? file.part : extractPartFromFilename(file?.filename),
      seen.size + 1
    );
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
  consolidateArchiveRows,
  safeFilename,
  archiveDateStamp,
  archivePartFilename,
  normalizePartNumber,
  extractPartFromFilename,
};
