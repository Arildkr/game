// game/src/components/GameRouter.jsx
import { useGame } from '../contexts/GameContext';

// Game components (to be implemented)
import GjettBildetHost from '../games/gjett-bildet/HostGame';
import GjettBildetPlayer from '../games/gjett-bildet/PlayerGame';
import SlangeHost from '../games/slange/HostGame';
import SlangePlayer from '../games/slange/PlayerGame';
import TallkampHost from '../games/tallkamp/HostGame';
import TallkampPlayer from '../games/tallkamp/PlayerGame';
import QuizHost from '../games/quiz/HostGame';
import QuizPlayer from '../games/quiz/PlayerGame';
import TidslinjeHost from '../games/tidslinje/HostGame';
import TidslinjePlayer from '../games/tidslinje/PlayerGame';
import JaEllerNeiHost from '../games/ja-eller-nei/HostGame';
import JaEllerNeiPlayer from '../games/ja-eller-nei/PlayerGame';

const GAME_COMPONENTS = {
  'gjett-bildet': { host: GjettBildetHost, player: GjettBildetPlayer },
  'slange': { host: SlangeHost, player: SlangePlayer },
  'tallkamp': { host: TallkampHost, player: TallkampPlayer },
  'quiz': { host: QuizHost, player: QuizPlayer },
  'tidslinje': { host: TidslinjeHost, player: TidslinjePlayer },
  'ja-eller-nei': { host: JaEllerNeiHost, player: JaEllerNeiPlayer }
};

function GameRouter() {
  const { currentGame, isHost } = useGame();

  const gameComponents = GAME_COMPONENTS[currentGame];

  if (!gameComponents) {
    return (
      <div className="game-not-found">
        <h2>Spill ikke funnet</h2>
        <p>Beklager, dette spillet er ikke tilgjengelig ennå.</p>
      </div>
    );
  }

  const GameComponent = isHost ? gameComponents.host : gameComponents.player;

  return <GameComponent />;
}

export default GameRouter;
