// game/src/components/LobbyMinigameSelector.jsx
import { useState } from 'react';
import LobbyJumper from './LobbyJumper';
import LobbyClicker from './LobbyClicker';
import LobbyEmojiRain from './LobbyEmojiRain';
import LobbyPatternMatcher from './LobbyPatternMatcher';
import LobbyFlappy from './LobbyFlappy';
import './LobbyMinigames.css';

const MINIGAMES = [
  { id: 'jumper', name: 'Hopp', icon: '🏃', component: LobbyJumper },
  { id: 'flappy', name: 'Flappy', icon: '🐦', component: LobbyFlappy },
  { id: 'clicker', name: 'Klikker', icon: '👆', component: LobbyClicker },
  { id: 'emoji', name: 'Emoji', icon: '🌧️', component: LobbyEmojiRain },
  { id: 'pattern', name: 'Mønster', icon: '🧠', component: LobbyPatternMatcher },
];

function LobbyMinigameSelector() {
  const [selectedGame, setSelectedGame] = useState(() => {
    const saved = localStorage.getItem('lobbyMinigameChoice');
    return saved && MINIGAMES.find(g => g.id === saved) ? saved : 'jumper';
  });

  const handleSelect = (id) => {
    setSelectedGame(id);
    localStorage.setItem('lobbyMinigameChoice', id);
  };

  const ActiveGame = MINIGAMES.find(g => g.id === selectedGame)?.component || LobbyJumper;

  return (
    <div className="minigame-selector-wrapper">
      <div className="minigame-tabs">
        {MINIGAMES.map(game => (
          <button
            key={game.id}
            className={`minigame-tab ${selectedGame === game.id ? 'active' : ''}`}
            onClick={() => handleSelect(game.id)}
          >
            <span className="tab-icon">{game.icon}</span>
            <span className="tab-name">{game.name}</span>
          </button>
        ))}
      </div>
      <div className="minigame-content">
        <ActiveGame key={selectedGame} />
      </div>
    </div>
  );
}

export default LobbyMinigameSelector;
