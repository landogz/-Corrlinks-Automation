const THEME_STORAGE_KEY = 'iea.theme';
const DENSITY_STORAGE_KEY = 'iea.density';
const TYPE_STORAGE_KEY = 'iea.typeScale';

const APPEARANCE_FALLBACK = {
  themes: [
    { id: 'auto', label: 'Auto', group: 'system', scheme: null, backgroundColor: null, accentColor: null },
    { id: 'dark', label: 'Dark', group: 'dark', scheme: 'dark', backgroundColor: '#0a0f16', accentColor: '#2dd4bf' },
    { id: 'light', label: 'Light', group: 'light', scheme: 'light', backgroundColor: '#f3f6fa', accentColor: '#0f766e' },
    { id: 'midnight', label: 'Midnight', group: 'dark', scheme: 'dark', backgroundColor: '#06080f', accentColor: '#818cf8' },
    { id: 'slate', label: 'Slate', group: 'dark', scheme: 'dark', backgroundColor: '#0f1419', accentColor: '#38bdf8' },
    { id: 'graphite', label: 'Graphite', group: 'dark', scheme: 'dark', backgroundColor: '#121212', accentColor: '#d4d4d4' },
    { id: 'ocean', label: 'Ocean', group: 'dark', scheme: 'dark', backgroundColor: '#07131c', accentColor: '#22d3ee' },
    { id: 'forest', label: 'Forest', group: 'dark', scheme: 'dark', backgroundColor: '#0a120e', accentColor: '#4ade80' },
    { id: 'amber-night', label: 'Amber Night', group: 'dark', scheme: 'dark', backgroundColor: '#140e08', accentColor: '#fbbf24' },
    { id: 'plum', label: 'Plum', group: 'dark', scheme: 'dark', backgroundColor: '#120a16', accentColor: '#c084fc' },
    { id: 'high-contrast', label: 'High Contrast', group: 'dark', scheme: 'dark', backgroundColor: '#000000', accentColor: '#ffff00' },
    { id: 'warm-paper', label: 'Warm Paper', group: 'light', scheme: 'light', backgroundColor: '#f7f3eb', accentColor: '#b45309' },
    { id: 'soft-gray', label: 'Soft Gray', group: 'light', scheme: 'light', backgroundColor: '#eceff3', accentColor: '#475569' },
    {
      id: 'high-contrast-light',
      label: 'High Contrast Light',
      group: 'light',
      scheme: 'light',
      backgroundColor: '#ffffff',
      accentColor: '#0000ee',
    },
  ],
  densities: [
    { id: 'comfortable', label: 'Comfortable' },
    { id: 'compact', label: 'Compact' },
  ],
  typeScales: [
    { id: 'default', label: 'Default' },
    { id: 'large', label: 'Large' },
  ],
};

function getAppearanceCatalog() {
  const boot = window.__IEA_APPEARANCE__;
  if (boot?.themes?.length) {
    return {
      themes: boot.themes,
      densities: boot.densities?.length ? boot.densities : APPEARANCE_FALLBACK.densities,
      typeScales: boot.typeScales?.length ? boot.typeScales : APPEARANCE_FALLBACK.typeScales,
    };
  }
  return APPEARANCE_FALLBACK;
}

function themeMeta(id) {
  const catalog = getAppearanceCatalog();
  return catalog.themes.find((t) => t.id === id) || catalog.themes.find((t) => t.id === 'auto');
}

function normalizeThemePref(value) {
  const id = String(value || '').toLowerCase();
  return themeMeta(id)?.id || 'auto';
}

function normalizeDensityPref(value) {
  const id = String(value || '').toLowerCase();
  return id === 'compact' ? 'compact' : 'comfortable';
}

function normalizeTypePref(value) {
  const id = String(value || '').toLowerCase();
  return id === 'large' ? 'large' : 'default';
}

function getThemePreference() {
  const boot = window.__IEA_THEME_BOOT__?.preference;
  const pref =
    document.documentElement.dataset.themePref ||
    boot ||
    localStorage.getItem(THEME_STORAGE_KEY) ||
    'auto';
  return normalizeThemePref(pref);
}

function getDensityPreference() {
  const boot = window.__IEA_THEME_BOOT__?.density;
  const pref =
    document.documentElement.dataset.density ||
    boot ||
    localStorage.getItem(DENSITY_STORAGE_KEY) ||
    'comfortable';
  return normalizeDensityPref(pref);
}

function getTypeScalePreference() {
  const boot = window.__IEA_THEME_BOOT__?.typeScale;
  const pref =
    document.documentElement.dataset.type ||
    boot ||
    localStorage.getItem(TYPE_STORAGE_KEY) ||
    'default';
  return normalizeTypePref(pref);
}

function resolveThemePreference(pref = getThemePreference()) {
  const id = normalizeThemePref(pref);
  if (id !== 'auto') return id;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveSchemePreference(pref = getThemePreference()) {
  const id = normalizeThemePref(pref);
  if (id === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return themeMeta(id)?.scheme || 'dark';
}

function syncThemeSwitchUi(
  pref = getThemePreference(),
  density = getDensityPreference(),
  typeScale = getTypeScalePreference()
) {
  document.querySelectorAll('[data-theme-pref]').forEach((btn) => {
    const active = btn.getAttribute('data-theme-pref') === pref;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-density-pref]').forEach((btn) => {
    const active = btn.getAttribute('data-density-pref') === density;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-type-pref]').forEach((btn) => {
    const active = btn.getAttribute('data-type-pref') === typeScale;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const resolved = resolveThemePreference(pref);
  const themeLabel =
    pref === 'auto'
      ? `Auto (${themeMeta(resolved)?.label || resolved})`
      : themeMeta(pref)?.label || pref;
  const densLabel = density === 'compact' ? 'Compact' : 'Comfortable';
  const typeLabel = typeScale === 'large' ? 'Large' : 'Default';
  const summary = `${themeLabel} · ${densLabel} · ${typeLabel}`;
  const aboutTheme = document.getElementById('aboutTheme');
  if (aboutTheme) aboutTheme.textContent = summary;
  document.querySelectorAll('[data-appearance-summary]').forEach((el) => {
    el.textContent = summary;
  });
  const namedActive = pref !== 'auto' && pref !== 'dark' && pref !== 'light';
  document.querySelectorAll('[data-appearance-open-about]').forEach((btn) => {
    btn.classList.toggle('is-active', namedActive);
    btn.setAttribute('aria-pressed', namedActive ? 'true' : 'false');
  });
}

function applyAppearance(
  {
    theme = getThemePreference(),
    density = getDensityPreference(),
    typeScale = getTypeScalePreference(),
  } = {},
  { persist = true } = {}
) {
  const nextTheme = normalizeThemePref(theme);
  const nextDensity = normalizeDensityPref(density);
  const nextType = normalizeTypePref(typeScale);
  const resolved = resolveThemePreference(nextTheme);
  const scheme = resolveSchemePreference(nextTheme);
  const root = document.documentElement;
  root.dataset.themePref = nextTheme;
  root.dataset.theme = resolved;
  root.dataset.scheme = scheme;
  root.dataset.density = nextDensity;
  root.dataset.type = nextType;
  root.style.colorScheme = scheme;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
      localStorage.setItem(TYPE_STORAGE_KEY, nextType);
    } catch (_) {}
  }
  syncThemeSwitchUi(nextTheme, nextDensity, nextType);
  if (persist && window.api?.setAppearance) {
    window.api.setAppearance({ theme: nextTheme, density: nextDensity, typeScale: nextType }).catch(() => {});
  } else if (persist && window.api?.setThemePreference) {
    window.api.setThemePreference(nextTheme).catch(() => {});
  }
  return { preference: nextTheme, resolved, scheme, density: nextDensity, typeScale: nextType };
}

function applyThemePreference(pref = 'auto', { persist = true } = {}) {
  return applyAppearance(
    { theme: pref, density: getDensityPreference(), typeScale: getTypeScalePreference() },
    { persist }
  );
}

async function restoreThemePreference() {
  let theme = getThemePreference();
  let density = getDensityPreference();
  let typeScale = getTypeScalePreference();
  try {
    const saved = await window.api?.getThemePreference?.();
    if (saved?.preference) theme = normalizeThemePref(saved.preference);
    if (saved?.density) density = normalizeDensityPref(saved.density);
    if (saved?.typeScale) typeScale = normalizeTypePref(saved.typeScale);
  } catch (_) {}
  applyAppearance({ theme, density, typeScale }, { persist: true });
}

function buildAppearancePanelHtml(mode = 'full') {
  const catalog = getAppearanceCatalog();
  const dark = catalog.themes.filter((t) => t.group === 'dark');
  const light = catalog.themes.filter((t) => t.group === 'light');
  const dens = catalog.densities;
  const types = catalog.typeScales;

  if (mode === 'compact') {
    return `
      <p class="appearance-label">Appearance</p>
      <div class="appearance-seg appearance-seg--3" role="group" aria-label="Theme">
        <button type="button" class="appearance-btn" data-theme-pref="auto" aria-pressed="false">Auto</button>
        <button type="button" class="appearance-btn" data-theme-pref="dark" aria-pressed="false">Dark</button>
        <button type="button" class="appearance-btn" data-theme-pref="light" aria-pressed="false">Light</button>
      </div>
      <p class="appearance-summary" data-appearance-summary></p>
      <button type="button" class="appearance-more" data-appearance-open-about aria-pressed="false">
        More appearance…
      </button>
    `;
  }

  const chip = (t) => {
    const bg = t.backgroundColor || (t.scheme === 'light' ? '#f3f6fa' : '#0a0f16');
    const accent =
      t.accentColor || (t.scheme === 'light' ? '#0f766e' : '#2dd4bf');
    return `<button type="button" class="appearance-swatch appearance-swatch--card" data-theme-pref="${t.id}" aria-pressed="false" title="${t.label}" aria-label="${t.label}">
      <span class="appearance-swatch-preview" aria-hidden="true" style="--swatch-bg:${bg};--swatch-accent:${accent}">
        <span class="appearance-swatch-bg"></span>
        <span class="appearance-swatch-accent"></span>
      </span>
      <span class="appearance-swatch-name">${t.label}</span>
    </button>`;
  };

  return `
    <p class="appearance-label">Appearance</p>
    <div class="appearance-auto-row" role="group" aria-label="System theme">
      <button type="button" class="appearance-btn" data-theme-pref="auto" aria-pressed="false">Auto (system)</button>
    </div>
    <p class="appearance-group-label">Dark</p>
    <div class="appearance-chip-grid" role="group" aria-label="Dark themes">
      ${dark.map(chip).join('')}
    </div>
    <p class="appearance-group-label">Light</p>
    <div class="appearance-chip-grid" role="group" aria-label="Light themes">
      ${light.map(chip).join('')}
    </div>
    <div class="appearance-layout-block">
      <p class="appearance-group-label">Density</p>
      <div class="appearance-seg appearance-seg--layout" role="group" aria-label="Density">
        ${dens
          .map(
            (d) =>
              `<button type="button" class="appearance-btn appearance-btn--seg" data-density-pref="${d.id}" aria-pressed="false">${d.label}</button>`
          )
          .join('')}
      </div>
      <p class="appearance-group-label">Text size</p>
      <div class="appearance-seg appearance-seg--layout" role="group" aria-label="Text size">
        ${types
          .map(
            (t) =>
              `<button type="button" class="appearance-btn appearance-btn--seg" data-type-pref="${t.id}" aria-pressed="false">${t.label}</button>`
          )
          .join('')}
      </div>
    </div>
    <p class="appearance-summary" data-appearance-summary></p>
  `;
}

function mountAppearancePanels() {
  document.querySelectorAll('[data-appearance-mount]').forEach((el) => {
    const mount = el.getAttribute('data-appearance-mount') || 'full';
    const mode = mount === 'account' ? 'compact' : 'full';
    el.dataset.appearanceMode = mode;
    el.innerHTML = buildAppearancePanelHtml(mode);
  });
  syncThemeSwitchUi();
}

function openAboutAppearance() {
  try {
    setAccountMenuOpen(false);
  } catch (_) {}
  if (typeof renderUpdateUi === 'function') {
    try {
      renderUpdateUi(updateStatus);
    } catch (_) {}
  }
  if (aboutDialog && typeof openModalDialog === 'function') {
    openModalDialog(aboutDialog);
    aboutDialog.querySelector?.('.about-theme')?.scrollIntoView?.({ block: 'nearest' });
  }
}

