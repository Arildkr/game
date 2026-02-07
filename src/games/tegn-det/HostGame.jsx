// game/src/games/tegn-det/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRandomWords } from '../../data/tegnDetWords';
import DrawingCanvas from './DrawingCanvas';
import './TegnDet.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer } = useGame();

  const [phase, setPhase] = useState('setup'); // setup, waitingForWord, drawing, result
  const [currentWord, setCurrentWord] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [strokes, setStrokes] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [roundNumber, setRoundNumber] = useState(1);

  // Round tracking - who has drawn this cycle
  const [playersWhoHaveDrawn, setPlayersWhoHaveDrawn] = useState([]);
  const [cycleNumber, setCycleNumber] = useState(1);

  // Timer
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const connectedPlayers = players.filter(p => p.isConnected);

  // Timer effect
  useEffect(() => {
    if (phase === 'drawing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'drawing' && timeLeft === 0 && timeLimit > 0) {
      // Time's up - skip round
      sendGameAction('end-round');
      setLastResult({
        type: 'timeout',
        word: currentWord
      });
      setPhase('result');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase, timeLimit, currentWord, sendGameAction]);

  useEffect(() => {
    if (!socket) return;

    const handleDrawingUpdate = ({ stroke }) => {
      setStrokes(prev => [...prev, stroke]);
    };

    const handleCanvasCleared = () => {
      setStrokes([]);
    };

    const handleCorrectGuess = ({ playerId, playerName, word, guesserPoints, drawerPoints, players: updatedPlayers }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrentWord(word);
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
      setLastResult({
        type: 'wrong',
        playerName
      });
      // Clear wrong result after 2 seconds
      setTimeout(() => {
        if (phase === 'drawing') setLastResult(null);
      }, 2000);
    };

    // When drawer selects a word and round starts
    const handleRoundStarted = ({ drawerId, drawerName, wordForDrawer }) => {
      setStrokes([]);
      setLastResult(null);
      setPhase('drawing');
      setTimeLeft(timeLimit);
    };

    socket.on('game:drawing-update', handleDrawingUpdate);
    socket.on('game:canvas-cleared', handleCanvasCleared);
    socket.on('game:correct-guess', handleCorrectGuess);
    socket.on('game:wrong-guess', handleWrongGuess);
    socket.on('game:round-started', handleRoundStarted);

    return () => {
      socket.off('game:drawing-update', handleDrawingUpdate);
      socket.off('game:canvas-cleared', handleCanvasCleared);
      socket.off('game:correct-guess', handleCorrectGuess);
      socket.off('game:wrong-guess', handleWrongGuess);
      socket.off('game:round-started', handleRoundStarted);
    };
  }, [socket, phase, timeLimit]);

  const selectDrawer = () => {
    if (connectedPlayers.length === 0) return;

    // Find players who haven't drawn yet this cycle
    const availablePlayers = connectedPlayers.filter(
      p => !playersWhoHaveDrawn.includes(p.id)
    );

    let nextDrawer;
    let newCycle = false;

    if (availablePlayers.length === 0) {
      // Everyone has drawn - start new cycle
      setPlayersWhoHaveDrawn([]);
      setCycleNumber(prev => prev + 1);
      nextDrawer = connectedPlayers[0];
      newCycle = true;
    } else {
      nextDrawer = availablePlayers[0];
    }

    setDrawer(nextDrawer);
    setPlayersWhoHaveDrawn(prev => newCycle ? [nextDrawer.id] : [...prev, nextDrawer.id]);
    setPhase('waitingForWord');

    // Send word options to the drawer (student)
    const wordOptions = getRandomWords(3, difficulty);
    sendGameAction('select-drawer', {
      drawerId: nextDrawer.id,
      drawerName: nextDrawer.name,
      wordOptions,
      timeLimit
    });
  };

  const nextRound = () => {
    setRoundNumber(prev => prev + 1);
    setPhase('setup');
    setStrokes([]);
    setCurrentWord(null);
    setLastResult(null);
    setTimeLeft(0);
  };

  const skipRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sendGameAction('end-round');
    setLastResult({
      type: 'skipped',
      word: currentWord
    });
    setPhase('result');
  };

  // Calculate who's next in queue
  const getDrawerQueue = () => {
    const available = connectedPlayers.filter(
      p => !playersWhoHaveDrawn.includes(p.id)
    );
    if (available.length === 0) {
      return connectedPlayers; // New cycle
    }
    return available;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
  };

  return (
    <div className="tegndet-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Tegn det!</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-info">Runde {roundNumber} (Syklus {cycleNumber})</span>
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
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="time-select"
            disabled={phase !== 'setup'}
          >
            <option value={0}>Ingen tidsfrist</option>
            <option value={30}>30 sekunder</option>
            <option value={60}>60 sekunder</option>
            <option value={90}>90 sekunder</option>
            <option value={120}>2 minutter</option>
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

            <div className="drawer-queue">
              <p className="queue-label">Neste i køen:</p>
              <div className="queue-list">
                {getDrawerQueue().slice(0, 5).map((p, i) => (
                  <span key={p.id} className={`queue-player ${i === 0 ? 'next' : ''}`}>
                    {i === 0 ? '➤ ' : ''}{p.name}
                  </span>
                ))}
                {getDrawerQueue().length > 5 && <span>...</span>}
              </div>
            </div>

            <button className="btn btn-start" onClick={selectDrawer}>
              Velg tegner
            </button>

            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Waiting for drawer to select word */}
        {phase === 'waitingForWord' && drawer && (
          <div className="waiting-word-phase">
            <div className="setup-icon">🎨</div>
            <h2>{drawer.name} velger ord...</h2>
            <p className="description">Venter på at {drawer.name} skal velge et ord å tegne</p>
          </div>
        )}

        {/* Drawing phase */}
        {phase === 'drawing' && (
          <div className="drawing-phase">
            <div className="drawing-header">
              <div className="drawer-info">
                <span className="drawer-name">{drawer?.name}</span> tegner
              </div>
              {timeLimit > 0 && (
                <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            <DrawingCanvas
              isDrawer={false}
              strokes={strokes}
              width={500}
              height={400}
            />

            {lastResult && lastResult.type === 'wrong' && (
              <div className="wrong-result">
                {lastResult.playerName} gjettet feil! (10 sek karantene)
              </div>
            )}

            {lastResult && lastResult.type === 'correct' && (
              <div className="correct-result">
                {lastResult.playerName} gjettet riktig!
              </div>
            )}

            <button className="btn btn-skip" onClick={skipRound}>
              Hopp over (vis fasit)
            </button>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && lastResult && (
          <div className="result-phase">
            {lastResult.type === 'correct' ? (
              <>
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
              </>
            ) : lastResult.type === 'timeout' ? (
              <>
                <div className="result-icon">⏱️</div>
                <h2>Tiden er ute!</h2>
                <div className="result-word">Ordet var: <strong>{lastResult.word || 'ukjent'}</strong></div>
              </>
            ) : (
              <>
                <div className="result-icon">⏭️</div>
                <h2>Runde hoppet over</h2>
                <div className="result-word">Ordet var: <strong>{lastResult.word || 'ukjent'}</strong></div>
              </>
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
          {connectedPlayers
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(player => (
              <li
                key={player.id}
                className={`player-item ${player.id === drawer?.id ? 'is-drawer' : ''} ${playersWhoHaveDrawn.includes(player.id) ? 'has-drawn' : ''}`}
              >
                <span className="player-name">
                  {player.id === drawer?.id && '🎨 '}
                  {playersWhoHaveDrawn.includes(player.id) && !drawer?.id === player.id && '✓ '}
                  {player.name}
                </span>
                <span className="player-score">{player.score || 0}</span>
                <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern spiller">✕</button>
              </li>
            ))}
        </ul>
        <div className="cycle-info">
          Tegnet denne syklus: {playersWhoHaveDrawn.length}/{connectedPlayers.length}
        </div>
      </aside>
    </div>
  );
}

export default HostGame;
