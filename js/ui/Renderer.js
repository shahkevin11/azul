// js/ui/Renderer.js — Master renderer: orchestrates all sub-renderers

import { CLASSIC } from '../config.js';
import { Wall } from '../engine/Wall.js';
import { PatternLine } from '../engine/PatternLine.js';
import { GameRules } from '../engine/GameRules.js';

export class Renderer {
  constructor(gameApp, themeManager = null) {
    this.app = gameApp;
    this.themeManager = themeManager;
    this.gameContainer = document.getElementById('game-container');
    this.selectedSource = null;
    this.selectedColor = null;
    this.selectedFactoryIndex = null;
    this.legalTargetRows = [];
  }

  // ========== Create tile element ==========
  createTileElement(color, extraClasses = '') {
    const div = document.createElement('div');
    div.className = `tile tile--${color} ${extraClasses}`.trim();
    div.setAttribute('aria-label', `${color} tile`);
    div.dataset.color = color;
    return div;
  }

  // ========== SCORE BAR ==========
  renderScoreBar(state) {
    const bar = document.getElementById('score-bar');
    if (!bar) return;

    bar.innerHTML = '';

    const roundEl = document.createElement('span');
    roundEl.className = 'score-bar__round';
    roundEl.textContent = `R${state.round}`;
    bar.appendChild(roundEl);

    state.players.forEach((player, i) => {
      const playerEl = document.createElement('button');
      playerEl.className = 'score-bar__player';
      if (i === state.currentPlayerIndex) playerEl.classList.add('score-bar__player--current');

      const nameEl = document.createElement('span');
      nameEl.className = 'score-bar__name';
      nameEl.textContent = player.name;

      const scoreEl = document.createElement('span');
      scoreEl.className = 'score-bar__score';
      scoreEl.textContent = player.score;

      playerEl.appendChild(nameEl);
      playerEl.appendChild(scoreEl);
      playerEl.onclick = () => this.scrollToPlayer(i);
      bar.appendChild(playerEl);
    });

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'score-bar__settings';
    settingsBtn.setAttribute('aria-label', 'Settings');

    // Use image icon if available, fallback to emoji
    const settingsIconUrl = this.themeManager?.getUrl('UI', 'iconSettings');
    if (settingsIconUrl) {
      const img = document.createElement('img');
      img.className = 'score-bar__settings-img';
      img.src = settingsIconUrl;
      img.alt = 'Settings';
      img.width = 24;
      img.height = 24;
      settingsBtn.appendChild(img);
    } else {
      settingsBtn.textContent = '⚙️';
    }

    settingsBtn.onclick = () => this.app.toggleSettings();
    bar.appendChild(settingsBtn);
  }

