// game/src/games/stemningssjekk/PlayerGame.jsx
import { useState, useEffect } from 'react';
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

  const [phase, setPhase] = useState('waiting'); // waiting, picking
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleStarted = () => {
      setPhase('picking');
      setSelectedEmoji(null);
    };

    const handleReset = () => {
      setSelectedEmoji(null);
    };

    socket.on('game:round-started', handleStarted);
    socket.on('game:reset-votes', handleReset);

    return () => {
      socket.off('game:round-started', handleStarted);
      socket.off('game:reset-votes', handleReset);
    };
  }, [socket]);

  const pickEmoji = (emoji) => {
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
            <h2>Venter på at læreren starter...</h2>
          </div>
        )}

        {phase === 'picking' && (
          <div className="emoji-phase">
            <h2>Hvordan har du det?</h2>
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
      </main>
    </div>
  );
}

export default PlayerGame;
