// Klassespill Server
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  rooms,
  socketToRoom,
  createRoom,
  createLobby,
  selectGame,
  returnToLobby,
  submitLobbyScore,
  joinRoom,
  removePlayer,
  kickPlayer,
  startGame,
  endGame,
  handleGameAction,
  handlePlayerAction,
  cleanupOldRooms
} from './gameState.js';
import { BotManager } from './botManager.js';

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      // Allow all origins in list, or all if wildcard
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Also allow any *.vercel.app or *.netlify.app for staging
      if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      console.warn('CORS: Unknown origin:', origin);
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Stabilitet for Render cold starts - økt for bedre stabilitet
  pingTimeout: 120000,
  pingInterval: 25000,
  // Bruk websocket primært, med polling som fallback
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  // Øk max buffer size for større payloads (tegninger etc)
  maxHttpBufferSize: 1e7
});

const PORT = process.env.PORT || 3003;

// Enable CORS for all Express routes
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Klassespill Server',
    rooms: Object.keys(rooms).length
  });
});

// Minimal ping endpoint for cron jobs
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Sanitize room data for client - avoid circular references and non-serializable objects
function sanitizeRoom(room) {
  if (!room) return null;

  // Sanitize gameData to handle Set objects and Date objects
  let sanitizedGameData = null;
  if (room.gameData) {
    try {
      sanitizedGameData = {};
      for (const [key, value] of Object.entries(room.gameData)) {
        // Skip functions and undefined values
        if (typeof value === 'function' || value === undefined) continue;

        // Convert Set to array
        if (value instanceof Set) {
          sanitizedGameData[key + 'Array'] = Array.from(value);
        }
        // Convert Date to ISO string
        else if (value instanceof Date) {
          sanitizedGameData[key] = value.toISOString();
        }
        // Handle nested objects (like currentPlayer)
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Simple shallow copy for objects
          sanitizedGameData[key] = { ...value };
          // Remove any nested Date objects
          if (sanitizedGameData[key].startedAt instanceof Date) {
            sanitizedGameData[key].startedAt = sanitizedGameData[key].startedAt.toISOString();
          }
          if (sanitizedGameData[key].timestamp instanceof Date) {
            sanitizedGameData[key].timestamp = sanitizedGameData[key].timestamp.toISOString();
          }
        }
        // Handle arrays (like wordChain, buzzerQueue)
        else if (Array.isArray(value)) {
          sanitizedGameData[key] = value.map(item => {
            if (item && typeof item === 'object') {
              const sanitizedItem = { ...item };
              if (sanitizedItem.timestamp instanceof Date) {
                sanitizedItem.timestamp = sanitizedItem.timestamp.toISOString();
              }
              return sanitizedItem;
            }
            return item;
          });
        }
        // Primitive values
        else {
          sanitizedGameData[key] = value;
        }
      }
    } catch (err) {
      console.error('Error sanitizing gameData:', err);
      sanitizedGameData = null;
    }
  }

  return {
    code: room.code,
    game: room.game,
    gameState: room.gameState,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      isConnected: p.isConnected,
      isEliminated: p.isEliminated,
      wordsSubmitted: p.wordsSubmitted || 0,
      canBuzz: p.canBuzz !== false
    })),
    gameData: sanitizedGameData
  };
}

