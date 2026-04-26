//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/styles/behavior.js
var opacityBehavior = `
  &:not([disabled]) {
    cursor: pointer;
    opacity: var(--opacity, 0);
    transition: opacity var(--speed, 0.2s) cubic-bezier(0, 0, 0.3, 1);

    &:hover,
    &:focus {
      opacity: 1;
    }
  }`;
var behavior = `
  ${new Array(21).fill(0).map((_, idx) => {
	return `.behavior-ho-${idx * 5} {
          --opacity: ${idx / 20};
          ${opacityBehavior}
        }`;
}).join("\n")}

  .behavior-o-s {
    overflow: scroll;
  }

  .behavior-o-a {
    overflow: auto;
  }

  .behavior-o-h {
    overflow: hidden;
  }

  .behavior-sw-n {
    scrollbar-width: none;
  }
`;
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/styles/border.js
var border = `
  ${new Array(25).fill(0).map((_, idx) => {
	return `
        .border-bw-${idx} { border-width: ${idx}px; }
        .border-btw-${idx} { border-top-width: ${idx}px; }
        .border-bbw-${idx} { border-bottom-width: ${idx}px; }
        .border-blw-${idx} { border-left-width: ${idx}px; }
        .border-brw-${idx} { border-right-width: ${idx}px; }

        .border-ow-${idx} { outline-width: ${idx}px; }
        .border-br-${idx} { border-radius: ${idx * 4}px; overflow: hidden;}`;
}).join("\n")}

  .border-br-50pc {
    border-radius: 50%;
  }

  .border-bs-s {
    border-style: solid;
  }
`;
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/types/colors.js
var shades = [
	0,
	5,
	10,
	15,
	20,
	25,
	30,
	35,
	40,
	50,
	60,
	70,
	80,
	90,
	95,
	98,
	99,
	100
];
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/styles/utils.js
function merge(...classes) {
	const styles = {};
	for (const clazz of classes) for (const [key, val] of Object.entries(clazz)) {
		const prefix = key.split("-").with(-1, "").join("-");
		const existingKeys = Object.keys(styles).filter((key) => key.startsWith(prefix));
		for (const existingKey of existingKeys) delete styles[existingKey];
		styles[key] = val;
	}
	return styles;
}
function appendToAll(target, exclusions, ...classes) {
	const updatedTarget = structuredClone(target);
	for (const clazz of classes) for (const key of Object.keys(clazz)) {
		const prefix = key.split("-").with(-1, "").join("-");
		for (const [tagName, classesToAdd] of Object.entries(updatedTarget)) {
			if (exclusions.includes(tagName)) continue;
			let found = false;
			for (let t = 0; t < classesToAdd.length; t++) if (classesToAdd[t].startsWith(prefix)) {
				found = true;
				classesToAdd[t] = key;
			}
			if (!found) classesToAdd.push(key);
		}
	}
	return updatedTarget;
}
function createThemeStyles(palettes) {
	const styles = {};
	for (const palette of Object.values(palettes)) for (const [key, val] of Object.entries(palette)) {
		const prop = toProp(key);
		styles[prop] = val;
	}
	return styles;
}
function toProp(key) {
	if (key.startsWith("nv")) return `--nv-${key.slice(2)}`;
	return `--${key[0]}-${key.slice(1)}`;
}
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/styles/colors.js
var color = (src) => `
    ${src.map((key) => {
	const inverseKey = getInverseKey(key);
	return `.color-bc-${key} { border-color: light-dark(var(${toProp(key)}), var(${toProp(inverseKey)})); }`;
}).join("\n")}

    ${src.map((key) => {
	const inverseKey = getInverseKey(key);
	const vals = [`.color-bgc-${key} { background-color: light-dark(var(${toProp(key)}), var(${toProp(inverseKey)})); }`, `.color-bbgc-${key}::backdrop { background-color: light-dark(var(${toProp(key)}), var(${toProp(inverseKey)})); }`];
	for (let o = .1; o < 1; o += .1) vals.push(`.color-bbgc-${key}_${(o * 100).toFixed(0)}::backdrop {
            background-color: light-dark(oklch(from var(${toProp(key)}) l c h / calc(alpha * ${o.toFixed(1)})), oklch(from var(${toProp(inverseKey)}) l c h / calc(alpha * ${o.toFixed(1)})) );
          }
        `);
	return vals.join("\n");
}).join("\n")}

  ${src.map((key) => {
	const inverseKey = getInverseKey(key);
	return `.color-c-${key} { color: light-dark(var(${toProp(key)}), var(${toProp(inverseKey)})); }`;
}).join("\n")}
  `;
