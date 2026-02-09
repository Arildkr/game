// game/src/components/LobbyFlappy.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyMinigames.css';

// Canvas
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 300;

// Fuglen
const BIRD_SIZE = 24;
const BIRD_X = 120;

// Fysikk
const GRAVITY = 0.5;
const FLAP_FORCE = -7;

// Rør
const PIPE_SPEED = 3;
const PIPE_GAP = 100;
const PIPE_WIDTH = 50;
const PIPE_SPAWN_INTERVAL = 100; // frames mellom hvert rør

// Dash
const DASH_DURATION = 300;   // ms
const DASH_COOLDOWN = 3000;  // ms
const DASH_SPEED_BOOST = 6;

// Farger
const BIRD_COLOR = '#4ecdc4';
const PIPE_COLOR = '#2ecc71';
const PIPE_BORDER_COLOR = '#27ae60';
const BG_COLOR = '#0f0f23';
const GROUND_COLOR = '#2d4059';
const GROUND_LINE_COLOR = '#3d5a80';
const GROUND_HEIGHT = 36;

function LobbyFlappy() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyFlappyHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hold submitLobbyScore ref oppdatert
  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand i refs for ytelse
  const birdRef = useRef({
    y: CANVAS_HEIGHT / 2,
    vy: 0,
    rotation: 0
  });

  const pipesRef = useRef([]);
  const scoreRef = useRef(0);
  const pipeCountRef = useRef(0);       // neste rør sin verdi
  const frameCountRef = useRef(0);
  const highScoreRef = useRef(0);
  const gameStateRef = useRef('idle');

  // Dash-tilstand
  const dashRef = useRef({
    active: false,
    startTime: 0,
    lastDashTime: 0
  });

  // Ghost-tilstand
  const ghostRecordingRef = useRef([]);   // nåværende opptak (bird Y per frame)
  const ghostReplayRef = useRef(null);    // forrige kjøring sitt opptak

  // Dobbelttrykk-deteksjon for dash
  const lastTapTimeRef = useRef(0);
  const DOUBLE_TAP_THRESHOLD = 250; // ms

  // Sync refs med state
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Cleanup ved unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, []);

  // Generer rør med tilfeldig gap-posisjon
  const spawnPipe = useCallback(() => {
    const minGapY = PIPE_GAP / 2 + 30;
    const maxGapY = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP / 2 - 30;
    const gapCenterY = minGapY + Math.random() * (maxGapY - minGapY);

    pipesRef.current.push({
      x: CANVAS_WIDTH,
      gapCenterY: gapCenterY,
      passed: false
    });
  }, []);

  // Aktiver dash
  const activateDash = useCallback(() => {
    const now = Date.now();
    const dash = dashRef.current;

    if (dash.active) return false;
    if (now - dash.lastDashTime < DASH_COOLDOWN) return false;

    dash.active = true;
    dash.startTime = now;
    dash.lastDashTime = now;

    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    return true;
  }, []);

  // Tegn spillet
  const draw = useCallback((ctx) => {
    const currentScore = scoreRef.current;
    const currentHighScore = highScoreRef.current;
    const bird = birdRef.current;
    const dash = dashRef.current;

    // Clear canvas
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bakgrunnsstjerner (subtilt)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 137 + frameCountRef.current * 0.3) % (CANVAS_WIDTH + 10));
      const sy = (i * 89) % (CANVAS_HEIGHT - GROUND_HEIGHT - 20) + 10;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Tegn ghost (fra forrige kjøring)
    if (ghostReplayRef.current && gameStateRef.current === 'playing') {
      const gf = frameCountRef.current;
      if (gf < ghostReplayRef.current.length) {
        const ghostY = ghostReplayRef.current[gf];

        // Translucent ghost bird
        ctx.globalAlpha = 0.25;

        // Ghost kropp
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(BIRD_X, ghostY, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Ghost øye
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(BIRD_X + BIRD_SIZE * 0.22, ghostY - BIRD_SIZE * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
      }
    }

    // Tegn rør
    for (const pipe of pipesRef.current) {
      // Topp-rør
      const topPipeBottom = pipe.gapCenterY - PIPE_GAP / 2;
      // Bunn-rør
      const bottomPipeTop = pipe.gapCenterY + PIPE_GAP / 2;

      // Topp-rør kropp
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topPipeBottom);

      // Topp-rør kant (lip)
      ctx.fillStyle = PIPE_BORDER_COLOR;
      ctx.fillRect(pipe.x - 3, topPipeBottom - 20, PIPE_WIDTH + 6, 20);

      // Topp-rør highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(pipe.x + 4, 0, 8, topPipeBottom - 20);

      // Bunn-rør kropp
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, bottomPipeTop, PIPE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT - bottomPipeTop);

      // Bunn-rør kant (lip)
      ctx.fillStyle = PIPE_BORDER_COLOR;
      ctx.fillRect(pipe.x - 3, bottomPipeTop, PIPE_WIDTH + 6, 20);

      // Bunn-rør highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(pipe.x + 4, bottomPipeTop + 20, 8, CANVAS_HEIGHT - GROUND_HEIGHT - bottomPipeTop - 20);
    }

    // Tegn bakken
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Bakkemønster (scrolling)
    ctx.strokeStyle = GROUND_LINE_COLOR;
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH + 30; i += 30) {
      const offset = (frameCountRef.current * PIPE_SPEED) % 30;
      ctx.beginPath();
      ctx.moveTo(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(i - offset + 15, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }

    // Dash-effekt (speed lines) mens dash er aktiv
    if (dash.active) {
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ly = bird.y - 30 + i * 12;
        const lx = BIRD_X - 25 - Math.random() * 30;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 20 - Math.random() * 15, ly);
        ctx.stroke();
      }
    }

    // Tegn fuglen
    const birdCx = BIRD_X;
    const birdCy = bird.y;

    ctx.save();
    ctx.translate(birdCx, birdCy);
    ctx.rotate(bird.rotation);

    // Dash usynlighetseffekt (glow)
    if (dash.active) {
      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_SIZE / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Fuglekropp
    ctx.fillStyle = BIRD_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Vinge (liten bue som flapper)
    const wingAngle = Math.sin(frameCountRef.current * 0.3) * 0.4;
    ctx.fillStyle = '#3dbdb5';
    ctx.beginPath();
    ctx.ellipse(-3, 2, BIRD_SIZE * 0.3, BIRD_SIZE * 0.15, wingAngle, 0, Math.PI * 2);
    ctx.fill();

    // Øye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(BIRD_SIZE * 0.22, -BIRD_SIZE * 0.1, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupill
    ctx.fillStyle = '#0f0f23';
    ctx.beginPath();
    ctx.arc(BIRD_SIZE * 0.28, -BIRD_SIZE * 0.1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Nebb
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE * 0.4, -2);
    ctx.lineTo(BIRD_SIZE * 0.65, 1);
    ctx.lineTo(BIRD_SIZE * 0.4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // HUD - poengsum
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Skygge for lesbarhet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(`${currentScore}`, CANVAS_WIDTH / 2 + 1, 17);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${currentScore}`, CANVAS_WIDTH / 2, 16);

    // High score (oppe til høyre)
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 14, 16);

    // Dash cooldown indikator
    const now = Date.now();
    const timeSinceDash = now - dash.lastDashTime;
    const dashReady = timeSinceDash >= DASH_COOLDOWN;

    if (gameStateRef.current === 'playing') {
      ctx.textAlign = 'left';
      ctx.font = '12px monospace';

      if (dashReady) {
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('DASH klar', 14, 16);
      } else if (!dash.active) {
        const remaining = Math.ceil((DASH_COOLDOWN - timeSinceDash) / 1000);
        ctx.fillStyle = '#666';
        ctx.fillText(`DASH ${remaining}s`, 14, 16);

        // Cooldown bar
        const progress = timeSinceDash / DASH_COOLDOWN;
        ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';
        ctx.fillRect(14, 32, 60, 4);
        ctx.fillStyle = 'rgba(78, 205, 196, 0.6)';
        ctx.fillRect(14, 32, 60 * progress, 4);
      }
    }

    // Progressiv poeng-visning (neste rør sin verdi)
    if (gameStateRef.current === 'playing' && pipeCountRef.current > 0) {
      ctx.textAlign = 'center';
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`Neste: +${pipeCountRef.current + 1}`, CANVAS_WIDTH / 2, 44);
    }
  }, []);

  // Spilloppdatering
  const update = useCallback(() => {
    const bird = birdRef.current;
    const dash = dashRef.current;
    const now = Date.now();

    frameCountRef.current++;

    // Sjekk om dash er over
    if (dash.active && now - dash.startTime >= DASH_DURATION) {
      dash.active = false;
    }

    // Gravitasjon
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    // Rotasjon basert på hastighet
    const targetRotation = Math.min(Math.max(bird.vy * 0.06, -0.5), Math.PI / 2.5);
    bird.rotation += (targetRotation - bird.rotation) * 0.15;

    // Tak-kollisjon
    if (bird.y - BIRD_SIZE / 2 < 0) {
      bird.y = BIRD_SIZE / 2;
      bird.vy = 0;
    }

    // Bakke-kollisjon = død
    if (bird.y + BIRD_SIZE / 2 >= CANVAS_HEIGHT - GROUND_HEIGHT) {
      bird.y = CANVAS_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2;
      return true; // døde
    }

    // Beregn effektiv rørhastighet (dash gir boost)
    const currentPipeSpeed = dash.active ? PIPE_SPEED + DASH_SPEED_BOOST : PIPE_SPEED;

    // Flytt rør (in-place for ytelse)
    const pipes = pipesRef.current;
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= currentPipeSpeed;
      if (pipes[i].x <= -PIPE_WIDTH) pipes.splice(i, 1);
    }

    // Spawn nye rør
    if (frameCountRef.current % PIPE_SPAWN_INTERVAL === 0) {
      spawnPipe();
    }

    // Poengberegning og kollisjon
    for (const pipe of pipesRef.current) {
      // Sjekk om fuglen har passert røret
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_SIZE / 2) {
        pipe.passed = true;
        pipeCountRef.current++;
        // Progressiv poeng: rør n gir n poeng
        scoreRef.current += pipeCountRef.current;
        setScore(scoreRef.current);

        if (navigator.vibrate) navigator.vibrate(10);
      }

      // Kollisjon (skip hvis dash er aktiv - invincibility)
      if (dash.active) continue;

      const birdLeft = BIRD_X - BIRD_SIZE / 2 + 3;   // litt innover for fair hitbox
      const birdRight = BIRD_X + BIRD_SIZE / 2 - 3;
      const birdTop = bird.y - BIRD_SIZE / 2 + 3;
      const birdBottom = bird.y + BIRD_SIZE / 2 - 3;

      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      const gapTop = pipe.gapCenterY - PIPE_GAP / 2;
      const gapBottom = pipe.gapCenterY + PIPE_GAP / 2;

      // Er fuglen innenfor rør-bredden?
      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Treffer topp-røret?
        if (birdTop < gapTop) {
          return true; // døde
        }
        // Treffer bunn-røret?
        if (birdBottom > gapBottom) {
          return true; // døde
        }
      }
    }

    // Ta opp ghost-data (fuglen sin Y-posisjon per frame, maks 10 min)
    if (ghostRecordingRef.current.length < 36000) {
      ghostRecordingRef.current.push(bird.y);
    }

    return false;
  }, [spawnPipe]);

  // Flap (hopp)
  const flap = useCallback(() => {
    const bird = birdRef.current;
    bird.vy = FLAP_FORCE;
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  // Start spill
  const startGame = useCallback(() => {
    // Lagre forrige kjøring som ghost
    if (ghostRecordingRef.current.length > 0) {
      ghostReplayRef.current = [...ghostRecordingRef.current];
    }

    // Reset alt - gi fuglen en liten oppadgående fart så den ikke faller rett ned
    birdRef.current = {
      y: CANVAS_HEIGHT / 2,
      vy: FLAP_FORCE * 0.5,
      rotation: 0
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    pipeCountRef.current = 0;
    frameCountRef.current = 0;
    ghostRecordingRef.current = [];
    dashRef.current = {
      active: false,
      startTime: 0,
      lastDashTime: 0
    };
    lastTapTimeRef.current = 0;

    setScore(0);
    setGameState('playing');
  }, []);

  // Håndter død
  const handleDeath = useCallback(() => {
    if (!isMountedRef.current) return;

    const finalScore = scoreRef.current;

    setGameState('dead');
    setScore(finalScore);

    // Oppdater high score
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyFlappyHighScore', finalScore.toString());
    }

    // Send poeng til server
    if (finalScore > 0 && submitLobbyScoreRef.current) {
      submitLobbyScoreRef.current(finalScore, 'flappy');
    }
  }, []);

  // Spilløkke
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = null;

    const gameLoop = () => {
      if (!isMountedRef.current) return;

      if (gameStateRef.current === 'playing') {
        const died = update();
        if (died) {
          handleDeath();
        }
      }

      draw(ctx);
      animationId = requestAnimationFrame(gameLoop);
      gameLoopRef.current = animationId;
    };

    animationId = requestAnimationFrame(gameLoop);
    gameLoopRef.current = animationId;

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      gameLoopRef.current = null;
    };
  }, [update, draw, handleDeath]);

  // Håndter interaksjon (flap + dobbelttrykk for dash)
  const handleAction = useCallback(() => {
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
      startGame();
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && timeSinceLastTap > 30) {
      // Dobbelttrykk - prøv dash
      const dashActivated = activateDash();
      if (dashActivated) {
        lastTapTimeRef.current = 0; // reset slik at neste tap er en vanlig flap
        return;
      }
    }

    // Vanlig flap
    flap();
    lastTapTimeRef.current = now;
  }, [startGame, flap, activateDash]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  return (
    <div className="lobby-minigame">
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleAction}
          onTouchStart={(e) => {
            e.preventDefault();
            handleAction();
          }}
        />

        {gameState === 'idle' && (
          <div className="overlay start-overlay">
            <p className="game-title">Flappy</p>
            <p>Trykk for å starte!</p>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="overlay death-overlay">
            <p className="final-score">{score}</p>
            <p className="retry-text">Trykk for å prøve igjen</p>
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

export default LobbyFlappy;
