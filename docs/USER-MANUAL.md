# Inside Scores — User Manual

**Version:** 0.1.61  
**Product:** Inside Scores  
**Audience:** SportsData operators who send Inmate Exchange reports through CorrLinks

---

## 1. What this app does

Inside Scores is a desktop app that:

1. Signs you into **SportsData**
2. Loads inmate CorrLinks accounts and exchange files
3. Validates CorrLinks logins (**Preparing your workspace**)
4. Opens CorrLinks, composes messages, and **sends** selected exchange file parts
5. Supports a **Start loop** mode to send to many recipients across CorrLinks accounts

Clock, log stamps, history date, and daily subject always use **America/New_York** — your Mac or Windows display timezone does not matter.

---

## 2. Requirements

| Need | Detail |
| --- | --- |
| SportsData operator account | Email + password |
| Network | Access to `https://sportsdata.com` and `https://www.corrlinks.com` |
| macOS | 12+ · Apple Silicon **or** Intel |
| Windows | 10/11 · use the Setup installer for in-app updates |

Keep **Set date and time automatically** enabled on the OS so the New York wall clock stays correct.

---

## 3. Install

### 3.1 Download

Latest installers: [GitHub Releases](https://github.com/landogz/-Corrlinks-Automation/releases/latest)

| Platform | File |
| --- | --- |
| macOS Apple Silicon | `Inside-Scores-x.y.z-arm64.dmg` |
| macOS Intel | `Inside-Scores-x.y.z.dmg` |
| Windows installer | `Inside-Scores-Setup-x.y.z.exe` |
| Windows portable | `Inside-Scores-x.y.z.exe` |

### 3.2 macOS

1. Open the matching `.dmg` and drag **Inside Scores** into **Applications**.
2. First open (unsigned build): right-click the app → **Open** → confirm **Open**.  
   Or run once in Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/Inside Scores.app"
```

3. Launch from Applications / Launchpad.

### 3.3 Windows

1. Run `Inside-Scores-Setup-x.y.z.exe` (recommended).
2. If SmartScreen appears: **More info** → **Run anyway**.
3. Open **Inside Scores** from the Start menu.

Portable `.exe` works without install; put an optional `.env` next to the executable. Portable builds do **not** auto-update — prefer the Setup installer.

---

## 4. Sign in (SportsData)

1. Enter SportsData **email** and **password**.
2. Leave **Remember me** checked to save login on this computer.
3. Click **Sign in**.

Credentials are validated against SportsData, then stored under Application Support (macOS) / AppData (Windows). Optional `.env` still works; in-app login overrides it.

Theme (Auto / Light / Dark) can be set on the login screen or later from the account menu.

**Sign out:** account avatar (top right) → **Sign out**.

---

## 5. Main window overview

| Area | Purpose |
| --- | --- |
| **Automate** tab | Select inmate, template, files; send or start loop; CorrLinks pane |
| **Accounts** tab | Unique CorrLinks logins, status, Validate new / Refresh all / Retry |
| **History** tab | **Exchange files** exports, or **Send runs** (success/fail + resend) |
| **Settings** tab | Auto-send times (America/New_York), each with its own send kind (Daily / Weekly NFL / CFB) |
| **Refresh** | Reload inmates and fully re-validate CorrLinks accounts |
| **Status log** | Detailed activity log (drawer) |
| **Account menu** | Theme, shortcuts, updates, about, sign out |
| **Status bar** | SportsData / CorrLinks pills, hint text, NY clock, version / updates |

Workflow steps on Automate: **1 Inmate** → **2 CorrLinks**.

---

## 6. Preparing your workspace

On first validation, the app probes each unique CorrLinks account. Later, when a **new** CorrLinks login is added (or a password changes), Preparing your workspace runs only for those **new/changed** logins — not every account again.

- Progress overlay shows status, percent, and failed accounts.
- Tags may include **Locked**, **Timeout**, or **Error**.
- After failures, CorrLinks **login opens automatically** and the app **watches the Login response** without an extra click.
- Failed rows show the **email** and **password** with **Copy** buttons for paste into CorrLinks.
- Paste credentials, click **Login**, and the app classifies success/locked/invalid. Use **Retry** (full auto), **Watch this** (switch account), or **Continue without retries**.
- **Cancel** aborts the prep run.

Later launches with the **same unique logins** reuse **saved validation** and skip the overlay (`Accounts unchanged · using saved validation`).

### Accounts tab

- Lists every unique CorrLinks email with role, inmate coverage, status, and last checked time.
- **Validate new** — probe only unchecked / changed logins.
- **Refresh all** — re-probe every unique login (same as top-bar Refresh validation).
- Per-row **Retry** — re-check one account.

Top-bar **Refresh** (Automate or Accounts) also forces a full live re-probe.

---

## 7. Daily work — single inmate

1. Open **Automate**.
2. Search and select an inmate (name, ID, or email).
3. Choose template:
   - **Daily** — weekday subject from New York time (see §9)
   - **Weekly update** — pick **NFL** or **CFB**
4. Under **Files sendable**, check the parts to send. Each row has **Copy** (clipboard) and **Download**.
5. Click **Send all files** (or **Send N selected files**).

The app will:

- Log in with the primary CorrLinks account (fallback to secondary if locked / required)
- Open compose and set **To** to the inmate
- Set the subject automatically
- Paste each checked file part and **Send**
- Show progress in the CorrLinks pane and status bar

**Stop:** use **Force stop** / **Stop loop** while a send or loop is running.

---

## 8. Start loop (many recipients)

Use **Start loop** to walk CorrLinks accounts and send to all regrouped recipients.

1. Finish workspace validation at least once.
2. Choose **Daily** or **Weekly** template and which file parts are checked (applies across the loop).
3. Click **Start loop**.
4. Watch progress, countdown between accounts, and the failed-recipients list.
5. When finished, review the summary dialog. Use **Retry failed** if needed.

Only **checked** sendable files are sent. The **To** field is cleared between recipients.

---

## 9. Daily subject (America/New_York)

| Wall time (Eastern) | Subject example (Tuesday) |
| --- | --- |
| **1:30am – 4:59am** | `mon & tue` (yesterday & today) |
| All other times | `tue` (today only) |

The on-screen subject hint refreshes about once per minute. Compose/send always computes the subject live at send time.

Weekly subjects use the league name (**NFL** or **CFB**).

---

## 10. CorrLinks pane

| Control | Action |
| --- | --- |
| Reload | Reload the embedded CorrLinks page |
| Open in browser | Open CorrLinks externally |
| − / + | Zoom out / in |
| Clear session | Clear the CorrLinks session in the app |

If CorrLinks fails to load, use **Retry** or **View log**. Complete CAPTCHA or unusual CorrLinks prompts manually in the pane when they appear.

---

## 11. History tab

### Exchange files

1. Open **History** → **Exchange files**.
2. Pick a date (New York calendar date) and click **Export for date**.
3. Browse the table (Date, File, Characters).
4. Select a row to **Preview**.
5. **Copy**, **Download**, or **Export CSV** for filtered rows.
6. Use **Refresh** to reload the list; filter by date in the search box.

### Send runs

1. Open **History** → **Send runs**.
2. Review each Start loop / auto-send / retry outcome (ok counts, failures, stopped).
3. Select a run to see failed recipients and reasons.
4. **Resend recipient** retries that inmate; **Resend file** retries a specific failed part when listed.

---

## 11b. Settings — loop schedule

1. Open **Settings**.
2. Turn **Auto-send** On (button toggle).
3. Add a **Send time (NY)** and choose its **Send kind** (Daily / Weekly NFL / Weekly CFB).
4. Each saved row can change kind later from the table; Delete removes a time (keep at least one).
5. Keep the app open — at each due America/New_York time, Start loop runs once for that slot using that row’s kind.
6. Status shows next run, last fired slots, and current NY clock.

---

## 12. Status log

Open with the log button in the top bar, or **⌘/Ctrl + J**.

- Filter by level: All / Info / Success / Warning / Errors
- Search text
- Auto-scroll on/off
- Mask emails in the log
- **Copy** or **Clear** (⌘/Ctrl + K)

Toast notifications appear for success and error feedback during sends and validation.

---

## 13. Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| ⌘/Ctrl + R | Refresh inmates & validate CorrLinks |
| ⌘/Ctrl + L | Send message |
| ⌘/Ctrl + J | Toggle status log |
| ⌘/Ctrl + K | Clear log |
| ? | Keyboard shortcuts help |
| Esc | Close drawers and dialogs |

Also available from **Account menu → Keyboard shortcuts**.

---

## 14. Updates

Packaged builds check GitHub Releases on startup and from **Account menu → Check for updates** (or the version chip in the status bar).

| Build | Behavior |
| --- | --- |
| Windows Setup (NSIS) | Download and restart to install |
| macOS (unsigned) | Download zip, replace app, relaunch (DMG fallback if needed) |
| Windows portable | Not an auto-update target — install Setup instead |

---

## 15. Optional `.env`

Usually not required after in-app sign-in. Example:

```env
SPORTSDATA_BASE_URL=https://sportsdata.com
SPORTSDATA_EMAIL=your-email@example.com
SPORTSDATA_PASSWORD=your-password
# Documentation only — app is hard-locked to America/New_York
APP_TIMEZONE=America/New_York
CORRLINKS_SIGNIN_DELAY_MS=2000
```

Do not share a filled `.env` or `sportsdata-credentials.json`.

---

## 16. Troubleshooting

| Symptom | What to try |
| --- | --- |
| Always “Preparing your workspace” | Wait for probes; use Retry on failed accounts; Refresh if credentials changed |
| CorrLinks timeout / empty login | Retry; check network; use Reload in the CorrLinks toolbar |
| Account locked | Use secondary account if available; unlock in CorrLinks; Retry later |
| Wrong day on subject / clock | App uses New York time only — confirm OS clock is set automatically |
| macOS won’t open app | Right-click → Open, or run the `xattr` quarantine command in §3.2 |
| Windows SmartScreen | More info → Run anyway |
| No sendable files | Confirm SportsData has exchange files for that inmate / template |
| Loop failed recipients | Use **Retry failed** from the panel or completion dialog |

---

## 17. Privacy & safety

- SportsData password is stored only when you choose Remember me.
- Logs can mask emails — enable **Mask emails** before sharing a log.
- Do not commit credentials to git or paste them into tickets.

---

## 18. Support & links

| Resource | URL |
| --- | --- |
| Releases / downloads | https://github.com/landogz/-Corrlinks-Automation/releases |
| Source (GitHub) | https://github.com/landogz/-Corrlinks-Automation |
| Mirror (GitLab) | https://gitlab.com/sportsdata1/corrlinks-automation |
| Install notes | [INSTALL.md](../INSTALL.md) |
| README | [README.md](../README.md) |

---

*Inside Scores · Landogz Web Solutions · User Manual v0.1.44*
