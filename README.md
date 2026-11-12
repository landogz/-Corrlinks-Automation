# Inside Scores

Desktop app that loads CorrLinks inmate accounts from SportsData, logs into CorrLinks, opens compose, and pastes Inmate Exchange report text.

**Repository:** [github.com/landogz/-Corrlinks-Automation](https://github.com/landogz/-Corrlinks-Automation)

## Download

Get the latest installers from the [Releases](https://github.com/landogz/-Corrlinks-Automation/releases/latest) page (current: **v0.1.13**):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | `Inside Scores-0.1.13-arm64.dmg` or `Inside Scores-0.1.13-arm64-mac.zip` |
| macOS (Intel) | `Inside Scores-0.1.13.dmg` or `Inside Scores-0.1.13-mac.zip` |
| Windows | `Inside Scores Setup 0.1.13.exe` or `Inside Scores 0.1.13.exe` (portable) |

## Install on macOS

Works on macOS 12 or newer, on both Apple Silicon and Intel Macs.

1. Open the matching `.dmg` and drag **Inside Scores** into **Applications**.
2. Run this once in Terminal so macOS allows the unsigned app:

```bash
xattr -dr com.apple.quarantine "/Applications/Inside Scores.app"
```

3. Open **Inside Scores** from Applications or Launchpad.
4. Sign in with SportsData email/password in the app (or use a `.env` — see [Configuration](#configuration)).

## Install on Windows

1. Run `Inside Scores Setup 0.1.13.exe`.
2. If SmartScreen appears, click **More info** then **Run anyway**.
3. Open **Inside Scores** from the Start menu.

`Inside Scores 0.1.13.exe` (portable) runs without installing — put `.env` in the same folder as the `.exe` if you use one.

## Configuration

In the app: enter SportsData **email** / **password** → **Sign in** (validated against SportsData, then remembered on this computer).

Optional `.env` (still supported; in-app login overrides it):

```env
SPORTSDATA_BASE_URL=https://sportsdata.com
SPORTSDATA_EMAIL=your-email@example.com
SPORTSDATA_PASSWORD=your-password
APP_TIMEZONE=America/New_York
```

| Key | Purpose |
| --- | --- |
| `SPORTSDATA_BASE_URL` | Usually `https://sportsdata.com` |
| `SPORTSDATA_EMAIL` | SportsData operator login |
| `SPORTSDATA_PASSWORD` | SportsData password |
| `APP_TIMEZONE` | Subject day rules (default `America/New_York`) |

Do not commit a filled `.env` or `sportsdata-credentials.json`.

## Usage

1. Open the app and sign in to SportsData.
2. Inmates load automatically (or click **Refresh**).
3. Select an inmate.
4. Click **Login to CorrLinks** (single inmate), or **Start loop** (grouped by CorrLinks account).

The app will:

- log in with the primary CorrLinks account (fallback to second if locked)
- open compose
- set subject from `APP_TIMEZONE` (today’s short day e.g. `tue`; between 1am and 6am → `mon & tue`)
- paste Inmate Exchange TXT file contents (skips `*_empty.txt`; part 1 only for now — no Send yet)

**Start loop:** probes each CorrLinks account for lock first, then composes recipients one-by-one (To cleared each time). 10s pause only when switching accounts.

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

Outputs are written to `release/`. Publish a GitHub Release (includes `latest.yml` / `latest-mac.yml` for in-app updates):

```bash
npm run publish:github
```

### In-app updates

Packaged builds check GitHub Releases on startup and via the **Updates** button.

- **Windows (Setup/NSIS):** downloads and restarts to install automatically.
- **macOS (unsigned):** downloads the release zip, then replaces the `.app` and relaunches (bypasses ShipIt code-signature checks). If replace fails, the matching `.dmg` is opened as a fallback.
- **Windows portable `.exe`:** not an auto-update target — use the Setup installer.

Release assets must keep the hyphenated names from `latest.yml` / `latest-mac.yml` (the publish script uploads them that way).

### Smoke tests

```bash
npm run smoke:sportsdata
npm run smoke:exchange
npm run smoke:subject
```

## More detail

See [INSTALL.md](INSTALL.md) for expanded install notes.
