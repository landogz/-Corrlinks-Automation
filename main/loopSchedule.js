const fs = require('fs');
const path = require('path');
const { getAppTimezone } = require('./appTimezone');
const { zonedParts } = require('./subject');

const SEND_KINDS = Object.freeze(['daily', 'weekly_nfl', 'weekly_cfb']);
const MAX_SEND_TIMES = 12;

const DEFAULTS = Object.freeze({
  enabled: false,
  sendTime: '08:05',
  sendTimes: Object.freeze(['08:05', '09:30', '10:05', '11:30', '12:05']),
  sendKind: 'daily',
  sendKindByTime: Object.freeze({
    '08:05': 'daily',
    '09:30': 'weekly_cfb',
    '10:05': 'daily',
    '11:30': 'weekly_cfb',
    '12:05': 'daily',
  }),
  lastFiredNyDate: null,
  lastFiredByTime: Object.freeze({}),
});

function getSchedulePath() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'loop-schedule.json');
    }
  } catch (_) {}
  return path.join(__dirname, '..', 'loop-schedule.json');
}

function normalizeSendTime(value, fallback = DEFAULTS.sendTime) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizeSendKind(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (SEND_KINDS.includes(key)) return key;
  if (key === 'weekly' || key === 'nfl' || key === 'weekly-nfl') return 'weekly_nfl';
  if (key === 'cfb' || key === 'weekly-cfb' || key === 'ncaafb') return 'weekly_cfb';
  return DEFAULTS.sendKind;
}

function normalizeNyDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function normalizeSendTimes(raw, fallbackTime = DEFAULTS.sendTime) {
  const list = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === 'object') {
        const time = normalizeSendTime(item.time || item.sendTime, null);
        if (time && !list.includes(time)) list.push(time);
        continue;
      }
      const time = normalizeSendTime(item, null);
      if (time && !list.includes(time)) list.push(time);
    }
  }
  if (!list.length) {
    const single = normalizeSendTime(fallbackTime);
    list.push(single);
  }
  list.sort((a, b) => parseSendTimeMinutes(a) - parseSendTimeMinutes(b));
  return list.slice(0, MAX_SEND_TIMES);
}

function normalizeSendKindByTime(raw, sendTimes = [], fallbackKind = DEFAULTS.sendKind) {
  const out = {};
  const src = raw && typeof raw === 'object' ? raw : {};
  const fallback = normalizeSendKind(fallbackKind);
  for (const time of sendTimes) {
    out[time] = normalizeSendKind(src[time] != null ? src[time] : fallback);
  }
  return out;
}

function normalizeLastFiredByTime(raw, sendTimes = [], legacyDate = null) {
  const out = {};
  const src = raw && typeof raw === 'object' ? raw : {};
  for (const time of sendTimes) {
    const dated = normalizeNyDate(src[time]);
    if (dated) out[time] = dated;
  }
  // Migrate single lastFiredNyDate onto the first slot when map is empty.
  const legacy = normalizeNyDate(legacyDate);
  if (legacy && sendTimes.length && !Object.keys(out).length) {
    out[sendTimes[0]] = legacy;
  }
  return out;
}

function normalizeLoopSchedule(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const sendTime = normalizeSendTime(src.sendTime);
  const sendTimes = normalizeSendTimes(
    src.sendTimes != null ? src.sendTimes : src.sendTime != null ? [src.sendTime] : null,
    sendTime
  );
  const sendKind = normalizeSendKind(src.sendKind);
  let kindSource = src.sendKindByTime;
  // Migrate object-shaped sendTimes [{ time, sendKind }] into the map.
  if ((!kindSource || typeof kindSource !== 'object') && Array.isArray(src.sendTimes)) {
    const migrated = {};
    for (const item of src.sendTimes) {
      if (item && typeof item === 'object' && (item.time || item.sendTime)) {
        const t = normalizeSendTime(item.time || item.sendTime, null);
        if (t) migrated[t] = normalizeSendKind(item.sendKind || item.kind || sendKind);
      }
    }
    if (Object.keys(migrated).length) kindSource = migrated;
  }
  const sendKindByTime = normalizeSendKindByTime(kindSource, sendTimes, sendKind);
  const lastFiredByTime = normalizeLastFiredByTime(
    src.lastFiredByTime,
    sendTimes,
    src.lastFiredNyDate
  );
  return {
    enabled: Boolean(src.enabled),
    sendTime: sendTimes[0] || sendTime,
    sendTimes,
    sendKind: sendKindByTime[sendTimes[0]] || sendKind,
    sendKindByTime,
    lastFiredNyDate: normalizeNyDate(src.lastFiredNyDate),
    lastFiredByTime,
  };
}

function sendKindForTime(schedule, sendTime) {
  const cfg = normalizeLoopSchedule(schedule);
  const time = normalizeSendTime(sendTime, null);
  if (time && cfg.sendKindByTime?.[time]) return cfg.sendKindByTime[time];
  return cfg.sendKind;
}

