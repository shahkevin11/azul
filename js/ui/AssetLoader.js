// js/ui/AssetLoader.js — Image asset preloader with progress tracking

import { ASSETS } from '../config.js';

export class AssetLoader {
  constructor() {
    this.loaded = new Map();
    this.failed = new Set();
    this.totalAssets = 0;
    this.loadedCount = 0;
  }

  /**
   * Build flat list of all asset entries from the ASSETS manifest.
   * Returns array of { category, key, path }
   */
  _buildManifest() {
    const entries = [];
    const basePath = ASSETS.BASE_PATH || './assets/';
    const categories = ['TILE_SETS', 'BACKGROUNDS', 'FRAMES', 'UI', 'SUMMER', 'ICONS'];

    for (const category of categories) {
      const section = ASSETS[category];
      if (!section) continue;

      if (category === 'TILE_SETS') {
        // Nested: TILE_SETS.classic.blue, etc.
        for (const [variant, tiles] of Object.entries(section)) {
          for (const [color, path] of Object.entries(tiles)) {
            entries.push({
              category,
              key: `${variant}.${color}`,
              path: path.startsWith('./') ? path : basePath + path,
            });
          }
        }
      } else {
        for (const [key, path] of Object.entries(section)) {
          entries.push({
            category,
            key,
            path: path.startsWith('./') ? path : basePath + path,
          });
        }
      }
    }

    return entries;
  }

  /**
   * Preload a single image. Returns a Promise that resolves when loaded.
   */
  _preloadImage(entry) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.loaded.set(`${entry.category}.${entry.key}`, entry.path);
        this.loadedCount++;
        resolve(true);
      };
      img.onerror = () => {
        // Try SVG fallback (assets may be .svg during development)
        const svgPath = entry.path.replace(/\.(png|jpg|jpeg)$/i, '.svg');
        if (svgPath !== entry.path) {
          const svgImg = new Image();
          svgImg.onload = () => {
            this.loaded.set(`${entry.category}.${entry.key}`, svgPath);
            this.loadedCount++;
            resolve(true);
          };
          svgImg.onerror = () => {
            this.failed.add(`${entry.category}.${entry.key}`);
            this.loadedCount++;
            resolve(false);
          };
          svgImg.src = svgPath;
        } else {
          this.failed.add(`${entry.category}.${entry.key}`);
          this.loadedCount++;
          resolve(false);
        }
      };
      img.src = entry.path;
    });
  }

  /**
   * Preload all assets with progress callback.
   * @param {Function} onProgress - Called with (loaded, total) after each asset
   * @returns {Promise<void>}
   */
  async preloadAll(onProgress) {
    const manifest = this._buildManifest();
    this.totalAssets = manifest.length;
    this.loadedCount = 0;

    // Load in batches to avoid overwhelming the browser
    const batchSize = 6;
    for (let i = 0; i < manifest.length; i += batchSize) {
      const batch = manifest.slice(i, i + batchSize);
      await Promise.all(batch.map(entry => this._preloadImage(entry)));
      if (onProgress) onProgress(this.loadedCount, this.totalAssets);
    }
  }

  /**
   * Get the resolved URL for an asset.
   * @param {string} category - e.g. 'BACKGROUNDS', 'UI'
   * @param {string} key - e.g. 'gameBg', 'logo'
   * @returns {string|null}
   */
  getUrl(category, key) {
    return this.loaded.get(`${category}.${key}`) || null;
  }

  /**
   * Get tile image URL for a specific variant and color.
   * @param {string} variant - 'classic' or 'summer'
   * @param {string} color - tile color name
   * @returns {string|null}
   */
  getTileUrl(variant, color) {
    return this.loaded.get(`TILE_SETS.${variant}.${color}`) || null;
  }

  /**
   * Check if all critical assets are loaded.
   */
  isLoaded() {
    return this.loadedCount >= this.totalAssets;
  }

  /**
   * Check if images are available (at least some loaded successfully).
   */
  hasImages() {
    return this.loaded.size > 0;
  }
}
