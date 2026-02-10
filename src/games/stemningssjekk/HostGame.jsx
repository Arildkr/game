// game/src/games/stemningssjekk/HostGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Stemningssjekk.css';

const ROUND_TIME = 30; // seconds

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer } = useGame();

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [emojiCounts, setEmojiCounts] = useState({}); // emoji -> count
  const [respondedPlayers, setRespondedPlayers] = useState(new Set());
  const nextIdRef = useRef(0);
  const mainRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleEmojiPicked = ({ playerId, emoji, previousEmoji }) => {
      // Update counts
      setEmojiCounts(prev => {
        const next = { ...prev };
        // Remove old vote
        if (previousEmoji && next[previousEmoji] > 0) {
          next[previousEmoji]--;
          if (next[previousEmoji] === 0) delete next[previousEmoji];
        }
        // Add new vote
        next[emoji] = (next[emoji] || 0) + 1;
        return next;
      });

      // Track who has responded
      setRespondedPlayers(prev => new Set(prev).add(playerId));

      // Create floating emoji
      const id = nextIdRef.current++;
      const mainEl = mainRef.current;
      const maxX = mainEl ? mainEl.clientWidth - 60 : 500;
      const startX = 40 + Math.random() * Math.max(maxX - 40, 100);
      const bottom = mainEl ? mainEl.clientHeight : 600;

      setFloatingEmojis(prev => [...prev, {
        id,
        emoji,
        x: startX,
        y: bottom - 60,
      }]);

      // Remove after animation completes
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== id));
      }, 4200);
    };

    socket.on('game:emoji-picked', handleEmojiPicked);

    return () => {
      socket.off('game:emoji-picked', handleEmojiPicked);
    };
  }, [socket]);

  // Timer countdown
  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (started && timeLeft === 0 && timerRef.current !== null) {
      // Time's up - send time-up event to players
      sendGameAction('time-up');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, started, sendGameAction]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const startSession = () => {
    setStarted(true);
    setTimeLeft(ROUND_TIME);
    setEmojiCounts({});
    setRespondedPlayers(new Set());
    setFloatingEmojis([]);
    sendGameAction('start-round', { timeLimit: ROUND_TIME });
  };

  const resetVotes = () => {
    setTimeLeft(ROUND_TIME);
    setEmojiCounts({});
    setRespondedPlayers(new Set());
    setFloatingEmojis([]);
    sendGameAction('reset-votes', { timeLimit: ROUND_TIME });
  };

  // Top 3 emojis
  const getTopEmojis = useCallback(() => {
    return Object.entries(emojiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [emojiCounts]);

  const topEmojis = getTopEmojis();
  const maxCount = topEmojis.length > 0 ? topEmojis[0][1] : 0;

  return (
    <div className="stemning-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Stemningssjekk</span>
          <span className="room-code">Rom: {roomCode}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {started && (
            <button className="btn-end" style={{ background: '#f59e0b' }} onClick={resetVotes}>
              Ny runde
            </button>
          )}
          <button className="btn-end" onClick={() => endGame()}>Avslutt</button>
        </div>
      </header>

      {/* Main content - emoji animation area */}
      <main className="game-main" ref={mainRef}>
        {!started && (
          <div className="waiting-state">
            <div className="waiting-icon">🎭</div>
            <h2>Stemningssjekk</h2>
            <p>Elevene velger en emoji som viser hvordan de har det</p>
            <button
              className="btn-end"
              style={{ background: '#8b5cf6', padding: '1rem 2.5rem', fontSize: '1.3rem', marginTop: '1.5rem', borderRadius: '12px' }}
              onClick={startSession}
            >
              Start
            </button>
            <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.5)' }}>
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'elev' : 'elever'} er klare
            </p>
          </div>
        )}

        {/* Timer */}
        {started && timeLeft > 0 && (
          <div className={`stemning-timer ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}
          </div>
        )}

        {/* Time's up message */}
        {started && timeLeft === 0 && (
          <div className="time-up-message">Tiden er ute!</div>
        )}

        {/* Floating emojis */}
        {floatingEmojis.map(fe => (
          <div
            key={fe.id}
            className="floating-emoji"
            style={{ left: fe.x, top: fe.y }}
          >
            {fe.emoji}
          </div>
        ))}

        {/* Top 3 box */}
        {started && topEmojis.length > 0 && (
          <div className="top-emojis">
            <h4>Topp 3</h4>
            {topEmojis.map(([emoji, count]) => (
              <div key={emoji} className="top-emoji-item">
                <span className="top-emoji-icon">{emoji}</span>
                <div className="top-emoji-bar">
                  <div
                    className="top-emoji-bar-fill"
                    style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="top-emoji-count">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Response count */}
        {started && (
          <div className="response-count">
            {respondedPlayers.size} av {connectedPlayers.length} har svart
          </div>
        )}
      </main>

      {/* Players sidebar */}
      <aside className="players-sidebar">
        <h3>Elever ({connectedPlayers.length})</h3>
        <ul className="players-list">
          {connectedPlayers.map(player => (
            <li key={player.id} className={`player-item ${respondedPlayers.has(player.id) ? 'has-voted' : ''}`}>
              <span className="player-name">{player.name}</span>
              <span className="player-status">
                {respondedPlayers.has(player.id) ? '✓' : '...'}
              </span>
              <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern">✕</button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
