// game/src/components/Lobby.jsx
import { useState } from 'react';
import { useGame } from '../contexts/GameContext';

const GAME_NAMES = {
  'gjett-bildet': { name: 'Gjett Bildet', icon: '🖼️' },
  'slange': { name: 'Ordslangen', icon: '🐍' },
  'tallkamp': { name: 'Tallkamp', icon: '🔢' },
  'quiz': { name: 'Quiz', icon: '❓' },
  'tidslinje': { name: 'Tidslinje', icon: '📅' },
  'ja-eller-nei': { name: 'Ja eller Nei', icon: '✅' }
};

const SLANGE_CATEGORIES = [
  { id: 'dyr', name: 'Dyr', icon: '🐾' },
  { id: 'land', name: 'Land', icon: '🌍' },
  { id: 'mat', name: 'Mat og drikke', icon: '🍕' },
  { id: 'navn', name: 'Personnavn', icon: '👤' },
  { id: 'ting', name: 'Ting/Gjenstander', icon: '📦' },
  { id: 'steder', name: 'Steder i Norge', icon: '🏔️' },
  { id: 'yrker', name: 'Yrker', icon: '👷' },
  { id: 'natur', name: 'Natur', icon: '🌲' },
  { id: 'sport', name: 'Sport og aktiviteter', icon: '⚽' },
  { id: 'blanding', name: 'Alt mulig', icon: '🎲' }
];

function Lobby() {
  const {
    roomCode,
    players,
    isHost,
    playerName,
    currentGame,
    gameState,
    startGame,
    kickPlayer,
    resetGameState,
    returnToLobby
  } = useGame();

  // Slange-konfigurasjon
  const [slangeCategory, setSlangeCategory] = useState('blanding');
  const [slangeMode, setSlangeMode] = useState('samarbeid');

  const gameInfo = GAME_NAMES[currentGame] || { name: currentGame, icon: '🎮' };

  const handleStartGame = () => {
    if (currentGame === 'slange') {
      startGame({ category: slangeCategory, mode: slangeMode });
    } else {
      startGame();
    }
  };

  // Host lobby view
  if (isHost) {
    return (
      <div className="lobby-container host-lobby">
        <div className="lobby-header">
          <span className="game-badge">
            {gameInfo.icon} {gameInfo.name}
          </span>
          <button className="btn-close" onClick={resetGameState} title="Avslutt rom">✕</button>
        </div>

        <div className="lobby-main-layout">
          {/* Left side - Room info and start action */}
          <div className="lobby-info-section">
            <div className="room-code-display">
              <span className="room-code-label">Romkode:</span>
              <span className="room-code-value">{roomCode}</span>
            </div>

            <div className="join-url">
              <span>Gå inn på: <strong>game.ak-kreativ.no</strong></span>
            </div>

            {/* Slange-konfigurasjon */}
            {currentGame === 'slange' && (
              <div className="slange-config">
                <div className="config-group">
                  <label>Kategori:</label>
                  <select
                    value={slangeCategory}
                    onChange={(e) => setSlangeCategory(e.target.value)}
                    className="config-select"
                  >
                    {SLANGE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="config-group">
                  <label>Modus:</label>
                  <div className="mode-buttons">
                    <button
                      className={`mode-btn ${slangeMode === 'samarbeid' ? 'active' : ''}`}
                      onClick={() => setSlangeMode('samarbeid')}
                    >
                      🤝 Samarbeid
                    </button>
                    <button
                      className={`mode-btn ${slangeMode === 'konkurranse' ? 'active' : ''}`}
                      onClick={() => setSlangeMode('konkurranse')}
                    >
                      🏆 Konkurranse
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-start"
              onClick={handleStartGame}
              disabled={players.length === 0}
            >
              Start spill
            </button>
            {/* Vis "Bytt spill" hvis vi kom fra en lobby */}
            {gameState === 'LOBBY_GAME_SELECTED' && (
              <button
                className="btn btn-secondary"
                onClick={returnToLobby}
                style={{ marginTop: '1rem' }}
              >
                Bytt spill
              </button>
            )}
          </div>

          {/* Right side - Player list */}
          <aside className="players-sidebar">
            <h3>Spillere ({players.length})</h3>
            <div className="sidebar-content">
              {players.length === 0 ? (
                <p className="no-players">Venter på at elever skal bli med...</p>
              ) : (
                <ul className="players-list">
                  {players.map((player) => (
                    <li key={player.id} className="player-item">
                      <span className="player-name">{player.name}</span>
                      <button
                        className="btn-kick"
                        onClick={() => kickPlayer(player.id)}
                        title="Fjern spiller"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Player lobby view
  return (
    <div className="lobby-container player-lobby">
      <div className="lobby-header">
        <span className="game-badge">
          {gameInfo.icon} {gameInfo.name}
        </span>
      </div>

      <div className="player-info">
        <span className="player-badge">👤 {playerName}</span>
        <span className="room-badge">Rom: {roomCode}</span>
      </div>

      <div className="waiting-message">
        <div className="spinner"></div>
        <p>Venter på at læreren skal starte spillet...</p>
      </div>

      <div className="players-count">
        {players.length} {players.length === 1 ? 'spiller' : 'spillere'} i rommet
      </div>
    </div>
  );
}

export default Lobby;