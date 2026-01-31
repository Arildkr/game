// game/src/components/HostSetup.jsx
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const GAMES = [
  {
    id: 'gjett-bildet',
    name: 'Gjett Bildet',
    icon: '🖼️',
    description: 'Elevene buzzer inn og gjetter hva som skjuler seg bak rutene'
  },
  {
    id: 'slange',
    name: 'Ordslangen',
    icon: '🐍',
    description: 'Lag en lang ordkjede der hvert ord starter med forrige ords siste bokstav'
  },
  {
    id: 'tallkamp',
    name: 'Tallkamp',
    icon: '🔢',
    description: 'Bruk de gitte tallene for å komme nærmest måltallet'
  },
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '❓',
    description: 'Svar på spørsmål og konkurrer om flest poeng'
  },
  {
    id: 'tidslinje',
    name: 'Tidslinje',
    icon: '📅',
    description: 'Plasser historiske hendelser i riktig rekkefølge'
  },
  {
    id: 'ja-eller-nei',
    name: 'Ja eller Nei',
    icon: '✅',
    description: 'Svar riktig eller bli eliminert - siste elev igjen vinner!'
  }
];

function HostSetup() {
  const navigate = useNavigate();
  const { createRoom, createLobby } = useGame();

  const handleSelectGame = (gameId) => {
    createRoom(gameId);
  };

  const handleCreateLobby = () => {
    createLobby();
  };

  return (
    <div className="host-setup-container">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Tilbake
      </button>

      <h2>Velg startmodus</h2>

      {/* Ny: Opprett lobby først */}
      <div className="lobby-option">
        <button className="lobby-card" onClick={handleCreateLobby}>
          <span className="lobby-icon">🏠</span>
          <span className="lobby-name">Opprett lobby først</span>
          <span className="lobby-description">
            La elevene logge inn før du velger spill. De kan spille minispill mens de venter.
            Når et spill er ferdig, returnerer alle til lobbyen.
          </span>
        </button>
      </div>

      <div className="divider">
        <span>eller velg spill direkte</span>
      </div>

      <div className="game-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className="game-card"
            onClick={() => handleSelectGame(game.id)}
          >
            <span className="game-icon">{game.icon}</span>
            <span className="game-name">{game.name}</span>
            <span className="game-description">{game.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HostSetup;
