// game/src/components/PlayerJoin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

function PlayerJoin() {
  const navigate = useNavigate();
  const { joinRoom, error } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      joinRoom({ playerName: playerName.trim(), roomCode: roomCode.trim().toUpperCase() });
    }
  };

  return (
    <div className="player-join-container">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Tilbake
      </button>

      <h2>Bli med i spill</h2>

      <form onSubmit={handleSubmit} className="join-form">
        <div className="form-group">
          <label htmlFor="roomCode">Romkode:</label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="F.eks. ABC123"
            maxLength={6}
            autoComplete="off"
            className="room-code-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="playerName">Ditt navn:</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Skriv inn navnet ditt"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!playerName.trim() || roomCode.length < 6}
        >
          Bli med
        </button>
      </form>
    </div>
  );
}

export default PlayerJoin;
