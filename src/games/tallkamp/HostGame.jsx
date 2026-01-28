// Placeholder - to be implemented
import { useGame } from '../../contexts/GameContext';

function HostGame() {
  const { endGame } = useGame();
  
  return (
    <div className="game-placeholder">
      <h2>Host Game - Coming Soon</h2>
      <button onClick={endGame}>Avslutt</button>
    </div>
  );
}

export default HostGame;