  // ========== MARKET SECTION (Factories + Center) ==========
  renderMarket(state) {
    const section = document.getElementById('market-section');
    if (!section) return;

    const marketArea = section.querySelector('.market-area') || document.createElement('div');
    marketArea.className = 'market-area';
    marketArea.innerHTML = '';

    // Factory ring
    const ring = document.createElement('div');
    ring.className = 'factory-ring';

    const factoryCount = state.factories.length;
    const containerSize = marketArea.offsetWidth || 340;
    const radius = containerSize * 0.38;
    const cx = containerSize / 2;
    const cy = containerSize / 2;

    state.factories.forEach((factory, fi) => {
      const angle = (2 * Math.PI * fi / factoryCount) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      const factoryEl = document.createElement('div');
      factoryEl.className = `factory ${factory.length === 0 ? 'factory--empty' : ''}`;
      factoryEl.style.left = `${x}px`;
      factoryEl.style.top = `${y}px`;
      factoryEl.dataset.factoryIndex = fi;

      factory.forEach(color => {
        const tile = this.createTileElement(color);
        tile.dataset.source = 'factory';
        tile.dataset.factoryIndex = fi;
        tile.onclick = () => this.handleTileClick('factory', fi, color);

        // Highlight if this color is selected in this factory
        if (this.selectedSource === 'factory' && this.selectedFactoryIndex === fi && this.selectedColor === color) {
          tile.classList.add('tile--selected');
        }
        factoryEl.appendChild(tile);
      });

      ring.appendChild(factoryEl);
    });

    marketArea.appendChild(ring);

    // Center pool
    const centerPool = document.createElement('div');
    centerPool.className = `center-pool ${state.center.length > 0 ? 'center-pool--has-tiles' : ''}`;

    if (state.centerHasFirstPlayer) {
      const fpTile = document.createElement('div');
      fpTile.className = 'tile tile--first-player';
      fpTile.style.width = `calc(var(--tile-size) * 0.75)`;
      fpTile.style.height = `calc(var(--tile-size) * 0.75)`;
      centerPool.appendChild(fpTile);
    }

    state.center.forEach(color => {
      const tile = this.createTileElement(color);
      tile.style.width = `calc(var(--tile-size) * 0.75)`;
      tile.style.height = `calc(var(--tile-size) * 0.75)`;
      tile.dataset.source = 'center';
      tile.onclick = () => this.handleTileClick('center', null, color);

      if (this.selectedSource === 'center' && this.selectedColor === color) {
        tile.classList.add('tile--selected');
      }
      centerPool.appendChild(tile);
    });

    marketArea.appendChild(centerPool);

    if (!section.contains(marketArea)) {
      section.appendChild(marketArea);
    }

    // Turn indicator
    let turnInd = section.querySelector('.turn-indicator');
    if (!turnInd) {
      turnInd = document.createElement('div');
      turnInd.className = 'turn-indicator';
      section.appendChild(turnInd);
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (state.phase === 'factory-offer') {
      turnInd.innerHTML = `<span class="turn-indicator__name">${currentPlayer.name}</span>'s turn`;
    } else if (state.phase === 'wall-tiling') {
      turnInd.textContent = 'Scoring...';
    }
  }

  // ========== PLAYER BOARD ==========
  renderPlayerBoard(state, playerIndex = null) {
    if (playerIndex === null) {
      // Find the human player, or use currentPlayerIndex
      playerIndex = state.players.findIndex(p => p.type === 'human');
      if (playerIndex === -1) playerIndex = 0;
    }

    const section = document.getElementById('board-section');
    if (!section) return;
    section.innerHTML = '';

    const player = state.players[playerIndex];
    const board = document.createElement('div');
    board.className = 'player-board';

    // Header
    const header = document.createElement('div');
    header.className = 'board-header';
    header.innerHTML = `
      <span class="board-header__name">${player.name}</span>
      <span class="board-header__score" aria-label="Score: ${player.score}">${player.score}</span>
    `;
    board.appendChild(header);

    // Board grid: pattern lines + wall
    const grid = document.createElement('div');
    grid.className = 'board-grid';

    // Pattern lines
    const patternLinesEl = document.createElement('div');
    patternLinesEl.className = 'pattern-lines';

    for (let row = 0; row < 5; row++) {
      const lineEl = document.createElement('div');
      lineEl.className = 'pattern-line';
      lineEl.dataset.row = row;

      const maxSize = row + 1;
      const line = player.patternLines[row];

      // Is this row a legal target?
      const isLegal = this.legalTargetRows.includes(row) && playerIndex === state.currentPlayerIndex;
      if (isLegal) lineEl.classList.add('pattern-line--legal');

      // Render empty slots + filled tiles (right-aligned)
      const emptyCount = maxSize - line.length;
      for (let s = 0; s < emptyCount; s++) {
        const slot = document.createElement('div');
        slot.className = `tile-slot ${isLegal ? 'tile-slot--legal' : ''}`;
        lineEl.appendChild(slot);
      }
      for (let s = 0; s < line.length; s++) {
        lineEl.appendChild(this.createTileElement(line[s]));
      }

      if (isLegal) {
        lineEl.onclick = () => this.handleTargetClick(row);
      }

      patternLinesEl.appendChild(lineEl);
    }
    grid.appendChild(patternLinesEl);

    // Arrows
    const arrows = document.createElement('div');
    arrows.className = 'board-arrow';
    for (let i = 0; i < 5; i++) {
      const arrow = document.createElement('span');
      arrow.className = 'board-arrow__icon';
      arrow.textContent = '→';
      arrows.appendChild(arrow);
    }
    grid.appendChild(arrows);

    // Wall
    const wallGrid = document.createElement('div');
    wallGrid.className = 'wall-grid';

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.className = 'wall-cell';

        if (player.wall[r][c]) {
          // Placed tile
          const tile = this.createTileElement(player.wall[r][c], 'tile--ghost tile--placed');
          cell.appendChild(tile);
        } else {
          // Ghost tile showing where colors go
          const ghostColor = CLASSIC.WALL_PATTERN[r][c];
          const ghost = this.createTileElement(ghostColor, 'tile--ghost');
          cell.appendChild(ghost);
        }

        wallGrid.appendChild(cell);
      }
    }
    grid.appendChild(wallGrid);
    board.appendChild(grid);

