const logEl = document.getElementById('log');
const accountSelect = document.getElementById('accountSelect');
const accountMeta = document.getElementById('accountMeta');
const badgeRow = document.getElementById('badgeRow');
const accountRows = document.getElementById('accountRows');
const filesList = document.getElementById('filesList');
const filesHint = document.getElementById('filesHint');
const configSummary = document.getElementById('configSummary');
const sportsdataForm = document.getElementById('sportsdataForm');
const sdBaseUrl = document.getElementById('sdBaseUrl');
const sdEmail = document.getElementById('sdEmail');
const sdPassword = document.getElementById('sdPassword');
const sdRemember = document.getElementById('sdRemember');
const btnSaveLogin = document.getElementById('btnSaveLogin');
const loginError = document.getElementById('loginError');
const btnRefresh = document.getElementById('btnRefresh');
const btnLogout = document.getElementById('btnLogout');
const btnLogin = document.getElementById('btnLogin');
const btnStartLoop = document.getElementById('btnStartLoop');
const btnStopLoop = document.getElementById('btnStopLoop');
const loopProgress = document.getElementById('loopProgress');
const loopCountdown = document.getElementById('loopCountdown');
const loopCountdownNum = document.getElementById('loopCountdownNum');
const loopCountdownNext = document.getElementById('loopCountdownNext');
const actionsRow = document.getElementById('actionsRow');
const btnStatus = document.getElementById('btnStatus');
const btnSend = document.getElementById('btnSend');
const loginScreen = document.getElementById('loginScreen');
const mainShell = document.getElementById('mainShell');
const signedInEmail = document.getElementById('signedInEmail');
const inmateCard = document.getElementById('inmateCard');
const composeCard = document.getElementById('composeCard');
const btnToggleInmate = document.getElementById('btnToggleInmate');
const btnToggleCompose = document.getElementById('btnToggleCompose');
const inmateCollapsedSummary = document.getElementById('inmateCollapsedSummary');
const composeCollapsedSummary = document.getElementById('composeCollapsedSummary');
const inmateSearch = document.getElementById('inmateSearch');
const inmateOptions = document.getElementById('inmateOptions');
const stepIndicator = document.getElementById('stepIndicator');
const sdConn = document.getElementById('sdConn');
const clConn = document.getElementById('clConn');
const statusHint = document.getElementById('statusHint');
const toastHost = document.getElementById('toastHost');
const logFilter = document.getElementById('logFilter');
const logAutoScroll = document.getElementById('logAutoScroll');
const logMask = document.getElementById('logMask');
const btnCopyLog = document.getElementById('btnCopyLog');
const btnClearLog = document.getElementById('btnClearLog');
const btnOpenLog = document.getElementById('btnOpenLog');
const btnCloseLog = document.getElementById('btnCloseLog');
const logDrawer = document.getElementById('logDrawer');
const logBackdrop = document.getElementById('logBackdrop');
const previewTo = document.getElementById('previewTo');
const previewSubject = document.getElementById('previewSubject');
const previewBody = document.getElementById('previewBody');
const charCountLabel = document.getElementById('charCountLabel');
const charProgress = document.getElementById('charProgress');
const confirmSend = document.getElementById('confirmSend');
const confirmTo = document.getElementById('confirmTo');
const confirmSubject = document.getElementById('confirmSubject');
const confirmChars = document.getElementById('confirmChars');

const CHAR_MAX = 12750;
const CHAR_WARN = 11000;

/** @type {Array<any>} */
let accounts = [];
/** @type {string[]} */
let selectedFileKeys = [];
let sportsConnected = false;
let corrlinksConnected = false;
let activeStep = 1;
let corrlinksLoginBusy = false;
let loopRunning = false;
let loopAbort = false;
/** When true, hide the CorrLinks embed so the HTML countdown can show. */
let loopCountdownActive = false;
/** Active top-level tab: automate | history */
let activeMainTab = 'automate';
/** @type {any} */
let historyDataTable = null;
let historyLoaded = false;
/** @type {{ url: string|null, text: string, date: string|null, filename: string|null }} */
let historyPreviewState = { url: null, text: '', date: null, filename: null };
/** @type {{ to: string, subject: string, body: string, chars: number }} */
let composePreview = { to: '', subject: '', body: '', chars: 0, parts: 0 };
let optionHighlight = -1;

const mainTabs = document.getElementById('mainTabs');
const automateView = document.getElementById('automateView');
const historyView = document.getElementById('historyView');
const historyHint = document.getElementById('historyHint');
const historyPreviewMeta = document.getElementById('historyPreviewMeta');
const historyPreviewBody = document.getElementById('historyPreviewBody');
const btnHistoryRefresh = document.getElementById('btnHistoryRefresh');
const btnHistoryCopy = document.getElementById('btnHistoryCopy');
const btnHistoryDownloadPreview = document.getElementById('btnHistoryDownloadPreview');
const btnHistoryExport = document.getElementById('btnHistoryExport');
const btnUpdate = document.getElementById('btnUpdatesAction');
const updateChip = document.getElementById('updateChip');
const updateChipLabel = document.getElementById('updateChipLabel');
const btnAccountMenu = document.getElementById('btnAccountMenu');
const accountDropdown = document.getElementById('accountDropdown');
const accountAvatar = document.getElementById('accountAvatar');
const accountMenuEmail = document.getElementById('accountMenuEmail');
const btnCopyEmail = document.getElementById('btnCopyEmail');
const btnCheckUpdatesMenu = document.getElementById('btnCheckUpdatesMenu');
const btnAbout = document.getElementById('btnAbout');
const btnShortcuts = document.getElementById('btnShortcuts');
const shortcutsDialog = document.getElementById('shortcutsDialog');
const aboutDialog = document.getElementById('aboutDialog');
const aboutVersion = document.getElementById('aboutVersion');
const updatesDialog = document.getElementById('updatesDialog');
const updatesCurrent = document.getElementById('updatesCurrent');
const updatesMessage = document.getElementById('updatesMessage');
const updatesProgressWrap = document.getElementById('updatesProgressWrap');
const updatesProgressBar = document.getElementById('updatesProgressBar');
const btnUpdatesClose = document.getElementById('btnUpdatesClose');
const logBadge = document.getElementById('logBadge');
const logSearch = document.getElementById('logSearch');
const inmateCount = document.getElementById('inmateCount');
const filesEmpty = document.getElementById('filesEmpty');
const filesBlock = document.getElementById('filesBlock');
const composeEmpty = document.getElementById('composeEmpty');
const composeFilled = document.getElementById('composeFilled');
const charPartsLabel = document.getElementById('charPartsLabel');
const charProgressBar = document.getElementById('charProgressBar');
const charMeterLive = document.getElementById('charMeterLive');
const sessionLastLogin = document.getElementById('sessionLastLogin');
const sessionLoopState = document.getElementById('sessionLoopState');
const sessionNextRun = document.getElementById('sessionNextRun');
const sessionLive = document.getElementById('sessionLive');
const corrPlaceholder = document.getElementById('corrPlaceholder');
const corrPanelStatus = document.getElementById('corrPanelStatus');
const corrErrorBanner = document.getElementById('corrErrorBanner');
const corrErrorMessage = document.getElementById('corrErrorMessage');
const btnCorrLoginCta = document.getElementById('btnCorrLoginCta');
const btnCorrReload = document.getElementById('btnCorrReload');
const btnCorrOpen = document.getElementById('btnCorrOpen');
const btnCorrZoomIn = document.getElementById('btnCorrZoomIn');
const btnCorrZoomOut = document.getElementById('btnCorrZoomOut');
const btnCorrClear = document.getElementById('btnCorrClear');
const btnCorrRetry = document.getElementById('btnCorrRetry');
const btnCorrViewLog = document.getElementById('btnCorrViewLog');
const modKey = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘' : 'Ctrl';

/** @type {any} */
let updateStatus = {
  state: 'idle',
  currentVersion: '',
  latestVersion: null,
  percent: null,
  message: '',
  error: null,
};
let updateBusy = false;
let lastUpdateToastKey = '';
let logErrorUnread = 0;
let activeCorrEmail = '';
let lastLoginAt = null;
let historyRowsCache = [];

function stamp() {
  return new Date().toLocaleTimeString([], { hour12: true });
}

function platformShortcutLabel(key) {
  return `${modKey}${key}`;
}

function setLoginShortcutHint() {
  const kbd = btnLogin?.querySelector('.btn-shortcut');
  if (kbd) kbd.textContent = platformShortcutLabel('L');
  if (btnRefresh) btnRefresh.title = `Refresh (${platformShortcutLabel('R')})`;
  if (btnOpenLog) btnOpenLog.title = `Open status log (${platformShortcutLabel('J')})`;
}

function initialsFromEmail(email) {
  const local = String(email || '').split('@')[0] || '?';
  const parts = local.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || '?';
}

