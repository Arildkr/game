// game/src/components/LobbyClicker.jsx
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
const CANVAS_HEIGHT = 300;
const GAME_DURATION = 10000; // 10 sekunder

// Knappstørrelse og posisjon
const BUTTON_RADIUS = 60;
const BUTTON_X = CANVAS_WIDTH / 2;
const BUTTON_Y = CANVAS_HEIGHT / 2 + 10;

// Partikkelinnstillinger
const PARTICLE_COUNT = 8;       // partikler per klikk
const PARTICLE_LIFETIME = 40;   // frames
const PARTICLE_SPEED = 6;

// Kombo-farger (bakgrunn skifter med kombo)
const COMBO_COLORS = [
  { bg: '#0f0f23', btn: '#4ecdc4', glow: 'rgba(78,205,196,0.3)' },   // 0-4 cps
  { bg: '#0f1a2e', btn: '#45b7d1', glow: 'rgba(69,183,209,0.35)' },  // 5-7 cps
  { bg: '#1a0f2e', btn: '#a855f7', glow: 'rgba(168,85,247,0.35)' },  // 8-10 cps
  { bg: '#2e0f1a', btn: '#f43f5e', glow: 'rgba(244,63,94,0.35)' },   // 11-14 cps
  { bg: '#2e1a0f', btn: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },   // 15-19 cps
  { bg: '#2e2e0f', btn: '#fbbf24', glow: 'rgba(251,191,36,0.45)' },  // 20+ cps
];

// Stjernepartikler som roterer rundt knappen ved hoy kombo
const ORBIT_PARTICLE_COUNT = 6;

function getComboTier(cps) {
  if (cps < 5)  return 0;
  if (cps < 8)  return 1;
  if (cps < 11) return 2;
  if (cps < 15) return 3;
  if (cps < 20) return 4;
  return 5;
}

