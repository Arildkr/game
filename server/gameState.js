// Klassespill Server - Game State Management

import { checkAnswer, startsWithLetter, getLastLetter } from './answerChecker.js';

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
export function createRoom(hostSocketId, game = null) {
  const roomCode = generateUniqueRoomCode();

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
      playerScores: {}, // playerId -> { jumperScore, jumperBest }
      leaderboard: []
    },
    createdAt: new Date()
  };

  socketToRoom.set(hostSocketId, roomCode);
  return roomCode;
}

/**
 * Creates a lobby (uten spill valgt)
 */
export function createLobby(hostSocketId) {
  return createRoom(hostSocketId, null);
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
export function submitLobbyScore(roomCode, playerId, score) {
  const room = rooms[roomCode];
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  // Oppdater spillerens lobby-score
  if (!room.lobbyData.playerScores[playerId]) {
    room.lobbyData.playerScores[playerId] = {
      jumperScore: 0,
      jumperBest: 0,
      playerName: player.name
    };
  }

  const playerData = room.lobbyData.playerScores[playerId];
  playerData.jumperScore += score;
  playerData.jumperBest = Math.max(playerData.jumperBest, score);

  // Oppdater total klassescore
  room.lobbyData.totalScore += score;

  // Oppdater leaderboard
  room.lobbyData.leaderboard = Object.entries(room.lobbyData.playerScores)
    .map(([id, data]) => ({
      playerId: id,
      playerName: data.playerName,
      totalScore: data.jumperScore,
      bestScore: data.jumperBest
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  return {
    room,
    playerScore: playerData,
    totalScore: room.lobbyData.totalScore,
    leaderboard: room.lobbyData.leaderboard
  };
}

/**
 * Adds a player to a room or reconnects an existing player
 */
export function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode?.toUpperCase()];
  if (!room) return null;

  // Check if player with same name exists and is disconnected (reconnection)
  const existingPlayer = room.players.find(p =>
    p.name.toLowerCase() === playerName.toLowerCase()
  );

  if (existingPlayer) {
    // Reconnecting player - update their socket ID and mark as connected
    const oldId = existingPlayer.id;
    existingPlayer.id = playerId;
    existingPlayer.isConnected = true;
    socketToRoom.delete(oldId);
    socketToRoom.set(playerId, roomCode.toUpperCase());
    return room;
  }

  // Check if already in room with same socket ID
  if (room.players.some(p => p.id === playerId)) {
    return room;
  }

  // New player joining
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
        phase: 'waiting' // waiting, drawing, gallery
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
          timeLimit
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
      if (gd.showAnswer) return null; // Too late
      if (gd.answers[playerId]) return null; // Already answered

      const { answer } = data; // Kan være indeks (0-3) eller tekststreng
      const timeTaken = Date.now() - gd.questionStartTime;

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

  switch (action) {
    case 'reveal-step':
      // Sørg for at vi lagrer steget i server-staten også
      gd.revealedTiles.push(data.step);
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

  switch (action) {
    case 'buzz': {
      // Sjekk om spilleren er utestengt på dette bildet
      if (gd.lockedOutPlayers && gd.lockedOutPlayers.includes(playerId)) {
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
      const { guess, correctAnswers } = data;
      gd.pendingGuess = { playerId, guess };

      // Auto-sjekk svar hvis vi har gyldige svar
      const answersToCheck = correctAnswers || gd.currentImageAnswers || [];
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
        data: { numbers, target, timeLimit, round }
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
          // Maks 200 poeng for hastighet - avhenger av rekkefølge
          if (numSubmissions > 0) {
            // Første får 200, siste får ~50
            const orderRatio = 1 - ((submission.order - 1) / Math.max(numSubmissions, 1));
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

      const { expression, result } = data;
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
        data: { setName, events, timeLimit, round }
      };
    }

    case 'reveal-round': {
      const correctOrder = gd.correctOrder;
      const eventsWithYears = gd.eventsWithYears || [];

      // Find the best locked answer
      let bestResult = null;
      let bestCorrectCount = -1;
      let bestLockTime = Infinity;

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

        // Better score, or same score but locked earlier
        if (correctCount > bestCorrectCount ||
            (correctCount === bestCorrectCount && lockData.lockTime < bestLockTime)) {
          bestCorrectCount = correctCount;
          bestLockTime = lockData.lockTime;

          const totalCount = correctOrder.length;
          const isCorrect = correctCount === totalCount;

          // Calculate points - more for earlier lock + correctness
          let points = correctCount * 200;
          if (isCorrect) {
            points += 500; // Perfect bonus
          }

          player.score = (player.score || 0) + points;

          bestResult = {
            playerId,
            playerName: player.name,
            isCorrect,
            correctCount,
            totalCount,
            points
          };
        }
      }

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
            totalCount: correctOrder.length,
            points: 0
          }),
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

  // Evaluate left side
  try {
    // Replace any dangerous patterns (security)
    const safeLeft = leftSide.replace(/[^0-9+\-*/]/g, '');
    const safeRight = rightSide.replace(/[^0-9]/g, '');

    // Use Function constructor for safer eval
    const leftResult = new Function('return ' + safeLeft)();
    const rightResult = parseInt(safeRight, 10);

    if (isNaN(leftResult) || isNaN(rightResult)) {
      return { valid: false, error: 'Ugyldig matematikk' };
    }

    if (leftResult !== rightResult) {
      return { valid: false, error: 'Regnestykket stemmer ikke' };
    }

    return { valid: true, result: leftResult };
  } catch (e) {
    return { valid: false, error: 'Ugyldig regnestykke' };
  }
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

      return {
        toPlayer: true,
        playerId,
        playerEvent: 'game:guess-result',
        playerData: {
          guess,
          result,
          attemptsLeft: gd.maxAttempts - attempts.guesses.length
        }
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
      const { drawerId, drawerName, wordOptions } = data;

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
          wordOptions // Only drawer will use this
        }
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
          drawerName: drawer?.name,
          // Only send word to drawer
          wordForDrawer: word
        }
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

      // Broadcast to all - start the round
      return {
        broadcast: true,
        event: 'game:round-started',
        data: {
          drawerId: gd.drawerId,
          drawerName: gd.drawerName,
          wordForDrawer: word
        }
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

      // Check if locked out
      if (gd.lockedOutPlayers.includes(playerId)) {
        return {
          toPlayer: true,
          playerEvent: 'game:still-locked-out',
          playerData: {}
        };
      }

      const { guess } = data;
      const normalizedGuess = guess.toLowerCase().trim();
      const normalizedWord = gd.currentWord.toLowerCase().trim();

      // Fuzzy match - allow some flexibility
      const isCorrect = normalizedGuess === normalizedWord ||
        (normalizedGuess.length >= 3 && normalizedWord.startsWith(normalizedGuess)) ||
        (normalizedWord.length >= 3 && normalizedGuess.startsWith(normalizedWord));

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

    case 'next-squiggle': {
      gd.phase = 'waiting';
      gd.squiggle = null;
      gd.submissions = {};
      gd.displayedSubmissions = [];

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
