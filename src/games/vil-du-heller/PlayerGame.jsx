// game/src/games/vil-du-heller/PlayerGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import './VilDuHeller.css';

function PlayerGame() {
  const { socket, playerName } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, voting, voted, results
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionShown = ({ question }) => {
      setCurrentQuestion(question);
      setPhase('voting');
      setMyVote(null);
      setResults(null);
    };

    const handleResultsRevealed = ({ votes, questionIndex }) => {
      setResults(votes);
      setPhase('results');
    };

    const handleReadyForQuestion = () => {
      setPhase('waiting');
      setCurrentQuestion(null);
      setMyVote(null);
      setResults(null);
    };

    socket.on('game:question-shown', handleQuestionShown);
    socket.on('game:results-revealed', handleResultsRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);

    return () => {
      socket.off('game:question-shown', handleQuestionShown);
      socket.off('game:results-revealed', handleResultsRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
    };
  }, [socket]);

  const submitVote = (choice) => {
    if (phase !== 'voting' || myVote) return;

    setMyVote(choice);
    setPhase('voted');

    socket.emit('player:game-action', {
      action: 'vote',
      data: { choice }
    });
  };

  // Calculate winning option
  const getWinningOption = () => {
    if (!results) return null;
    if (results.optionA.length > results.optionB.length) return 'optionA';
    if (results.optionB.length > results.optionA.length) return 'optionB';
    return 'tie';
  };

  const getTotalVotes = () => {
    if (!results) return 0;
    return results.optionA.length + results.optionB.length;
  };

  const getPercentage = (option) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((results[option].length / total) * 100);
  };

  return (
    <div className="vilduheller-player">
      {/* Header */}
      <header className="player-header">
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Vil du heller?</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">🤔</div>
            <h2>Venter på neste dilemma...</h2>
            <p>Gjør deg klar til å velge!</p>
          </div>
        )}

        {/* Voting phase - show vote buttons */}
        {phase === 'voting' && currentQuestion && (
          <div className="voting-phase">
            <h2 className="voting-title">Vil du heller...</h2>

            <button
              className="btn-vote btn-vote-a"
              onClick={() => submitVote('optionA')}
            >
              <span className="vote-letter">A</span>
              <span className="vote-text">{currentQuestion.optionA}</span>
            </button>

            <div className="or-divider">ELLER</div>

            <button
              className="btn-vote btn-vote-b"
              onClick={() => submitVote('optionB')}
            >
              <span className="vote-letter">B</span>
              <span className="vote-text">{currentQuestion.optionB}</span>
            </button>
          </div>
        )}

        {/* Voted phase - waiting for results */}
        {phase === 'voted' && currentQuestion && (
          <div className="voted-phase">
            <div className="your-choice">
              <p>Du valgte:</p>
              <div className={`choice-display ${myVote}`}>
                <span className="choice-letter">{myVote === 'optionA' ? 'A' : 'B'}</span>
                <span className="choice-text">
                  {myVote === 'optionA' ? currentQuestion.optionA : currentQuestion.optionB}
                </span>
              </div>
            </div>
            <p className="waiting-text">Venter på at alle skal stemme...</p>
          </div>
        )}

        {/* Results phase */}
        {phase === 'results' && currentQuestion && results && (
          <div className="results-phase">
            <div className="results-header">
              {getWinningOption() === myVote ? (
                <>
                  <div className="result-icon">🎉</div>
                  <h2>Du er med flertallet!</h2>
                </>
              ) : getWinningOption() === 'tie' ? (
                <>
                  <div className="result-icon">⚖️</div>
                  <h2>Uavgjort!</h2>
                </>
              ) : (
                <>
                  <div className="result-icon">😮</div>
                  <h2>Du er i mindretallet!</h2>
                </>
              )}
            </div>

            <div className="results-bars">
              <div className={`result-option ${getWinningOption() === 'optionA' ? 'winner' : ''}`}>
                <div className="result-label">
                  <span className="result-letter">A</span>
                  <span className="result-percent">{getPercentage('optionA')}%</span>
                </div>
                <div className="result-bar-container">
                  <div
                    className="result-bar bar-a"
                    style={{ width: `${getPercentage('optionA')}%` }}
                  />
                </div>
              </div>

              <div className={`result-option ${getWinningOption() === 'optionB' ? 'winner' : ''}`}>
                <div className="result-label">
                  <span className="result-letter">B</span>
                  <span className="result-percent">{getPercentage('optionB')}%</span>
                </div>
                <div className="result-bar-container">
                  <div
                    className="result-bar bar-b"
                    style={{ width: `${getPercentage('optionB')}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="waiting-text">Venter på neste dilemma...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
