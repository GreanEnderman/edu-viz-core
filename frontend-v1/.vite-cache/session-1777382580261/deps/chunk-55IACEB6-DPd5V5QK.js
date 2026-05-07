import { B as select_default, H as __name } from "./src-hPY6rTsk.js";
//#region ../node_modules/mermaid/dist/chunks/mermaid.core/chunk-55IACEB6.mjs
var getDiagramElement = /* @__PURE__ */ __name((id, securityLevel) => {
	let sandboxElement;
	if (securityLevel === "sandbox") sandboxElement = select_default("#i" + id);
	return (securityLevel === "sandbox" ? select_default(sandboxElement.nodes()[0].contentDocument.body) : select_default("body")).select(`[id="${id}"]`);
}, "getDiagramElement");
//#endregion
export { getDiagramElement as t };

//# sourceMappingURL=chunk-55IACEB6-DPd5V5QK.js.map