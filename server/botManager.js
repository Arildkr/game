// game/server/botManager.js
// Server-side bot manager for demo mode

const BOT_NAMES = ['Eva', 'Noah', 'Nora', 'Julian', 'Sofie', 'Oliver', 'Ella', 'Filip', 'Maja', 'Liam'];

const WORD_BANK = {
  'A': ['appelsin', 'ananas', 'ape', 'aksel', 'avis', 'arm', 'ant', 'atlas', 'aks'],
  'B': ['banan', 'bjørn', 'bil', 'bok', 'bord', 'brev', 'bukse', 'bro', 'ball'],
  'C': ['camping', 'celle', 'chips', 'cola', 'cykel'],
  'D': ['delfin', 'drage', 'dress', 'due', 'dal', 'dør', 'drill', 'dukke'],
  'E': ['elefant', 'eple', 'edderkopp', 'ekorn', 'eng', 'esel', 'elv'],
  'F': ['fisk', 'fjell', 'flamingo', 'flue', 'frosk', 'fot', 'fly', 'fest'],
  'G': ['giraff', 'glass', 'gate', 'gris', 'gull', 'gress', 'gave'],
  'H': ['hund', 'hest', 'hus', 'hagle', 'hav', 'hjort', 'hammer'],
  'I': ['is', 'insekt', 'iglo', 'idrett', 'ild'],
  'J': ['jord', 'juice', 'jul', 'jakke', 'jente'],
  'K': ['katt', 'kake', 'klokke', 'ku', 'kano', 'kopp', 'kjole', 'kylling'],
  'L': ['løve', 'lampe', 'lek', 'luft', 'laks', 'lov', 'lue'],
  'M': ['mus', 'melk', 'mat', 'mark', 'maur', 'måke', 'mann'],
  'N': ['nese', 'natt', 'nøkkel', 'neve', 'nål', 'ninja'],
  'O': ['oransje', 'orm', 'ost', 'okse', 'ordbok'],
  'P': ['panda', 'pizza', 'piano', 'pumpe', 'pære', 'pingvin', 'pil'],
  'R': ['rev', 'ring', 'rose', 'rotte', 'regn', 'ris', 'rør'],
  'S': ['slange', 'sol', 'skog', 'sykkel', 'stein', 'stol', 'sau', 'sopp'],
  'T': ['tiger', 'tog', 'tre', 'tann', 'teppe', 'troll', 'tavle'],
  'U': ['ugle', 'ur', 'ulv', 'underbukse', 'utedo'],
  'V': ['vann', 'vegg', 'vind', 'vogn', 'veps', 'vulkan'],
  'W': ['waffle', 'wifi'],
  'Y': ['yoghurt', 'yacht'],
  'Æ': ['ærfugl', 'æsel'],
  'Ø': ['øgle', 'ørn', 'øks', 'øy', 'øre'],
  'Å': ['ål', 'åker', 'årstid', 'ånd']
};

// Pre-made valid Nerdle equations (8 chars, left=right)
const NERDLE_EQUATIONS = [
  '12+34=46', '56-12=44', '9*8-7=65', '15+27=42', '48/6+2=10',
  '23+19=42', '7*9-8=55', '36/4+1=10', '18+24=42', '50-17=33',
  '6*7+3=45', '99-54=45', '32+16=48', '45/9+5=10', '8*6-3=45',
  '11+78=89', '64/8+2=10', '25+38=63', '7*8-6=50', '43+29=72'
];

// Drawing guess words for Tegn Det
const DRAWING_GUESS_WORDS = [
  'hund', 'katt', 'bil', 'hus', 'tre', 'blomst', 'sol', 'fisk',
  'fugl', 'bok', 'stol', 'bord', 'ball', 'sykkel', 'fly', 'tog',
  'båt', 'sko', 'gris', 'ku', 'slange', 'mus', 'eple', 'kake'
];

