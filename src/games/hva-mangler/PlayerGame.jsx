// game/src/games/hva-mangler/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './HvaMangler.css';

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, memorize, black, guess, selected, result
  const [objects, setObjects] = useState([]);
  const [emojis, setEmojis] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [guess, setGuess] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMemorizeStarted = ({ objects: objs, duration, emojis: em }) => {
      setObjects(objs);
      setEmojis(em || {});
      setTimeLeft(duration);
      setPhase('memorize');
      setHasBuzzed(false);
      setIsSelected(false);
      setGuess('');
      setLastResult(null);
    };

    const handleScreenBlack = ({ duration }) => {
      setPhase('black');
      setTimeLeft(duration);
    };

    const handleChangedShown = () => {
      setPhase('guess');
    };

    const handlePlayerSelected = ({ playerId }) => {
      if (playerId === socket.id) {
        setIsSelected(true);
        setPhase('selected');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    const handleGuessResult = ({ playerId, isCorrect, correctAnswer }) => {
      if (playerId === socket.id) {
        setLastResult({ isCorrect, correctAnswer });
        setPhase('result');
        setIsSelected(false);
      }
    };

    const handleReadyForNext = () => {
      setPhase('waiting');
      setObjects([]);
      setHasBuzzed(false);
      setIsSelected(false);
      setGuess('');
      setLastResult(null);
    };

    socket.on('game:memorize-started', handleMemorizeStarted);
    socket.on('game:screen-black', handleScreenBlack);
    socket.on('game:changed-shown', handleChangedShown);
    socket.on('game:player-selected', handlePlayerSelected);
    socket.on('game:guess-result', handleGuessResult);
    socket.on('game:ready-for-next', handleReadyForNext);

    return () => {
      socket.off('game:memorize-started', handleMemorizeStarted);
      socket.off('game:screen-black', handleScreenBlack);
      socket.off('game:changed-shown', handleChangedShown);
      socket.off('game:player-selected', handlePlayerSelected);
      socket.off('game:guess-result', handleGuessResult);
      socket.off('game:ready-for-next', handleReadyForNext);
    };
  }, [socket]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft]);

  const buzz = () => {
    if (hasBuzzed || phase !== 'guess') return;

    setHasBuzzed(true);
    socket.emit('player:game-action', {
      action: 'buzz',
      data: {}
    });
  };

  const submitGuess = () => {
    if (!guess.trim() || !isSelected) return;

    socket.emit('player:game-action', {
      action: 'submit-guess',
      data: { guess: guess.trim() }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  };

  // Render emoji grid (for memorization)
  const renderEmojiGrid = () => {
    return (
      <div className="emoji-grid-player">
        {objects.map((obj, i) => (
          <div key={i} className="emoji-item-player">
            <span className="emoji">{emojis[obj] || '❓'}</span>
            <span className="label">{obj}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="hvamangler-player">
      {/* Header */}
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Hva mangler?</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">👁️</div>
            <h2>Venter på neste runde...</h2>
            <p>Gjør deg klar!</p>
          </div>
        )}

        {/* Memorize phase */}
        {phase === 'memorize' && (
          <div className="memorize-phase">
            <div className="phase-info">
              <h2>Memorer!</h2>
              <div className="timer">{timeLeft}</div>
            </div>
            {renderEmojiGrid()}
          </div>
        )}

        {/* Black screen phase */}
        {phase === 'black' && (
          <div className="black-phase">
            <div className="black-content">
              <div className="timer">{timeLeft}</div>
              <p>Forbered deg...</p>
            </div>
          </div>
        )}

        {/* Guess phase - show buzzer */}
        {phase === 'guess' && (
          <div className="guess-phase">
            <h2>Hva mangler?</h2>

            {!hasBuzzed ? (
              <button className="btn-buzzer" onClick={buzz}>
                <span className="buzzer-icon">🔔</span>
                <span className="buzzer-text">BUZZ!</span>
              </button>
            ) : (
              <div className="buzzed-status">
                <span className="check">✓</span>
                <p>Du har buzzet!</p>
                <p className="hint">Venter på tur...</p>
              </div>
            )}
          </div>
        )}

        {/* Selected phase - can guess */}
        {phase === 'selected' && (
          <div className="selected-phase">
            <h2>Din tur!</h2>
            <p>Hva mangler?</p>

            <div className="guess-input-group">
              <input
                ref={inputRef}
                type="text"
                className="guess-input"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Skriv svaret..."
                autoComplete="off"
              />
              <button className="btn-submit" onClick={submitGuess}>
                Send
              </button>
            </div>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && lastResult && (
          <div className="result-phase">
            {lastResult.isCorrect ? (
              <>
                <div className="result-icon correct">✓</div>
                <h2>Riktig!</h2>
                <p>+100 poeng</p>
              </>
            ) : (
              <>
                <div className="result-icon wrong">✗</div>
                <h2>Feil!</h2>
                <p>Prøv igjen neste gang</p>
              </>
            )}
            <p className="waiting-text">Venter på neste runde...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
