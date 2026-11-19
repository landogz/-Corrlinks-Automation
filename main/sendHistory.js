const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeSendKind, sendKindLabel } = require('./loopSchedule');

const MAX_RUNS = 100;
const SOURCES = Object.freeze(['loop', 'auto', 'retry', 'single']);

function getHistoryPath() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'send-history.json');
    }
  } catch (_) {}
  return path.join(__dirname, '..', 'send-history.json');
}

function newRunId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeFailedFile(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const inmateId = raw.inmateId != null ? String(raw.inmateId) : null;
  const filename = String(raw.filename || '').trim();
  const part = raw.part != null ? Number(raw.part) : null;
  const key = String(raw.key || raw.url || '').trim();
  const reason = String(raw.reason || '').trim();
  if (!inmateId && !filename && !key) return null;
  return {
    inmateId,
    part: Number.isFinite(part) ? part : null,
    filename: filename || null,
    key: key || null,
    url: raw.url ? String(raw.url) : null,
    reason: reason || null,
  };
}

function normalizeRecipient(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const inmateId = raw.inmateId != null ? String(raw.inmateId) : raw.id != null ? String(raw.id) : null;
  if (!inmateId) return null;
  const status = String(raw.status || '').toLowerCase() === 'ok' ? 'ok' : 'failed';
  const failedFiles = Array.isArray(raw.failedFiles)
    ? raw.failedFiles.map(normalizeFailedFile).filter(Boolean)
    : [];
  return {
    inmateId,
    name: String(raw.name || '').trim() || 'Inmate',
    inmate_id: raw.inmate_id != null ? String(raw.inmate_id) : null,
    status,
    reason: String(raw.reason || '').trim() || (status === 'failed' ? 'Send failed' : ''),
    failedFiles,
  };
}

function normalizeSendRun(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const source = SOURCES.includes(String(src.source || '').toLowerCase())
    ? String(src.source).toLowerCase()
    : 'loop';
  const sendKind = normalizeSendKind(src.sendKind);
  const recipients = Array.isArray(src.recipients)
    ? src.recipients.map(normalizeRecipient).filter(Boolean)
    : [];
  const failedFiles = Array.isArray(src.failedFiles)
    ? src.failedFiles.map(normalizeFailedFile).filter(Boolean)
    : [];
  const okCount = Math.max(0, Number(src.okCount) || recipients.filter((r) => r.status === 'ok').length);
  const failCount =
    Math.max(0, Number(src.failCount) || recipients.filter((r) => r.status === 'failed').length);
  const recipientTotal = Math.max(
    0,
    Number(src.recipientTotal) || recipients.length || okCount + failCount
  );
  const finishedAt = src.finishedAt ? String(src.finishedAt) : new Date().toISOString();
  const startedAt = src.startedAt ? String(src.startedAt) : finishedAt;
  return {
    id: String(src.id || newRunId()),
    startedAt,
    finishedAt,
    nyDate: String(src.nyDate || '').trim() || null,
    source,
    sendKind,
    sendKindLabel: sendKindLabel(sendKind),
    okCount,
    failCount,
    recipientTotal,
    aborted: Boolean(src.aborted),
    summary: String(src.summary || '').trim() || `${okCount} ok · ${failCount} failed`,
    recipients,
    failedFiles,
  };
}

function capRuns(runs, max = MAX_RUNS) {
  const list = Array.isArray(runs) ? runs.slice() : [];
  list.sort((a, b) => String(b.finishedAt || '').localeCompare(String(a.finishedAt || '')));
  return list.slice(0, Math.max(1, Number(max) || MAX_RUNS));
}

function loadSendHistory() {
  try {
    const filePath = getHistoryPath();
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const runs = Array.isArray(raw?.runs) ? raw.runs : Array.isArray(raw) ? raw : [];
    return capRuns(runs.map(normalizeSendRun));
  } catch (_) {
    return [];
  }
}

function saveSendHistoryRuns(runs) {
  const next = capRuns(runs);
  const filePath = getHistoryPath();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify({ runs: next }, null, 2)}\n`, 'utf8');
  } catch (_) {}
  return next;
}

function listSendHistory() {
  return loadSendHistory();
}

function getSendHistoryRun(id) {
  const key = String(id || '');
  return loadSendHistory().find((run) => run.id === key) || null;
}

function appendSendHistory(runInput = {}) {
  const run = normalizeSendRun(runInput);
  const next = capRuns([run, ...loadSendHistory()]);
  saveSendHistoryRuns(next);
  return run;
}

function clearSendHistory() {
  saveSendHistoryRuns([]);
  return [];
}

module.exports = {
  MAX_RUNS,
  SOURCES,
  getHistoryPath,
  newRunId,
  normalizeFailedFile,
  normalizeRecipient,
  normalizeSendRun,
  capRuns,
  loadSendHistory,
  listSendHistory,
  getSendHistoryRun,
  appendSendHistory,
  clearSendHistory,
};
