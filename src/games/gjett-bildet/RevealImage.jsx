// game/src/games/gjett-bildet/RevealImage.jsx
// Shared reveal-mode image rendering, used by both HostGame and PlayerGame
// (when the teacher enables "show image on student screen") so the two
// stay visually consistent instead of drifting apart over time.
import { useRef } from 'react';

// Random reveal mode - grid-based so coverage scales predictably with %
function RandomRevealOverlay({ revealPercent }) {
  const GRID_SIZE = 16;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

  const shuffledOrderRef = useRef(null);
  const maskIdRef = useRef(`reveal-mask-${Math.random().toString(36).substr(2, 9)}`);

  if (!shuffledOrderRef.current) {
    const order = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      order.push(i);
    }
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    shuffledOrderRef.current = order;
  }

  const adjustedPercent = Math.pow(revealPercent / 100, 1.5);
  const cellsToReveal = Math.floor(adjustedPercent * TOTAL_CELLS);
  const revealedCells = new Set(shuffledOrderRef.current.slice(0, cellsToReveal));

  const maskId = maskIdRef.current;
  const cellSize = 100 / GRID_SIZE;

  if (revealPercent >= 100) {
    return null;
  }

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {Array.from(revealedCells).map(cellIndex => {
            const row = Math.floor(cellIndex / GRID_SIZE);
            const col = cellIndex % GRID_SIZE;
            return (
              <rect
                key={cellIndex}
                x={col * cellSize}
                y={row * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill="black"
              />
            );
          })}
        </mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="black" mask={`url(#${maskId})`} />
    </svg>
  );
}

export default function RevealImage({
  imageUrl,
  mode,
  revealPercent,
  focalPoint,
  imageLoaded,
  onImageLoad,
  answerText
}) {
  if (!imageUrl) return null;

  if (mode === 'random') {
    return (
      <div className="image-container" style={{ position: 'relative', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Laster bilde...</p>
          </div>
        )}
        <img
          src={imageUrl}
          alt="Gjett bildet"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imageLoaded ? 1 : 0 }}
          onLoad={onImageLoad}
          draggable={false}
        />
        <RandomRevealOverlay revealPercent={revealPercent} />

        {answerText && (
          <div className="answer-overlay">
            <p className="answer-label">Svaret var:</p>
            <h1 className="answer-text">{answerText}</h1>
            <p className="answer-wait">Går videre om litt...</p>
          </div>
        )}

        <div className="reveal-indicator">
          <div className="reveal-bar" style={{ width: `${revealPercent}%` }}></div>
        </div>
      </div>
    );
  }

  let imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };

  if (mode === 'blur') {
    const blur = ((100 - revealPercent) / 100) * 30;
    imageStyle.filter = `blur(${blur}px)`;
    imageStyle.transition = 'filter 0.5s ease';
  } else if (mode === 'zoom') {
    const scale = 1 + ((100 - revealPercent) / 100) * 8;
    imageStyle.transform = `scale(${scale})`;
    imageStyle.transformOrigin = `${focalPoint.x}% ${focalPoint.y}%`;
  } else if (mode === 'mask') {
    const maskRadius = Math.pow(revealPercent / 100, 1.5) * 100;
    imageStyle.clipPath = `circle(${maskRadius}% at ${focalPoint.x}% ${focalPoint.y}%)`;
    imageStyle.transition = 'clip-path 0.3s ease';
  }

  return (
    <div className="image-container" style={{ position: 'relative' }}>
      {!imageLoaded && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Laster bilde...</p>
        </div>
      )}
      <img
        src={imageUrl}
        alt="Gjett bildet"
        style={{ ...imageStyle, opacity: imageLoaded ? 1 : 0 }}
        onLoad={onImageLoad}
        draggable={false}
      />

      {answerText && (
        <div className="answer-overlay">
          <p className="answer-label">Svaret var:</p>
          <h1 className="answer-text">{answerText}</h1>
          <p className="answer-wait">Går videre om litt...</p>
        </div>
      )}

      <div className="reveal-indicator">
        <div className="reveal-bar" style={{ width: `${revealPercent}%` }}></div>
      </div>
    </div>
  );
}
