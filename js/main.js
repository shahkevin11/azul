// js/main.js — Main application entry point

import { GameState } from './engine/GameState.js';
import { GameRules } from './engine/GameRules.js';
import { TurnManager } from './engine/TurnManager.js';
import { EndGameDetector } from './engine/EndGameDetector.js';
import { AIPlayer } from './ai/AIPlayer.js';
import { Renderer } from './ui/Renderer.js';
import { ToastNotifications } from './ui/ToastNotifications.js';
import { SoundManager } from './audio/SoundManager.js';
import { AssetLoader } from './ui/AssetLoader.js';
import { ThemeManager } from './ui/ThemeManager.js';
import { registerVariant, listVariants } from './variants/VariantRegistry.js';
import { ClassicAzulConfig } from './variants/ClassicAzul.js';
import { SummerPavilionConfig } from './variants/SummerPavilion.js';

class AzulApp {
  constructor() {
    this.state = null;
    this.renderer = null;
    this.toast = null;
    this.assetLoader = null;
    this.themeManager = null;
    this.currentView = 'lobby'; // 'lobby' | 'game'
    this.aiThinking = false;
    this.gameConfig = {
      variant: 'classic',
      players: [
        { name: 'You', type: 'human' },
        { name: 'Claude', type: 'ai-medium' },
      ],
    };

    // Register variants
    registerVariant(ClassicAzulConfig);
    registerVariant(SummerPavilionConfig);
  }

  async init() {
    SoundManager.init();
    this.toast = new ToastNotifications();

    // Initialize asset management
    this.assetLoader = new AssetLoader();
    this.themeManager = new ThemeManager(this.assetLoader);

    // Preload assets with progress bar
    try {
      await this.assetLoader.preloadAll((loaded, total) => {
        const fill = document.getElementById('loading-bar-fill');
        if (fill) fill.style.width = `${(loaded / total) * 100}%`;
        const text = document.getElementById('loading-text');
        if (text) text.textContent = `Loading assets... ${loaded}/${total}`;
      });

      // Apply theme (sets CSS custom properties with loaded image URLs)
      this.themeManager.applyTheme();
    } catch (e) {
      // Assets failed to load — continue with CSS fallback
      console.warn('Asset loading failed, using CSS fallback:', e);
    }

    // Check for join link
    const params = new URLSearchParams(window.location.search);
    if (params.has('join')) {
      // Multiplayer join — not yet implemented, show lobby
      this.toast.info('Multiplayer coming soon! Starting local game...');
    }

    // Unlock audio on first touch
    const unlockAudio = () => {
      SoundManager.unlock();
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    this.showLobby();
  }

  // ========== LOBBY ==========
  showLobby() {
    this.currentView = 'lobby';
    const app = document.getElementById('app');
    app.innerHTML = this.buildLobbyHTML();
    this.bindLobbyEvents();
    this.updateLobbyUI();
  }

  buildLobbyHTML() {
    // Use logo image if available, fallback to text
    const logoUrl = this.themeManager?.getUrl('UI', 'logo');
    const logoHtml = logoUrl
      ? `<img class="lobby__logo-img" src="${logoUrl}" alt="AZUL" draggable="false">`
      : `<h1 class="lobby__title">AZUL</h1>`;

    return `
      <div class="lobby" id="lobby">
        <div class="lobby__header">
          ${logoHtml}
          <p class="lobby__subtitle">Portuguese Tile Game</p>
          <div class="lobby__tiles-decor">
            <div class="tile tile--blue"></div>
            <div class="tile tile--yellow"></div>
            <div class="tile tile--red"></div>
            <div class="tile tile--black"></div>
            <div class="tile tile--white"></div>
          </div>
        </div>

        <div class="lobby__panel">
          <div class="lobby__section">
            <div class="lobby__section-title">Game Mode</div>
            <div class="variant-cards" id="variant-cards">
              <button class="variant-card selected" data-variant="classic">
                <div class="variant-card__name">Classic</div>
                <div class="variant-card__desc">Complete wall rows</div>
              </button>
              <button class="variant-card" data-variant="summer">
                <div class="variant-card__name">Summer Pavilion</div>
                <div class="variant-card__desc">Star board variant</div>
              </button>
            </div>
          </div>

          <div class="lobby__section">
            <div class="lobby__section-title">Players</div>
            <div class="player-slots" id="player-slots"></div>
            <button class="add-player-btn" id="add-player-btn">+ Add Player</button>
          </div>

          <button class="btn btn-gold lobby__start" id="start-game-btn">
            Start Game
          </button>
        </div>

        <div class="lobby__footer">
          <div class="lobby__footer-links">
            <button id="rules-btn">How to Play</button>
            <button id="settings-link-btn">Settings</button>
          </div>
        </div>
      </div>
    `;
  }

  bindLobbyEvents() {
    // Variant selection
    document.querySelectorAll('.variant-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.variant-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameConfig.variant = card.dataset.variant;
        SoundManager.play('tilePick');
      };
    });

