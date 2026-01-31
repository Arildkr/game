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

  // Nullstill lobby-score når nytt spill velges
  room.lobbyData.totalScore = 0;
  room.lobbyData.playerScores = {};
  room.lobbyData.leaderboard = [];

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
          // Minus-poeng for feil svar
          points = -25;
          player.score = (player.score || 0) - 25;
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
          guess: playerGuess, // Inkluder selve gjetningen
          correctAnswer: correctAnswer || gd.currentImageAnswers?.[0] || '',
          points,
          players: room.players // Send oppdatert scoreliste
        }
      };
    }

    case 'next-image':
      gd.currentImageIndex = data.imageIndex;
      gd.revealedTiles = []; // Nullstill ruter for nytt bilde
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      // Lagre gyldige svar for dette bildet
      if (data.answers) {
        gd.currentImageAnswers = Array.isArray(data.answers) ? data.answers : [data.answers];
      } else {
        gd.currentImageAnswers = [];
      }
      return {
        broadcast: true,
        event: 'game:next-image',
        data: { imageIndex: data.imageIndex }
      };

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
    case 'buzz':
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

      // Calculate results for each player
      for (const player of room.players) {
        const submission = gd.solutions[player.id];
        let result = null;
        let difference = null;
        let points = 0;

        if (submission) {
          result = submission.result;
          difference = result - target;

          // Points: closer to target = more points
          // Perfect = 1000, within 10 = 500+, etc.
          const absDiff = Math.abs(difference);
          if (absDiff === 0) {
            points = 1000;
          } else if (absDiff <= 5) {
            points = 750;
          } else if (absDiff <= 10) {
            points = 500;
          } else if (absDiff <= 25) {
            points = 250;
          } else if (absDiff <= 50) {
            points = 100;
          } else {
            points = 50;
          }

          player.score += points;
        }

        results.push({
          playerId: player.id,
          playerName: player.name,
          result,
          difference,
          points,
          totalScore: player.score
        });
      }

      // Sort by closest to target
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
      gd.solutions[playerId] = { expression, result };

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
      const { setName, events, correctOrder, timeLimit, round } = data;
      gd.events = events;
      gd.correctOrder = correctOrder;
      gd.submissions = {};
      gd.timeLimit = timeLimit * 1000;
      gd.currentRound = round;
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.setName = setName;

      return {
        broadcast: true,
        event: 'game:round-started',
        data: { setName, events, timeLimit, round }
      };
    }

    case 'select-player': {
      const { playerId } = data;
      const player = room.players.find(p => p.id === playerId);
      if (!player) return null;

      gd.currentPlayer = { id: playerId, name: player.name };
      gd.buzzerQueue = [];

      return {
        broadcast: true,
        event: 'game:player-selected',
        data: {
          playerId,
          playerName: player.name,
          events: gd.events,
          timeLimit: 30
        }
      };
    }

    case 'clear-buzzer': {
      gd.buzzerQueue = [];
      gd.currentPlayer = null;

      return {
        broadcast: true,
        event: 'game:buzzer-cleared',
        data: {}
      };
    }

    case 'reveal-round': {
      const results = [];
      const correctOrder = gd.correctOrder;

      for (const player of room.players) {
        const submission = gd.submissions[player.id];
        let correctCount = 0;
        let points = 0;

        if (submission) {
          // Count correct positions
          for (let i = 0; i < submission.order.length; i++) {
            if (submission.order[i] === correctOrder[i]) {
              correctCount++;
            }
          }

          // Points based on correct count
          points = correctCount * 200;
          if (correctCount === correctOrder.length) {
            points += 500; // Perfect bonus
          }

          player.score += points;
        }

        results.push({
          playerId: player.id,
          playerName: player.name,
          correctCount,
          points,
          totalScore: player.score
        });
      }

      // Sort by correct count
      results.sort((a, b) => b.correctCount - a.correctCount);

      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      return {
        broadcast: true,
        event: 'game:round-revealed',
        data: { results, leaderboard, correctOrder }
      };
    }

    case 'next-round': {
      gd.submissions = {};
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

    case 'end-tidslinje': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
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
    case 'buzz': {
      // Player buzzes in to sort
      if (!gd.buzzerQueue) gd.buzzerQueue = [];
      if (gd.currentPlayer) return null; // Someone is already sorting
      if (gd.buzzerQueue.includes(playerId)) return null; // Already buzzed

      gd.buzzerQueue.push(playerId);

      return {
        broadcast: true,
        event: 'game:player-buzzed',
        data: {
          playerId,
          buzzerQueue: gd.buzzerQueue
        }
      };
    }

    case 'submit-order': {
      // Player submits their sorted order
      if (!gd.currentPlayer || gd.currentPlayer.id !== playerId) return null;

      const { order } = data;
      const correctOrder = gd.correctOrder;

      // Count correct positions
      let correctCount = 0;
      for (let i = 0; i < order.length && i < correctOrder.length; i++) {
        if (order[i] === correctOrder[i]) {
          correctCount++;
        }
      }

      const totalCount = correctOrder.length;
      const isCorrect = correctCount === totalCount;

      // Calculate points
      let points = correctCount * 200;
      if (isCorrect) {
        points += 500; // Perfect bonus
      }

      player.score = (player.score || 0) + points;

      // Create leaderboard
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      gd.currentPlayer = null;

      return {
        broadcast: true,
        event: 'game:sort-result',
        data: {
          playerId,
          playerName: player.name,
          isCorrect,
          correctCount,
          totalCount,
          points,
          correctOrder,
          leaderboard
        }
      };
    }

    case 'submit': {
      // Legacy - redirect to submit-order
      if (gd.submissions[playerId]) return null;

      const { order } = data;
      gd.submissions[playerId] = { order };

      return {
        broadcast: true,
        event: 'game:player-submitted',
        data: {
          playerId,
          playerName: player.name,
          submissionCount: Object.keys(gd.submissions).length
        }
      };
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
