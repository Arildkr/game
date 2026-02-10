// Klassespill Server - Game State Management

import { checkAnswer, startsWithLetter, getLastLetter } from './answerChecker.js';

/**
 * Safely evaluates a simple arithmetic expression.
 * Only allows digits, +, -, *, /, parentheses, and decimal points.
 * Returns the numeric result or null if invalid.
 */
function safeEvalMath(expression) {
  if (!expression || typeof expression !== 'string') return null;
  if (expression.length > 100) return null;

  // Tokenize: numbers, operators, parentheses
  const tokens = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === ' ') { i++; continue; }
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      const parsed = Number(num);
      if (isNaN(parsed)) return null;
      tokens.push(parsed);
    } else {
      return null; // Invalid character
    }
  }

  if (tokens.length === 0) return null;

  // Recursive descent parser: expr -> term ((+|-) term)*
  let pos = 0;

  function parseExpr() {
    let left = parseTerm();
    if (left === null) return null;
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    if (left === null) return null;
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === '/') {
        if (right === 0) return null; // Division by zero
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function parseFactor() {
    if (pos >= tokens.length) return null;
    // Unary minus
    if (tokens[pos] === '-') {
      pos++;
      const val = parseFactor();
      return val === null ? null : -val;
    }
    // Parentheses
    if (tokens[pos] === '(') {
      pos++;
      const val = parseExpr();
      if (val === null || pos >= tokens.length || tokens[pos] !== ')') return null;
      pos++;
      return val;
    }
    // Number
    if (typeof tokens[pos] === 'number') {
      return tokens[pos++];
    }
    return null;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) return null;
  if (!isFinite(result)) return null;
  return result;
}

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
 * Creates a new room (lobby uten spill valgt)
 */
export function createRoom(hostSocketId, game = null, preferredRoomCode = null) {
  // Use preferred code if provided and not already taken
  const roomCode = (preferredRoomCode && !rooms[preferredRoomCode])
    ? preferredRoomCode
    : generateUniqueRoomCode();

  rooms[roomCode] = {
    code: roomCode,
    hostId: hostSocketId,
    game: game,
    // Nye game states: LOBBY_IDLE, LOBBY_GAME_SELECTED, PLAYING, GAME_OVER
    gameState: game ? 'LOBBY' : 'LOBBY_IDLE',
    players: [],
    gameData: null,
    lobbyData: {
      totalScore: 0,
      playerScores: {}, // playerId -> { playerName, games: { gameId: { total, best } } }
      leaderboard: [],
      gameLeaderboards: {} // gameId -> [{ playerId, playerName, totalScore, bestScore }]
    },
    lobbyMinigame: 'jumper',
    createdAt: new Date(),
    lastActivity: Date.now()
  };

  socketToRoom.set(hostSocketId, roomCode);
  return roomCode;
}

/**
 * Creates a lobby (uten spill valgt)
 */
export function createLobby(hostSocketId, preferredRoomCode = null) {
  return createRoom(hostSocketId, null, preferredRoomCode);
}

/**
 * Velger spill for en lobby
 */
export function selectGame(roomCode, game) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.game = game;
  room.gameState = 'LOBBY_GAME_SELECTED';
  room.gameData = null;

  // Behold lobby-poeng gjennom hele økten - ikke nullstill

  return room;
}

/**
 * Returnerer til lobby etter spill
 */
export function returnToLobby(roomCode) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.gameState = 'LOBBY_IDLE';
  room.game = null;
  room.gameData = null;

  // Behold spillere og deres grunnleggende data
  room.players.forEach(p => {
    p.score = 0;
    p.isEliminated = false;
    p.wordsSubmitted = 0;
  });

  return room;
}

/**
 * Sender inn lobby-poeng (fra minispill)
 */
export function submitLobbyScore(roomCode, playerId, score, gameId = 'jumper') {
  const room = rooms[roomCode];
  if (!room) return null;

  // Validate score
  if (typeof score !== 'number' || !isFinite(score) || score < 0) return null;
  score = Math.floor(score); // Ensure integer

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  // Oppdater spillerens lobby-score
  if (!room.lobbyData.playerScores[playerId]) {
    room.lobbyData.playerScores[playerId] = {
      playerName: player.name,
      games: {}
    };
  }

  const playerData = room.lobbyData.playerScores[playerId];
  playerData.playerName = player.name; // Hold oppdatert

  if (!playerData.games[gameId]) {
    playerData.games[gameId] = { total: 0, best: 0 };
  }

  playerData.games[gameId].total += score;
  playerData.games[gameId].best = Math.max(playerData.games[gameId].best, score);

  // Oppdater total klassescore
  room.lobbyData.totalScore += score;

  // Bygg leaderboard per spill
  rebuildLeaderboards(room);

  return {
    room,
    totalScore: room.lobbyData.totalScore,
    leaderboard: room.lobbyData.leaderboard,
    gameLeaderboards: room.lobbyData.gameLeaderboards
  };
}

/**
 * Bygger opp leaderboards fra playerScores
 */
function rebuildLeaderboards(room) {
  const scores = room.lobbyData.playerScores;

  // Samle alle spilltyper
  const allGameIds = new Set();
  Object.values(scores).forEach(p => {
    Object.keys(p.games || {}).forEach(g => allGameIds.add(g));
  });

  // Per-spill leaderboard
  room.lobbyData.gameLeaderboards = {};
  for (const gid of allGameIds) {
    room.lobbyData.gameLeaderboards[gid] = Object.entries(scores)
      .filter(([, data]) => data.games?.[gid])
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.playerName,
        totalScore: data.games[gid].total,
        bestScore: data.games[gid].best
      }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10);
  }

  // Total leaderboard (sum av alle spill)
  room.lobbyData.leaderboard = Object.entries(scores)
    .map(([id, data]) => {
      let totalScore = 0;
      let bestScore = 0;
      Object.values(data.games || {}).forEach(g => {
        totalScore += g.total;
        bestScore = Math.max(bestScore, g.best);
      });
      return { playerId: id, playerName: data.playerName, totalScore, bestScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);
}

/**
 * Migrates all game data and lobby data from old socket ID to new socket ID.
 * Called when a player reconnects with a new socket.
 */
function migratePlayerId(room, oldId, newId) {
  // Migrate lobby scores
  if (room.lobbyData?.playerScores?.[oldId]) {
    room.lobbyData.playerScores[newId] = room.lobbyData.playerScores[oldId];
    delete room.lobbyData.playerScores[oldId];
    rebuildLeaderboards(room);
  }

  const gd = room.gameData;
  if (!gd) return;

  // Helper: migrate a key in an object (answers, solutions, etc.)
  function migrateKey(obj) {
    if (obj && oldId in obj) {
      obj[newId] = obj[oldId];
      delete obj[oldId];
    }
  }

  // Helper: replace oldId with newId in an array
  function migrateArray(arr) {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === oldId) arr[i] = newId;
    }
  }

  // Helper: migrate currentPlayer-style objects
  function migrateCurrentPlayer(obj) {
    if (obj && obj.id === oldId) obj.id = newId;
  }

  switch (room.game) {
    case 'ja-eller-nei':
      migrateKey(gd.answers);
      migrateArray(gd.eliminatedThisRound);
      break;

    case 'quiz':
      migrateKey(gd.answers);
      break;

    case 'gjett-bildet':
      migrateArray(gd.buzzerQueue);
      migrateArray(gd.lockedOutPlayers);
      migrateCurrentPlayer(gd.currentPlayer);
      if (gd.pendingGuess?.playerId === oldId) gd.pendingGuess.playerId = newId;
      break;

    case 'tallkamp':
      migrateKey(gd.solutions);
      break;

    case 'tidslinje':
      migrateKey(gd.lockedAnswers);
      break;

    case 'slange':
      migrateArray(gd.buzzerQueue);
      migrateCurrentPlayer(gd.currentPlayer);
      break;

    case 'vil-du-heller':
      if (gd.votes) {
        migrateArray(gd.votes.optionA);
        migrateArray(gd.votes.optionB);
      }
      break;

    case 'nerdle':
      migrateKey(gd.playerAttempts);
      break;

    case 'hva-mangler':
      migrateArray(gd.buzzerQueue);
      migrateArray(gd.correctGuessers);
      migrateCurrentPlayer(gd.currentPlayer);
      if (gd.pendingGuess?.playerId === oldId) gd.pendingGuess.playerId = newId;
      break;

    case 'tegn-det':
      if (gd.drawerId === oldId) gd.drawerId = newId;
      migrateArray(gd.buzzerQueue);
      migrateArray(gd.lockedOutPlayers);
      migrateCurrentPlayer(gd.currentGuesser);
      migrateKey(gd.scores);
      break;

    case 'squiggle-story':
      migrateKey(gd.submissions);
      migrateArray(gd.displayedSubmissions);
      migrateKey(gd.votes);
      break;

    default:
      break;
  }
}