function sendKindToTemplate(sendKind) {
  const kind = normalizeSendKind(sendKind);
  if (kind === 'weekly_nfl') return { templateMode: 'weekly', weeklyLeague: 'NFL' };
  if (kind === 'weekly_cfb') return { templateMode: 'weekly', weeklyLeague: 'CFB' };
  return { templateMode: 'daily', weeklyLeague: 'NFL' };
}

function templateToSendKind(templateMode, weeklyLeague) {
  if (String(templateMode || '').toLowerCase() === 'weekly') {
    const league = String(weeklyLeague || '').toUpperCase();
    return league === 'CFB' ? 'weekly_cfb' : 'weekly_nfl';
  }
  return 'daily';
}

function sendKindLabel(sendKind) {
  const kind = normalizeSendKind(sendKind);
  if (kind === 'weekly_nfl') return 'Weekly NFL';
  if (kind === 'weekly_cfb') return 'Weekly CFB';
  return 'Daily';
}

/** Format stored HH:mm as 12-hour with AM/PM (e.g. 05:30 → 5:30 AM). */
function formatSendTime12h(sendTime) {
  const normalized = normalizeSendTime(sendTime, null);
  if (!normalized) return '—';
  const [hRaw, mRaw] = normalized.split(':').map(Number);
  const ampm = hRaw >= 12 ? 'PM' : 'AM';
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(mRaw).padStart(2, '0')} ${ampm}`;
}

/** Parse "5:30 AM" / "17:45" / "5:30pm" into HH:mm. */
function parseSendTime12h(value, fallback = DEFAULTS.sendTime) {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const m24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return normalizeSendTime(raw, fallback);
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!m12) return fallback;
  let hour = Number(m12[1]);
  const minute = Number(m12[2]);
  const ampm = m12[3].toUpperCase();
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return fallback;
  if (ampm === 'AM') hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return normalizeSendTime(`${hour}:${String(minute).padStart(2, '0')}`, fallback);
}

function parseSendTimeMinutes(sendTime) {
  const normalized = normalizeSendTime(sendTime);
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

function nyClock(now = new Date(), timeZone = getAppTimezone()) {
  const parts = zonedParts(now, timeZone);
  const date = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}`;
  const hour = Number(parts.hour) || 0;
  const minute = Number(parts.minute) || 0;
  return {
    date,
    hour,
    minute,
    minutes: hour * 60 + minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

/** Catch-up window after the scheduled minute (ticker is ~15s). Past that = wait until tomorrow. */
const FIRE_GRACE_MINUTES = 2;

/**
 * Pure gate: should auto-send fire for this NY clock snapshot?
 * Missed slots (already past today beyond the grace window) are skipped until tomorrow.
 * Returns the due sendTime + sendKind when fire is true.
 */
function shouldFireLoopSchedule(schedule, clock) {
  const cfg = normalizeLoopSchedule(schedule);
  if (!cfg.enabled) return { fire: false, reason: 'disabled' };
  if (!clock || !clock.date) return { fire: false, reason: 'no-clock' };
  const nowMinutes = Number(clock.minutes);
  if (!Number.isFinite(nowMinutes)) return { fire: false, reason: 'bad-clock' };

  for (const time of cfg.sendTimes) {
    const firedDate = cfg.lastFiredByTime?.[time] || null;
    if (firedDate && firedDate === clock.date) continue;
    const target = parseSendTimeMinutes(time);
    if (nowMinutes < target) {
      return { fire: false, reason: 'before-time', nextSendTime: time };
    }
    // At or just after the slot — fire within the grace window only.
    if (nowMinutes <= target + FIRE_GRACE_MINUTES) {
      const sendKind = sendKindForTime(cfg, time);
      return { fire: true, reason: 'due', sendTime: time, sendKind };
    }
    // Already past today — skip; next run is a later slot or tomorrow.
  }
  return { fire: false, reason: 'missed-wait-tomorrow' };
}

function nextDueLabel(schedule, clock) {
  const cfg = normalizeLoopSchedule(schedule);
  if (!cfg.enabled || !clock?.date) return '—';
  const nowMinutes = Number(clock.minutes);
  for (const time of cfg.sendTimes) {
    const firedDate = cfg.lastFiredByTime?.[time] || null;
    if (firedDate === clock.date) continue;
    const target = parseSendTimeMinutes(time);
    const kind = sendKindLabel(sendKindForTime(cfg, time));
    const label = formatSendTime12h(time);
    // Still ahead today (or inside the fire window) → next run is today.
    if (nowMinutes <= target + FIRE_GRACE_MINUTES) {
      if (nowMinutes >= target) return `Due now · ${label} NY · ${kind}`;
      return `Today ${label} NY · ${kind}`;
    }
    // Past grace — ignore until tomorrow; look for a later slot today.
  }
  const first = cfg.sendTimes[0] || cfg.sendTime;
  return `Tomorrow ${formatSendTime12h(first)} NY · ${sendKindLabel(sendKindForTime(cfg, first))}`;
}

function loadLoopSchedule() {
  try {
    const filePath = getSchedulePath();
    if (!fs.existsSync(filePath)) return normalizeLoopSchedule({ ...DEFAULTS });
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return normalizeLoopSchedule(raw);
  } catch (_) {
    return normalizeLoopSchedule({ ...DEFAULTS });
  }
}

function saveLoopSchedule(partial = {}) {
  const current = loadLoopSchedule();
  const merged = {
    enabled: partial.enabled != null ? partial.enabled : current.enabled,
    sendTime: partial.sendTime != null ? partial.sendTime : current.sendTime,
    sendTimes: partial.sendTimes != null ? partial.sendTimes : current.sendTimes,
    sendKind: partial.sendKind != null ? partial.sendKind : current.sendKind,
    sendKindByTime:
      partial.sendKindByTime !== undefined ? partial.sendKindByTime : current.sendKindByTime,
    lastFiredNyDate:
      partial.lastFiredNyDate !== undefined ? partial.lastFiredNyDate : current.lastFiredNyDate,
    lastFiredByTime:
      partial.lastFiredByTime !== undefined ? partial.lastFiredByTime : current.lastFiredByTime,
  };

  if (partial.addTime) {
    const time = normalizeSendTime(partial.addTime, null);
    if (time) {
      merged.sendTimes = normalizeSendTimes([...(merged.sendTimes || []), time]);
      const kind = normalizeSendKind(partial.addSendKind || partial.sendKind || merged.sendKind);
      merged.sendKindByTime = {
        ...(merged.sendKindByTime || {}),
        [time]: kind,
      };
      merged.sendKind = kind;
    }
  }
  if (partial.removeTime) {
    const remove = normalizeSendTime(partial.removeTime, null);
    merged.sendTimes = normalizeSendTimes(
      (merged.sendTimes || []).filter((t) => t !== remove),
      current.sendTime
    );
    if (remove && merged.sendKindByTime) {
      const nextKinds = { ...merged.sendKindByTime };
      delete nextKinds[remove];
      merged.sendKindByTime = nextKinds;
    }
  }
  if (partial.setTimeKind && typeof partial.setTimeKind === 'object') {
    const time = normalizeSendTime(partial.setTimeKind.time || partial.setTimeKind.sendTime, null);
    const kind = normalizeSendKind(partial.setTimeKind.sendKind || partial.setTimeKind.kind);
    if (time) {
      merged.sendKindByTime = {
        ...(merged.sendKindByTime || {}),
        [time]: kind,
      };
      if ((merged.sendTimes || [])[0] === time) merged.sendKind = kind;
    }
  }
  if (partial.updateSlot && typeof partial.updateSlot === 'object') {
    const from = normalizeSendTime(
      partial.updateSlot.from || partial.updateSlot.oldTime || partial.updateSlot.time,
      null
    );
    const to = normalizeSendTime(partial.updateSlot.to || partial.updateSlot.newTime, from);
    const kind = normalizeSendKind(
      partial.updateSlot.sendKind ||
        partial.updateSlot.kind ||
        (from && merged.sendKindByTime?.[from]) ||
        merged.sendKind
    );
    if (from && to) {
      const times = (merged.sendTimes || []).filter((t) => t !== from);
      if (!times.includes(to)) times.push(to);
      merged.sendTimes = normalizeSendTimes(times, to);
      const nextKinds = { ...(merged.sendKindByTime || {}) };
      const nextFired = { ...(merged.lastFiredByTime || {}) };
      if (from !== to) {
        delete nextKinds[from];
        if (nextFired[from]) {
          nextFired[to] = nextFired[from];
          delete nextFired[from];
        }
      }
      nextKinds[to] = kind;
      merged.sendKindByTime = nextKinds;
      merged.lastFiredByTime = nextFired;
      merged.sendKind = kind;
    }
  }
  if (partial.markFiredTime && partial.markFiredNyDate) {
    const time = normalizeSendTime(partial.markFiredTime, null);
    const date = normalizeNyDate(partial.markFiredNyDate);
    if (time && date) {
      merged.lastFiredByTime = {
        ...(merged.lastFiredByTime || {}),
        [time]: date,
      };
      merged.lastFiredNyDate = date;
    }
  }
  const next = normalizeLoopSchedule(merged);
  const filePath = getSchedulePath();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch (_) {}
  return next;
}

module.exports = {
  SEND_KINDS,
  MAX_SEND_TIMES,
  FIRE_GRACE_MINUTES,
  DEFAULTS,
  getSchedulePath,
  normalizeSendTime,
  normalizeSendKind,
  normalizeSendTimes,
  normalizeSendKindByTime,
  normalizeLoopSchedule,
  sendKindForTime,
  sendKindToTemplate,
  templateToSendKind,
  sendKindLabel,
  formatSendTime12h,
  parseSendTime12h,
  parseSendTimeMinutes,
  nyClock,
  shouldFireLoopSchedule,
  nextDueLabel,
  loadLoopSchedule,
  saveLoopSchedule,
};