var getInverseKey = (key) => {
	const match = key.match(/^([a-z]+)(\d+)$/);
	if (!match) return key;
	const [, prefix, shadeStr] = match;
	const target = 100 - parseInt(shadeStr, 10);
	return `${prefix}${shades.reduce((prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev)}`;
};
var keyFactory = (prefix) => {
	return shades.map((v) => `${prefix}${v}`);
};
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/styles/index.js
var structuralStyles = [
	behavior,
	border,
	[
		color(keyFactory("p")),
		color(keyFactory("s")),
		color(keyFactory("t")),
		color(keyFactory("n")),
		color(keyFactory("nv")),
		color(keyFactory("e")),
		`
    .color-bgc-transparent {
      background-color: transparent;
    }

    :host {
      color-scheme: var(--color-scheme);
    }
  `
	],
	`
  .g-icon {
    font-family: "Material Symbols Outlined", "Google Symbols";
    font-weight: normal;
    font-style: normal;
    font-display: optional;
    font-size: 20px;
    width: 1em;
    height: 1em;
    user-select: none;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    overflow: hidden;

    font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 48,
      "ROND" 100;

    &.filled {
      font-variation-settings: "FILL" 1, "wght" 300, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }

    &.filled-heavy {
      font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }
  }
`,
	`
  :host {
    ${new Array(16).fill(0).map((_, idx) => {
		return `--g-${idx + 1}: ${(idx + 1) * 4}px;`;
	}).join("\n")}
  }

  ${new Array(49).fill(0).map((_, index) => {
		const idx = index - 24;
		const lbl = idx < 0 ? `n${Math.abs(idx)}` : idx.toString();
		return `
        .layout-p-${lbl} { --padding: ${idx * 4}px; padding: var(--padding); }
        .layout-pt-${lbl} { padding-top: ${idx * 4}px; }
        .layout-pr-${lbl} { padding-right: ${idx * 4}px; }
        .layout-pb-${lbl} { padding-bottom: ${idx * 4}px; }
        .layout-pl-${lbl} { padding-left: ${idx * 4}px; }

        .layout-m-${lbl} { --margin: ${idx * 4}px; margin: var(--margin); }
        .layout-mt-${lbl} { margin-top: ${idx * 4}px; }
        .layout-mr-${lbl} { margin-right: ${idx * 4}px; }
        .layout-mb-${lbl} { margin-bottom: ${idx * 4}px; }
        .layout-ml-${lbl} { margin-left: ${idx * 4}px; }

        .layout-t-${lbl} { top: ${idx * 4}px; }
        .layout-r-${lbl} { right: ${idx * 4}px; }
        .layout-b-${lbl} { bottom: ${idx * 4}px; }
        .layout-l-${lbl} { left: ${idx * 4}px; }`;
	}).join("\n")}

  ${new Array(25).fill(0).map((_, idx) => {
		return `
        .layout-g-${idx} { gap: ${idx * 4}px; }`;
	}).join("\n")}

  ${new Array(8).fill(0).map((_, idx) => {
		return `
        .layout-grd-col${idx + 1} { grid-template-columns: ${"1fr ".repeat(idx + 1).trim()}; }`;
	}).join("\n")}

  .layout-pos-a {
    position: absolute;
  }

  .layout-pos-rel {
    position: relative;
  }

  .layout-dsp-none {
    display: none;
  }

  .layout-dsp-block {
    display: block;
  }

  .layout-dsp-grid {
    display: grid;
  }

  .layout-dsp-iflex {
    display: inline-flex;
  }

  .layout-dsp-flexvert {
    display: flex;
    flex-direction: column;
  }

  .layout-dsp-flexhor {
    display: flex;
    flex-direction: row;
  }

  .layout-fw-w {
    flex-wrap: wrap;
  }

  .layout-al-fs {
    align-items: start;
  }

  .layout-al-fe {
    align-items: end;
  }

  .layout-al-c {
    align-items: center;
  }

  .layout-as-n {
    align-self: normal;
  }

  .layout-js-c {
    justify-self: center;
  }

  .layout-sp-c {
    justify-content: center;
  }

  .layout-sp-ev {
    justify-content: space-evenly;
  }

  .layout-sp-bt {
    justify-content: space-between;
  }

  .layout-sp-s {
    justify-content: start;
  }

  .layout-sp-e {
    justify-content: end;
  }

  .layout-ji-e {
    justify-items: end;
  }

  .layout-r-none {
    resize: none;
  }

  .layout-fs-c {
    field-sizing: content;
  }

  .layout-fs-n {
    field-sizing: none;
  }

  .layout-flx-0 {
    flex: 0 0 auto;
  }

  .layout-flx-1 {
    flex: 1 0 auto;
  }

  .layout-c-s {
    contain: strict;
  }

  /** Widths **/

  ${new Array(10).fill(0).map((_, idx) => {
		const weight = (idx + 1) * 10;
		return `.layout-w-${weight} { width: ${weight}%; max-width: ${weight}%; }`;
	}).join("\n")}

  ${new Array(16).fill(0).map((_, idx) => {
		return `.layout-wp-${idx} { width: ${idx * 4}px; }`;
	}).join("\n")}

  /** Heights **/

  ${new Array(10).fill(0).map((_, idx) => {
		const height = (idx + 1) * 10;
		return `.layout-h-${height} { height: ${height}%; }`;
	}).join("\n")}

  ${new Array(16).fill(0).map((_, idx) => {
		return `.layout-hp-${idx} { height: ${idx * 4}px; }`;
	}).join("\n")}

  .layout-el-cv {
    & img,
    & video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      margin: 0;
    }
  }

  .layout-ar-sq {
    aspect-ratio: 1 / 1;
  }

  .layout-ex-fb {
    margin: calc(var(--padding) * -1) 0 0 calc(var(--padding) * -1);
    width: calc(100% + var(--padding) * 2);
    height: calc(100% + var(--padding) * 2);
  }
`,
	`
  ${new Array(21).fill(0).map((_, idx) => {
		return `.opacity-el-${idx * 5} { opacity: ${idx / 20}; }`;
	}).join("\n")}
`,
	`
  :host {
    --default-font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --default-font-family-mono: "Courier New", Courier, monospace;
  }

  .typography-f-s {
    font-family: var(--font-family, var(--default-font-family));
    font-optical-sizing: auto;
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0;
  }

  .typography-f-sf {
    font-family: var(--font-family-flex, var(--default-font-family));
    font-optical-sizing: auto;
  }

  .typography-f-c {
    font-family: var(--font-family-mono, var(--default-font-family));
    font-optical-sizing: auto;
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0;
  }

  .typography-v-r {
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0, "ROND" 100;
  }

  .typography-ta-s {
    text-align: start;
  }

  .typography-ta-c {
    text-align: center;
  }

  .typography-fs-n {
    font-style: normal;
  }

  .typography-fs-i {
    font-style: italic;
  }

  .typography-sz-ls {
    font-size: 11px;
    line-height: 16px;
  }

  .typography-sz-lm {
    font-size: 12px;
    line-height: 16px;
  }

  .typography-sz-ll {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-bs {
    font-size: 12px;
    line-height: 16px;
  }

  .typography-sz-bm {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-bl {
    font-size: 16px;
    line-height: 24px;
  }

  .typography-sz-ts {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-tm {
    font-size: 16px;
    line-height: 24px;
  }

  .typography-sz-tl {
    font-size: 22px;
    line-height: 28px;
  }

  .typography-sz-hs {
    font-size: 24px;
    line-height: 32px;
  }

  .typography-sz-hm {
    font-size: 28px;
    line-height: 36px;
  }

  .typography-sz-hl {
    font-size: 32px;
    line-height: 40px;
  }

  .typography-sz-ds {
    font-size: 36px;
    line-height: 44px;
  }

  .typography-sz-dm {
    font-size: 45px;
    line-height: 52px;
  }

  .typography-sz-dl {
    font-size: 57px;
    line-height: 64px;
  }

  .typography-ws-p {
    white-space: pre-line;
  }

  .typography-ws-nw {
    white-space: nowrap;
  }

  .typography-td-none {
    text-decoration: none;
  }

  /** Weights **/

  ${new Array(9).fill(0).map((_, idx) => {
		const weight = (idx + 1) * 100;
		return `.typography-w-${weight} { font-weight: ${weight}; }`;
	}).join("\n")}
`
].flat(Infinity).join("\n");
//#endregion
export { appendToAll, createThemeStyles, merge, structuralStyles, toProp };

//# sourceMappingURL=@a2ui_web___core_styles_index.js.map