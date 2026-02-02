// game/src/games/nerdle/PlayerGame.jsx
import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Nerdle.css';

const KEYBOARD_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['+', '-', '*', '/', '='],
  ['ENTER', 'BACKSPACE']
];

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, solved, results
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [maxAttempts, setMaxAttempts] = useState(6);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [keyStatus, setKeyStatus] = useState({}); // Track key colors

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ equationLength, maxAttempts: max }) => {
      setPhase('playing');
      setCurrentGuess('');
      setGuesses([]);
      setMaxAttempts(max);
      setError(null);
      setKeyStatus({});
    };

    const handleGuessResult = ({ guess, result, attemptsLeft }) => {
      setGuesses(prev => [...prev, { guess, result }]);
      setCurrentGuess('');
      setError(null);

      // Update key status
      const newKeyStatus = { ...keyStatus };
      guess.split('').forEach((char, i) => {
        const status = result[i];
        // Only upgrade status (absent -> present -> correct)
        if (!newKeyStatus[char] ||
            (newKeyStatus[char] === 'absent' && status !== 'absent') ||
            (newKeyStatus[char] === 'present' && status === 'correct')) {
          newKeyStatus[char] = status;
        }
      });
      setKeyStatus(newKeyStatus);
    };

    const handleGuessInvalid = ({ error: errorMsg }) => {
      setError(errorMsg);
    };

    const handlePlayerSolved = ({ playerId }) => {
      if (playerId === socket.id) {
        setPhase('solved');
      }
    };

    const handleRoundEnded = ({ targetEquation, results: roundResults }) => {
      setResults({ targetEquation, results: roundResults });
      setPhase('results');
    };

    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:guess-result', handleGuessResult);
    socket.on('game:guess-invalid', handleGuessInvalid);
    socket.on('game:player-solved', handlePlayerSolved);
    socket.on('game:round-ended', handleRoundEnded);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:guess-result', handleGuessResult);
      socket.off('game:guess-invalid', handleGuessInvalid);
      socket.off('game:player-solved', handlePlayerSolved);
      socket.off('game:round-ended', handleRoundEnded);
    };
  }, [socket, keyStatus]);

  const handleKeyPress = useCallback((key) => {
    if (phase !== 'playing') return;

    if (key === 'ENTER') {
      if (currentGuess.length === 8) {
        socket.emit('player:game-action', {
          action: 'submit-guess',
          data: { guess: currentGuess }
        });
      } else {
        setError('Må være 8 tegn');
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
      setError(null);
    } else if (currentGuess.length < 8) {
      setCurrentGuess(prev => prev + key);
      setError(null);
    }
  }, [phase, currentGuess, socket]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase !== 'playing') return;

      const key = e.key.toUpperCase();
      if (/^[0-9+\-*/=]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, phase]);

  const getKeyClass = (key) => {
    if (keyStatus[key]) return keyStatus[key];
    return '';
  };

  const renderGrid = () => {
    const rows = [];

    // Render previous guesses
    for (let i = 0; i < guesses.length; i++) {
      rows.push(
        <div key={`guess-${i}`} className="guess-row">
          {guesses[i].guess.split('').map((char, j) => (
            <div key={j} className={`guess-cell ${guesses[i].result[j]}`}>
              {char}
            </div>
          ))}
        </div>
      );
    }

    // Render current guess row
    if (guesses.length < maxAttempts && phase === 'playing') {
      const currentChars = currentGuess.split('');
      rows.push(
        <div key="current" className="guess-row current">
          {[...Array(8)].map((_, j) => (
            <div key={j} className={`guess-cell ${currentChars[j] ? 'filled' : ''}`}>
              {currentChars[j] || ''}
            </div>
          ))}
        </div>
      );
    }

    // Render empty rows
    const emptyRows = maxAttempts - guesses.length - (phase === 'playing' ? 1 : 0);
    for (let i = 0; i < emptyRows; i++) {
      rows.push(
        <div key={`empty-${i}`} className="guess-row empty">
          {[...Array(8)].map((_, j) => (
            <div key={j} className="guess-cell empty"></div>
          ))}
        </div>
      );
    }

    return rows;
  };

  return (
    <div className="nerdle-player">
      {/* Header */}
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Nerdle</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">🔢</div>
            <h2>Venter på neste runde...</h2>
            <p>Gjør deg klar til å gjette!</p>
          </div>
        )}

        {/* Playing phase */}
        {phase === 'playing' && (
          <div className="playing-phase">
            <div className="guess-grid">
              {renderGrid()}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="keyboard">
              {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key) => (
                    <button
                      key={key}
                      className={`key-btn ${key === 'ENTER' ? 'enter' : ''} ${key === 'BACKSPACE' ? 'backspace' : ''} ${getKeyClass(key)}`}
                      onClick={() => handleKeyPress(key)}
                    >
                      {key === 'BACKSPACE' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solved phase */}
        {phase === 'solved' && (
          <div className="solved-phase">
            <div className="solved-icon">🎉</div>
            <h2>Du løste det!</h2>
            <p>på {guesses.length} forsøk</p>
            <div className="guess-grid small">
              {guesses.map((g, i) => (
                <div key={i} className="guess-row">
                  {g.guess.split('').map((char, j) => (
                    <div key={j} className={`guess-cell ${g.result[j]}`}>
                      {char}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="waiting-text">Venter på at runden avsluttes...</p>
          </div>
        )}

        {/* Results phase */}
        {phase === 'results' && results && (
          <div className="results-phase">
            <h2>Fasit</h2>
            <div className="equation-reveal">
              {results.targetEquation.split('').map((char, i) => (
                <div key={i} className="guess-cell correct">{char}</div>
              ))}
            </div>
            <p className="waiting-text">Venter på neste runde...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