// Bot manager for demo mode
const botManager = new BotManager(io, rooms, handlePlayerAction);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // ==================
  // HOST EVENTS
  // ==================

  socket.on('host:create-room', ({ game }) => {
    const roomCode = createRoom(socket.id, game);
    if (roomCode) {
      socket.join(roomCode);
      const room = rooms[roomCode];
      socket.emit('room:created', { roomCode, game: room.game, gameState: room.gameState });
      console.log(`Host ${socket.id} created room: ${roomCode} for game: ${game}`);
    }
  });

  // Ny event: Opprett lobby uten spill
  socket.on('host:create-lobby', () => {
    const roomCode = createLobby(socket.id);
    if (roomCode) {
      socket.join(roomCode);
      const room = rooms[roomCode];
      socket.emit('lobby:created', {
        roomCode,
        gameState: room.gameState,
        lobbyData: room.lobbyData
      });
      console.log(`Host ${socket.id} created lobby: ${roomCode}`);
    }
  });

  // Ny event: Velg spill for lobby
  socket.on('host:select-game', ({ game }) => {
    const roomCode = socketToRoom.get(socket.id);
    const room = selectGame(roomCode, game);
    if (room) {
      io.to(roomCode).emit('lobby:game-selected', {
        game,
        gameState: room.gameState,
        room: sanitizeRoom(room)
      });
      console.log(`Game selected in room ${roomCode}: ${game}`);
    }
  });

  // Ny event: Returner til lobby
  socket.on('host:return-to-lobby', () => {
    const roomCode = socketToRoom.get(socket.id);
    const room = returnToLobby(roomCode);
    if (room) {
      io.to(roomCode).emit('lobby:returned', {
        room: sanitizeRoom(room),
        lobbyData: room.lobbyData
      });
      console.log(`Room ${roomCode} returned to lobby`);
    }
  });

  socket.on('host:start-game', (config = {}) => {
    const roomCode = socketToRoom.get(socket.id);
    const room = startGame(roomCode, config);
    if (room) {
      io.to(roomCode).emit('game:started', {
        room: sanitizeRoom(room),
        gameData: room.gameData
      });
      console.log(`Game started in room ${roomCode}`);
      // Trigger bot responses for game start
      botManager.onGameEvent(roomCode, 'game:started', room.gameData);
    }
  });

  socket.on('host:end-game', ({ returnToLobby: goToLobby = true } = {}) => {
    try {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) {
        console.warn('host:end-game called but no room found for socket');
        return;
      }
      // Alltid returner til lobby - behold spillere i rommet
      const room = endGame(roomCode, true);
      if (room) {
        // Sikre at lobbyData alltid er definert
        if (!room.lobbyData) {
          room.lobbyData = { totalScore: 0, playerScores: {}, leaderboard: [] };
        }
        io.to(roomCode).emit('game:ended', {
          room: sanitizeRoom(room),
          lobbyData: room.lobbyData
        });
        console.log(`Game ended in room ${roomCode}, players returned to lobby`);
      }
    } catch (error) {
      console.error('Error in host:end-game:', error);
    }
  });

  socket.on('host:kick-player', ({ playerId }) => {
    const roomCode = socketToRoom.get(socket.id);
    const room = kickPlayer(roomCode, playerId);
    if (room) {
      io.to(playerId).emit('room:kicked');
      io.to(roomCode).emit('room:player-left', { room: sanitizeRoom(room), playerId });
      console.log(`Player ${playerId} kicked from room ${roomCode}`);
    }
  });

  // ==================
  // DEMO MODE EVENTS
  // ==================

  socket.on('host:enable-demo', ({ count = 5 } = {}) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const result = botManager.enableDemo(roomCode, count);
    if (result) {
      const room = rooms[roomCode];
      io.to(roomCode).emit('room:player-joined', {
        room: sanitizeRoom(room)
      });
      socket.emit('demo:enabled', { botIds: result.botIds });
      console.log(`Demo enabled in room ${roomCode} with ${count} bots`);
    }
  });

  socket.on('host:disable-demo', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = botManager.disableDemo(roomCode);
    if (room) {
      io.to(roomCode).emit('room:player-left', {
        room: sanitizeRoom(room)
      });
      socket.emit('demo:disabled');
      console.log(`Demo disabled in room ${roomCode}`);
    }
  });

  socket.on('host:game-action', ({ action, data }) => {
    try {
      const roomCode = socketToRoom.get(socket.id);
      const result = handleGameAction(roomCode, action, data);
      if (result) {
        if (result.broadcast) {
          io.to(roomCode).emit(result.event, result.data);
          // Trigger bot responses for broadcast events
          botManager.onGameEvent(roomCode, result.event, result.data);
        }
        if (result.toPlayer) {
          io.to(result.toPlayer).emit(result.playerEvent, result.playerData);
        }
      }
    } catch (err) {
      console.error('Error in host:game-action:', err);
    }
  });

  // ==================
  // PLAYER EVENTS
  // ==================

  socket.on('player:join-room', ({ roomCode, playerName }) => {
    const room = joinRoom(roomCode, socket.id, playerName);
    if (room) {
      socket.join(room.code);
      // Use the actual name from the room (may be sanitized or have a number appended)
      const actualPlayer = room.players.find(p => p.id === socket.id);
      const actualName = actualPlayer?.name || playerName;
      io.to(room.code).emit('room:player-joined', {
        playerId: socket.id,
        playerName: actualName,
        room: sanitizeRoom(room)
      });
      console.log(`Player ${actualName} (${socket.id}) joined room ${room.code}`);

      // If game is already in progress, send current state
      if (room.gameState === 'PLAYING') {
        socket.emit('game:state-sync', { room: sanitizeRoom(room) });
      }
    } else {
      socket.emit('room:join-error', { message: 'Kunne ikke bli med i rommet. Sjekk at romkoden er riktig.' });
    }
  });

  socket.on('player:leave-room', () => {
    const roomCode = socketToRoom.get(socket.id);
    const result = removePlayer(socket.id);
    if (result && !result.hostLeft && roomCode) {
      socket.leave(roomCode);
      io.to(roomCode).emit('room:player-left', {
        room: sanitizeRoom(result.room),
        playerId: socket.id
      });
      console.log(`Player ${socket.id} left room ${roomCode} voluntarily`);
    }
  });

  socket.on('player:game-action', ({ action, data }) => {
    try {
      const roomCode = socketToRoom.get(socket.id);
      const result = handlePlayerAction(roomCode, socket.id, action, data);
      if (result) {
        if (result.broadcast) {
          io.to(roomCode).emit(result.event, result.data);
        }
        if (result.toHost) {
          const room = rooms[roomCode];
          if (room) {
            io.to(room.hostId).emit(result.hostEvent, result.hostData);
          }
        }
        if (result.toPlayer) {
          socket.emit(result.playerEvent, result.playerData);
        }
      }
    } catch (err) {
      console.error('Error in player:game-action:', err);
    }
  });

  // Lobby minispill score
  socket.on('lobby:submit-score', ({ score }) => {
    const roomCode = socketToRoom.get(socket.id);
    const result = submitLobbyScore(roomCode, socket.id, score);
    if (result) {
      // Send oppdatering til alle i rommet
      io.to(roomCode).emit('lobby:score-update', {
        playerId: socket.id,
        playerScore: result.playerScore,
        totalScore: result.totalScore,
        leaderboard: result.leaderboard
      });
    }
  });

  socket.on('lobby:get-scores', () => {
    const roomCode = socketToRoom.get(socket.id);
    const room = rooms[roomCode];
    if (room && room.lobbyData) {
      socket.emit('lobby:scores', {
        totalScore: room.lobbyData.totalScore,
        leaderboard: room.lobbyData.leaderboard,
        playerScores: room.lobbyData.playerScores
      });
    }
  });

  // ==================
  // DISCONNECT
  // ==================

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomCode = socketToRoom.get(socket.id);
    const result = removePlayer(socket.id);

    if (result) {
      if (result.hostLeft) {
        // Clean up bots when host disconnects
        if (roomCode) botManager.cleanup(roomCode);
        io.to(result.room.code).emit('room:closed');
        console.log(`Host ${socket.id} disconnected, room ${result.room.code} closed`);
      } else {
        io.to(result.room.code).emit('room:player-left', {
          room: sanitizeRoom(result.room),
          playerId: socket.id
        });
        console.log(`Player ${socket.id} left room ${result.room.code}`);
      }
    }
  });
});

// Cleanup old rooms every 30 minutes
setInterval(() => {
  // Clean up bot timers for rooms that will be removed
  for (const code in rooms) {
    const room = rooms[code];
    const lastActive = room.lastActivity || room.createdAt.getTime();
    if (Date.now() - lastActive > 3 * 3600000) {
      botManager.cleanup(code);
    }
  }
  cleanupOldRooms();
}, 30 * 60 * 1000);

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(PORT, () => {
  console.log(`Klassespill server listening on port ${PORT}`);
});
