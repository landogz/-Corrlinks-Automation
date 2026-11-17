/**
 * Inside Scores never needs mic/camera. CorrLinks (and Chromium) can still
 * request media on load/refresh, which pops the macOS TCC dialog every time
 * for unsigned builds. Deny media at the session layer + stub getUserMedia.
 */
const { app, session } = require('electron');

const ALLOWED_PERMISSIONS = new Set([
  'clipboard-read',
  'clipboard-sanitized-write',
]);

const DENIED_MEDIA = new Set([
  'media',
  'microphone',
  'camera',
  'display-capture',
  'mediaKeySystem',
  'speaker-selection',
  'audioCapture',
  'videoCapture',
]);

const hardenedSessions = new WeakSet();
const stubbedContents = new WeakSet();

const MEDIA_STUB = `(() => {
  try {
    const deny = () =>
      Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = deny;
      navigator.mediaDevices.getDisplayMedia = deny;
      navigator.mediaDevices.enumerateDevices = async () => [];
    }
    const legacyDeny = (_constraints, _success, error) => {
      if (typeof error === 'function') error(new Error('Permission denied'));
    };
    if (navigator.getUserMedia) navigator.getUserMedia = legacyDeny;
    if (navigator.webkitGetUserMedia) navigator.webkitGetUserMedia = legacyDeny;
    if (navigator.mozGetUserMedia) navigator.mozGetUserMedia = legacyDeny;
  } catch (_) {}
})();`;

function allowPermission(permission) {
  const key = String(permission || '');
  if (DENIED_MEDIA.has(key)) return false;
  if (ALLOWED_PERMISSIONS.has(key)) return true;
  // Default-deny unknown device / capture style permissions.
  if (/audio|video|mic|camera|display|media|speaker|midi/i.test(key)) return false;
  return false;
}

function hardenSession(ses) {
  if (!ses || hardenedSessions.has(ses)) return;
  hardenedSessions.add(ses);

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowPermission(permission));
  });

  ses.setPermissionCheckHandler((_webContents, permission) => allowPermission(permission));

  if (typeof ses.setDevicePermissionHandler === 'function') {
    ses.setDevicePermissionHandler(() => false);
  }
}

function stubMediaDevices(webContents) {
  if (!webContents || webContents.isDestroyed() || stubbedContents.has(webContents)) return;
  stubbedContents.add(webContents);

  const inject = () => {
    if (webContents.isDestroyed()) return;
    webContents.executeJavaScript(MEDIA_STUB, true).catch(() => {});
  };

  webContents.on('dom-ready', inject);
  webContents.on('did-finish-load', inject);
  webContents.on('did-navigate-in-page', inject);
}

function installDenyMediaPermissions() {
  hardenSession(session.defaultSession);

  app.on('session-created', (_event, ses) => {
    hardenSession(ses);
  });

  app.on('web-contents-created', (_event, contents) => {
    try {
      hardenSession(contents.session);
    } catch (_) {}
    stubMediaDevices(contents);
  });
}

module.exports = {
  installDenyMediaPermissions,
  hardenSession,
};
