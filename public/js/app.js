/**
 * Scrum Poker — Main Application Logic
 */

const App = (() => {
  // --- State ---
  let state = {
    mySocketId: null,
    myName: '',
    roomCode: '',
    scale: 'fibonacci',
    selectedCard: null,
    isHost: false,
    revealed: false,
    players: [],
    stats: null
  };

  // --- Initialization ---
  function init() {
    SocketClient.connect();
    bindSocketEvents();
    bindUIEvents();
    UI.showScreen('screen-home');
  }

  // --- Socket Event Handlers ---
  function bindSocketEvents() {
    SocketClient.on('onConnect', (id) => {
      state.mySocketId = id;
    });

    SocketClient.on('onRoomCreated', (data) => {
      state.roomCode = data.code;
      state.isHost = true;
      UI.showScreen('screen-room');
      UI.showToast(`Room ${data.code} created!`, 'success');
    });

    SocketClient.on('onRoomJoined', (data) => {
      state.roomCode = data.code;
      state.scale = data.scale;
      state.isHost = data.hostId === SocketClient.getSocketId();
      state.revealed = data.revealed;
      updateRoomUI(data);
      UI.showScreen('screen-room');
      UI.showToast(`Joined room ${data.code}`, 'success');
    });

    SocketClient.on('onRoomUpdate', (data) => {
      state.players = data.players;
      state.revealed = data.revealed;
      state.isHost = data.hostId === SocketClient.getSocketId();
      if (!data.revealed) {
        state.stats = null;
      }
      updateRoomUI(data);
    });

    SocketClient.on('onVotesRevealed', (data) => {
      state.revealed = true;
      state.players = data.players;
      state.stats = data.stats;
      state.isHost = data.hostId === SocketClient.getSocketId();
      updateRoomUI(data);
      showResults(data);
    });

    SocketClient.on('onHostChanged', (data) => {
      state.isHost = data.hostId === SocketClient.getSocketId();
      UI.showToast(`${data.hostName} is now the host`, 'info');
    });

    SocketClient.on('onError', (data) => {
      UI.showToast(data.message, 'error');
    });

    SocketClient.on('onDisconnect', () => {
      // Connection status bar handles visibility
    });

    SocketClient.on('onReconnect', () => {
      // Re-join room if we were in one
      if (state.roomCode && state.myName) {
        SocketClient.joinRoom(state.roomCode, state.myName);
      }
    });
  }

  // --- UI Event Bindings ---
  function bindUIEvents() {
    // Home screen buttons
    document.getElementById('btn-create').addEventListener('click', () => {
      UI.showScreen('screen-create');
    });

    document.getElementById('btn-join').addEventListener('click', () => {
      UI.showScreen('screen-join');
    });

    // Back buttons
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-back');
        UI.showScreen(target);
      });
    });

    // Scale selector
    document.getElementById('scale-selector').addEventListener('click', (e) => {
      const option = e.target.closest('.scale-option');
      if (!option) return;
      state.scale = option.dataset.scale;
      renderScaleSelector();
    });

    // Create room
    document.getElementById('btn-create-room').addEventListener('click', () => {
      const nameInput = document.getElementById('create-name');
      const name = nameInput.value.trim();
      if (!name) {
        UI.showToast('Please enter your name', 'error');
        nameInput.focus();
        return;
      }
      state.myName = name;
      SocketClient.createRoom(name, state.scale);
    });

    // Join room
    document.getElementById('btn-join-room').addEventListener('click', () => {
      const nameInput = document.getElementById('join-name');
      const codeInput = document.getElementById('join-code');
      const name = nameInput.value.trim();
      const code = codeInput.value.trim().toUpperCase();
      
      if (!name) {
        UI.showToast('Please enter your name', 'error');
        nameInput.focus();
        return;
      }
      if (!code || code.length < 4) {
        UI.showToast('Please enter a valid room code', 'error');
        codeInput.focus();
        return;
      }
      state.myName = name;
      SocketClient.joinRoom(code, name);
    });

    // Room code copy
    document.getElementById('room-code-display').addEventListener('click', () => {
      UI.copyToClipboard(state.roomCode);
    });

    // Card grid clicks
    document.getElementById('cards-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card || state.revealed) return;
      
      const value = card.dataset.value;
      
      if (state.selectedCard === value) {
        // Deselect
        state.selectedCard = null;
      } else {
        state.selectedCard = value;
        SocketClient.submitVote(state.roomCode, value);
      }
      
      renderCards();
    });

    // Reveal button
    document.getElementById('btn-reveal').addEventListener('click', () => {
      SocketClient.revealVotes(state.roomCode);
    });

    // New round button
    document.getElementById('btn-new-round').addEventListener('click', () => {
      const topicInput = document.getElementById('topic-input');
      const topic = topicInput ? topicInput.value.trim() : '';
      state.selectedCard = null;
      state.revealed = false;
      state.stats = null;
      SocketClient.newRound(state.roomCode, topic);
    });

    // Leave room
    document.getElementById('btn-leave').addEventListener('click', () => {
      state.roomCode = '';
      state.selectedCard = null;
      state.revealed = false;
      state.players = [];
      state.stats = null;
      state.isHost = false;
      UI.showScreen('screen-home');
      // Socket disconnect/reconnect will handle cleanup
      location.reload();
    });

    // Auto-uppercase room code input
    const codeInput = document.getElementById('join-code');
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    });

    // Enter key on inputs
    document.getElementById('create-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-create-room').click();
    });

    document.getElementById('join-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('join-code').focus();
    });

    document.getElementById('join-code').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-join-room').click();
    });

    // Render initial scale selector
    renderScaleSelector();
  }

  // --- Render Functions ---

  function renderScaleSelector() {
    const container = document.getElementById('scale-selector');
    const keys = getScaleKeys();
    container.innerHTML = keys.map(key => {
      const scale = getScale(key);
      return UI.renderScaleOption(key, scale, state.scale === key);
    }).join('');
  }

  function renderCards() {
    const grid = document.getElementById('cards-grid');
    const scale = getScale(state.scale);
    grid.className = 'cards-grid' + (state.revealed ? ' revealed' : '');
    grid.innerHTML = scale.values.map(value => {
      return UI.renderCard(value, state.selectedCard === value);
    }).join('');
  }

  function renderPlayers(players, hostId) {
    const container = document.getElementById('players-grid');
    if (!players || players.length === 0) {
      container.innerHTML = UI.renderWaitingIndicator('Waiting for players');
      return;
    }
    container.innerHTML = players.map(p => UI.renderPlayerChip(p, hostId)).join('');
    
    // Update player count
    const countEl = document.getElementById('player-count');
    if (countEl) countEl.textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;
  }

  function updateRoomUI(data) {
    // Room code
    const codeEl = document.getElementById('room-code-value');
    if (codeEl) codeEl.textContent = data.code;
    
    // Topic
    const topicText = document.getElementById('topic-text');
    if (topicText) {
      if (data.topic) {
        topicText.textContent = data.topic;
        topicText.classList.remove('topic-bar__text--empty');
      } else {
        topicText.textContent = 'No topic set';
        topicText.classList.add('topic-bar__text--empty');
      }
    }
    
    // Players
    renderPlayers(data.players, data.hostId);
    
    // Cards
    if (!state.revealed) {
      renderCards();
      // Show voting results area or hide it
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.innerHTML = '';
    }
    
    // Host actions
    const hostActions = document.getElementById('host-actions');
    if (hostActions) {
      hostActions.style.display = state.isHost ? 'flex' : 'none';
    }
    
    // Update reveal button state
    const revealBtn = document.getElementById('btn-reveal');
    if (revealBtn) {
      const votedCount = data.players ? data.players.filter(p => p.hasVoted).length : 0;
      const totalCount = data.players ? data.players.length : 0;
      revealBtn.textContent = `Reveal Votes (${votedCount}/${totalCount})`;
      revealBtn.disabled = votedCount === 0;
    }
  }

  function showResults(data) {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    let html = `
      <div class="results-section">
        <div class="results-header">
          <div class="results-header__title">🎉 Results</div>
          ${data.topic ? `<div class="results-header__subtitle">${UI.escapeHtml(data.topic)}</div>` : ''}
        </div>
        ${UI.renderStats(data.stats)}
        <div class="vote-results">
          ${data.players.map((p, i) => UI.renderVoteResultRow(p, i)).join('')}
        </div>
      </div>
    `;

    resultsSection.innerHTML = html;
  }

  return { init };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', App.init);