    // Floor line
    const floorEl = document.createElement('div');
    floorEl.className = `floor-line ${this.legalTargetRows.includes('floor') ? 'floor-line--legal' : ''}`;

    const floorLabel = document.createElement('span');
    floorLabel.className = 'floor-line__label';
    floorLabel.textContent = 'Floor';
    floorEl.appendChild(floorLabel);

    for (let i = 0; i < 7; i++) {
      const slot = document.createElement('div');
      slot.className = 'floor-slot';

      if (i < player.floorLine.length) {
        const tile = player.floorLine[i] === 'first-player'
          ? (() => { const t = document.createElement('div'); t.className = 'tile tile--first-player floor-slot__tile'; return t; })()
          : this.createTileElement(player.floorLine[i]);
        if (tile.style) tile.style.width = tile.style.height = '';
        tile.classList.add('floor-slot__tile');
        slot.appendChild(tile);
      } else {
        const empty = document.createElement('div');
        empty.className = 'floor-slot__tile';
        slot.appendChild(empty);
      }

      const penalty = document.createElement('span');
      penalty.className = 'floor-slot__penalty';
      penalty.textContent = CLASSIC.FLOOR_PENALTIES[i];
      slot.appendChild(penalty);

      floorEl.appendChild(slot);
    }

    if (this.legalTargetRows.includes('floor')) {
      floorEl.onclick = () => this.handleTargetClick('floor');
    }

