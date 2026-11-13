const THEME_STORAGE_KEY = 'iea.theme';

function getThemePreference() {
  const boot = window.__IEA_THEME_BOOT__?.preference;
  const pref =
    document.documentElement.dataset.themePref ||
    boot ||
    localStorage.getItem(THEME_STORAGE_KEY) ||
    'auto';
  return pref === 'light' || pref === 'dark' || pref === 'auto' ? pref : 'auto';
}

function resolveThemePreference(pref = getThemePreference()) {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function syncThemeSwitchUi(pref = getThemePreference()) {
  document.querySelectorAll('[data-theme-pref]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-theme-pref') === pref);
    btn.setAttribute('aria-pressed', btn.getAttribute('data-theme-pref') === pref ? 'true' : 'false');
  });
  const aboutTheme = document.getElementById('aboutTheme');
  if (aboutTheme) {
    const resolved = resolveThemePreference(pref);
    aboutTheme.textContent =
      pref === 'auto' ? `Auto (${resolved})` : pref === 'light' ? 'Light' : 'Dark';
  }
}

function applyThemePreference(pref = 'auto', { persist = true } = {}) {
  const next = pref === 'light' || pref === 'dark' || pref === 'auto' ? pref : 'auto';
  const resolved = resolveThemePreference(next);
  document.documentElement.dataset.themePref = next;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (_) {}
  }
  syncThemeSwitchUi(next);
  if (persist && window.api?.setThemePreference) {
    window.api.setThemePreference(next).catch(() => {});
  }
  return { preference: next, resolved };
}

async function restoreThemePreference() {
  let pref = getThemePreference();
  try {
    const saved = await window.api?.getThemePreference?.();
    if (saved?.preference === 'light' || saved?.preference === 'dark' || saved?.preference === 'auto') {
      pref = saved.preference;
    }
  } catch (_) {}
  applyThemePreference(pref, { persist: true });
}

function wireThemeControls() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest?.('[data-theme-pref]');
    if (!btn) return;
    event.preventDefault();
    applyThemePreference(btn.getAttribute('data-theme-pref') || 'auto');
  });
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onSystemTheme = () => {
    if (getThemePreference() === 'auto') applyThemePreference('auto', { persist: false });
  };
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onSystemTheme);
  else if (typeof mq.addListener === 'function') mq.addListener(onSystemTheme);
  restoreThemePreference();
}

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
const loopProgressIcon = document.getElementById('loopProgressIcon');
const loopProgressTitle = document.getElementById('loopProgressTitle');
const loopProgressTime = document.getElementById('loopProgressTime');
const loopProgressStats = document.getElementById('loopProgressStats');
const historyPreviewLines = document.getElementById('historyPreviewLines');
const historyPreviewSearch = document.getElementById('historyPreviewSearch');
const statusHintText = document.getElementById('statusHintText');
const sessionLiveLabel = document.getElementById('sessionLiveLabel');
const sessionLastResult = document.getElementById('sessionLastResult');
const inmateSelectedDisplay = document.getElementById('inmateSelectedDisplay');
const inmateSelectedName = document.getElementById('inmateSelectedName');
const inmateSelectedId = document.getElementById('inmateSelectedId');
const btnClearInmate = document.getElementById('btnClearInmate');
const historyDateFilter = document.getElementById('historyDateFilter');
const historyControls = document.getElementById('historyControls');
const historyControlsFind = document.getElementById('historyControlsFind');
const historyToolbarActions = document.getElementById('historyToolbarActions');
const historyTableEmpty = document.getElementById('historyTableEmpty');
const historyPreviewHeading = document.getElementById('historyPreviewHeading');
const btnHistoryEmptyGenerate = document.getElementById('btnHistoryEmptyGenerate');
const loopCountdown = document.getElementById('loopCountdown');
const loopCountdownNum = document.getElementById('loopCountdownNum');
const loopCountdownNext = document.getElementById('loopCountdownNext');
const appVerifying = document.getElementById('appVerifying');
const appVerifyingTitle = document.getElementById('appVerifyingTitle');
const appVerifyingStatus = document.getElementById('appVerifyingStatus');
const appVerifyingDetail = document.getElementById('appVerifyingDetail');
const appVerifyingLive = document.getElementById('appVerifyingLive');
const appVerifyingProgress = document.getElementById('appVerifyingProgress');
const appVerifyingProgressBar = document.getElementById('appVerifyingProgressBar');
const appVerifyingPercent = document.getElementById('appVerifyingPercent');
const btnStopBootVerify = document.getElementById('btnStopBootVerify');
const loopInitializing = appVerifying;
const loopInitializingStatus = appVerifyingStatus;
const loopInitializingDetail = appVerifyingDetail;
/** Live one-line probe progress under the verifying overlay. */
let verifyProbeLive = null;
let verifyProbeLiveTimer = null;
let lastVerifyLiveLogKey = '';

const VERIFY_COPY = {
  title: 'Preparing your workspace',
  status: 'Validating CorrLinks accounts',
  statusRetry: 'Retrying unavailable accounts',
  statusPause: 'Waiting before next login',
  defaultStatus: 'Validating CorrLinks accounts',
  manualTitle: 'Manual validation',
  manualStatus: 'Re-checking CorrLinks accounts',
};
const actionsRow = document.getElementById('actionsRow');
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
const inmateEmpty = document.getElementById('inmateEmpty');
const inmateCombobox = document.getElementById('inmateCombobox');
const stepIndicator = document.getElementById('stepIndicator');
const sdConn = document.getElementById('sdConn');
const clConn = document.getElementById('clConn');
const statusHint = document.getElementById('statusHint');
const statusClock = document.getElementById('statusClock');
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
const loopDoneDialog = document.getElementById('loopDoneDialog');
const loopDoneIcon = document.getElementById('loopDoneIcon');
const loopDoneTitle = document.getElementById('loopDoneTitle');
const loopDoneMessage = document.getElementById('loopDoneMessage');
const loopDoneSummary = document.getElementById('loopDoneSummary');

const CHAR_MAX = 12750;
const CHAR_WARN = 11000;

/** @type {Array<any>} */
let accounts = [];
/** @type {string[]} */
let selectedFileKeys = [];
/** @type {'daily' | 'weekly'} */
let templateMode = 'daily';
/** @type {'NFL' | 'CFB'} */
let weeklyLeague = 'NFL';
/** Cached weekly update files for the selected league. */
let weeklyCache = {
  league: null,
  updates: [],
  week_start: null,
  week_end: null,
  subject: null,
  message: '',
};
let weeklyLoading = false;
let dailySubjectHint = '';
let sportsConnected = false;
let corrlinksConnected = false;
let activeStep = 1;
let corrlinksLoginBusy = false;
/** Bumped to invalidate an in-flight single login/compose after Force stop. */
let corrlinksOpGeneration = 0;
let corrlinksForceStop = false;
/**
 * CorrLinks emails verified this session (single login or probe).
 * Loop Phase 1 skips re-checking these.
 * @type {Map<string, { state: string, loggedIn?: boolean, email?: string, message?: string, verifiedAt: number, cached: true }>}
 */
const verifiedCorrlinksAccounts = new Map();
/** Session TTL for cached verifications (30 minutes). */
const VERIFIED_ACCOUNT_TTL_MS = 30 * 60 * 1000;
let loopRunning = false;
let loopAbort = false;
/** @type {'idle' | 'running' | 'done' | 'stopped' | 'error'} */
let loopPhase = 'idle';
let lastLoopResult = null;
/** Bumped on force-stop so an in-flight startInmateLoop exits without finishing. */
let loopGeneration = 0;
/** When true, hide the CorrLinks embed so the HTML countdown can show. */
let loopCountdownActive = false;
/** When true, full-page verifying overlay is showing. */
let loopInitializingActive = false;
/** Boot-time CorrLinks account verification (after SportsData login). */
let bootVerifyRunning = false;
let bootVerifyAbort = false;
/** Last full probe map from boot verify — reused by Start loop. */
let bootProbeByEmail = new Map();
let accountsVerifiedOnce = false;
/** Fingerprint of live corrlinks-accounts used for persisted validation skip. */
let lastAccountsFingerprint = null;
/** Snapshot of last applied corrlinks-accounts payload (names, files, credentials). */
let lastAccountsSnapshot = null;
/** Quiet poll of SportsData corrlinks-accounts while signed in. */
let accountsAutoRefreshTimer = null;
let accountsAutoRefreshBusy = false;
/** How often to re-fetch https://sportsdata.com/api/v1/insidescore/corrlinks-accounts */
const ACCOUNTS_AUTO_REFRESH_MS = 60_000;
/** Ignore rapid window-focus refreshes (visibility + focus can double-fire). */
const ACCOUNTS_FOCUS_MIN_GAP_MS = 15_000;
let lastAccountsQuietSyncAt = 0;
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
const historyPreviewEmpty = document.getElementById('historyPreviewEmpty');
const historyPreviewMeta = document.getElementById('historyPreviewMeta');
const historyPreviewBody = document.getElementById('historyPreviewBody');
const btnHistoryRefresh = document.getElementById('btnHistoryRefresh');
const btnHistoryGenerate = document.getElementById('btnHistoryGenerate');
const historyGenerateDate = document.getElementById('historyGenerateDate');
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
const isMacPlatform = /Mac|iPhone|iPad/.test(navigator.platform || '');
const modKey = isMacPlatform ? 'Cmd' : 'Ctrl';

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
/** From APP_TIMEZONE in .env (via config summary). */
let appTimezone = 'America/New_York';

function getDisplayTimeZone() {
  return appTimezone || 'America/New_York';
}

function stamp() {
  return new Date().toLocaleTimeString([], {
    hour12: true,
    timeZone: getDisplayTimeZone(),
  });
}

/** Compact wall clock using APP_TIMEZONE from .env — e.g. "Nov 10, 2026 · 12:25 PM EST". */
function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const timeZone = getDisplayTimeZone();
  const day = d.toLocaleDateString('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
  return `${day} · ${time}`;
}

function tickStatusClock() {
  const now = new Date();
  const label = formatDateTime(now);
  const tz = getDisplayTimeZone();
  if (statusClock) {
    statusClock.dateTime = now.toISOString();
    statusClock.textContent = label;
    statusClock.title = `${label} (${tz})`;
  }
}

function startStatusClock() {
  tickStatusClock();
  if (startStatusClock._timer) clearInterval(startStatusClock._timer);
  startStatusClock._timer = setInterval(tickStatusClock, 1000);
}

function platformShortcutLabel(key) {
  return `${modKey}+${key}`;
}

function setLoginShortcutHint() {
  if (btnRefresh) {
    btnRefresh.title = `Refresh inmates & validate CorrLinks (${platformShortcutLabel('R')})`;
    btnRefresh.setAttribute('aria-label', 'Refresh inmates and validate CorrLinks accounts');
  }
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
  const next = Boolean(open);
  accountDropdown.hidden = !next;
  btnAccountMenu.setAttribute('aria-expanded', next ? 'true' : 'false');
  document.body.classList.toggle('account-menu-open', next);
  // Native CorrLinks view paints above HTML and was covering this dropdown.
  if (next) hideCorrEmbedNow({ force: true });
  scheduleCorrPaneBounds();
}

/** True once we intentionally opened the native CorrLinks embed for this session. */
let corrEmbedRevealed = false;

function setCorrPlaceholderVisible(visible) {
  if (!corrPlaceholder) return;
  // Never cover a live/warming WebContentsView with the empty-state HTML.
  if (corrEmbedRevealed && visible) {
    corrPlaceholder.classList.add('is-hidden');
    return;
  }
  corrPlaceholder.classList.toggle('is-hidden', !visible);
}

/** Live compose/login progress shown in the CorrLinks card header. */
let corrPanelBusyText = null;
/** Last connection warn flag — restored after busy progress clears. */
let corrPanelWarn = false;

function setCorrPanelConnection(on, warn = false) {
  corrPanelWarn = Boolean(warn);
  if (!corrPanelStatus) return;
  setCorrPlaceholderVisible(!on);
  // Keep live loop progress in the header until cleared.
  if (corrPanelBusyText) {
    corrPanelStatus.classList.add('is-busy', 'is-warn');
    corrPanelStatus.classList.remove('is-on', 'is-off');
    return;
  }
  corrPanelStatus.classList.remove('is-busy');
  corrPanelStatus.classList.toggle('is-on', Boolean(on) && !warn);
  corrPanelStatus.classList.toggle('is-warn', Boolean(warn));
  corrPanelStatus.classList.toggle('is-off', !on && !warn);
  const label = corrPanelStatus.querySelector('.status-label');
  const text = on ? (warn ? 'Attention' : 'Connected') : 'Not logged in';
  if (label) label.textContent = text;
  corrPanelStatus.title = text;
}

/** Show running loop progress beside “CorrLinks” in the panel header. */
function setCorrPanelBusy(text = null) {
  if (!corrPanelStatus) return;
  const label = corrPanelStatus.querySelector('.status-label');
  const next = String(text || '').trim();
  if (!next) {
    corrPanelBusyText = null;
    setCorrPanelConnection(corrlinksConnected, corrPanelWarn);
    return;
  }
  corrPanelBusyText = next;
  corrPanelStatus.classList.add('is-busy', 'is-warn');
  corrPanelStatus.classList.remove('is-on', 'is-off');
  if (label) label.textContent = next;
  corrPanelStatus.title = next;
}

function currentLoopPhase() {
  return loopRunning ? 'running' : loopPhase || 'idle';
}

function updateSessionPanel() {
  const phase = currentLoopPhase();
  const phaseLabel =
    phase === 'running'
      ? 'Running'
      : phase === 'done'
        ? 'Done'
        : phase === 'stopped'
          ? 'Stopped'
          : phase === 'error'
            ? 'Error'
            : 'Idle';

  if (sessionLastLogin) sessionLastLogin.textContent = lastLoginAt || '—';
  if (sessionLoopState) {
    sessionLoopState.textContent = phaseLabel;
    sessionLoopState.dataset.phase = phase;
  }
  if (sessionLive) {
    const showLive = phase === 'running';
    sessionLive.hidden = !showLive;
    sessionLive.setAttribute('aria-hidden', showLive ? 'false' : 'true');
    sessionLive.classList.toggle('is-running', showLive);
    if (sessionLiveLabel) sessionLiveLabel.textContent = 'Running';
  }
  if (sessionNextRun && !loopCountdownActive) {
    sessionNextRun.textContent = phase === 'running' ? '…' : '—';
  }
  if (sessionLastResult) {
    if (phase === 'running') {
      sessionLastResult.textContent = 'In progress';
    } else if (lastLoopResult) {
      const ok = Number(lastLoopResult.okCount || 0);
      const fail = Number(lastLoopResult.failCount || 0);
      sessionLastResult.textContent = `${ok} ok · ${fail} failed`;
      sessionLastResult.title = lastLoopResult.summary || sessionLastResult.textContent;
    } else {
      sessionLastResult.textContent = '—';
      sessionLastResult.removeAttribute('title');
    }
  }
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

/** Map Electron/infra noise to short operator-facing copy (tech detail stays in log). */
function operatorFriendlyMessage(message, { fallback = 'Something went wrong' } = {}) {
  const raw = String(message || '').trim();
  if (!raw) return fallback;
  if (/object has been destroyed|corrlinks panel was closed|force.?stop/i.test(raw)) {
    return 'CorrLinks window closed — try again';
  }
  if (/script failed to execute|execution context was destroyed/i.test(raw)) {
    return 'CorrLinks page was still loading — try again';
  }
  if (/ERR_ABORTED|-3|net::ERR/i.test(raw)) {
    return 'Network interrupted while loading CorrLinks';
  }
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network error|fetch failed/i.test(raw)) {
    return 'Could not reach the server — check your connection';
  }
  if (/session expired|re-login failed|401|419/i.test(raw)) {
    return 'SportsData session expired — sign in again';
  }
  return raw;
}

function toast(message, level = 'info') {
  const el = document.createElement('div');
  const kind = normalizeLogLevel(level);
  el.className = `toast ${kind === 'success' ? 'success' : kind === 'error' ? 'error' : kind === 'warn' ? 'warn' : 'info'}`;
  el.textContent =
    kind === 'error' || kind === 'warn' ? operatorFriendlyMessage(message) : String(message || '');
  toastHost.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function setStatusHint(text) {
  const value = text || 'Ready';
  if (statusHintText) statusHintText.textContent = value;
  else if (statusHint) statusHint.textContent = value;
  statusHint?.classList.toggle('has-preview', /preview ready/i.test(value));
}

function setSportsConnected(on) {
  sportsConnected = Boolean(on);
  sdConn.classList.toggle('on', sportsConnected);
  sdConn.classList.toggle('warn', !sportsConnected);
  sdConn.title = sportsConnected ? 'SportsData online' : 'SportsData offline';
  const sdLabel = sdConn.querySelector('.status-label');
  if (sdLabel) {
    sdLabel.textContent = sportsConnected ? 'SportsData online' : 'SportsData offline';
  }
}

function setCorrlinksConnected(on, warn = false) {
  corrlinksConnected = Boolean(on);
  clConn.classList.toggle('on', corrlinksConnected && !warn);
  clConn.classList.toggle('warn', Boolean(warn));
  clConn.classList.toggle('is-off', !corrlinksConnected && !warn);
  const clLabel = clConn.querySelector('.status-label');
  if (clLabel) {
    clLabel.textContent = corrlinksConnected
      ? 'CorrLinks online'
      : warn
        ? 'CorrLinks needs attention'
        : 'CorrLinks offline';
  }
  clConn.title = clLabel?.textContent || 'CorrLinks connection';
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
  }
  if (btnAccountMenu) {
    const label = value ? `Account menu · ${value}` : 'Account menu';
    btnAccountMenu.title = label;
    btnAccountMenu.setAttribute('aria-label', label);
  }
  if (accountAvatar) accountAvatar.textContent = initialsFromEmail(value);
  if (accountMenuEmail) {
    accountMenuEmail.textContent = value || 'Not signed in';
    accountMenuEmail.title = value;
  }
}

function showLoginScreen() {
  stopAccountsAutoRefresh();
  loginScreen.hidden = false;
  mainShell.hidden = true;
  document.body.classList.add('is-login');
  document.body.classList.remove('is-app');
  // Close anything that can sit above the login form and eat clicks.
  if (logBackdrop) logBackdrop.hidden = true;
  if (logDrawer) logDrawer.hidden = true;
  document.body.classList.remove('log-open', 'account-menu-open');
  hideCorrEmbedNow();
  // Never fire-and-forget forceStop while a probe/send/loop is running — a late
  // clearAndClose was destroying the new Account-1 panel and freezing verify at 13%.
  if (!bootVerifyRunning && !loopRunning && !corrlinksLoginBusy) {
    Promise.resolve(window.api?.forceStopCorrlinks?.()).catch(() => {});
  }
  scheduleCorrPaneBounds();
}

function showMainApp(email) {
  loginScreen.hidden = true;
  mainShell.hidden = false;
  document.body.classList.add('is-app');
  document.body.classList.remove('is-login');
  updateSignedInChip(email);
  startAccountsAutoRefresh();
  scheduleCorrPaneBounds();
  requestAnimationFrame(() => syncCorrPaneBounds());
}

function selectedInmate() {
  const id = accountSelect.value;
  return accounts.find((a) => String(a.id) === String(id)) || null;
}

function setConfigSummary(summary = {}) {
  if (summary?.timezone) {
    appTimezone = String(summary.timezone).trim() || appTimezone;
    tickStatusClock();
  }
  if (summary?.subjectToday != null) {
    dailySubjectHint = String(summary.subjectToday || '').trim();
    syncTemplateControls();
  }
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

}

function selectedExchangeFiles(inmate) {
  const all = currentSendableFiles(inmate);
  if (!selectedFileKeys.length) return all;
  return all.filter((file, index) => {
    const key = `${file.part}:${file.filename || index}`;
    return selectedFileKeys.includes(key);
  });
}

