// game/src/games/slange/HostGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { categories } from '../../data/slangeCategories';
import './Slange.css';

function HostGame() {
  const {
    socket,
    players,
    roomCode,
    endGame,
    sendGameAction,
    gameData
  } = useGame();

  const [wordChain, setWordChain] = useState([]);
  const [currentLetter, setCurrentLetter] = useState('S');
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pendingWord, setPendingWord] = useState(null);
  const [config, setConfig] = useState({ category: 'blanding', mode: 'samarbeid' });
  const [timeLeft, setTimeLeft] = useState(20);
  const [localPlayers, setLocalPlayers] = useState([]); // Lokal spiller-state for poeng-oppdatering

  const category = categories.find(c => c.id === config?.category) || categories[0];

  // Synkroniser localPlayers med context players
  const displayPlayers = localPlayers.length > 0 ? localPlayers : players;
  const connectedPlayers = displayPlayers.filter(p => p.isConnected);

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

    const handlePlayerBuzzed = ({ playerId, buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handlePlayerSelected = ({ playerId, playerName }) => {
      setCurrentPlayer({ id: playerId, name: playerName });
      setBuzzerQueue([]);
      setTimeLeft(20);
    };

    const handleWordSubmitted = ({ playerId, word }) => {
      setPendingWord(word);
    };

    const handleWordApproved = ({ word, playerName, newLetter, wordChain: chain, players: updatedPlayers }) => {
      setWordChain(chain);
      setCurrentLetter(newLetter);
      setCurrentPlayer(null);
      setPendingWord(null);
      // Oppdater lokal spillerliste med nye poeng
      if (updatedPlayers) {
        setLocalPlayers(updatedPlayers);
      }
    };

    const handleWordRejected = ({ playerId, reason, players: updatedPlayers }) => {
      setCurrentPlayer(null);
      setPendingWord(null);
      // Oppdater lokal spillerliste med nye poeng
      if (updatedPlayers) {
        setLocalPlayers(updatedPlayers);
      }
      console.log('Ord avslått:', reason);
    };

    const handleLetterSkipped = ({ newLetter }) => {
      setCurrentLetter(newLetter);
      setCurrentPlayer(null);
      setPendingWord(null);
      setBuzzerQueue([]);
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
  }, [socket]);

  // Timer countdown
  useEffect(() => {
    if (currentPlayer && timeLeft > 0 && !pendingWord) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, timeLeft, pendingWord]);

  const handleSelectPlayer = (playerId) => {
    if (!currentPlayer) {
      sendGameAction('select-player', { playerId });
    }
  };

  const handleApprove = () => {
    sendGameAction('approve-word');
  };

  const handleReject = () => {
    sendGameAction('reject-word');
  };

  const handleSkipLetter = () => {
    sendGameAction('skip-letter');
  };

  const getPlayerName = (playerId) => {
    const player = displayPlayers.find(p => p.id === playerId);
    return player?.name || 'Ukjent';
  };

  const canSelectPlayer = (player) => {
    return player.isConnected && player.canBuzz !== false && !currentPlayer;
  };

  return (
    <div className="slange-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="category-badge">
            {category.icon} {category.name}
          </span>
          <span className="mode-badge">
            {config?.mode === 'samarbeid' ? '🤝 Samarbeid' : '🏆 Konkurranse'}
          </span>
        </div>
        <div className="room-info">
          <span className="room-code">Rom: {roomCode}</span>
          <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
        </div>
      </header>

      {/* Main game area */}
      <main className="game-main">
        {/* Word chain display - Snake style */}
        <section className="word-chain-section">
          <div className="chain-header">
            <h2>Ordslangen</h2>
            <div className="chain-stats">
              <span className="stat-value">{wordChain.length}</span>
              <span className="stat-label">ord</span>
            </div>
          </div>

          <div className="word-chain-display snake-style">
            {wordChain.length === 0 ? (
              <div className="chain-empty">
                <p>Første ord må begynne med bokstaven</p>
                <span className="start-letter">{currentLetter}</span>
              </div>
            ) : (
              <div className="snake-container">
                {(() => {
                  const wordsPerRow = 4;
                  const rows = [];
                  for (let i = 0; i < wordChain.length; i += wordsPerRow) {
                    rows.push(wordChain.slice(i, i + wordsPerRow));
                  }

                  return rows.map((row, rowIndex) => {
                    const isReversed = rowIndex % 2 === 1;

                    return (
                      <div
                        key={rowIndex}
                        className={`snake-row ${isReversed ? 'reversed' : ''}`}
                      >
                        {row.map((item, colIndex) => {
                          const actualIndex = rowIndex * wordsPerRow + colIndex;
                          const isFirst = actualIndex === 0;
                          const isLast = actualIndex === wordChain.length - 1;

                          return (
                            <div
                              key={actualIndex}
                              className={`snake-segment ${isFirst ? 'snake-head' : ''} ${isLast ? 'snake-tail' : ''}`}
                            >
                              <div className="segment-content">
                                <span className="segment-word">{item.word}</span>
                                <span className="segment-connector">
                                  {item.word.slice(-1).toUpperCase()}
                                </span>
                              </div>
                              <span className="segment-player">{item.playerName}</span>
                            </div>
                          );
                        })}
                        {rowIndex < rows.length - 1 && (
                          <div className={`snake-turn ${isReversed ? 'turn-left' : 'turn-right'}`}>
                            <span className="turn-arrow">{isReversed ? '↲' : '↳'}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Next letter indicator */}
          <div className="next-letter-display">
            <span className="label">Neste bokstav:</span>
            <span className="letter">{currentLetter}</span>
            <button
              className="btn btn-skip"
              onClick={handleSkipLetter}
              title="Hopp over denne bokstaven og få en ny tilfeldig"
            >
              Ny bokstav
            </button>
          </div>
        </section>

        {/* Control panel */}
        <section className="control-panel">
          {/* Pending word approval */}
          {pendingWord && currentPlayer && (
            <div className="pending-word-card">
              <div className="pending-header">
                <span className="pending-player">{currentPlayer.name} foreslår:</span>
              </div>
              <div className="pending-word">{pendingWord}</div>
              <div className="pending-check">
                Begynner med <strong>{currentLetter}</strong>?
                {pendingWord.toUpperCase().startsWith(currentLetter) ? ' ✓' : ' ✗'}
              </div>
              <div className="pending-actions">
                <button className="btn btn-approve" onClick={handleApprove}>
                  ✓ Godkjenn
                </button>
                <button className="btn btn-reject" onClick={handleReject}>
                  ✗ Avslå
                </button>
              </div>
            </div>
          )}

          {/* Current player waiting for word */}
          {currentPlayer && !pendingWord && (
            <div className="waiting-card">
              <div className="waiting-info">
                <span className="waiting-name">{currentPlayer.name}</span>
                <span className="waiting-text">skriver...</span>
              </div>
              <div className="timer-display">
                <svg className="timer-ring" viewBox="0 0 100 100">
                  <circle className="timer-bg" cx="50" cy="50" r="45" />
                  <circle
                    className="timer-progress"
                    cx="50" cy="50" r="45"
                    style={{ strokeDashoffset: 283 - (283 * timeLeft / 20) }}
                  />
                </svg>
                <span className="timer-text">{timeLeft}</span>
              </div>
            </div>
          )}

          {/* Buzzer queue - only show if no one selected */}
          {!currentPlayer && buzzerQueue.length > 0 && (
            <div className="buzzer-section">
              <h3>Buzzerkø ({buzzerQueue.length})</h3>
              <ul className="buzzer-list">
                {buzzerQueue.map((playerId, index) => (
                  <li key={playerId} className="buzzer-item">
                    <span className="buzzer-position">{index + 1}</span>
                    <span className="buzzer-name">{getPlayerName(playerId)}</span>
                    <button
                      className="btn btn-select"
                      onClick={() => handleSelectPlayer(playerId)}
                    >
                      Velg
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Waiting for buzz */}
          {!currentPlayer && buzzerQueue.length === 0 && (
            <div className="waiting-buzz">
              <div className="waiting-buzz-icon">🔔</div>
              <p>Venter på at noen buzzer inn...</p>
              <p className="hint">Eller velg en elev fra listen →</p>
            </div>
          )}
        </section>
      </main>

      {/* Player sidebar - clickable to select */}
      <aside className="players-sidebar">
        <h3>Spillere ({connectedPlayers.length})</h3>
        <p className="sidebar-hint">Klikk for å velge</p>
        <ul className="player-stats-list">
          {displayPlayers
            .filter(p => p.isConnected)
            .sort((a, b) => config?.mode === 'konkurranse'
              ? (b.score || 0) - (a.score || 0)
              : (b.wordsSubmitted || 0) - (a.wordsSubmitted || 0))
            .slice(0, 5)
            .map((player, index) => (
              <li
                key={player.id}
                className={`player-stat-item ${canSelectPlayer(player) ? 'selectable' : ''} ${currentPlayer?.id === player.id ? 'active' : ''} ${player.canBuzz === false ? 'penalty' : ''}`}
                onClick={() => canSelectPlayer(player) && handleSelectPlayer(player.id)}
              >
                <span className="player-rank">{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className={`player-words ${config?.mode === 'konkurranse' && player.score < 0 ? 'negative' : ''}`}>
                  {config?.mode === 'konkurranse' ? (player.score || 0) : (player.wordsSubmitted || 0)}
                </span>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
