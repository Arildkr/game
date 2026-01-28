// game/src/games/quiz/PlayerGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Quiz.css';

function PlayerGame() {
  const { socket, playerName } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, question, answered, reveal, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [myAnswer, setMyAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [revealData, setRevealData] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionShown = ({ question, options: opts, timeLimit }) => {
      setCurrentQuestion(question);
      setOptions(opts);
      setPhase('question');
      setMyAnswer(null);
      setRevealData(null);
      setMyResult(null);
      setTimeLeft(timeLimit);

      // Client-side timer for display
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    const handleAnswerRevealed = (data) => {
      setRevealData(data);
      setPhase('reveal');

      // Find my result
      const me = data.results.find(r => r.playerId === socket.id);
      if (me) {
        setMyResult(me);
        setMyScore(me.totalScore);
      }

      // Find my rank
      const rank = data.leaderboard.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);
      setLeaderboard(data.leaderboard);
    };

    const handleReadyForQuestion = ({ leaderboard: lb }) => {
      setPhase('waiting');
      setCurrentQuestion(null);
      setOptions([]);
      setMyAnswer(null);
      setRevealData(null);
      setLeaderboard(lb);

      const rank = lb.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);
    };

    const handleQuizEnded = ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('finished');

      const rank = lb.findIndex(p => p.id === socket.id) + 1;
      setMyRank(rank);

      const me = lb.find(p => p.id === socket.id);
      if (me) {
        setMyScore(me.score);
      }
    };

    const handleStateSync = ({ room }) => {
      const me = room.players.find(p => p.id === socket.id);
      if (me) {
        setMyScore(me.score);
      }
    };

    socket.on('game:question-shown', handleQuestionShown);
    socket.on('game:answer-revealed', handleAnswerRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);
    socket.on('game:quiz-ended', handleQuizEnded);
    socket.on('game:state-sync', handleStateSync);

    return () => {
      socket.off('game:question-shown', handleQuestionShown);
      socket.off('game:answer-revealed', handleAnswerRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
      socket.off('game:quiz-ended', handleQuizEnded);
      socket.off('game:state-sync', handleStateSync);
    };
  }, [socket]);

  const submitAnswer = (answerIndex) => {
    if (phase !== 'question' || myAnswer !== null) return;

    setMyAnswer(answerIndex);
    setPhase('answered');

    socket.emit('player:game-action', {
      action: 'answer',
      answer: answerIndex
    });
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="quiz-player finished-screen">
        <div className="finished-content">
          <h1>Quiz fullført!</h1>

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
    <div className="quiz-player">
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
            <h2>Venter på spørsmål...</h2>
            {myRank > 0 && (
              <p className="current-rank">Du er på {myRank}. plass</p>
            )}
          </div>
        )}

        {/* Question phase */}
        {phase === 'question' && (
          <div className="question-phase">
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 5 ? 'urgent' : ''}`}>
                {timeLeft}
              </div>
            </div>

            <div className="question-text-mobile">{currentQuestion}</div>

            <div className="answer-buttons">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`btn-option btn-option-${index}`}
                  onClick={() => submitAnswer(index)}
                >
                  <span className="option-letter">{['A', 'B', 'C', 'D'][index]}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answered phase */}
        {phase === 'answered' && (
          <div className="answered-phase">
            <div className="my-answer">
              <p>Du valgte:</p>
              <div className={`answer-display option-${myAnswer}`}>
                {['A', 'B', 'C', 'D'][myAnswer]}
              </div>
            </div>
            <p className="waiting-text">Venter på fasit...</p>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && myResult && (
          <div className="reveal-phase">
            <div className={`result-display ${myResult.isCorrect ? 'correct' : 'wrong'}`}>
              {myResult.isCorrect ? (
                <>
                  <div className="result-icon">✅</div>
                  <h2>Riktig!</h2>
                  <div className="points-earned">+{myResult.points} poeng</div>
                </>
              ) : (
                <>
                  <div className="result-icon">❌</div>
                  <h2>Feil</h2>
                  <div className="correct-was">
                    Riktig svar: {['A', 'B', 'C', 'D'][revealData?.correctAnswer]}
                  </div>
                </>
              )}
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
