// game/src/games/tidslinje/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Tidslinje.css';

function PlayerGame() {
  const { socket, playerName } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, playing, submitted, reveal, finished
  const [setName, setSetName] = useState('');
  const [events, setEvents] = useState([]);
  const [orderedEvents, setOrderedEvents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ setName: name, events: evts, timeLimit }) => {
      setSetName(name);
      setEvents(evts);
      setOrderedEvents([...evts]); // Start with shuffled order
      setPhase('playing');
      setTimeLeft(timeLimit);
      setMyResult(null);

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
      setEvents([]);
      setOrderedEvents([]);
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
    socket.on('game:tidslinje-ended', handleGameEnded);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:round-revealed', handleRoundRevealed);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tidslinje-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedEvents];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setOrderedEvents(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Touch handlers for mobile
  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...orderedEvents];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedEvents(newOrder);
  };

  const moveDown = (index) => {
    if (index === orderedEvents.length - 1) return;
    const newOrder = [...orderedEvents];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedEvents(newOrder);
  };

  const submitAnswer = () => {
    if (phase !== 'playing') return;

    setPhase('submitted');

    socket.emit('player:game-action', {
      action: 'submit',
      order: orderedEvents.map(e => e.id)
    });
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="tidslinje-player finished-screen">
        <div className="finished-content">
          <h1>Tidslinje fullført!</h1>

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
    <div className="tidslinje-player">
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

            <div className="set-name">{setName}</div>
            <p className="instructions">Sorter fra eldst til nyest:</p>

            <div className="events-sortable">
              {orderedEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`event-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable={phase === 'playing'}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="event-number">{index + 1}</span>
                  <span className="event-text">{event.text}</span>
                  <div className="move-buttons">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0 || phase === 'submitted'}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === orderedEvents.length - 1 || phase === 'submitted'}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-submit"
              onClick={submitAnswer}
              disabled={phase === 'submitted'}
            >
              {phase === 'submitted' ? 'Sendt!' : 'Send inn'}
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && myResult && (
          <div className="reveal-phase">
            <div className="my-result">
              <h2>{myResult.correctCount} av {events.length} riktig!</h2>
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
