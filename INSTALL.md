# Inmate Exchange Auto — Install Guide

Internal desktop app that logs into CorrLinks, opens compose, and pastes Inmate Exchange text from SportsData.

Built installers are in the `release/` folder after `npm run dist`.

---

## What you need before install

1. SportsData login (operator account)
2. Network access to:
   - `https://sportsdata.com`
   - `https://www.corrlinks.com`
3. A `.env` file with credentials (see below)

---

## macOS install

### 1) Pick the right DMG

| Mac chip | File |
|----------|------|
| Apple Silicon (M1/M2/M3/M4) | `Inmate Exchange Auto-0.1.0-arm64.dmg` |
| Intel | `Inmate Exchange Auto-0.1.0.dmg` or `…-x64.dmg` |

Unsure: Apple menu → **About This Mac** → look for “Chip” (Apple) or “Processor” (Intel).

### 2) Install the app

1. Open the `.dmg`
2. Drag **Inmate Exchange Auto** into **Applications**
3. Eject the DMG

### 3) First open (unsigned build)

Because this build is not Apple-notarized:

1. Open **Applications**
2. Right-click **Inmate Exchange Auto** → **Open**
3. Click **Open** again in the Gatekeeper dialog

(Only needed the first time.)

### 4) Add your `.env`

Create a file named `.env` in the **same folder as the `.app`** (usually `/Applications/` next to the app), or inside:

`~/Library/Application Support/Inmate Exchange Auto/.env`

Recommended for simplicity — place beside the app:

```text
/Applications/.env
```

Or next to a portable copy of the `.app`.

Contents (copy from `.env.example`):

```env
SPORTSDATA_BASE_URL=https://sportsdata.com
SPORTSDATA_EMAIL=your-email@example.com
SPORTSDATA_PASSWORD=your-password
APP_TIMEZONE=America/New_York
```

### 5) Run

Launch **Inmate Exchange Auto** → **Refresh inmates** → select inmate → **Login to CorrLinks**.

---

## Windows install

### Option A — Installer (recommended)

1. Run `Inmate Exchange Auto Setup 0.1.0.exe`
2. Follow the setup wizard (choose install folder if asked)
3. Finish — shortcut is created on Desktop / Start Menu

### Option B — Portable

1. Copy `Inmate Exchange Auto 0.1.0.exe` (portable) to a folder, e.g. `C:\Tools\InmateExchangeAuto\`
2. Run that `.exe` (no install needed)

### First open / SmartScreen

If Windows SmartScreen warns:

1. Click **More info**
2. Click **Run anyway**

### Add your `.env`

Put `.env` in the **same folder as the `.exe`**.

Example for portable:

```text
C:\Tools\InmateExchangeAuto\.env
C:\Tools\InmateExchangeAuto\Inmate Exchange Auto 0.1.0.exe
```

Example for installed app (typical):

```text
C:\Users\<You>\AppData\Local\Programs\Inmate Exchange Auto\.env
```

Or:

```text
C:\Users\<You>\AppData\Roaming\Inmate Exchange Auto\.env
```

Contents:

```env
SPORTSDATA_BASE_URL=https://sportsdata.com
SPORTSDATA_EMAIL=your-email@example.com
SPORTSDATA_PASSWORD=your-password
APP_TIMEZONE=America/New_York
```

### Run

Open the app → **Refresh inmates** → select inmate → **Login to CorrLinks**.

---

## `.env` checklist

| Key | Purpose |
|-----|---------|
| `SPORTSDATA_BASE_URL` | Usually `https://sportsdata.com` |
| `SPORTSDATA_EMAIL` | SportsData operator login |
| `SPORTSDATA_PASSWORD` | SportsData password |
| `APP_TIMEZONE` | Subject day rules (`America/New_York`) |

Do **not** commit or share a filled `.env`.

---

## Build from source (developers)

```bash
cd inmateexchange-auto
npm install
cp .env.example .env   # edit credentials
npm start              # run in dev

# Export installers
npm run dist:mac       # macOS DMG + ZIP
npm run dist:win       # Windows NSIS + portable
npm run dist           # mac + win
```

Outputs land in `release/`.

---

## Notes

- CorrLinks may show CAPTCHA / “already logged in” / account-locked dialogs — the app tries to handle these; complete CAPTCHA manually if needed.
- Sending messages is not enabled yet (paste only).
- macOS builds are unsigned; Windows builds are unsigned — expect OS security prompts on first run.