function currentTemplateSubject() {
  if (templateMode === 'weekly') return weeklyCache.subject || weeklyLeague;
  return dailySubjectHint || '—';
}

function currentSendableFiles(inmate) {
  if (templateMode === 'weekly') return Array.isArray(weeklyCache.updates) ? weeklyCache.updates : [];
  return inmate?.inmate_exchange?.sendable || [];
}

function buildTemplatePayload() {
  if (templateMode !== 'weekly') {
    return { mode: 'daily', league: null, subject: null, files: null };
  }
  const files = (weeklyCache.updates || []).map((file, index) => ({
    part: file.part || index + 1,
    filename: file.filename || `weekly-${index + 1}.txt`,
    url: file.url,
    characters: file.characters ?? null,
    league: file.league || weeklyLeague,
  }));
  return {
    mode: 'weekly',
    league: weeklyLeague,
    subject: weeklyCache.subject || weeklyLeague,
    files,
  };
}

function syncTemplateControls() {
  document.querySelectorAll('[data-template-mode]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.templateMode === templateMode);
  });
  document.querySelectorAll('[data-weekly-league]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.weeklyLeague === weeklyLeague);
  });
  const leagueRow = document.getElementById('templateLeagueRow');
  if (leagueRow) leagueRow.hidden = templateMode !== 'weekly';
  const subjectHint = document.getElementById('templateSubjectHint');
  if (subjectHint) {
    subjectHint.textContent =
      templateMode === 'weekly'
        ? `Subject: ${currentTemplateSubject()}`
        : `Subject: ${dailySubjectHint || '—'}`;
  }
  const weekMeta = document.getElementById('templateWeekMeta');
  if (weekMeta) {
    if (templateMode === 'weekly' && (weeklyCache.week_start || weeklyCache.week_end)) {
      weekMeta.hidden = false;
      weekMeta.textContent = weeklyLoading
        ? 'Loading weekly update…'
        : `Week ${weeklyCache.week_start || '—'} → ${weeklyCache.week_end || '—'}`;
    } else if (templateMode === 'weekly' && weeklyLoading) {
      weekMeta.hidden = false;
      weekMeta.textContent = 'Loading weekly update…';
    } else {
      weekMeta.hidden = true;
      weekMeta.textContent = '';
    }
  }
}

async function downloadSendableFile(file, { order = 1 } = {}) {
  const filename = file?.filename || `part-${order}.txt`;
  if (!file?.url) {
    toast(`No download URL for ${filename}`, 'error');
    return;
  }
  const inmate = selectedInmate();
  const inmateId = inmate?.inmate_id || inmate?.id || 'inmate';
  const suggestedName = `${inmateId}-${filename}`.replace(/[^\w.\-]+/g, '_');
  const partNum = Number(file?.part) > 0 ? Number(file.part) : order;
  setStatusHint(`Downloading ${filename}…`);
  try {
    const result = await window.api.downloadExchangeFile({
      url: file.url,
      suggestedName,
      part: partNum,
      continuation: partNum > 1,
    });
    if (result?.canceled) {
      setStatusHint('Download canceled');
      return;
    }
    if (!result?.ok) throw new Error(result?.message || 'Download failed');
    log(`Saved File ${order}: ${result.path}`, 'success');
    toast(`Saved File ${order}`, 'success');
    setStatusHint(`Saved File ${order} · ${(result.characters || 0).toLocaleString()} chars`);
  } catch (error) {
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
  }
}

function renderFilesList(
  sendable,
  { skippedCount = 0, emptyMessage = 'No sendable files for this inmate.', preserveKeys = null } = {}
) {
  const allKeys = sendable.map((file, index) => `${file.part}:${file.filename || index}`);
  if (Array.isArray(preserveKeys) && preserveKeys.length) {
    const kept = allKeys.filter((key) => preserveKeys.includes(key));
    selectedFileKeys = kept.length ? kept : allKeys.slice();
  } else {
    selectedFileKeys = allKeys.slice();
  }
  if (filesHint) {
    filesHint.textContent = sendable.length
      ? `${selectedFileKeys.length} selected` + (skippedCount ? ` · ${skippedCount} empty skipped` : '')
      : weeklyLoading
        ? 'Loading…'
        : '';
  }
  if (filesList) {
    filesList.innerHTML = '';
    sendable.forEach((file, index) => {
      const key = `${file.part}:${file.filename || index}`;
      const order =
        Number.isFinite(Number(file.part)) && Number(file.part) > 0
          ? Number(file.part)
          : index + 1;
      const filename = file.filename || `part-${order}.txt`;
      const li = document.createElement('li');
      li.className = 'file-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedFileKeys.includes(key);
      cb.setAttribute('aria-label', `Select file ${order}`);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!selectedFileKeys.includes(key)) selectedFileKeys.push(key);
        } else {
          selectedFileKeys = selectedFileKeys.filter((k) => k !== key);
        }
        if (filesHint) filesHint.textContent = `${selectedFileKeys.length} selected`;
        updateActionButtons();
      });
      const label = document.createElement('span');
      label.className = 'file-label';
      const orderEl = document.createElement('span');
      orderEl.className = 'file-order';
      orderEl.textContent = `File ${order}`;
      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = filename;
      name.title = `File ${order}: ${filename}`;
      label.append(orderEl, name);
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      const chars = file.characters != null ? Number(file.characters).toLocaleString() : '—';
      meta.textContent = `${chars} chars`;
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'file-download ghost tiny';
      downloadBtn.textContent = 'Download';
      downloadBtn.title = file.url ? `Download ${filename}` : 'No download URL';
      downloadBtn.setAttribute('aria-label', `Download file ${order}`);
      downloadBtn.disabled = !file.url;
      downloadBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        downloadSendableFile(file, { order });
      });
      li.append(cb, label, meta, downloadBtn);
      filesList.appendChild(li);
    });
  }
  if (filesEmpty) {
    const title = filesEmpty.querySelector('h3');
    const detail = filesEmpty.querySelector('p');
    if (title) title.textContent = weeklyLoading ? 'Loading files…' : 'No sendable files';
    if (detail) {
      detail.textContent = weeklyLoading
        ? 'Fetching the weekly update from SportsData…'
        : emptyMessage || 'This inmate has no exchange files ready to send.';
    }
    filesEmpty.hidden = sendable.length > 0;
  }
  if (filesBlock) filesBlock.hidden = false;
}

