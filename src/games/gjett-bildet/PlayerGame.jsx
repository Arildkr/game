// game/src/games/gjett-bildet/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './GjettBildet.css';

function PlayerGame() {
  const { socket, playerName, players, sendPlayerAction } = useGame();
  
  const [phase, setPhase] = useState('playing'); // playing, answering, waiting, roundEnd, gameOver
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [guess, setGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const inputRef = useRef(null);

  const myPlayerId = socket?.id;
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myBuzzerPosition = buzzerQueue.indexOf(myPlayerId) + 1;
  const isInQueue = myBuzzerPosition > 0;

  // Update score from players list
  useEffect(() => {
    const me = players.find(p => p.id === myPlayerId);
    if (me) {
      setMyScore(me.score || 0);
    }
  }, [players, myPlayerId]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerBuzzed = ({ buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handlePlayerSelected = ({ playerId, playerName: name }) => {
      setCurrentPlayer({ id: playerId, name });
      setBuzzerQueue([]);
      if (playerId === myPlayerId) {
        setPhase('answering');
        setTimeLeft(15);
        setGuess('');
        setHasSubmitted(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setPhase('waiting');
      }
    };

    const handleGuessResult = ({ playerId, isCorrect, correctAnswer, points }) => {
      setLastResult({ playerId, isCorrect, correctAnswer, points });

      if (isCorrect) {
        setPhase('roundEnd');
      } else {
        setCurrentPlayer(null);
        setPhase('playing');
        setHasBuzzed(false);

        // Apply penalty if it was my wrong answer
        if (playerId === myPlayerId) {
          setPenaltyActive(true);
          setPenaltyTime(10);
        }
      }
    };

    const handleNextImage = () => {
      setPhase('playing');
      setCurrentPlayer(null);
      setHasBuzzed(false);
      setGuess('');
      setHasSubmitted(false);
      setLastResult(null);
      setBuzzerQueue([]);
    };

    const handleGameEnded = ({ leaderboard }) => {
      setPhase('gameOver');
    };

    const handleBuzzerCleared = () => {
      setHasBuzzed(false);
      setBuzzerQueue([]);
      setCurrentPlayer(null);
      setPenaltyActive(false);
    };

    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:player-selected', handlePlayerSelected);
    socket.on('game:guess-result', handleGuessResult);
    socket.on('game:next-image', handleNextImage);
    socket.on('game:gjett-bildet-ended', handleGameEnded);
    socket.on('game:buzzer-cleared', handleBuzzerCleared);

    return () => {
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:player-selected', handlePlayerSelected);
      socket.off('game:guess-result', handleGuessResult);
      socket.off('game:next-image', handleNextImage);
      socket.off('game:gjett-bildet-ended', handleGameEnded);
      socket.off('game:buzzer-cleared', handleBuzzerCleared);
    };
  }, [socket, myPlayerId]);

  // Timer for answering
  useEffect(() => {
    if (isMyTurn && phase === 'answering' && !hasSubmitted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isMyTurn && timeLeft === 0 && !hasSubmitted) {
      // Auto-submit empty answer
      handleSubmitGuess({ preventDefault: () => {} });
    }
  }, [isMyTurn, phase, hasSubmitted, timeLeft]);

  // Penalty timer
  useEffect(() => {
    if (penaltyActive && penaltyTime > 0) {
      const timer = setTimeout(() => setPenaltyTime(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (penaltyTime === 0 && penaltyActive) {
      setPenaltyActive(false);
    }
  }, [penaltyActive, penaltyTime]);

 const handleBuzz = () => {
  if (!hasBuzzed && !currentPlayer && !penaltyActive && phase === 'playing') {
    // Bruk sendPlayerAction i stedet for socket.emit
    sendPlayerAction('buzz'); 
    setHasBuzzed(true);
    if (navigator.vibrate) navigator.vibrate(200);
  }
};

const handleSubmitGuess = (e) => {
  e.preventDefault();
  if (!hasSubmitted) {
    // Bruk sendPlayerAction i stedet for socket.emit
    sendPlayerAction('submit-guess', { guess: guess.trim() || 'TIDEN UTE' });
    setHasSubmitted(true);
  }
};

  // Game Over screen
  if (phase === 'gameOver') {
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const myRank = sortedPlayers.findIndex(p => p.id === myPlayerId) + 1;

    return (
      <div className="gjett-bildet-player game-over-screen">
        <div className="game-over-content">
          <h1>Spillet er over!</h1>
          <div className="my-result">
            <div className="final-rank">#{myRank}</div>
            <div className="final-score">{myScore} poeng</div>
          </div>
        </div>
      </div>
    );
  }

  // Round End screen
  if (phase === 'roundEnd' && lastResult) {
    const isMe = lastResult.playerId === myPlayerId;

    return (
      <div className="gjett-bildet-player round-end-screen">
        <div className="round-end-content">
          {isMe ? (
            <>
              <div className="result-icon">🎉</div>
              <h2>Riktig!</h2>
              <p className="correct-answer">Svaret var: <strong>{lastResult.correctAnswer}</strong></p>
              <p className="points-earned">+{lastResult.points} poeng</p>
            </>
          ) : (
            <>
              <div className="result-icon">👏</div>
              <h2>Noen svarte riktig!</h2>
              <p className="correct-answer">Svaret var: <strong>{lastResult.correctAnswer}</strong></p>
            </>
          )}
          <div className="current-score">Din poengsum: <strong>{myScore}</strong></div>
        </div>
      </div>
    );
  }

  // My turn - answering
  if (isMyTurn && phase === 'answering') {
    return (
      <div className="gjett-bildet-player answering-screen">
        <header className="player-header">
          <span className="player-name">{playerName}</span>
          <span className="player-score">{myScore} p</span>
        </header>

        <div className="answering-content">
          <div className="answering-icon">✍️</div>
          <h2>Din tur!</h2>
          <div className={`timer-display ${timeLeft <= 5 ? 'urgent' : ''}`}>{timeLeft}s</div>

          {!hasSubmitted ? (
            <form className="guess-form" onSubmit={handleSubmitGuess}>
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Skriv svaret..."
                autoComplete="off"
                autoFocus
              />
              <button type="submit" disabled={!guess.trim()}>SEND</button>
            </form>
          ) : (
            <div className="submitted-state">
              <p>Svar sendt!</p>
              <p className="waiting-text">Venter på resultat...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Waiting for another player to answer
  if (phase === 'waiting' && currentPlayer) {
    return (
      <div className="gjett-bildet-player waiting-screen">
        <header className="player-header">
          <span className="player-name">{playerName}</span>
          <span className="player-score">{myScore} p</span>
        </header>

        <div className="waiting-content">
          <div className="waiting-icon">⏳</div>
          <h2>{currentPlayer.name} svarer...</h2>
          {isInQueue && (
            <p className="queue-info">Du er #{myBuzzerPosition} i koen</p>
          )}
        </div>
      </div>
    );
  }

  // Default - buzzer view
  let buttonText = 'BUZZ!';
  let buttonColor = '#e74c3c';
  let isDisabled = hasBuzzed || !!currentPlayer || penaltyActive;

  if (penaltyActive) {
    buttonText = `${penaltyTime}`;
    buttonColor = '#7f8c8d';
  } else if (hasBuzzed) {
    buttonText = 'BUZZET!';
    buttonColor = '#444';
  }

  return (
    <div className="gjett-bildet-player buzzer-screen">
      <header className="player-header">
        <span className="player-name">{playerName}</span>
        <span className="player-score">{myScore} p</span>
      </header>

      <div className="buzzer-content">
        <div className="look-at-screen">
          <span className="eye-icon">👀</span>
          <p>Se på storskjermen!</p>
        </div>

        <button
          className={`buzz-button ${hasBuzzed ? 'buzzed' : ''}`}
          style={{ background: buttonColor }}
          onClick={handleBuzz}
          disabled={isDisabled}
        >
          {buttonText}
          {penaltyActive && (
            <div className="penalty-text">STRAFFEPAUSE</div>
          )}
          {isInQueue && !penaltyActive && (
            <div className="queue-info">#{myBuzzerPosition} i koen</div>
          )}
        </button>
      </div>
    </div>
  );
}

export default PlayerGame;