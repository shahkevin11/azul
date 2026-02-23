// sw.js — Service worker for offline caching

const CACHE_NAME = 'azul-v1.0';
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
  './js/ui/AssetLoader.js',
  './js/ui/ThemeManager.js',
  './js/audio/SoundManager.js',
  './js/variants/VariantRegistry.js',
  './js/variants/ClassicAzul.js',
  './js/variants/SummerPavilion.js',
  // Tile assets (classic)
  './assets/tiles/classic/blue.svg',
  './assets/tiles/classic/yellow.svg',
  './assets/tiles/classic/red.svg',
  './assets/tiles/classic/black.svg',
  './assets/tiles/classic/white.svg',
  './assets/tiles/classic/first-player.svg',
  // Tile assets (summer)
  './assets/tiles/summer/purple.svg',
  './assets/tiles/summer/green.svg',
  './assets/tiles/summer/orange.svg',
  './assets/tiles/summer/yellow.svg',
  './assets/tiles/summer/blue.svg',
  './assets/tiles/summer/red.svg',
  './assets/tiles/summer/wild-glow.svg',
  // Background assets
  './assets/bg/game-bg.svg',
  './assets/bg/lobby-bg.svg',
  './assets/bg/game-bg-tile.svg',
  './assets/bg/overlay-texture.svg',
  // Frame assets
  './assets/frames/factory-frame.svg',
  './assets/frames/board-frame.svg',
  './assets/frames/panel-frame.svg',
  './assets/frames/center-pool-frame.svg',
  './assets/frames/score-bar-bg.svg',
  './assets/frames/divider.svg',
  // UI assets
  './assets/ui/logo-azul.svg',
  './assets/ui/icon-settings.svg',
  './assets/ui/icon-crown.svg',
  './assets/ui/icon-arrow-right.svg',
  './assets/ui/btn-start-bg.svg',
  './assets/ui/tile-slot-empty.svg',
  './assets/ui/tile-slot-legal.svg',
  './assets/ui/tile-selected-glow.svg',
  './assets/ui/floor-penalty.svg',
  './assets/ui/round-banner.svg',
  // Icon assets
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './assets/icons/apple-touch-icon.svg',
  './assets/icons/favicon.svg',
  // Summer Pavilion assets
  './assets/summer/star-board-bg.svg',
  './assets/summer/decoration-pillar.svg',
  './assets/summer/decoration-statue.svg',
  './assets/summer/decoration-window.svg',
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
