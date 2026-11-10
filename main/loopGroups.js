/**
 * Shared Start Loop helpers:
 * 1) collect unique CorrLinks accounts from the inmate list (primary vs secondary distinct)
 * 2) regroup recipients onto accounts that passed the lock probe
 */

function inmateHasCorrlinksLogin(inmate) {
  return Boolean(inmate?.corrlinks_account?.email && inmate?.corrlinks_account?.password);
}

function recipientKey(inmate) {
  const id =
    inmate?.inmate_id != null && String(inmate.inmate_id).trim() !== ''
      ? String(inmate.inmate_id).trim()
      : inmate?.id != null && String(inmate.id).trim() !== ''
        ? String(inmate.id).trim()
        : '';
  return id ? id.toLowerCase() : '';
}

function emailKey(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function inmateLabel(inmate) {
  return `${inmate?.name || 'Inmate'} (${inmate?.inmate_id || inmate?.id || '?'})`;
}

/**
 * Every distinct CorrLinks login on the list, with primary vs secondary usage kept distinct.
 * @returns {Array<{
 *   email: string,
 *   password: string,
 *   roles: string[],
 *   primaryFor: string[],
 *   secondFor: string[],
 * }>}
 */
function collectUniqueCorrlinksAccounts(list = []) {
  const accounts = [];
  const indexByEmail = new Map();

  function add(email, password, role, inmate) {
    const key = emailKey(email);
    if (!key || !password) return;
    if (!indexByEmail.has(key)) {
      indexByEmail.set(key, accounts.length);
      accounts.push({
        email: String(email).trim(),
        password,
        roles: [role],
        primaryFor: [],
        secondFor: [],
      });
    }
    const row = accounts[indexByEmail.get(key)];
    if (!row.roles.includes(role)) row.roles.push(role);
    const label = inmateLabel(inmate);
    if (role === 'primary' && !row.primaryFor.includes(label)) row.primaryFor.push(label);
    if (role === 'second' && !row.secondFor.includes(label)) row.secondFor.push(label);
  }

  for (const inmate of list) {
    const primary = inmate?.corrlinks_account || {};
    const second = inmate?.second_corrlinks_account || {};
    add(primary.email, primary.password, 'primary', inmate);
    add(second.email, second.password, 'second', inmate);
  }

  return accounts;
}

function roleLabel(account) {
  const roles = account?.roles || [];
  if (roles.includes('primary') && roles.includes('second')) return 'PRIMARY+SECONDARY';
  if (roles.includes('second')) return 'SECONDARY';
  return 'PRIMARY';
}

/**
 * Initial group by primary only (pre-probe preview / queue UI).
 */
function groupInmatesByCorrlinksAccount(list = []) {
  const groups = [];
  const indexByEmail = new Map();
  const seenRecipients = new Map();
  const duplicates = [];
  let skippedNoCreds = 0;

  for (const inmate of list) {
    if (!inmateHasCorrlinksLogin(inmate)) {
      skippedNoCreds += 1;
      continue;
    }
    const primaryEmail = emailKey(inmate.corrlinks_account.email);
    if (!primaryEmail) {
      skippedNoCreds += 1;
      continue;
    }

    const key = recipientKey(inmate);
    const name = inmate?.name || 'Inmate';
    if (key && seenRecipients.has(key)) {
      duplicates.push({
        key,
        name,
        keptUnder: seenRecipients.get(key),
        ignoredUnder: primaryEmail,
      });
      continue;
    }

    if (!indexByEmail.has(primaryEmail)) {
      indexByEmail.set(primaryEmail, groups.length);
      const second = inmate.second_corrlinks_account || {};
      groups.push({
        email: inmate.corrlinks_account.email,
        password: inmate.corrlinks_account.password,
        secondEmail: second.email || null,
        secondPassword: second.password || null,
        inmates: [],
      });
    }

    const group = groups[indexByEmail.get(primaryEmail)];
    group.inmates.push(inmate);
    if (key) seenRecipients.set(key, primaryEmail);

    if (!group.secondEmail && inmate.second_corrlinks_account?.email) {
      group.secondEmail = inmate.second_corrlinks_account.email;
      group.secondPassword = inmate.second_corrlinks_account.password || null;
    }
  }

  return { groups, duplicates, skippedNoCreds };
}

function probeUsable(probe) {
  return Boolean(
    probe &&
      (probe.state === 'success' || (probe.state === 'locked' && probe.loggedIn))
  );
}

/**
 * After probing every account, assign each inmate to a usable account:
 * primary if OK, else second if OK. Dedupes recipients across accounts.
 * Keeps per-recipient primary/secondary distinction on each assignment.
 */
function regroupInmatesAfterProbe(list = [], probeByEmail = new Map()) {
  const groups = [];
  const indexByEmail = new Map();
  const seenRecipients = new Map();
  const duplicates = [];
  const skipped = [];
  const assignments = [];

  for (const inmate of list) {
    if (!inmateHasCorrlinksLogin(inmate)) continue;

    const key = recipientKey(inmate);
    const name = inmate?.name || 'Inmate';
    const primary = inmate.corrlinks_account || {};
    const second = inmate.second_corrlinks_account || {};
    const primaryKey = emailKey(primary.email);
    const secondKey = emailKey(second.email);
    const primaryProbe = primaryKey ? probeByEmail.get(primaryKey) : null;
    const secondProbe = secondKey ? probeByEmail.get(secondKey) : null;

    let chosen = null;
    if (probeUsable(primaryProbe)) {
      chosen = {
        email: primary.email,
        password: primary.password,
        via: 'primary',
        probe: primaryProbe,
      };
    } else if (secondKey && second.password && probeUsable(secondProbe)) {
      chosen = {
        email: second.email,
        password: second.password,
        via: 'second',
        probe: secondProbe,
      };
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

    const chosenKey = emailKey(chosen.email);
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
    // Prefer marking via=second if any inmate in the group needed second.
    if (chosen.via === 'second') group.via = 'second';
    if (key) seenRecipients.set(key, chosenKey);
  }

  return { groups, duplicates, skipped, assignments };
}

module.exports = {
  inmateHasCorrlinksLogin,
  recipientKey,
  emailKey,
  inmateLabel,
  roleLabel,
  collectUniqueCorrlinksAccounts,
  groupInmatesByCorrlinksAccount,
  probeUsable,
  regroupInmatesAfterProbe,
};
