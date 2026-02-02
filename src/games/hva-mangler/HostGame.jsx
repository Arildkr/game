// game/src/games/hva-mangler/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getImageSets, generateRound } from '../../data/hvaManglerImages';
import './HvaMangler.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

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

  const timerRef = useRef(null);

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

  // Timer effect
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

    sendGameAction('show-changed', {});
  };

  const selectPlayer = (playerId) => {
    const player = players.find(p => p.id === playerId);
    setCurrentPlayer({ id: playerId, name: player?.name });
    setBuzzerQueue(prev => prev.filter(id => id !== playerId));

    sendGameAction('select-player', { playerId });
  };

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
            </div>

            {renderEmojiGrid(currentRound.remainingObjects, currentRound.emojis)}

            {lastResult && (
              <div className={`last-result ${lastResult.isCorrect ? 'correct' : 'wrong'}`}>
                {lastResult.playerName}: {lastResult.isCorrect ? 'Riktig!' : 'Feil!'}
              </div>
            )}

            {/* Pending guess */}
            {pendingGuess && (
              <div className="pending-guess">
                <p>
                  <strong>{players.find(p => p.id === pendingGuess.playerId)?.name}</strong> gjetter:
                </p>
                <div className="guess-text">{pendingGuess.guess}</div>
                <div className="guess-buttons">
                  <button className="btn btn-correct" onClick={() => validateGuess(true)}>
                    Riktig ✓
                  </button>
                  <button className="btn btn-wrong" onClick={() => validateGuess(false)}>
                    Feil ✗
                  </button>
                </div>
              </div>
            )}

            {/* Buzzer queue */}
            {!pendingGuess && buzzerQueue.length > 0 && (
              <div className="buzzer-queue">
                <h3>Buzzerkø:</h3>
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
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
