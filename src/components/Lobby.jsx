// game/src/components/Lobby.jsx
import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import LobbyMinigameSelector, { MINIGAMES } from './LobbyMinigameSelector';
import { TIDSLINJE_CATEGORIES } from '../data/tidslinjeEvents';
import './LobbyIdle.css'; // Gjenbruk stiler for join-info

const GAME_NAMES = {
  'gjett-bildet': { name: 'Gjett Bildet', icon: '🖼️' },
  'slange': { name: 'Ordslangen', icon: '🐍' },
  'tallkamp': { name: 'Tallkamp', icon: '🔢' },
  'quiz': { name: 'Quiz', icon: '❓' },
  'tidslinje': { name: 'Tidslinje', icon: '📅' },
  'ja-eller-nei': { name: 'Ja eller Nei', icon: '✅' },
  'vil-du-heller': { name: 'Vil du heller?', icon: '🤔' },
  'nerdle': { name: 'Nerdle', icon: '🧮' },
  'hva-mangler': { name: 'Hva mangler?', icon: '👁️' },
  'tegn-det': { name: 'Tegn det!', icon: '🎨' },
  'squiggle-story': { name: 'Krusedull', icon: '〰️' }
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
    returnToLobby,
    lobbyMinigame,
    selectMinigame,
    isDemoActive,
    enableDemo,
    disableDemo
  } = useGame();

  // Slange-konfigurasjon
  const [slangeCategory, setSlangeCategory] = useState('blanding');
  const [slangeMode, setSlangeMode] = useState('samarbeid');

  // Tidslinje-konfigurasjon
  const [tidslinjeCategory, setTidslinjeCategory] = useState('blanding');

  const gameInfo = GAME_NAMES[currentGame] || { name: currentGame, icon: '🎮' };
  const joinUrl = import.meta.env.VITE_APP_URL || 'game.ak-kreativ.no';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${joinUrl}`;

  const handleStartGame = () => {
    if (currentGame === 'slange') {
      startGame({ category: slangeCategory, mode: slangeMode });
    } else if (currentGame === 'tidslinje') {
      startGame({ category: tidslinjeCategory });
    } else {
      startGame();
    }
  };

  // Host lobby view
  if (isHost) {
    return (
      <div className="lobby-container host-lobby">
        <div className="lobby-header lobby-idle-header" style={{ maxWidth: 'none', width: '100%' }}>
          <div className="join-info-large">
            <div className="qr-section">
              <img src={qrCodeUrl} alt="QR-kode for å bli med" className="qr-code" />
            </div>
            <div className="join-details">
              <div className="join-url-large">
                <span className="url-label">Gå til:</span>
                <span className="url-value">{joinUrl}</span>
              </div>
              <div className="room-code-large">
                <span className="code-label">Kode:</span>
                <span className="code-value">{roomCode}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="game-badge" style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}>
              {gameInfo.icon} {gameInfo.name}
            </span>
            {/* Minigame selector for teacher */}
            <div className="minigame-tabs host-minigame-tabs">
              {MINIGAMES.map(game => (
                <button
                  key={game.id}
                  className={`minigame-tab ${lobbyMinigame === game.id ? 'active' : ''}`}
                  onClick={() => selectMinigame(game.id)}
                  title={game.name}
                >
                  <span className="tab-icon">{game.icon}</span>
                </button>
              ))}
            </div>
            {!isDemoActive ? (
              <button className="btn-demo" onClick={() => enableDemo()} title="Legg til demo-elever">Demo</button>
            ) : (
              <button className="btn-demo active" onClick={() => disableDemo()} title="Fjern demo-elever">Fjern demo</button>
            )}
            <button className="btn-close" onClick={() => resetGameState()} title="Avslutt rom">✕</button>
          </div>
        </div>

        <div className="lobby-main-layout">
          {/* Left side - Room info and start action */}
          <div className="lobby-info-section">

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

            {/* Tidslinje-konfigurasjon */}
            {currentGame === 'tidslinje' && (
              <div className="slange-config">
                <div className="config-group">
                  <label>Kategori:</label>
                  <select
                    value={tidslinjeCategory}
                    onChange={(e) => setTidslinjeCategory(e.target.value)}
                    className="config-select"
                  >
                    {TIDSLINJE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
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
                onClick={() => returnToLobby()}
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
        <p>Venter på at læreren skal starte spillet...</p>
        <p className="sub">Spill minispillet under mens du venter!</p>
      </div>

      <div className="minigame-container">
        <LobbyMinigameSelector gameId={lobbyMinigame} />
      </div>

      <div className="players-count">
        {players.length} {players.length === 1 ? 'spiller' : 'spillere'} i rommet
      </div>
    </div>
  );
}

export default Lobby;
