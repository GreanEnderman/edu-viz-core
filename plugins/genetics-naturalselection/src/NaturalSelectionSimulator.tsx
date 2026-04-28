import { useState, useEffect, useRef, useCallback } from "react";

interface A2UINode {
  properties?: Record<string, unknown>;
}

function parseStr(val: unknown, fb: string): string { return typeof val === "string" ? val : fb; }
function parseNum(val: unknown, fb: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") { const n = Number(val); return isNaN(n) ? fb : n; }
  return fb;
}
function parseBool(val: unknown, fb: boolean): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true";
  return fb;
}

// ============================================================================
// Types & Interfaces
// ============================================================================

type Genotype = "AA" | "Aa" | "aa";
type Phase = "IDLE" | "STABLE" | "SELECTION" | "DYING" | "REPRODUCTION" | "TRANSITION";
type IndividualState = "alive" | "dying" | "newborn";

interface Individual {
  id: number;
  genotype: Genotype;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
  state: IndividualState;
  dyingTimer: number;
  deathParticlesSpawned: boolean;
  markedForDeath: boolean;
  birthTimer: number;
  scanned: boolean;
}

interface DeathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface MatingLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  life: number;
}

interface GenRecord {
  generation: number;
  freqA: number;
  freqa: number;
  countAA: number;
  countAa: number;
  countaa: number;
}

interface FrequencyBar {
  current: number;
  target: number;
  velocity: number;
}

// ============================================================================
// Constants
// ============================================================================

const PHASE_DURATIONS: Record<Phase, number> = {
  IDLE: 0,
  STABLE: 1000,
  SELECTION: 1500,
  DYING: 1000,
  REPRODUCTION: 1500,
  TRANSITION: 800,
};

const COLORS = {
  AA: "#1e40af",
  Aa: "#7c3aed",
  aa: "#f59e0b",
  death: "#dc2626",
  birth: "#22c55e",
  freqA: "#1e40af",
  freqa: "#f59e0b",
  mating: "#775a19",
  particle: "#fca5a5",
  scanWave: "#ef4444",
  fitnessHigh: "#22c55e",
  fitnessLow: "#ef4444",
};

const INDIVIDUAL_RADIUS = 12;
const BROWNIAN_FORCE = 0.3;
const BROWNIAN_DAMPING = 0.95;
const BOUNDARY_MARGIN = 20;

// ============================================================================
// Utility Functions
// ============================================================================

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getPhenotypeColor(genotype: Genotype): string {
  return COLORS[genotype];
}

function getFitness(genotype: Genotype, env: string, strength: number): number {
  // strength 即选择系数 s，适应度 w = 1 - s
  // 最适应基因型 w=1，劣势基因型 w=1-s

  if (env === "dark") {
    // 深色环境：AA 最适应，aa 最劣势
    if (genotype === "AA") return 1.0;
    if (genotype === "Aa") return 1.0 - strength * 0.5; // 杂合子中等劣势
    return 1.0 - strength; // aa 完全劣势
  } else {
    // 浅色环境：aa 最适应，AA 最劣势
    if (genotype === "aa") return 1.0;
    if (genotype === "Aa") return 1.0 - strength * 0.5;
    return 1.0 - strength; // AA 完全劣势
  }
}

function randAllele(gt: Genotype): "A" | "a" {
  if (gt === "AA") return "A";
  if (gt === "aa") return "a";
  return Math.random() < 0.5 ? "A" : "a";
}

function combine(a1: "A" | "a", a2: "A" | "a"): Genotype {
  if (a1 === "A" && a2 === "A") return "AA";
  if (a1 === "a" && a2 === "a") return "aa";
  return "Aa";
}