export class BotManager {
  constructor(io, rooms, handlePlayerAction) {
    this.io = io;
    this.rooms = rooms;
    this.handlePlayerAction = handlePlayerAction;
    this.botTimers = new Map(); // roomCode -> [timeoutIds]
    this.botIds = new Map();   // roomCode -> [botIds]
  }

  /**
   * Enable demo mode - add bot players to room
   */
  enableDemo(roomCode, count = 5) {
    const room = this.rooms[roomCode];
    if (!room) return null;

    // Clean up any existing bots first
    this.disableDemo(roomCode);

    const botIds = [];
    const usedNames = room.players.map(p => p.name);

    for (let i = 0; i < count; i++) {
      const botId = `bot_${i + 1}`;
      // Pick a name not already used
      let name = BOT_NAMES[i] || `Bot ${i + 1}`;
      if (usedNames.includes(name)) {
        name = `${name} (bot)`;
      }
      usedNames.push(name);

      room.players.push({
        id: botId,
        name: name,
        score: 0,
        isConnected: true,
        isEliminated: false,
        isBot: true
      });

      botIds.push(botId);
    }

    this.botIds.set(roomCode, botIds);
    this.botTimers.set(roomCode, []);

    return { botIds, players: room.players };
  }

  /**
   * Disable demo mode - remove bots and clear timers
   */
  disableDemo(roomCode) {
    // Clear all pending timers
    const timers = this.botTimers.get(roomCode) || [];
    timers.forEach(t => clearTimeout(t));
    this.botTimers.delete(roomCode);

    // Remove bot players from room
    const room = this.rooms[roomCode];
    if (room) {
      room.players = room.players.filter(p => !p.id.startsWith('bot_'));
    }

    this.botIds.delete(roomCode);
    return room;
  }

  /**
   * Check if demo is active for a room
   */
  isDemoActive(roomCode) {
    return this.botIds.has(roomCode) && this.botIds.get(roomCode).length > 0;
  }

  /**
   * Get bot IDs for a room
   */
  getBotIds(roomCode) {
    return this.botIds.get(roomCode) || [];
  }

  /**
   * Execute a bot action (call handlePlayerAction and emit results)
   */
  executeBotAction(roomCode, botId, action, data) {
    try {
      const result = this.handlePlayerAction(roomCode, botId, action, data);
      if (!result) return;

      if (result.broadcast) {
        this.io.to(roomCode).emit(result.event, result.data);
        // Trigger other bots to respond to this broadcast
        this.onGameEvent(roomCode, result.event, result.data);
      }
      if (result.toHost) {
        const room = this.rooms[roomCode];
        if (room) {
          this.io.to(room.hostId).emit(result.hostEvent, result.hostData);
        }
      }
      // toPlayer ignored - bots don't need feedback
    } catch (err) {
      console.error(`Bot ${botId} action error:`, err.message);
    }
  }

  /**
   * Schedule a bot action with random delay
   */
  scheduleAction(roomCode, botId, action, data, minDelay, maxDelay) {
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timer = setTimeout(() => {
      // Verify room and demo still exist
      if (!this.rooms[roomCode] || !this.isDemoActive(roomCode)) return;
      this.executeBotAction(roomCode, botId, action, data);
    }, delay);

    const timers = this.botTimers.get(roomCode) || [];
    timers.push(timer);
    this.botTimers.set(roomCode, timers);
  }

