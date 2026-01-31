// game/src/components/LobbyIdle.jsx
import { useGame } from '../contexts/GameContext';
import LobbyJumper from './LobbyJumper';
import './LobbyIdle.css';

const AVAILABLE_GAMES = [
  { id: 'quiz', name: 'Quiz', icon: '❓', description: 'Svar på spørsmål og samle poeng' },
  { id: 'gjett-bildet', name: 'Gjett Bildet', icon: '🖼️', description: 'Gjett hva bildet viser' },
  { id: 'slange', name: 'Ordslangen', icon: '🐍', description: 'Lag ordkjede' },
  { id: 'tallkamp', name: 'Tallkamp', icon: '🔢', description: 'Regn ut måltallet' },
  { id: 'tidslinje', name: 'Tidslinje', icon: '📅', description: 'Sorter hendelser kronologisk' },
  { id: 'ja-eller-nei', name: 'Ja eller Nei', icon: '✅', description: 'Svar riktig for å overleve' }
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
    lobbyData
  } = useGame();

  // Host view - spillvelger
  if (isHost) {
    return (
      <div className="lobby-idle-container host-lobby-idle">
        <header className="lobby-idle-header">
          <div className="room-info">
            <span className="room-code-label">Romkode:</span>
            <span className="room-code-value">{roomCode}</span>
          </div>
          <div className="join-url">
            <span>game.ak-kreativ.no</span>
          </div>
          <button className="btn-close" onClick={() => resetGameState()} title="Avslutt rom">✕</button>
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

          {/* Klassens fremgang i minispillet */}
          {lobbyData.totalScore > 0 && (
            <section className="class-progress">
              <h3>Klassens poeng fra minispill</h3>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (lobbyData.totalScore / 50000) * 100)}%` }}
                />
                <span className="progress-text">{lobbyData.totalScore.toLocaleString()} / 50 000</span>
              </div>
              {lobbyData.leaderboard.length > 0 && (
                <div className="mini-leaderboard">
                  <h4>Topp 5</h4>
                  <ol>
                    {lobbyData.leaderboard.slice(0, 5).map((entry, index) => (
                      <li key={entry.playerId}>
                        <span className="rank">{index + 1}.</span>
                        <span className="name">{entry.playerName}</span>
                        <span className="score">{entry.totalScore}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
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
          <LobbyJumper />
        </div>
      </main>
    </div>
  );
}

export default LobbyIdle;
