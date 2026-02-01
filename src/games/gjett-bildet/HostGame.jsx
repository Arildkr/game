// game/src/games/gjett-bildet/HostGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getImages, shuffleArray, categories } from '../../data/gjettBildetImages';
import './GjettBildet.css';

const REVEAL_STEPS = [10, 20, 35, 50, 70, 85, 100];
const POINTS_BY_STEP = [100, 80, 60, 50, 40, 30, 20];

// Tilgjengelige avsløring-modi
const REVEAL_MODES = ['mask', 'zoom', 'blur', 'random'];
const MODE_NAMES = {
  mask: { name: 'Sirkel', icon: '🎭' },
  zoom: { name: 'Zoom', icon: '🔍' },
  blur: { name: 'Uskarp', icon: '🟦' },
  random: { name: 'Tilfeldig', icon: '🔮' }
};

// --- LOKAL SVAR-VALIDERING (samme som original app) ---
function getSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const editDistance = ((str1, str2) => {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= str1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= str2.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (str1.charAt(i - 1) !== str2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[str2.length] = lastValue;
    }
    return costs[str2.length];
  })(longer, shorter);

  return (longerLength - editDistance) / parseFloat(longerLength);
}

function isAnswerCorrect(studentAnswer, correctAnswersArray) {
  if (!studentAnswer || !correctAnswersArray || correctAnswersArray.length === 0) return false;
  const sAnswer = studentAnswer.trim().toLowerCase();
  return correctAnswersArray.some(correct => {
    const cAnswer = correct.trim().toLowerCase();
    if (sAnswer === cAnswer) return true;
    if (cAnswer.includes(sAnswer)) {
      const lengthRatio = sAnswer.length / cAnswer.length;
      if (lengthRatio >= 0.5) return true;
    }
    const similarity = getSimilarity(sAnswer, cAnswer);
    return similarity >= 0.75;
  });
}

