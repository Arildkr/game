// game/src/games/tidslinje/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import eventSets, { getRandomEventSet, shuffleEvents } from '../../data/tidslinjeEvents';
import './Tidslinje.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, reveal, finished
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentSet, setCurrentSet] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [submissions, setSubmissions] = useState({});
  const [revealData, setRevealData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [usedSets, setUsedSets] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerSubmitted = ({ playerId, playerName }) => {
      setSubmissions(prev => ({
        ...prev,
        [playerId]: { playerName, submitted: true }
      }));
    };

    const handleRoundRevealed = (data) => {
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
      setSubmissions({});
    };

    const handleGameEnded = ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('finished');
    };

    socket.on('game:player-submitted', handlePlayerSubmitted);
    socket.on('game:round-revealed', handleRoundRevealed);
    socket.on('game:ready-for-round', handleReadyForRound);
    socket.on('game:tidslinje-ended', handleGameEnded);

    return () => {
      socket.off('game:player-submitted', handlePlayerSubmitted);
      socket.off('game:round-revealed', handleRoundRevealed);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tidslinje-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const startRound = () => {
    // Get a random event set that hasn't been used
    let availableSets = eventSets.filter(s => !usedSets.includes(s.id));
    if (availableSets.length === 0) {
      availableSets = eventSets;
      setUsedSets([]);
    }

    const set = availableSets[Math.floor(Math.random() * availableSets.length)];
    setCurrentSet(set);
    setUsedSets(prev => [...prev, set.id]);
    setPhase('playing');
    setTimeLeft(60);
    setSubmissions({});

    // Create shuffled version for players
    const shuffledEvents = shuffleEvents(set.events);

    sendGameAction('start-round', {
      setName: set.name,
      events: shuffledEvents.map(e => ({ id: e.id, text: e.text })), // Don't send years
      correctOrder: set.events.map(e => e.id), // Sorted by year
      timeLimit: 60,
      round: currentRound
    });

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
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

          <button className="btn btn-primary" onClick={endGame}>
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
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-progress">Runde {currentRound} / {totalRounds}</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-end" onClick={endGame}>Avslutt</button>
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

            <div className="set-name">{currentSet.name}</div>

            <div className="events-preview">
              <h3>Hendelser å sortere:</h3>
              <ul className="events-list">
                {currentSet.events.map(event => (
                  <li key={event.id}>{event.text}</li>
                ))}
              </ul>
            </div>

            <div className="submission-status">
              <p>
                {Object.keys(submissions).length} / {connectedPlayers.length} har sendt inn
              </p>
            </div>

            <button className="btn btn-reveal" onClick={revealResults}>
              Avslutt runde
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && revealData && currentSet && (
          <div className="reveal-phase">
            <div className="set-name">{currentSet.name}</div>

            <div className="correct-order">
              <h3>Riktig rekkefølge:</h3>
              <ol className="timeline">
                {currentSet.events.map((event, index) => (
                  <li key={event.id} className="timeline-item">
                    <span className="year">{event.year}</span>
                    <span className="text">{event.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="results-list">
              <h3>Resultater:</h3>
              {revealData.results.map((result, index) => (
                <div key={result.playerId} className={`result-item ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">{index + 1}.</span>
                  <span className="name">{result.playerName}</span>
                  <span className="correct">{result.correctCount} / {currentSet.events.length} riktig</span>
                  <span className="points">+{result.points}</span>
                </div>
              ))}
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
          {leaderboard.length > 0 ? leaderboard.map((player, index) => (
            <li key={player.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
              <span className="rank">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </li>
          )) : connectedPlayers.map((player, index) => (
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
