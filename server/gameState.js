// Klassespill Server - Game State Management

export const rooms = {};
export const socketToRoom = new Map();

/**
 * Generates a random 6-character alphanumeric room code.
 */
function generateUniqueRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let isUnique = false;
  while (!isUnique) {
    result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!rooms[result]) {
      isUnique = true;
    }
  }
  return result;
}

/**
 * Creates a new room
 */
export function createRoom(hostSocketId, game) {
  const roomCode = generateUniqueRoomCode();

  rooms[roomCode] = {
    code: roomCode,
    hostId: hostSocketId,
    game: game,
    gameState: 'LOBBY', // LOBBY, PLAYING, GAME_OVER
    players: [],
    gameData: null,
    createdAt: new Date()
  };

  socketToRoom.set(hostSocketId, roomCode);
  return roomCode;
}

/**
 * Adds a player to a room
 */
export function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode?.toUpperCase()];
  if (!room) return null;

  // Check if already in room
  if (room.players.some(p => p.id === playerId)) {
    return room;
  }

  room.players.push({
    id: playerId,
    name: playerName,
    score: 0,
    isConnected: true,
    isEliminated: false
  });

  socketToRoom.set(playerId, roomCode.toUpperCase());
  return room;
}

/**
 * Starts the game
 */
export function startGame(roomCode, config = {}) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.gameState = 'PLAYING';

  // Initialize game-specific data based on game type
  room.gameData = initializeGameData(room.game, room.players, config);

  // Reset player stats
  room.players.forEach(p => {
    p.score = 0;
    p.isEliminated = false;
  });

  return room;
}

/**
 * Initialize game-specific data
 */
function initializeGameData(game, players, config) {
  switch (game) {
    case 'ja-eller-nei':
      return {
        currentQuestionIndex: 0,
        currentQuestion: null,
        showAnswer: false,
        answers: {}, // playerId -> 'yes' | 'no'
        eliminatedThisRound: []
      };

    case 'quiz':
      return {
        currentQuestionIndex: 0,
        currentQuestion: null,
        showAnswer: false,
        answers: {}, // playerId -> 'A' | 'B' | 'C' | 'D'
        timeLeft: 30
      };

    case 'gjett-bildet':
      return {
        currentImageIndex: 0,
        revealedTiles: [],
        buzzerQueue: [],
        currentPlayer: null,
        pendingGuess: null
      };

    case 'tallkamp':
      return {
        targetNumber: null,
        availableNumbers: [],
        solutions: {}, // playerId -> { expression, result }
        timeLeft: 90
      };

    case 'tidslinje':
      return {
        events: [],
        submissions: {}, // playerId -> [orderedEventIds]
        timeLeft: 60
      };

    case 'slange':
      return {
        currentLetter: 'S',
        wordChain: [],
        usedWords: new Set(),
        buzzerQueue: [],
        currentPlayer: null,
        pendingWord: null,
        mode: config.mode || 'samarbeid'
      };

    default:
      return {};
  }
}

/**
 * Ends the game
 */
export function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.gameState = 'GAME_OVER';
  return room;
}

/**
 * Handle host game action
 */
export function handleGameAction(roomCode, action, data) {
  const room = rooms[roomCode];
  if (!room) return null;

  // Game-specific action handling
  // This will be expanded for each game
  switch (room.game) {
    case 'ja-eller-nei':
      return handleJaEllerNeiHostAction(room, action, data);
    case 'quiz':
      return handleQuizHostAction(room, action, data);
    case 'gjett-bildet':
      return handleGjettBildetHostAction(room, action, data);
    case 'tallkamp':
      return handleTallkampHostAction(room, action, data);
    case 'tidslinje':
      return handleTidslinjeHostAction(room, action, data);
    case 'slange':
      return handleSlangeHostAction(room, action, data);
    default:
      return null;
  }
}

/**
 * Handle player game action
 */
export function handlePlayerAction(roomCode, playerId, action, data) {
  const room = rooms[roomCode];
  if (!room) return null;

  // Game-specific player action handling
  switch (room.game) {
    case 'ja-eller-nei':
      return handleJaEllerNeiPlayerAction(room, playerId, action, data);
    case 'quiz':
      return handleQuizPlayerAction(room, playerId, action, data);
    case 'gjett-bildet':
      return handleGjettBildetPlayerAction(room, playerId, action, data);
    case 'tallkamp':
      return handleTallkampPlayerAction(room, playerId, action, data);
    case 'tidslinje':
      return handleTidslinjePlayerAction(room, playerId, action, data);
    case 'slange':
      return handleSlangePlayerAction(room, playerId, action, data);
    default:
      return null;
  }
}

// ==================
// JA ELLER NEI
// ==================

function handleJaEllerNeiHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'show-question': {
      // Host shows a new question
      const { question } = data;
      gd.currentQuestion = question;
      gd.showAnswer = false;
      gd.answers = {};
      gd.eliminatedThisRound = [];

      return {
        broadcast: true,
        event: 'game:question-shown',
        data: {
          question: question.question,
          questionIndex: gd.currentQuestionIndex
        }
      };
    }

    case 'reveal-answer': {
      // Host reveals the answer
      gd.showAnswer = true;
      const correctAnswer = gd.currentQuestion.answer;
      const eliminatedThisRound = [];

      // Check answers and eliminate wrong players
      for (const [playerId, answer] of Object.entries(gd.answers)) {
        const player = room.players.find(p => p.id === playerId);
        if (player && !player.isEliminated) {
          const isCorrect = (answer === 'yes') === correctAnswer;
          if (!isCorrect) {
            player.isEliminated = true;
            eliminatedThisRound.push(playerId);
          }
        }
      }

      // Also eliminate players who didn't answer
      for (const player of room.players) {
        if (!player.isEliminated && !gd.answers[player.id]) {
          player.isEliminated = true;
          eliminatedThisRound.push(player.id);
        }
      }

      gd.eliminatedThisRound = eliminatedThisRound;
      gd.currentQuestionIndex++;

      // Check for winner
      const alivePlayers = room.players.filter(p => !p.isEliminated && p.isConnected);
      let winner = null;
      let gameOver = false;

      if (alivePlayers.length === 1) {
        winner = alivePlayers[0];
        gameOver = true;
      } else if (alivePlayers.length === 0) {
        // Everyone eliminated - bring back those eliminated this round
        eliminatedThisRound.forEach(pid => {
          const player = room.players.find(p => p.id === pid);
          if (player) player.isEliminated = false;
        });
        gd.eliminatedThisRound = [];
      }

      return {
        broadcast: true,
        event: 'game:answer-revealed',
        data: {
          correctAnswer,
          explanation: gd.currentQuestion.explanation,
          answers: gd.answers,
          eliminatedThisRound: gd.eliminatedThisRound,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            isEliminated: p.isEliminated,
            isConnected: p.isConnected
          })),
          winner: winner ? { id: winner.id, name: winner.name } : null,
          gameOver
        }
      };
    }

    case 'next-question': {
      // Reset for next question
      gd.currentQuestion = null;
      gd.showAnswer = false;
      gd.answers = {};
      gd.eliminatedThisRound = [];

      return {
        broadcast: true,
        event: 'game:ready-for-question',
        data: {
          questionIndex: gd.currentQuestionIndex,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            isEliminated: p.isEliminated,
            isConnected: p.isConnected
          }))
        }
      };
    }

    default:
      return null;
  }
}

function handleJaEllerNeiPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player || player.isEliminated) return null;

  switch (action) {
    case 'answer': {
      // Player submits their answer (yes/no)
      if (gd.showAnswer) return null; // Too late
      if (gd.answers[playerId]) return null; // Already answered

      const { answer } = data; // 'yes' or 'no'
      gd.answers[playerId] = answer;

      return {
        broadcast: true,
        event: 'game:player-answered',
        data: {
          playerId,
          answerCount: Object.keys(gd.answers).length,
          totalPlayers: room.players.filter(p => !p.isEliminated && p.isConnected).length
        }
      };
    }

    default:
      return null;
  }
}

// ==================
// QUIZ
// ==================

function handleQuizHostAction(room, action, data) {
  // TODO: Implement
  return null;
}

function handleQuizPlayerAction(room, playerId, action, data) {
  // TODO: Implement
  return null;
}

// ==================
// GJETT BILDET
// ==================

function handleGjettBildetHostAction(room, action, data) {
  // TODO: Implement
  return null;
}

function handleGjettBildetPlayerAction(room, playerId, action, data) {
  // TODO: Implement
  return null;
}

// ==================
// TALLKAMP
// ==================

function handleTallkampHostAction(room, action, data) {
  // TODO: Implement
  return null;
}

function handleTallkampPlayerAction(room, playerId, action, data) {
  // TODO: Implement
  return null;
}

// ==================
// TIDSLINJE
// ==================

function handleTidslinjeHostAction(room, action, data) {
  // TODO: Implement
  return null;
}

function handleTidslinjePlayerAction(room, playerId, action, data) {
  // TODO: Implement
  return null;
}

// ==================
// SLANGE
// ==================

function handleSlangeHostAction(room, action, data) {
  // TODO: Implement
  return null;
}

function handleSlangePlayerAction(room, playerId, action, data) {
  // TODO: Implement
  return null;
}

// ==================
// PLAYER MANAGEMENT
// ==================

/**
 * Removes a player
 */
export function removePlayer(playerId) {
  const roomCode = socketToRoom.get(playerId);
  if (!roomCode) return null;

  const room = rooms[roomCode];
  if (!room) return null;

  // Check if this is the host
  if (room.hostId === playerId) {
    // Host left, close room
    socketToRoom.delete(playerId);
    room.players.forEach(p => socketToRoom.delete(p.id));
    delete rooms[roomCode];
    return { room, hostLeft: true };
  }

  // Mark player as disconnected
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = false;
  }

  socketToRoom.delete(playerId);
  return { room, hostLeft: false };
}

/**
 * Kicks a player
 */
export function kickPlayer(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);
  socketToRoom.delete(playerId);
  return room;
}

/**
 * Gets room by socket ID
 */
export function getRoomBySocketId(socketId) {
  const roomCode = socketToRoom.get(socketId);
  return roomCode ? rooms[roomCode] : null;
}

/**
 * Cleans up old rooms
 */
export function cleanupOldRooms(maxAgeMs = 3600000) {
  const now = Date.now();
  for (const code in rooms) {
    if (now - rooms[code].createdAt.getTime() > maxAgeMs) {
      rooms[code].players.forEach(p => socketToRoom.delete(p.id));
      socketToRoom.delete(rooms[code].hostId);
      delete rooms[code];
    }
  }
}
