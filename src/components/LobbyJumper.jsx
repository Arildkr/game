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
const OBSTACLE_MAX_HEIGHT = 50;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.001;

function LobbyJumper() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  const [gameState, setGameState] = useState('idle'); // idle, playing, dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyJumperHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Spilltilstand
  const playerRef = useRef({
    x: 50,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    isJumping: false
  });
  const obstaclesRef = useRef([]);
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);

  // Tegn spillet
  const draw = useCallback((ctx) => {
    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Tegn bakken
    ctx.fillStyle = '#2d4059';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Tegn streker på bakken
    ctx.strokeStyle = '#3d5a80';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      const offset = (frameCountRef.current * speedRef.current) % 30;
      ctx.beginPath();
      ctx.moveTo(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(i - offset + 15, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }

    // Tegn spilleren (enkel figur)
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

    // Tegn hindringer
    ctx.fillStyle = '#e74c3c';
    for (const obstacle of obstaclesRef.current) {
      // Trekant-hindring
      ctx.beginPath();
      ctx.moveTo(obstacle.x + OBSTACLE_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height);
      ctx.lineTo(obstacle.x + OBSTACLE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(obstacle.x, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Tegn poengsum
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(scoreRef.current)}`, CANVAS_WIDTH - 10, 25);

    // High score
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`HI: ${highScore}`, CANVAS_WIDTH - 10, 42);
  }, [highScore]);

  // Spilloppdatering
  const update = useCallback(() => {
    const player = playerRef.current;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;

    // Oppdater hastighet
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

    // Oppdater hindringer
    obstaclesRef.current = obstaclesRef.current
      .map(o => ({ ...o, x: o.x - speedRef.current }))
      .filter(o => o.x > -OBSTACLE_WIDTH);

    // Spawn nye hindringer
    frameCountRef.current++;
    if (frameCountRef.current % Math.floor(100 / (speedRef.current / INITIAL_SPEED)) === 0) {
      if (Math.random() < 0.7) {
        const height = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
        obstaclesRef.current.push({
          x: CANVAS_WIDTH,
          height: height
        });
      }
    }

    // Kollisjondeteksjon
    for (const obstacle of obstaclesRef.current) {
      // Enkel bounding box
      const playerRight = player.x + PLAYER_SIZE - 5;
      const playerBottom = player.y + PLAYER_SIZE;
      const obstacleTop = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;

      if (
        playerRight > obstacle.x + 5 &&
        player.x + 5 < obstacle.x + OBSTACLE_WIDTH - 5 &&
        playerBottom > obstacleTop + 5
      ) {
        // Kollisjon!
        return true;
      }
    }

    // Oppdater poengsum
    scoreRef.current += speedRef.current * 0.1;
    setScore(Math.floor(scoreRef.current));

    return false;
  }, []);

  // Hopp
  const jump = useCallback(() => {
    const player = playerRef.current;
    if (!player.isJumping) {
      player.vy = JUMP_FORCE;
      player.isJumping = true;
      // Vibrering på mobil
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
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
    setGameState('playing');
  }, []);

  // Håndter død
  const handleDeath = useCallback(() => {
    setGameState('dead');

    const finalScore = Math.floor(scoreRef.current);

    // Oppdater high score
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyJumperHighScore', finalScore.toString());
    }

    // Send poeng til server
    if (finalScore > 0) {
      submitLobbyScore(finalScore);
    }
  }, [highScore, submitLobbyScore]);

  // Spilløkke
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gameLoop = () => {
      if (gameState === 'playing') {
        const died = update();
        if (died) {
          handleDeath();
        }
      }
      draw(ctx);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, update, draw, handleDeath]);

  // Inputhåndtering
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'dead') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, jump]);

  // Touch/klikk-håndtering
  const handleInteraction = useCallback(() => {
    if (gameState === 'idle' || gameState === 'dead') {
      startGame();
    } else if (gameState === 'playing') {
      jump();
    }
  }, [gameState, startGame, jump]);

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
