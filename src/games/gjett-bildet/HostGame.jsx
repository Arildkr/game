// game/src/games/gjett-bildet/HostGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getImages, shuffleArray, categories } from '../../data/gjettBildetImages';
import RevealImage from './RevealImage';
import './GjettBildet.css';

const REVEAL_STEPS = [10, 20, 35, 50, 70, 85, 100];
const POINTS_BY_STEP = [100, 80, 60, 50, 40, 30, 20];
// The teacher only ever picks from the front of the queue (fastest
// responders) - showing the whole class's names the instant everyone
// buzzes at once isn't useful, just noisy
const BUZZER_DISPLAY_LIMIT = 8;

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

function HostGame() {
  const {
    socket,
    players,
    roomCode,
    endGame,
    sendGameAction,
    gameData,
    kickPlayer
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
  const [answerTimeLeft, setAnswerTimeLeft] = useState(15); // Tidsfrist for svar (synkronisert med elev)
  // Teacher-controlled: off by default so the shared-screen buzz-in dynamic
  // stays the default experience; teacher opts in per session
  const [showImageToPlayers, setShowImageToPlayers] = useState(false);

  const initDone = useRef(false);
  const currentImage = images[currentIndex];
  const revealPercent = REVEAL_STEPS[revealStep];
  const isLastImage = currentIndex >= images.length - 1;

  // Mirror the current image/reveal state to student devices whenever
  // anything relevant changes (new image, hint revealed, answer shown) -
  // but only send the actual URL when the teacher has the toggle on.
  useEffect(() => {
    if (!socket || !currentImage) return;
    sendGameAction('sync-image-to-players', {
      visible: showImageToPlayers,
      imageUrl: currentImage.url,
      mode: currentMode,
      revealPercent,
      focalPoint,
      answerText: tempAnswer
    });
  }, [socket, sendGameAction, showImageToPlayers, currentImage, currentMode, revealPercent, focalPoint, tempAnswer]);

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
      setAnswerTimeLeft(15);
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
        setRevealStep(REVEAL_STEPS.length - 1); // Vis hele bildet
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

  // Nedtelling for svar-tid (synkronisert med elev)
  useEffect(() => {
    if (phase === 'answering' && answerTimeLeft > 0) {
      const timer = setTimeout(() => setAnswerTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, answerTimeLeft]);

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

  // Shows the answer text and auto-advances after a delay - used both when
  // the host force-reveals via "Vis svaret" and when they reach 100% via
  // repeated "Neste hint" clicks and then click "Gå videre"
  const revealAnswerAndAdvance = () => {
    if (tempAnswer || !currentImage) return;

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
  };

  const handleShowAnswer = () => {
    setRevealStep(REVEAL_STEPS.length - 1);
    sendGameAction('reveal-step', { step: REVEAL_STEPS.length - 1 });
    revealAnswerAndAdvance();
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

    revealAnswerAndAdvance();
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
    return (
      <RevealImage
        imageUrl={currentImage.url}
        mode={currentMode}
        revealPercent={revealPercent}
        focalPoint={focalPoint}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
        answerText={tempAnswer}
      />
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

  // Round End - vises som overlay på bildet (ikke separat skjerm)

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
          <button
            className={`btn btn-toggle-image ${showImageToPlayers ? 'active' : ''}`}
            onClick={() => setShowImageToPlayers(v => !v)}
            title="Om elevene også skal se bildet på sin egen skjerm"
          >
            {showImageToPlayers ? '👁️ Bilde vises for elever' : '🙈 Bilde skjult for elever'}
          </button>
          <span className="room-code">Rom: {roomCode}</span>
          <button className="btn btn-end" onClick={handleEndGame}>Avslutt</button>
        </div>
      </header>

      <main className="game-main">
        <div className="image-section">
          {renderImage()}

          {phase === 'roundEnd' && lastResult && (
            <div className="round-end-overlay">
              <div className="round-end-card">
                <div className="success-icon">🎉</div>
                <h2>{players.find(p => p.id === lastResult.playerId)?.name} svarte riktig!</h2>
                <p className="correct-answer">{lastResult.correctAnswer}</p>
                <p className="points-awarded">+{lastResult.points || POINTS_BY_STEP[revealStep] || 20} poeng</p>
                <button className="btn btn-primary" onClick={handleNextImageAction}>
                  {isLastImage ? 'Se resultater' : 'Neste bilde'}
                </button>
              </div>
            </div>
          )}

          <div className="game-status-row">
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
                onClick={handleShowAnswer}
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
                  <div className={`host-timer ${answerTimeLeft <= 5 ? 'urgent' : ''}`}>{answerTimeLeft}s</div>
                  <h3>{currentPlayer.name} svarer...</h3>
                </div>
              )}

              {!currentPlayer && buzzerQueue.length > 0 && phase === 'playing' && (
                <div className="buzzer-section">
                  <h3>Buzzerkø ({buzzerQueue.length})</h3>
                  <ul className="buzzer-list">
                    {buzzerQueue.slice(0, BUZZER_DISPLAY_LIMIT).map((playerId, index) => (
                      <li key={playerId} className="buzzer-item">
                        <span className="buzzer-position">{index + 1}</span>
                        <span className="buzzer-name">{getPlayerName(playerId)}</span>
                        <button className="btn btn-select" onClick={() => handleSelectPlayer(playerId)}>Velg</button>
                      </li>
                    ))}
                  </ul>
                  {buzzerQueue.length > BUZZER_DISPLAY_LIMIT && (
                    <p className="buzzer-more">+ {buzzerQueue.length - BUZZER_DISPLAY_LIMIT} flere venter</p>
                  )}
                </div>
              )}

              {!currentPlayer && buzzerQueue.length === 0 && phase === 'playing' && (
                <div className="waiting-buzz">
                  <div className="waiting-icon">🔔</div>
                  <p>Venter på buzz...</p>
                </div>
              )}

              {wrongGuessDisplay && (
                <div className="wrong-guess-display">
                  <div className="wrong-icon">❌</div>
                  <p><strong>{wrongGuessDisplay.playerName}</strong>: "{wrongGuessDisplay.guess}"</p>
                  <p className="wrong-text">Feil svar!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="leaderboard-sidebar">
        <h3>Poengtavle</h3>
        <ul className="leaderboard-list">
          {[...(localPlayers.length > 0 ? localPlayers : players)]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5)
            .map((player, index) => (
              <li key={player.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                <span className="rank">{index + 1}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score || 0}</span>
                <button className="btn-kick" onClick={(e) => { e.stopPropagation(); kickPlayer(player.id); }} title="Fjern spiller">✕</button>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
