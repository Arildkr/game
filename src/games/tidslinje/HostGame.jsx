// game/src/games/tidslinje/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRandomEventSet, shuffleEvents, formatYear, TIDSLINJE_CATEGORIES } from '../../data/tidslinjeEvents';
import './Tidslinje.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, gameData } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, reveal, finished
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentSet, setCurrentSet] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lockedPlayers, setLockedPlayers] = useState([]);
  const [revealData, setRevealData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [usedSetIds, setUsedSetIds] = useState([]);
  const [category, setCategory] = useState('blanding');
  const timerRef = useRef(null);
  const initDone = useRef(false);

  // Hent kategori fra gameData
  useEffect(() => {
    if (gameData && !initDone.current) {
      initDone.current = true;
      setCategory(gameData.category || 'blanding');
    }
  }, [gameData]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerLocked = ({ playerId, playerName, lockCount }) => {
      setLockedPlayers(prev => {
        if (prev.find(p => p.id === playerId)) return prev;
        return [...prev, { id: playerId, name: playerName }];
      });
    };

    const handleSortResult = (data) => {
      setRevealData(data);
      setLeaderboard(data.leaderboard);
      setPhase('reveal');
      clearInterval(timerRef.current);
    };

    const handleReadyForRound = ({ round, leaderboard: lb }) => {
      setCurrentRound(round);
      setLeaderboard(lb);
      setPhase('waiting');
      setRevealData(null);
      setLockedPlayers([]);
      setCurrentSet(null);
    };

    const handleGameEnded = ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('finished');
    };

    socket.on('game:player-locked', handlePlayerLocked);
    socket.on('game:sort-result', handleSortResult);
    socket.on('game:ready-for-round', handleReadyForRound);
    socket.on('game:tidslinje-ended', handleGameEnded);

    return () => {
      socket.off('game:player-locked', handlePlayerLocked);
      socket.off('game:sort-result', handleSortResult);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tidslinje-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const startRound = () => {
    // Get a random event set fra valgt kategori
    const set = getRandomEventSet(usedSetIds, category);
    setCurrentSet(set);
    setUsedSetIds(prev => [...prev, set.id]);
    setPhase('playing');
    setLockedPlayers([]);
    setTimeLeft(60);

    // Shuffle events for players
    const shuffledEvents = shuffleEvents(set.events);

    sendGameAction('start-round', {
      setName: set.name, // Ved 'blanding' vises "Blandet" i stedet for kategorinavn
      events: shuffledEvents.map(e => ({ id: e.id, text: e.text })),
      correctOrder: set.events.map(e => e.id),
      eventsWithYears: set.events, // Include full event data for reveal
      timeLimit: 60,
      round: currentRound
    });

    // Start timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-reveal when time runs out
          setTimeout(() => {
            if (phase === 'playing') {
              sendGameAction('reveal-round');
            }
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const revealResults = () => {
    clearInterval(timerRef.current);
    sendGameAction('reveal-round');
  };

  const nextRound = () => {
    if (currentRound >= totalRounds) {
      sendGameAction('end-tidslinje');
    } else {
      sendGameAction('next-round');
    }
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="tidslinje-host finished-screen">
        <div className="finished-content">
          <h1>Tidslinje fullført!</h1>

          <div className="final-leaderboard">
            <h2>Resultater</h2>
            <div className="podium">
              {leaderboard.slice(0, 3).map((player, index) => (
                <div key={player.id} className={`podium-place place-${index + 1}`}>
                  <div className="medal">{['🥇', '🥈', '🥉'][index]}</div>
                  <div className="player-name">{player.name}</div>
                  <div className="player-score">{player.score} poeng</div>
                </div>
              ))}
            </div>

            {leaderboard.length > 3 && (
              <ul className="rest-of-leaderboard">
                {leaderboard.slice(3).map((player, index) => (
                  <li key={player.id}>
                    <span className="rank">{index + 4}.</span>
                    <span className="name">{player.name}</span>
                    <span className="score">{player.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => endGame()}>
            Avslutt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tidslinje-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">📅 Tidslinje</span>
          {category !== 'blanding' && (
            <span className="category-badge">
              {TIDSLINJE_CATEGORIES.find(c => c.id === category)?.icon} {TIDSLINJE_CATEGORIES.find(c => c.id === category)?.name}
            </span>
          )}
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-progress">Runde {currentRound} / {totalRounds}</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
        </div>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="round-number">Runde {currentRound}</div>
            <button className="btn btn-start-round" onClick={startRound}>
              Start runde
            </button>
            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} klare
            </p>
          </div>
        )}

        {/* Playing phase */}
        {phase === 'playing' && currentSet && (
          <div className="playing-phase">
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
                {timeLeft}s
              </div>
            </div>

            <div className="set-name-display">{currentSet.name}</div>

            {/* Show timeline cards */}
            <div className="timeline-preview">
              <h3>Hendelser å sortere:</h3>
              <div className="timeline-cards-host">
                {currentSet.events.map((event, index) => (
                  <div key={event.id} className="timeline-card-host">
                    <div className="card-icon">📜</div>
                    <div className="card-text">{event.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked players status */}
            <div className="lock-status">
              <div className="lock-count">
                🔒 {lockedPlayers.length} / {connectedPlayers.length} har låst svar
              </div>
              {lockedPlayers.length > 0 && (
                <div className="locked-names">
                  {lockedPlayers.map(p => (
                    <span key={p.id} className="locked-player">{p.name}</span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-reveal" onClick={revealResults}>
              Vis fasit
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && revealData && currentSet && (
          <div className="reveal-phase">
            <div className="result-header">
              <h2>{revealData.isCorrect ? '🎉 Riktig rekkefølge!' : '📊 Resultater'}</h2>
              {revealData.playerName && (
                <p className="winner-name">
                  {revealData.playerName}: {revealData.correctCount} av {revealData.totalCount} riktig
                  {revealData.points > 0 && <span className="points"> (+{revealData.points} poeng)</span>}
                </p>
              )}
            </div>

            {/* Correct timeline with years */}
            <div className="correct-timeline">
              <h3>Riktig rekkefølge:</h3>
              <div className="timeline-vertical">
                {currentSet.events.map((event, index) => (
                  <div key={event.id} className="timeline-item-host">
                    <div className="timeline-marker">
                      <div className="marker-dot"></div>
                      {index < currentSet.events.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-year">{formatYear(event.year)}</span>
                      <span className="timeline-text">{event.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-next" onClick={nextRound}>
              {currentRound >= totalRounds ? 'Se resultater' : 'Neste runde'}
            </button>
          </div>
        )}
      </main>

      {/* Leaderboard sidebar */}
      <aside className="leaderboard-sidebar">
        <h3>Poengtavle</h3>
        <ul className="leaderboard-list">
          {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((player, index) => (
            <li key={player.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
              <span className="rank">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </li>
          )) : connectedPlayers.slice(0, 5).map((player, index) => (
            <li key={player.id} className="leaderboard-item">
              <span className="rank">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">0</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