function setAccountMenuOpen(open) {
  if (!accountDropdown || !btnAccountMenu) return;
  accountDropdown.hidden = !open;
  btnAccountMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function setCorrPlaceholderVisible(visible) {
  if (corrPlaceholder) corrPlaceholder.classList.toggle('is-hidden', !visible);
}

function setCorrPanelConnection(on, warn = false) {
  if (!corrPanelStatus) return;
  corrPanelStatus.classList.toggle('is-on', Boolean(on) && !warn);
  corrPanelStatus.classList.toggle('is-warn', Boolean(warn) || !on);
  const label = corrPanelStatus.querySelector('.status-label');
  if (label) {
    label.textContent = on ? (warn ? 'Attention' : 'Connected') : 'No session';
  }
  setCorrPlaceholderVisible(!on);
}

function updateSessionPanel() {
  if (sessionLastLogin) sessionLastLogin.textContent = lastLoginAt || '—';
  if (sessionLoopState) sessionLoopState.textContent = loopRunning ? 'Running' : 'Idle';
  if (sessionLive) sessionLive.hidden = !loopRunning;
  if (sessionNextRun && !loopCountdownActive) sessionNextRun.textContent = loopRunning ? '…' : '—';
}

function refreshLogBadge() {
  if (!logBadge) return;
  const show = logErrorUnread > 0 && !isLogDrawerOpen();
  logBadge.hidden = !show;
}


function truncateMiddle(value, max = 36) {
  const text = String(value || '');
  if (text.length <= max) return text;
  const keep = Math.floor((max - 1) / 2);
  return `${text.slice(0, keep)}…${text.slice(-keep)}`;
}

function maskSensitive(text) {
  if (!logMask.checked) return String(text || '');
  return String(text || '').replace(
    /([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '$1***@$2'
  );
}

function summarizeDetails(details) {
  if (details == null) return null;
  if (typeof details === 'string') {
    try {
      return summarizeDetails(JSON.parse(details));
    } catch (_) {
      return details.length > 160 ? `${details.slice(0, 160)}…` : details;
    }
  }
  if (typeof details !== 'object') return String(details);

  if (details.type || details.id || details.name) {
    const bits = [
      details.name || details.selected || details.label,
      details.id ? `(${details.id})` : null,
      details.facility || details.type,
    ].filter(Boolean);
    if (bits.length) return bits.join(' ');
  }
  if (details.selected) return String(details.selected);
  try {
    return JSON.stringify(details);
  } catch (_) {
    return String(details);
  }
}

function normalizeLogLevel(level) {
  if (level === 'ok' || level === 'success') return 'success';
  if (level === 'err' || level === 'error') return 'error';
  if (level === 'warn' || level === 'warning') return 'warn';
  return 'info';
}

function log(message, level = 'info', details = null) {
  const normalized = normalizeLogLevel(level);
  const line = document.createElement('div');
  line.className = `log-line ${normalized}`;
  line.dataset.level = normalized;

  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = stamp();

  const msg = document.createElement('div');
  msg.className = 'log-msg';
  msg.textContent = maskSensitive(message);

  if (details != null) {
    const summary = summarizeDetails(details);
    const detailsEl = document.createElement('details');
    detailsEl.className = 'log-details';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = summary ? `Details · ${truncateMiddle(String(summary), 48)}` : 'Details';
    const pre = document.createElement('pre');
    pre.textContent =
      typeof details === 'string' ? details : JSON.stringify(details, null, 2);
    detailsEl.append(summaryEl, pre);
    msg.appendChild(detailsEl);
  }

  line.append(time, msg);
  logEl.appendChild(line);
  if (normalized === 'error' && !isLogDrawerOpen()) {
    logErrorUnread += 1;
    refreshLogBadge();
  }
  applyLogFilter();
  if (logAutoScroll.checked) logEl.scrollTop = logEl.scrollHeight;
}

function applyLogFilter() {
  const mode = logFilter?.value || 'all';
  const q = String(logSearch?.value || '').trim().toLowerCase();
  [...logEl.children].forEach((line) => {
    const levelOk = mode === 'all' || line.dataset.level === mode;
    const text = (line.querySelector('.log-msg')?.innerText || '').toLowerCase();
    const searchOk = !q || text.includes(q);
    line.hidden = !(levelOk && searchOk);
  });
}

function toast(message, level = 'info') {
  const el = document.createElement('div');
  const kind = normalizeLogLevel(level);
  el.className = `toast ${kind === 'success' ? 'success' : kind === 'error' ? 'error' : kind === 'warn' ? 'warn' : 'info'}`;
  el.textContent = message;
  toastHost.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function setStatusHint(text) {
  statusHint.textContent = text;
}

function setSportsConnected(on) {
  sportsConnected = Boolean(on);
  sdConn.classList.toggle('on', sportsConnected);
  sdConn.classList.toggle('warn', !sportsConnected);
  sdConn.title = sportsConnected ? 'SportsData connected' : 'SportsData not connected';
  const sdLabel = sdConn.querySelector('.status-label');
  if (sdLabel) {
    sdLabel.textContent = sportsConnected ? 'SportsData connected' : 'SportsData offline';
  }
}

function setCorrlinksConnected(on, warn = false) {
  corrlinksConnected = Boolean(on);
  clConn.classList.toggle('on', corrlinksConnected && !warn);
  clConn.classList.toggle('warn', Boolean(warn) || !corrlinksConnected);
  const clLabel = clConn.querySelector('.status-label');
  if (clLabel) {
    clLabel.textContent = corrlinksConnected
      ? 'CorrLinks: logged in'
      : warn
        ? 'CorrLinks: attention'
        : 'CorrLinks: not logged in';
  }
  setCorrPanelConnection(corrlinksConnected, warn);
}

function setStepState({ inmateDone, composeDone, active, inmateError = false, composeError = false }) {
  activeStep = active;
  const map = {
    1: { done: inmateDone, error: inmateError, card: inmateCard },
    2: { done: composeDone, error: composeError, card: composeCard },
  };

  const steps = stepIndicator
    ? [...stepIndicator.querySelectorAll('.wf-step, .step')]
    : [];
  steps.forEach((el) => {
    const n = Number(el.dataset.step);
    const done = Boolean(map[n]?.done);
    const err = Boolean(map[n]?.error);
    el.classList.toggle('active', n === active);
    el.classList.toggle('done', done && n !== active);
    el.classList.toggle('is-current', n === active && !err);
    el.classList.toggle('is-complete', done && n !== active);
    el.classList.toggle('is-error', err);
  });

  Object.entries(map).forEach(([, item]) => {
    if (!item.card) return;
    item.card.classList.toggle('done', Boolean(item.done));
    item.card.classList.remove('collapsed');
  });
}

function setCardCollapsed(card, button, collapsed) {
  card.classList.toggle('collapsed', collapsed);
  button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function updateSignedInChip(email) {
  const value = String(email || '').trim();
  if (signedInEmail) {
    signedInEmail.textContent = value || '';
    signedInEmail.title = value;
    signedInEmail.hidden = !value;
  }
  if (btnAccountMenu) btnAccountMenu.title = value || 'Account menu';
  if (accountAvatar) accountAvatar.textContent = initialsFromEmail(value);
  if (accountMenuEmail) {
    accountMenuEmail.textContent = value || 'Not signed in';
    accountMenuEmail.title = value;
  }
}

function showLoginScreen() {
  loginScreen.hidden = false;
  mainShell.hidden = true;
  document.body.classList.add('is-login');
  document.body.classList.remove('is-app');
  scheduleCorrPaneBounds();
}

function showMainApp(email) {
  loginScreen.hidden = true;
  mainShell.hidden = false;
  document.body.classList.add('is-app');
  document.body.classList.remove('is-login');
  updateSignedInChip(email);
  scheduleCorrPaneBounds();
  requestAnimationFrame(() => syncCorrPaneBounds());
}

function selectedInmate() {
  const id = accountSelect.value;
  return accounts.find((a) => String(a.id) === String(id)) || null;
}

function setConfigSummary(_summary) {
  // Keep login meta (Base / TZ / Subject) hidden from the sign-in screen.
  if (configSummary) {
    configSummary.hidden = true;
    configSummary.textContent = '';
  }
}

function fillLoginForm(summary) {
  if (summary.baseUrl) sdBaseUrl.value = summary.baseUrl;
  if (summary.email) sdEmail.value = summary.email;
  if (summary.password) sdPassword.value = summary.password;
}

function copyText(text) {
  return navigator.clipboard.writeText(String(text || '')).then(
    () => toast('Copied', 'success'),
    () => toast('Copy failed', 'error')
  );
}

function formatRecipient(value) {
  if (!value) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Full JSON object string
    if (trimmed.startsWith('{')) {
      try {
        return formatRecipient(JSON.parse(trimmed));
      } catch (_) {
        // Truncated JSON — pull name if present
        const nameMatch = trimmed.match(/"name"\s*:\s*"((?:\\.|[^"\\])*)"/);
        if (nameMatch) {
          try {
            return JSON.parse(`"${nameMatch[1]}"`);
          } catch (_) {
            return nameMatch[1];
          }
        }
      }
    }
    return trimmed;
  }
  if (typeof value === 'object') {
    // Prefer display name only — never dump Syncfusion/inmate JSON fields.
    const name =
      value.name ||
      value.Name ||
      value.DisplayName ||
      value.text ||
      value.Text ||
      value.label ||
      value.selected ||
      '';
    if (name) return String(name).trim();
    return '—';
  }
  return String(value);
}

function updateComposePreview({ to, subject, body, chars, parts } = {}) {
  if (to != null) composePreview.to = formatRecipient(to);
  if (subject != null) composePreview.subject = String(subject || '');
  if (body != null) composePreview.body = String(body || '');
  if (chars != null) composePreview.chars = Number(chars) || 0;
  if (parts != null) composePreview.parts = Number(parts) || 0;

  const hasPreview = Boolean(composePreview.to || composePreview.subject || composePreview.body);
  if (composeEmpty) composeEmpty.hidden = hasPreview;
  if (composeFilled) composeFilled.hidden = !hasPreview;

  if (previewTo) {
    previewTo.textContent = composePreview.to || '—';
    previewTo.title = composePreview.to || '';
  }
  // Compose preview card removed — keep state for logs/session only.
  if (previewSubject) {
    previewSubject.textContent = composePreview.subject || '—';
    previewSubject.title = composePreview.subject || '';
  }
  if (previewBody) {
    previewBody.textContent = composePreview.body || '—';
    previewBody.title = composePreview.body || '';
  }

  const count = composePreview.chars || 0;
  const warn = count >= CHAR_WARN && count < CHAR_MAX;
  const over = count >= CHAR_MAX;
  if (charCountLabel) charCountLabel.textContent = `${count.toLocaleString()} / ${CHAR_MAX.toLocaleString()}`;
  const pct = Math.min(100, Math.round((count / CHAR_MAX) * 100));
  if (charProgress) {
    charProgress.style.width = `${pct}%`;
    charProgress.classList.toggle('warn', warn);
    charProgress.classList.toggle('danger', over);
  }
  if (charProgressBar) {
    charProgressBar.setAttribute('aria-valuenow', String(count));
  }
  if (charPartsLabel) {
    const partCount = composePreview.parts || 0;
    charPartsLabel.hidden = partCount <= 1;
    charPartsLabel.textContent = partCount > 1 ? `${partCount} parts` : '';
  }
  if (charMeterLive) {
    charMeterLive.textContent = over
      ? `Character limit exceeded: ${count.toLocaleString()} of ${CHAR_MAX.toLocaleString()}`
      : warn
        ? `Approaching character limit: ${count.toLocaleString()} of ${CHAR_MAX.toLocaleString()}`
        : '';
  }

  if (composeCollapsedSummary) {
    composeCollapsedSummary.textContent = composePreview.to
      ? `To ${truncateMiddle(composePreview.to, 42)} · ${composePreview.subject || 'no subject'}`
      : 'Waiting for CorrLinks…';
    composeCollapsedSummary.title = composeCollapsedSummary.textContent;
  }

  if (confirmTo) confirmTo.textContent = composePreview.to || '—';
  if (confirmSubject) confirmSubject.textContent = composePreview.subject || '—';
  if (confirmChars) confirmChars.textContent = `${count.toLocaleString()} / ${CHAR_MAX.toLocaleString()}`;
}

function renderAccountMeta(inmate) {
  if (!inmate) {
    accountMeta.hidden = true;
    inmateCollapsedSummary.textContent = accounts.length ? 'Select an inmate' : 'Load inmates first';
    inmateCollapsedSummary.title = inmateCollapsedSummary.textContent;
    inmateCollapsedSummary.classList.add('warn');
    updateActionButtons({ canLogin: false });
    return;
  }

  accountMeta.hidden = false;
  inmateCollapsedSummary.classList.remove('warn');
  inmateCollapsedSummary.textContent = `${inmate.name || 'Inmate'} · ${inmate.inmate_id || inmate.id}`;
  inmateCollapsedSummary.title = inmateCollapsedSummary.textContent;

  const primary = inmate.corrlinks_account;
  const second = inmate.second_corrlinks_account;
  const exchange = inmate.inmate_exchange || {};
  const sendable = exchange.sendable || [];
  const skipped = exchange.skipped || [];
  const status = String(inmate.status || 'n/a');

  badgeRow.innerHTML = '';
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ${/active|ok|ready/i.test(status) ? 'success' : 'muted'}`;
  statusBadge.textContent = status;
  badgeRow.appendChild(statusBadge);

  const filesBadge = document.createElement('span');
  filesBadge.className = 'badge info';
  filesBadge.textContent = `Files: ${sendable.length} sendable`;
  badgeRow.appendChild(filesBadge);

  if (skipped.length) {
    const skipBadge = document.createElement('span');
    skipBadge.className = 'badge warn';
    skipBadge.textContent = `${skipped.length} empty skipped`;
    badgeRow.appendChild(skipBadge);
  }

  accountRows.innerHTML = '';
  [
    { label: 'Primary', email: primary?.email, ready: Boolean(primary?.password), key: 'primary' },
    { label: 'Second', email: second?.email, ready: Boolean(second?.password), key: 'second' },
  ].forEach((row) => {
    const el = document.createElement('div');
    const isActive = Boolean(row.email && activeCorrEmail && row.email.toLowerCase() === String(activeCorrEmail).toLowerCase());
    el.className = `kv-row${isActive ? ' is-active' : ''}`;
    const label = document.createElement('span');
    label.className = 'kv-label';
    label.textContent = row.label;
    const value = document.createElement('span');
    value.className = 'kv-value truncate';
    value.textContent = row.email || 'none';
    value.title = row.email || 'none';
    if (row.email && !row.ready) value.textContent += ' (no password)';
    if (isActive) value.title = `${row.email} · Active account`;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'copy-btn icon-copy';
    copy.title = row.email ? 'Copy email' : 'No email';
    copy.setAttribute('aria-label', row.email ? `Copy ${row.label} email` : 'No email to copy');
    copy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 16V6a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    copy.disabled = !row.email;
    copy.addEventListener('click', async () => {
      await copyText(row.email);
      copy.classList.add('is-copied');
      copy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      setTimeout(() => {
        copy.classList.remove('is-copied');
        copy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 16V6a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      }, 1200);
    });
    el.append(label, value, copy);
    accountRows.appendChild(el);
  });

  selectedFileKeys = sendable.map((file, index) => `${file.part}:${file.filename || index}`);
  if (filesHint) {
    filesHint.textContent = sendable.length
      ? `${sendable.length} selected` + (skipped.length ? ` · ${skipped.length} empty skipped` : '')
      : '';
  }
  if (filesList) {
    filesList.innerHTML = '';
    sendable.forEach((file, index) => {
      const key = `${file.part}:${file.filename || index}`;
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedFileKeys.includes(key);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!selectedFileKeys.includes(key)) selectedFileKeys.push(key);
        } else {
          selectedFileKeys = selectedFileKeys.filter((k) => k !== key);
        }
        if (filesHint) filesHint.textContent = `${selectedFileKeys.length} selected`;
      });
      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = file.filename || `part-${file.part || index + 1}.txt`;
      name.title = name.textContent;
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      const chars = file.characters != null ? Number(file.characters).toLocaleString() : '—';
      meta.textContent = `${chars} chars`;
      li.append(cb, name, meta);
      filesList.appendChild(li);
    });
  }
  if (filesEmpty) filesEmpty.hidden = sendable.length > 0;
  if (filesBlock) filesBlock.hidden = false;

  const canLogin = Boolean(primary?.email && primary?.password);
  updateActionButtons({ canLogin });
}

function inmateHasCorrlinksLogin(inmate) {
  return Boolean(inmate?.corrlinks_account?.email && inmate?.corrlinks_account?.password);
}

/**
 * Group inmates by primary CorrLinks email (first-seen order).
 * @returns {Array<{ email: string, password: string, secondEmail: string|null, secondPassword: string|null, inmates: any[] }>}
 */
function groupInmatesByCorrlinksAccount(list = accounts) {
  const groups = [];
  const indexByEmail = new Map();
  for (const inmate of list) {
    if (!inmateHasCorrlinksLogin(inmate)) continue;
    const emailKey = String(inmate.corrlinks_account.email).trim().toLowerCase();
    if (!emailKey) continue;
    if (!indexByEmail.has(emailKey)) {
      indexByEmail.set(emailKey, groups.length);
      const second = inmate.second_corrlinks_account || {};
      groups.push({
        email: inmate.corrlinks_account.email,
        password: inmate.corrlinks_account.password,
        secondEmail: second.email || null,
        secondPassword: second.password || null,
        inmates: [inmate],
      });
      continue;
    }
    const group = groups[indexByEmail.get(emailKey)];
    group.inmates.push(inmate);
    if (!group.secondEmail && inmate.second_corrlinks_account?.email) {
      group.secondEmail = inmate.second_corrlinks_account.email;
      group.secondPassword = inmate.second_corrlinks_account.password || null;
    }
  }
  return groups;
}

function updateActionButtons({ canLogin } = {}) {
  const loginOk =
    canLogin != null ? canLogin : Boolean(selectedInmate() && inmateHasCorrlinksLogin(selectedInmate()));
  const hasLoopQueue = groupInmatesByCorrlinksAccount().length > 0;
  btnLogin.disabled = loopRunning || corrlinksLoginBusy || !loginOk;
  btnLogin.hidden = loopRunning;
  btnLogin.title = corrlinksLoginBusy
    ? 'Logging in…'
    : loginOk
      ? `Login to CorrLinks (${platformShortcutLabel('L')})`
      : selectedInmate()
        ? 'Selected inmate is missing CorrLinks credentials'
        : 'Select an inmate with CorrLinks credentials';
  const loginLabel = btnLogin.querySelector('.btn-main-label');
  if (loginLabel) loginLabel.textContent = corrlinksLoginBusy ? 'Logging in…' : 'Login to CorrLinks';
  btnStartLoop.disabled = loopRunning || corrlinksLoginBusy || !hasLoopQueue;
  btnStartLoop.hidden = loopRunning;
  btnStartLoop.title = hasLoopQueue
    ? 'Probe accounts then compose recipients (no send)'
    : 'Load inmates with CorrLinks credentials first';
  btnStopLoop.disabled = !loopRunning;
  btnStopLoop.hidden = !loopRunning;
  actionsRow?.classList.toggle('is-looping', loopRunning);
  if (inmateSearch) inmateSearch.disabled = loopRunning || !accounts.length;
  updateSessionPanel();
}

function setLoopProgress(text) {
  if (!loopProgress) return;
  if (!text) {
    loopProgress.hidden = true;
    loopProgress.textContent = '';
    return;
  }
  loopProgress.hidden = false;
  loopProgress.textContent = text;
}

function filterAccounts(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return accounts.slice();
  return accounts.filter((inmate) => {
    const hay = [
      inmate.name,
      inmate.inmate_id,
      inmate.id,
      inmate.corrlinks_account?.email,
      inmate.second_corrlinks_account?.email,
      inmate.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

function renderInmateOptions(list, { open = true } = {}) {
  inmateOptions.innerHTML = '';
  optionHighlight = -1;
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'combobox-option';
    li.textContent = accounts.length ? 'No matches' : 'Load inmates first';
    inmateOptions.appendChild(li);
  } else {
    list.forEach((inmate, index) => {
      const li = document.createElement('li');
      li.className = 'combobox-option';
      li.role = 'option';
      li.dataset.id = String(inmate.id);
      li.setAttribute('aria-selected', String(inmate.id) === String(accountSelect.value) ? 'true' : 'false');
      const dot = document.createElement('span');
      dot.className = `option-dot${/active|ok|ready/i.test(String(inmate.status || '')) ? ' is-active' : ''}`;
      const textWrap = document.createElement('span');
      textWrap.className = 'option-text';
      const name = document.createElement('span');
      name.className = 'option-name';
      name.textContent = inmate.name || 'Inmate';
      const meta = document.createElement('span');
      meta.className = 'option-meta truncate';
      const email = inmate.corrlinks_account?.email || 'no email';
      meta.textContent = `${inmate.inmate_id || inmate.id}`;
      meta.title = email;
      textWrap.append(name, meta);
      li.append(dot, textWrap);
      li.addEventListener('mousedown', (event) => {
        event.preventDefault();
        selectInmate(inmate.id, { autoLogin: true });
        closeInmateOptions();
      });
      if (index === 0) optionHighlight = 0;
      inmateOptions.appendChild(li);
    });
  }
  inmateOptions.hidden = !open;
  inmateSearch.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeInmateOptions() {
  inmateOptions.hidden = true;
  inmateSearch.setAttribute('aria-expanded', 'false');
  optionHighlight = -1;
}

function selectInmate(id, { autoLogin = false } = {}) {
  const inmate = accounts.find((a) => String(a.id) === String(id));
  accountSelect.value = inmate ? String(inmate.id) : '';
  selectedFileKeys = [];
  if (inmate) {
    inmateSearch.value = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
  }
  renderAccountMeta(inmate || null);
  const inmateDone = Boolean(inmate);
  setStepState({
    inmateDone,
    composeDone: Boolean(composePreview.to || composePreview.subject),
    // Stay on Inmate until CorrLinks compose succeeds — collapsing here hid files/meta.
    active: 1,
  });
  inmateCard?.classList.remove('collapsed');
  updateActionButtons();
  if (autoLogin && inmate && !loopRunning) {
    // Defer so checkboxes/UI settle, then start CorrLinks automatically.
    queueMicrotask(() => startCorrlinksLogin());
  }
}

function renderAccounts(list) {
  accounts = Array.isArray(list) ? list : [];
  selectedFileKeys = [];
  if (!accounts.length) {
    accountSelect.value = '';
    inmateSearch.value = '';
    renderAccountMeta(null);
    renderInmateOptions([], { open: false });
    updateActionButtons({ canLogin: false });
    return;
  }
  const preferred = selectedInmate() || accounts[0];
  // Prefill first inmate + check all files, but don't auto-login until user picks one.
  selectInmate(preferred.id, { autoLogin: false });
  renderInmateOptions(accounts, { open: false });
  updateActionButtons();
}

/**
 * Single inmate run: CorrLinks login + compose paste. Never sends.
 * @param {{ quietToast?: boolean }} [options]
 * @returns {Promise<object|null>} status or null if skipped/busy
 */
async function startCorrlinksLogin(options = {}) {
  const { quietToast = false } = options;
  const inmate = selectedInmate();
  if (!inmate) {
    log('Select an inmate first', 'error');
    return null;
  }
  if (!inmateHasCorrlinksLogin(inmate)) {
    log('Selected inmate has no primary CorrLinks credentials', 'error');
    return null;
  }
  if (corrlinksLoginBusy) return null;

  syncCorrPaneBounds();
  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  setStatusHint(`CorrLinks: ${inmate.name || inmate.inmate_id || inmate.id}…`);
  setCorrlinksConnected(false, true);
  const checkedCount = selectedFileKeys.length;
  log(
    `Login primary ${maskSensitive(inmate.corrlinks_account.email)}` +
      (inmate.second_corrlinks_account?.email
        ? ` (fallback ${maskSensitive(inmate.second_corrlinks_account.email)} if locked)`
        : '') +
      (checkedCount ? ` · ${checkedCount} exchange file(s) checked` : '') +
      ' · no send',
    'info'
  );
  try {
    const result = await window.api.loginCorrlinks({
      inmateId: inmate.id,
      selectedFiles: selectedFileKeys.slice(),
    });
    handleLoginResult(result.status || {}, { quietToast });
    setStatusHint((result.status && result.status.message) || 'CorrLinks finished (not sent)');
    return result.status || null;
  } catch (error) {
    log(error.message || String(error), 'error');
    if (!quietToast) toast(error.message || String(error), 'error');
    setCorrlinksConnected(false);
    return { state: 'error', message: error.message || String(error) };
  } finally {
    corrlinksLoginBusy = false;
    updateActionButtons();
  }
}

/** Gap only when switching CorrLinks accounts (not between same-account recipients). */
const LOOP_GAP_MS = 10_000;

function buildLoopQueue() {
  return groupInmatesByCorrlinksAccount();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setLoopCountdownOverlay({ seconds, nextLabel, current, total } = {}) {
  if (!loopCountdown) return;
  if (seconds == null) {
    loopCountdownActive = false;
    loopCountdown.hidden = true;
    if (loopCountdownNum) loopCountdownNum.textContent = '';
    if (loopCountdownNext) loopCountdownNext.textContent = '';
    syncCorrPaneBounds();
    return;
  }
  loopCountdownActive = true;
  loopCountdown.hidden = false;
  if (loopCountdownNum) {
    const next = String(Math.max(0, seconds));
    if (loopCountdownNum.textContent !== next) {
      loopCountdownNum.textContent = next;
      loopCountdownNum.classList.remove('is-tick');
      // Retrigger tick animation
      void loopCountdownNum.offsetWidth;
      loopCountdownNum.classList.add('is-tick');
    }
    if (sessionNextRun) sessionNextRun.textContent = `${next}s`;
  }
  if (loopCountdownNext) {
    loopCountdownNext.textContent = nextLabel
      ? `${current}/${total} accounts done · next: ${nextLabel}`
      : '';
  }
  // Collapse embed bounds so this HTML overlay is not covered by WebContentsView.
  syncCorrPaneBounds();
}

/** Wait up to `ms` between CorrLinks accounts. Returns false if aborted. */
async function waitLoopGap(ms, { current, total, nextLabel }) {
  const endsAt = Date.now() + ms;
  let lastShown = -1;
  while (Date.now() < endsAt) {
    if (loopAbort) {
      setLoopCountdownOverlay();
      return false;
    }
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== lastShown) {
      lastShown = left;
      setLoopCountdownOverlay({ seconds: left, nextLabel, current, total });
      const text = `Waiting ${left}s before next CorrLinks account · ${current}/${total} done · next: ${nextLabel}`;
      setLoopProgress(text);
      setStatusHint(text);
    }
    await sleep(Math.min(200, endsAt - Date.now()));
  }
  setLoopCountdownOverlay();
  return !loopAbort;
}

function statusLooksGood(status) {
  return Boolean(
    status &&
      (status.state === 'success' ||
        (status.state === 'locked' && status.loggedIn) ||
        status.recipient?.ok ||
        status.bodyResult?.ok)
  );
}

/**
 * Login a CorrLinks account only (no compose). Used by the grouped loop.
 */
async function startCorrlinksAccountLogin(group, options = {}) {
  const { quietToast = false } = options;
  if (!group?.email || !group?.password) {
    log('CorrLinks account missing credentials', 'error');
    return null;
  }
  if (corrlinksLoginBusy) return null;

  syncCorrPaneBounds();
  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  setStatusHint(`Logging in ${maskSensitive(group.email)}…`);
  setCorrlinksConnected(false, true);
  log(
    `Account login ${maskSensitive(group.email)}` +
      (group.secondEmail ? ` (fallback ${maskSensitive(group.secondEmail)} if locked)` : '') +
      ' · no compose yet',
    'info'
  );
  try {
    const result = await window.api.loginCorrlinksAccount({
      email: group.email,
      password: group.password,
      secondEmail: group.secondEmail,
      secondPassword: group.secondPassword,
    });
    const status = result.status || {};
    const viaSecond = Boolean(status.usedSecondAccount);
    const viaLabel = viaSecond ? 'second' : status.attempt || 'primary';
    if (status.state === 'success' || (status.state === 'locked' && status.loggedIn)) {
      setCorrlinksConnected(true);
      if (viaSecond) {
        log(
          `Primary locked — using second ${maskSensitive(status.email || group.secondEmail)}` +
            (status.primaryError ? ` (${status.primaryError})` : ''),
          'warn'
        );
      }
      if (!quietToast) {
        toast(
          viaSecond
            ? `Logged in via second · ${maskSensitive(status.email || group.secondEmail)}`
            : `Logged in ${maskSensitive(group.email)}`,
          viaSecond ? 'warn' : 'success'
        );
      }
      log(
        status.message || `Logged in via ${viaLabel}: ${maskSensitive(status.email || group.email)}`,
        viaSecond ? 'warn' : 'success'
      );
    } else if (status.state === 'manual') {
      setCorrlinksConnected(false, true);
      log(`Manual action needed: ${status.message}`, 'warn');
    } else if (status.state === 'locked' && !status.loggedIn) {
      setCorrlinksConnected(false, true);
      log(
        `Primary locked` +
          (group.secondEmail ? ' and second login failed' : ' (no second account)') +
          `: ${status.message || 'locked'}`,
        'error'
      );
      if (!quietToast) toast(status.message || 'Account locked', 'error');
    } else {
      setCorrlinksConnected(false);
      log(status.message || 'Account login failed', 'error');
      if (!quietToast) toast(status.message || 'Account login failed', 'error');
    }
    setStatusHint(status.message || 'Account login finished');
    return status;
  } catch (error) {
    log(error.message || String(error), 'error');
    if (!quietToast) toast(error.message || String(error), 'error');
    setCorrlinksConnected(false);
    return { state: 'error', message: error.message || String(error) };
  } finally {
    corrlinksLoginBusy = false;
    updateActionButtons();
  }
}

/**
 * Compose one recipient on the current CorrLinks session (no login).
 */
async function startCorrlinksCompose(inmate, options = {}) {
  const { quietToast = false } = options;
  if (!inmate) return null;
  if (corrlinksLoginBusy) return null;

  syncCorrPaneBounds();
  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  const label = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
  setStatusHint(`Compose: ${label}…`);
  log(`Compose recipient ${label} · no send`, 'info');
  try {
    const result = await window.api.composeCorrlinksInmate({ inmateId: inmate.id });
    handleLoginResult(result.status || {}, { quietToast });
    setStatusHint((result.status && result.status.message) || 'Compose finished (not sent)');
    return result.status || null;
  } catch (error) {
    log(error.message || String(error), 'error');
    if (!quietToast) toast(error.message || String(error), 'error');
    return { state: 'error', message: error.message || String(error) };
  } finally {
    corrlinksLoginBusy = false;
    updateActionButtons();
  }
}

function logAccountProbeSummary(accountSummaries) {
  for (const row of accountSummaries) {
    if (row.via === 'second') {
      log(
        `Probe · ${maskSensitive(row.primary)} locked → second ${maskSensitive(row.sessionEmail)}` +
          ` · ${row.recipients} recipient(s)` +
          (row.primaryError ? ` · ${row.primaryError}` : ''),
        'warn',
        row
      );
    } else if (row.via === 'failed') {
      log(
        `Probe · ${maskSensitive(row.primary)} login failed · ${row.recipients} recipient(s) will be skipped`,
        'error',
        row
      );
    } else {
      log(
        `Probe · ${maskSensitive(row.primary)} OK via primary · ${row.recipients} recipient(s)`,
        'info',
        row
      );
    }
  }
}

async function logoutCorrlinksQuiet() {
  try {
    if (window.api?.logoutCorrlinks) await window.api.logoutCorrlinks();
  } catch (_) {
    /* ignore */
  }
  setCorrlinksConnected(false);
}

async function startInmateLoop() {
  if (loopRunning || corrlinksLoginBusy) return;
  const groups = buildLoopQueue();
  if (!groups.length) {
    toast('No CorrLinks accounts with credentials', 'error');
    return;
  }

  loopRunning = true;
  loopAbort = false;
  updateActionButtons();
  const accountTotal = groups.length;
  const recipientTotal = groups.reduce((n, g) => n + g.inmates.length, 0);
  let okCount = 0;
  let failCount = 0;
  /** @type {Array<{ group: any, primary: string, via: 'primary'|'second'|'failed', sessionEmail: string|null, sessionPassword: string|null, recipients: number, primaryError?: string }>} */
  const accountSummaries = [];

  log(
    `Loop start — Phase 1: probe ${accountTotal} CorrLinks account(s) for lock · then compose ${recipientTotal} recipient(s)`,
    'info'
  );
  toast(`Probing ${accountTotal} CorrLinks account(s) first…`, 'info');

  // ── Phase 1: test every CorrLinks account (no compose yet) ──────────────
  for (let g = 0; g < groups.length; g += 1) {
    if (loopAbort) {
      log(`Probe stopped after account ${g}/${accountTotal}`, 'warn');
      break;
    }
    const group = groups[g];
    const accountLabel = maskSensitive(group.email);
    setLoopProgress(`Probe ${g + 1}/${accountTotal} · ${accountLabel} · testing login…`);
    log(`—— Probe ${g + 1}/${accountTotal}: ${accountLabel} (${group.inmates.length} recipient(s)) ——`, 'info');

    const loginStatus = await startCorrlinksAccountLogin(group, { quietToast: true });
    const loginOk =
      loginStatus &&
      (loginStatus.state === 'success' || (loginStatus.state === 'locked' && loginStatus.loggedIn));
    const viaSecond = Boolean(loginStatus?.usedSecondAccount);
    const via = !loginOk ? 'failed' : viaSecond ? 'second' : 'primary';
    const sessionEmail = loginOk
      ? loginStatus.email || (viaSecond ? group.secondEmail : group.email)
      : null;
    const sessionPassword = loginOk
      ? viaSecond
        ? group.secondPassword
        : group.password
      : null;

    accountSummaries.push({
      group,
      primary: group.email,
      via,
      sessionEmail,
      sessionPassword,
      recipients: group.inmates.length,
      primaryError: loginStatus?.primaryError || undefined,
    });

    // Logout so the next probe starts clean (no leftover session / To chips).
    await logoutCorrlinksQuiet();

    if (g < groups.length - 1 && !loopAbort) {
      const nextLabel = maskSensitive(groups[g + 1].email);
      log(`Waiting ${LOOP_GAP_MS / 1000}s before next account probe…`, 'info');
      const continued = await waitLoopGap(LOOP_GAP_MS, {
        current: g + 1,
        total: accountTotal,
        nextLabel,
      });
      if (!continued) {
        log(`Probe stopped during wait after ${g + 1}/${accountTotal}`, 'warn');
        break;
      }
    }
  }

  const viaPrimary = accountSummaries.filter((a) => a.via === 'primary').length;
  const viaSecondCount = accountSummaries.filter((a) => a.via === 'second').length;
  const viaFailed = accountSummaries.filter((a) => a.via === 'failed').length;
  const accountBits = [
    viaPrimary ? `${viaPrimary} primary` : null,
    viaSecondCount ? `${viaSecondCount} via second` : null,
    viaFailed ? `${viaFailed} locked/failed` : null,
  ].filter(Boolean);
  const probeSummary = `Account probe done · ${accountBits.join(', ') || 'none'}`;
  setLoopProgress(probeSummary);
  setStatusHint(probeSummary);
  log(probeSummary, viaFailed || viaSecondCount ? 'warn' : 'success');
  toast(probeSummary, viaFailed || viaSecondCount ? 'warn' : 'success');
  logAccountProbeSummary(accountSummaries);

  const readyAccounts = accountSummaries.filter((a) => a.via === 'primary' || a.via === 'second');
  if (loopAbort) {
    loopRunning = false;
    loopAbort = false;
    setLoopCountdownOverlay();
    updateActionButtons();
    const stopped = `Loop stopped after probe · ${readyAccounts.length}/${accountTotal} accounts ready (not composed)`;
    setLoopProgress(stopped);
    setStatusHint(stopped);
    log(stopped, 'warn');
    toast(stopped, 'warn');
    return;
  }

  if (!readyAccounts.length) {
    loopRunning = false;
    loopAbort = false;
    setLoopCountdownOverlay();
    updateActionButtons();
    const none = 'No usable CorrLinks accounts after probe — skipped all recipients';
    setLoopProgress(none);
    setStatusHint(none);
    log(none, 'error');
    toast(none, 'error');
    failCount = recipientTotal;
    return;
  }

  // ── Phase 2: compose recipients only on accounts that passed the probe ──
  log(
    `Phase 2 — composing recipients on ${readyAccounts.length} ready account(s) (To cleared each time, no send)`,
    'info'
  );
  toast(`Composing on ${readyAccounts.length} account(s)…`, 'info');

  for (let i = 0; i < readyAccounts.length; i += 1) {
    if (loopAbort) {
      log(`Compose stopped after account ${i}/${readyAccounts.length}`, 'warn');
      break;
    }
    const row = readyAccounts[i];
    const group = row.group;
    const viaSecond = row.via === 'second';
    const working = {
      email: row.sessionEmail,
      password: row.sessionPassword,
      secondEmail: null,
      secondPassword: null,
    };
    const accountLabel = maskSensitive(row.sessionEmail || group.email);
    setLoopProgress(
      `Compose account ${i + 1}/${readyAccounts.length} · ${accountLabel}` +
        (viaSecond ? ' (2nd)' : '') +
        ' · logging in…'
    );
    log(
      `—— Compose account ${i + 1}/${readyAccounts.length}: ${accountLabel}` +
        (viaSecond ? ' via second' : ' via primary') +
        ` · ${group.inmates.length} recipient(s) ——`,
      viaSecond ? 'warn' : 'info'
    );

    const loginStatus = await startCorrlinksAccountLogin(working, { quietToast: true });
    const loginOk =
      loginStatus &&
      (loginStatus.state === 'success' || (loginStatus.state === 'locked' && loginStatus.loggedIn));
    if (!loginOk) {
      failCount += group.inmates.length;
      log(`Skipping recipients — re-login failed for ${accountLabel}`, 'error');
    } else {
      for (let r = 0; r < group.inmates.length; r += 1) {
        if (loopAbort) {
          log(`Compose stopped during ${accountLabel} after ${r}/${group.inmates.length}`, 'warn');
          break;
        }
        const inmate = group.inmates[r];
        const recipLabel = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
        setLoopProgress(
          `Account ${i + 1}/${readyAccounts.length}` +
            (viaSecond ? ' · 2nd' : '') +
            ` · Recipient ${r + 1}/${group.inmates.length} · ${recipLabel}`
        );
        log(`—— Recipient ${r + 1}/${group.inmates.length}: ${recipLabel} ——`, 'info');
        selectInmate(inmate.id, { autoLogin: false });
        const status = await startCorrlinksCompose(inmate, { quietToast: true });
        if (statusLooksGood(status)) okCount += 1;
        else failCount += 1;
      }
    }

    await logoutCorrlinksQuiet();

    if (i < readyAccounts.length - 1 && !loopAbort) {
      const next = readyAccounts[i + 1];
      const nextLabel = maskSensitive(next.sessionEmail || next.primary);
      log(`Waiting ${LOOP_GAP_MS / 1000}s before next compose account…`, 'info');
      const continued = await waitLoopGap(LOOP_GAP_MS, {
        current: i + 1,
        total: readyAccounts.length,
        nextLabel,
      });
      if (!continued) {
        log(`Compose stopped during wait after ${i + 1}/${readyAccounts.length}`, 'warn');
        break;
      }
    }
  }

  const wasAborted = loopAbort;
  loopRunning = false;
  loopAbort = false;
  setLoopCountdownOverlay();
  updateActionButtons();

  const accountSummaryText = accountBits.length ? ` · Accounts: ${accountBits.join(', ')}` : '';
  const summary = wasAborted
    ? `Loop stopped · ${okCount} ok · ${failCount} failed · ${recipientTotal} recipients${accountSummaryText} (not sent)`
    : `Loop done · ${okCount} ok · ${failCount} failed · ${recipientTotal} recipients${accountSummaryText} (not sent)`;
  setLoopProgress(summary);
  setStatusHint(summary);
  log(summary, failCount || wasAborted || viaSecondCount ? 'warn' : 'success');
  toast(summary, failCount || wasAborted || viaSecondCount ? 'warn' : 'success');
}

function stopInmateLoop() {
  if (!loopRunning) return;
  loopAbort = true;
  setLoopCountdownOverlay();
  setLoopProgress('Stopping…');
  setStatusHint('Stopping loop…');
  log('Stop requested — aborting after current step', 'warn');
  btnStopLoop.disabled = true;
}

function setLoginError(message, { info = false } = {}) {
  if (!loginError) return;
  if (!message) {
    loginError.hidden = true;
    loginError.textContent = '';
    loginError.classList.remove('is-info');
    sdEmail?.classList.remove('is-invalid');
    sdPassword?.classList.remove('is-invalid');
    return;
  }
  loginError.hidden = false;
  loginError.textContent = message;
  loginError.classList.toggle('is-info', Boolean(info));
}

function validateSportsDataForm() {
  const email = sdEmail.value.trim();
  const password = sdPassword.value;
  sdEmail.classList.remove('is-invalid');
  sdPassword.classList.remove('is-invalid');

  if (!email && !password) {
    sdEmail.classList.add('is-invalid');
    sdPassword.classList.add('is-invalid');
    throw new Error('Enter SportsData email and password');
  }
  if (!email) {
    sdEmail.classList.add('is-invalid');
    sdEmail.focus();
    throw new Error('Email is required');
  }
  // Practical email check (HTML5 type=email alone is not enough for empty/partial cases).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sdEmail.classList.add('is-invalid');
    sdEmail.focus();
    throw new Error('Enter a valid email address');
  }
  if (!password) {
    sdPassword.classList.add('is-invalid');
    sdPassword.focus();
    throw new Error('Password is required');
  }
  if (password.length < 4) {
    sdPassword.classList.add('is-invalid');
    sdPassword.focus();
    throw new Error('Password looks too short');
  }
  return { email, password };
}

async function ensureCredentialsSaved() {
  const { email, password } = validateSportsDataForm();
  const baseUrl = sdBaseUrl.value.trim() || 'https://sportsdata.com';
  const result = await window.api.saveSportsDataLogin({
    email,
    password,
    baseUrl,
    remember: sdRemember.checked,
  });
  if (!result.ok) throw new Error(result.message || 'Failed to save login');
  return result;
}

/** Save credentials then verify against SportsData before opening the main UI. */
async function signInAndVerifySportsData() {
  setLoginError('');
  const saved = await ensureCredentialsSaved();
  const verified = await window.api.verifySportsDataLogin();
  if (!verified?.ok) {
    sdPassword.classList.add('is-invalid');
    throw new Error(verified?.message || 'SportsData login failed — check email/password');
  }
  return { saved, verified };
}

async function refreshInmates() {
  if (!btnRefresh) return;
  btnRefresh.disabled = true;
  btnRefresh.classList.add('loading');
  setStatusHint('Refreshing inmates…');
  log('Refreshing inmate accounts from SportsData…', 'info');
  try {
    const result = await window.api.refreshAccounts();
    if (!result.ok) {
      setSportsConnected(false);
      log(result.message || 'Refresh failed', 'error');
      toast(result.message || 'Refresh failed', 'error');
      return;
    }
    setSportsConnected(true);
    renderAccounts(result.accounts);
    log(`Loaded ${result.accounts.length} inmate(s)`, 'success');
    if (inmateCount) inmateCount.textContent = `${result.accounts.length} inmate${result.accounts.length === 1 ? '' : 's'}`;
    toast(`Loaded ${result.accounts.length} inmates`, 'success');
    setStatusHint(`${result.accounts.length} inmates ready`);
    setStepState({
      inmateDone: Boolean(selectedInmate()),
      composeDone: Boolean(composePreview.to || composePreview.subject),
      active: 1,
    });
    inmateCard?.classList.remove('collapsed');
  } catch (error) {
    setSportsConnected(false);
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
    setStatusHint('SportsData login needed');
  } finally {
    btnRefresh.disabled = false;
    btnRefresh.classList.remove('loading');
  }
}

function handleLoginResult(status, { quietToast = false } = {}) {
  if (status.state === 'success') {
    const via = status.usedSecondAccount ? 'second' : status.attempt || 'primary';
    log(`Login success via ${via}: ${maskSensitive(status.email)} — ${status.message}`, 'success');
    setCorrlinksConnected(true);
    activeCorrEmail = status.email || activeCorrEmail;
    lastLoginAt = stamp();
    updateSessionPanel();
    if (!quietToast) toast('CorrLinks login success', 'success');
  } else if (status.state === 'manual') {
    log(`Manual action needed (${status.attempt || 'n/a'}): ${status.message}`, 'warn');
    setCorrlinksConnected(false, true);
  } else if (status.state === 'locked') {
    log(`Locked: ${status.message}`, status.loggedIn ? 'warn' : 'error');
    setCorrlinksConnected(Boolean(status.loggedIn), true);
  } else {
    log(`${status.state || 'error'}: ${status.message || 'Login failed'}`, 'error');
    setCorrlinksConnected(false);
  }

  if (status.recipient?.ok) {
    const selected = formatRecipient(status.recipient.selected);
    log(`To selected: ${selected}`, 'success', status.recipient.selected);
    updateComposePreview({ to: selected });
  } else if (status.recipient) {
    log(`To select failed: ${status.recipient.reason || 'unknown'}`, 'error', status.recipient);
  }

  if (status.subjectResult?.ok || status.subject) {
    if (status.subjectResult?.ok) log(`Subject: ${status.subject}`, 'success');
    else log(`Subject failed: ${status.subject}`, 'error');
    updateComposePreview({ subject: status.subject || '' });
  }

  if (status.bodyResult?.ok) {
    const chars = status.pastedPart?.characters || 0;
    const filename = status.pastedPart?.filename || 'body';
    log(
      `Pasted body part ${status.pastedPart?.part || '?'}: ${filename} (${chars.toLocaleString()} chars) — not sent`,
      'success'
    );
    updateComposePreview({
      body: `${filename} pasted (not sent)`,
      chars,
    });
  } else if (status.bodyResult?.skipped) {
    log(status.bodyResult.reason || 'No body to paste', 'warn');
  } else if (status.bodyResult) {
    log(`Body paste failed: ${status.bodyResult.reason || 'unknown'}`, 'error', status.bodyResult);
  }

  if (status.pendingParts?.length) {
    log(`Pending parts: ${status.pendingParts.map((p) => p.filename).join(', ')}`, 'info');
  }
  if (status.exchangeSkipped?.length) {
    log(`Skipped empty: ${status.exchangeSkipped.map((f) => f.filename).join(', ')}`, 'warn');
  }

  const composeReady = Boolean(status.recipient?.ok || status.subject || status.bodyResult?.ok);
  const loginOk = status.state === 'success' || (status.state === 'locked' && status.loggedIn);
  setStepState({
    inmateDone: Boolean(selectedInmate()),
    composeDone: composeReady,
    // Keep Inmate expanded unless compose actually progressed.
    active: composeReady || loginOk ? 2 : 1,
  });
  if (composeReady || loginOk) {
    composeCard?.classList.remove('collapsed');
  } else {
    inmateCard?.classList.remove('collapsed');
  }
}

function resetWorkspaceState() {
  accounts = [];
  selectedFileKeys = [];
  composePreview = { to: '', subject: '', body: '', chars: 0, parts: 0 };
  updateComposePreview({});
  accountSelect.value = '';
  inmateSearch.value = '';
  inmateSearch.disabled = true;
  renderAccountMeta(null);
  renderInmateOptions([], { open: false });
  setSportsConnected(false);
  setCorrlinksConnected(false);
  setStepState({ inmateDone: false, composeDone: false, active: 1 });
  setStatusHint('Sign in with SportsData');
  historyLoaded = false;
  destroyHistoryTable();
  setHistoryPreview();
  setMainTab('automate');
}

function usesMacDmgUpdate(status = updateStatus) {
  return status?.installMode === 'dmg';
}

function updateInstallLabel(status = updateStatus) {
  if (usesMacDmgUpdate(status)) return 'Open installer';
  return 'Restart to update';
}

function renderUpdateUi(status = updateStatus) {
  updateStatus = status || updateStatus;
  const state = String(updateStatus.state || 'idle');
  const version = updateStatus.currentVersion || '';
  const macDmg = usesMacDmgUpdate(updateStatus);
  const action =
    state === 'available'
      ? 'download'
      : state === 'downloaded'
        ? 'install'
        : state === 'downloading' || state === 'checking'
          ? 'busy'
          : 'check';

  let chipText = version ? `v${version} · Up to date` : 'v…';
  if (state === 'available') chipText = `v${version} · Update available`;
  else if (state === 'downloading') {
    chipText =
      updateStatus.percent != null ? `v${version} · ${updateStatus.percent}%` : `v${version} · Updating…`;
  } else if (state === 'downloaded') {
    chipText = `v${version} · ${macDmg ? 'Open installer' : 'Restart to update'}`;
  } else if (state === 'checking') chipText = `v${version} · Checking…`;
  else if (state === 'error') chipText = `v${version} · Update failed`;
  else if (state === 'dev') chipText = `v${version} · Dev build`;

  if (updateChipLabel) updateChipLabel.textContent = chipText;
  if (updateChip) {
    updateChip.dataset.updateAction = action === 'busy' ? 'check' : action;
    updateChip.classList.toggle('is-available', state === 'available');
    updateChip.classList.toggle('is-downloading', state === 'downloading');
    updateChip.classList.toggle('is-downloaded', state === 'downloaded');
    updateChip.title = updateStatus.error || updateStatus.message || 'Check for updates';
    updateChip.disabled = updateBusy || action === 'busy';
  }

  if (aboutVersion) aboutVersion.textContent = version ? `v${version}` : 'v…';
  if (updatesCurrent) updatesCurrent.textContent = version ? `v${version}` : 'v…';
  if (updatesMessage) {
    updatesMessage.textContent =
      updateStatus.message ||
      (state === 'dev' ? 'Updates are available in packaged builds only.' : 'Ready to check for updates.');
  }
  if (updatesProgressWrap) {
    updatesProgressWrap.hidden = state !== 'downloading' || macDmg;
  }
  if (updatesProgressBar) {
    updatesProgressBar.style.width = `${updateStatus.percent || 0}%`;
  }
  if (btnUpdate) {
    btnUpdate.disabled = updateBusy || action === 'busy';
    btnUpdate.dataset.updateAction = action === 'busy' ? 'check' : action;
    if (state === 'available') btnUpdate.textContent = macDmg ? 'Get update' : 'Download update';
    else if (state === 'downloading') btnUpdate.textContent = macDmg ? 'Opening installer…' : 'Downloading…';
    else if (state === 'downloaded') btnUpdate.textContent = updateInstallLabel(updateStatus);
    else if (state === 'checking') btnUpdate.textContent = 'Checking…';
    else btnUpdate.textContent = 'Check for updates';
  }
  if (btnCheckUpdatesMenu) {
    btnCheckUpdatesMenu.dataset.updateAction = action === 'busy' ? 'check' : action;
    btnCheckUpdatesMenu.textContent =
      state === 'available'
        ? macDmg
          ? 'Get update'
          : 'Download update'
        : state === 'downloaded'
          ? updateInstallLabel(updateStatus)
          : 'Check for updates';
  }
}

function maybeToastUpdate(status) {
  const state = String(status?.state || '');
  const key = `${state}:${status?.latestVersion || ''}:${status?.error || ''}`;
  if (!state || key === lastUpdateToastKey) return;
  if (state === 'available') {
    lastUpdateToastKey = key;
    toast(`Update available: v${status.latestVersion}`, 'warn');
    log(status.message || `Update available: v${status.latestVersion}`, 'warn');
  } else if (state === 'downloaded') {
    lastUpdateToastKey = key;
    toast(
      usesMacDmgUpdate(status)
        ? status.message || 'Installer ready — open the DMG to finish'
        : 'Update ready — restart to install',
      'success'
    );
    log(status.message || 'Update downloaded', 'success');
  } else if (state === 'error' && status?.error) {
    lastUpdateToastKey = key;
    toast(status.error, 'error');
    log(`Update error: ${status.error}`, 'error');
  } else if (state === 'not-available') {
    lastUpdateToastKey = key;
  }
}

async function runUpdateAction(preferredAction) {
  if (updateBusy) return;
  const action =
    preferredAction ||
    btnUpdate?.dataset?.updateAction ||
    (updateStatus.state === 'available'
      ? 'download'
      : updateStatus.state === 'downloaded'
        ? 'install'
        : 'check');

  updateBusy = true;
  renderUpdateUi(updateStatus);
  try {
    if (action === 'download') {
      toast('Downloading update…', 'info');
      const result = await window.api.downloadUpdate();
      renderUpdateUi(result);
      maybeToastUpdate(result);
      if (!result?.ok && result?.error) toast(result.error, 'error');
      return;
    }
    if (action === 'install') {
      toast(
        usesMacDmgUpdate(updateStatus)
          ? 'Opening macOS installer…'
          : 'Installing update — app will relaunch…',
        'info'
      );
      const result = await window.api.installUpdate();
      if (result) renderUpdateUi(result);
      return;
    }
    const result = await window.api.checkForUpdates();
    renderUpdateUi(result);
    maybeToastUpdate(result);
    if (result?.state === 'not-available' || result?.state === 'dev') {
      toast(result.message || `Up to date (v${result.currentVersion || ''})`, 'info');
    } else if (!result?.ok && result?.error) {
      toast(result.error, 'error');
    }
  } catch (error) {
    toast(error.message || String(error), 'error');
    log(error.message || String(error), 'error');
  } finally {
    updateBusy = false;
    renderUpdateUi(updateStatus);
  }
}

function openModalDialog(dialog) {
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  hideCorrEmbedNow();
  if (!dialog.open) dialog.showModal();
  scheduleCorrPaneBounds();
  return true;
}

function openUpdatesDialog() {
  if (!updatesDialog) {
    runUpdateAction(updateChip?.dataset?.updateAction || 'check');
    return;
  }
  renderUpdateUi(updateStatus);
  openModalDialog(updatesDialog);
}

function wireAppUpdates() {
  if (typeof window.api?.onUpdateStatus === 'function') {
    window.api.onUpdateStatus((status) => {
      renderUpdateUi(status);
      maybeToastUpdate(status);
      if (status?.message && status.state !== 'idle') {
        setStatusHint(status.message);
      }
    });
  }
  window.api
    ?.getUpdateStatus?.()
    .then((status) => renderUpdateUi(status))
    .catch(() => {});

  btnUpdate?.addEventListener('click', (event) => {
    event.preventDefault();
    runUpdateAction(btnUpdate.dataset.updateAction || 'check');
  });
  updateChip?.addEventListener('click', () => openUpdatesDialog());
  btnCheckUpdatesMenu?.addEventListener('click', () => {
    setAccountMenuOpen(false);
    openUpdatesDialog();
  });
  btnUpdatesClose?.addEventListener('click', () => updatesDialog?.close());
  [updatesDialog, aboutDialog, shortcutsDialog, confirmSend].forEach((dialog) => {
    dialog?.addEventListener('close', () => {
      scheduleCorrPaneBounds();
      setTimeout(syncCorrPaneBounds, 50);
    });
  });
}

async function init() {
  resetWorkspaceState();
  showLoginScreen();
  setLoginError('');
  wireAppUpdates();
  setLoginShortcutHint();

  try {
    const summary = await window.api.getConfigSummary();
    fillLoginForm(summary);
    setConfigSummary(summary);
    if (summary.email && summary.hasPassword) {
      if (summary.credentialsPath) {
        log(`Remembered SportsData login (${maskSensitive(summary.email)}) — verifying…`, 'info');
      } else if (summary.envPath) {
        log(`Loaded SportsData credentials from .env — verifying…`, 'info');
      }
      setLoginError('Verifying SportsData login…', { info: true });
      const verified = await window.api.verifySportsDataLogin();
      if (!verified?.ok) {
        setLoginError(verified?.message || 'Saved login failed — sign in again');
        log(verified?.message || 'Remembered SportsData login invalid', 'error');
        sdPassword.focus();
        return;
      }
      setLoginError('');
      showMainApp(summary.email);
      log('Control UI ready', 'info');
      await refreshInmates();
    } else {
      setStatusHint('Sign in with SportsData');
      log('Sign in with SportsData email and password to continue', 'warn');
      sdEmail.focus();
    }
  } catch (error) {
    if (configSummary) {
      configSummary.hidden = true;
      configSummary.textContent = '';
    }
    setLoginError(error.message || String(error));
    log(error.message || String(error), 'error');
  }
}


sportsdataForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  btnSaveLogin.disabled = true;
  btnSaveLogin.classList.add('loading');
  btnSaveLogin.textContent = 'Signing in…';
  setLoginError('');
  showLoginScreen();
  try {
    const { saved, verified } = await signInAndVerifySportsData();
    const summary = await window.api.getConfigSummary();
    fillLoginForm(summary);
    setConfigSummary(summary);
    log(`Signed in as ${maskSensitive(verified.email || saved.email)}`, 'success');
    toast('Signed in to SportsData', 'success');
    showMainApp(verified.email || saved.email || summary.email);
    await refreshInmates();
  } catch (error) {
    const message = error.message || String(error);
    setLoginError(message);
    log(message, 'error');
    toast(message, 'error');
    showLoginScreen();
  } finally {
    btnSaveLogin.disabled = false;
    btnSaveLogin.classList.remove('loading');
    btnSaveLogin.textContent = 'Sign in';
  }
});

sdEmail?.addEventListener('input', () => {
  sdEmail.classList.remove('is-invalid');
  if (loginError && !loginError.hidden) setLoginError('');
});
sdPassword?.addEventListener('input', () => {
  sdPassword.classList.remove('is-invalid');
  if (loginError && !loginError.hidden) setLoginError('');
});

btnRefresh.addEventListener('click', () => {
  if (activeMainTab === 'history') loadExchangeHistory();
  else refreshInmates();
});

mainTabs?.addEventListener('click', (event) => {
  const btn = event.target.closest('.main-tab');
  if (!btn?.dataset?.tab) return;
  setMainTab(btn.dataset.tab);
});

btnHistoryRefresh?.addEventListener('click', () => loadExchangeHistory());

document.getElementById('historyTable')?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-url]');
  if (!btn) return;
  const url = decodeURIComponent(btn.dataset.url || '');
  const date = decodeURIComponent(btn.dataset.date || '');
  const filename = decodeURIComponent(btn.dataset.filename || 'all.txt');
  if (btn.classList.contains('hist-preview')) {
    document.querySelectorAll('#historyTable tbody tr').forEach((tr) => tr.classList.remove('is-active-row'));
    btn.closest('tr')?.classList.add('is-active-row');
    previewHistoryRow({ url, date, filename });
  } else if (btn.classList.contains('hist-download')) {
    downloadHistoryRow({ url, date, filename });
  }
});

btnHistoryCopy?.addEventListener('click', async () => {
  if (!historyPreviewState.text) return;
  await copyText(historyPreviewState.text);
});

btnHistoryDownloadPreview?.addEventListener('click', () => {
  if (!historyPreviewState.url) return;
  downloadHistoryRow({
    url: historyPreviewState.url,
    date: historyPreviewState.date,
    filename: historyPreviewState.filename,
  });
});

btnLogout.addEventListener('click', async () => {
  btnLogout.disabled = true;
  try {
    const result = await window.api.logoutSportsData();
    if (!result?.ok) throw new Error(result?.message || 'Sign out failed');
    sdPassword.value = '';
    fillLoginForm({
      baseUrl: result.baseUrl || sdBaseUrl.value,
      email: '',
      password: '',
    });
    setConfigSummary({
      baseUrl: result.baseUrl || sdBaseUrl.value || 'https://sportsdata.com',
      timezone: 'America/New_York',
      subjectToday: '',
    });
    resetWorkspaceState();
    updateSignedInChip('');
    showLoginScreen();
    log('Signed out of SportsData', 'info');
    toast('Signed out', 'info');
    syncCorrPaneBounds();
    sdEmail.focus();
  } catch (error) {
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
  } finally {
    btnLogout.disabled = false;
  }
});

function inmateSearchQuery() {
  const selected = selectedInmate();
  const display = selected
    ? `${selected.name || 'Inmate'} (${selected.inmate_id || selected.id})`
    : '';
  const value = inmateSearch.value.trim();
  // Selected label is not a real filter query — show the full list instead.
  if (!value || value === display) return '';
  return value;
}

inmateSearch.addEventListener('focus', () => {
  if (!accounts.length) return;
  renderInmateOptions(filterAccounts(inmateSearchQuery()), { open: true });
});
inmateSearch.addEventListener('input', () => {
  renderInmateOptions(filterAccounts(inmateSearchQuery()), { open: true });
});
inmateSearch.addEventListener('keydown', (event) => {
  const options = [...inmateOptions.querySelectorAll('.combobox-option[data-id]')];
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (inmateOptions.hidden) renderInmateOptions(filterAccounts(inmateSearch.value), { open: true });
    optionHighlight = Math.min(options.length - 1, optionHighlight + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    optionHighlight = Math.max(0, optionHighlight - 1);
  } else if (event.key === 'Enter') {
    const current = options[optionHighlight] || options[0];
    if (current) {
      event.preventDefault();
      selectInmate(current.dataset.id, { autoLogin: true });
      closeInmateOptions();
    }
  } else if (event.key === 'Escape') {
    closeInmateOptions();
  }
  [...inmateOptions.querySelectorAll('.combobox-option[data-id]')].forEach((el, index) => {
    el.setAttribute('aria-selected', index === optionHighlight ? 'true' : 'false');
    if (index === optionHighlight) el.scrollIntoView({ block: 'nearest' });
  });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('#inmateCombobox')) closeInmateOptions();
});

btnLogin.addEventListener('click', () => {
  if (loopRunning) return;
  startCorrlinksLogin();
});

btnStartLoop.addEventListener('click', () => {
  startInmateLoop();
});

btnStopLoop.addEventListener('click', () => {
  stopInmateLoop();
});

btnStatus.addEventListener('click', async () => {
  try {
    const status = await window.api.getCorrlinksStatus();
    const loggedIn = /success|logged|compose|mailbox/i.test(`${status.state} ${status.message} ${status.url || ''}`);
    setCorrlinksConnected(loggedIn, status.state === 'manual' || status.state === 'locked');
    log(
      `Status: ${status.state} — ${status.message}` +
        (status.attempt ? ` [${status.attempt}]` : '') +
        (status.url ? ` @ ${status.url}` : ''),
      loggedIn ? 'success' : 'info'
    );
  } catch (error) {
    log(error.message || String(error), 'error');
  }
});

btnSend?.addEventListener('click', () => {
  if (!composePreview.to || !composePreview.subject) {
    toast('Compose a message first', 'error');
    return;
  }
  openModalDialog(confirmSend);
});

confirmSend?.addEventListener('close', () => {
  if (confirmSend.returnValue === 'confirm') {
    toast('Send is not implemented yet', 'warn');
    log('Send blocked — feature not enabled yet', 'warn');
  }
});

function isLogDrawerOpen() {
  return Boolean(logDrawer && !logDrawer.hidden);
}

function setLogDrawerOpen(open) {
  if (!logDrawer) return;
  if (open) hideCorrEmbedNow();
  logDrawer.hidden = !open;
  if (logBackdrop) logBackdrop.hidden = !open;
  if (btnOpenLog) btnOpenLog.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('log-open', open);
  if (open) {
    logErrorUnread = 0;
    refreshLogBadge();
    if (logAutoScroll?.checked) {
      requestAnimationFrame(() => {
        logEl.scrollTop = logEl.scrollHeight;
      });
    }
  } else {
    refreshLogBadge();
  }
  scheduleCorrPaneBounds();
}

function toggleLogDrawer() {
  setLogDrawerOpen(!isLogDrawerOpen());
}

logFilter.addEventListener('change', applyLogFilter);
logMask.addEventListener('change', () => toast(logMask.checked ? 'Email masking on' : 'Email masking off', 'info'));
btnClearLog.addEventListener('click', () => {
  logEl.innerHTML = '';
  toast('Log cleared', 'info');
});
btnCopyLog.addEventListener('click', async () => {
  const text = [...logEl.querySelectorAll('.log-line')]
    .filter((line) => !line.hidden)
    .map((line) => `${line.querySelector('.log-time')?.textContent || ''} ${line.querySelector('.log-msg')?.innerText || ''}`)
    .join('\n');
  await copyText(text || '(empty log)');
});

btnOpenLog?.addEventListener('click', () => setLogDrawerOpen(true));
btnCloseLog?.addEventListener('click', () => setLogDrawerOpen(false));
logBackdrop?.addEventListener('click', () => setLogDrawerOpen(false));

document.addEventListener('keydown', (event) => {
  const meta = event.metaKey || event.ctrlKey;
  const tag = String(event.target?.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || event.target?.isContentEditable;

  if (event.key === 'Escape') {
    if (accountDropdown && !accountDropdown.hidden) {
      event.preventDefault();
      setAccountMenuOpen(false);
      return;
    }
    if (isLogDrawerOpen()) {
      event.preventDefault();
      setLogDrawerOpen(false);
      return;
    }
  }
  if (!typing && (event.key === '?' || (event.shiftKey && event.key === '/'))) {
    event.preventDefault();
    openModalDialog(shortcutsDialog);
    return;
  }
  if (meta && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    refreshInmates();
  }
  if (meta && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    if (!loopRunning && !btnLogin.disabled && !corrlinksLoginBusy) startCorrlinksLogin();
  }
  if (meta && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    if (!mainShell?.hidden) toggleLogDrawer();
  }
  if (meta && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    logEl.innerHTML = '';
    logErrorUnread = 0;
    refreshLogBadge();
    if (!isLogDrawerOpen()) setLogDrawerOpen(true);
  }
});

/** Native WebContentsView paints above HTML — hide it under modals/drawers. */
function isCorrEmbedBlocked() {
  if (loopCountdownActive) return true;
  if (activeMainTab !== 'automate') return true;
  if (document.body.classList.contains('log-open')) return true;
  const dialogs = [updatesDialog, aboutDialog, shortcutsDialog, confirmSend];
  if (dialogs.some((dialog) => dialog && dialog.open)) return true;
  return false;
}

function hideCorrEmbedNow() {
  if (!window.api?.setCorrBounds) return;
  window.api.setCorrBounds({ x: 0, y: 0, width: 0, height: 0 });
}

/**
 * Map #corrPane to the Electron WebContentsView.
 * Clip to the visible .app area above the status bar so a scrolled/off-screen
 * pane never paints the embed over the footer or left column.
 */
function syncCorrPaneBounds() {
  const pane = document.getElementById('corrPane');
  if (!pane || !window.api?.setCorrBounds) return;

  if (isCorrEmbedBlocked()) {
    hideCorrEmbedNow();
    return;
  }

  const rect = pane.getBoundingClientRect();
  const app = document.querySelector('.app')?.getBoundingClientRect();
  const footer = document.querySelector('.statusbar')?.getBoundingClientRect();

  const drawer = document.getElementById('logDrawer');
  const drawerOpen = drawer && !drawer.hidden;
  const drawerLeft = drawerOpen ? drawer.getBoundingClientRect().left : null;

  const clipLeft = Math.max(0, app?.left ?? 0);
  const clipTop = Math.max(0, app?.top ?? 0);
  let clipRight = Math.min(window.innerWidth, app?.right ?? window.innerWidth);
  if (drawerLeft != null) clipRight = Math.min(clipRight, drawerLeft);
  const clipBottom = Math.min(
    window.innerHeight,
    footer?.top ?? app?.bottom ?? window.innerHeight
  );

  const left = Math.min(Math.max(rect.left, clipLeft), clipRight);
  const top = Math.min(Math.max(rect.top, clipTop), clipBottom);
  const right = Math.max(left, Math.min(rect.right, clipRight));
  const bottom = Math.max(top, Math.min(rect.bottom, clipBottom));
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);

  const visible = width >= 8 && height >= 8;
  window.api.setCorrBounds({
    x: Math.round(left),
    y: Math.round(top),
    width: visible ? Math.round(width) : 0,
    height: visible ? Math.round(height) : 0,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setMainTab(tab) {
  activeMainTab = tab === 'history' ? 'history' : 'automate';
  document.querySelectorAll('.main-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === activeMainTab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const on = panel.dataset.tabPanel === activeMainTab;
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
  });
  stepIndicator?.classList.toggle('is-hidden', activeMainTab === 'history');
  scheduleCorrPaneBounds();
  if (activeMainTab === 'history' && !historyLoaded) {
    loadExchangeHistory();
  }
}

function setHistoryPreview({ url = null, text = '', date = null, filename = null } = {}) {
  historyPreviewState = { url, text: text || '', date, filename };
  if (historyPreviewMeta) {
    historyPreviewMeta.textContent = url
      ? `${date || '—'} · ${filename || 'all.txt'} · ${(text || '').length.toLocaleString()} chars`
      : 'Select a day to preview all.txt';
    historyPreviewMeta.title = historyPreviewMeta.textContent;
  }
  if (historyPreviewBody) {
    historyPreviewBody.textContent = url ? text || '(empty file)' : 'No file selected.';
  }
  if (btnHistoryCopy) btnHistoryCopy.disabled = !text;
  if (btnHistoryDownloadPreview) btnHistoryDownloadPreview.disabled = !url;
}

function destroyHistoryTable() {
  if (historyDataTable && window.jQuery) {
    try {
      historyDataTable.destroy();
    } catch (_) {
      /* ignore */
    }
  }
  historyDataTable = null;
  const table = document.getElementById('historyTable');
  if (table) {
    const tbody = table.querySelector('tbody');
    if (tbody) tbody.innerHTML = '';
  }
}

function renderHistoryTable(rows) {
  const $ = window.jQuery;
  if (!$?.fn?.DataTable) {
    log('DataTables failed to load — check network/CDN', 'error');
    toast('DataTables unavailable', 'error');
    return;
  }

  const data = Array.isArray(rows) ? rows : [];
  if (historyDataTable) {
    historyDataTable.clear();
    historyDataTable.rows.add(data);
    historyDataTable.draw();
    return;
  }

  historyDataTable = $('#historyTable').DataTable({
    data,
    pageLength: 10,
    lengthMenu: [10, 25, 50],
    order: [[0, 'desc']],
    autoWidth: false,
    columns: [
      { data: 'date', title: 'Date' },
      {
        data: 'filename',
        title: 'File',
        defaultContent: 'all.txt',
        render: (value, _type, row) => escapeHtml(value || row.file || 'all.txt'),
      },
      {
        data: 'characters',
        title: 'Characters',
        render: (value) => (value == null ? '—' : Number(value).toLocaleString()),
      },
      {
        data: null,
        title: 'Status',
        orderable: false,
        render: () => '<span class="history-status-pill"><span class="chip-dot"></span>Ready</span>',
      },
      {
        data: null,
        title: 'Actions',
        orderable: false,
        searchable: false,
        render: (_value, _type, row) => {
          const url = encodeURIComponent(row.url || '');
          const date = encodeURIComponent(row.date || '');
          const filename = encodeURIComponent(row.filename || 'all.txt');
          return `<div class="history-row-actions">
            <button type="button" class="ghost tiny hist-preview" data-url="${url}" data-date="${date}" data-filename="${filename}">Preview</button>
            <button type="button" class="ghost tiny hist-download" data-url="${url}" data-date="${date}" data-filename="${filename}">Download</button>
          </div>`;
        },
      },
    ],
    language: {
      search: 'Search:',
      lengthMenu: 'Show _MENU_',
      info: '_START_–_END_ of _TOTAL_',
      infoEmpty: 'No files',
      zeroRecords: 'No matching exchange files',
    },
  });
}

async function loadExchangeHistory() {
  if (!btnHistoryRefresh) return;
  btnHistoryRefresh.disabled = true;
  btnHistoryRefresh.classList.add('loading');
  if (historyHint) historyHint.textContent = 'Loading from /inmate-exchange/all…';
  setStatusHint('Loading Inmate Exchange All…');
  log('Loading Inmate Exchange All from SportsData…', 'info');
  try {
    const result = await window.api.fetchExchangeHistory({ withCharacters: true });
    if (!result?.ok) throw new Error(result?.message || 'Failed to load history');
    historyLoaded = true;
    const count = result.count ?? result.rows?.length ?? 0;
    if (historyHint) {
      historyHint.textContent =
        count > 0
          ? `${count} file(s) from /inmate-exchange/all`
          : result.message || 'No files returned';
    }
    historyRowsCache = result.rows || [];
    if (btnHistoryExport) btnHistoryExport.disabled = historyRowsCache.length === 0;
    renderHistoryTable(historyRowsCache);
    log(`History loaded · ${count} file(s)`, 'success');
    toast(`History · ${count} file(s)`, 'success');
    setStatusHint(`${count} exchange file(s) ready`);
  } catch (error) {
    const message = error.message || String(error);
    if (historyHint) historyHint.textContent = 'Failed to load history';
    log(message, 'error');
    toast(message, 'error');
    setStatusHint('History load failed');
  } finally {
    btnHistoryRefresh.disabled = false;
    btnHistoryRefresh.classList.remove('loading');
  }
}

async function previewHistoryRow({ url, date, filename }) {
  if (!url) return;
  setHistoryPreview({
    url,
    text: 'Loading preview…',
    date,
    filename,
  });
  setStatusHint(`Preview ${date || filename || 'file'}…`);
  try {
    const result = await window.api.previewExchangeFile({ url, date, filename });
    if (!result?.ok) throw new Error(result?.message || 'Preview failed');
    setHistoryPreview({
      url: result.url || url,
      text: result.text || '',
      date: result.date || date,
      filename: result.filename || filename,
    });
    log(`Preview ${result.date || date}: ${(result.characters || 0).toLocaleString()} chars`, 'info');
    setStatusHint(`Preview ready · ${(result.characters || 0).toLocaleString()} chars`);
  } catch (error) {
    setHistoryPreview({ url: null, text: '', date: null, filename: null });
    if (historyPreviewBody) historyPreviewBody.textContent = error.message || String(error);
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
  }
}

async function downloadHistoryRow({ url, date, filename }) {
  if (!url) return;
  setStatusHint(`Downloading ${date || filename || 'file'}…`);
  try {
    const suggestedName =
      date && filename
        ? `inmate-exchange-${date}-${filename}`
        : date
          ? `inmate-exchange-all-${date}.txt`
          : filename || 'inmate-exchange-all.txt';
    const result = await window.api.downloadExchangeFile({
      url,
      date,
      suggestedName,
    });
    if (result?.canceled) {
      setStatusHint('Download canceled');
      return;
    }
    if (!result?.ok) throw new Error(result?.message || 'Download failed');
    log(`Saved ${result.path}`, 'success');
    toast('File saved', 'success');
    setStatusHint(`Saved · ${(result.characters || 0).toLocaleString()} chars`);
  } catch (error) {
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
  }
}

let corrBoundsTimer = null;
function scheduleCorrPaneBounds() {
  clearTimeout(corrBoundsTimer);
  corrBoundsTimer = setTimeout(syncCorrPaneBounds, 50);
}

function ensureCardInView(card) {
  if (!card || card.classList.contains('collapsed')) return;
  card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  scheduleCorrPaneBounds();
}

window.addEventListener('resize', scheduleCorrPaneBounds);
window.visualViewport?.addEventListener('resize', scheduleCorrPaneBounds);
window.visualViewport?.addEventListener('scroll', scheduleCorrPaneBounds);

const corrPaneEl = document.getElementById('corrPane');
if (corrPaneEl && typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(scheduleCorrPaneBounds).observe(corrPaneEl);
}

['.workspace', '.col-controls', '.col-corrlinks', '.app'].forEach((sel) => {
  document.querySelector(sel)?.addEventListener('scroll', scheduleCorrPaneBounds, {
    passive: true,
  });
});

document.querySelectorAll('.collapse-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.step-card');
    requestAnimationFrame(() => ensureCardInView(card));
  });
});

// Allow main process to force a relayout after OS window chrome changes.
window.__syncCorrPaneBounds = syncCorrPaneBounds;

function exportHistoryCsv() {
  const rows = historyRowsCache || [];
  if (!rows.length) {
    toast('No history rows to export', 'warn');
    return;
  }
  const header = ['date', 'filename', 'characters', 'url'];
  const lines = [header.join(',')];
  rows.forEach((row) => {
    const vals = [
      row.date || '',
      row.filename || row.file || 'all.txt',
      row.characters == null ? '' : String(row.characters),
      row.url || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(vals.join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inmate-exchange-history.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV exported', 'success');
}

function wireShellUi() {
  setLoginShortcutHint();
  setCorrPlaceholderVisible(true);
  updateSessionPanel();

  btnAccountMenu?.addEventListener('click', (event) => {
    event.stopPropagation();
    setAccountMenuOpen(Boolean(accountDropdown?.hidden));
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#accountMenu')) setAccountMenuOpen(false);
  });
  btnCopyEmail?.addEventListener('click', async () => {
    const email = accountMenuEmail?.title || accountMenuEmail?.textContent || '';
    if (!email || email === 'Not signed in') return;
    await copyText(email);
    setAccountMenuOpen(false);
  });
  btnAbout?.addEventListener('click', () => {
    setAccountMenuOpen(false);
    openModalDialog(aboutDialog);
  });
  btnShortcuts?.addEventListener('click', () => openModalDialog(shortcutsDialog));
  logSearch?.addEventListener('input', applyLogFilter);

  sdConn?.addEventListener('click', () => {
    if (!sportsConnected) {
      showLoginScreen();
      sdEmail?.focus();
      return;
    }
    toast(sportsConnected ? 'SportsData connected' : 'SportsData offline', 'info');
  });
  clConn?.addEventListener('click', async () => {
    try {
      const status = await window.api.getCorrlinksStatus();
      log(`Status: ${status.state} — ${status.message}`, 'info');
      toast(status.message || status.state || 'CorrLinks status', 'info');
    } catch (error) {
      toast(error.message || String(error), 'error');
    }
  });

  btnCorrLoginCta?.addEventListener('click', () => {
    if (!btnLogin.disabled) startCorrlinksLogin();
    else toast(btnLogin.title || 'Select an inmate first', 'warn');
  });
  btnCorrReload?.addEventListener('click', async () => {
    const result = await window.api.reloadCorrlinksPanel?.();
    toast(result?.message || (result?.ok ? 'Reloaded' : 'No session'), result?.ok ? 'info' : 'warn');
  });
  btnCorrOpen?.addEventListener('click', async () => {
    const result = await window.api.openCorrlinksExternal?.();
    if (!result?.ok) toast(result?.message || 'Nothing to open', 'warn');
  });
  btnCorrZoomIn?.addEventListener('click', async () => {
    await window.api.zoomCorrlinksPanel?.({ delta: 0.1 });
  });
  btnCorrZoomOut?.addEventListener('click', async () => {
    await window.api.zoomCorrlinksPanel?.({ delta: -0.1 });
  });
  btnCorrClear?.addEventListener('click', async () => {
    const result = await window.api.clearCorrlinksPanel?.();
    setCorrlinksConnected(false);
    activeCorrEmail = '';
    toast(result?.message || 'Session cleared', 'info');
    scheduleCorrPaneBounds();
  });
  btnCorrRetry?.addEventListener('click', async () => {
    if (corrErrorBanner) corrErrorBanner.hidden = true;
    await window.api.reloadCorrlinksPanel?.();
  });
  btnCorrViewLog?.addEventListener('click', () => setLogDrawerOpen(true));
  btnHistoryExport?.addEventListener('click', exportHistoryCsv);
}

wireShellUi();


init().finally(() => {
  scheduleCorrPaneBounds();
  setTimeout(syncCorrPaneBounds, 200);
});
