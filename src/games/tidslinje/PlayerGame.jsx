// game/src/games/tidslinje/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Tidslinje.css';

function PlayerGame() {
  const { socket, playerName } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, buzzer, sorting, submitted, reveal, finished
  const [setName, setSetName] = useState('');
  const [events, setEvents] = useState([]);
  const [orderedEvents, setOrderedEvents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const timerRef = useRef(null);

  const myPlayerId = socket?.id;
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myBuzzerPosition = buzzerQueue.indexOf(myPlayerId) + 1;
  const isInQueue = myBuzzerPosition > 0;

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ setName: name, events: evts, timeLimit }) => {
      setSetName(name);
      setPhase('buzzer');
      setEvents(evts || []); // Store the events so players can see them before buzzing
      setOrderedEvents([]);
      setHasBuzzed(false);
      setBuzzerQueue([]);
      setCurrentPlayer(null);
      setLastResult(null);
      setMyResult(null);
    };

    const handlePlayerBuzzed = ({ buzzerQueue: queue }) => {
      setBuzzerQueue(queue);
    };

    const handlePlayerSelected = ({ playerId, playerName: name, events: evts, timeLimit }) => {
      setCurrentPlayer({ id: playerId, name });
      setBuzzerQueue([]);

      if (playerId === myPlayerId) {
        // It's my turn - I get to sort
        setEvents(evts);
        setOrderedEvents([...evts]);
        setPhase('sorting');
        setTimeLeft(timeLimit);

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
      } else {
        // Someone else is sorting
        setPhase('waiting');
      }
    };

    const handleSortResult = ({ playerId, isCorrect, correctCount, totalCount, points, correctOrder }) => {
      clearInterval(timerRef.current);
      setLastResult({ playerId, isCorrect, correctCount, totalCount, points });

      if (playerId === myPlayerId) {
        setMyResult({ correctCount, totalCount, points, isCorrect });
        setMyScore(prev => prev + points);
      }

      setCurrentPlayer(null);
      setPhase('reveal');
    };

    const handleNextRound = () => {
      setPhase('waiting');
      setEvents([]);
      setOrderedEvents([]);
      setHasBuzzed(false);
      setBuzzerQueue([]);
      setCurrentPlayer(null);
      setLastResult(null);
      setMyResult(null);
    };

    const handleReadyForRound = ({ leaderboard: lb }) => {
      setPhase('waiting');
      setLeaderboard(lb);
      setHasBuzzed(false);
      setBuzzerQueue([]);
      setCurrentPlayer(null);

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

    const handleBuzzerCleared = () => {
      setHasBuzzed(false);
      setBuzzerQueue([]);
      setCurrentPlayer(null);
    };

    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:buzzer-cleared', handleBuzzerCleared);
    socket.on('game:player-buzzed', handlePlayerBuzzed);
    socket.on('game:player-selected', handlePlayerSelected);
    socket.on('game:sort-result', handleSortResult);
    socket.on('game:next-round', handleNextRound);
    socket.on('game:ready-for-round', handleReadyForRound);
    socket.on('game:tidslinje-ended', handleGameEnded);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:player-buzzed', handlePlayerBuzzed);
      socket.off('game:player-selected', handlePlayerSelected);
      socket.off('game:sort-result', handleSortResult);
      socket.off('game:next-round', handleNextRound);
      socket.off('game:ready-for-round', handleReadyForRound);
      socket.off('game:tidslinje-ended', handleGameEnded);
      socket.off('game:buzzer-cleared', handleBuzzerCleared);
      clearInterval(timerRef.current);
    };
  }, [socket, myPlayerId]);

  const handleBuzz = () => {
    if (!hasBuzzed && !currentPlayer && phase === 'buzzer') {
      socket.emit('player:game-action', { action: 'buzz' });
      setHasBuzzed(true);
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  // Touch handlers for mobile reordering
  const moveUp = (index) => {
    if (index === 0 || phase !== 'sorting') return;
    const newOrder = [...orderedEvents];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedEvents(newOrder);
  };

  const moveDown = (index) => {
    if (index === orderedEvents.length - 1 || phase !== 'sorting') return;
    const newOrder = [...orderedEvents];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedEvents(newOrder);
  };

  const submitAnswer = () => {
    if (phase !== 'sorting') return;

    setPhase('submitted');
    clearInterval(timerRef.current);

    socket.emit('player:game-action', {
      action: 'submit-order',
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

  // Reveal screen (after someone sorted)
  if (phase === 'reveal' && lastResult) {
    const isMe = lastResult.playerId === myPlayerId;

    return (
      <div className="tidslinje-player reveal-screen">
        <div className="reveal-content">
          {isMe ? (
            <>
              <div className="result-icon">{lastResult.isCorrect ? '🎉' : '😕'}</div>
              <h2>{lastResult.correctCount} av {lastResult.totalCount} riktig!</h2>
              <p className="points-earned">+{lastResult.points} poeng</p>
            </>
          ) : (
            <>
              <div className="result-icon">👀</div>
              <h2>Noen svarte!</h2>
              <p>{lastResult.correctCount} av {lastResult.totalCount} riktig</p>
            </>
          )}
          <p className="waiting-text">Venter på neste runde...</p>
        </div>
      </div>
    );
  }

  // Sorting phase - my turn
  if (phase === 'sorting' && isMyTurn) {
    return (
      <div className="tidslinje-player sorting-screen">
        <header className="player-header">
          <span className="player-name">{playerName}</span>
          <span className="player-score">{myScore} poeng</span>
        </header>

        <div className="sorting-content">
          <div className="timer-display">
            <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
              {timeLeft}
            </div>
          </div>

          <h2 className="sort-title">Sorter fra eldst til nyest!</h2>
          <p className="set-name-small">{setName}</p>

          <div className="events-sortable">
            {orderedEvents.map((event, index) => (
              <div key={event.id} className="event-item">
                <span className="event-number">{index + 1}</span>
                <span className="event-text">{event.text}</span>
                <div className="move-buttons">
                  <button onClick={() => moveUp(index)} disabled={index === 0}>↑</button>
                  <button onClick={() => moveDown(index)} disabled={index === orderedEvents.length - 1}>↓</button>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-submit" onClick={submitAnswer}>
            Send inn
          </button>
        </div>
      </div>
    );
  }

  // Submitted - waiting for result
  if (phase === 'submitted') {
    return (
      <div className="tidslinje-player submitted-screen">
        <div className="submitted-content">
          <div className="waiting-icon">⏳</div>
          <h2>Svar sendt!</h2>
          <p>Venter på resultat...</p>
        </div>
      </div>
    );
  }

  // Default view - buzzer or waiting
  return (
    <div className="tidslinje-player buzzer-screen">
      <header className="player-header">
        <span className="player-name">{playerName}</span>
        <span className="player-score">{myScore} poeng</span>
      </header>

      <div className="buzzer-content">
        {phase === 'waiting' && !currentPlayer && (
          <div className="waiting-phase">
            <div className="waiting-icon">⏳</div>
            <h2>Venter på neste runde...</h2>
            {myRank > 0 && <p className="current-rank">Du er på {myRank}. plass</p>}
          </div>
        )}

        {phase === 'buzzer' && !currentPlayer && (
          <>
            <div className="set-display">
              <span className="set-label">Tema:</span>
              <span className="set-name-large">{setName}</span>
            </div>

            {/* Show events list so players can see what they need to sort */}
            {events.length > 0 && (
              <div className="events-preview-player">
                <p className="preview-hint">Sorter disse fra eldst til nyest:</p>
                <div className="events-cards">
                  {events.map((event, index) => (
                    <div key={event.id} className="event-card">
                      {event.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasBuzzed ? (
              <div className="buzzed-state">
                {isInQueue ? (
                  <>
                    <div className="queue-position">{myBuzzerPosition}</div>
                    <p>Du er #{myBuzzerPosition} i køen</p>
                  </>
                ) : (
                  <p>Venter...</p>
                )}
              </div>
            ) : (
              <button className="buzz-button" onClick={handleBuzz}>
                <span className="buzz-icon">🔔</span>
                <span className="buzz-label">BUZZ!</span>
              </button>
            )}
          </>
        )}

        {currentPlayer && !isMyTurn && (
          <div className="watching-state">
            <div className="watching-icon">👀</div>
            <h2>{currentPlayer.name} sorterer...</h2>
            {isInQueue && <p>Du er #{myBuzzerPosition} i køen</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerGame;