// Random Reveal Component - bruker CSS for å vise tilfeldige sirkler
function RandomRevealOverlay({ revealPercent, containerSize }) {
  const circlesRef = useRef([]);
  const lastPercentRef = useRef(0);

  // Generer nye sirkler når prosenten øker
  if (revealPercent > lastPercentRef.current || circlesRef.current.length === 0) {
    const targetCircles = Math.floor((revealPercent / 100) * 80);

    while (circlesRef.current.length < targetCircles) {
      const progress = circlesRef.current.length / 80;
      const size = 80 + Math.random() * 120 - progress * 40; // Større i starten

      circlesRef.current.push({
        id: circlesRef.current.length,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size
      });
    }
    lastPercentRef.current = revealPercent;
  }

  // Lag CSS radial-gradient for alle sirklene
  const gradients = circlesRef.current.map(c =>
    `radial-gradient(circle at ${c.x}% ${c.y}%, transparent ${c.size / 2}px, black ${c.size / 2}px)`
  ).join(', ');

  // Hvis ingen sirkler, vis helt svart
  if (circlesRef.current.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'black',
          pointerEvents: 'none'
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: gradients || 'black',
        backgroundBlendMode: 'multiply',
        pointerEvents: 'none'
      }}
    />
  );
}

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
  const [phase, setPhase] = useState('playing');
  const [lastResult, setLastResult] = useState(null);
  const [config, setConfig] = useState({ category: 'blanding', mode: 'blanding' });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [tempAnswer, setTempAnswer] = useState(null);
  const [localPlayers, setLocalPlayers] = useState([]);
  const [wrongGuessDisplay, setWrongGuessDisplay] = useState(null);
  const [currentMode, setCurrentMode] = useState('blur'); // Aktiv modus for dette bildet
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 }); // Tilfeldig fokuspunkt for mask/zoom

  const initDone = useRef(false);
  const currentImage = images[currentIndex];
  const revealPercent = REVEAL_STEPS[revealStep];
  const isLastImage = currentIndex >= images.length - 1;

  // Velg tilfeldig modus
  const getRandomMode = useCallback(() => {
    return REVEAL_MODES[Math.floor(Math.random() * REVEAL_MODES.length)];
  }, []);

  // Generer tilfeldig fokuspunkt for mask/zoom (unngå kantene)
  const getRandomFocalPoint = useCallback(() => {
    return {
      x: 20 + Math.random() * 60, // 20-80%
      y: 20 + Math.random() * 60  // 20-80%
    };
  }, []);

  // Initialize fra gameData - kun én gang
  useEffect(() => {
    if (gameData && !initDone.current) {
      initDone.current = true;
      const category = gameData.category || 'blanding';
      const allImages = getImages(category);
      const shuffled = shuffleArray(allImages).slice(0, 15);
      setImages(shuffled);

      const selectedMode = gameData.mode || 'blanding';
      setConfig({
        category: category,
        mode: selectedMode
      });

      // Sett initial modus og fokuspunkt
      if (selectedMode === 'blanding') {
        setCurrentMode(getRandomMode());
      } else {
        setCurrentMode(selectedMode);
      }
      setFocalPoint(getRandomFocalPoint());
    }
  }, [gameData, getRandomMode, getRandomFocalPoint]);

  // Synkroniser localPlayers med players fra context
  useEffect(() => {
    if (players && players.length > 0) {
      setLocalPlayers(players);
    }
  }, [players]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handlePlayerBuzzed = ({ buzzerQueue: queue }) => {
      setBuzzerQueue(queue || []);
    };

    const handlePlayerSelected = ({ playerId, playerName }) => {
      setCurrentPlayer({ id: playerId, name: playerName });
      setBuzzerQueue([]);
      setPhase('answering');
    };

    const handleGuessSubmitted = ({ playerId, guess }) => {
      setPendingGuess({ playerId, guess });
      setPhase('checking');
    };

    const handleGuessResult = ({ playerId, isCorrect, correctAnswer, points, guess, players: updatedPlayers }) => {
      setLastResult({ playerId, isCorrect, correctAnswer, points });
      setPendingGuess(null);

      if (updatedPlayers) {
        setLocalPlayers(updatedPlayers);
      }

      if (isCorrect) {
        setPhase('roundEnd');
        setWrongGuessDisplay(null);
      } else {
        const playerName = updatedPlayers?.find(p => p.id === playerId)?.name || 'Ukjent';
        setWrongGuessDisplay({
          playerName,
          guess: guess || 'Ukjent svar',
          correctAnswer
        });

        setTimeout(() => {
          setWrongGuessDisplay(null);
        }, 3000);

        setCurrentPlayer(null);
        setPhase('playing');
      }
    };

    const handleNextImage = ({ imageIndex, mode }) => {
      setCurrentIndex(imageIndex);
      setRevealStep(0);
      setPhase('playing');
      setCurrentPlayer(null);
      setPendingGuess(null);
      setLastResult(null);
      setBuzzerQueue([]);
      setImageLoaded(false);
      setTempAnswer(null);

      // Ny modus og fokuspunkt for neste bilde
      if (config.mode === 'blanding') {
        setCurrentMode(mode || getRandomMode());
      }
      setFocalPoint(getRandomFocalPoint());
    };

    const handleBuzzerCleared = () => {
      setBuzzerQueue([]);
      setCurrentPlayer(null);
      setPhase('playing');
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
  }, [socket, config.mode, getRandomMode, getRandomFocalPoint]);

  // AUTO-VALIDERING
  useEffect(() => {
    if (pendingGuess && currentImage && phase === 'checking') {
      const timer = setTimeout(() => {
        const correctAnswers = currentImage.answers || (currentImage.answer ? [currentImage.answer] : []);
        const isCorrect = isAnswerCorrect(pendingGuess.guess, correctAnswers);

        sendGameAction('validate-guess', {
          playerId: pendingGuess.playerId,
          isCorrect,
          correctAnswer: correctAnswers[0] || '',
          guess: pendingGuess.guess
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pendingGuess, currentImage, phase, revealStep, sendGameAction]);

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

  const handleNextImageAction = () => {
    if (phase === 'roundEnd') {
      if (isLastImage) {
        sendGameAction('end-gjett-bildet');
        setPhase('gameOver');
      } else {
        const nextMode = config.mode === 'blanding' ? getRandomMode() : config.mode;
        sendGameAction('next-image', { imageIndex: currentIndex + 1, mode: nextMode });
      }
      return;
    }

    if (!tempAnswer && currentImage) {
      const correctAnswer = currentImage.answers?.[0] || currentImage.answer || '';
      setTempAnswer(correctAnswer);
      setPhase('showingAnswer');

      setTimeout(() => {
        setTempAnswer(null);
        if (isLastImage) {
          sendGameAction('end-gjett-bildet');
          setPhase('gameOver');
        } else {
          const nextMode = config.mode === 'blanding' ? getRandomMode() : config.mode;
          sendGameAction('next-image', { imageIndex: currentIndex + 1, mode: nextMode });
        }
      }, 3000);
    }
  };

  const handleClearBuzzer = () => {
    sendGameAction('clear-buzzer');
  };

  const handleEndGame = () => {
    endGame();
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Ukjent';
  };

  const renderImage = () => {
    if (!currentImage) return null;

    // Random reveal mode - bruk canvas
    if (currentMode === 'random') {
      return (
        <div className="image-container" style={{ position: 'relative' }}>
          {!imageLoaded && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Laster bilde...</p>
            </div>
          )}
          <RandomRevealCanvas
            imageUrl={currentImage.url}
            revealPercent={revealPercent}
            onLoad={() => setImageLoaded(true)}
          />

          {tempAnswer && (
            <div className="answer-overlay">
              <p className="answer-label">Svaret var:</p>
              <h1 className="answer-text">{tempAnswer}</h1>
              <p className="answer-wait">Går videre om litt...</p>
            </div>
          )}

          <div className="reveal-indicator">
            <div className="reveal-bar" style={{ width: `${revealPercent}%` }}></div>
          </div>
        </div>
      );
    }

    // Andre modi
    let imageStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'all 0.5s ease'
    };

    if (currentMode === 'blur') {
      const blur = ((100 - revealPercent) / 100) * 30;
      imageStyle.filter = `blur(${blur}px)`;
    } else if (currentMode === 'zoom') {
      const scale = 1 + ((100 - revealPercent) / 100) * 4;
      imageStyle.transform = `scale(${scale})`;
      imageStyle.transformOrigin = `${focalPoint.x}% ${focalPoint.y}%`;
    } else if (currentMode === 'mask') {
      imageStyle.clipPath = `circle(${revealPercent}% at ${focalPoint.x}% ${focalPoint.y}%)`;
    }

    return (
      <div className="image-container" style={{ position: 'relative' }}>
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

        {tempAnswer && (
          <div className="answer-overlay">
            <p className="answer-label">Svaret var:</p>
            <h1 className="answer-text">{tempAnswer}</h1>
            <p className="answer-wait">Går videre om litt...</p>
          </div>
        )}

        <div className="reveal-indicator">
          <div className="reveal-bar" style={{ width: `${revealPercent}%` }}></div>
        </div>
      </div>
    );
  };

  // Game Over screen
  if (phase === 'gameOver') {
    const sortedPlayers = [...(localPlayers.length > 0 ? localPlayers : players)].sort((a, b) => (b.score || 0) - (a.score || 0));
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
          <button className="btn btn-primary" onClick={handleEndGame}>Avslutt</button>
        </div>
      </div>
    );
  }

  // Round End screen
  if (phase === 'roundEnd' && lastResult) {
    const winner = players.find(p => p.id === lastResult.playerId);
    return (
      <div className="gjett-bildet-host round-end-screen">
        <div className="round-end-content">
          <div className="success-icon">🎉</div>
          <h2>Riktig svar!</h2>
          <p className="winner-name">{winner?.name} svarte riktig!</p>
          <p className="correct-answer">Svaret var: <strong>{lastResult.correctAnswer}</strong></p>
          <p className="points-awarded">+{lastResult.points || POINTS_BY_STEP[revealStep] || 20} poeng</p>
          <button className="btn btn-primary" onClick={handleNextImageAction}>
            {isLastImage ? 'Se resultater' : 'Neste bilde'}
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = categories.find(c => c.id === config.category) || categories[4];
  const modeInfo = MODE_NAMES[currentMode] || MODE_NAMES.blur;

  return (
    <div className="gjett-bildet-host">
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">🖼️ Gjett Bildet</span>
          <span className="category-badge">{categoryInfo?.icon} {categoryInfo?.name}</span>
          <span className="mode-badge">{modeInfo.icon} {modeInfo.name}</span>
          <span className="progress">{currentIndex + 1} / {images.length}</span>
        </div>
        <div className="header-actions">
          <span className="room-code">Rom: {roomCode}</span>
          <button className="btn btn-end" onClick={handleEndGame}>Avslutt</button>
        </div>
      </header>

      <main className="game-main">
        <div className="image-section">
          {renderImage()}
          <div className="controls">
            <button
              className="btn btn-hint"
              onClick={handleReveal}
              disabled={revealStep >= REVEAL_STEPS.length - 1 || phase === 'showingAnswer'}
            >
              Neste hint ({revealStep + 1}/{REVEAL_STEPS.length})
            </button>
            <button
              className="btn btn-reveal"
              onClick={() => {
                setRevealStep(REVEAL_STEPS.length - 1);
                sendGameAction('reveal-step', { step: REVEAL_STEPS.length - 1 });
              }}
              disabled={revealStep >= REVEAL_STEPS.length - 1 || phase === 'showingAnswer'}
            >
              Vis svaret
            </button>
            {revealStep >= REVEAL_STEPS.length - 1 && (
              <button
                className="btn btn-next"
                onClick={handleNextImageAction}
                disabled={phase === 'showingAnswer'}
              >
                {phase === 'showingAnswer' ? 'Viser fasit...' : (isLastImage ? 'Se resultater' : 'Gå videre →')}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleClearBuzzer}
              disabled={buzzerQueue.length === 0 || phase === 'showingAnswer'}
            >
              Nullstill buzzer
            </button>
          </div>
        </div>

        <div className="control-panel">
          {pendingGuess && phase === 'checking' && (
            <div className="pending-guess-card">
              <h3>{currentPlayer?.name || getPlayerName(pendingGuess.playerId)} svarer:</h3>
              <p className="guess-text">"{pendingGuess.guess}"</p>
              <p className="checking-text">Sjekker svar...</p>
            </div>
          )}

          {currentPlayer && !pendingGuess && phase === 'answering' && (
            <div className="answering-card">
              <h3>{currentPlayer.name} svarer...</h3>
              <p>Venter på svar...</p>
            </div>
          )}

          {!currentPlayer && buzzerQueue.length > 0 && phase === 'playing' && (
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

          {wrongGuessDisplay && (
            <div className="wrong-guess-display">
              <div className="wrong-icon">❌</div>
              <p><strong>{wrongGuessDisplay.playerName}</strong> svarte:</p>
              <p className="wrong-guess">"{wrongGuessDisplay.guess}"</p>
              <p className="wrong-text">Feil svar!</p>
            </div>
          )}
        </div>
      </main>

      <aside className="leaderboard-sidebar">
        <h3>Poengtavle</h3>
        <ul className="leaderboard-list">
          {[...(localPlayers.length > 0 ? localPlayers : players)]
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
