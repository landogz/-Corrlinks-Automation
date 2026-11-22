/**
 * Local Exchange history — TXT archived after auto-send slots
 * with Save file locally enabled. No SportsData history list.
 *
 * One combined file per NY date (all parts joined) — not per recipient / part.
 * Disk name: MMDDYYYY.txt (e.g. 11222026.txt).
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

/** One archive name per day: 11222026.txt */
function archiveDayFilename(nyDate) {
  return `${archiveDateStamp(nyDate)}.txt`;
}

/** @deprecated alias — kept for older callers/smokes */
function archivePartFilename(nyDate, _part) {
  return archiveDayFilename(nyDate);
}

function canonicalLocalPath(nyDate) {
  return path.join(getArchiveRoot(), nyDate, safeFilename(archiveDayFilename(nyDate)));
}

function isCanonicalDayName(name, nyDate) {
  return String(name || '') === archiveDayFilename(nyDate);
}

function isLegacySplitFilename(name) {
  const s = String(name || '');
  if (isCanonicalDayName(s, '2000-01-01')) return false;
  return /_part\d+\.txt$/i.test(s) || /^\d{8}_\d+\.txt$/i.test(s);
}

function joinPartTexts(parts) {
  return parts
    .map((t) => String(t || '').replace(/\s+$/u, ''))
    .filter((t) => t.length > 0)
    .join('\n\n');
}

function normalizeArchiveRow(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nyDate = normalizeNyDate(src.nyDate || src.date);
  const sendTime = normalizeSendTime(src.sendTime, null);
  const filename = nyDate
    ? archiveDayFilename(nyDate)
    : String(src.filename || src.file || '').trim() || 'part.txt';
  let localPath = String(src.localPath || '').trim() || null;
  if (nyDate) {
    const canonical = canonicalLocalPath(nyDate);
    if (!localPath || isLegacySplitFilename(path.basename(localPath))) {
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
    part: null,
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
    return String(b.archivedAt || '').localeCompare(String(a.archivedAt || ''));
  });
  return list.slice(0, Math.max(1, Number(max) || MAX_ROWS));
}

function readTextIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
  } catch (_) {}
  return '';
}

/**
 * Collapse legacy per-recipient / per-part rows into one combined file per NY date.
 */
