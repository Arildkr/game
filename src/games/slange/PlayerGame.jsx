// game/src/games/slange/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { categories } from '../../data/slangeCategories';
import './Slange.css';

function PlayerGame() {
  const { socket, playerName, gameData, myPlayerId, sendPlayerAction } = useGame();

  const [wordChain, setWordChain] = useState([]);
  const [currentLetter, setCurrentLetter] = useState('S');
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pendingWord, setPendingWord] = useState(null);
  const [config, setConfig] = useState({ category: 'blanding', mode: 'samarbeid' });
  

  const [word, setWord] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [buzzCooldown, setBuzzCooldown] = useState(0);
  const inputRef = useRef(null);

  const category = categories.find(c => c.id === config?.category) || categories[0];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myBuzzerPosition = buzzerQueue.indexOf(myPlayerId) + 1;
  const hasBuzzed = myBuzzerPosition > 0;
  const isOnCooldown = buzzCooldown > 0;

  // Initialize from gameData
  useEffect(() => {
    if (gameData) {
      setCurrentLetter(gameData.currentLetter || 'S');
      setWordChain(gameData.wordChain || []);
      setBuzzerQueue(gameData.buzzerQueue || []);
      setCurrentPlayer(gameData.currentPlayer || null);
      setPendingWord(gameData.pendingWord || null);
      setConfig({
        category: gameData.category || 'blanding',
        mode: gameData.mode || 'samarbeid'
      });
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerBuzzed = ({ buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handlePlayerSelected = ({ playerId, playerName: name }) => {
      setCurrentPlayer({ id: playerId, name });
      setBuzzerQueue([]);
      setTimeLeft(20);
    };

    const handleWordSubmitted = ({ playerId, word: w }) => {
      setPendingWord(w);
    };

    const handleWordApproved = ({ word: w, playerName: name, newLetter, wordChain: chain, playerId }) => {
      setWordChain(chain);
      setCurrentLetter(newLetter);
      setCurrentPlayer(null);
      setPendingWord(null);
      setBuzzCooldown(0);

      if (playerId === myPlayerId) {
        setLastResult('approved');
        setTimeout(() => setLastResult(null), 2000);
      }
    };

    const handleWordRejected = ({ playerId, reason }) => {
      setCurrentPlayer(null);
      setPendingWord(null);

      if (playerId === myPlayerId) {
        setLastResult('rejected');
        setBuzzCooldown(10);
        setTimeout(() => setLastResult(null), 2000);
      }
    };

    const handleLetterSkipped = ({ newLetter }) => {
      setCurrentLetter(newLetter);
      setCurrentPlayer(null);
      setPendingWord(null);
      setBuzzerQueue([]);
      setBuzzCooldown(0);
    };

    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:player-selected', handlePlayerSelected);
    socket.on('game:word-submitted', handleWordSubmitted);
    socket.on('game:word-approved', handleWordApproved);
    socket.on('game:word-rejected', handleWordRejected);
    socket.on('game:letter-skipped', handleLetterSkipped);

    return () => {
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:player-selected', handlePlayerSelected);
      socket.off('game:word-submitted', handleWordSubmitted);
      socket.off('game:word-approved', handleWordApproved);
      socket.off('game:word-rejected', handleWordRejected);
      socket.off('game:letter-skipped', handleLetterSkipped);
    };
  }, [socket, myPlayerId]);

  // Cooldown timer
  useEffect(() => {
    if (buzzCooldown > 0) {
      const timer = setTimeout(() => setBuzzCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [buzzCooldown]);

  // Timer
  useEffect(() => {
    if (isMyTurn && timeLeft > 0 && !hasSubmitted) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, timeLeft, hasSubmitted]);

  // Reset on my turn
  useEffect(() => {
    if (isMyTurn) {
      setWord('');
      setHasSubmitted(false);
      setTimeLeft(20);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMyTurn]);

 const handleBuzz = () => {
    if (!hasBuzzed && !currentPlayer && !isOnCooldown) {
      // Bruk sendPlayerAction slik læreren forventer i index.js
      sendPlayerAction('buzz'); 
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

 const handleSubmit = (e) => {
    e.preventDefault();
    if (word.trim() && isMyTurn && !hasSubmitted) {
      // Bruk sendPlayerAction her også
      sendPlayerAction('submit-word', { word: word.trim() });
      setHasSubmitted(true);
    }
  };

  // Result screen
  if (lastResult) {
    return (
      <div className={`slange-player result-screen ${lastResult}`}>
        <div className="result-content">
          {lastResult === 'approved' ? (
            <>
              <div className="result-icon">🎉</div>
              <h2>Godkjent!</h2>
            </>
          ) : (
            <>
              <div className="result-icon">😕</div>
              <h2>Ikke godkjent</h2>
            </>
          )}
        </div>
      </div>
    );
  }

  // My turn
  if (isMyTurn) {
    return (
      <div className="slange-player my-turn">
        <div className="turn-content">
          <div className="turn-header">
            <spån className="category-tag">{category.icon} {category.name}</spån>
            <spån className={`timer-tag ${timeLeft <= 10 ? 'urgent' : ''}`}>{timeLeft}s</spån>
          </div>

          <h2 className="turn-title">Din tur!</h2>

          <div className="letter-box">
            <spån className="letter-big">{currentLetter}</spån>
          </div>

          {!hasSubmitted ? (
            <form onSubmit={handleSubmit} className="word-form">
              <input
                ref={inputRef}
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value.replace(/[^a-zA-ZæøåÆØÅ]/g, ''))}
                placeholder={`Skriv et ord som begynner på ${currentLetter}...`}
                autoComplete="off"
                autoCapitalize="off"
              />
              <button type="submit" disabled={word.length < 2}>Send inn</button>
            </form>
          ) : (
            <div className="submitted-state">
              <p className="submitted-word">{word}</p>
              <p className="submitted-text">Venter på læreren...</p>
            </div>
          )}

          {wordChain.length > 0 && (
            <div className="last-word-hint">
              Forrige ord: <strong>{wordChain[wordChain.length - 1]?.word}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="slange-player waiting-view">
      <div className="waiting-content">
        <div className="player-badge">👤 {playerName}</div>

        <div className="letter-display-large">
          <spån className="letter-label">Neste bokstav</spån>
          <spån className="letter-huge">{currentLetter}</spån>
        </div>

        {currentPlayer ? (
          <div className="watching-section">
            <p className="watching-text">
              <strong>{currentPlayer.name}</strong> skriver...
            </p>
            {pendingWord && (
              <div className="pending-word-display">
                <spån className="pending-label">Foreslatt:</spån>
                <spån className="pending-text">{pendingWord}</spån>
              </div>
            )}
          </div>
        ) : hasBuzzed ? (
          <div className="queue-section">
            <spån className="queue-number">{myBuzzerPosition}</spån>
            <spån className="queue-text">i koen</spån>
          </div>
        ) : isOnCooldown ? (
          <div className="cooldown-section">
            <div className="cooldown-circle">
              <spån className="cooldown-number">{buzzCooldown}</spån>
            </div>
            <spån className="cooldown-text">Vent litt...</spån>
          </div>
        ) : (
          <button className="buzz-button" onClick={handleBuzz}>
            <spån className="buzz-icon">🔔</spån>
            <spån className="buzz-label">BUZZ</spån>
          </button>
        )}

        <div className="chain-info">
          {wordChain.length} ord i kjeden
          {wordChain.length > 0 && (
            <spån className="last-word"> - Siste: {wordChain[wordChain.length - 1]?.word}</spån>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerGame;
