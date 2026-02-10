// game/src/games/ordjakt/PlayerGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Ordjakt.css';

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, finished
  const [letters, setLetters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [input, setInput] = useState('');
  const [myWords, setMyWords] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [sourceWord, setSourceWord] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  // Track which letters are "used" in the current input (for visual dimming)
  const getUsedLetterIndices = useCallback(() => {
    const used = [];
    const remaining = [...letters];
    for (const ch of input.toLowerCase()) {
      const idx = remaining.findIndex((l, i) => l.toLowerCase() === ch && !used.includes(i));
      if (idx !== -1) {
        // Find original index
        let originalIdx = -1;
        let count = 0;
        for (let i = 0; i < letters.length; i++) {
          if (letters[i].toLowerCase() === ch && !used.includes(i)) {
            if (count === 0) { originalIdx = i; break; }
            count++;
          }
        }
        if (originalIdx !== -1) used.push(originalIdx);
      }
    }
    return used;
  }, [input, letters]);

  const usedIndices = getUsedLetterIndices();

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ letters: l, timeLimit }) => {
      setLetters(l || []);
      setPhase('playing');
      setMyWords([]);
      setInput('');
      setFeedback(null);
      setSourceWord('');
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
      setTimeout(() => inputRef.current?.focus(), 300);
    };

    const handleWordResult = ({ accepted, word, reason }) => {
      if (accepted) {
        setMyWords(prev => [word, ...prev]);
        setFeedback({ type: 'success', text: `\u2713 ${word.toUpperCase()}` });
      } else {
        setFeedback({ type: 'error', text: reason });
      }
      setInput('');
      inputRef.current?.focus();

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500);
    };

    const handleTimeUp = ({ sourceWord: sw }) => {
      setPhase('finished');
      setTimeLeft(0);
      if (sw) setSourceWord(sw);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:word-result', handleWordResult);
    socket.on('game:time-up', handleTimeUp);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:word-result', handleWordResult);
      socket.off('game:time-up', handleTimeUp);
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [socket]);

  const submitWord = () => {
    const word = input.trim();
    if (!word || phase !== 'playing') return;

    socket.emit('player:game-action', {
      action: 'submit-word',
      data: { word }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitWord();
    }
  };

  // Tap letter to add to input
  const tapLetter = (letter, index) => {
    if (phase !== 'playing') return;
    if (usedIndices.includes(index)) return; // Already used
    setInput(prev => prev + letter.toLowerCase());
    inputRef.current?.focus();
  };

  // Clear input
  const clearInput = () => {
    setInput('');
    inputRef.current?.focus();
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ordjakt-player">
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>&larr;</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Ordjakt</span>
      </header>

      <main className="player-main">
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">🔍</div>
            <h2>Gjør deg klar!</h2>
            <p>Læreren starter snart runden.</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Du skal finne så mange ord som mulig med bokstavene du får.</p>
          </div>
        )}

        {(phase === 'playing' || phase === 'finished') && (
          <div className="play-area">
            {/* Timer */}
            <div className={`player-timer ${timeLeft <= 30 && phase === 'playing' ? 'warning' : ''} ${phase === 'finished' ? 'finished' : ''}`}>
              {phase === 'finished' ? 'Tiden er ute!' : formatTime(timeLeft)}
            </div>

            {/* Letters - tappable */}
            <div className="player-letters">
              {letters.map((letter, i) => (
                <button
                  key={i}
                  className={`player-letter-tile ${usedIndices.includes(i) ? 'used' : ''}`}
                  onClick={() => tapLetter(letter, i)}
                  disabled={phase !== 'playing'}
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>

            <p className="letters-hint">Trykk på bokstavene eller skriv. Minimum 3 bokstaver.</p>

            {/* Input */}
            {phase === 'playing' && (
              <div className="input-area">
                <input
                  ref={inputRef}
                  type="text"
                  className="word-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Skriv et ord..."
                  autoComplete="off"
                  autoCapitalize="off"
                />
                {input.length > 0 && (
                  <button className="btn-clear" onClick={clearInput}>&times;</button>
                )}
                <button className="btn-submit" onClick={submitWord}>Send</button>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`word-feedback ${feedback.type}`}>
                {feedback.text}
              </div>
            )}

            {/* Source word reveal after round */}
            {phase === 'finished' && sourceWord && (
              <div className="source-word-player">
                8-bokstavsord: <strong>{sourceWord.toUpperCase()}</strong>
              </div>
            )}

            {/* My words */}
            <div className="my-words">
              <h3>Dine ord ({myWords.length})</h3>
              {myWords.length > 0 ? (
                <div className="word-list">
                  {myWords.map((word, i) => (
                    <span key={i} className="found-word">{word.toUpperCase()}</span>
                  ))}
                </div>
              ) : (
                <p className="no-words-yet">Finn ord med bokstavene over!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
