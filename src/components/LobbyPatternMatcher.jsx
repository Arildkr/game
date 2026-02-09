// game/src/components/LobbyPatternMatcher.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyMinigames.css';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 300;

// Fargede knapper - posisjon og farger
const BUTTON_COLORS = [
  { name: 'red',    base: '#e74c3c', light: '#ff6b6b', glow: 'rgba(231, 76, 60, 0.6)',  dim: '#8b2e23' },
  { name: 'blue',   base: '#3498db', light: '#5dade2', glow: 'rgba(52, 152, 219, 0.6)',  dim: '#1f5f8b' },
  { name: 'green',  base: '#2ecc71', light: '#58d68d', glow: 'rgba(46, 204, 113, 0.6)',  dim: '#1a7a42' },
  { name: 'yellow', base: '#f1c40f', light: '#f7dc6f', glow: 'rgba(241, 196, 15, 0.6)',  dim: '#917608' },
];

const BUTTON_SIZE = 120;
const BUTTON_GAP = 24;
const BUTTON_RADIUS = 16;
const TOTAL_BUTTONS_WIDTH = BUTTON_COLORS.length * BUTTON_SIZE + (BUTTON_COLORS.length - 1) * BUTTON_GAP;
const BUTTONS_X_START = (CANVAS_WIDTH - TOTAL_BUTTONS_WIDTH) / 2;
const BUTTONS_Y = 170;

// Tidsinnstillinger
const INITIAL_LIGHT_DURATION = 500;   // ms per farge i mønsteret
const INITIAL_PAUSE_DURATION = 200;   // ms pause mellom farger
const MIN_LIGHT_DURATION = 200;       // raskeste visning
const SPEED_DECREASE_PER_ROUND = 25;  // ms raskere per runde

function getButtonRect(index) {
  return {
    x: BUTTONS_X_START + index * (BUTTON_SIZE + BUTTON_GAP),
    y: BUTTONS_Y,
    w: BUTTON_SIZE,
    h: BUTTON_SIZE,
  };
}

