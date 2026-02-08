// game/src/games/tegn-det/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import DrawingCanvas from './DrawingCanvas';
import './TegnDet.css';

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, selectWord, drawing, guessing, result
  const [isDrawer, setIsDrawer] = useState(false);
  const [drawerName, setDrawerName] = useState('');
  const [word, setWord] = useState('');
  const [wordOptions, setWordOptions] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [guess, setGuess] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const inputRef = useRef(null);
  const lockoutTimerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // When drawer is selected
    const handleDrawerSelected = ({ drawerId, drawerName: name }) => {
      setDrawerName(name);
      setStrokes([]);
      setGuess('');
      setLastResult(null);
      setIsLockedOut(false);

      if (drawerId === socket.id) {
        // I am the drawer - wait for word options via separate event
        setIsDrawer(true);
        setPhase('selectWord');
      } else {
        // I am a guesser - wait for round to start
        setIsDrawer(false);
        setWord('');
        setPhase('waiting');
      }
    };

    // Word options sent separately only to the drawer
    const handleWordOptions = ({ wordOptions: options }) => {
      setWordOptions(options);
    };

    const handleRoundStarted = ({ drawerId, drawerName: name }) => {
      setDrawerName(name);
      setStrokes([]);
      setGuess('');
      setLastResult(null);
      setIsLockedOut(false);

      if (drawerId === socket.id) {
        setIsDrawer(true);
        setPhase('drawing');
      } else {
        setIsDrawer(false);
        setWord('');
        setPhase('guessing');
        // Focus input after a short delay
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    };

    // Word is sent separately only to the drawer
    const handleYourWord = ({ word: w }) => {
      setWord(w);
    };

    const handleDrawingUpdate = ({ stroke }) => {
      setStrokes(prev => [...prev, stroke]);
    };

    const handleCanvasCleared = () => {
      setStrokes([]);
    };

    const handleCorrectGuess = ({ playerId, playerName: winner, word: correctWord, guesserPoints }) => {
      setLastResult({
        type: 'correct',
        isMe: playerId === socket.id,
        playerName: winner,
        word: correctWord,
        points: guesserPoints
      });
      setPhase('result');
    };

    const handleWrongGuess = ({ playerId, lockoutDuration }) => {
      if (playerId === socket.id) {
        setIsLockedOut(true);
        setLockoutTime(lockoutDuration);
        setGuess('');

        // Countdown lockout
        let remaining = lockoutDuration;
        lockoutTimerRef.current = setInterval(() => {
          remaining--;
          setLockoutTime(remaining);
          if (remaining <= 0) {
            clearInterval(lockoutTimerRef.current);
            setIsLockedOut(false);
            inputRef.current?.focus();
          }
        }, 1000);
      }
    };

    const handleRoundEnded = ({ word: correctWord }) => {
      setLastResult({
        type: 'skipped',
        word: correctWord
      });
      setPhase('result');
    };

    socket.on('game:drawer-selected', handleDrawerSelected);
    socket.on('game:word-options', handleWordOptions);
    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:your-word', handleYourWord);
    socket.on('game:drawing-update', handleDrawingUpdate);
    socket.on('game:canvas-cleared', handleCanvasCleared);
    socket.on('game:correct-guess', handleCorrectGuess);
    socket.on('game:wrong-guess', handleWrongGuess);
    socket.on('game:round-ended', handleRoundEnded);

    return () => {
      socket.off('game:drawer-selected', handleDrawerSelected);
      socket.off('game:word-options', handleWordOptions);
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:your-word', handleYourWord);
      socket.off('game:drawing-update', handleDrawingUpdate);
      socket.off('game:canvas-cleared', handleCanvasCleared);
      socket.off('game:correct-guess', handleCorrectGuess);
      socket.off('game:wrong-guess', handleWrongGuess);
      socket.off('game:round-ended', handleRoundEnded);
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [socket]);

  const selectWord = (selectedWord) => {
    setWord(selectedWord);
    socket.emit('player:game-action', {
      action: 'select-word',
      data: { word: selectedWord }
    });
  };

  const handleStroke = (stroke) => {
    socket.emit('player:game-action', {
      action: 'draw-stroke',
      data: { stroke }
    });
  };

  const clearCanvas = () => {
    socket.emit('player:game-action', {
      action: 'clear-canvas',
      data: {}
    });
  };

  const submitGuess = () => {
    if (!guess.trim() || isLockedOut) return;

    socket.emit('player:game-action', {
      action: 'submit-guess',
      data: { guess: guess.trim() }
    });

    setGuess('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  };

  return (
    <div className="tegndet-player">
      {/* Header */}
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Tegn det!</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">🎨</div>
            <h2>Venter på neste runde...</h2>
            {drawerName && <p>{drawerName} velger ord...</p>}
          </div>
        )}

        {/* Word selection phase (for drawer only) */}
        {phase === 'selectWord' && isDrawer && (
          <div className="select-word-phase">
            <h2>Du skal tegne!</h2>
            <p>Velg et ord:</p>
            <div className="word-options">
              {wordOptions.map((w, i) => (
                <button
                  key={i}
                  className="word-option"
                  onClick={() => selectWord(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drawing phase (for drawer) */}
        {phase === 'drawing' && isDrawer && (
          <div className="drawing-phase">
            <div className="word-to-draw">
              Tegn: <strong>{word}</strong>
            </div>

            <DrawingCanvas
              isDrawer={true}
              onStroke={handleStroke}
              strokes={strokes}
              width={500}
              height={400}
            />

            <button className="btn btn-clear" onClick={clearCanvas}>
              Tøm lerret
            </button>
          </div>
        )}

        {/* Guessing phase (for guessers) */}
        {phase === 'guessing' && !isDrawer && (
          <div className="guessing-phase">
            <div className="drawer-info">
              <span className="drawer-name">{drawerName}</span> tegner
            </div>

            <DrawingCanvas
              isDrawer={false}
              strokes={strokes}
              width={500}
              height={400}
            />

            {isLockedOut ? (
              <div className="lockout-status">
                <p>Feil svar!</p>
                <p className="lockout-timer">Vent {lockoutTime} sekunder...</p>
              </div>
            ) : (
              <div className="guess-input-group">
                <input
                  ref={inputRef}
                  type="text"
                  className="guess-input"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hva tegnes?"
                  autoComplete="off"
                />
                <button className="btn-submit" onClick={submitGuess}>
                  Gjett
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && lastResult && (
          <div className="result-phase">
            {lastResult.type === 'correct' ? (
              lastResult.isMe ? (
                <>
                  <div className="result-icon">🎉</div>
                  <h2>Du gjettet riktig!</h2>
                  <p className="result-word">Ordet var: <strong>{lastResult.word}</strong></p>
                  <p className="points">+{lastResult.points} poeng</p>
                </>
              ) : (
                <>
                  <div className="result-icon">👏</div>
                  <h2>{lastResult.playerName} gjettet riktig!</h2>
                  <p className="result-word">Ordet var: <strong>{lastResult.word}</strong></p>
                </>
              )
            ) : (
              <>
                <div className="result-icon">⏭️</div>
                <h2>Runden ble hoppet over</h2>
                <p className="result-word">Ordet var: <strong>{lastResult.word}</strong></p>
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
