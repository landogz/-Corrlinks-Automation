/**
 * electron-builder afterPack: remove unused macOS media usage strings so
 * Chromium/CorrLinks cannot trigger the system microphone/camera dialog.
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

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const productName = context.packager.appInfo.productFilename;
  const plistPath = path.join(context.appOutDir, `${productName}.app`, 'Contents', 'Info.plist');
  if (!fs.existsSync(plistPath)) return;

  for (const key of KEYS) {
    try {
      execFileSync('plutil', ['-remove', key, plistPath], { stdio: 'ignore' });
    } catch (_) {
      // Key may already be absent.
    }
  }
};
