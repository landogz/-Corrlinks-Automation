#!/usr/bin/env node
/**
 * Mechanical checks for send-history normalize + cap (no network).
 */
const {
  normalizeSendRun,
  normalizeRecipient,
  capRuns,
  MAX_RUNS,
} = require('../main/sendHistory');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-send-history: ${msg}`);
    process.exit(1);
  }
}

const run = normalizeSendRun({
  sendKind: 'weekly_nfl',
  source: 'auto',
  okCount: 2,
  failCount: 1,
  recipientTotal: 3,
  summary: 'test',
  recipients: [
    { inmateId: '1', name: 'A', status: 'ok' },
    { inmateId: '2', name: 'B', status: 'failed', reason: 'x', failedFiles: [{ filename: 'p1.txt' }] },
  ],
});

assert(run.sendKind === 'weekly_nfl', 'sendKind');
assert(run.source === 'auto', 'source');
assert(run.recipients.length === 2, 'recipients');
assert(run.recipients[1].failedFiles.length === 1, 'failed files');
assert(normalizeRecipient({ id: 9, name: 'Z' })?.inmateId === '9', 'recipient id alias');

const many = Array.from({ length: MAX_RUNS + 25 }, (_, i) =>
  normalizeSendRun({
    id: `r${i}`,
    finishedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
    summary: String(i),
  })
);
const capped = capRuns(many);
assert(capped.length === MAX_RUNS, `cap to ${MAX_RUNS}`);
assert(capped[0].id === `r${MAX_RUNS + 24}`, 'newest first');

console.log('smoke-send-history: ok');
process.exit(0);
