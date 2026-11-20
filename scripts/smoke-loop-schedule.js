#!/usr/bin/env node
/**
 * Mechanical checks for loop schedule normalize + should-fire (no network).
 */
const {
  normalizeSendTime,
  normalizeSendKind,
  normalizeSendTimes,
  normalizeLoopSchedule,
  shouldFireLoopSchedule,
  nextDueLabel,
  sendKindForTime,
  sendKindToTemplate,
  templateToSendKind,
  formatSendTime12h,
  parseSendTime12h,
  saveLoopSchedule,
  DEFAULTS,
  getSchedulePath,
} = require('../main/loopSchedule');
const fs = require('fs');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-loop-schedule: ${msg}`);
    process.exit(1);
  }
}

assert(normalizeSendTime('9:05') === '09:05', 'pad sendTime');
assert(normalizeSendTime('25:00') === DEFAULTS.sendTime, 'reject bad hour');
assert(formatSendTime12h('05:30') === '5:30 AM', '12h morning');
assert(formatSendTime12h('17:45') === '5:45 PM', '12h evening');
assert(parseSendTime12h('5:30 PM') === '17:30', 'parse 12h pm');
assert(parseSendTime12h('12:05 AM') === '00:05', 'parse 12h midnight');
assert(normalizeSendKind('Weekly NFL') === 'weekly_nfl', 'kind weekly nfl');
assert(normalizeSendKind('cfb') === 'weekly_cfb', 'kind cfb');
assert(normalizeSendKind('nope') === 'daily', 'kind fallback');

const tpl = sendKindToTemplate('weekly_cfb');
assert(tpl.templateMode === 'weekly' && tpl.weeklyLeague === 'CFB', 'template from kind');
assert(templateToSendKind('weekly', 'NFL') === 'weekly_nfl', 'kind from template');

assert(
  normalizeSendTimes(['09:00', '05:30', '09:00']).join(',') === '05:30,09:00',
  'dedupe+sort times'
);

const fresh = normalizeLoopSchedule({ ...DEFAULTS, enabled: true });
assert(
  fresh.sendTimes.join(',') === '02:00,08:05,09:30,10:05,11:30,12:05',
  'default sendTimes list'
);
assert(fresh.sendKindByTime['02:00'] === 'daily', 'default 2:00 daily');
assert(fresh.saveLocalByTime['02:00'] === true, 'default 2:00 save local on');
assert(fresh.saveLocalByTime['08:05'] === false, 'default 8:05 save local off');
assert(fresh.sendKindByTime['08:05'] === 'daily', 'default 8:05 daily');
assert(fresh.sendKindByTime['09:30'] === 'weekly_cfb', 'default 9:30 weekly cfb');
assert(fresh.sendKindByTime['10:05'] === 'daily', 'default 10:05 daily');
assert(fresh.sendKindByTime['11:30'] === 'weekly_cfb', 'default 11:30 weekly cfb');
assert(fresh.sendKindByTime['12:05'] === 'daily', 'default 12:05 daily');

const migratedLocal = normalizeLoopSchedule({
  enabled: true,
  sendTimes: ['02:00', '08:05'],
  sendKindByTime: { '02:00': 'daily', '08:05': 'daily' },
});
assert(migratedLocal.saveLocalByTime['02:00'] === true, 'migrate 02:00 saveLocal');
assert(migratedLocal.saveLocalByTime['08:05'] === false, 'migrate other saveLocal off');

const base = normalizeLoopSchedule({
  enabled: true,
  sendTime: '05:30',
  sendKind: 'daily',
  lastFiredNyDate: null,
});

assert(Array.isArray(base.sendTimes) && base.sendTimes[0] === '05:30', 'single sendTimes');
assert(base.sendKindByTime['05:30'] === 'daily', 'single kind by time');

assert(
  shouldFireLoopSchedule(base, { date: '2026-11-19', minutes: 5 * 60 + 29 }).fire === false,
  'before time'
);
const atTime = shouldFireLoopSchedule(base, { date: '2026-11-19', minutes: 5 * 60 + 30 });
assert(atTime.fire === true && atTime.sendKind === 'daily', 'at time with kind');
assert(
  shouldFireLoopSchedule(base, { date: '2026-11-19', minutes: 5 * 60 + 32 }).fire === true,
  'within grace'
);
assert(
  shouldFireLoopSchedule(base, { date: '2026-11-19', minutes: 5 * 60 + 33 }).fire === false,
  'missed past grace → wait tomorrow'
);
assert(
  shouldFireLoopSchedule(
    { ...base, lastFiredNyDate: '2026-11-19' },
    { date: '2026-11-19', minutes: 5 * 60 + 30 }
  ).fire === false,
  'already fired legacy'
);
assert(
  shouldFireLoopSchedule({ ...base, enabled: false }, { date: '2026-11-19', minutes: 5 * 60 + 30 })
    .fire === false,
  'disabled'
);

const multi = normalizeLoopSchedule({
  enabled: true,
  sendTimes: ['05:30', '12:00'],
  sendKindByTime: { '05:30': 'daily', '12:00': 'weekly_nfl' },
});
assert(sendKindForTime(multi, '12:00') === 'weekly_nfl', 'kind for noon');
const dueNoon = shouldFireLoopSchedule(
  {
    ...multi,
    lastFiredByTime: { '05:30': '2026-11-19' },
  },
  { date: '2026-11-19', minutes: 12 * 60 }
);
assert(
  dueNoon.fire === true && dueNoon.sendTime === '12:00' && dueNoon.sendKind === 'weekly_nfl',
  'second time due with kind'
);
// Morning slot already past; next run is noon — do not catch up 05:30.
const skipMorning = shouldFireLoopSchedule(multi, {
  date: '2026-11-19',
  minutes: 11 * 60,
});
assert(skipMorning.fire === false, 'do not catch up missed morning');
assert(
  nextDueLabel(multi, { date: '2026-11-19', minutes: 11 * 60 }).includes('12:00 PM'),
  'next due later today'
);

const bothDone = shouldFireLoopSchedule(
  {
    ...multi,
    lastFiredByTime: { '05:30': '2026-11-19', '12:00': '2026-11-19' },
  },
  { date: '2026-11-19', minutes: 18 * 60 }
);
assert(bothDone.fire === false, 'all times fired today');

assert(
  nextDueLabel(multi, { date: '2026-11-19', minutes: 5 * 60 }).includes('5:30 AM'),
  'next due morning'
);
assert(
  nextDueLabel(
    { ...multi, lastFiredByTime: { '05:30': '2026-11-19', '12:00': '2026-11-19' } },
    { date: '2026-11-19', minutes: 18 * 60 }
  ).includes('Tomorrow'),
  'next due tomorrow'
);
assert(
  nextDueLabel(base, { date: '2026-11-19', minutes: 18 * 60 }).includes('Tomorrow'),
  'missed only slot → tomorrow'
);

const schedulePath = getSchedulePath();
const backup = fs.existsSync(schedulePath) ? fs.readFileSync(schedulePath, 'utf8') : null;
try {
  const added = saveLoopSchedule({
    enabled: true,
    sendTimes: ['05:30'],
    sendKindByTime: { '05:30': 'daily' },
    saveLocalByTime: { '05:30': false },
    addTime: '17:45',
    addSendKind: 'weekly_cfb',
    addSaveLocal: true,
    lastFiredNyDate: null,
    lastFiredByTime: {},
  });
  assert(added.sendTimes.includes('05:30') && added.sendTimes.includes('17:45'), 'addTime');
  assert(added.sendKindByTime['17:45'] === 'weekly_cfb', 'addSendKind');
  assert(added.saveLocalByTime['17:45'] === true, 'addSaveLocal');
  const kinded = saveLoopSchedule({
    setTimeKind: { time: '05:30', sendKind: 'weekly_nfl' },
  });
  assert(kinded.sendKindByTime['05:30'] === 'weekly_nfl', 'setTimeKind');
  const updated = saveLoopSchedule({
    updateSlot: { from: '05:30', to: '06:15', sendKind: 'daily', saveLocal: true },
  });
  assert(updated.sendTimes.includes('06:15') && !updated.sendTimes.includes('05:30'), 'updateSlot time');
  assert(updated.sendKindByTime['06:15'] === 'daily', 'updateSlot kind');
  assert(updated.saveLocalByTime['06:15'] === true, 'updateSlot saveLocal');
  assert(updated.saveLocalByTime['05:30'] == null, 'updateSlot clears old saveLocal');
  const removed = saveLoopSchedule({ removeTime: '17:45' });
  assert(!removed.sendTimes.includes('17:45'), 'removeTime');
  assert(!removed.sendKindByTime['17:45'], 'removeTime clears kind');
  assert(!removed.saveLocalByTime['17:45'], 'removeTime clears saveLocal');
  const marked = saveLoopSchedule({
    markFiredTime: '06:15',
    markFiredNyDate: '2026-11-19',
  });
  assert(marked.lastFiredByTime['06:15'] === '2026-11-19', 'markFiredTime');
} finally {
  try {
    if (backup != null) fs.writeFileSync(schedulePath, backup, 'utf8');
    else if (fs.existsSync(schedulePath)) fs.unlinkSync(schedulePath);
  } catch (_) {}
}

console.log('smoke-loop-schedule: ok');
process.exit(0);
