// game/src/games/tegn-det/DrawingCanvas.jsx
import { useRef, useEffect, useState, useCallback } from 'react';

// Flood fill algorithm (scanline for performance)
function floodFillCanvas(ctx, startX, startY, fillColorHex, canvasWidth, canvasHeight) {
  startX = Math.max(0, Math.min(Math.floor(startX), canvasWidth - 1));
  startY = Math.max(0, Math.min(Math.floor(startY), canvasHeight - 1));

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const startIdx = (startY * canvasWidth + startX) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  const fillR = parseInt(fillColorHex.slice(1, 3), 16);
  const fillG = parseInt(fillColorHex.slice(3, 5), 16);
  const fillB = parseInt(fillColorHex.slice(5, 7), 16);

  // Don't fill if already the same color
  if (Math.abs(startR - fillR) < 5 && Math.abs(startG - fillG) < 5 && Math.abs(startB - fillB) < 5 && startA > 250) return;

  const tolerance = 32;
  const visited = new Uint8Array(canvasWidth * canvasHeight);

  const colorMatch = (idx) => {
    return Math.abs(data[idx] - startR) <= tolerance &&
           Math.abs(data[idx + 1] - startG) <= tolerance &&
           Math.abs(data[idx + 2] - startB) <= tolerance &&
           Math.abs(data[idx + 3] - startA) <= tolerance;
  };

  const stack = [startX, startY];

  while (stack.length > 0) {
    const y = stack.pop();
    const x = stack.pop();

    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

    const key = y * canvasWidth + x;
    if (visited[key]) continue;

    const idx = key * 4;
    if (!colorMatch(idx)) continue;

    visited[key] = 1;
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = 255;

    stack.push(x + 1, y);
    stack.push(x - 1, y);
    stack.push(x, y + 1);
    stack.push(x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);
}

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
  const [tool, setTool] = useState('pen'); // 'pen' or 'fill'
  const lastPointRef = useRef(null);

  // Colors palette
  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  // Draw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes (including fill strokes)
    strokes.forEach(stroke => {
      if (stroke.type === 'fill') {
        floodFillCanvas(ctx, stroke.x, stroke.y, stroke.color, canvas.width, canvas.height);
      } else if (stroke.points && stroke.points.length > 1) {
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

  const performFill = (pos) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    floodFillCanvas(ctx, pos.x, pos.y, color, canvas.width, canvas.height);

    if (onStroke) {
      onStroke({
        type: 'fill',
        x: pos.x,
        y: pos.y,
        color
      });
    }
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    e.preventDefault();

    const pos = getPosition(e);

    if (tool === 'fill') {
      performFill(pos);
      return;
    }

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
        className={`drawing-canvas ${tool === 'fill' ? 'fill-cursor' : ''}`}
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
          <div className="tool-picker">
            <button
              className={`tool-btn ${tool === 'pen' ? 'selected' : ''}`}
              onClick={() => setTool('pen')}
              title="Penn"
            >
              ✏️
            </button>
            <button
              className={`tool-btn ${tool === 'fill' ? 'selected' : ''}`}
              onClick={() => setTool('fill')}
              title="Fyll"
            >
              🪣
            </button>
          </div>
          <div className="color-picker">
            {colors.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c, border: c === '#ffffff' ? '2px solid rgba(255,255,255,0.4)' : undefined }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          {tool === 'pen' && (
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
          )}
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;
