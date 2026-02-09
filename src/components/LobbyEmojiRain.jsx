// game/src/components/LobbyEmojiRain.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import './LobbyMinigames.css';

// Polyfill for roundRect (missing in older Safari/iOS)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = typeof r === 'number' ? r : (Array.isArray(r) ? r[0] : 0);
    this.moveTo(x + radius, y);
    this.arcTo(x + w, y, x + w, y + h, radius);
    this.arcTo(x + w, y + h, x, y + h, radius);
    this.arcTo(x, y + h, x, y, radius);
    this.arcTo(x, y, x + w, y, radius);
    this.closePath();
  };
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 400;

// Spill-innstillinger
const GAME_DURATION = 15000; // 15 sekunder
const TARGET_CHANGE_INTERVAL = 8000; // Bytt mål-emoji hvert 8. sekund
const CORRECT_POINTS = 10;
const WRONG_POINTS = -5;

// Emoji-konfigurasjon
const ALL_EMOJIS = ['🍎', '🍌', '🍊', '🍇', '🍓', '🌟', '⭐', '💎', '🎯', '🏆'];
const EMOJI_SIZE = 32;
const EMOJI_HIT_RADIUS = 28; // Treffområde for touch/klikk

// Fallende emojis: hastighet og spawn-rate
const INITIAL_FALL_SPEED_MIN = 1.5;
const INITIAL_FALL_SPEED_MAX = 3.0;
const MAX_FALL_SPEED_MIN = 4.0;
const MAX_FALL_SPEED_MAX = 7.0;
const INITIAL_SPAWN_INTERVAL = 30; // Frames mellom hver spawn
const MIN_SPAWN_INTERVAL = 8;      // Raskeste spawn-rate

// Feedback-animasjoner
const FLASH_DURATION = 15;  // Frames for korrekt-flash
const SHAKE_DURATION = 12;  // Frames for feil-risting

