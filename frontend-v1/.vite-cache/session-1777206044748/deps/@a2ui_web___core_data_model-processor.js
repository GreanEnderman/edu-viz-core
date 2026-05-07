//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/data/guards.js
function isPath(key, value) {
	return key === "path" && typeof value === "string";
}
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isComponentArrayReference(value) {
	if (!isObject(value)) return false;
	return "explicitList" in value || "template" in value;
}
function isStringValue(value) {
	return isObject(value) && ("path" in value || "literal" in value && typeof value.literal === "string" || "literalString" in value);
}
function isNumberValue(value) {
	return isObject(value) && ("path" in value || "literal" in value && typeof value.literal === "number" || "literalNumber" in value);
}
function isBooleanValue(value) {
	return isObject(value) && ("path" in value || "literal" in value && typeof value.literal === "boolean" || "literalBoolean" in value);
}
function isAnyComponentNode(value) {
	if (!isObject(value)) return false;
	if (!("id" in value && "type" in value && "properties" in value)) return false;
	return true;
}
function isResolvedAudioPlayer(props) {
	return isObject(props) && "url" in props && isStringValue(props.url);
}
function isResolvedButton(props) {
	return isObject(props) && "child" in props && isAnyComponentNode(props.child) && "action" in props;
}
function isResolvedCard(props) {
	if (!isObject(props)) return false;
	if (!("child" in props)) if (!("children" in props)) return false;
	else return Array.isArray(props.children) && props.children.every(isAnyComponentNode);
	return isAnyComponentNode(props.child);
}
function isResolvedCheckbox(props) {
	return isObject(props) && "label" in props && isStringValue(props.label) && "value" in props && isBooleanValue(props.value);
}
function isResolvedColumn(props) {
	return isObject(props) && "children" in props && Array.isArray(props.children) && props.children.every(isAnyComponentNode);
}
function isResolvedDateTimeInput(props) {
	return isObject(props) && "value" in props && isStringValue(props.value);
}
function isResolvedDivider(props) {
	return isObject(props);
}
function isResolvedImage(props) {
	return isObject(props) && "url" in props && isStringValue(props.url);
}
function isResolvedIcon(props) {
	return isObject(props) && "name" in props && isStringValue(props.name);
}
function isResolvedList(props) {
	return isObject(props) && "children" in props && Array.isArray(props.children) && props.children.every(isAnyComponentNode);
}
function isResolvedModal(props) {
	return isObject(props) && "entryPointChild" in props && isAnyComponentNode(props.entryPointChild) && "contentChild" in props && isAnyComponentNode(props.contentChild);
}
function isResolvedMultipleChoice(props) {
	return isObject(props) && "selections" in props;
}
function isResolvedRow(props) {
	return isObject(props) && "children" in props && Array.isArray(props.children) && props.children.every(isAnyComponentNode);
}
function isResolvedSlider(props) {
	return isObject(props) && "value" in props && isNumberValue(props.value);
}
function isResolvedTabItem(item) {
	return isObject(item) && "title" in item && isStringValue(item.title) && "child" in item && isAnyComponentNode(item.child);
}
function isResolvedTabs(props) {
	return isObject(props) && "tabItems" in props && Array.isArray(props.tabItems) && props.tabItems.every(isResolvedTabItem);
}
function isResolvedText(props) {
	return isObject(props) && "text" in props && isStringValue(props.text);
}
function isResolvedTextField(props) {
	return isObject(props) && "label" in props && isStringValue(props.label);
}
function isResolvedVideo(props) {
	return isObject(props) && "url" in props && isStringValue(props.url);
}
//#endregion
//#region ../vendor/A2UI-main/renderers/react/node_modules/@a2ui/web_core/dist/src/v0_8/data/model-processor.js
/**
* Processes and consolidates A2UIProtocolMessage objects into a structured,
* hierarchical model of UI surfaces.
*/
var A2uiMessageProcessor = class A2uiMessageProcessor {
	static {
		this.DEFAULT_SURFACE_ID = "@default";
	}
	constructor(opts = {
		mapCtor: Map,
		arrayCtor: Array,
		setCtor: Set,
		objCtor: Object
	}) {
		this.opts = opts;
		this.mapCtor = Map;
		this.arrayCtor = Array;
		this.setCtor = Set;
		this.objCtor = Object;
		this.arrayCtor = opts.arrayCtor;
		this.mapCtor = opts.mapCtor;
		this.setCtor = opts.setCtor;
		this.objCtor = opts.objCtor;
		this.surfaces = new opts.mapCtor();
	}
	getSurfaces() {
		return this.surfaces;
	}
	clearSurfaces() {
		this.surfaces.clear();
	}
	processMessages(messages) {
		for (const message of messages) {
			if (message.beginRendering) this.handleBeginRendering(message.beginRendering, message.beginRendering.surfaceId);
			if (message.surfaceUpdate) this.handleSurfaceUpdate(message.surfaceUpdate, message.surfaceUpdate.surfaceId);
			if (message.dataModelUpdate) this.handleDataModelUpdate(message.dataModelUpdate, message.dataModelUpdate.surfaceId);
			if (message.deleteSurface) this.handleDeleteSurface(message.deleteSurface);
		}
	}
	/**
	* Retrieves the data for a given component node and a relative path string.
	* This correctly handles the special `.` path, which refers to the node's
	* own data context.
	*/
	getData(node, relativePath, surfaceId = A2uiMessageProcessor.DEFAULT_SURFACE_ID) {
		const surface = this.getOrCreateSurface(surfaceId);
		if (!surface) return null;
		let finalPath;
		if (relativePath === "." || relativePath === "") finalPath = node.dataContextPath ?? "/";
		else finalPath = this.resolvePath(relativePath, node.dataContextPath);
		return this.getDataByPath(surface.dataModel, finalPath);
	}
	setData(node, relativePath, value, surfaceId = A2uiMessageProcessor.DEFAULT_SURFACE_ID) {
		if (!node) {
			console.warn("No component node set");
			return;
		}
		const surface = this.getOrCreateSurface(surfaceId);
		if (!surface) return;
		let finalPath;
		if (relativePath === "." || relativePath === "") finalPath = node.dataContextPath ?? "/";
		else finalPath = this.resolvePath(relativePath, node.dataContextPath);
		this.setDataByPath(surface.dataModel, finalPath, value);
	}
	resolvePath(path, dataContextPath) {
		if (path.startsWith("/")) return path;
		if (dataContextPath && dataContextPath !== "/") return dataContextPath.endsWith("/") ? `${dataContextPath}${path}` : `${dataContextPath}/${path}`;
		return `/${path}`;
	}
	parseIfJsonString(value) {
		if (typeof value !== "string") return value;
		const trimmedValue = value.trim();
		if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}") || trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) try {
			return JSON.parse(value);
		} catch (e) {
			console.warn(`Failed to parse potential JSON string: "${value.substring(0, 50)}..."`, e);
			return value;
		}
		return value;
	}
	/**
	* Converts a specific array format [{key: "...", value_string: "..."}, ...]
	* into a standard Map. It also attempts to parse any string values that
	* appear to be stringified JSON.
	*/
	convertKeyValueArrayToMap(arr) {
		const map = new this.mapCtor();
		for (const item of arr) {
			if (!isObject(item) || !("key" in item)) continue;
			const key = item.key;
			const valueKey = this.findValueKey(item);
			if (!valueKey) continue;
			let value = item[valueKey];
			if (valueKey === "valueMap" && Array.isArray(value)) value = this.convertKeyValueArrayToMap(value);
			else if (typeof value === "string") value = this.parseIfJsonString(value);
			this.setDataByPath(map, key, value);
		}
		return map;
	}
	setDataByPath(root, path, value) {
		if (Array.isArray(value) && (value.length === 0 || isObject(value[0]) && "key" in value[0])) if (value.length === 1 && isObject(value[0]) && value[0].key === ".") {
			const item = value[0];
			const valueKey = this.findValueKey(item);
			if (valueKey) {
				value = item[valueKey];
				if (valueKey === "valueMap" && Array.isArray(value)) value = this.convertKeyValueArrayToMap(value);
				else if (typeof value === "string") value = this.parseIfJsonString(value);
			} else value = this.convertKeyValueArrayToMap(value);
		} else value = this.convertKeyValueArrayToMap(value);
		const segments = this.normalizePath(path).split("/").filter((s) => s);
		if (segments.length === 0) {
			if (value instanceof Map || isObject(value)) {
				if (!(value instanceof Map) && isObject(value)) value = new this.mapCtor(Object.entries(value));
				root.clear();
				for (const [key, v] of value.entries()) root.set(key, v);
			} else console.error("Cannot set root of DataModel to a non-Map value.");
			return;
		}
		let current = root;
		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i];
			let target;
			if (current instanceof Map) target = current.get(segment);
			else if (Array.isArray(current) && /^\d+$/.test(segment)) target = current[parseInt(segment, 10)];
			if (target === void 0 || typeof target !== "object" || target === null) {
				target = new this.mapCtor();
				if (current instanceof this.mapCtor) current.set(segment, target);
				else if (Array.isArray(current)) current[parseInt(segment, 10)] = target;
			}
			current = target;
		}
		const finalSegment = segments[segments.length - 1];
		const storedValue = value;
		if (current instanceof this.mapCtor) current.set(finalSegment, storedValue);
		else if (Array.isArray(current) && /^\d+$/.test(finalSegment)) current[parseInt(finalSegment, 10)] = storedValue;
	}
	/**
	* Normalizes a path string into a consistent, slash-delimited format.
	* Converts bracket notation and dot notation in a two-pass.
	* e.g., "bookRecommendations[0].title" -> "/bookRecommendations/0/title"
	* e.g., "book.0.title" -> "/book/0/title"
	*/
	normalizePath(path) {
		return "/" + path.replace(/\[(\d+)\]/g, ".$1").split(".").filter((s) => s.length > 0).join("/");
	}
	getDataByPath(root, path) {
		const segments = this.normalizePath(path).split("/").filter((s) => s);
		let current = root;
		for (const segment of segments) {
			if (current === void 0 || current === null) return null;
			if (current instanceof Map) current = current.get(segment);
			else if (Array.isArray(current) && /^\d+$/.test(segment)) current = current[parseInt(segment, 10)];
			else if (isObject(current)) current = current[segment];
			else return null;
		}
		return current;
	}
	getOrCreateSurface(surfaceId) {
		let surface = this.surfaces.get(surfaceId);
		if (!surface) {
			surface = new this.objCtor({
				rootComponentId: null,
				componentTree: null,
				dataModel: new this.mapCtor(),
				components: new this.mapCtor(),
				styles: new this.objCtor()
			});
			this.surfaces.set(surfaceId, surface);
		}
		return surface;
	}
	handleBeginRendering(message, surfaceId) {
		const surface = this.getOrCreateSurface(surfaceId);
		surface.rootComponentId = message.root;
		surface.styles = message.styles ?? {};
		this.rebuildComponentTree(surface);
	}
	handleSurfaceUpdate(message, surfaceId) {
		const surface = this.getOrCreateSurface(surfaceId);
		for (const component of message.components) surface.components.set(component.id, component);
		this.rebuildComponentTree(surface);
	}
	handleDataModelUpdate(message, surfaceId) {
		const surface = this.getOrCreateSurface(surfaceId);
		const path = message.path ?? "/";
		this.setDataByPath(surface.dataModel, path, message.contents);
		this.rebuildComponentTree(surface);
	}
	handleDeleteSurface(message) {
		this.surfaces.delete(message.surfaceId);
	}
	/**
	* Starts at the root component of the surface and builds out the tree
	* recursively. This process involves resolving all properties of the child
	* components, and expanding on any explicit children lists or templates
	* found in the structure.
	*
	* @param surface The surface to be built.
	*/
	rebuildComponentTree(surface) {
		if (!surface.rootComponentId) {
			surface.componentTree = null;
			return;
		}
		const visited = new this.setCtor();
		surface.componentTree = this.buildNodeRecursive(surface.rootComponentId, surface, visited, "/", "");
	}
	/** Finds a value key in a map. */
	findValueKey(value) {
		return Object.keys(value).find((k) => k.startsWith("value"));
	}
	/**
	* Builds out the nodes recursively.
	*/
	buildNodeRecursive(baseComponentId, surface, visited, dataContextPath, idSuffix = "") {
		const fullId = `${baseComponentId}${idSuffix}`;
		const { components } = surface;
		if (!components.has(baseComponentId)) return null;
		if (visited.has(fullId)) throw new Error(`Circular dependency for component "${fullId}".`);
		visited.add(fullId);
		const componentData = components.get(baseComponentId);
		const componentProps = componentData.component ?? {};
		const componentType = Object.keys(componentProps)[0];
		const unresolvedProperties = componentProps[componentType];
		const resolvedProperties = new this.objCtor();
		if (isObject(unresolvedProperties)) for (const [key, value] of Object.entries(unresolvedProperties)) resolvedProperties[key] = this.resolvePropertyValue(value, surface, visited, dataContextPath, idSuffix);
		visited.delete(fullId);
		const baseNode = {
			id: fullId,
			dataContextPath,
			weight: componentData.weight ?? "initial"
		};
		switch (componentType) {
			case "Text":
				if (!isResolvedText(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Text",
					properties: resolvedProperties
				});
			case "Image":
				if (!isResolvedImage(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Image",
					properties: resolvedProperties
				});
			case "Icon":
				if (!isResolvedIcon(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Icon",
					properties: resolvedProperties
				});
			case "Video":
				if (!isResolvedVideo(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Video",
					properties: resolvedProperties
				});
			case "AudioPlayer":
				if (!isResolvedAudioPlayer(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "AudioPlayer",
					properties: resolvedProperties
				});
			case "Row":
				if (!isResolvedRow(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Row",
					properties: resolvedProperties
				});
			case "Column":
				if (!isResolvedColumn(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Column",
					properties: resolvedProperties
				});
			case "List":
				if (!isResolvedList(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "List",
					properties: resolvedProperties
				});
			case "Card":
				if (!isResolvedCard(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Card",
					properties: resolvedProperties
				});
			case "Tabs":
				if (!isResolvedTabs(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Tabs",
					properties: resolvedProperties
				});
			case "Divider":
				if (!isResolvedDivider(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Divider",
					properties: resolvedProperties
				});
			case "Modal":
				if (!isResolvedModal(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Modal",
					properties: resolvedProperties
				});
			case "Button":
				if (!isResolvedButton(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Button",
					properties: resolvedProperties
				});
			case "CheckBox":
				if (!isResolvedCheckbox(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "CheckBox",
					properties: resolvedProperties
				});
			case "TextField":
				if (!isResolvedTextField(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "TextField",
					properties: resolvedProperties
				});
			case "DateTimeInput":
				if (!isResolvedDateTimeInput(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "DateTimeInput",
					properties: resolvedProperties
				});
			case "MultipleChoice":
				if (!isResolvedMultipleChoice(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "MultipleChoice",
					properties: resolvedProperties
				});
			case "Slider":
				if (!isResolvedSlider(resolvedProperties)) throw new Error(`Invalid data; expected ${componentType}`);
				return new this.objCtor({
					...baseNode,
					type: "Slider",
					properties: resolvedProperties
				});
			default: return new this.objCtor({
				...baseNode,
				type: componentType,
				properties: resolvedProperties
			});
		}
	}
	/**
	* Recursively resolves an individual property value. If a property indicates
	* a child node (a string that matches a component ID), an explicitList of
	* children, or a template, these will be built out here.
	*/
	resolvePropertyValue(value, surface, visited, dataContextPath, idSuffix = "") {
		if (typeof value === "string" && surface.components.has(value)) return this.buildNodeRecursive(value, surface, visited, dataContextPath, idSuffix);
		if (isComponentArrayReference(value)) {
			if (value.explicitList) return value.explicitList.map((id) => this.buildNodeRecursive(id, surface, visited, dataContextPath, idSuffix));
			if (value.template) {
				const fullDataPath = this.resolvePath(value.template.dataBinding, dataContextPath);
				const data = this.getDataByPath(surface.dataModel, fullDataPath);
				const template = value.template;
				if (Array.isArray(data)) return data.map((_, index) => {
					const newSuffix = `:${[...dataContextPath.split("/").filter((segment) => /^\d+$/.test(segment)), index].join(":")}`;
					const childDataContextPath = `${fullDataPath}/${index}`;
					return this.buildNodeRecursive(template.componentId, surface, visited, childDataContextPath, newSuffix);
				});
				if (data instanceof this.mapCtor) return Array.from(data.keys(), (key) => {
					const newSuffix = `:${key}`;
					const childDataContextPath = `${fullDataPath}/${key}`;
					return this.buildNodeRecursive(template.componentId, surface, visited, childDataContextPath, newSuffix);
				});
				return new this.arrayCtor();
			}
		}
		if (Array.isArray(value)) return value.map((item) => this.resolvePropertyValue(item, surface, visited, dataContextPath, idSuffix));
		if (isObject(value)) {
			const newObj = new this.objCtor();
			for (const [key, propValue] of Object.entries(value)) {
				let propertyValue = propValue;
				if (isPath(key, propValue) && dataContextPath !== "/") {
					propertyValue = propValue.replace(/^\.?\/item/, "").replace(/^\.?\/text/, "").replace(/^\.?\/label/, "").replace(/^\.?\//, "");
					newObj[key] = propertyValue;
					continue;
				}
				newObj[key] = this.resolvePropertyValue(propertyValue, surface, visited, dataContextPath, idSuffix);
			}
			return newObj;
		}
		return value;
	}
};
//#endregion
export { A2uiMessageProcessor };

//# sourceMappingURL=@a2ui_web___core_data_model-processor.js.map