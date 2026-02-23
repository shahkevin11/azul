// js/ui/ThemeManager.js — CSS custom property management for image assets

export class ThemeManager {
  constructor(assetLoader) {
    this.loader = assetLoader;
    this.fallbackMode = false;
  }

  /**
   * Apply theme by setting CSS custom properties with image URLs.
   * Called after AssetLoader.preloadAll() completes.
   */
  applyTheme() {
    const root = document.documentElement;

    // Tile images (classic)
    this._setImageVar(root, '--tile-blue-img', 'TILE_SETS', 'classic.blue');
    this._setImageVar(root, '--tile-yellow-img', 'TILE_SETS', 'classic.yellow');
    this._setImageVar(root, '--tile-red-img', 'TILE_SETS', 'classic.red');
    this._setImageVar(root, '--tile-black-img', 'TILE_SETS', 'classic.black');
    this._setImageVar(root, '--tile-white-img', 'TILE_SETS', 'classic.white');
    this._setImageVar(root, '--tile-first-player-img', 'TILE_SETS', 'classic.firstPlayer');

    // Tile images (summer)
    this._setImageVar(root, '--tile-purple-img', 'TILE_SETS', 'summer.purple');
    this._setImageVar(root, '--tile-green-img', 'TILE_SETS', 'summer.green');
    this._setImageVar(root, '--tile-orange-img', 'TILE_SETS', 'summer.orange');
    this._setImageVar(root, '--tile-summer-yellow-img', 'TILE_SETS', 'summer.yellow');
    this._setImageVar(root, '--tile-summer-blue-img', 'TILE_SETS', 'summer.blue');
    this._setImageVar(root, '--tile-summer-red-img', 'TILE_SETS', 'summer.red');
    this._setImageVar(root, '--tile-wild-glow-img', 'TILE_SETS', 'summer.wildGlow');

    // Backgrounds
    this._setImageVar(root, '--bg-image-game', 'BACKGROUNDS', 'gameBg');
    this._setImageVar(root, '--bg-image-lobby', 'BACKGROUNDS', 'lobbyBg');
    this._setImageVar(root, '--bg-pattern-tile', 'BACKGROUNDS', 'gameBgTile');
    this._setImageVar(root, '--bg-overlay-texture', 'BACKGROUNDS', 'overlayTexture');

    // Frames
    this._setImageVar(root, '--frame-factory', 'FRAMES', 'factory');
    this._setImageVar(root, '--frame-board', 'FRAMES', 'board');
    this._setImageVar(root, '--frame-panel', 'FRAMES', 'panel');
    this._setImageVar(root, '--frame-center-pool', 'FRAMES', 'centerPool');
    this._setImageVar(root, '--frame-score-bar', 'FRAMES', 'scoreBar');
    this._setImageVar(root, '--frame-divider', 'FRAMES', 'divider');

    // UI elements
    this._setImageVar(root, '--ui-logo', 'UI', 'logo');
    this._setImageVar(root, '--ui-icon-settings', 'UI', 'iconSettings');
    this._setImageVar(root, '--ui-icon-crown', 'UI', 'iconCrown');
    this._setImageVar(root, '--ui-icon-arrow', 'UI', 'iconArrow');
    this._setImageVar(root, '--ui-btn-start-bg', 'UI', 'btnStartBg');
    this._setImageVar(root, '--ui-tile-slot-empty', 'UI', 'tileSlotEmpty');
    this._setImageVar(root, '--ui-tile-slot-legal', 'UI', 'tileSlotLegal');
    this._setImageVar(root, '--ui-tile-selected-glow', 'UI', 'tileSelectedGlow');
    this._setImageVar(root, '--ui-floor-penalty', 'UI', 'floorPenalty');
    this._setImageVar(root, '--ui-round-banner', 'UI', 'roundBanner');

    // Summer Pavilion
    this._setImageVar(root, '--summer-star-board-bg', 'SUMMER', 'starBoardBg');

    // Mark images as loaded on body
    if (this.loader.hasImages()) {
      document.body.classList.add('images-loaded');
    }
  }

  /**
   * Set a CSS custom property to url(path) if the asset is loaded.
   */
  _setImageVar(root, varName, category, key) {
    const url = this.loader.getUrl(category, key);
    if (url) {
      root.style.setProperty(varName, `url('${url}')`);
    }
  }

  /**
   * Get tile image URL for Renderer to use.
   */
  getTileImage(variant, color) {
    return this.loader.getTileUrl(variant, color);
  }

  /**
   * Get any asset URL.
   */
  getUrl(category, key) {
    return this.loader.getUrl(category, key);
  }

  /**
   * Check if images are available.
   */
  hasImages() {
    return this.loader.hasImages() && !this.fallbackMode;
  }

  /**
   * Toggle CSS-only fallback mode.
   */
  setFallbackMode(enabled) {
    this.fallbackMode = enabled;
    document.body.classList.toggle('images-loaded', !enabled);
  }
}
