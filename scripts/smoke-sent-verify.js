#!/usr/bin/env node
/**
 * Mechanical check: CorrLinks Sent Date Eastern parse + row match.
 * Guards false fails when Date.parse uses local TZ (e.g. UTC+8).
 */
const {
  parseCorrlinksSentDate,
  matchRecentSentRows,
} = require('../main/corrlinksSentVerify');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-sent-verify: ${msg}`);
    process.exit(1);
  }
}

const raw = '11/21/2026 7:13:22 AM';
const eastern = parseCorrlinksSentDate(raw);
const naive = Date.parse(raw);
assert(Number.isFinite(eastern), 'Eastern parse failed');

const ny = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
}).format(new Date(eastern));
assert(/7:13:22\s*AM/i.test(ny), `expected 7:13:22 AM Eastern, got ${ny}`);

// ~2 minutes after that Sent stamp (8:15 would be too late for withinMinutes:20 in a unit sense —
// use 7:15 AM EST = eastern + 2min).
const now = eastern + 2 * 60 * 1000;
const rows = [
  {
    cells: [
      'EDWARD HAROLD JR SAUNDERS (11022058)',
      'sat',
      '11/21/2026 7:13:22 AM',
    ],
  },
];

const hit = matchRecentSentRows(rows, {
  inmateId: '11022058',
  recipientName: 'EDWARD HAROLD JR SAUNDERS',
  subject: 'sat',
  withinMinutes: 20,
  afterTimestamp: eastern - 5000,
  now,
});
assert(hit.ok, 'should match fresh Sent row with Eastern dates');

// On non-US machines naive Date.parse drifts hours; Eastern match must still win.
if (Math.abs(eastern - naive) > 60 * 1000) {
  const nowFar = naive + 2 * 60 * 1000;
  const naiveWindowFail = nowFar - naive <= 20 * 60 * 1000 && nowFar - eastern > 20 * 60 * 1000;
  // If naive is behind Eastern, a "2 min after naive" clock still sees Eastern as fresh.
  // Use a clock 2 min after Eastern: naive age is then hours on PH TZ.
  const afterEastern = eastern + 2 * 60 * 1000;
  assert(afterEastern - naive > 20 * 60 * 1000, 'naive age should exceed 20m vs Eastern clock');
  const rescued = matchRecentSentRows(rows, {
    inmateId: '11022058',
    subject: 'sat',
    withinMinutes: 20,
    afterTimestamp: eastern - 5000,
    now: afterEastern,
  });
  assert(rescued.ok, 'Eastern parse must rescue Sent match when naive Date.parse is skewed');
  void naiveWindowFail;
}

// Old row outside window
const stale = matchRecentSentRows(rows, {
  inmateId: '11022058',
  subject: 'sat',
  withinMinutes: 20,
  now: eastern + 60 * 60 * 1000,
});
assert(!stale.ok, 'stale Sent row must not match');

// Lenient: id-only still matches when subject differs
const lenient = matchRecentSentRows(
  [{ cells: ['EDWARD HAROLD JR SAUNDERS (11022058)', 'fri & sat', '11/21/2026 7:13:22 AM'] }],
  {
    inmateId: '11022058',
    subject: 'sat',
    withinMinutes: 20,
    afterTimestamp: eastern - 5000,
    now,
    lenient: true,
  }
);
assert(lenient.ok, 'lenient match should ignore subject mismatch');

console.log('smoke-sent-verify: ok');
process.exit(0);