function renderAccountMeta(inmate, { preserveFileKeys = null } = {}) {
  if (!inmate) {
    accountMeta.hidden = true;
    inmateCollapsedSummary.hidden = false;
    inmateCollapsedSummary.textContent = accounts.length ? 'Select an inmate' : 'Load inmates first';
    inmateCollapsedSummary.title = inmateCollapsedSummary.textContent;
    inmateCollapsedSummary.classList.add('warn');
    setInmateSelectedDisplay(null);
    updateActionButtons({ canLogin: false });
    return;
  }

  accountMeta.hidden = false;
  inmateCollapsedSummary.classList.remove('warn');
  // Header stays "Inmate" + check while expanded; summary is for collapsed state only.
  inmateCollapsedSummary.textContent = '';
  inmateCollapsedSummary.title = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
  inmateCollapsedSummary.hidden = true;

  const primary = inmate.corrlinks_account;
  const exchange = inmate.inmate_exchange || {};
  const dailySendable = exchange.sendable || [];
  const skipped = exchange.skipped || [];
  const sendable = currentSendableFiles(inmate);
  const status = String(inmate.status || 'n/a');

  badgeRow.innerHTML = '';
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ${/active|ok|ready/i.test(status) ? 'success' : 'muted'}`;
  statusBadge.textContent = status;
  badgeRow.appendChild(statusBadge);

  const filesBadge = document.createElement('span');
  filesBadge.className = 'badge info';
  filesBadge.textContent =
    templateMode === 'weekly'
      ? `Weekly ${weeklyLeague}: ${sendable.length} file(s)`
      : `Files: ${dailySendable.length} sendable`;
  badgeRow.appendChild(filesBadge);

  if (templateMode === 'daily' && skipped.length) {
    const skipBadge = document.createElement('span');
    skipBadge.className = 'badge warn';
    skipBadge.textContent = `${skipped.length} empty skipped`;
    badgeRow.appendChild(skipBadge);
  }

  accountRows.innerHTML = '';

  const assignment = resolveInmateLoginAssignment(inmate);
  if (assignment) {
    const plan = document.createElement('div');
    plan.className = `login-plan${assignment.ready ? '' : ' is-blocked'}${
      assignment.via === 'second' ? ' is-secondary' : ''
    }`;
    const planTitle = document.createElement('p');
    planTitle.className = 'login-plan-kicker';
    planTitle.textContent = assignment.ready ? 'Will login' : 'Cannot login';
    const planMain = document.createElement('p');
    planMain.className = 'login-plan-main';
    planMain.textContent = assignment.ready
      ? `${assignment.viaLabel} · ${assignment.email}`
      : assignment.reason || 'No usable account';
    planMain.title = planMain.textContent;
    const planMeta = document.createElement('p');
    planMeta.className = 'login-plan-meta';
    if (assignment.ready) {
      const bits = [
        `Loop group ${assignment.groupIndex}/${assignment.groupTotal}`,
        `${assignment.groupSize} recipient${assignment.groupSize === 1 ? '' : 's'} on this account`,
      ];
      if (assignment.pendingValidation) bits.push('pending validation');
      else {
        bits.push(`PRIMARY=${assignment.primaryState}`);
        if (assignment.second) bits.push(`SECONDARY=${assignment.secondState}`);
      }
      planMeta.textContent = bits.join(' · ');
    } else {
      const primaryProbe =
        (emailLoopKey(assignment.primary) && bootProbeByEmail.get(emailLoopKey(assignment.primary))) ||
        (assignment.primary ? getCachedVerifiedProbe(assignment.primary) : null);
      const secondProbe =
        (emailLoopKey(assignment.second) && bootProbeByEmail.get(emailLoopKey(assignment.second))) ||
        (assignment.second ? getCachedVerifiedProbe(assignment.second) : null);
      const detailBits = [
        assignment.primary ? `PRIMARY ${maskSensitive(assignment.primary)}=${assignment.primaryState}` : null,
        assignment.second ? `SECONDARY ${maskSensitive(assignment.second)}=${assignment.secondState}` : null,
      ].filter(Boolean);
      const why =
        (primaryProbe && !probeAccountUsable(primaryProbe) && primaryProbe.message) ||
        (secondProbe && !probeAccountUsable(secondProbe) && secondProbe.message) ||
        '';
      planMeta.textContent = why ? `${detailBits.join(' · ')} · ${why}` : detailBits.join(' · ');
      planMeta.title = planMeta.textContent;
    }
    plan.append(planTitle, planMain, planMeta);
    accountRows.appendChild(plan);

    const loginBadge = document.createElement('span');
    loginBadge.className = `badge ${
      !assignment.ready ? 'warn' : assignment.via === 'second' ? 'warn' : 'success'
    }`;
    loginBadge.textContent = assignment.ready
      ? `Login: ${assignment.viaLabel}`
      : 'Login blocked';
    badgeRow.appendChild(loginBadge);
  }

  syncTemplateControls();
  renderFilesList(sendable, {
    skippedCount: templateMode === 'daily' ? skipped.length : 0,
    emptyMessage:
      templateMode === 'weekly'
        ? `No ${weeklyLeague} weekly update file available.`
        : 'No sendable files for this inmate.',
    preserveKeys: preserveFileKeys,
  });

  const canLogin = Boolean(
    assignment?.ready || (primary?.email && primary?.password)
  );
  updateActionButtons({ canLogin });
}

async function loadWeeklyTemplate({ force = false } = {}) {
  if (templateMode !== 'weekly') return;
  if (!force && weeklyCache.league === weeklyLeague && weeklyCache.updates.length) {
    syncTemplateControls();
    const inmate = selectedInmate();
    if (inmate) renderAccountMeta(inmate);
    return;
  }
  weeklyLoading = true;
  syncTemplateControls();
  try {
    const result = await window.api.fetchExchangeWeekly({
      league: weeklyLeague,
      withCharacters: true,
    });
    if (!result?.ok) {
      weeklyCache = {
        league: weeklyLeague,
        updates: [],
        week_start: null,
        week_end: null,
        subject: weeklyLeague,
        message: result?.message || 'Weekly update unavailable',
      };
      toast(result?.message || 'Weekly update unavailable', 'warn');
      log(result?.message || 'Weekly update unavailable', 'warn');
    } else {
      weeklyCache = {
        league: weeklyLeague,
        updates: result.updates || [],
        week_start: result.week_start || null,
        week_end: result.week_end || null,
        subject: result.subject || weeklyLeague,
        message: result.message || '',
      };
      log(
        `Weekly ${weeklyLeague} loaded · ${weeklyCache.updates.length} file(s)` +
          (weeklyCache.week_start ? ` · ${weeklyCache.week_start} → ${weeklyCache.week_end}` : ''),
        'success'
      );
    }
  } catch (error) {
    weeklyCache = {
      league: weeklyLeague,
      updates: [],
      week_start: null,
      week_end: null,
      subject: weeklyLeague,
      message: error.message || String(error),
    };
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
  } finally {
    weeklyLoading = false;
    syncTemplateControls();
    const inmate = selectedInmate();
    if (inmate) renderAccountMeta(inmate);
  }
}

async function setTemplateMode(mode) {
  templateMode = mode === 'weekly' ? 'weekly' : 'daily';
  syncTemplateControls();
  if (templateMode === 'weekly') {
    // Always re-hit SportsData weekly API on click (e.g. ?league=CFB).
    await loadWeeklyTemplate({ force: true });
  } else {
    const inmate = selectedInmate();
    if (inmate) renderAccountMeta(inmate);
    else syncTemplateControls();
  }
}

async function setWeeklyLeague(league) {
  weeklyLeague = league === 'CFB' ? 'CFB' : 'NFL';
  syncTemplateControls();
  if (templateMode === 'weekly') {
    // Re-fetch even when the same league pill is clicked again.
    await loadWeeklyTemplate({ force: true });
  }
}

function inmateHasCorrlinksLogin(inmate) {
  return Boolean(inmate?.corrlinks_account?.email && inmate?.corrlinks_account?.password);
}

/**
 * Same account choice the send-loop regroup uses for a recipient.
 * When probes exist: primary if usable, else secondary if usable.
 * Before validation: plan primary (with secondary fallback at login).
 */
function resolveInmateLoginAssignment(inmate) {
  if (!inmate) return null;
  const primary = inmate.corrlinks_account || {};
  const second = inmate.second_corrlinks_account || {};
  const primaryKey = emailLoopKey(primary.email);
  const secondKey = emailLoopKey(second.email);
  const primaryProbe =
    (primaryKey && bootProbeByEmail.get(primaryKey)) ||
    (primary.email ? getCachedVerifiedProbe(primary.email) : null);
  const secondProbe =
    (secondKey && bootProbeByEmail.get(secondKey)) ||
    (second.email ? getCachedVerifiedProbe(second.email) : null);
  const hasProbes = bootProbeByEmail.size > 0 || verifiedCorrlinksAccounts.size > 0;

  const primaryState = primaryProbe?.state || (primary.email ? (hasProbes ? 'unchecked' : 'pending') : 'none');
  const secondState = second.email
    ? secondProbe?.state || (hasProbes ? 'unchecked' : 'pending')
    : 'none';

  let via = null;
  let email = null;
  let password = null;
  let ready = false;
  let pendingValidation = false;
  let reason = '';

  if (probeAccountUsable(primaryProbe) && primary.email && primary.password) {
    via = 'primary';
    email = primary.email;
    password = primary.password;
    ready = true;
  } else if (secondKey && second.password && probeAccountUsable(secondProbe)) {
    via = 'second';
    email = second.email;
    password = second.password;
    ready = true;
  } else if (!hasProbes && primary.email && primary.password) {
    via = 'primary';
    email = primary.email;
    password = primary.password;
    ready = true;
    pendingValidation = true;
    reason = second.email
      ? 'Not validated yet — will try PRIMARY, then SECONDARY if locked'
      : 'Not validated yet — will login PRIMARY';
  } else if (hasProbes) {
    reason =
      primary.email || second.email
        ? 'No usable CorrLinks account after validation'
        : 'No CorrLinks credentials';
  } else {
    reason = 'No primary CorrLinks credentials';
  }

  let groupSize = 1;
  let groupIndex = 1;
  let groupTotal = 1;
  if (email) {
    const probeMap = new Map(bootProbeByEmail);
    for (const [key, value] of verifiedCorrlinksAccounts.entries()) {
      if (!probeMap.has(key)) probeMap.set(key, value);
    }
    const regrouped = hasProbes
      ? regroupInmatesAfterProbe(accounts, probeMap)
      : groupInmatesByCorrlinksAccount(accounts);
    const groups = regrouped.groups || [];
    groupTotal = Math.max(1, groups.length);
    const key = emailLoopKey(email);
    const idx = groups.findIndex((g) => emailLoopKey(g.email) === key);
    if (idx >= 0) {
      groupIndex = idx + 1;
      groupSize = groups[idx].inmates?.length || 1;
    }
  }

  return {
    via,
    email,
    password,
    ready,
    pendingValidation,
    reason,
    primary: primary.email || null,
    second: second.email || null,
    primaryState,
    secondState,
    groupSize,
    groupIndex,
    groupTotal,
    viaLabel: via === 'second' ? 'SECONDARY' : via === 'primary' ? 'PRIMARY' : '—',
  };
}

function recipientLoopKey(inmate) {
  const id =
    inmate?.inmate_id != null && String(inmate.inmate_id).trim() !== ''
      ? String(inmate.inmate_id).trim()
      : inmate?.id != null && String(inmate.id).trim() !== ''
        ? String(inmate.id).trim()
        : '';
  return id ? id.toLowerCase() : '';
}

function emailLoopKey(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function inmateLoopLabel(inmate) {
  return `${inmate?.name || 'Inmate'} (${inmate?.inmate_id || inmate?.id || '?'})`;
}

function accountRoleLabel(account) {
  const roles = account?.roles || [];
  if (roles.includes('primary') && roles.includes('second')) return 'PRIMARY+SECONDARY';
  if (roles.includes('second')) return 'SECONDARY';
  return 'PRIMARY';
}

/** Every distinct CorrLinks login on the inmate list (primary vs secondary kept distinct). */
function collectUniqueCorrlinksAccounts(list = accounts) {
  const out = [];
  const indexByEmail = new Map();

  function add(email, password, role, inmate) {
    const key = emailLoopKey(email);
    if (!key || !password) return;
    if (!indexByEmail.has(key)) {
      indexByEmail.set(key, out.length);
      out.push({
        email: String(email).trim(),
        password,
        roles: [role],
        primaryFor: [],
        secondFor: [],
      });
    }
    const row = out[indexByEmail.get(key)];
    if (!row.roles.includes(role)) row.roles.push(role);
    const label = inmateLoopLabel(inmate);
    if (role === 'primary' && !row.primaryFor.includes(label)) row.primaryFor.push(label);
    if (role === 'second' && !row.secondFor.includes(label)) row.secondFor.push(label);
  }

  for (const inmate of list) {
    const primary = inmate?.corrlinks_account || {};
    const second = inmate?.second_corrlinks_account || {};
    add(primary.email, primary.password, 'primary', inmate);
    add(second.email, second.password, 'second', inmate);
  }
  return out;
}

function probeAccountUsable(probe) {
  return Boolean(
    probe && (probe.state === 'success' || (probe.state === 'locked' && probe.loggedIn))
  );
}

/** Infra / automation failures — must never permanently block Send from disk cache. */
function probeIsSoftFailure(probe) {
  if (!probe) return true;
  if (probeAccountUsable(probe)) return false;
  if (probe.state === 'locked' && !probe.loggedIn) return false;
  const msg = String(probe.message || '');
  if (/script failed to execute|object has been destroyed|webcontents.*destroy|navigation.*interrupt/i.test(msg)) {
    return true;
  }
  return probe.state === 'error' || probe.state === 'timeout' || probe.state === 'manual' || !probe.state;
}

/** Retry only soft failures (timeout/error) — not hard locks. */
function shouldRetryProbeLogin(probe) {
  if (probeAccountUsable(probe)) return false;
  if (!probe) return true;
  if (probe.state === 'locked' && !probe.loggedIn) return false;
  // Soft failures (incl. persisted "Script failed to execute") always retry.
  if (probeIsSoftFailure(probe)) return true;
  if (probe?.cached || probe?.persistent) return false;
  return true;
}

function rememberVerifiedAccount(email, status = {}) {
  const key = emailLoopKey(email || status.email);
  if (!key || !probeAccountUsable(status)) return;
  verifiedCorrlinksAccounts.set(key, {
    state: status.state || 'success',
    loggedIn: status.loggedIn !== false,
    email: status.email || email,
    message: status.message || 'Verified earlier this session',
    attempt: status.attempt || null,
    usedSecondAccount: Boolean(status.usedSecondAccount),
    verifiedAt: Date.now(),
    cached: true,
    persistent: Boolean(status.persistent),
  });
}

function getCachedVerifiedProbe(email) {
  const key = emailLoopKey(email);
  if (!key) return null;
  const hit = verifiedCorrlinksAccounts.get(key);
  if (!hit) return null;
  // Disk-backed probes stay valid until corrlinks-accounts fingerprint changes.
  if (!hit.persistent && Date.now() - Number(hit.verifiedAt || 0) > VERIFIED_ACCOUNT_TTL_MS) {
    verifiedCorrlinksAccounts.delete(key);
    return null;
  }
  return { ...hit };
}

function clearVerifiedAccounts() {
  verifiedCorrlinksAccounts.clear();
}

async function computeAccountsFingerprint(inmateList = accounts) {
  if (!window.api?.fingerprintCorrlinksAccounts) return null;
  const result = await window.api.fingerprintCorrlinksAccounts(inmateList || []);
  return result?.fingerprint || null;
}

function restoreVerifiedFromPersistedProbes(probes = {}, uniqueAccounts = []) {
  clearVerifiedAccounts();
  const map = new Map();
  for (const account of uniqueAccounts) {
    const key = emailLoopKey(account.email);
    const saved = probes?.[key];
    if (!saved || typeof saved !== 'object') continue;
    const entry = {
      state: saved.state || 'error',
      loggedIn: Boolean(saved.loggedIn),
      email: saved.email || account.email,
      message: saved.message || 'Restored from saved validation',
      attempt: saved.attempt || null,
      usedSecondAccount: Boolean(saved.usedSecondAccount),
      verifiedAt: Number(saved.verifiedAt) || Date.now(),
      cached: true,
      persistent: true,
    };
    // Soft infra failures must not restore as final — they permanently block Send.
    if (probeIsSoftFailure(entry)) continue;
    if (probeAccountUsable(entry)) {
      verifiedCorrlinksAccounts.set(key, entry);
    }
    map.set(key, { ...entry });
  }
  bootProbeByEmail = map;
  return map;
}

function persistedCacheCoversAccounts(probes = {}, uniqueAccounts = []) {
  if (!uniqueAccounts.length) return true;
  return uniqueAccounts.every((account) => {
    const key = emailLoopKey(account.email);
    const saved = probes?.[key];
    if (!saved || typeof saved !== 'object') return false;
    // "Script failed to execute" / timeout / error do not cover — force live re-probe.
    return !probeIsSoftFailure(saved);
  });
}

async function persistVerifiedAccountsCache(fingerprint, probeByEmail = bootProbeByEmail) {
  if (!fingerprint || !window.api?.saveCorrlinksVerifyCache) return false;
  const probes = {};
  for (const [key, value] of probeByEmail.entries()) {
    if (probeIsSoftFailure(value)) continue;
    probes[key] = {
      ...value,
      persistent: true,
    };
  }
  // Also keep usable session cache entries.
  for (const [key, value] of verifiedCorrlinksAccounts.entries()) {
    if (!probes[key] && !probeIsSoftFailure(value)) {
      probes[key] = { ...value, persistent: true };
    }
  }
  const saved = await window.api.saveCorrlinksVerifyCache({ fingerprint, probes });
  if (saved?.ok) {
    lastAccountsFingerprint = fingerprint;
    // Mark in-memory probes as persistent after disk save.
    for (const [key, value] of verifiedCorrlinksAccounts.entries()) {
      verifiedCorrlinksAccounts.set(key, { ...value, persistent: true });
    }
    return true;
  }
  return false;
}

/**
 * If live corrlinks-accounts credentials match the saved fingerprint, restore probes and skip login validation.
 * Fingerprint covers every inmate’s primary/second email+password assignment (not exchange files).
 * @returns {Promise<boolean>} true when validation was skipped
 */
async function tryRestoreVerifiedFromDisk(uniqueAccounts = collectUniqueCorrlinksAccounts()) {
  if (!window.api?.loadCorrlinksVerifyCache) return false;
  const fingerprint = await computeAccountsFingerprint(accounts);
  lastAccountsFingerprint = fingerprint;
  if (!fingerprint) return false;

  const cache = await window.api.loadCorrlinksVerifyCache();
  if (!cache?.ok) {
    log('No saved CorrLinks validation — will validate', 'info');
    return false;
  }
  if (cache.fingerprint !== fingerprint) {
    log('Live corrlinks-accounts credentials changed — re-validating', 'info');
    return false;
  }
  if (!persistedCacheCoversAccounts(cache.probes, uniqueAccounts)) {
    log('Saved validation incomplete for current accounts — re-validating', 'warn');
    return false;
  }

  restoreVerifiedFromPersistedProbes(cache.probes, uniqueAccounts);
  const ok = [...bootProbeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
  const fail = uniqueAccounts.length - ok;
  // A saved "all failed" cache must not permanently block Send — re-probe live.
  if (ok === 0 && uniqueAccounts.length > 0) {
    log('Saved validation has no usable accounts — re-validating live', 'warn');
    clearVerifiedAccounts();
    bootProbeByEmail = new Map();
    accountsVerifiedOnce = false;
    return false;
  }
  accountsVerifiedOnce = true;
  const summary =
    fail > 0
      ? `Accounts unchanged · using saved validation · ${ok} ready · ${fail} unavailable`
      : `Accounts unchanged · using saved validation · ${ok} accounts ready`;
  log(summary, fail > 0 ? 'warn' : 'success');
  toast(summary, fail > 0 ? 'warn' : 'success');
  setStatusHint(summary);
  updateActionButtons();
  return true;
}

/**
 * Pre-probe preview: group by primary email only.
 * @returns {{
 *   groups: Array<{ email: string, password: string, secondEmail: string|null, secondPassword: string|null, inmates: any[] }>,
 *   duplicates: Array<{ key: string, name: string, keptUnder: string, ignoredUnder: string }>,
 * }}
 */
function groupInmatesByCorrlinksAccount(list = accounts) {
  const groups = [];
  const indexByEmail = new Map();
  const seenRecipients = new Map();
  const duplicates = [];

  for (const inmate of list) {
    if (!inmateHasCorrlinksLogin(inmate)) continue;
    const keyEmail = emailLoopKey(inmate.corrlinks_account.email);
    if (!keyEmail) continue;

    const key = recipientLoopKey(inmate);
    if (key && seenRecipients.has(key)) {
      duplicates.push({
        key,
        name: inmate.name || 'Inmate',
        keptUnder: seenRecipients.get(key),
        ignoredUnder: keyEmail,
      });
      continue;
    }

    if (!indexByEmail.has(keyEmail)) {
      indexByEmail.set(keyEmail, groups.length);
      const second = inmate.second_corrlinks_account || {};
      groups.push({
        email: inmate.corrlinks_account.email,
        password: inmate.corrlinks_account.password,
        secondEmail: second.email || null,
        secondPassword: second.password || null,
        inmates: [],
      });
    }

    const group = groups[indexByEmail.get(keyEmail)];
    group.inmates.push(inmate);
    if (key) seenRecipients.set(key, keyEmail);

    if (!group.secondEmail && inmate.second_corrlinks_account?.email) {
      group.secondEmail = inmate.second_corrlinks_account.email;
      group.secondPassword = inmate.second_corrlinks_account.password || null;
    }
  }

  return { groups, duplicates };
}

/**
 * After probing every account, assign each inmate to a usable login
 * (primary if OK, else second if OK). Dedupes recipients.
 */
function regroupInmatesAfterProbe(list = accounts, probeByEmail = new Map()) {
  const groups = [];
  const indexByEmail = new Map();
  const seenRecipients = new Map();
  const duplicates = [];
  const skipped = [];
  const assignments = [];

  for (const inmate of list) {
    if (!inmateHasCorrlinksLogin(inmate)) continue;

    const key = recipientLoopKey(inmate);
    const name = inmate.name || 'Inmate';
    const primary = inmate.corrlinks_account || {};
    const second = inmate.second_corrlinks_account || {};
    const primaryKey = emailLoopKey(primary.email);
    const secondKey = emailLoopKey(second.email);
    const primaryProbe = primaryKey ? probeByEmail.get(primaryKey) : null;
    const secondProbe = secondKey ? probeByEmail.get(secondKey) : null;

    let chosen = null;
    if (probeAccountUsable(primaryProbe)) {
      chosen = { email: primary.email, password: primary.password, via: 'primary' };
    } else if (secondKey && second.password && probeAccountUsable(secondProbe)) {
      chosen = { email: second.email, password: second.password, via: 'second' };
    }

    const assignmentBase = {
      key: key || String(inmate.id || ''),
      name,
      inmate,
      primary: primary.email || null,
      second: second.email || null,
      primaryState: primaryProbe?.state || (primary.email ? 'missing' : 'none'),
      secondState: second.email ? secondProbe?.state || 'missing' : 'none',
    };

    if (!chosen) {
      skipped.push(assignmentBase);
      continue;
    }

    const chosenKey = emailLoopKey(chosen.email);
    if (key && seenRecipients.has(key)) {
      duplicates.push({
        key,
        name,
        keptUnder: seenRecipients.get(key),
        ignoredUnder: chosenKey,
      });
      continue;
    }

    if (!indexByEmail.has(chosenKey)) {
      indexByEmail.set(chosenKey, groups.length);
      groups.push({
        email: chosen.email,
        password: chosen.password,
        secondEmail: null,
        secondPassword: null,
        via: chosen.via,
        inmates: [],
        assignments: [],
      });
    }

    const group = groups[indexByEmail.get(chosenKey)];
    group.inmates.push(inmate);
    const detail = {
      ...assignmentBase,
      via: chosen.via,
      usedEmail: chosen.email,
    };
    group.assignments.push(detail);
    assignments.push(detail);
    if (chosen.via === 'second') group.via = 'second';
    if (key) seenRecipients.set(key, chosenKey);
  }

  return { groups, duplicates, skipped, assignments };
}

function updateActionButtons({ canLogin } = {}) {
  const inmate = selectedInmate();
  const assignment = inmate ? resolveInmateLoginAssignment(inmate) : null;
  const loginOk =
    canLogin != null
      ? canLogin
      : Boolean(assignment?.ready || (inmate && inmateHasCorrlinksLogin(inmate)));
  const sendableCount = inmate ? selectedExchangeFiles(inmate).length : 0;
  const canSendSingle = Boolean(loginOk && sendableCount > 0 && assignment?.ready !== false);
  const hasLoopQueue = groupInmatesByCorrlinksAccount().groups.length > 0;
  const singleBusy = corrlinksLoginBusy && !loopRunning && !bootVerifyRunning;
  const canForceStop = loopRunning || corrlinksLoginBusy || bootVerifyRunning;
  const busy = loopRunning || corrlinksLoginBusy || bootVerifyRunning;
  // Compose-only stays available in code for loop helpers, but hidden from single-inmate UI.
  btnLogin.disabled = busy || !loginOk;
  btnLogin.hidden = true;
  btnLogin.title = 'Compose only is disabled — use Send all files';
  const loginLabel = btnLogin.querySelector('.btn-main-label');
  if (loginLabel) loginLabel.textContent = 'Compose only';
  if (btnSend) {
    btnSend.disabled = busy || !canSendSingle;
    btnSend.hidden = loopRunning || bootVerifyRunning;
    btnSend.title = !inmate
      ? 'Select an inmate first'
      : assignment && !assignment.ready
        ? assignment.reason || 'No usable CorrLinks account for this recipient'
        : !loginOk
          ? 'Select an inmate with CorrLinks credentials'
          : !sendableCount
            ? 'No sendable exchange files for this inmate'
            : corrlinksLoginBusy
              ? 'Auto-sending selected files…'
              : `Send via ${assignment?.viaLabel || 'PRIMARY'} ${maskSensitive(assignment?.email || '')} · ${sendableCount} file${sendableCount === 1 ? '' : 's'} (${platformShortcutLabel('Enter')})`;
    const sendLabel = btnSend.querySelector('.btn-send-label');
    if (sendLabel) {
      sendLabel.textContent =
        corrlinksLoginBusy && !loopRunning
          ? 'Sending…'
          : sendableCount > 1
            ? `Send all ${sendableCount} files`
            : 'Send message';
    }
  }
  btnStartLoop.disabled = busy || !hasLoopQueue || !accountsVerifiedOnce;
  btnStartLoop.hidden = loopRunning || singleBusy || bootVerifyRunning;
  btnStartLoop.title = !accountsVerifiedOnce
    ? 'Wait for account verification to finish'
    : hasLoopQueue
      ? 'Regroup recipients and auto-send to each (accounts already verified)'
      : 'Load inmates with CorrLinks credentials first';
  btnStopLoop.disabled = !canForceStop;
  btnStopLoop.hidden = !canForceStop;
  const stopLabel = btnStopLoop?.querySelector('.btn-stop-label');
  if (stopLabel) {
    stopLabel.textContent = loopRunning ? 'Stop loop' : 'Force stop';
  }
  btnStopLoop.title = loopRunning
    ? 'Force-stop the inmate loop'
    : bootVerifyRunning
      ? 'Cancel account validation'
      : 'Force-stop this CorrLinks login';
  actionsRow?.classList.toggle('is-looping', loopRunning);
  actionsRow?.classList.toggle('is-single-busy', singleBusy);
  if (inmateSearch) inmateSearch.disabled = busy || !accounts.length;
  if (btnRefresh) btnRefresh.disabled = busy;
  updateSessionPanel();
}

function clearLoopProgressStats() {
  if (loopProgressStats) {
    loopProgressStats.hidden = true;
    loopProgressStats.innerHTML = '';
  }
  if (loopProgressTime) {
    loopProgressTime.hidden = true;
    loopProgressTime.textContent = '';
  }
}

function clearLoopResultBanner() {
  lastLoopResult = null;
  setLoopProgress('');
  updateSessionPanel();
}

function setLoopProgress(text, opts = {}) {
  const isResult = Boolean(opts.result);
  if (!text && !opts.result) {
    setCorrPanelBusy(null);
    if (!loopProgress) return;
    loopProgress.hidden = true;
    loopProgress.classList.remove('is-result', 'is-warn', 'is-error', 'is-running');
    if (loopProgressTitle) loopProgressTitle.textContent = '';
    if (loopProgressIcon) loopProgressIcon.textContent = '';
    clearLoopProgressStats();
    return;
  }

  // Live progress lives in the CorrLinks header; result cards stay on the left.
  if (!isResult) {
    setCorrPanelBusy(text);
    if (loopProgress) {
      loopProgress.hidden = true;
      loopProgress.classList.remove('is-result', 'is-warn', 'is-error', 'is-running');
      clearLoopProgressStats();
    }
    return;
  }

  setCorrPanelBusy(null);
  if (!loopProgress) return;
  const level = opts.level || (opts.aborted ? 'warn' : 'success');
  const hideStats = Boolean(opts.hideStats);
  loopProgress.hidden = false;
  loopProgress.classList.toggle('is-result', true);
  loopProgress.classList.toggle('is-running', false);
  loopProgress.classList.toggle('is-warn', level === 'warn');
  loopProgress.classList.toggle('is-error', level === 'error');

  if (loopProgressIcon) {
    loopProgressIcon.textContent =
      level === 'error' ? '×' : level === 'warn' ? '!' : '✓';
  }
  if (loopProgressTitle) loopProgressTitle.textContent = text || '';

  if (!hideStats) {
    if (loopProgressTime) {
      loopProgressTime.hidden = false;
      loopProgressTime.textContent = opts.timestamp || formatDateTime();
    }
    if (loopProgressStats) {
      const stats = [
        { label: 'ok', value: opts.okCount ?? 0 },
        { label: 'failed', value: opts.failCount ?? 0 },
        { label: 'recipients', value: opts.recipientTotal ?? 0 },
      ];
      loopProgressStats.hidden = false;
      loopProgressStats.innerHTML = stats
        .map(
          (stat) =>
            `<span class="loop-stat"><strong class="tabular">${Number(stat.value).toLocaleString()}</strong> ${stat.label}</span>`
        )
        .join('');
    }
  } else {
    clearLoopProgressStats();
  }
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
        selectInmate(inmate.id);
        closeInmateOptions();
      });
      if (index === 0) optionHighlight = 0;
      inmateOptions.appendChild(li);
    });
  }
  inmateOptions.hidden = !open;
  inmateSearch.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.getElementById('inmateCombobox')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeInmateOptions() {
  inmateOptions.hidden = true;
  inmateSearch.setAttribute('aria-expanded', 'false');
  document.getElementById('inmateCombobox')?.setAttribute('aria-expanded', 'false');
  optionHighlight = -1;
}

function setInmateSelectedDisplay(inmate) {
  if (!inmateSelectedDisplay) return;
  if (!inmate) {
    inmateSelectedDisplay.hidden = true;
    if (inmateSelectedName) inmateSelectedName.textContent = '';
    if (inmateSelectedId) inmateSelectedId.textContent = '';
    inmateSearch?.removeAttribute('title');
    return;
  }
  const name = inmate.name || 'Inmate';
  const idLabel = String(inmate.inmate_id || inmate.id || '');
  if (inmateSelectedName) {
    inmateSelectedName.textContent = name;
    inmateSelectedName.title = name;
  }
  if (inmateSelectedId) {
    inmateSelectedId.textContent = idLabel ? `ID ${idLabel}` : '';
    inmateSelectedId.title = idLabel;
  }
  inmateSelectedDisplay.hidden = false;
  inmateSearch.title = idLabel ? `${name} (${idLabel})` : name;
}

function syncInmateComboboxDisplay({ editing = false } = {}) {
  const inmate = selectedInmate();
  const showSelected = Boolean(inmate) && !editing;
  if (inmateSearch) {
    inmateSearch.classList.toggle('is-displaying-selected', showSelected);
    if (showSelected) {
      inmateSearch.value = '';
      // Empty value would reveal the placeholder under the selected overlay.
      inmateSearch.placeholder = '';
    } else {
      inmateSearch.placeholder = 'Search name, ID, or email…';
    }
  }
  setInmateSelectedDisplay(showSelected ? inmate : null);
  if (btnClearInmate) {
    // Show clear while a selection exists (overlay or focused editing with a bound id).
    btnClearInmate.hidden = !inmate;
  }
}

function clearInmateSelection({ keepEditing = false } = {}) {
  accountSelect.value = '';
  selectedFileKeys = [];
  if (inmateSearch) inmateSearch.value = '';
  syncInmateComboboxDisplay({ editing: keepEditing });
  renderAccountMeta(null);
  setStepState({
    inmateDone: false,
    composeDone: Boolean(composePreview.to || composePreview.subject),
    active: 1,
  });
  updateActionButtons();
}

function selectInmate(id) {
  if (id == null || id === '') {
    clearInmateSelection({ keepEditing: false });
    renderInmateOptions(accounts, { open: false });
    return;
  }
  const inmate = accounts.find((a) => String(a.id) === String(id));
  accountSelect.value = inmate ? String(inmate.id) : '';
  selectedFileKeys = [];
  syncInmateComboboxDisplay({ editing: false });
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
}

function accountsContentSnapshot(list = accounts) {
  try {
    return JSON.stringify(
      (Array.isArray(list) ? list : []).map((inmate) => ({
        id: inmate?.id ?? null,
        name: inmate?.name || '',
        inmate_id: inmate?.inmate_id ?? null,
        status: inmate?.status || '',
        facility: inmate?.facility || null,
        corrlinks_account: inmate?.corrlinks_account || null,
        second_corrlinks_account: inmate?.second_corrlinks_account || null,
        inmate_exchange: inmate?.inmate_exchange || null,
      }))
    );
  } catch {
    return String(Date.now());
  }
}

function setInmateCountLabel(count) {
  if (!inmateCount) return;
  const n = Number(count) || 0;
  inmateCount.textContent = `${n} inmate${n === 1 ? '' : 's'}`;
}

function syncInmateEmptyState() {
  const empty = !accounts.length;
  if (inmateEmpty) inmateEmpty.hidden = !empty;
  if (inmateCombobox) inmateCombobox.hidden = empty;
}

function renderAccounts(list) {
  accounts = Array.isArray(list) ? list : [];
  lastAccountsSnapshot = accountsContentSnapshot(accounts);
  selectedFileKeys = [];
  setInmateCountLabel(accounts.length);
  syncInmateEmptyState();
  if (!accounts.length) {
    accountSelect.value = '';
    inmateSearch.value = '';
    syncInmateComboboxDisplay({ editing: false });
    renderAccountMeta(null);
    renderInmateOptions([], { open: false });
    updateActionButtons({ canLogin: false });
    return;
  }
  const preferred = selectedInmate() || accounts[0];
  // Prefill first inmate + check all files, but don't auto-send until user picks one.
  selectInmate(preferred.id);
  renderInmateOptions(accounts, { open: false });
  updateActionButtons();
}

/**
 * Apply a live corrlinks-accounts payload without resetting the user's selection.
 * @returns {{ changed: boolean, added: number, removed: number }}
 */
function applyAccountsLive(list) {
  const next = Array.isArray(list) ? list : [];
  const snapshot = accountsContentSnapshot(next);
  if (snapshot === lastAccountsSnapshot && accounts.length === next.length) {
    return { changed: false, added: 0, removed: 0 };
  }

  const prevIds = new Set(accounts.map((a) => String(a.id)));
  const nextIds = new Set(next.map((a) => String(a.id)));
  const added = [...nextIds].filter((id) => !prevIds.has(id)).length;
  const removed = [...prevIds].filter((id) => !nextIds.has(id)).length;
  const prevSelectedId = accountSelect?.value || '';
  const prevFileKeys = selectedFileKeys.slice();
  const dropdownOpen = Boolean(inmateOptions && !inmateOptions.hidden);

  accounts = next;
  lastAccountsSnapshot = snapshot;
  setInmateCountLabel(accounts.length);
  inmateSearch.disabled = !accounts.length;
  syncInmateEmptyState();

  if (!accounts.length) {
    accountSelect.value = '';
    if (inmateSearch) inmateSearch.value = '';
    syncInmateComboboxDisplay({ editing: false });
    renderAccountMeta(null);
    renderInmateOptions([], { open: false });
    updateActionButtons({ canLogin: false });
    return { changed: true, added, removed };
  }

  const stillSelected = accounts.find((a) => String(a.id) === String(prevSelectedId));
  if (stillSelected) {
    accountSelect.value = String(stillSelected.id);
    syncInmateComboboxDisplay({ editing: dropdownOpen && document.activeElement === inmateSearch });
    renderAccountMeta(stillSelected, { preserveFileKeys: prevFileKeys });
  } else if (prevSelectedId) {
    // Selection disappeared from SportsData — clear rather than silently jump.
    clearInmateSelection({ keepEditing: false });
  } else {
    selectInmate(accounts[0].id);
  }

  renderInmateOptions(
    filterAccounts(inmateSearchQuery()),
    { open: dropdownOpen }
  );
  updateActionButtons();
  return { changed: true, added, removed };
}

function stopAccountsAutoRefresh() {
  if (accountsAutoRefreshTimer) {
    clearInterval(accountsAutoRefreshTimer);
    accountsAutoRefreshTimer = null;
  }
}

function startAccountsAutoRefresh() {
  stopAccountsAutoRefresh();
  if (mainShell?.hidden) return;
  accountsAutoRefreshTimer = setInterval(() => {
    void syncCorrlinksAccountsQuiet({ reason: 'interval' });
  }, ACCOUNTS_AUTO_REFRESH_MS);
}

/**
 * Quiet re-fetch of SportsData corrlinks-accounts. Keeps the inmate picker current
 * without toasts; re-validates CorrLinks only when credentials change.
 */
async function syncCorrlinksAccountsQuiet({ reason = 'poll', force = false } = {}) {
  if (accountsAutoRefreshBusy) return { ok: false, skipped: 'busy' };
  if (mainShell?.hidden || loginScreen?.hidden === false) return { ok: false, skipped: 'login' };
  if (!force && (bootVerifyRunning || loopRunning || corrlinksLoginBusy)) {
    return { ok: false, skipped: 'ops' };
  }
  if (btnRefresh?.classList.contains('loading')) return { ok: false, skipped: 'manual' };
  if (
    !force &&
    reason === 'focus' &&
    Date.now() - lastAccountsQuietSyncAt < ACCOUNTS_FOCUS_MIN_GAP_MS
  ) {
    return { ok: false, skipped: 'throttle' };
  }

  accountsAutoRefreshBusy = true;
  try {
    const result = await window.api.refreshAccounts();
    lastAccountsQuietSyncAt = Date.now();
    if (!result?.ok) {
      setSportsConnected(false);
      if (reason === 'focus' || reason === 'preflight') {
        log(result?.message || 'corrlinks-accounts refresh failed', 'warn');
      }
      return { ok: false, message: result?.message };
    }

    setSportsConnected(true);
    const prevFingerprint = lastAccountsFingerprint;
    const diff = applyAccountsLive(result.accounts || []);
    const nextFingerprint = await computeAccountsFingerprint(accounts);
    const credentialsChanged =
      Boolean(nextFingerprint) &&
      Boolean(prevFingerprint) &&
      nextFingerprint !== prevFingerprint;

    if (diff.changed) {
      const bits = [];
      if (diff.added) bits.push(`+${diff.added}`);
      if (diff.removed) bits.push(`-${diff.removed}`);
      log(
        `corrlinks-accounts updated (${result.accounts.length} inmate${
          result.accounts.length === 1 ? '' : 's'
        }${bits.length ? ` · ${bits.join(' ')}` : ''})`,
        'info'
      );
      setStatusHint(`${result.accounts.length} inmates ready`);
      setStepState({
        inmateDone: Boolean(selectedInmate()),
        composeDone: Boolean(composePreview.to || composePreview.subject),
        active: selectedInmate() ? 1 : 1,
      });
    }

    lastAccountsFingerprint = nextFingerprint || lastAccountsFingerprint;

    if (credentialsChanged && !bootVerifyRunning && !loopRunning && !corrlinksLoginBusy) {
      clearVerifiedAccounts();
      bootProbeByEmail = new Map();
      accountsVerifiedOnce = false;
      log('Live corrlinks-accounts credentials changed — re-validating', 'info');
      await verifyCorrlinksAccountsOnBoot({ force: true });
    }

    return { ok: true, changed: diff.changed, accounts: result.accounts };
  } catch (error) {
    setSportsConnected(false);
    if (reason === 'focus' || reason === 'preflight') {
      log(error.message || String(error), 'warn');
    }
    return { ok: false, message: error.message || String(error) };
  } finally {
    accountsAutoRefreshBusy = false;
  }
}

/**
 * Single inmate run: CorrLinks login + compose, optionally auto-send.
 * @param {{ quietToast?: boolean, send?: boolean }} [options]
 * @returns {Promise<object|null>} status or null if skipped/busy
 */
function corrlinksOpStillActive(generation) {
  return !corrlinksForceStop && generation === corrlinksOpGeneration;
}

async function startCorrlinksLogin(options = {}) {
  const { quietToast = false, send = false } = options;
  const inmate = selectedInmate();
  if (!inmate) {
    log('Select an inmate first', 'error');
    return null;
  }
  const assignment = resolveInmateLoginAssignment(inmate);
  if (!assignment?.ready) {
    const message = assignment?.reason || 'Selected inmate has no usable CorrLinks account';
    log(message, 'error');
    if (!quietToast) toast(message, 'error');
    return null;
  }
  if (corrlinksLoginBusy) return null;

  // Prefetch TXT in parallel — never blocks opening the CorrLinks pane.
  if (send && window.api?.prefetchExchangeFiles) {
    const files = selectedExchangeFiles(inmate);
    if (files.length) {
      void window.api
        .prefetchExchangeFiles({
          inmateId: inmate.id,
          selectedFiles: selectedFileKeys.slice(),
          files,
        })
        .catch(() => {});
    }
  }
  // Keep roster fresh in the background (never blocks CorrLinks open).
  void syncCorrlinksAccountsQuiet({ reason: 'background' });

  // Await reveal so the website is painted before login/send IPC runs.
  // (Fire-and-forget left the pane on the empty placeholder until late.)
  corrlinksForceStop = false;
  const myGeneration = ++corrlinksOpGeneration;
  corrlinksLoginBusy = true;
  clearLoopResultBanner();
  updateActionButtons({ canLogin: true });
  setStatusHint(
    send
      ? `Sending via ${assignment.viaLabel}: ${inmate.name || inmate.inmate_id || inmate.id}…`
      : `CorrLinks ${assignment.viaLabel}: ${inmate.name || inmate.inmate_id || inmate.id}…`
  );
  // Mark embed live first — otherwise setCorrlinksConnected(false) flashes the empty placeholder.
  corrEmbedRevealed = true;
  setCorrPlaceholderVisible(false);
  setCorrPanelBusy(send ? 'Sending…' : 'Logging in…');
  setCorrlinksConnected(false, true);
  // Open the pane in parallel with login — do not wait for full page load before Send.
  const revealPromise = revealCorrlinksEmbed().catch(() => null);
  syncCorrPaneBounds();
  const template = buildTemplatePayload();
  if (template.mode === 'weekly' && !template.files?.length) {
    toast(`No ${weeklyLeague} weekly file loaded — pick Weekly update again`, 'error');
    corrlinksLoginBusy = false;
    setCorrPanelBusy(null);
    updateActionButtons();
    return null;
  }
  const files = selectedExchangeFiles(inmate);
  const checkedCount = files.length;
  log(
    `${send ? 'Send' : 'Login'} ${assignment.viaLabel} ${maskSensitive(assignment.email)}` +
      (assignment.pendingValidation && inmate.second_corrlinks_account?.email
        ? ` (fallback ${maskSensitive(inmate.second_corrlinks_account.email)} if locked)`
        : '') +
      ` · loop group ${assignment.groupIndex}/${assignment.groupTotal}` +
      (template.mode === 'weekly'
        ? ` · weekly ${template.league} · subject ${template.subject}`
        : checkedCount
          ? ` · ${checkedCount} exchange file(s) checked`
          : '') +
      (send
        ? ` · AUTO-SEND all ${files.length} file${files.length === 1 ? '' : 's'} (single inmate)`
        : ' · no send'),
    assignment.via === 'second' ? 'warn' : 'info'
  );
  if (send && files.length > 1) {
    files.forEach((file, index) => {
      log(
        `  ${index + 1}/${files.length}: ${file.filename || `part-${file.part || index + 1}`}` +
          (file.characters != null ? ` (${Number(file.characters).toLocaleString()} chars)` : ''),
        'info'
      );
    });
  }
  const loginPlan = {
    preferVia: assignment.pendingValidation ? null : assignment.via,
    loginEmail: assignment.pendingValidation ? null : assignment.email,
  };
  try {
    // Give the pane a brief head start, then login immediately (don't block on warm).
    await Promise.race([
      revealPromise,
      new Promise((r) => setTimeout(r, 40)),
    ]);
    if (!corrlinksOpStillActive(myGeneration)) {
      corrlinksLoginBusy = false;
      setCorrPanelBusy(null);
      updateActionButtons();
      return { state: 'aborted', message: 'Force-stopped' };
    }
    const result = send
      ? await window.api.sendCorrlinksInmate({
          inmateId: inmate.id,
          selectedFiles: selectedFileKeys.slice(),
          template,
          ...loginPlan,
        })
      : await window.api.loginCorrlinks({
          inmateId: inmate.id,
          selectedFiles: selectedFileKeys.slice(),
          template,
          send: false,
          ...loginPlan,
        });
    if (!corrlinksOpStillActive(myGeneration)) {
      return { state: 'aborted', message: 'Force-stopped' };
    }
    handleLoginResult(result.status || {}, { quietToast });
    const status = result.status || {};
    if (send) {
      const summary = status.sendSummary;
      if (summary) {
        log(
          `Send finished · ${summary.sent}/${summary.total} sent` +
            (summary.failed ? ` · ${summary.failed} failed` : ''),
          summary.failed ? 'warn' : 'success'
        );
        if (!quietToast) {
          toast(
            summary.failed
              ? `Sent ${summary.sent}/${summary.total} · ${summary.failed} failed`
              : `Sent ${summary.sent} message${summary.sent === 1 ? '' : 's'}`,
            summary.failed ? 'warn' : 'success'
          );
        }
      } else if (!status.sent && !quietToast) {
        toast(status.message || 'Send did not complete', 'error');
      }
      setStatusHint(status.message || 'Send finished');
    } else {
      setStatusHint(status.message || 'Compose only (not sent)');
      if (!quietToast && status.bodyResult?.ok && !status.sent) {
        toast('Compose only — not sent. Use Send all files to deliver.', 'warn');
      }
    }
    return status;
  } catch (error) {
    if (!corrlinksOpStillActive(myGeneration)) {
      return { state: 'aborted', message: 'Force-stopped' };
    }
    log(error.message || String(error), 'error');
    if (!quietToast) toast(error.message || String(error), 'error');
    setCorrlinksConnected(false);
    return { state: 'error', message: error.message || String(error) };
  } finally {
    if (myGeneration === corrlinksOpGeneration || !corrlinksLoginBusy) {
      corrlinksLoginBusy = false;
      setCorrPanelBusy(null);
      updateActionButtons();
    }
  }
}

/** Single-inmate send for every selected exchange file. */
async function startCorrlinksSend(options = {}) {
  return startCorrlinksLogin({ ...options, send: true });
}

/** Gap between live account probes during initializing (skipped for cache hits). */
const LOOP_GAP_MS = 2_000;
/** Rest before retrying a skipped/failed CorrLinks login, and before compose re-login. */
const LOOP_RELOGIN_REST_MS = 3_000;

function buildLoopQueue() {
  return groupInmatesByCorrlinksAccount();
}

function logLoopPlan(groups, duplicates) {
  groups.forEach((group, i) => {
    const via = group.via === 'second' ? 'SECONDARY' : 'PRIMARY';
    log(
      `Plan · Account ${i + 1}/${groups.length}: ${maskSensitive(group.email)} [${via}]` +
        ` · ${group.inmates.length} recipient(s)`,
      via === 'SECONDARY' ? 'warn' : 'info'
    );
    const rows = group.assignments?.length
      ? group.assignments
      : group.inmates.map((inmate) => ({
          name: inmate.name || 'Inmate',
          key: inmate.inmate_id || inmate.id,
          via: group.via,
          primary: inmate.corrlinks_account?.email || null,
          second: inmate.second_corrlinks_account?.email || null,
          primaryState: '—',
          secondState: '—',
        }));
    rows.forEach((row, r) => {
      log(
        `  ${r + 1}. ${row.name} (${row.key})` +
          ` · use ${row.via === 'second' ? 'SECONDARY' : 'PRIMARY'} ${maskSensitive(row.usedEmail || group.email)}` +
          ` · PRIMARY ${maskSensitive(row.primary)}=${row.primaryState}` +
          (row.second ? ` · SECONDARY ${maskSensitive(row.second)}=${row.secondState}` : ' · SECONDARY none'),
        row.via === 'second' ? 'warn' : 'info',
        row
      );
    });
  });
  for (const dup of duplicates) {
    log(
      `Duplicate skipped · ${dup.name} (${dup.key}) already under ${maskSensitive(dup.keptUnder)}` +
        ` — ignored for ${maskSensitive(dup.ignoredUnder)}`,
      'warn',
      dup
    );
  }
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

/**
 * Full-screen CorrLinks cover while probing accounts (hides login verification UI).
 * @param {{ active?: boolean, status?: string, detail?: string, current?: number, total?: number, percent?: number }|null} [opts]
 */
function verifyingSessionActive() {
  return (bootVerifyRunning && !bootVerifyAbort) || (loopRunning && !loopAbort);
}

function setAppVerifyingProgress({ current = null, total = null, percent = null } = {}) {
  let value = percent;
  if (value == null && total != null && total > 0 && current != null) {
    value = Math.round((Math.max(0, Number(current)) / Number(total)) * 100);
  }
  if (value == null || Number.isNaN(value)) value = 0;
  value = Math.max(0, Math.min(100, value));
  if (appVerifyingProgressBar) appVerifyingProgressBar.style.width = `${value}%`;
  if (appVerifyingProgress) appVerifyingProgress.setAttribute('aria-valuenow', String(value));
  if (appVerifyingPercent) appVerifyingPercent.textContent = `${value}%`;
}

function clearVerifyProbeLive() {
  if (verifyProbeLiveTimer) {
    clearInterval(verifyProbeLiveTimer);
    verifyProbeLiveTimer = null;
  }
  verifyProbeLive = null;
  lastVerifyLiveLogKey = '';
  if (appVerifyingLive) appVerifyingLive.textContent = '';
}

function renderVerifyProbeLive(extraStep = null) {
  if (!verifyProbeLive || !appVerifyingLive) return;
  const elapsedSec = Math.max(0, Math.round((Date.now() - verifyProbeLive.startedAt) / 1000));
  const step = String(extraStep || verifyProbeLive.step || 'Working…').replace(/\s+/g, ' ').trim();
  // Keep one compact monitor row under Account N of M.
  const line = `${step} · ${elapsedSec}s`;
  appVerifyingLive.textContent = line;
  if (loopInitializingDetail && verifyProbeLive.indexLabel) {
    loopInitializingDetail.textContent = `${verifyProbeLive.indexLabel} · ${verifyProbeLive.accountLabel}`;
  }
}

function setVerifyProbeLive(ctx = null) {
  clearVerifyProbeLive();
  if (!ctx) return;
  verifyProbeLive = {
    indexLabel: ctx.indexLabel || '',
    accountLabel: ctx.accountLabel || '',
    statusLabel: ctx.statusLabel || '',
    current: ctx.current ?? null,
    total: ctx.total ?? null,
    step: ctx.step || 'Starting login…',
    startedAt: Date.now(),
  };
  renderVerifyProbeLive(verifyProbeLive.step);
  verifyProbeLiveTimer = setInterval(() => {
    if (!verifyingSessionActive() || !verifyProbeLive) {
      clearVerifyProbeLive();
      return;
    }
    renderVerifyProbeLive();
  }, 1000);
}

function pushVerifyProbeStep(message, { logLine = true } = {}) {
  if (!message || !verifyProbeLive) return;
  const step = String(message).replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!step) return;
  verifyProbeLive.step = step;
  renderVerifyProbeLive(step);
  if (!logLine) return;
  const key = `${verifyProbeLive.indexLabel}|${step}`;
  if (key === lastVerifyLiveLogKey) return;
  lastVerifyLiveLogKey = key;
  log(
    `${verifyProbeLive.indexLabel || 'Probe'} · ${verifyProbeLive.accountLabel || ''} · ${step}`.replace(
      /\s+·\s+$/,
      ''
    ),
    'info'
  );
}

function setLoopInitializingOverlay(opts = null) {
  if (!loopInitializing) return;
  if (!opts || opts.active === false) {
    loopInitializingActive = false;
    loopInitializing.hidden = true;
    loopInitializing.setAttribute('aria-busy', 'false');
    if (appVerifyingTitle) appVerifyingTitle.textContent = VERIFY_COPY.title;
    if (loopInitializingStatus) loopInitializingStatus.textContent = VERIFY_COPY.defaultStatus;
    if (loopInitializingDetail) loopInitializingDetail.textContent = '';
    clearVerifyProbeLive();
    setAppVerifyingProgress({ percent: 0 });
    syncCorrPaneBounds();
    return;
  }
  // Never resurrect the cover after Force stop / verify end.
  if (!verifyingSessionActive()) {
    loopInitializingActive = false;
    loopInitializing.hidden = true;
    loopInitializing.setAttribute('aria-busy', 'false');
    clearVerifyProbeLive();
    syncCorrPaneBounds();
    return;
  }
  // Keep countdown hidden under the initializing cover.
  setLoopCountdownOverlay();
  loopInitializingActive = true;
  loopInitializing.hidden = false;
  loopInitializing.setAttribute('aria-busy', 'true');
  if (appVerifyingTitle) {
    appVerifyingTitle.textContent = opts.title || VERIFY_COPY.title;
  }
  if (loopInitializingStatus) {
    loopInitializingStatus.textContent = opts.status || VERIFY_COPY.status;
  }
  if (loopInitializingDetail) {
    loopInitializingDetail.textContent = opts.detail || '';
  }
  if (opts.live != null) {
    if (opts.live) pushVerifyProbeStep(opts.live, { logLine: Boolean(opts.logLive) });
    else if (appVerifyingLive) appVerifyingLive.textContent = '';
  }
  if (opts.current != null || opts.total != null || opts.percent != null) {
    setAppVerifyingProgress({
      current: opts.current,
      total: opts.total,
      percent: opts.percent,
    });
  }
  // WebContentsView paints above HTML — collapse it so the login page never shows.
  hideCorrEmbedNow();
}

/** Quiet wait during init (updates initializing overlay, not account countdown). */
async function waitLoopInitGap(
  ms,
  { current, total, status = VERIFY_COPY.statusPause, detailPrefix, progressCurrent, progressTotal } = {}
) {
  const endsAt = Date.now() + ms;
  let lastShown = -1;
  const barCurrent = progressCurrent != null ? progressCurrent : current;
  const barTotal = progressTotal != null ? progressTotal : total;
  while (Date.now() < endsAt) {
    if (!verifyingSessionActive()) {
      setLoopInitializingOverlay(null);
      return false;
    }
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== lastShown) {
      lastShown = left;
      const detail =
        detailPrefix != null
          ? `${detailPrefix} · ${left}s remaining`
          : `${current} of ${total} checked · next in ${left}s`;
      setLoopInitializingOverlay({
        active: true,
        status,
        detail,
        current: barCurrent,
        total: barTotal,
      });
      setLoopProgress(`${status} · ${detail}`);
      setStatusHint(`${status} · ${left}s`);
      if (sessionNextRun) sessionNextRun.textContent = `${left}s`;
    }
    await sleep(Math.min(200, endsAt - Date.now()));
  }
  return verifyingSessionActive();
}

/**
 * Probe every unique CorrLinks account (boot init or leftover loop checks).
 * Applies session cache instantly, then live-probes only the rest.
 * Caches usable accounts so Start loop can skip re-verify.
 */
async function verifyAllCorrlinksAccounts({
  uniqueAccounts = null,
  isActive = () => verifyingSessionActive(),
  statusLabel = VERIFY_COPY.status,
} = {}) {
  const list = Array.isArray(uniqueAccounts) ? uniqueAccounts : collectUniqueCorrlinksAccounts();
  const probeTotal = list.length;
  /** @type {Map<string, object>} */
  const probeByEmail = new Map();
  if (!probeTotal) {
    return { probeByEmail, probeOk: 0, probeFail: 0, probeTotal: 0, aborted: false };
  }

  // Fast path: reuse TTL-valid probes without waiting or re-login.
  const pending = [];
  for (const account of list) {
    const cached = getCachedVerifiedProbe(account.email);
    if (cached) {
      probeByEmail.set(emailLoopKey(account.email), cached);
    } else {
      pending.push(account);
    }
  }
  const cachedCount = probeTotal - pending.length;
  if (cachedCount > 0) {
    log(`Fast validation · ${cachedCount}/${probeTotal} already verified this session`, 'info');
    setLoopInitializingOverlay({
      active: true,
      status: statusLabel,
      detail:
        pending.length === 0
          ? `All ${probeTotal} accounts ready`
          : `${cachedCount} cached · checking ${pending.length} remaining`,
      current: cachedCount,
      total: probeTotal,
    });
  }
  if (!pending.length) {
    const probeOk = [...probeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
    return {
      probeByEmail,
      probeOk,
      probeFail: probeTotal - probeOk,
      probeTotal,
      aborted: false,
    };
  }

  async function probeAccountLive(account, { indexLabel, current, total }) {
    if (!isActive()) return false;
    const accountLabel = maskSensitive(account.email);
    const roleTag = accountRoleLabel(account);
    const key = emailLoopKey(account.email);
    setVerifyProbeLive({
      indexLabel,
      accountLabel,
      statusLabel,
      current,
      total,
      step: 'Starting CorrLinks login…',
    });
    setLoopInitializingOverlay({
      active: true,
      status: statusLabel,
      detail: `${indexLabel} · ${accountLabel}`,
      current,
      total,
    });
    setLoopProgress(`${statusLabel} · ${indexLabel}`);
    setStatusHint(`${statusLabel} · ${indexLabel}`);
    log(`—— ${indexLabel}: ${accountLabel} [${roleTag}] ——`, 'info');
    if (account.primaryFor?.length) {
      log(`  PRIMARY for: ${account.primaryFor.join('; ')}`, 'info');
    }
    if (account.secondFor?.length) {
      log(`  SECONDARY for: ${account.secondFor.join('; ')}`, 'info');
    }

    const PROBE_DEADLINE_MS = 90_000;
    async function loginWithDeadline() {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, PROBE_DEADLINE_MS);
      try {
        const status = await Promise.race([
          startCorrlinksAccountLogin(
            {
              email: account.email,
              password: account.password,
              secondEmail: null,
              secondPassword: null,
            },
            { quietToast: true }
          ),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  state: 'timeout',
                  message: `Probe timed out after ${PROBE_DEADLINE_MS / 1000}s`,
                }),
              PROBE_DEADLINE_MS
            )
          ),
        ]);
        if (timedOut || status?.state === 'timeout') {
          pushVerifyProbeStep('Timed out — resetting panel…');
          await forceResetCorrlinksPanel();
        }
        return status;
      } finally {
        clearTimeout(timer);
      }
    }

    let status = await loginWithDeadline();
    // Electron "Script failed to execute" is infra noise — reset panel and retry once.
    if (
      isActive() &&
      status &&
      !probeAccountUsable(status) &&
      /script failed to execute|object has been destroyed/i.test(String(status.message || ''))
    ) {
      log(`Probe infra glitch · ${accountLabel} — resetting panel and retrying once`, 'warn');
      pushVerifyProbeStep('Infra glitch — retrying once…');
      await forceResetCorrlinksPanel();
      if (!isActive()) {
        clearVerifyProbeLive();
        return false;
      }
      status = await loginWithDeadline();
    }
    if (!isActive()) {
      clearVerifyProbeLive();
      return false;
    }

    probeByEmail.set(key, status || { state: 'error', message: 'No status' });
    const usable = probeAccountUsable(status);
    if (usable) rememberVerifiedAccount(account.email, status);
    pushVerifyProbeStep(
      usable
        ? status.state === 'locked'
          ? 'Locked but session usable'
          : 'Probe OK'
        : `Failed${status?.message ? `: ${status.message}` : ''}`,
      { logLine: false }
    );
    log(
      usable
        ? `Probe OK · ${accountLabel} [${roleTag}]` +
            (status.state === 'locked' ? ' (locked but session usable)' : '')
        : `Probe failed · ${accountLabel} [${roleTag}]` +
            (status?.state ? ` · ${status.state}` : '') +
            (status?.message ? `: ${status.message}` : ''),
      usable ? (status.state === 'locked' ? 'warn' : 'success') : 'error'
    );

    await forceResetCorrlinksPanel();
    clearVerifyProbeLive();
    if (!isActive()) return usable;
    setLoopInitializingOverlay({
      active: true,
      status: statusLabel,
      detail: indexLabel,
      current,
      total,
    });
    hideCorrEmbedNow();
    return usable;
  }

  for (let i = 0; i < pending.length; i += 1) {
    if (!isActive()) {
      const probeOk = [...probeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
      return {
        probeByEmail,
        probeOk,
        probeFail: probeTotal - probeOk,
        probeTotal,
        aborted: true,
      };
    }
    const step = cachedCount + i + 1;
    await probeAccountLive(pending[i], {
      indexLabel: `Account ${step} of ${probeTotal}`,
      current: step,
      total: probeTotal,
    });
    if (!isActive()) break;
    // Only pause between live logins (not after cache / last account).
    if (i < pending.length - 1 && isActive()) {
      log(`Waiting ${LOOP_GAP_MS / 1000}s before next account probe…`, 'info');
      const continued = await waitLoopInitGap(LOOP_GAP_MS, {
        current: step,
        total: probeTotal,
        status: VERIFY_COPY.statusPause,
        progressCurrent: step,
        progressTotal: probeTotal,
      });
      if (!continued || !isActive()) break;
    }
  }

  if (!isActive()) {
    const probeOk = [...probeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
    return { probeByEmail, probeOk, probeFail: probeTotal - probeOk, probeTotal, aborted: true };
  }

  const failedAccounts = pending.filter((account) =>
    shouldRetryProbeLogin(probeByEmail.get(emailLoopKey(account.email)))
  );
  const lockedSkipped = pending.filter((account) => {
    const status = probeByEmail.get(emailLoopKey(account.email));
    return status?.state === 'locked' && !probeAccountUsable(status);
  });
  if (lockedSkipped.length) {
    log(
      `Not retrying ${lockedSkipped.length} locked account(s): ` +
        lockedSkipped.map((a) => maskSensitive(a.email)).join(', '),
      'warn'
    );
  }
  if (failedAccounts.length && isActive()) {
    log(
      `Retrying ${failedAccounts.length} non-locked failed account(s) after ${LOOP_RELOGIN_REST_MS / 1000}s rest…`,
      'warn'
    );
    for (let r = 0; r < failedAccounts.length; r += 1) {
      if (!isActive()) break;
      const account = failedAccounts[r];
      const accountLabel = maskSensitive(account.email);
      log(
        `Resting ${LOOP_RELOGIN_REST_MS / 1000}s before login retry · ${accountLabel} (${r + 1}/${failedAccounts.length})`,
        'info'
      );
      const retryStep = r + 1;
      const rested = await waitLoopInitGap(LOOP_RELOGIN_REST_MS, {
        current: retryStep,
        total: failedAccounts.length,
        status: VERIFY_COPY.statusRetry,
        detailPrefix: `Retry ${retryStep} of ${failedAccounts.length}`,
        progressCurrent: probeTotal,
        progressTotal: probeTotal,
      });
      if (!rested || !isActive()) break;
      await probeAccountLive(account, {
        indexLabel: `Retry ${retryStep} of ${failedAccounts.length}`,
        current: probeTotal,
        total: probeTotal,
      });
    }
  }

  if (isActive() && probeTotal > 0) {
    setLoopInitializingOverlay({
      active: true,
      status: statusLabel,
      detail: `Finishing · ${probeTotal} of ${probeTotal}`,
      current: probeTotal,
      total: probeTotal,
    });
  }

  const probeOk = [...probeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
  const probeFail = probeTotal - probeOk;
  return {
    probeByEmail,
    probeOk,
    probeFail,
    probeTotal,
    aborted: !isActive(),
  };
}

async function verifyCorrlinksAccountsOnBoot({ force = false, mode = 'boot' } = {}) {
  if (bootVerifyRunning || loopRunning || corrlinksLoginBusy) return null;
  const uniqueAccounts = collectUniqueCorrlinksAccounts();
  const manual = mode === 'manual';
  if (!uniqueAccounts.length) {
    accountsVerifiedOnce = true;
    bootProbeByEmail = new Map();
    setStatusHint('No CorrLinks accounts to verify');
    return { probeByEmail: bootProbeByEmail, probeOk: 0, probeFail: 0, probeTotal: 0 };
  }
  if (accountsVerifiedOnce && !force) {
    // Still refresh probe map from cache for any new emails.
    const map = new Map();
    uniqueAccounts.forEach((account) => {
      const cached = getCachedVerifiedProbe(account.email);
      if (cached) map.set(emailLoopKey(account.email), cached);
    });
    if (map.size === uniqueAccounts.length) {
      bootProbeByEmail = map;
      const ok = [...map.values()].filter((s) => probeAccountUsable(s)).length;
      const fail = uniqueAccounts.length - ok;
      const summary =
        fail > 0
          ? `Accounts unchanged · using saved validation · ${ok} ready · ${fail} unavailable`
          : `Accounts unchanged · using saved validation · ${ok} accounts ready`;
      log(summary, fail > 0 ? 'warn' : 'success');
      toast(summary, fail > 0 ? 'warn' : 'success');
      setStatusHint(summary);
      return { probeByEmail: map, probeOk: ok, probeFail: fail, probeTotal: uniqueAccounts.length };
    }
  }

  bootVerifyRunning = true;
  bootVerifyAbort = false;
  updateActionButtons();
  const title = manual ? VERIFY_COPY.manualTitle : VERIFY_COPY.title;
  const statusLabel = manual ? VERIFY_COPY.manualStatus : VERIFY_COPY.status;
  log(
    `${manual ? 'Manual validation' : 'Workspace setup'} — validating ${uniqueAccounts.length} CorrLinks account(s)`,
    'info'
  );
  toast(
    manual
      ? 'Manual validation… re-checking CorrLinks accounts'
      : 'Preparing workspace… validating CorrLinks accounts',
    'info'
  );
  setLoopInitializingOverlay({
    active: true,
    title,
    status: statusLabel,
    detail: `Starting · ${uniqueAccounts.length} accounts`,
    current: 0,
    total: uniqueAccounts.length,
  });
  setStatusHint(manual ? 'Manual validation…' : 'Preparing workspace…');

  try {
    const result = await verifyAllCorrlinksAccounts({
      uniqueAccounts,
      isActive: () => bootVerifyRunning && !bootVerifyAbort,
      statusLabel,
    });
    bootProbeByEmail = result.probeByEmail;
    accountsVerifiedOnce = !result.aborted;
    if (!result.aborted) {
      const fingerprint = lastAccountsFingerprint || (await computeAccountsFingerprint(accounts));
      if (fingerprint) {
        const saved = await persistVerifiedAccountsCache(fingerprint, result.probeByEmail);
        if (saved) log('Saved CorrLinks validation for next launch', 'info');
      }
    }
    const summary = result.aborted
      ? `${manual ? 'Manual validation canceled' : 'Setup canceled'} · ${result.probeOk} ready · ${result.probeFail} unavailable`
      : manual
        ? result.probeFail > 0
          ? `Manual validation · ${result.probeOk} ready · ${result.probeFail} unavailable`
          : `Manual validation · ${result.probeOk} accounts ready`
        : `Workspace ready · ${result.probeOk} accounts available · ${result.probeFail} unavailable`;
    log(summary, result.probeFail || result.aborted ? 'warn' : 'success');
    toast(summary, result.probeFail || result.aborted ? 'warn' : 'success');
    setStatusHint(summary);
    return result;
  } finally {
    bootVerifyRunning = false;
    bootVerifyAbort = false;
    setLoopInitializingOverlay(null);
    hideCorrEmbedNow();
    updateActionButtons();
  }
}

/** Wait up to `ms` between CorrLinks accounts. Returns false if aborted. */
async function waitLoopGap(ms, { current, total, nextLabel }) {
  const endsAt = Date.now() + ms;
  let lastShown = -1;
  // Keep CorrLinks webview visible — don't use the pane countdown overlay (it zeros bounds).
  setLoopCountdownOverlay();
  while (Date.now() < endsAt) {
    if (loopAbort) {
      setLoopCountdownOverlay();
      return false;
    }
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== lastShown) {
      lastShown = left;
      const text = `Waiting ${left}s before next CorrLinks account · ${current}/${total} done · next: ${nextLabel}`;
      setLoopProgress(text);
      setStatusHint(text);
      if (sessionNextRun) sessionNextRun.textContent = `${left}s`;
    }
    await sleep(Math.min(200, endsAt - Date.now()));
  }
  setLoopCountdownOverlay();
  return !loopAbort;
}

function statusLooksGood(status, { requireSend = false } = {}) {
  if (!status) return false;
  if (requireSend) {
    return Boolean(
      status.sent ||
        (Number(status.sendSummary?.sent) > 0 && !status.sendSummary?.failed)
    );
  }
  return Boolean(
    status.state === 'success' ||
      (status.state === 'locked' && status.loggedIn) ||
      status.recipient?.ok ||
      status.bodyResult?.ok
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

  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  setStatusHint(`Logging in ${maskSensitive(group.email)}…`);
  setCorrPanelBusy('Logging in…');
  setCorrlinksConnected(false, true);
  // Loop path previously only synced bounds — never opened the native pane.
  await revealCorrlinksEmbed().catch(() => null);
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
      rememberVerifiedAccount(status.email || group.email, status);
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
        group.secondEmail
          ? `Primary locked and second login failed: ${status.message || 'locked'}`
          : `Account locked: ${status.message || 'locked'}`,
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
    setCorrPanelBusy(null);
    updateActionButtons();
  }
}

/**
 * Compose (+ Send) one recipient on the current CorrLinks session (no login).
 * Used by Start loop after the account is already logged in.
 */
async function startCorrlinksCompose(inmate, options = {}) {
  const { quietToast = false, send = true } = options;
  if (!inmate) return null;
  if (corrlinksLoginBusy) return null;

  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  const template = buildTemplatePayload();
  if (template.mode === 'weekly' && !template.files?.length) {
    corrlinksLoginBusy = false;
    updateActionButtons();
    toast(`No ${weeklyLeague} weekly file loaded — pick Weekly update again`, 'error');
    return null;
  }
  const label = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
  setStatusHint(send ? `Sending: ${label}…` : `Compose: ${label}…`);
  setCorrPanelBusy(send ? 'Sending…' : 'Composing…');
  await revealCorrlinksEmbed().catch(() => null);
  log(
    `${send ? 'Send' : 'Compose'} recipient ${label}` +
      (template.mode === 'weekly' ? ` · weekly ${template.league} · subject ${template.subject}` : '') +
      (send ? ' · auto-send all files' : ' · no send'),
    'info'
  );
  try {
    const result = await window.api.composeCorrlinksInmate({
      inmateId: inmate.id,
      template,
      send: Boolean(send),
    });
    handleLoginResult(result.status || {}, { quietToast });
    const status = result.status || null;
    if (send) {
      const summary = status?.sendSummary;
      if (summary) {
        log(
          `Send ${label} · ${summary.sent}/${summary.total} sent` +
            (summary.failed ? ` · ${summary.failed} failed` : ''),
          summary.failed ? 'warn' : 'success'
        );
      }
      setStatusHint(status?.message || (status?.sent ? 'Sent' : 'Send did not complete'));
    } else {
      setStatusHint(status?.message || 'Compose finished (not sent)');
    }
    return status;
  } catch (error) {
    log(error.message || String(error), 'error');
    if (!quietToast) toast(error.message || String(error), 'error');
    return { state: 'error', message: error.message || String(error) };
  } finally {
    corrlinksLoginBusy = false;
    setCorrPanelBusy(null);
    updateActionButtons();
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

/** Destroy CorrLinks panel so the next probe cannot inherit lock dialogs/toasts. */
async function forceResetCorrlinksPanel() {
  try {
    if (window.api?.forceStopCorrlinks) await window.api.forceStopCorrlinks();
    else if (window.api?.logoutCorrlinks) await window.api.logoutCorrlinks();
  } catch (_) {
    /* ignore */
  }
  setCorrlinksConnected(false);
  hideCorrEmbedNow();
  // Brief settle so Electron can tear down WebContents before the next probe.
  await sleep(150);
}

function loopStillActive(generation) {
  return loopRunning && !loopAbort && generation === loopGeneration;
}

async function startInmateLoop() {
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) return;
  // Pull latest inmate roster from SportsData before grouping the loop.
  await syncCorrlinksAccountsQuiet({ reason: 'preflight', force: true });
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) return;
  if (!accountsVerifiedOnce) {
    toast('Wait for account verification to finish', 'warn');
    await verifyCorrlinksAccountsOnBoot({ force: true });
    if (!accountsVerifiedOnce) return;
  }

  // Claim the loop immediately so double-clicks / weekly reload cannot start a second run.
  loopRunning = true;
  loopAbort = false;
  loopPhase = 'running';
  clearLoopResultBanner();
  const myGeneration = ++loopGeneration;
  updateActionButtons();

  const uniqueAccounts = collectUniqueCorrlinksAccounts();
  if (!uniqueAccounts.length) {
    loopRunning = false;
    loopPhase = 'idle';
    updateActionButtons();
    toast('No CorrLinks accounts with credentials', 'error');
    return;
  }
  if (templateMode === 'weekly') {
    if (!weeklyCache.updates?.length || weeklyCache.league !== weeklyLeague) {
      await loadWeeklyTemplate({ force: true });
    }
    if (!loopStillActive(myGeneration)) return;
    if (!weeklyCache.updates?.length) {
      loopRunning = false;
      loopPhase = 'error';
      updateActionButtons();
      toast(`No ${weeklyLeague} weekly file available`, 'error');
      return;
    }
  }

  const probeTotal = uniqueAccounts.length;
  let okCount = 0;
  let failCount = 0;
  let viaPrimary = 0;
  let viaSecondCount = 0;
  let viaFailed = 0;

  // ── Phase 1: reuse boot verification — do not re-check locks ──
  /** @type {Map<string, object>} */
  const probeByEmail = new Map();
  uniqueAccounts.forEach((account) => {
    const key = emailLoopKey(account.email);
    const cached =
      getCachedVerifiedProbe(account.email) ||
      bootProbeByEmail.get(key) ||
      null;
    if (cached) probeByEmail.set(key, cached);
    else {
      probeByEmail.set(key, {
        state: 'error',
        message: 'Not verified at startup',
        cached: false,
      });
    }
  });
  const probeOk = [...probeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
  const probeFail = probeTotal - probeOk;
  const probeSummary = `Using startup verify · ${probeOk} usable · ${probeFail} locked/failed · skip re-check`;
  log(`Loop start — ${probeSummary} · then regroup · then send`, 'info');
  toast(
    probeOk
      ? `Starting send loop · ${probeOk} verified account(s)`
      : 'No usable accounts from startup verify',
    probeOk ? 'success' : 'error'
  );
  setLoopProgress(probeSummary);
  setStatusHint(probeSummary);
  setLoopInitializingOverlay(null);

  if (!loopStillActive(myGeneration)) {
    return;
  }

  // ── Phase 2: regroup recipients onto usable accounts only ──
  const { groups, duplicates, skipped } = regroupInmatesAfterProbe(accounts, probeByEmail);
  log(
    `Phase 2 — regrouped into ${groups.length} usable account(s)` +
      (duplicates.length ? ` · ${duplicates.length} duplicate(s) skipped` : '') +
      (skipped.length ? ` · ${skipped.length} recipient(s) with no usable account` : ''),
    groups.length ? 'info' : 'error'
  );
  logLoopPlan(groups, duplicates);
  for (const row of skipped) {
    log(
      `Skipped · ${row.name} (${row.key})` +
        ` · PRIMARY ${maskSensitive(row.primary)}=${row.primaryState}` +
        (row.second
          ? ` · SECONDARY ${maskSensitive(row.second)}=${row.secondState}`
          : ' · SECONDARY none'),
      'warn',
      row
    );
  }

  failCount += skipped.length;
  const recipientTotal = groups.reduce((n, g) => n + g.inmates.length, 0) + skipped.length;

  if (!groups.length) {
    loopRunning = false;
    loopAbort = false;
    loopPhase = 'error';
    setLoopInitializingOverlay(null);
    setLoopCountdownOverlay();
    updateActionButtons();
    const none = 'No usable CorrLinks accounts after probe — skipped all recipients';
    setLoopProgress(none, {
      result: true,
      level: 'error',
      okCount: 0,
      failCount: skipped.length,
      recipientTotal: skipped.length,
    });
    setStatusHint(none);
    log(none, 'error');
    toast(none, 'error');
    return;
  }

  if (!loopStillActive(myGeneration)) return;

  // ── Open CorrLinks and send to each regrouped recipient ──
  const composeRecipientCount = recipientTotal - skipped.length;
  const planLines = [
    `========== REGROUPED SEND LOOP ==========`,
    `${groups.length} usable account(s) · ${composeRecipientCount} recipient(s) · auto-send`,
    '',
  ];
  groups.forEach((group, i) => {
    const via = group.via === 'second' ? 'SECONDARY' : 'PRIMARY';
    planLines.push(
      `Account ${i + 1}/${groups.length}: ${maskSensitive(group.email)} [${via}]`
    );
    planLines.push(`  recipients (${group.inmates.length}):`);
    const rows = group.assignments?.length
      ? group.assignments
      : group.inmates.map((inmate) => ({
          name: inmate.name || 'Inmate',
          key: inmate.inmate_id || inmate.id,
          via: group.via,
          usedEmail: group.email,
          primary: inmate.corrlinks_account?.email || null,
          second: inmate.second_corrlinks_account?.email || null,
          primaryState: '—',
          secondState: '—',
        }));
    rows.forEach((row, r) => {
      planLines.push(
        `    ${r + 1}. ${row.name} (${row.key})` +
          `\n       use ${row.via === 'second' ? 'SECONDARY' : 'PRIMARY'} ${maskSensitive(row.usedEmail || group.email)}` +
          `\n       PRIMARY ${maskSensitive(row.primary)} = ${row.primaryState}` +
          `\n       SECONDARY ${row.second ? `${maskSensitive(row.second)} = ${row.secondState}` : 'none'}`
      );
    });
    planLines.push('');
  });
  const planText = planLines.join('\n').trim();
  log(planText, 'info');

  // Verification done — open CorrLinks and start the regrouped send plan.
  setLoopInitializingOverlay(null);
  setLoopCountdownOverlay();
  await revealCorrlinksEmbed().catch(() => null);

  log(
    `Phase 3 — one login per account, then send to ${composeRecipientCount} recipient(s)`,
    'info'
  );
  toast(
    `Sending · ${groups.length} account(s) · ${composeRecipientCount} recipient(s)`,
    'success'
  );

  for (let i = 0; i < groups.length; i += 1) {
    if (!loopStillActive(myGeneration)) {
      log(`Send loop force-stopped after account ${i}/${groups.length}`, 'warn');
      break;
    }

    const group = groups[i];
    const viaSecond = group.via === 'second';
    const accountLabel = maskSensitive(group.email);

    // Rest before login so CorrLinks is not hammered between accounts.
    log(
      `Resting ${LOOP_RELOGIN_REST_MS / 1000}s before login · ${accountLabel} (${i + 1}/${groups.length})`,
      'info'
    );
    setLoopProgress(
      `Send account ${i + 1}/${groups.length} · ${accountLabel} · resting ${LOOP_RELOGIN_REST_MS / 1000}s…`
    );
    const rested = await waitLoopGap(LOOP_RELOGIN_REST_MS, {
      current: i,
      total: groups.length,
      nextLabel: accountLabel,
    });
    if (!rested || !loopStillActive(myGeneration)) {
      log(`Send loop stopped during rest before ${accountLabel}`, 'warn');
      break;
    }

    setLoopProgress(
      `Send account ${i + 1}/${groups.length} · ${accountLabel}` +
        (viaSecond ? ' (2nd)' : '') +
        ' · logging in…'
    );
    log(
      `—— Send account ${i + 1}/${groups.length}: ${accountLabel}` +
        ` [${viaSecond ? 'SECONDARY' : 'PRIMARY'}]` +
        ` · ${group.inmates.length} recipient(s) ——`,
      viaSecond ? 'warn' : 'info'
    );

    let loginStatus = await startCorrlinksAccountLogin(
      {
        email: group.email,
        password: group.password,
        secondEmail: null,
        secondPassword: null,
      },
      { quietToast: true }
    );
    if (!loopStillActive(myGeneration)) break;

    // If login soft-failed (not locked), rest and try once more.
    if (shouldRetryProbeLogin(loginStatus)) {
      log(
        `Send login soft-failed for ${accountLabel} — resting ${LOOP_RELOGIN_REST_MS / 1000}s then retry…`,
        'warn'
      );
      await logoutCorrlinksQuiet();
      const retryRest = await waitLoopGap(LOOP_RELOGIN_REST_MS, {
        current: i,
        total: groups.length,
        nextLabel: `${accountLabel} (retry)`,
      });
      if (!retryRest || !loopStillActive(myGeneration)) break;
      loginStatus = await startCorrlinksAccountLogin(
        {
          email: group.email,
          password: group.password,
          secondEmail: null,
          secondPassword: null,
        },
        { quietToast: true }
      );
      if (!loopStillActive(myGeneration)) break;
    } else if (loginStatus?.state === 'locked' && !probeAccountUsable(loginStatus)) {
      log(`Send login locked for ${accountLabel} — not retrying`, 'warn');
    }

    const loginOk = probeAccountUsable(loginStatus);
    if (!loginOk) {
      viaFailed += 1;
      failCount += group.inmates.length;
      log(`Skipping recipients — re-login failed for ${accountLabel}`, 'error');
    } else {
      if (viaSecond) viaSecondCount += 1;
      else viaPrimary += 1;

      for (let r = 0; r < group.inmates.length; r += 1) {
        if (!loopStillActive(myGeneration)) {
          log(`Send loop force-stopped during ${accountLabel} after ${r}/${group.inmates.length}`, 'warn');
          break;
        }
        const inmate = group.inmates[r];
        const recipLabel = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
        setLoopProgress(
          `Account ${i + 1}/${groups.length}` +
            (viaSecond ? ' · 2nd' : '') +
            ` · Sending ${r + 1}/${group.inmates.length} · ${recipLabel}`
        );
        log(`—— Recipient ${r + 1}/${group.inmates.length}: ${recipLabel} ——`, 'info');
        selectInmate(inmate.id);
        const status = await startCorrlinksCompose(inmate, { quietToast: true, send: true });
        if (!loopStillActive(myGeneration)) break;
        if (statusLooksGood(status, { requireSend: true })) okCount += 1;
        else failCount += 1;
      }
    }

    if (!loopStillActive(myGeneration)) break;
    await logoutCorrlinksQuiet();
  }

  // Force-stop already finalized UI — don't double-toast.
  if (myGeneration !== loopGeneration) return;

  const wasAborted = loopAbort;
  loopRunning = false;
  loopAbort = false;
  loopPhase = wasAborted ? 'stopped' : failCount > 0 ? 'error' : 'done';
  setLoopInitializingOverlay(null);
  setLoopCountdownOverlay();
  updateActionButtons();

  const accountBits = [
    viaPrimary ? `${viaPrimary} primary` : null,
    viaSecondCount ? `${viaSecondCount} via second` : null,
    viaFailed ? `${viaFailed} re-login failed` : null,
    skipped.length ? `${skipped.length} no usable account` : null,
  ].filter(Boolean);
  const accountSummaryText = accountBits.length ? ` · Accounts: ${accountBits.join(', ')}` : '';
  const title = wasAborted ? 'Loop stopped' : 'Loop done';
  const summary = `${title} · ${okCount} ok · ${failCount} failed · ${recipientTotal} recipients${accountSummaryText}`;
  const level = failCount || wasAborted || viaSecondCount ? 'warn' : 'success';
  lastLoopResult = { okCount, failCount, recipientTotal, aborted: wasAborted, summary, level };
  setLoopProgress(title, {
    result: true,
    level,
    aborted: wasAborted,
    okCount,
    failCount,
    recipientTotal,
  });
  setStatusHint(summary);
  log(summary, level);
  toast(summary, level);
  showLoopDoneAlert({
    aborted: wasAborted,
    okCount,
    failCount,
    recipientTotal,
    summary,
  });
}

function forceStopSingleCorrlinks() {
  if (!corrlinksLoginBusy || loopRunning) return;
  corrlinksForceStop = true;
  corrlinksOpGeneration += 1;
  // Keep busy until the panel is actually destroyed — clearing early lets a new
  // Send race the dying login and crash main with "Object has been destroyed".
  resetCorrEmbedReveal();
  hideCorrEmbedNow({ force: true });
  setCorrlinksConnected(false);
  setStatusHint('Force-stopped');
  log('Force-stop requested — aborting CorrLinks login', 'warn');
  toast('Force-stopped', 'warn');
  updateActionButtons();

  Promise.resolve(window.api?.forceStopCorrlinks?.())
    .catch(() => {})
    .finally(() => {
      resetCorrEmbedReveal();
      hideCorrEmbedNow({ force: true });
      corrlinksLoginBusy = false;
      updateActionButtons();
    });
}

function stopBootVerify() {
  if (!bootVerifyRunning) return;
  bootVerifyAbort = true;
  bootVerifyRunning = false;
  corrlinksLoginBusy = false;
  corrlinksForceStop = true;
  corrlinksOpGeneration += 1;
  loopInitializingActive = false;
  setLoopInitializingOverlay(null);
  hideCorrEmbedNow();
  setCorrlinksConnected(false);
  setStatusHint('Account verify force-stopped');
  log('Force-stop — account verification aborted', 'warn');
  toast('Verification force-stopped', 'warn');
  updateActionButtons();
  Promise.resolve(window.api?.forceStopCorrlinks?.())
    .catch(() => {})
    .finally(() => {
      setLoopInitializingOverlay(null);
      hideCorrEmbedNow();
      updateActionButtons();
    });
}

function stopInmateLoop() {
  if (!loopRunning && !corrlinksLoginBusy && !bootVerifyRunning) return;

  if (bootVerifyRunning && !loopRunning) {
    stopBootVerify();
    return;
  }

  // Single login / compose — no loop UI.
  if (!loopRunning && corrlinksLoginBusy) {
    forceStopSingleCorrlinks();
    return;
  }

  loopAbort = true;
  loopGeneration += 1;
  corrlinksForceStop = true;
  corrlinksOpGeneration += 1;
  loopRunning = false;
  loopPhase = 'stopped';
  loopInitializingActive = false;
  // Keep corrlinksLoginBusy until panel teardown finishes (same race as single force-stop).

  setLoopInitializingOverlay(null);
  setLoopCountdownOverlay();
  hideCorrEmbedNow();
  setCorrlinksConnected(false);
  lastLoopResult = { okCount: 0, failCount: 0, recipientTotal: 0, aborted: true, summary: 'Loop force-stopped', level: 'warn' };
  // Brief status only — full result card is for completed runs; clear on next start.
  setLoopProgress('Loop force-stopped', {
    result: true,
    level: 'warn',
    aborted: true,
    hideStats: true,
  });
  setStatusHint('Loop force-stopped');
  log('Stop requested — force-stopping now', 'warn');
  toast('Loop force-stopped', 'warn');
  updateActionButtons();

  // Destroy CorrLinks panel mid-login/compose so awaited IPC fails fast.
  Promise.resolve(window.api?.forceStopCorrlinks?.())
    .catch(() => {})
    .finally(() => {
      // In-flight probe awaits can try to re-show the cover — clear again.
      corrlinksLoginBusy = false;
      setLoopInitializingOverlay(null);
      setLoopCountdownOverlay();
      hideCorrEmbedNow();
      updateActionButtons();
    });
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

async function refreshInmates({ verifyAccounts = true, forceValidation = false } = {}) {
  if (!btnRefresh) return;
  if (bootVerifyRunning || loopRunning) return;
  btnRefresh.disabled = true;
  btnRefresh.classList.add('loading');
  setStatusHint(forceValidation ? 'Refreshing inmates… then manual validation' : 'Refreshing inmates…');
  log(
    forceValidation
      ? 'Refreshing inmate accounts from SportsData… (manual CorrLinks validation next)'
      : 'Refreshing inmate accounts from SportsData…',
    'info'
  );
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
    setInmateCountLabel(result.accounts.length);
    toast(`Loaded ${result.accounts.length} inmates`, 'success');
    setStatusHint(`${result.accounts.length} inmates ready`);
    setStepState({
      inmateDone: Boolean(selectedInmate()),
      composeDone: Boolean(composePreview.to || composePreview.subject),
      active: 1,
    });
    inmateCard?.classList.remove('collapsed');
    startAccountsAutoRefresh();
    if (verifyAccounts && result.accounts.length) {
      if (forceValidation) {
        // User clicked refresh — always re-probe CorrLinks accounts.
        clearVerifiedAccounts();
        bootProbeByEmail = new Map();
        accountsVerifiedOnce = false;
        lastAccountsFingerprint = (await computeAccountsFingerprint(accounts)) || lastAccountsFingerprint;
        await verifyCorrlinksAccountsOnBoot({ force: true, mode: 'manual' });
      } else {
        const uniqueAccounts = collectUniqueCorrlinksAccounts();
        const restored = await tryRestoreVerifiedFromDisk(uniqueAccounts);
        if (!restored) {
          clearVerifiedAccounts();
          bootProbeByEmail = new Map();
          accountsVerifiedOnce = false;
          log('CorrLinks accounts changed or no saved validation — validating…', 'info');
          await verifyCorrlinksAccountsOnBoot({ force: true });
        }
      }
    }
  } catch (error) {
    setSportsConnected(false);
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
    setStatusHint('SportsData login needed');
  } finally {
    btnRefresh.disabled = false;
    btnRefresh.classList.remove('loading');
    updateActionButtons();
  }
}

function handleLoginResult(status, { quietToast = false } = {}) {
  if (status.state === 'success') {
    const via = status.usedSecondAccount ? 'second' : status.attempt || 'primary';
    log(`Login success via ${via}: ${maskSensitive(status.email)} — ${status.message}`, 'success');
    rememberVerifiedAccount(status.email, status);
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
    if (status.loggedIn) rememberVerifiedAccount(status.email, status);
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

  if (status.subjectResult) {
    if (status.subjectResult.ok) log(`Subject: ${status.subject}`, 'success');
    else log(`Subject failed: ${status.subject || status.subjectResult.reason || 'unknown'}`, 'error');
    updateComposePreview({ subject: status.subject || '' });
  } else if (status.subject && status.state === 'success') {
    updateComposePreview({ subject: status.subject || '' });
  }

  if (status.sentParts?.length) {
    status.sentParts.forEach((part) => {
      log(
        `Sent part ${part.part || '?'}: ${part.filename || 'file'} (${Number(part.characters || 0).toLocaleString()} chars)` +
          (part.subject ? ` · subject “${part.subject}”` : '') +
          (part.bodyHead ? ` · “${String(part.bodyHead).slice(0, 40)}”` : ''),
        'success'
      );
    });
    updateComposePreview({
      body: `Sent ${status.sentParts.length} file(s)`,
      chars: status.sentParts.reduce((sum, p) => sum + (Number(p.characters) || 0), 0),
      parts: status.sentParts.length,
    });
  } else if (status.bodyResult?.ok) {
    const chars = status.pastedPart?.characters || 0;
    const filename = status.pastedPart?.filename || 'body';
    const sentLabel = status.bodyResult?.sent || status.sendResult?.ok ? 'sent' : 'not sent';
    log(
      `Pasted body part ${status.pastedPart?.part || '?'}: ${filename} (${chars.toLocaleString()} chars) — ${sentLabel}`,
      'success'
    );
    updateComposePreview({
      body: `${filename} pasted (${sentLabel})`,
      chars,
    });
  } else if (status.bodyResult?.skipped) {
    log(status.bodyResult.reason || 'No body to paste', 'warn');
  } else if (status.bodyResult) {
    log(`Body paste failed: ${status.bodyResult.reason || 'unknown'}`, 'error', status.bodyResult);
  }

  if (status.failedParts?.length) {
    status.failedParts.forEach((part) => {
      log(`Send failed · ${part.filename || 'file'}: ${part.reason || 'unknown'}`, 'error');
    });
  }
  if (status.pendingParts?.length) {
    log(
      `Pending parts: ${status.pendingParts.map((p) => p.filename).join(', ')}` +
        (status.sent ? '' : ' (no send yet)'),
      'info'
    );
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
  stopAccountsAutoRefresh();
  resetCorrEmbedReveal();
  accounts = [];
  selectedFileKeys = [];
  lastAccountsSnapshot = null;
  clearVerifiedAccounts();
  bootProbeByEmail = new Map();
  accountsVerifiedOnce = false;
  lastAccountsFingerprint = null;
  bootVerifyRunning = false;
  bootVerifyAbort = false;
  setLoopInitializingOverlay(null);
  templateMode = 'daily';
  weeklyLeague = 'NFL';
  weeklyCache = {
    league: null,
    updates: [],
    week_start: null,
    week_end: null,
    subject: null,
    message: '',
  };
  weeklyLoading = false;
  composePreview = { to: '', subject: '', body: '', chars: 0, parts: 0 };
  updateComposePreview({});
  accountSelect.value = '';
  inmateSearch.value = '';
  inmateSearch.disabled = true;
  renderAccountMeta(null);
  renderInmateOptions([], { open: false });
  syncTemplateControls();
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
  else if (state === 'dev') chipText = version ? `v${version}` : 'v…';

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
  const loginVersion = document.getElementById('loginVersion');
  if (loginVersion) loginVersion.textContent = version ? `v${version}` : 'v…';
  const aboutPlatform = document.getElementById('aboutPlatform');
  const aboutRuntime = document.getElementById('aboutRuntime');
  const aboutCopyright = document.getElementById('aboutCopyright');
  if (aboutPlatform) {
    const plat =
      navigator.userAgentData?.platform ||
      (/Mac/i.test(navigator.platform || navigator.userAgent)
        ? 'macOS'
        : /Win/i.test(navigator.platform || navigator.userAgent)
          ? 'Windows'
          : navigator.platform || 'Desktop');
    aboutPlatform.textContent = plat;
  }
  if (aboutRuntime) {
    aboutRuntime.textContent = `Electron · Chromium`;
  }
  if (aboutCopyright) {
    aboutCopyright.textContent = `© ${new Date().getFullYear()} MJR`;
  }
  if (updatesCurrent) updatesCurrent.textContent = version ? `v${version}` : 'v…';

  const updatesLatest = document.getElementById('updatesLatest');
  const updatesChannel = document.getElementById('updatesChannel');
  const updatesInstallMode = document.getElementById('updatesInstallMode');
  const updatesStatusBadge = document.getElementById('updatesStatusBadge');
  const updatesProgressLabel = document.getElementById('updatesProgressLabel');
  const updatesProgressPct = document.getElementById('updatesProgressPct');

  if (updatesLatest) {
    if (updateStatus.latestVersion) {
      updatesLatest.textContent = `v${updateStatus.latestVersion}`;
    } else if (state === 'idle' || state === 'not-available') {
      updatesLatest.textContent = version ? `v${version}` : '—';
    } else {
      updatesLatest.textContent = '—';
    }
  }
  if (updatesChannel) updatesChannel.textContent = 'Stable';
  if (updatesInstallMode) {
    updatesInstallMode.textContent = macDmg ? 'macOS DMG' : 'In-app install';
  }
  if (updatesStatusBadge) {
    const badgeMap = {
      idle: 'Ready',
      'not-available': 'Up to date',
      checking: 'Checking…',
      available: 'Update available',
      downloading: 'Downloading…',
      downloaded: macDmg ? 'Installer ready' : 'Ready to install',
      error: 'Update failed',
      dev: 'Dev build',
    };
    const badgeState = state === 'not-available' ? 'uptodate' : state || 'idle';
    updatesStatusBadge.dataset.state = badgeState;
    updatesStatusBadge.textContent = badgeMap[state] || 'Ready';
  }
  if (updatesMessage) {
    updatesMessage.textContent =
      updateStatus.message ||
      (state === 'dev'
        ? 'Updates are available in packaged builds only.'
        : state === 'available'
          ? `Version v${updateStatus.latestVersion || '…'} is ready to download.`
          : state === 'downloaded'
            ? macDmg
              ? 'Installer downloaded. Open it to finish updating.'
              : 'Update downloaded. Restart to finish installing.'
            : 'Ready to check for updates.');
  }
  if (updatesProgressWrap) {
    updatesProgressWrap.hidden = state !== 'downloading' || macDmg;
  }
  const pct = Math.max(0, Math.min(100, Number(updateStatus.percent) || 0));
  if (updatesProgressBar) updatesProgressBar.style.width = `${pct}%`;
  if (updatesProgressLabel) {
    updatesProgressLabel.textContent = macDmg ? 'Preparing installer…' : 'Downloading update…';
  }
  if (updatesProgressPct) updatesProgressPct.textContent = `${Math.round(pct)}%`;
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

/** Remember embed was live before a modal forced it off-screen. */
let modalPausedCorrReveal = false;
/** @type {ReturnType<typeof setInterval>|null} */
let modalCorrHideTimer = null;

function stopModalCorrHideWatch() {
  if (modalCorrHideTimer) {
    clearInterval(modalCorrHideTimer);
    modalCorrHideTimer = null;
  }
}

function anyModalDialogOpen() {
  return [updatesDialog, aboutDialog, shortcutsDialog, loopDoneDialog].some(
    (dialog) => dialog && dialog.open
  );
}

function forceHideCorrForModal() {
  void window.api?.setCorrBounds?.({ x: 0, y: 0, width: 0, height: 0, force: true });
}

function openModalDialog(dialog) {
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  // Native WebContentsView paints above HTML and steals clicks — collapse + detach it.
  if (corrEmbedRevealed) modalPausedCorrReveal = true;
  corrEmbedRevealed = false;
  forceHideCorrForModal();
  if (!dialog.open) dialog.showModal();
  // Keep re-asserting hide while open (status sync / ensureVisible can revive the view).
  const keepHidden = () => {
    if (!anyModalDialogOpen()) {
      stopModalCorrHideWatch();
      return;
    }
    forceHideCorrForModal();
  };
  keepHidden();
  requestAnimationFrame(keepHidden);
  setTimeout(keepHidden, 50);
  setTimeout(keepHidden, 200);
  stopModalCorrHideWatch();
  modalCorrHideTimer = setInterval(keepHidden, 120);
  if (!dialog.dataset.modalRevealWired) {
    dialog.dataset.modalRevealWired = '1';
    dialog.addEventListener('close', () => {
      if (!anyModalDialogOpen()) stopModalCorrHideWatch();
      if (modalPausedCorrReveal || corrlinksLoginBusy || loopRunning) {
        corrEmbedRevealed = true;
        setCorrPlaceholderVisible(false);
      }
      modalPausedCorrReveal = false;
      scheduleCorrPaneBounds();
    });
  }
  scheduleCorrPaneBounds();
  return true;
}

/**
 * SweetAlert-style completion popup after the send loop finishes.
 */
function showLoopDoneAlert({ aborted = false, okCount = 0, failCount = 0, recipientTotal = 0, summary = '' } = {}) {
  if (!loopDoneDialog || typeof loopDoneDialog.showModal !== 'function') {
    toast(summary || (aborted ? 'Loop stopped' : 'Loop finished'), aborted || failCount ? 'warn' : 'success');
    return;
  }

  const level = aborted ? 'warn' : failCount > 0 && okCount === 0 ? 'error' : failCount > 0 ? 'warn' : 'success';
  loopDoneDialog.classList.toggle('is-warn', level === 'warn');
  loopDoneDialog.classList.toggle('is-error', level === 'error');

  if (loopDoneIcon) {
    loopDoneIcon.textContent = level === 'success' ? '✓' : level === 'warn' ? '!' : '×';
  }
  if (loopDoneTitle) {
    loopDoneTitle.textContent = aborted ? 'Loop stopped' : 'Loop completed';
  }
  if (loopDoneMessage) {
    if (aborted) {
      loopDoneMessage.textContent =
        'The send loop was stopped before all recipients were processed.';
    } else if (failCount > 0 && okCount === 0) {
      loopDoneMessage.textContent =
        'The loop finished, but no messages were sent successfully.';
    } else if (failCount > 0) {
      loopDoneMessage.textContent =
        'The loop finished with some recipients not fully sent.';
    } else {
      loopDoneMessage.textContent =
        'All recipients in this loop were sent successfully.';
    }
  }
  if (loopDoneSummary) {
    const counts =
      summary ||
      `${okCount} ok · ${failCount} failed · ${recipientTotal} recipient(s)`;
    loopDoneSummary.textContent = `${counts}\n${formatDateTime()}`;
  }

  openModalDialog(loopDoneDialog);
  // Ensure OK can dismiss even if a leftover native view intercepts the first frame.
  const okBtn = document.getElementById('btnLoopDoneOk');
  if (okBtn && !okBtn.dataset.wired) {
    okBtn.dataset.wired = '1';
    okBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (loopDoneDialog?.open) loopDoneDialog.close();
    });
  }
}

function openUpdatesDialog() {
  if (!updatesDialog) {
    runUpdateAction(updateChip?.dataset?.updateAction || 'check');
    return;
  }
  renderUpdateUi(updateStatus);
  openModalDialog(updatesDialog);
}

function waitForDialogClose(dialog) {
  return new Promise((resolve) => {
    if (!dialog || !dialog.open) {
      resolve();
      return;
    }
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      resolve();
    };
    dialog.addEventListener('close', onClose);
  });
}

/**
 * Check for app updates on the login screen before SportsData sign-in / auto-login.
 * If an update is available (or already downloaded), open the Updates dialog and wait.
 */
async function checkUpdatesBeforeLogin() {
  setLoginError('Checking for updates…', { info: true });
  setStatusHint('Checking for updates…');
  if (btnSaveLogin) btnSaveLogin.disabled = true;
  try {
    if (!window.api?.checkForUpdates) {
      setLoginError('');
      return updateStatus;
    }
    updateBusy = true;
    renderUpdateUi({ ...updateStatus, state: 'checking', message: 'Checking for updates…' });
    // Never leave Sign in disabled if the updater hangs.
    const result = await Promise.race([
      window.api.checkForUpdates(),
      new Promise((resolve) =>
        setTimeout(() => resolve({ state: 'error', error: 'Update check timed out' }), 12000)
      ),
    ]);
    // Clear busy BEFORE opening the dialog — otherwise Download stays disabled
    // while we wait for the user to close Updates.
    updateBusy = false;
    renderUpdateUi(result || updateStatus);
    maybeToastUpdate(result);

    const state = String(result?.state || '');
    if (state === 'available' || state === 'downloaded') {
      setLoginError(
        state === 'downloaded'
          ? 'Update ready — install before signing in, or close to continue'
          : `Update available (v${result.latestVersion || '…'}) — review before signing in`,
        { info: true }
      );
      openUpdatesDialog();
      await waitForDialogClose(updatesDialog);
    } else if (state === 'error' && result?.error) {
      log(`Update check failed: ${result.error}`, 'warn');
      // Don't block login on a failed check.
    } else if (state === 'not-available' || state === 'dev') {
      log(result?.message || `Up to date (v${result?.currentVersion || ''})`, 'info');
    }
    return result;
  } catch (error) {
    log(`Update check failed: ${error.message || String(error)}`, 'warn');
    return null;
  } finally {
    updateBusy = false;
    renderUpdateUi(updateStatus);
    if (btnSaveLogin) btnSaveLogin.disabled = false;
    setLoginError('');
  }
}

let lastCorrStatusLogKey = '';
function wireCorrlinksLiveStatus() {
  if (typeof window.api?.onCorrlinksStatus !== 'function') return;
  window.api.onCorrlinksStatus((status) => {
    if (!status?.message) return;
    const key = `${status.state || ''}|${status.message}`;
    if (key === lastCorrStatusLogKey) return;
    lastCorrStatusLogKey = key;

    // Keep the CorrLinks header off “Opening…” once real work starts.
    if (corrEmbedRevealed || corrlinksLoginBusy) {
      const short = String(status.message).replace(/\s+/g, ' ').trim().slice(0, 72);
      if (short) setCorrPanelBusy(short);
      // Re-assert pane size whenever CorrLinks reports progress.
      syncCorrPaneBounds();
    }

    // During verify overlay, mirror every CorrLinks step into the live one-liner + log.
    if (loopInitializingActive && verifyProbeLive) {
      pushVerifyProbeStep(status.message);
      setStatusHint(status.message);
      return;
    }

    const interesting =
      /send|sent|clicking|auto-send|part \d|failed|compose|login|opening|loading|filling|corrlinks/i.test(
        status.message
      ) ||
      status.state === 'sending' ||
      status.state === 'loading' ||
      status.state === 'error';
    if (!interesting) return;
    const level =
      status.state === 'error' || /fail/i.test(status.message)
        ? 'error'
        : /sent|success/i.test(status.message)
          ? 'success'
          : 'info';
    log(status.message, level);
    if (
      status.state === 'sending' ||
      status.state === 'loading' ||
      /send|login|opening/i.test(status.message)
    ) {
      setStatusHint(status.message);
    }
  });
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
    event.stopPropagation();
    const action =
      btnUpdate.dataset.updateAction ||
      (updateStatus.state === 'available'
        ? 'download'
        : updateStatus.state === 'downloaded'
          ? 'install'
          : 'check');
    runUpdateAction(action);
  });
  updateChip?.addEventListener('click', () => openUpdatesDialog());
  btnCheckUpdatesMenu?.addEventListener('click', () => {
    setAccountMenuOpen(false);
    openUpdatesDialog();
  });
  btnUpdatesClose?.addEventListener('click', () => updatesDialog?.close());
  [updatesDialog, aboutDialog, shortcutsDialog, loopDoneDialog].forEach((dialog) => {
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
  wireCorrlinksLiveStatus();
  setLoginShortcutHint();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (mainShell?.hidden) return;
    void syncCorrlinksAccountsQuiet({ reason: 'focus' });
  });
  window.addEventListener('focus', () => {
    if (mainShell?.hidden) return;
    void syncCorrlinksAccountsQuiet({ reason: 'focus' });
  });

  try {
    const summary = await window.api.getConfigSummary();
    fillLoginForm(summary);
    setConfigSummary(summary);

    // Always check for app updates before SportsData login / auto-login.
    await checkUpdatesBeforeLogin();

    // Auto-login only when "Remember …" saved a credentials file.
    // Logout deletes that file; .env alone must not sign back in on restart.
    if (summary.remembered && summary.email && summary.hasPassword) {
      log(`Remembered SportsData login (${maskSensitive(summary.email)}) — verifying…`, 'info');
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
      if (sdRemember) sdRemember.checked = false;
      setStatusHint('Sign in with SportsData');
      log('Sign in with SportsData email and password to continue', 'warn');
      if (summary.email && !sdPassword?.value) sdPassword?.focus();
      else sdEmail?.focus();
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


// Direct click fallback — ensures Sign in works even if a parent swallows submit.
btnSaveLogin?.addEventListener('click', (event) => {
  if (btnSaveLogin.disabled) return;
  // Let the form's submit handler run via requestSubmit when available.
  if (typeof sportsdataForm?.requestSubmit === 'function') {
    event.preventDefault();
    sportsdataForm.requestSubmit();
  }
});

sportsdataForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (btnSaveLogin?.disabled && btnSaveLogin.classList.contains('loading')) return;
  const loginLabel = btnSaveLogin?.querySelector('.btn-label');
  btnSaveLogin.disabled = true;
  btnSaveLogin.classList.add('loading');
  btnSaveLogin.setAttribute('aria-busy', 'true');
  if (loginLabel) loginLabel.textContent = 'Signing in…';
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
    setLoginError(operatorFriendlyMessage(message, { fallback: 'Sign-in failed' }));
    log(message, 'error');
    toast(message, 'error');
    showLoginScreen();
  } finally {
    btnSaveLogin.disabled = false;
    btnSaveLogin.classList.remove('loading');
    btnSaveLogin.setAttribute('aria-busy', 'false');
    if (loginLabel) loginLabel.textContent = 'Sign in';
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

// Explicit toggle — native checkbox hit-testing is unreliable under Electron overlays.
document.querySelector('label.login-remember')?.addEventListener('click', (event) => {
  if (!sdRemember || sdRemember.disabled) return;
  // Let the real input handle its own click; otherwise toggle from label/ui click.
  if (event.target === sdRemember) return;
  event.preventDefault();
  sdRemember.checked = !sdRemember.checked;
  sdRemember.dispatchEvent(new Event('change', { bubbles: true }));
});

document.getElementById('btnToggleLoginPassword')?.addEventListener('click', () => {
  if (!sdPassword) return;
  const show = sdPassword.type === 'password';
  sdPassword.type = show ? 'text' : 'password';
  const btn = document.getElementById('btnToggleLoginPassword');
  if (btn) {
    btn.textContent = show ? 'Hide' : 'Show';
    btn.setAttribute('aria-pressed', show ? 'true' : 'false');
  }
});

btnRefresh.addEventListener('click', () => {
  if (activeMainTab === 'history') loadExchangeHistory();
  else refreshInmates({ forceValidation: true });
});

mainTabs?.addEventListener('click', (event) => {
  const btn = event.target.closest('.main-tab');
  if (!btn?.dataset?.tab) return;
  setMainTab(btn.dataset.tab);
});

btnHistoryRefresh?.addEventListener('click', () => loadExchangeHistory());
btnHistoryGenerate?.addEventListener('click', () => generateExchangeAllManual());
btnHistoryEmptyGenerate?.addEventListener('click', () => generateExchangeAllManual());

document.getElementById('historyTable')?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-url]');
  if (btn?.classList.contains('hist-download')) {
    const url = decodeURIComponent(btn.dataset.url || '');
    const date = decodeURIComponent(btn.dataset.date || '');
    const filename = decodeURIComponent(btn.dataset.filename || 'all.txt');
    downloadHistoryRow({ url, date, filename });
    return;
  }
  const tr = event.target.closest('tbody tr');
  if (!tr || !historyDataTable) return;
  const row = historyDataTable.row(tr).data();
  if (!row?.url) return;
  document.querySelectorAll('#historyTable tbody tr').forEach((el) => el.classList.remove('is-active-row'));
  tr.classList.add('is-active-row');
  previewHistoryRow({
    url: row.url,
    date: row.date || '',
    filename: row.filename || row.file || 'all.txt',
  });
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
    sdEmail.value = '';
    if (sdRemember) sdRemember.checked = false;
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
    log('Signed out of SportsData — remembered login cleared', 'info');
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
  return inmateSearch?.value.trim() || '';
}

inmateSearch.addEventListener('focus', () => {
  if (!accounts.length) return;
  syncInmateComboboxDisplay({ editing: true });
  if (selectedInmate() && !inmateSearch.value) {
    inmateSearch.value = selectedInmate().name || '';
    inmateSearch.select();
  }
  renderInmateOptions(filterAccounts(inmateSearchQuery()), { open: true });
});
inmateSearch.addEventListener('blur', () => {
  // Defer so option click can select first.
  setTimeout(() => {
    if (document.activeElement?.closest?.('#inmateCombobox')) return;
    syncInmateComboboxDisplay({ editing: false });
  }, 120);
});
inmateSearch.addEventListener('input', () => {
  syncInmateComboboxDisplay({ editing: true });
  // Native search ✕ (and deleting all text) must clear the bound inmate,
  // otherwise blur restores the previous selection overlay.
  if (!inmateSearch.value.trim() && accountSelect.value) {
    clearInmateSelection({ keepEditing: true });
  }
  renderInmateOptions(filterAccounts(inmateSearchQuery()), { open: true });
});
// Chromium fires `search` when the type=search clear (✕) control is clicked.
inmateSearch.addEventListener('search', () => {
  if (inmateSearch.value.trim()) return;
  if (accountSelect.value) clearInmateSelection({ keepEditing: true });
  renderInmateOptions(accounts, { open: true });
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
      selectInmate(current.dataset.id);
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

btnClearInmate?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (inmateSearch?.disabled) return;
  clearInmateSelection({ keepEditing: true });
  renderInmateOptions(accounts, { open: true });
  inmateSearch?.focus();
});

document.getElementById('inmateCombobox')?.addEventListener('click', (event) => {
  if (inmateSearch?.disabled) return;
  if (event.target.closest('.combobox-clear')) return;
  if (
    !event.target.closest('.combobox-chevron') &&
    !event.target.closest('.combobox-selected')
  ) {
    return;
  }
  event.preventDefault();
  inmateSearch.focus();
  renderInmateOptions(filterAccounts(inmateSearchQuery()), { open: true });
});

historyPreviewSearch?.addEventListener('input', () => {
  applyHistoryPreviewSearch(historyPreviewSearch.value);
});

historyDateFilter?.addEventListener('input', () => applyHistoryFilters());

document.getElementById('btnTemplateDaily')?.addEventListener('click', () => {
  setTemplateMode('daily');
});
document.getElementById('btnTemplateWeekly')?.addEventListener('click', () => {
  setTemplateMode('weekly');
});
document.getElementById('btnLeagueNfl')?.addEventListener('click', () => {
  setWeeklyLeague('NFL');
});
document.getElementById('btnLeagueCfb')?.addEventListener('click', () => {
  setWeeklyLeague('CFB');
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

btnStopBootVerify?.addEventListener('click', () => {
  stopBootVerify();
});

btnSend?.addEventListener('click', () => {
  if (loopRunning) {
    toast('Use Force stop / loop controls — Send is for single inmate only', 'warn');
    return;
  }
  const inmate = selectedInmate();
  if (!inmate || !selectedExchangeFiles(inmate).length) {
    toast('Select an inmate with sendable exchange files first', 'warn');
    return;
  }
  startCorrlinksSend();
});

function isLogDrawerOpen() {
  return Boolean(logDrawer && !logDrawer.hidden);
}

function setLogDrawerOpen(open) {
  if (!logDrawer) return;
  if (open) hideCorrEmbedNow({ force: true });
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
    if (activeMainTab === 'history') loadExchangeHistory();
    else refreshInmates({ forceValidation: true });
  }
  if (meta && (event.key.toLowerCase() === 'l' || event.key === 'Enter')) {
    event.preventDefault();
    if (!loopRunning && btnSend && !btnSend.disabled && !corrlinksLoginBusy) {
      startCorrlinksSend();
    }
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

/** Native WebContentsView paints above HTML — hide it under modals/drawers/menus. */
function isCorrEmbedBlocked() {
  // Login gate must never leave a native CorrLinks view stealing clicks.
  if (document.body.classList.contains('is-login')) return true;
  if (loginScreen && !loginScreen.hidden) return true;
  if (mainShell?.hidden) return true;
  if (loopInitializingActive || bootVerifyRunning) return true;
  // Loop countdown overlay must not blank a live loop session.
  if (loopCountdownActive && !(loopRunning || corrEmbedRevealed || corrlinksLoginBusy)) return true;
  if (activeMainTab !== 'automate') return true;
  // Do NOT block on log-open — status log was zeroing the CorrLinks pane mid-send.
  // Drawer overlap is handled by clipping in measureCorrPaneBounds.
  if (document.body.classList.contains('account-menu-open')) return true;
  if (accountDropdown && !accountDropdown.hidden) return true;
  const dialogs = [updatesDialog, aboutDialog, shortcutsDialog, loopDoneDialog];
  if (dialogs.some((dialog) => dialog && dialog.open)) return true;
  return false;
}

function hideCorrEmbedNow({ force = false } = {}) {
  if (!window.api?.setCorrBounds) return;
  // During active send/login, ignore soft hides unless force (menu/dialog/logout).
  if (!force && (corrEmbedRevealed || corrlinksLoginBusy)) return;
  window.api.setCorrBounds({ x: 0, y: 0, width: 0, height: 0, force: Boolean(force) });
}

/**
 * Compute #corrPane bounds for the native WebContentsView (null when blocked/too small).
 */
function measureCorrPaneBounds() {
  const pane = document.getElementById('corrPane');
  if (!pane) return null;
  if (isCorrEmbedBlocked()) return null;

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
  if (width < 8 || height < 8) return null;
  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Hide the empty-state HTML and open the native CorrLinks view at real pane bounds.
 * Await this before login/send so the site is visible immediately.
 */
/** Fallback when #corrPane reports a tiny rect (flex not settled yet). */
function measureCorrColumnFallbackBounds() {
  const card =
    document.querySelector('.col-corrlinks .corr-card') ||
    document.querySelector('.col-corrlinks') ||
    document.getElementById('corrPane');
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  const footer = document.querySelector('.statusbar')?.getBoundingClientRect();
  const bottom = Math.min(rect.bottom, footer?.top ?? rect.bottom);
  const width = Math.max(0, rect.width);
  const height = Math.max(0, bottom - rect.top);
  if (width < 80 || height < 80) return null;
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(width),
    height: Math.round(height),
  };
}

async function revealCorrlinksEmbed() {
  closeInmateOptions();
  setAccountMenuOpen(false);
  corrEmbedRevealed = true;
  setCorrPlaceholderVisible(false);
  setCorrPanelBusy('Opening CorrLinks…');
  // Force layout so getBoundingClientRect is accurate after combobox close.
  void document.getElementById('corrPane')?.offsetWidth;
  let bounds = measureCorrPaneBounds();
  if (!bounds) {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    bounds = measureCorrPaneBounds() || measureCorrColumnFallbackBounds();
  }
  if (!bounds) {
    bounds = measureCorrColumnFallbackBounds();
  }
  try {
    // Always warm — main falls back to window geometry if bounds are missing.
    if (window.api?.setCorrBounds && bounds) {
      await window.api.setCorrBounds({ ...bounds, force: true });
    }
    if (window.api?.warmCorrlinksPanel) {
      const warm = await window.api.warmCorrlinksPanel({ bounds: bounds || undefined });
      if (warm?.ok) {
        setCorrPanelBusy('CorrLinks loading…');
        if (warm.visible === false) {
          log('CorrLinks warm used window fallback bounds', 'warn');
        }
        // Prefer measured bounds after warm; main already applied a fallback if needed.
        const again = measureCorrPaneBounds() || measureCorrColumnFallbackBounds() || warm.bounds;
        if (again && window.api?.setCorrBounds) {
          await window.api.setCorrBounds({ ...again, force: true });
          bounds = again;
        }
      } else {
        log(warm?.message || 'Failed to open CorrLinks panel', 'error');
      }
    }
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
  const live = measureCorrPaneBounds() || bounds;
  if (live && window.api?.setCorrBounds) {
    void window.api.setCorrBounds({ ...live, force: true });
  }
  requestAnimationFrame(() => {
    const again = measureCorrPaneBounds() || bounds;
    if (again && window.api?.setCorrBounds) {
      void window.api.setCorrBounds({ ...again, force: true });
    }
  });
  return bounds || live || null;
}

function resetCorrEmbedReveal() {
  corrEmbedRevealed = false;
  setCorrPanelBusy(null);
  setCorrPlaceholderVisible(true);
}

/**
 * Map #corrPane to the Electron WebContentsView.
 * Clip to the visible .app area above the status bar so a scrolled/off-screen
 * pane never paints the embed over the footer or left column.
 */
function syncCorrPaneBounds() {
  if (!window.api?.setCorrBounds) return;

  if (isCorrEmbedBlocked()) {
    // Dialogs/menus must always win over the native view (otherwise OK is unclickable).
    hideCorrEmbedNow({ force: true });
    return;
  }

  const bounds = measureCorrPaneBounds() || (corrEmbedRevealed ? measureCorrColumnFallbackBounds() : null);
  if (!bounds) {
    if (!(corrEmbedRevealed || corrlinksLoginBusy)) hideCorrEmbedNow();
    return;
  }
  window.api.setCorrBounds(bounds);
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
  if (activeMainTab === 'history') ensureHistoryGenerateDateDefault();
  if (activeMainTab === 'history' && !historyLoaded) {
    loadExchangeHistory();
  }
}

function setHistoryPreviewEmptyVisible(visible) {
  if (historyPreviewEmpty) historyPreviewEmpty.hidden = !visible;
  if (historyPreviewBody) historyPreviewBody.hidden = Boolean(visible);
  if (historyPreviewLines) historyPreviewLines.hidden = Boolean(visible);
}

function renderHistoryPreviewLines(text) {
  const content = text || '';
  const lines = content ? content.split('\n') : [];
  const hasContent = Boolean(historyPreviewState.url || content);
  setHistoryPreviewEmptyVisible(!hasContent);
  if (historyPreviewLines) {
    historyPreviewLines.textContent = lines.length
      ? lines.map((_, i) => String(i + 1)).join('\n')
      : '';
  }
  if (historyPreviewBody && hasContent) {
    historyPreviewBody.textContent = content || '(empty file)';
  }
}

function applyHistoryPreviewSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  const raw = historyPreviewState.text || '';
  if (!historyPreviewBody) return;
  if (!q || !raw) {
    renderHistoryPreviewLines(raw);
    historyPreviewBody.classList.remove('is-filtered');
    return;
  }
  setHistoryPreviewEmptyVisible(false);
  const matched = raw.split('\n').filter((line) => line.toLowerCase().includes(q));
  const filtered = matched.length ? matched.join('\n') : '(no matches)';
  if (historyPreviewLines) {
    historyPreviewLines.textContent = matched.length
      ? matched.map((_, i) => String(i + 1)).join('\n')
      : '·';
  }
  historyPreviewBody.textContent = filtered;
  historyPreviewBody.classList.toggle('is-filtered', true);
}

function setHistoryPreview({ url = null, text = '', date = null, filename = null } = {}) {
  historyPreviewState = { url, text: text || '', date, filename };
  const isLoading = text === 'Loading preview…';
  if (historyPreviewHeading) {
    historyPreviewHeading.textContent = url ? date || 'Preview' : 'Preview';
    historyPreviewHeading.classList.toggle('has-selection', Boolean(url));
  }
  if (historyPreviewMeta) {
    historyPreviewMeta.textContent = url
      ? isLoading
        ? `${filename || 'export'} · Loading…`
        : `${filename || 'export'} · ${(text || '').length.toLocaleString()} chars`
      : 'Select a day to preview the export';
    historyPreviewMeta.title = historyPreviewMeta.textContent;
  }
  if (historyPreviewSearch) {
    historyPreviewSearch.disabled = !text || isLoading;
    historyPreviewSearch.value = '';
  }
  renderHistoryPreviewLines(url ? text || '' : '');
  if (btnHistoryCopy) btnHistoryCopy.disabled = !text || isLoading;
  if (btnHistoryDownloadPreview) btnHistoryDownloadPreview.disabled = !url;
  syncHistoryActiveRow();
}

function syncHistoryTableEmpty(count) {
  const empty = Number(count) <= 0;
  if (historyTableEmpty) historyTableEmpty.hidden = !empty;
  document.querySelector('.history-table-wrap')?.classList.toggle('is-empty', empty);
}

function syncHistoryActiveRow() {
  if (!historyDataTable) return;
  const activeUrl = historyPreviewState.url || '';
  document.querySelectorAll('#historyTable tbody tr').forEach((tr) => {
    const data = historyDataTable.row(tr).data();
    tr.classList.toggle('is-active-row', Boolean(activeUrl && data?.url === activeUrl));
  });
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
  syncHistoryTableEmpty(data.length);
  if (historyDataTable) {
    historyDataTable.clear();
    historyDataTable.rows.add(data);
    historyDataTable.draw();
    applyHistoryFilters();
    syncHistoryActiveRow();
    return;
  }

  historyDataTable = $('#historyTable').DataTable({
    data,
    pageLength: 10,
    lengthMenu: [
      [10, 25, 50],
      ['10 / page', '25 / page', '50 / page'],
    ],
    order: [[0, 'desc']],
    autoWidth: false,
    ordering: true,
    orderClasses: false,
    dom: '<"history-dt-toolbar"<"history-dt-search"f>>rt<"history-table-foot"<"history-dt-length"l>ip>',
    columns: [
      { data: 'date', title: 'Date' },
      {
        data: 'filename',
        title: 'File',
        defaultContent: 'all.txt',
        orderable: true,
        render: (value, _type, row) => {
          const name = escapeHtml(value || row.file || 'all.txt');
          return `<span class="history-file-name" title="${name}">${name}</span>`;
        },
      },
      {
        data: 'characters',
        title: 'Characters',
        render: (value) => (value == null ? '—' : Number(value).toLocaleString()),
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
            <button type="button" class="ghost tiny hist-download" data-url="${url}" data-date="${date}" data-filename="${filename}">Download</button>
          </div>`;
        },
      },
    ],
    createdRow(row) {
      row.classList.add('history-row-selectable');
    },
    language: {
      search: '',
      searchPlaceholder: 'Search history…',
      lengthMenu: '_MENU_',
      info: '_START_–_END_ of _TOTAL_',
      infoEmpty: 'No files',
      zeroRecords: 'No matching exchange files',
    },
    drawCallback() {
      syncHistoryActiveRow();
    },
    initComplete() {
      const toolbar = document.querySelector('.history-dt-toolbar');
      if (toolbar && historyControlsFind) {
        const search = toolbar.querySelector('.history-dt-search');
        if (search) historyControlsFind.appendChild(search);
        toolbar.remove();
      }
      applyHistoryFilters();
      syncHistoryActiveRow();
    },
  });
}

