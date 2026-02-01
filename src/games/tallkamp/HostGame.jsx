// game/src/games/tallkamp/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Tallkamp.css';

// Generate random numbers for the game
function generateNumbers(difficulty = 'medium') {
  const configs = {
    easy: { small: 4, large: 1, targetMin: 100, targetMax: 500 },
    medium: { small: 4, large: 2, targetMin: 100, targetMax: 999 },
    hard: { small: 3, large: 3, targetMin: 200, targetMax: 999 }
  };

  const config = configs[difficulty];
  const smallNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const largeNumbers = [25, 50, 75, 100];

  const selected = [];

  // Pick large numbers
  const shuffledLarge = [...largeNumbers].sort(() => Math.random() - 0.5);
  for (let i = 0; i < config.large; i++) {
    selected.push(shuffledLarge[i]);
  }

  // Pick small numbers (can repeat)
  for (let i = 0; i < config.small; i++) {
    selected.push(smallNumbers[Math.floor(Math.random() * smallNumbers.length)]);
  }

  // Generate target
  const target = Math.floor(Math.random() * (config.targetMax - config.targetMin + 1)) + config.targetMin;

  return {
    numbers: selected.sort(() => Math.random() - 0.5),
    target
  };
}

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, reveal, finished
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [difficulty, setDifficulty] = useState('medium');
  const [submissions, setSubmissions] = useState({});
  const [revealData, setRevealData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    const handlePlayerSubmitted = ({ playerId, playerName, submissionCount }) => {
      setSubmissions(prev => ({
        ...prev,
        [playerId]: { playerName, hasSubmission: true }
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
    socket.on('game:tallkamp-ended', handleGameEnded);

    return () => {
      socket.off('game:player-submitted', handlePlayerSubmitted);
      socket.off('game:round-revealed', handleRoundRevealed);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tallkamp-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const startRound = () => {
    const { numbers: nums, target: tgt } = generateNumbers(difficulty);
    setNumbers(nums);
    setTarget(tgt);
    setPhase('playing');
    setTimeLeft(90);
    setSubmissions({});

    sendGameAction('start-round', {
      numbers: nums,
      target: tgt,
      timeLimit: 90,
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
      sendGameAction('end-tallkamp');
    } else {
      sendGameAction('next-round');
    }
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="tallkamp-host finished-screen">
        <div className="finished-content">
          <h1>Tallkamp fullført!</h1>

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

            {leaderboard.length > 3 && leaderboard.length <= 5 && (
              <ul className="rest-of-leaderboard">
                {leaderboard.slice(3, 5).map((player, index) => (
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
    <div className="tallkamp-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">🔢 Tallkamp</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-progress">Runde {currentRound} / {totalRounds}</span>
        </div>
        <div className="header-actions">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="difficulty-select"
            disabled={phase !== 'waiting'}
          >
            <option value="easy">Lett</option>
            <option value="medium">Medium</option>
            <option value="hard">Vanskelig</option>
          </select>
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
        {phase === 'playing' && (
          <div className="playing-phase">
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
                {timeLeft}s
              </div>
            </div>

            <div className="target-display">
              <span className="target-label">Mål:</span>
              <span className="target-number">{target}</span>
            </div>

            <div className="numbers-display">
              {numbers.map((num, index) => (
                <div key={index} className="number-tile">
                  {num}
                </div>
              ))}
            </div>

            <div className="submission-status">
              <p className="submission-count">
                {Object.keys(submissions).length} / {connectedPlayers.length} har sendt inn
              </p>
              {Object.keys(submissions).length > 0 && (
                <div className="live-submissions">
                  {Object.entries(submissions)
                    .sort((a, b) => Math.abs(a[1].difference) - Math.abs(b[1].difference))
                    .map(([playerId, sub]) => (
                      <div key={playerId} className={`live-submission ${sub.difference === 0 ? 'exact' : ''}`}>
                        <span className="sub-name">{sub.playerName}</span>
                        <span className="sub-result">{sub.result}</span>
                        <span className="sub-diff">
                          ({sub.difference === 0 ? '=' : sub.difference > 0 ? '+' : ''}{sub.difference})
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button className="btn btn-reveal" onClick={revealResults}>
              Avslutt runde
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && revealData && (
          <div className="reveal-phase">
            <div className="target-display small">
              <span className="target-label">Målet var:</span>
              <span className="target-number">{target}</span>
            </div>

            <div className="results-list">
              <h3>Resultater:</h3>
              {revealData.results.map((result, index) => (
                <div key={result.playerId} className={`result-item ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">{index + 1}.</span>
                  <span className="name">{result.playerName}</span>
                  <span className="answer">{result.result ?? '-'}</span>
                  <span className="diff">
                    {result.difference !== null ? `(${result.difference === 0 ? '=' : result.difference > 0 ? '+' : ''}${result.difference})` : '(ingen svar)'}
                  </span>
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
