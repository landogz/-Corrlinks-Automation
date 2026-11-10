# Inmate Exchange Auto (CorrLinks Automation)

Desktop app that loads CorrLinks inmate accounts from SportsData, logs into CorrLinks, opens compose, and pastes Inmate Exchange report text.

## Download

Get the files from the [v0.1.0 release](https://gitlab.com/sportsdata1/corrlinks-automation/-/releases/v0.1.0) (or the [Releases](https://gitlab.com/sportsdata1/corrlinks-automation/-/releases) page):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | `Inmate Exchange Auto-0.1.0-arm64.dmg` or `Inmate Exchange Auto-0.1.0-arm64-mac.zip` |
| macOS (Intel) | `Inmate Exchange Auto-0.1.0.dmg` or `Inmate Exchange Auto-0.1.0-mac.zip` |
| Windows | `Inmate Exchange Auto Setup 0.1.0.exe` or `Inmate Exchange Auto 0.1.0.exe` (portable) |

Tag `v0.1.0` is already on the repo. Publish that tag as a GitLab Release and attach the files from local `release/` (DMG/ZIP/EXE only — skip `.blockmap`). After the first release exists, [permalink/latest](https://gitlab.com/sportsdata1/corrlinks-automation/-/releases/permalink/latest) will work too.

## Install on macOS

Works on macOS 12 or newer, on both Apple Silicon and Intel Macs.

1. Open the matching `.dmg` and drag **Inmate Exchange Auto** into **Applications**.
2. Run this once in Terminal so macOS allows the unsigned app:

```bash
xattr -dr com.apple.quarantine "/Applications/Inmate Exchange Auto.app"
```

3. Open **Inmate Exchange Auto** from Applications or Launchpad.
4. Create a `.env` file (see [Configuration](#configuration)).

## Install on Windows

1. Run `Inmate Exchange Auto Setup 0.1.0.exe`.
2. If SmartScreen appears, click **More info** then **Run anyway**.
3. Open **Inmate Exchange Auto** from the Start menu.

`Inmate Exchange Auto 0.1.0.exe` (portable) runs without installing — put `.env` in the same folder as the `.exe`.

## Configuration

Create a `.env` file next to the app / installer folder (or in the app user-data folder):

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

Do not commit a filled `.env`.

## Usage

1. Open the app.
2. Click **Refresh inmates**.
3. Select an inmate.
4. Click **Login to CorrLinks**.

The app will:

- log in with the primary CorrLinks account (fallback to second if locked)
- open compose
- set subject from the current day in `APP_TIMEZONE` (`mon`, or `mon & tue` between 1am–6am)
- paste Inmate Exchange TXT file contents (skips `*_empty.txt`; part 1 only for now — no Send yet)

## Develop from source

```bash
git clone https://gitlab.com/sportsdata1/corrlinks-automation.git
cd corrlinks-automation
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

Outputs are written to `release/`. Upload those files to a [GitLab Release](https://gitlab.com/sportsdata1/corrlinks-automation/-/releases).

### Smoke tests

```bash
npm run smoke:sportsdata
npm run smoke:exchange
npm run smoke:subject
```

## More detail

See [INSTALL.md](INSTALL.md) for expanded install notes.
