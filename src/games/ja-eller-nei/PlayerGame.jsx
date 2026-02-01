// game/src/games/ja-eller-nei/PlayerGame.jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import './JaEllerNei.css';

function PlayerGame() {
  const { socket, playerName, roomCode } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, question, answered, reveal, eliminated, winner
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [isEliminated, setIsEliminated] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionShown = ({ question }) => {
      setCurrentQuestion(question);
      setPhase('question');
      setMyAnswer(null);
      setRevealData(null);
    };

    const handleAnswerRevealed = (data) => {
      setRevealData(data);

      // Check if I was eliminated this round
      if (data.eliminatedThisRound.includes(socket.id)) {
        setIsEliminated(true);
        setPhase('eliminated');
      } else if (data.winner && data.winner.id === socket.id) {
        setIsWinner(true);
        setPhase('winner');
      } else {
        setPhase('reveal');
      }
    };

    const handleReadyForQuestion = ({ players }) => {
      // Update elimination status from server
      const me = players.find(p => p.id === socket.id);
      if (me) {
        setIsEliminated(me.isEliminated);
      }

      if (!isEliminated) {
        setPhase('waiting');
        setCurrentQuestion(null);
        setMyAnswer(null);
        setRevealData(null);
      }
    };

    const handleStateSync = ({ room }) => {
      // Sync state when joining mid-game
      const me = room.players.find(p => p.id === socket.id);
      if (me) {
        setIsEliminated(me.isEliminated);
        if (me.isEliminated) {
          setPhase('eliminated');
        }
      }
    };

    socket.on('game:question-shown', handleQuestionShown);
    socket.on('game:answer-revealed', handleAnswerRevealed);
    socket.on('game:ready-for-question', handleReadyForQuestion);
    socket.on('game:state-sync', handleStateSync);

    return () => {
      socket.off('game:question-shown', handleQuestionShown);
      socket.off('game:answer-revealed', handleAnswerRevealed);
      socket.off('game:ready-for-question', handleReadyForQuestion);
      socket.off('game:state-sync', handleStateSync);
    };
  }, [socket, isEliminated]);

  const submitAnswer = (answer) => {
    if (phase !== 'question' || myAnswer) return;

    setMyAnswer(answer);
    setPhase('answered');

    socket.emit('player:game-action', {
      action: 'answer',
      data: { answer }
    });
  };

  // Winner screen
  if (phase === 'winner') {
    return (
      <div className="jaellernei-player winner-screen">
        <div className="winner-content">
          <div className="trophy">🏆</div>
          <h1>Du vant!</h1>
          <p className="winner-message">Gratulerer, {playerName}!</p>
        </div>
      </div>
    );
  }

  // Eliminated screen
  if (phase === 'eliminated' || isEliminated) {
    return (
      <div className="jaellernei-player eliminated-screen">
        <div className="eliminated-content">
          <div className="eliminated-icon">😢</div>
          <h2>Du er ute!</h2>
          <p>Bedre lykke neste gang</p>
          {revealData && (
            <div className="last-answer">
              <p>Riktig svar var: <strong>{revealData.correctAnswer ? 'JA' : 'NEI'}</strong></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="jaellernei-player">
      {/* Header */}
      <header className="player-header">
        <span className="player-name">{playerName}</span>
        <span className="status-badge active">Inne</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">⏳</div>
            <h2>Venter på spørsmål...</h2>
            <p>Gjør deg klar!</p>
          </div>
        )}

        {/* Question phase - show answer buttons */}
        {phase === 'question' && currentQuestion && (
          <div className="question-phase">
            <div className="question-display">
              <p className="question-text">{currentQuestion}</p>
            </div>

            <div className="answer-buttons">
              <button
                className="btn-answer btn-yes"
                onClick={() => submitAnswer('yes')}
              >
                JA
              </button>
              <button
                className="btn-answer btn-no"
                onClick={() => submitAnswer('no')}
              >
                NEI
              </button>
            </div>
          </div>
        )}

        {/* Answered phase - waiting for reveal */}
        {phase === 'answered' && (
          <div className="answered-phase">
            <div className="my-answer">
              <p>Du svarte:</p>
              <div className={`answer-display ${myAnswer}`}>
                {myAnswer === 'yes' ? 'JA' : 'NEI'}
              </div>
            </div>
            <p className="waiting-text">Venter på fasit...</p>
          </div>
        )}

        {/* Reveal phase - show if correct */}
        {phase === 'reveal' && revealData && (
          <div className="reveal-phase">
            <div className={`result ${myAnswer === (revealData.correctAnswer ? 'yes' : 'no') ? 'correct' : 'wrong'}`}>
              {myAnswer === (revealData.correctAnswer ? 'yes' : 'no') ? (
                <>
                  <div className="result-icon">✅</div>
                  <h2>Riktig!</h2>
                </>
              ) : (
                <>
                  <div className="result-icon">❌</div>
                  <h2>Feil!</h2>
                </>
              )}
            </div>

            <div className="correct-answer">
              <p>Riktig svar: <strong>{revealData.correctAnswer ? 'JA' : 'NEI'}</strong></p>
            </div>

            {revealData.explanation && (
              <p className="explanation">{revealData.explanation}</p>
            )}

            <p className="waiting-text">Venter på neste spørsmål...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
