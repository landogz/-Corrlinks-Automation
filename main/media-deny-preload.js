/**
 * Runs in every frame before page scripts. CorrLinks/Chromium must not reach
 * real getUserMedia (that triggers the macOS microphone TCC dialog).
 */
(() => {
  try {
    const deny = () =>
      Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
    const legacyDeny = (_constraints, _success, error) => {
      if (typeof error === 'function') error(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
    };

    const patch = (target) => {
      if (!target) return;
      try {
        Object.defineProperty(target, 'getUserMedia', { configurable: true, writable: true, value: deny });
      } catch (_) {
        try {
          target.getUserMedia = deny;
        } catch (_) {}
      }
      try {
        Object.defineProperty(target, 'getDisplayMedia', { configurable: true, writable: true, value: deny });
      } catch (_) {
        try {
          target.getDisplayMedia = deny;
        } catch (_) {}
      }
      try {
        Object.defineProperty(target, 'enumerateDevices', {
          configurable: true,
          writable: true,
          value: async () => [],
        });
      } catch (_) {
        try {
          target.enumerateDevices = async () => [];
        } catch (_) {}
      }
    };

    patch(navigator.mediaDevices);
    try {
      navigator.getUserMedia = legacyDeny;
    } catch (_) {}
    try {
      navigator.webkitGetUserMedia = legacyDeny;
    } catch (_) {}
    try {
      navigator.mozGetUserMedia = legacyDeny;
    } catch (_) {}

    // Re-patch if the page replaces mediaDevices later.
    try {
      let devices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        get() {
          return devices;
        },
        set(next) {
          devices = next;
          patch(devices);
        },
      });
      patch(devices);
    } catch (_) {}
  } catch (_) {}
})();
