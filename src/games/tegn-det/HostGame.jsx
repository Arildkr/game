// game/src/games/tegn-det/HostGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRandomWord, getRandomWords } from '../../data/tegnDetWords';
import DrawingCanvas from './DrawingCanvas';
import './TegnDet.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [phase, setPhase] = useState('setup'); // setup, selectWord, drawing, result
  const [currentWord, setCurrentWord] = useState(null);
  const [wordOptions, setWordOptions] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [drawerIndex, setDrawerIndex] = useState(0);
  const [strokes, setStrokes] = useState([]);
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentGuesser, setCurrentGuesser] = useState(null);
  const [pendingGuess, setPendingGuess] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [roundNumber, setRoundNumber] = useState(1);

  const connectedPlayers = players.filter(p => p.isConnected);

  useEffect(() => {
    if (!socket) return;

    const handleDrawingUpdate = ({ stroke }) => {
      setStrokes(prev => [...prev, stroke]);
    };

    const handleCanvasCleared = () => {
      setStrokes([]);
    };

    const handlePlayerBuzzed = ({ playerId, buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handleGuessSubmitted = ({ playerId, guess }) => {
      setPendingGuess({ playerId, guess });
    };

    const handleCorrectGuess = ({ playerId, playerName, word, guesserPoints, drawerPoints }) => {
      setLastResult({
        type: 'correct',
        playerName,
        word,
        guesserPoints,
        drawerPoints
      });
      setPhase('result');
    };

    const handleWrongGuess = ({ playerId, playerName }) => {
      setCurrentGuesser(null);
      setPendingGuess(null);
      setLastResult({
        type: 'wrong',
        playerName
      });
    };

    socket.on('game:drawing-update', handleDrawingUpdate);
    socket.on('game:canvas-cleared', handleCanvasCleared);
    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:guess-submitted', handleGuessSubmitted);
    socket.on('game:correct-guess', handleCorrectGuess);
    socket.on('game:wrong-guess', handleWrongGuess);

    return () => {
      socket.off('game:drawing-update', handleDrawingUpdate);
      socket.off('game:canvas-cleared', handleCanvasCleared);
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:guess-submitted', handleGuessSubmitted);
      socket.off('game:correct-guess', handleCorrectGuess);
      socket.off('game:wrong-guess', handleWrongGuess);
    };
  }, [socket]);

  const selectDrawer = () => {
    if (connectedPlayers.length === 0) return;

    const nextDrawer = connectedPlayers[drawerIndex % connectedPlayers.length];
    setDrawer(nextDrawer);
    setWordOptions(getRandomWords(3, difficulty));
    setPhase('selectWord');
  };

  const selectWord = (word) => {
    setCurrentWord(word);
    setStrokes([]);
    setBuzzerQueue([]);
    setCurrentGuesser(null);
    setPendingGuess(null);
    setLastResult(null);
    setPhase('drawing');

    sendGameAction('start-round', {
      word,
      drawerId: drawer.id
    });
  };

  const selectGuesser = (playerId) => {
    const player = players.find(p => p.id === playerId);
    setCurrentGuesser({ id: playerId, name: player?.name });
    setBuzzerQueue(prev => prev.filter(id => id !== playerId));

    sendGameAction('select-guesser', { playerId });
  };

  const validateGuess = (isCorrect) => {
    const playerId = currentGuesser?.id || pendingGuess?.playerId;

    sendGameAction('validate-guess', {
      playerId,
      isCorrect
    });
  };

  const nextRound = () => {
    setDrawerIndex(prev => prev + 1);
    setRoundNumber(prev => prev + 1);
    setPhase('setup');
    setStrokes([]);
    setCurrentWord(null);
    setBuzzerQueue([]);
    setLastResult(null);
  };

  const skipRound = () => {
    sendGameAction('end-round');
    nextRound();
  };

  return (
    <div className="tegndet-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Tegn det!</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-info">Runde {roundNumber}</span>
        </div>
        <div className="header-actions">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="difficulty-select"
            disabled={phase !== 'setup'}
          >
            <option value="all">Alle nivåer</option>
            <option value="easy">Lett</option>
            <option value="medium">Middels</option>
            <option value="hard">Vanskelig</option>
          </select>
          <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
        </div>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Setup phase */}
        {phase === 'setup' && (
          <div className="setup-phase">
            <div className="setup-icon">🎨</div>
            <h2>Runde {roundNumber}</h2>
            <p className="description">Velg hvem som skal tegne</p>

            <button className="btn btn-start" onClick={selectDrawer}>
              Velg tegner
            </button>

            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Select word phase */}
        {phase === 'selectWord' && drawer && (
          <div className="select-word-phase">
            <h2>{drawer.name} tegner!</h2>
            <p>Velg et ord å tegne:</p>

            <div className="word-options">
              {wordOptions.map((word, i) => (
                <button
                  key={i}
                  className="word-option"
                  onClick={() => selectWord(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drawing phase */}
        {phase === 'drawing' && (
          <div className="drawing-phase">
            <div className="drawing-header">
              <div className="drawer-info">
                <span className="drawer-name">{drawer?.name}</span> tegner
              </div>
              <div className="word-display">
                Ordet: <strong>{currentWord}</strong>
              </div>
            </div>

            <DrawingCanvas
              isDrawer={false}
              strokes={strokes}
              width={600}
              height={400}
            />

            {lastResult && lastResult.type === 'wrong' && (
              <div className="wrong-result">
                {lastResult.playerName} gjettet feil!
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
                        onClick={() => selectGuesser(playerId)}
                      >
                        <span className="position">#{i + 1}</span>
                        <span className="name">{player?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="btn btn-skip" onClick={skipRound}>
              Hopp over
            </button>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && lastResult && (
          <div className="result-phase">
            <div className="result-icon">🎉</div>
            <h2>Riktig!</h2>
            <div className="result-word">Ordet var: <strong>{lastResult.word}</strong></div>
            <div className="result-winner">
              <span className="winner-name">{lastResult.playerName}</span> gjettet riktig!
            </div>
            <div className="points-info">
              <div>Gjetter: +{lastResult.guesserPoints} poeng</div>
              <div>Tegner: +{lastResult.drawerPoints} poeng</div>
            </div>

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
          {connectedPlayers
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(player => (
              <li
                key={player.id}
                className={`player-item ${player.id === drawer?.id ? 'is-drawer' : ''}`}
              >
                <span className="player-name">
                  {player.id === drawer?.id && '🎨 '}
                  {player.name}
                </span>
                <span className="player-score">{player.score || 0}</span>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
