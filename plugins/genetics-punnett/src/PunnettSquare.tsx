import { useState, useEffect, useMemo } from "react";

interface A2UINode {
  properties?: Record<string, unknown>;
}

function parseStr(val: unknown, fallback: string): string {
  return typeof val === "string" && val.length > 0 ? val : fallback;
}

function parseBool(val: unknown, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback;
}

function parseNum(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function parseArr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

interface TraitDefinition {
  name: string;
  dominantTrait: string;
  recessiveTrait: string;
  incompleteDominance?: boolean;
  intermediateTrait?: string;
}

interface GenotypeData {
  genotype: string;
  phenotype: string;
  phenotypeDetail: string;
}

interface CellInfo {
  row: number;
  col: number;
  genotype: string;
  phenotype: string;
  phenotypeDetail: string;
  parentGamete: string;
  motherGamete: string;
}

const S: Record<string, React.CSSProperties> = {
  container: { background: "#faf9f5", borderRadius: 12, padding: 16, fontFamily: "Manrope, sans-serif", color: "#1b1c1a", maxWidth: 640, width: "100%", boxSizing: "border-box", lineHeight: 1.6 },
  title: { fontSize: 16, fontWeight: 700, color: "#182544", textAlign: "center" as const, marginBottom: 12 },
  section: { marginTop: 12, padding: 12, background: "#fff", borderRadius: 8, outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px" },
  sectionTitle: { fontWeight: 700, color: "#182544", marginBottom: 8, fontSize: 13 },
  row: { display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" },
  label: { fontSize: 12, color: "#6b7280" },
  mono: { fontFamily: "monospace", fontWeight: 700, color: "#182544", fontSize: 13 },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
};

function getGametes(genotype: string): string[] {
  if (!genotype || genotype.length === 0 || genotype.length % 2 !== 0) return [];
  const genePairs: string[][] = [];
  for (let i = 0; i < genotype.length; i += 2) {
    genePairs.push([genotype[i], genotype[i + 1]]);
  }
  return cartesianProduct(genePairs).map((g) => g.join(""));
}

function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map((x) => [x]);
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  const result: string[][] = [];
  for (const item of first) {
    for (const combo of restProduct) {
      result.push([item, ...combo]);
    }
  }
  return result;
}

function combineGametes(g1: string, g2: string): string {
  if (g1.length !== g2.length) return g1 + g2;
  let result = "";
  for (let i = 0; i < g1.length; i++) {
    const pair = [g1[i], g2[i]].sort((a, b) => {
      if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
      if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
      return a.localeCompare(b);
    });
    result += pair.join("");
  }
  return result;
}

function determinePhenotype(genotype: string, traitDefs: TraitDefinition[], incompleteDom: boolean, intermediateName: string): { code: string; display: string } {
  if (traitDefs.length > 0) {
    return determinePhenotypeWithTraits(genotype, traitDefs);
  }
  const geneCount = genotype.length / 2;
  if (geneCount === 1) {
    const allUpper = genotype === genotype.toUpperCase();
    const allLower = genotype === genotype.toLowerCase();
    if (allUpper) return { code: "dominant", display: "显性纯合" };
    if (allLower) return { code: "recessive", display: "隐性纯合" };
    if (incompleteDom) return { code: "intermediate", display: intermediateName };
    return { code: "heterozygous", display: "杂合" };
  }
  const phenoParts: string[] = [];
  const detailParts: string[] = [];
  for (let i = 0; i < genotype.length; i += 2) {
    const pair = genotype.slice(i, i + 2);
    const allUpper = pair === pair.toUpperCase();
    const allLower = pair === pair.toLowerCase();
    if (allUpper) { detailParts.push("显性纯合"); }
    else if (allLower) { detailParts.push("隐性纯合"); }
    else { detailParts.push(incompleteDom ? intermediateName : "杂合"); }
    const hasDominant = pair.split("").some(ch => ch === ch.toUpperCase() && ch !== ch.toLowerCase());
    phenoParts.push(hasDominant ? "显性" : "隐性");
  }
  return { code: phenoParts.join("-"), display: detailParts.join("-") };
}

function determinePhenotypeWithTraits(genotype: string, traitDefs: TraitDefinition[]): { code: string; display: string } {
  const parts: string[] = [];
  for (let i = 0; i < genotype.length && i / 2 < traitDefs.length; i += 2) {
    const pair = genotype.slice(i, i + 2);
    const trait = traitDefs[i / 2];
    const upperCount = (pair.match(/[A-Z]/g) || []).length;
    if (trait.incompleteDominance) {
      if (upperCount === 2) parts.push(trait.dominantTrait);
      else if (upperCount === 1) parts.push(trait.intermediateTrait || "中间型");
      else parts.push(trait.recessiveTrait);
    } else {
      parts.push(upperCount >= 1 ? trait.dominantTrait : trait.recessiveTrait);
    }
  }
  const display = parts.join("-");
  return { code: display, display };
}

function calculateOffspring(parent1: string, parent2: string, traitDefs: TraitDefinition[], incompleteDom: boolean, intermediateName: string): GenotypeData[] {
  const gametes1 = getGametes(parent1);
  const gametes2 = getGametes(parent2);
  if (gametes1.length === 0 || gametes2.length === 0) return [];
  const offspring: GenotypeData[] = [];
  for (const g1 of gametes1) {
    for (const g2 of gametes2) {
      const genotype = combineGametes(g1, g2);
      const { code, display } = determinePhenotype(genotype, traitDefs, incompleteDom, intermediateName);
      offspring.push({ genotype, phenotype: code, phenotypeDetail: display });
    }
  }
  return offspring;
}

function getPhenotypeRatios(offspring: GenotypeData[]): Map<string, number> {
  const ratios = new Map<string, number>();
  for (const item of offspring) {
    ratios.set(item.phenotype, (ratios.get(item.phenotype) || 0) + 1);
  }
  return ratios;
}

function getGenotypeRatios(offspring: GenotypeData[]): Map<string, number> {
  const ratios = new Map<string, number>();
  for (const item of offspring) {
    ratios.set(item.genotype, (ratios.get(item.genotype) || 0) + 1);
  }
  return ratios;
}

function getPhenotypeDisplayName(phenotype: string, traitDefs: TraitDefinition[]): string {
  if (traitDefs.length > 0) return phenotype;
  const labels: Record<string, string> = {
    dominant: "显性性状", recessive: "隐性性状", heterozygous: "显性性状（杂合）",
  };
  if (labels[phenotype]) return labels[phenotype];
  return phenotype;
}

const PALETTE = [
  "#2d7d46", "#b8860b", "#8b5cf6", "#0891b2", "#dc2626",
  "#0d9488", "#c026d3", "#4f46e5", "#ca8a04", "#be123c",
];

const colorCache = new Map<string, string>();
let colorIdx = 0;

function getPhenotypeColor(code: string): string {
  if (colorCache.has(code)) return colorCache.get(code)!;
  if (code === "dominant" || code === "heterozygous") {
    const c = code === "dominant" ? PALETTE[0] : PALETTE[1];
    colorCache.set(code, c);
    return c;
  }
  if (code === "recessive") {
    colorCache.set(code, PALETTE[2]);
    return PALETTE[2];
  }
  const c = PALETTE[colorIdx % PALETTE.length];
  colorIdx++;
  colorCache.set(code, c);
  return c;
}

function resetColorCache() {
  colorCache.clear();
  colorIdx = 3;
}

function getPhenotypeBg(code: string): string {
  const c = getPhenotypeColor(code);
  return c + "18";
}

function getCellExplanation(cell: CellInfo, traitDefs: TraitDefinition[], total: number, parent1: string, parent2: string): string {
  const phenoDisplay = traitDefs.length > 0 ? cell.phenotype : getPhenotypeDisplayName(cell.phenotype, traitDefs);
  const prob = (1 / total * 100).toFixed(1);
  const geneCount = parent1.length / 2;

  let explanation = `父本配子 [${cell.parentGamete}] × 母本配子 [${cell.motherGamete}] → 基因型 ${cell.genotype}`;
  explanation += `\n\n出现概率：1/${total} = ${prob}%`;

  if (geneCount === 1) {
    if (cell.genotype === cell.genotype.toUpperCase()) {
      explanation += `\n\n纯合显性：两个等位基因均为显性（${cell.genotype}），表现为${phenoDisplay}。`;
    } else if (cell.genotype === cell.genotype.toLowerCase()) {
      explanation += `\n\n纯合隐性：两个等位基因均为隐性（${cell.genotype}），表现为${phenoDisplay}。`;
    } else {
      explanation += `\n\n杂合子：含一个显性、一个隐性等位基因（${cell.genotype}），显性基因掩盖隐性基因，表现为${phenoDisplay}。`;
    }
  } else {
    explanation += `\n\n表型：${cell.phenotypeDetail}`;
  }
  return explanation;
}

function renderRatioBar(percent: number, color: string) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${percent}%`, borderRadius: 4, background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

export default function PunnettSquare({ node }: { node: A2UINode }) {
  const props = node.properties ?? {};

  const parent1 = parseStr(props.parent1Genotype, "Aa");
  const parent2 = parseStr(props.parent2Genotype, "Aa");
  const trait = parseStr(props.trait, "");
  const showPhenotype = parseBool(props.showPhenotype, true);
  const interactive = parseBool(props.interactive, true);
  const traitDefs = parseArr<TraitDefinition>(props.traitDefinitions);
  const fatherLabel = parseStr(props.fatherLabel, "父本");
  const motherLabel = parseStr(props.motherLabel, "母本");
  const fatherPhenotype = parseStr(props.fatherPhenotype, "");
  const motherPhenotype = parseStr(props.motherPhenotype, "");
  const incompleteDominance = parseBool(props.incompleteDominance, false);
  const intermediateTrait = parseStr(props.intermediateTrait, "中间型");

  const [selectedCell, setSelectedCell] = useState<CellInfo | null>(null);

  useEffect(() => {
    resetColorCache();
    setSelectedCell(null);
  }, [parent1, parent2, JSON.stringify(traitDefs)]);

  const handleCellClick = (row: number, col: number, item: GenotypeData, parentGamete: string, motherGamete: string) => {
    if (!interactive) return;
    console.log('Cell clicked:', { row, col, genotype: item.genotype });
    setSelectedCell(prev => {
      if (prev && prev.row === row && prev.col === col) return null;
      return {
        row, col, genotype: item.genotype, phenotype: item.phenotype, phenotypeDetail: item.phenotypeDetail,
        parentGamete, motherGamete,
      };
    });
  };

  const offspring = useMemo(() =>
    calculateOffspring(parent1, parent2, traitDefs, incompleteDominance, intermediateTrait),
    [parent1, parent2, traitDefs, incompleteDominance, intermediateTrait]
  );
  const gametes1 = useMemo(() => getGametes(parent1), [parent1]);
  const gametes2 = useMemo(() => getGametes(parent2), [parent2]);

  if (offspring.length === 0) {
    return (
      <div style={{ background: "#faf9f5", borderRadius: 12, padding: 24, textAlign: "center", color: "#6b7280", fontFamily: "Manrope, sans-serif", fontStyle: "italic" }}>
        请输入有效的基因型（例如：Aa, AaBb）
      </div>
    );
  }

  const phenotypeRatios = getPhenotypeRatios(offspring);
  const genotypeRatios = getGenotypeRatios(offspring);
  const geneCount = parent1.length / 2;
  const isTwoGene = geneCount === 2;
  const sortedGenotypes = Array.from(genotypeRatios.entries()).sort((a, b) => b[1] - a[1]);
  const sortedPhenotypes = Array.from(phenotypeRatios.entries()).sort((a, b) => b[1] - a[1]);

  const p1Display = fatherPhenotype ? `${parent1}（${fatherPhenotype}）` : parent1;
  const p2Display = motherPhenotype ? `${parent2}（${motherPhenotype}）` : parent2;

  function getGameteProbabilityLabel(gamete: string, parentGenotype: string): string {
    const allGametes = getGametes(parentGenotype);
    const count = allGametes.filter(g => g === gamete).length;
    return count > 0 ? `${count}/${allGametes.length}` : "";
  }

  function GenotypeRatioSection() {
    if (!showPhenotype) return null;
    return (
      <div style={S.section}>
        <div style={S.sectionTitle}>子代基因型比例</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {sortedGenotypes.map(([geno, count]) => {
            const pct = (count / offspring.length * 100).toFixed(1);
            return (
              <div key={geno} style={{ flex: "1 1 100px", minWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ ...S.mono, fontSize: 14 }}>{geno}</span>
                </div>
                {renderRatioBar(Number(pct), "#182544")}
                <div style={{ ...S.label, marginTop: 2 }}>{count}/{offspring.length} = {pct}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          基因型比例 = {sortedGenotypes.map(([, c]) => c).join(":")}
        </div>
      </div>
    );
  }

  function PhenotypeRatioSection() {
    if (!showPhenotype) return null;
    return (
      <div style={S.section}>
        <div style={S.sectionTitle}>子代表型比例</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {sortedPhenotypes.map(([pheno, count]) => {
            const pct = (count / offspring.length * 100).toFixed(1);
            const displayName = traitDefs.length > 0 ? pheno : getPhenotypeDisplayName(pheno, traitDefs);
            const color = getPhenotypeColor(pheno);
            return (
              <div key={pheno} style={{ flex: "1 1 120px", minWidth: 120 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</span>
                </div>
                {renderRatioBar(Number(pct), color)}
                <div style={{ ...S.label, marginTop: 2 }}>{count}/{offspring.length} = {pct}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          表型比例 = {sortedPhenotypes.map(([, c]) => c).join(":")}
          {" "}&#x2248;{" "}
          {(() => {
            const g = gcdArray(sortedPhenotypes.map(([, c]) => c));
            return sortedPhenotypes.map(([, c]) => c / g).join(":");
          })()}
        </div>
      </div>
    );
  }

  function TraitDefsSection() {
    if (traitDefs.length === 0) return null;
    return (
      <div style={S.section}>
        <div style={S.sectionTitle}>性状定义</div>
        {traitDefs.map((t, i) => {
          const letter = String.fromCharCode(65 + i);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4, fontSize: 13 }}>
              <span style={{ ...S.badge, background: "rgba(24,37,68,0.08)", color: "#182544" }}>{t.name}</span>
              <span style={S.mono}>{letter}{letter}</span>
              <span>= {t.dominantTrait}</span>
              <span style={{ color: "#d1d5db" }}>|</span>
              {t.incompleteDominance && t.intermediateTrait && (
                <>
                  <span style={S.mono}>{letter}{letter.toLowerCase()}</span>
                  <span>= {t.intermediateTrait}</span>
                  <span style={{ color: "#d1d5db" }}>|</span>
                </>
              )}
              <span style={S.mono}>{letter.toLowerCase()}{letter.toLowerCase()}</span>
              <span>= {t.recessiveTrait}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function ParentsSection() {
    return (
      <div style={{ marginTop: 10, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 14px", background: "rgba(24,37,68,0.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "#182544", fontWeight: 600, marginBottom: 2 }}>
              {fatherLabel} ♂
            </div>
            <div style={S.mono}>{parent1}</div>
            {fatherPhenotype && <div style={{ fontSize: 11, color: "#6b7280" }}>{fatherPhenotype}</div>}
          </div>
          <div style={{ fontSize: 18, color: "#6b7280", fontWeight: 300 }}>x</div>
          <div style={{ padding: "8px 14px", background: "rgba(119,90,25,0.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "#775a19", fontWeight: 600, marginBottom: 2 }}>
              {motherLabel} ♀
            </div>
            <div style={S.mono}>{parent2}</div>
            {motherPhenotype && <div style={{ fontSize: 11, color: "#6b7280" }}>{motherPhenotype}</div>}
          </div>
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af" }}>
          P：{fatherLabel} {p1Display} x {motherLabel} {p2Display}
        </div>
      </div>
    );
  }

  function GridSection() {
    const gridCols = gametes1.length;
    return (
      <div style={{ overflowX: "auto", marginTop: 12, maxWidth: "100%" }}>
        <table style={{ borderCollapse: "collapse", margin: "0 auto", background: "#fff", borderRadius: 8, overflow: "hidden", outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px" }}>
          <thead>
            <tr>
              <th style={{ width: 56, height: 56, background: "#f3f4f6", outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px", fontSize: 10, color: "#9ca3af", position: "relative" }}>
                <div style={{ position: "absolute", top: 4, right: 6, color: "#182544", fontSize: 9 }}>♂配子</div>
                <div style={{ position: "absolute", bottom: 4, left: 6, color: "#775a19", fontSize: 9 }}>♀配子</div>
              </th>
              {gametes1.map((g, i) => (
                <th key={i} style={{ padding: "8px 10px", background: "rgba(24,37,68,0.04)", outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px", fontWeight: 700, fontSize: 13, color: "#182544", fontFamily: "monospace", minWidth: 64, textAlign: "center" }}>
                  <div>{g}</div>
                  <div style={{ fontSize: 9, fontWeight: 400, color: "#93a3be" }}>P={getGameteProbabilityLabel(g, parent1)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gametes2.map((g2, row) => (
              <tr key={row}>
                <td style={{ padding: "8px 10px", background: "rgba(119,90,25,0.04)", outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px", fontWeight: 700, fontSize: 13, color: "#775a19", fontFamily: "monospace", textAlign: "center" }}>
                  <div>{g2}</div>
                  <div style={{ fontSize: 9, fontWeight: 400, color: "#b89e6a" }}>P={getGameteProbabilityLabel(g2, parent2)}</div>
                </td>
                {gametes1.map((g1, col) => {
                  const idx = row * gridCols + col;
                  const item = offspring[idx];
                  if (!item) return null;
                  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                  const isPure = item.genotype === item.genotype.toUpperCase() || item.genotype === item.genotype.toLowerCase();
                  const phenoColor = getPhenotypeColor(item.phenotype);
                  const displayName = traitDefs.length > 0 ? item.phenotype : getPhenotypeDisplayName(item.phenotype, traitDefs);
                  return (
                    <td key={col}
                      onClick={() => handleCellClick(row, col, item, gametes1[col], gametes2[row])}
                      style={{
                        padding: "6px 10px",
                        outline: "1px solid rgba(197,198,207,0.15)",
                        outlineOffset: "-1px",
                        textAlign: "center",
                        cursor: interactive ? "pointer" : "default",
                        background: isSelected ? "rgba(24,37,68,0.08)" : showPhenotype ? getPhenotypeBg(item.phenotype) : "#fff",
                        outlineWidth: isSelected ? 2 : isPure ? 1 : 0,
                        outlineStyle: isSelected ? "solid" : isPure ? "solid" : "none",
                        outlineColor: isSelected ? "#182544" : "rgba(197,198,207,0.15)",
                        transition: "background 0.15s",
                        minWidth: 64,
                      }}
                    >
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#1b1c1a" }}>{item.genotype}</div>
                      {showPhenotype && (
                        <div style={{ fontSize: 10, color: phenoColor, marginTop: 2, fontWeight: 500 }}>{displayName}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function CellTooltip() {
    console.log('CellTooltip render, selectedCell:', selectedCell);
    if (!selectedCell || !interactive) return null;
    const explanation = getCellExplanation(selectedCell, traitDefs, offspring.length, parent1, parent2);
    return (
      <div style={{ ...S.section, borderLeft: "3px solid #182544", marginTop: 12, overflow: "hidden" }}>
        <div style={{ ...S.sectionTitle, fontSize: 14 }}>格子详情</div>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "4px 12px", fontSize: 13, wordBreak: "break-word", overflowWrap: "break-word" }}>
          <span style={S.label}>位置：</span>
          <span>第 {selectedCell.row + 1} 行, 第 {selectedCell.col + 1} 列</span>
          <span style={S.label}>配子：</span>
          <span style={S.mono}>♂[{selectedCell.parentGamete}] x ♀[{selectedCell.motherGamete}]</span>
          <span style={S.label}>基因型：</span>
          <span style={S.mono}>{selectedCell.genotype}</span>
          <span style={S.label}>表型：</span>
          <span>{selectedCell.phenotypeDetail}</span>
          <span style={S.label}>概率：</span>
          <span>1/{offspring.length} = {(1 / offspring.length * 100).toFixed(1)}%</span>
        </div>
        <div style={{ marginTop: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12, color: "#475569", whiteSpace: "pre-line", lineHeight: 1.7, wordBreak: "break-word" }}>
          {explanation}
        </div>
      </div>
    );
  }

  function TwoGeneBreakdown() {
    if (!isTwoGene || !showPhenotype) return null;
    const genotypeCounts = new Map<string, number>();
    for (const item of offspring) {
      genotypeCounts.set(item.genotype, (genotypeCounts.get(item.genotype) || 0) + 1);
    }
    const letter1 = parent1[0].toUpperCase();
    const letter2 = parent1[2].toUpperCase();
    const pureDominant = genotypeCounts.get(`${letter1}${letter1}${letter2}${letter2}`) || 0;
    const doubleHet = genotypeCounts.get(`${letter1}${letter1.toLowerCase()}${letter2}${letter2.toLowerCase()}`) || 0;
    return (
      <div style={{ ...S.section, marginTop: 12 }}>
        <div style={S.sectionTitle}>双基因自由组合拆解</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
          <div>9:3:3:1 比例来源：两对等位基因独立遗传，各自遵循 3:1 分离比。</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>纯合显性：</span>{pureDominant}/{offspring.length}
            <span style={{ margin: "0 8px", color: "#d1d5db" }}>|</span>
            <span style={{ fontWeight: 600 }}>双杂合子：</span>{doubleHet}/{offspring.length}
          </div>
        </div>
      </div>
    );
  }

  function LegendSection() {
    if (!showPhenotype) return null;
    return (
      <div style={{ ...S.row, marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, outline: "1px solid rgba(197,198,207,0.15)", outlineOffset: "-1px", fontSize: 12, color: "#6b7280" }}>
        {sortedPhenotypes.map(([pheno]) => {
          const displayName = traitDefs.length > 0 ? pheno : getPhenotypeDisplayName(pheno, traitDefs);
          return (
            <div key={pheno} style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: getPhenotypeColor(pheno) }} />
              <span>{displayName}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  function gcdArray(arr: number[]): number {
    return arr.reduce((g, n) => gcd(g, n));
  }

  return (
    <div style={S.container}>
      <div style={S.title}>{trait || "孟德尔方格图（Punnett Square）"}</div>

      <TraitDefsSection />
      <ParentsSection />
      <GridSection />
      <CellTooltip />
      <GenotypeRatioSection />
      <PhenotypeRatioSection />
      <TwoGeneBreakdown />
      <LegendSection />
    </div>
  );
}
