// game/src/games/gjett-bildet/HostGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getImages, shuffleArray, categories } from '../../data/gjettBildetImages';
import './GjettBildet.css';

const REVEAL_STEPS = [10, 20, 35, 50, 70, 85, 100];

function HostGame() {
  const {
    socket,
    players,
    roomCode,
    endGame,
    sendGameAction,
    gameData
  } = useGame();

  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pendingGuess, setPendingGuess] = useState(null);
  const [phase, setPhase] = useState('playing'); // playing, answering, roundEnd, gameOver
  const [lastResult, setLastResult] = useState(null);
  const [config, setConfig] = useState({ category: 'blanding', mode: 'blur' });
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentImage = images[currentIndex];
  const revealPercent = REVEAL_STEPS[revealStep];
  const isLastImage = currentIndex >= images.length - 1;

  // Initialize from gameData
  useEffect(() => {
    if (gameData) {
      const category = gameData.category || 'blanding';
      const allImages = getImages(category);
      const shuffled = shuffleArray(allImages).slice(0, 15);
      setImages(shuffled);
      setConfig({
        category: category,
        mode: gameData.mode || 'blur'
      });
    }
  }, [gameData]);

  // Socket listeners for å koble original logikk til serveren
  useEffect(() => {
    if (!socket) return;

    const handlePlayerBuzzed = ({ buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handlePlayerSelected = ({ playerId, playerName }) => {
      setCurrentPlayer({ id: playerId, name: playerName });
      setBuzzerQueue([]);
      setPhase('answering');
    };

    const handleGuessSubmitted = ({ playerId, guess }) => {
      setPendingGuess({ playerId, guess });
    };

    const handleGuessResult = ({ playerId, isCorrect, correctAnswer, points }) => {
      setLastResult({ playerId, isCorrect, correctAnswer, points });
      setPendingGuess(null);

      if (isCorrect) {
        setPhase('roundEnd');
      } else {
        setCurrentPlayer(null);
        setPhase('playing');
      }
    };

    const handleNextImage = ({ imageIndex }) => {
      setCurrentIndex(imageIndex);
      setRevealStep(0);
      setPhase('playing');
      setCurrentPlayer(null);
      setPendingGuess(null);
      setLastResult(null);
      setBuzzerQueue([]);
      setImageLoaded(false);
    };

    const handleBuzzerCleared = () => {
        setBuzzerQueue([]);
    };

    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:player-selected', handlePlayerSelected);
    socket.on('game:guess-submitted', handleGuessSubmitted);
    socket.on('game:guess-result', handleGuessResult);
    socket.on('game:next-image', handleNextImage);
    socket.on('game:buzzer-cleared', handleBuzzerCleared);

    return () => {
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:player-selected', handlePlayerSelected);
      socket.off('game:guess-submitted', handleGuessSubmitted);
      socket.off('game:guess-result', handleGuessResult);
      socket.off('game:next-image', handleNextImage);
      socket.off('game:buzzer-cleared', handleBuzzerCleared);
    };
  }, [socket, players]);

  const handleReveal = () => {
    if (revealStep < REVEAL_STEPS.length - 1) {
      const newStep = revealStep + 1;
      setRevealStep(newStep);
      sendGameAction('reveal-step', { step: newStep });
    }
  };

  const handleSelectPlayer = (playerId) => {
    if (!currentPlayer) {
      sendGameAction('select-player', { playerId });
    }
  };

  const handleValidateGuess = (isCorrect) => {
    if (pendingGuess && currentImage) {
      sendGameAction('validate-guess', {
        playerId: pendingGuess.playerId,
        isCorrect,
        correctAnswer: currentImage.answer || currentImage.answers[0]
      });
    }
  };

  const handleNextImageAction = () => {
    if (isLastImage) {
      sendGameAction('end-gjett-bildet');
      setPhase('gameOver');
    } else {
      sendGameAction('next-image', { imageIndex: currentIndex + 1 });
    }
  };

  const handleClearBuzzer = () => {
    sendGameAction('clear-buzzer');
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Ukjent';
  };

  const renderImage = () => {
    if (!currentImage) return null;

    let imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };

    if (config.mode === 'blur') {
      const blur = ((100 - revealPercent) / 100) * 30;
      imageStyle.filter = `blur(${blur}px)`;
    } else if (config.mode === 'zoom') {
      const scale = 1 + ((100 - revealPercent) / 100) * 4;
      imageStyle.transform = `scale(${scale})`;
      imageStyle.transformOrigin = 'center center';
    } else if (config.mode === 'mask') {
      imageStyle.clipPath = `circle(${revealPercent}% at 50% 50%)`;
    }

    return (
      <div className="image-container">
        {!imageLoaded && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Laster bilde...</p>
          </div>
        )}
        <img
          src={currentImage.url}
          alt="Gjett bildet"
          style={{ ...imageStyle, opacity: imageLoaded ? 1 : 0 }}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />
        <div className="reveal-indicator">
          <div className="reveal-bar" style={{ width: `${revealPercent}%` }}></div>
        </div>
      </div>
    );
  };

  if (phase === 'gameOver') {
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    return (
      <div className="gjett-bildet-host game-over-screen">
        <div className="game-over-content">
          <h1>Spillet er over!</h1>
          <div className="final-leaderboard">
            <h2>Resultater</h2>
            <div className="podium">
              {sortedPlayers.slice(0, 3).map((player, index) => (
                <div key={player.id} className={`podium-place place-${index + 1}`}>
                  <div className="medal">{['🥇', '🥈', '🥉'][index]}</div>
                  <div className="player-name">{player.name}</div>
                  <div className="player-score">{player.score || 0} poeng</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={endGame}>Avslutt</button>
        </div>
      </div>
    );
  }

  if (phase === 'roundEnd' && lastResult) {
    const winner = players.find(p => p.id === lastResult.playerId);
    return (
      <div className="gjett-bildet-host round-end-screen">
        <div className="round-end-content">
          <div className="success-icon">🎉</div>
          <h2>Riktig svar!</h2>
          <p className="winner-name">{winner?.name} svarte riktig!</p>
          <p className="correct-answer">Svaret var: <strong>{lastResult.correctAnswer}</strong></p>
          <p className="points-awarded">+{lastResult.points} poeng</p>
          <button className="btn btn-primary" onClick={handleNextImageAction}>
            {isLastImage ? 'Se resultater' : 'Neste bilde'}
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = categories.find(c => c.id === config.category) || categories[4];

  return (
    <div className="gjett-bildet-host">
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">🖼️ Gjett Bildet</span>
          <span className="category-badge">{categoryInfo.icon} {categoryInfo.name}</span>
          <span className="progress">{currentIndex + 1} / {images.length}</span>
        </div>
        <div className="header-actions">
          <span className="room-code">Rom: {roomCode}</span>
          <button className="btn btn-end" onClick={endGame}>Avslutt</button>
        </div>
      </header>

      <main className="game-main">
        <div className="image-section">
          {renderImage()}
          <div className="controls">
            <button
              className="btn btn-hint"
              onClick={handleReveal}
              disabled={revealStep >= REVEAL_STEPS.length - 1}
            >
              Neste hint ({revealStep + 1}/{REVEAL_STEPS.length})
            </button>
            <button
              className="btn btn-reveal"
              onClick={() => {
                  setRevealStep(REVEAL_STEPS.length - 1);
                  sendGameAction('reveal-step', { step: REVEAL_STEPS.length - 1 });
              }}
              disabled={revealStep >= REVEAL_STEPS.length - 1}
            >
              Vis svaret
            </button>
            {revealStep >= REVEAL_STEPS.length - 1 && (
              <button className="btn btn-next" onClick={handleNextImageAction}>
                {isLastImage ? 'Se resultater' : 'Neste bilde →'}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleClearBuzzer}
              disabled={buzzerQueue.length === 0}
            >
              Nullstill buzzer
            </button>
          </div>
        </div>

        <div className="control-panel">
          {pendingGuess && currentPlayer && (
            <div className="pending-guess-card">
              <h3>{currentPlayer.name} svarer:</h3>
              <p className="guess-text">"{pendingGuess.guess}"</p>
              <div className="validation-buttons">
                <button className="btn btn-approve" onClick={() => handleValidateGuess(true)}>✓ Riktig</button>
                <button className="btn btn-reject" onClick={() => handleValidateGuess(false)}>✗ Feil</button>
              </div>
            </div>
          )}

          {currentPlayer && !pendingGuess && phase === 'answering' && (
            <div className="answering-card">
              <h3>{currentPlayer.name} svarer...</h3>
              <p>Venter på svar...</p>
            </div>
          )}

          {!currentPlayer && buzzerQueue.length > 0 && (
            <div className="buzzer-section">
              <h3>Buzzerkø ({buzzerQueue.length})</h3>
              <ul className="buzzer-list">
                {buzzerQueue.map((playerId, index) => (
                  <li key={playerId} className="buzzer-item">
                    <span className="buzzer-position">{index + 1}</span>
                    <span className="buzzer-name">{getPlayerName(playerId)}</span>
                    <button className="btn btn-select" onClick={() => handleSelectPlayer(playerId)}>Velg</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!currentPlayer && buzzerQueue.length === 0 && phase === 'playing' && (
            <div className="waiting-buzz">
              <div className="waiting-icon">🔔</div>
              <p>Venter på at noen buzzer inn...</p>
            </div>
          )}
        </div>
      </main>

      <aside className="leaderboard-sidebar">
        <h3>Poengtavle</h3>
        <ul className="leaderboard-list">
          {[...players]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((player, index) => (
              <li key={player.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                <span className="rank">{index + 1}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score || 0}</span>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;