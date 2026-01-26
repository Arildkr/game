// game/src/components/Lobby.jsx
import { useGame } from '../contexts/GameContext';

const GAME_NAMES = {
  'gjett-bildet': { name: 'Gjett Bildet', icon: '🖼️' },
  'slange': { name: 'Ordslangen', icon: '🐍' },
  'tallkamp': { name: 'Tallkamp', icon: '🔢' },
  'quiz': { name: 'Quiz', icon: '❓' },
  'tidslinje': { name: 'Tidslinje', icon: '📅' },
  'ja-eller-nei': { name: 'Ja eller Nei', icon: '✅' }
};

function Lobby() {
  const {
    roomCode,
    players,
    isHost,
    playerName,
    currentGame,
    startGame,
    kickPlayer,
    resetGameState
  } = useGame();

  const gameInfo = GAME_NAMES[currentGame] || { name: currentGame, icon: '🎮' };

  // Host lobby view
  if (isHost) {
    return (
      <div className="lobby-container host-lobby">
        <div className="lobby-header">
          <span className="game-badge">
            {gameInfo.icon} {gameInfo.name}
          </span>
          <button className="btn-close" onClick={resetGameState}>✕</button>
        </div>

        <div className="room-code-display">
          <span className="room-code-label">Romkode:</span>
          <span className="room-code-value">{roomCode}</span>
        </div>

        <div className="join-url">
          <span>game.ak-kreativ.no</span>
        </div>

        <div className="players-section">
          <h3>Spillere ({players.length})</h3>
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

        <button
          className="btn btn-start"
          onClick={() => startGame()}
          disabled={players.length === 0}
        >
          Start spill
        </button>
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