/**
 * Adds a player to a room or reconnects an existing player
 */
export function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode?.toUpperCase()];
  if (!room) return null;

  room.lastActivity = Date.now();

  // Sanitize player name: strip HTML tags, trim, limit length
  let safeName = (playerName || '').replace(/<[^>]*>/g, '').trim().slice(0, 20);
  if (!safeName) safeName = 'Spiller';

  // Check if player with same name exists (reconnection candidate)
  const existingPlayer = room.players.find(p =>
    p.name.toLowerCase() === safeName.toLowerCase()
  );

  if (existingPlayer && !existingPlayer.isConnected) {
    // Reconnecting a disconnected player - update their socket ID
    const oldId = existingPlayer.id;
    existingPlayer.id = playerId;
    existingPlayer.isConnected = true;
    socketToRoom.delete(oldId);
    socketToRoom.set(playerId, roomCode.toUpperCase());

    // Migrate all game data and lobby data referencing old socket ID
    if (oldId !== playerId) {
      migratePlayerId(room, oldId, playerId);
    }

    return room;
  }

  // If a connected player already has this name, append a number to avoid collision
  if (existingPlayer && existingPlayer.isConnected) {
    let counter = 2;
    let uniqueName = `${safeName} ${counter}`;
    while (room.players.some(p => p.name.toLowerCase() === uniqueName.toLowerCase())) {
      counter++;
      uniqueName = `${safeName} ${counter}`;
    }
    safeName = uniqueName;
  }

  // Check if already in room with same socket ID
  if (room.players.some(p => p.id === playerId)) {
    return room;
  }

  // New player joining
  room.players.push({
    id: playerId,
    name: safeName,
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

    case 'slange': {
      // Velg tilfeldig startbokstav (unngå vanskelige bokstaver)
      const NORWEGIAN_LETTERS = 'ABDEFGHIKLMNOPRSTUVWY';
      const randomLetter = NORWEGIAN_LETTERS.charAt(Math.floor(Math.random() * NORWEGIAN_LETTERS.length));

      return {
        currentLetter: randomLetter,
        wordChain: [],
        usedWords: new Set(), // Brukes internt, konverteres til array ved serialisering
        usedWordsArray: [],   // For serialisering over socket
        buzzerQueue: [],
        currentPlayer: null,
        pendingWord: null,
        mode: config.mode || 'samarbeid',
        category: config.category || 'blanding'
      };
    }

    case 'vil-du-heller':
      return {
        currentQuestion: null,
        votes: { optionA: [], optionB: [] },
        questionIndex: 0,
        showResults: false
      };

    case 'nerdle':
      return {
        targetEquation: null,
        playerAttempts: {},
        gameStartTime: null,
        maxAttempts: 6,
        roundActive: false
      };

    case 'hva-mangler':
      return {
        currentImage: null,
        phase: 'waiting', // waiting, memorize, black, guess
        buzzerQueue: [],
        currentPlayer: null,
        pendingGuess: null,
        correctGuessers: [],
        roundIndex: 0
      };

    case 'tegn-det':
      return {
        currentWord: null,
        drawerId: null,
        drawerName: null,
        drawingData: [],
        buzzerQueue: [],
        currentGuesser: null,
        pendingGuess: null,
        lockedOutPlayers: [],
        roundStartTime: null,
        scores: {}
      };

    case 'squiggle-story':
      return {
        squiggle: null,
        submissions: {},
        displayedSubmissions: [],
        phase: 'waiting', // waiting, drawing, gallery, voting, results
        votes: {},        // { playerId: [votedForId1, votedForId2] }
        voteCount: 0
      };

    case 'stemningssjekk':
      return {
        votes: {},   // playerId -> emoji
        started: false
      };

    default:
      return {};
  }
}

/**
 * Ends the game
 */
export function endGame(roomCode, returnToLobbyAfter = false) {
  const room = rooms[roomCode];
  if (!room) return null;

  if (returnToLobbyAfter) {
    // Returner til lobby i stedet for GAME_OVER
    room.gameState = 'LOBBY_IDLE';
    room.game = null;
    room.gameData = null;

    // Nullstill spillerdata men behold dem i rommet
    room.players.forEach(p => {
      p.score = 0;
      p.isEliminated = false;
      p.wordsSubmitted = 0;
    });
  } else {
    room.gameState = 'GAME_OVER';
  }

  return room;
}

/**
 * Handle host game action
 */
export function handleGameAction(roomCode, action, data) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.lastActivity = Date.now();

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
    case 'vil-du-heller':
      return handleVilDuHellerHostAction(room, action, data);
    case 'nerdle':
      return handleNerdleHostAction(room, action, data);
    case 'hva-mangler':
      return handleHvaManglerHostAction(room, action, data);
    case 'tegn-det':
      return handleTegnDetHostAction(room, action, data);
    case 'squiggle-story':
      return handleSquiggleStoryHostAction(room, action, data);
    case 'stemningssjekk':
      return handleStemningssjekkHostAction(room, action, data);
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

  room.lastActivity = Date.now();

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
    case 'vil-du-heller':
      return handleVilDuHellerPlayerAction(room, playerId, action, data);
    case 'nerdle':
      return handleNerdlePlayerAction(room, playerId, action, data);
    case 'hva-mangler':
      return handleHvaManglerPlayerAction(room, playerId, action, data);
    case 'tegn-det':
      return handleTegnDetPlayerAction(room, playerId, action, data);
    case 'squiggle-story':
      return handleSquiggleStoryPlayerAction(room, playerId, action, data);
    case 'stemningssjekk':
      return handleStemningssjekkPlayerAction(room, playerId, action, data);
    default:
      return null;
  }
}

// ==================
// STEMNINGSSJEKK
// ==================

function handleStemningssjekkHostAction(room, action, data) {
  const gd = room.gameData;
  switch (action) {
    case 'start-round':
      gd.started = true;
      gd.votes = {};
      return { broadcast: true, event: 'game:round-started', data: { timeLimit: data?.timeLimit || 30 } };

    case 'reset-votes':
      gd.votes = {};
      return { broadcast: true, event: 'game:reset-votes', data: { timeLimit: data?.timeLimit || 30 } };

    case 'time-up':
      return { broadcast: true, event: 'game:time-up', data: {} };

    default:
      return null;
  }
}

function handleStemningssjekkPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  if (!gd.started) return null;

  switch (action) {
    case 'pick-emoji': {
      const { emoji } = data;
      if (!emoji) return null;

      const previousEmoji = gd.votes[playerId] || null;
      gd.votes[playerId] = emoji;

      // Broadcast to host only (anonymous)
      return {
        toHost: true,
        hostEvent: 'game:emoji-picked',
        hostData: { playerId, emoji, previousEmoji }
      };
    }

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
          questionIndex: gd.currentQuestionIndex,
          serverTimestamp: Date.now()
        }
      };
    }

    case 'reveal-answer': {
      // Host reveals the answer
      gd.showAnswer = true;
      const correctAnswer = gd.currentQuestion.answer;
      const eliminatedThisRound = [];

      // Check answers, give points for correct, and eliminate wrong players
      for (const [playerId, answer] of Object.entries(gd.answers)) {
        const player = room.players.find(p => p.id === playerId);
        if (player && !player.isEliminated) {
          const isCorrect = (answer === 'yes') === correctAnswer;
          if (isCorrect) {
            // Gi poeng for riktig svar
            player.score = (player.score || 0) + 10;
          } else {
            player.isEliminated = true;
            eliminatedThisRound.push(playerId);
          }
        }
      }

      // Also eliminate connected players who didn't answer
      for (const player of room.players) {
        if (!player.isEliminated && player.isConnected && !gd.answers[player.id]) {
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
            isConnected: p.isConnected,
            score: p.score || 0
          })),
          winner: winner ? { id: winner.id, name: winner.name, score: winner.score || 0 } : null,
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

      const totalPlayers = room.players.filter(p => !p.isEliminated && p.isConnected).length;
      const answerCount = Object.keys(gd.answers).length;
      const allAnswered = answerCount >= totalPlayers;

      return {
        broadcast: true,
        event: 'game:player-answered',
        data: {
          playerId,
          answerCount,
          totalPlayers,
          allAnswered
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
  const gd = room.gameData;

  switch (action) {
    case 'show-question': {
      // Host shows a new question
      const { question, questionIndex, timeLimit = 20 } = data;
      gd.currentQuestion = question;
      gd.currentQuestionIndex = questionIndex;
      gd.showAnswer = false;
      gd.answers = {};
      gd.questionStartTime = Date.now();
      gd.timeLimit = timeLimit * 1000; // Convert to ms

      // Lagre riktige svar for tekst-sammenligning
      // Prioriter: answers > correctAnswers > options[correct]
      if (question.answers && Array.isArray(question.answers)) {
        gd.correctAnswers = question.answers;
      } else if (question.correctAnswers) {
        gd.correctAnswers = question.correctAnswers;
      } else if (question.options && typeof question.correct === 'number') {
        gd.correctAnswers = [question.options[question.correct]];
      } else {
        gd.correctAnswers = [];
      }

      return {
        broadcast: true,
        event: 'game:question-shown',
        data: {
          question: question.question,
          options: question.options, // Kan være undefined for fritekst-quiz
          questionIndex,
          timeLimit,
          serverTimestamp: Date.now()
        }
      };
    }

    case 'reveal-answer': {
      // Host reveals the answer
      gd.showAnswer = true;
      const correctAnswers = gd.correctAnswers || [];
      // Hent riktig svar-tekst for visning
      const correctAnswerText = correctAnswers[0] ||
        (gd.currentQuestion.options?.[gd.currentQuestion.correct]) ||
        '';
      const results = [];

      // Calculate points for each player
      for (const [playerId, answerData] of Object.entries(gd.answers)) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          let isCorrect = false;

          // Sjekk om svaret er riktig med fuzzy matching
          if (answerData.answer && correctAnswers.length > 0) {
            const result = checkAnswer(answerData.answer, correctAnswers);
            isCorrect = result.isCorrect;
          }

          let points = 0;
          if (isCorrect) {
            // Base points + time bonus (faster = more points)
            const timeTaken = answerData.time;
            const timeBonus = Math.max(0, Math.floor((1 - timeTaken / gd.timeLimit) * 500));
            points = 500 + timeBonus; // 500-1000 points possible
            player.score += points;
          }

          results.push({
            playerId,
            playerName: player.name,
            answer: answerData.answer,
            answerText: typeof answerData.answer === 'number'
              ? gd.currentQuestion.options?.[answerData.answer]
              : answerData.answer,
            isCorrect,
            points,
            totalScore: player.score
          });
        }
      }

      // Add players who didn't answer
      for (const player of room.players) {
        if (!gd.answers[player.id]) {
          results.push({
            playerId: player.id,
            playerName: player.name,
            answer: null,
            answerText: null,
            isCorrect: false,
            points: 0,
            totalScore: player.score
          });
        }
      }

      // Sort by score
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      gd.currentQuestionIndex++;

      return {
        broadcast: true,
        event: 'game:answer-revealed',
        data: {
          correctAnswer: correctAnswerText,
          correctAnswerText,
          results,
          leaderboard,
          questionIndex: gd.currentQuestionIndex - 1
        }
      };
    }

    case 'next-question': {
      // Reset for next question
      gd.currentQuestion = null;
      gd.showAnswer = false;
      gd.answers = {};

      return {
        broadcast: true,
        event: 'game:ready-for-question',
        data: {
          questionIndex: gd.currentQuestionIndex,
          leaderboard: room.players
            .map(p => ({ id: p.id, name: p.name, score: p.score }))
            .sort((a, b) => b.score - a.score)
        }
      };
    }

    case 'end-quiz': {
      // End the quiz and show final results
      const finalLeaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:quiz-ended',
        data: {
          leaderboard: finalLeaderboard,
          winner: finalLeaderboard[0] || null
        }
      };
    }

    default:
      return null;
  }
}

function handleQuizPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  switch (action) {
    case 'answer': {
      // Player submits their answer
      if (gd.showAnswer) return null; // Too late - answer already revealed
      if (gd.answers[playerId]) return null; // Already answered

      // Reject answers that arrive after the time limit (server-authoritative)
      const timeTaken = Date.now() - gd.questionStartTime;
      if (gd.timeLimit && timeTaken > gd.timeLimit + 2000) return null; // 2s grace for network delay

      const { answer } = data; // Kan være indeks (0-3) eller tekststreng

      gd.answers[playerId] = {
        answer,
        time: timeTaken
      };

      return {
        broadcast: true,
        event: 'game:player-answered',
        data: {
          playerId,
          answerCount: Object.keys(gd.answers).length,
          totalPlayers: room.players.filter(p => p.isConnected).length
        }
      };
    }

    default:
      return null;
  }
}

// ==================
// GJETT BILDET
// ==================

function handleGjettBildetHostAction(room, action, data) {
  const gd = room.gameData;
  if (!gd) return null;

  // Ensure arrays exist
  if (!gd.revealedTiles) gd.revealedTiles = [];
  if (!gd.buzzerQueue) gd.buzzerQueue = [];
  if (!gd.lockedOutPlayers) gd.lockedOutPlayers = [];

  switch (action) {
    case 'reveal-step':
      // Sørg for at vi lagrer steget i server-staten også
      if (data.step !== undefined) gd.revealedTiles.push(data.step);
      return {
        broadcast: true,
        event: 'game:reveal-step',
        data: { step: data.step, revealedTiles: gd.revealedTiles }
      };

    case 'select-player':
      const player = room.players.find(p => p.id === data.playerId);
      gd.currentPlayer = { id: data.playerId, name: player?.name };
      return {
        broadcast: true,
        event: 'game:player-selected',
        data: { playerId: data.playerId, playerName: player?.name }
      };

    case 'validate-guess': {
      const { playerId, isCorrect, correctAnswer, guess } = data;
      const player = room.players.find(p => p.id === playerId);

      let points = 0;
      if (player) {
        if (isCorrect) {
          points = 100;
          player.score = (player.score || 0) + 100;
        } else {
          // Minus-poeng for feil svar (økt til -50)
          points = -50;
          player.score = (player.score || 0) - 50;
          // Lock ut spilleren fra å buzze på dette bildet
          if (!gd.lockedOutPlayers) gd.lockedOutPlayers = [];
          if (!gd.lockedOutPlayers.includes(playerId)) {
            gd.lockedOutPlayers.push(playerId);
          }
        }
      }

      // Lagre gjetningen for visning
      const playerGuess = guess || gd.pendingGuess?.guess || '';

      gd.currentPlayer = null;
      gd.buzzerQueue = [];
      gd.pendingGuess = null;

      return {
        broadcast: true,
        event: 'game:guess-result',
        data: {
          playerId,
          isCorrect,
          guess: playerGuess,
          correctAnswer: correctAnswer || gd.currentImageAnswers?.[0] || '',
          points,
          lockedOut: !isCorrect, // Si til spilleren at de er utestengt
          players: room.players
        }
      };
    }

    case 'next-image': {
      // Lagre hvem som var utestengt (for straffe-nedtelling)
      const penaltyPlayers = gd.lockedOutPlayers || [];

      gd.currentImageIndex = data.imageIndex;
      gd.revealedTiles = []; // Nullstill ruter for nytt bilde
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.lockedOutPlayers = []; // Nullstill utestengte

      // Lagre gyldige svar for dette bildet
      if (data.answers) {
        gd.currentImageAnswers = Array.isArray(data.answers) ? data.answers : [data.answers];
      } else {
        gd.currentImageAnswers = [];
      }

      // Lagre avsløringmodus for dette bildet
      gd.revealMode = data.revealMode || 'tiles';

      return {
        broadcast: true,
        event: 'game:next-image',
        data: {
          imageIndex: data.imageIndex,
          penaltyPlayers, // Spillere som får straffetid
          penaltySeconds: 3, // Sekunder straff
          revealMode: gd.revealMode
        }
      };
    }

    case 'clear-buzzer':
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      return {
        broadcast: true,
        event: 'game:buzzer-cleared',
        data: {}
      };

    case 'end-gjett-bildet': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:gjett-bildet-ended',
        data: { leaderboard, winner: leaderboard[0] || null }
      };
    }

    default:
      return null;
  }
}

function handleGjettBildetPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  if (!gd) return null;

  // Ensure arrays exist
  if (!gd.buzzerQueue) gd.buzzerQueue = [];
  if (!gd.lockedOutPlayers) gd.lockedOutPlayers = [];

  switch (action) {
    case 'buzz': {
      // Sjekk om spilleren er utestengt på dette bildet
      if (gd.lockedOutPlayers.includes(playerId)) {
        return null; // Kan ikke buzze - allerede gjettet feil
      }

      // Bare legg til i køen hvis spilleren ikke allerede er der
      if (!gd.buzzerQueue.includes(playerId) && !gd.currentPlayer) {
        gd.buzzerQueue.push(playerId);
        return {
          broadcast: true,
          event: 'game:player-buzzed',
          data: { playerId, buzzerQueue: gd.buzzerQueue }
        };
      }
      return null;
    }

    case 'submit-guess': {
      const { guess } = data;
      gd.pendingGuess = { playerId, guess };

      // Auto-sjekk svar mot server-lagrede svar (ikke stol på klient-data)
      const answersToCheck = gd.currentImageAnswers || [];
      let autoResult = null;

      if (answersToCheck.length > 0 && guess) {
        const checkResult = checkAnswer(guess, answersToCheck);
        autoResult = {
          isCorrect: checkResult.isCorrect,
          matchedAnswer: checkResult.matchedAnswer,
          distance: checkResult.distance
        };
      }

      return {
        toHost: true,
        hostEvent: 'game:guess-submitted',
        hostData: {
          playerId,
          guess,
          autoResult // Host kan bruke dette for auto-godkjenning
        }
      };
    }

    default:
      return null;
  }
}

// ==================
// TALLKAMP
// ==================

function handleTallkampHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'start-round': {
      const { numbers, target, timeLimit, round } = data;
      gd.targetNumber = target;
      gd.availableNumbers = numbers;
      gd.solutions = {};
      gd.timeLimit = timeLimit * 1000;
      gd.currentRound = round;

      return {
        broadcast: true,
        event: 'game:round-started',
        data: { numbers, target, timeLimit, round, serverTimestamp: Date.now() }
      };
    }

    case 'reveal-round': {
      const results = [];
      const target = gd.targetNumber;
      const numSubmissions = Object.keys(gd.solutions).length;

      // Calculate results for each player
      for (const player of room.players) {
        const submission = gd.solutions[player.id];
        let result = null;
        let difference = null;
        let points = 0;
        let accuracyPoints = 0;
        let speedBonus = 0;

        if (submission) {
          result = submission.result;
          difference = result - target;
          const absDiff = Math.abs(difference);

          // NØYAKTIGHETSPOENG (80% av totalpoeng)
          // Maks 800 poeng for nøyaktighet
          if (absDiff === 0) {
            accuracyPoints = 800; // Perfekt!
          } else if (absDiff <= 3) {
            accuracyPoints = 700;
          } else if (absDiff <= 5) {
            accuracyPoints = 600;
          } else if (absDiff <= 10) {
            accuracyPoints = 500;
          } else if (absDiff <= 20) {
            accuracyPoints = 350;
          } else if (absDiff <= 50) {
            accuracyPoints = 200;
          } else if (absDiff <= 100) {
            accuracyPoints = 100;
          } else {
            accuracyPoints = 50;
          }

          // HASTIGHETSBONUS (20% av totalpoeng)
          // Maks 200 poeng for hastighet - basert på rekkefølge relativt til totalt antall spillere
          const totalPlayers = room.players.filter(p => p.isConnected).length;
          if (totalPlayers > 0) {
            const orderRatio = 1 - ((submission.order - 1) / Math.max(totalPlayers, 1));
            speedBonus = Math.round(50 + orderRatio * 150);
          }

          points = accuracyPoints + speedBonus;
          player.score += points;
        }

        results.push({
          playerId: player.id,
          playerName: player.name,
          result,
          difference,
          points,
          accuracyPoints,
          speedBonus,
          totalScore: player.score
        });
      }

      // Sort by closest to target (for display)
      results.sort((a, b) => {
        if (a.difference === null) return 1;
        if (b.difference === null) return -1;
        return Math.abs(a.difference) - Math.abs(b.difference);
      });

      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:round-revealed',
        data: { results, leaderboard, target }
      };
    }

    case 'next-round': {
      gd.solutions = {};
      gd.currentRound++;

      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:ready-for-round',
        data: { round: gd.currentRound, leaderboard }
      };
    }

    case 'end-tallkamp': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:tallkamp-ended',
        data: { leaderboard, winner: leaderboard[0] || null }
      };
    }

    default:
      return null;
  }
}

function handleTallkampPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  switch (action) {
    case 'submit': {
      if (gd.solutions[playerId]) return null; // Already submitted

      const { expression } = data;

      // Evaluate expression server-side with safe parser
      const result = safeEvalMath(expression);

      if (result === null) return null; // Invalid expression

      gd.solutions[playerId] = {
        expression,
        result,
        submitTime: Date.now(), // Lagre tidspunkt for hastighetsbonus
        order: Object.keys(gd.solutions).length + 1 // Rekkefølge
      };

      return {
        broadcast: true,
        event: 'game:player-submitted',
        data: {
          playerId,
          playerName: player.name,
          submissionCount: Object.keys(gd.solutions).length
        }
      };
    }

    default:
      return null;
  }
}

// ==================
// TIDSLINJE
// ==================

function handleTidslinjeHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'start-round': {
      const { setName, events, correctOrder, eventsWithYears, timeLimit, round } = data;
      gd.events = events;
      gd.correctOrder = correctOrder;
      gd.eventsWithYears = eventsWithYears || [];
      gd.lockedAnswers = {}; // Spillere som har låst svar
      gd.timeLimit = timeLimit * 1000;
      gd.currentRound = round;
      gd.setName = setName;

      return {
        broadcast: true,
        event: 'game:round-started',
        data: { setName, events, timeLimit, round, serverTimestamp: Date.now() }
      };
    }

    case 'reveal-round': {
      const correctOrder = gd.correctOrder;
      const eventsWithYears = gd.eventsWithYears || [];
      const totalCount = correctOrder.length;

      // First pass: calculate scores for all players who locked, find the best
      let bestPlayerId = null;
      let bestCorrectCount = -1;
      let bestLockTime = Infinity;
      const playerResults = {};

      for (const [playerId, lockData] of Object.entries(gd.lockedAnswers || {})) {
        const player = room.players.find(p => p.id === playerId);
        if (!player) continue;

        // Count correct positions
        let correctCount = 0;
        for (let i = 0; i < lockData.order.length && i < correctOrder.length; i++) {
          if (lockData.order[i] === correctOrder[i]) {
            correctCount++;
          }
        }

        const isCorrect = correctCount === totalCount;
        let points = correctCount * 200;
        if (isCorrect) {
          points += 500; // Perfect bonus
        }

        playerResults[playerId] = { correctCount, isCorrect, points };

        // Track the best
        if (correctCount > bestCorrectCount ||
            (correctCount === bestCorrectCount && lockData.lockTime < bestLockTime)) {
          bestCorrectCount = correctCount;
          bestLockTime = lockData.lockTime;
          bestPlayerId = playerId;
        }
      }

      // Second pass: award points to all who locked, build all results
      let bestResult = null;
      const allResults = [];
      for (const [playerId, result] of Object.entries(playerResults)) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.score = (player.score || 0) + result.points;
        }

        const playerResult = {
          playerId,
          playerName: player?.name,
          isCorrect: result.isCorrect,
          correctCount: result.correctCount,
          totalCount,
          points: result.points
        };

        allResults.push(playerResult);

        if (playerId === bestPlayerId) {
          bestResult = playerResult;
        }
      }

      // Sort all results by correct count descending
      allResults.sort((a, b) => b.correctCount - a.correctCount || b.points - a.points);

      // Create leaderboard
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:sort-result',
        data: {
          ...(bestResult || {
            playerId: null,
            playerName: null,
            isCorrect: false,
            correctCount: 0,
            totalCount,
            points: 0
          }),
          allResults,
          correctOrder,
          eventsWithYears,
          leaderboard
        }
      };
    }

    case 'next-round': {
      gd.lockedAnswers = {};
      gd.currentRound++;

      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:ready-for-round',
        data: { round: gd.currentRound, leaderboard }
      };
    }

    case 'end-tidslinje': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:tidslinje-ended',
        data: { leaderboard, winner: leaderboard[0] || null }
      };
    }

    default:
      return null;
  }
}

function handleTidslinjePlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  switch (action) {
    case 'lock-answer': {
      // Player locks their sorted answer
      if (!gd.lockedAnswers) gd.lockedAnswers = {};
      if (gd.lockedAnswers[playerId]) return null; // Already locked

      const { order } = data;

      gd.lockedAnswers[playerId] = {
        order,
        lockTime: Date.now()
      };

      const lockCount = Object.keys(gd.lockedAnswers).length;

      return {
        broadcast: true,
        event: 'game:player-locked',
        data: {
          playerId,
          playerName: player.name,
          lockCount
        }
      };
    }

    // Legacy support for old buzz action
    case 'buzz': {
      return null;
    }

    // Legacy support for old submit-order action
    case 'submit-order': {
      return null;
    }

    default:
      return null;
  }
}

// ==================
// SLANGE
// ==================

function handleSlangeHostAction(room, action, data) {
  const gd = room.gameData;
  if (!gd) return null;

  // Konverter usedWords fra array til Set hvis nødvendig (for serialisering over socket)
  if (Array.isArray(gd.usedWords)) {
    gd.usedWords = new Set(gd.usedWords);
  }
  if (!gd.usedWords) {
    gd.usedWords = new Set();
  }

  switch (action) {
    case 'select-player': {
      const player = room.players.find(p => p.id === data.playerId);
      gd.currentPlayer = { id: data.playerId, name: player?.name };
      gd.buzzerQueue = [];
      return {
        broadcast: true,
        event: 'game:player-selected',
        data: { playerId: data.playerId, playerName: player?.name }
      };
    }

    case 'approve-word': {
      const word = gd.pendingWord;
      const playerId = gd.currentPlayer?.id;
      const player = room.players.find(p => p.id === playerId);

      // Valider at ordet starter med riktig bokstav
      if (!startsWithLetter(word, gd.currentLetter)) {
        // Automatisk avslag - feil startbokstav
        gd.currentPlayer = null;
        gd.pendingWord = null;

        // Trekk poeng i konkurransemodus
        if (gd.mode === 'konkurranse' && player) {
          player.score = (player.score || 0) - 5;
        }

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: {
            playerId,
            reason: `Ordet må starte med bokstaven ${gd.currentLetter}`,
            players: room.players
          }
        };
      }

      // Sjekk om ordet allerede er brukt
      const normalizedWord = word.toLowerCase().trim();
      if (gd.usedWords.has(normalizedWord)) {
        gd.currentPlayer = null;
        gd.pendingWord = null;

        // Trekk poeng i konkurransemodus
        if (gd.mode === 'konkurranse' && player) {
          player.score = (player.score || 0) - 5;
        }

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: {
            playerId,
            reason: 'Dette ordet er allerede brukt',
            players: room.players
          }
        };
      }

      // Godkjenn ordet
      gd.usedWords.add(normalizedWord);

      const newWord = {
        word: word,
        playerName: gd.currentPlayer?.name,
        playerId: playerId,
        timestamp: Date.now()
      };

      gd.wordChain.push(newWord);
      gd.currentLetter = getLastLetter(word);

      // Gi poeng i konkurransemodus
      if (gd.mode === 'konkurranse' && player) {
        player.score = (player.score || 0) + 10;
      }

      // Oppdater antall ord for spilleren
      if (player) {
        player.wordsSubmitted = (player.wordsSubmitted || 0) + 1;
      }

      gd.currentPlayer = null;
      gd.pendingWord = null;

      return {
        broadcast: true,
        event: 'game:word-approved',
        data: {
          word: newWord.word,
          playerName: newWord.playerName,
          newLetter: gd.currentLetter,
          wordChain: gd.wordChain,
          players: room.players
        }
      };
    }

    case 'reject-word': {
      const playerId = gd.currentPlayer?.id;
      const player = room.players.find(p => p.id === playerId);

      // Trekk poeng i konkurransemodus
      if (gd.mode === 'konkurranse' && player) {
        player.score = (player.score || 0) - 5;
      }

      gd.currentPlayer = null;
      gd.pendingWord = null;

      return {
        broadcast: true,
        event: 'game:word-rejected',
        data: {
          playerId,
          reason: data.reason || 'Ordet ble avslått av lærer',
          players: room.players
        }
      };
    }

    case 'time-expired': {
      // Tiden gikk ut for nåværende spiller
      const timedOutPlayerId = gd.currentPlayer?.id;
      const timedOutPlayer = room.players.find(p => p.id === timedOutPlayerId);

      // Trekk poeng i konkurransemodus
      if (gd.mode === 'konkurranse' && timedOutPlayer) {
        timedOutPlayer.score = (timedOutPlayer.score || 0) - 5;
      }

      gd.currentPlayer = null;
      gd.pendingWord = null;

      return {
        broadcast: true,
        event: 'game:word-rejected',
        data: {
          playerId: timedOutPlayerId,
          reason: 'Tiden gikk ut!',
          autoRejected: true,
          players: room.players
        }
      };
    }

    case 'skip-letter': {
      // Velg en ny tilfeldig bokstav (unngå vanskelige bokstaver)
      const letters = 'ABDEFGHIKLMNOPRSTUVWY';
      const newLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      gd.currentLetter = newLetter;
      gd.currentPlayer = null;
      gd.pendingWord = null;
      gd.buzzerQueue = [];

      return {
        broadcast: true,
        event: 'game:letter-skipped',
        data: { newLetter }
      };
    }

    case 'end-slange': {
      const leaderboard = room.players
        .map(p => ({
          id: p.id,
          name: p.name,
          score: p.score || 0,
          wordsSubmitted: p.wordsSubmitted || 0
        }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:slange-ended',
        data: {
          leaderboard,
          winner: leaderboard[0] || null,
          totalWords: gd.wordChain.length
        }
      };
    }

    default:
      return null;
  }
}

function handleSlangePlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  if (!gd) return null;

  switch (action) {
    case 'buzz':
      // Legg spilleren i køen hvis de ikke er der og ingen er valgt
      if (!gd.buzzerQueue.includes(playerId) && !gd.currentPlayer) {
        gd.buzzerQueue.push(playerId);
        return {
          broadcast: true,
          event: 'game:player-buzzed',
          data: { playerId, buzzerQueue: gd.buzzerQueue }
        };
      }
      return null;

    case 'submit-word': {
      const word = data.word?.trim();
      if (!word) return null;

      const player = room.players.find(p => p.id === playerId);

      // Konverter usedWords fra array til Set hvis nødvendig
      if (Array.isArray(gd.usedWords)) {
        gd.usedWords = new Set(gd.usedWords);
      }
      if (!gd.usedWords) {
        gd.usedWords = new Set();
      }

      // AUTO-VALIDERING: Sjekk startbokstav
      if (!startsWithLetter(word, gd.currentLetter)) {
        // Trekk poeng i konkurransemodus
        if (gd.mode === 'konkurranse' && player) {
          player.score = (player.score || 0) - 5;
        }

        gd.currentPlayer = null;
        gd.pendingWord = null;

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: {
            playerId,
            word,
            reason: `Ordet må starte med ${gd.currentLetter}`,
            autoRejected: true,
            players: room.players
          }
        };
      }

      // AUTO-VALIDERING: Sjekk om ordet allerede er brukt
      const normalizedWord = word.toLowerCase().trim();
      if (gd.usedWords.has(normalizedWord)) {
        // Trekk poeng i konkurransemodus
        if (gd.mode === 'konkurranse' && player) {
          player.score = (player.score || 0) - 5;
        }

        gd.currentPlayer = null;
        gd.pendingWord = null;

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: {
            playerId,
            word,
            reason: 'Dette ordet er allerede brukt',
            autoRejected: true,
            players: room.players
          }
        };
      }

      // Ordet passerer auto-validering, send til host for godkjenning
      gd.pendingWord = word;

      return {
        broadcast: true,
        event: 'game:word-submitted',
        data: { playerId, word, validationPassed: true }
      };
    }

    default:
      return null;
  }
}

