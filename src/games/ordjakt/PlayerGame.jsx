// game/src/games/ordjakt/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ letters: l, timeLimit }) => {
      setLetters(l || []);
      setPhase('playing');
      setMyWords([]);
      setInput('');
      setFeedback(null);
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

    const handleWordResult = ({ accepted, word, reason, wordCount, score }) => {
      if (accepted) {
        setMyWords(prev => [word, ...prev]);
        setFeedback({ type: 'success', text: `✓ ${word.toUpperCase()}` });
      } else {
        setFeedback({ type: 'error', text: reason });
      }
      setInput('');
      inputRef.current?.focus();

      // Clear feedback after 2.5 seconds
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500);
    };

    const handleTimeUp = () => {
      setPhase('finished');
      setTimeLeft(0);
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

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ordjakt-player">
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
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
            <div className={`player-timer ${timeLeft <= 30 ? 'warning' : ''} ${phase === 'finished' ? 'finished' : ''}`}>
              {phase === 'finished' ? 'Tiden er ute!' : formatTime(timeLeft)}
            </div>

            {/* Letters */}
            <div className="player-letters">
              {letters.map((letter, i) => (
                <div key={i} className="player-letter-tile">{letter.toUpperCase()}</div>
              ))}
            </div>

            <p className="letters-hint">Ordene må være minst 3 bokstaver lange</p>

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
                <button className="btn-submit" onClick={submitWord}>Send</button>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`word-feedback ${feedback.type}`}>
                {feedback.text}
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
