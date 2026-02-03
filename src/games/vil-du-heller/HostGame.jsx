// game/src/games/vil-du-heller/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import questions, { shuffleQuestions, getQuestionsByCategory, getCategories } from '../../data/vilDuHellerQuestions';
import './VilDuHeller.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode } = useGame();

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState('waiting'); // waiting, question, results
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [votes, setVotes] = useState({ optionA: [], optionB: [] });
  const [category, setCategory] = useState('all');

  // Timer
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Initialize questions
  useEffect(() => {
    const filtered = getQuestionsByCategory(category);
    setShuffledQuestions(shuffleQuestions(filtered));
  }, [category]);

  // Timer effect
  useEffect(() => {
    if (phase === 'question' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'question' && timeLeft === 0 && timeLimit > 0) {
      // Time's up - auto-reveal results
      revealResults();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase, timeLimit]);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = ({ votes: newVotes, votedCount, totalPlayers }) => {
      setVotes(newVotes);
    };

    const handleResultsRevealed = ({ votes: finalVotes, questionIndex }) => {
      setVotes(finalVotes);
      setPhase('results');
    };

    const handleReadyForQuestion = ({ questionIndex }) => {
      setCurrentQuestionIndex(questionIndex);
      setPhase('waiting');
      setVotes({ optionA: [], optionB: [] });
    };

    socket.on('game:vote-update', handleVoteUpdate);
    socket.on('game:results-revealed', handleResultsRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);

    return () => {
      socket.off('game:vote-update', handleVoteUpdate);
      socket.off('game:results-revealed', handleResultsRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
    };
  }, [socket]);

  const connectedPlayers = players.filter(p => p.isConnected);
  const totalVotes = votes.optionA.length + votes.optionB.length;

  const showQuestion = () => {
    if (currentQuestionIndex >= shuffledQuestions.length) {
      setShuffledQuestions(shuffleQuestions(shuffledQuestions));
      setCurrentQuestionIndex(0);
    }

    const question = shuffledQuestions[currentQuestionIndex];
    setCurrentQuestion(question);
    setPhase('question');
    setVotes({ optionA: [], optionB: [] });
    setTimeLeft(timeLimit);

    sendGameAction('show-question', { question, timeLimit });
  };

  const revealResults = () => {
    sendGameAction('reveal-results');
  };

  const nextQuestion = () => {
    sendGameAction('next-question');
  };

  const changeCategory = (newCategory) => {
    setCategory(newCategory);
    const filtered = getQuestionsByCategory(newCategory);
    setShuffledQuestions(shuffleQuestions(filtered));
    setCurrentQuestionIndex(0);
  };

  // Calculate percentages
  const getPercentage = (option) => {
    if (totalVotes === 0) return 0;
    const count = votes[option].length;
    return Math.round((count / totalVotes) * 100);
  };

  // Get player names for a vote option
  const getVoterNames = (option) => {
    return votes[option]
      .map(id => players.find(p => p.id === id)?.name)
      .filter(Boolean);
  };

  return (
    <div className="vilduheller-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Vil du heller?</span>
          <span className="room-code">Rom: {roomCode}</span>
        </div>
        <div className="header-actions">
          <select
            value={category}
            onChange={(e) => changeCategory(e.target.value)}
            className="category-select"
            disabled={phase !== 'waiting'}
          >
            <option value="all">Alle kategorier</option>
            <option value="mat">Mat</option>
            <option value="superkrefter">Superkrefter</option>
            <option value="skole">Skole</option>
            <option value="fritid">Fritid</option>
            <option value="fantasi">Fantasi</option>
            <option value="vanskelig">Vanskelige valg</option>
            <option value="hverdag">Hverdagen</option>
            <option value="morsom">Morsomme</option>
          </select>
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="time-select"
            disabled={phase !== 'waiting'}
          >
            <option value={0}>Ingen tidsfrist</option>
            <option value={15}>15 sekunder</option>
            <option value={30}>30 sekunder</option>
            <option value={45}>45 sekunder</option>
            <option value={60}>60 sekunder</option>
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
              Dilemma {currentQuestionIndex + 1}
            </div>
            <button className="btn btn-show-question" onClick={showQuestion}>
              Vis dilemma
            </button>
            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Question phase */}
        {phase === 'question' && currentQuestion && (
          <div className="question-phase">
            <div className="question-header">
              <h2 className="question-title">Vil du heller...</h2>
              {timeLimit > 0 && (
                <div className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>
                  {timeLeft}
                </div>
              )}
            </div>

            <div className="options-display">
              <div className="option option-a">
                <div className="option-letter">A</div>
                <div className="option-text">{currentQuestion.optionA}</div>
                <div className="vote-bar-container">
                  <div
                    className="vote-bar"
                    style={{ width: `${getPercentage('optionA')}%` }}
                  />
                </div>
                <div className="vote-count">{votes.optionA.length} stemmer</div>
              </div>

              <div className="vs-divider">VS</div>

              <div className="option option-b">
                <div className="option-letter">B</div>
                <div className="option-text">{currentQuestion.optionB}</div>
                <div className="vote-bar-container">
                  <div
                    className="vote-bar"
                    style={{ width: `${getPercentage('optionB')}%` }}
                  />
                </div>
                <div className="vote-count">{votes.optionB.length} stemmer</div>
              </div>
            </div>

            <div className="vote-status">
              {totalVotes} / {connectedPlayers.length} har stemt
            </div>

            <button
              className="btn btn-reveal"
              onClick={revealResults}
            >
              {totalVotes < connectedPlayers.length ? 'Vis resultater (noen mangler)' : 'Vis resultater'}
            </button>
          </div>
        )}

        {/* Results phase */}
        {phase === 'results' && currentQuestion && (
          <div className="results-phase">
            <h2 className="question-title">Vil du heller...</h2>

            <div className="options-display results">
              <div className={`option option-a ${getPercentage('optionA') >= getPercentage('optionB') ? 'winner' : ''}`}>
                <div className="option-letter">A</div>
                <div className="option-text">{currentQuestion.optionA}</div>
                <div className="result-percentage">{getPercentage('optionA')}%</div>
                <div className="vote-bar-container">
                  <div
                    className="vote-bar"
                    style={{ width: `${getPercentage('optionA')}%` }}
                  />
                </div>
                <div className="voter-names">
                  {getVoterNames('optionA').map((name, i) => (
                    <span key={i} className="voter-name">{name}</span>
                  ))}
                </div>
              </div>

              <div className="vs-divider">VS</div>

              <div className={`option option-b ${getPercentage('optionB') > getPercentage('optionA') ? 'winner' : ''}`}>
                <div className="option-letter">B</div>
                <div className="option-text">{currentQuestion.optionB}</div>
                <div className="result-percentage">{getPercentage('optionB')}%</div>
                <div className="vote-bar-container">
                  <div
                    className="vote-bar"
                    style={{ width: `${getPercentage('optionB')}%` }}
                  />
                </div>
                <div className="voter-names">
                  {getVoterNames('optionB').map((name, i) => (
                    <span key={i} className="voter-name">{name}</span>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn btn-next" onClick={nextQuestion}>
              Neste dilemma
            </button>
          </div>
        )}
      </main>

      {/* Players sidebar */}
      <aside className="players-sidebar">
        <h3>Spillere ({connectedPlayers.length})</h3>
        <ul className="players-list">
          {connectedPlayers.map(player => {
            const hasVoted = votes.optionA.includes(player.id) || votes.optionB.includes(player.id);
            return (
              <li key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                {phase === 'question' && (
                  <span className={`vote-indicator ${hasVoted ? 'voted' : ''}`}>
                    {hasVoted ? '✓' : '...'}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