// ==================
// VIL DU HELLER?
// ==================

function handleVilDuHellerHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'show-question': {
      const { question } = data;
      gd.currentQuestion = question;
      gd.votes = { optionA: [], optionB: [] };
      gd.showResults = false;

      return {
        broadcast: true,
        event: 'game:question-shown',
        data: {
          question: {
            optionA: question.optionA,
            optionB: question.optionB
          },
          questionIndex: gd.questionIndex
        }
      };
    }

    case 'reveal-results': {
      gd.showResults = true;
      gd.questionIndex++;

      return {
        broadcast: true,
        event: 'game:results-revealed',
        data: {
          votes: gd.votes,
          questionIndex: gd.questionIndex - 1
        }
      };
    }

    case 'next-question': {
      gd.currentQuestion = null;
      gd.votes = { optionA: [], optionB: [] };
      gd.showResults = false;

      return {
        broadcast: true,
        event: 'game:ready-for-question',
        data: { questionIndex: gd.questionIndex }
      };
    }

    default:
      return null;
  }
}

function handleVilDuHellerPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;

  // Ensure votes object exists
  if (!gd.votes) {
    gd.votes = { optionA: [], optionB: [] };
  }
  if (!gd.votes.optionA) gd.votes.optionA = [];
  if (!gd.votes.optionB) gd.votes.optionB = [];

  switch (action) {
    case 'vote': {
      if (gd.showResults) return null;
      // Check if already voted
      if (gd.votes.optionA.includes(playerId) || gd.votes.optionB.includes(playerId)) {
        return null;
      }

      const { choice } = data;
      if (choice === 'optionA') {
        gd.votes.optionA.push(playerId);
      } else if (choice === 'optionB') {
        gd.votes.optionB.push(playerId);
      } else {
        return null;
      }

      const totalPlayers = room.players.filter(p => p.isConnected).length;
      const votedCount = gd.votes.optionA.length + gd.votes.optionB.length;

      return {
        broadcast: true,
        event: 'game:vote-update',
        data: {
          votes: gd.votes,
          votedCount,
          totalPlayers
        }
      };
    }

    default:
      return null;
  }
}

// ==================
// NERDLE
// ==================

function validateNerdleEquation(guess) {
  // Must be 8 characters
  if (guess.length !== 8) {
    return { valid: false, error: 'Må være 8 tegn' };
  }

  // Must contain exactly one =
  const equalCount = (guess.match(/=/g) || []).length;
  if (equalCount !== 1) {
    return { valid: false, error: 'Må inneholde nøyaktig ett =' };
  }

  // Split by =
  const [leftSide, rightSide] = guess.split('=');

  // Validate characters
  const validChars = /^[0-9+\-*/=]+$/;
  if (!validChars.test(guess)) {
    return { valid: false, error: 'Ugyldige tegn' };
  }

  // Evaluate left side with safe parser
  const leftResult = safeEvalMath(leftSide);
  const rightResult = safeEvalMath(rightSide);

  if (leftResult === null || rightResult === null) {
    return { valid: false, error: 'Ugyldig matematikk' };
  }

  if (leftResult !== rightResult) {
    return { valid: false, error: 'Regnestykket stemmer ikke' };
  }

  return { valid: true, result: leftResult };
}

function checkNerdleGuess(guess, target) {
  const result = [];
  const targetChars = target.split('');
  const guessChars = guess.split('');
  const targetCount = {};
  const guessChecked = new Array(8).fill(false);

  // Count characters in target
  for (const char of targetChars) {
    targetCount[char] = (targetCount[char] || 0) + 1;
  }

  // First pass: mark correct positions
  for (let i = 0; i < 8; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = 'correct';
      targetCount[guessChars[i]]--;
      guessChecked[i] = true;
    }
  }

  // Second pass: mark present/absent
  for (let i = 0; i < 8; i++) {
    if (guessChecked[i]) continue;

    if (targetCount[guessChars[i]] > 0) {
      result[i] = 'present';
      targetCount[guessChars[i]]--;
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}

function handleNerdleHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'start-round': {
      const { equation } = data;
      gd.targetEquation = equation;
      gd.playerAttempts = {};
      gd.gameStartTime = Date.now();
      gd.roundActive = true;

      // Initialize attempts for all players
      room.players.forEach(p => {
        gd.playerAttempts[p.id] = {
          guesses: [],
          solved: false,
          solvedAt: null
        };
      });

      return {
        broadcast: true,
        event: 'game:round-started',
        data: {
          equationLength: 8,
          maxAttempts: gd.maxAttempts
        }
      };
    }

    case 'end-round': {
      gd.roundActive = false;

      // Calculate scores
      const results = [];
      for (const player of room.players) {
        const attempts = gd.playerAttempts[player.id];
        let points = 0;

        if (attempts?.solved) {
          // Points based on attempts used and time
          const attemptsUsed = attempts.guesses.length;
          const timeBonus = Math.max(0, 60000 - (attempts.solvedAt - gd.gameStartTime));
          points = (7 - attemptsUsed) * 100 + Math.floor(timeBonus / 1000);
          player.score = (player.score || 0) + points;
        }

        results.push({
          playerId: player.id,
          playerName: player.name,
          solved: attempts?.solved || false,
          attempts: attempts?.guesses.length || 0,
          points,
          totalScore: player.score || 0
        });
      }

      results.sort((a, b) => b.totalScore - a.totalScore);

      return {
        broadcast: true,
        event: 'game:round-ended',
        data: {
          targetEquation: gd.targetEquation,
          results,
          leaderboard: results
        }
      };
    }

    default:
      return null;
  }
}

function handleNerdlePlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  if (!gd.roundActive) {
    return {
      toPlayer: true,
      playerId,
      playerEvent: 'game:guess-invalid',
      playerData: { error: 'Runden er ikke aktiv' }
    };
  }

  switch (action) {
    case 'submit-guess': {
      // Initialize attempts if player joined mid-round
      if (!gd.playerAttempts[playerId]) {
        gd.playerAttempts[playerId] = {
          guesses: [],
          solved: false,
          solvedAt: null
        };
      }

      const attempts = gd.playerAttempts[playerId];
      if (attempts.solved) {
        return {
          toPlayer: true,
          playerId,
          playerEvent: 'game:guess-invalid',
          playerData: { error: 'Du har allerede løst denne!' }
        };
      }
      if (attempts.guesses.length >= gd.maxAttempts) {
        return {
          toPlayer: true,
          playerId,
          playerEvent: 'game:guess-invalid',
          playerData: { error: 'Ingen flere forsøk' }
        };
      }

      const { guess } = data;

      // Validate equation
      const validation = validateNerdleEquation(guess);
      if (!validation.valid) {
        return {
          toPlayer: true,
          playerId,
          playerEvent: 'game:guess-invalid',
          playerData: { error: validation.error }
        };
      }

      // Check against target
      const result = checkNerdleGuess(guess, gd.targetEquation);
      attempts.guesses.push({ guess, result });

      const solved = guess === gd.targetEquation;
      if (solved) {
        attempts.solved = true;
        attempts.solvedAt = Date.now();

        return {
          broadcast: true,
          event: 'game:player-solved',
          data: {
            playerId,
            playerName: player.name,
            attempts: attempts.guesses.length
          }
        };
      }

      const attemptsLeft = gd.maxAttempts - attempts.guesses.length;

      // If all attempts used, also broadcast failure to host
      if (attemptsLeft === 0) {
        return {
          toPlayer: true,
          playerEvent: 'game:guess-result',
          playerData: { guess, result, attemptsLeft: 0 },
          broadcast: true,
          event: 'game:player-failed',
          data: { playerId, playerName: player.name, attempts: attempts.guesses.length }
        };
      }

      return {
        toPlayer: true,
        playerId,
        playerEvent: 'game:guess-result',
        playerData: { guess, result, attemptsLeft }
      };
    }

    default:
      return null;
  }
}

