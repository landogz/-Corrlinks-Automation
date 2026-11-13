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
  // Tue 1:29am ET → tue (before window)
  ['Tue 1:29am', '2026-11-10T06:29:00Z'],
  // Tue 1:30am ET → mon & tue
  ['Tue 1:30am', '2026-11-10T06:30:00Z'],
  // Tue 2:30am ET → mon & tue
  ['Tue 2:30am', '2026-11-10T07:30:00Z'],
  // Tue 4:59am ET → mon & tue
  ['Tue 4:59am', '2026-11-10T09:59:00Z'],
  // Tue 5:00am ET → tue
  ['Tue 5:00am', '2026-11-10T10:00:00Z'],
  // Tue afternoon
  ['Tue afternoon', '2026-11-10T19:00:00Z'],
];

for (const [label, iso] of samples) {
  const d = atNy(iso);
  console.log(label, iso, '→', buildCorrlinksSubject(d, tz), zonedParts(d, tz));
}
