// game/src/games/stemningssjekk/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Stemningssjekk.css';

const EMOJIS = [
  '😊', '😄', '🥰', '😎',
  '🤔', '😐', '😴', '🤷',
  '😢', '😤', '😰', '🤯',
  '🔥', '💪', '👍', '❤️',
];

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, picking, timeUp
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleStarted = ({ timeLimit }) => {
      setPhase('picking');
      setSelectedEmoji(null);
      if (timeLimit) {
        setTimeLeft(timeLimit);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    const handleReset = ({ timeLimit }) => {
      setSelectedEmoji(null);
      setPhase('picking');
      if (timeLimit) {
        setTimeLeft(timeLimit);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    const handleTimeUp = () => {
      setPhase('timeUp');
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.on('game:round-started', handleStarted);
    socket.on('game:reset-votes', handleReset);
    socket.on('game:time-up', handleTimeUp);

    return () => {
      socket.off('game:round-started', handleStarted);
      socket.off('game:reset-votes', handleReset);
      socket.off('game:time-up', handleTimeUp);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket]);

  const pickEmoji = (emoji) => {
    if (phase !== 'picking') return;
    setSelectedEmoji(emoji);
    socket.emit('player:game-action', {
      action: 'pick-emoji',
      data: { emoji }
    });
  };

  return (
    <div className="stemning-player">
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Stemning</span>
      </header>

      <main className="player-main">
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">🎭</div>
            <h2>Gjør deg klar!</h2>
            <p>Følg med på hva læreren sier.</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Etterpå sender du din reaksjon til storskjermen.</p>
          </div>
        )}

        {phase === 'picking' && (
          <div className="emoji-phase">
            <h2>Hvordan har du det?</h2>
            {timeLeft > 0 && (
              <div className={`stemning-player-timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                {timeLeft}
              </div>
            )}
            <div className="emoji-grid">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => pickEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {selectedEmoji && (
              <p className="selected-feedback">Du valgte {selectedEmoji} — trykk en annen for å bytte</p>
            )}
          </div>
        )}

        {phase === 'timeUp' && (
          <div className="waiting-phase">
            <div className="waiting-icon">⏱️</div>
            <h2>Tiden er ute!</h2>
            {selectedEmoji ? (
              <p>Du svarte {selectedEmoji}</p>
            ) : (
              <p>Du rakk ikke å svare denne gangen</p>
            )}
            <p style={{ marginTop: '1rem', opacity: 0.6 }}>Venter på læreren...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
