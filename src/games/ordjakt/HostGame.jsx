// game/src/games/ordjakt/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Ordjakt.css';

const ROUND_TIME = 120;

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer, gameData } = useGame();

  const [phase, setPhase] = useState('starting'); // starting, playing, finished
  const [letters, setLetters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [wordsByLength, setWordsByLength] = useState({});
  const [totalUniqueWords, setTotalUniqueWords] = useState(0);
  const [ordkongen, setOrdkongen] = useState(null);
  const [ordmaskinen, setOrdmaskinen] = useState(null);
  const timerRef = useRef(null);

  const connectedPlayers = players.filter(p => p.isConnected);

  // Auto-start round when component mounts
  const hasStarted = useRef(false);
  useEffect(() => {
    if (!hasStarted.current && socket) {
      hasStarted.current = true;
      setPhase('playing');
      setTimeLeft(ROUND_TIME);
      sendGameAction('start-round');
      if (gameData?.letters) {
        setLetters(gameData.letters);
      }
    }
  }, [socket, sendGameAction, gameData]);

  // Timer
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'playing' && timeLeft === 0) {
      setPhase('finished');
      sendGameAction('time-up');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase, sendGameAction]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ wordsByLength: wbl, totalUniqueWords: total, ordkongen: ok, ordmaskinen: om }) => {
      setWordsByLength(wbl);
      setTotalUniqueWords(total);
      if (ok) setOrdkongen(ok);
      if (om) setOrdmaskinen(om);
    };

    socket.on('game:ordjakt-update', handleUpdate);
    return () => socket.off('game:ordjakt-update', handleUpdate);
  }, [socket]);

  const startRound = () => {
    setPhase('playing');
    setTimeLeft(ROUND_TIME);
    setWordsByLength({});
    setTotalUniqueWords(0);
    setOrdkongen(null);
    setOrdmaskinen(null);
    sendGameAction('start-round');
    // Get letters from gameData
    if (gameData?.letters) {
      setLetters(gameData.letters);
    }
  };

  const newRound = () => {
    setPhase('playing');
    setTimeLeft(ROUND_TIME);
    setWordsByLength({});
    setTotalUniqueWords(0);
    setOrdkongen(null);
    setOrdmaskinen(null);
    sendGameAction('new-round');
  };

  // Listen for round-started to get letters
  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ letters: l }) => {
      if (l) setLetters(l);
    };

    socket.on('game:round-started', handleRoundStarted);
    return () => socket.off('game:round-started', handleRoundStarted);
  }, [socket]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sort lengths for display
  const sortedLengths = Object.entries(wordsByLength)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <div className="ordjakt-host">
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Ordjakt</span>
          <span className="room-code">Rom: {roomCode}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {phase === 'finished' && (
            <button className="btn-end" style={{ background: '#f59e0b' }} onClick={newRound}>
              Ny runde
            </button>
          )}
          <button className="btn-end" onClick={() => endGame()}>Avslutt</button>
        </div>
      </header>

      <main className="game-main">
        {phase === 'starting' && (
          <div className="waiting-state">
            <div className="waiting-icon">🔍</div>
            <h2>Starter Ordjakt...</h2>
          </div>
        )}

        {(phase === 'playing' || phase === 'finished') && (
          <div className="round-content">
            {/* Letters display */}
            <div className="letters-display">
              {letters.map((letter, i) => (
                <div key={i} className="letter-tile">{letter.toUpperCase()}</div>
              ))}
            </div>

            {/* Timer */}
            <div className={`ordjakt-timer ${timeLeft <= 30 ? 'warning' : ''} ${phase === 'finished' ? 'finished' : ''}`}>
              {phase === 'finished' ? 'Tiden er ute!' : formatTime(timeLeft)}
            </div>

            {/* Stats area */}
            <div className="stats-area">
              {/* Leaderboard titles */}
              <div className="titles-row">
                <div className="title-card ordkongen">
                  <div className="title-label">👑 Ordkongen</div>
                  <div className="title-value">
                    {ordkongen ? (
                      <><span className="title-name">{ordkongen.playerName}</span> <span className="title-detail">({ordkongen.word})</span></>
                    ) : '—'}
                  </div>
                </div>
                <div className="title-card ordmaskinen">
                  <div className="title-label">⚡ Ordmaskinen</div>
                  <div className="title-value">
                    {ordmaskinen ? (
                      <><span className="title-name">{ordmaskinen.playerName}</span> <span className="title-detail">({ordmaskinen.count} ord)</span></>
                    ) : '—'}
                  </div>
                </div>
              </div>

              {/* Words by length */}
              <div className="words-stats">
                <h3>Klassen har funnet {totalUniqueWords} unike ord</h3>
                {sortedLengths.length > 0 ? (
                  <div className="length-bars">
                    {sortedLengths.map(([len, count]) => (
                      <div key={len} className="length-bar-row">
                        <span className="length-label">{len} bokstaver:</span>
                        <div className="length-bar">
                          <div
                            className="length-bar-fill"
                            style={{ width: `${Math.min(100, (count / Math.max(...Object.values(wordsByLength))) * 100)}%` }}
                          />
                        </div>
                        <span className="length-count">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-words">Venter på at elevene finner ord...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <aside className="players-sidebar">
        <h3>Elever ({connectedPlayers.length})</h3>
        <ul className="players-list">
          {connectedPlayers
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(player => (
              <li key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                <span className="player-score">{player.score || 0}p</span>
                <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern">✕</button>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
