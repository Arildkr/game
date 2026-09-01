// game/src/games/ja-eller-nei/HostGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import questions, { shuffleQuestions, getQuestionsByDifficulty } from '../../data/jaEllerNeiQuestions';
import './JaEllerNei.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer } = useGame();

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState('waiting'); // waiting, question, reveal, winner
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [revealData, setRevealData] = useState(null);
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [localAnswers, setLocalAnswers] = useState({});

  // Initialize questions
  useEffect(() => {
    const filtered = getQuestionsByDifficulty(difficulty);
    setShuffledQuestions(shuffleQuestions(filtered));
  }, [difficulty]);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    const handlePlayerAnswered = ({ playerId, answerCount: count, allAnswered }) => {
      setAnswerCount(count);
      setLocalAnswers(prev => ({ ...prev, [playerId]: true }));

      // Auto-reveal when all players have answered
      if (allAnswered && phase === 'question') {
        setTimeout(() => {
          sendGameAction('reveal-answer');
        }, 500); // Small delay for dramatic effect
      }
    };

    const handleAnswerRevealed = (data) => {
      setRevealData(data);
      setPhase('reveal');
      if (data.winner) {
        setWinner(data.winner);
        // Show the answer first, then transition to winner after delay
        setTimeout(() => {
          setPhase('winner');
        }, 4000);
      }
    };

    const handleReadyForQuestion = ({ questionIndex }) => {
      setCurrentQuestionIndex(questionIndex);
      setPhase('waiting');
      setRevealData(null);
      setAnswerCount(0);
      setLocalAnswers({});
    };

    socket.on('game:player-answered', handlePlayerAnswered);
    socket.on('game:answer-revealed', handleAnswerRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);

    return () => {
      socket.off('game:player-answered', handlePlayerAnswered);
      socket.off('game:answer-revealed', handleAnswerRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
    };
  }, [socket, phase, sendGameAction]);

  const alivePlayers = players.filter(p => !p.isEliminated && p.isConnected);
  const eliminatedPlayers = players.filter(p => p.isEliminated);

  const showQuestion = () => {
    if (currentQuestionIndex >= shuffledQuestions.length) {
      // Reshuffle if we run out
      setShuffledQuestions(shuffleQuestions(shuffledQuestions));
      setCurrentQuestionIndex(0);
    }

    const question = shuffledQuestions[currentQuestionIndex];
    setCurrentQuestion(question);
    setPhase('question');
    setAnswerCount(0);
    setLocalAnswers({});

    sendGameAction('show-question', { question });
  };

  const revealAnswer = () => {
    sendGameAction('reveal-answer');
  };

  const nextQuestion = () => {
    sendGameAction('next-question');
  };

  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
    const filtered = getQuestionsByDifficulty(newDifficulty);
    setShuffledQuestions(shuffleQuestions(filtered));
    setCurrentQuestionIndex(0);
  };

  // Winner screen
  if (phase === 'winner' && winner) {
    return (
      <div className="jaellernei-host winner-screen">
        <div className="winner-content">
          <div className="trophy">🏆</div>
          <h1>Vi har en vinner!</h1>
          <div className="winner-name">{winner.name}</div>
          <button className="btn btn-primary" onClick={() => endGame()}>
            Avslutt spill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jaellernei-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">✅ Ja eller Nei</span>
          <span className="room-code">Rom: {roomCode}</span>
        </div>
        <div className="header-actions">
          <select
            value={difficulty}
            onChange={(e) => changeDifficulty(e.target.value)}
            className="difficulty-select"
            disabled={phase !== 'waiting'}
          >
            <option value="all">Alle spørsmål</option>
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
            <div className="question-number">
              Spørsmål {currentQuestionIndex + 1}
            </div>
            <button className="btn btn-show-question" onClick={showQuestion}>
              Vis spørsmål
            </button>
            <p className="hint">
              {alivePlayers.length} {alivePlayers.length === 1 ? 'spiller' : 'spillere'} gjenstår
            </p>
          </div>
        )}

        {/* Question phase */}
        {phase === 'question' && currentQuestion && (
          <div className="question-phase">
            <div className="question-card">
              <div className="question-text">{currentQuestion.question}</div>
            </div>

            <div className="answer-status">
              <div className="answer-count">
                {answerCount} / {alivePlayers.length} har svart
              </div>
              <div className="answer-bar">
                <div
                  className="answer-progress"
                  style={{ width: `${alivePlayers.length > 0 ? (answerCount / alivePlayers.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <button
              className="btn btn-reveal"
              onClick={revealAnswer}
            >
              {answerCount < alivePlayers.length ? 'Tving fasit (uten svar = ute)' : 'Vis fasit'}
            </button>
            {answerCount < alivePlayers.length && (
              <p className="force-hint">
                De som ikke har svart blir eliminert
              </p>
            )}
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && revealData && (
          <div className="reveal-phase">
            <div className="question-card answered">
              <div className="question-text">{currentQuestion?.question}</div>
              <div className={`answer-badge ${revealData.correctAnswer ? 'yes' : 'no'}`}>
                {revealData.correctAnswer ? 'JA' : 'NEI'}
              </div>
            </div>

            {revealData.explanation && (
              <div className="explanation">{revealData.explanation}</div>
            )}

            {alivePlayers.length > 0 && (
              <div className="still-in-this-round">
                <h3>Fortsatt med:</h3>
                <div className="still-in-names">
                  {alivePlayers.map(player => (
                    <span key={player.id} className="still-in-name">{player.name}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-next" onClick={nextQuestion}>
              Neste spørsmål
            </button>
          </div>
        )}
      </main>

      {/* Players sidebar */}
      <aside className="players-sidebar">
        <div className="players-section">
          <h3>Inne ({alivePlayers.length})</h3>
          <ul className="players-list alive">
            {alivePlayers.map(player => (
              <li key={player.id} className="player-item">
                <span className="player-status">🟢</span>
                <span className="player-name">{player.name}</span>
                {phase === 'question' && (
                  <span className={`answer-indicator ${localAnswers[player.id] ? 'answered' : ''}`}>
                    {localAnswers[player.id] ? '✓' : '...'}
                  </span>
                )}
                <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern spiller">✕</button>
              </li>
            ))}
          </ul>
        </div>

        {eliminatedPlayers.length > 0 && (
          <div className="players-section eliminated">
            <h3>Ute ({eliminatedPlayers.length})</h3>
            <ul className="players-list">
              {eliminatedPlayers.map(player => (
                <li key={player.id} className="player-item eliminated">
                  <span className="player-status">🔴</span>
                  <span className="player-name">{player.name}</span>
                  <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern spiller">✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

export default HostGame;