function applyHistoryFilters() {
  if (!historyDataTable) return;
  const dateQ = String(historyDateFilter?.value || '').trim();
  historyDataTable.column(0).search(dateQ, false, true).draw();
}

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ensureHistoryGenerateDateDefault() {
  if (!historyGenerateDate) return;
  if (!historyGenerateDate.value) historyGenerateDate.value = todayIsoDate();
}

async function loadExchangeHistory() {
  if (!btnHistoryRefresh) return;
  btnHistoryRefresh.disabled = true;
  btnHistoryRefresh.classList.add('loading');
  if (btnHistoryGenerate) btnHistoryGenerate.disabled = true;
  if (historyHint) historyHint.textContent = 'Loading SportsData exchange files…';
  setStatusHint('Loading exchange history…');
  log('Loading SportsData exchange history…', 'info');
  try {
    const result = await window.api.fetchExchangeHistory({ withCharacters: true });
    if (!result?.ok) throw new Error(result?.message || 'Failed to load history');
    historyLoaded = true;
    const count = result.count ?? result.rows?.length ?? 0;
    const skippedNoOdds = Number(result.skippedNoOdds || 0);
    if (historyHint) {
      historyHint.textContent =
        count > 0
          ? `${count} exchange file(s)` +
            (skippedNoOdds ? ` · ${skippedNoOdds} “No odds” hidden` : '')
          : skippedNoOdds
            ? `No odds days only · ${skippedNoOdds} hidden`
            : result.message || 'No exchange files found';
    }
    historyRowsCache = result.rows || [];
    if (btnHistoryExport) btnHistoryExport.disabled = historyRowsCache.length === 0;
    renderHistoryTable(historyRowsCache);
    syncHistoryTableEmpty(historyRowsCache.length);
    log(
      `History loaded · ${count} file(s)` +
        (skippedNoOdds ? ` · skipped ${skippedNoOdds} “No odds”` : ''),
      'success'
    );
    toast(
      skippedNoOdds
        ? `History · ${count} file(s) · ${skippedNoOdds} No odds hidden`
        : `History · ${count} file(s)`,
      'success'
    );
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
    if (btnHistoryGenerate) btnHistoryGenerate.disabled = false;
  }
}