function consolidateArchiveRows(rows) {
  const byDate = new Map();
  const legacyPaths = [];

  for (const raw of rows || []) {
    const nyDate = normalizeNyDate(raw?.nyDate || raw?.date);
    if (!nyDate) continue;
    const list = byDate.get(nyDate) || [];
    list.push(raw);
    byDate.set(nyDate, list);
    const oldPath = String(raw.localPath || '').trim();
    if (oldPath && isLegacySplitFilename(path.basename(oldPath))) {
      legacyPaths.push(oldPath);
    }
  }

  const out = [];
  for (const [nyDate, list] of byDate.entries()) {
    const canonicalPath = canonicalLocalPath(nyDate);
    const dayDir = path.join(getArchiveRoot(), nyDate);
    const partBodies = new Map(); // part → text

    const absorb = (filePath, hintPart = null) => {
      const text = readTextIfExists(filePath);
      if (!text) return;
      const base = path.basename(filePath);
      if (isCanonicalDayName(base, nyDate)) {
        // Already combined — prefer as whole body if we have nothing else yet.
        if (!partBodies.size) partBodies.set(0, text);
        return;
      }
      const part = hintPart != null ? normalizePartNumber(hintPart) : extractPartFromFilename(base);
      if (part != null && !partBodies.has(part)) partBodies.set(part, text);
      else if (part == null && !partBodies.has(0)) partBodies.set(0, text);
    };

    for (const raw of list) {
      const oldPath = String(raw.localPath || '').trim();
      const hintPart =
        raw.part != null
          ? normalizePartNumber(raw.part)
          : extractPartFromFilename(raw.filename || raw.file || oldPath);
      if (oldPath) absorb(oldPath, hintPart);
    }

    try {
      if (fs.existsSync(dayDir)) {
        for (const name of fs.readdirSync(dayDir)) {
          absorb(path.join(dayDir, name), extractPartFromFilename(name));
        }
      }
    } catch (_) {}

    let combined = '';
    if (partBodies.has(0) && partBodies.size === 1) {
      combined = partBodies.get(0);
    } else {
      const ordered = [...partBodies.entries()]
        .filter(([p]) => p > 0)
        .sort((a, b) => a[0] - b[0])
        .map(([, t]) => t);
      if (ordered.length) combined = joinPartTexts(ordered);
      else if (partBodies.has(0)) combined = partBodies.get(0);
    }

    try {
      fs.mkdirSync(path.dirname(canonicalPath), { recursive: true });
      if (combined) fs.writeFileSync(canonicalPath, combined, 'utf8');
    } catch (_) {}

    if (!fs.existsSync(canonicalPath) && !combined) continue;

    const first = list[0] || {};
    const row = normalizeArchiveRow({
      id: first.id || newRowId(),
      nyDate,
      sendTime: first.sendTime,
      filename: archiveDayFilename(nyDate),
      characters: combined ? combined.length : null,
      localPath: canonicalPath,
      sourceUrl: first.sourceUrl,
      archivedAt: first.archivedAt,
    });
    if (row) out.push(row);
  }

  const root = getArchiveRoot();
  for (const p of legacyPaths) {
    try {
      if (!p.startsWith(root)) continue;
      if (!isLegacySplitFilename(path.basename(p))) continue;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }

  // Also delete leftover split files under each day dir once combined exists.
  for (const nyDate of byDate.keys()) {
    const dayDir = path.join(getArchiveRoot(), nyDate);
    const canonicalPath = canonicalLocalPath(nyDate);
    if (!fs.existsSync(canonicalPath) || !fs.existsSync(dayDir)) continue;
    try {
      for (const name of fs.readdirSync(dayDir)) {
        if (!isLegacySplitFilename(name)) continue;
        fs.unlinkSync(path.join(dayDir, name));
      }
    } catch (_) {}
  }

  return out;
}

function loadIndex() {
  try {
    const filePath = getIndexPath();
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rows = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
    const rawLooksSplit = rows.some((r) => {
      const name = String(r?.filename || r?.file || path.basename(String(r?.localPath || '')));
      return isLegacySplitFilename(name) || (r?.part != null && Number(r.part) > 0);
    });
    const dateCounts = new Map();
    for (const r of rows) {
      const d = normalizeNyDate(r?.nyDate || r?.date);
      if (!d) continue;
      dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
    }
    const hasDupDates = [...dateCounts.values()].some((n) => n > 1);
    if (!rawLooksSplit && !hasDupDates) {
      return capRows(rows.map(normalizeArchiveRow).filter(Boolean));
    }
    return saveIndex(consolidateArchiveRows(rows));
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
    if (row.nyDate) candidates.push(canonicalLocalPath(row.nyDate));
    for (const p of candidates) {
      const hit = tryRead(p);
      if (hit) return hit;
    }
    if (row.nyDate) {
      const dayDir = path.join(getArchiveRoot(), row.nyDate);
      if (fs.existsSync(dayDir)) {
        // Prefer combined day file; else join leftover parts in order.
        const combined = tryRead(canonicalLocalPath(row.nyDate));
        if (combined) return combined;
        const parts = [];
        for (const name of fs.readdirSync(dayDir)) {
          const part = extractPartFromFilename(name);
          if (part == null) continue;
          const text = readTextIfExists(path.join(dayDir, name));
          if (text) parts.push([part, text]);
        }
        if (parts.length) {
          parts.sort((a, b) => a[0] - b[0]);
          const text = joinPartTexts(parts.map(([, t]) => t));
          return { text, characters: text.length, localPath: canonicalLocalPath(row.nyDate) };
        }
      }
    }
  }

  throw new Error('Archived file not found');
}

/**
 * Write one combined TXT per NY date (all parts joined, not per recipient).
 * Disk name: MMDDYYYY.txt (e.g. 11222026.txt).
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
  const byDate = new Map(existing.map((row) => [row.nyDate, row]));

  const seenParts = new Set();
  const ordered = [];
  let sourceUrl = null;

  const sorted = files
    .map((file, index) => ({
      file,
      part: normalizePartNumber(
        file?.part != null ? file.part : extractPartFromFilename(file?.filename),
        index + 1
      ),
    }))
    .sort((a, b) => a.part - b.part);

  for (const { file, part } of sorted) {
    if (seenParts.has(part)) continue;
    seenParts.add(part);

    let text = file?.text != null ? String(file.text) : '';
    const url = file?.url ? String(file.url) : null;
    if (!text && url) {
      try {
        const resolved = await resolveText(url);
        if (resolved?.text != null) text = String(resolved.text);
      } catch (_) {
        /* skip */
      }
    }
    if (!text) continue;
    if (!sourceUrl && url) sourceUrl = url;
    ordered.push(text);
  }

  const combined = joinPartTexts(ordered);
  if (!combined) {
    return { ok: true, count: 0, rows: [] };
  }

  const filename = archiveDayFilename(nyDate);
  const localPath = path.join(dayDir, safeFilename(filename));
  fs.writeFileSync(localPath, combined, 'utf8');

  // Remove leftover split part files for this day.
  try {
    for (const name of fs.readdirSync(dayDir)) {
      if (isLegacySplitFilename(name)) fs.unlinkSync(path.join(dayDir, name));
    }
  } catch (_) {}

  const prev = byDate.get(nyDate);
  const row = normalizeArchiveRow({
    id: prev?.id || newRowId(),
    nyDate,
    sendTime,
    filename,
    characters: combined.length,
    localPath,
    sourceUrl: sourceUrl || prev?.sourceUrl || null,
    archivedAt: new Date().toISOString(),
  });
  byDate.set(nyDate, row);

  const next = capRows([...byDate.values()]);
  saveIndex(next);
  return { ok: true, count: 1, rows: [row] };
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
  archiveDayFilename,
  archivePartFilename,
  normalizePartNumber,
  extractPartFromFilename,
  joinPartTexts,
};
