// game/src/games/squiggle-story/PlayerGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import './SquiggleStory.css';

function PlayerGame() {
  const { socket, playerName, leaveRoom } = useGame();

  const [phase, setPhase] = useState('waiting'); // waiting, drawing, submitted, gallery
  const [squiggle, setSquiggle] = useState(null);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const colorInputRef = useRef(null);
  const [customColor, setCustomColor] = useState(null);

  const colors = [
    '#000000', '#ffffff', '#6b7280',
    '#ef4444', '#f97316', '#92400e',
    '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = ({ squiggle: sq }) => {
      setSquiggle(sq);
      setStrokes([]);
      setCurrentStroke([]);
      setHasSubmitted(false);
      setPhase('drawing');
    };

    const handleGalleryShown = () => {
      setPhase('gallery');
    };

    const handleReadyForNext = () => {
      setPhase('waiting');
      setSquiggle(null);
      setStrokes([]);
      setHasSubmitted(false);
    };

    socket.on('game:round-started', handleRoundStarted);
    socket.on('game:gallery-shown', handleGalleryShown);
    socket.on('game:ready-for-next', handleReadyForNext);

    return () => {
      socket.off('game:round-started', handleRoundStarted);
      socket.off('game:gallery-shown', handleGalleryShown);
      socket.off('game:ready-for-next', handleReadyForNext);
    };
  }, [socket]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the initial squiggle
    if (squiggle && squiggle.points && squiggle.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = squiggle.color || '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(squiggle.points[0].x, squiggle.points[0].y);
      for (let i = 1; i < squiggle.points.length; i++) {
        ctx.lineTo(squiggle.points[i].x, squiggle.points[i].y);
      }
      ctx.stroke();
    }

    // Draw all user strokes
    strokes.forEach(stroke => {
      if (stroke.points && stroke.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color || '#000000';
        ctx.lineWidth = stroke.width || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [squiggle, strokes, currentStroke, color, lineWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  };

  const startDrawing = (e) => {
    if (hasSubmitted) return;
    e.preventDefault();

    const pos = getPosition(e);
    setIsDrawing(true);
    setCurrentStroke([pos]);
    lastPointRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawing || hasSubmitted) return;
    e.preventDefault();

    const pos = getPosition(e);
    const last = lastPointRef.current;

    if (last) {
      const dist = Math.sqrt(Math.pow(pos.x - last.x, 2) + Math.pow(pos.y - last.y, 2));
      if (dist < 3) return;
    }

    setCurrentStroke(prev => [...prev, pos]);
    lastPointRef.current = pos;
  };

  const stopDrawing = (e) => {
    if (!isDrawing || hasSubmitted) return;
    e.preventDefault();

    if (currentStroke.length > 1) {
      setStrokes(prev => [...prev, {
        points: currentStroke,
        color,
        width: lineWidth
      }]);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
    lastPointRef.current = null;
  };

  const clearDrawing = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');

    socket.emit('player:game-action', {
      action: 'submit-drawing',
      data: { imageData }
    });

    setHasSubmitted(true);
    setPhase('submitted');
  };

  return (
    <div className="squigglestory-player">
      {/* Header */}
      <header className="player-header">
        <button className="btn-back" onClick={leaveRoom}>←</button>
        <span className="player-name">{playerName}</span>
        <span className="game-badge">Krusedull</span>
      </header>

      {/* Main content */}
      <main className="player-main">
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div className="waiting-phase">
            <div className="waiting-icon">〰️</div>
            <h2>Venter på neste runde...</h2>
          </div>
        )}

        {/* Drawing phase */}
        {phase === 'drawing' && (
          <div className="drawing-phase">
            <p className="instruction">Lag noe av krusedullen!</p>

            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                width={350}
                height={280}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="drawing-tools">
              <div className="color-picker">
                {colors.map(c => (
                  <button
                    key={c}
                    className={`color-btn ${color === c && !customColor ? 'selected' : ''}`}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '2px solid rgba(255,255,255,0.4)' : undefined }}
                    onClick={() => { setColor(c); setCustomColor(null); }}
                  />
                ))}
                <button
                  className={`color-btn custom-color-btn ${customColor ? 'selected' : ''}`}
                  style={{ background: customColor || 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                  onClick={() => colorInputRef.current?.click()}
                  title="Velg farge"
                />
                <input
                  ref={colorInputRef}
                  type="color"
                  className="hidden-color-input"
                  value={customColor || '#ff0000'}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor(e.target.value);
                  }}
                />
              </div>

              <div className="size-picker">
                <button
                  className={`size-btn ${lineWidth === 2 ? 'selected' : ''}`}
                  onClick={() => setLineWidth(2)}
                >
                  <span className="size-dot small" />
                </button>
                <button
                  className={`size-btn ${lineWidth === 4 ? 'selected' : ''}`}
                  onClick={() => setLineWidth(4)}
                >
                  <span className="size-dot medium" />
                </button>
                <button
                  className={`size-btn ${lineWidth === 8 ? 'selected' : ''}`}
                  onClick={() => setLineWidth(8)}
                >
                  <span className="size-dot large" />
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-clear" onClick={clearDrawing}>
                Tøm
              </button>
              <button className="btn btn-submit" onClick={submitDrawing}>
                Send inn
              </button>
            </div>
          </div>
        )}

        {/* Submitted phase */}
        {phase === 'submitted' && (
          <div className="submitted-phase">
            <div className="submitted-icon">✓</div>
            <h2>Innsendt!</h2>
            <p>Venter på de andre...</p>

            <div className="submitted-preview">
              <canvas
                ref={canvasRef}
                width={350}
                height={280}
                className="preview-canvas"
              />
            </div>
          </div>
        )}

        {/* Gallery phase */}
        {phase === 'gallery' && (
          <div className="gallery-phase">
            <div className="gallery-icon">🖼️</div>
            <h2>Se på storskjermen!</h2>
            <p>Alle tegningene vises nå i galleriet</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerGame;
