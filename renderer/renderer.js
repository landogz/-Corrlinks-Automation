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
/** @type {{ to: string, subject: string, body: string, chars: number }} */
let composePreview = { to: '', subject: '', body: '', chars: 0 };
let optionHighlight = -1;

function stamp() {
  return new Date().toLocaleTimeString([], { hour12: true });
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
  applyLogFilter();
  if (logAutoScroll.checked) logEl.scrollTop = logEl.scrollHeight;
}

function applyLogFilter() {
  const mode = logFilter.value;
  [...logEl.children].forEach((line) => {
    const show = mode === 'all' || line.dataset.level === 'error';
    line.hidden = !show;
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
  sdConn.querySelector('.status-label').textContent = sportsConnected
    ? 'SportsData connected'
    : 'SportsData offline';
}

function setCorrlinksConnected(on, warn = false) {
  corrlinksConnected = Boolean(on);
  clConn.classList.toggle('on', corrlinksConnected && !warn);
  clConn.classList.toggle('warn', Boolean(warn) || !corrlinksConnected);
  clConn.querySelector('.status-label').textContent = corrlinksConnected
    ? 'CorrLinks logged in'
    : warn
      ? 'CorrLinks attention'
      : 'CorrLinks not logged in';
}

function setStepState({ inmateDone, composeDone, active }) {
  activeStep = active;
  const map = {
    1: { done: inmateDone, card: inmateCard },
    2: { done: composeDone, card: composeCard },
  };

  [...stepIndicator.querySelectorAll('.step')].forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle('active', n === active);
    el.classList.toggle('done', Boolean(map[n]?.done) && n !== active);
  });

  Object.entries(map).forEach(([n, item]) => {
    const num = Number(n);
    item.card.classList.toggle('done', Boolean(item.done));
    if (num === active) item.card.classList.remove('collapsed');
    else if (item.done) item.card.classList.add('collapsed');
  });
}

function setCardCollapsed(card, button, collapsed) {
  card.classList.toggle('collapsed', collapsed);
  button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function updateSignedInChip(email) {
  const value = String(email || '').trim();
  signedInEmail.textContent = value ? value : '';
  signedInEmail.title = value;
  signedInEmail.hidden = !value;
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

function updateComposePreview({ to, subject, body, chars } = {}) {
  if (to != null) composePreview.to = formatRecipient(to);
  if (subject != null) composePreview.subject = String(subject || '');
  if (body != null) composePreview.body = String(body || '');
  if (chars != null) composePreview.chars = Number(chars) || 0;

  previewTo.textContent = composePreview.to || '—';
  previewTo.title = composePreview.to || '';
  previewSubject.textContent = composePreview.subject || '—';
  previewBody.textContent = composePreview.body || '—';

  const count = composePreview.chars || 0;
  charCountLabel.textContent = `${count.toLocaleString()} / ${CHAR_MAX.toLocaleString()}`;
  const pct = Math.min(100, Math.round((count / CHAR_MAX) * 100));
  charProgress.style.width = `${pct}%`;
  charProgress.classList.toggle('warn', count >= CHAR_WARN && count < CHAR_MAX);
  charProgress.classList.toggle('danger', count >= CHAR_MAX);

  composeCollapsedSummary.textContent = composePreview.to
    ? `To ${truncateMiddle(composePreview.to, 42)} · ${composePreview.subject || 'no subject'}`
    : 'Waiting for CorrLinks…';
  composeCollapsedSummary.title = composeCollapsedSummary.textContent;

  confirmTo.textContent = composePreview.to || '—';
  confirmSubject.textContent = composePreview.subject || '—';
  confirmChars.textContent = `${count.toLocaleString()} / ${CHAR_MAX.toLocaleString()}`;
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
    { label: 'Primary', email: primary?.email, ready: Boolean(primary?.password) },
    { label: 'Second', email: second?.email, ready: Boolean(second?.password) },
  ].forEach((row) => {
    const el = document.createElement('div');
    el.className = 'kv-row';
    const label = document.createElement('span');
    label.className = 'kv-label';
    label.textContent = row.label;
    const value = document.createElement('span');
    value.className = 'kv-value truncate';
    value.textContent = row.email || 'none';
    value.title = row.email || 'none';
    if (row.email && !row.ready) value.textContent += ' (no password)';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ghost tiny copy-btn';
    copy.textContent = 'Copy';
    copy.disabled = !row.email;
    copy.addEventListener('click', () => copyText(row.email));
    el.append(label, value, copy);
    accountRows.appendChild(el);
  });

  // All sendable parts stay selected; file list UI is hidden for now.
  selectedFileKeys = sendable.map((file, index) => `${file.part}:${file.filename || index}`);
  if (filesHint) {
    filesHint.textContent = sendable.length
      ? `${sendable.length} auto-selected` + (skipped.length ? ` · ${skipped.length} empty skipped` : '')
      : 'No files';
  }
  if (filesList) filesList.innerHTML = '';

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
  btnStartLoop.disabled = loopRunning || corrlinksLoginBusy || !hasLoopQueue;
  btnStartLoop.hidden = loopRunning;
  btnStopLoop.disabled = !loopRunning;
  btnStopLoop.hidden = !loopRunning;
  actionsRow?.classList.toggle('is-looping', loopRunning);
  if (inmateSearch) inmateSearch.disabled = loopRunning || !accounts.length;
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
      const name = document.createElement('span');
      name.className = 'option-name';
      name.textContent = inmate.name || 'Inmate';
      const meta = document.createElement('span');
      meta.className = 'option-meta truncate';
      const email = inmate.corrlinks_account?.email || 'no email';
      meta.textContent = `${inmate.inmate_id || inmate.id} · ${email}`;
      meta.title = email;
      li.append(name, meta);
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
  setCardCollapsed(inmateCard, btnToggleInmate, false);
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
    toast(`Loaded ${result.accounts.length} inmates`, 'success');
    setStatusHint(`${result.accounts.length} inmates ready`);
    setStepState({
      inmateDone: Boolean(selectedInmate()),
      composeDone: Boolean(composePreview.to || composePreview.subject),
      active: 1,
    });
    setCardCollapsed(inmateCard, btnToggleInmate, false);
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
    setCardCollapsed(composeCard, btnToggleCompose, false);
  } else {
    setCardCollapsed(inmateCard, btnToggleInmate, false);
  }
}

