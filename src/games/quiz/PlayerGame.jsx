// game/src/games/quiz/PlayerGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import './Quiz.css';

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, question, answered, reveal, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [revealData, setRevealData] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionShown = ({ question, timeLimit }) => {
      setCurrentQuestion(question);
      setPhase('question');
      setMyAnswer('');
      setHasSubmitted(false);
      setRevealData(null);
      setMyResult(null);
      setTimeLeft(timeLimit);

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
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
      setMyAnswer('');
      setHasSubmitted(false);
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

  // Client-side timer
  useEffect(() => {
    if (phase === 'question' && timeLeft > 0 && !hasSubmitted) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'question' && timeLeft === 0 && !hasSubmitted) {
      // Auto-submit empty answer when time runs out
      submitAnswer();
    }
  }, [phase, timeLeft, hasSubmitted]);

  const submitAnswer = (e) => {
    if (e) e.preventDefault();
    if (hasSubmitted) return;

    setHasSubmitted(true);
    setPhase('answered');

    // Bruk riktig format: { action, data }
    socket.emit('player:game-action', {
      action: 'answer',
      data: { answer: myAnswer.trim() }
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
        <button className="btn-back" onClick={leaveRoom}>←</button>
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
          <div className="question-phase text-answer">
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 5 ? 'urgent' : ''}`}>
                {timeLeft}
              </div>
            </div>

            <div className="question-text-mobile">{currentQuestion}</div>

            <form className="answer-form" onSubmit={submitAnswer}>
              <input
                ref={inputRef}
                type="text"
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Skriv svaret ditt..."
                autoComplete="off"
                autoFocus
                disabled={hasSubmitted}
              />
              <button
                type="submit"
                className="btn-submit"
                disabled={hasSubmitted || !myAnswer.trim()}
              >
                Send svar
              </button>
            </form>
          </div>
        )}

        {/* Answered phase */}
        {phase === 'answered' && (
          <div className="answered-phase">
            <div className="my-answer text-answer-display">
              <p>Du svarte:</p>
              <div className="answer-display">
                "{myAnswer || '(ingen svar)'}"
              </div>
            </div>
            <p className="waiting-text">Venter på fasit...</p>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && (
          <div className="reveal-phase">
            {myResult ? (
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
                      Riktig svar: {revealData?.correctAnswer}
                    </div>
                    {myResult.answer && (
                      <div className="your-answer">
                        Du svarte: "{myResult.answer}"
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="result-display wrong">
                <div className="result-icon">❌</div>
                <h2>Ikke svart</h2>
                <div className="correct-was">
                  Riktig svar: {revealData?.correctAnswer}
                </div>
              </div>
            )}

            <div className="current-standing">
              <p>Du er på <strong>{myRank > 0 ? myRank : '?'}. plass</strong></p>
              <p className="total-score">{myScore} poeng totalt</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
