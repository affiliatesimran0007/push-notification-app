(function () {
  var cfg = window.PUSH_CONFIG || {};
  var appUrl = cfg.appUrl || 'https://pushlogin.com';

  // --- Inject title + meta (JS-only, not in HTML source) ---
  document.title = cfg.pageTitle || 'Market Alerts \u2014 Real-Time News & Updates';
  if (!document.querySelector('meta[name="description"]')) {
    var m = document.createElement('meta');
    m.name = 'description';
    m.content = cfg.pageDesc || 'Get real-time market alerts, breaking news and financial updates delivered instantly to your device.';
    document.head.appendChild(m);
  }

  // --- Inject full page template into DOM ---
  var target = document.getElementById('app') || document.body;
  target.innerHTML = [
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#222;background:#fff}',
    '.top-bar{background:#c0392b;color:#fff;text-align:center;padding:6px;font-size:13px;font-weight:600;letter-spacing:.5px}',
    'header{background:#1a1a2e;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
    'header .logo{color:#fff;font-size:22px;font-weight:700;text-decoration:none}',
    'header .logo span{color:#e74c3c}',
    'nav a{color:#ccc;text-decoration:none;margin-left:20px;font-size:14px}',
    'nav a:hover{color:#fff}',
    '.hero{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;padding:60px 24px;text-align:center}',
    '.hero h1{font-size:2.4rem;margin-bottom:14px;line-height:1.2}',
    '.hero h1 span{color:#e74c3c}',
    '.hero p{font-size:1.05rem;opacity:.85;max-width:580px;margin:0 auto 28px}',
    '.badge{display:inline-block;background:#e74c3c;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}',
    '.container{max-width:1100px;margin:0 auto;padding:0 24px}',
    '.ticker{background:#f8f8f8;border-bottom:1px solid #eee;padding:10px 0;overflow:hidden;white-space:nowrap}',
    '.ticker-inner{display:inline-block;animation:tkr 22s linear infinite}',
    '@keyframes tkr{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
    '.ticker span{margin:0 32px;font-size:13px;color:#333}',
    '.up{color:#27ae60;font-weight:600}',
    '.dn{color:#e74c3c;font-weight:600}',
    '.section{padding:48px 0}',
    '.section h2{font-size:1.6rem;margin-bottom:24px;border-left:4px solid #e74c3c;padding-left:12px}',
    '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}',
    '.card{border:1px solid #eee;border-radius:8px;overflow:hidden;transition:box-shadow .2s}',
    '.card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}',
    '.cip{width:100%;height:160px}',
    '.cb{padding:16px}',
    '.ct{font-size:11px;color:#e74c3c;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}',
    '.ch{font-size:1rem;font-weight:700;margin-bottom:8px;line-height:1.4}',
    '.cx{font-size:.875rem;color:#666;line-height:1.5}',
    '.cm{font-size:.75rem;color:#999;margin-top:10px}',
    '.alert-box{background:#fff8e1;border:1px solid #f9ca24;border-radius:8px;padding:20px 24px;margin:32px 0;display:flex;align-items:flex-start;gap:16px}',
    '.alert-box .icon{font-size:24px;flex-shrink:0}',
    '.alert-box h3{margin-bottom:4px;font-size:1rem}',
    '.alert-box p{font-size:.875rem;color:#555}',
    '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:32px 0}',
    '.stat{text-align:center;padding:24px;background:#f8f9fa;border-radius:8px}',
    '.stat .num{font-size:2rem;font-weight:700;color:#1a1a2e}',
    '.stat .lbl{font-size:.875rem;color:#666;margin-top:4px}',
    'footer{background:#1a1a2e;color:#aaa;text-align:center;padding:32px 24px;margin-top:48px;font-size:.875rem}',
    'footer a{color:#aaa;text-decoration:none}',
    '@media(max-width:600px){.hero h1{font-size:1.6rem}nav a{margin-left:10px;font-size:12px}}',
    '</style>',

    '<div class="top-bar">&#x1F6A8; BREAKING: Fed holds rates steady &mdash; Markets react &nbsp;|&nbsp; Oil prices surge 2.3% &nbsp;|&nbsp; Tech stocks lead gains</div>',
    '<header>',
    '  <a class="logo" href="/">Notify<span>Alerts</span></a>',
    '  <nav><a href="#">Markets</a><a href="#">Economy</a><a href="#">Stocks</a><a href="#">Crypto</a></nav>',
    '</header>',

    '<div class="ticker"><div class="ticker-inner">',
    '<span>S&amp;P 500 <span class="up">&#x25B2; 4,892.34 +1.2%</span></span>',
    '<span>NASDAQ <span class="up">&#x25B2; 17,241 +0.8%</span></span>',
    '<span>DOW <span class="dn">&#x25BC; 38,120 -0.3%</span></span>',
    '<span>BTC <span class="up">&#x25B2; $67,450 +3.1%</span></span>',
    '<span>ETH <span class="up">&#x25B2; $3,820 +2.4%</span></span>',
    '<span>GOLD <span class="dn">&#x25BC; $2,312/oz -0.5%</span></span>',
    '<span>OIL <span class="up">&#x25B2; $82.45 +2.3%</span></span>',
    '<span>EUR/USD <span class="dn">&#x25BC; 1.0842 -0.1%</span></span>',
    '<span>S&amp;P 500 <span class="up">&#x25B2; 4,892.34 +1.2%</span></span>',
    '<span>NASDAQ <span class="up">&#x25B2; 17,241 +0.8%</span></span>',
    '<span>DOW <span class="dn">&#x25BC; 38,120 -0.3%</span></span>',
    '<span>BTC <span class="up">&#x25B2; $67,450 +3.1%</span></span>',
    '<span>ETH <span class="up">&#x25B2; $3,820 +2.4%</span></span>',
    '<span>GOLD <span class="dn">&#x25BC; $2,312/oz -0.5%</span></span>',
    '<span>OIL <span class="up">&#x25B2; $82.45 +2.3%</span></span>',
    '<span>EUR/USD <span class="dn">&#x25BC; 1.0842 -0.1%</span></span>',
    '</div></div>',

    '<div class="hero">',
    '  <div class="badge">&#x26A1; Live Updates</div>',
    '  <h1>Stay Ahead with <span>Real-Time</span><br>Market Alerts</h1>',
    '  <p>Get instant notifications on breaking market news, stock movements and economic data releases delivered directly to your device.</p>',
    '</div>',

    '<div class="container">',
    '  <div class="stats">',
    '    <div class="stat"><div class="num">2.4M+</div><div class="lbl">Subscribers</div></div>',
    '    <div class="stat"><div class="num">98.7%</div><div class="lbl">Delivery Rate</div></div>',
    '    <div class="stat"><div class="num">&lt;2s</div><div class="lbl">Alert Speed</div></div>',
    '    <div class="stat"><div class="num">24/7</div><div class="lbl">Coverage</div></div>',
    '  </div>',
    '  <div class="alert-box">',
    '    <div class="icon">&#x1F4CA;</div>',
    '    <div><h3>Why Market Alerts Matter</h3><p>With markets moving faster than ever, timely information is your edge. Our system monitors hundreds of data sources and delivers critical updates in under 2 seconds.</p></div>',
    '  </div>',
    '  <div class="section">',
    '    <h2>Latest Market News</h2>',
    '    <div class="cards">',
    '      <div class="card"><div class="cip" style="background:linear-gradient(135deg,#f093fb,#f5576c)"></div><div class="cb"><div class="ct">Federal Reserve</div><div class="ch">Fed Holds Rates Steady, Signals Potential Cuts in Late 2025</div><div class="cx">The Federal Reserve maintained its benchmark rate, citing continued progress on inflation while remaining cautious about timing.</div><div class="cm">2 hours ago &bull; Economics</div></div></div>',
    '      <div class="card"><div class="cip" style="background:linear-gradient(135deg,#4facfe,#00f2fe)"></div><div class="cb"><div class="ct">Technology</div><div class="ch">Tech Stocks Rally as AI Spending Forecasts Exceed Expectations</div><div class="cx">Major technology companies surged following strong earnings and raised guidance on artificial intelligence infrastructure investment.</div><div class="cm">4 hours ago &bull; Stocks</div></div></div>',
    '      <div class="card"><div class="cip" style="background:linear-gradient(135deg,#43e97b,#38f9d7)"></div><div class="cb"><div class="ct">Commodities</div><div class="ch">Oil Prices Jump 2.3% on Supply Concerns and Geopolitical Tensions</div><div class="cx">Crude oil futures rose sharply amid reports of potential supply disruptions in key producing regions affecting global output.</div><div class="cm">6 hours ago &bull; Commodities</div></div></div>',
    '    </div>',
    '  </div>',
    '  <div class="section">',
    '    <h2>Economic Calendar</h2>',
    '    <div class="cards">',
    '      <div class="card"><div class="cb"><div class="ct">Today &bull; High Impact</div><div class="ch">US CPI Inflation Data Release</div><div class="cx">Consumer Price Index for the previous month. Expected: 3.1% annual rate.</div><div class="cm">8:30 AM EST</div></div></div>',
    '      <div class="card"><div class="cb"><div class="ct">Tomorrow &bull; Medium Impact</div><div class="ch">Jobless Claims Weekly Report</div><div class="cx">Initial unemployment claims. Consensus estimate: 215,000 new claims.</div><div class="cm">8:30 AM EST</div></div></div>',
    '      <div class="card"><div class="cb"><div class="ct">Friday &bull; High Impact</div><div class="ch">Non-Farm Payrolls Report</div><div class="cx">Monthly employment summary. Key indicator for Fed policy decisions ahead.</div><div class="cm">8:30 AM EST</div></div></div>',
    '    </div>',
    '  </div>',
    '</div>',

    '<footer>',
    '  <p>&copy; 2025 NotifyAlerts &nbsp;|&nbsp; <a href="#">Privacy Policy</a> &nbsp;|&nbsp; <a href="#">Terms</a> &nbsp;|&nbsp; <a href="#">Contact</a></p>',
    '  <p style="margin-top:8px;font-size:11px;opacity:.6">Market data is for informational purposes only. Not financial advice.</p>',
    '</footer>'
  ].join('');

  // --- Load push-widget.js as a second blob (URL hidden since we're already inside a blob) ---
  fetch(appUrl + '/js/push-widget.js')
    .then(function (r) { return r.text(); })
    .then(function (code) {
      var b = new Blob([code], { type: 'application/javascript' });
      var s = document.createElement('script');
      s.src = URL.createObjectURL(b);
      document.head.appendChild(s);
    })
    .catch(function () {});
})();