function resetWorkspaceState() {
  accounts = [];
  selectedFileKeys = [];
  composePreview = { to: '', subject: '', body: '', chars: 0 };
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
}

async function init() {
  resetWorkspaceState();
  showLoginScreen();
  setLoginError('');

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

btnToggleInmate.addEventListener('click', () => {
  setCardCollapsed(inmateCard, btnToggleInmate, !inmateCard.classList.contains('collapsed'));
});
btnToggleCompose.addEventListener('click', () => {
  setCardCollapsed(composeCard, btnToggleCompose, !composeCard.classList.contains('collapsed'));
});

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

btnRefresh.addEventListener('click', () => refreshInmates());

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

btnSend.addEventListener('click', () => {
  if (!composePreview.to || !composePreview.subject) {
    toast('Compose a message first', 'error');
    return;
  }
  confirmSend.showModal();
});

confirmSend.addEventListener('close', () => {
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
  logDrawer.hidden = !open;
  if (logBackdrop) logBackdrop.hidden = !open;
  if (btnOpenLog) btnOpenLog.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('log-open', open);
  if (open && logAutoScroll?.checked) {
    requestAnimationFrame(() => {
      logEl.scrollTop = logEl.scrollHeight;
    });
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
  if (event.key === 'Escape' && isLogDrawerOpen()) {
    event.preventDefault();
    setLogDrawerOpen(false);
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
    if (!isLogDrawerOpen()) setLogDrawerOpen(true);
  }
});

/**
 * Map #corrPane to the Electron WebContentsView.
 * Clip to the visible .app area above the status bar so a scrolled/off-screen
 * pane never paints the embed over the footer or left column.
 */
function syncCorrPaneBounds() {
  const pane = document.getElementById('corrPane');
  if (!pane || !window.api?.setCorrBounds) return;

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

  // Hide embed when scrolled away, collapsed, or a loop countdown overlay is up.
  const visible = !loopCountdownActive && width >= 8 && height >= 8;
  window.api.setCorrBounds({
    x: Math.round(left),
    y: Math.round(top),
    width: visible ? Math.round(width) : 0,
    height: visible ? Math.round(height) : 0,
  });
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

init().finally(() => {
  scheduleCorrPaneBounds();
  setTimeout(syncCorrPaneBounds, 200);
});
