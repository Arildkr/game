// game/src/games/quiz/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import questions, { shuffleQuestions, getQuestionsByCategory, categories } from '../../data/quizQuestions';
import './Quiz.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState('waiting'); // waiting, question, reveal, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [revealData, setRevealData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [category, setCategory] = useState('all');
  const [timeLeft, setTimeLeft] = useState(20);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const timerRef = useRef(null);

  // Initialize questions
  useEffect(() => {
    const filtered = getQuestionsByCategory(category);
    setShuffledQuestions(shuffleQuestions(filtered));
  }, [category]);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    const handlePlayerAnswered = ({ answerCount: count }) => {
      setAnswerCount(count);
    };

    const handleAnswerRevealed = (data) => {
      setRevealData(data);
      setLeaderboard(data.leaderboard);
      setPhase('reveal');
      clearInterval(timerRef.current);
    };

    const handleReadyForQuestion = ({ questionIndex, leaderboard: lb }) => {
      setCurrentQuestionIndex(questionIndex);
      setLeaderboard(lb);
      setPhase('waiting');
      setRevealData(null);
      setAnswerCount(0);
    };

    const handleQuizEnded = ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('finished');
    };

    socket.on('game:player-answered', handlePlayerAnswered);
    socket.on('game:answer-revealed', handleAnswerRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);
    socket.on('game:quiz-ended', handleQuizEnded);

    return () => {
      socket.off('game:player-answered', handlePlayerAnswered);
      socket.off('game:answer-revealed', handleAnswerRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
      socket.off('game:quiz-ended', handleQuizEnded);
      clearInterval(timerRef.current);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);

  const showQuestion = () => {
    if (currentQuestionIndex >= shuffledQuestions.length) {
      setShuffledQuestions(shuffleQuestions(shuffledQuestions));
      setCurrentQuestionIndex(0);
    }

    const question = shuffledQuestions[currentQuestionIndex];
    setCurrentQuestion(question);
    setPhase('question');
    setAnswerCount(0);
    setTimeLeft(20);

    sendGameAction('show-question', {
      question,
      questionIndex: currentQuestionIndex,
      timeLimit: 20
    });

    // Start countdown timer
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

  const revealAnswer = () => {
    clearInterval(timerRef.current);
    sendGameAction('reveal-answer');
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= totalQuestions) {
      sendGameAction('end-quiz');
    } else {
      sendGameAction('next-question');
    }
  };

  const changeCategory = (newCategory) => {
    setCategory(newCategory);
    const filtered = getQuestionsByCategory(newCategory);
    setShuffledQuestions(shuffleQuestions(filtered));
    setCurrentQuestionIndex(0);
  };

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="quiz-host finished-screen">
        <div className="finished-content">
          <h1>Quiz fullført!</h1>

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
    <div className="quiz-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">❓ Quiz</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="question-progress">
            Spørsmål {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="header-actions">
          <select
            value={category}
            onChange={(e) => changeCategory(e.target.value)}
            className="category-select"
            disabled={phase !== 'waiting'}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button className="btn btn-end" onClick={endGame}>Avslutt</button>
        </div>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="question-number">
              Spørsmål {currentQuestionIndex + 1}
            </div>
            <button className="btn btn-show-question" onClick={showQuestion}>
              Vis spørsmål
            </button>
            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} klare
            </p>
          </div>
        )}

        {/* Question phase */}
        {phase === 'question' && currentQuestion && (
          <div className="question-phase">
            <div className="timer-bar">
              <div
                className="timer-progress"
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>
            <div className="timer-text">{timeLeft}s</div>

            <div className="question-card">
              <div className="question-text">{currentQuestion.question}</div>
            </div>

            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className={`option-card option-${index}`}>
                  <span className="option-letter">{['A', 'B', 'C', 'D'][index]}</span>
                  <span className="option-text">{option}</span>
                </div>
              ))}
            </div>

            <div className="answer-status">
              <div className="answer-count">
                {answerCount} / {connectedPlayers.length} har svart
              </div>
            </div>

            <button
              className="btn btn-reveal"
              onClick={revealAnswer}
            >
              Vis fasit
            </button>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && revealData && (
          <div className="reveal-phase">
            <div className="question-card answered">
              <div className="question-text">{currentQuestion?.question}</div>
            </div>

            <div className="options-grid reveal">
              {currentQuestion?.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-card option-${index} ${index === revealData.correctAnswer ? 'correct' : 'wrong'}`}
                >
                  <span className="option-letter">{['A', 'B', 'C', 'D'][index]}</span>
                  <span className="option-text">{option}</span>
                  {index === revealData.correctAnswer && <span className="check">✓</span>}
                </div>
              ))}
            </div>

            <div className="results-summary">
              <h3>Resultater denne runden:</h3>
              <div className="round-results">
                {revealData.results
                  .filter(r => r.isCorrect)
                  .sort((a, b) => b.points - a.points)
                  .slice(0, 5)
                  .map((result, idx) => (
                    <div key={result.playerId} className="result-item correct">
                      <span className="name">{result.playerName}</span>
                      <span className="points">+{result.points}</span>
                    </div>
                  ))}
              </div>
            </div>

            <button className="btn btn-next" onClick={nextQuestion}>
              {currentQuestionIndex + 1 >= totalQuestions ? 'Se resultater' : 'Neste spørsmål'}
            </button>
          </div>
        )}
      </main>

      {/* Leaderboard sidebar */}
      <aside className="leaderboard-sidebar">
        <h3>Poengtavle</h3>
        <ul className="leaderboard-list">
          {leaderboard.map((player, index) => (
            <li key={player.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
              <span className="rank">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </li>
          ))}
          {leaderboard.length === 0 && connectedPlayers.map((player, index) => (
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
