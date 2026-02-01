// game/src/components/PlayerJoin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './PlayerJoin.css';

function PlayerJoin() {
  const navigate = useNavigate();
  const { joinRoom, error } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      setIsJoining(true);
      setIsTakingLong(false);

      // Start timer for å vise "Vekker server"-beskjed
      const timer = setTimeout(() => setIsTakingLong(true), 4000);

      try {
        await joinRoom({
          playerName: playerName.trim(),
          roomCode: roomCode.trim().toUpperCase()
        });
      } finally {
        clearTimeout(timer);
        setIsJoining(false);
        setIsTakingLong(false);
      }
    }
  };

  return (
    <div className="player-join-screen">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Tilbake
      </button>

      <div className="join-content">
        <div className="join-header">
          <div className="join-icon">🎮</div>
          <h1 className="join-title">Bli med</h1>
          <p className="join-subtitle">Skriv inn kode og navn</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="roomCode">Romkode</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              className="input-field room-code-field"
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerName">Ditt navn</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Skriv navnet ditt"
              maxLength={20}
              autoComplete="off"
              className="input-field"
              disabled={isJoining}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          {isTakingLong && (
            <div className="wake-up-notice">
              <span className="wake-icon">⏳</span>
              <p>Vekker serveren... Dette kan ta 10-20 sekunder.</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-join"
            disabled={!playerName.trim() || roomCode.length < 6 || isJoining}
          >
            {isJoining ? 'Kobler til...' : 'BLI MED'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlayerJoin;
