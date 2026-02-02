// game/src/games/tidslinje/PlayerGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import { formatYear } from '../../data/tidslinjeEvents';
import './Tidslinje.css';

function PlayerGame() {
  const { socket, playerName, sendPlayerAction, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, sorting, locked, reveal, finished
  const [setName, setSetName] = useState('');
  const [events, setEvents] = useState([]);
  const [orderedEvents, setOrderedEvents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hasLocked, setHasLocked] = useState(false);
  const [firstLocker, setFirstLocker] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const timerRef = useRef(null);

  const myPlayerId = socket?.id;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ setName: name, events: evts, timeLimit }) => {
      setSetName(name);
      setPhase('sorting');
      setEvents(evts || []);
      setOrderedEvents([...(evts || [])]);
      setHasLocked(false);
      setFirstLocker(null);
      setLastResult(null);
      setMyResult(null);
      setTimeLeft(timeLimit || 60);

      // Start timer
      clearInterval(timerRef.current);
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

    const handlePlayerLocked = ({ playerId, playerName: name, lockCount }) => {
      if (playerId === myPlayerId) {
        setHasLocked(true);
        setPhase('locked');
      }
      if (!firstLocker) {
        setFirstLocker({ id: playerId, name });
      }
    };

    const handleSortResult = ({ playerId, playerName: pName, isCorrect, correctCount, totalCount, points, correctOrder, eventsWithYears, leaderboard: lb }) => {
      clearInterval(timerRef.current);
      setLastResult({ playerId, playerName: pName, isCorrect, correctCount, totalCount, points, eventsWithYears });
      setLeaderboard(lb);

      if (playerId === myPlayerId) {
        setMyResult({ correctCount, totalCount, points, isCorrect });
        const me = lb.find(p => p.id === myPlayerId);
        if (me) setMyScore(me.score);
      }

      setPhase('reveal');
    };

    const handleReadyForRound = ({ leaderboard: lb }) => {
      setPhase('waiting');
      setLeaderboard(lb);
      setHasLocked(false);
      setFirstLocker(null);

      const rank = lb.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);

      const me = lb.find(p => p.id === socket.id);
      if (me) setMyScore(me.score);
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
    socket.on('game:player-locked', handlePlayerLocked);
    socket.on('game:sort-result', handleSortResult);
    socket.on('game:ready-for-round', handleReadyForRound);
    socket.on('game:tidslinje-ended', handleGameEnded);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:player-locked', handlePlayerLocked);
      socket.off('game:sort-result', handleSortResult);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tidslinje-ended', handleGameEnded);
      clearInterval(timerRef.current);
    };
  }, [socket, myPlayerId, firstLocker]);

  // Move event up in list
  const moveUp = useCallback((index) => {
    if (index === 0 || phase !== 'sorting' || hasLocked) return;
    setOrderedEvents(prev => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
    if (navigator.vibrate) navigator.vibrate(30);
  }, [phase, hasLocked]);

  // Move event down in list
  const moveDown = useCallback((index) => {
    if (phase !== 'sorting' || hasLocked) return;
    setOrderedEvents(prev => {
      if (index === prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
    if (navigator.vibrate) navigator.vibrate(30);
  }, [phase, hasLocked]);

  // Lock answer (like buzzing, but with your sorted order)
  const lockAnswer = useCallback(() => {
    if (phase !== 'sorting' || hasLocked) return;

    setHasLocked(true);
    setPhase('locked');
    clearInterval(timerRef.current);

    // Send sorted order to server
    sendPlayerAction('lock-answer', {
      order: orderedEvents.map(e => e.id)
    });

    if (navigator.vibrate) navigator.vibrate(200);
  }, [phase, hasLocked, orderedEvents, sendPlayerAction]);

  // Touch drag handlers
  const handleDragStart = (index) => {
    if (phase !== 'sorting' || hasLocked) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setOrderedEvents(prev => {
      const newOrder = [...prev];
      const [dragged] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(index, 0, dragged);
      return newOrder;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

  // Reveal screen
  if (phase === 'reveal' && lastResult) {
    const isMe = lastResult.playerId === myPlayerId;

    return (
      <div className="tidslinje-player reveal-screen">
        <div className="reveal-content">
          <div className="result-header-player">
            {isMe ? (
              <>
                <div className="result-icon">{lastResult.isCorrect ? '🎉' : '😕'}</div>
                <h2>{lastResult.correctCount} av {lastResult.totalCount} riktig!</h2>
                <p className="points-earned">+{lastResult.points} poeng</p>
              </>
            ) : (
              <>
                <div className="result-icon">👀</div>
                <h2>{lastResult.playerName} svarte!</h2>
                <p>{lastResult.correctCount} av {lastResult.totalCount} riktig</p>
              </>
            )}
          </div>

          {/* Show correct order with years */}
          {lastResult.eventsWithYears && (
            <div className="correct-timeline-player">
              <h3>Riktig rekkefølge:</h3>
              <div className="timeline-cards-reveal">
                {lastResult.eventsWithYears.map((event, index) => (
                  <div key={event.id} className="timeline-card-reveal">
                    <div className="card-number">{index + 1}</div>
                    <div className="card-content">
                      <span className="card-year">{formatYear(event.year)}</span>
                      <span className="card-text">{event.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="waiting-text">Venter på neste runde...</p>
        </div>
      </div>
    );
  }

  // Locked screen - waiting for result
  if (phase === 'locked') {
    return (
      <div className="tidslinje-player locked-screen">
        <header className="player-header">
          <button className="btn-back" onClick={leaveRoom}>←</button>
          <span className="player-name">{playerName}</span>
          <span className="player-score">{myScore} p</span>
        </header>

        <div className="locked-content">
          <div className="lock-icon">🔒</div>
          <h2>Svar låst!</h2>
          <p>Venter på at tiden går ut...</p>

          <div className="my-order-preview">
            <h3>Din rekkefølge:</h3>
            {orderedEvents.map((event, index) => (
              <div key={event.id} className="preview-item">
                <span className="preview-number">{index + 1}</span>
                <span className="preview-text">{event.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sorting phase - main gameplay
  if (phase === 'sorting') {
    return (
      <div className="tidslinje-player sorting-screen">
        <header className="player-header">
          <button className="btn-back" onClick={leaveRoom}>←</button>
          <span className="player-name">{playerName}</span>
          <span className="player-score">{myScore} p</span>
        </header>

        <div className="sorting-content">
          <div className="sorting-header">
            <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
              {timeLeft}
            </div>
            <div className="theme-display">
              <span className="theme-label">Tema:</span>
              <span className="theme-name">{setName}</span>
            </div>
          </div>

          <p className="sort-instruction">Dra kortene i riktig rekkefølge (eldst først)</p>

          <div className="timeline-cards-sortable">
            {orderedEvents.map((event, index) => (
              <div
                key={event.id}
                className={`timeline-card ${draggedIndex === index ? 'dragging' : ''}`}
                draggable={!hasLocked}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="card-position">{index + 1}</div>
                <div className="card-event-text">{event.text}</div>
                <div className="card-controls">
                  <button
                    className="move-btn"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    ▲
                  </button>
                  <button
                    className="move-btn"
                    onClick={() => moveDown(index)}
                    disabled={index === orderedEvents.length - 1}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-lock-answer" onClick={lockAnswer} disabled={hasLocked}>
            🔒 LÅS SVAR
          </button>
        </div>
      </div>
    );
  }

  // Waiting phase
  return (
    <div className="tidslinje-player waiting-screen">
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="player-score">{myScore} p</span>
      </header>

      <div className="waiting-content">
        <div className="waiting-icon">⏳</div>
        <h2>Venter på neste runde...</h2>
        {myRank > 0 && <p className="current-rank">Du er på {myRank}. plass</p>}
      </div>
    </div>
  );
}

export default PlayerGame;