  /**
   * Router: handle game events and trigger appropriate bot behavior
   */
  onGameEvent(roomCode, event, data) {
    if (!this.isDemoActive(roomCode)) return;

    const room = this.rooms[roomCode];
    if (!room) return;

    const botIds = this.getBotIds(roomCode);
    const activeBots = botIds.filter(id => {
      const player = room.players.find(p => p.id === id);
      return player && !player.isEliminated && player.isConnected;
    });

    switch (room.game) {
      case 'ja-eller-nei':
        this.handleJaEllerNeiBots(roomCode, event, data, activeBots);
        break;
      case 'vil-du-heller':
        this.handleVilDuHellerBots(roomCode, event, data, activeBots);
        break;
      case 'quiz':
        this.handleQuizBots(roomCode, event, data, activeBots);
        break;
      case 'tallkamp':
        this.handleTallkampBots(roomCode, event, data, activeBots);
        break;
      case 'tidslinje':
        this.handleTidslinjeBots(roomCode, event, data, activeBots);
        break;
      case 'slange':
        this.handleSlangeBots(roomCode, event, data, activeBots);
        break;
      case 'gjett-bildet':
        this.handleGjettBildetBots(roomCode, event, data, activeBots);
        break;
      case 'hva-mangler':
        this.handleHvaManglerBots(roomCode, event, data, activeBots);
        break;
      case 'nerdle':
        this.handleNerdleBots(roomCode, event, data, activeBots);
        break;
      case 'tegn-det':
        this.handleTegnDetBots(roomCode, event, data, activeBots);
        break;
      case 'squiggle-story':
        this.handleSquiggleStoryBots(roomCode, event, data, activeBots);
        break;
    }
  }

  // ==================
  // JA ELLER NEI
  // ==================
  handleJaEllerNeiBots(roomCode, event, data, botIds) {
    if (event !== 'game:question-shown') return;

    for (const botId of botIds) {
      // 60% chance of correct answer (we don't know the correct answer, so random)
      const answer = Math.random() < 0.5 ? 'yes' : 'no';
      this.scheduleAction(roomCode, botId, 'answer', { answer }, 2000, 5000);
    }
  }

  // ==================
  // VIL DU HELLER
  // ==================
  handleVilDuHellerBots(roomCode, event, data, botIds) {
    if (event !== 'game:question-shown') return;

    for (const botId of botIds) {
      const choice = Math.random() < 0.5 ? 'optionA' : 'optionB';
      this.scheduleAction(roomCode, botId, 'vote', { choice }, 2000, 4000);
    }
  }

  // ==================
  // QUIZ
  // ==================
  handleQuizBots(roomCode, event, data, botIds) {
    if (event !== 'game:question-shown') return;

    for (const botId of botIds) {
      let answer;
      if (data.options && Array.isArray(data.options)) {
        // Multiple choice - pick random option text
        const idx = Math.floor(Math.random() * data.options.length);
        answer = data.options[idx];
      } else {
        // Free text - just submit something generic
        answer = 'svar';
      }
      this.scheduleAction(roomCode, botId, 'answer', { answer }, 3000, 8000);
    }
  }

  // ==================
  // TALLKAMP
  // ==================
  handleTallkampBots(roomCode, event, data, botIds) {
    if (event !== 'game:round-started') return;

    const { numbers, target } = data;
    if (!numbers || numbers.length < 2) return;

    for (const botId of botIds) {
      // Build a simple expression from 2-3 available numbers
      const expression = this._buildSimpleExpression(numbers, target);
      this.scheduleAction(roomCode, botId, 'submit', { expression }, 5000, 15000);
    }
  }

  _buildSimpleExpression(numbers, target) {
    // Try simple two-number combinations
    const ops = ['+', '-', '*'];
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);

    // Try to find something close to target
    for (let i = 0; i < Math.min(shuffled.length, 3); i++) {
      for (let j = i + 1; j < Math.min(shuffled.length, 4); j++) {
        const a = shuffled[i];
        const b = shuffled[j];
        for (const op of ops) {
          let result;
          if (op === '+') result = a + b;
          else if (op === '-') result = a - b;
          else result = a * b;

          if (Math.abs(result - target) < 20) {
            return `${a}${op}${b}`;
          }
        }
      }
    }