function LobbyPatternMatcher() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle'); // idle, showing, input, dead
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyPatternHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hold submitLobbyScore ref oppdatert
  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand i refs for å unngå re-renders
  const gameStateRef = useRef(gameState);
  const highScoreRef = useRef(highScore);
  const patternRef = useRef([]);          // Hele mønsteret
  const inputIndexRef = useRef(0);        // Hvor langt spilleren har kommet i input
  const roundRef = useRef(0);             // Nåværende runde (0-indeksert)
  const activeButtonRef = useRef(-1);     // Hvilken knapp som lyser (-1 = ingen)
  const showIndexRef = useRef(0);         // Indeks i mønsteret som vises
  const showTimerRef = useRef(null);      // setTimeout for visning
  const glowIntensityRef = useRef({});    // Glow-animasjon per knapp
  const playerPressRef = useRef(-1);      // Knapp spilleren trykket på (for visuell feedback)
  const playerPressTimerRef = useRef(null);
  const flashWrongRef = useRef(-1);       // Feil-knapp flash
  const flashWrongTimerRef = useRef(null);
  const frameCountRef = useRef(0);
  const deathTimeRef = useRef(0);

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  // Nedtelling ved tap
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 500);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (playerPressTimerRef.current) clearTimeout(playerPressTimerRef.current);
      if (flashWrongTimerRef.current) clearTimeout(flashWrongTimerRef.current);
    };
  }, []);

  // Beregn hastighet basert på runde
  const getLightDuration = useCallback(() => {
    return Math.max(MIN_LIGHT_DURATION, INITIAL_LIGHT_DURATION - roundRef.current * SPEED_DECREASE_PER_ROUND);
  }, []);

  const getPauseDuration = useCallback(() => {
    return Math.max(80, INITIAL_PAUSE_DURATION - roundRef.current * 10);
  }, []);

  // Legg til ny farge i mønsteret og start visning
  const extendAndShowPattern = useCallback(() => {
    const next = Math.floor(Math.random() * 4);
    patternRef.current.push(next);
    showIndexRef.current = 0;
    inputIndexRef.current = 0;
    setGameState('showing');

    // Start visningen med liten forsinkelse
    showTimerRef.current = setTimeout(() => {
      showNextInPattern();
    }, 400);
  }, []);

  // Vis neste element i mønsteret
  const showNextInPattern = useCallback(() => {
    if (!isMountedRef.current) return;

    const idx = showIndexRef.current;
    const pattern = patternRef.current;

    if (idx >= pattern.length) {
      // Ferdig med å vise mønsteret, bytt til input
      activeButtonRef.current = -1;
      if (isMountedRef.current) setGameState('input');
      return;
    }

    // Lys opp knappen
    activeButtonRef.current = pattern[idx];

    const lightDur = Math.max(MIN_LIGHT_DURATION, INITIAL_LIGHT_DURATION - roundRef.current * SPEED_DECREASE_PER_ROUND);
    const pauseDur = Math.max(80, INITIAL_PAUSE_DURATION - roundRef.current * 10);

    // Slukk etter lightDur
    showTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      activeButtonRef.current = -1;

      // Pause, deretter neste
      showTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        showIndexRef.current = idx + 1;
        showNextInPattern();
      }, pauseDur);
    }, lightDur);
  }, []);

  // Start spillet
  const startGame = useCallback(() => {
    patternRef.current = [];
    inputIndexRef.current = 0;
    roundRef.current = 0;
    activeButtonRef.current = -1;
    showIndexRef.current = 0;
    playerPressRef.current = -1;
    flashWrongRef.current = -1;
    setScore(0);

    // Start første runde
    extendAndShowPattern();
  }, [extendAndShowPattern]);

  // Spilleren trykker på en knapp
  const handleButtonPress = useCallback((buttonIndex) => {
    if (gameStateRef.current !== 'input') return;

    const pattern = patternRef.current;
    const expected = pattern[inputIndexRef.current];

    // Visuell feedback for trykk
    playerPressRef.current = buttonIndex;
    if (playerPressTimerRef.current) clearTimeout(playerPressTimerRef.current);
    playerPressTimerRef.current = setTimeout(() => {
      playerPressRef.current = -1;
    }, 200);

    if (buttonIndex === expected) {
      // Riktig!
      inputIndexRef.current++;

      if (inputIndexRef.current >= pattern.length) {
        // Fullførte runden
        roundRef.current++;
        const newScore = roundRef.current * 10;
        setScore(newScore);

        if (navigator.vibrate) navigator.vibrate(30);

        // Kort pause, så neste runde
        setGameState('showing');
        showTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          extendAndShowPattern();
        }, 600);
      }
    } else {
      // Feil! Game over
      flashWrongRef.current = buttonIndex;
      if (flashWrongTimerRef.current) clearTimeout(flashWrongTimerRef.current);
      flashWrongTimerRef.current = setTimeout(() => {
        flashWrongRef.current = -1;
      }, 500);

      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

      const finalScore = roundRef.current * 10;
      setGameState('dead');
      setScore(finalScore);
      deathTimeRef.current = performance.now();
      setCountdown(3);

      // Oppdater high score
      if (finalScore > highScoreRef.current) {
        setHighScore(finalScore);
        localStorage.setItem('lobbyPatternHighScore', finalScore.toString());
      }

      // Send poeng til server
      if (finalScore > 0 && submitLobbyScoreRef.current) {
        submitLobbyScoreRef.current(finalScore, 'pattern');
      }
    }
  }, [extendAndShowPattern]);

  // Finn hvilken knapp som ble klikket
  const getClickedButton = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (let i = 0; i < 4; i++) {
      const btn = getButtonRect(i);
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        return i;
      }
    }
    return -1;
  }, []);

  // Tegn spillet
  const draw = useCallback((ctx) => {
    const state = gameStateRef.current;
    const currentRound = roundRef.current;
    const currentHighScore = highScoreRef.current;
    frameCountRef.current++;

    // Bakgrunn
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Tittel og runde-info oppe
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (state === 'showing') {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Se på mønsteret...', CANVAS_WIDTH / 2, 16);

      // Vis hvilken del av mønsteret som vises
      const total = patternRef.current.length;
      const current = showIndexRef.current;
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
      ctx.fillText(`Runde ${currentRound + 1} - ${total} farger`, CANVAS_WIDTH / 2, 46);

      // Prikker som viser fremgang i visningen
      const dotSize = 8;
      const dotGap = 6;
      const dotsWidth = total * dotSize + (total - 1) * dotGap;
      const dotsX = (CANVAS_WIDTH - dotsWidth) / 2;
      for (let i = 0; i < total; i++) {
        const dx = dotsX + i * (dotSize + dotGap) + dotSize / 2;
        const dy = 74;
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize / 2, 0, Math.PI * 2);
        if (activeButtonRef.current >= 0 && i === showIndexRef.current) {
          ctx.fillStyle = BUTTON_COLORS[patternRef.current[i]].base;
        } else if (i < showIndexRef.current) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
        }
        ctx.fill();
      }
    } else if (state === 'input') {
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Din tur!', CANVAS_WIDTH / 2, 16);

      // Vis fremgang
      const total = patternRef.current.length;
      const done = inputIndexRef.current;
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
      ctx.fillText(`${done} / ${total}`, CANVAS_WIDTH / 2, 46);

      // Fremgangsprikker
      const dotSize = 8;
      const dotGap = 6;
      const dotsWidth = total * dotSize + (total - 1) * dotGap;
      const dotsX = (CANVAS_WIDTH - dotsWidth) / 2;
      for (let i = 0; i < total; i++) {
        const dx = dotsX + i * (dotSize + dotGap) + dotSize / 2;
        const dy = 74;
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize / 2, 0, Math.PI * 2);
        if (i < done) {
          ctx.fillStyle = '#4ecdc4';
        } else if (i === done) {
          // Pulserende neste prikk
          const pulse = 0.5 + Math.sin(frameCountRef.current * 0.08) * 0.5;
          ctx.fillStyle = `rgba(78, 205, 196, ${0.3 + pulse * 0.4})`;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
        }
        ctx.fill();
      }
    } else if (state === 'idle' || state === 'dead') {
      // Tegn kun knappene i dim tilstand, overlay vises via HTML
    }

    // Poeng (øverst til høyre)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${currentRound}`, CANVAS_WIDTH - 14, 16);
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 14, 40);

    // Tegn de 4 knappene
    for (let i = 0; i < 4; i++) {
      const btn = getButtonRect(i);
      const color = BUTTON_COLORS[i];
      const isActive = activeButtonRef.current === i;
      const isPlayerPress = playerPressRef.current === i;
      const isWrongFlash = flashWrongRef.current === i;
      const isLit = isActive || isPlayerPress;

      // Ytre glow når aktiv
      if (isLit) {
        const glowSize = 18;
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = 30;
        ctx.fillStyle = color.glow;
        ctx.beginPath();
        roundedRect(ctx, btn.x - glowSize / 2, btn.y - glowSize / 2, btn.w + glowSize, btn.h + glowSize, BUTTON_RADIUS + 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Feil-flash (rød puls)
      if (isWrongFlash) {
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.beginPath();
        roundedRect(ctx, btn.x - 8, btn.y - 8, btn.w + 16, btn.h + 16, BUTTON_RADIUS + 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Knappens skygge (3D-effekt)
      if (!isLit) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        roundedRect(ctx, btn.x + 2, btn.y + 4, btn.w, btn.h, BUTTON_RADIUS);
        ctx.fill();
      }

      // Knappen selv
      ctx.fillStyle = isLit ? color.light : (state === 'idle' || state === 'dead' ? color.dim : color.base);
      ctx.beginPath();
      roundedRect(ctx, btn.x, btn.y + (isLit ? 2 : 0), btn.w, btn.h, BUTTON_RADIUS);
      ctx.fill();

      // Indre highlight (glans)
      if (isLit) {
        const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRect(ctx, btn.x, btn.y + 2, btn.w, btn.h, BUTTON_RADIUS);
        ctx.fill();
      } else {
        // Subtil glans på uaktive knapper
        const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRect(ctx, btn.x, btn.y, btn.w, btn.h, BUTTON_RADIUS);
        ctx.fill();
      }

      // Kantlinje
      ctx.strokeStyle = isLit ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isLit ? 3 : 1;
      ctx.beginPath();
      roundedRect(ctx, btn.x, btn.y + (isLit ? 2 : 0), btn.w, btn.h, BUTTON_RADIUS);
      ctx.stroke();

      // Feil X-merke
      if (isWrongFlash) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const cx = btn.x + btn.w / 2;
        const cy = btn.y + btn.h / 2;
        const s = 20;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy + s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }

    // Dekorativ linje over knappene
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BUTTONS_X_START, BUTTONS_Y - 16);
    ctx.lineTo(BUTTONS_X_START + TOTAL_BUTTONS_WIDTH, BUTTONS_Y - 16);
    ctx.stroke();

    // Bakgrunnspartikler (subtile prikker)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 30; i++) {
      const px = ((i * 137 + frameCountRef.current * 0.2) % CANVAS_WIDTH);
      const py = ((i * 97 + frameCountRef.current * 0.1) % (BUTTONS_Y - 30)) + 10;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Hjelpefunksjon: rundet rektangel
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Render-loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    const loop = () => {
      if (!isMountedRef.current) return;
      draw(ctx);
      animId = requestAnimationFrame(loop);
      animFrameRef.current = animId;
    };

    animId = requestAnimationFrame(loop);
    animFrameRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
      animFrameRef.current = null;
    };
  }, [draw]);

  // Klikk-håndtering
  const handleClick = useCallback((clientX, clientY) => {
    const state = gameStateRef.current;

    if (state === 'idle') {
      startGame();
      return;
    }
    if (state === 'dead') {
      if (performance.now() - deathTimeRef.current < 1500) return;
      startGame();
      return;
    }

    if (state === 'input') {
      const btn = getClickedButton(clientX, clientY);
      if (btn >= 0) {
        handleButtonPress(btn);
      }
    }
  }, [startGame, getClickedButton, handleButtonPress]);

  // Tastatur-håndtering
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = gameStateRef.current;

      // Start/restart
      if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'idle') {
          startGame();
          return;
        }
        if (state === 'dead') {
          if (performance.now() - deathTimeRef.current < 1500) return;
          startGame();
          return;
        }
      }

      // Tast 1-4 eller piltaster for knapper under input
      if (state === 'input') {
        let btnIndex = -1;
        if (e.code === 'Digit1' || e.code === 'KeyQ') btnIndex = 0;
        else if (e.code === 'Digit2' || e.code === 'KeyW') btnIndex = 1;
        else if (e.code === 'Digit3' || e.code === 'KeyE') btnIndex = 2;
        else if (e.code === 'Digit4' || e.code === 'KeyR') btnIndex = 3;
        else if (e.code === 'ArrowLeft')  btnIndex = 0;
        else if (e.code === 'ArrowDown')  btnIndex = 1;
        else if (e.code === 'ArrowUp')    btnIndex = 2;
        else if (e.code === 'ArrowRight') btnIndex = 3;

        if (btnIndex >= 0) {
          e.preventDefault();
          handleButtonPress(btnIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, handleButtonPress]);

  return (
    <div className="lobby-minigame">
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={(e) => handleClick(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (touch) handleClick(touch.clientX, touch.clientY);
          }}
        />

        {gameState === 'idle' && (
          <div className="overlay start-overlay">
            <p className="game-title">Mønstermatcher</p>
            <p>Trykk for å starte!</p>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="overlay death-overlay">
            <p className="final-score">{score}</p>
            <p className="retry-text">poeng</p>
            {countdown > 0 ? (
              <p className="countdown-text">{countdown}</p>
            ) : (
              <p className="retry-text">Trykk for å prøve igjen</p>
            )}
          </div>
        )}
      </div>

      <div className="game-stats">
        <span className="current-score">Poeng: {score}</span>
        <span className="best-score">Best: {highScore}</span>
      </div>
    </div>
  );
}

export default LobbyPatternMatcher;
