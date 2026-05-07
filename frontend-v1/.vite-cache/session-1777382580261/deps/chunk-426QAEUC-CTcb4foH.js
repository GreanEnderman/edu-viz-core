import { B as select_default, H as __name } from "./src-hPY6rTsk.js";
import { b as getConfig2 } from "./chunk-ICPOFSXX-BwOo0aC0.js";
//#region ../node_modules/mermaid/dist/chunks/mermaid.core/chunk-426QAEUC.mjs
var selectSvgElement = /* @__PURE__ */ __name((id) => {
	const { securityLevel } = getConfig2();
	let root = select_default("body");
	if (securityLevel === "sandbox") root = select_default((select_default(`#i${id}`).node()?.contentDocument ?? document).body);
	return root.select(`#${id}`);
}, "selectSvgElement");
//#endregion
export { selectSvgElement as t };

//# sourceMappingURL=chunk-426QAEUC-CTcb4foH.js.map