    // Add player
    document.getElementById('add-player-btn').onclick = () => {
      if (this.gameConfig.players.length < 4) {
        const num = this.gameConfig.players.length + 1;
        this.gameConfig.players.push({
          name: `CPU ${num - 1}`,
          type: 'ai-easy',
        });
        this.updateLobbyUI();
        SoundManager.play('tilePlace');
      }
    };

    // Start game
    document.getElementById('start-game-btn').onclick = () => {
      this.startGame();
    };

    // Rules
    document.getElementById('rules-btn').onclick = () => {
      this.showRulesDialog();
    };
  }

  updateLobbyUI() {
    const slotsEl = document.getElementById('player-slots');
    if (!slotsEl) return;
    slotsEl.innerHTML = '';

    this.gameConfig.players.forEach((player, i) => {
      const slot = document.createElement('div');
      slot.className = 'player-slot';

      slot.innerHTML = `
        <div class="player-slot__number">${i + 1}</div>
        <input class="player-slot__name" value="${player.name}" data-index="${i}"
               placeholder="Player ${i + 1}" maxlength="12" aria-label="Player ${i+1} name">
        <select class="player-slot__type" data-index="${i}" aria-label="Player ${i+1} type">
          <option value="human" ${player.type === 'human' ? 'selected' : ''}>Human</option>
          <option value="ai-easy" ${player.type === 'ai-easy' ? 'selected' : ''}>AI Easy</option>
          <option value="ai-medium" ${player.type === 'ai-medium' ? 'selected' : ''}>AI Medium</option>
          <option value="ai-hard" ${player.type === 'ai-hard' ? 'selected' : ''}>AI Hard</option>
        </select>
        ${i > 1 ? `<button class="player-slot__remove" data-index="${i}" aria-label="Remove player">✕</button>` : ''}
      `;

      slotsEl.appendChild(slot);
    });

    // Bind slot events
    slotsEl.querySelectorAll('.player-slot__name').forEach(input => {
      input.oninput = () => {
        this.gameConfig.players[input.dataset.index].name = input.value || `Player ${+input.dataset.index + 1}`;
      };
    });

    slotsEl.querySelectorAll('.player-slot__type').forEach(select => {
      select.onchange = () => {
        this.gameConfig.players[select.dataset.index].type = select.value;
      };
    });

    slotsEl.querySelectorAll('.player-slot__remove').forEach(btn => {
      btn.onclick = () => {
        this.gameConfig.players.splice(btn.dataset.index, 1);
        this.updateLobbyUI();
        SoundManager.play('tileBreak');
      };
    });

    // Hide add button if max players
    const addBtn = document.getElementById('add-player-btn');
    if (addBtn) addBtn.style.display = this.gameConfig.players.length >= 4 ? 'none' : '';
  }

  showRulesDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay visible';
    overlay.id = 'rules-overlay';

    overlay.innerHTML = `
      <div class="settings-panel" style="max-height: 80vh; overflow-y: auto;">
        <h3>How to Play</h3>
        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
          <p><strong style="color: var(--accent-gold);">Goal:</strong> Score the most points by placing tiles on your wall.</p>
          <p style="margin-top:8px"><strong style="color: var(--accent-gold);">Each Round:</strong></p>
          <p>1. <strong>Draft tiles</strong> — Tap a color on any factory to take ALL tiles of that color. Others go to center.</p>
          <p>2. <strong>Place tiles</strong> — Choose a pattern line row to fill. Overflow goes to your floor (penalties!).</p>
          <p>3. <strong>Score</strong> — Completed rows slide to your wall. Score points for adjacent tiles.</p>
          <p style="margin-top:8px"><strong style="color: var(--accent-gold);">Game End:</strong> When someone completes a wall row. Bonus points for complete rows (+2), columns (+7), and color sets (+10).</p>
          <p style="margin-top:8px"><strong style="color: var(--accent-gold);">Tips:</strong> Plan ahead! Watch what opponents need. Avoid floor penalties.</p>
        </div>
        <button class="btn btn-secondary" style="width:100%;margin-top:16px" onclick="this.closest('.settings-overlay').remove()">Got it!</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
  }

  // ========== GAME ==========
  startGame() {
    this.state = GameState.create(this.gameConfig);
    this.currentView = 'game';

    const app = document.getElementById('app');
    app.innerHTML = this.buildGameHTML();

    this.renderer = new Renderer(this, this.themeManager);
    this.render();

    SoundManager.play('roundEnd');
    this.toast.info(`Round 1 — ${this.state.players[0].name} starts!`);

    // If first player is AI, trigger AI turn
    this.checkAITurn();
  }

  buildGameHTML() {
    return `
      <div class="game-container" id="game-container">
        <div class="score-bar" id="score-bar" role="status"></div>

        <div class="game-scroll-container" id="game-scroll">
          <div class="game-section market-section" id="market-section">
          </div>

          <div class="game-section board-section" id="board-section">
          </div>

          <div class="game-section opponents-section" id="opponents-section">
          </div>
        </div>

        <div class="section-nav" id="section-nav">
          <button class="section-nav__dot section-nav__dot--active" data-section="market" aria-label="Market"></button>
          <button class="section-nav__dot" data-section="board" aria-label="Your board"></button>
          <button class="section-nav__dot" data-section="opponents" aria-label="Opponents"></button>
        </div>
      </div>

      <div class="settings-overlay" id="settings-overlay">
        <div class="settings-panel">
          <h3>Settings</h3>
          <div class="setting-row">
            <span class="setting-label">Sound</span>
            <div class="toggle ${SoundManager.isMuted() ? '' : 'active'}" id="sound-toggle"></div>
          </div>
          <div class="setting-row">
            <span class="setting-label">Haptics</span>
            <div class="toggle active" id="haptic-toggle"></div>
          </div>
          <button class="btn btn-secondary" style="width:100%;margin-top:16px" id="close-settings">Close</button>
          <button class="btn btn-secondary" style="width:100%;margin-top:8px;color:var(--danger)" id="quit-game">Quit to Lobby</button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.renderer || !this.state) return;
    this.renderer.render(this.state);
    this.bindGameEvents();
  }

  bindGameEvents() {
    // Section nav
    document.querySelectorAll('.section-nav__dot').forEach(dot => {
      dot.onclick = () => {
        const sectionId = `${dot.dataset.section}-section`;
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      };
    });

    // Scroll observer for nav dots
    const scroll = document.getElementById('game-scroll');
    if (scroll && !scroll.dataset.observed) {
      scroll.dataset.observed = 'true';
      const sections = scroll.querySelectorAll('.game-section');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('-section', '');
            document.querySelectorAll('.section-nav__dot').forEach(d => {
              d.classList.toggle('section-nav__dot--active', d.dataset.section === id);
            });
          }
        });
      }, { root: scroll, threshold: 0.5 });
      sections.forEach(s => observer.observe(s));
    }

    // Settings
    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggleSettings(false);
    });

    document.getElementById('sound-toggle')?.addEventListener('click', (e) => {
      const muted = SoundManager.toggleMute();
      e.currentTarget.classList.toggle('active', !muted);
    });

    document.getElementById('quit-game')?.addEventListener('click', () => {
      this.goToLobby();
    });
  }

  toggleSettings(show) {
    const overlay = document.getElementById('settings-overlay');
    if (!overlay) return;
    if (show === undefined) show = !overlay.classList.contains('visible');
    overlay.classList.toggle('visible', show);
  }

  // ========== GAME ACTIONS ==========
  async handlePlayerAction(action) {
    if (this.aiThinking) return;
    if (this.state.phase !== 'factory-offer') return;

    const { newState, events } = GameState.applyAction(this.state, action);

    // Check for invalid move
    const invalidEvent = events.find(e => e.type === 'INVALID_MOVE');
    if (invalidEvent) {
      this.toast.error(invalidEvent.error);
      SoundManager.play('error');
      this.haptic('error');
      return;
    }

    this.state = newState;

    // Process events
    this.processEvents(events);

    // Check if we need wall tiling
    if (this.state.phase === 'wall-tiling') {
      await this.processRoundEnd();
      return;
    }

    this.render();

    // Check if next player is AI
    await this.checkAITurn();
  }

  async processRoundEnd() {
    this.toast.info('Scoring round...');
    SoundManager.play('roundEnd');

    // Small delay for visual feedback
    await this.delay(600);

    const result = TurnManager.processRoundEnd(this.state);
    this.state = result.newState;

    // Process wall tiling events
    this.processEvents(result.events);

    if (result.gameOver) {
      await this.delay(500);
      this.handleGameOver();
      return;
    }

    // Show round transition
    this.renderer.showRoundTransition(this.state.round);
    this.render();

    await this.delay(1600);

    this.toast.info(`Round ${this.state.round} — ${this.state.players[this.state.currentPlayerIndex].name} starts!`);

    // Check if first player is AI
    await this.checkAITurn();
  }

  handleGameOver() {
    this.state.phase = 'game-over';
    const result = GameRules.determineWinner(this.state);

    this.render();
    SoundManager.play('gameOver');
    this.renderer.renderGameOver(this.state, result);
  }

  async checkAITurn() {
    while (
      this.state.phase === 'factory-offer' &&
      AIPlayer.isAI(this.state.players[this.state.currentPlayerIndex].type)
    ) {
      this.aiThinking = true;
      this.render();

      const move = await AIPlayer.executeAITurn(this.state);
      if (!move) {
        this.aiThinking = false;
        break;
      }

      const { newState, events } = GameState.applyAction(this.state, move);
      this.state = newState;
      this.processEvents(events);

      // Check for wall tiling
      if (this.state.phase === 'wall-tiling') {
        this.aiThinking = false;
        await this.processRoundEnd();
        return;
      }

      this.render();
    }

    this.aiThinking = false;
    this.render();
  }

  processEvents(events) {
    for (const event of events) {
      switch (event.type) {
        case 'FIRST_PLAYER_TAKEN':
          SoundManager.play('tileBreak');
          break;
        case 'TILES_PICKED':
          SoundManager.play('tilePick');
          break;
        case 'TILES_PLACED':
          SoundManager.play('tilePlace');
          break;
        case 'TILES_TO_FLOOR':
          SoundManager.play('tileBreak');
          break;
        case 'PLAYER_WALL_TILING':
          if (event.events) {
            for (const subEvent of event.events) {
              if (subEvent.type === 'TILE_SCORED') {
                SoundManager.play('tileWall');
              }
            }
          }
          break;
        case 'NEXT_TURN':
          // Show turn notification for human players
          const nextPlayer = this.state.players[event.playerIndex];
          if (nextPlayer.type === 'human') {
            this.toast.turn(nextPlayer.name);
            SoundManager.play('turnAlert');
            this.haptic('tile-pick');
          }
          break;
        case 'END_GAME_BONUS':
          SoundManager.play('scoreBonus');
          break;
      }
    }
  }

  // ========== UTILITIES ==========
  playSound(name) {
    SoundManager.play(name);
  }

  haptic(type) {
    if (!navigator.vibrate) return;
    switch (type) {
      case 'tile-pick': navigator.vibrate(15); break;
      case 'tile-place': navigator.vibrate(25); break;
      case 'score': navigator.vibrate([10, 50, 10]); break;
      case 'error': navigator.vibrate([50, 30, 50]); break;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  playAgain() {
    this.renderer.removeGameOver();
    this.startGame();
  }

  goToLobby() {
    this.renderer?.removeGameOver();
    this.state = null;
    this.renderer = null;
    this.showLobby();
  }
}

// ========== INITIALIZATION ==========
function bootstrap() {
  const app = new AzulApp();
  window.azulApp = app; // Debug access
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