function wireThemeControls() {
  mountAppearancePanels();
  document.addEventListener('click', (event) => {
    const moreBtn = event.target.closest?.('[data-appearance-open-about]');
    if (moreBtn) {
      event.preventDefault();
      event.stopPropagation();
      openAboutAppearance();
      return;
    }
    const densBtn = event.target.closest?.('[data-density-pref]');
    if (densBtn) {
      event.preventDefault();
      event.stopPropagation();
      applyAppearance(
        {
          theme: getThemePreference(),
          density: densBtn.getAttribute('data-density-pref') || 'comfortable',
          typeScale: getTypeScalePreference(),
        },
        { persist: true }
      );
      return;
    }
    const typeBtn = event.target.closest?.('[data-type-pref]');
    if (typeBtn) {
      event.preventDefault();
      event.stopPropagation();
      applyAppearance(
        {
          theme: getThemePreference(),
          density: getDensityPreference(),
          typeScale: typeBtn.getAttribute('data-type-pref') || 'default',
        },
        { persist: true }
      );
      return;
    }
    const themeBtn = event.target.closest?.('[data-theme-pref]');
    if (themeBtn) {
      event.preventDefault();
      event.stopPropagation();
      applyAppearance(
        {
          theme: themeBtn.getAttribute('data-theme-pref') || 'auto',
          density: getDensityPreference(),
          typeScale: getTypeScalePreference(),
        },
        { persist: true }
      );
    }
  });
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onSystemTheme = () => {
    if (getThemePreference() === 'auto') {
      applyAppearance(
        {
          theme: 'auto',
          density: getDensityPreference(),
          typeScale: getTypeScalePreference(),
        },
        { persist: false }
      );
    }
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
const loopFailedPanel = document.getElementById('loopFailedPanel');
const loopFailedList = document.getElementById('loopFailedList');
const btnRetryFailed = document.getElementById('btnRetryFailed');
const loopDoneFailedWrap = document.getElementById('loopDoneFailedWrap');
const loopDoneFailedList = document.getElementById('loopDoneFailedList');
const btnLoopDoneRetry = document.getElementById('btnLoopDoneRetry');
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
const appVerifyingSpinner = document.getElementById('appVerifyingSpinner');
const appVerifyingFailed = document.getElementById('appVerifyingFailed');
const appVerifyingFailedList = document.getElementById('appVerifyingFailedList');
const appVerifyingFailedHint = document.getElementById('appVerifyingFailedHint');
const btnVerifySkipFailed = document.getElementById('btnVerifySkipFailed');
const btnStopBootVerify = document.getElementById('btnStopBootVerify');
const loopInitializing = appVerifying;
const loopInitializingStatus = appVerifyingStatus;
const loopInitializingDetail = appVerifyingDetail;
/** @type {null | ((choice: { action: 'retry'|'manual-login'|'skip'|'cancel' }) => void)} */
let verifyManualRetryResolver = null;
/** Live one-line probe progress under the verifying overlay. */
let verifyProbeLive = null;
let verifyProbeLiveTimer = null;
let lastVerifyLiveLogKey = '';

const VERIFY_COPY = {
  title: 'Preparing your workspace',
  status: 'Validating CorrLinks accounts',
  statusNew: 'Validating new CorrLinks account(s)',
  statusRetry: 'Retry failed accounts',
  statusManualFill: 'Manual login — paste & click Login',
  statusWatching: 'Watching CorrLinks login response…',
  statusReview: 'Review failed accounts',
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
const btnLogAutoScroll = document.getElementById('btnLogAutoScroll');
const btnLogMask = document.getElementById('btnLogMask');
/** @deprecated kept as aliases for any leftover refs — prefer logAutoScrollOn / logMaskOn */
const logAutoScroll = btnLogAutoScroll;
const logMask = btnLogMask;
let logAutoScrollOn = true;
let logMaskOn = false;
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
/** @type {Array<{ id: string|number, name: string, inmate_id?: string|number, reason: string }>} */
let lastLoopFailed = [];
/** File selection snapshot used for the active/next loop run. */
let loopFileSnapshot = { keys: [], parts: [] };
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
/** Unique CorrLinks email+password fingerprint (incremental validation key). */
let lastAccountsFingerprint = null;
/** Per-inmate roster fingerprint — logging only. */
let lastAccountsRosterFingerprint = null;
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
/** Active top-level tab: automate | accounts | history | settings */
let activeMainTab = 'automate';
/** History sub-mode: exchange | sends */
let historyMode = 'exchange';
/** @type {any} */
let historyDataTable = null;
let historyLoaded = false;
/** @type {any[]} */
let sendHistoryRuns = [];
/** @type {string|null} */
let sendHistorySelectedId = null;
/** @type {{ enabled: boolean, sendTime: string, sendTimes: string[], sendKind: string, sendKindByTime: Record<string, string>, lastFiredNyDate: string|null, lastFiredByTime: Record<string, string> }} */
let loopScheduleState = {
  enabled: false,
  sendTime: '08:05',
  sendTimes: ['08:05', '09:30', '10:05', '11:30', '12:05'],
  sendKind: 'daily',
  sendKindByTime: {
    '08:05': 'daily',
    '09:30': 'weekly_cfb',
    '10:05': 'daily',
    '11:30': 'weekly_cfb',
    '12:05': 'daily',
  },
  lastFiredNyDate: null,
  lastFiredByTime: {},
};
/** @type {{ date: string, timeLabel: string, minutes: number }|null} */
let loopScheduleClock = null;
/** Latest next-due label from main (optional). */
let loopScheduleNextDue = '—';
let loopScheduleTimer = null;
let loopScheduleFiring = false;
/** When editing a saved slot, holds the stored HH:mm key. */
let settingsEditingTime = null;
/** Source tag for the in-flight / next loop history row. */
let pendingLoopHistorySource = 'loop';
let loopRunStartedAt = null;
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
/** Always America/New_York — OS timezone does not affect the UI clock or subject. */
const APP_TIMEZONE = 'America/New_York';
let appTimezone = APP_TIMEZONE;

function getDisplayTimeZone() {
  return APP_TIMEZONE;
}

function stamp() {
  return new Date().toLocaleTimeString([], {
    hour12: true,
    timeZone: getDisplayTimeZone(),
  });
}

/** Compact wall clock in America/New_York — e.g. "Nov 10, 2026 · 12:25 PM EST". */
function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  const timeZone = getDisplayTimeZone();
  // Single formatter (not separate date+time calls) — more reliable after macOS TZ changes.
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    const month = get('month');
    const day = get('day');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    const dayPeriod = get('dayPeriod');
    const tzName = get('timeZoneName') || 'ET';
    return `${month} ${day}, ${year} · ${hour}:${minute} ${dayPeriod} ${tzName}`;
  } catch (_) {
    return d.toLocaleString('en-US', { timeZone, hour12: true });
  }
}

let lastSubjectRefreshMinute = -1;

async function refreshDailySubjectHint() {
  if (!window.api?.getSubjectToday && !window.api?.getConfigSummary) return;
  try {
    const result = window.api.getSubjectToday
      ? await window.api.getSubjectToday()
      : await window.api.getConfigSummary();
    appTimezone = APP_TIMEZONE;
    const next = String(result?.subject || result?.subjectToday || '').trim();
    if (!next) return;
    if (next !== dailySubjectHint) {
      dailySubjectHint = next;
      syncTemplateControls();
    }
  } catch (_) {
    /* ignore */
  }
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
  // Subject flips at 1:30am / 5:00am ET — refresh once per minute so the hint is not stuck.
  const minuteKey = Math.floor(now.getTime() / 60_000);
  if (minuteKey !== lastSubjectRefreshMinute) {
    lastSubjectRefreshMinute = minuteKey;
    void refreshDailySubjectHint();
  }
}

function startStatusClock() {
  tickStatusClock();
  if (startStatusClock._timer) clearInterval(startStatusClock._timer);
  startStatusClock._timer = setInterval(tickStatusClock, 1000);
  // macOS TZ / clock changes while the app is open — force a fresh paint on focus.
  if (!startStatusClock._focusBound) {
    startStatusClock._focusBound = true;
    window.addEventListener('focus', () => {
      lastSubjectRefreshMinute = -1;
      tickStatusClock();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        lastSubjectRefreshMinute = -1;
        tickStatusClock();
      }
    });
  }
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
let corrEmbedLiveSyncTimer = null;

function setCorrEmbedLive(on) {
  corrEmbedRevealed = Boolean(on);
  document.body.classList.toggle('corr-embed-live', corrEmbedRevealed);
  document.getElementById('corrPane')?.classList.toggle('is-live', corrEmbedRevealed);
  if (corrEmbedLiveSyncTimer) {
    clearInterval(corrEmbedLiveSyncTimer);
    corrEmbedLiveSyncTimer = null;
  }
  // While the native view is showing, keep bounds locked to #corrPane (loop/layout thrash
  // previously left a floating white rectangle with empty dark space under it).
  if (corrEmbedRevealed) {
    syncCorrPaneBounds();
    corrEmbedLiveSyncTimer = setInterval(() => {
      if (!corrEmbedRevealed || isCorrEmbedBlocked()) return;
      syncCorrPaneBounds();
    }, 250);
  }
}

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
  if (!logMaskOn) return String(text || '');
  return String(text || '').replace(
    /([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '$1***@$2'
  );
}

function syncLogToggleButtons() {
  if (btnLogAutoScroll) {
    btnLogAutoScroll.classList.toggle('is-on', logAutoScrollOn);
    btnLogAutoScroll.setAttribute('aria-pressed', logAutoScrollOn ? 'true' : 'false');
  }
  if (btnLogMask) {
    btnLogMask.classList.toggle('is-on', logMaskOn);
    btnLogMask.setAttribute('aria-pressed', logMaskOn ? 'true' : 'false');
  }
}

/** Re-apply Mask emails to every existing log line (toggle used to only affect new lines). */
function refreshLogMasking() {
  if (!logEl) return;
  [...logEl.querySelectorAll('.log-line')].forEach((line) => {
    const raw = line.dataset.rawMessage;
    const textEl = line.querySelector('.log-msg-text');
    if (textEl && raw != null) textEl.textContent = maskSensitive(raw);
    const pre = line.querySelector('.log-details pre');
    const rawDetails = line.dataset.rawDetails;
    if (pre && rawDetails != null) pre.textContent = maskSensitive(rawDetails);
  });
  applyLogFilter();
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
  const rawMessage = String(message ?? '');
  const line = document.createElement('div');
  line.className = `log-line ${normalized}`;
  line.dataset.level = normalized;
  line.dataset.rawMessage = rawMessage;

  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = stamp();

  const msg = document.createElement('div');
  msg.className = 'log-msg';
  const textEl = document.createElement('span');
  textEl.className = 'log-msg-text';
  textEl.textContent = maskSensitive(rawMessage);
  msg.appendChild(textEl);

  if (details != null) {
    const summary = summarizeDetails(details);
    const detailsEl = document.createElement('details');
    detailsEl.className = 'log-details';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = summary
      ? `Details · ${truncateMiddle(maskSensitive(String(summary)), 48)}`
      : 'Details';
    const pre = document.createElement('pre');
    const rawDetails =
      typeof details === 'string' ? details : JSON.stringify(details, null, 2);
    line.dataset.rawDetails = rawDetails;
    pre.textContent = maskSensitive(rawDetails);
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
  if (logAutoScrollOn) logEl.scrollTop = logEl.scrollHeight;
}

function applyLogFilter() {
  if (!logEl) return;
  const mode = logFilter?.value || 'all';
  const q = String(logSearch?.value || '').trim().toLowerCase();
  [...logEl.children].forEach((line) => {
    const levelOk = mode === 'all' || line.dataset.level === mode;
    const hay = [
      line.dataset.rawMessage || '',
      line.querySelector('.log-time')?.textContent || '',
      line.querySelector('.log-msg')?.innerText || '',
    ]
      .join(' ')
      .toLowerCase();
    const searchOk = !q || hay.includes(q);
    line.hidden = !(levelOk && searchOk);
  });
}

function clearStatusLog() {
  if (logEl) logEl.innerHTML = '';
  logErrorUnread = 0;
  refreshLogBadge();
  toast('Log cleared', 'info');
}

function visibleLogText() {
  return [...(logEl?.querySelectorAll('.log-line') || [])]
    .filter((line) => !line.hidden)
    .map((line) => {
      const time = line.querySelector('.log-time')?.textContent || '';
      const text =
        line.querySelector('.log-msg-text')?.textContent ||
        line.querySelector('.log-msg')?.innerText ||
        '';
      return `${time} ${text}`.trim();
    })
    .join('\n');
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
  // Timezone is fixed to America/New_York; still refresh the clock after config load.
  appTimezone = APP_TIMEZONE;
  tickStatusClock();
  if (summary?.subjectToday != null) {
    dailySubjectHint = String(summary.subjectToday || '').trim();
    syncTemplateControls();
  }
  // Keep login meta (Base / TZ / Subject) hidden from the sign-in screen.
  if (configSummary) {
    configSummary.hidden = true;
    configSummary.textContent = '';
  }
  if (summary && summary.allowCorrlinksSend === false) {
    document.body.classList.add('is-dev-no-send');
    log('Dev test — CorrLinks Send is disabled (compose only)', 'warn');
  } else {
    document.body.classList.remove('is-dev-no-send');
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
  // Only checked files — empty selection means send nothing.
  return all.filter((file, index) => {
    const key = `${file.part}:${file.filename || index}`;
    return selectedFileKeys.includes(key);
  });
}

/** Snapshot checked files so loop/send keep the user's selection across inmate switches. */
function snapshotFileSelection() {
  const keys = selectedFileKeys.slice();
  const parts = [
    ...new Set(keys.map((key) => String(key).split(':')[0]).filter((part) => part && part !== 'undefined')),
  ];
  return { keys, parts };
}

/**
 * Resolve files for an inmate from a checkbox snapshot.
 * Daily loop matches by part number so File 1/2 stays consistent across inmates.
 */
function filesFromSnapshot(inmate, snapshot = loopFileSnapshot) {
  const keys = Array.isArray(snapshot?.keys) ? snapshot.keys : [];
  const parts = Array.isArray(snapshot?.parts) ? snapshot.parts : [];
  if (templateMode === 'weekly') {
    const all = currentSendableFiles(inmate);
    if (!keys.length) return [];
    return all.filter((file, index) => keys.includes(`${file.part}:${file.filename || index}`));
  }
  const all = inmate?.inmate_exchange?.sendable || [];
  if (!keys.length && !parts.length) return [];
  if (parts.length) {
    const byPart = all.filter((file) => parts.includes(String(file.part)));
    if (byPart.length) return byPart;
  }
  return all.filter((file, index) => keys.includes(`${file.part}:${file.filename || index}`));
}

function currentTemplateSubject() {
  if (templateMode === 'weekly') return weeklyCache.subject || weeklyLeague;
  return dailySubjectHint || '—';
}

function currentSendableFiles(inmate) {
  if (templateMode === 'weekly') return Array.isArray(weeklyCache.updates) ? weeklyCache.updates : [];
  return inmate?.inmate_exchange?.sendable || [];
}

function buildTemplatePayload(inmate = selectedInmate(), snapshot = null) {
  if (templateMode === 'weekly') {
    const all = (weeklyCache.updates || []).map((file, index) => ({
      part: file.part || index + 1,
      filename: file.filename || `weekly-${index + 1}.txt`,
      url: file.url,
      characters: file.characters ?? null,
      league: file.league || weeklyLeague,
    }));
    const keys = snapshot?.keys || selectedFileKeys;
    const files = keys.length
      ? all.filter((file, index) => keys.includes(`${file.part}:${file.filename || index}`))
      : [];
    return {
      mode: 'weekly',
      league: weeklyLeague,
      subject: weeklyCache.subject || weeklyLeague,
      files,
    };
  }
  const files = snapshot
    ? filesFromSnapshot(inmate, snapshot)
    : inmate
      ? selectedExchangeFiles(inmate)
      : [];
  return {
    mode: 'daily',
    league: null,
    subject: null,
    // Always pass an array so main does not fall back to every sendable file.
    files: Array.isArray(files) ? files : [],
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

function withContinuationPrefix(text, order = 1) {
  const raw = String(text ?? '');
  const partNum = Number(order);
  if (!(Number.isFinite(partNum) && partNum > 1)) return raw;
  if (/^\s*CONT\.\./i.test(raw)) return raw;
  return `CONT..\n\n${raw}`;
}

async function copySendableFile(file, { order = 1 } = {}) {
  const filename = file?.filename || `part-${order}.txt`;
  if (!file?.url) {
    toast(`No copy URL for ${filename}`, 'error');
    return;
  }
  if (!window.api?.previewExchangeFile) {
    toast('Copy is unavailable in this build', 'error');
    return;
  }
  const partNum = Number(file?.part) > 0 ? Number(file.part) : order;
  setStatusHint(`Copying File ${order}…`);
  try {
    const result = await window.api.previewExchangeFile({
      url: file.url,
      filename,
    });
    if (!result?.ok) throw new Error(result?.message || 'Copy failed');
    const text = withContinuationPrefix(result.text || '', partNum);
    await navigator.clipboard.writeText(text);
    log(`Copied File ${order}: ${filename} · ${text.length.toLocaleString()} chars`, 'success');
    toast(`Copied File ${order}`, 'success');
    setStatusHint(`Copied File ${order} · ${text.length.toLocaleString()} chars`);
  } catch (error) {
    log(error.message || String(error), 'error');
    toast(error.message || String(error), 'error');
    setStatusHint('Copy failed');
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
      ? `${selectedFileKeys.length} of ${sendable.length} selected` +
        (skippedCount ? ` · ${skippedCount} empty skipped` : '')
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
      const syncFileSelectionUi = () => {
        li.classList.toggle('is-unchecked', !cb.checked);
        if (filesHint) {
          filesHint.textContent = sendable.length
            ? `${selectedFileKeys.length} of ${sendable.length} selected` +
              (skippedCount ? ` · ${skippedCount} empty skipped` : '')
            : '';
        }
        updateActionButtons();
      };
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!selectedFileKeys.includes(key)) selectedFileKeys.push(key);
        } else {
          selectedFileKeys = selectedFileKeys.filter((k) => k !== key);
        }
        syncFileSelectionUi();
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
      const actions = document.createElement('div');
      actions.className = 'file-actions';
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'file-copy ghost tiny';
      copyBtn.textContent = 'Copy';
      copyBtn.title = file.url ? `Copy ${filename}` : 'No copy URL';
      copyBtn.setAttribute('aria-label', `Copy file ${order}`);
      copyBtn.disabled = !file.url;
      copyBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        copySendableFile(file, { order });
      });
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
      actions.append(copyBtn, downloadBtn);
      li.addEventListener('click', (event) => {
        if (
          event.target === cb ||
          event.target === copyBtn ||
          event.target === downloadBtn ||
          actions.contains(event.target)
        ) {
          return;
        }
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
      li.classList.toggle('is-unchecked', !cb.checked);
      li.append(cb, label, meta, actions);
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
  void saveLoopSchedulePartial({ sendKind: currentSendKindFromTemplate() }, { toastOnSave: false });
}

async function setWeeklyLeague(league) {
  weeklyLeague = league === 'CFB' ? 'CFB' : 'NFL';
  syncTemplateControls();
  if (templateMode === 'weekly') {
    // Re-fetch even when the same league pill is clicked again.
    await loadWeeklyTemplate({ force: true });
  }
  void saveLoopSchedulePartial({ sendKind: currentSendKindFromTemplate() }, { toastOnSave: false });
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

async function computeAccountsFingerprints(inmateList = accounts) {
  if (!window.api?.fingerprintCorrlinksAccounts) {
    return { fingerprint: null, rosterFingerprint: null };
  }
  const result = await window.api.fingerprintCorrlinksAccounts(inmateList || []);
  return {
    fingerprint: result?.fingerprint || null,
    rosterFingerprint: result?.rosterFingerprint || null,
  };
}

async function computeAccountsFingerprint(inmateList = accounts) {
  const both = await computeAccountsFingerprints(inmateList);
  if (both.rosterFingerprint) lastAccountsRosterFingerprint = both.rosterFingerprint;
  return both.fingerprint;
}

async function credentialHashForAccount(account) {
  if (!window.api?.hashCorrlinksCredential || !account?.email) return '';
  try {
    const result = await window.api.hashCorrlinksCredential({
      email: account.email,
      password: account.password,
    });
    return result?.hash || '';
  } catch (_) {
    return '';
  }
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
      credentialHash: typeof saved.credentialHash === 'string' ? saved.credentialHash : '',
      cached: true,
      persistent: true,
    };
    // Keep soft failures in the probe map so fingerprint coverage skips re-prep,
    // but do not treat them as verified/logged-in for Send.
    map.set(key, { ...entry });
    if (probeIsSoftFailure(entry)) continue;
    if (probeAccountUsable(entry)) {
      verifiedCorrlinksAccounts.set(key, entry);
    }
  }
  bootProbeByEmail = map;
  return map;
}

function persistedCacheCoversAccounts(probes = {}, uniqueAccounts = []) {
  if (!uniqueAccounts.length) return true;
  // Any saved outcome (success, locked, timeout, error) counts as covered.
  // Missing entries (aborted mid-run / never probed) still force a live pass.
  return uniqueAccounts.every((account) => {
    const key = emailLoopKey(account.email);
    const saved = probes?.[key];
    return saved && typeof saved === 'object';
  });
}

async function persistVerifiedAccountsCache(fingerprint, probeByEmail = bootProbeByEmail) {
  if (!fingerprint || !window.api?.saveCorrlinksVerifyCache) return false;
  const probes = {};
  // Persist every probe result — including soft failures — so relaunch can skip
  // "Preparing your workspace" when unique CorrLinks credentials are unchanged.
  for (const [key, value] of probeByEmail.entries()) {
    probes[key] = {
      ...value,
      persistent: true,
    };
  }
  for (const [key, value] of verifiedCorrlinksAccounts.entries()) {
    if (!probes[key]) {
      probes[key] = { ...value, persistent: true };
    }
  }
  const uniqueAccounts = collectUniqueCorrlinksAccounts();
  for (const account of uniqueAccounts) {
    const key = emailLoopKey(account.email);
    if (!probes[key]) continue;
    const hash = await credentialHashForAccount(account);
    if (hash) probes[key].credentialHash = hash;
  }
  if (!lastAccountsRosterFingerprint) {
    const both = await computeAccountsFingerprints(accounts);
    if (both.rosterFingerprint) lastAccountsRosterFingerprint = both.rosterFingerprint;
  }
  const saved = await window.api.saveCorrlinksVerifyCache({
    fingerprint,
    rosterFingerprint: lastAccountsRosterFingerprint || '',
    probes,
  });
  if (saved?.ok) {
    lastAccountsFingerprint = fingerprint;
    for (const [key, value] of verifiedCorrlinksAccounts.entries()) {
      verifiedCorrlinksAccounts.set(key, { ...value, persistent: true });
    }
    renderAccountsValidationPanel();
    return true;
  }
  return false;
}

/**
 * Restore saved probes and return only accounts that still need a live check
 * (missing email, or password changed for that email). Roster growth that reuses
 * existing logins does not force a full re-probe.
 * @returns {Promise<{ ok: boolean, missing?: object[] }>}
 */
async function tryRestoreVerifiedFromDisk(uniqueAccounts = collectUniqueCorrlinksAccounts()) {
  if (!window.api?.loadCorrlinksVerifyCache) return { ok: false };
  const both = await computeAccountsFingerprints(accounts);
  const fingerprint = both.fingerprint;
  lastAccountsFingerprint = fingerprint;
  if (both.rosterFingerprint) lastAccountsRosterFingerprint = both.rosterFingerprint;
  if (!fingerprint) return { ok: false };

  const cache = await window.api.loadCorrlinksVerifyCache();
  if (!cache?.ok) {
    log('No saved CorrLinks validation — will validate', 'info');
    return { ok: false, missing: uniqueAccounts.slice() };
  }

  // Merge by email even when the overall credential fingerprint changed (new login added).
  restoreVerifiedFromPersistedProbes(cache.probes, uniqueAccounts);

  const missing = [];
  for (const account of uniqueAccounts) {
    const key = emailLoopKey(account.email);
    const saved = bootProbeByEmail.get(key);
    if (!saved) {
      missing.push(account);
      continue;
    }
    const liveHash = await credentialHashForAccount(account);
    if (saved.credentialHash && liveHash && saved.credentialHash !== liveHash) {
      bootProbeByEmail.delete(key);
      verifiedCorrlinksAccounts.delete(key);
      missing.push(account);
    }
  }

  if (missing.length > 0) {
    const cachedCount = uniqueAccounts.length - missing.length;
    log(
      cachedCount > 0
        ? `Saved validation · ${cachedCount} cached · ${missing.length} new/changed need probe`
        : `Saved validation incomplete — ${missing.length} account(s) need probe`,
      'info'
    );
    return { ok: false, missing };
  }

  const ok = [...bootProbeByEmail.values()].filter((s) => probeAccountUsable(s)).length;
  const fail = uniqueAccounts.length - ok;
  // Only force a live re-prep when every saved result is a soft infra failure
  // (timeout/script error). Hard locks with 0 ready still skip the overlay.
  if (ok === 0 && uniqueAccounts.length > 0) {
    const allSoft = uniqueAccounts.every((account) =>
      probeIsSoftFailure(bootProbeByEmail.get(emailLoopKey(account.email)))
    );
    if (allSoft) {
      log('Saved validation has no usable accounts — re-validating live', 'warn');
      clearVerifiedAccounts();
      bootProbeByEmail = new Map();
      accountsVerifiedOnce = false;
      return { ok: false, missing: uniqueAccounts.slice() };
    }
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
  renderAccountsValidationPanel();
  return { ok: true, missing: [] };
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
            ? `Send ${sendableCount} selected files`
            : sendableCount === 1
              ? 'Send selected file'
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
  if (btnRetryFailed) {
    btnRetryFailed.disabled =
      !lastLoopFailed.length || loopRunning || corrlinksLoginBusy || bootVerifyRunning;
  }
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

function clearLoopFailedPanel() {
  lastLoopFailed = [];
  if (loopFailedList) loopFailedList.innerHTML = '';
  if (loopFailedPanel) loopFailedPanel.hidden = true;
  if (btnRetryFailed) btnRetryFailed.disabled = true;
  if (loopDoneFailedWrap) loopDoneFailedWrap.hidden = true;
  if (loopDoneFailedList) loopDoneFailedList.innerHTML = '';
  if (btnLoopDoneRetry) btnLoopDoneRetry.hidden = true;
}

function renderLoopFailedList(failed = lastLoopFailed) {
  const rows = Array.isArray(failed) ? failed : [];
  const renderInto = (listEl) => {
    if (!listEl) return;
    listEl.innerHTML = '';
    rows.forEach((row) => {
      const li = document.createElement('li');
      const name = document.createElement('div');
      name.className = 'fail-name';
      name.textContent = `${row.name || 'Inmate'}${
        row.inmate_id != null ? ` (${row.inmate_id})` : ''
      }`;
      const reason = document.createElement('div');
      reason.className = 'fail-reason';
      reason.textContent = row.reason || 'Send failed';
      li.append(name, reason);
      listEl.appendChild(li);
    });
  };
  renderInto(loopFailedList);
  renderInto(loopDoneFailedList);
  if (loopFailedPanel) loopFailedPanel.hidden = rows.length === 0;
  if (btnRetryFailed) {
    btnRetryFailed.disabled = rows.length === 0 || loopRunning || corrlinksLoginBusy || bootVerifyRunning;
    btnRetryFailed.textContent =
      rows.length > 0 ? `Retry failed (${rows.length})` : 'Retry failed';
  }
  if (loopDoneFailedWrap) loopDoneFailedWrap.hidden = rows.length === 0;
  if (btnLoopDoneRetry) {
    btnLoopDoneRetry.hidden = rows.length === 0;
    btnLoopDoneRetry.textContent =
      rows.length > 0 ? `Retry failed (${rows.length})` : 'Retry failed';
  }
}

function clearLoopResultBanner() {
  lastLoopResult = null;
  clearLoopFailedPanel();
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
    // Still refresh Accounts tab inmate labels if the user is viewing that page.
    if (activeMainTab === 'accounts') renderAccountsValidationPanel();
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
      const uniqueAccounts = collectUniqueCorrlinksAccounts();
      const restored = await tryRestoreVerifiedFromDisk(uniqueAccounts);
      if (restored?.ok) {
        // Existing probes cover every unique login (e.g. email removed, or roster-only change).
      } else if (restored?.missing?.length) {
        log(
          `CorrLinks credentials changed — validating ${restored.missing.length} new/changed account(s)`,
          'info'
        );
        await verifyCorrlinksAccountsOnBoot({
          force: true,
          onlyAccounts: restored.missing,
        });
      } else {
        clearVerifiedAccounts();
        bootProbeByEmail = new Map();
        accountsVerifiedOnce = false;
        log('CorrLinks credentials changed — re-validating all accounts', 'info');
        await verifyCorrlinksAccountsOnBoot({ force: true });
      }
    }

    // Always refresh Accounts tab from the latest API roster (add/remove inmates/emails).
    renderAccountsValidationPanel();

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
  setCorrEmbedLive(true);
  setCorrPlaceholderVisible(false);
  setCorrPanelBusy(send ? 'Sending…' : 'Logging in…');
  setCorrlinksConnected(false, true);
  // Open the pane in parallel with login — do not wait for full page load before Send.
  const revealPromise = revealCorrlinksEmbed().catch(() => null);
  syncCorrPaneBounds();
  const template = buildTemplatePayload(inmate);
  const files = Array.isArray(template.files) ? template.files : selectedExchangeFiles(inmate);
  if (template.mode === 'weekly' && !(weeklyCache.updates || []).length) {
    toast(`No ${weeklyLeague} weekly file loaded — pick Weekly update again`, 'error');
    corrlinksLoginBusy = false;
    setCorrPanelBusy(null);
    updateActionButtons();
    return null;
  }
  if (send && !files.length) {
    toast('Check at least one sendable file before sending', 'warn');
    corrlinksLoginBusy = false;
    setCorrPanelBusy(null);
    updateActionButtons();
    return null;
  }
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
        ? ` · AUTO-SEND ${files.length} selected file${files.length === 1 ? '' : 's'} (single inmate)`
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

function resolveVerifyManualRetry(choice) {
  if (!verifyManualRetryResolver) return;
  const resolve = verifyManualRetryResolver;
  verifyManualRetryResolver = null;
  resolve(choice || { action: 'cancel' });
}

function waitForVerifyManualRetry() {
  return new Promise((resolve) => {
    verifyManualRetryResolver = resolve;
  });
}

function hideVerifyFailedReview() {
  resolveVerifyManualRetry({ action: 'cancel' });
  document.querySelector('.app-verifying-card')?.classList.remove('is-review');
  if (appVerifyingFailed) appVerifyingFailed.hidden = true;
  if (appVerifyingFailedList) appVerifyingFailedList.innerHTML = '';
  if (appVerifyingSpinner) appVerifyingSpinner.hidden = false;
  if (btnVerifySkipFailed) btnVerifySkipFailed.disabled = true;
}

/** Human-readable probe failure tag + detail (Locked, Timeout, Error, …). */
function formatProbeFailureInfo(status) {
  const message = String(status?.message || '').trim();
  const state = String(status?.state || '').toLowerCase();
  if (state === 'locked' || /locked|too many (failed )?login|temporarily unavailable/i.test(message)) {
    return { tag: 'Locked', reason: message || 'Account locked', locked: true };
  }
  if (state === 'timeout' || /timed?\s*out/i.test(message)) {
    return { tag: 'Timeout', reason: message || 'Login timed out', locked: false };
  }
  if (state === 'manual') {
    return { tag: 'Manual', reason: message || 'Needs manual login', locked: false };
  }
  if (/invalid|incorrect password|wrong password|authentication failed/i.test(message)) {
    return { tag: 'Invalid login', reason: message || 'Invalid credentials', locked: false };
  }
  if (state === 'error' || !state) {
    return { tag: 'Error', reason: message || 'Login failed', locked: false };
  }
  return {
    tag: state.charAt(0).toUpperCase() + state.slice(1),
    reason: message || 'Probe failed',
    locked: false,
  };
}

function renderVerifyFailedReview({ rows = [], watchingEmail = null, watching = false } = {}) {
  const card = document.querySelector('.app-verifying-card');
  card?.classList.add('is-review');
  if (appVerifyingSpinner) appVerifyingSpinner.hidden = true;
  if (!appVerifyingFailed || !appVerifyingFailedList) return;
  appVerifyingFailed.hidden = false;
  appVerifyingFailedList.innerHTML = '';
  const watchingKey = emailLoopKey(watchingEmail);

  rows.forEach((row) => {
    const info = formatProbeFailureInfo(row.status);
    const li = document.createElement('li');
    if (info.locked) li.classList.add('is-locked');
    const rowKey = emailLoopKey(row.email);
    const isWatchingRow = Boolean(watching && watchingKey && rowKey === watchingKey);
    if (isWatchingRow) li.classList.add('is-watching');

    const rawEmail = String(row.email || row.account?.email || '').trim();
    const rawPassword = String(row.password || row.account?.password || '');

    const main = document.createElement('div');
    main.className = 'fail-main';
    const tag = document.createElement('div');
    tag.className = 'fail-tag';
    tag.textContent = isWatchingRow ? 'Watching' : info.tag;
    const reason = document.createElement('div');
    reason.className = 'fail-reason';
    reason.textContent = isWatchingRow
      ? 'Paste email/password on the right and click Login — response is watched automatically'
      : row.reason || info.reason;

    const creds = document.createElement('div');
    creds.className = 'fail-creds';

    function makeCredRow(label, value, copyLabel) {
      const rowEl = document.createElement('div');
      rowEl.className = 'fail-cred-row';
      const lab = document.createElement('span');
      lab.className = 'fail-cred-label';
      lab.textContent = label;
      const val = document.createElement('code');
      val.className = 'fail-cred-value';
      val.textContent = value || '—';
      val.title = value || '';
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'ghost tiny fail-cred-copy';
      copyBtn.textContent = 'Copy';
      copyBtn.disabled = !value;
      copyBtn.title = value ? `Copy ${copyLabel}` : `No ${copyLabel}`;
      copyBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!value) return;
        navigator.clipboard.writeText(String(value)).then(
          () => toast(`Copied ${copyLabel}`, 'success'),
          () => toast('Copy failed', 'error')
        );
      });
      rowEl.append(lab, val, copyBtn);
      return rowEl;
    }

    creds.append(
      makeCredRow('Email', rawEmail, 'email'),
      makeCredRow('Password', rawPassword, 'password')
    );
    main.append(tag, reason, creds);

    const actions = document.createElement('div');
    actions.className = 'fail-actions';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'action-secondary tiny fail-retry';
    retryBtn.textContent = 'Retry';
    retryBtn.title = `Auto-retry ${rawEmail || row.emailLabel || 'account'}`;
    retryBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      resolveVerifyManualRetry({
        action: 'retry',
        email: row.email,
        emailKey: emailLoopKey(row.email),
      });
    });

    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = 'ghost tiny fail-fill';
    fillBtn.textContent = isWatchingRow ? 'Watching…' : 'Watch this';
    fillBtn.title = isWatchingRow
      ? 'Already watching Login response for this account'
      : `Watch Login response for ${rawEmail || row.emailLabel || 'account'}`;
    fillBtn.disabled = Boolean(info.locked) || isWatchingRow;
    fillBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      resolveVerifyManualRetry({
        action: 'manual-login',
        email: row.email,
        emailKey: emailLoopKey(row.email),
      });
    });

    actions.append(retryBtn, fillBtn);
    li.append(main, actions);
    appVerifyingFailedList.appendChild(li);
  });

  const lockedCount = rows.filter((row) => formatProbeFailureInfo(row.status).locked).length;
  if (appVerifyingFailedHint) {
    appVerifyingFailedHint.textContent = rows.length
      ? `${rows.length} failed` +
        (lockedCount ? ` · ${lockedCount} locked` : '') +
        (watching
          ? ` · paste into CorrLinks and click Login — watching response`
          : ` · copy email/password, then Retry or Watch this`)
      : 'No failed accounts left.';
  }
  if (btnVerifySkipFailed) {
    btnVerifySkipFailed.disabled = false;
    btnVerifySkipFailed.textContent = rows.length ? 'Continue without retries' : 'Continue';
  }
}

