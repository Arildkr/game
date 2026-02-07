// game/src/games/squiggle-story/HostGame.jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { getRandomSquiggle } from '../../data/squiggleShapes';
import './SquiggleStory.css';

function HostGame() {
  const { socket, players, endGame, sendGameAction, roomCode, kickPlayer } = useGame();

  const [phase, setPhase] = useState('setup'); // setup, drawing, gallery, voting, results
  const [currentSquiggle, setCurrentSquiggle] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [voteCount, setVoteCount] = useState(0);
  const [results, setResults] = useState([]);

  const canvasRef = useRef(null);
  const connectedPlayers = players.filter(p => p.isConnected);

  useEffect(() => {
    if (!socket) return;

    const handleSubmissionReceived = ({ playerId, playerName, submissionCount: count, imageData }) => {
      setSubmissionCount(count);
      // Also add to local submissions list for immediate feedback
      if (imageData) {
        setSubmissions(prev => {
          // Don't add duplicates
          if (prev.some(s => s.playerId === playerId)) return prev;
          return [...prev, { playerId, playerName, imageData }];
        });
      }
    };

    const handleGalleryShown = ({ submissions: subs }) => {
      setSubmissions(subs);
      setPhase('gallery');
    };

    const handleVoteReceived = ({ voteCount: count }) => {
      setVoteCount(count);
    };

    const handleResultsShown = ({ top3, allResults }) => {
      setResults(allResults || top3);
      setPhase('results');
    };

    socket.on('game:submission-received', handleSubmissionReceived);
    socket.on('game:gallery-shown', handleGalleryShown);
    socket.on('game:vote-received', handleVoteReceived);
    socket.on('game:results-shown', handleResultsShown);

    return () => {
      socket.off('game:submission-received', handleSubmissionReceived);
      socket.off('game:gallery-shown', handleGalleryShown);
      socket.off('game:vote-received', handleVoteReceived);
      socket.off('game:results-shown', handleResultsShown);
    };
  }, [socket]);

  // Draw squiggle preview
  useEffect(() => {
    if (!canvasRef.current || !currentSquiggle) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentSquiggle.points && currentSquiggle.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentSquiggle.color || '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentSquiggle.points[0].x, currentSquiggle.points[0].y);
      for (let i = 1; i < currentSquiggle.points.length; i++) {
        ctx.lineTo(currentSquiggle.points[i].x, currentSquiggle.points[i].y);
      }
      ctx.stroke();
    }
  }, [currentSquiggle]);

  const startRound = () => {
    const squiggle = getRandomSquiggle();

    setCurrentSquiggle(squiggle);
    setSubmissionCount(0);
    setSubmissions([]);
    setPhase('drawing');

    sendGameAction('start-round', { squiggle });
  };

  const showGallery = () => {
    sendGameAction('show-gallery');
  };

  const removeFromGallery = (playerId) => {
    setSubmissions(prev => prev.filter(s => s.playerId !== playerId));
    sendGameAction('remove-submission', { playerId });
  };

  const startVoting = () => {
    setVoteCount(0);
    setPhase('voting');
    sendGameAction('start-voting');
  };

  const showResults = () => {
    sendGameAction('show-results');
  };

  const nextRound = () => {
    setRoundNumber(prev => prev + 1);
    setPhase('setup');
    setCurrentSquiggle(null);
    setSubmissions([]);
    setSubmissionCount(0);
    setVoteCount(0);
    setResults([]);

    sendGameAction('next-squiggle');
  };

  return (
    <div className="squigglestory-host">
      {/* Header */}
      <header className="game-header">
        <div className="game-info">
          <span className="game-badge">Krusedull</span>
          <span className="room-code">Rom: {roomCode}</span>
          <span className="round-info">Runde {roundNumber}</span>
        </div>
        <button className="btn btn-end" onClick={() => endGame()}>Avslutt</button>
      </header>

      {/* Main content */}
      <main className="game-main">
        {/* Setup phase */}
        {phase === 'setup' && (
          <div className="setup-phase">
            <div className="setup-icon">〰️</div>
            <h2>Runde {roundNumber}</h2>
            <p className="description">
              Alle får samme krusedull og lager sin egen tegning!
            </p>

            <button className="btn btn-start" onClick={startRound}>
              Start runde
            </button>

            <p className="hint">
              {connectedPlayers.length} {connectedPlayers.length === 1 ? 'spiller' : 'spillere'} er klare
            </p>
          </div>
        )}

        {/* Drawing phase */}
        {phase === 'drawing' && (
          <div className="drawing-phase">
            <h2>Tegning pågår</h2>

            <div className="squiggle-preview">
              <p>Krusedullen:</p>
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="preview-canvas"
              />
            </div>

            <div className="submission-status">
              <p>{submissionCount} / {connectedPlayers.length} har levert</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${connectedPlayers.length > 0 ? (submissionCount / connectedPlayers.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <button
              className="btn btn-show-gallery"
              onClick={showGallery}
            >
              {submissionCount < connectedPlayers.length
                ? `Vis galleri (${connectedPlayers.length - submissionCount} mangler)`
                : 'Vis galleri'}
            </button>
          </div>
        )}

        {/* Gallery phase */}
        {phase === 'gallery' && (
          <div className="gallery-phase">
            <h2>Galleri</h2>

            <div className="gallery-grid">
              {submissions.map((sub, i) => (
                <div key={sub.playerId || i} className="gallery-item">
                  <button
                    className="btn-remove-gallery"
                    onClick={() => removeFromGallery(sub.playerId)}
                    title="Fjern fra galleri"
                  >
                    ✕
                  </button>
                  <img
                    src={sub.imageData}
                    alt={`Tegning av ${sub.playerName}`}
                    className="gallery-image"
                  />
                  <div className="gallery-name">{sub.playerName}</div>
                </div>
              ))}
            </div>

            {submissions.length === 0 && (
              <p className="no-submissions">Ingen har levert ennå</p>
            )}

            <button className="btn btn-next" onClick={startVoting}>
              Start avstemming
            </button>
          </div>
        )}

        {/* Voting phase */}
        {phase === 'voting' && (
          <div className="voting-phase">
            <h2>Avstemming</h2>
            <p className="description">Spillerne stemmer på favorittegningen sin</p>

            <div className="submission-status">
              <p>{voteCount} / {connectedPlayers.length} har stemt</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${connectedPlayers.length > 0 ? (voteCount / connectedPlayers.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <button
              className="btn btn-show-results"
              onClick={showResults}
              disabled={voteCount === 0}
            >
              Vis resultater
            </button>
          </div>
        )}

        {/* Results phase */}
        {phase === 'results' && (
          <div className="results-phase">
            <h2>Resultater</h2>

            <div className="results-podium">
              {results.slice(0, 3).map((entry, i) => (
                <div key={entry.playerId} className={`podium-place podium-place-${i + 1}`}>
                  <div className="podium-medal">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <img
                    src={entry.imageData}
                    alt={`Tegning av ${entry.playerName}`}
                    className="podium-image"
                  />
                  <div className="podium-name">{entry.playerName}</div>
                  <div className="podium-votes">{entry.votes} {entry.votes === 1 ? 'stemme' : 'stemmer'}</div>
                </div>
              ))}
            </div>

            <button className="btn btn-next" onClick={nextRound}>
              Neste runde
            </button>
          </div>
        )}
      </main>

      {/* Players sidebar */}
      <aside className="players-sidebar">
        <h3>Spillere ({connectedPlayers.length})</h3>
        <ul className="players-list">
          {connectedPlayers.map(player => (
            <li key={player.id} className="player-item">
              <span className="player-name">{player.name}</span>
              <button className="btn-kick" onClick={() => kickPlayer(player.id)} title="Fjern spiller">✕</button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default HostGame;
