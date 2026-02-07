// game/src/games/hva-mangler/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getImageSets, generateRound } from '../../data/hvaManglerImages';
import './HvaMangler.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer } = useGame();

  const [phase, setPhase] = useState('setup'); // setup, memorize, black, guess, reveal
  const [currentRound, setCurrentRound] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [selectedSet, setSelectedSet] = useState('');
  const [objectCount, setObjectCount] = useState(6);
  const [memorizeDuration, setMemorizeDuration] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pendingGuess, setPendingGuess] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [guessTimeLimit, setGuessTimeLimit] = useState(60);
  const [guessTimeLeft, setGuessTimeLeft] = useState(0);

  const timerRef = useRef(null);
  const guessTimerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerBuzzed = ({ playerId, buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handleGuessSubmitted = ({ playerId, guess }) => {
      setPendingGuess({ playerId, guess });
    };

    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:guess-submitted', handleGuessSubmitted);

    return () => {
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:guess-submitted', handleGuessSubmitted);
    };
  }, [socket]);

  // Timer effect for memorize/black phases
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase === 'memorize') {
      // Auto-transition to black screen
      startBlackScreen();
    } else if (timeLeft === 0 && phase === 'black') {
      // Auto-transition to guess phase
      showChangedImage();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase]);

  // Timer effect for guess phase
  useEffect(() => {
    if (phase === 'guess' && guessTimeLeft > 0) {
      guessTimerRef.current = setTimeout(() => {
        setGuessTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'guess' && guessTimeLeft === 0 && guessTimeLimit > 0) {
      // Time's up - reveal answer
      setPhase('reveal');
    }

    return () => {
      if (guessTimerRef.current) clearTimeout(guessTimerRef.current);
    };
  }, [guessTimeLeft, phase, guessTimeLimit]);

  const imageSets = getImageSets();
  const connectedPlayers = players.filter(p => p.isConnected);

  const startRound = () => {
    const round = generateRound(selectedSet || null, objectCount);
    setCurrentRound(round);
    setBuzzerQueue([]);
    setCurrentPlayer(null);
    setPendingGuess(null);
    setLastResult(null);
    setPhase('memorize');
    setTimeLeft(memorizeDuration);

    sendGameAction('start-memorize', {
      image: null, // We use emoji-based display
      objects: round.allObjects,
      removedObject: round.removedObject,
      removedObjectImage: null,
      duration: memorizeDuration,
      emojis: round.emojis
    });
  };

  const startBlackScreen = () => {
    setPhase('black');
    setTimeLeft(3);

    sendGameAction('show-black', { duration: 3 });
  };

  const showChangedImage = () => {
    setPhase('guess');
    setGuessTimeLeft(guessTimeLimit);

    sendGameAction('show-changed', { timeLimit: guessTimeLimit });
  };

  const [answerTimeLeft, setAnswerTimeLeft] = useState(15);

  const selectPlayer = (playerId) => {
    const player = players.find(p => p.id === playerId);
    setCurrentPlayer({ id: playerId, name: player?.name });
    setBuzzerQueue(prev => prev.filter(id => id !== playerId));
    setAnswerTimeLeft(15);

    sendGameAction('select-player', { playerId });
  };

  // Nedtelling for svarfrist
  useEffect(() => {
    if (currentPlayer && answerTimeLeft > 0 && !pendingGuess) {
      const timer = setTimeout(() => setAnswerTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, answerTimeLeft, pendingGuess]);

  // Auto-reject når svarfristen utløper
  useEffect(() => {
    if (currentPlayer && answerTimeLeft === 0 && !pendingGuess) {
      sendGameAction('validate-guess', {
        playerId: currentPlayer.id,
        isCorrect: false,
        answer: currentRound?.removedObject,
        playerName: currentPlayer.name
      });
      setCurrentPlayer(null);
    }
  }, [currentPlayer, answerTimeLeft, pendingGuess]);

  // Fuzzy match function
  const isFuzzyMatch = (guess, answer) => {
    const g = guess.toLowerCase().trim();
    const a = answer.toLowerCase().trim();

    // Exact match
    if (g === a) return true;

    // Very short guess, need exact
    if (g.length < 3) return false;

    // Starts with or contains
    if (a.startsWith(g) || g.startsWith(a)) return true;
    if (a.includes(g) || g.includes(a)) return true;

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
    // Allow 1 error for short words, 2 for medium, 3 for long
    const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : 3;
    return dist <= threshold;
  };

  // Auto-check guess when it comes in
  useEffect(() => {
    if (pendingGuess && currentRound) {
      const guess = pendingGuess.guess;
      const answer = currentRound.removedObject;

      const isCorrect = isFuzzyMatch(guess, answer);

      // Auto-validate
      sendGameAction('validate-guess', {
        playerId: pendingGuess.playerId,
        isCorrect
      });

      const player = players.find(p => p.id === pendingGuess.playerId);
      setLastResult({
        playerId: pendingGuess.playerId,
        playerName: player?.name,
        isCorrect,
        guess: pendingGuess.guess,
        answer: currentRound.removedObject
      });

      setCurrentPlayer(null);
      setPendingGuess(null);

      if (isCorrect) {
        // Short delay before showing reveal phase
        setTimeout(() => setPhase('reveal'), 1500);
      }
    }
  }, [pendingGuess, currentRound, players, sendGameAction]);

  const validateGuess = (isCorrect) => {
    const playerId = currentPlayer?.id || pendingGuess?.playerId;

    sendGameAction('validate-guess', {
      playerId,
      isCorrect
    });

    setLastResult({
      playerId,
      playerName: currentPlayer?.name,
      isCorrect,
      answer: currentRound?.removedObject
    });

    setCurrentPlayer(null);
    setPendingGuess(null);

    if (isCorrect) {
      setPhase('reveal');
    }
  };

  const nextRound = () => {
    setRoundNumber(prev => prev + 1);
    setPhase('setup');
    setCurrentRound(null);
    setBuzzerQueue([]);
    setLastResult(null);

    sendGameAction('next-image');
  };

  const skipToBuzzer = () => {
    if (phase === 'memorize') {
      setTimeLeft(0);
    }
  };

  // Render emoji grid
  const renderEmojiGrid = (objects, emojis, hiddenObject = null) => {
    return (
      <div className="emoji-grid">
        {objects.map((obj, i) => (
          <div
            key={i}
            className={`emoji-item ${obj === hiddenObject ? 'hidden' : ''}`}
          >
            <span className="emoji">{emojis[obj]}</span>
            <span className="label">{obj}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="hvamangler-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Hva mangler?</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-info">Runde {roundNumber}</span>
        </div>
        <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Setup phase */}
        {phase === 'setup' && (
          <div className="setup-phase">
            <div className="setup-icon">👁️</div>
            <h2>Runde {roundNumber}</h2>

            <div className="setup-options">
              <div className="option-group">
                <label>Kategori:</label>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="">Tilfeldig</option>
                  {imageSets.map(set => (
                    <option key={set.id} value={set.id}>{set.name}</option>
                  ))}
                </select>
              </div>

              <div className="option-group">
                <label>Antall gjenstander:</label>
                <select
                  value={objectCount}
                  onChange={(e) => setObjectCount(Number(e.target.value))}
                >
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                  <option value={11}>11</option>
                  <option value={12}>12</option>
                </select>
              </div>

              <div className="option-group">
                <label>Memoreringstid:</label>
                <select
                  value={memorizeDuration}
                  onChange={(e) => setMemorizeDuration(Number(e.target.value))}
                >
                  <option value={5}>5 sekunder</option>
                  <option value={10}>10 sekunder</option>
                  <option value={15}>15 sekunder</option>
                  <option value={20}>20 sekunder</option>
                </select>
              </div>

              <div className="option-group">
                <label>Gjettetid:</label>
                <select
                  value={guessTimeLimit}
                  onChange={(e) => setGuessTimeLimit(Number(e.target.value))}
                >
                  <option value={0}>Ingen tidsfrist</option>
                  <option value={30}>30 sekunder</option>
                  <option value={60}>60 sekunder</option>
                  <option value={90}>90 sekunder</option>
                  <option value={120}>2 minutter</option>
                </select>
              </div>
            </div>

            <button className="btn btn-start" onClick={startRound}>
              Start runde
            </button>
            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Memorize phase */}
        {phase === 'memorize' && currentRound && (
          <div className="memorize-phase">
            <div className="phase-header">
              <h2>Memorer gjenstandene!</h2>
              <div className="timer">{timeLeft}</div>
            </div>

            {renderEmojiGrid(currentRound.allObjects, currentRound.emojis)}

            <button className="btn btn-skip" onClick={skipToBuzzer}>
              Hopp over ventetid
            </button>
          </div>
        )}

        {/* Black screen phase */}
        {phase === 'black' && (
          <div className="black-phase">
            <div className="black-screen">
              <div className="timer">{timeLeft}</div>
              <p>Skjermen er svart...</p>
            </div>
          </div>
        )}

        {/* Guess phase */}
        {phase === 'guess' && currentRound && (
          <div className="guess-phase">
            <div className="phase-header">
              <h2>Hva mangler?</h2>
              {guessTimeLimit > 0 && (
                <div className={`timer ${guessTimeLeft <= 10 ? 'warning' : ''}`}>
                  {guessTimeLeft}
                </div>
              )}
            </div>

            {renderEmojiGrid(currentRound.remainingObjects, currentRound.emojis)}

            {/* Current player answering */}
            {currentPlayer && (
              <div className="current-answerer">
                <span className="answerer-icon">🎤</span>
                <span className="answerer-name">{currentPlayer.name}</span>
                <span className={`answerer-timer ${answerTimeLeft <= 5 ? 'urgent' : ''}`}>{answerTimeLeft}s</span>
              </div>
            )}

            {/* Pending guess waiting for validation */}
            {pendingGuess && (
              <div className="pending-guess-display">
                <span className="guess-label">Gjetting:</span>
                <span className="guess-text">"{pendingGuess.guess}"</span>
              </div>
            )}

            {lastResult && (
              <div className={`last-result ${lastResult.isCorrect ? 'correct' : 'wrong'}`}>
                <span className="result-name">{lastResult.playerName}</span>{' '}
                <span className="result-guess">gjettet "{lastResult.guess}"</span>{' '}
                <span className="result-status">{lastResult.isCorrect ? '✓ Riktig!' : '✗ Feil!'}</span>
              </div>
            )}

            {/* Buzzer queue */}
            {!pendingGuess && !currentPlayer && buzzerQueue.length > 0 && (
              <div className="buzzer-queue">
                <h3>Buzzerkø ({buzzerQueue.length}):</h3>
                <div className="queue-list">
                  {buzzerQueue.map((playerId, i) => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <button
                        key={playerId}
                        className="queue-item"
                        onClick={() => selectPlayer(playerId)}
                      >
                        <span className="position">#{i + 1}</span>
                        <span className="name">{player?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!pendingGuess && !currentPlayer && buzzerQueue.length === 0 && (
              <div className="waiting-for-buzz">
                Venter på at noen trykker på buzzeren...
              </div>
            )}

            <button className="btn btn-reveal-answer" onClick={() => setPhase('reveal')}>
              Vis fasit
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && currentRound && (
          <div className="reveal-phase">
            <h2>Fasit</h2>
            <div className="answer-reveal">
              <span className="answer-emoji">{currentRound.emojis[currentRound.removedObject]}</span>
              <span className="answer-text">{currentRound.removedObject}</span>
            </div>

            {lastResult && lastResult.isCorrect && (
              <div className="winner-info">
                <span className="winner-icon">🏆</span>
                <span>{lastResult.playerName} gjettet riktig!</span>
              </div>
            )}

            <button className="btn btn-next" onClick={nextRound}>
              Neste runde
            </button>
          </div>
        )}
      </main>

      {/* Players sidebar */}
      <aside className="players-sidebar">
        <h3>Spillere ({connectedPlayers.length})</h3>
        <ul className="players-list">
          {connectedPlayers.map(player => (
            <li key={player.id} className="player-item">
              <span className="player-name">{player.name}</span>
              <span className="player-score">{player.score || 0}</span>
              <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern spiller">✕</button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
