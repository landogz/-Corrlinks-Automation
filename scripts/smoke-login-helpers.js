#!/usr/bin/env node
/**
 * Mechanical check: CorrLinks loginDomHelpersScript must compile and
 * snapshotFields must not throw ReferenceError (passwordEj shorthand bug).
 * No network.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { CORRLINKS } = require('../main/config');

const src = fs.readFileSync(path.join(__dirname, '..', 'main', 'corrlinksLogin.js'), 'utf8');
const start = src.indexOf('function loginDomHelpersScript()');
const end = src.indexOf('function loginFieldScript()');
if (start < 0 || end < 0) {
  console.error('smoke-login-helpers: could not locate loginDomHelpersScript');
  process.exit(1);
}

const fnSrc = src.slice(start, end);
const sandbox = { CORRLINKS, module: { exports: {} }, exports: {}, console };
vm.runInNewContext(`${fnSrc}\nmodule.exports = loginDomHelpersScript;`, sandbox);
const body = sandbox.module.exports();
const script = `(() => {\n${body}\nreturn typeof snapshotFields === 'function';\n})()`;

try {
  new Function(script);
} catch (error) {
  console.error('smoke-login-helpers: helpers script does not compile:', error.message);
  process.exit(1);
}

// Guard the exact regression: object shorthand passwordEj without const passwordEj.
if (!/\bconst\s+passwordEj\b/.test(body) && !/\bpasswordEj\s*:/.test(body)) {
  console.error('smoke-login-helpers: snapshotFields missing passwordEj binding');
  process.exit(1);
}

console.log('smoke-login-helpers: ok');
process.exit(0);
