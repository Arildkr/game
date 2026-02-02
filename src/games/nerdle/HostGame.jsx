// game/src/games/nerdle/HostGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRandomEquation } from '../../data/nerdleEquations';
import './Nerdle.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, results
  const [currentEquation, setCurrentEquation] = useState(null);
  const [solvedPlayers, setSolvedPlayers] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerSolved = ({ playerId, playerName, attempts }) => {
      setSolvedPlayers(prev => [...prev, { playerId, playerName, attempts }]);
    };

    const handleRoundEnded = ({ targetEquation, results: roundResults, leaderboard }) => {
      setResults({ targetEquation, results: roundResults, leaderboard });
      setPhase('results');
    };

    socket.on('game:player-solved', handlePlayerSolved);
    socket.on('game:round-ended', handleRoundEnded);

    return () => {
      socket.off('game:player-solved', handlePlayerSolved);
      socket.off('game:round-ended', handleRoundEnded);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const startRound = () => {
    const equation = getRandomEquation();
    setCurrentEquation(equation);
    setSolvedPlayers([]);
    setPhase('playing');

    sendGameAction('start-round', { equation });
  };

  const endRound = () => {
    sendGameAction('end-round');
  };

  const nextRound = () => {
    setRoundNumber(prev => prev + 1);
    setPhase('waiting');
    setResults(null);
    setSolvedPlayers([]);
  };

  return (
    <div className="nerdle-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Nerdle</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-info">Runde {roundNumber}</span>
        </div>
        <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="nerdle-logo">🔢</div>
            <h2>Runde {roundNumber}</h2>
            <p className="description">
              Gjett regnestykket på 8 tegn!<br />
              Bruk tall og operatorene + - * /
            </p>
            <button className="btn btn-start" onClick={startRound}>
              Start runde
            </button>
            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Playing phase */}
        {phase === 'playing' && (
          <div className="playing-phase">
            <div className="equation-hidden">
              <h2>Runden er i gang!</h2>
              <div className="equation-boxes">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="equation-box">?</div>
                ))}
              </div>
              <p className="hint-text">Elevene gjetter nå...</p>
            </div>

            <div className="solved-status">
              <h3>Løst ({solvedPlayers.length}/{connectedPlayers.length})</h3>
              <ul className="solved-list">
                {solvedPlayers.map((sp, i) => (
                  <li key={sp.playerId} className="solved-item">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{sp.playerName}</span>
                    <span className="attempts">{sp.attempts} forsøk</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="btn btn-end-round" onClick={endRound}>
              Avslutt runde
            </button>
          </div>
        )}

        {/* Results phase */}
        {phase === 'results' && results && (
          <div className="results-phase">
            <h2>Fasit</h2>
            <div className="equation-reveal">
              {results.targetEquation.split('').map((char, i) => (
                <div key={i} className="equation-box revealed">{char}</div>
              ))}
            </div>

            <div className="round-results">
              <h3>Resultater</h3>
              <ul className="results-list">
                {results.results.map((r, i) => (
                  <li key={r.playerId} className={`result-item ${r.solved ? 'solved' : 'not-solved'}`}>
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{r.playerName}</span>
                    <span className="status">
                      {r.solved ? `Løst på ${r.attempts} forsøk` : 'Ikke løst'}
                    </span>
                    <span className="points">+{r.points}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="leaderboard">
              <h3>Poengstilling</h3>
              <ul className="leaderboard-list">
                {results.leaderboard.map((p, i) => (
                  <li key={p.playerId} className="leaderboard-item">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{p.playerName}</span>
                    <span className="score">{p.totalScore} poeng</span>
                  </li>
                ))}
              </ul>
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
          {connectedPlayers.map(player => {
            const solved = solvedPlayers.find(sp => sp.playerId === player.id);
            return (
              <li key={player.id} className={`player-item ${solved ? 'solved' : ''}`}>
                <span className="player-name">{player.name}</span>
                {phase === 'playing' && (
                  <span className="player-status">
                    {solved ? '✓' : '...'}
                  </span>
                )}
                <span className="player-score">{player.score || 0}</span>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