// ==================
// HVA MANGLER?
// ==================

function handleHvaManglerHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'start-memorize': {
      const { image, objects, removedObject, removedObjectImage, emojis } = data;
      gd.currentImage = {
        url: image,
        objects,
        removedObject,
        removedObjectImage,
        emojis
      };
      gd.phase = 'memorize';
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.correctGuessers = [];

      return {
        broadcast: true,
        event: 'game:memorize-started',
        data: {
          imageUrl: image,
          objects,
          duration: data.duration || 10,
          emojis: emojis || {}
        }
      };
    }

    case 'show-black': {
      gd.phase = 'black';

      return {
        broadcast: true,
        event: 'game:screen-black',
        data: { duration: data.duration || 3 }
      };
    }

    case 'show-changed': {
      gd.phase = 'guess';

      return {
        broadcast: true,
        event: 'game:changed-shown',
        data: { imageUrl: gd.currentImage.removedObjectImage }
      };
    }

    case 'select-player': {
      const player = room.players.find(p => p.id === data.playerId);
      gd.currentPlayer = { id: data.playerId, name: player?.name };
      gd.buzzerQueue = gd.buzzerQueue.filter(id => id !== data.playerId);

      return {
        broadcast: true,
        event: 'game:player-selected',
        data: { playerId: data.playerId, playerName: player?.name }
      };
    }

    case 'validate-guess': {
      const { playerId, isCorrect } = data;
      const player = room.players.find(p => p.id === playerId);

      if (isCorrect && player) {
        player.score = (player.score || 0) + 100;
        gd.correctGuessers.push(playerId);
      }

      gd.currentPlayer = null;

      return {
        broadcast: true,
        event: 'game:guess-result',
        data: {
          playerId,
          playerName: player?.name,
          isCorrect,
          correctAnswer: gd.currentImage.removedObject,
          players: room.players
        }
      };
    }

    case 'next-image': {
      gd.phase = 'waiting';
      gd.currentImage = null;
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.correctGuessers = [];
      gd.roundIndex++;

      return {
        broadcast: true,
        event: 'game:ready-for-next',
        data: { roundIndex: gd.roundIndex }
      };
    }

    case 'end-hva-mangler': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:hva-mangler-ended',
        data: { leaderboard, winner: leaderboard[0] || null }
      };
    }

    default:
      return null;
  }
}

function handleHvaManglerPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'buzz': {
      if (gd.phase !== 'guess') return null;
      if (gd.currentPlayer) return null;
      if (gd.buzzerQueue.includes(playerId)) return null;
      if (gd.correctGuessers.includes(playerId)) return null;

      gd.buzzerQueue.push(playerId);

      return {
        broadcast: true,
        event: 'game:player-buzzed',
        data: { playerId, buzzerQueue: gd.buzzerQueue }
      };
    }

    case 'submit-guess': {
      if (gd.currentPlayer?.id !== playerId) return null;

      const { guess } = data;
      gd.pendingGuess = { playerId, guess };

      return {
        toHost: true,
        hostEvent: 'game:guess-submitted',
        hostData: { playerId, guess }
      };
    }

    default:
      return null;
  }
}

// ==================
// TEGN DET!
// ==================

function handleTegnDetHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'select-drawer': {
      const { drawerId, drawerName, wordOptions, wordSelectTime } = data;

      gd.drawerId = drawerId;
      gd.drawerName = drawerName;
      gd.wordOptions = wordOptions;
      gd.drawingData = [];
      gd.buzzerQueue = [];
      gd.currentGuesser = null;
      gd.lockedOutPlayers = [];

      return {
        broadcast: true,
        event: 'game:drawer-selected',
        data: {
          drawerId,
          drawerName,
          wordSelectTime
        },
        // Send word options only to the drawer
        toPlayer: drawerId,
        playerEvent: 'game:word-options',
        playerData: { wordOptions, wordSelectTime }
      };
    }

    case 'start-round': {
      const { word, drawerId } = data;
      const drawer = room.players.find(p => p.id === drawerId);

      gd.currentWord = word;
      gd.drawerId = drawerId;
      gd.drawerName = drawer?.name;
      gd.drawingData = [];
      gd.buzzerQueue = [];
      gd.currentGuesser = null;
      gd.lockedOutPlayers = [];
      gd.roundStartTime = Date.now();

      return {
        broadcast: true,
        event: 'game:round-started',
        data: {
          drawerId,
          drawerName: drawer?.name
        },
        // Send word only to drawer
        toPlayer: drawerId,
        playerEvent: 'game:your-word',
        playerData: { word }
      };
    }

    case 'select-guesser': {
      const player = room.players.find(p => p.id === data.playerId);
      gd.currentGuesser = { id: data.playerId, name: player?.name };
      gd.buzzerQueue = gd.buzzerQueue.filter(id => id !== data.playerId);

      return {
        broadcast: true,
        event: 'game:guesser-selected',
        data: { playerId: data.playerId, playerName: player?.name }
      };
    }

    case 'validate-guess': {
      const { playerId, isCorrect } = data;
      const player = room.players.find(p => p.id === playerId);
      const drawer = room.players.find(p => p.id === gd.drawerId);

      if (isCorrect) {
        // Points for guesser
        const timeBonus = Math.max(0, 60000 - (Date.now() - gd.roundStartTime));
        const guesserPoints = 100 + Math.floor(timeBonus / 1000);
        if (player) player.score = (player.score || 0) + guesserPoints;

        // Points for drawer
        const drawerPoints = 50;
        if (drawer) drawer.score = (drawer.score || 0) + drawerPoints;

        gd.currentGuesser = null;

        return {
          broadcast: true,
          event: 'game:correct-guess',
          data: {
            playerId,
            playerName: player?.name,
            word: gd.currentWord,
            guesserPoints,
            drawerPoints,
            players: room.players
          }
        };
      } else {
        // Lock out player for 5 seconds
        gd.lockedOutPlayers.push(playerId);
        setTimeout(() => {
          const idx = gd.lockedOutPlayers.indexOf(playerId);
          if (idx > -1) gd.lockedOutPlayers.splice(idx, 1);
        }, 5000);

        gd.currentGuesser = null;

        return {
          broadcast: true,
          event: 'game:wrong-guess',
          data: {
            playerId,
            playerName: player?.name,
            lockoutDuration: 5
          }
        };
      }
    }

    case 'end-round': {
      return {
        broadcast: true,
        event: 'game:round-ended',
        data: {
          word: gd.currentWord,
          players: room.players
        }
      };
    }

    case 'end-tegn-det': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:tegn-det-ended',
        data: { leaderboard, winner: leaderboard[0] || null }
      };
    }

    default:
      return null;
  }
}

function handleTegnDetPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  switch (action) {
    case 'select-word': {
      // Only drawer can select word
      if (playerId !== gd.drawerId) return null;

      const { word } = data;
      gd.currentWord = word;
      gd.roundStartTime = Date.now();

      // Broadcast round start to all (without the word) and send word to host only
      return {
        broadcast: true,
        event: 'game:round-started',
        data: {
          drawerId: gd.drawerId,
          drawerName: gd.drawerName
        },
        toHost: true,
        hostEvent: 'game:word-selected',
        hostData: { word }
      };
    }

    case 'draw-stroke': {
      if (playerId !== gd.drawerId) return null;

      const { stroke } = data;
      gd.drawingData.push(stroke);

      return {
        broadcast: true,
        event: 'game:drawing-update',
        data: { stroke }
      };
    }

    case 'undo-stroke': {
      if (playerId !== gd.drawerId) return null;
      if (gd.drawingData.length === 0) return null;

      gd.drawingData.pop();

      return {
        broadcast: true,
        event: 'game:stroke-undone',
        data: {}
      };
    }

    case 'clear-canvas': {
      if (playerId !== gd.drawerId) return null;

      gd.drawingData = [];

      return {
        broadcast: true,
        event: 'game:canvas-cleared',
        data: {}
      };
    }

    // Direct guess - no buzzer needed, auto-check answer
    case 'submit-guess': {
      // Drawer can't guess
      if (playerId === gd.drawerId) return null;

      // No active word - round not in progress
      if (!gd.currentWord) return null;

      // Check if locked out
      if (gd.lockedOutPlayers.includes(playerId)) {
        return {
          toPlayer: true,
          playerEvent: 'game:still-locked-out',
          playerData: {}
        };
      }

      const { guess } = data;
      if (!guess || typeof guess !== 'string') return null;
      const normalizedGuess = guess.toLowerCase().trim();
      const normalizedWord = gd.currentWord.toLowerCase().trim();

      // Fuzzy match function with Levenshtein distance
      const isFuzzyMatch = (g, a) => {
        // Exact match
        if (g === a) return true;
        // Very short, need exact
        if (g.length < 3) return false;

        // Levenshtein distance
        const levenshtein = (s1, s2) => {
          const m = s1.length, n = s2.length;
          const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
          for (let i = 0; i <= m; i++) dp[i][0] = i;
          for (let j = 0; j <= n; j++) dp[0][j] = j;
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              dp[i][j] = s1[i-1] === s2[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            }
          }
          return dp[m][n];
        };

        const dist = levenshtein(g, a);
        const maxLen = Math.max(g.length, a.length);
        // Allow 1 error for short, 2 for medium, 3 for long
        const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : 3;
        return dist <= threshold;
      };

      const isCorrect = isFuzzyMatch(normalizedGuess, normalizedWord);

      if (isCorrect) {
        // Correct guess!
        const drawer = room.players.find(p => p.id === gd.drawerId);
        const timeBonus = Math.max(0, 60000 - (Date.now() - gd.roundStartTime));
        const guesserPoints = 100 + Math.floor(timeBonus / 1000);
        const drawerPoints = 50;

        if (player) player.score = (player.score || 0) + guesserPoints;
        if (drawer) drawer.score = (drawer.score || 0) + drawerPoints;

        return {
          broadcast: true,
          event: 'game:correct-guess',
          data: {
            playerId,
            playerName: player?.name,
            word: gd.currentWord,
            guesserPoints,
            drawerPoints,
            players: room.players
          }
        };
      } else {
        // Wrong guess - lock out for 10 seconds
        gd.lockedOutPlayers.push(playerId);
        setTimeout(() => {
          const idx = gd.lockedOutPlayers.indexOf(playerId);
          if (idx > -1) gd.lockedOutPlayers.splice(idx, 1);
        }, 10000);

        return {
          broadcast: true,
          event: 'game:wrong-guess',
          data: {
            playerId,
            playerName: player?.name,
            lockoutDuration: 10
          }
        };
      }
    }

    default:
      return null;
  }
}

// ==================
// SQUIGGLE STORY
// ==================

function handleSquiggleStoryHostAction(room, action, data) {
  const gd = room.gameData;

  switch (action) {
    case 'start-round': {
      const { squiggle } = data;
      gd.squiggle = squiggle;
      gd.submissions = {};
      gd.displayedSubmissions = [];
      gd.phase = 'drawing';

      return {
        broadcast: true,
        event: 'game:round-started',
        data: { squiggle }
      };
    }

    case 'show-gallery': {
      gd.phase = 'gallery';
      gd.displayedSubmissions = Object.keys(gd.submissions);

      return {
        broadcast: true,
        event: 'game:gallery-shown',
        data: {
          submissions: Object.entries(gd.submissions).map(([id, sub]) => ({
            playerId: id,
            playerName: sub.playerName,
            imageData: sub.imageData
          }))
        }
      };
    }

    case 'remove-submission': {
      const { playerId } = data;
      gd.displayedSubmissions = gd.displayedSubmissions.filter(id => id !== playerId);

      return {
        broadcast: true,
        event: 'game:submission-removed',
        data: { playerId }
      };
    }

    case 'start-voting': {
      gd.phase = 'voting';
      gd.votes = {};
      gd.voteCount = 0;

      // Only include submissions that are still displayed (not removed by host)
      const displayed = new Set(gd.displayedSubmissions);
      const anonymousSubmissions = Object.entries(gd.submissions)
        .filter(([id]) => displayed.has(id))
        .map(([id, sub]) => ({
          playerId: id,
          imageData: sub.imageData
        }));

      // Also build a lookup of playerName -> submissionPlayerId for self-filtering on reconnected clients
      const nameToSubmissionId = {};
      for (const [id, sub] of Object.entries(gd.submissions)) {
        if (displayed.has(id)) {
          nameToSubmissionId[sub.playerName?.toLowerCase()] = id;
        }
      }

      return {
        broadcast: true,
        event: 'game:voting-started',
        data: { submissions: anonymousSubmissions, nameToSubmissionId }
      };
    }

    case 'show-results': {
      gd.phase = 'results';

      // Count votes per submission
      const voteTally = {};
      for (const [, votedFor] of Object.entries(gd.votes)) {
        for (const targetId of votedFor) {
          voteTally[targetId] = (voteTally[targetId] || 0) + 1;
        }
      }

      // Build results for displayed submissions only
      const displayedSet = new Set(gd.displayedSubmissions);
      const results = Object.entries(gd.submissions)
        .filter(([id]) => displayedSet.has(id))
        .map(([id, sub]) => ({
          playerId: id,
          playerName: sub.playerName,
          imageData: sub.imageData,
          votes: voteTally[id] || 0
        }));

      // Sort by most votes
      results.sort((a, b) => b.votes - a.votes);

      // Top 3
      const top3 = results.slice(0, 3);

      return {
        broadcast: true,
        event: 'game:results-shown',
        data: { top3, allResults: results }
      };
    }

    case 'next-squiggle': {
      gd.phase = 'waiting';
      gd.squiggle = null;
      gd.submissions = {};
      gd.displayedSubmissions = [];
      gd.votes = {};
      gd.voteCount = 0;

      return {
        broadcast: true,
        event: 'game:ready-for-next',
        data: {}
      };
    }

    case 'end-squiggle-story': {
      return {
        broadcast: true,
        event: 'game:squiggle-story-ended',
        data: {}
      };
    }

    default:
      return null;
  }
}

function handleSquiggleStoryPlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  switch (action) {
    case 'submit-drawing': {
      if (gd.phase !== 'drawing') return null;
      if (gd.submissions[playerId]) return null; // Already submitted

      const { imageData } = data;
      gd.submissions[playerId] = {
        imageData,
        playerName: player?.name,
        submitted: true,
        submittedAt: Date.now()
      };

      return {
        broadcast: true,
        event: 'game:submission-received',
        data: {
          playerId,
          playerName: player?.name,
          imageData,
          submissionCount: Object.keys(gd.submissions).length,
          totalPlayers: room.players.filter(p => p.isConnected).length
        }
      };
    }

    case 'submit-votes': {
      if (gd.phase !== 'voting') return null;
      if (gd.votes[playerId]) return null; // Already voted

      const { votedFor } = data; // array of playerIds

      // Validate: max 2 votes
      if (!Array.isArray(votedFor) || votedFor.length === 0 || votedFor.length > 2) return null;

      // Validate: no duplicate targets
      if (new Set(votedFor).size !== votedFor.length) return null;

      // Validate: can't vote for yourself (check both socket ID and player name for reconnection safety)
      if (votedFor.includes(playerId)) return null;
      const myName = player?.name?.toLowerCase();
      if (myName && votedFor.some(id => gd.submissions[id]?.playerName?.toLowerCase() === myName)) return null;

      // Validate: can only vote for displayed submissions
      const displayedVoteSet = new Set(gd.displayedSubmissions);
      if (!votedFor.every(id => displayedVoteSet.has(id))) return null;

      gd.votes[playerId] = votedFor;
      gd.voteCount = Object.keys(gd.votes).length;

      return {
        broadcast: true,
        event: 'game:vote-received',
        data: {
          voteCount: gd.voteCount,
          totalPlayers: room.players.filter(p => p.isConnected).length
        }
      };
    }

    default:
      return null;
  }
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
export function cleanupOldRooms(maxInactiveMs = 3 * 3600000) {
  const now = Date.now();
  for (const code in rooms) {
    const room = rooms[code];
    const lastActive = room.lastActivity || room.createdAt.getTime();
    if (now - lastActive > maxInactiveMs) {
      room.players.forEach(p => socketToRoom.delete(p.id));
      socketToRoom.delete(room.hostId);
      delete rooms[code];
    }
  }
}
