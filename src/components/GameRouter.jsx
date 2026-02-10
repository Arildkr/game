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
// New games
import VilDuHellerHost from '../games/vil-du-heller/HostGame';
import VilDuHellerPlayer from '../games/vil-du-heller/PlayerGame';
import NerdleHost from '../games/nerdle/HostGame';
import NerdlePlayer from '../games/nerdle/PlayerGame';
import HvaManglerHost from '../games/hva-mangler/HostGame';
import HvaManglerPlayer from '../games/hva-mangler/PlayerGame';
import TegnDetHost from '../games/tegn-det/HostGame';
import TegnDetPlayer from '../games/tegn-det/PlayerGame';
import SquiggleStoryHost from '../games/squiggle-story/HostGame';
import SquiggleStoryPlayer from '../games/squiggle-story/PlayerGame';
import StemningssjekkHost from '../games/stemningssjekk/HostGame';
import StemningssjekkPlayer from '../games/stemningssjekk/PlayerGame';
import OrdjaktHost from '../games/ordjakt/HostGame';
import OrdjaktPlayer from '../games/ordjakt/PlayerGame';

const GAME_COMPONENTS = {
  'gjett-bildet': { host: GjettBildetHost, player: GjettBildetPlayer },
  'slange': { host: SlangeHost, player: SlangePlayer },
  'tallkamp': { host: TallkampHost, player: TallkampPlayer },
  'quiz': { host: QuizHost, player: QuizPlayer },
  'tidslinje': { host: TidslinjeHost, player: TidslinjePlayer },
  'ja-eller-nei': { host: JaEllerNeiHost, player: JaEllerNeiPlayer },
  'vil-du-heller': { host: VilDuHellerHost, player: VilDuHellerPlayer },
  'nerdle': { host: NerdleHost, player: NerdlePlayer },
  'hva-mangler': { host: HvaManglerHost, player: HvaManglerPlayer },
  'tegn-det': { host: TegnDetHost, player: TegnDetPlayer },
  'squiggle-story': { host: SquiggleStoryHost, player: SquiggleStoryPlayer },
  'stemningssjekk': { host: StemningssjekkHost, player: StemningssjekkPlayer },
  'ordjakt': { host: OrdjaktHost, player: OrdjaktPlayer }
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
