#!/usr/bin/env node
/**
 * Mechanical check: leftover Preparing-workspace preview rects must not count
 * as the live Automate pane, and pickLive must keep a measured #corrPane.
 */
const {
  isFullPaneCorrBounds,
  isParkedCorrBounds,
  isPreviewIslandBounds,
  isUsableContainerBounds,
  pickLiveCorrBounds,
  refuseShrinkToPreview,
  windowFallbackCorrBounds,
} = require('../main/corrBounds/paneBounds');

const host = { width: 1440, height: 900 };
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`smoke-corr-bounds: ${msg}`);
  }
}

const fb = windowFallbackCorrBounds(host);
assert(fb.width >= 420 && fb.height >= 360, 'fallback must be a large right column');
assert(fb.x >= 280 && fb.x <= 450, 'fallback must start at the inmate/CorrLinks split, not 38%');
assert(fb.y >= 100 && fb.y <= 140, 'fallback must sit under the CORRLINKS header');
assert(isFullPaneCorrBounds(fb, host), 'window fallback must count as full pane');

const previewCard = { x: 720, y: 180, width: 520, height: 400 };
assert(isPreviewIslandBounds(previewCard, host), 'centered Preparing card is a preview island');
assert(
  !isFullPaneCorrBounds(previewCard, host),
  'centered Preparing preview card must NOT count as full pane'
);

const tiny = { x: 800, y: 200, width: 360, height: 280 };
assert(!isFullPaneCorrBounds(tiny, host), '360×280 must not count as full pane');

const parked = { x: host.width + 120, y: 0, width: 960, height: 800 };
assert(isParkedCorrBounds(parked, host.width), 'off-window park must be detected');
assert(!isFullPaneCorrBounds(parked, host), 'parked bounds must not count as full pane');

const pickedFromPreview = pickLiveCorrBounds(previewCard, previewCard, host);
assert(
  isFullPaneCorrBounds(pickedFromPreview, host),
  `pickLive must upgrade preview card; got ${JSON.stringify(pickedFromPreview)}`
);

const live = { x: 400, y: 100, width: 1020, height: 750 };
assert(isUsableContainerBounds(live, host), 'measured full #corrPane must be a usable container');
const pickedLive = pickLiveCorrBounds(live, previewCard, host);
assert(
  Math.abs(pickedLive.width - live.width) < 2 && Math.abs(pickedLive.x - live.x) < 2,
  'pickLive must keep a measured full pane'
);

const containerBelowHead = { x: 408, y: 168, width: 1000, height: 680 };
assert(
  isUsableContainerBounds(containerBelowHead, host),
  'measured pane under CORRLINKS header (y=168) must be trusted'
);
const pickedBelowHead = pickLiveCorrBounds(containerBelowHead, fb, host);
assert(
  Math.abs(pickedBelowHead.y - 168) < 2 && Math.abs(pickedBelowHead.x - 408) < 2,
  `pickLive must keep y=168 container, not fallback; got ${JSON.stringify(pickedBelowHead)}`
);
const keptFromFallback = refuseShrinkToPreview(fb, containerBelowHead, host);
assert(
  Math.abs(keptFromFallback.x - 408) < 2 && Math.abs(keptFromFallback.y - 168) < 2,
  'measured container must replace a window-fallback guess'
);

const kept = refuseShrinkToPreview(live, previewCard, host);
assert(
  Math.abs(kept.width - live.width) < 2 && Math.abs(kept.x - live.x) < 2,
  'login fill must not shrink a full pane to the Preparing preview card'
);
const hide = refuseShrinkToPreview(live, { x: 0, y: 0, width: 0, height: 0 }, host);
assert(hide && hide.width === 0, '0×0 hide must still be allowed');

if (failed) {
  console.error(`smoke-corr-bounds: ${failed} failure(s)`);
  process.exit(1);
}
console.log('smoke-corr-bounds: ok');
process.exit(0);
