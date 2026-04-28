import { useState, useEffect, useCallback, useRef } from "react";

interface A2UINode {
  properties?: Record<string, unknown>;
}

function parseStr(val: unknown, fallback: string): string {
  return typeof val === "string" ? val : fallback;
}

function parseBool(val: unknown, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback;
}

const COMPLEMENTARY: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
const BASE_NAMES: Record<string, string> = { A: "腺嘌呤", T: "胸腺嘧啶", C: "胞嘧啶", G: "鸟嘌呤" };
const BASE_COLORS: Record<string, string> = { A: "#10b981", T: "#ef4444", C: "#3b82f6", G: "#fbbf24" };

function isValidSequence(seq: string): boolean {
  return /^[ATCGatcg]+$/.test(seq);
}

function getSequenceStats(seq: string) {
  const upper = seq.toUpperCase();
  const counts: Record<string, number> = { A: 0, T: 0, C: 0, G: 0 };
  for (const ch of upper) if (counts[ch] !== undefined) counts[ch]++;
  const gcContent = upper.length > 0 ? ((counts.G + counts.C) / upper.length) * 100 : 0;
  return { counts, length: upper.length, gcContent };
}

interface SelectedBaseInfo {
  base: string;
  index: number;
  pair: string;
}

interface BaseHitBox {
  x: number;
  y: number;
  r: number;
  base: string;
  index: number;
}

