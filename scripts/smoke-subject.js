#!/usr/bin/env node
/**
 * Mechanical checks for CorrLinks daily subject (America/New_York wall clock).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { buildCorrlinksSubject, getAppTimezone, zonedParts } = require('../main/subject');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-subject: ${msg}`);
    process.exit(1);
  }
}

const tz = getAppTimezone();
assert(tz === 'America/New_York' || typeof tz === 'string', 'timezone');

// Samples use fixed UTC instants that map to America/New_York EST (UTC-5) in Nov 2026.
const samples = [
  // Tue 1:29am ET → tue (before morning window)
  ['Tue 1:29am', '2026-11-10T06:29:00Z', 'tue'],
  // Tue 1:30am ET → mon & tue
  ['Tue 1:30am', '2026-11-10T06:30:00Z', 'mon & tue'],
  // Tue 2:30am ET → mon & tue
  ['Tue 2:30am', '2026-11-10T07:30:00Z', 'mon & tue'],
  // Tue 4:59am ET → mon & tue
  ['Tue 4:59am', '2026-11-10T09:59:00Z', 'mon & tue'],
  // Tue 5:00am ET → tue
  ['Tue 5:00am', '2026-11-10T10:00:00Z', 'tue'],
  // Tue afternoon → tue
  ['Tue afternoon', '2026-11-10T19:00:00Z', 'tue'],
  // Fri 5:29pm ET → fri (before evening window)
  ['Fri 5:29pm', '2026-11-20T22:29:00Z', 'fri'],
  // Fri 5:30pm ET → sat (evening tomorrow)
  ['Fri 5:30pm', '2026-11-20T22:30:00Z', 'sat'],
  // Fri 6:30pm ET → sat (inclusive end)
  ['Fri 6:30pm', '2026-11-20T23:30:00Z', 'sat'],
  // Fri 6:31pm ET → fri
  ['Fri 6:31pm', '2026-11-20T23:31:00Z', 'fri'],
];

for (const [label, iso, expected] of samples) {
  const d = new Date(iso);
  const got = buildCorrlinksSubject(d, tz);
  const parts = zonedParts(d, tz);
  assert(
    got === expected,
    `${label} ${iso} → expected "${expected}", got "${got}" (${parts.weekday} ${parts.hour}:${String(parts.minute).padStart(2, '0')})`
  );
}

console.log('smoke-subject: ok');
process.exit(0);
