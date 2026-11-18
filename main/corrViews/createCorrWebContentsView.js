const { WebContentsView } = require('electron');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function hideCorrWebContentsView(view, hostWindow) {
  if (!view) return;
  try {
    if (typeof view.setVisible === 'function') view.setVisible(false);
  } catch (_) {}
  try {
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  } catch (_) {}
  try {
    hostWindow?.contentView?.removeChildView?.(view);
  } catch (_) {}
}

function showCorrWebContentsView(view, hostWindow, bounds) {
  if (!view || !hostWindow || hostWindow.isDestroyed()) return;
  const rect = {
    x: Math.round(Number(bounds?.x) || 0),
    y: Math.round(Number(bounds?.y) || 0),
    width: Math.max(0, Math.round(Number(bounds?.width) || 0)),
    height: Math.max(0, Math.round(Number(bounds?.height) || 0)),
  };
  const visible = rect.width >= 8 && rect.height >= 8;
  try {
    if (typeof view.setVisible === 'function') view.setVisible(visible);
  } catch (_) {}
  if (!visible) {
    hideCorrWebContentsView(view, hostWindow);
    return;
  }
  try {
    hostWindow.contentView?.addChildView?.(view);
  } catch (_) {}
  try {
    view.setBounds(rect);
  } catch (_) {}
}

function createCorrWebContentsView() {
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  try {
    const { hardenSession, stubMediaDevices } = require('../denyMediaPermissions');
    hardenSession(view.webContents.session);
    stubMediaDevices(view.webContents);
  } catch (_) {}
  try {
    if (typeof view.setBackgroundColor === 'function') {
      view.setBackgroundColor('#ffffff');
    }
  } catch (_) {}
  try {
    view.webContents.setUserAgent(USER_AGENT);
  } catch (_) {}
  return view;
}

function liveWebContents(view) {
  try {
    const wc = view?.webContents;
    if (!wc) return null;
    if (typeof wc.isDestroyed === 'function' && wc.isDestroyed()) return null;
    return wc;
  } catch (_) {
    return null;
  }
}

function destroyCorrWebContentsView(view, hostWindow) {
  hideCorrWebContentsView(view, hostWindow);
  const wc = liveWebContents(view);
  if (!wc) return;
  try {
    wc.close({ waitForBeforeUnload: false });
  } catch (_) {
    try {
      wc.destroy();
    } catch (_) {}
  }
}

module.exports = {
  USER_AGENT,
  createCorrWebContentsView,
  hideCorrWebContentsView,
  showCorrWebContentsView,
  liveWebContents,
  destroyCorrWebContentsView,
};
