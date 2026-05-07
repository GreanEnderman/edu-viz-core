import { m as __name } from "./chunk-K5T4RW27-4f-I-LKV.js";
import "./chunk-7N4EOEYR-B-LI1RID.js";
import "./chunk-67CJDMHE-Dmkeeok1.js";
import "./chunk-KGLVRYIC-DpGCB7py.js";
import "./chunk-FOC6F5B3-DKQsAbZq.js";
import "./chunk-AA7GKIK3-C1lF4Cov.js";
import "./chunk-2KRD3SAO-Co4zeHI3.js";
import "./chunk-ORNJ4GCN-BEgrBOJt.js";
import "./chunk-LIHQZDEY-CTEiDKTe.js";
import "./chunk-CIAEETIT-C0xSSAw0.js";
//#region ../node_modules/@mermaid-js/parser/dist/mermaid-parser.core.mjs
var parsers = {};
var initializers = {
	info: /* @__PURE__ */ __name(async () => {
		const { createInfoServices: createInfoServices2 } = await import("./info-OMHHGYJF-BfmF3HyQ.js");
		parsers.info = createInfoServices2().Info.parser.LangiumParser;
	}, "info"),
	packet: /* @__PURE__ */ __name(async () => {
		const { createPacketServices: createPacketServices2 } = await import("./packet-4T2RLAQJ-BzPMVgnO.js");
		parsers.packet = createPacketServices2().Packet.parser.LangiumParser;
	}, "packet"),
	pie: /* @__PURE__ */ __name(async () => {
		const { createPieServices: createPieServices2 } = await import("./pie-ZZUOXDRM-vPzUpkCY.js");
		parsers.pie = createPieServices2().Pie.parser.LangiumParser;
	}, "pie"),
	treeView: /* @__PURE__ */ __name(async () => {
		const { createTreeViewServices: createTreeViewServices2 } = await import("./treeView-SZITEDCU-CZlEO9OW.js");
		parsers.treeView = createTreeViewServices2().TreeView.parser.LangiumParser;
	}, "treeView"),
	architecture: /* @__PURE__ */ __name(async () => {
		const { createArchitectureServices: createArchitectureServices2 } = await import("./architecture-YZFGNWBL-DtV9pWjU.js");
		parsers.architecture = createArchitectureServices2().Architecture.parser.LangiumParser;
	}, "architecture"),
	gitGraph: /* @__PURE__ */ __name(async () => {
		const { createGitGraphServices: createGitGraphServices2 } = await import("./gitGraph-7Q5UKJZL-BIsmbmUK.js");
		parsers.gitGraph = createGitGraphServices2().GitGraph.parser.LangiumParser;
	}, "gitGraph"),
	radar: /* @__PURE__ */ __name(async () => {
		const { createRadarServices: createRadarServices2 } = await import("./radar-PYXPWWZC-DQQDjIg0.js");
		parsers.radar = createRadarServices2().Radar.parser.LangiumParser;
	}, "radar"),
	treemap: /* @__PURE__ */ __name(async () => {
		const { createTreemapServices: createTreemapServices2 } = await import("./treemap-W4RFUUIX-Bcdxq2aP.js");
		parsers.treemap = createTreemapServices2().Treemap.parser.LangiumParser;
	}, "treemap"),
	wardley: /* @__PURE__ */ __name(async () => {
		const { createWardleyServices: createWardleyServices2 } = await import("./wardley-RL74JXVD-B25BC8c5.js");
		parsers.wardley = createWardleyServices2().Wardley.parser.LangiumParser;
	}, "wardley")
};
async function parse(diagramType, text) {
	const initializer = initializers[diagramType];
	if (!initializer) throw new Error(`Unknown diagram type: ${diagramType}`);
	if (!parsers[diagramType]) await initializer();
	const result = parsers[diagramType].parse(text);
	if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) throw new MermaidParseError(result);
	return result.value;
}
__name(parse, "parse");
var MermaidParseError = class extends Error {
	constructor(result) {
		const lexerErrors = result.lexerErrors.map((err) => {
			return `Lexer error on line ${err.line !== void 0 && !isNaN(err.line) ? err.line : "?"}, column ${err.column !== void 0 && !isNaN(err.column) ? err.column : "?"}: ${err.message}`;
		}).join("\n");
		const parserErrors = result.parserErrors.map((err) => {
			return `Parse error on line ${err.token.startLine !== void 0 && !isNaN(err.token.startLine) ? err.token.startLine : "?"}, column ${err.token.startColumn !== void 0 && !isNaN(err.token.startColumn) ? err.token.startColumn : "?"}: ${err.message}`;
		}).join("\n");
		super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
		this.result = result;
	}
	static {
		__name(this, "MermaidParseError");
	}
};
//#endregion
export { parse as t };

//# sourceMappingURL=mermaid-parser.core-naVDQl-H.js.map