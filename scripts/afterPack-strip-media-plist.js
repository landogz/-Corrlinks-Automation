/**
 * electron-builder afterPack: remove unused macOS media usage strings from
 * every Info.plist in the .app (main + Helpers) so Chromium/CorrLinks cannot
 * trigger the system microphone/camera dialog.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KEYS = [
  'NSMicrophoneUsageDescription',
  'NSCameraUsageDescription',
  'NSAudioCaptureUsageDescription',
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
];

function walkInfoPlists(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkInfoPlists(full, out);
    } else if (entry.isFile() && entry.name === 'Info.plist') {
      out.push(full);
    }
  }
  return out;
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const productName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${productName}.app`);
  if (!fs.existsSync(appPath)) return;

  const plists = walkInfoPlists(appPath);
  for (const plistPath of plists) {
    for (const key of KEYS) {
      try {
        execFileSync('plutil', ['-remove', key, plistPath], { stdio: 'ignore' });
      } catch (_) {
        // Key may already be absent.
      }
    }
  }
};
