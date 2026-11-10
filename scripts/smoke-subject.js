#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { buildCorrlinksSubject, getAppTimezone, zonedParts } = require('../main/subject');

function atNy(isoLocal) {
  // Build a Date that represents that wall time in America/New_York via offset probe.
  // For smoke we pass explicit Date and timezone formatting only — use fixed UTC instants.
  return new Date(isoLocal);
}

const tz = getAppTimezone();
console.log('APP_TIMEZONE:', tz);
console.log('Now:', buildCorrlinksSubject(new Date(), tz), zonedParts(new Date(), tz));

const samples = [
  // Pick a known Tuesday 14:00 ET ≈ 2026-11-10T19:00:00Z (EST is UTC-5)
  ['Tue afternoon', '2026-11-10T19:00:00Z'],
  // Tue 3am ET ≈ 2026-11-10T08:00:00Z
  ['Tue 3am', '2026-11-10T08:00:00Z'],
  // Mon 5am ET ≈ 2026-11-10T10:00:00Z — wait Mon Nov 9 5am ET = 2026-11-09T10:00:00Z
  ['Mon 5am', '2026-11-09T10:00:00Z'],
  // Mon noon ET
  ['Mon noon', '2026-11-09T17:00:00Z'],
];

for (const [label, iso] of samples) {
  const d = atNy(iso);
  console.log(label, iso, '→', buildCorrlinksSubject(d, tz), zonedParts(d, tz));
}
