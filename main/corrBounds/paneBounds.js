/**
 * Pure CorrLinks embed geometry. No Electron — smoke tests require this file.
 */

function hostSize(host = {}) {
  return {
    width: Math.max(800, Number(host.width) || 1200),
    height: Math.max(600, Number(host.height) || 800),
  };
}

function roundBounds(b) {
  return {
    x: Math.round(Number(b?.x) || 0),
    y: Math.round(Number(b?.y) || 0),
    width: Math.max(0, Math.round(Number(b?.width) || 0)),
    height: Math.max(0, Math.round(Number(b?.height) || 0)),
  };
}

function isParkedCorrBounds(b, hostWidth) {
  if (!b || Number(b.width) < 8 || Number(b.height) < 8) return false;
  const x = Number(b.x) || 0;
  const hw = Math.max(800, Number(hostWidth) || 1200);
  if (x <= -80) return true;
  return x >= hw - 4;
}

function windowFallbackCorrBounds(host = {}) {
  const { width, height } = hostSize(host);
  // Inmate column ~320–420px + shell padding. Do not use 38% — that sits
  // inside the CorrLinks card and leaves a dark strip beside the site.
  const x = Math.max(300, Math.round(Math.min(440, width * 0.3)));
  const y = 120;
  return {
    x,
    y,
    width: Math.max(420, width - x - 16),
    height: Math.max(360, height - y - 40),
  };
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const overlapW = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  );
  const overlapH = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  );
  return overlapW * overlapH;
}

function boundsArea(b) {
  return Math.max(0, Number(b?.width) || 0) * Math.max(0, Number(b?.height) || 0);
}

/** Measured #corrPane under the CORRLINKS header — trust this over window guesses. */
function isUsableContainerBounds(b, host = {}) {
  if (!b) return false;
  const next = roundBounds(b);
  const { width: hw, height: hh } = hostSize(host);
  if (isParkedCorrBounds(next, hw)) return false;
  if (next.width < Math.max(280, hw * 0.4)) return false;
  if (next.height < Math.max(200, hh * 0.35)) return false;
  if (next.x < 200 || next.x > hw * 0.52) return false;
  if (next.y < 48 || next.y > hh * 0.42) return false;
  return true;
}

function isPreviewIslandBounds(b, host = {}) {
  if (!b) return false;
  const next = roundBounds(b);
  const { width: hw, height: hh } = hostSize(host);
  if (isParkedCorrBounds(next, hw)) return false;
  if (next.width < 80 || next.height < 80) return false;
  const narrow = next.width < hw * 0.52;
  const short = next.height < hh * 0.5;
  const centeredY = next.y > Math.max(140, hh * 0.14);
  return narrow && (short || centeredY);
}

/**
 * True when `b` fills the Automate right column — not the Preparing preview card.
 */
function isFullPaneCorrBounds(b, host = {}) {
  return isUsableContainerBounds(b, host);
}

/**
 * Prefer a measured live pane. Only fall back to a window guess when the
 * candidate is a leftover Preparing-workspace preview island.
 */
function pickLiveCorrBounds(candidate, lastLive, host = {}) {
  const fb = windowFallbackCorrBounds(host);
  const hw = hostSize(host).width;
  const usable = [candidate, lastLive].filter(
    (b) =>
      b &&
      Number(b.width) >= 8 &&
      Number(b.height) >= 8 &&
      !isParkedCorrBounds(b, hw)
  );
  for (const b of usable) {
    const next = roundBounds(b);
    if (isUsableContainerBounds(next, host)) return next;
  }
  for (const b of usable) {
    const next = roundBounds(b);
    if (!isPreviewIslandBounds(next, host)) return next;
  }
  return fb;
}

/**
 * Once the Automate pane is filled, refuse a smaller in-window preview card.
 * A new measured container always wins over a window-fallback guess.
 */
function refuseShrinkToPreview(current, incoming, host = {}) {
  if (!incoming || Number(incoming.width) < 8 || Number(incoming.height) < 8) {
    return incoming;
  }
  const hw = hostSize(host).width;
  if (isParkedCorrBounds(incoming, hw)) return incoming;
  const cur = current && Number(current.width) >= 8 ? roundBounds(current) : null;
  const next = roundBounds(incoming);
  if (!cur) return next;
  if (isParkedCorrBounds(cur, hw)) return next;
  if (isUsableContainerBounds(next, host)) return next;
  if (isUsableContainerBounds(cur, host) && isPreviewIslandBounds(next, host)) {
    return cur;
  }
  if (isPreviewIslandBounds(next, host) && boundsArea(next) < boundsArea(cur) * 0.85) {
    return cur;
  }
  return next;
}

module.exports = {
  hostSize,
  roundBounds,
  isParkedCorrBounds,
  windowFallbackCorrBounds,
  isFullPaneCorrBounds,
  isUsableContainerBounds,
  isPreviewIslandBounds,
  pickLiveCorrBounds,
  refuseShrinkToPreview,
  overlapArea,
};
