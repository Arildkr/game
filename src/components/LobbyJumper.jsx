// game/src/components/LobbyJumper.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyJumper.css';

// Spillkonstanter
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 200;
const GROUND_HEIGHT = 30;
const PLAYER_SIZE = 30;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_MIN_HEIGHT = 30;
const OBSTACLE_MAX_HEIGHT = 60;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const INITIAL_SPEED = 4;
const MAX_SPEED = 14;
const SPEED_INCREMENT = 0.0015;

// Nye konstanter for takhindre
const CEILING_OBSTACLE_START_SCORE = 500; // Score før takhindre starter
const CEILING_GAP_MIN = 80; // Minimum gap mellom gulv og tak-hinder
const CEILING_GAP_MAX = 120;

function LobbyJumper() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle'); // idle, playing, dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyJumperHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hold submitLobbyScore ref oppdatert
  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand - alt i refs for å unngå re-renders under spilling
  const playerRef = useRef({
    x: 50,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    isJumping: false
  });
  const obstaclesRef = useRef([]); // Gulvhindre
  const ceilingObstaclesRef = useRef([]); // Takhindre
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const highScoreRef = useRef(highScore);
  const gameStateRef = useRef(gameState);

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

  // Tegn spillet - bruker refs direkte for å unngå callback-avhengigheter
  const draw = useCallback((ctx) => {
    const currentScore = scoreRef.current;
    const currentHighScore = highScoreRef.current;

    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Tegn bakken
    ctx.fillStyle = '#2d4059';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Tegn streker på bakken (scrolling effekt)
    ctx.strokeStyle = '#3d5a80';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      const offset = (frameCountRef.current * speedRef.current) % 30;
      ctx.beginPath();
      ctx.moveTo(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(i - offset + 15, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }

    // Tegn taket hvis takhindre er aktive
    if (currentScore >= CEILING_OBSTACLE_START_SCORE) {
      ctx.fillStyle = '#2d4059';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 15);
      ctx.strokeStyle = '#3d5a80';
      for (let i = 0; i < CANVAS_WIDTH; i += 30) {
        const offset = (frameCountRef.current * speedRef.current) % 30;
        ctx.beginPath();
        ctx.moveTo(i - offset, 15);
        ctx.lineTo(i - offset + 15, 15);
        ctx.stroke();
      }
    }

    // Tegn spilleren
    const player = playerRef.current;
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(
      player.x + PLAYER_SIZE / 2,
      player.y + PLAYER_SIZE / 2,
      PLAYER_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Øyne
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE * 0.6, player.y + PLAYER_SIZE * 0.35, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE * 0.65, player.y + PLAYER_SIZE * 0.35, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tegn gulvhindringer (trekanter)
    ctx.fillStyle = '#e74c3c';
    for (const obstacle of obstaclesRef.current) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + OBSTACLE_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height);
      ctx.lineTo(obstacle.x + OBSTACLE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(obstacle.x, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Tegn takhindringer (inverterte trekanter)
    ctx.fillStyle = '#9b59b6';
    for (const obstacle of ceilingObstaclesRef.current) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + OBSTACLE_WIDTH / 2, obstacle.height);
      ctx.lineTo(obstacle.x + OBSTACLE_WIDTH, 15);
      ctx.lineTo(obstacle.x, 15);
      ctx.closePath();
      ctx.fill();
    }

    // Tegn poengsum
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(currentScore)}`, CANVAS_WIDTH - 10, 25);

    // High score
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 10, 42);

    // Vis vanskelighetsindikator
    const difficulty = Math.min(10, Math.floor(speedRef.current - INITIAL_SPEED));
    if (difficulty > 0) {
      ctx.fillStyle = `hsl(${120 - difficulty * 12}, 70%, 50%)`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`LVL ${difficulty}`, 10, 15);
    }
  }, []);

  // Spilloppdatering
  const update = useCallback(() => {
    const player = playerRef.current;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
    const currentScore = scoreRef.current;

    // Oppdater hastighet (gradvis vanskeligere)
    speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT);

    // Gravitasjon
    player.vy += GRAVITY;
    player.y += player.vy;

    // Kollisjon med bakken
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isJumping = false;
    }

    // Kollisjon med taket (når takhindre er aktive)
    if (currentScore >= CEILING_OBSTACLE_START_SCORE && player.y < 15) {
      player.y = 15;
      player.vy = Math.abs(player.vy) * 0.5; // Sprett ned
    }

    // Oppdater gulvhindringer
    obstaclesRef.current = obstaclesRef.current
      .map(o => ({ ...o, x: o.x - speedRef.current }))
      .filter(o => o.x > -OBSTACLE_WIDTH);

    // Oppdater takhindringer
    ceilingObstaclesRef.current = ceilingObstaclesRef.current
      .map(o => ({ ...o, x: o.x - speedRef.current }))
      .filter(o => o.x > -OBSTACLE_WIDTH);

    // Spawn gulvhindringer
    frameCountRef.current++;
    const spawnRate = Math.max(60, 100 - (speedRef.current - INITIAL_SPEED) * 5);

    if (frameCountRef.current % Math.floor(spawnRate) === 0) {
      if (Math.random() < 0.7) {
        // Varier høyde basert på vanskelighet
        const difficultyFactor = (speedRef.current - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
        const maxHeight = OBSTACLE_MIN_HEIGHT + difficultyFactor * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
        const height = OBSTACLE_MIN_HEIGHT + Math.random() * (maxHeight - OBSTACLE_MIN_HEIGHT);

        obstaclesRef.current.push({
          x: CANVAS_WIDTH,
          height: height
        });
      }
    }

    // Spawn takhindringer etter viss score
    if (currentScore >= CEILING_OBSTACLE_START_SCORE) {
      if (frameCountRef.current % Math.floor(spawnRate * 1.5) === 0) {
        if (Math.random() < 0.5) {
          const height = 15 + 20 + Math.random() * 30; // Fra taket ned
          ceilingObstaclesRef.current.push({
            x: CANVAS_WIDTH,
            height: height
          });
        }
      }
    }

    // Kollisjondeteksjon - gulvhindre
    for (const obstacle of obstaclesRef.current) {
      const playerRight = player.x + PLAYER_SIZE - 8;
      const playerBottom = player.y + PLAYER_SIZE;
      const obstacleTop = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;

      if (
        playerRight > obstacle.x + 5 &&
        player.x + 8 < obstacle.x + OBSTACLE_WIDTH - 5 &&
        playerBottom > obstacleTop + 5
      ) {
        return true; // Kollisjon!
      }
    }

    // Kollisjondeteksjon - takhindre
    for (const obstacle of ceilingObstaclesRef.current) {
      const playerRight = player.x + PLAYER_SIZE - 8;
      const playerTop = player.y;

      if (
        playerRight > obstacle.x + 5 &&
        player.x + 8 < obstacle.x + OBSTACLE_WIDTH - 5 &&
        playerTop < obstacle.height - 5
      ) {
        return true; // Kollisjon!
      }
    }

    // Oppdater poengsum
    scoreRef.current += speedRef.current * 0.15;

    return false;
  }, []);

  // Hopp
  const jump = useCallback(() => {
    const player = playerRef.current;
    if (!player.isJumping) {
      player.vy = JUMP_FORCE;
      player.isJumping = true;
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, []);

  // Start spillet
  const startGame = useCallback(() => {
    playerRef.current = {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      vy: 0,
      isJumping: false
    };
    obstaclesRef.current = [];
    ceilingObstaclesRef.current = [];
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
    setGameState('playing');
  }, []);

  // Håndter død
  const handleDeath = useCallback(() => {
    if (!isMountedRef.current) return;

    const finalScore = Math.floor(scoreRef.current);

    setGameState('dead');
    setScore(finalScore);

    // Oppdater high score
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyJumperHighScore', finalScore.toString());
    }

    // Send poeng til server
    if (finalScore > 0 && submitLobbyScoreRef.current) {
      submitLobbyScoreRef.current(finalScore);
    }
  }, []);

  // Spilløkke - kjører kontinuerlig
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
        } else {
          // Oppdater score state periodisk (ikke hver frame)
          if (frameCountRef.current % 10 === 0) {
            setScore(Math.floor(scoreRef.current));
          }
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

  // Inputhåndtering - keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
          startGame();
        } else if (gameStateRef.current === 'playing') {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, jump]);

  // Touch/klikk-håndtering
  const handleInteraction = useCallback(() => {
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
      startGame();
    } else if (gameStateRef.current === 'playing') {
      jump();
    }
  }, [startGame, jump]);

  return (
    <div className="lobby-jumper">
      <div className="jumper-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleInteraction}
          onTouchStart={(e) => {
            e.preventDefault();
            handleInteraction();
          }}
        />

        {gameState === 'idle' && (
          <div className="overlay start-overlay">
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

      <div className="jumper-stats">
        <span className="current-score">Poeng: {score}</span>
        <span className="best-score">Best: {highScore}</span>
      </div>
    </div>
  );
}

export default LobbyJumper;
