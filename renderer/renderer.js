const logEl = document.getElementById('log');
const accountSelect = document.getElementById('accountSelect');
const accountMeta = document.getElementById('accountMeta');
const configSummary = document.getElementById('configSummary');
const sportsdataForm = document.getElementById('sportsdataForm');
const sdBaseUrl = document.getElementById('sdBaseUrl');
const sdEmail = document.getElementById('sdEmail');
const sdPassword = document.getElementById('sdPassword');
const sdRemember = document.getElementById('sdRemember');
const btnSaveLogin = document.getElementById('btnSaveLogin');
const btnRefresh = document.getElementById('btnRefresh');
const btnLogin = document.getElementById('btnLogin');
const btnStatus = document.getElementById('btnStatus');

/** @type {Array<any>} */
let accounts = [];

function stamp() {
  return new Date().toLocaleTimeString();
}

function log(message, level = 'info') {
  const line = document.createElement('div');
  if (level === 'ok') line.className = 'ok';
  if (level === 'err') line.className = 'err';
  line.textContent = `[${stamp()}] ${message}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function selectedInmate() {
  const id = accountSelect.value;
  return accounts.find((a) => String(a.id) === String(id)) || null;
}

function setConfigSummary(summary) {
  configSummary.textContent = `Base: ${summary.baseUrl} · Operator: ${summary.email || '(missing)'} · TZ: ${
    summary.timezone || 'n/a'
  } · Subject now: ${summary.subjectToday || 'n/a'}`;
}

function fillLoginForm(summary) {
  if (summary.baseUrl) sdBaseUrl.value = summary.baseUrl;
  if (summary.email) sdEmail.value = summary.email;
  if (summary.password) sdPassword.value = summary.password;
}

function renderAccounts(list) {
  accounts = Array.isArray(list) ? list : [];
  accountSelect.innerHTML = '';

  if (!accounts.length) {
    accountSelect.disabled = true;
    btnLogin.disabled = true;
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No inmates returned';
    accountSelect.appendChild(opt);
    accountMeta.textContent = '';
    return;
  }

  accounts.forEach((inmate, index) => {
    const opt = document.createElement('option');
    opt.value = String(inmate.id);
    const primaryEmail = inmate.corrlinks_account?.email || 'no-primary';
    opt.textContent = `${inmate.name || 'Inmate'} (${inmate.inmate_id || inmate.id}) · ${primaryEmail}`;
    if (index === 0) opt.selected = true;
    accountSelect.appendChild(opt);
  });

  accountSelect.disabled = false;
  btnLogin.disabled = false;
  updateAccountMeta();
}

function updateAccountMeta() {
  const inmate = selectedInmate();
  if (!inmate) {
    accountMeta.textContent = '';
    return;
  }
  const primary = inmate.corrlinks_account;
  const second = inmate.second_corrlinks_account;
  const exchange = inmate.inmate_exchange || {};
  const sendable = exchange.sendable || [];
  const skipped = exchange.skipped || [];
  accountMeta.textContent = [
    `Status: ${inmate.status || 'n/a'}`,
    `Primary: ${primary?.email || 'none'}${primary?.password ? '' : ' (no password)'}`,
    `Second: ${second?.email || 'none'}${second?.password ? '' : second?.email ? ' (no password)' : ''}`,
    `Files: ${sendable.length} sendable` + (skipped.length ? `, ${skipped.length} empty skipped` : ''),
  ].join(' · ');
}

async function ensureCredentialsSaved() {
  const email = sdEmail.value.trim();
  const password = sdPassword.value;
  const baseUrl = sdBaseUrl.value.trim() || 'https://sportsdata.com';

  if (!email || !password) {
    throw new Error('Enter SportsData email and password');
  }

  const result = await window.api.saveSportsDataLogin({
    email,
    password,
    baseUrl,
    remember: sdRemember.checked,
  });
  if (!result.ok) throw new Error(result.message || 'Failed to save login');
  return result;
}

async function refreshInmates() {
  btnRefresh.disabled = true;
  log('Refreshing inmate accounts from SportsData…');
  try {
    await ensureCredentialsSaved();
    const result = await window.api.refreshAccounts();
    if (!result.ok) {
      log(result.message || 'Refresh failed', 'err');
      return;
    }
    renderAccounts(result.accounts);
    log(`Loaded ${result.accounts.length} inmate(s)`, 'ok');
  } catch (error) {
    log(error.message || String(error), 'err');
  } finally {
    btnRefresh.disabled = false;
  }
}

async function init() {
  try {
    const summary = await window.api.getConfigSummary();
    fillLoginForm(summary);
    setConfigSummary(summary);
    log('Control UI ready');
    if (summary.credentialsPath && summary.hasPassword) {
      log(`Remembered SportsData login (${summary.email})`);
    } else if (summary.envPath) {
      log(`Loaded .env from: ${summary.envPath}`);
    }
    if (!summary.hasPassword && !summary.email) {
      log('Enter SportsData email and password, then Save login', 'err');
    } else if (!summary.hasPassword) {
      log('Missing SportsData password — enter it and Save login', 'err');
    }
  } catch (error) {
    configSummary.textContent = 'Failed to load config';
    log(error.message || String(error), 'err');
  }
}

sportsdataForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  btnSaveLogin.disabled = true;
  try {
    const saved = await ensureCredentialsSaved();
    const summary = await window.api.getConfigSummary();
    fillLoginForm(summary);
    setConfigSummary(summary);
    log(`SportsData login saved for ${saved.email}`, 'ok');
    if (saved.credentialsPath) log(`Stored at: ${saved.credentialsPath}`);
    await refreshInmates();
  } catch (error) {
    log(error.message || String(error), 'err');
  } finally {
    btnSaveLogin.disabled = false;
  }
});

btnRefresh.addEventListener('click', () => {
  refreshInmates();
});

accountSelect.addEventListener('change', updateAccountMeta);

btnLogin.addEventListener('click', async () => {
  const inmate = selectedInmate();
  if (!inmate) {
    log('Select an inmate first', 'err');
    return;
  }
  if (!inmate.corrlinks_account?.email || !inmate.corrlinks_account?.password) {
    log('Selected inmate has no primary CorrLinks credentials', 'err');
    return;
  }

  btnLogin.disabled = true;
  log(
    `Login primary ${inmate.corrlinks_account.email}` +
      (inmate.second_corrlinks_account?.email
        ? ` (fallback ${inmate.second_corrlinks_account.email} if locked)`
        : '')
  );
  try {
    const result = await window.api.loginCorrlinks({ inmateId: inmate.id });
    const status = result.status || {};
    if (status.state === 'success') {
      const via = status.usedSecondAccount ? 'second' : status.attempt || 'primary';
      log(`Login success via ${via}: ${status.email} — ${status.message}`, 'ok');
      if (status.recipient?.ok) log(`To selected: ${status.recipient.selected}`, 'ok');
      else if (status.recipient) log(`To select failed: ${status.recipient.reason || 'unknown'}`, 'err');
      if (status.subjectResult?.ok) log(`Subject: ${status.subject}`, 'ok');
      else if (status.subject) log(`Subject failed: ${status.subject}`, 'err');
      if (status.bodyResult?.ok) {
        log(
          `Pasted body part ${status.pastedPart?.part || '?'}: ${status.pastedPart?.filename || ''} (${status.pastedPart?.characters || 0} chars) — not sent`,
          'ok'
        );
      } else if (status.bodyResult?.skipped) {
        log(status.bodyResult.reason || 'No body to paste', 'err');
      } else if (status.bodyResult) {
        log(`Body paste failed: ${status.bodyResult.reason || 'unknown'}`, 'err');
      }
      if (status.pendingParts?.length) {
        log(`Pending parts (future sends): ${status.pendingParts.map((p) => p.filename).join(', ')}`);
      }
      if (status.exchangeSkipped?.length) {
        log(`Skipped empty: ${status.exchangeSkipped.map((f) => f.filename).join(', ')}`);
      }
    } else if (status.state === 'manual') {
      log(`Manual action needed (${status.attempt || 'n/a'}): ${status.message}`, 'err');
    } else if (status.state === 'locked') {
      log(`Locked: ${status.message}`, status.loggedIn ? 'info' : 'err');
      if (status.recipient?.ok) log(`To selected: ${status.recipient.selected}`, 'ok');
      else if (status.recipient) log(`To select failed: ${status.recipient.reason || 'unknown'}`, 'err');
      if (status.subjectResult?.ok) log(`Subject: ${status.subject}`, 'ok');
      else if (status.subject) log(`Subject failed: ${status.subject}`, 'err');
      if (status.bodyResult?.ok) {
        log(
          `Pasted body part ${status.pastedPart?.part || '?'}: ${status.pastedPart?.filename || ''} (${status.pastedPart?.characters || 0} chars) — not sent`,
          'ok'
        );
      }
      if (status.pendingParts?.length) {
        log(`Pending parts (future sends): ${status.pendingParts.map((p) => p.filename).join(', ')}`);
      }
    } else {
      log(`${status.state || 'error'}: ${status.message || 'Login failed'}`, 'err');
    }
  } catch (error) {
    log(error.message || String(error), 'err');
  } finally {
    btnLogin.disabled = !selectedInmate();
  }
});

btnStatus.addEventListener('click', async () => {
  try {
    const status = await window.api.getCorrlinksStatus();
    log(
      `Status: ${status.state} — ${status.message}` +
        (status.attempt ? ` [${status.attempt}]` : '') +
        (status.url ? ` @ ${status.url}` : '')
    );
  } catch (error) {
    log(error.message || String(error), 'err');
  }
});

init();