/** Open a clean CorrLinks login page in the Preparing right pane for copy/paste recovery. */
async function openPrepareLoginPage({
  hint = 'Login page ready — copy email/password from the left and paste here',
} = {}) {
  const corrHint = document.querySelector('.app-verifying-corr-hint');
  if (corrHint) corrHint.textContent = hint;
  document.body.classList.add('is-preparing-workspace');
  await revealCorrlinksForPrepare().catch(() => null);
  requestAnimationFrame(() => syncCorrPaneBounds());
}

function setLoopInitializingOverlay(opts = null) {
  if (!loopInitializing) return;
  if (!opts || opts.active === false) {
    loopInitializingActive = false;
    loopInitializing.hidden = true;
    loopInitializing.setAttribute('aria-busy', 'false');
    document.body.classList.remove('is-preparing-workspace');
    if (appVerifyingTitle) appVerifyingTitle.textContent = VERIFY_COPY.title;
    if (loopInitializingStatus) loopInitializingStatus.textContent = VERIFY_COPY.defaultStatus;
    if (loopInitializingDetail) loopInitializingDetail.textContent = '';
    clearVerifyProbeLive();
    setAppVerifyingProgress({ percent: 0 });
    hideVerifyFailedReview();
    syncCorrPaneBounds();
    return;
  }
  // Never resurrect the cover after Force stop / verify end.
  if (!verifyingSessionActive()) {
    loopInitializingActive = false;
    loopInitializing.hidden = true;
    loopInitializing.setAttribute('aria-busy', 'false');
    document.body.classList.remove('is-preparing-workspace');
    clearVerifyProbeLive();
    hideVerifyFailedReview();
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
  if (!opts.reviewFailed) {
    document.querySelector('.app-verifying-card')?.classList.remove('is-review');
    if (appVerifyingFailed) appVerifyingFailed.hidden = true;
    if (appVerifyingSpinner) appVerifyingSpinner.hidden = false;
  }
  document.body.classList.add('is-preparing-workspace');
  // Show CorrLinks in the overlay's right pane (not parked off-screen).
  requestAnimationFrame(() => {
    syncCorrPaneBounds();
  });
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

  async function probeAccountLive(
    account,
    { indexLabel, current, total, awaitUserSubmit = false, keepReviewVisible = false } = {}
  ) {
    if (!isActive()) return false;
    const accountLabel = maskSensitive(account.email);
    const roleTag = accountRoleLabel(account);
    const key = emailLoopKey(account.email);
    const manualFill = Boolean(awaitUserSubmit);
    const keepReview = Boolean(keepReviewVisible) && manualFill;
    const plainEmail = String(account.email || '').trim();
    setVerifyProbeLive({
      indexLabel,
      accountLabel,
      statusLabel: manualFill ? VERIFY_COPY.statusWatching : statusLabel,
      current,
      total,
      step: manualFill
        ? 'Paste credentials and click Login — watching response…'
        : 'Starting CorrLinks login…',
    });
    setLoopInitializingOverlay({
      active: true,
      status: manualFill ? VERIFY_COPY.statusWatching : statusLabel,
      detail: `${indexLabel} · ${plainEmail || accountLabel}`,
      current,
      total,
      reviewFailed: keepReview,
      live: manualFill
        ? `Paste ${plainEmail || accountLabel} and click Login — watching response`
        : undefined,
    });
    if (keepReview) {
      if (appVerifyingSpinner) appVerifyingSpinner.hidden = true;
      if (appVerifyingFailed) appVerifyingFailed.hidden = false;
    }
    setLoopProgress(
      `${manualFill ? VERIFY_COPY.statusWatching : statusLabel} · ${indexLabel}`
    );
    setStatusHint(
      `${manualFill ? VERIFY_COPY.statusWatching : statusLabel} · ${indexLabel}`
    );
    log(
      `—— ${indexLabel}: ${accountLabel} [${roleTag}]` +
        (manualFill ? ' · manual login (watching your Login click)' : '') +
        ' ——',
      'info'
    );
    if (account.primaryFor?.length) {
      log(`  PRIMARY for: ${account.primaryFor.join('; ')}`, 'info');
    }
    if (account.secondFor?.length) {
      log(`  SECONDARY for: ${account.secondFor.join('; ')}`, 'info');
    }

    // Manual login needs time to type + click Login (main waits up to ~180–240s).
    const PROBE_DEADLINE_MS = manualFill ? 250_000 : 75_000;
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
            { quietToast: true, awaitUserSubmit: manualFill }
          ),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  state: 'timeout',
                  message: manualFill
                    ? `Timed out waiting for your login after ${PROBE_DEADLINE_MS / 1000}s`
                    : `Probe timed out after ${PROBE_DEADLINE_MS / 1000}s`,
                }),
              PROBE_DEADLINE_MS
            )
          ),
        ]);
        if (timedOut || status?.state === 'timeout') {
          pushVerifyProbeStep(
            manualFill
              ? 'Timed out waiting for your login — resetting panel…'
              : 'Timed out — resetting panel…'
          );
          await forceResetCorrlinksPanel();
        }
        return status;
      } finally {
        clearTimeout(timer);
      }
    }

    function isTransientProbeFailure(status) {
      const msg = String(status?.message || '');
      const state = String(status?.state || '');
      return (
        state === 'timeout' ||
        /script failed to execute|object has been destroyed|ERR_FAILED|-2|ERR_CONNECTION|ERR_NETWORK|ERR_TIMED_OUT|ERR_ABORTED|debugger session timeout|cdp type timeout|page script timeout/i.test(
          msg
        )
      );
    }

    let status = await loginWithDeadline();
    // Transient load / CDP / timeout noise — reset panel and retry once (Locked is final).
    // Manual login: do not auto-retry (operator types & clicks Login).
    if (
      isActive() &&
      status &&
      !probeAccountUsable(status) &&
      isTransientProbeFailure(status) &&
      !manualFill
    ) {
      log(
        `Probe transient failure · ${accountLabel} — resetting panel and retrying once`,
        'warn'
      );
      pushVerifyProbeStep('Transient failure — retrying once…');
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

    if (!keepReview) {
      await forceResetCorrlinksPanel();
    }
    clearVerifyProbeLive();
    if (!isActive()) return usable;
    if (!keepReview) {
      setLoopInitializingOverlay({
        active: true,
        status: statusLabel,
        detail: indexLabel,
        current,
        total,
      });
      hideCorrEmbedNow();
    }
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

  const buildFailedLoginRows = () =>
    pending
      .filter((account) => {
        const status = probeByEmail.get(emailLoopKey(account.email));
        return !probeAccountUsable(status);
      })
      .map((account) => {
        const status = probeByEmail.get(emailLoopKey(account.email));
        const info = formatProbeFailureInfo(status);
        return {
          account,
          email: account.email,
          password: account.password || '',
          emailLabel: maskSensitive(account.email),
          reason: info.reason,
          tag: info.tag,
          status,
        };
      });

  let failedRows = buildFailedLoginRows();
  if (failedRows.length) {
    log(
      `Probe finished with ${failedRows.length} failed login(s):\n` +
        failedRows
          .map((row, idx) => `  ${idx + 1}. ${row.emailLabel} — ${row.tag}: ${row.reason}`)
          .join('\n'),
      'warn'
    );
  }

  // Failed review: auto-open login + auto-watch response while showing copyable credentials.
  if (failedRows.length && isActive()) {
    let retryIndex = 0;
    while (isActive() && failedRows.length) {
      const focusRow =
        failedRows.find((row) => !formatProbeFailureInfo(row.status).locked) || null;
      const focusEmail = String(focusRow?.email || focusRow?.account?.email || '').trim();

      async function runAutoRetry(next, { manual = false } = {}) {
        if (!next?.account) return;
        retryIndex += 1;
        const corrHint = document.querySelector('.app-verifying-corr-hint');
        if (corrHint) {
          corrHint.textContent = manual
            ? 'Paste email/password and click Login — watching response'
            : 'Login runs here while accounts are validated';
        }
        if (!manual) {
          document.querySelector('.app-verifying-card')?.classList.remove('is-review');
          if (appVerifyingFailed) appVerifyingFailed.hidden = true;
          if (appVerifyingSpinner) appVerifyingSpinner.hidden = false;
        }
        setLoopInitializingOverlay({
          active: true,
          status: manual ? VERIFY_COPY.statusWatching : VERIFY_COPY.statusRetry,
          detail: manual
            ? `Watching ${retryIndex} · ${focusEmail || next.emailLabel} · was ${next.tag}`
            : `Retry ${retryIndex} · ${next.emailLabel} · was ${next.tag}`,
          current: probeTotal,
          total: probeTotal,
          reviewFailed: Boolean(manual),
          live: manual
            ? `Paste ${focusEmail || next.emailLabel} and click Login — watching response…`
            : `Retrying ${next.emailLabel}…`,
          logLive: true,
        });
        if (manual) {
          renderVerifyFailedReview({
            rows: failedRows,
            watchingEmail: next.email,
            watching: true,
          });
        }
        log(
          manual
            ? `Auto-watch login ${retryIndex}: ${next.emailLabel} (was ${next.tag}: ${next.reason})`
            : `Manual retry ${retryIndex}: ${next.emailLabel} (was ${next.tag}: ${next.reason})`,
          'info'
        );
        await probeAccountLive(next.account, {
          indexLabel: manual ? `Watch ${retryIndex}` : `Retry ${retryIndex}`,
          current: probeTotal,
          total: probeTotal,
          awaitUserSubmit: Boolean(manual),
          keepReviewVisible: Boolean(manual),
        });
        if (corrHint) {
          corrHint.textContent = 'Login runs here while accounts are validated';
        }
      }

      // All remaining are locked — wait for skip / retry only (no auto-watch).
      if (!focusRow?.account) {
        setLoopInitializingOverlay({
          active: true,
          status: VERIFY_COPY.statusReview,
          detail: `${failedRows.length} failed · locked accounts need Continue or Retry`,
          current: probeTotal,
          total: probeTotal,
          reviewFailed: true,
          live: '',
        });
        renderVerifyFailedReview({ rows: failedRows });
        const choice = await waitForVerifyManualRetry();
        if (!isActive() || choice?.action === 'cancel') break;
        if (choice?.action === 'skip') {
          log(
            `Continued without retrying ${failedRows.length} failed account(s): ` +
              failedRows.map((row) => `${row.emailLabel} (${row.tag})`).join(', '),
            'warn'
          );
          break;
        }
        if (choice?.action === 'retry') {
          const emailKey = choice.emailKey || emailLoopKey(choice.email);
          const next =
            failedRows.find((row) => emailLoopKey(row.email) === emailKey) ||
            failedRows.find(
              (row) =>
                String(row.email).toLowerCase() === String(choice.email || '').toLowerCase()
            );
          await runAutoRetry(next, { manual: false });
          if (!isActive()) break;
          failedRows = buildFailedLoginRows();
          continue;
        }
        continue;
      }

      setLoopInitializingOverlay({
        active: true,
        status: VERIFY_COPY.statusWatching,
        detail: `${failedRows.length} failed · copy ${focusEmail}, paste, click Login`,
        current: probeTotal,
        total: probeTotal,
        reviewFailed: true,
        live: `Watching response for ${focusEmail}…`,
      });
      renderVerifyFailedReview({
        rows: failedRows,
        watchingEmail: focusRow.email,
        watching: true,
      });

      // Race: auto-watch Login response vs operator Skip / Retry / Watch another.
      retryIndex += 1;
      const watchIndex = retryIndex;
      log(
        `Auto-watch login ${watchIndex}: ${focusRow.emailLabel} (was ${focusRow.tag}: ${focusRow.reason})`,
        'info'
      );
      const corrHint = document.querySelector('.app-verifying-corr-hint');
      if (corrHint) {
        corrHint.textContent = `Paste ${focusEmail} and click Login — watching response`;
      }

      const watchPromise = probeAccountLive(focusRow.account, {
        indexLabel: `Watch ${watchIndex}`,
        current: probeTotal,
        total: probeTotal,
        awaitUserSubmit: true,
        keepReviewVisible: true,
      }).then((usable) => ({ type: 'watch', usable }));

      const choicePromise = waitForVerifyManualRetry().then((choice) => ({
        type: 'choice',
        choice,
      }));

      const winner = await Promise.race([watchPromise, choicePromise]);
      if (!isActive()) {
        await forceResetCorrlinksPanel().catch(() => null);
        break;
      }

      if (winner.type === 'watch') {
        // Finish waiting for choice resolver so the next loop can wait again.
        resolveVerifyManualRetry({ action: 'watched' });
        void choicePromise;
        if (corrHint) {
          corrHint.textContent = 'Login runs here while accounts are validated';
        }
        failedRows = buildFailedLoginRows();
        if (winner.usable) {
          log(`Manual login OK · ${focusRow.emailLabel}`, 'success');
        }
        continue;
      }

      // Operator clicked Skip / Retry / Watch another — stop the in-flight watcher.
      await forceResetCorrlinksPanel().catch(() => null);
      void watchPromise;
      const choice = winner.choice;
      if (!isActive() || choice?.action === 'cancel' || choice?.action === 'watched') break;
      if (choice?.action === 'skip') {
        log(
          `Continued without retrying ${failedRows.length} failed account(s): ` +
            failedRows.map((row) => `${row.emailLabel} (${row.tag})`).join(', '),
          'warn'
        );
        break;
      }
      const isManualLogin =
        choice?.action === 'manual-login' || choice?.action === 'manual-fill';
      if (choice?.action !== 'retry' && !isManualLogin) continue;

      const emailKey = choice.emailKey || emailLoopKey(choice.email);
      const next =
        failedRows.find((row) => emailLoopKey(row.email) === emailKey) ||
        failedRows.find(
          (row) => String(row.email).toLowerCase() === String(choice.email || '').toLowerCase()
        );
      if (!next?.account) continue;

      // Same account already being watched — ignore.
      if (isManualLogin && emailLoopKey(next.email) === emailLoopKey(focusRow.email)) {
        continue;
      }

      await runAutoRetry(next, { manual: isManualLogin });
      if (!isActive()) break;
      failedRows = buildFailedLoginRows();
    }
    hideVerifyFailedReview();
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

async function verifyCorrlinksAccountsOnBoot({
  force = false,
  mode = 'boot',
  onlyAccounts = null,
} = {}) {
  if (bootVerifyRunning || loopRunning || corrlinksLoginBusy) return null;
  const allAccounts = collectUniqueCorrlinksAccounts();
  const uniqueAccounts =
    Array.isArray(onlyAccounts) && onlyAccounts.length ? onlyAccounts : allAccounts;
  const manual = mode === 'manual';
  if (!allAccounts.length) {
    accountsVerifiedOnce = true;
    bootProbeByEmail = new Map();
    setStatusHint('No CorrLinks accounts to verify');
    return { probeByEmail: bootProbeByEmail, probeOk: 0, probeFail: 0, probeTotal: 0 };
  }
  if (accountsVerifiedOnce && !force) {
    // Prefer session verified cache, but keep bootProbeByEmail soft failures so we
    // don't re-open Preparing your workspace for already-known unavailable accounts.
    const map = new Map(bootProbeByEmail);
    allAccounts.forEach((account) => {
      const key = emailLoopKey(account.email);
      const cached = getCachedVerifiedProbe(account.email);
      if (cached) map.set(key, cached);
    });
    if (allAccounts.every((account) => map.has(emailLoopKey(account.email)))) {
      bootProbeByEmail = map;
      const ok = [...map.values()].filter((s) => probeAccountUsable(s)).length;
      const fail = allAccounts.length - ok;
      const summary =
        fail > 0
          ? `Accounts unchanged · using saved validation · ${ok} ready · ${fail} unavailable`
          : `Accounts unchanged · using saved validation · ${ok} accounts ready`;
      log(summary, fail > 0 ? 'warn' : 'success');
      toast(summary, fail > 0 ? 'warn' : 'success');
      setStatusHint(summary);
      return { probeByEmail: map, probeOk: ok, probeFail: fail, probeTotal: allAccounts.length };
    }
  }

  bootVerifyRunning = true;
  bootVerifyAbort = false;
  updateActionButtons();
  const subset = uniqueAccounts.length < allAccounts.length;
  const title = manual ? VERIFY_COPY.manualTitle : VERIFY_COPY.title;
  const statusLabel = manual
    ? VERIFY_COPY.manualStatus
    : subset
      ? `Validating ${uniqueAccounts.length} new account(s)`
      : VERIFY_COPY.status;
  const priorProbes = new Map(bootProbeByEmail);
  log(
    `${manual ? 'Manual validation' : 'Workspace setup'} — validating ${uniqueAccounts.length} CorrLinks account(s)` +
      (subset ? ` (${allAccounts.length - uniqueAccounts.length} already cached)` : ''),
    'info'
  );
  toast(
    manual
      ? 'Manual validation… re-checking CorrLinks accounts'
      : subset
        ? `Preparing workspace… checking ${uniqueAccounts.length} new/changed account(s)`
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
    // Merge with any previously restored probes when only missing accounts were live-checked.
    const merged = new Map(priorProbes);
    for (const [key, value] of result.probeByEmail.entries()) {
      merged.set(key, value);
    }
    // Ensure every known account key exists in the merged map for persistence/coverage.
    for (const account of allAccounts) {
      const key = emailLoopKey(account.email);
      if (!merged.has(key) && priorProbes.has(key)) merged.set(key, priorProbes.get(key));
    }
    bootProbeByEmail = merged;
    result.probeByEmail = merged;
    result.probeOk = [...merged.values()].filter((s) => probeAccountUsable(s)).length;
    result.probeFail = allAccounts.length - result.probeOk;
    result.probeTotal = allAccounts.length;
    // Persist even when force-stopped mid-run so the next launch can skip accounts
    // already probed (otherwise every relaunch re-opens Preparing your workspace).
    accountsVerifiedOnce =
      !result.aborted ||
      [...result.probeByEmail.values()].some((s) => probeAccountUsable(s) || !probeIsSoftFailure(s));
    const fingerprint = lastAccountsFingerprint || (await computeAccountsFingerprint(accounts));
    if (fingerprint && result.probeByEmail.size > 0) {
      const saved = await persistVerifiedAccountsCache(fingerprint, result.probeByEmail);
      if (saved) {
        log(
          result.aborted
            ? 'Saved partial CorrLinks validation for next launch'
            : 'Saved CorrLinks validation for next launch',
          'info'
        );
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
    renderAccountsValidationPanel();
    return result;
  } finally {
    bootVerifyRunning = false;
    bootVerifyAbort = false;
    setLoopInitializingOverlay(null);
    hideCorrEmbedNow();
    updateActionButtons();
    renderAccountsValidationPanel();
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
  const { quietToast = false, awaitUserSubmit = false } = options;
  if (!group?.email || !group?.password) {
    log('CorrLinks account missing credentials', 'error');
    return null;
  }
  if (corrlinksLoginBusy) return null;

  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  setStatusHint(
    awaitUserSubmit
      ? `Manual login ${maskSensitive(group.email)} — type & click Login…`
      : `Logging in ${maskSensitive(group.email)}…`
  );
  setCorrPanelBusy(awaitUserSubmit ? 'You type & click Login…' : 'Logging in…');
  setCorrlinksConnected(false, true);
  // Overlay probes use the Preparing right slot. Start loop login must fill #corrPane
  // (quietToast used to wrongly reopen the small preview card).
  if (bootVerifyRunning || loopInitializingActive) {
    await revealCorrlinksForPrepare().catch(() => null);
  } else {
    await revealCorrlinksEmbed().catch(() => null);
  }
  log(
    `Account login ${maskSensitive(group.email)}` +
      (group.secondEmail ? ` (fallback ${maskSensitive(group.secondEmail)} if locked)` : '') +
      (awaitUserSubmit ? ' · manual (you type & click Login)' : '') +
      ' · no compose yet',
    'info'
  );
  try {
    const result = await window.api.loginCorrlinksAccount({
      email: group.email,
      password: group.password,
      secondEmail: group.secondEmail,
      secondPassword: group.secondPassword,
      fillPane: !(loopInitializingActive || bootVerifyRunning),
      awaitUserSubmit: Boolean(awaitUserSubmit),
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
  const { quietToast = false, send = true, fileSnapshot = null } = options;
  if (!inmate) return null;
  if (corrlinksLoginBusy) return null;

  corrlinksLoginBusy = true;
  updateActionButtons({ canLogin: true });
  const snapshot = fileSnapshot || snapshotFileSelection();
  const template = buildTemplatePayload(inmate, snapshot);
  const selectedFiles = Array.isArray(template.files) ? template.files : [];
  if (template.mode === 'weekly' && !(weeklyCache.updates || []).length) {
    corrlinksLoginBusy = false;
    updateActionButtons();
    toast(`No ${weeklyLeague} weekly file loaded — pick Weekly update again`, 'error');
    return null;
  }
  if (send && !selectedFiles.length) {
    corrlinksLoginBusy = false;
    updateActionButtons();
    const message = 'No exchange files selected to send';
    if (!quietToast) toast(message, 'warn');
    return { state: 'error', message, sent: false };
  }
  const label = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id})`;
  setStatusHint(send ? `Sending: ${label}…` : `Compose: ${label}…`);
  setCorrPanelBusy(send ? 'Sending…' : 'Composing…');
  await revealCorrlinksEmbed().catch(() => null);
  log(
    `${send ? 'Send' : 'Compose'} recipient ${label}` +
      (template.mode === 'weekly' ? ` · weekly ${template.league} · subject ${template.subject}` : '') +
      (send
        ? ` · auto-send ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}`
        : ' · no send'),
    'info'
  );
  try {
    const result = await window.api.composeCorrlinksInmate({
      inmateId: inmate.id,
      template,
      selectedFiles: snapshot.keys,
      exchangeFiles: selectedFiles,
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

async function startInmateLoop(options = {}) {
  // Always clear leftover modals (Loop done, Updates, etc.) before a new run.
  closeAllModalDialogs();
  const retryIds = Array.isArray(options.inmateIds)
    ? options.inmateIds.map(String).filter(Boolean)
    : null;
  const historySource = String(options.source || pendingLoopHistorySource || 'loop');
  pendingLoopHistorySource = 'loop';
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) return;
  // Pull latest inmate roster from SportsData before grouping the loop.
  await syncCorrlinksAccountsQuiet({ reason: 'preflight', force: true });
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) return;
  if (!accountsVerifiedOnce) {
    toast('Wait for account verification to finish', 'warn');
    await verifyCorrlinksAccountsOnBoot({ force: true });
    if (!accountsVerifiedOnce) return;
  }

  // Capture checked files before the loop switches inmates (which re-renders the list).
  loopFileSnapshot = snapshotFileSelection();
  loopRunStartedAt = new Date().toISOString();
  const previewInmate = selectedInmate() || accounts[0] || null;
  const selectedForLoop = previewInmate
    ? filesFromSnapshot(previewInmate, loopFileSnapshot)
    : [];
  if (!selectedForLoop.length && templateMode === 'daily') {
    // Still allow loop if some inmates have matching parts — validate after regroup.
  } else if (templateMode === 'weekly' && !loopFileSnapshot.keys.length) {
    toast('Check at least one weekly file to send', 'warn');
    return;
  }
  if (!loopFileSnapshot.keys.length && !loopFileSnapshot.parts.length) {
    toast('Check at least one sendable file before starting the loop', 'warn');
    return;
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
  const sourceAccounts = retryIds?.length
    ? accounts.filter((inmate) => retryIds.includes(String(inmate.id)))
    : accounts;
  if (retryIds?.length && !sourceAccounts.length) {
    loopRunning = false;
    loopPhase = 'idle';
    updateActionButtons();
    toast('No matching failed recipients left to retry', 'warn');
    return;
  }
  const { groups: rawGroups, duplicates, skipped: rawSkipped } = regroupInmatesAfterProbe(
    sourceAccounts,
    probeByEmail
  );
  const groups = rawGroups
    .map((group) => ({
      ...group,
      inmates: retryIds?.length
        ? group.inmates.filter((inmate) => retryIds.includes(String(inmate.id)))
        : group.inmates.slice(),
    }))
    .filter((group) => group.inmates.length > 0);
  const skipped = retryIds?.length
    ? rawSkipped.filter((row) =>
        retryIds.includes(String(row.inmate?.id || row.id || row.key))
      )
    : rawSkipped;
  /** @type {Array<{ id: string|number, name: string, inmate_id?: string|number, reason: string, failedFiles?: any[] }>} */
  const failedRecipients = [];
  const pushFailed = (inmate, reason, failedParts = null) => {
    if (!inmate) return;
    const failedFiles = Array.isArray(failedParts)
      ? failedParts.map((part) => ({
          inmateId: String(inmate.id),
          part: part?.part ?? null,
          filename: part?.filename || part?.name || null,
          key: part?.key || part?.url || null,
          url: part?.url || null,
          reason: part?.reason || reason || 'Send failed',
        }))
      : [];
    failedRecipients.push({
      id: inmate.id,
      name: inmate.name || 'Inmate',
      inmate_id: inmate.inmate_id ?? inmate.id,
      reason: reason || 'Send failed',
      failedFiles,
    });
  };
  log(
    `Phase 2 — regrouped into ${groups.length} usable account(s)` +
      (retryIds?.length ? ` · retry ${retryIds.length} failed` : '') +
      (duplicates.length ? ` · ${duplicates.length} duplicate(s) skipped` : '') +
      (skipped.length ? ` · ${skipped.length} recipient(s) with no usable account` : '') +
      ` · files: ${loopFileSnapshot.parts.length ? `parts ${loopFileSnapshot.parts.join(',')}` : `${loopFileSnapshot.keys.length} selected`}`,
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
    failedRecipients.push({
      id: row.inmate?.id || row.id || row.key,
      name: row.name || row.inmate?.name || 'Inmate',
      inmate_id: row.inmate?.inmate_id || row.key,
      reason: 'No usable CorrLinks account',
    });
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
      group.inmates.forEach((inmate) =>
        pushFailed(inmate, loginStatus?.message || `Re-login failed · ${accountLabel}`)
      );
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
        const filesForInmate = filesFromSnapshot(inmate, loopFileSnapshot);
        setLoopProgress(
          `Account ${i + 1}/${groups.length}` +
            (viaSecond ? ' · 2nd' : '') +
            ` · Sending ${r + 1}/${group.inmates.length} · ${recipLabel}`
        );
        log(
          `—— Recipient ${r + 1}/${group.inmates.length}: ${recipLabel} · ${filesForInmate.length} file(s) ——`,
          'info'
        );
        selectInmate(inmate.id);
        if (!filesForInmate.length) {
          failCount += 1;
          pushFailed(inmate, 'No checked sendable files for this inmate');
          log(`No checked files for ${recipLabel} — skipped`, 'warn');
          continue;
        }
        const status = await startCorrlinksCompose(inmate, {
          quietToast: true,
          send: true,
          fileSnapshot: loopFileSnapshot,
        });
        if (!loopStillActive(myGeneration)) break;
        if (statusLooksGood(status, { requireSend: true })) okCount += 1;
        else {
          failCount += 1;
          pushFailed(
            inmate,
            status?.message || 'Send did not complete',
            status?.failedParts || null
          );
        }
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
  lastLoopFailed = failedRecipients.slice();
  lastLoopResult = {
    okCount,
    failCount,
    recipientTotal,
    aborted: wasAborted,
    summary,
    level,
    failed: lastLoopFailed.slice(),
  };
  setLoopProgress(title, {
    result: true,
    level,
    aborted: wasAborted,
    okCount,
    failCount,
    recipientTotal,
  });
  renderLoopFailedList(lastLoopFailed);
  setStatusHint(summary);
  log(summary, level);
  if (lastLoopFailed.length) {
    log(
      `Failed recipients (${lastLoopFailed.length}):\n` +
        lastLoopFailed
          .map((row, idx) => `  ${idx + 1}. ${row.name} (${row.inmate_id}) — ${row.reason}`)
          .join('\n'),
      'warn'
    );
  }
  toast(summary, level);
  showLoopDoneAlert({
    aborted: wasAborted,
    okCount,
    failCount,
    recipientTotal,
    summary,
    failed: lastLoopFailed,
  });
  void persistLoopSendHistory({
    source: historySource,
    okCount,
    failCount,
    recipientTotal,
    aborted: wasAborted,
    summary,
    failedRecipients: lastLoopFailed,
    startedAt: loopRunStartedAt,
  });
  loopRunStartedAt = null;
}

function currentSendKindFromTemplate() {
  if (templateMode === 'weekly') {
    return String(weeklyLeague || '').toUpperCase() === 'CFB' ? 'weekly_cfb' : 'weekly_nfl';
  }
  return 'daily';
}

function applySendKindToTemplate(sendKind, { loadWeekly = true } = {}) {
  const kind = String(sendKind || 'daily').toLowerCase();
  if (kind === 'weekly_nfl') {
    templateMode = 'weekly';
    weeklyLeague = 'NFL';
  } else if (kind === 'weekly_cfb') {
    templateMode = 'weekly';
    weeklyLeague = 'CFB';
  } else {
    templateMode = 'daily';
  }
  syncTemplateControls();
  if (loadWeekly && templateMode === 'weekly') void loadWeeklyTemplate({ force: false });
  else if (templateMode === 'daily') void refreshDailySubjectHint();
  updateActionButtons();
}

async function persistLoopSendHistory({
  source = 'loop',
  okCount = 0,
  failCount = 0,
  recipientTotal = 0,
  aborted = false,
  summary = '',
  failedRecipients = [],
  startedAt = null,
} = {}) {
  if (!window.api?.appendSendHistory) return;
  const failed = Array.isArray(failedRecipients) ? failedRecipients : [];
  const recipients = failed.map((row) => ({
    inmateId: row.id,
    name: row.name,
    inmate_id: row.inmate_id,
    status: 'failed',
    reason: row.reason,
    failedFiles: row.failedFiles || [],
  }));
  const failedFiles = recipients.flatMap((row) => row.failedFiles || []);
  try {
    const clock = loopScheduleClock || (await window.api.getLoopSchedule?.())?.clock || null;
    await window.api.appendSendHistory({
      startedAt: startedAt || new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      nyDate: clock?.date || null,
      source,
      sendKind: currentSendKindFromTemplate(),
      okCount,
      failCount,
      recipientTotal,
      aborted,
      summary,
      recipients,
      failedFiles,
    });
    if (historyMode === 'sends' && activeMainTab === 'history') {
      await loadSendHistoryRuns();
    }
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
}

function retryFailedLoopRecipients() {
  const ids = (lastLoopFailed || []).map((row) => row.id).filter((id) => id != null);
  if (!ids.length) {
    toast('No failed recipients to retry', 'warn');
    return;
  }
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) {
    toast('Wait for the current run to finish', 'warn');
    return;
  }
  log(`Retrying ${ids.length} failed recipient(s)…`, 'info');
  toast(`Retrying ${ids.length} failed recipient(s)…`, 'info');
  pendingLoopHistorySource = 'retry';
  void startInmateLoop({ inmateIds: ids, source: 'retry' });
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
  resolveVerifyManualRetry({ action: 'cancel' });
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
    remember: isRememberSportsDataEnabled(),
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
        // User clicked Refresh — always re-probe every unique CorrLinks account.
        clearVerifiedAccounts();
        bootProbeByEmail = new Map();
        accountsVerifiedOnce = false;
        lastAccountsFingerprint =
          (await computeAccountsFingerprint(accounts)) || lastAccountsFingerprint;
        await verifyCorrlinksAccountsOnBoot({ force: true, mode: 'manual' });
      } else {
        const uniqueAccounts = collectUniqueCorrlinksAccounts();
        const restored = await tryRestoreVerifiedFromDisk(uniqueAccounts);
        if (restored?.ok) {
          // Cached probes cover every unique login — skip Preparing your workspace.
        } else if (restored?.missing?.length) {
          log(
            `CorrLinks validation needed for ${restored.missing.length} new/changed account(s)…`,
            'info'
          );
          await verifyCorrlinksAccountsOnBoot({
            force: true,
            onlyAccounts: restored.missing,
          });
        } else {
          clearVerifiedAccounts();
          bootProbeByEmail = new Map();
          accountsVerifiedOnce = false;
          log('CorrLinks accounts changed or no saved validation — validating…', 'info');
          await verifyCorrlinksAccountsOnBoot({ force: true });
        }
      }
      renderAccountsValidationPanel();
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
  lastAccountsRosterFingerprint = null;
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
  else if (state === 'dev') {
    chipText = version ? `v${version} · Dev (no Send)` : 'v… · Dev';
  }

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

function listAppModalDialogs() {
  return [updatesDialog, aboutDialog, shortcutsDialog, loopDoneDialog].filter(Boolean);
}

function anyModalDialogOpen() {
  return listAppModalDialogs().some((dialog) => dialog.open);
}

/** Dismiss completion / about / shortcuts / updates so a new loop is not blocked by a leftover modal. */
function closeAllModalDialogs() {
  listAppModalDialogs().forEach((dialog) => {
    try {
      if (dialog.open) dialog.close();
    } catch (_) {}
  });
  stopModalCorrHideWatch();
}

function forceHideCorrForModal() {
  void window.api?.setCorrBounds?.({ x: 0, y: 0, width: 0, height: 0, force: true });
}

function openModalDialog(dialog) {
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  // Native WebContentsView paints above HTML and steals clicks — collapse + detach it.
  if (corrEmbedRevealed) modalPausedCorrReveal = true;
  setCorrEmbedLive(false);
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
        setCorrEmbedLive(true);
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
function showLoopDoneAlert({
  aborted = false,
  okCount = 0,
  failCount = 0,
  recipientTotal = 0,
  summary = '',
  failed = lastLoopFailed,
} = {}) {
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
        'The loop finished with some recipients not fully sent. Retry the failed list when ready.';
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
  renderLoopFailedList(failed);

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
  if (btnLoopDoneRetry && !btnLoopDoneRetry.dataset.wired) {
    btnLoopDoneRetry.dataset.wired = '1';
    btnLoopDoneRetry.addEventListener('click', (event) => {
      event.preventDefault();
      if (loopDoneDialog?.open) loopDoneDialog.close();
      retryFailedLoopRecipients();
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
      setRememberSportsDataEnabled(true);
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

function isRememberSportsDataEnabled() {
  if (!sdRemember) return true;
  return sdRemember.classList.contains('is-on') || sdRemember.getAttribute('aria-pressed') === 'true';
}

function setRememberSportsDataEnabled(on) {
  if (!sdRemember) return;
  const next = Boolean(on);
  sdRemember.classList.toggle('is-on', next);
  sdRemember.setAttribute('aria-pressed', next ? 'true' : 'false');
}

// Real button toggle — custom checkboxes were unreliable under Electron.
sdRemember?.addEventListener('click', (event) => {
  event.preventDefault();
  if (sdRemember.disabled) return;
  setRememberSportsDataEnabled(!isRememberSportsDataEnabled());
});
setRememberSportsDataEnabled(true);

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
  if (activeMainTab === 'history') {
    if (historyMode === 'sends') void loadSendHistoryRuns();
    else loadExchangeHistory();
  } else if (activeMainTab === 'accounts') void refreshAllCorrlinksAccountsValidation();
  else refreshInmates({ forceValidation: true });
});

mainTabs?.addEventListener('click', (event) => {
  const btn = event.target.closest('.main-tab');
  if (!btn?.dataset?.tab) return;
  setMainTab(btn.dataset.tab);
});

document.getElementById('btnHistoryModeExchange')?.addEventListener('click', () => {
  setHistoryMode('exchange');
});
document.getElementById('btnHistoryModeSends')?.addEventListener('click', () => {
  setHistoryMode('sends');
});
document.getElementById('btnSendHistoryRefresh')?.addEventListener('click', () => {
  void loadSendHistoryRuns();
});
document.getElementById('btnSendHistoryClear')?.addEventListener('click', async () => {
  if (!window.api?.clearSendHistory) return;
  await window.api.clearSendHistory();
  sendHistorySelectedId = null;
  toast('Send history cleared', 'info');
  await loadSendHistoryRuns();
  renderSendHistoryDetail(null);
});

document.getElementById('settingsAutoSendEnabled')?.addEventListener('click', () => {
  const next = !Boolean(loopScheduleState.enabled);
  void saveLoopSchedulePartial({ enabled: next });
});

function formatScheduleTime12h(hhmm) {
  const raw = String(hhmm || '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw || '—';
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return raw;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function readSettingsTimeEditor24h() {
  const hourEl = document.getElementById('settingsSendHourInput');
  const minuteEl = document.getElementById('settingsSendMinuteInput');
  const ampmEl = document.getElementById('settingsSendAmPmInput');
  let hour = Number(hourEl?.value || 5);
  const minute = String(minuteEl?.value || '00').padStart(2, '0');
  const ampm = String(ampmEl?.value || 'AM').toUpperCase();
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) hour = 5;
  if (ampm === 'AM') hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function paintSettingsTimePreview() {
  const preview = document.getElementById('settingsTimePreview');
  if (!preview) return;
  preview.textContent = formatScheduleTime12h(readSettingsTimeEditor24h());
}

function paintSettingsKindSegments(selected) {
  const kind = String(selected || 'daily');
  const kindEl = document.getElementById('settingsSendKindInput');
  if (kindEl) kindEl.value = kind;
  document.querySelectorAll('[data-kind-seg]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-kind-seg') === kind);
  });
}

function fillSettingsTimeEditor(hhmm, sendKind = 'daily') {
  const raw = String(hhmm || '08:05');
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  let hour24 = 8;
  let minute = '05';
  if (m) {
    hour24 = Number(m[1]);
    minute = String(m[2]).padStart(2, '0');
  }
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const hourEl = document.getElementById('settingsSendHourInput');
  const minuteEl = document.getElementById('settingsSendMinuteInput');
  const ampmEl = document.getElementById('settingsSendAmPmInput');
  if (hourEl) hourEl.value = String(hour12);
  if (minuteEl) {
    if (![...minuteEl.options].some((opt) => opt.value === minute)) {
      const opt = document.createElement('option');
      opt.value = minute;
      opt.textContent = minute;
      minuteEl.appendChild(opt);
    }
    minuteEl.value = minute;
  }
  if (ampmEl) ampmEl.value = ampm;
  paintSettingsKindSegments(sendKind || 'daily');
  paintSettingsTimePreview();
}

function setSettingsTimeEditMode(timeOrNull) {
  settingsEditingTime = timeOrNull || null;
  const addBtn = document.getElementById('btnSettingsAddTime');
  const cancelBtn = document.getElementById('btnSettingsCancelEdit');
  const hint = document.getElementById('settingsComposerHint');
  if (addBtn) addBtn.textContent = settingsEditingTime ? 'Save changes' : 'Add time';
  if (cancelBtn) cancelBtn.hidden = !settingsEditingTime;
  if (hint) {
    hint.textContent = settingsEditingTime
      ? `Editing ${formatScheduleTime12h(settingsEditingTime)} · runs daily while Auto-send is on`
      : 'New slot · runs daily while Auto-send is on';
  }
  document.getElementById('settingsTimesEditor')?.classList.toggle('is-editing', Boolean(settingsEditingTime));
  paintLoopScheduleTimesList();
}

function beginEditSettingsSendTime(time) {
  const kind =
    loopScheduleState.sendKindByTime?.[time] || loopScheduleState.sendKind || 'daily';
  fillSettingsTimeEditor(time, kind);
  setSettingsTimeEditMode(time);
  document.getElementById('settingsTimesEditor')?.scrollIntoView?.({ block: 'nearest' });
}

async function saveSettingsSendTimeFromEditor() {
  const value = readSettingsTimeEditor24h();
  const kindInput = document.getElementById('settingsSendKindInput');
  const sendKind = kindInput?.value || 'daily';
  const existing = Array.isArray(loopScheduleState.sendTimes) ? loopScheduleState.sendTimes : [];

  if (settingsEditingTime) {
    if (value !== settingsEditingTime && existing.includes(value)) {
      toast('That time is already saved', 'warn');
      return;
    }
    await saveLoopSchedulePartial({
      updateSlot: { from: settingsEditingTime, to: value, sendKind },
    });
    setSettingsTimeEditMode(null);
    fillSettingsTimeEditor(value, sendKind);
    return;
  }

  if (existing.includes(value)) {
    toast('That time is already saved', 'warn');
    return;
  }
  if (existing.length >= 12) {
    toast('Maximum 12 send times', 'warn');
    return;
  }
  await saveLoopSchedulePartial({ addTime: value, addSendKind: sendKind });
}

document.getElementById('btnSettingsAddTime')?.addEventListener('click', () => {
  void saveSettingsSendTimeFromEditor();
});
document.getElementById('btnSettingsCancelEdit')?.addEventListener('click', () => {
  setSettingsTimeEditMode(null);
  fillSettingsTimeEditor('08:05', 'daily');
});
['settingsSendHourInput', 'settingsSendMinuteInput', 'settingsSendAmPmInput'].forEach((id) => {
  document.getElementById(id)?.addEventListener('change', () => paintSettingsTimePreview());
});
document.querySelector('.settings-kind-segments')?.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-kind-seg]');
  if (!btn) return;
  const kind = btn.getAttribute('data-kind-seg');
  if (!kind) return;
  paintSettingsKindSegments(kind);
});
document.getElementById('settingsTimesFilter')?.addEventListener('input', () => {
  paintLoopScheduleTimesList();
});
document.getElementById('settingsSendTimesBody')?.addEventListener('click', (event) => {
  const editBtn = event.target.closest('[data-edit-time]');
  if (editBtn) {
    const time = editBtn.getAttribute('data-edit-time');
    if (time) beginEditSettingsSendTime(time);
    return;
  }
  const btn = event.target.closest('[data-remove-time]');
  if (!btn) return;
  const time = btn.getAttribute('data-remove-time');
  if (!time) return;
  const times = Array.isArray(loopScheduleState.sendTimes) ? loopScheduleState.sendTimes : [];
  if (times.length <= 1) {
    toast('Keep at least one send time', 'warn');
    return;
  }
  if (settingsEditingTime === time) setSettingsTimeEditMode(null);
  void saveLoopSchedulePartial({ removeTime: time });
});

document.getElementById('btnAccountsValidateNew')?.addEventListener('click', () => {
  void validateNewCorrlinksAccounts();
});
document.getElementById('btnAccountsRefreshAll')?.addEventListener('click', () => {
  void refreshAllCorrlinksAccountsValidation();
});
document.getElementById('accountsTableBody')?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-accounts-retry]');
  if (!btn) return;
  const email = decodeURIComponent(btn.getAttribute('data-accounts-retry') || '');
  if (!email) return;
  void retryOneCorrlinksAccountValidation(email);
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
    setRememberSportsDataEnabled(true);
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

btnRetryFailed?.addEventListener('click', () => {
  retryFailedLoopRecipients();
});

btnStopLoop.addEventListener('click', () => {
  stopInmateLoop();
});

btnStopBootVerify?.addEventListener('click', () => {
  stopBootVerify();
});

btnVerifySkipFailed?.addEventListener('click', () => {
  resolveVerifyManualRetry({ action: 'skip' });
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
    if (logAutoScrollOn) {
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

logFilter?.addEventListener('change', applyLogFilter);

syncLogToggleButtons();
btnLogAutoScroll?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  logAutoScrollOn = !logAutoScrollOn;
  syncLogToggleButtons();
  if (logAutoScrollOn && logEl) logEl.scrollTop = logEl.scrollHeight;
  toast(logAutoScrollOn ? 'Auto-scroll on' : 'Auto-scroll off', 'info');
});
btnLogMask?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  logMaskOn = !logMaskOn;
  syncLogToggleButtons();
  refreshLogMasking();
  toast(logMaskOn ? 'Email masking on' : 'Email masking off', 'info');
});
btnClearLog?.addEventListener('click', () => clearStatusLog());
btnCopyLog?.addEventListener('click', async () => {
  const text = visibleLogText();
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
    clearStatusLog();
    if (!isLogDrawerOpen()) setLogDrawerOpen(true);
  }
});

/** Native WebContentsView paints above HTML — hide it under modals/drawers/menus. */
function isCorrEmbedBlocked() {
  // Login gate must never leave a native CorrLinks view stealing clicks.
  if (document.body.classList.contains('is-login')) return true;
  if (loginScreen && !loginScreen.hidden) return true;
  if (mainShell?.hidden) return true;
  // Status log is a right-side HTML drawer — native CorrLinks must hide or every
  // filter/search/mask/copy/clear click lands on the WebContentsView instead.
  if (isLogDrawerOpen()) return true;
  // Preparing workspace uses its own right-side CorrLinks slot (not blocked).
  if (loopInitializingActive || bootVerifyRunning) return false;
  // Loop countdown overlay must not blank a live loop session.
  if (loopCountdownActive && !(loopRunning || corrEmbedRevealed || corrlinksLoginBusy)) return true;
  if (activeMainTab !== 'automate') return true;
  if (document.body.classList.contains('account-menu-open')) return true;
  if (accountDropdown && !accountDropdown.hidden) return true;
  const dialogs = [updatesDialog, aboutDialog, shortcutsDialog, loopDoneDialog];
  if (dialogs.some((dialog) => dialog && dialog.open)) return true;
  return false;
}

function overlayCorrSlotActive() {
  return Boolean(
    (loopInitializingActive || bootVerifyRunning) &&
      loopInitializing &&
      !loopInitializing.hidden
  );
}

function prepareCorrFallbackBounds() {
  const w = Math.max(320, Math.round((window.innerWidth || 1200) * 0.52));
  const h = Math.max(280, Math.round((window.innerHeight || 800) * 0.72));
  return {
    x: Math.max(280, Math.round((window.innerWidth || 1200) - w - 20)),
    y: Math.max(64, Math.round(((window.innerHeight || 800) - h) / 2)),
    width: w,
    height: h,
  };
}

function hideCorrEmbedNow({ force = false } = {}) {
  if (!window.api?.setCorrBounds) return;
  // Force hide (Status log / modal) must win — otherwise the native view steals clicks.
  if (force) {
    window.api.setCorrBounds({ x: 0, y: 0, width: 0, height: 0, force: true });
    return;
  }
  // During active send/login/probe fill, never collapse to 0×0 — Syncfusion stays empty.
  if (corrEmbedRevealed || corrlinksLoginBusy) return;
  // Preparing workspace: keep the right-hand slot sized (avoid 0×0 flash between probes).
  // If the verify pane has not laid out yet, use a right-half fallback — never 0×0.
  if (overlayCorrSlotActive() || document.body.classList.contains('is-preparing-workspace')) {
    if (!overlayCorrSlotActive()) {
      document.body.classList.remove('is-preparing-workspace');
    } else {
      const bounds = measureVerifyCorrPaneBounds() || prepareCorrFallbackBounds();
      window.api.setCorrBounds({ ...bounds, slot: 'accounts', force: true });
      return;
    }
  }
  window.api.setCorrBounds({ x: 0, y: 0, width: 0, height: 0, force: false });
}

/** Bounds for the Preparing-workspace right-hand CorrLinks preview slot. */
function measureVerifyCorrPaneBounds() {
  const pane = document.getElementById('appVerifyingCorrPane');
  if (!pane || loopInitializing?.hidden) return null;
  const rect = pane.getBoundingClientRect();
  const width = Math.max(0, rect.width);
  const height = Math.max(0, rect.height);
  if (width < 80 || height < 80) return null;
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Compute #corrPane bounds for the native WebContentsView (null when blocked/too small).
 */
function measureCorrPaneBounds() {
  if (overlayCorrSlotActive()) {
    return measureVerifyCorrPaneBounds();
  }
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

  // Floor/ceil so the native view covers the full CSS box (no 1px dark gutters).
  const left = Math.min(Math.max(Math.floor(rect.left), Math.floor(clipLeft)), Math.floor(clipRight));
  const top = Math.min(Math.max(Math.floor(rect.top), Math.floor(clipTop)), Math.floor(clipBottom));
  const right = Math.max(left, Math.min(Math.ceil(rect.right), Math.ceil(clipRight)));
  const bottom = Math.max(top, Math.min(Math.ceil(rect.bottom), Math.ceil(clipBottom)));
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (width < 8 || height < 8) return null;
  return { x: left, y: top, width, height };
}

/**
 * Show CorrLinks inside the Preparing-workspace right pane while accounts validate.
 */
async function revealCorrlinksForPrepare() {
  document.body.classList.add('is-preparing-workspace');
  void document.getElementById('appVerifyingCorrPane')?.offsetWidth;
  let bounds = measureVerifyCorrPaneBounds();
  if (!bounds) {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    bounds = measureVerifyCorrPaneBounds();
  }
  if (!bounds) {
    // Fallback: right half of the window until the overlay finishes layout.
    const w = Math.max(320, Math.round((window.innerWidth || 1200) * 0.52));
    const h = Math.max(280, Math.round((window.innerHeight || 800) * 0.72));
    bounds = {
      x: Math.max(280, Math.round((window.innerWidth || 1200) - w - 20)),
      y: Math.max(64, Math.round(((window.innerHeight || 800) - h) / 2)),
      width: w,
      height: h,
    };
  }
  try {
    if (window.api?.setCorrBounds) {
      await window.api.setCorrBounds({ ...bounds, slot: 'accounts', force: true });
    }
    if (window.api?.warmCorrlinksPanel) {
      await window.api.warmCorrlinksPanel({ bounds, slot: 'accounts', refresh: true });
    }
    const again = measureVerifyCorrPaneBounds() || bounds;
    if (again && window.api?.setCorrBounds) {
      await window.api.setCorrBounds({ ...again, slot: 'accounts', force: true });
      bounds = again;
    }
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
  requestAnimationFrame(() => syncCorrPaneBounds());
  return bounds;
}

function applyCorrBounds(bounds, { fill = false, fitContainer = false, slot = 'loop' } = {}) {
  if (!window.api?.setCorrBounds || !bounds) return null;
  return window.api.setCorrBounds({
    ...bounds,
    slot,
    fill: Boolean(fill),
    fitContainer: Boolean(fitContainer || fill),
    force: true,
  });
}

/**
 * Fill the Automate CorrLinks column (never the leftover Preparing preview island).
 */
function measureLoopFillCorrBounds() {
  const col = document.querySelector('.col-corrlinks');
  const pane = document.getElementById('corrPane');
  const head = document.querySelector('.col-corrlinks .corr-head');
  const footer = document.querySelector('.statusbar');
  if (!col && !pane) return null;
  const colR = (col || pane).getBoundingClientRect();
  const paneR = pane?.getBoundingClientRect();
  const headBottom = head ? Math.ceil(head.getBoundingClientRect().bottom) : Math.floor(colR.top);
  const footerTop = Math.floor(footer?.getBoundingClientRect().top ?? colR.bottom);
  const left = Math.floor(paneR?.left ?? colR.left);
  const right = Math.ceil(paneR?.right ?? colR.right);
  // Always sit under the CORRLINKS header — never cover it.
  const top = Math.max(headBottom, Math.floor(paneR?.top ?? headBottom));
  const bottom = Math.min(Math.ceil(paneR?.bottom ?? colR.bottom), footerTop);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (width < 80 || height < 80) return null;
  return { x: left, y: top, width, height };
}

/** Fallback when #corrPane reports a tiny rect (flex not settled yet). */
function measureCorrColumnFallbackBounds() {
  // Prefer the pane under the CorrLinks header — never cover the toolbar with the native view.
  const pane = document.getElementById('corrPane');
  const card =
    pane ||
    document.querySelector('.col-corrlinks .corr-card') ||
    document.querySelector('.col-corrlinks');
  if (!card) return null;
  const head = document.querySelector('.col-corrlinks .corr-head');
  const rect = card.getBoundingClientRect();
  const headBottom = head ? Math.ceil(head.getBoundingClientRect().bottom) : Math.floor(rect.top);
  const footer = document.querySelector('.statusbar')?.getBoundingClientRect();
  const top = pane ? Math.floor(rect.top) : headBottom;
  const bottom = Math.min(Math.ceil(rect.bottom), Math.floor(footer?.top ?? rect.bottom));
  const left = Math.floor(rect.left);
  const right = Math.ceil(rect.right);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (width < 80 || height < 80) return null;
  return { x: left, y: top, width, height };
}

async function revealCorrlinksEmbed() {
  closeInmateOptions();
  setAccountMenuOpen(false);
  document.body.classList.remove('is-preparing-workspace');
  setCorrEmbedLive(true);
  setCorrPlaceholderVisible(false);
  setCorrPanelBusy('Opening CorrLinks…');
  // Force layout so getBoundingClientRect is accurate after combobox close / loop start.
  void document.getElementById('corrPane')?.offsetWidth;
  void document.querySelector('.col-corrlinks')?.offsetWidth;
  let bounds =
    measureLoopFillCorrBounds() || measureCorrPaneBounds() || measureCorrColumnFallbackBounds();
  if (!bounds) {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    bounds =
      measureLoopFillCorrBounds() || measureCorrPaneBounds() || measureCorrColumnFallbackBounds();
  }
  try {
    if (bounds) await applyCorrBounds(bounds, { fill: true });
    if (window.api?.warmCorrlinksPanel) {
      const warm = await window.api.warmCorrlinksPanel({
        bounds: bounds || undefined,
        fill: true,
        slot: 'loop',
        refresh: true,
      });
      if (warm?.ok) {
        setCorrPanelBusy('CorrLinks loading…');
        if (warm.visible === false) {
          log('CorrLinks warm used window fallback bounds', 'warn');
        }
        const again =
          measureLoopFillCorrBounds() ||
          measureCorrPaneBounds() ||
          measureCorrColumnFallbackBounds() ||
          warm.bounds;
        if (again) {
          await applyCorrBounds(again, { fill: true });
          bounds = again;
        }
      } else {
        log(warm?.message || 'Failed to open CorrLinks panel', 'error');
      }
    }
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
  const live = measureLoopFillCorrBounds() || measureCorrPaneBounds() || bounds;
  if (live) void applyCorrBounds(live, { fill: true });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const again = measureLoopFillCorrBounds() || measureCorrPaneBounds() || bounds;
      if (again) void applyCorrBounds(again, { fill: true });
    });
  });
  setTimeout(() => {
    const again = measureLoopFillCorrBounds() || measureCorrPaneBounds();
    if (again) void applyCorrBounds(again, { fill: true });
  }, 120);
  return bounds || live || null;
}

function resetCorrEmbedReveal() {
  setCorrEmbedLive(false);
  setCorrPanelBusy(null);
  setCorrPlaceholderVisible(true);
}

/**
 * Map #corrPane (or Preparing-workspace right slot) to the Electron WebContentsView.
 * Clip to the visible .app area above the status bar so a scrolled/off-screen
 * pane never paints the embed over the footer or left column.
 */
function syncCorrPaneBounds() {
  if (!window.api?.setCorrBounds) return;

  // Status log / dialogs always win — never let prepare bounds cover the drawer.
  if (isCorrEmbedBlocked()) {
    hideCorrEmbedNow({ force: true });
    return;
  }

  if (overlayCorrSlotActive()) {
    const verifyBounds = measureVerifyCorrPaneBounds() || prepareCorrFallbackBounds();
    window.api.setCorrBounds({ ...verifyBounds, slot: 'accounts', force: true });
    return;
  }
  document.body.classList.remove('is-preparing-workspace');

  const bounds =
    (corrEmbedRevealed ? measureLoopFillCorrBounds() : null) ||
    measureCorrPaneBounds() ||
    (corrEmbedRevealed ? measureCorrColumnFallbackBounds() : null);
  if (!bounds) {
    if (!(corrEmbedRevealed || corrlinksLoginBusy)) hideCorrEmbedNow();
    return;
  }
  void applyCorrBounds(bounds, { fill: Boolean(corrEmbedRevealed) });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function accountValidationStatusMeta(probe) {
  if (!probe) {
    return { label: 'Not checked', className: 'is-pending' };
  }
  if (probeAccountUsable(probe)) {
    return { label: probe.state === 'locked' ? 'OK (locked session)' : 'OK', className: 'is-ok' };
  }
  if (probe.state === 'locked') return { label: 'Locked', className: 'is-locked' };
  if (probe.state === 'timeout') return { label: 'Timeout', className: 'is-timeout' };
  if (probe.state === 'manual') return { label: 'Manual', className: 'is-error' };
  return { label: 'Error', className: 'is-error' };
}

function formatAccountsCheckedAt(probe) {
  const ts = Number(probe?.verifiedAt || 0);
  if (!ts) return '—';
  try {
    return formatDateTime(new Date(ts));
  } catch (_) {
    return '—';
  }
}

function renderAccountsValidationPanel() {
  const body = document.getElementById('accountsTableBody');
  const empty = document.getElementById('accountsTableEmpty');
  const hint = document.getElementById('accountsHint');
  const summaryReady = document.getElementById('accountsSummaryReady');
  const summaryFail = document.getElementById('accountsSummaryFail');
  const summaryPending = document.getElementById('accountsSummaryPending');
  if (!body) return;

  const uniqueAccounts = collectUniqueCorrlinksAccounts();
  let ready = 0;
  let fail = 0;
  let pending = 0;

  body.innerHTML = '';
  if (!uniqueAccounts.length) {
    if (empty) empty.hidden = false;
    if (summaryReady) summaryReady.textContent = '0 ready';
    if (summaryFail) summaryFail.textContent = '0 unavailable';
    if (summaryPending) summaryPending.textContent = '0 not checked';
    if (hint) {
      hint.textContent =
        'Load inmates from SportsData to see unique CorrLinks logins here.';
    }
    return;
  }

  if (empty) empty.hidden = true;

  for (const account of uniqueAccounts) {
    const key = emailLoopKey(account.email);
    const probe =
      bootProbeByEmail.get(key) || getCachedVerifiedProbe(account.email) || null;
    const status = accountValidationStatusMeta(probe);
    if (!probe) pending += 1;
    else if (probeAccountUsable(probe)) ready += 1;
    else fail += 1;

    const inmateLabels = [...(account.primaryFor || []), ...(account.secondFor || [])];
    const inmateSummary =
      inmateLabels.length <= 2
        ? inmateLabels.join(' · ') || '—'
        : `${inmateLabels.slice(0, 2).join(' · ')} +${inmateLabels.length - 2}`;
    const inmatesTooltipHtml = inmateLabels.length
      ? `<ul class="accounts-inmates-tooltip-list">${inmateLabels
          .map((label) => `<li>${escapeHtml(label)}</li>`)
          .join('')}</ul>`
      : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="accounts-email" title="${escapeHtml(account.email)}">${escapeHtml(
        maskSensitive(account.email)
      )}</td>
      <td class="accounts-role">${escapeHtml(accountRoleLabel(account))}</td>
      <td class="accounts-inmates${inmateLabels.length ? ' has-tooltip' : ''}${
        inmateLabels.length > 2 ? ' has-more' : ''
      }" tabindex="${inmateLabels.length ? '0' : '-1'}">
        <span class="accounts-inmates-text">${escapeHtml(inmateSummary)}</span>
        ${
          inmateLabels.length
            ? `<div class="accounts-inmates-tooltip" role="tooltip">${inmatesTooltipHtml}</div>`
            : ''
        }
      </td>
      <td>
        <span class="accounts-status-badge ${status.className}" title="${escapeHtml(
          probe?.message || status.label
        )}">${escapeHtml(status.label)}</span>
      </td>
      <td class="accounts-checked">${escapeHtml(formatAccountsCheckedAt(probe))}</td>
      <td>
        <div class="accounts-row-actions">
          <button
            type="button"
            class="ghost tiny"
            data-accounts-retry="${encodeURIComponent(account.email)}"
            ${bootVerifyRunning || loopRunning || corrlinksLoginBusy ? 'disabled' : ''}
          >Retry</button>
        </div>
      </td>
    `;
    body.appendChild(tr);
  }

  if (summaryReady) summaryReady.textContent = `${ready} ready`;
  if (summaryFail) summaryFail.textContent = `${fail} unavailable`;
  if (summaryPending) summaryPending.textContent = `${pending} not checked`;
  if (hint) {
    hint.textContent =
      pending > 0
        ? `${pending} account(s) not checked yet — use Validate new, or Refresh all to re-check every login.`
        : 'New logins are validated automatically. Refresh all to re-check every account.';
  }
}

async function listAccountsNeedingLiveProbe(uniqueAccounts = collectUniqueCorrlinksAccounts()) {
  // Prefer in-memory probes; if empty, hydrate quietly from disk without toasts.
  if (!bootProbeByEmail.size && window.api?.loadCorrlinksVerifyCache) {
    try {
      const cache = await window.api.loadCorrlinksVerifyCache();
      if (cache?.ok && cache.probes) {
        restoreVerifiedFromPersistedProbes(cache.probes, uniqueAccounts);
      }
    } catch (_) {
      /* ignore */
    }
  }

  const missing = [];
  for (const account of uniqueAccounts) {
    const key = emailLoopKey(account.email);
    const probe =
      bootProbeByEmail.get(key) || getCachedVerifiedProbe(account.email) || null;
    if (!probe) {
      missing.push(account);
      continue;
    }
    const liveHash = await credentialHashForAccount(account);
    if (probe.credentialHash && liveHash && probe.credentialHash !== liveHash) {
      bootProbeByEmail.delete(key);
      verifiedCorrlinksAccounts.delete(key);
      missing.push(account);
    }
  }
  return missing;
}

async function validateNewCorrlinksAccounts() {
  if (bootVerifyRunning || loopRunning || corrlinksLoginBusy) {
    toast('Validation already running', 'warn');
    return;
  }
  const uniqueAccounts = collectUniqueCorrlinksAccounts();
  if (!uniqueAccounts.length) {
    toast('No CorrLinks accounts to validate', 'warn');
    return;
  }
  const missing = await listAccountsNeedingLiveProbe(uniqueAccounts);
  if (!missing.length) {
    toast('All CorrLinks accounts already validated', 'success');
    renderAccountsValidationPanel();
    return;
  }
  await verifyCorrlinksAccountsOnBoot({ force: true, onlyAccounts: missing });
}

async function refreshAllCorrlinksAccountsValidation() {
  if (bootVerifyRunning || loopRunning || corrlinksLoginBusy) {
    toast('Validation already running', 'warn');
    return;
  }
  // Refresh inmates list then force full CorrLinks re-probe.
  await refreshInmates({ forceValidation: true });
}

async function retryOneCorrlinksAccountValidation(email) {
  if (bootVerifyRunning || loopRunning || corrlinksLoginBusy) {
    toast('Validation already running', 'warn');
    return;
  }
  const key = emailLoopKey(email);
  const account = collectUniqueCorrlinksAccounts().find(
    (row) => emailLoopKey(row.email) === key
  );
  if (!account) {
    toast('Account not found on the current inmate list', 'warn');
    return;
  }
  bootProbeByEmail.delete(key);
  verifiedCorrlinksAccounts.delete(key);
  accountsVerifiedOnce = false;
  await verifyCorrlinksAccountsOnBoot({ force: true, onlyAccounts: [account] });
}

function setMainTab(tab) {
  const allowed = new Set(['automate', 'accounts', 'history', 'settings']);
  activeMainTab = allowed.has(tab) ? tab : 'automate';
  document.querySelectorAll('.main-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === activeMainTab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const on = panel.dataset.tabPanel === activeMainTab;
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
  });
  stepIndicator?.classList.toggle('is-hidden', activeMainTab !== 'automate');
  // Keep native CorrLinks / traffic-light area clear when leaving Automate.
  if (activeMainTab !== 'automate') {
    hideCorrEmbedNow({ force: true });
  }
  scheduleCorrPaneBounds();
  if (activeMainTab === 'accounts') renderAccountsValidationPanel();
  if (activeMainTab === 'history') {
    ensureHistoryGenerateDateDefault();
    setHistoryMode(historyMode);
  }
  if (activeMainTab === 'settings') {
    void refreshLoopScheduleUi();
  }
}

function setHistoryMode(mode) {
  historyMode = mode === 'sends' ? 'sends' : 'exchange';
  const exchangeLayout = document.getElementById('historyExchangeLayout');
  const sendsLayout = document.getElementById('historySendsLayout');
  if (exchangeLayout) exchangeLayout.hidden = historyMode !== 'exchange';
  if (sendsLayout) sendsLayout.hidden = historyMode !== 'sends';
  document.querySelectorAll('[data-history-mode]').forEach((btn) => {
    const on = btn.dataset.historyMode === historyMode;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  if (historyMode === 'exchange' && !historyLoaded) loadExchangeHistory();
  if (historyMode === 'sends') void loadSendHistoryRuns();
}

function scheduleSendKindLabel(kind) {
  const key = String(kind || 'daily');
  if (key === 'weekly_nfl') return 'Weekly NFL';
  if (key === 'weekly_cfb') return 'Weekly CFB';
  return 'Daily';
}

function formatScheduleFiredDate(isoDate) {
  const raw = String(isoDate || '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw || '—';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[Number(m[2]) - 1] || m[2];
  return `${month} ${Number(m[3])}`;
}

function paintLoopScheduleTimesList() {
  const body = document.getElementById('settingsSendTimesBody');
  const empty = document.getElementById('settingsSendTimesEmpty');
  const meta = document.getElementById('settingsTimesMeta');
  const filterEl = document.getElementById('settingsTimesFilter');
  if (!body) return;
  const times = Array.isArray(loopScheduleState.sendTimes) ? loopScheduleState.sendTimes : [];
  const kindMap = loopScheduleState.sendKindByTime || {};
  const firedMap = loopScheduleState.lastFiredByTime || {};
  const today = loopScheduleClock?.date || null;
  const filter = String(filterEl?.value || '')
    .trim()
    .toLowerCase();
  const filtered = filter
    ? times.filter((time) => {
        const kind = String(kindMap[time] || loopScheduleState.sendKind || 'daily');
        const label = scheduleSendKindLabel(kind).toLowerCase();
        const display = formatScheduleTime12h(time).toLowerCase();
        return (
          time.toLowerCase().includes(filter) ||
          display.includes(filter) ||
          label.includes(filter)
        );
      })
    : times;
  if (meta) meta.textContent = `${times.length} / 12 times · daily`;
  body.innerHTML = '';
  if (empty) empty.hidden = filtered.length > 0;
  filtered.forEach((time) => {
    const index = times.indexOf(time) + 1;
    const kind = kindMap[time] || loopScheduleState.sendKind || 'daily';
    const kindLabel = scheduleSendKindLabel(kind);
    const firedToday = today && firedMap[time] === today;
    const [hh, mm] = String(time).split(':').map(Number);
    const targetMinutes = (Number(hh) || 0) * 60 + (Number(mm) || 0);
    const nowMinutes = Number(loopScheduleClock?.minutes);
    const missedToday =
      !firedToday &&
      today &&
      Number.isFinite(nowMinutes) &&
      nowMinutes > targetMinutes + 2;
    let todayStatus = 'Pending';
    let todayClass = 'is-pending';
    if (firedToday) {
      todayStatus = 'Sent';
      todayClass = 'is-sent';
    } else if (missedToday) {
      todayStatus = 'Tomorrow';
      todayClass = 'is-missed';
    }
    const canRemove = times.length > 1;
    const display = formatScheduleTime12h(time);
    const editing = settingsEditingTime === time;
    const tr = document.createElement('tr');
    if (editing) tr.classList.add('is-editing');
    tr.innerHTML = `
      <td class="settings-time-index tabular">${index}</td>
      <td><span class="settings-time-value">${escapeHtml(display)}</span></td>
      <td><span class="settings-kind-pill">${escapeHtml(kindLabel)}</span></td>
      <td>
        <span class="settings-time-status ${todayClass}">
          ${todayStatus}
        </span>
      </td>
      <td class="settings-time-actions">
        <div class="settings-time-actions-inner">
          <button
            type="button"
            class="ghost tiny"
            data-edit-time="${escapeHtml(time)}"
            title="Edit ${escapeHtml(display)}"
          >
            Edit
          </button>
          <button
            type="button"
            class="ghost tiny"
            data-remove-time="${escapeHtml(time)}"
            ${canRemove ? '' : 'disabled'}
            title="${canRemove ? `Delete ${escapeHtml(display)}` : 'Keep at least one time'}"
          >
            Delete
          </button>
        </div>
      </td>`;
    body.appendChild(tr);
  });
}

function paintLoopScheduleControls({ syncEnabled = true } = {}) {
  const enabled = Boolean(loopScheduleState.enabled);
  const enabledEl = document.getElementById('settingsAutoSendEnabled');
  if (enabledEl && syncEnabled) {
    enabledEl.classList.toggle('is-on', enabled);
    enabledEl.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    const text = enabledEl.querySelector('.settings-toggle-text');
    if (text) text.textContent = enabled ? 'On' : 'Off';
  }
  const stateLine = document.getElementById('settingsAutoSendStateLine');
  if (stateLine) {
    stateLine.textContent = enabled
      ? 'On — next slot will start the loop'
      : 'Off — times will not fire';
  }
  document.getElementById('settingsLayout')?.classList.toggle('is-armed', enabled);
  const chipLabel = document.getElementById('settingsArmedChipLabel');
  if (chipLabel) chipLabel.textContent = enabled ? 'Armed' : 'Standby';
  paintLoopScheduleTimesList();
  const statusValue = document.getElementById('settingsScheduleStatusValue');
  const nextEl = document.getElementById('settingsScheduleNext');
  const lastEl = document.getElementById('settingsScheduleLast');
  const clockEl = document.getElementById('settingsScheduleClock');
  const clock = loopScheduleClock;
  if (clockEl) {
    clockEl.textContent = clock
      ? `${clock.date} ${formatScheduleTime12h(clock.timeLabel)} NY`
      : '—';
  }
  if (lastEl) {
    const map = loopScheduleState.lastFiredByTime || {};
    const entries = Object.entries(map);
    if (entries.length) {
      lastEl.textContent = entries
        .map(([t, d]) => `${formatScheduleTime12h(t)} · ${formatScheduleFiredDate(d)}`)
        .join(' · ');
    } else if (loopScheduleState.lastFiredNyDate) {
      lastEl.textContent = formatScheduleFiredDate(loopScheduleState.lastFiredNyDate);
    } else {
      lastEl.textContent = '—';
    }
  }
  if (statusValue) {
    const count = (loopScheduleState.sendTimes || []).length;
    statusValue.textContent = enabled
      ? `Armed · ${count} time${count === 1 ? '' : 's'}`
      : 'Auto-send off';
  }
  if (nextEl) {
    nextEl.textContent = enabled ? loopScheduleNextDue || '—' : '—';
  }
}

function applyLoopScheduleResult(result, { syncEnabled = true } = {}) {
  if (result?.schedule) loopScheduleState = { ...loopScheduleState, ...result.schedule };
  if (result?.clock) loopScheduleClock = result.clock;
  if (result?.nextDue != null) loopScheduleNextDue = result.nextDue;
  paintLoopScheduleControls({ syncEnabled });
}

async function refreshLoopScheduleUi({ syncEnabled = true } = {}) {
  if (!window.api?.getLoopSchedule) return;
  try {
    const result = await window.api.getLoopSchedule();
    applyLoopScheduleResult(result, { syncEnabled });
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
}

async function saveLoopSchedulePartial(partial, { toastOnSave = true } = {}) {
  if (!window.api?.setLoopSchedule) return null;
  // Optimistic Auto-send toggle so the 15s ticker cannot stomp mid-click.
  if (partial.enabled != null) {
    loopScheduleState.enabled = Boolean(partial.enabled);
    paintLoopScheduleControls({ syncEnabled: true });
  }
  const result = await window.api.setLoopSchedule(partial);
  applyLoopScheduleResult(result, { syncEnabled: true });
  if (
    partial.sendKind != null ||
    partial.addSendKind != null ||
    partial.setTimeKind != null ||
    partial.updateSlot != null
  ) {
    // Keep Automate template in sync with the kind just edited (not always first slot).
    const kind =
      partial.updateSlot?.sendKind ||
      partial.setTimeKind?.sendKind ||
      partial.addSendKind ||
      partial.sendKind ||
      loopScheduleState.sendKind;
    applySendKindToTemplate(kind, { loadWeekly: true });
  }
  if (toastOnSave) toast('Schedule saved', 'success');
  return result;
}

function isAppReadyForAutoSend() {
  if (mainShell?.hidden) return false;
  if (!accountsVerifiedOnce) return false;
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning || loopScheduleFiring) return false;
  return true;
}

async function maybeAutoStartLoopFromSchedule() {
  if (!window.api?.getLoopSchedule || loopScheduleFiring) return;
  let result;
  try {
    result = await window.api.getLoopSchedule();
  } catch (_) {
    return;
  }
  // Ticker refresh must not fight the user's Auto-send button.
  applyLoopScheduleResult(result, { syncEnabled: true });
  if (!result?.shouldFire?.fire) return;
  if (!isAppReadyForAutoSend()) return;

  const dueTime = result.shouldFire.sendTime || loopScheduleState.sendTime;
  const dueKind =
    result.shouldFire.sendKind ||
    loopScheduleState.sendKindByTime?.[dueTime] ||
    loopScheduleState.sendKind ||
    'daily';
  const dueLabel = formatScheduleTime12h(dueTime);
  loopScheduleFiring = true;
  try {
    closeAllModalDialogs();
    setMainTab('automate');
    applySendKindToTemplate(dueKind, { loadWeekly: true });
    log(`Auto-send · ${dueLabel} NY · ${String(dueKind).replace(/_/g, ' ')}`, 'info');
    toast(`Auto-send · ${dueLabel} NY · ${String(dueKind).replace(/_/g, ' ')}…`, 'info');
    pendingLoopHistorySource = 'auto';
    const genBefore = loopGeneration;
    await startInmateLoop({ source: 'auto' });
    // Only consume this time slot if the loop actually started.
    if (loopGeneration > genBefore) {
      await window.api.markLoopScheduleFired?.({
        nyDate: result.clock?.date,
        sendTime: dueTime,
      });
      if (result.clock?.date && dueTime) {
        loopScheduleState.lastFiredByTime = {
          ...(loopScheduleState.lastFiredByTime || {}),
          [dueTime]: result.clock.date,
        };
        loopScheduleState.lastFiredNyDate = result.clock.date;
      }
      paintLoopScheduleControls({ syncEnabled: false });
    }
  } finally {
    loopScheduleFiring = false;
    setMainTab('settings');
    void refreshLoopScheduleUi({ syncEnabled: false });
  }
}

function startLoopScheduleTicker() {
  if (loopScheduleTimer) clearInterval(loopScheduleTimer);
  void refreshLoopScheduleUi();
  void maybeAutoStartLoopFromSchedule();
  loopScheduleTimer = setInterval(() => {
    void maybeAutoStartLoopFromSchedule();
  }, 15_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void maybeAutoStartLoopFromSchedule();
  });
  window.addEventListener('focus', () => {
    void maybeAutoStartLoopFromSchedule();
  });
}

async function loadSendHistoryRuns() {
  if (!window.api?.listSendHistory) return;
  try {
    const result = await window.api.listSendHistory();
    sendHistoryRuns = Array.isArray(result?.runs) ? result.runs : [];
    renderSendHistoryTable();
    if (sendHistorySelectedId) {
      const still = sendHistoryRuns.find((run) => run.id === sendHistorySelectedId);
      if (still) renderSendHistoryDetail(still);
      else {
        sendHistorySelectedId = null;
        renderSendHistoryDetail(null);
      }
    }
  } catch (error) {
    log(error?.message || String(error), 'warn');
  }
}

function renderSendHistoryTable() {
  const body = document.getElementById('sendHistoryTableBody');
  const empty = document.getElementById('sendHistoryEmpty');
  const wrap = document.getElementById('sendHistoryTableWrap');
  if (!body) return;
  body.innerHTML = '';
  const rows = sendHistoryRuns;
  if (empty) empty.hidden = rows.length > 0;
  if (wrap) {
    wrap.hidden = false;
    wrap.classList.toggle('is-empty', rows.length === 0);
  }
  rows.forEach((run) => {
    const tr = document.createElement('tr');
    if (run.id === sendHistorySelectedId) tr.classList.add('is-active');
    tr.dataset.runId = run.id;
    const when = document.createElement('td');
    when.className = 'tabular';
    when.textContent = `${run.nyDate || '—'} · ${String(run.finishedAt || '')
      .slice(11, 16) || '—'}`;
    const kind = document.createElement('td');
    kind.textContent = run.sendKindLabel || run.sendKind || '—';
    const result = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'send-history-result';
    if (run.aborted) {
      badge.classList.add('is-warn');
      badge.textContent = 'Stopped';
    } else if (run.failCount > 0) {
      badge.classList.add('is-fail');
      badge.textContent = 'Failed';
    } else {
      badge.classList.add('is-ok');
      badge.textContent = 'OK';
    }
    result.appendChild(badge);
    const recipients = document.createElement('td');
    recipients.className = 'tabular';
    recipients.textContent = `${run.okCount}/${run.recipientTotal}`;
    const actions = document.createElement('td');
    actions.textContent = 'Review';
    tr.append(when, kind, result, recipients, actions);
    tr.addEventListener('click', () => {
      sendHistorySelectedId = run.id;
      renderSendHistoryTable();
      renderSendHistoryDetail(run);
    });
    body.appendChild(tr);
  });
}

function renderSendHistoryDetail(run) {
  const empty = document.getElementById('sendHistoryDetailEmpty');
  const body = document.getElementById('sendHistoryDetailBody');
  const title = document.getElementById('sendHistoryDetailTitle');
  const meta = document.getElementById('sendHistoryDetailMeta');
  const summary = document.getElementById('sendHistoryDetailSummary');
  const list = document.getElementById('sendHistoryDetailList');
  if (!run) {
    if (empty) empty.hidden = false;
    if (body) body.hidden = true;
    if (title) title.textContent = 'Run detail';
    if (meta) meta.textContent = 'Select a send run to review failures';
    return;
  }
  if (empty) empty.hidden = true;
  if (body) body.hidden = false;
  if (title) title.textContent = run.sendKindLabel || 'Send run';
  if (meta) {
    meta.textContent = `${run.nyDate || '—'} · ${run.source || 'loop'} · ${run.finishedAt || ''}`;
  }
  if (summary) summary.textContent = run.summary || '';
  if (!list) return;
  list.innerHTML = '';
  const recipients = Array.isArray(run.recipients) ? run.recipients : [];
  if (!recipients.length) {
    const li = document.createElement('li');
    li.innerHTML = '<div class="sh-reason">No per-recipient failures stored for this run.</div>';
    list.appendChild(li);
    return;
  }
  recipients.forEach((row) => {
    const li = document.createElement('li');
    const name = document.createElement('div');
    name.className = 'sh-name';
    name.textContent = `${row.name || 'Inmate'}${row.inmate_id ? ` (${row.inmate_id})` : ''} · ${row.status}`;
    const reason = document.createElement('div');
    reason.className = 'sh-reason';
    reason.textContent = row.reason || '';
    li.append(name, reason);
    if (row.status === 'failed') {
      const actions = document.createElement('div');
      actions.className = 'sh-actions';
      const resendBtn = document.createElement('button');
      resendBtn.type = 'button';
      resendBtn.className = 'action-secondary tiny';
      resendBtn.textContent = 'Resend recipient';
      resendBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void resendHistoryRecipient(run, row);
      });
      actions.appendChild(resendBtn);
      li.appendChild(actions);
      const files = Array.isArray(row.failedFiles) ? row.failedFiles : [];
      if (files.length) {
        const fileList = document.createElement('ul');
        fileList.className = 'send-history-files';
        files.forEach((file) => {
          const fileLi = document.createElement('li');
          const label = document.createElement('span');
          label.textContent =
            file.filename ||
            (file.part != null ? `Part ${file.part}` : 'File') +
              (file.reason ? ` — ${file.reason}` : '');
          const fileBtn = document.createElement('button');
          fileBtn.type = 'button';
          fileBtn.className = 'ghost tiny';
          fileBtn.textContent = 'Resend file';
          fileBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            void resendHistoryFailedFile(run, row, file);
          });
          fileLi.append(label, fileBtn);
          fileList.appendChild(fileLi);
        });
        li.appendChild(fileList);
      }
    }
    list.appendChild(li);
  });
}

async function resendHistoryRecipient(run, row) {
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) {
    toast('Wait for the current run to finish', 'warn');
    return;
  }
  const inmateId = row?.inmateId;
  if (!inmateId) {
    toast('Missing inmate id', 'error');
    return;
  }
  applySendKindToTemplate(run?.sendKind || 'daily', { loadWeekly: true });
  setMainTab('automate');
  pendingLoopHistorySource = 'retry';
  log(`Resend recipient from history · ${row.name || inmateId}`, 'info');
  toast(`Resending ${row.name || 'recipient'}…`, 'info');
  await startInmateLoop({ inmateIds: [inmateId], source: 'retry' });
}