    board.appendChild(floorEl);
    section.appendChild(board);
  }

  // ========== OPPONENT BOARDS ==========
  renderOpponentBoards(state) {
    const section = document.getElementById('opponents-section');
    if (!section) return;
    section.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'opponents-label';
    label.textContent = 'Other Players';
    section.appendChild(label);

    const container = document.createElement('div');
    container.className = 'opponent-boards';

    const humanIdx = state.players.findIndex(p => p.type === 'human');
    const mainPlayerIdx = humanIdx !== -1 ? humanIdx : 0;

    state.players.forEach((player, i) => {
      if (i === mainPlayerIdx) return;

      const board = document.createElement('div');
      board.className = 'opponent-board';

      const header = document.createElement('div');
      header.className = 'opponent-board__header';
      header.innerHTML = `
        <span class="opponent-board__name">${player.name}${i === state.currentPlayerIndex ? ' ★' : ''}</span>
        <span class="opponent-board__score">${player.score}</span>
      `;
      board.appendChild(header);

      // Mini wall — use tile classes for image support
      const miniWall = document.createElement('div');
      miniWall.className = 'mini-wall';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = document.createElement('div');
          cell.className = 'mini-wall__cell';
          if (player.wall[r][c]) {
            cell.classList.add('mini-wall__cell--filled');
            cell.classList.add(`tile--${player.wall[r][c]}`);
            cell.style.background = `var(--tile-${player.wall[r][c]})`;
          }
          miniWall.appendChild(cell);
        }
      }
      board.appendChild(miniWall);

      // Mini floor
      const miniFloor = document.createElement('div');
      miniFloor.className = 'mini-floor';
      for (let j = 0; j < 7; j++) {
        const slot = document.createElement('div');
        slot.className = `mini-floor__slot ${j < player.floorLine.length ? 'mini-floor__slot--filled' : ''}`;
        miniFloor.appendChild(slot);
      }
      board.appendChild(miniFloor);

      container.appendChild(board);
    });

    section.appendChild(container);
  }

  // ========== INTERACTION HANDLERS ==========
  handleTileClick(source, factoryIndex, color) {
    if (this.app.state.phase !== 'factory-offer') return;

    const currentPlayer = this.app.state.players[this.app.state.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;

    // If clicking same selection, deselect
    if (this.selectedSource === source &&
        this.selectedColor === color &&
        this.selectedFactoryIndex === factoryIndex) {
      this.clearSelection();
      this.app.render();
      return;
    }

    this.selectedSource = source;
    this.selectedColor = color;
    this.selectedFactoryIndex = factoryIndex;

    // Compute legal target rows
    this.legalTargetRows = [];
    for (let row = 0; row < 5; row++) {
      if (PatternLine.canPlace(currentPlayer.patternLines[row], color, row, currentPlayer.wall)) {
        this.legalTargetRows.push(row);
      }
    }
    this.legalTargetRows.push('floor'); // Always legal

    this.app.playSound('tilePick');
    this.app.render();
  }

  handleTargetClick(targetRow) {
    if (!this.selectedColor) return;

    const action = {
      source: this.selectedSource,
      factoryIndex: this.selectedFactoryIndex,
      color: this.selectedColor,
      targetRow,
    };

    this.clearSelection();
    this.app.playSound('tilePlace');
    this.app.handlePlayerAction(action);
  }

  clearSelection() {
    this.selectedSource = null;
    this.selectedColor = null;
    this.selectedFactoryIndex = null;
    this.legalTargetRows = [];
  }

  scrollToPlayer(playerIndex) {
    const section = document.getElementById('board-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  // ========== GAME OVER SCREEN ==========
  renderGameOver(state, result) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.id = 'game-over-overlay';

    // Crown: use image if available, fallback to emoji
    const crownUrl = this.themeManager?.getUrl('UI', 'iconCrown');
    if (crownUrl) {
      const crown = document.createElement('img');
      crown.className = 'game-over__crown-img';
      crown.src = crownUrl;
      crown.alt = 'Crown';
      overlay.appendChild(crown);
    } else {
      const crown = document.createElement('div');
      crown.className = 'game-over__crown';
      crown.textContent = '👑';
      overlay.appendChild(crown);
    }

    const title = document.createElement('h2');
    title.className = 'game-over__title';
    title.textContent = result.isTie ? 'Shared Victory!' : 'Game Over!';
    overlay.appendChild(title);

    const winnerText = document.createElement('p');
    winnerText.className = 'game-over__winner';
    const winnerNames = result.winners.map(i => state.players[i].name).join(' & ');
    winnerText.textContent = result.isTie ? `${winnerNames} win!` : `${winnerNames} wins!`;
    overlay.appendChild(winnerText);

    const scoresDiv = document.createElement('div');
    scoresDiv.className = 'game-over__scores';

    result.rankings.forEach((r, rank) => {
      const playerDiv = document.createElement('div');
      playerDiv.className = `game-over__player ${result.winners.includes(r.index) ? 'game-over__player--winner' : ''}`;

      playerDiv.innerHTML = `
        <span class="game-over__rank">${rank + 1}</span>
        <span class="game-over__player-name">${r.name}</span>
        <div>
          <span class="game-over__player-score">${r.score}</span>
          ${state.players[r.index].endGameBonus ? `<div class="game-over__bonus-detail">+${state.players[r.index].endGameBonus} bonus</div>` : ''}
        </div>
      `;
      scoresDiv.appendChild(playerDiv);
    });
    overlay.appendChild(scoresDiv);

    const actions = document.createElement('div');
    actions.className = 'game-over__actions';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'btn btn-gold';
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.onclick = () => this.app.playAgain();
    actions.appendChild(playAgainBtn);

    const lobbyBtn = document.createElement('button');
    lobbyBtn.className = 'btn btn-secondary';
    lobbyBtn.textContent = 'Lobby';
    lobbyBtn.onclick = () => this.app.goToLobby();
    actions.appendChild(lobbyBtn);

    overlay.appendChild(actions);
    document.body.appendChild(overlay);
  }

  removeGameOver() {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.remove();
  }

  // ========== ROUND TRANSITION ==========
  showRoundTransition(round) {
    const overlay = document.createElement('div');
    overlay.className = 'round-overlay';
    overlay.id = 'round-overlay';

    const banner = document.createElement('div');
    banner.className = 'round-banner';
    banner.innerHTML = `
      <div class="round-overlay__text">Round ${round}</div>
      <div class="round-overlay__sub">Get ready!</div>
    `;
    overlay.appendChild(banner);
    document.body.appendChild(overlay);

    setTimeout(() => {
      const el = document.getElementById('round-overlay');
      if (el) el.remove();
    }, 1500);
  }

  // ========== FULL RENDER ==========
  render(state) {
    this.renderScoreBar(state);
    this.renderMarket(state);
    this.renderPlayerBoard(state);
    this.renderOpponentBoards(state);
  }
}
