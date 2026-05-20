/**
 * Socket.IO Client Wrapper for Scrum Poker
 */

const SocketClient = (() => {
  let socket = null;
  let callbacks = {};

  function connect() {
    socket = io({
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection status
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      const statusEl = document.getElementById('connection-status');
      if (statusEl) statusEl.classList.remove('visible');
      if (callbacks.onConnect) callbacks.onConnect(socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      const statusEl = document.getElementById('connection-status');
      if (statusEl) statusEl.classList.add('visible');
      if (callbacks.onDisconnect) callbacks.onDisconnect(reason);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      if (callbacks.onReconnect) callbacks.onReconnect(attempt);
    });

    // Game events
    socket.on('room-created', (data) => {
      console.log('[Socket] Room created:', data.code);
      if (callbacks.onRoomCreated) callbacks.onRoomCreated(data);
    });

    socket.on('room-joined', (data) => {
      console.log('[Socket] Room joined:', data.code);
      if (callbacks.onRoomJoined) callbacks.onRoomJoined(data);
    });

    socket.on('room-update', (data) => {
      console.log('[Socket] Room update');
      if (callbacks.onRoomUpdate) callbacks.onRoomUpdate(data);
    });

    socket.on('votes-revealed', (data) => {
      console.log('[Socket] Votes revealed');
      if (callbacks.onVotesRevealed) callbacks.onVotesRevealed(data);
    });

    socket.on('host-changed', (data) => {
      console.log('[Socket] Host changed to:', data.hostName);
      if (callbacks.onHostChanged) callbacks.onHostChanged(data);
    });

    socket.on('error', (data) => {
      console.error('[Socket] Error:', data.message);
      if (callbacks.onError) callbacks.onError(data);
    });

    return socket;
  }

  function on(event, callback) {
    callbacks[event] = callback;
  }

  function getSocketId() {
    return socket ? socket.id : null;
  }

  // --- Emitters ---
  function createRoom(playerName, scale) {
    socket.emit('create-room', { playerName, scale });
  }

  function joinRoom(roomCode, playerName) {
    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), playerName });
  }

  function submitVote(roomCode, vote) {
    socket.emit('submit-vote', { roomCode, vote });
  }

  function revealVotes(roomCode) {
    socket.emit('reveal-votes', { roomCode });
  }

  function newRound(roomCode, topic) {
    socket.emit('new-round', { roomCode, topic: topic || '' });
  }

  return {
    connect,
    on,
    getSocketId,
    createRoom,
    joinRoom,
    submitVote,
    revealVotes,
    newRound
  };
})();