async function resendHistoryFailedFile(run, row, file) {
  if (loopRunning || corrlinksLoginBusy || bootVerifyRunning) {
    toast('Wait for the current run to finish', 'warn');
    return;
  }
  const inmate = accounts.find((a) => String(a.id) === String(row.inmateId));
  if (!inmate) {
    toast('Inmate not in current roster — refresh accounts', 'warn');
    return;
  }
  applySendKindToTemplate(run?.sendKind || 'daily', { loadWeekly: true });
  if (templateMode === 'weekly') await loadWeeklyTemplate({ force: false });
  setMainTab('automate');
  selectInmate(inmate.id);
  const sendable = currentSendableFiles(inmate);
  const part = file?.part;
  const wantName = String(file?.filename || '').trim();
  const wantKey = String(file?.key || file?.url || '').trim();
  const match = sendable.find((item, index) => {
    if (part != null && String(item.part) === String(part)) return true;
    if (wantName && String(item.filename || '') === wantName) return true;
    if (wantKey && (String(item.url || '') === wantKey || String(item.key || '') === wantKey)) {
      return true;
    }
    const key = `${item.part}:${item.filename || index}`;
    return wantKey && key === wantKey;
  });
  if (!match) {
    toast('Failed file not found on this inmate — try Resend recipient', 'warn');
    return;
  }
  const matchIndex = sendable.indexOf(match);
  selectedFileKeys = [`${match.part}:${match.filename || matchIndex}`];
  renderFilesList(inmate);
  updateActionButtons();
  log(
    `Resend failed file from history · ${row.name || inmate.id} · ${match.filename || match.part || 'file'}`,
    'info'
  );
  toast('Resending failed file…', 'info');
  pendingLoopHistorySource = 'retry';
  const status = await startCorrlinksSend({ quietToast: false });
  if (status) {
    const ok = statusLooksGood(status, { requireSend: true });
    void persistLoopSendHistory({
      source: 'retry',
      okCount: ok ? 1 : 0,
      failCount: ok ? 0 : 1,
      recipientTotal: 1,
      aborted: false,
      summary: ok
        ? `Resend file OK · ${match.filename || match.part}`
        : `Resend file failed · ${status.message || 'error'}`,
      failedRecipients: ok
        ? []
        : [
            {
              id: inmate.id,
              name: inmate.name || 'Inmate',
              inmate_id: inmate.inmate_id ?? inmate.id,
              reason: status.message || 'Send did not complete',
              failedFiles: status.failedParts || [
                {
                  inmateId: String(inmate.id),
                  part: match.part,
                  filename: match.filename,
                  url: match.url,
                  reason: status.message || 'Send did not complete',
                },
              ],
            },
          ],
    });
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
  // Calendar date in America/New_York (not the Mac's local timezone).
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
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
const corrColumnEl = document.querySelector('.col-corrlinks');
if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(scheduleCorrPaneBounds);
  if (corrPaneEl) ro.observe(corrPaneEl);
  if (corrColumnEl) ro.observe(corrColumnEl);
  const corrCardEl = document.querySelector('.col-corrlinks .corr-card');
  if (corrCardEl) ro.observe(corrCardEl);
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
  startLoopScheduleTicker();
  scheduleCorrPaneBounds();
  setTimeout(syncCorrPaneBounds, 200);
});
