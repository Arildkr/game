// game/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { useGame } from './contexts/GameContext';
import Home from './components/Home';
import HostSetup from './components/HostSetup';
import PlayerJoin from './components/PlayerJoin';
import Lobby from './components/Lobby';
import LobbyIdle from './components/LobbyIdle';
import GameRouter from './components/GameRouter';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const {
    isConnected,
    isConnecting,
    showWakeUpMessage,
    connectionError,
    retryConnection,
    roomCode,
    isHost,
    gameState,
    currentGame,
    error,
    setError
  } = useGame();

  // Connection screen
  if (!isConnected) {
    return (
      <div className="app connecting-screen">
        <div className="connecting-content">
          <div className="spinner"></div>
          <h2>Kobler til...</h2>
          {showWakeUpMessage && (
            <p className="wake-up-message">
              Serveren starter opp. Dette kan ta opptil 30 sekunder...
            </p>
          )}
          {connectionError && (
            <p className="connection-error">{connectionError}</p>
          )}
          <button onClick={retryConnection} className="btn btn-retry">
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  if (error && !roomCode) {
    return (
      <div className="app error-screen">
        <div className="error-content">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-primary">
            Tilbake
          </button>
        </div>
      </div>
    );
  }

  // In a room - show lobby or game
  if (roomCode) {
    if (gameState === 'PLAYING' || gameState === 'GAME_OVER') {
      return (
        <div className="app">
          <ErrorBoundary>
            <GameRouter />
          </ErrorBoundary>
        </div>
      );
    }

    // Vis LobbyIdle hvis ingen spill er valgt ennå
    if (gameState === 'LOBBY_IDLE') {
      return (
        <div className="app">
          <LobbyIdle />
        </div>
      );
    }

    // Vis vanlig Lobby hvis spill er valgt (LOBBY eller LOBBY_GAME_SELECTED)
    return (
      <div className="app">
        <Lobby />
      </div>
    );
  }

  // Initial setup - routes
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<HostSetup />} />
        <Route path="/join" element={<PlayerJoin />} />
      </Routes>
    </div>
  );
}

export default App;