export default function DNAStructure({ node }: { node: A2UINode }) {
  const props = node.properties ?? {};

  const initSequence = parseStr(props.sequence, "ATCGATCG");
  const initShowLabels = parseBool(props.showLabels, true);
  const initInteractive = parseBool(props.interactive, true);

  const [sequence, setSequence] = useState(initSequence);
  const [showLabels, setShowLabels] = useState(initShowLabels);
  const [interactive, setInteractive] = useState(initInteractive);
  const [selectedBase, setSelectedBase] = useState<SelectedBaseInfo | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 500 });
  const hitBoxesRef = useRef<BaseHitBox[]>([]);

  useEffect(() => { setSequence(initSequence); }, [initSequence]);
  useEffect(() => { setShowLabels(initShowLabels); }, [initShowLabels]);
  useEffect(() => { setInteractive(initInteractive); }, [initInteractive]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        setCanvasSize({ w, h: Math.max(400, Math.min(600, w * 0.8)) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const upperSeq = sequence.toUpperCase();
  const valid = isValidSequence(upperSeq);

  useEffect(() => {
    if (!valid || upperSeq.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvasSize.w * dpr;
    const H = canvasSize.h * dpr;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;

    const ctx = canvas.getContext("2d")!;
    const bases = upperSeq.split("");
    const n = bases.length;

    const helixRadius = Math.min(W * 0.12, 60 * dpr);
    const helixHeight = Math.min(H * 0.7, n * 35 * dpr);
    const turnsPerHeight = n / 10;
    const baseSpacing = helixHeight / n;
    const baseCircleR = 12 * dpr;

    function draw() {
      if (autoRotate) {
        timeRef.current += 0.003;
      }
      const rotationAngle = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#faf9f5");
      grad.addColorStop(1, "#f4f4f0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const startY = (H - helixHeight) / 2;

      const hitBoxes: BaseHitBox[] = [];

      type DrawItem = {
        z: number;
        draw: () => void;
      };
      const drawItems: DrawItem[] = [];

      for (let i = 0; i < n; i++) {
        const y = startY + i * baseSpacing;
        const angle = (i / n) * turnsPerHeight * Math.PI * 2 + rotationAngle;

        const x1 = cx + helixRadius * Math.cos(angle);
        const z1 = Math.sin(angle);

        const x2 = cx + helixRadius * Math.cos(angle + Math.PI);
        const z2 = Math.sin(angle + Math.PI);

        const base1 = bases[i];
        const base2 = COMPLEMENTARY[base1];

        hitBoxes.push({ x: x1, y, r: baseCircleR, base: base1, index: i });
        hitBoxes.push({ x: x2, y, r: baseCircleR, base: base2, index: i });

        if (i < n - 1) {
          const nextY = startY + (i + 1) * baseSpacing;
          const nextAngle = ((i + 1) / n) * turnsPerHeight * Math.PI * 2 + rotationAngle;
          const nextX1 = cx + helixRadius * Math.cos(nextAngle);
          const nextZ1 = Math.sin(nextAngle);
          const nextX2 = cx + helixRadius * Math.cos(nextAngle + Math.PI);
          const nextZ2 = Math.sin(nextAngle + Math.PI);

          drawItems.push({
            z: z1,
            draw: () => {
              const alpha = 0.5 + 0.5 * ((z1 + 1) / 2);
              ctx.strokeStyle = `rgba(100, 150, 200, ${alpha * 0.7})`;
              ctx.lineWidth = 3 * dpr;
              ctx.beginPath();
              ctx.moveTo(x1, y);
              ctx.lineTo(nextX1, nextY);
              ctx.stroke();
            }
          });

          drawItems.push({
            z: z2,
            draw: () => {
              const alpha = 0.5 + 0.5 * ((z2 + 1) / 2);
              ctx.strokeStyle = `rgba(100, 150, 200, ${alpha * 0.7})`;
              ctx.lineWidth = 3 * dpr;
              ctx.beginPath();
              ctx.moveTo(x2, y);
              ctx.lineTo(nextX2, nextY);
              ctx.stroke();
            }
          });
        }

        const isAT = base1 === "A" || base1 === "T";
        const hbCount = isAT ? 2 : 3;
        const avgZ = (z1 + z2) / 2;

        drawItems.push({
          z: avgZ,
          draw: () => {
            const alpha = 0.4 + 0.6 * ((avgZ + 1) / 2);
            for (let h = 0; h < hbCount; h++) {
              const offset = ((h - (hbCount - 1) / 2) * 3) * dpr;
              ctx.strokeStyle = `rgba(200, 200, 200, ${alpha * 0.6})`;
              ctx.lineWidth = 1.5 * dpr;
              ctx.setLineDash([2 * dpr, 2 * dpr]);
              ctx.beginPath();
              ctx.moveTo(x1, y + offset);
              ctx.lineTo(x2, y + offset);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        });

        drawItems.push({
          z: z1,
          draw: () => {
            const alpha = 0.5 + 0.5 * ((z1 + 1) / 2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = BASE_COLORS[base1];
            ctx.beginPath();
            ctx.arc(x1, y, baseCircleR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2 * dpr;
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = `bold ${10 * dpr}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(base1, x1, y);
            ctx.globalAlpha = 1;
          }
        });

        drawItems.push({
          z: z2,
          draw: () => {
            const alpha = 0.5 + 0.5 * ((z2 + 1) / 2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = BASE_COLORS[base2];
            ctx.beginPath();
            ctx.arc(x2, y, baseCircleR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2 * dpr;
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = `bold ${10 * dpr}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(base2, x2, y);
            ctx.globalAlpha = 1;
          }
        });
      }

      drawItems.sort((a, b) => a.z - b.z);
      drawItems.forEach(item => item.draw());

      ctx.fillStyle = "#6b7280";
      ctx.font = `${12 * dpr}px Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("5'", cx - helixRadius - 25 * dpr, startY - 10 * dpr);
      ctx.fillText("3'", cx - helixRadius - 25 * dpr, startY + helixHeight + 10 * dpr);
      ctx.fillText("3'", cx + helixRadius + 25 * dpr, startY - 10 * dpr);
      ctx.fillText("5'", cx + helixRadius + 25 * dpr, startY + helixHeight + 10 * dpr);

      hitBoxesRef.current = hitBoxes;

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [valid, upperSeq, showLabels, autoRotate, canvasSize]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mx = (e.clientX - rect.left) * dpr;
      const my = (e.clientY - rect.top) * dpr;

      const hitBoxes = hitBoxesRef.current;
      let bestHit: BaseHitBox | null = null;
      let bestZ = -Infinity;

      for (const hb of hitBoxes) {
        const dx = mx - hb.x;
        const dy = my - hb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= hb.r * 1.5) {
          const z = Math.sin(
            (hb.index / (upperSeq.length || 1)) * (upperSeq.length / 10) * Math.PI * 2 + timeRef.current
            + (hitBoxes.indexOf(hb) % 2 === 1 ? Math.PI : 0)
          );
          if (z > bestZ) {
            bestZ = z;
            bestHit = hb;
          }
        }
      }

      if (bestHit) {
        setSelectedBase({ base: bestHit.base, index: bestHit.index, pair: COMPLEMENTARY[bestHit.base] || "?" });
      }
    },
    [interactive, upperSeq]
  );

  const closeModal = useCallback(() => setSelectedBase(null), []);

  if (!valid || upperSeq.length === 0) {
    return (
      <div style={{ background: "#faf9f5", borderRadius: 12, padding: 24, textAlign: "center", color: "#6b7280", fontFamily: "Manrope, sans-serif", fontStyle: "italic" }}>
        {upperSeq.length === 0 ? "请输入 DNA 序列（例如：ATCGATCG）" : "DNA 序列包含无效的碱基。请只使用 A、T、C、G。"}
      </div>
    );
  }

  const stats = getSequenceStats(upperSeq);
  const compStrand = upperSeq.split("").map((b) => COMPLEMENTARY[b] || "?").join("");

  const baseChip = (base: string) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "monospace",
    background: BASE_COLORS[base] || "#e5e7eb",
    color: "#fff",
  });

  return (
    <div ref={containerRef} style={{ background: "#faf9f5", borderRadius: 12, padding: 16, fontFamily: "Manrope, sans-serif", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#182544" }}>DNA 双螺旋结构</div>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            background: autoRotate ? "#182544" : "#f4f4f0",
            fontSize: 12,
            cursor: "pointer",
            color: autoRotate ? "#fff" : "#6b7280",
            fontWeight: 500,
            outline: "none",
          }}
        >
          {autoRotate ? "暂停旋转" : "自动旋转"}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onClick={interactive ? handleCanvasClick : undefined}
        style={{ display: "block", borderRadius: 8, background: "transparent", width: "100%", cursor: interactive ? "pointer" : "default" }}
      />

      <div style={{ marginTop: 12, padding: 12, background: "#ffffff", borderRadius: 8 }}>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#1b1c1a", lineHeight: 1.8, wordBreak: "break-all" }}>
          <strong>5'→3' 链：</strong>{upperSeq}<br />
          <strong>3'→5' 链：</strong>{compStrand}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, padding: 12, background: "#f4f4f0", borderRadius: 8 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>序列长度</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#182544" }}>{stats.length} bp</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>GC 含量</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#182544" }}>{stats.gcContent.toFixed(1)}%</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>碱基对</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#182544" }}>{stats.length}</div>
        </div>
      </div>

      {showLabels && (
        <div style={{ marginTop: 8, padding: 12, background: "#ffffff", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#182544", marginBottom: 8 }}>碱基配对规则</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {(["A", "T", "C", "G"] as const).map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, padding: 4, borderRadius: 4, background: "#faf9f5" }}>
                <div style={baseChip(b) as React.CSSProperties}>{b}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {BASE_NAMES[b]}<br />
                  <span style={{ fontSize: 10 }}>与 {BASE_NAMES[COMPLEMENTARY[b]]} ({COMPLEMENTARY[b]}) · {b === "A" || b === "T" ? 2 : 3} H键</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBase && (
        <>
          <div onClick={closeModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(27, 28, 26, 0.3)", backdropFilter: "blur(4px)", zIndex: 999 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(250, 249, 245, 0.92)", backdropFilter: "blur(20px)", borderRadius: 12, padding: 24, boxShadow: "0px 20px 40px rgba(27, 28, 26, 0.06)", zIndex: 1000, minWidth: 320, maxWidth: 500 }}>
            <button onClick={closeModal} style={{ position: "absolute", top: 16, right: 16, background: "none", outline: "none", fontSize: 20, color: "#6b7280", cursor: "pointer", lineHeight: 1 }}>×</button>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#182544", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid rgba(197, 198, 207, 0.15)" }}>碱基配对详情</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8 }}>
              <p><strong style={{ color: "#182544" }}>选中碱基：</strong>{BASE_NAMES[selectedBase.base]} ({selectedBase.base})</p>
              <p><strong style={{ color: "#182544" }}>配对碱基：</strong>{BASE_NAMES[selectedBase.pair]} ({selectedBase.pair})</p>
              <p><strong style={{ color: "#182544" }}>氢键数量：</strong>{(selectedBase.base === "A" || selectedBase.base === "T") ? 2 : 3} 个</p>
              <p><strong style={{ color: "#182544" }}>配对规则：</strong></p>
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                {(selectedBase.base === "A" || selectedBase.base === "T") ? (
                  <><li>腺嘌呤 (A) 与 胸腺嘧啶 (T) 通过 <strong>2 个氢键</strong> 配对</li><li>嘌呤与嘧啶配对，保持 DNA 双螺旋结构稳定</li></>
                ) : (
                  <><li>鸟嘌呤 (G) 与 胞嘧啶 (C) 通过 <strong>3 个氢键</strong> 配对</li><li>G-C 配对比 A-T 配对更稳定（氢键更多）</li></>
                )}
              </ul>
              <p style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>碱基互补配对是 DNA 复制和遗传信息传递的基础</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
