const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// In-memory room storage
const rooms = new Map();

// Characters for room code generation (no I or O to avoid ambiguity)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 4;

// --- Helper Functions ---

function generateRoomCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
  } while (rooms.has(code));
  return code;
}

function serializeRoom(room) {
  return {
    code: room.code,
    scale: room.scale,
    topic: room.topic,
    revealed: room.revealed,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      hasVoted: p.hasVoted,
      vote: room.revealed ? p.vote : null,
    })),
  };
}

function deduplicateName(room, desiredName) {
  const existingNames = new Set(
    Array.from(room.players.values()).map(p => p.name)
  );
  if (!existingNames.has(desiredName)) return desiredName;

  let counter = 2;
  while (existingNames.has(`${desiredName} ${counter}`)) {
    counter++;
  }
  return `${desiredName} ${counter}`;
}

function calculateStats(room) {
  const votes = Array.from(room.players.values())
    .filter(p => p.vote !== null && p.vote !== undefined)
    .map(p => p.vote);

  if (votes.length === 0) return null;

  // Count occurrences for most-common calculation
  const counts = {};
  for (const v of votes) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const mostCommonValue = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const mostCommon = mostCommonValue[0];
  const mostCommonCount = mostCommonValue[1];
  const agreement = Math.round((mostCommonCount / votes.length) * 100);

  if (room.scale === 'tshirt') {
    return { type: 'tshirt', mostCommon, agreement };
  }

  // Numeric scales (fibonacci, modified)
  const numericVotes = votes.map(Number).filter(n => !isNaN(n));
  if (numericVotes.length === 0) {
    return { mostCommon, agreement };
  }

  const sum = numericVotes.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / numericVotes.length) * 10) / 10;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);

  return { type: 'numeric', average, min, max, mostCommon, agreement };
}

// --- Socket.IO Events ---

io.on('connection', (socket) => {
  console.log(`[Connect] Socket connected: ${socket.id}`);

  // --- create-room ---
  socket.on('create-room', ({ playerName, scale }) => {
    const code = generateRoomCode();
    const room = {
      code,
      hostId: socket.id,
      scale: scale || 'fibonacci',
      players: new Map(),
      revealed: false,
      topic: '',
      lastActivity: Date.now(),
    };

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      vote: null,
      hasVoted: false,
    });

    rooms.set(code, room);
    socket.join(code);

    console.log(`[Room Created] Code: ${code}, Host: ${playerName} (${socket.id})`);

    socket.emit('room-created', { code });
    io.to(code).emit('room-update', serializeRoom(room));
  });

  // --- join-room ---
  socket.on('join-room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error', { message: 'Room not found. Please check the code and try again.' });
      return;
    }

    const safeName = deduplicateName(room, playerName);

    room.players.set(socket.id, {
      id: socket.id,
      name: safeName,
      vote: null,
      hasVoted: false,
    });
    room.lastActivity = Date.now();

    socket.join(code);

    console.log(`[Player Joined] ${safeName} (${socket.id}) joined room ${code}`);

    socket.emit('room-joined', serializeRoom(room));
    io.to(code).emit('room-update', serializeRoom(room));
  });

  // --- submit-vote ---
  socket.on('submit-vote', ({ roomCode, vote }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.vote = vote;
    player.hasVoted = true;
    room.lastActivity = Date.now();

    io.to(roomCode).emit('room-update', serializeRoom(room));
  });

  // --- reveal-votes ---
  socket.on('reveal-votes', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Only the host can reveal votes
    if (room.hostId !== socket.id) return;

    room.revealed = true;
    room.lastActivity = Date.now();

    const stats = calculateStats(room);
    const players = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      hasVoted: p.hasVoted,
      vote: p.vote,
    }));

    io.to(roomCode).emit('votes-revealed', {
      players,
      stats,
      hostId: room.hostId,
      topic: room.topic,
      code: roomCode
    });
  });

  // --- new-round ---
  socket.on('new-round', ({ roomCode, topic }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Only the host can start a new round
    if (room.hostId !== socket.id) return;

    room.revealed = false;
    room.topic = topic || '';
    room.lastActivity = Date.now();

    for (const player of room.players.values()) {
      player.vote = null;
      player.hasVoted = false;
    }

    io.to(roomCode).emit('room-update', serializeRoom(room));
  });

  // --- disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Disconnect] Socket disconnected: ${socket.id}`);

    for (const [code, room] of rooms) {
      if (!room.players.has(socket.id)) continue;

      const wasHost = room.hostId === socket.id;
      room.players.delete(socket.id);

      // If room is now empty, delete it
      if (room.players.size === 0) {
        rooms.delete(code);
        console.log(`[Room Deleted] Room ${code} deleted (empty)`);
        continue;
      }

      // Transfer host if the disconnected player was the host
      if (wasHost) {
        const nextHost = room.players.values().next().value;
        room.hostId = nextHost.id;
        console.log(`[Host Transferred] Room ${code}: new host is ${nextHost.name} (${nextHost.id})`);
        io.to(code).emit('host-changed', { hostId: nextHost.id, hostName: nextHost.name });
      }

      io.to(code).emit('room-update', serializeRoom(room));
    }
  });
});

// --- Room Cleanup (every 10 minutes, remove rooms inactive for 2+ hours) ---
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;      // 2 hours

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      rooms.delete(code);
      cleaned++;
      console.log(`[Cleanup] Room ${code} deleted (inactive for 2+ hours)`);
    }
  }
  if (cleaned > 0) {
    console.log(`[Cleanup] Removed ${cleaned} inactive room(s). Active rooms: ${rooms.size}`);
  }
}, CLEANUP_INTERVAL_MS);

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Scrum Poker server running on http://localhost:${PORT}`);
});
