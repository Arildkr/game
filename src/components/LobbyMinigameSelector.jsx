// game/src/components/LobbyMinigameSelector.jsx
import LobbyJumper from './LobbyJumper';
import LobbyClicker from './LobbyClicker';
import LobbyEmojiRain from './LobbyEmojiRain';
import LobbyPatternMatcher from './LobbyPatternMatcher';
import LobbyFlappy from './LobbyFlappy';
import './LobbyMinigames.css';

export const MINIGAMES = [
  { id: 'jumper', name: 'Hopp', icon: '🏃', component: LobbyJumper },
  { id: 'flappy', name: 'Flappy', icon: '🐦', component: LobbyFlappy },
  { id: 'clicker', name: 'Klikker', icon: '👆', component: LobbyClicker },
  { id: 'emoji', name: 'Emoji', icon: '🌧️', component: LobbyEmojiRain },
  { id: 'pattern', name: 'Mønster', icon: '🧠', component: LobbyPatternMatcher },
];

// Renders the selected minigame (teacher controls which one via socket)
function LobbyMinigameSelector({ gameId = 'jumper' }) {
  const ActiveGame = MINIGAMES.find(g => g.id === gameId)?.component || LobbyJumper;

  return (
    <div className="minigame-selector-wrapper">
      <div className="minigame-content">
        <ActiveGame key={gameId} />
      </div>
    </div>
  );
}

export default LobbyMinigameSelector;
