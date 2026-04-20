// Emulate MacBook Pro 16" — macOS Chrome
(function () {
  // ── Deterministic PRNG ──
  const NOISE_SEED = typeof INSTANCE_SEED !== 'undefined' ? INSTANCE_SEED : 0x4D616331;
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ── Dynamic Chrome version ──
  const origUA = navigator.userAgent;
  const verMatch = origUA.match(/Chrome\/([\d.]+)/);
  const fullVer = verMatch ? verMatch[1] : '136.0.0.0';
  const major = fullVer.split('.')[0];

  const spoofedUA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/' + fullVer + ' Safari/537.36';

  // ── 1. User Agent ──
  Object.defineProperty(navigator, 'userAgent', { get: () => spoofedUA, configurable: true });

  // ── 2. Platform ──
  Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel', configurable: true });

  // ── 3. appVersion ──
  Object.defineProperty(navigator, 'appVersion', {
    get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + fullVer + ' Safari/537.36',
    configurable: true
  });

  // ── 4. vendor ──
  Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.', configurable: true });

  // ── 5. userAgentData ──
  if ('userAgentData' in navigator) {
    const brands = [
      { brand: 'Chromium', version: major },
      { brand: 'Google Chrome', version: major },
      { brand: 'Not-A.Brand', version: '99' }
    ];
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({
        brands,
        mobile: false,
        platform: 'macOS',
        getHighEntropyValues: async () => ({
          architecture: 'arm',
          bitness: '64',
          brands,
          fullVersionList: [
            { brand: 'Chromium', version: fullVer },
            { brand: 'Google Chrome', version: fullVer }
          ],
          mobile: false,
          model: '',
          platform: 'macOS',
          platformVersion: '15.3.0',
          uaFullVersion: fullVer,
          wow64: false
        })
      }),
      configurable: true
    });
  }

  // ── 6. language / languages ──
  Object.defineProperty(navigator, 'language', { get: () => 'zh-CN', configurable: true });
  Object.defineProperty(navigator, 'languages', {
    get: () => ['zh-CN', 'zh', 'en-US', 'en'],
    configurable: true
  });

  // ── 7. hardwareConcurrency ──
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });

  // ── 8. deviceMemory ──
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });

  // ── 9. maxTouchPoints ──
  Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });

  // ── 10. screen ── MacBook Pro 16"
  const screenProps = { width: 2560, height: 1600, availWidth: 2560, availHeight: 1545, colorDepth: 30, pixelDepth: 30 };
  for (const [key, val] of Object.entries(screenProps)) {
    Object.defineProperty(screen, key, { get: () => val, configurable: true });
  }

  // ── 11. devicePixelRatio ──
  Object.defineProperty(window, 'devicePixelRatio', { get: () => 2, configurable: true });

  // ── 12. window dimensions ──
  Object.defineProperty(window, 'outerWidth', { get: () => 2560, configurable: true });
  Object.defineProperty(window, 'outerHeight', { get: () => 1545, configurable: true });
  Object.defineProperty(window, 'innerWidth', { get: () => 2560, configurable: true });
  Object.defineProperty(window, 'innerHeight', { get: () => 1460, configurable: true });

  // ── 13. timezone ──
  const _DateTimeFormat = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function (locale, options) {
    options = options || {};
    if (!options.timeZone) options.timeZone = 'Asia/Shanghai';
    return new _DateTimeFormat(locale, options);
  };
  Intl.DateTimeFormat.prototype = _DateTimeFormat.prototype;
  Intl.DateTimeFormat.supportedLocalesOf = _DateTimeFormat.supportedLocalesOf;

  // ── 14. plugins ──
  const fakePlugins = [
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer' },
    { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
    { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer' },
    { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer' },
    { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer' }
  ];
  const pluginArray = Object.create(PluginArray.prototype);
  fakePlugins.forEach((p, i) => {
    const plugin = Object.create(Plugin.prototype);
    Object.defineProperty(plugin, 'name', { get: () => p.name });
    Object.defineProperty(plugin, 'filename', { get: () => p.filename });
    Object.defineProperty(plugin, 'description', { get: () => '' });
    Object.defineProperty(plugin, 'length', { get: () => 0 });
    pluginArray[i] = plugin;
  });
  Object.defineProperty(pluginArray, 'length', { get: () => fakePlugins.length });
  Object.defineProperty(navigator, 'plugins', { get: () => pluginArray, configurable: true });

  // ── 15. mimeTypes ──
  const fakeMime = Object.create(MimeTypeArray.prototype);
  Object.defineProperty(fakeMime, 'length', { get: () => 2 });
  ['application/pdf', 'text/pdf'].forEach((type, i) => {
    const m = Object.create(MimeType.prototype);
    Object.defineProperty(m, 'type', { get: () => type });
    fakeMime[i] = m;
  });
  Object.defineProperty(navigator, 'mimeTypes', { get: () => fakeMime, configurable: true });

  // ── 16. webdriver ──
  Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
  delete navigator.__proto__.webdriver;
  delete Object.getPrototypeOf(navigator).webdriver;

  // ── 17. chrome object ──
  if (!window.chrome) {
    window.chrome = {
      app: { isInstalled: false, InstallState: {}, RunningState: {} },
      runtime: {},
      loadTimes: () => ({}),
      csi: () => ({})
    };
  }

  // ── 18. WebGL ── Apple M1
  const hookGL = (proto) => {
    const orig = proto.getParameter;
    proto.getParameter = function (param) {
      if (param === 37445) return 'Apple Inc.';
      if (param === 37446) return 'Apple M1';
      return orig.call(this, param);
    };
  };
  hookGL(WebGLRenderingContext.prototype);
  if (typeof WebGL2RenderingContext !== 'undefined') hookGL(WebGL2RenderingContext.prototype);

  // ── 19. Notification ──
  if (typeof Notification !== 'undefined') {
    Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
  }

  // ── 20. document.hasFocus ──
  Document.prototype.hasFocus = function () { return true; };

  // ── 21. Permissions ──
  if (navigator.permissions) {
    const origQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (params) => {
      if (params.name === 'notifications') return Promise.resolve({ state: 'prompt', onchange: null });
      return origQuery(params);
    };
  }

  // ── 22. Canvas noise at render level ──
  const origFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
    const rng = mulberry32(NOISE_SEED ^ (text.length * 137));
    return origFillText.call(this, text, x + (rng() - 0.5) * 0.02, y + (rng() - 0.5) * 0.02, maxWidth);
  };
  const origStrokeText = CanvasRenderingContext2D.prototype.strokeText;
  CanvasRenderingContext2D.prototype.strokeText = function (text, x, y, maxWidth) {
    const rng = mulberry32(NOISE_SEED ^ (text.length * 251));
    return origStrokeText.call(this, text, x + (rng() - 0.5) * 0.02, y + (rng() - 0.5) * 0.02, maxWidth);
  };
})();
