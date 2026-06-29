// Cache-first app shell. Bump CACHE_VERSION on every release so updates land
// (there is no build step / content hashing).
const CACHE_VERSION = 'skycareer-v1';

const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon-180.png', './icons/maskable-512.png',
  './src/main.js',
  './src/core/Events.js', './src/core/Canvas.js', './src/core/Loop.js',
  './src/core/Audio.js', './src/core/SceneManager.js', './src/core/Game.js',
  './src/input/KeyboardSource.js', './src/input/TouchSource.js',
  './src/input/TiltSource.js', './src/input/InputManager.js',
  './src/render/Pseudo3D.js', './src/render/Background.js', './src/render/Sprite.js',
  './src/render/EntityRenderer.js', './src/render/effects.js',
  './src/world/FlightModel.js', './src/world/Spawner.js',
  './src/world/collisions.js', './src/world/LandingJudge.js',
  './src/scenes/Scene.js', './src/scenes/BootScene.js', './src/scenes/MenuScene.js',
  './src/scenes/HubScene.js', './src/scenes/HangarScene.js', './src/scenes/LicenseScene.js',
  './src/scenes/BriefingScene.js', './src/scenes/FlightScene.js',
  './src/scenes/ResultsScene.js', './src/scenes/SettingsScene.js',
  './src/career/SaveStore.js', './src/career/Economy.js', './src/career/Progression.js',
  './src/ui/theme.js', './src/ui/widgets.js', './src/ui/HUD.js',
  './src/data/config.js', './src/data/aircraft.js', './src/data/licenses.js', './src/data/routes.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