function LobbyClicker() {
  const { submitLobbyScore } = useGame();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const isMountedRef = useRef(true);
  const submitLobbyScoreRef = useRef(submitLobbyScore);

  const [gameState, setGameState] = useState('idle'); // idle, playing, dead
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCps, setDisplayCps] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lobbyClickerHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hold submitLobbyScore ref oppdatert
  useEffect(() => {
    submitLobbyScoreRef.current = submitLobbyScore;
  }, [submitLobbyScore]);

  // Spilltilstand i refs for ytelse
  const clickCountRef = useRef(0);
  const cpsRef = useRef(0);
  const recentClicksRef = useRef([]);      // timestamps for CPS-beregning
  const particlesRef = useRef([]);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const timeLeftRef = useRef(GAME_DURATION);
  const buttonScaleRef = useRef(1);        // knappens skala-animasjon
  const buttonPulseRef = useRef(0);        // ekstra puls ved klikk
  const shakeRef = useRef({ x: 0, y: 0 });// skjermristing
  const highScoreRef = useRef(highScore);
  const gameStateRef = useRef(gameState);
  const comboTierRef = useRef(0);
  const bgColorRef = useRef(COMBO_COLORS[0]);
  const ringParticlesRef = useRef([]);     // ring-eksplosjon
  const floatingTextsRef = useRef([]);     // flytende +1 tekst
  const deathTimeRef = useRef(0);          // tidspunkt for game over (for restart-cooldown)

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

  // Opprett partikler ved klikk
  const spawnParticles = useCallback((x, y) => {
    const tier = comboTierRef.current;
    const colors = COMBO_COLORS[tier];
    const count = PARTICLE_COUNT + tier * 2; // flere partikler ved hoyere kombo

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = PARTICLE_SPEED * (0.5 + Math.random() * 1.0);
      const size = 3 + Math.random() * 4 + tier;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: PARTICLE_LIFETIME + Math.random() * 10,
        maxLife: PARTICLE_LIFETIME + 10,
        size,
        color: colors.btn,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      });
    }

    // Ring-eksplosjon
    ringParticlesRef.current.push({
      x,
      y,
      radius: 10,
      maxRadius: 40 + tier * 15,
      life: 20,
      maxLife: 20,
      color: colors.btn,
    });

    // Flytende +1 tekst
    floatingTextsRef.current.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y - 20,
      vy: -1.5 - Math.random(),
      life: 35,
      maxLife: 35,
      text: tier >= 3 ? `+${tier - 1}` : '+1',
      color: colors.btn,
      size: 14 + tier * 2,
    });
  }, []);

  // Beregn CPS (clicks per second) - in-place for ytelse
  const calculateCps = useCallback(() => {
    const now = performance.now();
    const clicks = recentClicksRef.current;
    // Fjern klikk eldre enn 1 sekund (in-place)
    while (clicks.length > 0 && now - clicks[0] >= 1000) {
      clicks.shift();
    }
    return clicks.length;
  }, []);

  // Tegn spillet
  const draw = useCallback((ctx) => {
    const frame = frameCountRef.current;
    const clicks = clickCountRef.current;
    const cps = cpsRef.current;
    const timeLeft = timeLeftRef.current;
    const tier = comboTierRef.current;
    const colors = bgColorRef.current;
    const shake = shakeRef.current;
    const currentHighScore = highScoreRef.current;
    const state = gameStateRef.current;

    ctx.save();

    // Skjermristing
    if (Math.abs(shake.x) > 0.1 || Math.abs(shake.y) > 0.1) {
      ctx.translate(shake.x, shake.y);
    }

    // Bakgrunn med gradvis fargeskifte
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);

    // Bakgrunnsmoenster - pulserende sirkler
    if (state === 'playing') {
      const pulseAlpha = 0.03 + tier * 0.01;
      ctx.strokeStyle = `rgba(255,255,255,${pulseAlpha})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const r = ((frame * 0.5 + i * 80) % 300);
        ctx.beginPath();
        ctx.arc(BUTTON_X, BUTTON_Y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Ring-eksplosjoner
    for (const ring of ringParticlesRef.current) {
      const progress = 1 - ring.life / ring.maxLife;
      const alpha = 1 - progress;
      const currentRadius = ring.radius + (ring.maxRadius - ring.radius) * progress;
      ctx.strokeStyle = ring.color.replace(')', `,${alpha * 0.6})`).replace('rgb', 'rgba');
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Partikler
    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      // Partikkelform: liten firkant med rotasjon
      ctx.fillStyle = p.color;
      const s = p.size * alpha;
      ctx.fillRect(-s / 2, -s / 2, s, s);

      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Flytende tekst
    for (const ft of floatingTextsRef.current) {
      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // Orbiterende partikler ved hoyt kombo
    if (state === 'playing' && tier >= 2) {
      const orbitCount = Math.min(tier, ORBIT_PARTICLE_COUNT);
      for (let i = 0; i < orbitCount; i++) {
        const angle = (frame * 0.04) + (Math.PI * 2 * i) / orbitCount;
        const orbitRadius = BUTTON_RADIUS + 25 + tier * 5;
        const ox = BUTTON_X + Math.cos(angle) * orbitRadius;
        const oy = BUTTON_Y + Math.sin(angle) * orbitRadius;
        const orbSize = 4 + tier;

        ctx.fillStyle = colors.btn;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
        ctx.fill();

        // Hale
        for (let j = 1; j <= 3; j++) {
          const tailAngle = angle - j * 0.15;
          const tx = BUTTON_X + Math.cos(tailAngle) * orbitRadius;
          const ty = BUTTON_Y + Math.sin(tailAngle) * orbitRadius;
          ctx.globalAlpha = 0.3 - j * 0.08;
          ctx.beginPath();
          ctx.arc(tx, ty, orbSize * (1 - j * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Hovedknappen
    const scale = buttonScaleRef.current;
    const pulse = buttonPulseRef.current;
    const effectiveRadius = BUTTON_RADIUS * scale + pulse * 5;

    // Ytre glow
    if (state === 'playing') {
      const glowSize = effectiveRadius + 15 + tier * 8 + Math.sin(frame * 0.08) * 5;
      const gradient = ctx.createRadialGradient(
        BUTTON_X, BUTTON_Y, effectiveRadius * 0.5,
        BUTTON_X, BUTTON_Y, glowSize
      );
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(BUTTON_X, BUTTON_Y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Knappens kropp
    const btnGradient = ctx.createRadialGradient(
      BUTTON_X - effectiveRadius * 0.3, BUTTON_Y - effectiveRadius * 0.3, 0,
      BUTTON_X, BUTTON_Y, effectiveRadius
    );

    if (state === 'dead') {
      btnGradient.addColorStop(0, '#666');
      btnGradient.addColorStop(1, '#444');
    } else if (state === 'idle') {
      btnGradient.addColorStop(0, '#5eddd4');
      btnGradient.addColorStop(1, '#3aaa9f');
    } else {
      // Lysere versjon av combo-farge
      btnGradient.addColorStop(0, colors.btn);
      btnGradient.addColorStop(1, colors.btn + 'bb');
    }

    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.arc(BUTTON_X, BUTTON_Y, effectiveRadius, 0, Math.PI * 2);
    ctx.fill();

    // Knappens kant
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BUTTON_X, BUTTON_Y, effectiveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Tekst pa knappen
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === 'idle') {
      ctx.font = 'bold 18px monospace';
      ctx.fillText('KLIKK!', BUTTON_X, BUTTON_Y - 8);
      ctx.font = '13px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Trykk for a starte', BUTTON_X, BUTTON_Y + 14);
    } else if (state === 'playing') {
      // Stort klikk-tall pa knappen
      ctx.font = `bold ${36 + tier * 3}px monospace`;
      ctx.fillText(`${clicks}`, BUTTON_X, BUTTON_Y);
    } else {
      // Dead state - vis resultatet
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${clicks}`, BUTTON_X, BUTTON_Y - 8);
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Trykk igjen', BUTTON_X, BUTTON_Y + 14);
    }

    // Timer-bar (oppe)
    if (state === 'playing') {
      const progress = Math.max(0, timeLeft / GAME_DURATION);
      const barWidth = CANVAS_WIDTH - 40;
      const barHeight = 8;
      const barX = 20;
      const barY = 16;

      // Bakgrunn
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 4);
      ctx.fill();

      // Fremgang
      const timerColor = progress > 0.3 ? colors.btn : '#e74c3c';
      ctx.fillStyle = timerColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth * progress, barHeight, 4);
      ctx.fill();

      // Tidstekst
      const seconds = Math.ceil(timeLeft / 1000);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${seconds}s`, CANVAS_WIDTH / 2, barY + barHeight + 4);
    }

    // CPS-visning (venstre side)
    if (state === 'playing') {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colors.btn;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${cps}`, 20, CANVAS_HEIGHT - 60);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('klikk/s', 20, CANVAS_HEIGHT - 38);

      // Kombo-indikator
      if (tier > 0) {
        const comboNames = ['', 'RASK!', 'SUPER!', 'MEGA!', 'ULTRA!', 'VANVITTIG!'];
        ctx.fillStyle = colors.btn;
        ctx.font = `bold ${14 + tier}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(comboNames[tier], 20, 50);
      }
    }

    // Poengsum (hoyre side)
    if (state === 'playing') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${clicks}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 60);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('totalt', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 38);
    }

    // High score
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`HI: ${currentHighScore}`, CANVAS_WIDTH - 14, CANVAS_HEIGHT - 20);

    ctx.restore();
  }, []);

  // Spilloppdatering
  const update = useCallback(() => {
    const now = performance.now();

    // Oppdater tid
    timeLeftRef.current = Math.max(0, GAME_DURATION - (now - startTimeRef.current));

    // CPS-beregning
    cpsRef.current = calculateCps();
    comboTierRef.current = getComboTier(cpsRef.current);
    bgColorRef.current = COMBO_COLORS[comboTierRef.current];

    // Knapp-animasjoner (spring tilbake)
    buttonScaleRef.current += (1 - buttonScaleRef.current) * 0.15;
    buttonPulseRef.current *= 0.85;

    // Skjermristing dempes
    shakeRef.current.x *= 0.85;
    shakeRef.current.y *= 0.85;

    // Oppdater partikler (in-place for ytelse)
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.98;
      p.life -= 1;
      p.rotation += p.rotSpeed;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Oppdater ring-eksplosjoner (in-place for ytelse)
    const rings = ringParticlesRef.current;
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= 1;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }

    // Oppdater flytende tekst (in-place for ytelse)
    const texts = floatingTextsRef.current;
    for (let i = texts.length - 1; i >= 0; i--) {
      texts[i].y += texts[i].vy;
      texts[i].life -= 1;
      if (texts[i].life <= 0) texts.splice(i, 1);
    }

    frameCountRef.current++;

    // Sjekk om tiden er ute
    if (timeLeftRef.current <= 0) {
      return true; // Spillet er over
    }
    return false;
  }, [calculateCps]);

  // Start spillet
  const startGame = useCallback(() => {
    clickCountRef.current = 0;
    cpsRef.current = 0;
    recentClicksRef.current = [];
    particlesRef.current = [];
    ringParticlesRef.current = [];
    floatingTextsRef.current = [];
    frameCountRef.current = 0;
    startTimeRef.current = performance.now();
    timeLeftRef.current = GAME_DURATION;
    buttonScaleRef.current = 1;
    buttonPulseRef.current = 0;
    shakeRef.current = { x: 0, y: 0 };
    comboTierRef.current = 0;
    bgColorRef.current = COMBO_COLORS[0];
    setDisplayScore(0);
    setDisplayCps(0);
    setGameState('playing');
  }, []);

  // Handter spillslutt
  const handleGameEnd = useCallback(() => {
    if (!isMountedRef.current) return;

    const finalScore = clickCountRef.current;

    setGameState('dead');
    setDisplayScore(finalScore);
    deathTimeRef.current = performance.now();

    // Oppdater high score
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('lobbyClickerHighScore', finalScore.toString());
    }

    // Send poeng til server
    if (finalScore > 0 && submitLobbyScoreRef.current) {
      submitLobbyScoreRef.current(finalScore, 'clicker');
    }
  }, []);

  // Klikk-handler
  const handleClick = useCallback((e) => {
    if (gameStateRef.current === 'idle') {
      startGame();
      return;
    }
    if (gameStateRef.current === 'dead') {
      // Vent 1.5s etter game over før restart tillates
      if (performance.now() - deathTimeRef.current < 1500) return;
      startGame();
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    // Registrer klikk
    clickCountRef.current++;
    recentClicksRef.current.push(performance.now());

    // Knapp-animasjon: krymp og puls
    buttonScaleRef.current = 0.85;
    buttonPulseRef.current = 1;

    // Skjermristing basert pa kombo
    const tier = comboTierRef.current;
    const shakeIntensity = 1 + tier * 0.8;
    shakeRef.current = {
      x: (Math.random() - 0.5) * shakeIntensity * 2,
      y: (Math.random() - 0.5) * shakeIntensity * 2,
    };

    // Finn klikkposisjon pa canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      spawnParticles(cx, cy);
    } else {
      // Fallback: spawn fra knappens senter
      spawnParticles(BUTTON_X, BUTTON_Y);
    }

    // Haptisk tilbakemelding
    if (navigator.vibrate) {
      navigator.vibrate(tier >= 3 ? [10, 5, 10] : 8);
    }
  }, [startGame, spawnParticles]);

  // Touch-handler
  const handleTouch = useCallback((e) => {
    e.preventDefault();
    if (gameStateRef.current === 'idle') {
      startGame();
      return;
    }
    if (gameStateRef.current === 'dead') {
      if (performance.now() - deathTimeRef.current < 1500) return;
      startGame();
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    // Hent forste touch
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    // Registrer klikk
    clickCountRef.current++;
    recentClicksRef.current.push(performance.now());

    // Animasjoner
    buttonScaleRef.current = 0.85;
    buttonPulseRef.current = 1;

    const tier = comboTierRef.current;
    const shakeIntensity = 1 + tier * 0.8;
    shakeRef.current = {
      x: (Math.random() - 0.5) * shakeIntensity * 2,
      y: (Math.random() - 0.5) * shakeIntensity * 2,
    };

    // Finn touch-posisjon pa canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const cx = (touch.clientX - rect.left) * scaleX;
      const cy = (touch.clientY - rect.top) * scaleY;
      spawnParticles(cx, cy);
    } else {
      spawnParticles(BUTTON_X, BUTTON_Y);
    }

    if (navigator.vibrate) {
      navigator.vibrate(tier >= 3 ? [10, 5, 10] : 8);
    }
  }, [startGame, spawnParticles]);

  // Spillokke
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
            setDisplayScore(clickCountRef.current);
            setDisplayCps(cpsRef.current);
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

  // Inputhandtering - keyboard (mellomrom)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStateRef.current === 'idle' || gameStateRef.current === 'dead') {
          startGame();
        } else if (gameStateRef.current === 'playing') {
          // Simuler et klikk fra midten
          clickCountRef.current++;
          recentClicksRef.current.push(performance.now());
          buttonScaleRef.current = 0.85;
          buttonPulseRef.current = 1;
          const tier = comboTierRef.current;
          shakeRef.current = {
            x: (Math.random() - 0.5) * (1 + tier * 0.8) * 2,
            y: (Math.random() - 0.5) * (1 + tier * 0.8) * 2,
          };
          spawnParticles(
            BUTTON_X + (Math.random() - 0.5) * 40,
            BUTTON_Y + (Math.random() - 0.5) * 40
          );
          if (navigator.vibrate) navigator.vibrate(8);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, spawnParticles]);

  return (
    <div className="lobby-minigame lobby-clicker">
      <div className="minigame-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          onTouchStart={handleTouch}
        />

        {gameState === 'idle' && (
          <div className="overlay start-overlay">
            <p className="minigame-title">Klikk-Bonanza!</p>
            <p>Klikk sa raskt du kan!</p>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="overlay death-overlay">
            <p className="final-score">{displayScore}</p>
            <p className="final-cps">{displayCps} klikk/s</p>
            <p className="retry-text">Trykk for a prove igjen</p>
          </div>
        )}
      </div>

      <div className="minigame-stats">
        <span className="current-score">Poeng: {displayScore}</span>
        <span className="best-score">Best: {highScore}</span>
      </div>
    </div>
  );
}

export default LobbyClicker;
