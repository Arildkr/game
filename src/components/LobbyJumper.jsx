// game/src/components/LobbyJumper.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyJumper.css';

// Spillkonstanter - originale størrelser, CSS håndterer visningsstørrelse
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 200;
const GROUND_HEIGHT = 30;
const PLAYER_SIZE = 30;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_MIN_HEIGHT = 30;
const OBSTACLE_MAX_HEIGHT = 60;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const DOUBLE_JUMP_FORCE = -11;
const INITIAL_SPEED = 4;
const MAX_SPEED = 14;
const SPEED_INCREMENT = 0.0015;

// Takhindre
const CEILING_OBSTACLE_START_SCORE = 500;
const CEILING_GAP_MIN = 80;
const CEILING_GAP_MAX = 120;

// Star powerup
const STAR_SIZE = 18;
const STAR_SPAWN_CHANCE = 0.08;

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
    isJumping: false,
    jumpsRemaining: 2,
    hasShield: false,
    shieldFlash: 0
  });
  const obstaclesRef = useRef([]);
  const ceilingObstaclesRef = useRef([]);
  const starsRef = useRef([]);
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

  // Tegn spillet
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
    for (let i = 0; i < CANVAS_WIDTH + 30; i += 30) {
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
      for (let i = 0; i < CANVAS_WIDTH + 30; i += 30) {
        const offset = (frameCountRef.current * speedRef.current) % 30;
        ctx.beginPath();
        ctx.moveTo(i - offset, 15);
        ctx.lineTo(i - offset + 15, 15);
        ctx.stroke();
      }
    }

    // Tegn stjerner (powerups)
    for (const star of starsRef.current) {
      const cx = star.x + STAR_SIZE / 2;
      const cy = star.y + STAR_SIZE / 2;
      const pulse = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1;

      // Glow
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, STAR_SIZE * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Stjerne
      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.round(STAR_SIZE * pulse)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', cx, cy);
    }

    // Tegn spilleren
    const player = playerRef.current;
    const pcx = player.x + PLAYER_SIZE / 2;
    const pcy = player.y + PLAYER_SIZE / 2;

    // Skjold-effekt
    if (player.hasShield) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pcx, pcy, PLAYER_SIZE / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Glow
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pcx, pcy, PLAYER_SIZE / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shield break flash
    if (player.shieldFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${player.shieldFlash * 0.3})`;
      ctx.beginPath();
      ctx.arc(pcx, pcy, PLAYER_SIZE + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spillerens kropp
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(pcx, pcy, PLAYER_SIZE / 2, 0, Math.PI * 2);
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

    // Dobbelthopp-indikator (liten prikk under spilleren)
    if (player.isJumping && player.jumpsRemaining > 0) {
      ctx.fillStyle = 'rgba(78, 205, 196, 0.6)';
      ctx.beginPath();
      ctx.arc(pcx, pcy + PLAYER_SIZE / 2 + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

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
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.floor(currentScore)}`, CANVAS_WIDTH - 10, 20);

    // High score
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 10, 38);

    // Vis vanskelighetsindikator
    const difficulty = Math.min(10, Math.floor(speedRef.current - INITIAL_SPEED));
    if (difficulty > 0) {
      ctx.fillStyle = `hsl(${120 - difficulty * 12}, 70%, 50%)`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`LVL ${difficulty}`, 10, 14);
    }

    // Skjold-indikator
    if (player.hasShield) {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⭐', 10, 28);
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

    // Shield flash nedtelling
    if (player.shieldFlash > 0) {
      player.shieldFlash -= 0.05;
    }

    // Kollisjon med bakken
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isJumping = false;
      player.jumpsRemaining = 2;
    }

    // Kollisjon med taket (når takhindre er aktive)
    if (currentScore >= CEILING_OBSTACLE_START_SCORE && player.y < 15) {
      player.y = 15;
      player.vy = Math.abs(player.vy) * 0.5;
    }

    // Oppdater gulvhindringer
    obstaclesRef.current = obstaclesRef.current
      .map(o => ({ ...o, x: o.x - speedRef.current }))
      .filter(o => o.x > -OBSTACLE_WIDTH);

    // Oppdater takhindringer
    ceilingObstaclesRef.current = ceilingObstaclesRef.current
      .map(o => ({ ...o, x: o.x - speedRef.current }))
      .filter(o => o.x > -OBSTACLE_WIDTH);

    // Oppdater stjerner
    starsRef.current = starsRef.current
      .map(s => ({ ...s, x: s.x - speedRef.current }))
      .filter(s => s.x > -STAR_SIZE);

    // Spawn gulvhindringer
    frameCountRef.current++;
    const spawnRate = Math.max(60, 100 - (speedRef.current - INITIAL_SPEED) * 4);

    if (frameCountRef.current % Math.floor(spawnRate) === 0) {
      if (Math.random() < 0.7) {
        const difficultyFactor = (speedRef.current - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
        const maxHeight = OBSTACLE_MIN_HEIGHT + difficultyFactor * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
        const height = OBSTACLE_MIN_HEIGHT + Math.random() * (maxHeight - OBSTACLE_MIN_HEIGHT);

        obstaclesRef.current.push({
          x: CANVAS_WIDTH,
          height: height
        });
      }

      // Spawn stjerner (sjelden)
      if (Math.random() < STAR_SPAWN_CHANCE && !player.hasShield) {
        const starY = 50 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 100);
        starsRef.current.push({
          x: CANVAS_WIDTH,
          y: starY
        });
      }
    }

    // Spawn takhindringer etter viss score
    if (currentScore >= CEILING_OBSTACLE_START_SCORE) {
      if (frameCountRef.current % Math.floor(spawnRate * 1.5) === 0) {
        if (Math.random() < 0.5) {
          const height = 15 + 20 + Math.random() * 30;
          ceilingObstaclesRef.current.push({
            x: CANVAS_WIDTH,
            height: height
          });
        }
      }
    }

    // Stjerne-kollisjon (pickup)
    for (let i = starsRef.current.length - 1; i >= 0; i--) {
      const star = starsRef.current[i];
      const dx = (player.x + PLAYER_SIZE / 2) - (star.x + STAR_SIZE / 2);
      const dy = (player.y + PLAYER_SIZE / 2) - (star.y + STAR_SIZE / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (PLAYER_SIZE + STAR_SIZE) / 2) {
        player.hasShield = true;
        starsRef.current.splice(i, 1);
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      }
    }

    // Kollisjondeteksjon - gulvhindre
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obstacle = obstaclesRef.current[i];
      const playerRight = player.x + PLAYER_SIZE - 8;
      const playerBottom = player.y + PLAYER_SIZE;
      const obstacleTop = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;

      if (
        playerRight > obstacle.x + 5 &&
        player.x + 8 < obstacle.x + OBSTACLE_WIDTH - 5 &&
        playerBottom > obstacleTop + 5
      ) {
        if (player.hasShield) {
          player.hasShield = false;
          player.shieldFlash = 1;
          obstaclesRef.current.splice(i, 1);
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          continue;
        }
        return true; // Kollisjon!
      }
    }

    // Kollisjondeteksjon - takhindre
    for (let i = ceilingObstaclesRef.current.length - 1; i >= 0; i--) {
      const obstacle = ceilingObstaclesRef.current[i];
      const playerRight = player.x + PLAYER_SIZE - 8;
      const playerTop = player.y;

      if (
        playerRight > obstacle.x + 5 &&
        player.x + 8 < obstacle.x + OBSTACLE_WIDTH - 5 &&
        playerTop < obstacle.height - 5
      ) {
        if (player.hasShield) {
          player.hasShield = false;
          player.shieldFlash = 1;
          ceilingObstaclesRef.current.splice(i, 1);
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          continue;
        }
        return true; // Kollisjon!
      }
    }

    // Oppdater poengsum
    scoreRef.current += speedRef.current * 0.15;

    return false;
  }, []);

  // Hopp (med dobbelthopp)
  const jump = useCallback(() => {
    const player = playerRef.current;
    if (player.jumpsRemaining > 0) {
      const isDoubleJump = player.isJumping;
      player.vy = isDoubleJump ? DOUBLE_JUMP_FORCE : JUMP_FORCE;
      player.isJumping = true;
      player.jumpsRemaining--;
      if (navigator.vibrate) navigator.vibrate(isDoubleJump ? 10 : 20);
    }
  }, []);

  // Start spillet
  const startGame = useCallback(() => {
    playerRef.current = {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      vy: 0,
      isJumping: false,
      jumpsRemaining: 2,
      hasShield: false,
      shieldFlash: 0
    };
    obstaclesRef.current = [];
    ceilingObstaclesRef.current = [];
    starsRef.current = [];
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
        } else {
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