function LobbyEmojiRain() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle'); // idle, playing, dead
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyEmojiRainHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hold submitLobbyScore ref oppdatert
  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand i refs for ytelse (unngå re-renders under spilling)
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const timeLeftRef = useRef(GAME_DURATION);
  const highScoreRef = useRef(highScore);
  const gameStateRef = useRef(gameState);

  // Fallende emojis: { x, y, vy, emoji, id }
  const fallingEmojisRef = useRef([]);
  const nextEmojiIdRef = useRef(0);

  // Mål-emoji
  const targetEmojiRef = useRef(ALL_EMOJIS[0]);
  const lastTargetChangeRef = useRef(0);

  // Feedback-effekter
  const flashRef = useRef(0);          // > 0 = vis grønt flash (korrekt)
  const shakeRef = useRef(0);          // > 0 = risting (feil)
  const shakeOffsetRef = useRef({ x: 0, y: 0 });

  // Partikler ved korrekt treff
  const particlesRef = useRef([]);

  // Flytende score-tekst (+10 / -5)
  const floatingTextsRef = useRef([]);

  // Streak-kombo
  const streakRef = useRef(0);

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

  // Velg ny tilfeldig mål-emoji (unngå samme som forrige)
  const pickNewTarget = useCallback(() => {
    const current = targetEmojiRef.current;
    let next;
    do {
      next = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
    } while (next === current);
    targetEmojiRef.current = next;
  }, []);

  // Spawn partikler ved treff
  const spawnHitParticles = useCallback((x, y, isCorrect) => {
    const count = isCorrect ? 10 : 5;
    const color = isCorrect ? '#4ecdc4' : '#e74c3c';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 25 + Math.random() * 10,
        maxLife: 35,
        size: 3 + Math.random() * 3,
        color,
      });
    }
  }, []);

  // Spawn flytende score-tekst
  const spawnFloatingText = useCallback((x, y, text, color) => {
    floatingTextsRef.current.push({
      x,
      y,
      vy: -2.0 - Math.random() * 0.5,
      life: 40,
      maxLife: 40,
      text,
      color,
      size: text.startsWith('+') ? 20 : 16,
    });
  }, []);

  // Hent canvas-koordinater fra museklikk / touch
  const getCanvasPosition = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Sjekk om et treff traff en fallende emoji
  const checkHit = useCallback((tapX, tapY) => {
    const emojis = fallingEmojisRef.current;
    let closestIndex = -1;
    let closestDist = Infinity;

    // Finn nærmeste emoji innenfor treffradius
    for (let i = emojis.length - 1; i >= 0; i--) {
      const e = emojis[i];
      const dx = tapX - (e.x + EMOJI_SIZE / 2);
      const dy = tapY - (e.y + EMOJI_SIZE / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < EMOJI_HIT_RADIUS && dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    if (closestIndex === -1) return; // Ingen treff

    const hitEmoji = emojis[closestIndex];
    const hitX = hitEmoji.x + EMOJI_SIZE / 2;
    const hitY = hitEmoji.y + EMOJI_SIZE / 2;
    const isCorrect = hitEmoji.emoji === targetEmojiRef.current;

    // Fjern den trufne emojien
    fallingEmojisRef.current.splice(closestIndex, 1);

    if (isCorrect) {
      // Korrekt treff!
      streakRef.current++;
      const bonus = streakRef.current >= 3 ? Math.min(streakRef.current * 2, 20) : 0;
      const points = CORRECT_POINTS + bonus;
      scoreRef.current = Math.max(0, scoreRef.current + points);
      flashRef.current = FLASH_DURATION;

      spawnHitParticles(hitX, hitY, true);
      const bonusText = bonus > 0 ? ` +${bonus}` : '';
      spawnFloatingText(hitX, hitY, `+${CORRECT_POINTS}${bonusText}`, '#4ecdc4');

      if (navigator.vibrate) navigator.vibrate([15, 10, 15]);
    } else {
      // Feil emoji!
      streakRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current + WRONG_POINTS);
      shakeRef.current = SHAKE_DURATION;

      spawnHitParticles(hitX, hitY, false);
      spawnFloatingText(hitX, hitY, `${WRONG_POINTS}`, '#e74c3c');

      if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    }
  }, [spawnHitParticles, spawnFloatingText]);

  // Tegn spillet
  const draw = useCallback((ctx) => {
    const state = gameStateRef.current;
    const frame = frameCountRef.current;
    const currentScore = scoreRef.current;
    const currentHighScore = highScoreRef.current;
    const timeLeft = timeLeftRef.current;
    const target = targetEmojiRef.current;

    ctx.save();

    // Risting ved feil treff
    if (shakeRef.current > 0) {
      const intensity = (shakeRef.current / SHAKE_DURATION) * 6;
      shakeOffsetRef.current = {
        x: (Math.random() - 0.5) * intensity * 2,
        y: (Math.random() - 0.5) * intensity * 2,
      };
      ctx.translate(shakeOffsetRef.current.x, shakeOffsetRef.current.y);
    }

    // Bakgrunn
    let bgColor = '#0f0f23';

    // Grønt flash ved korrekt treff
    if (flashRef.current > 0) {
      const flashAlpha = (flashRef.current / FLASH_DURATION) * 0.15;
      bgColor = '#0f0f23';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = `rgba(78, 205, 196, ${flashAlpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Rødt flash ved feil
    if (shakeRef.current > 0) {
      const shakeAlpha = (shakeRef.current / SHAKE_DURATION) * 0.12;
      ctx.fillStyle = `rgba(231, 76, 60, ${shakeAlpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Bakgrunnsstjerner (subtile)
    if (state === 'playing') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 30; i++) {
        // Pseudo-tilfeldig men stabil posisjon basert på indeks
        const sx = ((i * 137.508) % CANVAS_WIDTH);
        const sy = ((i * 97.137 + frame * 0.2) % CANVAS_HEIGHT);
        const size = 1 + (i % 3);
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Mål-emoji visning øverst ---
    if (state === 'playing') {
      // Bakgrunn for mål-indikator
      const targetBoxWidth = 200;
      const targetBoxHeight = 50;
      const targetBoxX = (CANVAS_WIDTH - targetBoxWidth) / 2;
      const targetBoxY = 8;

      // Avrundet boks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(targetBoxX, targetBoxY, targetBoxWidth, targetBoxHeight, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(78, 205, 196, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(targetBoxX, targetBoxY, targetBoxWidth, targetBoxHeight, 10);
      ctx.stroke();

      // "FANG:" tekst
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FANG:', targetBoxX + 40, targetBoxY + targetBoxHeight / 2);

      // Mål-emoji med puls
      const targetPulse = 1 + Math.sin(frame * 0.08) * 0.08;
      ctx.font = `${Math.round(30 * targetPulse)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(target, targetBoxX + targetBoxWidth / 2 + 20, targetBoxY + targetBoxHeight / 2);

      // Glow rundt mål-emoji
      ctx.fillStyle = `rgba(78, 205, 196, ${0.1 + Math.sin(frame * 0.08) * 0.05})`;
      ctx.beginPath();
      ctx.arc(targetBoxX + targetBoxWidth / 2 + 20, targetBoxY + targetBoxHeight / 2, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Timer-bar ---
    if (state === 'playing') {
      const progress = Math.max(0, timeLeft / GAME_DURATION);
      const barWidth = 160;
      const barHeight = 6;
      const barX = CANVAS_WIDTH - barWidth - 20;
      const barY = 20;

      // Bakgrunn
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 3);
      ctx.fill();

      // Fremgang
      const timerColor = progress > 0.3 ? '#4ecdc4' : progress > 0.15 ? '#f59e0b' : '#e74c3c';
      ctx.fillStyle = timerColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth * progress, barHeight, 3);
      ctx.fill();

      // Tid i sekunder
      const seconds = Math.ceil(timeLeft / 1000);
      ctx.fillStyle = progress > 0.3 ? '#fff' : timerColor;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${seconds}s`, barX - 8, barY - 2);
    }

    // --- Score visning ---
    if (state === 'playing') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${Math.floor(currentScore)}`, 20, 20);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px monospace';
      ctx.fillText('poeng', 20, 42);

      // Streak-visning
      const streak = streakRef.current;
      if (streak >= 3) {
        const streakPulse = 1 + Math.sin(frame * 0.12) * 0.1;
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${Math.round(14 * streakPulse)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${streak}x STREAK!`, 20, 58);
      }
    }

    // --- High score ---
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 20, 36);

    // --- Fallende emojis ---
    for (const emoji of fallingEmojisRef.current) {
      const ecx = emoji.x + EMOJI_SIZE / 2;
      const ecy = emoji.y + EMOJI_SIZE / 2;

      // Emoji
      const wobble = Math.sin(frame * 0.05 + emoji.id * 1.7) * 2;
      ctx.font = `${EMOJI_SIZE}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji.emoji, ecx + wobble, ecy);
    }

    // --- Partikler ---
    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = p.size * (0.5 + alpha * 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Flytende tekst ---
    for (const ft of floatingTextsRef.current) {
      const alpha = ft.life / ft.maxLife;
      const scale = 0.8 + alpha * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.round(ft.size * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // --- Idle/Dead bunnlinje for dekorasjon ---
    if (state !== 'playing') {
      // Dekorativ bunnlinje
      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(0, CANVAS_HEIGHT - 4, CANVAS_WIDTH, 4);
    }

    ctx.restore();
  }, []);

  // Spilloppdatering
  const update = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    // Oppdater tid
    timeLeftRef.current = Math.max(0, GAME_DURATION - elapsed);

    // Fremdrift (0 til 1) for vanskelighetsskalering
    const progress = Math.min(1, elapsed / GAME_DURATION);

    // Bytt mål-emoji hvert 5. sekund
    if (now - lastTargetChangeRef.current >= TARGET_CHANGE_INTERVAL) {
      pickNewTarget();
      lastTargetChangeRef.current = now;

      // Synlig indikator + flash ved bytte
      spawnFloatingText(CANVAS_WIDTH / 2, 60, 'NYTT MAL!', '#fbbf24');
      flashRef.current = 25; // Lenger flash for å gjøre det tydelig
    }

    // Beregn nåværende fall-hastighet basert på fremdrift
    const fallSpeedMin = INITIAL_FALL_SPEED_MIN + (MAX_FALL_SPEED_MIN - INITIAL_FALL_SPEED_MIN) * progress;
    const fallSpeedMax = INITIAL_FALL_SPEED_MAX + (MAX_FALL_SPEED_MAX - INITIAL_FALL_SPEED_MAX) * progress;

    // Beregn spawn-intervall (minsker over tid)
    const spawnInterval = Math.max(
      MIN_SPAWN_INTERVAL,
      Math.floor(INITIAL_SPAWN_INTERVAL - (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * progress)
    );

    frameCountRef.current++;

    // Spawn nye emojis
    if (frameCountRef.current % spawnInterval === 0) {
      const emoji = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
      const x = 20 + Math.random() * (CANVAS_WIDTH - 40 - EMOJI_SIZE);
      const vy = fallSpeedMin + Math.random() * (fallSpeedMax - fallSpeedMin);

      fallingEmojisRef.current.push({
        x,
        y: -EMOJI_SIZE,
        vy,
        emoji,
        id: nextEmojiIdRef.current++,
      });
    }

    // Sørg for at mål-emoji dukker opp regelmessig (hvert 3. spawn)
    if (frameCountRef.current % (spawnInterval * 3) === 0) {
      const x = 40 + Math.random() * (CANVAS_WIDTH - 80 - EMOJI_SIZE);
      const vy = fallSpeedMin + Math.random() * (fallSpeedMax - fallSpeedMin) * 0.8;

      fallingEmojisRef.current.push({
        x,
        y: -EMOJI_SIZE,
        vy,
        emoji: targetEmojiRef.current,
        id: nextEmojiIdRef.current++,
      });
    }

    // Oppdater fallende emojis (in-place for ytelse)
    const emojis = fallingEmojisRef.current;
    for (let i = emojis.length - 1; i >= 0; i--) {
      emojis[i].y += emojis[i].vy;
      if (emojis[i].y >= CANVAS_HEIGHT + EMOJI_SIZE) emojis.splice(i, 1);
    }

    // Oppdater feedback-timers
    if (flashRef.current > 0) flashRef.current--;
    if (shakeRef.current > 0) shakeRef.current--;

    // Oppdater partikler (in-place for ytelse)
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.97;
      p.life -= 1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Oppdater flytende tekst (in-place for ytelse)
    const texts = floatingTextsRef.current;
    for (let i = texts.length - 1; i >= 0; i--) {
      texts[i].y += texts[i].vy;
      texts[i].life -= 1;
      if (texts[i].life <= 0) texts.splice(i, 1);
    }

    // Sjekk om tiden er ute
    if (timeLeftRef.current <= 0) {
      return true; // Spillet er over
    }
    return false;
  }, [pickNewTarget, spawnFloatingText]);

  // Start spillet
  const startGame = useCallback(() => {
    scoreRef.current = 0;
    frameCountRef.current = 0;
    startTimeRef.current = performance.now();
    timeLeftRef.current = GAME_DURATION;
    fallingEmojisRef.current = [];
    nextEmojiIdRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    flashRef.current = 0;
    shakeRef.current = 0;
    shakeOffsetRef.current = { x: 0, y: 0 };
    streakRef.current = 0;
    lastTargetChangeRef.current = performance.now();
    pickNewTarget();
    setDisplayScore(0);
    setGameState('playing');
  }, [pickNewTarget]);

  // Håndter spillslutt
  const handleGameEnd = useCallback(() => {
    if (!isMountedRef.current) return;

    const finalScore = Math.floor(scoreRef.current);

    setGameState('dead');
    setDisplayScore(finalScore);

    // Oppdater high score
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyEmojiRainHighScore', finalScore.toString());
    }

    // Send poeng til server
    if (finalScore > 0 && submitLobbyScoreRef.current) {
      submitLobbyScoreRef.current(finalScore, 'emoji');
    }
  }, []);

  // Klikk-handler
  const handleClick = useCallback((e) => {
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
      startGame();
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    const pos = getCanvasPosition(e.clientX, e.clientY);
    if (pos) {
      checkHit(pos.x, pos.y);
    }
  }, [startGame, getCanvasPosition, checkHit]);

  // Touch-handler
  const handleTouch = useCallback((e) => {
    e.preventDefault();
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
      startGame();
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    // Håndter alle touches (multi-touch)
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const pos = getCanvasPosition(touch.clientX, touch.clientY);
      if (pos) {
        checkHit(pos.x, pos.y);
        break; // Bare prosesser første touch per event
      }
    }
  }, [startGame, getCanvasPosition, checkHit]);

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
        const ended = update();
        if (ended) {
          handleGameEnd();
        } else {
          // Oppdater React state sjeldnere for ytelse
          if (frameCountRef.current % 6 === 0) {
            setDisplayScore(Math.floor(scoreRef.current));
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
  }, [update, draw, handleGameEnd]);

  // Tastatur-håndtering (for testing)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame]);

  return (
    <div className="lobby-minigame lobby-emoji-rain">
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          onTouchStart={handleTouch}
        />

        {gameState === 'idle' && (
          <div className="overlay start-overlay">
            <p className="game-title">Emoji-Regn!</p>
            <p>Trykk bare på riktig emoji!</p>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="overlay death-overlay">
            <p className="final-score">{displayScore}</p>
            <p className="retry-text">Trykk for å prøve igjen</p>
          </div>
        )}
      </div>

      <div className="game-stats">
        <span className="current-score">Poeng: {displayScore}</span>
        <span className="best-score">Best: {highScore}</span>
      </div>
    </div>
  );
}

export default LobbyEmojiRain;
