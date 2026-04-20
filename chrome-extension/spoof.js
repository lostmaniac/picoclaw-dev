// Emulate Mac M1 Chrome fingerprint

// Extract real Chrome version
const origUA = navigator.userAgent;
const chromeVerMatch = origUA.match(/Chrome\/([\d.]+)/);
const chromeVer = chromeVerMatch ? chromeVerMatch[1] : '136.0.0.0';
const chromeMajor = chromeVer.split('.')[0];
const ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;

// Navigator
Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel', configurable: true });
Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
Object.defineProperty(navigator, 'userAgent', { get: () => ua, configurable: true });
Object.defineProperty(navigator, 'appVersion', {
  get: () => ua.substring(ua.indexOf('/') + 1),
  configurable: true
});
Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.', configurable: true });
Object.defineProperty(navigator, 'languages', {
  get: () => ['zh-CN', 'zh', 'en-US', 'en'],
  configurable: true
});

// Override User-Agent Client Hints API (main OS detection vector)
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
        platformVersion: '14.5.0',
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

// WebGL vendor / renderer (37445=UNMASKED_VENDOR, 37446=UNMASKED_RENDERER)
const hookGL = (proto) => {
  const orig = proto.getParameter;
  proto.getParameter = function (param) {
    if (param === 37445) return 'Apple Inc.';
    if (param === 37446) return 'Apple M1';
    return orig.call(this, param);
  };
};
hookGL(WebGLRenderingContext.prototype);
if (typeof WebGL2RenderingContext !== 'undefined') {
  hookGL(WebGL2RenderingContext.prototype);
}

// Screen — MacBook Pro at 1920x1080
Object.defineProperty(screen, 'width', { get: () => 1920, configurable: true });
Object.defineProperty(screen, 'height', { get: () => 1080, configurable: true });
Object.defineProperty(screen, 'availWidth', { get: () => 1920, configurable: true });
Object.defineProperty(screen, 'availHeight', { get: () => 1055, configurable: true });
Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });

// Window dimensions — outer = browser chrome, inner = viewport
Object.defineProperty(window, 'outerWidth', { get: () => 1920, configurable: true });
Object.defineProperty(window, 'outerHeight', { get: () => 1080, configurable: true });
Object.defineProperty(window, 'innerWidth', { get: () => 1920, configurable: true });
Object.defineProperty(window, 'innerHeight', { get: () => 1055, configurable: true });

// devicePixelRatio = 2 for Retina display
Object.defineProperty(window, 'devicePixelRatio', { get: () => 2, configurable: true });

// Remove headless indicators
delete navigator.__proto__.webdriver;
