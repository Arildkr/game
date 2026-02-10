// game/src/components/LobbyIdle.jsx
import { useGame } from '../contexts/GameContext';
import LobbyMinigameSelector, { MINIGAMES } from './LobbyMinigameSelector';
import './LobbyIdle.css';

const AVAILABLE_GAMES = [
  { id: 'quiz', name: 'Quiz', icon: '❓', description: 'Svar på spørsmål og samle poeng' },
  { id: 'gjett-bildet', name: 'Gjett Bildet', icon: '🖼️', description: 'Gjett hva bildet viser' },
  { id: 'slange', name: 'Ordslangen', icon: '🐍', description: 'Lag ordkjede' },
  { id: 'tallkamp', name: 'Tallkamp', icon: '🔢', description: 'Regn ut måltallet' },
  { id: 'tidslinje', name: 'Tidslinje', icon: '📅', description: 'Sorter hendelser kronologisk' },
  { id: 'ja-eller-nei', name: 'Ja eller Nei', icon: '✅', description: 'Svar riktig for å overleve' },
  { id: 'nerdle', name: 'Nerdle', icon: '🧮', description: 'Matematisk Wordle' },
  { id: 'hva-mangler', name: 'Hva mangler?', icon: '👁️', description: 'Husk og finn det som forsvant' },
  { id: 'tegn-det', name: 'Tegn det!', icon: '🎨', description: 'Tegn og gjett' },
  { id: 'squiggle-story', name: 'Krusedull', icon: '〰️', description: 'Lag kunst fra en krusedull' },
  { id: 'vil-du-heller', name: 'Vil du heller?', icon: '🤔', description: 'Stem på dilemmaer' },
  { id: 'stemningssjekk', name: 'Stemningssjekk', icon: '🎭', description: 'Se stemningen i klassen' }
];

function LobbyIdle() {
  const {
    roomCode,
    players,
    isHost,
    playerName,
    selectGame,
    kickPlayer,
    resetGameState,
    lobbyData,
    lobbyMinigame,
    selectMinigame,
    isDemoActive,
    enableDemo,
    disableDemo
  } = useGame();

  const joinUrl = import.meta.env.VITE_APP_URL || 'game.ak-kreativ.no';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${joinUrl}`;

  // Host view - spillvelger
  if (isHost) {
    return (
      <div className="lobby-idle-container host-lobby-idle">
        <header className="lobby-idle-header">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
        </header>

        <main className="lobby-idle-main">
          <section className="game-selection">
            <h2>Velg et spill</h2>
            <div className="game-grid">
              {AVAILABLE_GAMES.map(game => (
                <button
                  key={game.id}
                  className="game-card"
                  onClick={() => selectGame(game.id)}
                >
                  <span className="game-icon">{game.icon}</span>
                  <span className="game-name">{game.name}</span>
                  <span className="game-desc">{game.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Klassens fremgang i minispillet - per-spill scoreboard */}
          {lobbyData.totalScore > 0 && (
            <section className="class-progress">
              <h3>Klassens poeng fra minispill</h3>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (lobbyData.totalScore / 5000) * 100)}%` }}
                />
                <span className="progress-text">{lobbyData.totalScore.toLocaleString()} / 5 000</span>
              </div>
              {(() => {
                const GAME_LABELS = {
                  jumper: { name: 'Hopp', scoreLabel: 'Beste', totalLabel: 'Totalt' },
                  flappy: { name: 'Flappy', scoreLabel: 'Beste', totalLabel: 'Totalt' },
                  clicker: { name: 'Klikker', scoreLabel: 'Beste', totalLabel: 'Totalt' },
                  emoji: { name: 'Emoji-Regn', scoreLabel: 'Beste', totalLabel: 'Totalt' },
                  pattern: { name: 'Mønster', scoreLabel: 'Beste', totalLabel: 'Totalt' },
                };
                const gameId = lobbyMinigame || 'jumper';
                const gameLabel = GAME_LABELS[gameId] || GAME_LABELS.jumper;
                const gameBoard = lobbyData.gameLeaderboards?.[gameId] || [];
                const totalBoard = lobbyData.leaderboard || [];

                return (
                  <>
                    {gameBoard.length > 0 && (
                      <div className="mini-leaderboard">
                        <h4>{gameLabel.name} - Topp 5</h4>
                        <ol>
                          {gameBoard.slice(0, 5).map((entry, index) => (
                            <li key={entry.playerId}>
                              <span className="rank">{index + 1}.</span>
                              <span className="name">{entry.playerName}</span>
                              <span className="score" title={`${gameLabel.totalLabel}: ${entry.totalScore}`}>
                                {gameLabel.scoreLabel}: {entry.bestScore}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {totalBoard.length > 0 && (
                      <div className="mini-leaderboard total-leaderboard">
                        <h4>Samlet - Topp 5</h4>
                        <ol>
                          {totalBoard.slice(0, 5).map((entry, index) => (
                            <li key={entry.playerId}>
                              <span className="rank">{index + 1}.</span>
                              <span className="name">{entry.playerName}</span>
                              <span className="score">{entry.totalScore}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}
        </main>

        <aside className="players-sidebar">
          <h3>Spillere ({players.length})</h3>
          <div className="sidebar-content">
            {players.length === 0 ? (
              <p className="no-players">Venter på at elever skal bli med...</p>
            ) : (
              <ul className="players-list">
                {players.map((player) => (
                  <li key={player.id} className="player-item">
                    <span className="player-status">{player.isConnected ? '🟢' : '🔴'}</span>
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
    );
  }

  // Player view - minispill
  return (
    <div className="lobby-idle-container player-lobby-idle">
      <header className="player-lobby-header">
        <span className="player-badge">👤 {playerName}</span>
        <span className="room-badge">Rom: {roomCode}</span>
      </header>

      <main className="player-lobby-main">
        <div className="waiting-info">
          <p>Venter på at læreren skal velge et spill...</p>
          <p className="sub">Spill minispillet under mens du venter!</p>
        </div>

        <div className="minigame-section">
          <LobbyMinigameSelector gameId={lobbyMinigame} />
        </div>
      </main>
    </div>
  );
}

export default LobbyIdle;
