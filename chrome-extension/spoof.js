// Emulate MacBook Pro 13" M1 (2020) — macOS Sequoia 15.3

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

// ── Extract real Chrome version ──
const origUA = navigator.userAgent;
const chromeVerMatch = origUA.match(/Chrome\/([\d.]+)/);
const chromeVer = chromeVerMatch ? chromeVerMatch[1] : '136.0.0.0';
const chromeMajor = chromeVer.split('.')[0];

const ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;

// ── Navigator ──
Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel', configurable: true });
Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
Object.defineProperty(navigator, 'userAgent', { get: () => ua, configurable: true });
Object.defineProperty(navigator, 'appVersion', {
  get: () => ua.substring(ua.indexOf('/') + 1),
  configurable: true
});
Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.', configurable: true });
Object.defineProperty(navigator, 'productSub', { get: () => '20030107', configurable: true });
Object.defineProperty(navigator, 'product', { get: () => 'Gecko', configurable: true });

// ── Languages ── match --lang=zh-CN and Accept-Language header
Object.defineProperty(navigator, 'language', { get: () => 'zh-CN', configurable: true });
Object.defineProperty(navigator, 'languages', {
  get: () => ['zh-CN', 'zh', 'en-US', 'en'],
  configurable: true
});

// ── webdriver cleanup ── multi-layer
Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
delete navigator.__proto__.webdriver;
delete Object.getPrototypeOf(navigator).webdriver;

// ── User-Agent Client Hints ──
if (navigator.userAgentData) {
  const brands = [
    { brand: 'Chromium', version: chromeMajor },
    { brand: 'Google Chrome', version: chromeMajor },
    { brand: 'Not/A)Brand', version: '8' }
  ];
  const uaData = { brands, mobile: false, platform: 'macOS' };

  Object.defineProperty(navigator, 'userAgentData', {
    get: () => ({
      ...uaData,
      getHighEntropyValues: async () => ({
        brands,
        mobile: false,
        platform: 'macOS',
        architecture: 'arm',
        bitness: '64',
        model: '',
        platformVersion: '15.3.0',
        fullVersionList: [
          { brand: 'Chromium', version: chromeVer },
          { brand: 'Google Chrome', version: chromeVer }
        ],
        uaFullVersion: chromeVer,
        wow64: false
      }),
      toJSON: () => uaData
    }),
    configurable: true
  });
}

// ── Plugins ──
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const p = {
      0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      name: 'PDF Viewer', filename: 'internal-pdf-viewer',
      description: 'Portable Document Format', length: 1,
      item: (i) => p[i], namedItem: () => p[0]
    };
    const arr = [p];
    arr.item = (i) => arr[i];
    arr.namedItem = (n) => n === 'PDF Viewer' ? p : null;
    arr.refresh = () => {};
    Object.defineProperty(arr, 'length', { get: () => 1 });
    return arr;
  },
  configurable: true
});

Object.defineProperty(navigator, 'mimeTypes', {
  get: () => {
    const m = {
      type: 'application/pdf', suffixes: 'pdf',
      description: 'Portable Document Format',
      enabledPlugin: { name: 'PDF Viewer' }
    };
    const arr = [m];
    arr.item = (i) => arr[i];
    arr.namedItem = (n) => n === 'application/pdf' ? m : null;
    Object.defineProperty(arr, 'length', { get: () => 1 });
    return arr;
  },
  configurable: true
});

// ── WebGL ── Apple M1
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

// ── Screen ── MacBook Pro 13" Retina
Object.defineProperty(screen, 'width', { get: () => 1440, configurable: true });
Object.defineProperty(screen, 'height', { get: () => 900, configurable: true });
Object.defineProperty(screen, 'availWidth', { get: () => 1440, configurable: true });
Object.defineProperty(screen, 'availHeight', { get: () => 875, configurable: true });
Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });

// ── Window ── Chrome UI offset ~85px
Object.defineProperty(window, 'innerWidth', { get: () => 1440, configurable: true });
Object.defineProperty(window, 'innerHeight', { get: () => 815, configurable: true });
Object.defineProperty(window, 'outerWidth', { get: () => 1440, configurable: true });
Object.defineProperty(window, 'outerHeight', { get: () => 900, configurable: true });

// ── Notification ──
if (typeof Notification !== 'undefined') {
  Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
}

// ── document.hasFocus ──
Document.prototype.hasFocus = function () { return true; };

// ── Permissions ──
if (navigator.permissions) {
  const origQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (params) => {
    if (params.name === 'notifications') {
      return Promise.resolve({ state: 'prompt', onchange: null });
    }
    return origQuery(params);
  };
}

// ── Canvas noise at render level ── stealthier than intercepting toDataURL
// Shift text rendering by sub-pixel amount → changes actual canvas pixels naturally
const origFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
  const rng = mulberry32(NOISE_SEED ^ (text.length * 137));
  const dx = (rng() - 0.5) * 0.02;
  const dy = (rng() - 0.5) * 0.02;
  return origFillText.call(this, text, x + dx, y + dy, maxWidth);
};

const origStrokeText = CanvasRenderingContext2D.prototype.strokeText;
CanvasRenderingContext2D.prototype.strokeText = function (text, x, y, maxWidth) {
  const rng = mulberry32(NOISE_SEED ^ (text.length * 251));
  const dx = (rng() - 0.5) * 0.02;
  const dy = (rng() - 0.5) * 0.02;
  return origStrokeText.call(this, text, x + dx, y + dy, maxWidth);
};
