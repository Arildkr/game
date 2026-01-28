// Klassespill Server
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import {
  rooms,
  socketToRoom,
  createRoom,
  joinRoom,
  removePlayer,
  kickPlayer,
  startGame,
  endGame,
  handleGameAction,
  handlePlayerAction,
  cleanupOldRooms
} from './gameState.js';

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3003;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Klassespill Server',
    rooms: Object.keys(rooms).length
  });
});

// Sanitize room data for client
function sanitizeRoom(room) {
  return {
    code: room.code,
    game: room.game,
    gameState: room.gameState,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isConnected: p.isConnected,
      isEliminated: p.isEliminated
    })),
    gameData: room.gameData
  };
}

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
      socket.emit('room:created', { roomCode, game: room.game });
      console.log(`Host ${socket.id} created room: ${roomCode} for game: ${game}`);
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
    }
  });

  socket.on('host:end-game', () => {
    const roomCode = socketToRoom.get(socket.id);
    const room = endGame(roomCode);
    if (room) {
      io.to(roomCode).emit('game:ended', { room: sanitizeRoom(room) });
      console.log(`Game ended in room ${roomCode}`);
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

  socket.on('host:game-action', ({ action, ...data }) => {
    const roomCode = socketToRoom.get(socket.id);
    const result = handleGameAction(roomCode, action, data);
    if (result) {
      // Emit appropriate events based on the action result
      if (result.broadcast) {
        io.to(roomCode).emit(result.event, result.data);
      }
      if (result.toPlayer) {
        io.to(result.toPlayer).emit(result.playerEvent, result.playerData);
      }
    }
  });

  // ==================
  // PLAYER EVENTS
  // ==================

  socket.on('player:join-room', ({ roomCode, playerName }) => {
    const room = joinRoom(roomCode, socket.id, playerName);
    if (room) {
      socket.join(room.code);
      io.to(room.code).emit('room:player-joined', {
        playerId: socket.id,
        playerName,
        room: sanitizeRoom(room)
      });
      console.log(`Player ${playerName} (${socket.id}) joined room ${room.code}`);

      // If game is already in progress, send current state
      if (room.gameState === 'PLAYING') {
        socket.emit('game:state-sync', { room: sanitizeRoom(room) });
      }
    } else {
      socket.emit('room:join-error', { message: 'Kunne ikke bli med i rommet. Sjekk at romkoden er riktig.' });
    }
  });

  socket.on('player:game-action', ({ action, ...data }) => {
    const roomCode = socketToRoom.get(socket.id);
    const result = handlePlayerAction(roomCode, socket.id, action, data);
    if (result) {
      // Emit appropriate events based on the action result
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
  });

  // ==================
  // DISCONNECT
  // ==================

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const result = removePlayer(socket.id);

    if (result) {
      if (result.hostLeft) {
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
  cleanupOldRooms();
}, 30 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Klassespill server listening on port ${PORT}`);
});
