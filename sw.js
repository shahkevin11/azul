// sw.js — Service worker for offline caching

const CACHE_NAME = 'azul-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/tiles.css',
  './css/lobby.css',
  './css/board.css',
  './css/board-summer.css',
  './css/animations.css',
  './css/responsive.css',
  './js/main.js',
  './js/config.js',
  './js/engine/GameState.js',
  './js/engine/TileBag.js',
  './js/engine/FactoryDisplay.js',
  './js/engine/PatternLine.js',
  './js/engine/Wall.js',
  './js/engine/FloorLine.js',
  './js/engine/StarBoard.js',
  './js/engine/ScoringEngine.js',
  './js/engine/TurnManager.js',
  './js/engine/EndGameDetector.js',
  './js/engine/GameRules.js',
  './js/ai/AIPlayer.js',
  './js/ai/Heuristics.js',
  './js/ai/strategies/EasyAI.js',
  './js/ai/strategies/MediumAI.js',
  './js/ai/strategies/HardAI.js',
  './js/ui/Renderer.js',
  './js/ui/ToastNotifications.js',
  './js/audio/SoundManager.js',
  './js/variants/VariantRegistry.js',
  './js/variants/ClassicAzul.js',
  './js/variants/SummerPavilion.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        // Fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
