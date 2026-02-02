// game/src/games/tegn-det/DrawingCanvas.jsx
import { useRef, useEffect, useState, useCallback } from 'react';

function DrawingCanvas({
  isDrawer = false,
  onStroke,
  strokes = [],
  width = 400,
  height = 300,
  backgroundColor = '#ffffff'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const lastPointRef = useRef(null);

  // Colors palette
  const colors = [
    '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  // Draw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
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

    // Draw current stroke (while drawing)
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
  }, [strokes, currentStroke, color, lineWidth, backgroundColor]);

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get position relative to canvas
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
    if (!isDrawer) return;
    e.preventDefault();

    const pos = getPosition(e);
    setIsDrawing(true);
    setCurrentStroke([pos]);
    lastPointRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault();

    const pos = getPosition(e);

    // Throttle: only add point if moved enough
    const last = lastPointRef.current;
    if (last) {
      const dist = Math.sqrt(Math.pow(pos.x - last.x, 2) + Math.pow(pos.y - last.y, 2));
      if (dist < 3) return; // Skip if too close
    }

    setCurrentStroke(prev => [...prev, pos]);
    lastPointRef.current = pos;
  };

  const stopDrawing = (e) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault();

    if (currentStroke.length > 1 && onStroke) {
      onStroke({
        points: currentStroke,
        color,
        width: lineWidth
      });
    }

    setIsDrawing(false);
    setCurrentStroke([]);
    lastPointRef.current = null;
  };

  return (
    <div className="drawing-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
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

      {isDrawer && (
        <div className="drawing-tools">
          <div className="color-picker">
            {colors.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
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
      )}
    </div>
  );
}

export default DrawingCanvas;