    // Fallback: just add first two numbers
    return `${shuffled[0]}+${shuffled[1]}`;
  }

  // ==================
  // TIDSLINJE
  // ==================
  handleTidslinjeBots(roomCode, event, data, botIds) {
    if (event !== 'game:round-started') return;

    const { events } = data;
    if (!events || events.length === 0) return;

    for (const botId of botIds) {
      // Create a nearly-correct order (1-3 random swaps)
      const order = events.map((_, i) => i);
      const swaps = 1 + Math.floor(Math.random() * 3);
      for (let s = 0; s < swaps; s++) {
        const a = Math.floor(Math.random() * order.length);
        const b = Math.floor(Math.random() * order.length);
        [order[a], order[b]] = [order[b], order[a]];
      }
      this.scheduleAction(roomCode, botId, 'lock-answer', { order }, 5000, 12000);
    }
  }

  // ==================
  // SLANGE
  // ==================
  handleSlangeBots(roomCode, event, data, botIds) {
    // Bots respond when a word is approved (new letter available) or game starts
    if (event !== 'game:word-approved' && event !== 'game:started') return;

    const room = this.rooms[roomCode];
    if (!room || !room.gameData) return;

    const letter = room.gameData.currentLetter;
    if (!letter) return;

    // Only 1-2 bots buzz per round
    const buzzerCount = 1 + Math.floor(Math.random() * 2);
    const shuffledBots = [...botIds].sort(() => Math.random() - 0.5);
    const buzzingBots = shuffledBots.slice(0, buzzerCount);

    for (const botId of buzzingBots) {
      // First buzz
      this.scheduleAction(roomCode, botId, 'buzz', {}, 3000, 8000);

      // Then submit a word after a short delay
      const words = WORD_BANK[letter.toUpperCase()] || WORD_BANK['S'] || ['sol'];
      const usedWords = room.gameData.usedWords instanceof Set
        ? room.gameData.usedWords
        : new Set(room.gameData.usedWordsArray || []);

      // Pick a word not yet used
      const available = words.filter(w => !usedWords.has(w.toLowerCase()));
      const word = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : words[Math.floor(Math.random() * words.length)];

      this.scheduleAction(roomCode, botId, 'submit-word', { word }, 5000, 12000);
    }
  }

  // ==================
  // GJETT BILDET
  // ==================
  handleGjettBildetBots(roomCode, event, data, botIds) {
    if (event !== 'game:reveal-step') return;

    const room = this.rooms[roomCode];
    if (!room || !room.gameData) return;

    // Only some bots try to buzz (1-2 per reveal)
    const buzzerCount = Math.random() < 0.3 ? 1 : 0; // Low chance per reveal
    if (buzzerCount === 0) return;

    const shuffledBots = [...botIds].sort(() => Math.random() - 0.5);
    const buzzBot = shuffledBots[0];

    // Check if locked out
    const gd = room.gameData;
    if (gd.lockedOutPlayers && gd.lockedOutPlayers.includes(buzzBot)) return;
    if (gd.currentPlayer) return;

    this.scheduleAction(roomCode, buzzBot, 'buzz', {}, 3000, 6000);

    // Submit a guess after buzzing
    const answers = gd.currentImageAnswers || [];
    let guess;
    if (answers.length > 0 && Math.random() < 0.4) {
      // 40% chance of correct guess
      guess = answers[0];
    } else {
      guess = 'noe annet';
    }
    this.scheduleAction(roomCode, buzzBot, 'submit-guess', { guess }, 5000, 9000);
  }

  // ==================
  // HVA MANGLER
  // ==================
  handleHvaManglerBots(roomCode, event, data, botIds) {
    if (event !== 'game:changed-shown') return;

    const room = this.rooms[roomCode];
    if (!room || !room.gameData) return;

    // 1-2 bots buzz
    const buzzerCount = 1 + Math.floor(Math.random() * 2);
    const shuffledBots = [...botIds].sort(() => Math.random() - 0.5);
    const buzzingBots = shuffledBots.slice(0, buzzerCount);

    for (const botId of buzzingBots) {
      this.scheduleAction(roomCode, botId, 'buzz', {}, 3000, 6000);

      // Guess from objects list if available
      const objects = room.gameData.currentImage?.objects || [];
      const guess = objects.length > 0
        ? objects[Math.floor(Math.random() * objects.length)]
        : 'stolen';
      this.scheduleAction(roomCode, botId, 'submit-guess', { guess }, 5000, 9000);
    }
  }

  // ==================
  // NERDLE
  // ==================
  handleNerdleBots(roomCode, event, data, botIds) {
    if (event !== 'game:round-started') return;

    for (const botId of botIds) {
      // Each bot makes 2-4 attempts over 10-30 seconds
      const attempts = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < attempts; i++) {
        const equation = NERDLE_EQUATIONS[Math.floor(Math.random() * NERDLE_EQUATIONS.length)];
        const delay = (i + 1) * (3000 + Math.random() * 7000);
        this.scheduleAction(roomCode, botId, 'submit-guess', { guess: equation }, delay, delay + 1000);
      }
    }
  }

  // ==================
  // TEGN DET
  // ==================
  handleTegnDetBots(roomCode, event, data, botIds) {
    const room = this.rooms[roomCode];
    if (!room || !room.gameData) return;

    // When a bot is selected as drawer, auto-select a word
    if (event === 'game:drawer-selected') {
      const { drawerId } = data;
      if (botIds.includes(drawerId)) {
        const wordOptions = room.gameData.wordOptions || [];
        if (wordOptions.length > 0) {
          const word = wordOptions[Math.floor(Math.random() * wordOptions.length)];
          this.scheduleAction(roomCode, drawerId, 'select-word', { word }, 1500, 3000);
        }
      }
      return;
    }

    if (event !== 'game:round-started') return;

    // Bots that are not the drawer - guess
    const nonDrawerBots = botIds.filter(id => id !== room.gameData.drawerId);

    for (const botId of nonDrawerBots) {
      // Make 2-4 guesses over time
      const guessCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < guessCount; i++) {
        const guess = DRAWING_GUESS_WORDS[Math.floor(Math.random() * DRAWING_GUESS_WORDS.length)];
        const delay = (i + 1) * (3000 + Math.random() * 4000);
        this.scheduleAction(roomCode, botId, 'submit-guess', { guess }, delay, delay + 2000);
      }
    }
  }

  // ==================
  // SQUIGGLE STORY
  // ==================
  handleSquiggleStoryBots(roomCode, event, data, botIds) {
    if (event === 'game:round-started') {
      // Submit a placeholder drawing
      for (const botId of botIds) {
        // Simple placeholder - a small canvas data URL
        const imageData = this._createPlaceholderDrawing();
        this.scheduleAction(roomCode, botId, 'submit-drawing', { imageData }, 5000, 15000);
      }
    } else if (event === 'game:voting-started') {
      // Submit random votes
      const submissions = data.submissions || [];
      for (const botId of botIds) {
        // Vote for random submissions (not self)
        const validTargets = submissions
          .filter(s => s.playerId !== botId)
          .map(s => s.playerId);

        if (validTargets.length > 0) {
          const voteCount = Math.min(2, validTargets.length);
          const shuffled = [...validTargets].sort(() => Math.random() - 0.5);
          const votedFor = shuffled.slice(0, voteCount);
          this.scheduleAction(roomCode, botId, 'submit-votes', { votedFor }, 3000, 8000);
        }
      }
    }
  }

  _createPlaceholderDrawing() {
    // Return a minimal valid data URL (1x1 pixel transparent PNG)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  /**
   * Cleanup when room is closed
   */
  cleanup(roomCode) {
    const timers = this.botTimers.get(roomCode) || [];
    timers.forEach(t => clearTimeout(t));
    this.botTimers.delete(roomCode);
    this.botIds.delete(roomCode);
  }
}
