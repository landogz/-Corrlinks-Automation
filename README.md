# Inside Scores

Desktop app that loads CorrLinks inmate accounts from SportsData, logs into CorrLinks, opens compose, and pastes / sends Inmate Exchange report text.

**Repository:** [github.com/landogz/-Corrlinks-Automation](https://github.com/landogz/-Corrlinks-Automation)  
**Also mirrored on GitLab:** [gitlab.com/sportsdata1/corrlinks-automation](https://gitlab.com/sportsdata1/corrlinks-automation)

## Download

Get the latest installers from the [Releases](https://github.com/landogz/-Corrlinks-Automation/releases/latest) page (current: **v0.1.54**):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | `Inside-Scores-0.1.54-arm64.dmg` / `-arm64-mac.zip` |
| macOS (Intel) | `Inside-Scores-0.1.54.dmg` / `-mac.zip` |
| Windows | `Inside-Scores-Setup-0.1.54.exe` or portable `Inside-Scores-0.1.54.exe` |

GitHub release assets use **hyphenated** names (for electron-updater). Local `release/` builds may still show spaces (`Inside Scores …`).

## Install on macOS

Works on macOS 12 or newer, on both Apple Silicon and Intel Macs.

1. Open the matching `.dmg` and drag **Inside Scores** into **Applications**.
2. Run this once in Terminal so macOS allows the unsigned app:

```bash
xattr -dr com.apple.quarantine "/Applications/Inside Scores.app"
```

3. Open **Inside Scores** from Applications or Launchpad.
4. Sign in with SportsData email/password in the app (or use a `.env` — see [Configuration](#configuration)).

**Apple Intel:** install the non-`arm64` DMG (`Inside-Scores-x.y.z.dmg`).

## Install on Windows

1. Run `Inside-Scores-Setup-0.1.54.exe`.
2. If SmartScreen appears, click **More info** then **Run anyway**.
3. Open **Inside Scores** from the Start menu.

Portable `Inside-Scores-0.1.54.exe` runs without installing — put `.env` next to the `.exe` if you use one.

## Configuration

In the app: enter SportsData **email** / **password** → **Sign in** (validated against SportsData, then remembered on this computer).

Optional `.env` (still supported; in-app login overrides it):

```env
SPORTSDATA_BASE_URL=https://sportsdata.com
SPORTSDATA_EMAIL=your-email@example.com
SPORTSDATA_PASSWORD=your-password
# Clock + subject always use America/New_York (OS timezone ignored).
APP_TIMEZONE=America/New_York
CORRLINKS_SIGNIN_DELAY_MS=5000
# Unpackaged `npm start` never clicks Send. Set 1 to force-send in dev.
# CORRLINKS_ALLOW_SEND=1
```

| Key | Purpose |
| --- | --- |
| `SPORTSDATA_BASE_URL` | Usually `https://sportsdata.com` |
| `SPORTSDATA_EMAIL` | SportsData operator login |
| `SPORTSDATA_PASSWORD` | SportsData password |
| `APP_TIMEZONE` | Documented as `America/New_York` — app is hard-locked to NY |
| `CORRLINKS_SIGNIN_DELAY_MS` | Pause after filling login before clicking Login on send/login (default `5000`). Account validation / Preparing workspace skips this delay. |
| `CORRLINKS_ALLOW_SEND` | `1` force Send even from `npm start`; `0` skip Send even in packaged builds. Default: skip Send unless packaged. |

Do not commit a filled `.env` or `sportsdata-credentials.json`.

### Clock & timezone

- The app **always** uses **America/New_York** for the status clock, log stamps, history date, and daily subject.
- Your Mac/Windows display timezone does **not** matter (Philippines, EST, PST, etc.).
- The OS must still have the correct **UTC instant** (keep **Set date and time automatically** on).

### Microphone prompt on macOS

Inside Scores does **not** use the microphone. Refresh/CorrLinks loads used to trigger a macOS mic dialog. Current builds deny media permissions, stub `getUserMedia` before page scripts, use Chromium fake-media flags (so `npm start` also stays quiet), and strip mic/camera usage strings from every macOS `Info.plist` in the packaged app.

### CorrLinks “Syncfusion still empty” on validate

Preparing your workspace used to hide the CorrLinks pane at 0×0 during probes, which made Angular/Syncfusion reject filled email/password. The overlay is now split: progress / failed accounts on the left, live CorrLinks login on the right — and the prepare pane never collapses to 0×0 mid-probe. **Account validation uses its own CorrLinks webview** (refreshed when probes start); **Start loop uses a second webview** sized to the Automate CorrLinks container under the CORRLINKS header. After credentials fill, Preparing your workspace waits **5 seconds** (`CORRLINKS_SIGNIN_DELAY_MS`, default `5000`) before clicking Login so Syncfusion can settle. Failed-account review centers **Continue without retries** (Cancel is hidden on that screen). Email and password are bound per field (trusted Electron `insertText` + Syncfusion `setProperties` / EJ2), never undirected clipboard paste into the wrong box. A helper-script regression that falsely reported “Could not find email field” on a loaded login page is fixed and guarded by `npm run smoke:login-helpers`. Login is never clicked unless the email value actually stuck in the control. The Status log **Auto-scroll** and **Mask emails** controls are toggle buttons so they stay clickable above the native view.

## Usage

1. Open the app and sign in to SportsData.
2. Inmates load automatically. **Preparing your workspace** probes only **new or changed** CorrLinks logins (not every account again).
3. Open the **Accounts** tab to see each unique login status, **Validate new**, **Refresh all**, or per-row **Retry**.
4. Top-bar **Refresh** (on Automate/Accounts) forces a full CorrLinks re-validation of every unique login.
5. Select an inmate, choose **Daily** or **Weekly** template, check which file parts to send.
6. Use **Send all files** (single inmate) or **Start loop** (all grouped recipients). Each sendable row also has **Copy** and **Download**.

The app will:

- log in with the primary CorrLinks account (fallback to second if locked / requested)
- open compose and select the inmate in **To**
- set subject from America/New_York wall time (see below)
- paste selected Inmate Exchange TXT parts and **Send** each part (packaged builds only)
- track failed recipients / probe failures with per-account **Retry**

### Appearance

- **Account menu:** quick **Auto / Dark / Light**, plus **More appearance…** (opens About).
- **About:** full theme chips (Midnight, Slate, Graphite, Ocean, Forest, Amber Night, Plum, High Contrast, Warm Paper, Soft Gray, High Contrast Light), plus **Density** (Comfortable / Compact) and **Text size** (Default / Large).

Choices persist in `ui-preferences.json` (theme, density, typeScale).

### Dev / test (`npm start`)

Unpackaged runs **do not click CorrLinks Send**. Login, To, subject, and body still fill so you can verify the webview. Packaged installers send as usual.

Override with env:

```env
# Force-send from `npm start` (dangerous — posts real inmate mail)
CORRLINKS_ALLOW_SEND=1
# Force dry-run even in a packaged build
CORRLINKS_ALLOW_SEND=0
```

### Daily subject (always America/New_York)

| Wall time (ET) | Subject example (Tuesday) |
| --- | --- |
| **1:30am–4:59am** | `mon & tue` (yesterday & today) |
| Otherwise | `tue` (today only) |

The on-screen subject hint refreshes every minute; compose/send always computes the subject live.

### Workspace validation

- Results are saved to disk (fingerprint of **unique** CorrLinks email+password pairs).
- Adding an inmate that reuses an existing login does **not** re-probe every account.
- Only **new** emails or **password changes** open Preparing your workspace for those logins.
- Relaunch with the same unique logins → **Accounts unchanged · using saved validation**.
- **Accounts** tab: **Validate new** (subset) or **Refresh all** (full re-probe).
- Accounts list auto-updates when SportsData adds/removes inmates (poll ~60s + window focus).
- Top-bar **Refresh** also forces a full live re-probe.
- Failed probes show tags (**Locked**, **Timeout**, **Error**) with per-row **Retry**.

### Status log

Open from the status bar (or ⌘J). Filter by level, search, **Copy**, and **Clear** (⌘K). **Auto-scroll** and **Mask emails** are toggle buttons (highlight when on). Opening the log hides the native CorrLinks pane so those controls stay clickable.

### Start loop

- Probes / uses cached account status, then composes recipients one-by-one (To cleared each time).
- Only **checked** sendable files are sent.
- Failed recipients can be retried from the failed list.

## Develop from source

```bash
git clone https://github.com/landogz/-Corrlinks-Automation.git
cd -- -Corrlinks-Automation
cp .env.example .env
npm install
npm start
```

### Build installers

```bash
npm run dist:mac
npm run dist:win
npm run dist
```

Outputs go to `release/`. Publish:

```bash
# GitHub Release + updater metadata
npm run publish:github

# GitLab Release (needs GITLAB_TOKEN)
GITLAB_TOKEN=glpat-... npm run publish:release
```

Push remotes separately (do not repoint `origin` to GitLab):

```bash
git push origin main    # GitHub
git push gitlab main    # GitLab
```

### In-app updates

Packaged builds check GitHub Releases on startup and via **Updates**.

- **Windows (Setup/NSIS):** downloads and restarts to install.
- **macOS (unsigned):** downloads the release zip, replaces the `.app`, relaunches (DMG fallback if replace fails).
- **Windows portable `.exe`:** not an auto-update target — use the Setup installer.

### Smoke tests

```bash
npm run smoke:sportsdata
npm run smoke:exchange
npm run smoke:subject
npm run smoke:appearance
npm run smoke:corrlinks
npm run gate              # loop-engineering mechanical check (syntax + smokes)
```

### Loop engineering (Cursor agents)

This repo embeds [loop engineering](https://github.com/selmakcby/loop-engineering) for Cursor:

- **Every prompt:** `.cursor/rules/loop-engineering.mdc` (`alwaysApply`)
- **Skill:** `.cursor/skills/loop-engineering/SKILL.md`
- **Stop gate:** `.cursor/hooks/loop-gate.js` via `.cursor/hooks.json` (re-prompts until green, `loop_limit: 8`)

Rule: the agent must not self-verify “done” — the gate (syntax + `smoke:subject`) is the checker.

## User manual

Operator guide (install, sign-in, send, loop, history, shortcuts, troubleshooting):

- Markdown: [docs/USER-MANUAL.md](docs/USER-MANUAL.md)
- PDF: [docs/Inside-Scores-User-Manual.pdf](docs/Inside-Scores-User-Manual.pdf) (also attached on [Releases](https://github.com/landogz/-Corrlinks-Automation/releases/latest))

## More detail

See [INSTALL.md](INSTALL.md) for expanded install notes.
