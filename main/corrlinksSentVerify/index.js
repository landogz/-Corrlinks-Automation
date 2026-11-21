/**
 * CorrLinks Sent Messages helpers — Eastern wall-clock dates + row matching.
 * Sent Date strings have no TZ; naive Date.parse on non-US machines drops fresh sends.
 */

function norm(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Parse CorrLinks "M/D/YYYY h:mm:ss AM/PM" as America/New_York wall time → UTC ms.
 */
function parseCorrlinksSentDate(raw) {
  const s = String(raw || '').trim();
  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i
  );
  if (!m) {
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : null;
  }
  let hour = parseInt(m[4], 10);
  const min = parseInt(m[5], 10);
  const sec = parseInt(m[6] || '0', 10);
  const ap = m[7].toUpperCase();
  if (ap === 'PM' && hour < 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  const y = parseInt(m[3], 10);
  const mo = parseInt(m[1], 10) - 1;
  const d = parseInt(m[2], 10);
  const wall = { y, mo: mo + 1, d, hour, min, sec };

  function nyParts(ms) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(new Date(ms));
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return {
      y: parseInt(get('year'), 10),
      mo: parseInt(get('month'), 10),
      d: parseInt(get('day'), 10),
      hour: parseInt(get('hour'), 10) % 24,
      min: parseInt(get('minute'), 10),
      sec: parseInt(get('second'), 10),
    };
  }

  function matches(ms) {
    const p = nyParts(ms);
    return (
      p.y === wall.y &&
      p.mo === wall.mo &&
      p.d === wall.d &&
      p.hour === wall.hour &&
      p.min === wall.min &&
      p.sec === wall.sec
    );
  }

  // Probe EST (-5) and EDT (-4); keep the instant that formats back to the same NY wall time.
  for (const offsetMin of [-300, -240]) {
    const utcMs = Date.UTC(y, mo, d, hour, min, sec) - offsetMin * 60 * 1000;
    if (matches(utcMs)) return utcMs;
  }
  return Date.UTC(y, mo, d, hour, min, sec) - (-300) * 60 * 1000;
}

/**
 * @param {Array<{ to?: string, subject?: string, sentDate?: string, cells?: string[] }>} rows
 */
function matchRecentSentRows(
  rows,
  {
    inmateId = '',
    recipientName = '',
    subject = '',
    withinMinutes = 15,
    afterTimestamp = 0,
    now = Date.now(),
    maxScan = 40,
  } = {}
) {
  const idNeedle = String(inmateId || '').trim();
  const nameNeedle = norm(recipientName);
  const subjectNeedle = norm(subject);
  if (!idNeedle && !nameNeedle) {
    return { ok: false, reason: 'No recipient to match in Sent', hits: [] };
  }
  const withinMs = Math.max(1, Number(withinMinutes) || 15) * 60 * 1000;
  const afterTs = Math.max(0, Number(afterTimestamp) || 0);
  const hits = [];
  let scanned = 0;

  for (const row of rows || []) {
    const cells = Array.isArray(row.cells)
      ? row.cells
      : [row.to, row.subject, row.sentDate].filter((c) => c != null);
    if (cells.length < 2) continue;
    scanned += 1;
    if (scanned > maxScan) break;

    const rowText = cells.join(' | ');
    const rowNorm = norm(rowText);
    const idOk = idNeedle ? rowText.includes(idNeedle) : true;
    const nameOk = nameNeedle
      ? rowNorm.includes(nameNeedle) ||
        nameNeedle
          .split(' ')
          .filter((w) => w.length > 2)
          .every((w) => rowNorm.includes(w))
      : true;
    if (!idOk && !nameOk) continue;

    if (subjectNeedle) {
      const subjCell = cells.find((c) => norm(c) === subjectNeedle) || cells[1] || '';
      if (!norm(subjCell).includes(subjectNeedle) && !rowNorm.includes(subjectNeedle)) continue;
    }

    const dateCell =
      cells.find((c) => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(String(c)) || /\d{4}-\d{2}-\d{2}/.test(String(c))) ||
      cells[cells.length - 1] ||
      row.sentDate ||
      '';
    const ts = parseCorrlinksSentDate(dateCell);
    if (ts != null && now - ts > withinMs) continue;
    // Prefer rows at/after this Send click so part-1 does not confirm part-2.
    if (afterTs > 0 && ts != null && ts + 2000 < afterTs) continue;

    hits.push({
      to: cells[0] || row.to || '',
      subject: cells[1] || row.subject || '',
      sentDate: dateCell,
      row: rowText.slice(0, 160),
      ts,
    });
    if (hits.length >= 3) break;
  }

  return { ok: hits.length > 0, count: hits.length, hits };
}

module.exports = {
  parseCorrlinksSentDate,
  matchRecentSentRows,
  norm,
};
