// Klassespill Server - Game State Management

export const rooms = {};
export const socketToRoom = new Map();

// Norwegian alphabet for Slange game (removed difficult letters)
const NORWEGIAN_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWY'.split('');

function getRandomLetter() {
  return NORWEGIAN_LETTERS[Math.floor(Math.random() * NORWEGIAN_LETTERS.length)];
}

function getLastLetter(word) {
  const normalized = word.toUpperCase().trim();
  return normalized[normalized.length - 1];
}

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
        revealStep: 0,
        buzzerQueue: [],
        currentPlayer: null,
        pendingGuess: null,
        category: config.category || 'blanding',
        mode: config.mode || 'blur'
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
        correctOrder: [],
        buzzerQueue: [],
        currentPlayer: null,
        pendingOrder: null,
        currentRound: 1,
        timeLimit: 30000
      };

    case 'slange':
      return {
        currentLetter: getRandomLetter(),
        wordChain: [],
        usedWords: new Set(),
        buzzerQueue: [],
        currentPlayer: null,
        pendingWord: null,
        mode: config.mode || 'samarbeid',
        category: config.category || 'blanding'
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

      const alivePlayers = room.players.filter(p => !p.isEliminated && p.isConnected);
      const answerCount = Object.keys(gd.answers).length;
      const allAnswered = answerCount >= alivePlayers.length;

      return {
        broadcast: true,
        event: 'game:player-answered',
        data: {
          playerId,
          answerCount,
          totalPlayers: alivePlayers.length,
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

// Levenshtein distance for typo tolerance
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Check if answer is correct (with typo tolerance)
function checkQuizAnswer(userAnswer, correctAnswers) {
  const normalized = userAnswer.toLowerCase().trim();
  if (!normalized) return false;

  return correctAnswers.some(answer => {
    const correct = answer.toLowerCase();

    // Exact match
    if (correct === normalized) return true;

    // Contains each other
    if (correct.includes(normalized) || normalized.includes(correct)) {
      const lengthRatio = Math.min(normalized.length, correct.length) / Math.max(normalized.length, correct.length);
      if (lengthRatio >= 0.6) return true;
    }

    // Allow typos based on word length
    const maxDistance = correct.length <= 4 ? 1 : correct.length <= 8 ? 2 : 3;
    const distance = levenshteinDistance(normalized, correct);

    return distance <= maxDistance;
  });
}

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

      return {
        broadcast: true,
        event: 'game:question-shown',
        data: {
          question: question.question,
          questionIndex,
          timeLimit
        }
      };
    }

    case 'reveal-answer': {
      // Host reveals the answer
      gd.showAnswer = true;

      // Defensive check: ensure we have a current question with answers
      const correctAnswers = gd.currentQuestion?.answers || [];
      if (correctAnswers.length === 0) {
        console.error('Quiz reveal-answer: No correct answers found', gd.currentQuestion);
      }

      const results = [];

      // Calculate points for each player
      for (const [playerId, answerData] of Object.entries(gd.answers)) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          const isCorrect = correctAnswers.length > 0 && checkQuizAnswer(answerData.answer, correctAnswers);
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
          correctAnswer: correctAnswers[0] || 'Ukjent svar',
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
      // Player submits their answer (text)
      if (gd.showAnswer) return null; // Too late
      if (gd.answers[playerId]) return null; // Already answered

      const { answer } = data; // Text answer
      const timeTaken = Date.now() - gd.questionStartTime;

      gd.answers[playerId] = {
        answer: answer || '',
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
    case 'reveal-step': {
      const { step } = data;
      gd.revealStep = step;

      return {
        broadcast: true,
        event: 'game:reveal-step',
        data: { step }
      };
    }

    case 'select-player': {
      const { playerId } = data;
      const player = room.players.find(p => p.id === playerId);
      if (!player) return null;

      gd.currentPlayer = { id: playerId, name: player.name };
      gd.buzzerQueue = [];
      gd.pendingGuess = null;

      return {
        broadcast: true,
        event: 'game:player-selected',
        data: { playerId, playerName: player.name }
      };
    }

    case 'validate-guess': {
      const { playerId, isCorrect, correctAnswer } = data;
      const player = room.players.find(p => p.id === playerId);

      let points = 0;
      if (isCorrect && player) {
        // Points based on reveal step (earlier = more points)
        const revealSteps = [10, 20, 35, 50, 70, 85, 100];
        const stepIndex = gd.revealStep || 0;
        points = Math.max(100, 1000 - (stepIndex * 150));
        player.score = (player.score || 0) + points;
      }

      // Reset turn state
      gd.currentPlayer = null;
      gd.pendingGuess = null;

      return {
        broadcast: true,
        event: 'game:guess-result',
        data: {
          playerId,
          isCorrect,
          correctAnswer,
          points,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.score || 0
          }))
        }
      };
    }

    case 'next-image': {
      const { imageIndex } = data;
      gd.currentImageIndex = imageIndex;
      gd.revealStep = 0;
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.pendingGuess = null;

      return {
        broadcast: true,
        event: 'game:next-image',
        data: { imageIndex }
      };
    }

    case 'clear-buzzer': {
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.pendingGuess = null;

      return {
        broadcast: true,
        event: 'game:buzzer-cleared',
        data: {}
      };
    }

    case 'end-gjett-bildet': {
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score || 0 }))
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
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  switch (action) {
    case 'buzz': {
      // Can't buzz if game not playing
      if (room.gameState !== 'PLAYING') return null;

      // Can't buzz if someone is already answering
      if (gd.currentPlayer) return null;

      // Can't buzz if already in queue
      if (gd.buzzerQueue.includes(playerId)) return null;

      gd.buzzerQueue.push(playerId);

      return {
        broadcast: true,
        event: 'game:player-buzzed',
        data: { playerId, playerName: player.name, buzzerQueue: gd.buzzerQueue }
      };
    }

    case 'submit-guess': {
      // Check if it's this player's turn
      if (!gd.currentPlayer || gd.currentPlayer.id !== playerId) {
        return null;
      }

      const { guess } = data;
      gd.pendingGuess = { playerId, guess };

      return {
        broadcast: true,
        event: 'game:guess-submitted',
        data: { playerId, playerName: player.name, guess }
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

      // Beregn differanse fra målet
      const difference = result - gd.targetNumber;

      return {
        broadcast: true,
        event: 'game:player-submitted',
        data: {
          playerId,
          playerName: player.name,
          result,
          difference,
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
      // Host starts a round - send events to all players so they can see before buzzing
      const { setName, events, correctOrder, timeLimit, round } = data;
      gd.events = events;
      gd.correctOrder = correctOrder;
      gd.timeLimit = timeLimit * 1000;
      gd.currentRound = round;
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.pendingOrder = null;

      return {
        broadcast: true,
        event: 'game:round-started',
        data: {
          setName,
          events: events.map(e => ({ id: e.id, text: e.text })), // Send events (without correct order)
          timeLimit,
          round
        }
      };
    }

    case 'select-player': {
      // Host selects a player from the buzzer queue
      const { playerId } = data;
      const player = room.players.find(p => p.id === playerId);
      if (!player) return null;

      gd.currentPlayer = { id: playerId, name: player.name };
      gd.buzzerQueue = [];
      gd.pendingOrder = null;

      return {
        broadcast: true,
        event: 'game:player-selected',
        data: {
          playerId,
          playerName: player.name,
          events: gd.events, // Send events to the selected player
          timeLimit: gd.timeLimit / 1000
        }
      };
    }

    case 'next-round': {
      gd.currentRound++;
      gd.buzzerQueue = [];
      gd.currentPlayer = null;
      gd.pendingOrder = null;

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
      // Can't buzz if game not playing
      if (room.gameState !== 'PLAYING') return null;

      // Can't buzz if someone is already sorting
      if (gd.currentPlayer) return null;

      // Can't buzz if already in queue
      if (gd.buzzerQueue.includes(playerId)) return null;

      gd.buzzerQueue.push(playerId);

      return {
        broadcast: true,
        event: 'game:player-buzzed',
        data: { playerId, playerName: player.name, buzzerQueue: gd.buzzerQueue }
      };
    }

    case 'submit-order': {
      // Check if it's this player's turn
      if (!gd.currentPlayer || gd.currentPlayer.id !== playerId) {
        return null;
      }

      const { order } = data;
      if (!order || order.length !== gd.correctOrder.length) return null;

      // Calculate correctness
      let correctCount = 0;
      for (let i = 0; i < order.length; i++) {
        if (order[i] === gd.correctOrder[i]) {
          correctCount++;
        }
      }

      const totalCount = gd.correctOrder.length;
      const isCorrect = correctCount === totalCount;

      // Award points: 200 per correct position, +500 bonus for perfect
      let points = correctCount * 200;
      if (isCorrect) {
        points += 500;
      }
      player.score += points;

      // Get updated leaderboard
      const leaderboard = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      // Reset turn state
      const sortingPlayer = gd.currentPlayer;
      gd.currentPlayer = null;
      gd.pendingOrder = null;

      return {
        broadcast: true,
        event: 'game:sort-result',
        data: {
          playerId,
          playerName: sortingPlayer.name,
          isCorrect,
          correctCount,
          totalCount,
          points,
          correctOrder: gd.correctOrder,
          leaderboard
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

  switch (action) {
    case 'select-player': {
      const { playerId } = data;
      const player = room.players.find(p => p.id === playerId);
      if (!player) return null;

      gd.currentPlayer = { id: playerId, name: player.name };
      gd.buzzerQueue = [];
      gd.pendingWord = null;

      return {
        broadcast: true,
        event: 'game:player-selected',
        data: { playerId, playerName: player.name }
      };
    }

    case 'approve-word': {
      if (!gd.pendingWord || !gd.currentPlayer) return null;

      const word = gd.pendingWord;
      const playerId = gd.currentPlayer.id;
      const player = room.players.find(p => p.id === playerId);

      // Add word to chain
      gd.wordChain.push({
        word: word,
        playerId: playerId,
        playerName: player?.name || 'Ukjent'
      });

      // Mark word as used
      gd.usedWords.add(word.toLowerCase().trim());

      // Update current letter to last letter of word
      const newLetter = getLastLetter(word);
      gd.currentLetter = newLetter;

      // Update player stats
      if (player) {
        player.wordsSubmitted = (player.wordsSubmitted || 0) + 1;
        if (gd.mode === 'konkurranse') {
          player.score = (player.score || 0) + 10;
        }
      }

      // Reset turn state
      const currentPlayerId = gd.currentPlayer.id;
      gd.currentPlayer = null;
      gd.pendingWord = null;

      // Reset all players' buzz ability
      room.players.forEach(p => p.canBuzz = true);

      return {
        broadcast: true,
        event: 'game:word-approved',
        data: {
          word,
          playerId: currentPlayerId,
          playerName: player?.name,
          newLetter,
          wordChain: gd.wordChain
        }
      };
    }

    case 'reject-word': {
      if (!gd.currentPlayer) return null;

      const playerId = gd.currentPlayer.id;
      const player = room.players.find(p => p.id === playerId);

      // Player can't buzz temporarily
      if (player) {
        player.canBuzz = false;
        if (gd.mode === 'konkurranse') {
          player.score = (player.score || 0) - 5;
        }
      }

      // Reset turn state
      gd.currentPlayer = null;
      gd.pendingWord = null;

      return {
        broadcast: true,
        event: 'game:word-rejected',
        data: { playerId, reason: 'Avslatt av laerer' }
      };
    }

    case 'skip-letter': {
      const oldLetter = gd.currentLetter;
      gd.currentLetter = getRandomLetter();

      // Reset current player and pending word
      gd.currentPlayer = null;
      gd.pendingWord = null;
      gd.buzzerQueue = [];

      // Reset all players' buzz ability
      room.players.forEach(p => p.canBuzz = true);

      return {
        broadcast: true,
        event: 'game:letter-skipped',
        data: { oldLetter, newLetter: gd.currentLetter }
      };
    }

    default:
      return null;
  }
}

function handleSlangePlayerAction(room, playerId, action, data) {
  const gd = room.gameData;
  const player = room.players.find(p => p.id === playerId);

  if (!player) return null;

  switch (action) {
    case 'buzz': {
      // Can't buzz if game not playing
      if (room.gameState !== 'PLAYING') return null;

      // Can't buzz if someone is already answering
      if (gd.currentPlayer) return null;

      // Can't buzz if already in queue
      if (gd.buzzerQueue.includes(playerId)) return null;

      // Can't buzz if player can't buzz (penalty)
      if (player.canBuzz === false) return null;

      gd.buzzerQueue.push(playerId);

      return {
        broadcast: true,
        event: 'game:player-buzzed',
        data: { playerId, playerName: player.name, buzzerQueue: gd.buzzerQueue }
      };
    }

    case 'submit-word': {
      // Check if it's this player's turn
      if (!gd.currentPlayer || gd.currentPlayer.id !== playerId) {
        return null;
      }

      const { word } = data;
      if (!word || word.trim().length < 2) return null;

      const normalizedWord = word.trim();
      const firstLetter = normalizedWord.toUpperCase()[0];

      // Check if word starts with correct letter
      if (firstLetter !== gd.currentLetter) {
        // Auto-reject wrong letter
        player.canBuzz = false;
        if (gd.mode === 'konkurranse') {
          player.score = (player.score || 0) - 10;
        }
        gd.currentPlayer = null;
        gd.pendingWord = null;

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: { playerId, reason: `Ordet ma begynne med ${gd.currentLetter}` }
        };
      }

      // Check if word already used
      if (gd.usedWords.has(normalizedWord.toLowerCase())) {
        // Auto-reject duplicate
        player.canBuzz = false;
        if (gd.mode === 'konkurranse') {
          player.score = (player.score || 0) - 5;
        }
        gd.currentPlayer = null;
        gd.pendingWord = null;

        return {
          broadcast: true,
          event: 'game:word-rejected',
          data: { playerId, reason: 'Ordet er allerede brukt' }
        };
      }

      // Word is valid, send to host for approval
      gd.pendingWord = normalizedWord;

      return {
        broadcast: true,
        event: 'game:word-submitted',
        data: { playerId, playerName: player.name, word: normalizedWord }
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