/** Manual All export: POST /inmate-exchange/all (?date= optional), then refresh history. */
async function generateExchangeAllManual() {
  if (!btnHistoryGenerate || !window.api?.generateExchangeAll) return;
  ensureHistoryGenerateDateDefault();
  const date = String(historyGenerateDate?.value || '').trim() || null;
  btnHistoryGenerate.disabled = true;
  btnHistoryGenerate.classList.add('loading');
  if (btnHistoryEmptyGenerate) btnHistoryEmptyGenerate.disabled = true;
  if (btnHistoryRefresh) btnHistoryRefresh.disabled = true;
  const label = date || 'today';
  if (historyHint) historyHint.textContent = `Exporting for date · ${label}…`;
  setStatusHint(`Exporting exchange for ${label}…`);
  log(`Exporting exchange for date` + (date ? ` · date=${date}` : ''), 'info');
  try {
    const result = await window.api.generateExchangeAll({ date });
    if (!result?.ok) throw new Error(result?.message || 'Generate failed');
    const summary =
      result.message ||
      `Export ready` + (result.date ? ` · ${result.date}` : date ? ` · ${date}` : '');
    log(summary, 'success');
    toast(summary, 'success');
    setStatusHint(summary);
    await loadExchangeHistory();
    const previewDate = result.date || date;
    if (previewDate) {
      const row = (historyRowsCache || []).find((r) => r.date === previewDate);
      if (row?.url) {
        previewHistoryRow({
          url: row.url,
          date: row.date,
          filename: row.filename || row.file || 'all.txt',
        });
      }
    }
  } catch (error) {
    const message = error.message || String(error);
    if (historyHint) historyHint.textContent = 'Generate failed';
    log(message, 'error');
    toast(message, 'error');
    setStatusHint('Generate failed');
  } finally {
    btnHistoryGenerate.disabled = false;
    btnHistoryGenerate.classList.remove('loading');
    if (btnHistoryEmptyGenerate) btnHistoryEmptyGenerate.disabled = false;
    if (btnHistoryRefresh) btnHistoryRefresh.disabled = false;
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
    const message = error.message || String(error);
    setHistoryPreview({ url: null, text: '', date: null, filename: null });
    log(message, 'error');
    toast(message, 'error');
    setStatusHint('Preview failed');
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
  const rows = historyDataTable
    ? historyDataTable.rows({ search: 'applied' }).data().toArray()
    : historyRowsCache || [];
  if (!rows.length) {
    toast('No filtered rows to export', 'warn');
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
  toast(`CSV exported · ${rows.length} row(s)`, 'success');
}

function wireShellUi() {
  wireThemeControls();
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
  document.getElementById('btnAboutClose')?.addEventListener('click', () => {
    aboutDialog?.close();
  });
  document.getElementById('btnAboutUpdates')?.addEventListener('click', () => {
    aboutDialog?.close();
    openUpdatesDialog();
    const action =
      updateStatus.state === 'available'
        ? 'download'
        : updateStatus.state === 'downloaded'
          ? 'install'
          : 'check';
    runUpdateAction(action);
  });
  btnAbout?.addEventListener('click', () => {
    setAccountMenuOpen(false);
    renderUpdateUi(updateStatus);
    openModalDialog(aboutDialog);
  });
  btnShortcuts?.addEventListener('click', () => {
    setAccountMenuOpen(false);
    openModalDialog(shortcutsDialog);
  });
  document.getElementById('btnShortcutsClose')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (shortcutsDialog?.open) shortcutsDialog.close();
  });
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
    if (btnSend && !btnSend.disabled) {
      startCorrlinksSend();
      return;
    }
    if (!btnLogin.disabled) startCorrlinksLogin();
    else toast(btnSend?.title || btnLogin.title || 'Select an inmate first', 'warn');
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
  startStatusClock();
  scheduleCorrPaneBounds();
  setTimeout(syncCorrPaneBounds, 200);
});
