#!/usr/bin/env node
/**
 * Mechanical verification gate for loop engineering.
 * Maker (the agent) must not self-verify — this script is the checker.
 *
 * Exit 0 + {}            → allow stop (green)
 * Exit 0 + followup JSON → keep looping (red)
 *
 * Used as a Cursor `stop` hook via stdin JSON { status, loop_count, ... }.
 * Also runnable manually: `node .cursor/hooks/loop-gate.js`
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const CHECK_FILES = [
  'main/main.js',
  'main/config.js',
  'main/subject.js',
  'main/appTimezone.js',
  'renderer/renderer.js',
  'scripts/smoke-subject.js',
];

function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    ...opts,
  });
}

function syntaxCheck() {
  const failures = [];
  for (const rel of CHECK_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      failures.push(`missing: ${rel}`);
      continue;
    }
    const r = run(process.execPath, ['--check', abs]);
    if (r.status !== 0) {
      const err = String(r.stderr || r.stdout || '').trim().slice(0, 800);
      failures.push(`${rel}: ${err || `exit ${r.status}`}`);
    }
  }
  return failures;
}

function smokeSubject() {
  const r = run('npm', ['run', 'smoke:subject', '--silent'], {
    timeout: 60_000,
  });
  if (r.status === 0) return [];
  const err = String(r.stderr || r.stdout || '').trim().slice(0, 1200);
  return [`smoke:subject failed: ${err || `exit ${r.status}`}`];
}

function emit(followupMessage) {
  const out = followupMessage ? { followup_message: followupMessage } : {};
  process.stdout.write(`${JSON.stringify(out)}\n`);
}

function main() {
  const payload = readStdin();
  const isHook = Boolean(payload && typeof payload === 'object' && 'status' in payload);

  // Manual CLI run: print human summary + exit code.
  if (!isHook) {
    const failures = [...syntaxCheck(), ...smokeSubject()];
    if (failures.length) {
      console.error('LOOP GATE RED');
      for (const f of failures) console.error(`- ${f}`);
      process.exit(1);
    }
    console.log('LOOP GATE GREEN (syntax + smoke:subject)');
    process.exit(0);
  }

  // Only auto-continue after a normal completion. Aborts/errors: do not force a loop.
  if (payload.status !== 'completed') {
    emit();
    process.exit(0);
  }

  const failures = [...syntaxCheck(), ...smokeSubject()];
  if (!failures.length) {
    emit();
    process.exit(0);
  }

  const summary = failures.map((f) => `- ${f}`).join('\n');
  emit(
    [
      'Loop engineering gate is RED — do not claim done. Maker ≠ checker.',
      'Fix these mechanical failures, then stop again so the gate can re-check:',
      summary,
      'Run `node .cursor/hooks/loop-gate.js` locally if you need the full output.',
    ].join('\n')
  );
  process.exit(0);
}

main();