function calcFrequencies(population: Individual[]): { freqA: number; freqa: number; countAA: number; countAa: number; countaa: number } {
  const alive = population.filter(i => i.state === "alive" || i.state === "newborn");
  let countAA = 0, countAa = 0, countaa = 0;
  alive.forEach(i => {
    if (i.genotype === "AA") countAA++;
    else if (i.genotype === "Aa") countAa++;
    else countaa++;
  });
  const total = alive.length;
  const alleleCount = total * 2;
  const countA = countAA * 2 + countAa;
  const counta = countaa * 2 + countAa;
  return {
    freqA: alleleCount > 0 ? countA / alleleCount : 0,
    freqa: alleleCount > 0 ? counta / alleleCount : 0,
    countAA,
    countAa,
    countaa,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function NaturalSelectionSimulator({ node }: { node: A2UINode }) {
  const props = node.properties ?? {};

  // Props
  const [popSize, setPopSize] = useState(parseNum(props.populationSize, 100));
  const [initFreq, setInitFreq] = useState(parseNum(props.initialFreqA, 0.5));
  const [envType, setEnvType] = useState(parseStr(props.environmentType, "dark"));
  const [selStr, setSelStr] = useState(parseNum(props.selectionStrength, 0.5));
  const interactive = parseBool(props.interactive, true);

  // State
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [history, setHistory] = useState<GenRecord[]>([]);
  const [fixationReached, setFixationReached] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("IDLE");
  const phaseStartRef = useRef<number>(0);
  const populationRef = useRef<Individual[]>([]);
  const deathParticlesRef = useRef<DeathParticle[]>([]);
  const matingLinesRef = useRef<MatingLine[]>([]);
  const generationRef = useRef<number>(0);
  const historyRef = useRef<GenRecord[]>([]);
  const freqBarsRef = useRef<{ A: FrequencyBar; a: FrequencyBar }>({
    A: { current: 0, target: 0, velocity: 0 },
    a: { current: 0, target: 0, velocity: 0 },
  });
  const hoveredIndividualRef = useRef<Individual | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  // Sync props
  useEffect(() => { setPopSize(parseNum(props.populationSize, 100)); }, [props.populationSize]);
  useEffect(() => { setInitFreq(parseNum(props.initialFreqA, 0.5)); }, [props.initialFreqA]);
  useEffect(() => { setEnvType(parseStr(props.environmentType, "dark")); }, [props.environmentType]);
  useEffect(() => { setSelStr(parseNum(props.selectionStrength, 0.5)); }, [props.selectionStrength]);

  // Initialize population
  const initPopulation = useCallback(() => {
    const freqA = initFreq;
    const freqAA = freqA * freqA;
    const freqAa = 2 * freqA * (1 - freqA);
    const pop: Individual[] = [];
    for (let i = 0; i < popSize; i++) {
      const r = Math.random();
      let gt: Genotype;
      if (r < freqAA) gt = "AA";
      else if (r < freqAA + freqAa) gt = "Aa";
      else gt = "aa";
      pop.push({
        id: i,
        genotype: gt,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: 0,
        vy: 0,
        scale: 1,
        alpha: 1,
        state: "alive",
        dyingTimer: 0,
        deathParticlesSpawned: false,
        markedForDeath: false,
        birthTimer: 0,
        scanned: false,
      });
    }
    populationRef.current = pop;
    generationRef.current = 0;
    const freq = calcFrequencies(pop);
    historyRef.current = [{ generation: 0, ...freq }];
    freqBarsRef.current.A.target = freq.freqA;
    freqBarsRef.current.a.target = freq.freqa;
    setGeneration(0);
    setHistory([{ generation: 0, ...freq }]);
    setFixationReached(false);
  }, [popSize, initFreq]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !running) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const cw = container.offsetWidth || 800;
    const ch = container.offsetHeight || 600;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);
    }

    const phase = phaseRef.current;
    const phaseStart = phaseStartRef.current;
    const elapsed = timestamp - phaseStart;
    const phaseDuration = PHASE_DURATIONS[phase];
    const phaseProgress = phaseDuration > 0 ? Math.min(elapsed / phaseDuration, 1) : 1;

    // Phase transitions
    if (phaseProgress >= 1) {
      if (phase === "IDLE") {
        phaseRef.current = "STABLE";
        phaseStartRef.current = timestamp;
      } else if (phase === "STABLE") {
        phaseRef.current = "SELECTION";
        phaseStartRef.current = timestamp;
      } else if (phase === "SELECTION") {
        phaseRef.current = "DYING";
        phaseStartRef.current = timestamp;
      } else if (phase === "DYING") {
        phaseRef.current = "REPRODUCTION";
        phaseStartRef.current = timestamp;
      } else if (phase === "REPRODUCTION") {
        phaseRef.current = "TRANSITION";
        phaseStartRef.current = timestamp;
      } else if (phase === "TRANSITION") {
        phaseRef.current = "STABLE";
        phaseStartRef.current = timestamp;
      }
    }

    // Update population
    updatePopulation(timestamp, phase, phaseProgress, cw, ch);

    // Render
    render(ctx, cw, ch, dpr, timestamp, phase, phaseProgress);

    rafRef.current = requestAnimationFrame(animate);
  }, [running, envType, selStr, popSize]);

  // Update population logic
  const updatePopulation = useCallback((timestamp: number, phase: Phase, phaseProgress: number, cw: number, ch: number) => {
    const pop = populationRef.current;

    // Brownian motion (always active)
    pop.forEach(ind => {
      if (ind.state === "dying") return;

      ind.vx += (Math.random() - 0.5) * BROWNIAN_FORCE;
      ind.vy += (Math.random() - 0.5) * BROWNIAN_FORCE;
      ind.vx *= BROWNIAN_DAMPING;
      ind.vy *= BROWNIAN_DAMPING;

      const xPx = (ind.x / 100) * cw * 0.7;
      const yPx = (ind.y / 100) * ch;
      const newX = xPx + ind.vx;
      const newY = yPx + ind.vy;

      if (newX < BOUNDARY_MARGIN || newX > cw * 0.7 - BOUNDARY_MARGIN) ind.vx *= -1;
      if (newY < BOUNDARY_MARGIN || newY > ch - BOUNDARY_MARGIN) ind.vy *= -1;

      ind.x = Math.max(0, Math.min(100, (newX / (cw * 0.7)) * 100));
      ind.y = Math.max(0, Math.min(100, (newY / ch) * 100));
    });

    // Phase-specific updates
    if (phase === "SELECTION") {
      const waveY = phaseProgress * ch;
      pop.forEach(ind => {
        if (ind.markedForDeath || ind.scanned) return;
        const yPx = (ind.y / 100) * ch;
        if (yPx <= waveY) {
          ind.scanned = true;
          const fitness = getFitness(ind.genotype, envType, selStr);
          if (Math.random() > fitness) {
            ind.markedForDeath = true;
          }
        }
      });
    }

    if (phase === "DYING") {
      pop.forEach(ind => {
        if (ind.markedForDeath && ind.state === "alive") {
          ind.state = "dying";
          ind.dyingTimer = 0;
        }
        if (ind.state === "dying") {
          ind.dyingTimer += 0.016;
          const t = Math.min(ind.dyingTimer / 0.8, 1);
          ind.scale = lerp(1, 0.3, t);
          ind.alpha = lerp(1, 0, t);

          if (t > 0.5 && !ind.deathParticlesSpawned) {
            ind.deathParticlesSpawned = true;
            const xPx = (ind.x / 100) * cw * 0.7;
            const yPx = (ind.y / 100) * ch;
            for (let i = 0; i < 5; i++) {
              deathParticlesRef.current.push({
                x: xPx,
                y: yPx,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random(),
                alpha: 1,
                life: 0,
                maxLife: 60,
              });
            }
          }
        }
      });

      // Update death particles
      deathParticlesRef.current = deathParticlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        return p.life < p.maxLife;
      });
    }

    if (phase === "REPRODUCTION" && phaseProgress < 0.1) {
      const survivors = pop.filter(i => i.state === "alive");
      if (survivors.length >= 2) {
        const newPop: Individual[] = [];
        let nextId = pop.length;

        while (newPop.length < popSize) {
          const p1 = survivors[Math.floor(Math.random() * survivors.length)];
          const p2 = survivors[Math.floor(Math.random() * survivors.length)];
          const gt = combine(randAllele(p1.genotype), randAllele(p2.genotype));

          const parentX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 10;
          const parentY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 10;

          newPop.push({
            id: nextId++,
            genotype: gt,
            x: Math.max(0, Math.min(100, parentX)),
            y: Math.max(0, Math.min(100, parentY)),
            vx: 0,
            vy: 0,
            scale: 0,
            alpha: 0,
            state: "newborn",
            dyingTimer: 0,
            deathParticlesSpawned: false,
            markedForDeath: false,
            birthTimer: 0,
            scanned: false,
          });

          // Mating line
          const x1 = (p1.x / 100) * cw * 0.7;
          const y1 = (p1.y / 100) * ch;
          const x2 = (p2.x / 100) * cw * 0.7;
          const y2 = (p2.y / 100) * ch;
          matingLinesRef.current.push({ x1, y1, x2, y2, alpha: 1, life: 0 });
        }

        populationRef.current = newPop;
        generationRef.current++;
        const freq = calcFrequencies(newPop);
        historyRef.current.push({ generation: generationRef.current, ...freq });
        freqBarsRef.current.A.target = freq.freqA;
        freqBarsRef.current.a.target = freq.freqa;
        setGeneration(generationRef.current);
        setHistory([...historyRef.current]);

        if (freq.freqA >= 0.95 || freq.freqA <= 0.05) {
          setFixationReached(true);
        }
      }
    }

    if (phase === "REPRODUCTION") {
      pop.forEach(ind => {
        if (ind.state === "newborn") {
          ind.birthTimer += 0.016;
          const t = Math.min(ind.birthTimer / 0.5, 1);
          ind.scale = easeOutBack(t) * 1.2;
          ind.alpha = t;
          if (t >= 1) {
            ind.state = "alive";
            ind.scale = 1;
            ind.alpha = 1;
          }
        }
      });

      // Update mating lines
      matingLinesRef.current = matingLinesRef.current.filter(line => {
        line.life++;
        line.alpha = 1 - line.life / 60;
        return line.life < 60;
      });
    }

    // Update frequency bars (spring physics)
    const bars = freqBarsRef.current;
    ["A", "a"].forEach(key => {
      const bar = bars[key as "A" | "a"];
      bar.velocity += (bar.target - bar.current) * 0.1;
      bar.velocity *= 0.85;
      bar.current += bar.velocity;
    });
  }, [envType, selStr, popSize]);

  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number, dpr: number, timestamp: number, phase: Phase, phaseProgress: number) => {
    // Clear
    ctx.clearRect(0, 0, cw, ch);

    // Background gradient (light)
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "#faf9f5");
    grad.addColorStop(1, "#f4f4f0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // Environmental overlay
    ctx.save();
    if (envType === "dark") {
      ctx.fillStyle = "rgba(34, 87, 46, 0.06)";
    } else {
      ctx.fillStyle = "rgba(180, 140, 60, 0.06)";
    }
    ctx.fillRect(0, 0, cw * 0.7, ch);
    ctx.restore();

    // Selection wave (red scan)
    if (phase === "SELECTION") {
      const waveY = phaseProgress * ch;
      const grad = ctx.createLinearGradient(0, waveY - 30, 0, waveY + 30);
      grad.addColorStop(0, "rgba(239, 68, 68, 0)");
      grad.addColorStop(0.5, "rgba(239, 68, 68, 0.2)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, waveY - 30, cw * 0.7, 60);
    }

    // Sort individuals by Y for Z-sorting
    const pop = [...populationRef.current].sort((a, b) => a.y - b.y);

    // Draw individuals
    pop.forEach(ind => {
      const xPx = (ind.x / 100) * cw * 0.7;
      const yPx = (ind.y / 100) * ch;
      const depthScale = 0.9 + 0.1 * (ind.y / 100);
      const radius = INDIVIDUAL_RADIUS * depthScale * ind.scale;

      const isHovered = hoveredIndividualRef.current?.id === ind.id;

      // Camouflage alpha: individuals matching environment are less visible
      let camouflageAlpha = 1.0;
      if (ind.state === "alive" || ind.state === "newborn") {
        if (envType === "dark" && ind.genotype === "AA") {
          camouflageAlpha = 0.75; // Dark individuals blend into dark environment
        } else if (envType === "light" && ind.genotype === "aa") {
          camouflageAlpha = 0.75; // Light individuals blend into light environment
        }
      }

      const finalAlpha = isHovered ? 1 : (hoveredIndividualRef.current ? 0.4 : ind.alpha * camouflageAlpha);
      const finalRadius = isHovered ? radius * 1.3 : radius;

      ctx.save();
      ctx.globalAlpha = finalAlpha;

      // Shake effect for dying
      let shakeX = 0, shakeY = 0;
      if (ind.state === "dying" && ind.dyingTimer < 0.3) {
        shakeX = Math.sin(timestamp * 0.02) * 2;
        shakeY = Math.cos(timestamp * 0.02) * 2;
      }

      // Outer circle (phenotype)
      let color = getPhenotypeColor(ind.genotype);
      if (ind.state === "dying") {
        const t = ind.dyingTimer / 0.8;
        color = lerpColor(color, COLORS.death, t);
      }

      ctx.beginPath();
      ctx.arc(xPx + shakeX, yPx + shakeY, finalRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Stroke for better visibility
      ctx.strokeStyle = ind.genotype === "aa" ? "#1b1c1a" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Birth glow
      if (ind.state === "newborn" && ind.birthTimer < 0.3) {
        ctx.shadowBlur = 15 * (1 - ind.birthTimer / 0.3);
        ctx.shadowColor = COLORS.birth;
      }

      // Fitness halo during SELECTION phase
      if (phase === "SELECTION" && !ind.markedForDeath) {
        const waveY = phaseProgress * ch;
        if (yPx <= waveY) {
          const fitness = getFitness(ind.genotype, envType, selStr);
          const haloColor = fitness > 0.7 ? COLORS.fitnessHigh : COLORS.fitnessLow;
          const haloAlpha = fitness > 0.7 ? 0.3 : 0.5;
          const pulseScale = fitness > 0.7 ? 1.2 : (1.1 + 0.1 * Math.sin(timestamp * 0.01));

          ctx.save();
          ctx.globalAlpha = haloAlpha;
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(xPx, yPx, finalRadius * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Verdict markers during SELECTION phase (after scan)
      if (phase === "SELECTION" && phaseProgress > 0.5) {
        const waveY = phaseProgress * ch;
        if (yPx <= waveY * 0.9) {
          const marker = ind.markedForDeath ? "✗" : "✓";
          const markerColor = ind.markedForDeath ? COLORS.fitnessLow : COLORS.fitnessHigh;
          ctx.save();
          ctx.shadowBlur = 0;
          ctx.fillStyle = markerColor;
          ctx.font = `bold ${16 * depthScale}px Manrope, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marker, xPx, yPx - finalRadius - 5);
          ctx.restore();
        }
      }

      // Inner text (genotype)
      ctx.shadowBlur = 0;
      ctx.fillStyle = ind.genotype === "aa" ? "#1b1c1a" : "#ffffff";
      ctx.font = `bold ${9 * depthScale}px Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ind.genotype, xPx + shakeX, yPx + shakeY);

      ctx.restore();
    });

    // Death particles
    deathParticlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = COLORS.particle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Mating lines
    matingLinesRef.current.forEach(line => {
      ctx.save();
      ctx.globalAlpha = line.alpha;
      ctx.strokeStyle = COLORS.mating;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
      ctx.restore();
    });

    // Frequency bars (bottom)
    const barHeight = 20;
    const barY = ch - barHeight - 10;
    const barWidth = cw * 0.7 - 40;
    const barX = 20;

    const bars = freqBarsRef.current;
    const barAWidth = barWidth * bars.A.current;
    const baraWidth = barWidth * bars.a.current;

    // Background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = COLORS.freqA;
    ctx.fillRect(barX, barY, barAWidth, barHeight);
    ctx.fillStyle = COLORS.freqa;
    ctx.fillRect(barX + barAWidth, barY, baraWidth, barHeight);

    ctx.strokeStyle = "#182544";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Frequency chart (right panel)
    renderFrequencyChart(ctx, cw, ch, timestamp);

    // HUD
    renderHUD(ctx, cw, ch, phase, phaseProgress);

    // Fixation marker
    if (fixationReached) {
      ctx.save();
      const lastH = historyRef.current[historyRef.current.length - 1];
      const fixedGenotype = lastH.freqA >= 0.95 ? "AA/Aa" : "aa";
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 12px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`★ ${fixedGenotype} 等位基因已固定`, 20, ch - 40);
      ctx.restore();
    }
  }, [envType, fixationReached, selStr]);

  // Render frequency chart
  const renderFrequencyChart = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number, timestamp: number) => {
    const chartX = cw * 0.7 + 20;
    const chartW = cw * 0.3 - 40;
    const chartY = 40;
    const chartH = ch - 80;

    if (historyRef.current.length < 2) return;

    // Background
    ctx.fillStyle = "#f4f4f0";
    ctx.fillRect(chartX, chartY, chartW, chartH);

    // Grid
    ctx.strokeStyle = "rgba(24, 37, 68, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartW, y);
      ctx.stroke();
    }

    // Axes labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px Manrope, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = (1 - i / 5).toFixed(1);
      const y = chartY + (i / 5) * chartH;
      ctx.fillText(val, chartX - 5, y + 3);
    }

    const history = historyRef.current;
    const maxGen = Math.max(...history.map(h => h.generation), 1);

    // Draw A frequency curve
    ctx.beginPath();
    ctx.strokeStyle = COLORS.freqA;
    ctx.lineWidth = 2;
    history.forEach((h, i) => {
      const x = chartX + (h.generation / maxGen) * chartW;
      const y = chartY + chartH - h.freqA * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw a frequency curve
    ctx.beginPath();
    ctx.strokeStyle = COLORS.freqa;
    ctx.lineWidth = 2;
    history.forEach((h, i) => {
      const x = chartX + (h.generation / maxGen) * chartW;
      const y = chartY + chartH - h.freqa * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current point pulse
    const lastH = history[history.length - 1];
    const lastX = chartX + (lastH.generation / maxGen) * chartW;
    const lastYA = chartY + chartH - lastH.freqA * chartH;
    const lastYa = chartY + chartH - lastH.freqa * chartH;
    const pulseRadius = 3 + Math.sin(timestamp * 0.005) * 2;

    ctx.fillStyle = COLORS.freqA;
    ctx.beginPath();
    ctx.arc(lastX, lastYA, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.freqa;
    ctx.beginPath();
    ctx.arc(lastX, lastYa, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Legend
    ctx.font = "bold 11px Manrope, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.freqA;
    ctx.fillRect(chartX + 10, chartY + 10, 12, 12);
    ctx.fillStyle = "#182544";
    ctx.fillText("A", chartX + 26, chartY + 20);

    ctx.fillStyle = COLORS.freqa;
    ctx.fillRect(chartX + 50, chartY + 10, 12, 12);
    ctx.fillStyle = "#182544";
    ctx.fillText("a", chartX + 66, chartY + 20);

    // Fixation marker
    if (fixationReached) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(lastX - 40, lastYA - 25, 80, 20);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 10px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ 固定", lastX, lastYA - 12);
      ctx.restore();
    }
  }, [fixationReached]);

  // Render HUD
  const renderHUD = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number, phase: Phase, phaseProgress: number) => {
    const freq = historyRef.current[historyRef.current.length - 1];
    if (!freq) return;

    ctx.fillStyle = "#182544";
    ctx.font = "bold 14px Manrope, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`第 ${freq.generation} 代`, 20, 30);

    ctx.font = "12px Manrope, sans-serif";
    ctx.fillText(`AA: ${freq.countAA}  Aa: ${freq.countAa}  aa: ${freq.countaa}`, 20, 50);
    ctx.fillText(`A 频率: ${freq.freqA.toFixed(3)}  a 频率: ${freq.freqa.toFixed(3)}`, 20, 70);

    // Phase indicator
    if (phase === "SELECTION") {
      const scannedCount = populationRef.current.filter(i => {
        const yPx = (i.y / 100) * ch;
        return yPx <= phaseProgress * ch;
      }).length;
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`选择进行中... 已审判 ${scannedCount}/${populationRef.current.length} 个体`, 20, 90);
    } else if (phase === "REPRODUCTION") {
      ctx.fillStyle = "#22c55e";
      ctx.fillText(`第 ${freq.generation} 代繁殖中...`, 20, 90);
    }
  }, []);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y };

    const cw = rect.width;
    const ch = rect.height;

    let hovered: Individual | null = null;
    for (const ind of populationRef.current) {
      if (ind.state === "dying") continue;
      const xPx = (ind.x / 100) * cw * 0.7;
      const yPx = (ind.y / 100) * ch;
      const dist = Math.sqrt((x - xPx) ** 2 + (y - yPx) ** 2);
      if (dist < INDIVIDUAL_RADIUS * 1.5) {
        hovered = ind;
        break;
      }
    }

    hoveredIndividualRef.current = hovered;
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredIndividualRef.current = null;
  }, []);

  // Control handlers
  const handleStart = useCallback(() => {
    if (!interactive || running) return;
    initPopulation();
    setRunning(true);
    phaseRef.current = "STABLE";
    phaseStartRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
  }, [interactive, running, initPopulation, animate]);

  const handleStop = useCallback(() => {
    if (!interactive) return;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    phaseRef.current = "IDLE";
  }, [interactive]);

  const handleReset = useCallback(() => {
    if (!interactive) return;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    phaseRef.current = "IDLE";
    populationRef.current = [];
    deathParticlesRef.current = [];
    matingLinesRef.current = [];
    generationRef.current = 0;
    historyRef.current = [];
    setGeneration(0);
    setHistory([]);
    setFixationReached(false);
  }, [interactive]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Start animation loop when running changes
  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [running, animate]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // Canvas will resize on next frame
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Styles
  const S = {
    host: { display: "block", fontFamily: "Manrope, sans-serif", padding: 24, background: "#faf9f5", borderRadius: 12, color: "#1b1c1a" },
    box: { maxWidth: 1400, margin: "0 auto" },
    title: { fontSize: "1.5rem", fontWeight: 700, color: "#1b1c1a", marginBottom: 24, textAlign: "center" as const },
    ctrlBox: { background: "#fff", padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    group: { marginBottom: 0 },
    label: { display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1b1c1a", marginBottom: 8 },
    rangeVal: { display: "inline-block", marginLeft: 12, fontWeight: 600, color: "#182544" },
    rangeInput: { width: "100%", padding: 0, border: "none" },
    selectInput: { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.9rem", fontFamily: "Manrope, sans-serif", boxSizing: "border-box" as const },
    btnRow: { display: "flex", gap: 12, marginTop: 20 },
    btn: (variant: "primary" | "secondary", disabled: boolean) => ({
      padding: "10px 20px",
      border: "none",
      borderRadius: 6,
      fontSize: "0.9rem",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      color: "#fff",
      background: disabled ? "#9ca3af" : (variant === "primary" ? "#182544" : "#6b7280"),
      opacity: disabled ? 0.6 : 1,
    }),
    canvasContainer: { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 },
    canvas: { width: "100%", height: 600, display: "block", borderRadius: 8 },
    statsBox: { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
    statCard: { padding: 16, background: "#f9fafb", borderRadius: 6, textAlign: "center" as const },
    statLabel: { fontSize: "0.85rem", color: "#6b7280", marginBottom: 8 },
    statValue: { fontSize: "1.5rem", fontWeight: 700, color: "#1b1c1a" },
    empty: { textAlign: "center" as const, padding: "60px 20px", color: "#9ca3af" },
  };

  const curData = history[history.length - 1];

  return (
    <div style={S.host}>
      <div style={S.box}>
        <h2 style={S.title}>🦋 自然选择模拟器</h2>

        {interactive && (
          <>
            <div style={S.ctrlBox}>
              <div style={S.row}>
                <div style={S.group}>
                  <label style={S.label}>种群大小 <span style={S.rangeVal}>{popSize}</span></label>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={10}
                    value={popSize}
                    onChange={e => setPopSize(parseInt(e.target.value, 10))}
                    disabled={running}
                    style={S.rangeInput}
                  />
                </div>
                <div style={S.group}>
                  <label style={S.label}>初始 A 等位基因频率 <span style={S.rangeVal}>{initFreq.toFixed(2)}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={initFreq}
                    onChange={e => setInitFreq(parseFloat(e.target.value))}
                    disabled={running}
                    style={S.rangeInput}
                  />
                </div>
              </div>
              <div style={S.row}>
                <div style={S.group}>
                  <label style={S.label}>环境类型</label>
                  <select
                    style={S.selectInput}
                    value={envType}
                    onChange={e => setEnvType(e.target.value)}
                    disabled={running}
                  >
                    <option value="dark">深色环境（有利于深色个体）</option>
                    <option value="light">浅色环境（有利于浅色个体）</option>
                  </select>
                </div>
                <div style={S.group}>
                  <label style={S.label}>选择压力强度 <span style={S.rangeVal}>{selStr.toFixed(2)}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={selStr}
                    onChange={e => setSelStr(parseFloat(e.target.value))}
                    disabled={running}
                    style={S.rangeInput}
                  />
                </div>
              </div>

              <div style={S.btnRow}>
                <button style={S.btn("primary", running)} onClick={handleStart} disabled={running}>
                  开始模拟
                </button>
                <button style={S.btn("secondary", !running)} onClick={handleStop} disabled={!running}>
                  停止
                </button>
                <button style={S.btn("secondary", running)} onClick={handleReset} disabled={running}>
                  重置
                </button>
              </div>
            </div>

            {running || history.length > 0 ? (
              <>
                <div style={S.canvasContainer} ref={containerRef}>
                  <canvas
                    ref={canvasRef}
                    style={S.canvas}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>

                {curData && (
                  <div style={S.statsBox}>
                    <div style={S.statsGrid}>
                      <div style={S.statCard}>
                        <div style={S.statLabel}>当前世代</div>
                        <div style={S.statValue}>{curData.generation}</div>
                      </div>
                      <div style={S.statCard}>
                        <div style={S.statLabel}>AA 个体</div>
                        <div style={S.statValue}>{curData.countAA}</div>
                      </div>
                      <div style={S.statCard}>
                        <div style={S.statLabel}>Aa 个体</div>
                        <div style={S.statValue}>{curData.countAa}</div>
                      </div>
                      <div style={S.statCard}>
                        <div style={S.statLabel}>aa 个体</div>
                        <div style={S.statValue}>{curData.countaa}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={S.statsBox}>
                <div style={S.empty}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧬</div>
                  <div>点击"开始模拟"按钮运行自然选择模拟</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

