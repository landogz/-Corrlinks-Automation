const WEEKDAY_ABBR = {
  sun: 'sun',
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
  sunday: 'sun',
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
};

const WEEK_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getAppTimezone() {
  return process.env.APP_TIMEZONE || 'America/New_York';
}

function zonedParts(date, timeZone = getAppTimezone()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  return {
    weekday: String(parts.weekday || '').toLowerCase(),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function weekdayAbbr(weekday) {
  const full = String(weekday || '').toLowerCase();
  const key = full.slice(0, 3);
  return WEEKDAY_ABBR[full] || WEEKDAY_ABBR[key] || key;
}

function previousWeekday(weekday) {
  const abbr = weekdayAbbr(weekday);
  const idx = WEEK_ORDER.indexOf(abbr);
  if (idx < 0) return abbr;
  return WEEK_ORDER[(idx + 6) % 7];
}

/**
 * CorrLinks subject from APP_TIMEZONE (default America/New_York):
 * - 1:30am up to (but not including) 5:00am: "yesterday & today" e.g. "thu & fri"
 * - Otherwise: today's short weekday only — e.g. "fri"
 */
function buildCorrlinksSubject(now = new Date(), timeZone = getAppTimezone()) {
  const today = zonedParts(now, timeZone);
  const todayAbbr = weekdayAbbr(today.weekday);
  const minutes = today.hour * 60 + today.minute;

  // 1:30am (90) inclusive → 5:00am (300) exclusive.
  if (minutes >= 90 && minutes < 300) {
    return `${previousWeekday(today.weekday)} & ${todayAbbr}`;
  }

  return todayAbbr;
}

/**
 * Weekly update subject from selected league.
 * NFL → "NFL"; CFB / NCAAFB → "CFB".
 */
function normalizeWeeklyLeague(league) {
  const raw = String(league || '').trim().toUpperCase();
  if (!raw) return null;
  if (raw === 'NFL') return 'NFL';
  if (raw === 'CFB' || raw === 'NCAAFB' || raw === 'NCAA FB' || raw === 'NCAAF') return 'CFB';
  return raw;
}

function buildWeeklySubject(league) {
  return normalizeWeeklyLeague(league) || 'Weekly';
}

/**
 * Resolve compose subject from template mode.
 * Daily → weekday subject; weekly → league name.
 */
function resolveComposeSubject({ mode, league, now, timeZone } = {}) {
  if (String(mode || '').toLowerCase() === 'weekly') {
    return buildWeeklySubject(league);
  }
  return buildCorrlinksSubject(now, timeZone);
}

module.exports = {
  getAppTimezone,
  zonedParts,
  weekdayAbbr,
  previousWeekday,
  buildCorrlinksSubject,
  normalizeWeeklyLeague,
  buildWeeklySubject,
  resolveComposeSubject,
};
