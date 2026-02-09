// game/src/components/LobbyJumper.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyJumper.css';

// Canvas
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 30;
const PLAYER_SIZE = 30;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_MIN_HEIGHT = 20;
const OBSTACLE_MAX_HEIGHT = 200;
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const DOUBLE_JUMP_FORCE = -13;
const INITIAL_SPEED = 5;
const MAX_SPEED = 16;
const SPEED_INCREMENT = 0.002;

// Ceiling obstacles start after this many obstacles dodged
const CEILING_START_OBSTACLES = 15;

// Star powerup
const STAR_SIZE = 18;
const STAR_SPAWN_CHANCE = 0.06;

// Dynamic ceiling Y based on obstacles dodged
function getCeilingY(score) {
  if (score < CEILING_START_OBSTACLES) return 0;
  const progress = Math.min(1, (score - CEILING_START_OBSTACLES) / 35);
  return 15 + progress * 30; // 15 → 45
}

function LobbyJumper() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyJumperHiV2');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand i refs
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

  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

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
    const ceilingY = getCeilingY(currentScore);

    // Bakgrunn
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bakken
    ctx.fillStyle = '#2d4059';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Bakkestreker
    ctx.strokeStyle = '#3d5a80';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH + 30; i += 30) {
      const offset = (frameCountRef.current * speedRef.current) % 30;
      ctx.beginPath();
      ctx.moveTo(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(i - offset + 15, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }

    // Dynamisk tak
    if (ceilingY > 0) {
      ctx.fillStyle = '#2d4059';
      ctx.fillRect(0, 0, CANVAS_WIDTH, ceilingY);
      ctx.strokeStyle = '#3d5a80';
      for (let i = 0; i < CANVAS_WIDTH + 30; i += 30) {
        const offset = (frameCountRef.current * speedRef.current) % 30;
        ctx.beginPath();
        ctx.moveTo(i - offset, ceilingY);
        ctx.lineTo(i - offset + 15, ceilingY);
        ctx.stroke();
      }
    }

    // Stjerner
    for (const star of starsRef.current) {
      const cx = star.x + STAR_SIZE / 2;
      const cy = star.y + STAR_SIZE / 2;
      const pulse = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1;

      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, STAR_SIZE * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.round(STAR_SIZE * pulse)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', cx, cy);
    }

    // Spilleren
    const player = playerRef.current;
    const pcx = player.x + PLAYER_SIZE / 2;
    const pcy = player.y + PLAYER_SIZE / 2;

    // Skjold
    if (player.hasShield) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pcx, pcy, PLAYER_SIZE / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pcx, pcy, PLAYER_SIZE / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

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

    // Dobbelthopp-indikator
    if (player.isJumping && player.jumpsRemaining > 0) {
      ctx.fillStyle = 'rgba(78, 205, 196, 0.6)';
      ctx.beginPath();
      ctx.arc(pcx, pcy + PLAYER_SIZE / 2 + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gulvhindringer (trekanter)
    ctx.fillStyle = '#e74c3c';
    for (const obstacle of obstaclesRef.current) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + OBSTACLE_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height);
      ctx.lineTo(obstacle.x + OBSTACLE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(obstacle.x, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Takhindringer (inverterte trekanter fra dynamisk tak)
    ctx.fillStyle = '#9b59b6';
    for (const obstacle of ceilingObstaclesRef.current) {
      const drawCeiling = ceilingY || 15;
      ctx.beginPath();
      ctx.moveTo(obstacle.x + OBSTACLE_WIDTH / 2, obstacle.height);
      ctx.lineTo(obstacle.x + OBSTACLE_WIDTH, drawCeiling);
      ctx.lineTo(obstacle.x, drawCeiling);
      ctx.closePath();
      ctx.fill();
    }

    // Poengsum
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${currentScore}`, CANVAS_WIDTH - 10, 20);

    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 10, 38);

    // Vanskelighetsindikator
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

    // Hastighet
    speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT);

    // Gravitasjon
    player.vy += GRAVITY;
    player.y += player.vy;

    // Shield flash
    if (player.shieldFlash > 0) {
      player.shieldFlash -= 0.05;
    }

    // Bakkekollisjon
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isJumping = false;
      player.jumpsRemaining = 2;
    }

    // Toppgrense
    if (player.y < 0) {
      player.y = 0;
      player.vy = Math.abs(player.vy) * 0.3;
    }

    // Dynamisk tak-grense
    const currentCeilingY = getCeilingY(scoreRef.current);
    if (currentCeilingY > 0 && player.y < currentCeilingY) {
      player.y = currentCeilingY;
      player.vy = Math.abs(player.vy) * 0.5;
    }

    // Flytt gulvhindringer + poengberegning
    const obstacles = obstaclesRef.current;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speedRef.current;
      if (!obstacles[i].passed && obstacles[i].x + OBSTACLE_WIDTH < player.x) {
        obstacles[i].passed = true;
        scoreRef.current++;
      }
      if (obstacles[i].x <= -OBSTACLE_WIDTH) obstacles.splice(i, 1);
    }

    // Flytt takhindringer + poengberegning
    const ceilingObs = ceilingObstaclesRef.current;
    for (let i = ceilingObs.length - 1; i >= 0; i--) {
      ceilingObs[i].x -= speedRef.current;
      if (!ceilingObs[i].passed && ceilingObs[i].x + OBSTACLE_WIDTH < player.x) {
        ceilingObs[i].passed = true;
        scoreRef.current++;
      }
      if (ceilingObs[i].x <= -OBSTACLE_WIDTH) ceilingObs.splice(i, 1);
    }

    // Flytt stjerner
    const stars = starsRef.current;
    for (let i = stars.length - 1; i >= 0; i--) {
      stars[i].x -= speedRef.current;
      if (stars[i].x <= -STAR_SIZE) stars.splice(i, 1);
    }

    // Spawn hindringer
    frameCountRef.current++;
    const spawnRate = Math.max(50, 90 - (speedRef.current - INITIAL_SPEED) * 3);

    if (frameCountRef.current % Math.floor(spawnRate) === 0) {
      if (Math.random() < 0.7) {
        // Progressiv høydevariasjon basert på antall hindringer dodget
        const difficultyFactor = Math.min(1, scoreRef.current / 50);
        const minH = OBSTACLE_MIN_HEIGHT + difficultyFactor * 40;  // 20 → 60
        const maxH = 50 + difficultyFactor * (OBSTACLE_MAX_HEIGHT - 50); // 50 → 200
        // 25% sjanse for en kort hindring for variasjon
        const useShort = Math.random() < 0.25;
        const height = useShort
          ? OBSTACLE_MIN_HEIGHT + Math.random() * 30
          : minH + Math.random() * (maxH - minH);

        obstacles.push({
          x: CANVAS_WIDTH,
          height: height,
          passed: false
        });
      }

      // Spawn stjerner
      if (Math.random() < STAR_SPAWN_CHANCE && !player.hasShield) {
        const starY = 50 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 100);
        starsRef.current.push({ x: CANVAS_WIDTH, y: starY });
      }
    }

    // Spawn takhindringer
    const ceilingY = getCeilingY(scoreRef.current);
    if (ceilingY > 0) {
      if (frameCountRef.current % Math.floor(spawnRate * 1.5) === 0) {
        if (Math.random() < 0.5) {
          const ceilingProgress = Math.min(1, (scoreRef.current - CEILING_START_OBSTACLES) / 35);
          const height = ceilingY + 20 + Math.random() * (40 + ceilingProgress * 40);
          ceilingObstaclesRef.current.push({
            x: CANVAS_WIDTH,
            height: height,
            passed: false
          });
        }
      }
    }

    // Stjerne-kollisjon
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

    // Kollisjon - gulvhindringer
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
        return true;
      }
    }

    // Kollisjon - takhindringer
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
        return true;
      }
    }

    // Poeng oppdateres via obstacle passing (over), ikke per frame
    return false;
  }, []);

  // Hopp
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

  // Død
  const handleDeath = useCallback(() => {
    if (!isMountedRef.current) return;

    const finalScore = scoreRef.current;

    setGameState('dead');
    setScore(finalScore);

    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyJumperHiV2', finalScore.toString());
    }

    if (finalScore > 0 && submitLobbyScoreRef.current) {
      submitLobbyScoreRef.current(finalScore, 'jumper');
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
          if (frameCountRef.current % 30 === 0) {
            setScore(scoreRef.current);
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

  // Keyboard
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

  // Touch/klikk
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
