// game/src/games/tallkamp/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Tallkamp.css';

function PlayerGame() {
  const { socket, playerName } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, submitted, reveal, finished
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ numbers: nums, target: tgt, timeLimit }) => {
      setNumbers(nums);
      setTarget(tgt);
      setPhase('playing');
      setTimeLeft(timeLimit);
      setExpression('');
      setResult(null);
      setError(null);
      setMyResult(null);

      // Client-side timer
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

    const handleRoundRevealed = (data) => {
      setPhase('reveal');
      clearInterval(timerRef.current);

      const me = data.results.find(r => r.playerId === socket.id);
      if (me) {
        setMyResult(me);
        setMyScore(me.totalScore);
      }

      const rank = data.leaderboard.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);
      setLeaderboard(data.leaderboard);
    };

    const handleReadyForRound = ({ leaderboard: lb }) => {
      setPhase('waiting');
      setNumbers([]);
      setExpression('');
      setResult(null);
      setLeaderboard(lb);

      const rank = lb.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);
    };

    const handleGameEnded = ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('finished');

      const rank = lb.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);

      const me = lb.find(p => p.id === socket.id);
      if (me) {
        setMyScore(me.score);
      }
    };

    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:round-revealed', handleRoundRevealed);
    socket.on('game:ready-for-round', handleReadyForRound);
    socket.on('game:tallkamp-ended', handleGameEnded);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:round-revealed', handleRoundRevealed);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tallkamp-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  // Validate that expression only uses available numbers (each once)
  const validateNumbers = (expr, availableNumbers) => {
    // Extract all numbers from expression
    const usedNumbers = expr.match(/\d+/g)?.map(Number) || [];

    // Create a copy of available numbers to track usage
    const remaining = [...availableNumbers];

    for (const num of usedNumbers) {
      const idx = remaining.indexOf(num);
      if (idx === -1) {
        return { valid: false, error: `Tallet ${num} er ikke tilgjengelig eller allerede brukt` };
      }
      remaining.splice(idx, 1);
    }

    return { valid: true };
  };

  // Calculate result from expression
  const calculateResult = (expr) => {
    try {
      // Only allow numbers, operators, parentheses and spaces
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        return { error: 'Ugyldig tegn i uttrykket' };
      }

      // Validate that only available numbers are used (each once)
      const validation = validateNumbers(expr, numbers);
      if (!validation.valid) {
        return { error: validation.error };
      }

      // Evaluate the expression
      const evaluated = Function('"use strict"; return (' + expr + ')')();

      if (!Number.isFinite(evaluated)) {
        return { error: 'Ugyldig resultat' };
      }

      return { result: Math.round(evaluated * 1000) / 1000 };
    } catch (e) {
      return { error: 'Kunne ikke beregne' };
    }
  };

  const handleExpressionChange = (value) => {
    setExpression(value);
    setError(null);

    if (value.trim()) {
      const calc = calculateResult(value);
      if (calc.error) {
        setError(calc.error);
        setResult(null);
      } else {
        setResult(calc.result);
      }
    } else {
      setResult(null);
    }
  };

  const addToExpression = (char) => {
    const newExpr = expression + char;
    handleExpressionChange(newExpr);
  };

  const clearExpression = () => {
    handleExpressionChange('');
  };

  const backspace = () => {
    handleExpressionChange(expression.slice(0, -1));
  };

  const submitAnswer = () => {
    if (result === null || phase !== 'playing') return;

    setPhase('submitted');

    socket.emit('player:game-action', {
      action: 'submit',
      expression,
      result: Math.round(result)
    });
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="tallkamp-player finished-screen">
        <div className="finished-content">
          <h1>Tallkamp fullført!</h1>

          <div className="my-final-result">
            <div className="final-rank">
              {myRank === 1 && <div className="trophy">🏆</div>}
              {myRank === 2 && <div className="trophy">🥈</div>}
              {myRank === 3 && <div className="trophy">🥉</div>}
              <div className="rank-number">#{myRank}</div>
            </div>
            <div className="final-score">{myScore} poeng</div>
          </div>

          <div className="mini-leaderboard">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div
                key={player.id}
                className={`mini-lb-item ${player.id === socket?.id ? 'me' : ''}`}
              >
                <span className="rank">{index + 1}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tallkamp-player">
      {/* Header */}
      <header className="player-header">
        <span className="player-name">{playerName}</span>
        <span className="player-score">{myScore} poeng</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">⏳</div>
            <h2>Venter på neste runde...</h2>
            {myRank > 0 && (
              <p className="current-rank">Du er på {myRank}. plass</p>
            )}
          </div>
        )}

        {/* Playing phase */}
        {(phase === 'playing' || phase === 'submitted') && (
          <div className="playing-phase">
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
                {timeLeft}
              </div>
            </div>

            <div className="target-display">
              <span className="target-label">Mål:</span>
              <span className="target-number">{target}</span>
            </div>

            <div className="numbers-available">
              {numbers.map((num, index) => (
                <button
                  key={index}
                  className="number-btn"
                  onClick={() => addToExpression(num.toString())}
                  disabled={phase === 'submitted'}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="expression-display">
              <input
                type="text"
                value={expression}
                onChange={(e) => handleExpressionChange(e.target.value)}
                placeholder="Skriv uttrykk..."
                disabled={phase === 'submitted'}
              />
              {result !== null && (
                <div className={`result-preview ${result === target ? 'exact' : ''}`}>
                  = {result}
                </div>
              )}
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="operator-buttons">
              <button onClick={() => addToExpression('+')} disabled={phase === 'submitted'}>+</button>
              <button onClick={() => addToExpression('-')} disabled={phase === 'submitted'}>-</button>
              <button onClick={() => addToExpression('*')} disabled={phase === 'submitted'}>×</button>
              <button onClick={() => addToExpression('/')} disabled={phase === 'submitted'}>÷</button>
              <button onClick={() => addToExpression('(')} disabled={phase === 'submitted'}>(</button>
              <button onClick={() => addToExpression(')')} disabled={phase === 'submitted'}>)</button>
            </div>

            <div className="action-buttons">
              <button className="btn-clear" onClick={clearExpression} disabled={phase === 'submitted'}>
                Tøm
              </button>
              <button className="btn-backspace" onClick={backspace} disabled={phase === 'submitted'}>
                ←
              </button>
              <button
                className="btn-submit"
                onClick={submitAnswer}
                disabled={result === null || phase === 'submitted'}
              >
                {phase === 'submitted' ? 'Sendt!' : 'Send inn'}
              </button>
            </div>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && myResult && (
          <div className="reveal-phase">
            <div className="my-result">
              <h2>Ditt svar: {myResult.result ?? 'Ingen'}</h2>
              {myResult.difference !== null && (
                <p className="difference">
                  {myResult.difference === 0
                    ? 'Perfekt!'
                    : `${Math.abs(myResult.difference)} ${myResult.difference > 0 ? 'over' : 'under'} målet`}
                </p>
              )}
              <p className="points-earned">+{myResult.points} poeng</p>
            </div>

            <div className="current-standing">
              <p>Du er på <strong>{myRank}. plass</strong></p>
              <p className="total-score">{myScore} poeng totalt</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
