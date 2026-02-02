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

    const handleCorrectGuess = ({ playerId, playerName, word, guesserPoints, drawerPoints, players: updatedPlayers }) => {
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
      setTimeout(() => setLastResult(null), 2000);
    };

    socket.on('game:drawing-update', handleDrawingUpdate);
    socket.on('game:canvas-cleared', handleCanvasCleared);
    socket.on('game:correct-guess', handleCorrectGuess);
    socket.on('game:wrong-guess', handleWrongGuess);

    return () => {
      socket.off('game:drawing-update', handleDrawingUpdate);
      socket.off('game:canvas-cleared', handleCanvasCleared);
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
    setLastResult(null);
    setPhase('drawing');

    sendGameAction('start-round', {
      word,
      drawerId: drawer.id
    });
  };

  const nextRound = () => {
    setDrawerIndex(prev => prev + 1);
    setRoundNumber(prev => prev + 1);
    setPhase('setup');
    setStrokes([]);
    setCurrentWord(null);
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
              <div className="word-hint">
                (Ordet vises kun på {drawer?.name} sin skjerm)
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
