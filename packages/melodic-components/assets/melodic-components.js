const getTokenKey = (token) => {
	if (typeof token === "string") return token;
	if (typeof token === "symbol") return token.toString();
	return token.name;
};
function Inject(token) {
	return function(target, _, index) {
		if (!target.params) target.params = [];
		target.params[index] = { __injectionToken: getTokenKey(token) };
	};
}
function Injectable(meta = {}) {
	return function(target) {
		const token = meta.token ?? target;
		const dependencies = meta.dependencies?.map((dep) => getTokenKey(dep));
		Injector.bind(token, target, {
			singleton: meta.singleton,
			dependencies,
			args: meta.args
		});
	};
}
var Binding = class {
	constructor(key, token, type) {
		this._singleton = true;
		this._dependencies = [];
		this._args = [];
		this._resolved = false;
		this.key = key;
		this.token = token;
		this.type = type;
	}
	get isSingleton() {
		return this._singleton;
	}
	get isResolved() {
		return this._resolved;
	}
	get dependencies() {
		return this._dependencies;
	}
	get args() {
		return this._args;
	}
	get targetClass() {
		return this._class;
	}
	get factory() {
		return this._factory;
	}
	setClass(cls) {
		this._class = cls;
		return this;
	}
	setFactory(factory) {
		this._factory = factory;
		return this;
	}
	setSingleton(value) {
		this._singleton = value;
		return this;
	}
	withDependencies(deps) {
		this._dependencies = deps.map((dep) => getTokenKey(dep));
		return this;
	}
	withArgs(args) {
		this._args = args;
		return this;
	}
	getInstance() {
		return this._instance;
	}
	setInstance(instance) {
		this._instance = instance;
		this._resolved = true;
		return this;
	}
	clearInstance() {
		this._instance = void 0;
		this._resolved = false;
		return this;
	}
};
var InjectionEngine = class {
	constructor() {
		this._bindings = /* @__PURE__ */ new Map();
		this._constructionStack = /* @__PURE__ */ new Set();
	}
	bind(tokenOrClass, clsOrOptions, maybeOptions) {
		let token;
		let cls;
		let options;
		if (typeof clsOrOptions === "function") {
			token = tokenOrClass;
			cls = clsOrOptions;
			options = maybeOptions;
		} else {
			token = tokenOrClass;
			cls = tokenOrClass;
			options = clsOrOptions;
		}
		const key = getTokenKey(token);
		const binding = new Binding(key, token, "class");
		binding.setClass(cls);
		if (options?.singleton !== void 0) binding.setSingleton(options.singleton);
		if (options?.dependencies) binding.withDependencies(options.dependencies);
		if (options?.args) binding.withArgs(options.args);
		this._bindings.set(key, binding);
		return binding;
	}
	bindValue(token, value) {
		const key = getTokenKey(token);
		const binding = new Binding(key, token, "value");
		binding.setInstance(value);
		binding.setSingleton(true);
		this._bindings.set(key, binding);
		return binding;
	}
	bindFactory(token, factory, options) {
		const key = getTokenKey(token);
		const binding = new Binding(key, token, "factory");
		binding.setFactory(factory);
		if (options?.singleton !== void 0) binding.setSingleton(options.singleton);
		this._bindings.set(key, binding);
		return binding;
	}
	get(token) {
		const key = getTokenKey(token);
		const binding = this._bindings.get(key);
		if (!binding) throw new Error(`Dependency could not be found: ${key}`);
		return this.resolve(binding, key);
	}
	has(token) {
		const key = getTokenKey(token);
		return this._bindings.has(key);
	}
	getBinding(token) {
		const key = getTokenKey(token);
		return this._bindings.get(key);
	}
	unbind(token) {
		const key = getTokenKey(token);
		return this._bindings.delete(key);
	}
	clear() {
		this._bindings.clear();
	}
	resolve(binding, key) {
		if (binding.type === "value") return binding.getInstance();
		const existing = binding.getInstance();
		if (existing !== void 0 && binding.isSingleton) return existing;
		if (this._constructionStack.has(key)) {
			const chain = Array.from(this._constructionStack).join(" -> ") + ` -> ${key}`;
			throw new Error(`Circular dependency detected: ${chain}`);
		}
		this._constructionStack.add(key);
		try {
			let instance;
			if (binding.type === "factory") instance = binding.factory();
			else instance = this.construct(binding, key);
			if (binding.isSingleton) binding.setInstance(instance);
			return instance;
		} finally {
			this._constructionStack.delete(key);
		}
	}
	construct(binding, currentToken) {
		const cls = binding.targetClass;
		let dependencies = [];
		const paramTokens = cls.params;
		if (paramTokens && Array.isArray(paramTokens)) for (let i = 0; i < paramTokens.length; i++) {
			const param = paramTokens[i];
			if (param && typeof param === "object" && param.__injectionToken) {
				const depKey = param.__injectionToken;
				const depBinding = this._bindings.get(depKey);
				if (!depBinding) throw new Error(`Dependency '${depKey}' not found (required by '${currentToken}')`);
				dependencies.push(this.resolve(depBinding, depKey));
			} else dependencies.push(void 0);
		}
		else if (binding.dependencies.length > 0) for (const depKey of binding.dependencies) {
			const depBinding = this._bindings.get(depKey);
			if (!depBinding) throw new Error(`Dependency '${depKey}' not found (required by '${currentToken}')`);
			dependencies.push(this.resolve(depBinding, depKey));
		}
		if (binding.args.length > 0) dependencies = dependencies.concat(binding.args);
		return Reflect.construct(cls, dependencies);
	}
};
const Injector = new InjectionEngine();
function Service(token) {
	return function(target, propertyKey) {
		const metadataKey = `__service_${String(propertyKey)}`;
		target[metadataKey] = token;
		Object.defineProperty(target, propertyKey, {
			get() {
				const cacheKey = `__cached_${String(propertyKey)}`;
				if (!this[cacheKey]) this[cacheKey] = Injector.get(token);
				return this[cacheKey];
			},
			enumerable: true,
			configurable: true
		});
	};
}
function createToken(description) {
	return Symbol(description);
}
async function bootstrap(config = {}) {
	const devMode = config.devMode ?? false;
	const errorHandlers = [];
	if (devMode) console.log("[Melodic] Bootstrap starting...");
	if (config.onError) {
		const errorHandler = (event) => {
			config.onError(event.error, "error");
		};
		const rejectionHandler = (event) => {
			config.onError(event.reason, "unhandledrejection");
		};
		window.addEventListener("error", errorHandler);
		window.addEventListener("unhandledrejection", rejectionHandler);
		errorHandlers.push({
			type: "error",
			handler: errorHandler
		}, {
			type: "unhandledrejection",
			handler: rejectionHandler
		});
	}
	if (config.onBefore) {
		if (devMode) console.log("[Melodic] Running onBefore hook...");
		await config.onBefore();
	}
	if (config.providers) {
		for (const provider of config.providers) provider(Injector);
		if (devMode) console.log("[Melodic] Custom providers registered");
	}
	let rootElement;
	if (config.rootComponent && config.target) {
		const targetEl = typeof config.target === "string" ? document.querySelector(config.target) : config.target;
		if (!targetEl) throw new Error(`[Melodic] Target element not found: ${config.target}`);
		if (!customElements.get(config.rootComponent)) throw new Error(`[Melodic] Component <${config.rootComponent}> is not registered. Make sure to import the component file before calling bootstrap().`);
		rootElement = document.createElement(config.rootComponent);
		targetEl.appendChild(rootElement);
		if (devMode) console.log("[Melodic] Mounted root component", {
			component: config.rootComponent,
			target: config.target
		});
	}
	const app = {
		isDevMode: devMode,
		rootElement,
		get(token) {
			return Injector.get(token);
		},
		destroy() {
			for (const { type, handler } of errorHandlers) window.removeEventListener(type, handler);
			if (rootElement?.parentNode) rootElement.parentNode.removeChild(rootElement);
			if (devMode) console.log("[Melodic] Application destroyed");
		}
	};
	if (config.onReady) config.onReady();
	if (devMode) console.log("[Melodic] Bootstrap complete");
	Injector.bindValue("IMelodicApp", app);
	return app;
}
function render(result, container) {
	result.renderInto(container);
}
const SIGNAL_MARKER = Symbol("melodic.signal");
const isSignal = (value) => {
	return typeof value === "function" && SIGNAL_MARKER in value;
};
var globalStylesAttribute = "melodic-styles";
var globalStyleSelector = `style[${globalStylesAttribute}], link[rel="stylesheet"][${globalStylesAttribute}]`;
var cachedCssSheets = [];
var loadingPromise = null;
const applyGlobalStyles = (root) => {
	if (hasCachedSheets()) {
		applyAdoptedSheets(root);
		return;
	}
	if (!loadingPromise) loadingPromise = loadStyles();
	loadingPromise.then(() => applyAdoptedSheets(root));
};
var loadStyles = async () => {
	const globalStyleElements = document.querySelectorAll(globalStyleSelector);
	if (globalStyleElements.length === 0) return;
	for (const element of globalStyleElements) {
		if (element instanceof HTMLStyleElement) {
			cacheCssSheet(element.textContent ?? "");
			continue;
		}
		if (element instanceof HTMLLinkElement) {
			if (!element.sheet) await new Promise((resolve) => {
				element.addEventListener("load", () => resolve(), { once: true });
			});
			cacheCssSheet(Array.from(element.sheet?.cssRules ?? []).map((rule) => rule.cssText).join("\n"));
		}
	}
};
var applyAdoptedSheets = (root) => {
	const adopted = root.adoptedStyleSheets ?? [];
	const newSheets = cachedCssSheets.filter((sheet) => !adopted.includes(sheet));
	if (newSheets.length > 0) root.adoptedStyleSheets = [...adopted, ...newSheets];
};
var cacheCssSheet = (text) => {
	const trimmedText = text.trim();
	if (trimmedText.length > 0) {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(trimmedText);
		cachedCssSheets.push(sheet);
	}
};
var hasCachedSheets = () => {
	return cachedCssSheets.length > 0;
};
var ComponentBase = class extends HTMLElement {
	constructor(meta, component) {
		super();
		this._unsubscribers = [];
		this._renderScheduled = false;
		this._booleanProperties = /* @__PURE__ */ new Set();
		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;
		this._root = this.attachShadow({ mode: "open" });
		applyGlobalStyles(this._root);
		this._style = this.renderStyles();
		this.observe();
		if (this._component.onInit) this._component.onInit();
	}
	get component() {
		return this._component;
	}
	async connectedCallback() {
		this.render();
		if (this._component.onCreate !== void 0) this._component.onCreate();
	}
	disconnectedCallback() {
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._unsubscribers = [];
		const parts = this._root.__parts;
		if (parts) {
			for (const part of parts) if (part.actionCleanup) try {
				part.actionCleanup();
			} catch (error) {
				console.error("Action directive cleanup failed:", error);
			} finally {
				part.actionCleanup = void 0;
			}
		}
		if (this._component.onDestroy !== void 0) this._component.onDestroy();
	}
	attributeChangedCallback(attribute, oldVal, newVal) {
		const prop = attribute.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
		if (this._component[prop] !== void 0) {
			let value = newVal;
			if (this._booleanProperties.has(prop)) value = newVal !== null && newVal !== "false";
			this._component[prop] = value;
		}
		this.scheduleRender();
		if (this._component.onAttributeChange !== void 0) this._component.onAttributeChange(attribute, oldVal, newVal);
	}
	renderStyles() {
		const styleNode = document.createElement("style");
		if (this._meta.styles) render(this._meta.styles(), styleNode);
		return this._root.appendChild(styleNode);
	}
	render() {
		if (this._meta.template) {
			render(this._meta.template(this._component, this.getAttributeValues()), this._root);
			if (this._style.parentNode !== this._root) this._root.appendChild(this._style);
		}
		if (this._component.onRender !== void 0) this._component.onRender();
	}
	scheduleRender() {
		if (this._renderScheduled) return;
		this._renderScheduled = true;
		queueMicrotask(() => {
			this._renderScheduled = false;
			if (this.isConnected) this.render();
		});
	}
	observe() {
		const properties = [];
		const seen = /* @__PURE__ */ new Set();
		let proto = this._component;
		while (proto && proto !== Object.prototype) {
			for (const prop of Object.getOwnPropertyNames(proto)) if (!seen.has(prop)) {
				seen.add(prop);
				properties.push(prop);
			}
			proto = Object.getPrototypeOf(proto);
		}
		const filtered = properties.filter((prop) => {
			const value = this._component[prop];
			if (prop.startsWith("_")) return false;
			if (isSignal(value)) {
				this.subscribeToSignal(value);
				return false;
			}
			if (typeof value === "function") return false;
			return prop !== "elementRef" && prop !== "constructor";
		});
		for (const prop of filtered) {
			const descriptor = this.getPropertyDescriptor(this._component, prop);
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue === void 0 ? this._component[prop] : wrapperValue;
			if (typeof value === "boolean") this._booleanProperties.add(prop);
			let componentGetter = () => value;
			let componentSetter = (newVal) => {
				if (value !== newVal) {
					this._component.onPropertyChange?.(prop, value, newVal);
					value = newVal;
					this.scheduleRender();
				}
			};
			if (descriptor?.get) {
				const originalGetter = descriptor.get;
				componentGetter = () => originalGetter.call(this._component) ?? value;
			}
			if (descriptor?.set) {
				const originalSetter = descriptor.set;
				const baseSetter = componentSetter;
				componentSetter = (newVal) => {
					originalSetter.call(this._component, newVal);
					baseSetter(newVal);
				};
			}
			Object.defineProperty(this._component, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(this, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});
		}
	}
	getPropertyDescriptor(target, prop) {
		let current = target;
		while (current && current !== Object.prototype) {
			const descriptor = Object.getOwnPropertyDescriptor(current, prop);
			if (descriptor) return descriptor;
			current = Object.getPrototypeOf(current);
		}
	}
	getAttributeValues() {
		const attributes = {};
		this.getAttributeNames().forEach((attrName) => {
			attributes[attrName] = this.getAttribute(attrName) ?? "";
		});
		return attributes;
	}
	subscribeToSignal(signal$1) {
		const unsubscriber = signal$1.subscribe(() => this.scheduleRender());
		this._unsubscribers.push(unsubscriber);
	}
};
function MelodicComponent(meta) {
	return function(component) {
		if (customElements.get(meta.selector) === void 0) {
			const webComponent = class extends ComponentBase {
				constructor() {
					const dependencies = [];
					const paramTokens = component.params;
					if (paramTokens && Array.isArray(paramTokens)) for (const i of paramTokens) {
						const param = paramTokens[i];
						if (param && typeof param === "object" && param.__injectionToken) dependencies.push(Injector.get(param.__injectionToken));
						else dependencies.push(void 0);
					}
					super(meta, Reflect.construct(component, dependencies));
				}
				static #_ = this.observedAttributes = meta.attributes ?? [];
			};
			const componentWithSelector = component;
			componentWithSelector.selector = meta.selector;
			customElements.define(meta.selector, webComponent);
		}
	};
}
function getEnvironment() {
	const viteEnv = void 0;
	if (viteEnv === "dev" || viteEnv === "qa" || viteEnv === "prod") return viteEnv;
	return "prod";
}
const environment = getEnvironment();
function deepMerge(target, source) {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		const targetVal = result[key];
		const sourceVal = source[key];
		if (sourceVal !== null && typeof sourceVal === "object" && !Array.isArray(sourceVal) && targetVal !== null && typeof targetVal === "object" && !Array.isArray(targetVal)) result[key] = deepMerge(targetVal, sourceVal);
		else result[key] = sourceVal;
	}
	return result;
}
function defineConfig(definition) {
	const envOverrides = definition[environment];
	const resolved = {
		...definition.base,
		...envOverrides
	};
	if (definition.extends) return deepMerge(definition.extends, resolved);
	return resolved;
}
const APP_CONFIG = createToken("APP_CONFIG");
function provideConfig(config) {
	return (injector) => {
		injector.bindValue(APP_CONFIG, config);
	};
}
var HttpBaseError = class HttpBaseError extends Error {
	constructor(message, config, code) {
		super(message);
		this.config = config;
		this.code = code;
		this.name = "HttpBaseError";
		Object.setPrototypeOf(this, HttpBaseError.prototype);
	}
};
var HttpError = class HttpError extends HttpBaseError {
	constructor(message, response, config) {
		super(message, config, `HTTP_${response.status}`);
		this.response = response;
		this.name = "HttpError";
		Object.setPrototypeOf(this, HttpError.prototype);
	}
};
var NetworkError = class NetworkError extends HttpBaseError {
	constructor(message, config) {
		super(message, config, "NETWORK_ERROR");
		this.name = "NetworkError";
		Object.setPrototypeOf(this, NetworkError.prototype);
	}
};
var AbortError = class AbortError extends HttpBaseError {
	constructor(message, config) {
		super(message, config, "ABORTED");
		this.name = "AbortError";
		Object.setPrototypeOf(this, AbortError.prototype);
	}
};
var RequestManager = class {
	constructor() {
		this._pendingRequests = /* @__PURE__ */ new Map();
	}
	generateRequestKey(method, url, body) {
		let key = `${method}:${url}`;
		if (body) key += `:${this.hashBody(body)}`;
		return key;
	}
	hasPendingRequest(key) {
		return this._pendingRequests.has(key);
	}
	getPendingRequest(key) {
		const pending = this._pendingRequests.get(key);
		if (!pending) return null;
		return pending.promise;
	}
	addPendingRequest(requestConfig, promise) {
		const key = this.generateRequestKey(requestConfig.method || "GET", requestConfig.url || "", requestConfig.body);
		this._pendingRequests.set(key, {
			promise,
			abortController: requestConfig.abortController
		});
		promise.finally(() => {
			this.removePendingRequest(key);
		});
	}
	cancelPendingRequest(key, reason) {
		const pending = this._pendingRequests.get(key);
		if (pending) {
			pending.abortController.abort(reason);
			this._pendingRequests.delete(key);
		}
	}
	cancelAllRequests(reason) {
		this._pendingRequests.forEach((pending) => {
			pending.abortController.abort(reason);
		});
		this._pendingRequests.clear();
	}
	removePendingRequest(key) {
		if (!this._pendingRequests.get(key)) return;
		this._pendingRequests.delete(key);
	}
	hashBody(body) {
		let str;
		if (typeof body === "string") str = body;
		else if (body instanceof FormData) str = "[FormData]";
		else if (body instanceof Blob) str = `[Blob:${body.size}]`;
		else if (body instanceof ArrayBuffer) str = `[ArrayBuffer:${body.byteLength}]`;
		else if (body instanceof URLSearchParams) str = body.toString();
		else if (typeof body === "object" && body !== null) str = JSON.stringify(body);
		else str = String(body);
		return this.hashCode(str).toString();
	}
	hashCode(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return hash;
	}
};
var HttpClient = class {
	constructor(config) {
		this._requestManager = new RequestManager();
		this._interceptors = {
			request: [],
			response: []
		};
		this.interceptors = {
			request: (interceptor) => {
				this._interceptors.request.push(interceptor);
			},
			response: (interceptor) => {
				this._interceptors.response.push(interceptor);
			}
		};
		this._clientConfig = {
			defaultHeaders: {},
			...config
		};
	}
	async get(url, config) {
		return this.internalRequest({
			method: "GET",
			...config,
			url,
			deduplicate: config?.deduplicate ?? true
		});
	}
	async post(url, body, config) {
		return this.internalRequest({
			method: "POST",
			...config,
			url,
			body
		});
	}
	async put(url, body, config) {
		return this.internalRequest({
			method: "PUT",
			...config,
			url,
			body
		});
	}
	async patch(url, body, config) {
		return this.internalRequest({
			method: "PATCH",
			...config,
			url,
			body
		});
	}
	async delete(url, config) {
		return this.internalRequest({
			method: "DELETE",
			...config,
			url
		});
	}
	async internalRequest(config) {
		let requestConfig = this.mergeConfig(config);
		requestConfig = await this.executeRequestInterceptors(requestConfig);
		if (requestConfig.cancel?.cancelled) {
			if (requestConfig.cancel.cancelReason) console.log("[HttpClient] Request cancelled:", requestConfig.cancel.cancelReason);
			let cancelledResponse = {
				data: null,
				status: 0,
				statusText: "Request Cancelled",
				headers: new Headers(),
				config: requestConfig
			};
			if (requestConfig.cancel.cancelledResponse) cancelledResponse = {
				...cancelledResponse,
				...requestConfig.cancel.cancelledResponse
			};
			return Promise.resolve(cancelledResponse);
		}
		if (requestConfig.body instanceof FormData) {
			const headers = { ...requestConfig.headers };
			delete headers["Content-Type"];
			delete headers["content-type"];
			requestConfig.headers = headers;
		}
		if (requestConfig.abortController === void 0) requestConfig.abortController = new AbortController();
		let response = await this.executeRequest(requestConfig);
		response = await this.executeResponseInterceptors(response);
		return response;
	}
	async executeRequest(config) {
		if (config.deduplicate === true) {
			const requestKey = this._requestManager.generateRequestKey(config.method, config.url, config.body);
			if (this._requestManager.hasPendingRequest(requestKey)) return this._requestManager.getPendingRequest(requestKey);
		}
		const fetchPromise = fetch(config.url, {
			method: config.method,
			headers: config.headers,
			body: this.prepareBody(config.body),
			credentials: config.credentials,
			mode: config.mode,
			signal: config.abortController?.signal
		}).then(async (response) => {
			const httpResponse = {
				data: await this.parseResponse(response, config.onProgress),
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				config
			};
			if (!response.ok) throw new HttpError(`HTTP Error: ${response.status} ${response.statusText}`, httpResponse, config);
			return httpResponse;
		}).catch((error) => {
			if (error instanceof HttpError) throw error;
			if (error instanceof Error && error.name === "AbortError") throw new AbortError("Request aborted", config);
			throw new NetworkError((error instanceof Error ? error.message : "Network error") || "Network error", config);
		});
		if (config.deduplicate === true) this._requestManager.addPendingRequest(config, fetchPromise);
		return await fetchPromise;
	}
	async executeRequestInterceptors(config) {
		for (const interceptor of this._interceptors.request) try {
			config = await interceptor.intercept(config);
			if (config.cancel?.cancelled) break;
		} catch (error) {
			if (interceptor.error) await interceptor.error(error);
			throw error;
		}
		return config;
	}
	async executeResponseInterceptors(response) {
		for (const interceptor of this._interceptors.response) try {
			response = await interceptor.intercept(response);
		} catch (error) {
			if (interceptor.error) await interceptor.error(error);
			throw error;
		}
		return response;
	}
	mergeConfig(config) {
		return {
			...this._clientConfig,
			...config,
			headers: {
				...this._clientConfig.defaultHeaders,
				...config.headers
			},
			url: this.buildUrl(config.url ?? "", config.params)
		};
	}
	buildUrl(url, params) {
		let fullUrl = `${this._clientConfig.baseURL || ""}${url}`;
		if (params) {
			const queryString = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&");
			fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${queryString}`;
		}
		return fullUrl;
	}
	prepareBody(body) {
		if (body === null || body === void 0) return null;
		if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams || body instanceof ReadableStream || typeof body === "string") return body;
		return JSON.stringify(body);
	}
	async parseResponse(response, onProgress) {
		const contentType = response.headers.get("content-type") || "";
		const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
		if (onProgress && response.body && contentLength > 0) {
			const reader = response.body.getReader();
			let loaded = 0;
			const chunks = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
				loaded += value.length;
				onProgress({
					loaded,
					total: contentLength,
					percentage: loaded / contentLength * 100
				});
			}
			const blob = new Blob(chunks);
			if (contentType.includes("application/json")) {
				const text = await blob.text();
				return JSON.parse(text);
			}
			return blob;
		}
		if (contentType.includes("application/json")) return await response.json();
		if (contentType.includes("text/")) return await response.text();
		if (contentType.includes("application/octet-stream") || contentType.includes("image/")) return await response.blob();
		return await response.text();
	}
};
function provideHttp(httpClientConfig, interceptors) {
	return (injector) => {
		const httpClient = new HttpClient(httpClientConfig);
		injector.bindValue(HttpClient, httpClient);
		if (interceptors?.request) interceptors.request.forEach((interceptor) => {
			httpClient.interceptors.request(interceptor);
		});
		if (interceptors?.response) interceptors.response.forEach((interceptor) => {
			httpClient.interceptors.response(interceptor);
		});
	};
}
function createGuard(fn) {
	return { canActivate: fn };
}
function createDeactivateGuard(fn) {
	return { canDeactivate: fn };
}
function createResolver(fn) {
	return { resolve: fn };
}
var RouteMatcher = class {
	constructor(route, rules) {
		this._reEscape = /[-[\]{}()+?.,\\^$|#\s]/g;
		this._reParam = /([:*])(\w+)/g;
		this._names = [];
		this._isWildcard = false;
		this._route = route;
		this._rules = rules;
		this._isWildcard = route.includes("*");
		let escapedRoute = this._route.replace(this._reEscape, "\\$&");
		escapedRoute = escapedRoute.replace(this._reParam, (_, mode, name) => {
			this._names.push(name);
			return mode === ":" ? "([^/]*)" : "(.*)";
		});
		this._routeRegex = /* @__PURE__ */ new RegExp("^" + escapedRoute + "$");
		this._prefixRegex = /* @__PURE__ */ new RegExp("^" + escapedRoute + "(?:/|$)");
	}
	parse(url) {
		let i = 0;
		let param;
		let value;
		const params = {};
		const matches = url.match(this._routeRegex);
		if (!matches) return null;
		while (i < this._names.length) {
			param = this._names[i++];
			value = matches[i];
			if (this._rules && param in this._rules && !this.validateRule(this._rules[param], value)) return null;
			params[param] = value;
		}
		return params;
	}
	parsePrefix(url) {
		if (this._route === "") return {
			params: {},
			matchedPath: "",
			remainingPath: url
		};
		const matches = url.match(this._prefixRegex);
		if (!matches) return null;
		const params = {};
		for (let i = 0; i < this._names.length; i++) {
			const name = this._names[i];
			const value = matches[i + 1];
			if (this._rules && name in this._rules && !this.validateRule(this._rules[name], value)) return null;
			params[name] = value;
		}
		const matchedPath = this.calculateMatchedPath(url);
		return {
			params,
			matchedPath,
			remainingPath: url.slice(matchedPath.length).replace(/^\//, "")
		};
	}
	stringify(params) {
		let re;
		let result = this._route;
		for (const param in params) {
			re = /* @__PURE__ */ new RegExp("[:*]" + param + "\\b");
			result = result.replace(re, params[param]);
		}
		return result.replace(this._reParam, "");
	}
	calculateMatchedPath(url) {
		if (this._isWildcard) return url;
		const routeSegments = this._route.split("/").filter(Boolean);
		return url.split("/").filter(Boolean).slice(0, routeSegments.length).join("/");
	}
	validateRule(rule, value) {
		const type = Object.prototype.toString.call(rule).charAt(8);
		return type === "R" ? rule.test(value) : type === "F" ? rule(value) : rule === value;
	}
};
const ROUTE_CONTEXT_EVENT = "melodic:route-context";
var RouteContextEvent = class extends CustomEvent {
	constructor(context) {
		super(ROUTE_CONTEXT_EVENT, {
			bubbles: false,
			composed: true,
			detail: context
		});
	}
};
function matchRouteLevel(routes, remainingPath, basePath, accumulatedMatches, accumulatedParams) {
	for (const route of routes) {
		const matcher = new RouteMatcher(route.path);
		if (route.redirectTo && route.path === remainingPath) return {
			matches: accumulatedMatches,
			params: accumulatedParams,
			isExactMatch: false,
			redirectTo: route.redirectTo
		};
		const exactMatch = matcher.parse(remainingPath);
		if (exactMatch !== null) {
			const fullPath = basePath ? `${basePath}/${route.path}` : route.path;
			const match = {
				route,
				params: exactMatch,
				matchedPath: route.path,
				remainingPath: "",
				fullPath,
				children: route.children
			};
			Object.assign(accumulatedParams, exactMatch);
			accumulatedMatches.push(match);
			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: true
			};
		}
		if (route.children || route.loadChildren) {
			const prefixResult = matcher.parsePrefix(remainingPath);
			if (prefixResult && prefixResult.params !== null) {
				const fullPath = basePath ? `${basePath}/${prefixResult.matchedPath}` : prefixResult.matchedPath;
				const match = {
					route,
					params: prefixResult.params,
					matchedPath: prefixResult.matchedPath,
					remainingPath: prefixResult.remainingPath,
					fullPath,
					children: route.children
				};
				Object.assign(accumulatedParams, prefixResult.params);
				accumulatedMatches.push(match);
				if (route.children && prefixResult.remainingPath) return matchRouteLevel(route.children, prefixResult.remainingPath, fullPath, accumulatedMatches, accumulatedParams);
				return {
					matches: accumulatedMatches,
					params: accumulatedParams,
					isExactMatch: prefixResult.remainingPath === ""
				};
			}
		}
	}
	return {
		matches: accumulatedMatches,
		params: accumulatedParams,
		isExactMatch: false
	};
}
function matchRouteTree(routes, path, basePath = "") {
	const result = matchRouteLevel(routes, path.startsWith("/") ? path.slice(1) : path, basePath, [], {});
	return {
		matches: result.matches,
		params: result.params,
		isExactMatch: result.isExactMatch,
		redirectTo: result.redirectTo
	};
}
function findRouteByName(routes, name) {
	for (const route of routes) {
		if (route.name === name) return route;
		if (route.children) {
			const found = findRouteByName(route.children, name);
			if (found) return found;
		}
	}
	return null;
}
function buildPathFromRoute(routes, name, params = {}) {
	const pathParts = [];
	function findAndBuildPath(routeList, targetName) {
		for (const route of routeList) {
			if (route.name === targetName) {
				const matcher = new RouteMatcher(route.path);
				pathParts.push(matcher.stringify(params));
				return true;
			}
			if (route.children) {
				const segment = new RouteMatcher(route.path).stringify(params);
				if (findAndBuildPath(route.children, targetName)) {
					pathParts.unshift(segment);
					return true;
				}
			}
		}
		return false;
	}
	if (findAndBuildPath(routes, name)) return "/" + pathParts.filter(Boolean).join("/");
	return null;
}
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
var RouteContextService = class RouteContextService$1 {
	constructor() {
		this._matchStack = [];
		this._contexts = /* @__PURE__ */ new Map();
		this._currentMatchResult = null;
		this._resolvedData = /* @__PURE__ */ new Map();
	}
	setMatchResult(result) {
		this._currentMatchResult = result;
		this._matchStack = result.matches;
		this._contexts.clear();
		let basePath = "";
		const ancestorMatches = [];
		const accumulatedParams = {};
		for (let i = 0; i < result.matches.length; i++) {
			const match = result.matches[i];
			ancestorMatches.push(match);
			Object.assign(accumulatedParams, match.params);
			const context = {
				depth: i,
				routes: match.children ?? [],
				currentMatch: match,
				ancestorMatches: [...ancestorMatches],
				params: { ...accumulatedParams },
				remainingPath: match.remainingPath,
				basePath,
				parent: i > 0 ? this._contexts.get(i - 1) : void 0
			};
			this._contexts.set(i, context);
			basePath = match.fullPath;
		}
	}
	setResolvedData(depth, data) {
		this._resolvedData.set(depth, data);
	}
	clearResolvedData() {
		this._resolvedData.clear();
	}
	getContextForDepth(depth) {
		return this._contexts.get(depth);
	}
	getChildRoutesForDepth(depth) {
		const parentContext = this._contexts.get(depth - 1);
		if (depth === 0) return [];
		return parentContext?.currentMatch?.children ?? [];
	}
	getRemainingPathForDepth(depth) {
		if (depth === 0) return window.location.pathname;
		return this._contexts.get(depth - 1)?.remainingPath ?? "";
	}
	getParamsForDepth(depth) {
		return this._contexts.get(depth)?.params ?? {};
	}
	getCurrentParams() {
		return this._currentMatchResult?.params ?? {};
	}
	getMatchStack() {
		return [...this._matchStack];
	}
	getCurrentMatchResult() {
		return this._currentMatchResult;
	}
	getMergedRouteData(depth) {
		const maxDepth = depth ?? this._matchStack.length - 1;
		const merged = {};
		for (let i = 0; i <= maxDepth && i < this._matchStack.length; i++) {
			const match = this._matchStack[i];
			if (match.route.data) Object.assign(merged, match.route.data);
		}
		return merged;
	}
	getMergedResolvedData(depth) {
		const maxDepth = depth ?? this._matchStack.length - 1;
		const merged = {};
		for (let i = 0; i <= maxDepth; i++) {
			const data = this._resolvedData.get(i);
			if (data) Object.assign(merged, data);
		}
		return merged;
	}
	getResolvedDataForDepth(depth) {
		return this._resolvedData.get(depth);
	}
};
RouteContextService = __decorate([Injectable()], RouteContextService);
function __decorateMetadata(k, v) {
	if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
var routerStateEvent = (type, data, title, url) => {
	return new PopStateEvent("History", { state: {
		type,
		data,
		url,
		host: window.location.host,
		hostName: window.location.hostname,
		href: window.location.href,
		pathName: window.location.pathname,
		port: window.location.port,
		protocol: window.location.protocol,
		params: new URLSearchParams(window.location.search),
		title
	} });
};
var pushState = history.pushState;
history.pushState = (data, title, url) => {
	pushState.apply(history, [
		data,
		title,
		url
	]);
	const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("push", data, title, url) });
	window.dispatchEvent(navigationEvent);
};
var replaceState = history.replaceState;
history.replaceState = (data, title, url) => {
	replaceState.apply(history, [
		data,
		title,
		url
	]);
	const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("replace", data, title, url) });
	window.dispatchEvent(navigationEvent);
};
var RouterService = class RouterService$1 {
	constructor() {
		this._routes = [];
		this._currentMatches = [];
		this._resolversExecutedForPath = null;
		this._currentPath = `${window.location.pathname}${window.location.search}`;
		this._contextService = new RouteContextService();
		window.addEventListener("NavigationEvent", (event) => {
			this._route = event.detail.state;
		});
		window.addEventListener("popstate", (event) => {
			this.handlePopState(event);
		});
	}
	setRoutes(routes) {
		this._routes = routes;
	}
	getRoutes() {
		return this._routes;
	}
	getContextService() {
		return this._contextService;
	}
	getRoute() {
		return this._route;
	}
	getParams() {
		return this._contextService.getCurrentParams();
	}
	getParam(name) {
		return this._contextService.getCurrentParams()[name];
	}
	getQueryParams() {
		return new URLSearchParams(window.location.search);
	}
	getCurrentMatches() {
		return [...this._currentMatches];
	}
	getRouteData(depth) {
		return this._contextService.getMergedRouteData(depth);
	}
	getResolvedData(depth) {
		return this._contextService.getMergedResolvedData(depth);
	}
	matchPath(path) {
		return matchRouteTree(this._routes, path);
	}
	setCurrentMatches(result) {
		this._currentMatches = result.matches;
		this._contextService.setMatchResult(result);
	}
	async runResolvers(matchResult) {
		const currentPath = `${window.location.pathname}${window.location.search}`;
		if (this._resolversExecutedForPath === currentPath) {
			this._resolversExecutedForPath = null;
			return { success: true };
		}
		const result = await this.runResolversInternal(matchResult);
		this._resolversExecutedForPath = null;
		return result;
	}
	async navigate(path, options = {}) {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false, scrollToTop = true } = options;
		let fullPath = path;
		if (queryParams && Object.keys(queryParams).length > 0) fullPath = `${path}?${new URLSearchParams(queryParams).toString()}`;
		if (!skipGuards && this._currentMatches.length > 0) {
			const deactivateResult = await this.runDeactivationGuards(fullPath);
			if (deactivateResult !== true) {
				if (typeof deactivateResult === "string") return this.navigate(deactivateResult, {
					...options,
					skipGuards: true
				});
				return {
					success: false,
					error: "Navigation blocked by guard"
				};
			}
		}
		const matchResult = this.matchPath(path);
		if (matchResult.redirectTo) return this.navigate(matchResult.redirectTo, {
			...options,
			replace: true
		});
		if (!skipGuards && matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (guardResult !== true) {
				if (typeof guardResult === "string") return this.navigate(guardResult, {
					...options,
					skipGuards: true
				});
				return {
					success: false,
					error: "Navigation blocked by guard"
				};
			}
		}
		if (!skipResolvers && matchResult.matches.length > 0) {
			const resolverResult = await this.runResolversInternal(matchResult);
			if (!resolverResult.success) return {
				success: false,
				error: resolverResult.error ?? "Navigation blocked by resolver"
			};
			this._resolversExecutedForPath = fullPath;
		}
		this.setCurrentMatches(matchResult);
		if (replace) history.replaceState(data, "", fullPath);
		else history.pushState(data, "", fullPath);
		this._currentPath = fullPath;
		if (scrollToTop) {
			const hash = fullPath.includes("#") ? fullPath.split("#")[1] : null;
			if (hash) {
				const element = document.getElementById(hash);
				if (element) element.scrollIntoView();
			} else window.scrollTo(0, 0);
		}
		return {
			success: true,
			url: fullPath
		};
	}
	async navigateByName(name, params = {}, options = {}) {
		const path = buildPathFromRoute(this._routes, name, params);
		if (!path) return {
			success: false,
			error: `Route with name '${name}' not found`
		};
		return this.navigate(path, options);
	}
	replace(path, data) {
		history.replaceState(data, "", path);
		this._currentPath = `${window.location.pathname}${window.location.search}`;
	}
	back() {
		history.back();
	}
	forward() {
		history.forward();
	}
	go(delta) {
		history.go(delta);
	}
	async runDeactivationGuards(targetPath) {
		for (const match of this._currentMatches) {
			const guards = match.route.canDeactivate ?? [];
			for (const guard of guards) {
				const context = this.createGuardContext(match, {
					matches: this._currentMatches,
					params: this._contextService.getCurrentParams(),
					isExactMatch: true
				});
				context.targetPath = targetPath;
				const result = await this.executeGuard(guard, "canDeactivate", context);
				if (result !== true) return result;
			}
		}
		return true;
	}
	async runGuards(matchResult) {
		for (const match of matchResult.matches) {
			const guards = match.route.canActivate ?? [];
			for (const guard of guards) {
				const context = this.createGuardContext(match, matchResult);
				const result = await this.executeGuard(guard, "canActivate", context);
				if (result !== true) return result;
			}
		}
		return true;
	}
	async executeGuard(guard, method, context) {
		const fn = guard[method];
		if (!fn) return true;
		try {
			const result = fn.call(guard, context);
			return result instanceof Promise ? await result : result;
		} catch (error) {
			console.error(`Guard error:`, error);
			return false;
		}
	}
	createGuardContext(match, matchResult) {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname,
			currentPath: window.location.pathname,
			data: match.route.data
		};
	}
	async runResolversInternal(matchResult) {
		this._contextService.clearResolvedData();
		for (let depth = 0; depth < matchResult.matches.length; depth++) {
			const match = matchResult.matches[depth];
			const resolvers = match.route.resolve;
			if (!resolvers) continue;
			const resolvedData = {};
			const context = this.createResolverContext(match, matchResult);
			for (const [key, resolver] of Object.entries(resolvers)) try {
				resolvedData[key] = await this.executeResolver(resolver, context);
			} catch (error) {
				console.error(`Resolver '${key}' failed:`, error);
				return {
					success: false,
					error: `Resolver '${key}' failed: ${error instanceof Error ? error.message : String(error)}`
				};
			}
			this._contextService.setResolvedData(depth, resolvedData);
		}
		return { success: true };
	}
	async handlePopState(event) {
		const targetPath = `${window.location.pathname}${window.location.search}`;
		const guardResult = await this.runDeactivationGuards(targetPath);
		if (guardResult !== true) {
			if (typeof guardResult === "string") await this.navigate(guardResult, {
				replace: true,
				skipGuards: true
			});
			else history.replaceState(event.state, "", this._currentPath);
			return;
		}
		this._currentPath = targetPath;
		const matchResult = this.matchPath(window.location.pathname);
		this.setCurrentMatches(matchResult);
		const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("push", event.state, "", window.location.pathname) });
		window.dispatchEvent(navigationEvent);
	}
	async executeResolver(resolver, context) {
		const result = resolver.resolve(context);
		return result instanceof Promise ? await result : result;
	}
	createResolverContext(match, matchResult) {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname
		};
	}
};
RouterService = __decorate([Injectable(), __decorateMetadata("design:paramtypes", [])], RouterService);
var directiveRegistry = /* @__PURE__ */ new Map();
var findAttributeDirective = (name) => {
	if (directiveRegistry.has(name)) return directiveRegistry.get(name);
	const lowerName = name.toLowerCase();
	for (const [key, value] of directiveRegistry) if (key.toLowerCase() === lowerName) return value;
};
function registerAttributeDirective(name, directive$1) {
	directiveRegistry.set(name, directive$1);
}
function getAttributeDirective(name) {
	return findAttributeDirective(name);
}
function hasAttributeDirective(name) {
	return findAttributeDirective(name) !== void 0;
}
function unregisterAttributeDirective(name) {
	return directiveRegistry.delete(name);
}
function getRegisteredDirectives() {
	return Array.from(directiveRegistry.keys());
}
function isDirective(value) {
	return typeof value === "object" && value !== null && "__directive" in value;
}
var MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
var COMMENT_NODE_MARKER = `<!--${MARKER}-->`;
var ATTRIBUTE_MARKER_PREFIX = `__${MARKER}_`;
var ATTRIBUTE_MARKER_REGEX = new RegExp(`${ATTRIBUTE_MARKER_PREFIX}(\\d+)__`, "g");
var createAttributeMarker = (index) => `${ATTRIBUTE_MARKER_PREFIX}${index}__`;
var templateCache = /* @__PURE__ */ new Map();
var templateKeyCache = /* @__PURE__ */ new WeakMap();
function getTemplateKey(strings) {
	let key = templateKeyCache.get(strings);
	if (key === void 0) {
		key = strings.join(MARKER);
		templateKeyCache.set(strings, key);
	}
	return key;
}
var TemplateResult = class TemplateResult {
	constructor(strings, values) {
		this.strings = strings;
		this.values = values;
	}
	renderOnce(container) {
		const templateKey = getTemplateKey(this.strings);
		const cache = this.getTemplate(templateKey);
		const clone = cache.element.content.cloneNode(true);
		const parts = this.prepareParts(clone, cache);
		this.commit(parts);
		container.appendChild(clone);
		container.__parts = parts;
		container.__templateKey = templateKey;
		return Array.from(container.childNodes);
	}
	renderInto(container) {
		const templateKey = getTemplateKey(this.strings);
		const { element: template } = this.getTemplate(templateKey);
		const existingKey = container.__templateKey;
		if (existingKey && existingKey !== templateKey) {
			const existingParts = container.__parts;
			if (existingParts) this.cleanupParts(existingParts);
			delete container.__parts;
		}
		if (!container.__parts) {
			const clone = template.content.cloneNode(true);
			const parts$1 = this.prepareParts(clone, this.getTemplate(templateKey));
			container.__parts = parts$1;
			container.__templateKey = templateKey;
			this.commit(parts$1);
			container.textContent = "";
			container.appendChild(clone);
			return;
		}
		if (!container.__templateKey) container.__templateKey = templateKey;
		const parts = container.__parts;
		this.commit(parts);
	}
	getTemplate(key) {
		let cached = templateCache.get(key);
		if (cached) return cached;
		const parts = [];
		let html$1 = this.strings[0];
		const attrPreProcessor = this.getAttributePreProcessor(parts);
		let activeAttributeName = null;
		let activeAttributeQuote = null;
		for (let i = 1; i < this.strings.length; i++) {
			const s = this.strings[i];
			const valueIndex = i - 1;
			const match = /([@.:?]?[\w:-]+)\s*=\s*["']?$/.exec(html$1);
			const quotedAttrMatch = /([@.:?]?[\w:-]+)\s*=\s*(["'])([^"']*)$/.exec(html$1);
			let attrKey = "___";
			if (activeAttributeName) html$1 += createAttributeMarker(valueIndex);
			else {
				const quotedPrefix = (quotedAttrMatch?.[1])?.charAt(0);
				const hasSpecialPrefix = quotedPrefix !== void 0 && Object.keys(attrPreProcessor).includes(quotedPrefix);
				if (quotedAttrMatch && !hasSpecialPrefix) {
					html$1 += createAttributeMarker(valueIndex);
					activeAttributeName = quotedAttrMatch[1];
					activeAttributeQuote = quotedAttrMatch[2];
				} else {
					if (match) {
						attrKey = "__";
						const attrPrefix = match[1].charAt(0);
						if (Object.keys(attrPreProcessor).includes(attrPrefix)) attrKey = attrPrefix;
					}
					if (attrKey === "__" && match) {
						html$1 += createAttributeMarker(valueIndex);
						activeAttributeName = match[1];
						const quoteMatch = /(["'])$/.exec(match[0]);
						activeAttributeQuote = quoteMatch ? quoteMatch[1] : null;
					} else html$1 = attrPreProcessor[attrKey](valueIndex, html$1, match ? match[1] : void 0, match);
				}
			}
			html$1 += s;
			if (activeAttributeName) {
				if (activeAttributeQuote) {
					if (s.includes(activeAttributeQuote)) {
						activeAttributeName = null;
						activeAttributeQuote = null;
					}
				} else if (/[\s>]/.test(s)) {
					activeAttributeName = null;
					activeAttributeQuote = null;
				}
			}
		}
		const element = document.createElement("template");
		element.innerHTML = html$1;
		const partPaths = [];
		let nodePartCursor = 0;
		const nodeParts = [];
		const eventPartsByIndex = /* @__PURE__ */ new Map();
		const propertyPartsByIndex = /* @__PURE__ */ new Map();
		const actionPartsByIndex = /* @__PURE__ */ new Map();
		const booleanPartsByIndex = /* @__PURE__ */ new Map();
		for (const part of parts) switch (part.type) {
			case "event":
				eventPartsByIndex.set(part.index, part);
				break;
			case "property":
				propertyPartsByIndex.set(part.index, part);
				break;
			case "action":
				actionPartsByIndex.set(part.index, part);
				break;
			case "boolean-attribute":
				booleanPartsByIndex.set(part.index, part);
				break;
			case "node":
				nodeParts.push(part);
				break;
			default: break;
		}
		const walkTemplate = (node, path) => {
			if (node.nodeType === Node.COMMENT_NODE) {
				if (node.data === MARKER) {
					const part = nodeParts[nodePartCursor++];
					if (part) partPaths.push({
						path: [...path],
						type: "node",
						index: part.index
					});
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node;
				for (let i = el.attributes.length - 1; i >= 0; i--) {
					const attr = el.attributes[i];
					if (attr.name.startsWith("__event-")) {
						const index = parseInt(attr.name.match(/__event-(\d+)__/)?.[1] || "0");
						const part = eventPartsByIndex.get(index);
						if (part) partPaths.push({
							path: [...path],
							type: "event",
							index: part.index,
							name: part.name
						});
					} else if (attr.name.startsWith("__prop-")) {
						const index = parseInt(attr.name.match(/__prop-(\d+)__/)?.[1] || "0");
						const part = propertyPartsByIndex.get(index);
						if (part) partPaths.push({
							path: [...path],
							type: "property",
							index: part.index,
							name: part.name
						});
					} else if (attr.name.startsWith("__action-")) {
						const index = parseInt(attr.name.match(/__action-(\d+)__/)?.[1] || "0");
						const part = actionPartsByIndex.get(index);
						if (part) partPaths.push({
							path: [...path],
							type: "action",
							index: part.index,
							name: part.name
						});
					} else if (attr.name.startsWith("__bool-")) {
						const index = parseInt(attr.name.match(/__bool-(\d+)__/)?.[1] || "0");
						const part = booleanPartsByIndex.get(index);
						if (part) partPaths.push({
							path: [...path],
							type: "boolean-attribute",
							index: part.index,
							name: part.name
						});
					} else if (attr.name.startsWith(":")) partPaths.push({
						path: [...path],
						type: "action",
						index: -1,
						name: attr.name.slice(1),
						staticValue: attr.value
					});
					else if (attr.value.includes(ATTRIBUTE_MARKER_PREFIX)) {
						const attributeInfo = this.parseAttributeValue(attr.value);
						if (attributeInfo) {
							const isComposite = attributeInfo.indices.length > 1 || attributeInfo.strings.some((s) => s.length > 0);
							partPaths.push({
								path: [...path],
								type: "attribute",
								index: attributeInfo.indices[0],
								name: attr.name,
								attributeStrings: isComposite ? attributeInfo.strings : void 0,
								attributeIndices: isComposite ? attributeInfo.indices : void 0
							});
						}
					}
				}
			}
			const children = node.childNodes;
			for (let i = 0; i < children.length; i++) {
				path.push(i);
				walkTemplate(children[i], path);
				path.pop();
			}
		};
		walkTemplate(element.content, []);
		cached = {
			element,
			parts,
			partPaths
		};
		if (templateCache.size >= 500) {
			const oldestKey = templateCache.keys().next().value;
			if (oldestKey) templateCache.delete(oldestKey);
		}
		templateCache.set(key, cached);
		return cached;
	}
	getAttributePreProcessor(parts) {
		return {
			"@": (index, html$1, attrName, match) => {
				parts.push({
					type: "event",
					index,
					name: attrName?.slice(1)
				});
				return html$1.slice(0, -(match?.[0].length ?? 0)) + `__event-${index}__=""`;
			},
			".": (index, html$1, attrName, match) => {
				parts.push({
					type: "property",
					index,
					name: attrName?.slice(1)
				});
				return html$1.slice(0, -(match?.[0].length ?? 0)) + `__prop-${index}__=""`;
			},
			":": (index, html$1, attrName, match) => {
				parts.push({
					type: "action",
					index,
					name: attrName?.slice(1)
				});
				return html$1.slice(0, -(match?.[0].length ?? 0)) + `__action-${index}__=""`;
			},
			"?": (index, html$1, attrName, match) => {
				parts.push({
					type: "boolean-attribute",
					index,
					name: attrName?.slice(1)
				});
				return html$1.slice(0, -(match?.[0].length ?? 0)) + `__bool-${index}__=""`;
			},
			"__": (index, html$1, _) => {
				return html$1 + createAttributeMarker(index);
			},
			"___": (index, html$1) => {
				parts.push({
					type: "node",
					index
				});
				return html$1 + COMMENT_NODE_MARKER;
			}
		};
	}
	prepareParts(clone, cache) {
		const parts = [];
		const { partPaths } = cache;
		for (const partPath of partPaths) {
			let node = clone;
			for (const index of partPath.path) node = node.childNodes[index];
			if (partPath.type === "node") {
				const textNode = document.createTextNode("");
				node.parentNode.replaceChild(textNode, node);
				parts.push({
					type: "node",
					index: partPath.index,
					node: textNode
				});
			} else if (partPath.type === "event") {
				const element = node;
				element.removeAttribute(`__event-${partPath.index}__`);
				parts.push({
					type: "event",
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === "property") {
				const element = node;
				element.removeAttribute(`__prop-${partPath.index}__`);
				parts.push({
					type: "property",
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === "action") {
				const element = node;
				if (partPath.index >= 0) element.removeAttribute(`__action-${partPath.index}__`);
				else element.removeAttribute(`:${partPath.name}`);
				parts.push({
					type: "action",
					index: partPath.index,
					name: partPath.name,
					node: element,
					staticValue: partPath.staticValue
				});
			} else if (partPath.type === "boolean-attribute") {
				const element = node;
				element.removeAttribute(`__bool-${partPath.index}__`);
				parts.push({
					type: "boolean-attribute",
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === "attribute") {
				const element = node;
				element.removeAttribute(partPath.name);
				parts.push({
					type: "attribute",
					index: partPath.index,
					name: partPath.name,
					node: element,
					attributeStrings: partPath.attributeStrings,
					attributeIndices: partPath.attributeIndices
				});
			}
		}
		return parts;
	}
	parseAttributeValue(value) {
		const strings = [];
		const indices = [];
		let lastIndex = 0;
		let match;
		ATTRIBUTE_MARKER_REGEX.lastIndex = 0;
		while ((match = ATTRIBUTE_MARKER_REGEX.exec(value)) !== null) {
			strings.push(value.slice(lastIndex, match.index));
			indices.push(Number(match[1]));
			lastIndex = match.index + match[0].length;
		}
		if (indices.length === 0) return null;
		strings.push(value.slice(lastIndex));
		return {
			strings,
			indices
		};
	}
	ensureMarkers(part) {
		if (part.startMarker) return;
		const parent = part.node.parentNode;
		if (!parent) return;
		const startMarker = document.createComment("part-start");
		const endMarker = document.createComment("part-end");
		parent.insertBefore(startMarker, part.node);
		parent.insertBefore(endMarker, part.node.nextSibling);
		part.startMarker = startMarker;
		part.endMarker = endMarker;
	}
	clearRenderedNodes(part) {
		if (!part.renderedNodes || part.renderedNodes.length === 0) return;
		for (const node of part.renderedNodes) node.parentNode?.removeChild(node);
		part.renderedNodes = [];
		part.arrayState = void 0;
		part.nestedContainer = void 0;
	}
	clearDirectiveDOM(part) {
		const state = part.directiveState;
		if (!state) return;
		const startMarker = state.startMarker;
		const endMarker = state.endMarker;
		if (startMarker && endMarker && startMarker.parentNode) {
			const parent = startMarker.parentNode;
			let node = startMarker.nextSibling;
			while (node && node !== endMarker) {
				const next = node.nextSibling;
				parent.removeChild(node);
				node = next;
			}
			if (part.node) parent.insertBefore(part.node, endMarker);
			parent.removeChild(startMarker);
			parent.removeChild(endMarker);
		}
		part.directiveState = void 0;
	}
	cleanupParts(parts) {
		for (const part of parts) {
			if (part.actionCleanup) try {
				part.actionCleanup();
			} catch (error) {
				console.error("Action directive cleanup failed:", error);
			} finally {
				part.actionCleanup = void 0;
			}
			if (part.renderedNodes && part.renderedNodes.length > 0) this.clearRenderedNodes(part);
		}
	}
	renderNestedTemplate(part, template) {
		this.ensureMarkers(part);
		if (part.nestedContainer) {
			if (part.nestedContainer.__templateKey === getTemplateKey(template.strings)) {
				template.renderInto(part.nestedContainer);
				return;
			}
			const oldParts = part.nestedContainer.__parts;
			if (oldParts) this.cleanupParts(oldParts);
		}
		this.clearRenderedNodes(part);
		part.node.textContent = "";
		const container = document.createDocumentFragment();
		template.renderInto(container);
		part.nestedContainer = container;
		part.renderedNodes = Array.from(container.childNodes);
		part.endMarker.parentNode.insertBefore(container, part.endMarker);
	}
	renderNode(part, node) {
		this.ensureMarkers(part);
		this.clearRenderedNodes(part);
		part.node.textContent = "";
		part.renderedNodes = [node];
		part.endMarker.parentNode.insertBefore(node, part.endMarker);
	}
	renderArray(part, values) {
		this.ensureMarkers(part);
		part.node.textContent = "";
		const parent = part.endMarker.parentNode;
		const keyedValues = this.getKeyedValues(values);
		if (keyedValues) {
			const state = part.arrayState ?? {
				items: /* @__PURE__ */ new Map(),
				keys: []
			};
			const newItems = /* @__PURE__ */ new Map();
			const newKeys = [];
			for (const item of keyedValues) {
				const existing = state.items.get(item.key);
				if (existing) {
					this.updateArrayItem(existing, item.value, parent, part.endMarker);
					newItems.set(item.key, existing);
				} else {
					const created = this.createArrayItem(item.value, parent, part.endMarker);
					newItems.set(item.key, {
						key: item.key,
						value: item.value,
						container: created.container,
						nodes: created.nodes
					});
				}
				newKeys.push(item.key);
			}
			for (const [key, oldItem] of state.items.entries()) if (!newItems.has(key)) for (const node of oldItem.nodes) node.parentNode?.removeChild(node);
			let referenceNode = part.startMarker.nextSibling;
			for (const key of newKeys) {
				const item = newItems.get(key);
				for (const node of item.nodes) {
					if (node === referenceNode) {
						referenceNode = referenceNode?.nextSibling ?? null;
						continue;
					}
					parent.insertBefore(node, referenceNode ?? part.endMarker);
				}
			}
			part.arrayState = {
				items: newItems,
				keys: newKeys
			};
			part.renderedNodes = newKeys.flatMap((key) => newItems.get(key).nodes);
			return;
		}
		this.clearRenderedNodes(part);
		const renderedNodes = [];
		for (const value of values) if (value instanceof TemplateResult) {
			const fragment = document.createDocumentFragment();
			value.renderInto(fragment);
			const nodes = Array.from(fragment.childNodes);
			renderedNodes.push(...nodes);
			parent.insertBefore(fragment, part.endMarker);
		} else if (value instanceof Node) {
			renderedNodes.push(value);
			parent.insertBefore(value, part.endMarker);
		} else if (value !== null && value !== void 0) {
			const textNode = document.createTextNode(String(value));
			renderedNodes.push(textNode);
			parent.insertBefore(textNode, part.endMarker);
		}
		part.renderedNodes = renderedNodes;
	}
	getKeyedValues(values) {
		if (values.length === 0) return null;
		const keyedValues = [];
		for (const value of values) if (value && typeof value === "object" && value.__keyed === true) {
			const keyed = value;
			keyedValues.push({
				key: keyed.key,
				value: keyed.value
			});
		} else return null;
		return keyedValues;
	}
	createArrayItem(value, parent, endMarker) {
		const container = document.createDocumentFragment();
		if (value instanceof TemplateResult) value.renderInto(container);
		else if (value instanceof Node) container.appendChild(value);
		else if (value !== null && value !== void 0) container.appendChild(document.createTextNode(String(value)));
		const nodes = Array.from(container.childNodes);
		parent.insertBefore(container, endMarker);
		return {
			container,
			nodes
		};
	}
	updateArrayItem(item, value, parent, endMarker) {
		if (value instanceof TemplateResult) {
			value.renderInto(item.container);
			item.value = value;
			item.nodes = Array.from(item.container.childNodes);
			return;
		}
		if (value === item.value) return;
		for (const node of item.nodes) node.parentNode?.removeChild(node);
		item.container = document.createDocumentFragment();
		if (value instanceof Node) item.container.appendChild(value);
		else if (value !== null && value !== void 0) item.container.appendChild(document.createTextNode(String(value)));
		item.nodes = Array.from(item.container.childNodes);
		parent.insertBefore(item.container, endMarker);
		item.value = value;
	}
	commit(parts) {
		for (const part of parts) {
			const value = this.values[part.index];
			const isCompositeAttribute = part.type === "attribute" && part.attributeIndices && part.attributeStrings;
			if (!isCompositeAttribute && !isDirective(value) && part.type !== "action" && part.previousValue === value) continue;
			switch (part.type) {
				case "node":
					if (part.node) {
						const wasDirective = isDirective(part.previousValue);
						const nowDirective = isDirective(value);
						if (wasDirective && !nowDirective && part.directiveState) this.clearDirectiveDOM(part);
						if (!wasDirective && nowDirective) this.clearRenderedNodes(part);
						if (nowDirective) part.directiveState = value.render(part.node, part.directiveState);
						else if (value instanceof TemplateResult) this.renderNestedTemplate(part, value);
						else if (value instanceof Node) this.renderNode(part, value);
						else if (Array.isArray(value)) this.renderArray(part, value);
						else {
							this.clearRenderedNodes(part);
							part.node.textContent = String(value ?? "");
						}
					}
					break;
				case "attribute":
					if (part.node && part.name) {
						const element = part.node;
						if (isDirective(value)) part.directiveState = value.render(element, part.directiveState);
						else if (isCompositeAttribute) {
							const strings = part.attributeStrings;
							const indices = part.attributeIndices;
							let composed = strings[0] ?? "";
							for (let i = 0; i < indices.length; i++) {
								const segmentValue = this.values[indices[i]];
								composed += `${segmentValue ?? ""}${strings[i + 1] ?? ""}`;
							}
							if (part.previousValue === composed) break;
							if (composed === "" && strings.every((segment) => segment === "")) element.removeAttribute(part.name);
							else element.setAttribute(part.name, composed);
							part.previousValue = composed;
							continue;
						} else if (value === null || value === void 0 || value === false) element.removeAttribute(part.name);
						else if (value === true) element.setAttribute(part.name, "");
						else element.setAttribute(part.name, String(value));
					}
					break;
				case "boolean-attribute":
					if (part.node && part.name) {
						const element = part.node;
						if (value) element.setAttribute(part.name, "");
						else element.removeAttribute(part.name);
					}
					break;
				case "property":
					if (part.node && part.name) if (isDirective(value)) part.directiveState = value.render(part.node, part.directiveState);
					else part.node[part.name] = value;
					break;
				case "event":
					if (part.node && part.name) {
						const element = part.node;
						if (part.previousValue === value) break;
						if (part.previousValue && typeof part.previousValue === "function") element.removeEventListener(part.name, part.previousValue);
						if (typeof value === "function") element.addEventListener(part.name, value);
					}
					break;
				case "action":
					if (part.node && part.name) {
						const element = part.node;
						const directiveValue = part.index >= 0 ? value : part.staticValue;
						if (part.index >= 0 && part.previousValue === directiveValue) continue;
						if (part.index < 0 && part.actionCleanup !== void 0) continue;
						if (part.actionCleanup) {
							part.actionCleanup();
							part.actionCleanup = void 0;
						}
						const directive$1 = getAttributeDirective(part.name);
						if (directive$1) {
							const cleanup = directive$1(element, directiveValue, part.name);
							if (typeof cleanup === "function") part.actionCleanup = cleanup;
							else part.actionCleanup = () => {};
						} else console.warn(`Attribute directive ':${part.name}' not found in registry`);
					}
					break;
				default: break;
			}
			part.previousValue = value;
		}
	}
};
function html(strings, ...values) {
	return new TemplateResult(strings, values);
}
const css = html;
var _ref$2;
var OUTLET_REGISTER_EVENT = "melodic:outlet-register";
var RouterOutletComponent = class RouterOutletComponent$1 {
	constructor() {
		this._depth = 0;
		this._context = null;
		this._currentComponent = null;
		this._currentElement = null;
		this._childOutlets = /* @__PURE__ */ new Map();
		this._parentOutlet = null;
		this._initialized = false;
		this._navigationCleanup = null;
		this.routes = [];
		this.name = "primary";
	}
	onInit() {
		const handler = () => this.onNavigate();
		window.addEventListener("NavigationEvent", handler);
		this._navigationCleanup = () => window.removeEventListener("NavigationEvent", handler);
		this.elementRef.addEventListener(OUTLET_REGISTER_EVENT, ((event) => {
			if (event.detail.outlet === this) return;
			event.stopPropagation();
			this.registerChildOutlet(event.detail);
		}));
	}
	onCreate() {
		this.findParentOutlet();
		queueMicrotask(() => {
			this._initialized = true;
			if (this._depth === 0 && this.routes.length > 0) this._router.setRoutes(this.routes);
			if (this._parentOutlet) this.requestContextFromParent();
			else this.onNavigate();
		});
	}
	onDestroy() {
		this._navigationCleanup?.();
		if (this._parentOutlet) this._parentOutlet.unregisterChildOutlet(this.name);
	}
	onPropertyChange(name) {
		if (name === "routes" && this._initialized) {
			if (this._depth === 0) this._router.setRoutes(this.routes);
			this._currentComponent = null;
			this.onNavigate();
		}
	}
	getDepth() {
		return this._depth;
	}
	getContext() {
		return this._context;
	}
	findParentOutlet() {
		let element = this.elementRef;
		while (element) {
			const root = element.getRootNode();
			if (root instanceof ShadowRoot) {
				element = root.host;
				if (element.tagName.toLowerCase() !== "router-outlet") {
					const parentOutlet = element.shadowRoot?.querySelector("router-outlet");
					if (parentOutlet && parentOutlet !== this.elementRef) {
						this._parentOutlet = parentOutlet.component;
						this._depth = (this._parentOutlet?._depth ?? -1) + 1;
						return;
					}
				}
			} else {
				const parentOutlet = element.closest?.("router-outlet");
				if (parentOutlet && parentOutlet !== this.elementRef) {
					this._parentOutlet = parentOutlet.component;
					this._depth = (this._parentOutlet?._depth ?? -1) + 1;
					return;
				}
				break;
			}
		}
		this._depth = 0;
	}
	requestContextFromParent() {
		const event = new CustomEvent(OUTLET_REGISTER_EVENT, {
			bubbles: true,
			composed: true,
			detail: {
				outlet: this,
				callback: (context) => this.receiveContext(context)
			}
		});
		this.elementRef.dispatchEvent(event);
	}
	registerChildOutlet(registration) {
		this._childOutlets.set(registration.outlet.name, registration.outlet);
		if (this._context?.currentMatch?.children) {
			const childContext = this.createChildContext();
			if (childContext) registration.callback(childContext);
		}
	}
	unregisterChildOutlet(name) {
		this._childOutlets.delete(name);
	}
	receiveContext(context) {
		this._context = context;
		this.routes = context.routes;
		this.renderFromContext();
	}
	createChildContext() {
		if (!this._context?.currentMatch) return null;
		const match = this._context.currentMatch;
		return {
			depth: this._depth + 1,
			routes: match.children ?? [],
			currentMatch: void 0,
			ancestorMatches: [...this._context.ancestorMatches],
			params: { ...this._context.params },
			remainingPath: match.remainingPath,
			basePath: match.fullPath,
			parent: this._context
		};
	}
	onNavigate() {
		if (!this._initialized) return;
		if (this._depth === 0) this.matchAndRender(window.location.pathname);
	}
	async matchAndRender(fullPath) {
		const routes = this.routes.length > 0 ? this.routes : this._router.getRoutes();
		if (routes.length === 0) return;
		const matchResult = matchRouteTree(routes, fullPath);
		if (matchResult.redirectTo) {
			if (window.location.pathname !== matchResult.redirectTo) this._router.navigate(matchResult.redirectTo, { replace: true });
			return;
		}
		if (matchResult.matches.length > 0) {
			const guardResult = await this._router.runGuards(matchResult);
			if (guardResult !== true) {
				if (typeof guardResult === "string") this._router.navigate(guardResult, {
					replace: true,
					skipGuards: true
				});
				return;
			}
		}
		if (matchResult.matches.length > 0) {
			const resolverResult = await this._router.runResolvers(matchResult);
			if (!resolverResult.success) {
				console.error("Resolver failed:", resolverResult.error);
				await this.render404();
				return;
			}
		}
		this._router.setCurrentMatches(matchResult);
		if (matchResult.matches.length > 0) {
			const match = matchResult.matches[0];
			this._context = {
				depth: 0,
				routes,
				currentMatch: match,
				ancestorMatches: [match],
				params: match.params,
				remainingPath: match.remainingPath,
				basePath: "",
				parent: void 0
			};
			await this.renderMatch(match, matchResult);
		} else await this.render404();
	}
	async renderFromContext() {
		if (!this._context || this.routes.length === 0) return;
		const remainingPath = this._context.remainingPath;
		const matchResult = matchRouteTree(this.routes, remainingPath, this._context.basePath);
		if (matchResult.redirectTo) {
			const fullRedirect = this._context.basePath ? `/${this._context.basePath}/${matchResult.redirectTo}`.replace(/\/+/g, "/") : matchResult.redirectTo;
			if (window.location.pathname !== fullRedirect) this._router.navigate(fullRedirect, { replace: true });
			return;
		}
		if (matchResult.matches.length > 0) {
			const match = matchResult.matches[0];
			this._context = {
				...this._context,
				currentMatch: match,
				ancestorMatches: [...this._context.ancestorMatches, match],
				params: {
					...this._context.params,
					...match.params
				}
			};
			await this.renderMatch(match, matchResult);
		} else await this.render404();
	}
	async renderMatch(match, _) {
		const route = match.route;
		if (route.component === this._currentComponent) {
			this.updateChildOutlets();
			return;
		}
		if (route.loadChildren && !match.children) try {
			const module = await route.loadChildren();
			match.children = module.routes;
			route.children = module.routes;
		} catch (error) {
			console.error("Failed to load child routes:", error);
			await this.render404();
			return;
		}
		if (route.loadComponent) try {
			await route.loadComponent();
		} catch (error) {
			console.error("Failed to load component:", error);
			await this.render404();
			return;
		}
		if (route.component) await this.renderComponent(route.component);
	}
	async renderComponent(componentTag) {
		const shadowRoot = this.elementRef.shadowRoot;
		if (!shadowRoot) return;
		if (this._currentElement) {
			this._currentElement.remove();
			this._currentElement = null;
		}
		this._currentComponent = componentTag;
		const component = document.createElement(componentTag);
		component.__parentOutlet = this;
		shadowRoot.appendChild(component);
		this._currentElement = component;
		queueMicrotask(() => this.updateChildOutlets());
	}
	updateChildOutlets() {
		const childContext = this.createChildContext();
		if (!childContext) return;
		for (const [, childOutlet] of this._childOutlets) childOutlet.receiveContext(childContext);
	}
	async render404() {
		const notFoundRoute = this.routes.find((r) => r.path === "404" || r.path === "**");
		if (notFoundRoute?.component) await this.renderComponent(notFoundRoute.component);
		else if (this._depth === 0) this._router.navigate("/404", { replace: true });
	}
};
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref$2 = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref$2 : Object)], RouterOutletComponent.prototype, "_router", void 0);
RouterOutletComponent = __decorate([MelodicComponent({
	selector: "router-outlet",
	template: () => html`<slot></slot>`
})], RouterOutletComponent);
var _ref$1;
var RouterLinkComponent = class RouterLinkComponent$1 {
	constructor() {
		this._anchorElement = null;
		this._navigationCleanup = null;
		this.href = "";
		this.data = null;
		this.queryParams = {};
		this.activeClass = "active";
		this.exactMatch = false;
		this.replace = false;
	}
	onCreate() {
		this._anchorElement = this.elementRef.shadowRoot?.querySelector("a") ?? null;
		const initialHref = this.elementRef.getAttribute("href");
		if (initialHref) this.href = initialHref;
		const initialActiveClass = this.elementRef.getAttribute("active-class");
		if (initialActiveClass) this.activeClass = initialActiveClass;
		this.updateAnchorHref();
		this.elementRef.addEventListener("click", (e) => {
			e.preventDefault();
			if (e.ctrlKey || e.metaKey || e.shiftKey) {
				window.open(this.buildFullPath(), "_blank");
				return;
			}
			this.navigate();
		}, false);
		const handler = () => this.updateActiveState();
		window.addEventListener("NavigationEvent", handler);
		this._navigationCleanup = () => window.removeEventListener("NavigationEvent", handler);
		this.updateActiveState();
	}
	onDestroy() {
		this._navigationCleanup?.();
	}
	onAttributeChange(attribute, _, newVal) {
		if (attribute === "href") {
			this.href = newVal;
			this.updateAnchorHref();
			this.updateActiveState();
		} else if (attribute === "active-class") {
			this.activeClass = newVal;
			this.updateActiveState();
		}
	}
	onPropertyChange(name) {
		if (name === "href" || name === "queryParams") {
			this.updateAnchorHref();
			this.updateActiveState();
		}
	}
	isActive() {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith("/") ? this.href : `/${this.href}`;
		if (this.exactMatch) return currentPath === linkPath;
		return currentPath.startsWith(linkPath);
	}
	buildFullPath() {
		let path = this.href;
		if (this.queryParams && Object.keys(this.queryParams).length > 0) {
			const params = new URLSearchParams(this.queryParams);
			path = `${path}?${params.toString()}`;
		}
		return path;
	}
	updateAnchorHref() {
		if (this._anchorElement) this._anchorElement.href = this.buildFullPath();
	}
	async navigate() {
		const options = {
			data: this.data,
			replace: this.replace,
			queryParams: this.queryParams
		};
		await this._router.navigate(this.href, options);
	}
	updateActiveState() {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith("/") ? this.href : `/${this.href}`;
		const normalizedCurrentPath = currentPath.replace(/\/$/, "") || "/";
		const normalizedLinkPath = linkPath.replace(/\/$/, "") || "/";
		let isActive;
		if (this.exactMatch) isActive = normalizedCurrentPath === normalizedLinkPath;
		else isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + "/");
		if (isActive) {
			this.elementRef.classList.add(this.activeClass);
			this._anchorElement?.setAttribute("aria-current", "page");
		} else {
			this.elementRef.classList.remove(this.activeClass);
			this._anchorElement?.removeAttribute("aria-current");
		}
	}
};
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref$1 = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref$1 : Object)], RouterLinkComponent.prototype, "_router", void 0);
RouterLinkComponent = __decorate([MelodicComponent({
	selector: "router-link",
	template: () => html`<a part="link"><slot></slot></a>`,
	styles: () => css`
		:host {
			display: inline-block;
			cursor: pointer;
		}
		a {
			color: inherit;
			text-decoration: inherit;
			font: inherit;
			display: block;
		}
	`,
	attributes: ["href", "active-class"]
})], RouterLinkComponent);
function routerLinkDirective(element, value, _) {
	let options;
	if (typeof value === "string") options = { href: value };
	else if (value && typeof value === "object" && "href" in value) options = value;
	else {
		console.warn("routerLink: Invalid value. Expected string or { href: string, ... }");
		return;
	}
	const { href, activeClass = "active", exactMatch = false, replace = false, data = null, queryParams = {} } = options;
	const router = Injector.get(RouterService);
	const buildFullPath = () => {
		let path = href;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			path = `${path}?${params.toString()}`;
		}
		return path;
	};
	if (element.tagName.toLowerCase() === "a") element.href = buildFullPath();
	const updateActiveState = () => {
		const currentPath = window.location.pathname;
		const linkPath = href.startsWith("/") ? href : `/${href}`;
		const normalizedCurrentPath = currentPath.replace(/\/$/, "") || "/";
		const normalizedLinkPath = linkPath.replace(/\/$/, "") || "/";
		let isActive;
		if (exactMatch) isActive = normalizedCurrentPath === normalizedLinkPath;
		else isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + "/");
		if (isActive) {
			element.classList.add(activeClass);
			if (element.tagName.toLowerCase() === "a") element.setAttribute("aria-current", "page");
		} else {
			element.classList.remove(activeClass);
			element.removeAttribute("aria-current");
		}
		element.setAttribute("router-link", "");
	};
	const handleClick = (e) => {
		const mouseEvent = e;
		if (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.shiftKey) {
			if (element.tagName.toLowerCase() === "a") return;
			window.open(buildFullPath(), "_blank");
			return;
		}
		e.preventDefault();
		const navOptions = {
			data,
			replace,
			queryParams
		};
		router.navigate(href, navOptions);
	};
	const handleNavigation = () => {
		updateActiveState();
	};
	element.addEventListener("click", handleClick);
	window.addEventListener("NavigationEvent", handleNavigation);
	updateActiveState();
	return (() => {
		element.removeEventListener("click", handleClick);
		window.removeEventListener("NavigationEvent", handleNavigation);
	});
}
registerAttributeDirective("routerLink", routerLinkDirective);
var activeEffect = null;
const setActiveEffect = (effect) => {
	activeEffect = effect;
};
const getActiveEffect = () => activeEffect;
var SignalEffect = class {
	constructor(execute) {
		this.execute = execute;
		this._dependencies = /* @__PURE__ */ new Set();
		this._isRunning = false;
		this._needsRerun = false;
		this.run = () => {
			if (this._isRunning) {
				this._needsRerun = true;
				return;
			}
			this._isRunning = true;
			do {
				this._needsRerun = false;
				this._dependencies.forEach((signal$1) => {
					signal$1.unsubscribe(this.run);
				});
				this._dependencies.clear();
				const prevEffect = getActiveEffect();
				setActiveEffect(this);
				this.execute();
				setActiveEffect(prevEffect);
			} while (this._needsRerun);
			this._isRunning = false;
		};
	}
	addDependency(signal$1) {
		this._dependencies.add(signal$1);
	}
	destroy() {
		this._dependencies.forEach((signal$1) => {
			signal$1.unsubscribe(this.run);
		});
		this._dependencies.clear();
	}
};
function signal(initialValue) {
	let value = initialValue;
	const subscribers = /* @__PURE__ */ new Set();
	const notify = () => {
		[...subscribers].forEach((subscriber) => subscriber(value));
	};
	const read = (() => {
		const activeEffect$1 = getActiveEffect();
		if (activeEffect$1) {
			activeEffect$1.addDependency(read);
			subscribers.add(activeEffect$1.run);
		}
		return value;
	});
	read.set = (newValue) => {
		if (value !== newValue) {
			value = newValue;
			notify();
		}
	};
	read.update = (updater) => {
		read.set(updater(value));
	};
	read.subscribe = (subscriber) => {
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};
	read.unsubscribe = (subscriber) => {
		subscribers.delete(subscriber);
	};
	read.destroy = () => {
		subscribers.clear();
	};
	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});
	return read;
}
function computed(computation) {
	const computedSignal = signal(void 0);
	const effect = new SignalEffect(() => {
		computedSignal.set(computation());
	});
	effect.run();
	const originalDestroy = computedSignal.destroy;
	computedSignal.destroy = () => {
		effect.destroy();
		originalDestroy();
	};
	return computedSignal;
}
const props = () => {
	return () => ({});
};
const createAction = (type, payloadFn) => {
	return ((payload) => ({
		type,
		payload: payload ?? (payloadFn ? payloadFn() : void 0)
	}));
};
function createReducer(...actionReducers) {
	return { reducers: actionReducers };
}
const createState = (initState) => {
	const state = {};
	Object.keys(initState).forEach((key) => {
		state[key] = signal(initState[key]);
	});
	return state;
};
const onAction = (action, reducer) => {
	return {
		action: action(),
		reducer
	};
};
const RX_INIT_STATE = createToken("RX_INIT_STATE");
const RX_ACTION_PROVIDERS = createToken("RX_ACTION_PROVIDERS");
const RX_EFFECTS_PROVIDERS = createToken("RX_EFFECTS_PROVIDERS");
const RX_STATE_DEBUG = createToken("RX_STATE_DEBUG");
var EffectsBase = class {
	constructor() {
		this._effects = [];
	}
	addEffect(actions, effect) {
		this._effects.push({
			actions,
			effect
		});
	}
	getEffects() {
		return this._effects;
	}
};
var ComponentStateBaseService = class extends EffectsBase {
	constructor(_initState, _reducerConfig = { reducers: [] }, _debug = false) {
		super();
		this._initState = _initState;
		this._reducerConfig = _reducerConfig;
		this._debug = _debug;
		this._state = signal(_initState);
	}
	get state() {
		return this._state();
	}
	resetState() {
		this._state.set(this._initState);
	}
	select(selectFn) {
		return computed(() => selectFn(this._state()));
	}
	dispatch(action) {
		if (this._debug) {
			console.log(`[ComponentState] Action: ${action.type}`);
			console.log(`[ComponentState] Payload:`, action.payload);
			console.log(`[ComponentState] Before:`, this._state());
		}
		const reducer = this._reducerConfig.reducers.find((r) => r.action.type === action.type);
		if (reducer) {
			this._state.update((state) => reducer.reducer(state, action));
			if (this._debug) console.log(`[ComponentState] After:`, this._state());
		}
		this.executeEffects(action);
	}
	patchState(partial) {
		this._state.update((state) => ({
			...state,
			...partial
		}));
	}
	executeEffects(action) {
		this.getEffects().filter((effect) => effect.actions.some((a) => a().type === action.type)).forEach((effect) => {
			effect.effect(action).then((newAction) => {
				if (newAction === void 0) return;
				(Array.isArray(newAction) ? newAction : [newAction]).forEach((na) => this.dispatch(na));
			});
		});
	}
};
var SignalStoreService = class SignalStoreService$1 {
	constructor() {
		if (this._debug) console.info("RX State Debugging: Enabled");
	}
	select(key, selectFn) {
		return computed(() => {
			return selectFn(this._state[key]());
		});
	}
	logState() {
		console.log(this.getCurrentState());
	}
	dispatch(x, y) {
		const key = typeof x === "string" ? x : void 0;
		const action = typeof x === "string" ? y : x;
		if (this._debug) {
			console.log(`Action: ${action.type}`);
			console.log(`Payload:`, action.payload);
			console.log(`Current State:`, this.getCurrentState());
		}
		if (key) this.dispatchWithKey(key, action);
		else this.dispatchWithoutKey(action);
	}
	dispatchWithKey(key, action) {
		if (!this._reducerMap[key]) throw new Error(`Reducer not found for key: ${key}`);
		const reducer = this._reducerMap[key].reducers.find((reducer$1) => reducer$1.action.type === action.type);
		if (reducer !== void 0) {
			const newState = reducer.reducer(this._state[key](), action);
			this._state[key].set(newState);
			if (this._debug) console.log(`New State:`, this.getCurrentState());
		}
		this.getEffectsForAction(key, action).forEach((effect) => {
			effect.effect(action).then((newAction) => {
				if (newAction === void 0) return;
				if (!Array.isArray(newAction)) newAction = [newAction];
				newAction.forEach((na) => {
					this.dispatch(na);
				});
			});
		});
	}
	dispatchWithoutKey(action) {
		const reducerWithKey = this.getReducerForAction(action);
		if (reducerWithKey !== void 0) {
			const newState = reducerWithKey.actionReducer.reducer(this._state[reducerWithKey.key](), action);
			this._state[reducerWithKey.key].set(newState);
			if (this._debug) console.log(`New State:`, this.getCurrentState());
		}
		const effectsWithKey = this.getEffectsForAction(action);
		if (effectsWithKey !== void 0) effectsWithKey.actionEffects.forEach((effect) => {
			effect.effect(action).then((newAction) => {
				if (newAction === void 0) return;
				if (!Array.isArray(newAction)) newAction = [newAction];
				newAction.forEach((na) => {
					this.dispatch(na);
				});
			});
		});
	}
	getReducerForAction(action) {
		const keys = Object.keys(this._reducerMap);
		for (const key of keys) {
			const reducer = (this._reducerMap[key]?.reducers || []).find((reducer$1) => reducer$1.action.type === action.type);
			if (reducer) return {
				key,
				actionReducer: reducer
			};
		}
	}
	getEffectsForAction(key, action) {
		if (typeof key === "string") return this.getEffectsForActionWithKey(key, action);
		else return this.getEffectsForActionWithoutKey(key);
	}
	getEffectsForActionWithoutKey(action) {
		const keys = Object.keys(this._reducerMap);
		for (const key of keys) {
			const effectClass = this._effectMap[key];
			if (effectClass) {
				const effects = Injector.get(effectClass).getEffects().filter((effect) => effect.actions.some((a) => a().type === action.type));
				if (effects.length > 0) return {
					key,
					actionEffects: effects
				};
			}
		}
	}
	getEffectsForActionWithKey(key, action) {
		const effectClass = this._effectMap[key];
		if (effectClass) return Injector.get(effectClass).getEffects().filter((effect) => effect.actions.some((a) => a().type === action.type));
		return [];
	}
	getCurrentState() {
		return Object.keys(this._state).reduce((acc, key) => {
			acc[key] = this._state[key]();
			return acc;
		}, {});
	}
};
__decorate([Service(RX_INIT_STATE), __decorateMetadata("design:type", Object)], SignalStoreService.prototype, "_state", void 0);
__decorate([Service(RX_ACTION_PROVIDERS), __decorateMetadata("design:type", Object)], SignalStoreService.prototype, "_reducerMap", void 0);
__decorate([Service(RX_EFFECTS_PROVIDERS), __decorateMetadata("design:type", Object)], SignalStoreService.prototype, "_effectMap", void 0);
__decorate([Service(RX_STATE_DEBUG), __decorateMetadata("design:type", Boolean)], SignalStoreService.prototype, "_debug", void 0);
SignalStoreService = __decorate([Injectable(), __decorateMetadata("design:paramtypes", [])], SignalStoreService);
function provideRX(initState, actionReducers, effects, debug = false) {
	return (injector) => {
		injector.bindValue(RX_INIT_STATE, initState);
		injector.bindValue(RX_ACTION_PROVIDERS, actionReducers);
		injector.bindValue(RX_EFFECTS_PROVIDERS, effects);
		injector.bindValue(RX_STATE_DEBUG, debug);
		injector.bind(SignalStoreService, SignalStoreService, { dependencies: [
			RX_INIT_STATE,
			RX_ACTION_PROVIDERS,
			RX_EFFECTS_PROVIDERS
		] });
	};
}
var compiledCache = /* @__PURE__ */ new WeakMap();
var CompiledTemplate = class CompiledTemplate {
	constructor(strings) {
		this._factory = null;
		this._hasEvents = false;
		this._canCompile = false;
		this.analyzeAndCompile(strings);
	}
	static compile(strings) {
		let compiled = compiledCache.get(strings);
		if (!compiled) {
			compiled = new CompiledTemplate(strings);
			compiledCache.set(strings, compiled);
		}
		return compiled;
	}
	canUseFastPath() {
		return this._canCompile && !this._hasEvents;
	}
	create(values) {
		if (this._factory) return {
			nodes: [this._factory(values)],
			eventTargets: []
		};
		return {
			nodes: [],
			eventTargets: []
		};
	}
	createDirect(values) {
		return this._factory ? this._factory(values) : null;
	}
	analyzeAndCompile(strings) {
		if (strings.length < 2) return;
		for (const s of strings) if (s.includes("@")) {
			this._hasEvents = true;
			return;
		}
		let html$1 = strings[0];
		for (let i = 1; i < strings.length; i++) html$1 += `\${${i - 1}}` + strings[i];
		const fullMatch = html$1.match(/^<([\w-]+)([^>]*)>(.*)$/s);
		if (!fullMatch) return;
		const [, tag, attrString, rest] = fullMatch;
		const closingTag = `</${tag}>`;
		if (!rest.endsWith(closingTag)) return;
		const textContent = rest.slice(0, -closingTag.length);
		const attrs = [];
		const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\$\{(\d+)\})/g;
		let attrMatch;
		while ((attrMatch = attrRegex.exec(attrString)) !== null) {
			const name = attrMatch[1];
			const staticVal = attrMatch[2] ?? attrMatch[3];
			const dynamicIndex = attrMatch[4];
			if (dynamicIndex !== void 0) attrs.push({
				name,
				valueIndex: parseInt(dynamicIndex, 10)
			});
			else if (staticVal !== void 0) {
				const placeholderMatch = staticVal.match(/\$\{(\d+)\}/);
				if (placeholderMatch) attrs.push({
					name,
					valueIndex: parseInt(placeholderMatch[1], 10)
				});
				else attrs.push({
					name,
					valueIndex: null,
					staticValue: staticVal
				});
			}
		}
		const textParts = [];
		const remaining = textContent;
		const placeholderRegex = /\$\{(\d+)\}/g;
		let lastIndex = 0;
		let textMatch;
		placeholderRegex.lastIndex = 0;
		while ((textMatch = placeholderRegex.exec(remaining)) !== null) {
			if (textMatch.index > lastIndex) textParts.push({ static: remaining.slice(lastIndex, textMatch.index) });
			textParts.push({ valueIndex: parseInt(textMatch[1], 10) });
			lastIndex = textMatch.index + textMatch[0].length;
		}
		if (lastIndex < remaining.length) textParts.push({ static: remaining.slice(lastIndex) });
		this._factory = (values) => {
			const el = document.createElement(tag);
			for (const attr of attrs) if (attr.valueIndex !== null) {
				const value = values[attr.valueIndex];
				if (value !== null && value !== void 0 && value !== false) el.setAttribute(attr.name, value === true ? "" : String(value));
			} else if (attr.staticValue !== void 0) el.setAttribute(attr.name, attr.staticValue);
			let text = "";
			for (const part of textParts) if ("static" in part) text += part.static;
			else text += values[part.valueIndex] ?? "";
			el.textContent = text;
			return el;
		};
		this._canCompile = true;
	}
};
function directive(renderFn) {
	return {
		__directive: true,
		render: renderFn
	};
}
function repeat(items, keyFn, template) {
	return directive((container, previousState) => {
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) throw new Error("repeat() directive: container must be attached to a parent node");
			const startMarker = document.createComment("repeat-start");
			const endMarker = document.createComment("repeat-end");
			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);
			const state = {
				keyToIndex: /* @__PURE__ */ new Map(),
				items: [],
				startMarker,
				endMarker
			};
			updateList$1(items, keyFn, template, state);
			return state;
		}
		updateList$1(items, keyFn, template, previousState);
		return previousState;
	});
}
function updateList$1(newItems, keyFn, template, state) {
	const oldItems = state.items;
	const newKeyToIndex = /* @__PURE__ */ new Map();
	const newEntries = [];
	for (let i = 0; i < newItems.length; i++) {
		const key = keyFn(newItems[i], i);
		newKeyToIndex.set(key, i);
	}
	if (oldItems.length === newItems.length) {
		let allKeysMatch = true;
		for (let i = 0; i < newItems.length; i++) {
			const key = keyFn(newItems[i], i);
			if (i >= oldItems.length || oldItems[i].key !== key) {
				allKeysMatch = false;
				break;
			}
		}
		if (allKeysMatch) {
			for (let i = 0; i < newItems.length; i++) template(newItems[i], i).renderInto(oldItems[i].container);
			return;
		}
	}
	if (state.useCompiledPath === void 0 && newItems.length > 0) {
		const sampleTemplate = template(newItems[0], 0);
		const compiled = CompiledTemplate.compile(sampleTemplate.strings);
		state.useCompiledPath = compiled.canUseFastPath();
		if (state.useCompiledPath) state.compiledTemplate = compiled;
	}
	const oldItemsByKey = /* @__PURE__ */ new Map();
	const oldIndexByKey = /* @__PURE__ */ new Map();
	for (const oldItem of oldItems) {
		oldItemsByKey.set(oldItem.key, oldItem);
		oldIndexByKey.set(oldItem.key, oldIndexByKey.size);
	}
	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);
		if (oldItemsByKey.has(key)) {
			const oldItem = oldItemsByKey.get(key);
			oldItemsByKey.delete(key);
			template(item, i).renderInto(oldItem.container);
			newEntries.push({
				item: oldItem,
				oldIndex: oldIndexByKey.get(key) ?? -1,
				isNew: false
			});
		} else {
			const repeatItem = createRepeatItem(item, i, key, template, state);
			newEntries.push({
				item: repeatItem,
				oldIndex: -1,
				isNew: true
			});
		}
	}
	for (const oldItem of oldItemsByKey.values()) removeItemRange(oldItem);
	if (newEntries.length === 0) {
		state.keyToIndex = newKeyToIndex;
		state.items = [];
		return;
	}
	const lisPositions = getLisPositions(newEntries);
	const parent = state.startMarker.parentElement;
	let nextSibling = state.endMarker;
	for (let i = newEntries.length - 1; i >= 0; i--) {
		const entry = newEntries[i];
		if (entry.isNew) insertItemRange(entry.item, parent, nextSibling);
		else if (!lisPositions.has(i)) moveItemRange(entry.item, nextSibling);
		nextSibling = entry.item.start;
	}
	state.keyToIndex = newKeyToIndex;
	state.items = newEntries.map((entry) => entry.item);
}
function createRepeatItem(item, index, key, template, state) {
	const templateResult = template(item, index);
	let nodes;
	let container;
	if (state.useCompiledPath && state.compiledTemplate) {
		const node = state.compiledTemplate.createDirect(templateResult.values);
		if (node) {
			nodes = [node];
			container = document.createDocumentFragment();
			container.appendChild(node);
		} else {
			container = document.createDocumentFragment();
			nodes = templateResult.renderOnce(container);
		}
	} else {
		container = document.createDocumentFragment();
		nodes = templateResult.renderOnce(container);
	}
	return {
		key,
		value: item,
		container,
		nodes,
		start: document.createComment("repeat-item-start"),
		end: document.createComment("repeat-item-end")
	};
}
function insertItemRange(item, parent, referenceNode) {
	const fragment = document.createDocumentFragment();
	fragment.appendChild(item.start);
	for (const node of item.nodes) fragment.appendChild(node);
	fragment.appendChild(item.end);
	parent.insertBefore(fragment, referenceNode);
}
function moveItemRange(item, referenceNode) {
	const parent = referenceNode.parentNode;
	if (!parent) return;
	const fragment = document.createDocumentFragment();
	let node = item.start;
	const end = item.end;
	while (node) {
		const nextNode = node.nextSibling;
		fragment.appendChild(node);
		if (node === end) break;
		node = nextNode;
	}
	parent.insertBefore(fragment, referenceNode);
}
function removeItemRange(item) {
	let node = item.start;
	const end = item.end;
	while (node) {
		const nextNode = node.nextSibling;
		node.parentNode?.removeChild(node);
		if (node === end) break;
		node = nextNode;
	}
}
function getLisPositions(entries) {
	const oldIndexSequence = [];
	const sequencePositions = [];
	for (let i = 0; i < entries.length; i++) if (entries[i].oldIndex >= 0) {
		oldIndexSequence.push(entries[i].oldIndex);
		sequencePositions.push(i);
	}
	const lisIndices = longestIncreasingSubsequence(oldIndexSequence);
	const lisPositions = /* @__PURE__ */ new Set();
	for (const seqIndex of lisIndices) {
		const position = sequencePositions[seqIndex];
		if (position !== void 0) lisPositions.add(position);
	}
	return lisPositions;
}
function longestIncreasingSubsequence(sequence) {
	if (sequence.length === 0) return [];
	const predecessors = new Array(sequence.length).fill(-1);
	const positions = new Array(sequence.length).fill(0);
	let length = 0;
	for (let i = 0; i < sequence.length; i++) {
		const value = sequence[i];
		let low = 0;
		let high = length;
		while (low < high) {
			const mid = low + high >> 1;
			if (sequence[positions[mid]] < value) low = mid + 1;
			else high = mid;
		}
		if (low > 0) predecessors[i] = positions[low - 1];
		positions[low] = i;
		if (low === length) length++;
	}
	const result = new Array(length);
	let k = positions[length - 1];
	for (let i = length - 1; i >= 0; i--) {
		result[i] = k;
		k = predecessors[k];
	}
	return result;
}
function repeatRaw(items, keyFn, factory) {
	return directive((container, previousState) => {
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) throw new Error("repeatRaw() directive: container must be attached to a parent node");
			const startMarker = document.createComment("repeat-raw-start");
			const endMarker = document.createComment("repeat-raw-end");
			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);
			const state = {
				keyToItem: /* @__PURE__ */ new Map(),
				startMarker,
				endMarker
			};
			const fragment = document.createDocumentFragment();
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const key = keyFn(item, i);
				const element = factory(item, i);
				state.keyToItem.set(key, {
					key,
					element
				});
				fragment.appendChild(element);
			}
			parent.insertBefore(fragment, endMarker);
			return state;
		}
		updateList(items, keyFn, factory, previousState);
		return previousState;
	});
}
function updateList(newItems, keyFn, factory, state) {
	const oldItems = state.keyToItem;
	const newKeyToItem = /* @__PURE__ */ new Map();
	const parent = state.startMarker.parentElement;
	const endMarker = state.endMarker;
	if (oldItems.size === newItems.length) {
		let allMatch = true;
		let i = 0;
		for (const [key] of oldItems) {
			if (key !== keyFn(newItems[i], i)) {
				allMatch = false;
				break;
			}
			i++;
		}
		if (allMatch) {
			i = 0;
			for (const [key, { element }] of oldItems) {
				const item = newItems[i];
				const newElement = factory(item, i);
				if (element !== newElement) {
					element.replaceWith(newElement);
					newKeyToItem.set(key, {
						key,
						element: newElement
					});
				} else newKeyToItem.set(key, {
					key,
					element
				});
				i++;
			}
			state.keyToItem = newKeyToItem;
			return;
		}
	}
	const fragment = document.createDocumentFragment();
	const usedKeys = /* @__PURE__ */ new Set();
	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);
		usedKeys.add(key);
		const existing = oldItems.get(key);
		if (existing) {
			const newElement = factory(item, i);
			if (existing.element !== newElement) {
				newKeyToItem.set(key, {
					key,
					element: newElement
				});
				fragment.appendChild(newElement);
			} else {
				newKeyToItem.set(key, existing);
				fragment.appendChild(existing.element);
			}
		} else {
			const element = factory(item, i);
			newKeyToItem.set(key, {
				key,
				element
			});
			fragment.appendChild(element);
		}
	}
	for (const [key, { element }] of oldItems) if (!usedKeys.has(key)) element.remove();
	parent.insertBefore(fragment, endMarker);
	state.keyToItem = newKeyToItem;
}
function when(condition, template, falseTemplate) {
	return directive((container, previousState) => {
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) throw new Error("when() directive: container must be attached to a parent node");
			const startMarker = document.createComment("when-start");
			const endMarker = document.createComment("when-end");
			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);
			const state = {
				condition: false,
				template: template(),
				falseTemplate: falseTemplate ? falseTemplate() : null,
				container: null,
				startMarker,
				endMarker,
				nodes: []
			};
			if (condition) renderContent(state, true);
			else if (state.falseTemplate) renderContent(state, false);
			state.condition = condition;
			return state;
		}
		if (!previousState.startMarker.parentNode) throw new Error("when() directive: markers were removed from DOM");
		if (condition && !previousState.condition) {
			removeContent(previousState);
			previousState.template = template();
			renderContent(previousState, true);
		} else if (!condition && previousState.condition) {
			removeContent(previousState);
			if (falseTemplate) {
				previousState.falseTemplate = falseTemplate();
				renderContent(previousState, false);
			}
		} else if (condition && previousState.condition) {
			const newTemplate = template();
			if (previousState.container) newTemplate.renderInto(previousState.container);
			previousState.template = newTemplate;
		} else if (!condition && !previousState.condition && falseTemplate) {
			const newFalseTemplate = falseTemplate();
			if (previousState.container) newFalseTemplate.renderInto(previousState.container);
			previousState.falseTemplate = newFalseTemplate;
		}
		previousState.condition = condition;
		return previousState;
	});
}
function renderContent(state, useTrueTemplate) {
	const parent = state.startMarker.parentNode;
	if (!parent) throw new Error("when() directive: markers not in DOM");
	const templateToRender = useTrueTemplate ? state.template : state.falseTemplate;
	if (!templateToRender) return;
	const container = document.createDocumentFragment();
	templateToRender.renderInto(container);
	state.container = container;
	state.nodes = Array.from(container.childNodes);
	for (const node of state.nodes) parent.insertBefore(node, state.endMarker);
}
function removeContent(state) {
	for (const node of state.nodes) node.parentNode?.removeChild(node);
	state.nodes = [];
	state.container = null;
}
function classMap(classes) {
	return directive((container, previousClasses) => {
		const element = container;
		const currentClasses = /* @__PURE__ */ new Set();
		for (const [className, shouldApply] of Object.entries(classes)) if (shouldApply) {
			element.classList.add(className);
			currentClasses.add(className);
		}
		if (previousClasses) {
			for (const className of previousClasses) if (!currentClasses.has(className)) element.classList.remove(className);
		}
		return currentClasses;
	});
}
function styleMap(styles) {
	return directive((container, previousStyles) => {
		const element = container;
		const currentStyles = /* @__PURE__ */ new Set();
		for (const [property, value] of Object.entries(styles)) if (value !== void 0) {
			element.style.setProperty(property.replace(/([A-Z])/g, "-$1").toLowerCase(), String(value));
			currentStyles.add(property);
		}
		if (previousStyles) {
			for (const property of previousStyles) if (!currentStyles.has(property)) element.style.removeProperty(property.replace(/([A-Z])/g, "-$1").toLowerCase());
		}
		return currentStyles;
	});
}
function unsafeHTML(html$1) {
	return directive((container, previousState) => {
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) throw new Error("unsafeHTML() directive: container must be attached to a parent node");
			const startMarker = document.createComment("unsafeHTML-start");
			const endMarker = document.createComment("unsafeHTML-end");
			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);
			const state = {
				html: "",
				startMarker,
				endMarker,
				nodes: []
			};
			renderHTML(html$1, state);
			return state;
		}
		if (previousState.html === html$1) return previousState;
		renderHTML(html$1, previousState);
		return previousState;
	});
}
function renderHTML(html$1, state) {
	const parent = state.startMarker.parentNode;
	if (!parent) throw new Error("unsafeHTML() directive: markers not in DOM");
	for (const node of state.nodes) node.parentNode?.removeChild(node);
	const temp = document.createElement("div");
	temp.innerHTML = html$1;
	const fragment = document.createDocumentFragment();
	while (temp.firstChild) fragment.appendChild(temp.firstChild);
	state.nodes = Array.from(fragment.childNodes);
	for (const node of state.nodes) parent.insertBefore(node, state.endMarker);
	state.html = html$1;
}
function resolveTarget(target) {
	if (typeof target === "string") return document.querySelector(target);
	return target;
}
function parsePortalValue(value) {
	if (typeof value === "string") return {
		target: value,
		persist: false
	};
	if (value instanceof Element) return {
		target: value,
		persist: false
	};
	return {
		target: value.target,
		persist: value.persist ?? false
	};
}
function portalDirective(element, value, _) {
	if (!value) {
		console.warn("portal directive: value is required");
		return;
	}
	const options = parsePortalValue(value);
	const targetElement = resolveTarget(options.target);
	if (!targetElement) {
		console.warn(`portal directive: target "${options.target}" not found`);
		return;
	}
	if (element.parentNode === targetElement) return;
	const placeholder = document.createComment("portal-placeholder");
	element.parentNode?.insertBefore(placeholder, element);
	element.removeAttribute(":portal");
	targetElement.appendChild(element);
	return () => {
		if (!options.persist) element.remove();
		placeholder.remove();
	};
}
registerAttributeDirective("portal", portalDirective);
var Directive = class {
	constructor() {
		this.__directive = true;
	}
};
const FORM_CONTROL_MARKER = Symbol("melodic.formControl");
var FormControl = class {
	constructor(initialValue, options = {}) {
		this[FORM_CONTROL_MARKER] = true;
		this._validators = [];
		this._asyncValidators = [];
		this._touched = signal(false);
		this._dirty = signal(false);
		this._pending = signal(false);
		this._disabled = signal(false);
		this._asyncValidationId = 0;
		this.initialValue = initialValue;
		this.value = signal(initialValue);
		this.errors = signal(null);
		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._disabled.set(options.disabled ?? false);
		this.updateOn = options.updateOn ?? "input";
		this.dirty = computed(() => this._dirty());
		this.touched = computed(() => this._touched());
		this.pristine = computed(() => !this._dirty());
		this.pending = computed(() => this._pending());
		this.disabled = computed(() => this._disabled());
		this.valid = computed(() => this.errors() === null && !this._pending());
		this.invalid = computed(() => this.errors() !== null);
		this.state = computed(() => ({
			dirty: this._dirty(),
			touched: this._touched(),
			pristine: !this._dirty(),
			untouched: !this._touched(),
			valid: this.errors() === null && !this._pending(),
			invalid: this.errors() !== null,
			pending: this._pending(),
			disabled: this._disabled(),
			enabled: !this._disabled()
		}));
		this.runValidation();
	}
	setValue(value) {
		if (this._disabled()) return;
		this.value.set(value);
		this._dirty.set(true);
		if (this.updateOn === "input") this.runValidation();
	}
	patchValue(value) {
		if (typeof this.value() === "object" && this.value() !== null) this.setValue({
			...this.value(),
			...value
		});
		else this.setValue(value);
	}
	reset(value) {
		this.value.set(value ?? this.initialValue);
		this._dirty.set(false);
		this._touched.set(false);
		this.errors.set(null);
		this.runValidation();
	}
	markAsTouched() {
		this._touched.set(true);
		if (this.updateOn === "blur") this.runValidation();
	}
	markAsUntouched() {
		this._touched.set(false);
	}
	markAsDirty() {
		this._dirty.set(true);
	}
	markAsPristine() {
		this._dirty.set(false);
	}
	disable() {
		this._disabled.set(true);
	}
	enable() {
		this._disabled.set(false);
	}
	setValidators(validators) {
		this._validators = validators;
		this.runValidation();
	}
	setAsyncValidators(validators) {
		this._asyncValidators = validators;
		this.runValidation();
	}
	addValidators(validators) {
		this._validators = [...this._validators, ...validators];
		this.runValidation();
	}
	removeValidators(validators) {
		this._validators = this._validators.filter((v) => !validators.includes(v));
		this.runValidation();
	}
	async validate() {
		await this.runValidation();
	}
	getError(code) {
		return this.errors()?.[code] ?? null;
	}
	hasError(code) {
		return this.errors()?.[code] !== void 0;
	}
	destroy() {
		this.value.destroy();
		this.errors.destroy();
		this._touched.destroy();
		this._dirty.destroy();
		this._pending.destroy();
		this._disabled.destroy();
	}
	async runValidation() {
		const value = this.value();
		let errors = null;
		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) errors = {
				...errors ?? {},
				...result
			};
		}
		if (errors !== null) {
			this.errors.set(errors);
			return;
		}
		if (this._asyncValidators.length > 0) {
			const validationId = ++this._asyncValidationId;
			this._pending.set(true);
			try {
				const asyncResults = await Promise.all(this._asyncValidators.map((v) => v(value)));
				if (validationId !== this._asyncValidationId) return;
				for (const result of asyncResults) if (result !== null) errors = {
					...errors ?? {},
					...result
				};
			} finally {
				if (validationId === this._asyncValidationId) this._pending.set(false);
			}
		}
		this.errors.set(errors);
	}
};
const FORM_GROUP_MARKER = Symbol("melodic.formGroup");
var FormGroup = class {
	constructor(controls, options = {}) {
		this[FORM_GROUP_MARKER] = true;
		this._validators = [];
		this._asyncValidators = [];
		this._disabled = signal(false);
		this._controlEffects = [];
		this.controls = controls;
		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._disabled.set(options.disabled ?? false);
		this.value = computed(() => this.computeValue());
		this.errors = signal(null);
		this.setupControlWatchers();
		this.valid = computed(() => {
			if (this.errors() !== null) return false;
			return Object.values(this.controls).every((control) => control.valid());
		});
		this.invalid = computed(() => !this.valid());
		this.pending = computed(() => {
			return Object.values(this.controls).some((control) => control.pending());
		});
		this.dirty = computed(() => {
			return Object.values(this.controls).some((control) => control.dirty());
		});
		this.touched = computed(() => {
			return Object.values(this.controls).some((control) => control.touched());
		});
		this.pristine = computed(() => !this.dirty());
		this.disabled = computed(() => this._disabled());
		this.runGroupValidation();
	}
	get(name) {
		return this.controls[name];
	}
	addControl(name, control) {
		this.controls[name] = control;
		this.setupControlWatcher(control);
	}
	removeControl(name) {
		delete this.controls[name];
	}
	contains(name) {
		return name in this.controls;
	}
	setValue(value) {
		Object.keys(value).forEach((key) => {
			const control = this.controls[key];
			if (control) control.setValue(value[key]);
		});
	}
	patchValue(value) {
		Object.keys(value).forEach((key) => {
			const control = this.controls[key];
			if (control && value[key] !== void 0) control.setValue(value[key]);
		});
	}
	reset(value) {
		Object.keys(this.controls).forEach((key) => {
			const control = this.controls[key];
			const resetValue = value?.[key];
			control.reset(resetValue);
		});
	}
	markAllAsTouched() {
		Object.values(this.controls).forEach((control) => {
			control.markAsTouched();
		});
	}
	markAllAsUntouched() {
		Object.values(this.controls).forEach((control) => {
			control.markAsUntouched();
		});
	}
	markAllAsDirty() {
		Object.values(this.controls).forEach((control) => {
			control.markAsDirty();
		});
	}
	markAllAsPristine() {
		Object.values(this.controls).forEach((control) => {
			control.markAsPristine();
		});
	}
	disable() {
		this._disabled.set(true);
		Object.values(this.controls).forEach((control) => {
			control.disable();
		});
	}
	enable() {
		this._disabled.set(false);
		Object.values(this.controls).forEach((control) => {
			control.enable();
		});
	}
	async validate() {
		await Promise.all(Object.values(this.controls).map((control) => control.validate()));
		await this.runGroupValidation();
	}
	setValidators(validators) {
		this._validators = validators;
		this.runGroupValidation();
	}
	getError(code) {
		return this.errors()?.[code] ?? null;
	}
	hasError(code) {
		return this.errors()?.[code] !== void 0;
	}
	destroy() {
		this._controlEffects.forEach((effect) => effect.destroy());
		Object.values(this.controls).forEach((control) => {
			control.destroy();
		});
	}
	computeValue() {
		const result = {};
		Object.keys(this.controls).forEach((key) => {
			result[key] = this.controls[key].value();
		});
		return result;
	}
	setupControlWatchers() {
		Object.keys(this.controls).forEach((key) => {
			this.setupControlWatcher(this.controls[key]);
		});
	}
	setupControlWatcher(control) {
		const effect = new SignalEffect(() => {
			control.value();
			this.runGroupValidation();
		});
		effect.run();
		this._controlEffects.push(effect);
	}
	async runGroupValidation() {
		const value = this.computeValue();
		let errors = null;
		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) errors = {
				...errors ?? {},
				...result
			};
		}
		if (this._asyncValidators.length > 0 && errors === null) {
			const asyncResults = await Promise.all(this._asyncValidators.map((v) => v(value)));
			for (const result of asyncResults) if (result !== null) errors = {
				...errors ?? {},
				...result
			};
		}
		this.errors.set(errors);
	}
};
function createFormControl(initialValue, options) {
	return new FormControl(initialValue, options);
}
function createFormGroup(controls, options) {
	return new FormGroup(controls, options);
}
const Validators = {
	required: (value) => {
		return value === null || value === void 0 || value === "" || Array.isArray(value) && value.length === 0 ? { required: {
			code: "required",
			message: "This field is required"
		} } : null;
	},
	minLength: (min) => {
		return (value) => {
			if (!value || value.length === 0) return null;
			return value.length < min ? { minLength: {
				code: "minLength",
				message: `Minimum length is ${min} characters`,
				params: {
					min,
					actual: value.length
				}
			} } : null;
		};
	},
	maxLength: (max) => {
		return (value) => {
			if (!value) return null;
			return value.length > max ? { maxLength: {
				code: "maxLength",
				message: `Maximum length is ${max} characters`,
				params: {
					max,
					actual: value.length
				}
			} } : null;
		};
	},
	pattern: (regex) => {
		return (value) => {
			if (!value) return null;
			return !regex.test(value) ? { pattern: {
				code: "pattern",
				message: "Value does not match required pattern",
				params: { pattern: regex.toString() }
			} } : null;
		};
	},
	email: (value) => {
		if (!value) return null;
		return !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ? { email: {
			code: "email",
			message: "Please enter a valid email address"
		} } : null;
	},
	min: (minValue) => {
		return (value) => {
			if (value === null || value === void 0) return null;
			return value < minValue ? { min: {
				code: "min",
				message: `Value must be at least ${minValue}`,
				params: {
					min: minValue,
					actual: value
				}
			} } : null;
		};
	},
	max: (maxValue) => {
		return (value) => {
			if (value === null || value === void 0) return null;
			return value > maxValue ? { max: {
				code: "max",
				message: `Value must be at most ${maxValue}`,
				params: {
					max: maxValue,
					actual: value
				}
			} } : null;
		};
	},
	range: (minValue, maxValue) => {
		return (value) => {
			if (value === null || value === void 0) return null;
			if (value < minValue || value > maxValue) return { range: {
				code: "range",
				message: `Value must be between ${minValue} and ${maxValue}`,
				params: {
					min: minValue,
					max: maxValue,
					actual: value
				}
			} };
			return null;
		};
	},
	compose: (...validators) => {
		return (value) => {
			let errors = null;
			for (const validator of validators) {
				const result = validator(value);
				if (result !== null) errors = {
					...errors ?? {},
					...result
				};
			}
			return errors;
		};
	},
	composeAsync: (...validators) => {
		return async (value) => {
			const results = await Promise.all(validators.map((v) => v(value)));
			let errors = null;
			for (const result of results) if (result !== null) errors = {
				...errors ?? {},
				...result
			};
			return errors;
		};
	}
};
function createValidator(code, validationFn, message) {
	return (value) => {
		if (validationFn(value)) return null;
		return { [code]: {
			code,
			message: typeof message === "function" ? message(value) : message
		} };
	};
}
function createAsyncValidator(code, validationFn, message) {
	return async (value) => {
		if (await validationFn(value)) return null;
		return { [code]: {
			code,
			message: typeof message === "function" ? message(value) : message
		} };
	};
}
function isFormControl(value) {
	return value !== null && typeof value === "object" && FORM_CONTROL_MARKER in value;
}
function getInputType(element) {
	const tagName = element.tagName.toLowerCase();
	if (tagName === "select") return "select";
	if (tagName === "textarea") return "textarea";
	if (tagName === "input") {
		const type = element.type.toLowerCase();
		if (type === "checkbox") return "checkbox";
		if (type === "radio") return "radio";
	}
	return "text";
}
function formControlDirective(element, value, _) {
	if (!isFormControl(value)) {
		console.warn("formControl directive: value must be a FormControl");
		return;
	}
	const control = value;
	const inputType = getInputType(element);
	const cleanupFns = [];
	const setElementValue = (val) => {
		if (inputType === "checkbox") element.checked = Boolean(val);
		else if (inputType === "radio") element.checked = element.value === val;
		else element.value = val !== null && val !== void 0 ? String(val) : "";
	};
	const setElementDisabled = (disabled) => {
		if (disabled) element.setAttribute("disabled", "");
		else element.removeAttribute("disabled");
	};
	const updateValidationClasses = () => {
		element.classList.toggle("mf-valid", control.valid());
		element.classList.toggle("mf-invalid", control.invalid());
		element.classList.toggle("mf-dirty", control.dirty());
		element.classList.toggle("mf-pristine", control.pristine());
		element.classList.toggle("mf-touched", control.touched());
		element.classList.toggle("mf-pending", control.pending());
		element.classList.toggle("mf-disabled", control.disabled());
	};
	const handleInput = (e) => {
		const target = e.target;
		if (inputType === "checkbox") control.setValue(target.checked);
		else if (inputType === "radio") {
			if (target.checked) control.setValue(target.value);
		} else control.setValue(target.value);
	};
	const handleBlur = () => {
		control.markAsTouched();
	};
	setElementValue(control.value());
	const unsubscribeValue = control.value.subscribe((newValue) => {
		setElementValue(newValue);
	});
	cleanupFns.push(unsubscribeValue);
	setElementDisabled(control.disabled());
	const unsubscribeDisabled = control.disabled.subscribe((disabled) => {
		setElementDisabled(disabled);
	});
	cleanupFns.push(unsubscribeDisabled);
	const unsubscribeState = control.state.subscribe(() => {
		updateValidationClasses();
	});
	cleanupFns.push(unsubscribeState);
	updateValidationClasses();
	const eventType = control.updateOn === "blur" ? "change" : "input";
	element.addEventListener(eventType, handleInput);
	element.addEventListener("blur", handleBlur);
	element.setAttribute("data-form-control", "");
	return () => {
		element.removeEventListener(eventType, handleInput);
		element.removeEventListener("blur", handleBlur);
		element.removeAttribute("data-form-control");
		cleanupFns.forEach((fn) => fn());
	};
}
registerAttributeDirective("formControl", formControlDirective);
const primitiveColors = {
	"--ml-white": "#ffffff",
	"--ml-black": "#000000",
	"--ml-gray-25": "#fcfcfd",
	"--ml-gray-50": "#f9fafb",
	"--ml-gray-100": "#f2f4f7",
	"--ml-gray-200": "#eaecf0",
	"--ml-gray-300": "#d0d5dd",
	"--ml-gray-400": "#98a2b3",
	"--ml-gray-500": "#667085",
	"--ml-gray-600": "#475467",
	"--ml-gray-700": "#344054",
	"--ml-gray-800": "#182230",
	"--ml-gray-900": "#101828",
	"--ml-gray-950": "#0c111d",
	"--ml-blue-25": "#f5f8ff",
	"--ml-blue-50": "#eff4ff",
	"--ml-blue-100": "#d1e0ff",
	"--ml-blue-200": "#b2ccff",
	"--ml-blue-300": "#84adff",
	"--ml-blue-400": "#528bff",
	"--ml-blue-500": "#2970ff",
	"--ml-blue-600": "#155eef",
	"--ml-blue-700": "#004eeb",
	"--ml-blue-800": "#0040c1",
	"--ml-blue-900": "#00359e",
	"--ml-blue-950": "#002266",
	"--ml-green-25": "#f6fef9",
	"--ml-green-50": "#ecfdf3",
	"--ml-green-100": "#dcfae6",
	"--ml-green-200": "#abefc6",
	"--ml-green-300": "#75e0a7",
	"--ml-green-400": "#47cd89",
	"--ml-green-500": "#17b26a",
	"--ml-green-600": "#079455",
	"--ml-green-700": "#067647",
	"--ml-green-800": "#085d3a",
	"--ml-green-900": "#074d31",
	"--ml-green-950": "#053321",
	"--ml-red-25": "#fffbfa",
	"--ml-red-50": "#fef3f2",
	"--ml-red-100": "#fee4e2",
	"--ml-red-200": "#fecdca",
	"--ml-red-300": "#fda29b",
	"--ml-red-400": "#f97066",
	"--ml-red-500": "#f04438",
	"--ml-red-600": "#d92d20",
	"--ml-red-700": "#b42318",
	"--ml-red-800": "#912018",
	"--ml-red-900": "#7a271a",
	"--ml-red-950": "#55160c",
	"--ml-amber-25": "#fffcf5",
	"--ml-amber-50": "#fffaeb",
	"--ml-amber-100": "#fef0c7",
	"--ml-amber-200": "#fedf89",
	"--ml-amber-300": "#fec84b",
	"--ml-amber-400": "#fdb022",
	"--ml-amber-500": "#f79009",
	"--ml-amber-600": "#dc6803",
	"--ml-amber-700": "#b54708",
	"--ml-amber-800": "#93370d",
	"--ml-amber-900": "#7a2e0e",
	"--ml-amber-950": "#4e1d09",
	"--ml-cyan-25": "#f5feff",
	"--ml-cyan-50": "#ecfdff",
	"--ml-cyan-100": "#cff9fe",
	"--ml-cyan-200": "#a5f0fc",
	"--ml-cyan-300": "#67e3f9",
	"--ml-cyan-400": "#22ccee",
	"--ml-cyan-500": "#06aed4",
	"--ml-cyan-600": "#088ab2",
	"--ml-cyan-700": "#0e7090",
	"--ml-cyan-800": "#155b75",
	"--ml-cyan-900": "#164c63",
	"--ml-cyan-950": "#0d2d3a",
	"--ml-purple-25": "#fcfaff",
	"--ml-purple-50": "#f9f5ff",
	"--ml-purple-100": "#f4ebff",
	"--ml-purple-200": "#e9d7fe",
	"--ml-purple-300": "#d6bbfb",
	"--ml-purple-400": "#b692f6",
	"--ml-purple-500": "#9e77ed",
	"--ml-purple-600": "#7f56d9",
	"--ml-purple-700": "#6941c6",
	"--ml-purple-800": "#53389e",
	"--ml-purple-900": "#42307d",
	"--ml-purple-950": "#2c1c5f"
};
const colorTokens = {
	"--ml-color-primary": "var(--ml-blue-600)",
	"--ml-color-primary-hover": "var(--ml-blue-700)",
	"--ml-color-primary-active": "var(--ml-blue-800)",
	"--ml-color-primary-subtle": "var(--ml-blue-50)",
	"--ml-color-secondary": "var(--ml-gray-600)",
	"--ml-color-secondary-hover": "var(--ml-gray-700)",
	"--ml-color-secondary-active": "var(--ml-gray-800)",
	"--ml-color-secondary-subtle": "var(--ml-gray-100)",
	"--ml-color-success": "var(--ml-green-600)",
	"--ml-color-success-hover": "var(--ml-green-700)",
	"--ml-color-success-subtle": "var(--ml-green-50)",
	"--ml-color-warning": "var(--ml-amber-500)",
	"--ml-color-warning-hover": "var(--ml-amber-600)",
	"--ml-color-warning-subtle": "var(--ml-amber-50)",
	"--ml-color-danger": "var(--ml-red-600)",
	"--ml-color-danger-hover": "var(--ml-red-700)",
	"--ml-color-danger-subtle": "var(--ml-red-50)",
	"--ml-color-info": "var(--ml-cyan-600)",
	"--ml-color-info-hover": "var(--ml-cyan-700)",
	"--ml-color-info-subtle": "var(--ml-cyan-50)",
	"--ml-color-background": "var(--ml-white)",
	"--ml-color-surface": "var(--ml-white)",
	"--ml-color-surface-raised": "var(--ml-gray-50)",
	"--ml-color-surface-overlay": "var(--ml-white)",
	"--ml-color-surface-sunken": "var(--ml-gray-100)",
	"--ml-color-text": "var(--ml-gray-900)",
	"--ml-color-text-secondary": "var(--ml-gray-700)",
	"--ml-color-text-muted": "var(--ml-gray-500)",
	"--ml-color-text-subtle": "var(--ml-gray-400)",
	"--ml-color-text-inverse": "var(--ml-white)",
	"--ml-color-text-link": "var(--ml-blue-600)",
	"--ml-color-text-link-hover": "var(--ml-blue-700)",
	"--ml-color-border": "var(--ml-gray-200)",
	"--ml-color-border-strong": "var(--ml-gray-300)",
	"--ml-color-border-muted": "var(--ml-gray-100)",
	"--ml-color-border-focus": "var(--ml-blue-500)",
	"--ml-color-focus-ring": "var(--ml-blue-500)",
	"--ml-focus-ring-width": "4px",
	"--ml-focus-ring-offset": "1px",
	"--ml-color-toggle-off": "var(--ml-gray-200)",
	"--ml-color-toggle-off-hover": "var(--ml-gray-300)",
	"--ml-color-input-bg": "var(--ml-white)",
	"--ml-color-input-disabled-bg": "var(--ml-gray-50)",
	"--ml-badge-default-bg": "var(--ml-gray-100)",
	"--ml-badge-default-border": "var(--ml-gray-200)",
	"--ml-badge-default-text": "var(--ml-gray-700)",
	"--ml-badge-primary-bg": "var(--ml-blue-50)",
	"--ml-badge-primary-border": "var(--ml-blue-200)",
	"--ml-badge-primary-text": "var(--ml-blue-700)",
	"--ml-badge-success-bg": "var(--ml-green-50)",
	"--ml-badge-success-border": "var(--ml-green-200)",
	"--ml-badge-success-text": "var(--ml-green-700)",
	"--ml-badge-warning-bg": "var(--ml-amber-50)",
	"--ml-badge-warning-border": "var(--ml-amber-200)",
	"--ml-badge-warning-text": "var(--ml-amber-700)",
	"--ml-badge-error-bg": "var(--ml-red-50)",
	"--ml-badge-error-border": "var(--ml-red-200)",
	"--ml-badge-error-text": "var(--ml-red-700)",
	"--ml-alert-info-bg": "var(--ml-blue-50)",
	"--ml-alert-info-border": "var(--ml-blue-200)",
	"--ml-alert-info-text": "var(--ml-blue-700)",
	"--ml-alert-info-icon": "var(--ml-blue-600)",
	"--ml-alert-success-bg": "var(--ml-green-50)",
	"--ml-alert-success-border": "var(--ml-green-200)",
	"--ml-alert-success-text": "var(--ml-green-700)",
	"--ml-alert-success-icon": "var(--ml-green-600)",
	"--ml-alert-warning-bg": "var(--ml-amber-50)",
	"--ml-alert-warning-border": "var(--ml-amber-200)",
	"--ml-alert-warning-text": "var(--ml-amber-700)",
	"--ml-alert-warning-icon": "var(--ml-amber-600)",
	"--ml-alert-error-bg": "var(--ml-red-50)",
	"--ml-alert-error-border": "var(--ml-red-200)",
	"--ml-alert-error-text": "var(--ml-red-700)",
	"--ml-alert-error-icon": "var(--ml-red-600)",
	"--ml-tooltip-bg": "var(--ml-gray-900)",
	"--ml-tooltip-text": "var(--ml-white)",
	"--ml-card-footer-bg": "var(--ml-gray-50)"
};
const spacingTokens = {
	"--ml-space-0": "0",
	"--ml-space-px": "1px",
	"--ml-space-0-5": "0.125rem",
	"--ml-space-1": "0.25rem",
	"--ml-space-1-5": "0.375rem",
	"--ml-space-2": "0.5rem",
	"--ml-space-2-5": "0.625rem",
	"--ml-space-3": "0.75rem",
	"--ml-space-3-5": "0.875rem",
	"--ml-space-4": "1rem",
	"--ml-space-5": "1.25rem",
	"--ml-space-6": "1.5rem",
	"--ml-space-7": "1.75rem",
	"--ml-space-8": "2rem",
	"--ml-space-9": "2.25rem",
	"--ml-space-10": "2.5rem",
	"--ml-space-11": "2.75rem",
	"--ml-space-12": "3rem",
	"--ml-space-14": "3.5rem",
	"--ml-space-16": "4rem",
	"--ml-space-20": "5rem",
	"--ml-space-24": "6rem",
	"--ml-space-28": "7rem",
	"--ml-space-32": "8rem",
	"--ml-space-36": "9rem",
	"--ml-space-40": "10rem",
	"--ml-space-44": "11rem",
	"--ml-space-48": "12rem",
	"--ml-space-52": "13rem",
	"--ml-space-56": "14rem",
	"--ml-space-60": "15rem",
	"--ml-space-64": "16rem",
	"--ml-space-72": "18rem",
	"--ml-space-80": "20rem",
	"--ml-space-96": "24rem"
};
const typographyTokens = {
	"--ml-font-sans": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
	"--ml-font-serif": "Georgia, Cambria, 'Times New Roman', Times, serif",
	"--ml-font-mono": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	"--ml-text-xs": "0.75rem",
	"--ml-text-sm": "0.875rem",
	"--ml-text-base": "1rem",
	"--ml-text-lg": "1.125rem",
	"--ml-text-xl": "1.25rem",
	"--ml-text-2xl": "1.5rem",
	"--ml-text-3xl": "1.875rem",
	"--ml-text-4xl": "2.25rem",
	"--ml-text-5xl": "3rem",
	"--ml-text-6xl": "3.75rem",
	"--ml-text-7xl": "4.5rem",
	"--ml-text-8xl": "6rem",
	"--ml-text-9xl": "8rem",
	"--ml-font-thin": "100",
	"--ml-font-extralight": "200",
	"--ml-font-light": "300",
	"--ml-font-normal": "400",
	"--ml-font-medium": "500",
	"--ml-font-semibold": "600",
	"--ml-font-bold": "700",
	"--ml-font-extrabold": "800",
	"--ml-font-black": "900",
	"--ml-leading-none": "1",
	"--ml-leading-tight": "1.25",
	"--ml-leading-snug": "1.375",
	"--ml-leading-normal": "1.5",
	"--ml-leading-relaxed": "1.625",
	"--ml-leading-loose": "2",
	"--ml-tracking-tighter": "-0.05em",
	"--ml-tracking-tight": "-0.025em",
	"--ml-tracking-normal": "0em",
	"--ml-tracking-wide": "0.025em",
	"--ml-tracking-wider": "0.05em",
	"--ml-tracking-widest": "0.1em"
};
const shadowTokens = {
	"--ml-shadow-none": "none",
	"--ml-shadow-xs": "0 1px 2px 0 rgb(16 24 40 / 0.05)",
	"--ml-shadow-sm": "0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)",
	"--ml-shadow": "0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)",
	"--ml-shadow-md": "0 2px 4px -2px rgb(16 24 40 / 0.06), 0 4px 8px -2px rgb(16 24 40 / 0.1)",
	"--ml-shadow-lg": "0 4px 6px -2px rgb(16 24 40 / 0.03), 0 12px 16px -4px rgb(16 24 40 / 0.08)",
	"--ml-shadow-xl": "0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)",
	"--ml-shadow-2xl": "0 24px 48px -12px rgb(16 24 40 / 0.18)",
	"--ml-shadow-3xl": "0 32px 64px -12px rgb(16 24 40 / 0.14)",
	"--ml-shadow-inner": "inset 0 2px 4px 0 rgb(16 24 40 / 0.05)",
	"--ml-shadow-ring-color": "var(--ml-blue-100)",
	"--ml-shadow-ring-error-color": "var(--ml-red-100)",
	"--ml-shadow-ring-success-color": "var(--ml-green-100)",
	"--ml-shadow-ring-warning-color": "var(--ml-amber-100)",
	"--ml-shadow-ring-gray-color": "var(--ml-gray-100)",
	"--ml-shadow-ring": "0 0 0 4px var(--ml-shadow-ring-color)",
	"--ml-shadow-ring-error": "0 0 0 4px var(--ml-shadow-ring-error-color)",
	"--ml-shadow-ring-success": "0 0 0 4px var(--ml-shadow-ring-success-color)",
	"--ml-shadow-ring-warning": "0 0 0 4px var(--ml-shadow-ring-warning-color)",
	"--ml-shadow-ring-gray": "0 0 0 4px var(--ml-shadow-ring-gray-color)",
	"--ml-shadow-focus-ring": "0 1px 2px 0 rgb(16 24 40 / 0.05), 0 0 0 4px var(--ml-shadow-ring-color)",
	"--ml-shadow-primary": "0 1px 2px 0 rgb(21 94 239 / 0.05)",
	"--ml-shadow-success": "0 1px 2px 0 rgb(7 148 85 / 0.05)",
	"--ml-shadow-danger": "0 1px 2px 0 rgb(217 45 32 / 0.05)"
};
const borderTokens = {
	"--ml-radius-none": "0",
	"--ml-radius-xxs": "0.125rem",
	"--ml-radius-xs": "0.25rem",
	"--ml-radius-sm": "0.375rem",
	"--ml-radius": "0.5rem",
	"--ml-radius-md": "0.5rem",
	"--ml-radius-lg": "0.75rem",
	"--ml-radius-xl": "1rem",
	"--ml-radius-2xl": "1.25rem",
	"--ml-radius-3xl": "1.5rem",
	"--ml-radius-4xl": "2rem",
	"--ml-radius-full": "9999px",
	"--ml-border-0": "0",
	"--ml-border": "1px",
	"--ml-border-2": "2px",
	"--ml-border-4": "4px",
	"--ml-border-8": "8px"
};
const transitionTokens = {
	"--ml-duration-0": "0ms",
	"--ml-duration-75": "75ms",
	"--ml-duration-100": "100ms",
	"--ml-duration-150": "150ms",
	"--ml-duration-200": "200ms",
	"--ml-duration-300": "300ms",
	"--ml-duration-500": "500ms",
	"--ml-duration-700": "700ms",
	"--ml-duration-1000": "1000ms",
	"--ml-ease-linear": "linear",
	"--ml-ease-in": "cubic-bezier(0.4, 0, 1, 1)",
	"--ml-ease-out": "cubic-bezier(0, 0, 0.2, 1)",
	"--ml-ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
	"--ml-ease-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
	"--ml-transition-none": "none",
	"--ml-transition-all": "all var(--ml-duration-150) var(--ml-ease-in-out)",
	"--ml-transition-colors": "color var(--ml-duration-150) var(--ml-ease-in-out), background-color var(--ml-duration-150) var(--ml-ease-in-out), border-color var(--ml-duration-150) var(--ml-ease-in-out)",
	"--ml-transition-opacity": "opacity var(--ml-duration-150) var(--ml-ease-in-out)",
	"--ml-transition-shadow": "box-shadow var(--ml-duration-150) var(--ml-ease-in-out)",
	"--ml-transition-transform": "transform var(--ml-duration-150) var(--ml-ease-in-out)"
};
const breakpointTokens = {
	"--ml-screen-xs": "320px",
	"--ml-screen-sm": "640px",
	"--ml-screen-md": "768px",
	"--ml-screen-lg": "1024px",
	"--ml-screen-xl": "1280px",
	"--ml-screen-2xl": "1536px"
};
const breakpoints = {
	xs: 320,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536
};
const allTokens = {
	...primitiveColors,
	...colorTokens,
	...spacingTokens,
	...typographyTokens,
	...shadowTokens,
	...borderTokens,
	...transitionTokens,
	...breakpointTokens
};
function tokensToCss(tokens) {
	return Object.entries(tokens).map(([key, value]) => `${key}: ${value};`).join("\n	");
}
const lightTheme = {
	"--ml-color-background": "var(--ml-white)",
	"--ml-color-surface": "var(--ml-white)",
	"--ml-color-surface-raised": "var(--ml-gray-50)",
	"--ml-color-surface-overlay": "var(--ml-white)",
	"--ml-color-surface-sunken": "var(--ml-gray-100)",
	"--ml-color-text": "var(--ml-gray-900)",
	"--ml-color-text-secondary": "var(--ml-gray-700)",
	"--ml-color-text-muted": "var(--ml-gray-500)",
	"--ml-color-text-subtle": "var(--ml-gray-400)",
	"--ml-color-text-inverse": "var(--ml-white)",
	"--ml-color-border": "var(--ml-gray-200)",
	"--ml-color-border-strong": "var(--ml-gray-300)",
	"--ml-color-border-muted": "var(--ml-gray-100)"
};
const lightThemeCss = `:root, [data-theme="light"] {
	${Object.entries(lightTheme).map(([key, value]) => `${key}: ${value};`).join("\n	")}

	color-scheme: light;
}`;
const darkTheme = {
	"--ml-color-background": "var(--ml-gray-950)",
	"--ml-color-surface": "var(--ml-gray-900)",
	"--ml-color-surface-raised": "var(--ml-gray-800)",
	"--ml-color-surface-overlay": "var(--ml-gray-800)",
	"--ml-color-surface-sunken": "var(--ml-gray-950)",
	"--ml-color-text": "var(--ml-gray-50)",
	"--ml-color-text-secondary": "var(--ml-gray-300)",
	"--ml-color-text-muted": "var(--ml-gray-400)",
	"--ml-color-text-subtle": "var(--ml-gray-500)",
	"--ml-color-text-inverse": "var(--ml-gray-900)",
	"--ml-color-border": "var(--ml-gray-700)",
	"--ml-color-border-strong": "var(--ml-gray-600)",
	"--ml-color-border-muted": "var(--ml-gray-800)",
	"--ml-color-primary": "var(--ml-blue-500)",
	"--ml-color-primary-hover": "var(--ml-blue-400)",
	"--ml-color-primary-active": "var(--ml-blue-300)",
	"--ml-color-primary-subtle": "var(--ml-blue-950)",
	"--ml-color-success": "var(--ml-green-500)",
	"--ml-color-success-subtle": "var(--ml-green-950)",
	"--ml-color-warning": "var(--ml-amber-400)",
	"--ml-color-warning-subtle": "var(--ml-amber-950)",
	"--ml-color-danger": "var(--ml-red-500)",
	"--ml-color-danger-subtle": "var(--ml-red-950)",
	"--ml-color-info": "var(--ml-cyan-400)",
	"--ml-color-info-subtle": "var(--ml-cyan-950)",
	"--ml-color-input-bg": "var(--ml-gray-900)",
	"--ml-color-input-disabled-bg": "var(--ml-gray-800)",
	"--ml-color-toggle-off": "var(--ml-gray-600)",
	"--ml-color-toggle-off-hover": "var(--ml-gray-500)",
	"--ml-shadow-ring-color": "rgb(59 130 246 / 0.25)",
	"--ml-shadow-ring-error-color": "rgb(239 68 68 / 0.25)",
	"--ml-shadow-ring-success-color": "rgb(34 197 94 / 0.25)",
	"--ml-shadow-ring-warning-color": "rgb(245 158 11 / 0.25)",
	"--ml-shadow-ring-gray-color": "rgb(107 114 128 / 0.25)",
	"--ml-badge-default-bg": "var(--ml-gray-800)",
	"--ml-badge-default-border": "var(--ml-gray-700)",
	"--ml-badge-default-text": "var(--ml-gray-300)",
	"--ml-badge-primary-bg": "rgb(59 130 246 / 0.15)",
	"--ml-badge-primary-border": "rgb(59 130 246 / 0.3)",
	"--ml-badge-primary-text": "var(--ml-blue-400)",
	"--ml-badge-success-bg": "rgb(34 197 94 / 0.15)",
	"--ml-badge-success-border": "rgb(34 197 94 / 0.3)",
	"--ml-badge-success-text": "var(--ml-green-400)",
	"--ml-badge-warning-bg": "rgb(245 158 11 / 0.15)",
	"--ml-badge-warning-border": "rgb(245 158 11 / 0.3)",
	"--ml-badge-warning-text": "var(--ml-amber-400)",
	"--ml-badge-error-bg": "rgb(239 68 68 / 0.15)",
	"--ml-badge-error-border": "rgb(239 68 68 / 0.3)",
	"--ml-badge-error-text": "var(--ml-red-400)",
	"--ml-alert-info-bg": "rgb(59 130 246 / 0.1)",
	"--ml-alert-info-border": "rgb(59 130 246 / 0.2)",
	"--ml-alert-info-text": "var(--ml-blue-300)",
	"--ml-alert-info-icon": "var(--ml-blue-400)",
	"--ml-alert-success-bg": "rgb(34 197 94 / 0.1)",
	"--ml-alert-success-border": "rgb(34 197 94 / 0.2)",
	"--ml-alert-success-text": "var(--ml-green-300)",
	"--ml-alert-success-icon": "var(--ml-green-400)",
	"--ml-alert-warning-bg": "rgb(245 158 11 / 0.1)",
	"--ml-alert-warning-border": "rgb(245 158 11 / 0.2)",
	"--ml-alert-warning-text": "var(--ml-amber-300)",
	"--ml-alert-warning-icon": "var(--ml-amber-400)",
	"--ml-alert-error-bg": "rgb(239 68 68 / 0.1)",
	"--ml-alert-error-border": "rgb(239 68 68 / 0.2)",
	"--ml-alert-error-text": "var(--ml-red-300)",
	"--ml-alert-error-icon": "var(--ml-red-400)",
	"--ml-tooltip-bg": "var(--ml-gray-100)",
	"--ml-tooltip-text": "var(--ml-gray-900)",
	"--ml-card-footer-bg": "var(--ml-gray-800)"
};
const darkThemeCss = `[data-theme="dark"] {
	${Object.entries(darkTheme).map(([key, value]) => `${key}: ${value};`).join("\n	")}

	color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) {
		${Object.entries(darkTheme).map(([key, value]) => `${key}: ${value};`).join("\n		")}

		color-scheme: dark;
	}
}`;
const baseThemeCss = `:root {
	${tokensToCss(allTokens)}

	/* Default to light color scheme */
	color-scheme: light;
}`;
var currentTheme = "system";
var themeListeners = /* @__PURE__ */ new Set();
var mediaQueryCleanup = null;
function getTheme() {
	return currentTheme;
}
function getResolvedTheme() {
	if (currentTheme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	return currentTheme;
}
function applyTheme(theme) {
	if (mediaQueryCleanup) {
		mediaQueryCleanup();
		mediaQueryCleanup = null;
	}
	currentTheme = theme;
	if (theme === "system") {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			const resolved$1 = mediaQuery.matches ? "dark" : "light";
			document.documentElement.setAttribute("data-theme", resolved$1);
			notifyListeners("system", resolved$1);
		};
		mediaQuery.addEventListener("change", handleChange);
		mediaQueryCleanup = () => mediaQuery.removeEventListener("change", handleChange);
		const resolved = mediaQuery.matches ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", resolved);
		notifyListeners("system", resolved);
	} else {
		document.documentElement.setAttribute("data-theme", theme);
		notifyListeners(theme, theme);
	}
}
function onThemeChange(callback) {
	themeListeners.add(callback);
	return () => themeListeners.delete(callback);
}
function notifyListeners(theme, resolved) {
	themeListeners.forEach((callback) => callback(theme, resolved));
}
function toggleTheme() {
	applyTheme(getResolvedTheme() === "light" ? "dark" : "light");
}
function createTheme(name, overrides) {
	return `[data-theme="${name}"] {\n\t${Object.entries(overrides).map(([key, value]) => `${key}: ${value};`).join("\n	")}\n}`;
}
function injectTheme(name, overrides) {
	const css$1 = createTheme(name, overrides);
	const style = document.createElement("style");
	style.id = `ml-theme-${name}`;
	style.textContent = css$1;
	const existing = document.getElementById(style.id);
	if (existing) existing.remove();
	document.head.appendChild(style);
	return style;
}
function createBrandTheme(name, options) {
	const overrides = {};
	if (options.primary) overrides["--ml-color-primary"] = options.primary;
	if (options.secondary) overrides["--ml-color-secondary"] = options.secondary;
	if (options.success) overrides["--ml-color-success"] = options.success;
	if (options.warning) overrides["--ml-color-warning"] = options.warning;
	if (options.danger) overrides["--ml-color-danger"] = options.danger;
	return createTheme(name, overrides);
}
function getBasePlacement(reference, floating, placement) {
	const [side, alignment = "center"] = placement.split("-");
	let x = 0;
	let y = 0;
	switch (side) {
		case "top":
			y = reference.top - floating.height;
			break;
		case "bottom":
			y = reference.bottom;
			break;
		case "left":
			x = reference.left - floating.width;
			break;
		case "right":
			x = reference.right;
			break;
		default: break;
	}
	if (side === "top" || side === "bottom") switch (alignment) {
		case "start":
			x = reference.left;
			break;
		case "end":
			x = reference.right - floating.width;
			break;
		default: x = reference.left + (reference.width - floating.width) / 2;
	}
	else switch (alignment) {
		case "start":
			y = reference.top;
			break;
		case "end":
			y = reference.bottom - floating.height;
			break;
		default: y = reference.top + (reference.height - floating.height) / 2;
	}
	return {
		x,
		y
	};
}
function computePosition(reference, floating, config = {}) {
	const { placement = "bottom", middleware = [] } = config;
	const referenceRect = reference.getBoundingClientRect();
	const floatingRect = floating.getBoundingClientRect();
	const { x, y } = getBasePlacement(referenceRect, floatingRect, placement);
	let state = {
		x,
		y,
		placement,
		rects: {
			reference: referenceRect,
			floating: floatingRect
		},
		elements: {
			reference,
			floating
		},
		middlewareData: {}
	};
	for (const mw of middleware) {
		const result = mw.fn(state);
		if (result) {
			state = {
				...state,
				...result
			};
			if (result.middlewareData) state.middlewareData = {
				...state.middlewareData,
				...result.middlewareData
			};
		}
	}
	return {
		x: state.x,
		y: state.y,
		placement: state.placement,
		middlewareData: state.middlewareData
	};
}
function getOppositePlacement(placement) {
	const opposites = {
		top: "bottom",
		bottom: "top",
		left: "right",
		right: "left"
	};
	return placement.replace(/top|bottom|left|right/g, (match) => opposites[match]);
}
function getSide(placement) {
	return placement.split("-")[0];
}
function getScrollAncestors(element) {
	const ancestors = [];
	let node = element;
	while (node) {
		const parent = node.parentNode;
		if (parent instanceof ShadowRoot) {
			node = parent.host;
			continue;
		}
		if (parent instanceof Element) {
			const { overflow, overflowX, overflowY } = getComputedStyle(parent);
			if (/auto|scroll|overlay|hidden/.test(overflow + overflowX + overflowY)) ancestors.push(parent);
			node = parent;
		} else break;
	}
	return ancestors;
}
function autoUpdate(reference, floating, update, options = {}) {
	const { ancestorScroll = true, ancestorResize = true, elementResize = true, animationFrame = false } = options;
	const cleanups = [];
	if (ancestorScroll) {
		const ancestors = getScrollAncestors(reference);
		for (const ancestor of ancestors) {
			ancestor.addEventListener("scroll", update, { passive: true });
			cleanups.push(() => ancestor.removeEventListener("scroll", update));
		}
		window.addEventListener("scroll", update, { passive: true });
		cleanups.push(() => window.removeEventListener("scroll", update));
	}
	if (ancestorResize) {
		window.addEventListener("resize", update);
		cleanups.push(() => window.removeEventListener("resize", update));
	}
	if (elementResize && typeof ResizeObserver !== "undefined") {
		const observer = new ResizeObserver(() => {
			update();
		});
		observer.observe(reference);
		observer.observe(floating);
		cleanups.push(() => observer.disconnect());
	}
	if (animationFrame) {
		let frameId;
		const frameLoop = () => {
			update();
			frameId = requestAnimationFrame(frameLoop);
		};
		frameId = requestAnimationFrame(frameLoop);
		cleanups.push(() => cancelAnimationFrame(frameId));
	}
	return () => {
		cleanups.forEach((fn) => fn());
	};
}
function offset(options = 0) {
	const mainAxis = typeof options === "number" ? options : options.mainAxis ?? 0;
	const crossAxis = typeof options === "number" ? 0 : options.crossAxis ?? 0;
	return {
		name: "offset",
		fn(state) {
			const { x, y, placement } = state;
			const side = getSide(placement);
			let newX = x;
			let newY = y;
			switch (side) {
				case "top":
					newY -= mainAxis;
					newX += crossAxis;
					break;
				case "bottom":
					newY += mainAxis;
					newX += crossAxis;
					break;
				case "left":
					newX -= mainAxis;
					newY += crossAxis;
					break;
				case "right":
					newX += mainAxis;
					newY += crossAxis;
					break;
				default: break;
			}
			return {
				x: newX,
				y: newY
			};
		}
	};
}
function detectOverflow(x, y, floating, padding) {
	const viewport = {
		width: window.innerWidth,
		height: window.innerHeight
	};
	return {
		top: padding - y,
		right: x + floating.width - viewport.width + padding,
		bottom: y + floating.height - viewport.height + padding,
		left: padding - x
	};
}
function hasOverflow(overflow, side) {
	switch (side) {
		case "top": return overflow.top > 0;
		case "bottom": return overflow.bottom > 0;
		case "left": return overflow.left > 0;
		case "right": return overflow.right > 0;
		default: return false;
	}
}
function flip(options = {}) {
	const { padding = 0 } = options;
	return {
		name: "flip",
		fn(state) {
			const { x, y, placement, rects } = state;
			const side = getSide(placement);
			if (!hasOverflow(detectOverflow(x, y, rects.floating, padding), side)) return;
			const oppositePlacement = getOppositePlacement(placement);
			const fallbacks = options.fallbackPlacements ?? [oppositePlacement];
			for (const fallback of fallbacks) {
				const newPos = getBasePlacementForFlip(rects.reference, rects.floating, fallback);
				if (!hasOverflow(detectOverflow(newPos.x, newPos.y, rects.floating, padding), getSide(fallback))) return {
					x: newPos.x,
					y: newPos.y,
					placement: fallback
				};
			}
		}
	};
}
function getBasePlacementForFlip(reference, floating, placement) {
	const [side, alignment = "center"] = placement.split("-");
	let x = 0;
	let y = 0;
	switch (side) {
		case "top":
			y = reference.top - floating.height;
			break;
		case "bottom":
			y = reference.bottom;
			break;
		case "left":
			x = reference.left - floating.width;
			break;
		case "right":
			x = reference.right;
			break;
		default: break;
	}
	if (side === "top" || side === "bottom") switch (alignment) {
		case "start":
			x = reference.left;
			break;
		case "end":
			x = reference.right - floating.width;
			break;
		default: x = reference.left + (reference.width - floating.width) / 2;
	}
	else switch (alignment) {
		case "start":
			y = reference.top;
			break;
		case "end":
			y = reference.bottom - floating.height;
			break;
		default: y = reference.top + (reference.height - floating.height) / 2;
	}
	return {
		x,
		y
	};
}
function shift(options = {}) {
	const { padding = 0, mainAxis = true, crossAxis = true } = options;
	return {
		name: "shift",
		fn(state) {
			const { x, y, rects } = state;
			const viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			let newX = x;
			let newY = y;
			if (crossAxis || mainAxis) {
				const minX = padding;
				const maxX = viewport.width - rects.floating.width - padding;
				newX = Math.max(minX, Math.min(newX, maxX));
			}
			if (crossAxis || mainAxis) {
				const minY = padding;
				const maxY = viewport.height - rects.floating.height - padding;
				newY = Math.max(minY, Math.min(newY, maxY));
			}
			return {
				x: newX,
				y: newY
			};
		}
	};
}
function arrow(options) {
	const { element, padding = 0 } = options;
	return {
		name: "arrow",
		fn(state) {
			const { rects, placement } = state;
			const side = getSide(placement);
			const arrowRect = element.getBoundingClientRect();
			const arrowWidth = arrowRect.width;
			const arrowHeight = arrowRect.height;
			let arrowX;
			let arrowY;
			if (side === "top" || side === "bottom") {
				arrowX = rects.reference.left + rects.reference.width / 2 - state.x - arrowWidth / 2;
				const minX = padding;
				const maxX = rects.floating.width - arrowWidth - padding;
				arrowX = Math.max(minX, Math.min(arrowX, maxX));
			} else {
				arrowY = rects.reference.top + rects.reference.height / 2 - state.y - arrowHeight / 2;
				const minY = padding;
				const maxY = rects.floating.height - arrowHeight - padding;
				arrowY = Math.max(minY, Math.min(arrowY, maxY));
			}
			return { middlewareData: { arrow: {
				x: arrowX,
				y: arrowY,
				centerOffset: 0
			} } };
		}
	};
}
var FOCUSABLE_SELECTOR = [
	"a[href]",
	"area[href]",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"button:not([disabled])",
	"iframe",
	"object",
	"embed",
	"[contenteditable]",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(", ");
function getFocusableElements(container) {
	return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
		if (element.offsetParent === null && element.style.position !== "fixed") return false;
		if (getComputedStyle(element).visibility === "hidden") return false;
		return true;
	});
}
function getFirstFocusable(container) {
	return getFocusableElements(container)[0] ?? null;
}
function getLastFocusable(container) {
	const elements = getFocusableElements(container);
	return elements[elements.length - 1] ?? null;
}
function focusFirst(container) {
	const first = getFirstFocusable(container);
	if (first) {
		first.focus();
		return true;
	}
	return false;
}
function focusLast(container) {
	const last = getLastFocusable(container);
	if (last) {
		last.focus();
		return true;
	}
	return false;
}
function createFocusTrap(container, options = {}) {
	const { initialFocus = null, returnFocus = null, autoFocus = true } = options;
	let active = false;
	let previouslyFocused = null;
	function handleKeydown(event) {
		if (event.key !== "Tab" || !active) return;
		const focusables = getFocusableElements(container);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (event.shiftKey) {
			if (document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else if (document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
	function activate() {
		if (active) return;
		active = true;
		previouslyFocused = document.activeElement;
		container.addEventListener("keydown", handleKeydown);
		if (initialFocus) initialFocus.focus();
		else if (autoFocus) {
			const first = getFirstFocusable(container);
			if (first) first.focus();
		}
	}
	function deactivate() {
		if (!active) return;
		active = false;
		container.removeEventListener("keydown", handleKeydown);
		const focusTarget = returnFocus ?? previouslyFocused;
		if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
	}
	function isActive() {
		return active;
	}
	return {
		activate,
		deactivate,
		isActive
	};
}
function focusTrap(container, options) {
	const trap = createFocusTrap(container, options);
	trap.activate();
	return () => trap.deactivate();
}
var hadKeyboardEvent = false;
var isInitialized = false;
function initFocusVisible() {
	if (isInitialized) return;
	isInitialized = true;
	document.addEventListener("keydown", () => {
		hadKeyboardEvent = true;
	}, true);
	document.addEventListener("mousedown", () => {
		hadKeyboardEvent = false;
	}, true);
	document.addEventListener("pointerdown", () => {
		hadKeyboardEvent = false;
	}, true);
}
function isFocusVisible() {
	initFocusVisible();
	return hadKeyboardEvent;
}
function focusVisible(element, className = "focus-visible") {
	initFocusVisible();
	function handleFocus() {
		if (hadKeyboardEvent) element.classList.add(className);
	}
	function handleBlur() {
		element.classList.remove(className);
	}
	element.addEventListener("focus", handleFocus);
	element.addEventListener("blur", handleBlur);
	return () => {
		element.removeEventListener("focus", handleFocus);
		element.removeEventListener("blur", handleBlur);
		element.classList.remove(className);
	};
}
var liveRegion = null;
function getLiveRegion() {
	if (liveRegion && document.body.contains(liveRegion)) return liveRegion;
	liveRegion = document.createElement("div");
	liveRegion.id = "ml-live-region";
	liveRegion.setAttribute("aria-live", "polite");
	liveRegion.setAttribute("aria-atomic", "true");
	liveRegion.setAttribute("role", "status");
	Object.assign(liveRegion.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		padding: "0",
		margin: "-1px",
		overflow: "hidden",
		clip: "rect(0, 0, 0, 0)",
		whiteSpace: "nowrap",
		border: "0"
	});
	document.body.appendChild(liveRegion);
	return liveRegion;
}
function announce(message, priority = "polite") {
	const region = getLiveRegion();
	region.setAttribute("aria-live", priority);
	region.textContent = "";
	setTimeout(() => {
		region.textContent = message;
	}, 50);
}
function createLiveRegion(options = {}) {
	const { id, priority = "polite", atomic = true } = options;
	const region = document.createElement("div");
	if (id) region.id = id;
	region.setAttribute("aria-live", priority);
	region.setAttribute("aria-atomic", atomic.toString());
	region.setAttribute("role", "status");
	Object.assign(region.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		padding: "0",
		margin: "-1px",
		overflow: "hidden",
		clip: "rect(0, 0, 0, 0)",
		whiteSpace: "nowrap",
		border: "0"
	});
	return region;
}
const resetStyles = `
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	* {
		margin: 0;
		padding: 0;
	}

	button {
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
	}

	input,
	textarea,
	select {
		font: inherit;
		color: inherit;
	}

	a {
		color: inherit;
		text-decoration: inherit;
	}

	img,
	svg {
		display: block;
		max-width: 100%;
	}

	[hidden] {
		display: none !important;
	}
`;
const visuallyHiddenStyles = `
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.visually-hidden:focus,
	.visually-hidden:active {
		position: static;
		width: auto;
		height: auto;
		margin: 0;
		overflow: visible;
		clip: auto;
		white-space: normal;
	}
`;
const componentBaseStyles = `
	:host {
		/* Inherit font from parent by default */
		font-family: var(--ml-font-sans);

		/* Consistent box sizing */
		box-sizing: border-box;
	}

	:host *,
	:host *::before,
	:host *::after {
		box-sizing: inherit;
	}

	/* Focus visible styles */
	:host(:focus-visible) {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
	}

	/* Disabled state */
	:host([disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	/* Hidden state */
	:host([hidden]) {
		display: none !important;
	}
`;
function clickOutside(element, callback) {
	function handleClick(event) {
		const target = event.target;
		if (!element.contains(target)) callback(event);
	}
	document.addEventListener("click", handleClick, true);
	return () => {
		document.removeEventListener("click", handleClick, true);
	};
}
var VirtualScroller = class {
	constructor() {
		this._viewport = null;
		this._resizeObserver = null;
		this._options = null;
		this._handleScroll = () => {
			this._compute(this._viewport.clientHeight);
		};
	}
	attach(viewport, options) {
		this._viewport = viewport;
		this._options = options;
		this._resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) this._compute(entry.contentRect.height);
		});
		this._resizeObserver.observe(viewport);
		viewport.addEventListener("scroll", this._handleScroll);
	}
	detach() {
		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		if (this._viewport) this._viewport.removeEventListener("scroll", this._handleScroll);
		this._viewport = null;
		this._options = null;
	}
	invalidate() {
		if (!this._viewport) return;
		this._compute(this._viewport.clientHeight);
	}
	_compute(viewportHeight) {
		if (!this._viewport || !this._options) return;
		const { rowHeight, itemCount, onUpdate, enabled, buffer = 3 } = this._options;
		const count = itemCount();
		if (enabled && !enabled()) {
			onUpdate(0, count);
			return;
		}
		const scrollTop = this._viewport.scrollTop;
		const rowH = rowHeight();
		onUpdate(Math.max(0, Math.floor(scrollTop / rowH) - buffer), Math.min(count, Math.ceil((scrollTop + viewportHeight) / rowH) + buffer));
	}
};
const newID = () => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replaceAll(/[xy]/g, function(c) {
		const r = Math.trunc(Math.random() * 16);
		return (c === "x" ? r : r & 3 | 8).toString(16);
	});
};
function parseValue(value) {
	if (typeof value === "string") return { content: value };
	if (value && typeof value === "object" && "content" in value) return value;
	return { content: String(value ?? "") };
}
function tooltipDirective(element, value) {
	if (!value) return;
	const { content, placement } = parseValue(value);
	if (!content) return;
	const tooltip = document.createElement("ml-tooltip");
	tooltip.setAttribute("content", content);
	if (placement) tooltip.setAttribute("placement", placement);
	element.parentNode?.insertBefore(tooltip, element);
	tooltip.appendChild(element);
	return () => {
		tooltip.parentNode?.insertBefore(element, tooltip);
		tooltip.remove();
	};
}
registerAttributeDirective("tooltip", tooltipDirective);
function spinnerTemplate(c) {
	return html`
		<div
			class=${classMap({
		spinner: true,
		[`spinner--${c.size}`]: true
	})}
			role="status"
			aria-label=${c.label}
		>
			<svg class="spinner__svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle class="spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
				<path
					class="spinner__indicator"
					d="M12 2C6.47715 2 2 6.47715 2 12"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
				/>
			</svg>
			${c.label ? html`<span class="visually-hidden">${c.label}</span>` : ""}
		</div>
	`;
}
const spinnerStyles = () => css`
	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Color — defaults to currentColor via stroke in SVG */
		--ml-spinner-color: currentColor;

		/* Size — default md (1.5rem) */
		--ml-spinner-size: 1.5rem;

		/* Track opacity */
		--ml-spinner-track-opacity: 0.25;

		/* Animation */
		--ml-spinner-animation-duration: 0.75s;
	}

	.spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner__svg {
		animation: spin var(--ml-spinner-animation-duration) linear infinite;
	}

	.spinner__track {
		opacity: var(--ml-spinner-track-opacity);
	}

	.spinner__indicator {
		opacity: 1;
	}

	.spinner--xs {
		--ml-spinner-size: 1rem;
	}

	.spinner--sm {
		--ml-spinner-size: 1.25rem;
	}

	.spinner--md {
		--ml-spinner-size: 1.5rem;
	}

	.spinner--lg {
		--ml-spinner-size: 2rem;
	}

	.spinner--xl {
		--ml-spinner-size: 2.5rem;
	}

	.spinner--xs .spinner__svg,
	.spinner--sm .spinner__svg,
	.spinner--md .spinner__svg,
	.spinner--lg .spinner__svg,
	.spinner--xl .spinner__svg {
		width: var(--ml-spinner-size);
		height: var(--ml-spinner-size);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
`;
var SpinnerComponent = class SpinnerComponent$1 {
	constructor() {
		this.size = "md";
		this.label = "Loading";
	}
};
SpinnerComponent = __decorate([MelodicComponent({
	selector: "ml-spinner",
	template: spinnerTemplate,
	styles: spinnerStyles,
	attributes: ["size", "label"]
})], SpinnerComponent);
function buttonTemplate(c) {
	return html`
		<button
			type="${c.type}"
			class=${classMap({
		"ml-button": true,
		[`ml-button--${c.variant}`]: true,
		[`ml-button--${c.size}`]: true,
		"ml-button--disabled": c.isDisabled,
		"ml-button--loading": c.loading,
		"ml-button--full-width": c.fullWidth
	})}
			?disabled=${c.isDisabled}
			@click=${c.handleClick}
			aria-disabled=${c.isDisabled ? "true" : "false"}
			aria-busy=${c.loading ? "true" : "false"}
		>
			${when(c.loading, () => html`
					<span class="ml-button__spinner">
						<ml-spinner size="sm"></ml-spinner>
					</span>
				`)}
			<span class="ml-button__content">
				<slot name="icon-start"></slot>
				<slot></slot>
				<slot name="icon-end"></slot>
			</span>
		</button>
	`;
}
const buttonStyles = () => css`
	:host {
		display: inline-block;

		/* --- Colors --- */
		--ml-button-bg: var(--ml-color-primary);
		--ml-button-border-color: var(--ml-color-primary);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-primary-hover);
		--ml-button-hover-border-color: var(--ml-color-primary-hover);
		--ml-button-hover-color: var(--ml-color-text-inverse);
		--ml-button-active-bg: var(--ml-color-primary-active);
		--ml-button-active-border-color: var(--ml-color-primary-active);
		--ml-button-shadow: var(--ml-shadow-xs);
		--ml-button-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Typography --- */
		--ml-button-font-family: var(--ml-font-sans);
		--ml-button-font-weight: var(--ml-font-semibold);
		--ml-button-font-size: var(--ml-text-sm);
		--ml-button-line-height: var(--ml-leading-tight);

		/* --- Spacing --- */
		--ml-button-height: 2.5rem;
		--ml-button-padding: 0 var(--ml-space-3-5);
		--ml-button-gap: var(--ml-space-2);
		--ml-button-border-width: var(--ml-border);
		--ml-button-border-radius: var(--ml-radius);

		/* --- Disabled --- */
		--ml-button-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-button-transition-duration: var(--ml-duration-150);
		--ml-button-transition-easing: var(--ml-ease-in-out);
	}

	:host([full-width]) {
		display: block;
		width: 100%;
	}

	.ml-button {
		appearance: none;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-button-gap);
		position: relative;
		font-family: var(--ml-button-font-family);
		font-weight: var(--ml-button-font-weight);
		font-size: var(--ml-button-font-size);
		line-height: var(--ml-button-line-height);
		white-space: nowrap;
		text-align: center;
		height: var(--ml-button-height);
		padding: var(--ml-button-padding);
		border: var(--ml-button-border-width) solid var(--ml-button-border-color);
		border-radius: var(--ml-button-border-radius);
		background-color: var(--ml-button-bg);
		color: var(--ml-button-color);
		box-shadow: var(--ml-button-shadow);
		transition:
			background-color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			border-color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			box-shadow var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			transform var(--ml-button-transition-duration) var(--ml-button-transition-easing);
	}

	.ml-button:focus {
		outline: none;
	}

	.ml-button:focus-visible {
		box-shadow: var(--ml-button-focus-shadow);
	}

	.ml-button:hover:not(:disabled) {
		background-color: var(--ml-button-hover-bg);
		border-color: var(--ml-button-hover-border-color);
		color: var(--ml-button-hover-color);
	}

	.ml-button:active:not(:disabled) {
		background-color: var(--ml-button-active-bg);
		border-color: var(--ml-button-active-border-color);
	}

	/* --- Size variants --- */
	.ml-button--xs {
		--ml-button-height: 2rem;
		--ml-button-padding: 0 var(--ml-space-3);
		--ml-button-font-size: var(--ml-text-xs);
		--ml-button-border-radius: var(--ml-radius-sm);
	}

	.ml-button--sm {
		--ml-button-height: 2.25rem;
		--ml-button-padding: 0 var(--ml-space-3);
		--ml-button-font-size: var(--ml-text-sm);
		--ml-button-border-radius: var(--ml-radius);
	}

	.ml-button--md {
		--ml-button-height: 2.5rem;
		--ml-button-padding: 0 var(--ml-space-3-5);
		--ml-button-font-size: var(--ml-text-sm);
	}

	.ml-button--lg {
		--ml-button-height: 2.75rem;
		--ml-button-padding: 0 var(--ml-space-4);
		--ml-button-font-size: var(--ml-text-sm);
	}

	.ml-button--xl {
		--ml-button-height: 3rem;
		--ml-button-padding: 0 var(--ml-space-5);
		--ml-button-font-size: var(--ml-text-base);
	}

	.ml-button--2xl {
		--ml-button-height: 3.75rem;
		--ml-button-padding: 0 var(--ml-space-7);
		--ml-button-font-size: var(--ml-text-lg);
		--ml-button-gap: var(--ml-space-3);
	}

	/* --- Variant: primary (default — already set on :host) --- */
	.ml-button--primary {
		--ml-button-bg: var(--ml-color-primary);
		--ml-button-border-color: var(--ml-color-primary);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-primary-hover);
		--ml-button-hover-border-color: var(--ml-color-primary-hover);
		--ml-button-active-bg: var(--ml-color-primary-active);
		--ml-button-active-border-color: var(--ml-color-primary-active);
	}

	/* --- Variant: secondary --- */
	.ml-button--secondary {
		--ml-button-bg: var(--ml-color-surface);
		--ml-button-border-color: var(--ml-color-border-strong);
		--ml-button-color: var(--ml-color-text-secondary);
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: var(--ml-color-border-strong);
		--ml-button-hover-color: var(--ml-color-text);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
		--ml-button-focus-shadow: var(--ml-shadow-ring-gray);
	}

	/* --- Variant: outline --- */
	.ml-button--outline {
		--ml-button-bg: transparent;
		--ml-button-border-color: var(--ml-color-border-strong);
		--ml-button-color: var(--ml-color-text-secondary);
		--ml-button-shadow: none;
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: var(--ml-color-border-strong);
		--ml-button-hover-color: var(--ml-color-text);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
	}

	/* --- Variant: ghost --- */
	.ml-button--ghost {
		--ml-button-bg: transparent;
		--ml-button-border-color: transparent;
		--ml-button-color: var(--ml-color-text-muted);
		--ml-button-shadow: none;
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: transparent;
		--ml-button-hover-color: var(--ml-color-text-secondary);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
	}

	/* --- Variant: danger --- */
	.ml-button--danger {
		--ml-button-bg: var(--ml-color-danger);
		--ml-button-border-color: var(--ml-color-danger);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-danger-hover);
		--ml-button-hover-border-color: var(--ml-color-danger-hover);
		--ml-button-active-bg: var(--ml-red-800);
		--ml-button-active-border-color: var(--ml-red-800);
		--ml-button-focus-shadow: var(--ml-shadow-ring-error);
	}

	/* --- Variant: link --- */
	.ml-button--link {
		--ml-button-bg: transparent;
		--ml-button-border-color: transparent;
		--ml-button-color: var(--ml-color-text-link);
		--ml-button-shadow: none;
		--ml-button-font-weight: var(--ml-font-medium);
		--ml-button-height: auto;
		--ml-button-padding: 0;
		--ml-button-hover-bg: transparent;
		--ml-button-hover-border-color: transparent;
		--ml-button-hover-color: var(--ml-color-text-link-hover);
	}

	.ml-button--link:hover:not(:disabled) {
		text-decoration: underline;
	}

	/* --- Disabled --- */
	.ml-button--disabled {
		opacity: var(--ml-button-disabled-opacity);
		cursor: not-allowed;
		pointer-events: none;
		box-shadow: none;
	}

	.ml-button--loading .ml-button__content {
		visibility: hidden;
	}

	.ml-button--full-width {
		width: 100%;
	}

	.ml-button__spinner {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-button__content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-button-gap);
	}

	::slotted([slot='icon-start']),
	::slotted([slot='icon-end']) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25em;
		height: 1.25em;
	}

	::slotted(ml-icon) {
		--ml-icon-size: 1.125em;
	}
`;
var ButtonComponent = class ButtonComponent$1 {
	constructor() {
		this.variant = "primary";
		this.size = "md";
		this.type = "button";
		this.disabled = false;
		this.loading = false;
		this.fullWidth = false;
		this.handleClick = (event) => {
			if (this.isDisabled) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			this.elementRef.dispatchEvent(new CustomEvent("ml:click", {
				bubbles: true,
				composed: true,
				detail: { originalEvent: event }
			}));
		};
	}
	onInit() {
		if (!this.elementRef.hasAttribute("role")) this.elementRef.setAttribute("role", "button");
	}
	get isDisabled() {
		return this.disabled || this.loading;
	}
};
ButtonComponent = __decorate([MelodicComponent({
	selector: "ml-button",
	template: buttonTemplate,
	styles: buttonStyles,
	attributes: [
		"variant",
		"size",
		"type",
		"disabled",
		"loading",
		"full-width"
	]
})], ButtonComponent);
function buttonGroupTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-button-group": true,
		"ml-button-group--disabled": c.disabled
	})}
			role="group"
		>
			<slot @slotchange=${c.handleSlotChange}></slot>
		</div>
	`;
}
const buttonGroupStyles = () => css`
	:host {
		display: inline-flex;

		/* --- Disabled --- */
		--ml-button-group-disabled-opacity: 0.5;

		/* --- Spacing --- */
		--ml-button-group-item-offset: -1px;
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: var(--ml-button-group-disabled-opacity);
		pointer-events: none;
	}

	::slotted(ml-button-group-item) {
		margin-left: var(--ml-button-group-item-offset);
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
var ButtonGroupComponent = class ButtonGroupComponent$1 {
	constructor() {
		this.value = "";
		this.variant = "outline";
		this.size = "md";
		this.disabled = false;
		this.multiple = false;
		this.values = [];
		this.handleSlotChange = () => {
			this.syncItems();
		};
		this._handleItemClick = (event) => {
			event.stopPropagation();
			const itemValue = event.detail.value;
			if (this.multiple) {
				if (this.values.indexOf(itemValue) >= 0) this.values = this.values.filter((v) => v !== itemValue);
				else this.values = [...this.values, itemValue];
				this.syncItems();
				this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
					bubbles: true,
					composed: true,
					detail: { values: this.values }
				}));
			} else {
				this.value = itemValue;
				this.syncItems();
				this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
					bubbles: true,
					composed: true,
					detail: { value: this.value }
				}));
			}
		};
	}
	onCreate() {
		this.elementRef.addEventListener("ml:item-click", this._handleItemClick);
		this.syncItems();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:item-click", this._handleItemClick);
	}
	syncItems() {
		this.elementRef.querySelectorAll("ml-button-group-item").forEach((item) => {
			const itemValue = item.getAttribute("value") ?? "";
			const isActive = this.multiple ? this.values.includes(itemValue) : itemValue === this.value;
			item.toggleAttribute("active", isActive);
			item.toggleAttribute("group-disabled", this.disabled);
			item.setAttribute("group-size", this.size);
			item.setAttribute("group-variant", this.variant);
		});
	}
};
ButtonGroupComponent = __decorate([MelodicComponent({
	selector: "ml-button-group",
	template: buttonGroupTemplate,
	styles: buttonGroupStyles,
	attributes: [
		"value",
		"variant",
		"size",
		"disabled",
		"multiple"
	]
})], ButtonGroupComponent);
function buttonGroupItemTemplate(c) {
	return html`
		<button
			type="button"
			class="ml-button-group-item"
			?disabled=${c.isDisabled}
			aria-pressed=${c.active ? "true" : "false"}
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
			<slot></slot>
		</button>
	`;
}
const buttonGroupItemStyles = () => css`
	:host {
		display: inline-flex;
	}

	.ml-button-group-item {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		height: 2.5rem;
		padding: 0 var(--ml-space-3-5);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		white-space: nowrap;
		cursor: pointer;
		border: 1px solid var(--ml-color-border-strong);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text-secondary);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	/* Sizes */
	:host([group-size="sm"]) .ml-button-group-item {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	:host([group-size="lg"]) .ml-button-group-item {
		height: 2.75rem;
		padding: 0 var(--ml-space-4);
	}

	/* Border radius */
	:host(:first-child) .ml-button-group-item {
		border-radius: var(--ml-radius) 0 0 var(--ml-radius);
	}

	:host(:last-child) .ml-button-group-item {
		border-radius: 0 var(--ml-radius) var(--ml-radius) 0;
	}

	:host(:only-child) .ml-button-group-item {
		border-radius: var(--ml-radius);
	}

	:host(:not(:first-child):not(:last-child)) .ml-button-group-item {
		border-radius: 0;
	}

	/* Hover */
	.ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	/* Focus */
	.ml-button-group-item:focus {
		outline: none;
	}

	.ml-button-group-item:focus-visible {
		z-index: 1;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Active / Selected - outline variant (default) */
	:host([active]) .ml-button-group-item {
		background-color: var(--ml-color-surface-sunken);
		color: var(--ml-color-text);
		font-weight: var(--ml-font-semibold);
		z-index: 1;
	}

	:host([active]) .ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
		color: var(--ml-color-text);
	}

	/* Active / Selected - solid variant */
	:host([active][group-variant="solid"]) .ml-button-group-item {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
		border-color: var(--ml-color-primary);
		font-weight: var(--ml-font-semibold);
		z-index: 1;
	}

	:host([active][group-variant="solid"]) .ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-primary-hover);
		border-color: var(--ml-color-primary-hover);
		color: var(--ml-color-text-inverse);
	}

	/* Disabled */
	:host([group-disabled]) .ml-button-group-item,
	:host([disabled]) .ml-button-group-item {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;
var ButtonGroupItemComponent = class ButtonGroupItemComponent$1 {
	constructor() {
		this.value = "";
		this.icon = "";
		this.disabled = false;
		this.active = false;
		this.groupDisabled = false;
		this.groupSize = "md";
		this.handleClick = () => {
			if (this.isDisabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:item-click", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
	get isDisabled() {
		return this.disabled || this.groupDisabled;
	}
};
ButtonGroupItemComponent = __decorate([MelodicComponent({
	selector: "ml-button-group-item",
	template: buttonGroupItemTemplate,
	styles: buttonGroupItemStyles,
	attributes: [
		"value",
		"icon",
		"disabled",
		"active",
		"group-disabled",
		"group-size"
	]
})], ButtonGroupItemComponent);
function inputTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-input": true,
		[`ml-input--${c.size}`]: true,
		"ml-input--disabled": c.disabled,
		"ml-input--readonly": c.readonly,
		"ml-input--error": !!c.error,
		"ml-input--focused": c.focused
	})}
		>
			${when(!!c.label, () => html`
					<label class="ml-input__label" for="input">
						${c.label}
						${when(c.required, () => html`<span class="ml-input__required">*</span>`)}
					</label>
				`)}

			<div class="ml-input__wrapper">
				<slot name="prefix"></slot>
				<input
					id="input"
					class="ml-input__field"
					type="${c.type}"
					.value=${c.value}
					placeholder="${c.placeholder}"
					?disabled=${c.disabled}
					?readonly=${c.readonly}
					?required=${c.required}
					autocomplete="${c.autocomplete}"
					aria-invalid=${c.error ? "true" : "false"}
					aria-describedby=${c.error ? "error" : c.hint ? "hint" : ""}
					@input=${c.handleInput}
					@change=${c.handleChange}
					@focus=${c.handleFocus}
					@blur=${c.handleBlur}
				/>
				<slot name="suffix"></slot>
			</div>

			${when(!!c.error, () => html`<span id="error" class="ml-input__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span id="hint" class="ml-input__hint">${c.hint}</span>`)}`)}
		</div>
	`;
}
const inputStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;

		/* --- Label --- */
		--ml-input-label-font-size: var(--ml-text-sm);
		--ml-input-label-font-weight: var(--ml-font-medium);
		--ml-input-label-color: var(--ml-color-text-secondary);
		--ml-input-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-input-required-color: var(--ml-color-danger);

		/* --- Wrapper --- */
		--ml-input-bg: var(--ml-color-input-bg);
		--ml-input-border-width: var(--ml-border);
		--ml-input-border-color: var(--ml-color-border);
		--ml-input-border-radius: var(--ml-radius);
		--ml-input-shadow: none;
		--ml-input-hover-border-color: var(--ml-color-border);
		--ml-input-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-input-gap: var(--ml-space-2);

		/* --- Field --- */
		--ml-input-color: var(--ml-color-text);
		--ml-input-font-family: var(--ml-font-sans);
		--ml-input-font-size: var(--ml-text-sm);
		--ml-input-line-height: var(--ml-leading-normal);
		--ml-input-placeholder-color: var(--ml-color-text-muted);

		/* --- Focus --- */
		--ml-input-focus-border-color: var(--ml-color-primary);
		--ml-input-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-input-focus-inset-shadow: none;

		/* --- Error --- */
		--ml-input-error-border-color: var(--ml-color-danger);
		--ml-input-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-input-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-input-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-input-disabled-color: var(--ml-color-text-muted);

		/* --- Hint --- */
		--ml-input-hint-color: var(--ml-color-text-muted);
		--ml-input-hint-font-size: var(--ml-text-sm);

		/* --- Prefix / Suffix --- */
		--ml-input-addon-color: var(--ml-color-text-muted);

		/* --- Transition --- */
		--ml-input-transition-duration: var(--ml-duration-150);
		--ml-input-transition-easing: var(--ml-ease-in-out);
	}

	.ml-input {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-input__label {
		font-size: var(--ml-input-label-font-size);
		font-weight: var(--ml-input-label-font-weight);
		color: var(--ml-input-label-color);
		line-height: var(--ml-input-label-line-height);
	}

	.ml-input__required {
		color: var(--ml-input-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-input__wrapper {
		display: flex;
		align-items: center;
		gap: var(--ml-input-gap);
		padding: var(--ml-input-padding);
		background-color: var(--ml-input-bg);
		border: var(--ml-input-border-width) solid var(--ml-input-border-color);
		border-radius: var(--ml-input-border-radius);
		box-shadow: var(--ml-input-shadow);
		transition:
			border-color var(--ml-input-transition-duration) var(--ml-input-transition-easing),
			box-shadow var(--ml-input-transition-duration) var(--ml-input-transition-easing);
	}

	.ml-input__wrapper:hover:not(.ml-input--disabled .ml-input__wrapper) {
		border-color: var(--ml-input-hover-border-color);
	}

	.ml-input__field {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--ml-input-color);
		font-family: var(--ml-input-font-family);
		font-size: var(--ml-input-font-size);
		line-height: var(--ml-input-line-height);
	}

	.ml-input__field:focus {
		outline: none;
	}

	.ml-input__field::placeholder {
		color: var(--ml-input-placeholder-color);
	}

	.ml-input__field:disabled {
		cursor: not-allowed;
		color: var(--ml-input-disabled-color);
	}

	.ml-input__hint,
	.ml-input__error {
		font-size: var(--ml-input-hint-font-size);
		line-height: var(--ml-input-label-line-height);
	}

	.ml-input__hint {
		color: var(--ml-input-hint-color);
	}

	.ml-input__error {
		color: var(--ml-input-error-color);
	}

	.ml-input--focused .ml-input__wrapper {
		border-color: var(--ml-input-focus-border-color);
		box-shadow: var(--ml-input-focus-shadow), var(--ml-input-focus-inset-shadow);
	}

	.ml-input--error .ml-input__wrapper {
		border-color: var(--ml-input-error-border-color);
	}

	.ml-input--error.ml-input--focused .ml-input__wrapper {
		box-shadow: var(--ml-input-error-focus-shadow);
	}

	.ml-input--disabled .ml-input__wrapper {
		background-color: var(--ml-input-disabled-bg);
		cursor: not-allowed;
	}

	/* --- Size variants --- */
	.ml-input--sm .ml-input__wrapper {
		padding: var(--ml-space-2) var(--ml-space-3);
	}

	.ml-input--sm .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--md .ml-input__wrapper {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
	}

	.ml-input--md .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--lg .ml-input__wrapper {
		padding: var(--ml-space-3) var(--ml-space-3-5);
	}

	.ml-input--lg .ml-input__field {
		font-size: var(--ml-text-base);
	}

	::slotted([slot='prefix']),
	::slotted([slot='suffix']) {
		display: flex;
		align-items: center;
		color: var(--ml-input-addon-color);
		flex-shrink: 0;
	}
`;
var InputComponent = class InputComponent$1 {
	constructor() {
		this.type = "text";
		this.value = "";
		this.placeholder = "";
		this.label = "";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.disabled = false;
		this.readonly = false;
		this.required = false;
		this.autocomplete = "off";
		this.focused = false;
		this.handleInput = (event) => {
			this.value = event.target.value;
			this.elementRef.dispatchEvent(new CustomEvent("ml:input", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleChange = (event) => {
			this.value = event.target.value;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleFocus = () => {
			this.focused = true;
			this.elementRef.dispatchEvent(new CustomEvent("ml:focus", {
				bubbles: true,
				composed: true
			}));
		};
		this.handleBlur = () => {
			this.focused = false;
			this.elementRef.dispatchEvent(new CustomEvent("ml:blur", {
				bubbles: true,
				composed: true
			}));
		};
	}
	onInit() {
		if (!this.label && this.placeholder) this.elementRef.setAttribute("aria-label", this.placeholder);
	}
};
InputComponent = __decorate([MelodicComponent({
	selector: "ml-input",
	template: inputTemplate,
	styles: inputStyles,
	attributes: [
		"type",
		"value",
		"placeholder",
		"label",
		"hint",
		"error",
		"size",
		"disabled",
		"readonly",
		"required",
		"autocomplete"
	]
})], InputComponent);
function textareaTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-textarea": true,
		[`ml-textarea--${c.size}`]: true,
		"ml-textarea--disabled": c.disabled,
		"ml-textarea--readonly": c.readonly,
		"ml-textarea--error": !!c.error,
		"ml-textarea--focused": c.focused,
		"ml-textarea--resize": c.resize
	})}
		>
			${when(!!c.label, () => html`
					<label class="ml-textarea__label" for="textarea">
						${c.label}
						${when(c.required, () => html`<span class="ml-textarea__required">*</span>`)}
					</label>
				`)}

			<textarea
				id="textarea"
				class="ml-textarea__field"
				.value=${c.value}
				placeholder="${c.placeholder}"
				rows="${c.rows}"
				?disabled=${c.disabled}
				?readonly=${c.readonly}
				?required=${c.required}
				maxlength="${c.maxLength || ""}"
				aria-invalid=${c.error ? "true" : "false"}
				aria-describedby=${c.error ? "error" : c.hint ? "hint" : ""}
				@input=${c.handleInput}
				@change=${c.handleChange}
				@focus=${c.handleFocus}
				@blur=${c.handleBlur}
			></textarea>

			<div class="ml-textarea__footer">
				${when(!!c.error, () => html`<span id="error" class="ml-textarea__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span id="hint" class="ml-textarea__hint">${c.hint}</span>`)}`)}
				${when(c.maxLength > 0, () => html`
						<span class="ml-textarea__counter"> ${c.value.length} / ${c.maxLength} </span>
					`)}
			</div>
		</div>
	`;
}
const textareaStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;

		/* --- Label --- */
		--ml-textarea-label-font-size: var(--ml-text-sm);
		--ml-textarea-label-font-weight: var(--ml-font-medium);
		--ml-textarea-label-color: var(--ml-color-text-secondary);
		--ml-textarea-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-textarea-required-color: var(--ml-color-danger);

		/* --- Field --- */
		--ml-textarea-bg: var(--ml-color-input-bg);
		--ml-textarea-border-width: var(--ml-border);
		--ml-textarea-border-color: var(--ml-color-border);
		--ml-textarea-border-radius: var(--ml-radius);
		--ml-textarea-shadow: none;
		--ml-textarea-color: var(--ml-color-text);
		--ml-textarea-font-family: var(--ml-font-sans);
		--ml-textarea-font-size: var(--ml-text-sm);
		--ml-textarea-line-height: var(--ml-leading-normal);
		--ml-textarea-padding: var(--ml-space-3) var(--ml-space-3-5);
		--ml-textarea-min-height: 80px;
		--ml-textarea-placeholder-color: var(--ml-color-text-muted);
		--ml-textarea-hover-border-color: var(--ml-color-border);

		/* --- Focus --- */
		--ml-textarea-focus-border-color: var(--ml-color-primary);
		--ml-textarea-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-textarea-focus-inset-shadow: none;

		/* --- Error --- */
		--ml-textarea-error-border-color: var(--ml-color-danger);
		--ml-textarea-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-textarea-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-textarea-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-textarea-disabled-color: var(--ml-color-text-muted);

		/* --- Hint / Counter --- */
		--ml-textarea-hint-color: var(--ml-color-text-muted);
		--ml-textarea-hint-font-size: var(--ml-text-sm);
		--ml-textarea-counter-font-size: var(--ml-text-xs);
		--ml-textarea-counter-color: var(--ml-color-text-muted);

		/* --- Transition --- */
		--ml-textarea-transition-duration: var(--ml-duration-150);
		--ml-textarea-transition-easing: var(--ml-ease-in-out);
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-textarea__label {
		font-size: var(--ml-textarea-label-font-size);
		font-weight: var(--ml-textarea-label-font-weight);
		color: var(--ml-textarea-label-color);
		line-height: var(--ml-textarea-label-line-height);
	}

	.ml-textarea__required {
		color: var(--ml-textarea-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-textarea__field {
		box-sizing: border-box;
		width: 100%;
		min-height: var(--ml-textarea-min-height);
		padding: var(--ml-textarea-padding);
		background-color: var(--ml-textarea-bg);
		border: var(--ml-textarea-border-width) solid var(--ml-textarea-border-color);
		border-radius: var(--ml-textarea-border-radius);
		box-shadow: var(--ml-textarea-shadow);
		color: var(--ml-textarea-color);
		font-family: var(--ml-textarea-font-family);
		font-size: var(--ml-textarea-font-size);
		line-height: var(--ml-textarea-line-height);
		resize: none;
		transition:
			border-color var(--ml-textarea-transition-duration) var(--ml-textarea-transition-easing),
			box-shadow var(--ml-textarea-transition-duration) var(--ml-textarea-transition-easing);
	}

	.ml-textarea__field:hover:not(:disabled) {
		border-color: var(--ml-textarea-hover-border-color);
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-textarea-focus-border-color);
		box-shadow: var(--ml-textarea-focus-shadow), var(--ml-textarea-focus-inset-shadow);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-textarea-placeholder-color);
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-textarea-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-textarea-disabled-color);
	}

	.ml-textarea__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	.ml-textarea__error,
	.ml-textarea__hint {
		font-size: var(--ml-textarea-hint-font-size);
		line-height: var(--ml-textarea-label-line-height);
	}

	.ml-textarea__error {
		color: var(--ml-textarea-error-color);
	}

	.ml-textarea__hint {
		color: var(--ml-textarea-hint-color);
	}

	.ml-textarea__counter {
		font-size: var(--ml-textarea-counter-font-size);
		color: var(--ml-textarea-counter-color);
		margin-left: auto;
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-textarea-error-border-color);
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: var(--ml-textarea-error-focus-shadow);
	}

	/* --- Size variants --- */
	.ml-textarea--sm .ml-textarea__field {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-textarea--lg .ml-textarea__field {
		padding: var(--ml-space-3-5) var(--ml-space-4);
		font-size: var(--ml-text-base);
	}
`;
var TextareaComponent = class TextareaComponent$1 {
	constructor() {
		this.value = "";
		this.placeholder = "";
		this.label = "";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.rows = 3;
		this.maxLength = 0;
		this.disabled = false;
		this.readonly = false;
		this.required = false;
		this.resize = false;
		this.focused = false;
		this.handleInput = (event) => {
			this.value = event.target.value;
			this.elementRef.dispatchEvent(new CustomEvent("ml:input", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleChange = (event) => {
			this.value = event.target.value;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleFocus = () => {
			this.focused = true;
			this.elementRef.dispatchEvent(new CustomEvent("ml:focus", {
				bubbles: true,
				composed: true
			}));
		};
		this.handleBlur = () => {
			this.focused = false;
			this.elementRef.dispatchEvent(new CustomEvent("ml:blur", {
				bubbles: true,
				composed: true
			}));
		};
	}
	onInit() {
		if (!this.label && this.placeholder) this.elementRef.setAttribute("aria-label", this.placeholder);
	}
};
TextareaComponent = __decorate([MelodicComponent({
	selector: "ml-textarea",
	template: textareaTemplate,
	styles: textareaStyles,
	attributes: [
		"value",
		"placeholder",
		"label",
		"hint",
		"error",
		"size",
		"rows",
		"max-length",
		"disabled",
		"readonly",
		"required",
		"resize"
	]
})], TextareaComponent);
function checkboxTemplate(c) {
	return html`
		<label
			class=${classMap({
		"ml-checkbox": true,
		[`ml-checkbox--${c.size}`]: true,
		"ml-checkbox--checked": c.checked,
		"ml-checkbox--indeterminate": c.indeterminate,
		"ml-checkbox--disabled": c.disabled
	})}
		>
			<input
				type="checkbox"
				class="ml-checkbox__input"
				.checked=${c.checked}
				.indeterminate=${c.indeterminate}
				?disabled=${c.disabled}
				@change=${c.handleChange}
			/>
			<span class="ml-checkbox__box">
				${when(c.checked && !c.indeterminate, () => html`
						<svg class="ml-checkbox__check" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					`)}
				${when(c.indeterminate, () => html`
						<svg class="ml-checkbox__minus" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					`)}
			</span>
			${when(!!c.label, () => html`<span class="ml-checkbox__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-checkbox__hint">${c.hint}</span>`)}
	`;
}
const checkboxStyles = () => css`
	:host {
		display: block;

		/* --- Box --- */
		--ml-checkbox-box-size: 1.25rem;
		--ml-checkbox-box-bg: var(--ml-color-input-bg);
		--ml-checkbox-box-border-width: var(--ml-border);
		--ml-checkbox-box-border-color: var(--ml-color-border-strong);
		--ml-checkbox-box-border-radius: var(--ml-radius-xs);
		--ml-checkbox-box-color: var(--ml-color-text-inverse);

		/* --- Checked --- */
		--ml-checkbox-checked-bg: var(--ml-color-primary);
		--ml-checkbox-checked-border-color: var(--ml-color-primary);
		--ml-checkbox-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-checkbox-checked-hover-border-color: var(--ml-color-primary-hover);

		/* --- Hover --- */
		--ml-checkbox-hover-border-color: var(--ml-color-primary);

		/* --- Focus --- */
		--ml-checkbox-focus-border-color: var(--ml-color-primary);
		--ml-checkbox-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-checkbox-label-font-size: var(--ml-text-sm);
		--ml-checkbox-label-font-weight: var(--ml-font-medium);
		--ml-checkbox-label-color: var(--ml-color-text-secondary);
		--ml-checkbox-label-line-height: 1.25rem;

		/* --- Hint --- */
		--ml-checkbox-hint-font-size: var(--ml-text-sm);
		--ml-checkbox-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-checkbox-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-checkbox-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-checkbox-transition-duration: var(--ml-duration-150);
		--ml-checkbox-transition-easing: var(--ml-ease-in-out);
	}

	.ml-checkbox {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-checkbox-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-checkbox:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		border-color: var(--ml-checkbox-hover-border-color);
	}

	.ml-checkbox__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-checkbox__input:focus-visible + .ml-checkbox__box {
		border-color: var(--ml-checkbox-focus-border-color);
		box-shadow: var(--ml-checkbox-focus-shadow);
	}

	.ml-checkbox__box {
		position: relative;
		flex-shrink: 0;
		display: block;
		width: var(--ml-checkbox-box-size);
		height: var(--ml-checkbox-box-size);
		background-color: var(--ml-checkbox-box-bg);
		border: var(--ml-checkbox-box-border-width) solid var(--ml-checkbox-box-border-color);
		border-radius: var(--ml-checkbox-box-border-radius);
		color: var(--ml-checkbox-box-color);
		transition:
			background-color var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing),
			border-color var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing),
			box-shadow var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing);
	}

	.ml-checkbox__check,
	.ml-checkbox__minus {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 75%;
		height: 75%;
	}

	.ml-checkbox__label {
		font-size: var(--ml-checkbox-label-font-size);
		font-weight: var(--ml-checkbox-label-font-weight);
		color: var(--ml-checkbox-label-color);
		line-height: var(--ml-checkbox-label-line-height);
	}

	.ml-checkbox__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-checkbox-box-size) + var(--ml-checkbox-gap));
		font-size: var(--ml-checkbox-hint-font-size);
		color: var(--ml-checkbox-hint-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-checkbox--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-checkbox--disabled .ml-checkbox__box,
	.ml-checkbox--disabled .ml-checkbox__label {
		opacity: var(--ml-checkbox-disabled-opacity);
	}

	.ml-checkbox--checked .ml-checkbox__box,
	.ml-checkbox--indeterminate .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-bg);
		border-color: var(--ml-checkbox-checked-border-color);
	}

	.ml-checkbox--checked:hover:not(.ml-checkbox--disabled) .ml-checkbox__box,
	.ml-checkbox--indeterminate:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-hover-bg);
		border-color: var(--ml-checkbox-checked-hover-border-color);
	}

	/* --- Size variants --- */
	.ml-checkbox--sm {
		--ml-checkbox-box-size: 1rem;
	}

	.ml-checkbox--md {
		--ml-checkbox-box-size: 1.25rem;
	}

	.ml-checkbox--lg {
		--ml-checkbox-box-size: 1.5rem;
		--ml-checkbox-label-font-size: var(--ml-text-base);
		--ml-checkbox-label-line-height: 1.5rem;
	}
`;
var CheckboxComponent = class CheckboxComponent$1 {
	constructor() {
		this.label = "";
		this.hint = "";
		this.size = "md";
		this.checked = false;
		this.indeterminate = false;
		this.disabled = false;
		this.handleChange = (event) => {
			if (this.disabled) {
				event.preventDefault();
				return;
			}
			this.checked = event.target.checked;
			this.indeterminate = false;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			}));
		};
	}
};
CheckboxComponent = __decorate([MelodicComponent({
	selector: "ml-checkbox",
	template: checkboxTemplate,
	styles: checkboxStyles,
	attributes: [
		"label",
		"hint",
		"size",
		"checked",
		"indeterminate",
		"disabled"
	]
})], CheckboxComponent);
function radioTemplate(c) {
	return html`
		<label
			class=${classMap({
		"ml-radio": true,
		[`ml-radio--${c.size}`]: true,
		"ml-radio--checked": c.checked,
		"ml-radio--disabled": c.disabled
	})}
		>
			<input
				type="radio"
				class="ml-radio__input"
				name="${c.name}"
				value="${c.value}"
				.checked=${c.checked}
				?disabled=${c.disabled}
				@change=${c.handleChange}
			/>
			<span class="ml-radio__circle">
				<span class="ml-radio__dot"></span>
			</span>
			${when(!!c.label, () => html`<span class="ml-radio__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-radio__hint">${c.hint}</span>`)}
	`;
}
const radioStyles = () => css`
	:host {
		display: block;

		/* --- Circle --- */
		--ml-radio-circle-size: 1.25rem;
		--ml-radio-circle-bg: var(--ml-color-input-bg);
		--ml-radio-circle-border-width: var(--ml-border);
		--ml-radio-circle-border-color: var(--ml-color-border-strong);
		--ml-radio-circle-border-radius: var(--ml-radius-full);

		/* --- Dot --- */
		--ml-radio-dot-size: 0.5rem;
		--ml-radio-dot-color: var(--ml-color-primary);

		/* --- Checked --- */
		--ml-radio-checked-border-color: var(--ml-color-primary);
		--ml-radio-checked-bg: var(--ml-color-primary-subtle);
		--ml-radio-checked-hover-border-color: var(--ml-color-primary-hover);
		--ml-radio-checked-hover-dot-color: var(--ml-color-primary-hover);

		/* --- Hover --- */
		--ml-radio-hover-border-color: var(--ml-color-primary);

		/* --- Focus --- */
		--ml-radio-focus-border-color: var(--ml-color-primary);
		--ml-radio-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-radio-label-font-size: var(--ml-text-sm);
		--ml-radio-label-font-weight: var(--ml-font-medium);
		--ml-radio-label-color: var(--ml-color-text-secondary);
		--ml-radio-label-line-height: 1.25rem;

		/* --- Hint --- */
		--ml-radio-hint-font-size: var(--ml-text-sm);
		--ml-radio-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-radio-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-radio-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-radio-transition-duration: var(--ml-duration-150);
		--ml-radio-transition-easing: var(--ml-ease-in-out);
	}

	.ml-radio {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-radio-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-radio--disabled {
		cursor: not-allowed;
	}

	.ml-radio--disabled .ml-radio__circle,
	.ml-radio--disabled .ml-radio__label {
		opacity: var(--ml-radio-disabled-opacity);
	}

	.ml-radio__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-radio__circle {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-radio-circle-size);
		height: var(--ml-radio-circle-size);
		background-color: var(--ml-radio-circle-bg);
		border: var(--ml-radio-circle-border-width) solid var(--ml-radio-circle-border-color);
		border-radius: var(--ml-radio-circle-border-radius);
		transition:
			background-color var(--ml-radio-transition-duration) var(--ml-radio-transition-easing),
			border-color var(--ml-radio-transition-duration) var(--ml-radio-transition-easing),
			box-shadow var(--ml-radio-transition-duration) var(--ml-radio-transition-easing);
	}

	.ml-radio__input:focus-visible + .ml-radio__circle {
		border-color: var(--ml-radio-focus-border-color);
		box-shadow: var(--ml-radio-focus-shadow);
	}

	.ml-radio--checked .ml-radio__circle {
		border-color: var(--ml-radio-checked-border-color);
		background-color: var(--ml-radio-checked-bg);
	}

	.ml-radio:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-hover-border-color);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-checked-hover-border-color);
	}

	.ml-radio__dot {
		width: var(--ml-radio-dot-size);
		height: var(--ml-radio-dot-size);
		border-radius: var(--ml-radio-circle-border-radius);
		background-color: var(--ml-radio-dot-color);
		transform: scale(0);
		transition: transform var(--ml-radio-transition-duration) var(--ml-radio-transition-easing);
	}

	.ml-radio--checked .ml-radio__dot {
		transform: scale(1);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__dot {
		background-color: var(--ml-radio-checked-hover-dot-color);
	}

	/* --- Size variants --- */
	.ml-radio--sm {
		--ml-radio-circle-size: 1rem;
		--ml-radio-dot-size: 0.375rem;
	}

	.ml-radio--md {
		--ml-radio-circle-size: 1.25rem;
		--ml-radio-dot-size: 0.5rem;
	}

	.ml-radio--lg {
		--ml-radio-circle-size: 1.5rem;
		--ml-radio-dot-size: 0.625rem;
		--ml-radio-label-font-size: var(--ml-text-base);
		--ml-radio-label-line-height: 1.5rem;
	}

	.ml-radio__label {
		font-size: var(--ml-radio-label-font-size);
		font-weight: var(--ml-radio-label-font-weight);
		color: var(--ml-radio-label-color);
		line-height: var(--ml-radio-label-line-height);
	}

	.ml-radio__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-radio-circle-size) + var(--ml-radio-gap));
		font-size: var(--ml-radio-hint-font-size);
		color: var(--ml-radio-hint-color);
		line-height: var(--ml-leading-tight);
	}
`;
var RadioComponent = class RadioComponent$1 {
	constructor() {
		this.name = "";
		this.value = "";
		this.label = "";
		this.hint = "";
		this.size = "md";
		this.checked = false;
		this.disabled = false;
		this.handleChange = () => {
			this.checked = true;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					checked: true
				}
			}));
		};
	}
};
RadioComponent = __decorate([MelodicComponent({
	selector: "ml-radio",
	template: radioTemplate,
	styles: radioStyles,
	attributes: [
		"name",
		"value",
		"label",
		"hint",
		"size",
		"checked",
		"disabled"
	]
})], RadioComponent);
function radioGroupTemplate(c) {
	return html`
		<fieldset
			class=${classMap({
		"ml-radio-group": true,
		[`ml-radio-group--${c.orientation}`]: true,
		"ml-radio-group--disabled": c.disabled,
		"ml-radio-group--error": !!c.error
	})}
			role="radiogroup"
			aria-labelledby=${c.label ? "legend" : ""}
		>
			${when(!!c.label, () => html`
					<legend id="legend" class="ml-radio-group__legend">
						${c.label}
						${when(c.required, () => html`<span class="ml-radio-group__required">*</span>`)}
					</legend>
				`)}

			<div class="ml-radio-group__options">
				<slot></slot>
			</div>

			${when(!!c.error, () => html`<span class="ml-radio-group__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-radio-group__hint">${c.hint}</span>`)}`)}
		</fieldset>
	`;
}
const radioGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-radio-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-group__legend {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-3);
		line-height: var(--ml-leading-tight);
	}

	.ml-radio-group__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	.ml-radio-group__options {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-3);
	}

	.ml-radio-group--horizontal .ml-radio-group__options {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--ml-space-6);
	}

	.ml-radio-group--disabled {
		pointer-events: none;
	}

	.ml-radio-group--disabled .ml-radio-group__legend {
		opacity: 0.5;
	}

	.ml-radio-group__hint,
	.ml-radio-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-radio-group__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-radio-group__error {
		color: var(--ml-color-danger);
	}
`;
var RadioGroupComponent = class RadioGroupComponent$1 {
	constructor() {
		this.label = "";
		this.name = "";
		this.value = "";
		this.hint = "";
		this.error = "";
		this.orientation = "vertical";
		this.disabled = false;
		this.required = false;
		this.handleChildChange = (event) => {
			if (event.target === this.elementRef) return;
			this.value = event.detail.value;
			this.updateChildRadios();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
	onInit() {
		this.elementRef.addEventListener("ml:change", this.handleChildChange);
		this.updateChildRadios();
	}
	updateChildRadios() {
		const radios = this.elementRef.querySelectorAll("ml-radio");
		if (this.value === "") {
			for (const radio of radios) if (radio.checked === true || radio.hasAttribute("checked")) {
				this.value = radio.value ?? radio.getAttribute("value") ?? "";
				break;
			}
		}
		radios.forEach((radio) => {
			if (this.name) radio.name = this.name;
			radio.disabled = this.disabled;
			const radioValue = radio.value ?? radio.getAttribute("value") ?? "";
			radio.checked = this.value !== "" && radioValue === this.value;
		});
	}
};
RadioGroupComponent = __decorate([MelodicComponent({
	selector: "ml-radio-group",
	template: radioGroupTemplate,
	styles: radioGroupStyles,
	attributes: [
		"label",
		"name",
		"value",
		"hint",
		"error",
		"orientation",
		"disabled",
		"required"
	]
})], RadioGroupComponent);
function radioCardGroupTemplate(c) {
	return html`
		<fieldset
			class=${classMap({
		"ml-radio-card-group": true,
		"ml-radio-card-group--disabled": c.disabled,
		"ml-radio-card-group--error": !!c.error
	})}
			role="radiogroup"
			aria-labelledby=${c.label ? "legend" : ""}
		>
			${when(!!c.label, () => html`
					<legend id="legend" class="ml-radio-card-group__legend">
						${c.label}
						${when(c.required, () => html`<span class="ml-radio-card-group__required">*</span>`)}
					</legend>
				`)}

			<div class=${classMap({
		"ml-radio-card-group__options": true,
		[`ml-radio-card-group__options--${c.orientation}`]: true
	})}>
				<slot @slotchange=${c.handleSlotChange}></slot>
			</div>

			${when(!!c.error, () => html`<span class="ml-radio-card-group__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-radio-card-group__hint">${c.hint}</span>`)}`)}
		</fieldset>
	`;
}
const radioCardGroupStyles = () => css`
	:host {
		display: block;

		/* --- Legend --- */
		--ml-radio-card-group-legend-font-size: var(--ml-text-sm);
		--ml-radio-card-group-legend-font-weight: var(--ml-font-medium);
		--ml-radio-card-group-legend-color: var(--ml-color-text-secondary);
		--ml-radio-card-group-legend-line-height: var(--ml-leading-tight);
		--ml-radio-card-group-legend-margin-bottom: var(--ml-space-3);

		/* --- Required indicator --- */
		--ml-radio-card-group-required-color: var(--ml-color-danger);

		/* --- Options gap --- */
		--ml-radio-card-group-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-radio-card-group-disabled-opacity: 0.5;

		/* --- Hint / Error --- */
		--ml-radio-card-group-hint-color: var(--ml-color-text-muted);
		--ml-radio-card-group-error-color: var(--ml-color-danger);
		--ml-radio-card-group-message-font-size: var(--ml-text-sm);
		--ml-radio-card-group-message-line-height: var(--ml-leading-tight);
	}

	.ml-radio-card-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-card-group__legend {
		font-size: var(--ml-radio-card-group-legend-font-size);
		font-weight: var(--ml-radio-card-group-legend-font-weight);
		color: var(--ml-radio-card-group-legend-color);
		margin-bottom: var(--ml-radio-card-group-legend-margin-bottom);
		line-height: var(--ml-radio-card-group-legend-line-height);
	}

	.ml-radio-card-group__required {
		color: var(--ml-radio-card-group-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-radio-card-group__options {
		display: flex;
		gap: var(--ml-radio-card-group-gap);
	}

	.ml-radio-card-group__options--vertical {
		flex-direction: column;
	}

	.ml-radio-card-group__options--horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.ml-radio-card-group__options--horizontal ::slotted(ml-radio-card) {
		flex: 1 1 0%;
		min-width: 0;
	}

	.ml-radio-card-group--disabled {
		pointer-events: none;
	}

	.ml-radio-card-group--disabled .ml-radio-card-group__legend {
		opacity: var(--ml-radio-card-group-disabled-opacity);
	}

	.ml-radio-card-group__hint,
	.ml-radio-card-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-radio-card-group-message-font-size);
		line-height: var(--ml-radio-card-group-message-line-height);
	}

	.ml-radio-card-group__hint {
		color: var(--ml-radio-card-group-hint-color);
	}

	.ml-radio-card-group__error {
		color: var(--ml-radio-card-group-error-color);
	}
`;
var RadioCardGroupComponent = class RadioCardGroupComponent$1 {
	constructor() {
		this.value = "";
		this.label = "";
		this.hint = "";
		this.error = "";
		this.orientation = "vertical";
		this.disabled = false;
		this.required = false;
		this.handleSlotChange = () => {
			this.syncCards();
		};
		this._handleCardSelect = (event) => {
			event.stopPropagation();
			this.value = event.detail.value;
			this.syncCards();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
	onCreate() {
		this.elementRef.addEventListener("ml:card-select", this._handleCardSelect);
		this.syncCards();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:card-select", this._handleCardSelect);
	}
	syncCards() {
		const cards = this.elementRef.querySelectorAll("ml-radio-card");
		if (this.value === "") {
			for (const card of cards) if (card.hasAttribute("selected")) {
				this.value = card.getAttribute("value") ?? "";
				break;
			}
		}
		cards.forEach((card) => {
			const isSelected = (card.getAttribute("value") ?? "") === this.value;
			card.toggleAttribute("selected", isSelected);
			card.toggleAttribute("group-disabled", this.disabled);
		});
	}
};
RadioCardGroupComponent = __decorate([MelodicComponent({
	selector: "ml-radio-card-group",
	template: radioCardGroupTemplate,
	styles: radioCardGroupStyles,
	attributes: [
		"value",
		"label",
		"hint",
		"error",
		"orientation",
		"disabled",
		"required"
	]
})], RadioCardGroupComponent);
function radioCardTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-radio-card": true,
		"ml-radio-card--selected": c.selected,
		"ml-radio-card--disabled": c.isDisabled
	})}
			role="radio"
			aria-checked=${c.selected ? "true" : "false"}
			aria-disabled=${c.isDisabled ? "true" : "false"}
			tabindex=${c.isDisabled ? "-1" : "0"}
			@click=${c.handleClick}
			@keydown=${(e) => {
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			c.handleClick();
		}
	}}
		>
			<div class="ml-radio-card__radio">
				<span class="ml-radio-card__circle">
					<span class="ml-radio-card__dot"></span>
				</span>
			</div>

			<div class="ml-radio-card__content">
				${when(!!c.icon, () => html`
					<ml-icon icon=${c.icon} size="md" class="ml-radio-card__icon"></ml-icon>
				`)}
				<div class="ml-radio-card__text">
					${when(!!c.label, () => html`<span class="ml-radio-card__label">${c.label}</span>`)}
					${when(!!c.description, () => html`<span class="ml-radio-card__description">${c.description}</span>`)}
					<slot></slot>
				</div>
			</div>

			${when(!!c.detail, () => html`
				<span class="ml-radio-card__detail">${c.detail}</span>
			`)}
		</div>
	`;
}
const radioCardStyles = () => css`
	:host {
		display: block;

		/* --- Card --- */
		--ml-radio-card-padding: var(--ml-space-4);
		--ml-radio-card-border-width: var(--ml-border);
		--ml-radio-card-border-color: var(--ml-color-border);
		--ml-radio-card-border-radius: var(--ml-radius-lg);
		--ml-radio-card-bg: var(--ml-color-surface);
		--ml-radio-card-gap: var(--ml-space-3);

		/* --- Hover --- */
		--ml-radio-card-hover-border-color: var(--ml-color-border-strong);
		--ml-radio-card-hover-bg: var(--ml-color-surface-raised);

		/* --- Selected --- */
		--ml-radio-card-selected-border-color: var(--ml-color-primary);
		--ml-radio-card-selected-bg: var(--ml-color-primary-subtle);
		--ml-radio-card-selected-ring: 0 0 0 1px var(--ml-color-primary);
		--ml-radio-card-selected-hover-border-color: var(--ml-color-primary-hover);
		--ml-radio-card-selected-hover-ring: 0 0 0 1px var(--ml-color-primary-hover);

		/* --- Focus --- */
		--ml-radio-card-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Circle --- */
		--ml-radio-card-circle-size: 1.25rem;
		--ml-radio-card-circle-border-width: var(--ml-border);
		--ml-radio-card-circle-border-color: var(--ml-color-border-strong);
		--ml-radio-card-circle-bg: var(--ml-color-input-bg);
		--ml-radio-card-circle-border-radius: var(--ml-radius-full);

		/* --- Dot --- */
		--ml-radio-card-dot-size: 0.5rem;
		--ml-radio-card-dot-color: var(--ml-color-primary);

		/* --- Icon --- */
		--ml-radio-card-icon-color: var(--ml-color-text-muted);
		--ml-radio-card-icon-selected-color: var(--ml-color-primary);

		/* --- Label --- */
		--ml-radio-card-label-font-size: var(--ml-text-sm);
		--ml-radio-card-label-font-weight: var(--ml-font-medium);
		--ml-radio-card-label-color: var(--ml-color-text);
		--ml-radio-card-label-line-height: var(--ml-leading-tight);

		/* --- Description --- */
		--ml-radio-card-description-font-size: var(--ml-text-sm);
		--ml-radio-card-description-color: var(--ml-color-text-muted);
		--ml-radio-card-description-line-height: var(--ml-leading-normal);

		/* --- Detail --- */
		--ml-radio-card-detail-font-size: var(--ml-text-sm);
		--ml-radio-card-detail-font-weight: var(--ml-font-medium);
		--ml-radio-card-detail-color: var(--ml-color-text);
		--ml-radio-card-detail-line-height: var(--ml-leading-tight);

		/* --- Disabled --- */
		--ml-radio-card-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-radio-card-transition-duration: var(--ml-duration-150);
		--ml-radio-card-transition-easing: var(--ml-ease-in-out);
	}

	.ml-radio-card {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap);
		padding: var(--ml-radio-card-padding);
		border: var(--ml-radio-card-border-width) solid var(--ml-radio-card-border-color);
		border-radius: var(--ml-radio-card-border-radius);
		background-color: var(--ml-radio-card-bg);
		cursor: pointer;
		transition:
			border-color var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing),
			background-color var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing),
			box-shadow var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing);
	}

	.ml-radio-card:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-hover-border-color);
		background-color: var(--ml-radio-card-hover-bg);
	}

	.ml-radio-card--selected {
		border-color: var(--ml-radio-card-selected-border-color);
		background-color: var(--ml-radio-card-selected-bg);
		box-shadow: var(--ml-radio-card-selected-ring);
	}

	.ml-radio-card--selected:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-selected-hover-border-color);
		background-color: var(--ml-radio-card-selected-bg);
		box-shadow: var(--ml-radio-card-selected-hover-ring);
	}

	.ml-radio-card:focus-visible {
		outline: none;
		box-shadow: var(--ml-radio-card-focus-shadow);
	}

	.ml-radio-card--selected:focus-visible {
		box-shadow: var(--ml-radio-card-selected-ring), var(--ml-radio-card-focus-shadow);
	}

	.ml-radio-card--disabled {
		opacity: var(--ml-radio-card-disabled-opacity);
		cursor: not-allowed;
	}

	/* Radio indicator */
	.ml-radio-card__radio {
		flex-shrink: 0;
		padding-top: var(--ml-space-0-5);
	}

	.ml-radio-card__circle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-radio-card-circle-size);
		height: var(--ml-radio-card-circle-size);
		border: var(--ml-radio-card-circle-border-width) solid var(--ml-radio-card-circle-border-color);
		border-radius: var(--ml-radio-card-circle-border-radius);
		background-color: var(--ml-radio-card-circle-bg);
		transition:
			border-color var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing),
			background-color var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing);
	}

	.ml-radio-card--selected .ml-radio-card__circle {
		border-color: var(--ml-radio-card-selected-border-color);
		background-color: var(--ml-radio-card-selected-bg);
	}

	.ml-radio-card__dot {
		width: var(--ml-radio-card-dot-size);
		height: var(--ml-radio-card-dot-size);
		border-radius: var(--ml-radio-card-circle-border-radius);
		background-color: var(--ml-radio-card-dot-color);
		transform: scale(0);
		transition: transform var(--ml-radio-card-transition-duration) var(--ml-radio-card-transition-easing);
	}

	.ml-radio-card--selected .ml-radio-card__dot {
		transform: scale(1);
	}

	/* Content area */
	.ml-radio-card__content {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap);
		flex: 1;
		min-width: 0;
	}

	.ml-radio-card__icon {
		flex-shrink: 0;
		color: var(--ml-radio-card-icon-color);
	}

	.ml-radio-card--selected .ml-radio-card__icon {
		color: var(--ml-radio-card-icon-selected-color);
	}

	.ml-radio-card__text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		min-width: 0;
	}

	.ml-radio-card__label {
		font-size: var(--ml-radio-card-label-font-size);
		font-weight: var(--ml-radio-card-label-font-weight);
		color: var(--ml-radio-card-label-color);
		line-height: var(--ml-radio-card-label-line-height);
	}

	.ml-radio-card__description {
		font-size: var(--ml-radio-card-description-font-size);
		color: var(--ml-radio-card-description-color);
		line-height: var(--ml-radio-card-description-line-height);
	}

	/* Detail (e.g. price) */
	.ml-radio-card__detail {
		flex-shrink: 0;
		font-size: var(--ml-radio-card-detail-font-size);
		font-weight: var(--ml-radio-card-detail-font-weight);
		color: var(--ml-radio-card-detail-color);
		line-height: var(--ml-radio-card-detail-line-height);
		padding-top: var(--ml-space-0-5);
	}
`;
var RadioCardComponent = class RadioCardComponent$1 {
	constructor() {
		this.value = "";
		this.label = "";
		this.description = "";
		this.detail = "";
		this.icon = "";
		this.selected = false;
		this.disabled = false;
		this.groupDisabled = false;
		this.handleClick = () => {
			if (this.isDisabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:card-select", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
	get isDisabled() {
		return this.disabled || this.groupDisabled;
	}
};
RadioCardComponent = __decorate([MelodicComponent({
	selector: "ml-radio-card",
	template: radioCardTemplate,
	styles: radioCardStyles,
	attributes: [
		"value",
		"label",
		"description",
		"detail",
		"icon",
		"selected",
		"disabled",
		"group-disabled"
	]
})], RadioCardComponent);
function toggleTemplate(c) {
	return html`
		<label
			class=${classMap({
		"ml-toggle": true,
		[`ml-toggle--${c.size}`]: true,
		"ml-toggle--checked": c.checked,
		"ml-toggle--disabled": c.disabled
	})}
		>
			<input type="checkbox" class="ml-toggle__input" .checked=${c.checked} ?disabled=${c.disabled} @change=${c.handleChange} />
			<span class="ml-toggle__track">
				<span class="ml-toggle__thumb"></span>
			</span>
			${when(!!c.label, () => html`<span class="ml-toggle__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-toggle__hint">${c.hint}</span>`)}
	`;
}
const toggleStyles = () => css`
	:host {
		display: block;

		/* --- Track --- */
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-track-bg: var(--ml-color-toggle-off);
		--ml-toggle-track-hover-bg: var(--ml-color-toggle-off-hover);
		--ml-toggle-track-checked-bg: var(--ml-color-primary);
		--ml-toggle-track-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-toggle-track-border-radius: var(--ml-radius-full);

		/* --- Thumb --- */
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-bg: var(--ml-white);
		--ml-toggle-thumb-border-radius: var(--ml-radius-full);
		--ml-toggle-thumb-shadow: var(--ml-shadow-sm);
		--ml-toggle-thumb-offset: 0.125rem;
		--ml-toggle-thumb-translate: 1.25rem;

		/* --- Focus --- */
		--ml-toggle-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-toggle-label-font-size: var(--ml-text-sm);
		--ml-toggle-label-font-weight: var(--ml-font-medium);
		--ml-toggle-label-color: var(--ml-color-text-secondary);

		/* --- Hint --- */
		--ml-toggle-hint-font-size: var(--ml-text-sm);
		--ml-toggle-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-toggle-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-toggle-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-toggle-transition-duration: var(--ml-duration-200);
		--ml-toggle-transition-easing: var(--ml-ease-in-out);
	}

	.ml-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-toggle-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-toggle--disabled .ml-toggle__track,
	.ml-toggle--disabled .ml-toggle__label {
		opacity: var(--ml-toggle-disabled-opacity);
	}

	.ml-toggle__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-toggle__track {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		width: var(--ml-toggle-track-width);
		height: var(--ml-toggle-track-height);
		background-color: var(--ml-toggle-track-bg);
		border-radius: var(--ml-toggle-track-border-radius);
		transition:
			background-color var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing),
			box-shadow var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing);
	}

	.ml-toggle__input:focus-visible + .ml-toggle__track {
		box-shadow: var(--ml-toggle-focus-shadow);
	}

	.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-bg);
	}

	.ml-toggle:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-hover-bg);
	}

	.ml-toggle--checked:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-hover-bg);
	}

	.ml-toggle__thumb {
		position: absolute;
		width: var(--ml-toggle-thumb-size);
		height: var(--ml-toggle-thumb-size);
		left: var(--ml-toggle-thumb-offset);
		background-color: var(--ml-toggle-thumb-bg);
		border-radius: var(--ml-toggle-thumb-border-radius);
		box-shadow: var(--ml-toggle-thumb-shadow);
		transition: transform var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing);
	}

	/* --- Size variants --- */
	.ml-toggle--sm {
		--ml-toggle-track-width: 2.25rem;
		--ml-toggle-track-height: 1.25rem;
		--ml-toggle-thumb-size: 1rem;
		--ml-toggle-thumb-translate: 1rem;
	}

	.ml-toggle--sm.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle--md {
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-translate: 1.25rem;
	}

	.ml-toggle--md.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle--lg {
		--ml-toggle-track-width: 3rem;
		--ml-toggle-track-height: 1.75rem;
		--ml-toggle-thumb-size: 1.5rem;
		--ml-toggle-thumb-translate: 1.25rem;
		--ml-toggle-label-font-size: var(--ml-text-base);
	}

	.ml-toggle--lg.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle__label {
		font-size: var(--ml-toggle-label-font-size);
		font-weight: var(--ml-toggle-label-font-weight);
		color: var(--ml-toggle-label-color);
	}

	.ml-toggle__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(var(--ml-toggle-track-width) + var(--ml-toggle-gap));
		font-size: var(--ml-toggle-hint-font-size);
		color: var(--ml-toggle-hint-color);
		line-height: var(--ml-leading-tight);
	}
`;
var ToggleComponent = class ToggleComponent$1 {
	constructor() {
		this.label = "";
		this.hint = "";
		this.size = "md";
		this.checked = false;
		this.disabled = false;
		this.handleChange = (event) => {
			if (this.disabled) {
				event.preventDefault();
				return;
			}
			this.checked = event.target.checked;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			}));
		};
	}
};
ToggleComponent = __decorate([MelodicComponent({
	selector: "ml-toggle",
	template: toggleTemplate,
	styles: toggleStyles,
	attributes: [
		"label",
		"hint",
		"size",
		"checked",
		"disabled"
	]
})], ToggleComponent);
function selectTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-select": true,
		[`ml-select--${c.size}`]: true,
		"ml-select--open": c.isOpen,
		"ml-select--disabled": c.disabled,
		"ml-select--error": !!c.error,
		"ml-select--has-value": c.hasValue,
		"ml-select--multiple": c.multiple
	})}
		>
			${when(!!c.label, () => html`
					<label class="ml-select__label">
						${c.label}
						${when(c.required, () => html`<span class="ml-select__required">*</span>`)}
					</label>
				`)}

			<div class="ml-select__control">
				<div
					class="ml-select__trigger"
					role="combobox"
					tabindex=${c.disabled ? "-1" : "0"}
					aria-haspopup="listbox"
					aria-expanded=${c.isOpen}
					aria-labelledby=${c.label ? "label" : ""}
					@click=${c.toggle}
				>
					<span class="ml-select__value">
						${when(c.multiple, () => renderMultiValue(c), () => renderSingleValue(c))}
					</span>
					<ml-icon icon="caret-down" size="sm" format="regular" class="ml-select__chevron"></ml-icon>
				</div>

				<div
					class="ml-select__dropdown"
					role="listbox"
					popover="auto"
					aria-multiselectable=${c.multiple || false}
				>
					${c.filteredOptions.length ? repeat(c.filteredOptions, (option) => `${option.value}-${c.multiple ? c.values.includes(option.value) : c.value === option.value}`, (option, index) => renderOption(c, option, index)) : html`<div class="ml-select__empty">No results found</div>`}
				</div>
			</div>

			${when(!!c.error, () => html`<span class="ml-select__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-select__hint">${c.hint}</span>`)}`)}
		</div>
	`;
}
function renderSingleValue(c) {
	return html`
		${when(!!c.selectedOption?.icon, () => html`<ml-icon icon="${c.selectedOption?.icon ?? ""}" size="sm" class="ml-select__value-icon"></ml-icon>`)}
		${c.displayText ? html`<span class="ml-select__value-text">${c.displayText}</span>` : html`<span class="ml-select__placeholder">${c.placeholder}</span>`}
	`;
}
function renderMultiValue(c) {
	return html`
		<ml-icon icon="magnifying-glass" size="sm" format="regular" class="ml-select__search-icon"></ml-icon>
		<span class="ml-select__tags">
			${repeat(c.selectedOptions, (option) => option.value, (option) => html`
					<span class="ml-select__tag">
						${option.avatarUrl ? html`<img class="ml-select__tag-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />` : html``}
						<span class="ml-select__tag-label">${option.label}</span>
						<button type="button" class="ml-select__tag-remove" aria-label="Remove ${option.label}" @click=${(event) => c.handleTagRemove(event, option.value)}>
							<ml-icon icon="x" size="sm" format="bold"></ml-icon>
						</button>
					</span>
				`)}
		</span>
		<input
			class="ml-select__search"
			type="text"
			placeholder=${c.values.length ? "" : c.placeholder}
			aria-label=${c.placeholder || "Search"}
			.value=${c.search}
			@input=${c.handleSearchInput}
			@click=${c.handleSearchClick}
		/>
	`;
}
function renderOption(c, option, index) {
	const isSelected = c.multiple ? c.values.includes(option.value) : c.value === option.value;
	const isFocused = c.focusedIndex === index;
	return html`
		<div
			class=${classMap({
		"ml-select__option": true,
		"ml-select__option--selected": isSelected,
		"ml-select__option--focused": isFocused,
		"ml-select__option--disabled": !!option.disabled
	})}
			role="option"
			aria-selected=${isSelected}
			aria-disabled=${option.disabled || false}
			@click=${(e) => c.handleOptionClick(e, option)}
		>
			${when(!!option.avatarUrl, () => html`<img class="ml-select__option-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />`)}
			${when(!option.avatarUrl && !!option.icon, () => html`<ml-icon icon="${option.icon}" size="sm" class="ml-select__option-icon"></ml-icon>`)}
			<span class="ml-select__option-label">${option.label}</span>
			${when(isSelected, () => html`<ml-icon icon="check" size="sm" format="regular" class="ml-select__option-check"></ml-icon>`)}
		</div>
	`;
}
const selectStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;

		/* --- Label --- */
		--ml-select-label-font-size: var(--ml-text-sm);
		--ml-select-label-font-weight: var(--ml-font-medium);
		--ml-select-label-color: var(--ml-color-text-secondary);
		--ml-select-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-select-required-color: var(--ml-color-danger);

		/* --- Trigger --- */
		--ml-select-bg: var(--ml-color-input-bg);
		--ml-select-border-width: var(--ml-border);
		--ml-select-border-color: var(--ml-color-border);
		--ml-select-border-radius: var(--ml-radius);
		--ml-select-color: var(--ml-color-text);
		--ml-select-font-family: var(--ml-font-sans);
		--ml-select-font-size: var(--ml-text-sm);
		--ml-select-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-select-gap: var(--ml-space-2);
		--ml-select-hover-border-color: var(--ml-color-border-strong);

		/* --- Focus --- */
		--ml-select-focus-border-color: var(--ml-color-primary);
		--ml-select-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-select-focus-inset-shadow: none;

		/* --- Error --- */
		--ml-select-error-border-color: var(--ml-color-danger);
		--ml-select-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-select-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-select-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-select-disabled-color: var(--ml-color-text-muted);

		/* --- Placeholder --- */
		--ml-select-placeholder-color: var(--ml-color-text-muted);

		/* --- Chevron / Icons --- */
		--ml-select-icon-color: var(--ml-color-text-muted);

		/* --- Dropdown --- */
		--ml-select-dropdown-bg: var(--ml-color-surface);
		--ml-select-dropdown-border-color: var(--ml-color-border);
		--ml-select-dropdown-border-radius: var(--ml-radius);
		--ml-select-dropdown-shadow: var(--ml-shadow-lg);
		--ml-select-dropdown-max-height: 280px;
		--ml-select-dropdown-padding: var(--ml-space-1-5);

		/* --- Option --- */
		--ml-select-option-padding: var(--ml-space-2) var(--ml-space-3);
		--ml-select-option-border-radius: var(--ml-radius-sm);
		--ml-select-option-font-size: var(--ml-text-sm);
		--ml-select-option-font-weight: var(--ml-font-medium);
		--ml-select-option-color: var(--ml-color-text);
		--ml-select-option-hover-bg: var(--ml-color-surface-raised);
		--ml-select-option-selected-bg: var(--ml-color-primary-subtle);
		--ml-select-option-disabled-color: var(--ml-color-text-muted);
		--ml-select-option-check-color: var(--ml-color-primary);

		/* --- Tag (multi-select) --- */
		--ml-select-tag-height: 20px;
		--ml-select-tag-border-radius: var(--ml-radius-full);
		--ml-select-tag-border-color: var(--ml-color-border);
		--ml-select-tag-bg: var(--ml-color-surface);
		--ml-select-tag-font-size: var(--ml-text-xs);
		--ml-select-tag-font-weight: var(--ml-font-medium);
		--ml-select-tag-color: var(--ml-color-text);
		--ml-select-tag-remove-color: var(--ml-color-text-secondary);
		--ml-select-tag-remove-hover-color: var(--ml-color-text);
		--ml-select-tag-remove-hover-bg: var(--ml-color-surface-raised);

		/* --- Hint --- */
		--ml-select-hint-color: var(--ml-color-text-muted);
		--ml-select-hint-font-size: var(--ml-text-sm);

		/* --- Transition --- */
		--ml-select-transition-duration: var(--ml-duration-150);
		--ml-select-transition-easing: var(--ml-ease-in-out);
	}

	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	.ml-select {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
		max-width: 100%;
	}

	.ml-select__control {
		position: relative;
		max-width: 100%;
	}

	.ml-select__label {
		font-size: var(--ml-select-label-font-size);
		font-weight: var(--ml-select-label-font-weight);
		color: var(--ml-select-label-color);
		line-height: var(--ml-select-label-line-height);
	}

	.ml-select__required {
		color: var(--ml-select-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-select__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-select-gap);
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		padding: var(--ml-select-padding);
		background-color: var(--ml-select-bg);
		border: var(--ml-select-border-width) solid var(--ml-select-border-color);
		border-radius: var(--ml-select-border-radius);
		box-shadow: none;
		color: var(--ml-select-color);
		font-family: var(--ml-select-font-family);
		font-size: var(--ml-select-font-size);
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--ml-select-transition-duration) var(--ml-select-transition-easing),
			box-shadow var(--ml-select-transition-duration) var(--ml-select-transition-easing);
	}

	.ml-select:not(.ml-select--disabled) .ml-select__trigger:hover {
		border-color: var(--ml-select-hover-border-color);
	}

	.ml-select__trigger:focus,
	.ml-select__trigger:focus-within {
		outline: none;
		border-color: var(--ml-select-focus-border-color);
		box-shadow: var(--ml-select-focus-shadow), var(--ml-select-focus-inset-shadow);
	}

	.ml-select--disabled .ml-select__trigger {
		background-color: var(--ml-select-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-select-disabled-color);
	}

	.ml-select--disabled .ml-select__search {
		color: var(--ml-select-disabled-color);
	}

	.ml-select__value {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select--multiple .ml-select__value {
		flex-wrap: wrap;
		white-space: normal;
		gap: var(--ml-space-1-5);
	}

	.ml-select__value-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select__search-icon {
		color: var(--ml-select-icon-color);
		flex-shrink: 0;
		height: 20px;
		display: flex;
		align-items: center;
	}

	.ml-select__search {
		flex: 1 1 20px;
		min-width: 20px;
		height: 20px;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: var(--ml-select-color);
		padding: 0;
		line-height: 20px;
	}

	.ml-select__search::placeholder {
		color: var(--ml-select-placeholder-color);
	}

	.ml-select__placeholder {
		color: var(--ml-select-placeholder-color);
	}

	.ml-select__value-icon {
		color: var(--ml-select-icon-color);
		flex-shrink: 0;
	}

	.ml-select__tags {
		display: contents;
	}

	.ml-select__tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		padding: 0 var(--ml-space-1-5);
		height: var(--ml-select-tag-height);
		border-radius: var(--ml-select-tag-border-radius);
		border: var(--ml-select-border-width) solid var(--ml-select-tag-border-color);
		background-color: var(--ml-select-tag-bg);
		font-size: var(--ml-select-tag-font-size);
		font-weight: var(--ml-select-tag-font-weight);
		color: var(--ml-select-tag-color);
		line-height: 1;
		white-space: nowrap;
		max-width: 100%;
		overflow: hidden;
		box-sizing: border-box;
	}

	.ml-select__tag-label {
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: inherit;
	}

	.ml-select__tag-avatar {
		width: 14px;
		height: 14px;
		border-radius: var(--ml-select-tag-border-radius);
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-select__tag-remove {
		border: none;
		background: transparent;
		padding: 2px;
		margin-left: var(--ml-space-0-5);
		margin-right: -4px;
		color: var(--ml-select-tag-remove-color);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-select-tag-border-radius);
		transition: color var(--ml-duration-100) var(--ml-select-transition-easing),
			background-color var(--ml-duration-100) var(--ml-select-transition-easing);
	}

	.ml-select__tag-remove:hover {
		color: var(--ml-select-tag-remove-hover-color);
		background-color: var(--ml-select-tag-remove-hover-bg);
	}

	.ml-select__chevron {
		flex-shrink: 0;
		color: var(--ml-select-icon-color);
		transition: transform var(--ml-duration-200) var(--ml-select-transition-easing);
	}

	.ml-select--open .ml-select__chevron {
		transform: rotate(180deg);
	}

	.ml-select--multiple .ml-select__trigger {
		align-items: center;
		padding-top: var(--ml-space-2);
		padding-bottom: var(--ml-space-2);
	}

	.ml-select__dropdown {
		position: fixed;
		inset: unset;
		margin: 0;
		z-index: 50;
		background-color: var(--ml-select-dropdown-bg);
		border: var(--ml-select-border-width) solid var(--ml-select-dropdown-border-color);
		border-radius: var(--ml-select-dropdown-border-radius);
		box-shadow: var(--ml-select-dropdown-shadow);
		max-height: var(--ml-select-dropdown-max-height);
		overflow-y: auto;
		padding: var(--ml-select-dropdown-padding);
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-select__dropdown:not(:popover-open) {
		display: none;
	}

	.ml-select__empty {
		padding: var(--ml-select-option-padding);
		font-size: var(--ml-select-option-font-size);
		color: var(--ml-select-placeholder-color);
	}

	.ml-select__option {
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap);
		padding: var(--ml-select-option-padding);
		border-radius: var(--ml-select-option-border-radius);
		cursor: pointer;
		font-size: var(--ml-select-option-font-size);
		font-weight: var(--ml-select-option-font-weight);
		color: var(--ml-select-option-color);
		transition: background-color var(--ml-duration-100) var(--ml-select-transition-easing);
	}

	.ml-select__option:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-hover-bg);
	}

	.ml-select__option--focused {
		background-color: var(--ml-select-option-hover-bg);
	}

	.ml-select__option--selected {
		background-color: var(--ml-select-option-selected-bg);
	}

	.ml-select__option--selected:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-selected-bg);
	}

	.ml-select__option--disabled {
		color: var(--ml-select-option-disabled-color);
		cursor: not-allowed;
	}

	.ml-select__option-icon {
		flex-shrink: 0;
		color: var(--ml-select-icon-color);
	}

	.ml-select__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-select__option--selected .ml-select__option-icon {
		color: var(--ml-select-option-check-color);
	}

	.ml-select__option-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select__option-check {
		flex-shrink: 0;
		color: var(--ml-select-option-check-color);
		margin-left: auto;
	}

	.ml-select__hint,
	.ml-select__error {
		font-size: var(--ml-select-hint-font-size);
		line-height: var(--ml-select-label-line-height);
	}

	.ml-select__hint {
		color: var(--ml-select-hint-color);
	}

	.ml-select__error {
		color: var(--ml-select-error-color);
	}

	.ml-select--error .ml-select__trigger {
		border-color: var(--ml-select-error-border-color);
	}

	.ml-select--error .ml-select__trigger:focus {
		box-shadow: var(--ml-select-error-focus-shadow);
	}

	/* Size variants */
	.ml-select--sm .ml-select__trigger {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-select--md .ml-select__trigger {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-select--lg .ml-select__trigger {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Disabled state */
	.ml-select--disabled {
		pointer-events: none;
	}
`;
var SelectComponent = class SelectComponent$1 {
	constructor() {
		this.label = "";
		this.placeholder = "Select an option";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.disabled = false;
		this.required = false;
		this.multiple = false;
		this.value = "";
		this.values = [];
		this.options = [];
		this.search = "";
		this.isOpen = false;
		this.focusedIndex = -1;
		this._handleKeyDown = this.onKeyDown.bind(this);
		this._handlePopoverToggle = this.onPopoverToggle.bind(this);
		this._handleScroll = null;
		this._lastCloseTime = 0;
		this._syncingValues = false;
		this.toggle = () => {
			if (this.disabled) return;
			if (this.multiple) {
				if (!this.isOpen) this.open();
				return;
			}
			if (this.isOpen) this.close();
			else if (Date.now() - this._lastCloseTime > 150) this.open();
		};
		this.open = () => {
			if (this.disabled || this.isOpen) return;
			this.getDropdownEl()?.showPopover();
		};
		this.close = () => {
			if (!this.isOpen) return;
			this.getDropdownEl()?.hidePopover();
		};
		this.selectOption = (option) => {
			if (option.disabled) return;
			if (this.multiple) {
				this.toggleOption(option);
				return;
			}
			this.value = option.value;
			this.close();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					option
				}
			}));
		};
		this.handleOptionClick = (event, option) => {
			event.stopPropagation();
			this.selectOption(option);
		};
		this.handleTagRemove = (event, value) => {
			event.stopPropagation();
			if (this.disabled) return;
			this.values = this.values.filter((item) => item !== value);
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: {
					values: [...this.values],
					options: this.selectedOptions
				}
			}));
		};
		this.handleSearchInput = (event) => {
			if (this.disabled) return;
			this.search = event.target.value;
			this.focusedIndex = this.findFirstEnabledIndex();
			if (!this.isOpen) this.open();
		};
		this.handleSearchClick = (event) => {
			event.stopPropagation();
			if (!this.isOpen) this.open();
		};
	}
	onCreate() {
		this.elementRef.addEventListener("keydown", this._handleKeyDown);
		this.getDropdownEl()?.addEventListener("toggle", this._handlePopoverToggle);
	}
	onDestroy() {
		this.elementRef.removeEventListener("keydown", this._handleKeyDown);
		this.removeScrollListener();
		this.getDropdownEl()?.removeEventListener("toggle", this._handlePopoverToggle);
	}
	onPropertyChange(name) {
		if (this._syncingValues) return;
		if (name === "multiple") {
			if (this.multiple) {
				if (!this.values.length && this.value) this.updateValues([this.value]);
				return;
			}
			if (this.values.length) this.value = this.values[0] ?? "";
			this.updateValues([]);
			this.search = "";
			return;
		}
		if (name === "values") {
			const rawValues = this.values;
			let normalized = [];
			if (typeof rawValues === "string") normalized = rawValues.split(",").map((value) => value.trim()).filter((value) => value.length > 0);
			else if (Array.isArray(rawValues)) normalized = rawValues.filter((value) => typeof value === "string");
			normalized = Array.from(new Set(normalized));
			if (!this.areValuesEqual(this.values, normalized)) this.updateValues(normalized);
			if (!this.multiple) {
				this.value = normalized[0] ?? "";
				this.updateValues([]);
			}
			return;
		}
		if (name === "value" && this.multiple) {
			if (this.value) {
				const nextValues = Array.from(new Set([...this.values, this.value]));
				if (!this.areValuesEqual(this.values, nextValues)) this.updateValues(nextValues);
			}
		}
	}
	get selectedOption() {
		return this.options.find((opt) => opt.value === this.value);
	}
	get selectedOptions() {
		if (!this.multiple) return this.selectedOption ? [this.selectedOption] : [];
		return this.options.filter((opt) => this.values.includes(opt.value));
	}
	get displayText() {
		if (this.multiple) return this.selectedOptions.map((option) => option.label).join(", ");
		return this.selectedOption?.label || "";
	}
	get filteredOptions() {
		const query = this.search.trim().toLowerCase();
		if (!query) return this.options;
		return this.options.filter((option) => {
			const labelMatch = option.label.toLowerCase().includes(query);
			const valueMatch = option.value.toLowerCase().includes(query);
			return labelMatch || valueMatch;
		});
	}
	get hasValue() {
		return this.multiple ? this.values.length > 0 : !!this.value;
	}
	toggleOption(option) {
		this.values = this.values.includes(option.value) ? this.values.filter((value) => value !== option.value) : [...this.values, option.value];
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: {
				values: [...this.values],
				options: this.selectedOptions,
				option
			}
		}));
	}
	onPopoverToggle(event) {
		if (event.newState === "open") {
			this.isOpen = true;
			this.focusedIndex = this.getInitialFocusIndex();
			this.positionDropdown();
			this.addScrollListener();
			this.elementRef.dispatchEvent(new CustomEvent("ml:open", {
				bubbles: true,
				composed: true
			}));
		} else {
			this.isOpen = false;
			this.focusedIndex = -1;
			this.search = "";
			this._lastCloseTime = Date.now();
			this.removeScrollListener();
			this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
				bubbles: true,
				composed: true
			}));
		}
	}
	positionDropdown() {
		const triggerEl = this.elementRef.shadowRoot?.querySelector(".ml-select__trigger");
		const dropdownEl = this.getDropdownEl();
		if (!triggerEl || !dropdownEl) return;
		dropdownEl.style.width = `${triggerEl.offsetWidth}px`;
		const { x, y } = computePosition(triggerEl, dropdownEl, {
			placement: "bottom-start",
			middleware: [
				offset(4),
				flip(),
				shift({ padding: 8 })
			]
		});
		dropdownEl.style.left = `${x}px`;
		dropdownEl.style.top = `${y}px`;
	}
	addScrollListener() {
		this._handleScroll = (event) => {
			if (this.getDropdownEl()?.contains(event.target)) return;
			this.close();
		};
		window.addEventListener("scroll", this._handleScroll, true);
	}
	removeScrollListener() {
		if (this._handleScroll) {
			window.removeEventListener("scroll", this._handleScroll, true);
			this._handleScroll = null;
		}
	}
	getDropdownEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-select__dropdown");
	}
	onKeyDown(event) {
		if (this.disabled) return;
		const isSearchInput = event.target?.classList?.contains("ml-select__search") ?? false;
		switch (event.key) {
			case "Enter":
			case " ":
				if (isSearchInput) return;
				event.preventDefault();
				if (this.isOpen && this.focusedIndex >= 0) {
					const option = this.getActiveOptions()[this.focusedIndex];
					if (option && !option.disabled) this.selectOption(option);
				} else this.toggle();
				break;
			case "Escape":
				event.preventDefault();
				this.close();
				break;
			case "ArrowDown":
				event.preventDefault();
				if (!this.isOpen) this.open();
				else this.focusNextOption();
				break;
			case "ArrowUp":
				event.preventDefault();
				if (this.isOpen) this.focusPreviousOption();
				break;
			case "Home":
				event.preventDefault();
				if (this.isOpen) this.focusedIndex = this.findFirstEnabledIndex();
				break;
			case "End":
				event.preventDefault();
				if (this.isOpen) this.focusedIndex = this.findLastEnabledIndex();
				break;
			case "Tab":
				this.close();
				break;
			default: break;
		}
	}
	focusNextOption() {
		let index = this.focusedIndex + 1;
		const options = this.getActiveOptions();
		while (index < options.length) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index++;
		}
	}
	focusPreviousOption() {
		let index = this.focusedIndex - 1;
		const options = this.getActiveOptions();
		while (index >= 0) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index--;
		}
	}
	findFirstEnabledIndex() {
		return this.getActiveOptions().findIndex((opt) => !opt.disabled);
	}
	findLastEnabledIndex() {
		const options = this.getActiveOptions();
		for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) return i;
		return -1;
	}
	getInitialFocusIndex() {
		const options = this.getActiveOptions();
		if (this.multiple && this.values.length > 0) {
			const selectedIndex = options.findIndex((opt) => this.values.includes(opt.value) && !opt.disabled);
			if (selectedIndex >= 0) return selectedIndex;
		}
		if (!this.multiple && this.value) {
			const selectedIndex = options.findIndex((opt) => opt.value === this.value && !opt.disabled);
			if (selectedIndex >= 0) return selectedIndex;
		}
		return this.findFirstEnabledIndex();
	}
	getActiveOptions() {
		return this.filteredOptions;
	}
	updateValues(values) {
		this._syncingValues = true;
		this.values = values;
		this._syncingValues = false;
	}
	areValuesEqual(left, right) {
		if (left.length !== right.length) return false;
		for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
		return true;
	}
};
SelectComponent = __decorate([MelodicComponent({
	selector: "ml-select",
	template: selectTemplate,
	styles: selectStyles,
	attributes: [
		"label",
		"placeholder",
		"hint",
		"error",
		"size",
		"disabled",
		"required",
		"value",
		"multiple"
	]
})], SelectComponent);
function sliderTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-slider": true,
		[`ml-slider--${c.size}`]: true,
		"ml-slider--disabled": c.disabled,
		"ml-slider--error": !!c.error
	})}
		>
			${when(!!c.label || c.showValue, () => html`
					<div class="ml-slider__header">
						${when(!!c.label, () => html`<label class="ml-slider__label">${c.label}</label>`)}
						${when(c.showValue, () => html`<span class="ml-slider__value">${c.value}</span>`)}
					</div>
				`)}

			<div class="ml-slider__track-wrapper">
				<div class="ml-slider__track">
					<div class="ml-slider__fill" style=${styleMap({ width: c.fillWidth })}></div>
				</div>
				<input
					class="ml-slider__input"
					type="range"
					.value=${String(c.value)}
					min=${c.min}
					max=${c.max}
					step=${c.step}
					disabled=${c.disabled}
					aria-label=${c.label || "Slider"}
					@input=${c.handleInput}
					@change=${c.handleChange}
				/>
			</div>

			${when(!!c.error, () => html`<span class="ml-slider__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-slider__hint">${c.hint}</span>`)}`)}
		</div>
	`;
}
const sliderStyles = () => css`
	:host {
		display: block;

		/* --- Label / Value --- */
		--ml-slider-label-font-size: var(--ml-text-sm);
		--ml-slider-label-font-weight: var(--ml-font-medium);
		--ml-slider-label-color: var(--ml-color-text);

		/* --- Track --- */
		--ml-slider-track-height: 6px;
		--ml-slider-track-bg: var(--ml-color-surface-hover);
		--ml-slider-track-border-radius: var(--ml-radius-full);

		/* --- Fill --- */
		--ml-slider-fill-color: var(--ml-color-primary);

		/* --- Thumb --- */
		--ml-slider-thumb-size: 20px;
		--ml-slider-thumb-bg: var(--ml-color-surface);
		--ml-slider-thumb-border-width: 2px;
		--ml-slider-thumb-border-color: var(--ml-color-primary);
		--ml-slider-thumb-border-radius: var(--ml-radius-full);
		--ml-slider-thumb-shadow: var(--ml-shadow-sm);
		--ml-slider-thumb-hover-shadow: var(--ml-shadow-md);
		--ml-slider-thumb-focus-shadow: 0 0 0 3px var(--ml-color-primary-subtle);

		/* --- Error --- */
		--ml-slider-error-fill-color: var(--ml-color-danger);
		--ml-slider-error-thumb-border-color: var(--ml-color-danger);
		--ml-slider-error-color: var(--ml-color-danger);

		/* --- Hint --- */
		--ml-slider-hint-font-size: var(--ml-text-sm);
		--ml-slider-hint-color: var(--ml-color-text-tertiary);

		/* --- Disabled --- */
		--ml-slider-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-slider-transition-duration: var(--ml-duration-150);
		--ml-slider-transition-easing: var(--ml-ease-in-out);
	}

	.ml-slider__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-slider__label {
		font-size: var(--ml-slider-label-font-size);
		font-weight: var(--ml-slider-label-font-weight);
		color: var(--ml-slider-label-color);
	}

	.ml-slider__value {
		font-size: var(--ml-slider-label-font-size);
		font-weight: var(--ml-slider-label-font-weight);
		color: var(--ml-slider-label-color);
	}

	.ml-slider__track-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.ml-slider__track {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	.ml-slider__track::before {
		content: '';
		position: absolute;
		width: 100%;
		height: var(--ml-slider-track-height);
		background-color: var(--ml-slider-track-bg);
		border-radius: var(--ml-slider-track-border-radius);
	}

	.ml-slider--sm .ml-slider__track::before {
		height: 4px;
	}

	.ml-slider--md .ml-slider__track::before {
		height: 6px;
	}

	.ml-slider--lg .ml-slider__track::before {
		height: 8px;
	}

	.ml-slider__fill {
		position: absolute;
		left: 0;
		height: var(--ml-slider-track-height);
		background-color: var(--ml-slider-fill-color);
		border-radius: var(--ml-slider-track-border-radius);
		pointer-events: none;
	}

	.ml-slider--sm .ml-slider__fill {
		height: 4px;
	}

	.ml-slider--md .ml-slider__fill {
		height: 6px;
	}

	.ml-slider--lg .ml-slider__fill {
		height: 8px;
	}

	.ml-slider--error .ml-slider__fill {
		background-color: var(--ml-slider-error-fill-color);
	}

	/* Native range input - overlays the track */
	.ml-slider__input {
		width: 100%;
		margin: 0;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.ml-slider__input:disabled {
		cursor: not-allowed;
		opacity: var(--ml-slider-disabled-opacity);
	}

	/* Webkit thumb */
	.ml-slider__input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: var(--ml-slider-thumb-size);
		height: var(--ml-slider-thumb-size);
		border-radius: var(--ml-slider-thumb-border-radius);
		background-color: var(--ml-slider-thumb-bg);
		border: var(--ml-slider-thumb-border-width) solid var(--ml-slider-thumb-border-color);
		box-shadow: var(--ml-slider-thumb-shadow);
		transition:
			box-shadow var(--ml-slider-transition-duration) var(--ml-slider-transition-easing),
			transform var(--ml-slider-transition-duration) var(--ml-slider-transition-easing);
	}

	.ml-slider__input:hover::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-hover-shadow);
		transform: scale(1.1);
	}

	.ml-slider__input:focus-visible::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-focus-shadow);
	}

	.ml-slider--error .ml-slider__input::-webkit-slider-thumb {
		border-color: var(--ml-slider-error-thumb-border-color);
	}

	/* Firefox thumb */
	.ml-slider__input::-moz-range-thumb {
		width: var(--ml-slider-thumb-size);
		height: var(--ml-slider-thumb-size);
		border-radius: var(--ml-slider-thumb-border-radius);
		background-color: var(--ml-slider-thumb-bg);
		border: var(--ml-slider-thumb-border-width) solid var(--ml-slider-thumb-border-color);
		box-shadow: var(--ml-slider-thumb-shadow);
	}

	.ml-slider--error .ml-slider__input::-moz-range-thumb {
		border-color: var(--ml-slider-error-thumb-border-color);
	}

	/* Hide browser track (we use custom track) */
	.ml-slider__input::-webkit-slider-runnable-track {
		height: var(--ml-slider-thumb-size);
		background: transparent;
	}

	.ml-slider__input::-moz-range-track {
		height: var(--ml-slider-thumb-size);
		background: transparent;
		border: none;
	}

	.ml-slider__hint {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size);
		color: var(--ml-slider-hint-color);
	}

	.ml-slider__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size);
		color: var(--ml-slider-error-color);
	}
`;
var SliderComponent = class SliderComponent$1 {
	constructor() {
		this.label = "";
		this.value = 50;
		this.min = 0;
		this.max = 100;
		this.step = 1;
		this.size = "md";
		this.disabled = false;
		this.showValue = false;
		this.hint = "";
		this.error = "";
		this.handleInput = (event) => {
			const target = event.target;
			this.value = Number(target.value);
			this.elementRef.dispatchEvent(new CustomEvent("ml:input", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleChange = (event) => {
			const target = event.target;
			this.value = Number(target.value);
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
	get ratio() {
		const range = this.max - this.min;
		if (range <= 0) return 0;
		return (this.value - this.min) / range;
	}
	get fillWidth() {
		const p = this.ratio;
		return `calc(${p * 100}% + ${10 - p * 20}px)`;
	}
};
SliderComponent = __decorate([MelodicComponent({
	selector: "ml-slider",
	template: sliderTemplate,
	styles: sliderStyles,
	attributes: [
		"label",
		"value",
		"min",
		"max",
		"step",
		"size",
		"disabled",
		"show-value",
		"hint",
		"error"
	]
})], SliderComponent);
function formFieldTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-form-field": true,
		[`ml-form-field--${c.size}`]: true,
		[`ml-form-field--${c.orientation}`]: true,
		"ml-form-field--disabled": c.disabled,
		"ml-form-field--error": !!c.error
	})}
		>
			${when(!!c.label, () => html`
					<label class="ml-form-field__label" for=${c.fieldId}>
						${c.label}
						${when(c.required, () => html`<span class="ml-form-field__required">*</span>`)}
					</label>
				`)}

			<div class="ml-form-field__control">
				<slot @slotchange=${c.handleSlotChange}></slot>
			</div>

			${when(!!c.error, () => html`<span id=${c.errorId} class="ml-form-field__error">${c.error}</span>`)}
			${when(!c.error && !!c.hint, () => html`<span id=${c.hintId} class="ml-form-field__hint">${c.hint}</span>`)}
		</div>
	`;
}
const formFieldStyles = () => css`
	:host {
		display: block;
		width: 100%;

		/* --- Label --- */
		--ml-form-field-label-font-size: var(--ml-text-sm);
		--ml-form-field-label-font-weight: var(--ml-font-medium);
		--ml-form-field-label-color: var(--ml-color-text-secondary);
		--ml-form-field-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-form-field-required-color: var(--ml-color-danger);

		/* --- Hint / Error --- */
		--ml-form-field-hint-font-size: var(--ml-text-sm);
		--ml-form-field-hint-color: var(--ml-color-text-muted);
		--ml-form-field-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-form-field-disabled-label-color: var(--ml-color-text-muted);

		/* --- Slotted input --- */
		--ml-form-field-input-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-form-field-input-font-size: var(--ml-text-sm);
		--ml-form-field-input-font-family: var(--ml-font-sans);
		--ml-form-field-input-color: var(--ml-color-text);
		--ml-form-field-input-bg: var(--ml-color-input-bg);
		--ml-form-field-input-border-width: var(--ml-border);
		--ml-form-field-input-border-color: var(--ml-color-border-strong);
		--ml-form-field-input-border-radius: var(--ml-radius);
		--ml-form-field-input-shadow: var(--ml-shadow-xs);
		--ml-form-field-input-focus-border-color: var(--ml-color-primary);
		--ml-form-field-input-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-form-field-input-placeholder-color: var(--ml-color-text-muted);
		--ml-form-field-input-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-form-field-input-disabled-color: var(--ml-color-text-muted);
		--ml-form-field-input-error-border-color: var(--ml-color-danger);
		--ml-form-field-input-error-focus-shadow: var(--ml-shadow-ring-error);

		/* --- Horizontal layout --- */
		--ml-form-field-horizontal-gap: var(--ml-space-4);
		--ml-form-field-horizontal-label-padding-top: var(--ml-space-2-5);

		/* --- Transition --- */
		--ml-form-field-transition-duration: var(--ml-duration-150);
		--ml-form-field-transition-easing: var(--ml-ease-in-out);
	}

	.ml-form-field {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	/* Horizontal orientation */
	.ml-form-field--horizontal {
		display: grid;
		grid-template-columns: minmax(100px, auto) 1fr;
		grid-template-rows: auto auto;
		gap: var(--ml-space-1-5) var(--ml-form-field-horizontal-gap);
		align-items: start;
	}

	.ml-form-field--horizontal .ml-form-field__label {
		grid-column: 1;
		grid-row: 1;
		padding-top: var(--ml-form-field-horizontal-label-padding-top);
		text-align: right;
	}

	.ml-form-field--horizontal .ml-form-field__control {
		grid-column: 2;
		grid-row: 1;
	}

	.ml-form-field--horizontal .ml-form-field__hint,
	.ml-form-field--horizontal .ml-form-field__error {
		grid-column: 2;
		grid-row: 2;
	}

	/* Label */
	.ml-form-field__label {
		font-size: var(--ml-form-field-label-font-size);
		font-weight: var(--ml-form-field-label-font-weight);
		color: var(--ml-form-field-label-color);
		line-height: var(--ml-form-field-label-line-height);
	}

	.ml-form-field__required {
		color: var(--ml-form-field-required-color);
		margin-left: var(--ml-space-0-5);
	}

	/* Control wrapper */
	.ml-form-field__control {
		display: flex;
		flex-direction: column;
	}

	/* Hint and error messages */
	.ml-form-field__hint,
	.ml-form-field__error {
		font-size: var(--ml-form-field-hint-font-size);
		line-height: var(--ml-form-field-label-line-height);
	}

	.ml-form-field__hint {
		color: var(--ml-form-field-hint-color);
	}

	.ml-form-field__error {
		color: var(--ml-form-field-error-color);
	}

	/* Disabled state */
	.ml-form-field--disabled .ml-form-field__label {
		color: var(--ml-form-field-disabled-label-color);
	}

	/* Size variants - Labels */
	.ml-form-field--sm .ml-form-field__label {
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--sm .ml-form-field__hint,
	.ml-form-field--sm .ml-form-field__error {
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--lg .ml-form-field__label {
		font-size: var(--ml-text-base);
	}

	.ml-form-field--lg .ml-form-field__hint,
	.ml-form-field--lg .ml-form-field__error {
		font-size: var(--ml-text-base);
	}

	/* Slotted native input styling */
	::slotted(input),
	::slotted(select),
	::slotted(textarea) {
		width: 100%;
		padding: var(--ml-form-field-input-padding);
		font-size: var(--ml-form-field-input-font-size);
		font-family: var(--ml-form-field-input-font-family);
		color: var(--ml-form-field-input-color);
		background-color: var(--ml-form-field-input-bg);
		border: var(--ml-form-field-input-border-width) solid var(--ml-form-field-input-border-color);
		border-radius: var(--ml-form-field-input-border-radius);
		box-shadow: var(--ml-form-field-input-shadow);
		box-sizing: border-box;
		transition:
			border-color var(--ml-form-field-transition-duration) var(--ml-form-field-transition-easing),
			box-shadow var(--ml-form-field-transition-duration) var(--ml-form-field-transition-easing);
	}

	::slotted(input:focus),
	::slotted(select:focus),
	::slotted(textarea:focus) {
		outline: none;
		border-color: var(--ml-form-field-input-focus-border-color);
		box-shadow: var(--ml-form-field-input-focus-shadow);
	}

	::slotted(input::placeholder),
	::slotted(textarea::placeholder) {
		color: var(--ml-form-field-input-placeholder-color);
	}

	::slotted(input:disabled),
	::slotted(select:disabled),
	::slotted(textarea:disabled) {
		background-color: var(--ml-form-field-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-form-field-input-disabled-color);
	}

	/* Error state for slotted inputs */
	.ml-form-field--error ::slotted(input),
	.ml-form-field--error ::slotted(select),
	.ml-form-field--error ::slotted(textarea) {
		border-color: var(--ml-form-field-input-error-border-color);
	}

	.ml-form-field--error ::slotted(input:focus),
	.ml-form-field--error ::slotted(select:focus),
	.ml-form-field--error ::slotted(textarea:focus) {
		box-shadow: var(--ml-form-field-input-error-focus-shadow);
	}

	/* Size variants for slotted inputs */
	.ml-form-field--sm ::slotted(input),
	.ml-form-field--sm ::slotted(select),
	.ml-form-field--sm ::slotted(textarea) {
		padding: var(--ml-space-1-5) var(--ml-space-2-5);
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--lg ::slotted(input),
	.ml-form-field--lg ::slotted(select),
	.ml-form-field--lg ::slotted(textarea) {
		padding: var(--ml-space-3-5) var(--ml-space-4);
		font-size: var(--ml-text-base);
	}

	/* Horizontal size adjustments */
	.ml-form-field--horizontal.ml-form-field--sm .ml-form-field__label {
		padding-top: var(--ml-space-2);
	}

	.ml-form-field--horizontal.ml-form-field--lg .ml-form-field__label {
		padding-top: var(--ml-space-3-5);
	}
`;
var FormFieldComponent = class FormFieldComponent$1 {
	constructor() {
		this.label = "";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.orientation = "vertical";
		this.disabled = false;
		this.required = false;
		this._fieldId = `ml-form-field-${Math.random().toString(36).slice(2, 9)}`;
		this.handleSlotChange = () => {
			this.connectSlottedControl();
		};
	}
	get fieldId() {
		return this._fieldId;
	}
	get hintId() {
		return `${this._fieldId}-hint`;
	}
	get errorId() {
		return `${this._fieldId}-error`;
	}
	get describedBy() {
		if (this.error) return this.errorId;
		if (this.hint) return this.hintId;
		return "";
	}
	onCreate() {
		this.connectSlottedControl();
	}
	connectSlottedControl() {
		const slot = this.elementRef.shadowRoot?.querySelector("slot:not([name])");
		if (!slot) return;
		const elements = slot.assignedElements({ flatten: true });
		const control = this.findFormControl(elements);
		if (control) {
			if (!control.id) control.id = this.fieldId;
			if (this.describedBy) control.setAttribute("aria-describedby", this.describedBy);
			if (this.error) control.setAttribute("aria-invalid", "true");
			else control.removeAttribute("aria-invalid");
			if (this.required) control.setAttribute("aria-required", "true");
			if (this.disabled && "disabled" in control) control.disabled = true;
		}
	}
	findFormControl(elements) {
		for (const element of elements) {
			if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) return element;
			if (element instanceof HTMLElement) {
				const role = element.getAttribute("role");
				if (role === "textbox" || role === "combobox" || role === "checkbox" || role === "radio" || role === "switch" || role === "slider") return element;
				if (element.tagName.toLowerCase().startsWith("ml-")) return element;
			}
			const nested = this.findFormControl(Array.from(element.children));
			if (nested) return nested;
		}
		return null;
	}
};
FormFieldComponent = __decorate([MelodicComponent({
	selector: "ml-form-field",
	template: formFieldTemplate,
	styles: formFieldStyles,
	attributes: [
		"label",
		"hint",
		"error",
		"size",
		"orientation",
		"disabled",
		"required"
	]
})], FormFieldComponent);
function calendarTemplate(c) {
	return html`
		<div class="ml-calendar" role="grid" aria-label=${c.monthLabel}>
			<div class="ml-calendar__header">
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Previous year" @click=${c.prevYear}>
						<ml-icon icon="caret-double-left" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-calendar__nav" aria-label="Previous month" @click=${c.prevMonth}>
						<ml-icon icon="caret-left" size="sm"></ml-icon>
					</button>
				</div>
				<span class="ml-calendar__month-label">${c.monthLabel}</span>
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Next month" @click=${c.nextMonth}>
						<ml-icon icon="caret-right" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-calendar__nav" aria-label="Next year" @click=${c.nextYear}>
						<ml-icon icon="caret-double-right" size="sm"></ml-icon>
					</button>
				</div>
			</div>

			<div class="ml-calendar__weekdays" role="row">
				${repeat(c.weekdays, (d) => d, (d) => html`
					<span class="ml-calendar__weekday" role="columnheader">${d}</span>
				`)}
			</div>

			<div class="ml-calendar__grid">
				${repeat(c.days, (day) => day.iso, (day) => html`
					<button
						type="button"
						class=${classMap({
		"ml-calendar__day": true,
		"ml-calendar__day--other-month": !day.isCurrentMonth,
		"ml-calendar__day--today": day.isToday,
		"ml-calendar__day--selected": day.isSelected,
		"ml-calendar__day--disabled": day.isDisabled
	})}
						?disabled=${day.isDisabled || !day.isCurrentMonth}
						tabindex=${day.isCurrentMonth ? "0" : "-1"}
						aria-selected=${day.isSelected ? "true" : "false"}
						aria-label=${day.iso}
						@click=${() => c.selectDay(day)}
					>
						<span class="ml-calendar__day-number">${day.date}</span>
						${day.isToday ? html`<span class="ml-calendar__today-dot"></span>` : ""}
					</button>
				`)}
			</div>

			<div class="ml-calendar__footer">
				<button type="button" class="ml-calendar__today-btn" @click=${c.goToToday}>Today</button>
			</div>
		</div>
	`;
}
const calendarStyles = () => css`
	:host {
		display: inline-block;

		/* --- Calendar --- */
		--ml-calendar-width: 280px;
		--ml-calendar-font-family: var(--ml-font-sans);

		/* --- Month label --- */
		--ml-calendar-month-font-size: var(--ml-text-sm);
		--ml-calendar-month-font-weight: var(--ml-font-semibold);
		--ml-calendar-month-color: var(--ml-color-text);

		/* --- Nav buttons --- */
		--ml-calendar-nav-size: 2rem;
		--ml-calendar-nav-border-radius: var(--ml-radius-md);
		--ml-calendar-nav-color: var(--ml-color-text-muted);
		--ml-calendar-nav-hover-bg: var(--ml-color-surface-raised);
		--ml-calendar-nav-hover-color: var(--ml-color-text);

		/* --- Weekday headers --- */
		--ml-calendar-weekday-height: 2.25rem;
		--ml-calendar-weekday-font-size: var(--ml-text-xs);
		--ml-calendar-weekday-font-weight: var(--ml-font-medium);
		--ml-calendar-weekday-color: var(--ml-color-text-muted);

		/* --- Day cells --- */
		--ml-calendar-day-font-size: var(--ml-text-sm);
		--ml-calendar-day-font-weight: var(--ml-font-regular);
		--ml-calendar-day-color: var(--ml-color-text);
		--ml-calendar-day-border-radius: var(--ml-radius-full);
		--ml-calendar-day-hover-bg: var(--ml-color-surface-raised);

		/* --- Today --- */
		--ml-calendar-today-font-weight: var(--ml-font-semibold);
		--ml-calendar-today-dot-size: 4px;
		--ml-calendar-today-dot-color: var(--ml-color-primary);

		/* --- Selected --- */
		--ml-calendar-selected-bg: var(--ml-color-primary);
		--ml-calendar-selected-color: var(--ml-color-text-inverse);
		--ml-calendar-selected-font-weight: var(--ml-font-semibold);
		--ml-calendar-selected-hover-bg: var(--ml-color-primary-hover);
		--ml-calendar-selected-dot-color: var(--ml-color-text-inverse);

		/* --- Disabled --- */
		--ml-calendar-disabled-opacity: 0.3;

		/* --- Focus --- */
		--ml-calendar-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Today button --- */
		--ml-calendar-today-btn-border-color: var(--ml-color-border);
		--ml-calendar-today-btn-border-radius: var(--ml-radius-md);
		--ml-calendar-today-btn-bg: var(--ml-color-surface);
		--ml-calendar-today-btn-font-size: var(--ml-text-sm);
		--ml-calendar-today-btn-font-weight: var(--ml-font-medium);
		--ml-calendar-today-btn-color: var(--ml-color-text);
		--ml-calendar-today-btn-hover-bg: var(--ml-color-surface-raised);
		--ml-calendar-today-btn-hover-border-color: var(--ml-color-border-strong);

		/* --- Transition --- */
		--ml-calendar-transition-duration: var(--ml-duration-150);
		--ml-calendar-transition-easing: var(--ml-ease-in-out);
	}

	.ml-calendar {
		width: var(--ml-calendar-width);
		font-family: var(--ml-calendar-font-family);
	}

	/* Header with nav */
	.ml-calendar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0 var(--ml-space-3) 0;
	}

	.ml-calendar__nav-group {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.ml-calendar__month-label {
		font-size: var(--ml-calendar-month-font-size);
		font-weight: var(--ml-calendar-month-font-weight);
		color: var(--ml-calendar-month-color);
	}

	.ml-calendar__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-calendar-nav-size);
		height: var(--ml-calendar-nav-size);
		border: none;
		border-radius: var(--ml-calendar-nav-border-radius);
		background: none;
		color: var(--ml-calendar-nav-color);
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing), color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing);
	}

	.ml-calendar__nav:hover {
		background-color: var(--ml-calendar-nav-hover-bg);
		color: var(--ml-calendar-nav-hover-color);
	}

	.ml-calendar__nav:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow);
	}

	/* Weekday headers */
	.ml-calendar__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0;
		margin-bottom: var(--ml-space-1);
	}

	.ml-calendar__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--ml-calendar-weekday-height);
		font-size: var(--ml-calendar-weekday-font-size);
		font-weight: var(--ml-calendar-weekday-font-weight);
		color: var(--ml-calendar-weekday-color);
	}

	/* Day grid */
	.ml-calendar__grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0;
	}

	.ml-calendar__day {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--ml-calendar-day-border-radius);
		background: none;
		font-size: var(--ml-calendar-day-font-size);
		font-weight: var(--ml-calendar-day-font-weight);
		color: var(--ml-calendar-day-color);
		cursor: pointer;
		padding: 0;
		gap: 1px;
		transition:
			background-color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing),
			color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing);
	}

	.ml-calendar__day:hover:not(:disabled):not(.ml-calendar__day--selected) {
		background-color: var(--ml-calendar-day-hover-bg);
	}

	.ml-calendar__day:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow);
		z-index: 1;
	}

	/* Other month days - hidden */
	.ml-calendar__day--other-month {
		visibility: hidden;
		pointer-events: none;
	}

	/* Today */
	.ml-calendar__day--today {
		font-weight: var(--ml-calendar-today-font-weight);
	}

	.ml-calendar__day-number {
		line-height: 1;
	}

	/* Today dot indicator */
	.ml-calendar__today-dot {
		width: var(--ml-calendar-today-dot-size);
		height: var(--ml-calendar-today-dot-size);
		border-radius: var(--ml-calendar-day-border-radius);
		background-color: var(--ml-calendar-today-dot-color);
	}

	.ml-calendar__day--selected .ml-calendar__today-dot {
		background-color: var(--ml-calendar-selected-dot-color);
	}

	/* Selected */
	.ml-calendar__day--selected {
		background-color: var(--ml-calendar-selected-bg);
		color: var(--ml-calendar-selected-color);
		font-weight: var(--ml-calendar-selected-font-weight);
	}

	.ml-calendar__day--selected:hover:not(:disabled) {
		background-color: var(--ml-calendar-selected-hover-bg);
	}

	/* Disabled */
	.ml-calendar__day--disabled:not(.ml-calendar__day--other-month) {
		opacity: var(--ml-calendar-disabled-opacity);
		cursor: not-allowed;
	}

	/* Footer */
	.ml-calendar__footer {
		display: flex;
		justify-content: center;
		padding-top: var(--ml-space-3);
	}

	.ml-calendar__today-btn {
		border: var(--ml-border) solid var(--ml-calendar-today-btn-border-color);
		border-radius: var(--ml-calendar-today-btn-border-radius);
		background-color: var(--ml-calendar-today-btn-bg);
		font-family: var(--ml-calendar-font-family);
		font-size: var(--ml-calendar-today-btn-font-size);
		font-weight: var(--ml-calendar-today-btn-font-weight);
		color: var(--ml-calendar-today-btn-color);
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing), border-color var(--ml-calendar-transition-duration) var(--ml-calendar-transition-easing);
	}

	.ml-calendar__today-btn:hover {
		background-color: var(--ml-calendar-today-btn-hover-bg);
		border-color: var(--ml-calendar-today-btn-hover-border-color);
	}

	.ml-calendar__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow);
	}
`;
var MONTH_NAMES$1 = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
var WEEKDAYS = [
	"Su",
	"Mo",
	"Tu",
	"We",
	"Th",
	"Fr",
	"Sa"
];
function toIso(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayIso() {
	const d = /* @__PURE__ */ new Date();
	return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}
var CalendarComponent = class CalendarComponent$1 {
	constructor() {
		this.value = "";
		this.min = "";
		this.max = "";
		this.viewMonth = (/* @__PURE__ */ new Date()).getMonth();
		this.viewYear = (/* @__PURE__ */ new Date()).getFullYear();
		this.prevYear = () => {
			this.viewYear--;
		};
		this.nextYear = () => {
			this.viewYear++;
		};
		this.prevMonth = () => {
			if (this.viewMonth === 0) {
				this.viewMonth = 11;
				this.viewYear--;
			} else this.viewMonth--;
		};
		this.nextMonth = () => {
			if (this.viewMonth === 11) {
				this.viewMonth = 0;
				this.viewYear++;
			} else this.viewMonth++;
		};
		this.selectDay = (day) => {
			if (day.isDisabled) return;
			this.value = day.iso;
			this.viewMonth = day.month;
			this.viewYear = day.year;
			this.elementRef.dispatchEvent(new CustomEvent("ml:select", {
				bubbles: true,
				composed: true,
				detail: { value: day.iso }
			}));
		};
		this.goToToday = () => {
			const now = /* @__PURE__ */ new Date();
			this.viewMonth = now.getMonth();
			this.viewYear = now.getFullYear();
			const iso = todayIso();
			if (!this.isDisabled(iso)) {
				this.value = iso;
				this.elementRef.dispatchEvent(new CustomEvent("ml:select", {
					bubbles: true,
					composed: true,
					detail: { value: iso }
				}));
			}
		};
	}
	onInit() {
		this.navigateToValue();
	}
	onAttributeChange(name, _, newVal) {
		if (name === "value" && newVal) this.navigateToValue();
	}
	navigateToValue() {
		if (!this.value) return;
		const parts = this.value.split("-");
		if (parts.length === 3) {
			this.viewYear = Number.parseInt(parts[0], 10);
			this.viewMonth = Number.parseInt(parts[1], 10) - 1;
		}
	}
	get monthLabel() {
		return `${MONTH_NAMES$1[this.viewMonth]} ${this.viewYear}`;
	}
	get weekdays() {
		return WEEKDAYS;
	}
	get days() {
		const year = this.viewYear;
		const month = this.viewMonth;
		const firstDayOfWeek = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const daysInPrevMonth = new Date(year, month, 0).getDate();
		const today = todayIso();
		const result = [];
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		for (let i = firstDayOfWeek - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			const iso = toIso(prevYear, prevMonth, d);
			result.push({
				date: d,
				month: prevMonth,
				year: prevYear,
				iso,
				isCurrentMonth: false,
				isToday: iso === today,
				isSelected: iso === this.value,
				isDisabled: this.isDisabled(iso)
			});
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const iso = toIso(year, month, d);
			result.push({
				date: d,
				month,
				year,
				iso,
				isCurrentMonth: true,
				isToday: iso === today,
				isSelected: iso === this.value,
				isDisabled: this.isDisabled(iso)
			});
		}
		const nextMonth = month === 11 ? 0 : month + 1;
		const nextYear = month === 11 ? year + 1 : year;
		const remainder = result.length % 7;
		if (remainder > 0) {
			const trailingCount = 7 - remainder;
			for (let t = 1; t <= trailingCount; t++) {
				const iso = toIso(nextYear, nextMonth, t);
				result.push({
					date: t,
					month: nextMonth,
					year: nextYear,
					iso,
					isCurrentMonth: false,
					isToday: iso === today,
					isSelected: iso === this.value,
					isDisabled: this.isDisabled(iso)
				});
			}
		}
		return result;
	}
	isDisabled(iso) {
		if (this.min && iso < this.min) return true;
		if (this.max && iso > this.max) return true;
		return false;
	}
};
CalendarComponent = __decorate([MelodicComponent({
	selector: "ml-calendar",
	template: calendarTemplate,
	styles: calendarStyles,
	attributes: [
		"value",
		"min",
		"max"
	]
})], CalendarComponent);
function datePickerTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-date-picker": true,
		[`ml-date-picker--${c.size}`]: true,
		"ml-date-picker--error": !!c.error,
		"ml-date-picker--disabled": c.disabled,
		"ml-date-picker--open": c.isOpen
	})}>
			${when(!!c.label, () => html`
				<label class="ml-date-picker__label">
					${c.label}
					${when(c.required, () => html`<span class="ml-date-picker__required">*</span>`)}
				</label>
			`)}

			<div class="ml-date-picker__trigger">
				<input
					type="date"
					class="ml-date-picker__input"
					.value=${c.value}
					min=${c.min}
					max=${c.max}
					placeholder=${c.placeholder}
					?disabled=${c.disabled}
					?required=${c.required}
					aria-haspopup="dialog"
					aria-expanded=${c.isOpen ? "true" : "false"}
					@change=${c.handleInput}
					@click=${c.handleInputClick}
					@keydown=${c.handleKeyDown}
				/>
				<button
					type="button"
					class="ml-date-picker__calendar-btn"
					?disabled=${c.disabled}
					aria-label="Open calendar"
					tabindex="-1"
					@click=${c.toggleCalendar}
				>
					<ml-icon icon="calendar-blank" size="sm" class="ml-date-picker__icon"></ml-icon>
				</button>
			</div>

			<div class="ml-date-picker__popover" popover="auto">
				<ml-calendar
					value=${c.value}
					min=${c.min}
					max=${c.max}
					@ml:select=${c.handleDateSelect}
				></ml-calendar>
			</div>

			${when(!!c.error, () => html`<span class="ml-date-picker__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-date-picker__hint">${c.hint}</span>`)}`)}
		</div>
	`;
}
const datePickerStyles = () => css`
	:host {
		display: block;

		/* --- Label --- */
		--ml-date-picker-label-font-size: var(--ml-text-sm);
		--ml-date-picker-label-font-weight: var(--ml-font-medium);
		--ml-date-picker-label-color: var(--ml-color-text-secondary);
		--ml-date-picker-label-line-height: var(--ml-leading-tight);
		--ml-date-picker-label-margin-bottom: var(--ml-space-1-5);

		/* --- Required indicator --- */
		--ml-date-picker-required-color: var(--ml-color-danger);

		/* --- Trigger --- */
		--ml-date-picker-bg: var(--ml-color-input-bg);
		--ml-date-picker-border-width: var(--ml-border);
		--ml-date-picker-border-color: var(--ml-color-border);
		--ml-date-picker-border-radius: var(--ml-radius);
		--ml-date-picker-color: var(--ml-color-text);
		--ml-date-picker-font-family: var(--ml-font-sans);
		--ml-date-picker-font-size: var(--ml-text-sm);
		--ml-date-picker-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-date-picker-gap: var(--ml-space-2);
		--ml-date-picker-hover-border-color: var(--ml-color-border-strong);

		/* --- Focus --- */
		--ml-date-picker-focus-border-color: var(--ml-trigger-focus-border, var(--ml-color-primary));
		--ml-date-picker-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Error --- */
		--ml-date-picker-error-border-color: var(--ml-color-danger);
		--ml-date-picker-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-date-picker-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-date-picker-disabled-opacity: 0.5;
		--ml-date-picker-disabled-bg: var(--ml-color-input-disabled-bg);

		/* --- Icon --- */
		--ml-date-picker-icon-color: var(--ml-color-text-muted);

		/* --- Placeholder --- */
		--ml-date-picker-placeholder-color: var(--ml-color-text-muted);

		/* --- Popover --- */
		--ml-date-picker-popover-padding: var(--ml-space-4);
		--ml-date-picker-popover-border-color: var(--ml-color-border);
		--ml-date-picker-popover-border-radius: var(--ml-radius-lg);
		--ml-date-picker-popover-bg: var(--ml-color-surface);
		--ml-date-picker-popover-shadow: var(--ml-shadow-lg);

		/* --- Hint --- */
		--ml-date-picker-hint-color: var(--ml-color-text-muted);
		--ml-date-picker-hint-font-size: var(--ml-text-sm);

		/* --- Transition --- */
		--ml-date-picker-transition-duration: var(--ml-duration-150);
		--ml-date-picker-transition-easing: var(--ml-ease-in-out);
	}

	/* Label */
	.ml-date-picker__label {
		display: block;
		font-size: var(--ml-date-picker-label-font-size);
		font-weight: var(--ml-date-picker-label-font-weight);
		color: var(--ml-date-picker-label-color);
		margin-bottom: var(--ml-date-picker-label-margin-bottom);
		line-height: var(--ml-date-picker-label-line-height);
	}

	.ml-date-picker__required {
		color: var(--ml-date-picker-required-color);
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger wrapper */
	.ml-date-picker__trigger {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--ml-date-picker-border-width) solid var(--ml-date-picker-border-color);
		border-radius: var(--ml-date-picker-border-radius);
		background-color: var(--ml-date-picker-bg);
		transition:
			border-color var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing),
			box-shadow var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing);
	}

	.ml-date-picker__trigger:hover:not(:has(:disabled)) {
		border-color: var(--ml-date-picker-hover-border-color);
	}

	.ml-date-picker__trigger:focus-within {
		border-color: var(--ml-date-picker-focus-border-color);
		box-shadow: var(--ml-date-picker-focus-shadow);
	}

	.ml-date-picker--open .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-focus-border-color);
		box-shadow: var(--ml-date-picker-focus-shadow);
	}

	.ml-date-picker--error .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-error-border-color);
	}

	.ml-date-picker--error .ml-date-picker__trigger:focus-within,
	.ml-date-picker--error.ml-date-picker--open .ml-date-picker__trigger {
		box-shadow: var(--ml-date-picker-error-focus-shadow);
	}

	.ml-date-picker--disabled .ml-date-picker__trigger {
		opacity: var(--ml-date-picker-disabled-opacity);
		cursor: not-allowed;
		background-color: var(--ml-date-picker-disabled-bg);
	}

	/* Date input */
	.ml-date-picker__input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--ml-date-picker-color);
		font-family: var(--ml-date-picker-font-family);
		font-size: var(--ml-date-picker-font-size);
		padding: var(--ml-date-picker-padding);
	}

	/* Hide native date picker indicator across browsers */
	.ml-date-picker__input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
	}

	.ml-date-picker__input::-webkit-date-and-time-value {
		text-align: left;
	}

	.ml-date-picker__input:disabled {
		cursor: not-allowed;
	}

	/* Sizes */
	.ml-date-picker--sm .ml-date-picker__input {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-date-picker--md .ml-date-picker__input {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-date-picker--lg .ml-date-picker__input {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Calendar button */
	.ml-date-picker__calendar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0 var(--ml-space-3) 0 0;
		color: var(--ml-date-picker-icon-color);
		transition: color var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing);
	}

	.ml-date-picker__calendar-btn:hover:not(:disabled) {
		color: var(--ml-date-picker-color);
	}

	.ml-date-picker__calendar-btn:disabled {
		cursor: not-allowed;
	}

	/* Icon */
	.ml-date-picker__icon {
		flex-shrink: 0;
	}

	/* Popover */
	.ml-date-picker__popover {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-date-picker-popover-padding);
		border: var(--ml-date-picker-border-width) solid var(--ml-date-picker-popover-border-color);
		border-radius: var(--ml-date-picker-popover-border-radius);
		background-color: var(--ml-date-picker-popover-bg);
		box-shadow: var(--ml-date-picker-popover-shadow);
		z-index: 50;

		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-date-picker-transition-duration) var(--ml-ease-out),
			transform var(--ml-date-picker-transition-duration) var(--ml-ease-out),
			display var(--ml-date-picker-transition-duration) allow-discrete;
	}

	.ml-date-picker__popover:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-date-picker__popover:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	/* Hint / Error */
	.ml-date-picker__hint,
	.ml-date-picker__error {
		display: block;
		margin-top: var(--ml-date-picker-label-margin-bottom);
		font-size: var(--ml-date-picker-hint-font-size);
		line-height: var(--ml-date-picker-label-line-height);
	}

	.ml-date-picker__hint {
		color: var(--ml-date-picker-hint-color);
	}

	.ml-date-picker__error {
		color: var(--ml-date-picker-error-color);
	}
`;
var DatePickerComponent = class DatePickerComponent$1 {
	constructor() {
		this.value = "";
		this.placeholder = "Select date";
		this.label = "";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.disabled = false;
		this.required = false;
		this.min = "";
		this.max = "";
		this.isOpen = false;
		this._cleanupAutoUpdate = null;
		this.toggleCalendar = () => {
			if (this.disabled) return;
			const popoverEl = this.getPopoverEl();
			if (popoverEl) popoverEl.togglePopover();
		};
		this.handleInput = (event) => {
			const input = event.target;
			this.commitValue(input.value);
		};
		this.handleInputClick = () => {
			if (!this.isOpen) this.toggleCalendar();
		};
		this.handleDateSelect = (event) => {
			event.stopPropagation();
			const detail = event.detail;
			this.commitValue(detail.value);
			this.closePopover();
		};
		this.handleKeyDown = (event) => {
			if (event.key === "Escape" && this.isOpen) {
				event.preventDefault();
				this.closePopover();
			}
			if (event.key === " ") {
				event.preventDefault();
				if (!this.isOpen) this.toggleCalendar();
			}
			if (event.key === "F4" || event.altKey && event.key === "ArrowDown") {
				event.preventDefault();
				if (!this.isOpen) this.toggleCalendar();
			}
		};
		this._handleToggle = (event) => {
			if (event.newState === "open") {
				this.isOpen = true;
				this.startPositioning();
			} else {
				this.isOpen = false;
				this._cleanupAutoUpdate?.();
				this._cleanupAutoUpdate = null;
				this.returnFocus();
			}
		};
	}
	onCreate() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.addEventListener("toggle", this._handleToggle);
	}
	onDestroy() {
		this._cleanupAutoUpdate?.();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.removeEventListener("toggle", this._handleToggle);
	}
	commitValue(iso) {
		this.value = iso;
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value: iso }
		}));
	}
	closePopover() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) popoverEl.hidePopover();
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;
		const update = () => this.updatePosition(triggerEl, popoverEl);
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, popoverEl, update);
	}
	updatePosition(triggerEl, popoverEl) {
		const { x, y } = computePosition(triggerEl, popoverEl, {
			placement: "bottom-start",
			middleware: [
				offset(4),
				flip(),
				shift({ padding: 8 })
			]
		});
		popoverEl.style.left = `${x}px`;
		popoverEl.style.top = `${y}px`;
	}
	returnFocus() {
		const inputEl = this.getInputEl();
		if (inputEl) inputEl.focus();
	}
	getInputEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-date-picker__input");
	}
	getTriggerEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-date-picker__trigger");
	}
	getPopoverEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-date-picker__popover");
	}
};
DatePickerComponent = __decorate([MelodicComponent({
	selector: "ml-date-picker",
	template: datePickerTemplate,
	styles: datePickerStyles,
	attributes: [
		"value",
		"placeholder",
		"label",
		"hint",
		"error",
		"size",
		"disabled",
		"required",
		"min",
		"max"
	]
})], DatePickerComponent);
function alertTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-alert": true,
		[`ml-alert--${c.variant}`]: true
	})}
			role="alert"
		>
			<div class="ml-alert__icon">
				<slot name="icon">${c.renderDefaultIcon()}</slot>
			</div>

			<div class="ml-alert__content">
				${when(!!c.title, () => html`<div class="ml-alert__title">${c.title}</div>`)}
				<div class="ml-alert__message">
					<slot></slot>
				</div>
			</div>

			${when(c.dismissible, () => html`
					<button class="ml-alert__dismiss" @click=${c.handleDismiss} aria-label="Dismiss">
						<ml-icon icon="x" size="sm"></ml-icon>
					</button>
				`)}
		</div>
	`;
}
const alertStyles = () => css`
	:host {
		display: block;

		/* Spacing */
		--ml-alert-gap: var(--ml-space-3);
		--ml-alert-padding: var(--ml-space-4);
		--ml-alert-border-radius: var(--ml-radius-lg);

		/* Typography */
		--ml-alert-title-font-weight: var(--ml-font-semibold);
		--ml-alert-title-font-size: var(--ml-text-sm);
		--ml-alert-title-margin-bottom: var(--ml-space-1);
		--ml-alert-message-font-size: var(--ml-text-sm);
		--ml-alert-message-line-height: var(--ml-leading-relaxed);

		/* Icon */
		--ml-alert-icon-size: 1.25rem;

		/* Dismiss button */
		--ml-alert-dismiss-border-radius: var(--ml-radius-sm);
		--ml-alert-dismiss-opacity: 0.5;
		--ml-alert-dismiss-hover-opacity: 1;

		/* Transition */
		--ml-alert-transition-duration: var(--ml-duration-150);
		--ml-alert-transition-easing: var(--ml-ease-in-out);
	}

	:host([hidden]) {
		display: none;
	}

	.ml-alert {
		display: flex;
		gap: var(--ml-alert-gap);
		padding: var(--ml-alert-padding);
		border-radius: var(--ml-alert-border-radius);
		border: var(--ml-border) solid transparent;
	}

	.ml-alert--info {
		background-color: var(--ml-alert-info-bg);
		border-color: var(--ml-alert-info-border);
		color: var(--ml-alert-info-text);
	}

	.ml-alert--info .ml-alert__icon {
		color: var(--ml-alert-info-icon);
	}

	.ml-alert--success {
		background-color: var(--ml-alert-success-bg);
		border-color: var(--ml-alert-success-border);
		color: var(--ml-alert-success-text);
	}

	.ml-alert--success .ml-alert__icon {
		color: var(--ml-alert-success-icon);
	}

	.ml-alert--warning {
		background-color: var(--ml-alert-warning-bg);
		border-color: var(--ml-alert-warning-border);
		color: var(--ml-alert-warning-text);
	}

	.ml-alert--warning .ml-alert__icon {
		color: var(--ml-alert-warning-icon);
	}

	.ml-alert--error {
		background-color: var(--ml-alert-error-bg);
		border-color: var(--ml-alert-error-border);
		color: var(--ml-alert-error-text);
	}

	.ml-alert--error .ml-alert__icon {
		color: var(--ml-alert-error-icon);
	}

	.ml-alert__icon {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		margin-top: -3px;
	}

	.ml-alert__icon ml-icon {
		font-size: var(--ml-alert-icon-size);
	}

	.ml-alert__icon svg {
		width: var(--ml-alert-icon-size);
		height: var(--ml-alert-icon-size);
	}

	.ml-alert__content {
		flex: 1;
		min-width: 0;
	}

	.ml-alert__title {
		font-weight: var(--ml-alert-title-font-weight);
		font-size: var(--ml-alert-title-font-size);
		margin-bottom: var(--ml-alert-title-margin-bottom);
	}

	.ml-alert__message {
		font-size: var(--ml-alert-message-font-size);
		line-height: var(--ml-alert-message-line-height);
	}

	.ml-alert__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-alert-dismiss-border-radius);
		cursor: pointer;
		color: currentColor;
		opacity: var(--ml-alert-dismiss-opacity);
		transition:
			opacity var(--ml-alert-transition-duration) var(--ml-alert-transition-easing),
			background-color var(--ml-alert-transition-duration) var(--ml-alert-transition-easing);
	}

	.ml-alert__dismiss:hover {
		opacity: var(--ml-alert-dismiss-hover-opacity);
	}

	.ml-alert__dismiss:focus-visible {
		outline: none;
		opacity: var(--ml-alert-dismiss-hover-opacity);
	}
`;
var AlertComponent = class AlertComponent$1 {
	constructor() {
		this.variant = "info";
		this.title = "";
		this.dismissible = false;
		this.handleDismiss = () => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:dismiss", {
				bubbles: true,
				composed: true
			}));
			this.elementRef.setAttribute("hidden", "");
		};
		this.renderDefaultIcon = () => {
			return html`<ml-icon icon="${{
				info: "info",
				success: "check-circle",
				warning: "warning",
				error: "x-circle"
			}[this.variant]}"></ml-icon>`;
		};
	}
};
AlertComponent = __decorate([MelodicComponent({
	selector: "ml-alert",
	template: alertTemplate,
	styles: alertStyles,
	attributes: [
		"variant",
		"title",
		"dismissible"
	]
})], AlertComponent);
var ToastService = class ToastService$1 {
	constructor() {
		this._containerEl = null;
		this._position = "top-right";
	}
	setPosition(position) {
		this._position = position;
		if (this._containerEl) this._containerEl.setAttribute("position", position);
	}
	show(config) {
		const container = this.ensureContainer();
		const toast = document.createElement("ml-toast");
		if (config.variant) toast.setAttribute("variant", config.variant);
		if (config.title) toast.setAttribute("title", config.title);
		if (config.message) toast.setAttribute("message", config.message);
		if (config.duration !== void 0) toast.setAttribute("duration", String(config.duration));
		if (config.dismissible === false) toast.setAttribute("dismissible", "false");
		container.appendChild(toast);
	}
	info(title, message) {
		this.show({
			variant: "info",
			title,
			message
		});
	}
	success(title, message) {
		this.show({
			variant: "success",
			title,
			message
		});
	}
	warning(title, message) {
		this.show({
			variant: "warning",
			title,
			message
		});
	}
	error(title, message) {
		this.show({
			variant: "error",
			title,
			message
		});
	}
	ensureContainer() {
		if (this._containerEl && document.body.contains(this._containerEl)) return this._containerEl;
		this._containerEl = document.createElement("ml-toast-container");
		this._containerEl.setAttribute("position", this._position);
		document.body.appendChild(this._containerEl);
		return this._containerEl;
	}
};
ToastService = __decorate([Injectable()], ToastService);
function toastTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-toast": true,
		[`ml-toast--${c.variant}`]: true
	})}
			role="alert"
		>
			<div class="ml-toast__icon">
				${c.renderIcon()}
			</div>
			<div class="ml-toast__content">
				${when(!!c.title, () => html`<div class="ml-toast__title">${c.title}</div>`)}
				${when(!!c.message, () => html`<div class="ml-toast__message">${c.message}</div>`)}
			</div>
			${when(c.dismissible, () => html`
					<button class="ml-toast__dismiss" @click=${c.dismiss} aria-label="Dismiss">
						<ml-icon icon="x" size="sm"></ml-icon>
					</button>
				`)}
		</div>
	`;
}
const toastStyles = () => css`
	:host {
		display: block;

		/* Background & border */
		--ml-toast-bg: var(--ml-color-surface);
		--ml-toast-border-color: var(--ml-color-border);
		--ml-toast-border-radius: var(--ml-radius-lg);
		--ml-toast-shadow: var(--ml-shadow-lg);

		/* Spacing */
		--ml-toast-gap: var(--ml-space-3);
		--ml-toast-padding: var(--ml-space-4);
		--ml-toast-min-width: 320px;
		--ml-toast-max-width: 420px;

		/* Title */
		--ml-toast-title-font-size: var(--ml-text-sm);
		--ml-toast-title-font-weight: var(--ml-font-semibold);
		--ml-toast-title-color: var(--ml-color-text);
		--ml-toast-title-line-height: var(--ml-leading-tight);

		/* Message */
		--ml-toast-message-font-size: var(--ml-text-sm);
		--ml-toast-message-color: var(--ml-color-text-secondary);
		--ml-toast-message-line-height: var(--ml-leading-relaxed);
		--ml-toast-message-margin-top: var(--ml-space-1);

		/* Icon variant colors */
		--ml-toast-info-icon-color: var(--ml-color-primary);
		--ml-toast-success-icon-color: var(--ml-color-success);
		--ml-toast-warning-icon-color: var(--ml-color-warning);
		--ml-toast-error-icon-color: var(--ml-color-danger);

		/* Dismiss button */
		--ml-toast-dismiss-border-radius: var(--ml-radius-sm);
		--ml-toast-dismiss-color: var(--ml-color-text-tertiary);
		--ml-toast-dismiss-hover-color: var(--ml-color-text);

		/* Transition */
		--ml-toast-transition-duration: var(--ml-duration-150);
		--ml-toast-transition-easing: var(--ml-ease-in-out);

		/* Animation */
		--ml-toast-animation-duration: var(--ml-duration-300);
		--ml-toast-animation-easing: var(--ml-ease-out);
	}

	.ml-toast {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-toast-gap);
		padding: var(--ml-toast-padding);
		background-color: var(--ml-toast-bg);
		border: 1px solid var(--ml-toast-border-color);
		border-radius: var(--ml-toast-border-radius);
		box-shadow: var(--ml-toast-shadow);
		min-width: var(--ml-toast-min-width);
		max-width: var(--ml-toast-max-width);
		animation: ml-toast-in var(--ml-toast-animation-duration) var(--ml-toast-animation-easing);
	}

	@keyframes ml-toast-in {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.ml-toast__icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.ml-toast--info .ml-toast__icon {
		color: var(--ml-toast-info-icon-color);
	}

	.ml-toast--success .ml-toast__icon {
		color: var(--ml-toast-success-icon-color);
	}

	.ml-toast--warning .ml-toast__icon {
		color: var(--ml-toast-warning-icon-color);
	}

	.ml-toast--error .ml-toast__icon {
		color: var(--ml-toast-error-icon-color);
	}

	.ml-toast__content {
		flex: 1;
		min-width: 0;
	}

	.ml-toast__title {
		font-size: var(--ml-toast-title-font-size);
		font-weight: var(--ml-toast-title-font-weight);
		color: var(--ml-toast-title-color);
		line-height: var(--ml-toast-title-line-height);
	}

	.ml-toast__message {
		font-size: var(--ml-toast-message-font-size);
		color: var(--ml-toast-message-color);
		line-height: var(--ml-toast-message-line-height);
		margin-top: var(--ml-toast-message-margin-top);
	}

	.ml-toast__title + .ml-toast__message {
		margin-top: var(--ml-toast-message-margin-top);
	}

	.ml-toast__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-toast-dismiss-border-radius);
		cursor: pointer;
		color: var(--ml-toast-dismiss-color);
		transition: color var(--ml-toast-transition-duration) var(--ml-toast-transition-easing);
	}

	.ml-toast__dismiss:hover {
		color: var(--ml-toast-dismiss-hover-color);
	}
`;
var ToastComponent = class ToastComponent$1 {
	constructor() {
		this.variant = "info";
		this.title = "";
		this.message = "";
		this.duration = 5e3;
		this.dismissible = true;
		this._timer = null;
		this.dismiss = () => {
			if (this._timer) {
				clearTimeout(this._timer);
				this._timer = null;
			}
			this.elementRef.dispatchEvent(new CustomEvent("ml:dismiss", {
				bubbles: true,
				composed: true
			}));
			this.elementRef.remove();
		};
		this.renderIcon = () => {
			return html`<ml-icon icon="${{
				info: "info",
				success: "check-circle",
				warning: "warning",
				error: "x-circle"
			}[this.variant]}"></ml-icon>`;
		};
	}
	onCreate() {
		if (this.duration > 0) this._timer = setTimeout(() => this.dismiss(), this.duration);
	}
};
ToastComponent = __decorate([MelodicComponent({
	selector: "ml-toast",
	template: toastTemplate,
	styles: toastStyles,
	attributes: [
		"variant",
		"title",
		"message",
		"duration",
		"dismissible"
	]
})], ToastComponent);
function toastContainerTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-toast-container": true,
		[`ml-toast-container--${c.position}`]: true
	})}
		>
			<slot></slot>
		</div>
	`;
}
const toastContainerStyles = () => css`
	:host {
		display: block;
	}

	.ml-toast-container {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		pointer-events: none;
	}

	.ml-toast-container ::slotted(*) {
		pointer-events: auto;
	}

	/* Top positions */
	.ml-toast-container--top-right {
		top: 0;
		right: 0;
		align-items: flex-end;
	}

	.ml-toast-container--top-left {
		top: 0;
		left: 0;
		align-items: flex-start;
	}

	.ml-toast-container--top-center {
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
	}

	/* Bottom positions */
	.ml-toast-container--bottom-right {
		bottom: 0;
		right: 0;
		align-items: flex-end;
		flex-direction: column-reverse;
	}

	.ml-toast-container--bottom-left {
		bottom: 0;
		left: 0;
		align-items: flex-start;
		flex-direction: column-reverse;
	}

	.ml-toast-container--bottom-center {
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
		flex-direction: column-reverse;
	}
`;
var ToastContainerComponent = class ToastContainerComponent$1 {
	constructor() {
		this.position = "top-right";
	}
};
ToastContainerComponent = __decorate([MelodicComponent({
	selector: "ml-toast-container",
	template: toastContainerTemplate,
	styles: toastContainerStyles,
	attributes: ["position"]
})], ToastContainerComponent);
function linearTemplate(c) {
	const showHeader = c.labelPosition === "top" && (!!c.label || c.showValue);
	const showRight = c.labelPosition === "right" && c.showValue;
	const showBottom = c.labelPosition === "bottom" && c.showValue;
	const showFloatingTop = c.labelPosition === "floating-top" && c.showValue;
	const showFloatingBottom = c.labelPosition === "floating-bottom" && c.showValue;
	return html`
		<div class=${classMap({
		"ml-progress": true,
		[`ml-progress--${c.variant}`]: true,
		[`ml-progress--${c.size}`]: true,
		"ml-progress--label-right": showRight
	})}>
			${when(showHeader, () => html`
				<div class="ml-progress__header">
					${when(!!c.label, () => html`<span class="ml-progress__label">${c.label}</span>`)}
					${when(c.showValue, () => html`<span class="ml-progress__value">${c.displayValue}</span>`)}
				</div>
			`)}

			<div class="ml-progress__bar-row">
				<div class="ml-progress__track-wrapper">
					${when(showFloatingTop, () => html`
						<div class="ml-progress__floating ml-progress__floating--top" style=${styleMap({ left: `${c.percentage}%` })}>
							<span class="ml-progress__floating-value">${c.displayValue}</span>
							<span class="ml-progress__floating-arrow ml-progress__floating-arrow--down"></span>
						</div>
					`)}

					<div class="ml-progress__track" role="progressbar" aria-valuenow=${c.value} aria-valuemin="0" aria-valuemax=${c.max} aria-label=${c.label || "Progress"}>
						<div class="ml-progress__fill" style=${styleMap({ width: `${c.percentage}%` })}></div>
					</div>

					${when(showFloatingBottom, () => html`
						<div class="ml-progress__floating ml-progress__floating--bottom" style=${styleMap({ left: `${c.percentage}%` })}>
							<span class="ml-progress__floating-arrow ml-progress__floating-arrow--up"></span>
							<span class="ml-progress__floating-value">${c.displayValue}</span>
						</div>
					`)}
				</div>

				${when(showRight, () => html`<span class="ml-progress__value">${c.displayValue}</span>`)}
			</div>

			${when(showBottom, () => html`<span class="ml-progress__value ml-progress__value--bottom">${c.displayValue}</span>`)}
		</div>
	`;
}
function circleTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-progress-circle": true,
		[`ml-progress-circle--${c.variant}`]: true,
		[`ml-progress-circle--${c.size}`]: true
	})}>
			<svg
				width=${c.svgSize}
				height=${c.svgSize}
				viewBox="0 0 ${c.svgSize} ${c.svgSize}"
				class="ml-progress-circle__svg"
			>
				<circle
					class="ml-progress-circle__track"
					cx=${c.svgCenter}
					cy=${c.svgCenter}
					r=${c.circleRadius}
					fill="none"
					stroke-width=${c.circleStroke}
				/>
				<circle
					class="ml-progress-circle__fill"
					cx=${c.svgCenter}
					cy=${c.svgCenter}
					r=${c.circleRadius}
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
					stroke-dasharray=${c.circumference}
					stroke-dashoffset=${c.circleDashOffset}
					transform="rotate(-90 ${c.svgCenter} ${c.svgCenter})"
				/>
			</svg>
			${when(c.showValue || !!c.label, () => html`
				<div class="ml-progress-circle__center">
					${when(c.showValue, () => html`<span class="ml-progress-circle__value">${c.displayValue}</span>`)}
					${when(!!c.label, () => html`<span class="ml-progress-circle__label">${c.label}</span>`)}
				</div>
			`)}
		</div>
	`;
}
function halfCircleTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-progress-half": true,
		[`ml-progress-half--${c.variant}`]: true,
		[`ml-progress-half--${c.size}`]: true
	})}>
			<svg
				width=${c.svgSize}
				height=${c.svgCenter + c.circleStroke}
				viewBox="0 0 ${c.svgSize} ${c.svgCenter + c.circleStroke}"
				class="ml-progress-half__svg"
			>
				<path
					class="ml-progress-half__track"
					d="M ${c.circleStroke} ${c.svgCenter} A ${c.circleRadius} ${c.circleRadius} 0 0 1 ${c.svgSize - c.circleStroke} ${c.svgCenter}"
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
				/>
				<path
					class="ml-progress-half__fill"
					d="M ${c.circleStroke} ${c.svgCenter} A ${c.circleRadius} ${c.circleRadius} 0 0 1 ${c.svgSize - c.circleStroke} ${c.svgCenter}"
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
					stroke-dasharray=${c.halfCircumference}
					stroke-dashoffset=${c.halfCircleDashOffset}
				/>
			</svg>
			${when(c.showValue || !!c.label, () => html`
				<div class="ml-progress-half__center">
					${when(c.showValue, () => html`<span class="ml-progress-half__value">${c.displayValue}</span>`)}
					${when(!!c.label, () => html`<span class="ml-progress-half__label">${c.label}</span>`)}
				</div>
			`)}
		</div>
	`;
}
function progressTemplate(c) {
	if (c.shape === "circle") return circleTemplate(c);
	if (c.shape === "half-circle") return halfCircleTemplate(c);
	return linearTemplate(c);
}
const progressStyles = () => css`
	:host {
		display: block;

		/* ---- Linear ---- */

		/* Track */
		--ml-progress-track-color: var(--ml-color-surface-sunken);
		--ml-progress-track-radius: var(--ml-radius-full);
		/* Fill */
		--ml-progress-fill-color: var(--ml-color-primary);
		--ml-progress-fill-radius: var(--ml-radius-full);

		/* Label / value text */
		--ml-progress-label-font-size: var(--ml-text-sm);
		--ml-progress-label-font-weight: var(--ml-font-medium);
		--ml-progress-label-color: var(--ml-color-text);

		/* Floating tooltip */
		--ml-progress-floating-font-size: var(--ml-text-xs);
		--ml-progress-floating-font-weight: var(--ml-font-medium);
		--ml-progress-floating-color: var(--ml-color-text-inverse);
		--ml-progress-floating-bg: var(--ml-color-text);
		--ml-progress-floating-radius: var(--ml-radius-md);
		--ml-progress-floating-padding-y: var(--ml-space-1);
		--ml-progress-floating-padding-x: var(--ml-space-2);

		/* Spacing */
		--ml-progress-header-margin-bottom: var(--ml-space-2);
		--ml-progress-value-bottom-margin-top: var(--ml-space-2);
		--ml-progress-bar-row-gap: var(--ml-space-3);

		/* Transition */
		--ml-progress-transition-duration: var(--ml-duration-300);
		--ml-progress-transition-easing: var(--ml-ease-out);

		/* ---- Circle ---- */

		--ml-progress-circle-track-color: var(--ml-color-surface-sunken);
		--ml-progress-circle-fill-color: var(--ml-color-primary);
		--ml-progress-circle-value-font-weight: var(--ml-font-semibold);
		--ml-progress-circle-value-color: var(--ml-color-text);
		--ml-progress-circle-label-font-size: var(--ml-text-xs);
		--ml-progress-circle-label-color: var(--ml-color-text-muted);
		--ml-progress-circle-label-margin-top: var(--ml-space-0-5);

		/* ---- Half circle ---- */

		--ml-progress-half-track-color: var(--ml-color-surface-sunken);
		--ml-progress-half-fill-color: var(--ml-color-primary);
		--ml-progress-half-value-font-weight: var(--ml-font-semibold);
		--ml-progress-half-value-color: var(--ml-color-text);
		--ml-progress-half-label-font-size: var(--ml-text-xs);
		--ml-progress-half-label-color: var(--ml-color-text-muted);
		--ml-progress-half-label-margin-top: var(--ml-space-0-5);
		--ml-progress-half-center-padding-bottom: var(--ml-space-1);
	}

	/* ===================== LINEAR ===================== */

	.ml-progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-progress-header-margin-bottom);
	}

	.ml-progress__label {
		font-size: var(--ml-progress-label-font-size);
		font-weight: var(--ml-progress-label-font-weight);
		color: var(--ml-progress-label-color);
	}

	.ml-progress__value {
		font-size: var(--ml-progress-label-font-size);
		font-weight: var(--ml-progress-label-font-weight);
		color: var(--ml-progress-label-color);
	}

	.ml-progress__value--bottom {
		display: block;
		margin-top: var(--ml-progress-value-bottom-margin-top);
	}

	/* Bar row for label-right layout */
	.ml-progress__bar-row {
		display: flex;
		align-items: center;
		gap: var(--ml-progress-bar-row-gap);
	}

	.ml-progress__track-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.ml-progress__track {
		width: 100%;
		background-color: var(--ml-progress-track-color);
		border-radius: var(--ml-progress-track-radius);
		overflow: hidden;
	}

	.ml-progress--sm .ml-progress__track {
		height: 4px;
	}

	.ml-progress--md .ml-progress__track {
		height: 8px;
	}

	.ml-progress--lg .ml-progress__track {
		height: 12px;
	}

	.ml-progress__fill {
		height: 100%;
		background-color: var(--ml-progress-fill-color);
		border-radius: var(--ml-progress-fill-radius);
		transition: width var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	/* Floating label */
	.ml-progress__floating {
		position: absolute;
		left: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
	}

	.ml-progress__floating--top {
		bottom: calc(100% + var(--ml-space-2));
	}

	.ml-progress__floating--bottom {
		top: calc(100% + var(--ml-space-2));
	}

	.ml-progress__floating-value {
		font-size: var(--ml-progress-floating-font-size);
		font-weight: var(--ml-progress-floating-font-weight);
		color: var(--ml-progress-floating-color);
		background-color: var(--ml-progress-floating-bg);
		padding: var(--ml-progress-floating-padding-y) var(--ml-progress-floating-padding-x);
		border-radius: var(--ml-progress-floating-radius);
		white-space: nowrap;
		line-height: 1;
	}

	.ml-progress__floating-arrow {
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
	}

	.ml-progress__floating-arrow--down {
		border-top: 5px solid var(--ml-progress-floating-bg);
	}

	.ml-progress__floating-arrow--up {
		border-bottom: 5px solid var(--ml-progress-floating-bg);
	}

	/* Linear color variants */
	.ml-progress--primary .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-primary);
	}

	.ml-progress--success .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-success);
	}

	.ml-progress--warning .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-warning);
	}

	.ml-progress--error .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-error);
	}

	/* ===================== CIRCLE ===================== */

	.ml-progress-circle {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.ml-progress-circle__svg {
		display: block;
	}

	.ml-progress-circle__track {
		stroke: var(--ml-progress-circle-track-color);
	}

	.ml-progress-circle__fill {
		stroke: var(--ml-progress-circle-fill-color);
		transition: stroke-dashoffset var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	.ml-progress-circle__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.ml-progress-circle--sm .ml-progress-circle__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle--md .ml-progress-circle__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle__label {
		font-size: var(--ml-progress-circle-label-font-size);
		color: var(--ml-progress-circle-label-color);
		margin-top: var(--ml-progress-circle-label-margin-top);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__label {
		font-size: var(--ml-text-sm);
		margin-top: var(--ml-space-1);
	}

	/* Circle color variants */
	.ml-progress-circle--primary .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-primary);
	}

	.ml-progress-circle--success .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-success);
	}

	.ml-progress-circle--warning .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-warning);
	}

	.ml-progress-circle--error .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-error);
	}

	/* ===================== HALF CIRCLE ===================== */

	.ml-progress-half {
		position: relative;
		display: inline-flex;
		align-items: flex-end;
		justify-content: center;
	}

	.ml-progress-half__svg {
		display: block;
	}

	.ml-progress-half__track {
		stroke: var(--ml-progress-half-track-color);
	}

	.ml-progress-half__fill {
		stroke: var(--ml-progress-half-fill-color);
		transition: stroke-dashoffset var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	.ml-progress-half__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		text-align: center;
		padding-bottom: var(--ml-progress-half-center-padding-bottom);
	}

	.ml-progress-half--sm .ml-progress-half__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half--md .ml-progress-half__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half__label {
		font-size: var(--ml-progress-half-label-font-size);
		color: var(--ml-progress-half-label-color);
		margin-top: var(--ml-progress-half-label-margin-top);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__label {
		font-size: var(--ml-text-sm);
	}

	/* Half circle color variants */
	.ml-progress-half--primary .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-primary);
	}

	.ml-progress-half--success .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-success);
	}

	.ml-progress-half--warning .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-warning);
	}

	.ml-progress-half--error .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-error);
	}
`;
var ProgressComponent = class ProgressComponent$1 {
	constructor() {
		this.value = 0;
		this.max = 100;
		this.variant = "primary";
		this.size = "md";
		this.label = "";
		this.showValue = false;
		this.shape = "linear";
		this.labelPosition = "top";
	}
	get percentage() {
		const max = Math.max(this.max, 1);
		return Math.min(Math.max(this.value / max * 100, 0), 100);
	}
	get displayValue() {
		return `${Math.round(this.percentage)}%`;
	}
	get circleRadius() {
		if (this.size === "sm") return 28;
		if (this.size === "lg") return 52;
		return 40;
	}
	get circleStroke() {
		if (this.size === "sm") return 4;
		if (this.size === "lg") return 8;
		return 6;
	}
	get circumference() {
		return 2 * Math.PI * this.circleRadius;
	}
	get halfCircumference() {
		return Math.PI * this.circleRadius;
	}
	get circleDashOffset() {
		return this.circumference - this.percentage / 100 * this.circumference;
	}
	get halfCircleDashOffset() {
		return this.halfCircumference - this.percentage / 100 * this.halfCircumference;
	}
	get svgSize() {
		return (this.circleRadius + this.circleStroke) * 2;
	}
	get svgCenter() {
		return this.circleRadius + this.circleStroke;
	}
};
ProgressComponent = __decorate([MelodicComponent({
	selector: "ml-progress",
	template: progressTemplate,
	styles: progressStyles,
	attributes: [
		"value",
		"max",
		"variant",
		"size",
		"label",
		"show-value",
		"shape",
		"label-position"
	]
})], ProgressComponent);
function cardTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-card": true,
		[`ml-card--${c.variant}`]: true,
		"ml-card--hoverable": c.hoverable,
		"ml-card--clickable": c.clickable
	})}
			@click=${c.handleClick}
		>
			${when(c.hasHeader, () => html`
					<div class="ml-card__header">
						<slot name="header"></slot>
					</div>
				`)}
			<div class="ml-card__body">
				<slot></slot>
			</div>
			${when(c.hasFooter, () => html`
					<div class="ml-card__footer">
						<slot name="footer"></slot>
					</div>
				`)}
		</div>
	`;
}
const cardStyles = () => css`
	:host {
		display: block;

		/* Background */
		--ml-card-bg: var(--ml-color-surface);
		--ml-card-footer-bg: transparent;

		/* Border */
		--ml-card-border-width: var(--ml-border);
		--ml-card-border-color: var(--ml-color-border);
		--ml-card-border-radius: var(--ml-radius-lg);

		/* Shadow */
		--ml-card-shadow: none;

		/* Spacing */
		--ml-card-header-padding-y: var(--ml-space-4);
		--ml-card-header-padding-x: var(--ml-space-5);
		--ml-card-body-padding: var(--ml-space-5);
		--ml-card-footer-padding-y: var(--ml-space-4);
		--ml-card-footer-padding-x: var(--ml-space-5);

		/* Hover state */
		--ml-card-hover-border-color: var(--ml-color-border-strong);
		--ml-card-hover-shadow: var(--ml-shadow-md);

		/* Focus state */
		--ml-card-focus-border-color: var(--ml-color-primary);
		--ml-card-focus-shadow: var(--ml-shadow-focus-ring);

		/* Transition */
		--ml-card-transition-duration: var(--ml-duration-200);
		--ml-card-transition-easing: var(--ml-ease-in-out);
	}

	.ml-card {
		background-color: var(--ml-card-bg);
		border-radius: var(--ml-card-border-radius);
		overflow: hidden;
		height: 100%;
	}

	.ml-card--default {
		border: var(--ml-card-border-width) solid var(--ml-card-border-color);
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-card--outlined {
		border: var(--ml-card-border-width) solid var(--ml-card-border-color);
	}

	.ml-card--elevated {
		border: var(--ml-card-border-width) solid var(--ml-color-border-muted);
		box-shadow: var(--ml-shadow-md);
	}

	.ml-card--filled {
		background-color: var(--ml-color-surface-raised);
		border: var(--ml-card-border-width) solid transparent;
	}

	.ml-card--hoverable {
		transition:
			box-shadow var(--ml-card-transition-duration) var(--ml-card-transition-easing),
			border-color var(--ml-card-transition-duration) var(--ml-card-transition-easing);
	}

	.ml-card--hoverable:hover {
		border-color: var(--ml-card-hover-border-color);
		box-shadow: var(--ml-card-hover-shadow);
	}

	.ml-card--clickable {
		cursor: pointer;
	}

	.ml-card--clickable:focus-visible {
		outline: none;
		border-color: var(--ml-card-focus-border-color);
		box-shadow: var(--ml-card-focus-shadow);
	}

	.ml-card__header {
		padding: var(--ml-card-header-padding-y) var(--ml-card-header-padding-x);
		border-bottom: var(--ml-card-border-width) solid var(--ml-card-border-color);
	}

	.ml-card__header ::slotted(*) {
		margin: 0;
	}

	.ml-card__body {
		padding: var(--ml-card-body-padding);
	}

	.ml-card__footer {
		padding: var(--ml-card-footer-padding-y) var(--ml-card-footer-padding-x);
		border-top: var(--ml-card-border-width) solid var(--ml-card-border-color);
		background-color: var(--ml-card-footer-bg);
	}
`;
var CardComponent = class CardComponent$1 {
	constructor() {
		this.variant = "default";
		this.hoverable = false;
		this.clickable = false;
		this.handleClick = (event) => {
			if (this.clickable) this.elementRef.dispatchEvent(new CustomEvent("ml:click", {
				bubbles: true,
				composed: true,
				detail: { originalEvent: event }
			}));
		};
	}
	get hasHeader() {
		return this.elementRef?.querySelector("[slot=\"header\"]") !== null;
	}
	get hasFooter() {
		return this.elementRef?.querySelector("[slot=\"footer\"]") !== null;
	}
};
CardComponent = __decorate([MelodicComponent({
	selector: "ml-card",
	template: cardTemplate,
	styles: cardStyles,
	attributes: [
		"variant",
		"hoverable",
		"clickable"
	]
})], CardComponent);
function dividerTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-divider": true,
		[`ml-divider--${c.orientation}`]: true,
		"ml-divider--with-label": c.hasLabel
	})}
			role="separator"
			aria-orientation=${c.orientation}
		>
			${when(c.hasLabel, () => html`
					<span class="ml-divider__label">
						<slot></slot>
					</span>
				`)}
		</div>
	`;
}
const dividerStyles = () => css`
	:host {
		display: block;

		/* Color */
		--ml-divider-color: var(--ml-color-border);

		/* Label */
		--ml-divider-label-font-size: var(--ml-text-sm);
		--ml-divider-label-font-weight: var(--ml-font-medium);
		--ml-divider-label-color: var(--ml-color-text-muted);
		--ml-divider-label-padding: var(--ml-space-4);

		/* Vertical label */
		--ml-divider-vertical-label-padding: var(--ml-space-3);
	}

	:host([orientation='vertical']) {
		display: inline-block;
		height: 100%;
	}

	.ml-divider {
		display: flex;
		align-items: center;
	}

	.ml-divider--horizontal {
		width: 100%;
		height: 1px;
		background-color: var(--ml-divider-color);
	}

	.ml-divider--horizontal.ml-divider--with-label {
		height: auto;
		background-color: transparent;
	}

	.ml-divider--horizontal.ml-divider--with-label::before,
	.ml-divider--horizontal.ml-divider--with-label::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--ml-divider-color);
	}

	.ml-divider--horizontal .ml-divider__label {
		padding: 0 var(--ml-divider-label-padding);
		font-size: var(--ml-divider-label-font-size);
		font-weight: var(--ml-divider-label-font-weight);
		color: var(--ml-divider-label-color);
		white-space: nowrap;
	}

	.ml-divider--vertical {
		flex-direction: column;
		width: 1px;
		min-height: 1rem;
		height: 100%;
		background-color: var(--ml-divider-color);
	}

	.ml-divider--vertical.ml-divider--with-label {
		width: auto;
		background-color: transparent;
	}

	.ml-divider--vertical.ml-divider--with-label::before,
	.ml-divider--vertical.ml-divider--with-label::after {
		content: '';
		flex: 1;
		width: 1px;
		background-color: var(--ml-divider-color);
	}

	.ml-divider--vertical .ml-divider__label {
		padding: var(--ml-divider-vertical-label-padding) 0;
		font-size: var(--ml-divider-label-font-size);
		font-weight: var(--ml-divider-label-font-weight);
		color: var(--ml-divider-label-color);
		writing-mode: vertical-rl;
	}
`;
var DividerComponent = class DividerComponent$1 {
	constructor() {
		this.orientation = "horizontal";
	}
	get hasLabel() {
		return this.elementRef?.textContent?.trim() !== "";
	}
};
DividerComponent = __decorate([MelodicComponent({
	selector: "ml-divider",
	template: dividerTemplate,
	styles: dividerStyles,
	attributes: ["orientation"]
})], DividerComponent);
function stackTemplate(c) {
	return html`
		<div class="ml-stack" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`;
}
const stackStyles = () => css`
	:host {
		display: block;
	}

	.ml-stack {
		display: flex;
	}
`;
var StackComponent = class StackComponent$1 {
	constructor() {
		this.direction = "vertical";
		this.gap = "4";
		this.align = "stretch";
		this.justify = "start";
		this.wrap = false;
	}
	getStyles() {
		const alignMap = {
			start: "flex-start",
			center: "center",
			end: "flex-end",
			stretch: "stretch",
			baseline: "baseline"
		};
		const justifyMap = {
			start: "flex-start",
			center: "center",
			end: "flex-end",
			between: "space-between",
			around: "space-around",
			evenly: "space-evenly"
		};
		return {
			"flex-direction": this.direction === "vertical" ? "column" : "row",
			gap: `var(--ml-space-${this.gap})`,
			"align-items": alignMap[this.align],
			"justify-content": justifyMap[this.justify],
			"flex-wrap": this.wrap ? "wrap" : "nowrap"
		};
	}
};
StackComponent = __decorate([MelodicComponent({
	selector: "ml-stack",
	template: stackTemplate,
	styles: stackStyles,
	attributes: [
		"direction",
		"gap",
		"align",
		"justify",
		"wrap"
	]
})], StackComponent);
function containerTemplate(c) {
	return html`
		<div class="ml-container" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`;
}
const containerStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-container {
		width: 100%;
	}
`;
var ContainerComponent = class ContainerComponent$1 {
	constructor() {
		this.size = "lg";
		this.padding = "4";
		this.centered = true;
	}
	getStyles() {
		const maxWidthMap = {
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			full: "100%"
		};
		return {
			"max-width": maxWidthMap[this.size],
			"padding-left": `var(--ml-space-${this.padding})`,
			"padding-right": `var(--ml-space-${this.padding})`,
			"margin-left": this.centered ? "auto" : "0",
			"margin-right": this.centered ? "auto" : "0"
		};
	}
};
ContainerComponent = __decorate([MelodicComponent({
	selector: "ml-container",
	template: containerTemplate,
	styles: containerStyles,
	attributes: [
		"size",
		"padding",
		"centered"
	]
})], ContainerComponent);
function avatarTemplate(c) {
	return html`
		<span
			class=${classMap({
		"ml-avatar": true,
		[`ml-avatar--${c.size}`]: true,
		"ml-avatar--rounded": c.rounded
	})}
			role="img"
			aria-label=${c.alt || c.initials || "Avatar"}
		>
			${when(!!c.src && !c._imageError, () => html` <img class="ml-avatar__image" src="${c.src}" alt="${c.alt}" @error=${c.handleImageError} /> `, () => html`${when(!!c.initials, () => html`<span class="ml-avatar__initials">${c.getInitials()}</span>`, () => html`
							<span class="ml-avatar__fallback">
								<slot>
									<ml-icon icon="user" format="fill"></ml-icon>
								</slot>
							</span>
						`)}`)}
		</span>
	`;
}
const avatarStyles = () => css`
	:host {
		display: inline-block;

		/* ── Avatar: colors ── */
		--ml-avatar-bg: var(--ml-color-surface-raised);
		--ml-avatar-color: var(--ml-color-text-muted);
		--ml-avatar-font-weight: var(--ml-font-semibold);
		--ml-avatar-border-color: var(--ml-color-surface);
		--ml-avatar-shadow: var(--ml-shadow-xs);
		--ml-avatar-radius: var(--ml-radius-full);

		/* ── Avatar: fallback icon ── */
		--ml-avatar-fallback-color: var(--ml-color-text-subtle);
	}

	.ml-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background-color: var(--ml-avatar-bg);
		color: var(--ml-avatar-color);
		font-weight: var(--ml-avatar-font-weight);
		vertical-align: middle;
		border-radius: var(--ml-avatar-radius);
		border: 2px solid var(--ml-avatar-border-color);
		box-shadow: var(--ml-avatar-shadow);
	}

	.ml-avatar--rounded {
		border-radius: var(--ml-radius);
	}

	.ml-avatar--xs {
		width: 1.5rem;
		height: 1.5rem;
		font-size: 0.625rem;
		border-width: 1px;
	}

	.ml-avatar--sm {
		width: 2rem;
		height: 2rem;
		font-size: var(--ml-text-xs);
		border-width: 1.5px;
	}

	.ml-avatar--md {
		width: 2.5rem;
		height: 2.5rem;
		font-size: var(--ml-text-sm);
	}

	.ml-avatar--lg {
		width: 3rem;
		height: 3rem;
		font-size: var(--ml-text-base);
	}

	.ml-avatar--xl {
		width: 4rem;
		height: 4rem;
		font-size: var(--ml-text-xl);
		border-width: 3px;
	}

	.ml-avatar--2xl {
		width: 5rem;
		height: 5rem;
		font-size: var(--ml-text-2xl);
		border-width: 3px;
	}

	.ml-avatar__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ml-avatar__initials {
		text-transform: uppercase;
		user-select: none;
		letter-spacing: -0.025em;
	}

	.ml-avatar__fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 60%;
		color: var(--ml-avatar-fallback-color);
	}

	.ml-avatar__fallback svg {
		width: 100%;
		height: 100%;
	}
`;
var AvatarComponent = class AvatarComponent$1 {
	constructor() {
		this.src = "";
		this.alt = "";
		this.initials = "";
		this.size = "md";
		this.rounded = false;
		this._imageError = false;
		this.handleImageError = () => {
			this._imageError = true;
		};
	}
	getInitials() {
		return this.initials.slice(0, 2).toUpperCase();
	}
};
AvatarComponent = __decorate([MelodicComponent({
	selector: "ml-avatar",
	template: avatarTemplate,
	styles: avatarStyles,
	attributes: [
		"src",
		"alt",
		"initials",
		"size",
		"rounded"
	]
})], AvatarComponent);
function badgeTemplate(c) {
	const customStyle = c.color ? `--ml-badge-bg: ${c.color}; --ml-badge-color: #fff` : "";
	return html`
		<span
			class=${classMap({
		"ml-badge": true,
		[`ml-badge--${c.variant}`]: !c.color,
		"ml-badge--custom": !!c.color,
		[`ml-badge--${c.size}`]: true,
		"ml-badge--dot": c.dot,
		"ml-badge--pill": c.pill
	})}
			style=${customStyle}
		>
			${c.dot ? html`<span class="ml-badge__dot"></span>` : ""}
			<slot></slot>
		</span>
	`;
}
const badgeStyles = () => css`
	:host {
		display: inline-block;

		/* ── Badge: base ── */
		--ml-badge-font: var(--ml-font-sans);
		--ml-badge-font-weight: var(--ml-font-medium);
		--ml-badge-radius: var(--ml-radius-md);
		--ml-badge-border-width: var(--ml-border);

		/* ── Badge: pill shape ── */
		--ml-badge-pill-radius: var(--ml-radius-full);

		/* ── Badge: dot ── */
		--ml-badge-dot-size: 0.375rem;
		--ml-badge-dot-size-lg: 0.5rem;

		/* ── Badge: secondary variant ── */
		--ml-badge-secondary-color: var(--ml-color-text-secondary);

		/* ── Badge: custom variant ── */
		--ml-badge-custom-color: var(--ml-badge-color, #fff);
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-badge-font);
		font-weight: var(--ml-badge-font-weight);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-badge-radius);
		border: var(--ml-badge-border-width) solid transparent;
	}

	.ml-badge--pill {
		border-radius: var(--ml-badge-pill-radius);
	}

	.ml-badge__dot {
		width: var(--ml-badge-dot-size);
		height: var(--ml-badge-dot-size);
		border-radius: var(--ml-radius-full);
		background-color: currentColor;
	}

	.ml-badge--lg .ml-badge__dot {
		width: var(--ml-badge-dot-size-lg);
		height: var(--ml-badge-dot-size-lg);
	}

	.ml-badge--sm {
		padding: 2px var(--ml-space-2);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--md {
		padding: var(--ml-space-1) var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--lg {
		padding: var(--ml-space-1) var(--ml-space-4);
		font-size: var(--ml-text-sm);
	}

	.ml-badge--default {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-badge-default-text);
	}

	.ml-badge--primary {
		background-color: var(--ml-badge-primary-bg);
		border-color: var(--ml-badge-primary-border);
		color: var(--ml-badge-primary-text);
	}

	.ml-badge--secondary {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-badge-secondary-color);
	}

	.ml-badge--success {
		background-color: var(--ml-badge-success-bg);
		border-color: var(--ml-badge-success-border);
		color: var(--ml-badge-success-text);
	}

	.ml-badge--warning {
		background-color: var(--ml-badge-warning-bg);
		border-color: var(--ml-badge-warning-border);
		color: var(--ml-badge-warning-text);
	}

	.ml-badge--error {
		background-color: var(--ml-badge-error-bg);
		border-color: var(--ml-badge-error-border);
		color: var(--ml-badge-error-text);
	}

	.ml-badge--custom {
		background-color: var(--ml-badge-bg);
		border-color: transparent;
		color: var(--ml-badge-custom-color);
	}

`;
var BadgeComponent = class BadgeComponent$1 {
	constructor() {
		this.variant = "default";
		this.size = "md";
		this.dot = false;
		this.pill = false;
		this.color = "";
	}
};
BadgeComponent = __decorate([MelodicComponent({
	selector: "ml-badge",
	template: badgeTemplate,
	styles: badgeStyles,
	attributes: [
		"variant",
		"size",
		"dot",
		"pill",
		"color"
	]
})], BadgeComponent);
function badgeGroupTemplate(c) {
	const isTrailing = c.badgePosition === "trailing";
	return html`
		<span
			class=${classMap({
		"ml-badge-group": true,
		"ml-badge-group--pill": c.theme === "pill",
		"ml-badge-group--modern": c.theme === "modern",
		"ml-badge-group--sm": c.size === "sm",
		"ml-badge-group--md": c.size === "md",
		"ml-badge-group--lg": c.size === "lg",
		[`ml-badge-group--${c.variant}`]: true
	})}
		>
			${when(!isTrailing && !!c.label, () => html`<span class="ml-badge-group__label ml-badge-group__label--${c.variant}">${c.label}</span>`)}
			<span class="ml-badge-group__text">
				<slot></slot>
			</span>
			${when(isTrailing && !!c.label, () => html`<span class="ml-badge-group__label ml-badge-group__label--${c.variant}">${c.label}</span>`)}
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm" class="ml-badge-group__icon"></ml-icon>`)}
		</span>
	`;
}
const badgeGroupStyles = () => css`
	:host {
		display: inline-block;

		/* ── Badge Group: base ── */
		--ml-badge-group-font: var(--ml-font-sans);
		--ml-badge-group-font-weight: var(--ml-font-medium);
		--ml-badge-group-gap: var(--ml-space-2);
		--ml-badge-group-border-width: var(--ml-border);

		/* ── Badge Group: shapes ── */
		--ml-badge-group-pill-radius: var(--ml-radius-full);
		--ml-badge-group-modern-radius: var(--ml-radius-md);

		/* ── Badge Group: inner label ── */
		--ml-badge-group-label-bg: var(--ml-color-surface);
		--ml-badge-group-label-radius: var(--ml-radius-full);
		--ml-badge-group-label-modern-radius: var(--ml-radius-sm);
	}

	.ml-badge-group {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-badge-group-gap);
		font-family: var(--ml-badge-group-font);
		font-weight: var(--ml-badge-group-font-weight);
		line-height: 1;
		white-space: nowrap;
		border: var(--ml-badge-group-border-width) solid transparent;
	}

	/* Themes */
	.ml-badge-group--pill {
		border-radius: var(--ml-badge-group-pill-radius);
	}

	.ml-badge-group--modern {
		border-radius: var(--ml-badge-group-modern-radius);
	}

	/* Sizes */
	.ml-badge-group--sm {
		padding: 3px 8px 3px 3px;
		font-size: var(--ml-text-xs);
	}

	.ml-badge-group--md {
		padding: 4px 10px 4px 4px;
		font-size: var(--ml-text-xs);
	}

	.ml-badge-group--lg {
		padding: 4px 12px 4px 4px;
		font-size: var(--ml-text-sm);
	}

	/* Outer container colors */
	.ml-badge-group--default {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-badge-default-text);
	}

	.ml-badge-group--primary {
		background-color: var(--ml-badge-primary-bg);
		border-color: var(--ml-badge-primary-border);
		color: var(--ml-badge-primary-text);
	}

	.ml-badge-group--success {
		background-color: var(--ml-badge-success-bg);
		border-color: var(--ml-badge-success-border);
		color: var(--ml-badge-success-text);
	}

	.ml-badge-group--warning {
		background-color: var(--ml-badge-warning-bg);
		border-color: var(--ml-badge-warning-border);
		color: var(--ml-badge-warning-text);
	}

	.ml-badge-group--error {
		background-color: var(--ml-badge-error-bg);
		border-color: var(--ml-badge-error-border);
		color: var(--ml-badge-error-text);
	}

	/* Inner label badge */
	.ml-badge-group__label {
		display: inline-flex;
		align-items: center;
		padding: 2px var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-badge-group-font-weight);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-badge-group-label-radius);
	}

	.ml-badge-group--modern .ml-badge-group__label {
		border-radius: var(--ml-badge-group-label-modern-radius);
	}

	/* Inner label colors - slightly stronger than the outer bg */
	.ml-badge-group__label--default {
		background-color: var(--ml-badge-group-label-bg);
		color: var(--ml-badge-default-text);
		border: 1px solid var(--ml-badge-default-border);
	}

	.ml-badge-group__label--primary {
		background-color: var(--ml-badge-group-label-bg);
		color: var(--ml-badge-primary-text);
		border: 1px solid var(--ml-badge-primary-border);
	}

	.ml-badge-group__label--success {
		background-color: var(--ml-badge-group-label-bg);
		color: var(--ml-badge-success-text);
		border: 1px solid var(--ml-badge-success-border);
	}

	.ml-badge-group__label--warning {
		background-color: var(--ml-badge-group-label-bg);
		color: var(--ml-badge-warning-text);
		border: 1px solid var(--ml-badge-warning-border);
	}

	.ml-badge-group__label--error {
		background-color: var(--ml-badge-group-label-bg);
		color: var(--ml-badge-error-text);
		border: 1px solid var(--ml-badge-error-border);
	}

	/* Text */
	.ml-badge-group__text {
		display: inline-flex;
		align-items: center;
	}

	/* Icon */
	.ml-badge-group__icon {
		display: inline-flex;
		flex-shrink: 0;
	}
`;
var BadgeGroupComponent = class BadgeGroupComponent$1 {
	constructor() {
		this.label = "";
		this.variant = "default";
		this.theme = "pill";
		this.size = "md";
		this.badgePosition = "leading";
		this.icon = "";
	}
};
BadgeGroupComponent = __decorate([MelodicComponent({
	selector: "ml-badge-group",
	template: badgeGroupTemplate,
	styles: badgeGroupStyles,
	attributes: [
		"label",
		"variant",
		"theme",
		"size",
		"badge-position",
		"icon"
	]
})], BadgeGroupComponent);
function tagTemplate(c) {
	const avatarSrc = c["avatar-src"];
	const dotColor = c["dot-color"];
	return html`
		<span
			class=${classMap({
		"ml-tag": true,
		[`ml-tag--${c.size}`]: true,
		"ml-tag--disabled": c.disabled
	})}
		>
			${c.checkable ? html`
				<button
					class=${classMap({
		"ml-tag__checkbox": true,
		"ml-tag__checkbox--checked": c.checked
	})}
					type="button"
					role="checkbox"
					aria-checked=${c.checked ? "true" : "false"}
					.disabled=${c.disabled}
					@click=${c.handleCheck}
				>
					${c.checked ? html`
						<svg viewBox="0 0 12 12" fill="none">
							<path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					` : ""}
				</button>
			` : ""}
			${c.icon ? html`<ml-icon class="ml-tag__icon" icon=${c.icon} size="sm"></ml-icon>` : ""}
			${avatarSrc ? html`<img class="ml-tag__avatar" src=${avatarSrc} alt="" />` : ""}
			${c.dot ? html`<span class=${classMap({
		"ml-tag__dot": true,
		[`ml-tag__dot--${dotColor}`]: true
	})}></span>` : ""}
			<span class="ml-tag__content"><slot></slot></span>
			${c.count ? html`<span class="ml-tag__count">${c.count}</span>` : ""}
			${c.closable ? html`
				<button
					class="ml-tag__close"
					type="button"
					aria-label="Remove"
					.disabled=${c.disabled}
					@click=${c.handleClose}
				>
					<ml-icon icon="x" size="sm"></ml-icon>
				</button>
			` : ""}
		</span>
	`;
}
const tagStyles = () => css`
	:host {
		display: inline-block;

		/* ── Tag: base ── */
		--ml-tag-font: var(--ml-font-sans);
		--ml-tag-font-weight: var(--ml-font-medium);
		--ml-tag-radius: var(--ml-radius-md);
		--ml-tag-border-width: var(--ml-border);
		--ml-tag-border-color: var(--ml-color-border);
		--ml-tag-bg: var(--ml-color-surface);
		--ml-tag-color: var(--ml-color-text);

		/* ── Tag: dot colors ── */
		--ml-tag-dot-success: var(--ml-color-success);
		--ml-tag-dot-warning: var(--ml-color-warning);
		--ml-tag-dot-danger: var(--ml-color-danger);
		--ml-tag-dot-info: var(--ml-color-info);
		--ml-tag-dot-primary: var(--ml-color-primary);
		--ml-tag-dot-secondary: var(--ml-color-secondary);

		/* ── Tag: count ── */
		--ml-tag-count-color: var(--ml-color-text-secondary);

		/* ── Tag: close button ── */
		--ml-tag-close-color: var(--ml-color-text-muted);
		--ml-tag-close-hover-color: var(--ml-color-text-secondary);
		--ml-tag-close-active-color: var(--ml-color-text);

		/* ── Tag: checkbox ── */
		--ml-tag-checkbox-border: var(--ml-color-border-strong);
		--ml-tag-checkbox-bg: var(--ml-color-surface);
		--ml-tag-checkbox-checked-bg: var(--ml-color-primary);
		--ml-tag-checkbox-checked-border: var(--ml-color-primary);
		--ml-tag-checkbox-hover-border: var(--ml-color-primary);
		--ml-tag-checkbox-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-tag-checkbox-checked-hover-border: var(--ml-color-primary-hover);

		/* ── Tag: disabled ── */
		--ml-tag-disabled-opacity: 0.5;
	}

	.ml-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-tag-font);
		font-weight: var(--ml-tag-font-weight);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-tag-radius);
		border: var(--ml-tag-border-width) solid var(--ml-tag-border-color);
		background-color: var(--ml-tag-bg);
		color: var(--ml-tag-color);
	}

	/* Sizes */
	.ml-tag--sm {
		padding: var(--ml-space-0-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
	}

	.ml-tag--md {
		padding: var(--ml-space-1) var(--ml-space-2-5);
		font-size: var(--ml-text-sm);
	}

	.ml-tag--lg {
		padding: var(--ml-space-1-5) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	/* Dot indicator */
	.ml-tag__dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--ml-radius-full);
		flex-shrink: 0;
	}

	.ml-tag--sm .ml-tag__dot {
		width: 0.375rem;
		height: 0.375rem;
	}

	.ml-tag__dot--success {
		background-color: var(--ml-tag-dot-success);
	}

	.ml-tag__dot--warning {
		background-color: var(--ml-tag-dot-warning);
	}

	.ml-tag__dot--danger {
		background-color: var(--ml-tag-dot-danger);
	}

	.ml-tag__dot--info {
		background-color: var(--ml-tag-dot-info);
	}

	.ml-tag__dot--primary {
		background-color: var(--ml-tag-dot-primary);
	}

	.ml-tag__dot--secondary {
		background-color: var(--ml-tag-dot-secondary);
	}

	/* Avatar */
	.ml-tag__avatar {
		width: 1rem;
		height: 1rem;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
	}

	.ml-tag--sm .ml-tag__avatar {
		width: 0.875rem;
		height: 0.875rem;
	}

	.ml-tag--lg .ml-tag__avatar {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Icon */
	.ml-tag__icon {
		flex-shrink: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
	}

	/* Content */
	.ml-tag__content {
		display: inline-flex;
		align-items: center;
	}

	/* Count */
	.ml-tag__count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: inherit;
		font-weight: var(--ml-tag-font-weight);
		color: var(--ml-tag-count-color);
	}

	/* Close button */
	.ml-tag__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0;
		margin-right: calc(var(--ml-space-1) * -1);
		border: none;
		background: none;
		color: var(--ml-tag-close-color);
		cursor: pointer;
		border-radius: var(--ml-radius-sm);
		transition: color 0.15s ease;
		line-height: 0;
	}

	.ml-tag__close:hover {
		color: var(--ml-tag-close-hover-color);
	}

	.ml-tag__close:active {
		color: var(--ml-tag-close-active-color);
	}

	/* Checkbox */
	.ml-tag__checkbox {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		padding: 0;
		margin: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
		border: var(--ml-tag-border-width) solid var(--ml-tag-checkbox-border);
		border-radius: var(--ml-radius-sm);
		background: var(--ml-tag-checkbox-bg);
		cursor: pointer;
		flex-shrink: 0;
		transition: background-color 0.15s ease, border-color 0.15s ease;
		color: white;
	}

	.ml-tag--sm .ml-tag__checkbox {
		width: 0.875rem;
		height: 0.875rem;
	}

	.ml-tag--lg .ml-tag__checkbox {
		width: 1.125rem;
		height: 1.125rem;
	}

	.ml-tag__checkbox svg {
		width: 0.75rem;
		height: 0.75rem;
	}

	.ml-tag__checkbox--checked {
		background-color: var(--ml-tag-checkbox-checked-bg);
		border-color: var(--ml-tag-checkbox-checked-border);
	}

	.ml-tag__checkbox:hover {
		border-color: var(--ml-tag-checkbox-hover-border);
	}

	.ml-tag__checkbox--checked:hover {
		background-color: var(--ml-tag-checkbox-checked-hover-bg);
		border-color: var(--ml-tag-checkbox-checked-hover-border);
	}

	/* Disabled state */
	.ml-tag--disabled {
		opacity: var(--ml-tag-disabled-opacity);
		pointer-events: none;
	}
`;
var TagComponent = class TagComponent$1 {
	constructor() {
		this.size = "md";
		this.dot = false;
		this["dot-color"] = "success";
		this.closable = false;
		this["avatar-src"] = "";
		this.icon = "";
		this.count = "";
		this.checkable = false;
		this.checked = false;
		this.disabled = false;
		this.handleClose = (event) => {
			event.stopPropagation();
			if (this.disabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
				bubbles: true,
				composed: true
			}));
		};
		this.handleCheck = (event) => {
			event.stopPropagation();
			if (this.disabled) return;
			this.checked = !this.checked;
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			}));
		};
	}
};
TagComponent = __decorate([MelodicComponent({
	selector: "ml-tag",
	template: tagTemplate,
	styles: tagStyles,
	attributes: [
		"size",
		"dot",
		"dot-color",
		"closable",
		"avatar-src",
		"icon",
		"count",
		"checkable",
		"checked",
		"disabled"
	]
})], TagComponent);
function listTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-list": true,
		[`ml-list--${c.variant}`]: true,
		[`ml-list--${c.size}`]: true
	})}
			role="list"
		>
			<slot></slot>
		</div>
	`;
}
const listStyles = () => css`
	:host {
		display: block;

		/* ── List: divider ── */
		--ml-list-divider-width: var(--ml-border);
		--ml-list-divider-color: var(--ml-color-border);
	}

	.ml-list {
		display: flex;
		flex-direction: column;
	}

	/* Size variants — set CSS variable consumed by ml-list-item */
	.ml-list--sm {
		--_ml-list-padding: var(--ml-space-2) 0;
	}

	.ml-list--md {
		--_ml-list-padding: var(--ml-space-3) 0;
	}

	.ml-list--lg {
		--_ml-list-padding: var(--ml-space-4) 0;
	}

	/* Default variant: dividers between items */
	.ml-list--default ::slotted(ml-list-item:not(:last-of-type)) {
		border-bottom: var(--ml-list-divider-width) solid var(--ml-list-divider-color);
	}
`;
var ListComponent = class ListComponent$1 {
	constructor() {
		this.variant = "default";
		this.size = "md";
	}
};
ListComponent = __decorate([MelodicComponent({
	selector: "ml-list",
	template: listTemplate,
	styles: listStyles,
	attributes: ["variant", "size"]
})], ListComponent);
function listItemTemplate(c) {
	return html`
		<div class="ml-li" role="listitem">
			${when(c.hasLeadingSlot, () => html`
					<div class="ml-li__leading">
						<slot name="leading"></slot>
					</div>
				`)}
			<div class="ml-li__content">
				${when(!!c.primary, () => html`<span class="ml-li__primary">${c.primary}</span>`)}
				${when(!!c.secondary, () => html`<span class="ml-li__secondary">${c.secondary}</span>`)}
				<slot></slot>
			</div>
			${when(c.hasTrailingSlot, () => html`
					<div class="ml-li__trailing">
						<slot name="trailing"></slot>
					</div>
				`)}
		</div>
	`;
}
const listItemStyles = () => css`
	:host {
		display: block;

		/* ── List Item: spacing ── */
		--ml-list-item-padding: var(--_ml-list-padding, var(--ml-space-3) 0);
		--ml-list-item-gap: var(--ml-space-3);

		/* ── List Item: primary text ── */
		--ml-list-item-primary-font: var(--ml-font-sans);
		--ml-list-item-primary-size: var(--ml-text-sm);
		--ml-list-item-primary-weight: var(--ml-font-semibold);
		--ml-list-item-primary-color: var(--ml-color-text);

		/* ── List Item: secondary text ── */
		--ml-list-item-secondary-font: var(--ml-font-sans);
		--ml-list-item-secondary-size: var(--ml-text-xs);
		--ml-list-item-secondary-color: var(--ml-color-text-secondary);

		/* ── List Item: interactive states ── */
		--ml-list-item-hover-bg: var(--ml-color-bg-secondary);
		--ml-list-item-focus-color: var(--ml-color-primary);
		--ml-list-item-focus-radius: var(--ml-radius-md);
		--ml-list-item-disabled-opacity: 0.5;

		padding: var(--ml-list-item-padding);
	}

	:host([disabled]) {
		opacity: var(--ml-list-item-disabled-opacity);
		pointer-events: none;
	}

	:host([interactive]) {
		cursor: pointer;
	}

	:host([interactive]:hover) {
		background-color: var(--ml-list-item-hover-bg);
	}

	:host([interactive]:focus-visible) {
		outline: 2px solid var(--ml-list-item-focus-color);
		outline-offset: -2px;
		border-radius: var(--ml-list-item-focus-radius);
	}

	:host([interactive]) .ml-li {
		padding-inline: var(--ml-space-3);
	}

	.ml-li {
		display: flex;
		align-items: center;
		gap: var(--ml-list-item-gap);
	}

	.ml-li__leading {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-li__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-li__primary {
		font-family: var(--ml-list-item-primary-font);
		font-size: var(--ml-list-item-primary-size);
		font-weight: var(--ml-list-item-primary-weight);
		color: var(--ml-list-item-primary-color);
		line-height: var(--ml-leading-normal);
	}

	.ml-li__secondary {
		font-family: var(--ml-list-item-secondary-font);
		font-size: var(--ml-list-item-secondary-size);
		color: var(--ml-list-item-secondary-color);
		line-height: var(--ml-leading-normal);
	}

	.ml-li__trailing {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
	}
`;
var ListItemComponent = class ListItemComponent$1 {
	constructor() {
		this.primary = "";
		this.secondary = "";
		this.disabled = false;
		this.interactive = false;
	}
	get hasLeadingSlot() {
		return this.elementRef?.querySelector("[slot=\"leading\"]") !== null;
	}
	get hasTrailingSlot() {
		return this.elementRef?.querySelector("[slot=\"trailing\"]") !== null;
	}
};
ListItemComponent = __decorate([MelodicComponent({
	selector: "ml-list-item",
	template: listItemTemplate,
	styles: listItemStyles,
	attributes: [
		"primary",
		"secondary",
		"disabled",
		"interactive"
	]
})], ListItemComponent);
function activityFeedTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-activity-feed": true,
		[`ml-activity-feed--${c.variant}`]: true
	})}
			role="feed"
		>
			<slot></slot>
		</div>
	`;
}
const activityFeedStyles = () => css`
	:host {
		display: block;

		/* ── Activity Feed: list divider ── */
		--ml-activity-feed-divider-width: var(--ml-border);
		--ml-activity-feed-divider-color: var(--ml-color-border);
	}

	.ml-activity-feed {
		display: flex;
		flex-direction: column;
	}

	/* List variant: dividers between items */
	.ml-activity-feed--list ::slotted(ml-activity-feed-item:not(:last-of-type)) {
		border-bottom: var(--ml-activity-feed-divider-width) solid var(--ml-activity-feed-divider-color);
	}

	/* Timeline variant: connector line, no dividers */
	.ml-activity-feed--timeline {
		--_ml-af-line-display: block;
	}

	.ml-activity-feed--timeline ::slotted(ml-activity-feed-item:last-of-type) {
		--_ml-af-line-display: none;
	}
`;
var ActivityFeedComponent = class ActivityFeedComponent$1 {
	constructor() {
		this.variant = "list";
	}
};
ActivityFeedComponent = __decorate([MelodicComponent({
	selector: "ml-activity-feed",
	template: activityFeedTemplate,
	styles: activityFeedStyles,
	attributes: ["variant"]
})], ActivityFeedComponent);
function activityFeedItemTemplate(c) {
	return html`
		<article class="ml-afi">
			<div class="ml-afi__left">
				<div class="ml-afi__avatar">
					${when(c.hasAvatarSlot, () => html`<slot name="avatar"></slot>`, () => html`
							<ml-avatar
								size=${c["avatar-size"]}
								src=${c["avatar-src"]}
								initials=${c["avatar-initials"]}
							></ml-avatar>
						`)}
				</div>
				<div class="ml-afi__connector"></div>
			</div>
			<div class="ml-afi__body">
				<div class="ml-afi__header">
					<div class="ml-afi__meta">
						${when(!!c.name, () => html`<span class="ml-afi__name">${c.name}</span>`)}
						${when(!!c.timestamp, () => html`<span class="ml-afi__timestamp">${c.timestamp}</span>`)}
					</div>
					${when(c.indicator, () => html`
							<span
								class=${classMap({
		"ml-afi__indicator": true,
		[`ml-afi__indicator--${c["indicator-color"]}`]: c.isPresetColor
	})}
								style=${c.isPresetColor ? "" : `--ml-afi-indicator-bg: ${c["indicator-color"]}`}
							></span>
						`)}
				</div>
				${when(!!c.subtitle, () => html`<div class="ml-afi__subtitle">${c.subtitle}</div>`)}
				<div class="ml-afi__description">
					<slot></slot>
				</div>
				${when(c.hasContentSlot, () => html`
						<div class="ml-afi__content">
							<slot name="content"></slot>
						</div>
					`)}
			</div>
		</article>
	`;
}
const activityFeedItemStyles = () => css`
	:host {
		display: block;

		/* ── Activity Feed Item: spacing ── */
		--ml-activity-feed-item-padding: var(--ml-space-4) 0;
		--ml-activity-feed-item-gap: var(--ml-space-3);

		/* ── Activity Feed Item: connector ── */
		--ml-activity-feed-item-connector-color: var(--ml-color-border);
		--ml-activity-feed-item-connector-width: 2px;
		--ml-activity-feed-item-connector-radius: var(--ml-radius-full);
		--ml-activity-feed-item-connector-spacing: var(--ml-space-2);

		/* ── Activity Feed Item: name ── */
		--ml-activity-feed-item-name-font: var(--ml-font-sans);
		--ml-activity-feed-item-name-size: var(--ml-text-sm);
		--ml-activity-feed-item-name-weight: var(--ml-font-semibold);
		--ml-activity-feed-item-name-color: var(--ml-color-text);

		/* ── Activity Feed Item: timestamp ── */
		--ml-activity-feed-item-timestamp-font: var(--ml-font-sans);
		--ml-activity-feed-item-timestamp-size: var(--ml-text-xs);
		--ml-activity-feed-item-timestamp-color: var(--ml-color-text-tertiary);

		/* ── Activity Feed Item: subtitle ── */
		--ml-activity-feed-item-subtitle-font: var(--ml-font-sans);
		--ml-activity-feed-item-subtitle-size: var(--ml-text-xs);
		--ml-activity-feed-item-subtitle-color: var(--ml-color-text-secondary);

		/* ── Activity Feed Item: description ── */
		--ml-activity-feed-item-description-font: var(--ml-font-sans);
		--ml-activity-feed-item-description-size: var(--ml-text-sm);
		--ml-activity-feed-item-description-color: var(--ml-color-text-secondary);
		--ml-activity-feed-item-description-line-height: var(--ml-leading-relaxed);

		/* ── Activity Feed Item: description link ── */
		--ml-activity-feed-item-link-color: var(--ml-color-primary);
		--ml-activity-feed-item-link-weight: var(--ml-font-medium);

		/* ── Activity Feed Item: indicator ── */
		--ml-activity-feed-item-indicator-size: 8px;
		--ml-activity-feed-item-indicator-radius: var(--ml-radius-full);

		/* ── Activity Feed Item: indicator colors ── */
		--ml-activity-feed-item-indicator-gray: var(--ml-color-text-tertiary);
		--ml-activity-feed-item-indicator-primary: var(--ml-color-primary);
		--ml-activity-feed-item-indicator-success: var(--ml-color-success);
		--ml-activity-feed-item-indicator-warning: var(--ml-color-warning);
		--ml-activity-feed-item-indicator-error: var(--ml-color-error);

		padding: var(--ml-activity-feed-item-padding);
	}

	.ml-afi {
		display: flex;
		gap: var(--ml-activity-feed-item-gap);
	}

	/* Left column: avatar + connector */
	.ml-afi__left {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-afi__avatar {
		position: relative;
		z-index: 1;
	}

	.ml-afi__connector {
		flex: 1;
		width: var(--ml-activity-feed-item-connector-width);
		margin-top: var(--ml-activity-feed-item-connector-spacing);
		background-color: var(--ml-activity-feed-item-connector-color);
		border-radius: var(--ml-activity-feed-item-connector-radius);
		display: var(--_ml-af-line-display, none);
	}

	/* Body */
	.ml-afi__body {
		flex: 1;
		min-width: 0;
	}

	.ml-afi__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-2);
	}

	.ml-afi__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		flex-wrap: wrap;
	}

	.ml-afi__name {
		font-family: var(--ml-activity-feed-item-name-font);
		font-size: var(--ml-activity-feed-item-name-size);
		font-weight: var(--ml-activity-feed-item-name-weight);
		color: var(--ml-activity-feed-item-name-color);
	}

	.ml-afi__timestamp {
		font-family: var(--ml-activity-feed-item-timestamp-font);
		font-size: var(--ml-activity-feed-item-timestamp-size);
		color: var(--ml-activity-feed-item-timestamp-color);
	}

	.ml-afi__subtitle {
		font-family: var(--ml-activity-feed-item-subtitle-font);
		font-size: var(--ml-activity-feed-item-subtitle-size);
		color: var(--ml-activity-feed-item-subtitle-color);
		margin-top: var(--ml-space-0-5);
	}

	.ml-afi__description {
		font-family: var(--ml-activity-feed-item-description-font);
		font-size: var(--ml-activity-feed-item-description-size);
		color: var(--ml-activity-feed-item-description-color);
		line-height: var(--ml-activity-feed-item-description-line-height);
		margin-top: var(--ml-space-1);
	}

	.ml-afi__description ::slotted(a) {
		color: var(--ml-activity-feed-item-link-color);
		text-decoration: none;
		font-weight: var(--ml-activity-feed-item-link-weight);
	}

	.ml-afi__description ::slotted(a:hover) {
		text-decoration: underline;
	}

	.ml-afi__description ::slotted(strong) {
		font-weight: var(--ml-font-semibold);
		color: var(--ml-activity-feed-item-name-color);
	}

	.ml-afi__content {
		margin-top: var(--ml-space-2);
	}

	/* Indicator dot */
	.ml-afi__indicator {
		width: var(--ml-activity-feed-item-indicator-size);
		height: var(--ml-activity-feed-item-indicator-size);
		border-radius: var(--ml-activity-feed-item-indicator-radius);
		flex-shrink: 0;
		background-color: var(--ml-afi-indicator-bg);
	}

	.ml-afi__indicator--gray {
		background-color: var(--ml-activity-feed-item-indicator-gray);
	}

	.ml-afi__indicator--primary {
		background-color: var(--ml-activity-feed-item-indicator-primary);
	}

	.ml-afi__indicator--success {
		background-color: var(--ml-activity-feed-item-indicator-success);
	}

	.ml-afi__indicator--warning {
		background-color: var(--ml-activity-feed-item-indicator-warning);
	}

	.ml-afi__indicator--error {
		background-color: var(--ml-activity-feed-item-indicator-error);
	}
`;
var INDICATOR_PRESETS = new Set([
	"success",
	"warning",
	"error",
	"primary",
	"gray"
]);
var ActivityFeedItemComponent = class ActivityFeedItemComponent$1 {
	constructor() {
		this.name = "";
		this.timestamp = "";
		this["avatar-src"] = "";
		this["avatar-initials"] = "";
		this["avatar-size"] = "sm";
		this.subtitle = "";
		this.indicator = false;
		this["indicator-color"] = "gray";
	}
	get isPresetColor() {
		return INDICATOR_PRESETS.has(this["indicator-color"]);
	}
	get hasAvatarSlot() {
		return this.elementRef?.querySelector("[slot=\"avatar\"]") !== null;
	}
	get hasContentSlot() {
		return this.elementRef?.querySelector("[slot=\"content\"]") !== null;
	}
};
ActivityFeedItemComponent = __decorate([MelodicComponent({
	selector: "ml-activity-feed-item",
	template: activityFeedItemTemplate,
	styles: activityFeedItemStyles,
	attributes: [
		"name",
		"timestamp",
		"avatar-src",
		"avatar-initials",
		"avatar-size",
		"subtitle",
		"indicator",
		"indicator-color"
	]
})], ActivityFeedItemComponent);
function renderCell$1(column, row, index) {
	if (column.render) return column.render(row[column.key], row, index);
	return row[column.key] ?? "";
}
function tableTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-table": true,
		[`ml-table--${c.size}`]: true,
		"ml-table--striped": c.striped,
		"ml-table--hoverable": c.hoverable,
		"ml-table--row-clickable": c._rowClickable,
		"ml-table--sticky-header": c.stickyHeader,
		"ml-table--virtual": c.virtual
	})}>
			${when(!!c.tableTitle || !!c.description, () => html`
				<div class="ml-table__header">
					<div class="ml-table__header-text">
						${when(!!c.tableTitle, () => html`<h3 class="ml-table__title">${c.tableTitle}</h3>`)}
						${when(!!c.description, () => html`<p class="ml-table__description">${c.description}</p>`)}
					</div>
					<slot name="header-actions"></slot>
				</div>
			`)}

			<div class="ml-table__wrapper">
				<table role="grid">
					<thead>
						<tr>
							${when(c.selectable, () => html`
								<th class="ml-table__check-cell">
									<input
										type="checkbox"
										class="ml-table__checkbox"
										.checked=${c.allSelected}
										.indeterminate=${c.someSelected}
										@change=${c.handleSelectAll}
										aria-label="Select all rows"
									/>
								</th>
							`)}
							${repeat(c.columns, (col) => col.key, (col) => html`
								<th
									class=${classMap({
		"ml-table__th": true,
		"ml-table__th--sortable": !!col.sortable,
		"ml-table__th--sorted": c.sortKey === col.key,
		[`ml-table__th--${col.align ?? "left"}`]: true
	})}
									style=${col.width ? `width: ${col.width}` : ""}
									@click=${() => c.handleSort(col)}
									aria-sort=${c.sortKey === col.key ? c.sortDirection === "asc" ? "ascending" : "descending" : "none"}
								>
									<span class="ml-table__th-content">
										${col.label}
										${when(!!col.sortable, () => html`
											<span class="ml-table__sort-icon">
												${c.sortKey === col.key ? c.sortDirection === "asc" ? html`<ml-icon icon="caret-up" size="xs"></ml-icon>` : html`<ml-icon icon="caret-down" size="xs"></ml-icon>` : html`<ml-icon icon="caret-up-down" size="xs"></ml-icon>`}
											</span>
										`)}
									</span>
								</th>
							`)}
						</tr>
					</thead>
					<tbody>
						${when(c.virtual && c.topSpacerHeight > 0, () => html`
							<tr class="ml-table__spacer">
								<td colspan="${c.colCount}" style="height: ${c.topSpacerHeight}px"></td>
							</tr>
						`)}
						${repeat(c.visibleRows, (_, i) => c.startIndex + i, (row, i) => {
		const absoluteIndex = c.startIndex + i;
		return html`
								<tr
									class=${classMap({
			"ml-table__row": true,
			"ml-table__row--selected": c.isRowSelected(absoluteIndex)
		})}
									@click=${() => c.handleRowClick(row, absoluteIndex)}
								>
									${when(c.selectable, () => html`
										<td class="ml-table__check-cell">
											<input
												type="checkbox"
												class="ml-table__checkbox"
												.checked=${c.isRowSelected(absoluteIndex)}
												@change=${(e) => c.handleSelectRow(absoluteIndex, e)}
												@click=${(e) => e.stopPropagation()}
												aria-label=${`Select row ${absoluteIndex + 1}`}
											/>
										</td>
									`)}
									${repeat(c.columns, (col) => col.key, (col) => html`
										<td class=${classMap({
			"ml-table__td": true,
			[`ml-table__td--${col.align ?? "left"}`]: true
		})}>
											${renderCell$1(col, row, absoluteIndex)}
										</td>
									`)}
								</tr>
							`;
	})}
						${when(c.virtual && c.bottomSpacerHeight > 0, () => html`
							<tr class="ml-table__spacer">
								<td colspan="${c.colCount}" style="height: ${c.bottomSpacerHeight}px"></td>
							</tr>
						`)}
					</tbody>
				</table>
			</div>

			<div class=${classMap({
		"ml-table__footer": true,
		"ml-table__footer--visible": c.hasFooter
	})}>
				<slot name="footer"></slot>
			</div>
		</div>
	`;
}
const tableStyles = () => css`
	:host {
		display: block;

		/* ── Table: surface ── */
		--ml-table-bg: var(--ml-color-surface);
		--ml-table-border-width: var(--ml-border);
		--ml-table-border-color: var(--ml-color-border);
		--ml-table-radius: var(--ml-radius-lg);
		--ml-table-font: var(--ml-font-sans);

		/* ── Table: header section ── */
		--ml-table-title-color: var(--ml-color-text);
		--ml-table-description-color: var(--ml-color-text-muted);

		/* ── Table: column header ── */
		--ml-table-header-bg: var(--ml-color-surface-sunken);
		--ml-table-header-color: var(--ml-color-text-muted);
		--ml-table-header-sorted-color: var(--ml-color-text);

		/* ── Table: sort icon ── */
		--ml-table-sort-color: var(--ml-color-text-muted);
		--ml-table-sort-active-color: var(--ml-color-primary);

		/* ── Table: rows ── */
		--ml-table-row-hover-bg: var(--ml-color-surface-sunken);
		--ml-table-row-hover-border-color: transparent;
		--ml-table-row-hover-border-width: 0;
		--ml-table-row-hover-border-left-width: 0;
		--ml-table-row-hover-border-left-color: transparent;
		--ml-table-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
		--ml-table-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.06));
		--ml-table-row-striped-bg: var(--ml-color-surface-sunken);
		--ml-table-row-striped-hover-bg: var(--ml-color-surface-raised);

		/* ── Table: cells ── */
		--ml-table-cell-color: var(--ml-color-text);

		/* ── Table: checkbox ── */
		--ml-table-checkbox-accent: var(--ml-color-primary);
	}

	.ml-table {
		border: var(--ml-table-border-width) solid var(--ml-table-border-color);
		border-radius: var(--ml-table-radius);
		background-color: var(--ml-table-bg);
		overflow: hidden;
		font-family: var(--ml-table-font);
	}

	/* ── Header ── */
	.ml-table__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table__header-text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-table__title {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-table-title-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-table__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-table-description-color);
		line-height: var(--ml-leading-normal);
	}

	/* ── Table wrapper ── */
	.ml-table__wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		border-spacing: 0;
	}

	/* ── Header cells ── */
	thead {
		background-color: var(--ml-table-header-bg);
	}

	.ml-table--sticky-header thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	thead tr {
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table__th {
		padding: var(--ml-space-3) var(--ml-space-6);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-table-header-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
		white-space: nowrap;
		user-select: none;
	}

	.ml-table--sm .ml-table__th {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-table__th--center { text-align: center; }
	.ml-table__th--right { text-align: right; }

	.ml-table__th--sortable {
		cursor: pointer;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__th--sortable:hover {
		color: var(--ml-table-header-sorted-color);
	}

	.ml-table__th--sorted {
		color: var(--ml-table-header-sorted-color);
	}

	.ml-table__th-content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-table__sort-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--ml-table-sort-color);
	}

	.ml-table__th--sorted .ml-table__sort-icon {
		color: var(--ml-table-sort-active-color);
	}

	/* ── Body rows ── */
	.ml-table__row {
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__row:last-child {
		border-bottom: none;
	}

	.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-hover-bg);
		border-color: var(--ml-table-row-hover-border-color);
		border-width: var(--ml-table-row-hover-border-width);
		border-style: solid;
		border-left-width: var(--ml-table-row-hover-border-left-width);
		border-left-color: var(--ml-table-row-hover-border-left-color);
	}

	.ml-table--row-clickable .ml-table__row {
		cursor: pointer;
	}

	.ml-table__row--selected {
		background-color: var(--ml-table-row-selected-bg);
	}

	.ml-table--hoverable .ml-table__row--selected:hover {
		background-color: var(--ml-table-row-selected-hover-bg);
	}

	/* Striped */
	.ml-table--striped .ml-table__row:nth-child(even) {
		background-color: var(--ml-table-row-striped-bg);
	}

	.ml-table--striped.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-striped-hover-bg);
	}

	/* ── Body cells ── */
	.ml-table__td {
		padding: var(--ml-space-4) var(--ml-space-6);
		font-size: var(--ml-text-sm);
		color: var(--ml-table-cell-color);
		vertical-align: middle;
	}

	.ml-table--sm .ml-table__td {
		padding: var(--ml-space-2-5) var(--ml-space-4);
		font-size: var(--ml-text-xs);
	}

	.ml-table__td--center { text-align: center; }
	.ml-table__td--right { text-align: right; }

	/* ── Checkbox column ── */
	.ml-table__check-cell {
		width: 2.5rem;
		padding: var(--ml-space-3) var(--ml-space-3) var(--ml-space-3) var(--ml-space-6);
		vertical-align: middle;
		text-align: center;
	}

	.ml-table--sm .ml-table__check-cell {
		padding: var(--ml-space-2) var(--ml-space-2) var(--ml-space-2) var(--ml-space-4);
	}

	.ml-table__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-table-checkbox-accent);
		cursor: pointer;
		margin: 0;
		vertical-align: middle;
	}

	/* ── Virtual scroll ── */
	/* Host fills parent container so height: 100% resolves correctly */
	:host([virtual]) {
		height: 100%;
	}

	/* Flex column so the wrapper can take remaining space after header/footer */
	.ml-table--virtual {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.ml-table--virtual .ml-table__wrapper {
		flex: 1;
		min-height: 0; /* lets flex child shrink below content height */
		overflow-y: auto;
	}

	.ml-table--virtual .ml-table__td {
		height: 44px;
		padding-top: 0;
		padding-bottom: 0;
		box-sizing: border-box;
	}

	.ml-table--virtual.ml-table--sm .ml-table__td {
		height: 36px;
	}

	.ml-table__spacer td {
		padding: 0;
		border: none;
	}

	/* ── Footer ── */
	.ml-table__footer {
		display: none;
	}

	.ml-table__footer--visible {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table--sm .ml-table__footer--visible {
		padding: var(--ml-space-2) var(--ml-space-4);
	}
`;
var _rowClickTargets = /* @__PURE__ */ new WeakSet();
var _origAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
	if (type === "ml:row-click") _rowClickTargets.add(this);
	_origAddEventListener.call(this, type, listener, options);
};
var TableComponent = class TableComponent$1 {
	constructor() {
		this._rowClickable = false;
		this.hasFooter = false;
		this.hasHeaderActions = false;
		this.selectable = false;
		this.striped = false;
		this.hoverable = true;
		this.stickyHeader = false;
		this.size = "md";
		this.tableTitle = "";
		this.description = "";
		this.virtual = false;
		this.columns = [];
		this.rows = [];
		this.sortKey = "";
		this.sortDirection = "asc";
		this.selectedIndices = [];
		this.startIndex = 0;
		this.endIndex = 50;
		this._scroller = new VirtualScroller();
		this._viewport = null;
		this.isRowSelected = (index) => {
			return this.selectedIndices.includes(index);
		};
		this.handleSort = (column) => {
			if (!column.sortable) return;
			if (this.sortKey === column.key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
			else {
				this.sortKey = column.key;
				this.sortDirection = "asc";
			}
			this.selectedIndices = [];
			this._scroller.invalidate();
			this.elementRef.dispatchEvent(new CustomEvent("ml:sort", {
				bubbles: true,
				composed: true,
				detail: {
					key: this.sortKey,
					direction: this.sortDirection
				}
			}));
		};
		this.handleSelectAll = () => {
			if (this.allSelected) this.selectedIndices = [];
			else this.selectedIndices = this.rows.map((_, i) => i);
			this.emitSelect();
		};
		this.handleSelectRow = (index, event) => {
			event.stopPropagation();
			if (this.selectedIndices.includes(index)) this.selectedIndices = this.selectedIndices.filter((i) => i !== index);
			else this.selectedIndices = [...this.selectedIndices, index];
			this.emitSelect();
		};
		this.handleRowClick = (row, index) => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:row-click", {
				bubbles: true,
				composed: true,
				detail: {
					row,
					index
				}
			}));
		};
	}
	get rowHeight() {
		return this.size === "sm" ? 36 : 44;
	}
	onPropertyChange(name, _oldVal, _newVal) {
		if (name === "rows" || name === "columns") this._scroller.invalidate();
	}
	onInit() {
		this._rowClickable = _rowClickTargets.has(this.elementRef);
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		shadow.querySelectorAll("slot").forEach((slot) => {
			slot.addEventListener("slotchange", () => {
				const name = slot.getAttribute("name");
				if (name === "footer") this.hasFooter = slot.assignedNodes().length > 0;
				else if (name === "header-actions") this.hasHeaderActions = slot.assignedNodes().length > 0;
			});
		});
		this._attachScroller();
	}
	onRender() {
		this._attachScroller();
		if (this.virtual && this._viewport && this._viewport.clientHeight === 0 && this.sortedRows.length > 0) {
			const approxEnd = Math.min(this.sortedRows.length, Math.ceil(600 / this.rowHeight) + 6);
			if (approxEnd !== this.endIndex) this.endIndex = approxEnd;
		}
		if (!this.virtual) {
			const total = this.sortedRows.length;
			if (this.endIndex !== total) this.endIndex = total;
		}
	}
	onDestroy() {
		this._scroller.detach();
		this._viewport = null;
	}
	_attachScroller() {
		if (this._viewport) return;
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		this._viewport = shadow.querySelector(".ml-table__wrapper");
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this.rowHeight,
			itemCount: () => this.sortedRows.length,
			onUpdate: (start, end) => {
				this.startIndex = start;
				this.endIndex = end;
			},
			enabled: () => this.virtual
		});
	}
	get sortedRows() {
		if (!this.sortKey) return this.rows;
		const key = this.sortKey;
		const dir = this.sortDirection === "asc" ? 1 : -1;
		return [...this.rows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal === void 0 || aVal === null) return bVal === void 0 || bVal === null ? 0 : 1;
			if (bVal === void 0 || bVal === null) return -1;
			if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
	}
	get visibleRows() {
		if (!this.virtual) return this.sortedRows;
		return this.sortedRows.slice(this.startIndex, this.endIndex);
	}
	get topSpacerHeight() {
		return this.virtual ? this.startIndex * this.rowHeight : 0;
	}
	get bottomSpacerHeight() {
		if (!this.virtual) return 0;
		return Math.max(0, (this.sortedRows.length - this.endIndex) * this.rowHeight);
	}
	get colCount() {
		return this.columns.length + (this.selectable ? 1 : 0);
	}
	get allSelected() {
		return this.rows.length > 0 && this.selectedIndices.length === this.rows.length;
	}
	get someSelected() {
		return this.selectedIndices.length > 0 && !this.allSelected;
	}
	emitSelect() {
		this.elementRef.dispatchEvent(new CustomEvent("ml:select", {
			bubbles: true,
			composed: true,
			detail: {
				selectedRows: this.selectedIndices,
				allSelected: this.allSelected
			}
		}));
	}
};
TableComponent = __decorate([MelodicComponent({
	selector: "ml-table",
	template: tableTemplate,
	styles: tableStyles,
	attributes: [
		"selectable",
		"striped",
		"hoverable",
		"size",
		"table-title",
		"description",
		"sticky-header",
		"virtual"
	]
})], TableComponent);
function renderCell(col, row, index) {
	if (col.render) return col.render(row[col.key], row, index);
	const val = row[col.key];
	return val == null ? "" : val;
}
function dataGridTemplate(c) {
	const gtc = c.gridTemplateColumns;
	const totalW = c.totalGridWidth;
	return html`
		<div class=${classMap({
		"ml-data-grid": true,
		[`ml-data-grid--${c.size}`]: true,
		"ml-data-grid--striped": c.striped,
		"ml-data-grid--hoverable": c.hoverable,
		"ml-data-grid--selectable": c.selectable,
		"ml-data-grid--virtual": c.virtual
	})}>

			${when(!!c.gridTitle || !!c.description, () => html`
				<div class="ml-data-grid__toolbar">
					<div class="ml-data-grid__toolbar-text">
						${when(!!c.gridTitle, () => html`<h3 class="ml-data-grid__title">${c.gridTitle}</h3>`)}
						${when(!!c.description, () => html`<p class="ml-data-grid__description">${c.description}</p>`)}
					</div>
					<slot name="toolbar-actions"></slot>
				</div>
			`)}

			<div class="ml-data-grid__viewport">
				<div class="ml-data-grid__inner" style="min-width: ${totalW}px">

					<!-- Header row -->
					<div class="ml-data-grid__header-row" style="grid-template-columns: ${gtc}">
						${when(c.selectable, () => html`
							<div class="ml-data-grid__th ml-data-grid__check-cell">
								<input
									type="checkbox"
									class="ml-data-grid__checkbox"
									.checked=${c.allSelected}
									.indeterminate=${c.someSelected}
									@change=${c.handleSelectAll}
									aria-label="Select all rows"
								/>
							</div>
						`)}
						${repeat(c.orderedColumns, (col) => col.key, (col) => html`
							<div
								class=${classMap({
		"ml-data-grid__th": true,
		[`ml-data-grid__th--${col.align ?? "left"}`]: true,
		"ml-data-grid__th--sortable": !!col.sortable,
		"ml-data-grid__th--sorted": c.sortKey === col.key,
		"ml-data-grid__th--pinned-left": col.pinned === "left",
		"ml-data-grid__th--pinned-right": col.pinned === "right",
		"ml-data-grid__th--drag-over": c.dragOverKey === col.key,
		"ml-data-grid__th--dragging": c.draggingKey === col.key,
		"ml-data-grid__th--resizing": c.resizingKey === col.key
	})}
								style=${col.pinned === "left" ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ""}
								draggable=${col.reorderable !== false ? "true" : "false"}
								@dragstart=${(e) => c.handleDragStart(col.key, e)}
								@dragover=${(e) => c.handleDragOver(col.key, e)}
								@dragend=${c.handleDragEnd}
								@drop=${() => c.handleDrop(col.key)}
								@click=${() => c.handleSort(col)}
								aria-sort=${c.sortKey === col.key ? c.sortDirection === "asc" ? "ascending" : "descending" : "none"}
							>
								<span class="ml-data-grid__th-content">
									${col.label}
									${when(!!col.sortable, () => html`
										<span class="ml-data-grid__sort-icon">
											${c.sortKey === col.key ? c.sortDirection === "asc" ? html`<ml-icon icon="caret-up" size="xs"></ml-icon>` : html`<ml-icon icon="caret-down" size="xs"></ml-icon>` : html`<ml-icon icon="caret-up-down" size="xs"></ml-icon>`}
										</span>
									`)}
								</span>
								${when(col.resizable !== false, () => html`
									<div
										class="ml-data-grid__resize-handle"
										@pointerdown=${(e) => c.handleResizeStart(col.key, e)}
										@pointermove=${(e) => c.handleResizeMove(col.key, e)}
										@pointerup=${c.handleResizeEnd}
									></div>
								`)}
							</div>
						`)}
					</div>

					<!-- Filter row -->
					${when(c.showFilterRow, () => html`
						<div class="ml-data-grid__filter-row" style="grid-template-columns: ${gtc}">
							${when(c.selectable, () => html`
								<div class="ml-data-grid__filter-cell ml-data-grid__check-cell"></div>
							`)}
							${repeat(c.orderedColumns, (col) => col.key, (col) => html`
								<div
									class=${classMap({
		"ml-data-grid__filter-cell": true,
		"ml-data-grid__filter-cell--pinned-left": col.pinned === "left"
	})}
									style=${col.pinned === "left" ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ""}
								>
									${when(!!col.filterable, () => html`
										<input
											type="text"
											class="ml-data-grid__filter-input"
											placeholder="Filter..."
											.value=${c.filters[col.key] ?? ""}
											@input=${(e) => c.handleFilterInput(col.key, e)}
										/>
									`)}
								</div>
							`)}
						</div>
					`)}

					<!-- Virtual top spacer -->
					${when(c.virtual && c.topSpacerHeight > 0, () => html`
						<div class="ml-data-grid__top-spacer" style="height: ${c.topSpacerHeight}px"></div>
					`)}

					<!-- Data rows -->
					${repeat(c.visibleRows, (_, i) => c.startIndex + i, (row, i) => html`
							<div
								class=${classMap({
		"ml-data-grid__row": true,
		"ml-data-grid__row--selected": c.isRowSelected(c.startIndex + i),
		"ml-data-grid__row--even": (c.startIndex + i) % 2 === 1
	})}
								style="grid-template-columns: ${gtc}"
								@click=${() => c.handleRowClick(row, c.startIndex + i)}
							>
								${when(c.selectable, () => html`
									<div class="ml-data-grid__td ml-data-grid__check-cell">
										<input
											type="checkbox"
											class="ml-data-grid__checkbox"
											.checked=${c.isRowSelected(c.startIndex + i)}
											@change=${(e) => c.handleSelectRow(c.startIndex + i, e)}
											@click=${(e) => e.stopPropagation()}
											aria-label=${`Select row ${c.startIndex + i + 1}`}
										/>
									</div>
								`)}
								${repeat(c.orderedColumns, (col) => col.key, (col) => html`
									<div
										class=${classMap({
		"ml-data-grid__td": true,
		[`ml-data-grid__td--${col.align ?? "left"}`]: true,
		"ml-data-grid__td--pinned-left": col.pinned === "left",
		"ml-data-grid__td--pinned-right": col.pinned === "right"
	})}
										style=${col.pinned === "left" ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ""}
									>
										${renderCell(col, row, c.startIndex + i)}
									</div>
								`)}
							</div>
						`)}

					<!-- Virtual bottom spacer -->
					${when(c.virtual && c.bottomSpacerHeight > 0, () => html`
						<div class="ml-data-grid__bottom-spacer" style="height: ${c.bottomSpacerHeight}px"></div>
					`)}

				</div>
			</div>

			<!-- Footer / Pagination -->
			<div class="ml-data-grid__footer">
				<span class="ml-data-grid__footer-count">
					${when(c.selectable && c.selectedIndices.length > 0, () => html`${c.selectedIndices.length} of ${c.totalRows} rows selected`, () => html`${c.totalRows} rows`)}
				</span>
				<div class="ml-data-grid__footer-pagination">
					${when(c.totalPages > 1, () => html`
						<span class="ml-data-grid__page-info">Page ${c.currentPage} of ${c.totalPages}</span>
						<div class="ml-data-grid__page-controls">
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === 1}
								@click=${() => c.goToPage(1)}
								aria-label="First page"
							><ml-icon icon="caret-double-left" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === 1}
								@click=${() => c.goToPage(c.currentPage - 1)}
								aria-label="Previous page"
							><ml-icon icon="caret-left" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === c.totalPages}
								@click=${() => c.goToPage(c.currentPage + 1)}
								aria-label="Next page"
							><ml-icon icon="caret-right" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === c.totalPages}
								@click=${() => c.goToPage(c.totalPages)}
								aria-label="Last page"
							><ml-icon icon="caret-double-right" size="xs"></ml-icon></button>
						</div>
					`)}
				</div>
			</div>

		</div>
	`;
}
const dataGridStyles = () => css`
	:host {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 0;
		font-family: var(--ml-font-sans);

		/* ── Data Grid: surface ── */
		--ml-data-grid-bg: var(--ml-color-surface);
		--ml-data-grid-border-width: var(--ml-border);
		--ml-data-grid-border-color: var(--ml-color-border);
		--ml-data-grid-radius: var(--ml-radius-lg);

		/* ── Data Grid: header ── */
		--ml-data-grid-header-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-header-color: var(--ml-color-text-muted);
		--ml-data-grid-header-sorted-color: var(--ml-color-text);

		/* ── Data Grid: title ── */
		--ml-data-grid-title-color: var(--ml-color-text);
		--ml-data-grid-description-color: var(--ml-color-text-muted);

		/* ── Data Grid: rows ── */
		--ml-data-grid-row-hover-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
		--ml-data-grid-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07));
		--ml-data-grid-row-striped-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-row-striped-hover-bg: var(--ml-color-surface-raised);

		/* ── Data Grid: cells ── */
		--ml-data-grid-cell-color: var(--ml-color-text);

		/* ── Data Grid: drag-over ── */
		--ml-data-grid-drag-over-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.08));
		--ml-data-grid-drag-over-color: var(--ml-color-primary);

		/* ── Data Grid: sort icon ── */
		--ml-data-grid-sort-color: var(--ml-color-text-muted);
		--ml-data-grid-sort-active-color: var(--ml-color-primary);

		/* ── Data Grid: resize handle ── */
		--ml-data-grid-resize-active-color: var(--ml-color-primary);

		/* ── Data Grid: checkbox ── */
		--ml-data-grid-checkbox-accent: var(--ml-color-primary);

		/* ── Data Grid: filter input ── */
		--ml-data-grid-filter-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-filter-border-color: var(--ml-color-border);
		--ml-data-grid-filter-focus-color: var(--ml-color-primary);
		--ml-data-grid-filter-focus-ring: 0 0 0 2px var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.12));

		/* ── Data Grid: scrollbar ── */
		--ml-data-grid-scrollbar-thumb: var(--ml-color-border);
		--ml-data-grid-scrollbar-thumb-hover: var(--ml-color-text-muted);

		/* ── Data Grid: footer ── */
		--ml-data-grid-footer-bg: var(--ml-color-surface);
		--ml-data-grid-footer-color: var(--ml-color-text-muted);
		--ml-data-grid-page-btn-border: var(--ml-color-border);
		--ml-data-grid-page-btn-color: var(--ml-color-text-muted);
		--ml-data-grid-page-btn-hover-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-page-btn-hover-color: var(--ml-color-text);
		--ml-data-grid-page-btn-hover-border: var(--ml-color-border-strong);
	}

	/* ── Root container ── */
	.ml-data-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		border-radius: var(--ml-data-grid-radius);
		background-color: var(--ml-data-grid-bg);
		overflow: hidden;
	}

	/* ── Toolbar ── */
	.ml-data-grid__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		flex-shrink: 0;
	}

	.ml-data-grid__toolbar-text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-data-grid__title {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-data-grid-title-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-data-grid__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-description-color);
		line-height: var(--ml-leading-normal);
	}

	/* ── Scrollable viewport — single scroll container ── */
	.ml-data-grid__viewport {
		flex: 1;
		overflow: auto;
		position: relative;
		min-height: 0;
		min-width: 0;
	}

	.ml-data-grid__viewport::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb {
		background: var(--ml-data-grid-scrollbar-thumb);
		border-radius: 3px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb:hover {
		background: var(--ml-data-grid-scrollbar-thumb-hover);
	}

	.ml-data-grid__viewport::-webkit-scrollbar-corner {
		background: transparent;
	}

	/* ── Inner wrapper — forces horizontal scroll via min-width ── */
	.ml-data-grid__inner {
		position: relative;
	}

	/* ── Header row — sticky at top ── */
	.ml-data-grid__header-row {
		display: grid;
		position: sticky;
		top: 0;
		z-index: 2;
		background: var(--ml-data-grid-header-bg);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
	}

	/* ── Filter row — sticky below header ── */
	.ml-data-grid__filter-row {
		display: grid;
		position: sticky;
		top: var(--ml-grid-header-h, 40px);
		z-index: 2;
		background: var(--ml-data-grid-bg);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		padding: var(--ml-space-2) 0;
	}

	/* ── Header cells ── */
	.ml-data-grid__th {
		position: relative;
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-data-grid-header-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		user-select: none;
		background: var(--ml-data-grid-header-bg);
	}

	.ml-data-grid--sm .ml-data-grid__th {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: calc(var(--ml-text-xs) * 0.9);
	}

	.ml-data-grid__th--left { text-align: left; }
	.ml-data-grid__th--center { text-align: center; }
	.ml-data-grid__th--right { text-align: right; }

	.ml-data-grid__th--sortable {
		cursor: pointer;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-data-grid__th--sortable:hover {
		color: var(--ml-data-grid-header-sorted-color);
	}

	.ml-data-grid__th--sorted {
		color: var(--ml-data-grid-header-sorted-color);
	}

	.ml-data-grid__th--drag-over {
		background: var(--ml-data-grid-drag-over-bg);
		color: var(--ml-data-grid-drag-over-color);
	}

	.ml-data-grid__th--dragging {
		opacity: 0.5;
	}

	.ml-data-grid__th-content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		min-width: 0;
		overflow: hidden;
	}

	.ml-data-grid__sort-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--ml-data-grid-sort-color);
	}

	.ml-data-grid__th--sorted .ml-data-grid__sort-icon {
		color: var(--ml-data-grid-sort-active-color);
	}

	/* ── Resize handle ── */
	.ml-data-grid__resize-handle {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		cursor: col-resize;
		background: transparent;
		transition: background var(--ml-duration-150);
		z-index: 1;
	}

	.ml-data-grid__resize-handle:hover,
	.ml-data-grid__th--resizing .ml-data-grid__resize-handle {
		background: var(--ml-data-grid-resize-active-color);
	}

	/* ── Filter cells ── */
	.ml-data-grid__filter-cell {
		display: flex;
		align-items: center;
		padding: 0 var(--ml-space-2);
		background: var(--ml-data-grid-bg);
		position: relative;
	}

	.ml-data-grid__filter-cell--pinned-left {
		position: sticky;
		z-index: 3;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__filter-input {
		width: 100%;
		padding: var(--ml-space-1-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-family: var(--ml-font-sans);
		color: var(--ml-data-grid-cell-color);
		background: var(--ml-data-grid-filter-bg);
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-filter-border-color);
		border-radius: var(--ml-radius-sm);
		outline: none;
		transition: border-color var(--ml-duration-150);
	}

	.ml-data-grid__filter-input::placeholder {
		color: var(--ml-data-grid-header-color);
	}

	.ml-data-grid__filter-input:focus {
		border-color: var(--ml-data-grid-filter-focus-color);
		box-shadow: var(--ml-data-grid-filter-focus-ring);
	}

	/* ── Virtual scroll spacers ── */
	.ml-data-grid__top-spacer,
	.ml-data-grid__bottom-spacer {
		display: block;
	}

	/* ── Data rows ── */
	.ml-data-grid__row {
		display: grid;
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
		cursor: default;
	}

	.ml-data-grid__row:last-child {
		border-bottom: none;
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover {
		background-color: var(--ml-data-grid-row-hover-bg);
	}

	.ml-data-grid__row--selected {
		background-color: var(--ml-data-grid-row-selected-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover {
		background-color: var(--ml-data-grid-row-selected-hover-bg);
	}

	.ml-data-grid--striped .ml-data-grid__row--even {
		background-color: var(--ml-data-grid-row-striped-bg);
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover {
		background-color: var(--ml-data-grid-row-striped-hover-bg);
	}

	/* ── Data cells ── */
	.ml-data-grid__td {
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-cell-color);
		vertical-align: middle;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		background: inherit;
	}

	.ml-data-grid--sm .ml-data-grid__td {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__td--left { text-align: left; }
	.ml-data-grid__td--center { text-align: center; }
	.ml-data-grid__td--right { text-align: right; }

	/* ── Checkbox column ── */
	.ml-data-grid__check-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--ml-space-3);
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	.ml-data-grid__filter-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid--sm .ml-data-grid__check-cell {
		padding: var(--ml-space-2);
	}

	.ml-data-grid__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-data-grid-checkbox-accent);
		cursor: pointer;
		margin: 0;
		flex-shrink: 0;
	}

	/* ── Pinned columns ── */
	.ml-data-grid__th--pinned-left,
	.ml-data-grid__td--pinned-left {
		position: sticky;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-left {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	/* Pinned left shadow */
	.ml-data-grid__th--pinned-left::after,
	.ml-data-grid__td--pinned-left::after {
		content: '';
		position: absolute;
		top: 0;
		right: -4px;
		bottom: 0;
		width: 4px;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.06), transparent);
		pointer-events: none;
	}

	.ml-data-grid__th--pinned-right,
	.ml-data-grid__td--pinned-right {
		position: sticky;
		right: 0;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-right {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	/* Pinned right shadow */
	.ml-data-grid__th--pinned-right::before,
	.ml-data-grid__td--pinned-right::before {
		content: '';
		position: absolute;
		top: 0;
		left: -4px;
		bottom: 0;
		width: 4px;
		background: linear-gradient(to left, rgba(0, 0, 0, 0.06), transparent);
		pointer-events: none;
	}

	/* Row-state backgrounds for pinned + check cells */
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-striped-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-hover-bg);
	}

	.ml-data-grid__row--selected .ml-data-grid__td--pinned-left,
	.ml-data-grid__row--selected .ml-data-grid__td--pinned-right,
	.ml-data-grid__row--selected .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-hover-bg);
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-striped-hover-bg);
	}

	/* ── Footer / Pagination ── */
	.ml-data-grid__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		background: var(--ml-data-grid-footer-bg);
		flex-shrink: 0;
	}

	.ml-data-grid--sm .ml-data-grid__footer {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-data-grid__footer-count {
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-footer-color);
	}

	.ml-data-grid--sm .ml-data-grid__footer-count {
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__footer-pagination {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-data-grid__page-info {
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-footer-color);
		white-space: nowrap;
	}

	.ml-data-grid--sm .ml-data-grid__page-info {
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__page-controls {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-data-grid__page-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-page-btn-border);
		border-radius: var(--ml-radius-md);
		background: var(--ml-data-grid-bg);
		color: var(--ml-data-grid-page-btn-color);
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150),
			color var(--ml-duration-150),
			border-color var(--ml-duration-150);
		font-family: var(--ml-font-sans);
	}

	.ml-data-grid--sm .ml-data-grid__page-btn {
		width: 1.75rem;
		height: 1.75rem;
	}

	.ml-data-grid__page-btn:hover:not(:disabled) {
		background: var(--ml-data-grid-page-btn-hover-bg);
		color: var(--ml-data-grid-page-btn-hover-color);
		border-color: var(--ml-data-grid-page-btn-hover-border);
	}

	.ml-data-grid__page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;
var DataGridComponent = class DataGridComponent$1 {
	constructor() {
		this.selectable = false;
		this.striped = false;
		this.hoverable = true;
		this.size = "md";
		this.gridTitle = "";
		this.description = "";
		this.serverSide = false;
		this.pageSize = 50;
		this.virtual = true;
		this.showFilterRow = false;
		this.columns = [];
		this.rows = [];
		this.sortKey = "";
		this.sortDirection = "asc";
		this.filters = {};
		this.selectedIndices = [];
		this.currentPage = 1;
		this.startIndex = 0;
		this.endIndex = 50;
		this.colWidths = {};
		this.colOrder = [];
		this.resizingKey = null;
		this.draggingKey = null;
		this.dragOverKey = null;
		this._scroller = new VirtualScroller();
		this._viewport = null;
		this._resizeStartX = 0;
		this._resizeStartWidth = 0;
		this.isRowSelected = (index) => this.selectedIndices.includes(index);
		this.handleSort = (col) => {
			if (!col.sortable) return;
			if (this.sortKey === col.key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
			else {
				this.sortKey = col.key;
				this.sortDirection = "asc";
			}
			this.currentPage = 1;
			this._scroller.invalidate();
			this.elementRef.dispatchEvent(new CustomEvent("ml:sort", {
				bubbles: true,
				composed: true,
				detail: {
					key: this.sortKey,
					direction: this.sortDirection
				}
			}));
		};
		this.handleFilterInput = (key, e) => {
			const val = e.target.value;
			this.filters = {
				...this.filters,
				[key]: val
			};
			this.currentPage = 1;
			this._scroller.invalidate();
			this.elementRef.dispatchEvent(new CustomEvent("ml:filter", {
				bubbles: true,
				composed: true,
				detail: { filters: this.filters }
			}));
		};
		this.handleSelectAll = () => {
			this.selectedIndices = this.allSelected ? [] : this.processedRows.map((_, i) => i);
			this._emitSelect();
		};
		this.handleSelectRow = (index, e) => {
			e.stopPropagation();
			this.selectedIndices = this.selectedIndices.includes(index) ? this.selectedIndices.filter((i) => i !== index) : [...this.selectedIndices, index];
			this._emitSelect();
		};
		this.handleRowClick = (row, index) => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:row-click", {
				bubbles: true,
				composed: true,
				detail: {
					row,
					index
				}
			}));
		};
		this.handleResizeStart = (key, e) => {
			this.resizingKey = key;
			this._resizeStartX = e.clientX;
			this._resizeStartWidth = this.columnWidths[key] ?? 150;
			e.target.setPointerCapture(e.pointerId);
			e.stopPropagation();
			e.preventDefault();
		};
		this.handleResizeMove = (key, e) => {
			if (this.resizingKey !== key) return;
			const delta = e.clientX - this._resizeStartX;
			const minW = this.columns.find((c) => c.key === key)?.minWidth ?? 80;
			this.colWidths = {
				...this.colWidths,
				[key]: Math.max(minW, this._resizeStartWidth + delta)
			};
		};
		this.handleResizeEnd = () => {
			if (!this.resizingKey) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:column-resize", {
				bubbles: true,
				composed: true,
				detail: {
					key: this.resizingKey,
					width: this.colWidths[this.resizingKey]
				}
			}));
			this.resizingKey = null;
		};
		this.handleDragStart = (key, e) => {
			this.draggingKey = key;
			if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
		};
		this.handleDragOver = (key, e) => {
			e.preventDefault();
			if (this.dragOverKey !== key) this.dragOverKey = key;
		};
		this.handleDragEnd = () => {
			this.draggingKey = null;
			this.dragOverKey = null;
		};
		this.handleDrop = (targetKey) => {
			if (!this.draggingKey || this.draggingKey === targetKey) {
				this.draggingKey = null;
				this.dragOverKey = null;
				return;
			}
			const order = [...this.colOrder.length ? this.colOrder : this.columns.map((c) => c.key)];
			const fromIdx = order.indexOf(this.draggingKey);
			const toIdx = order.indexOf(targetKey);
			if (fromIdx !== -1 && toIdx !== -1) {
				order.splice(fromIdx, 1);
				order.splice(toIdx, 0, this.draggingKey);
			}
			this.colOrder = order;
			this.elementRef.dispatchEvent(new CustomEvent("ml:column-reorder", {
				bubbles: true,
				composed: true,
				detail: { order: this.colOrder }
			}));
			this.draggingKey = null;
			this.dragOverKey = null;
		};
		this.goToPage = (page) => {
			if (page < 1 || page > this.totalPages) return;
			this.currentPage = page;
			if (this._viewport) this._viewport.scrollTop = 0;
			this._scroller.invalidate();
			this.elementRef.dispatchEvent(new CustomEvent("ml:page-change", {
				bubbles: true,
				composed: true,
				detail: {
					page: this.currentPage,
					pageSize: this.pageSize
				}
			}));
		};
	}
	get rowHeight() {
		return this.size === "sm" ? 36 : 44;
	}
	onPropertyChange(name, _oldVal, newVal) {
		if (name === "columns" && Array.isArray(newVal)) this._syncColumnState(newVal);
	}
	onCreate() {
		this._syncColumnState(this.columns);
		this._attachScroller();
	}
	onRender() {
		this._attachScroller();
		const shadow = this.elementRef.shadowRoot;
		if (shadow) {
			const headerRow = shadow.querySelector(".ml-data-grid__header-row");
			if (headerRow) {
				const h = headerRow.getBoundingClientRect().height;
				if (h > 0) this.elementRef.style.setProperty("--ml-grid-header-h", `${h}px`);
			}
		}
		if (this._viewport && this._viewport.clientHeight === 0 && this.processedRows.length > 0) {
			const approxEnd = Math.min(this.processedRows.length, Math.ceil(600 / this.rowHeight) + 6);
			if (approxEnd !== this.endIndex) this.endIndex = approxEnd;
		}
		if (!this.virtual) {
			const total = this.processedRows.length;
			if (this.endIndex !== total) this.endIndex = total;
		}
	}
	onDestroy() {
		this._scroller.detach();
		this._viewport = null;
	}
	_attachScroller() {
		if (this._viewport) return;
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		this._viewport = shadow.querySelector(".ml-data-grid__viewport");
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this.rowHeight,
			itemCount: () => this.processedRows.length,
			onUpdate: (start, end) => {
				this.startIndex = start;
				this.endIndex = end;
			},
			enabled: () => this.virtual
		});
	}
	_syncColumnState(cols) {
		this.colOrder = cols.map((c) => c.key);
		const newWidths = {};
		for (const col of cols) newWidths[col.key] = this.colWidths[col.key] ?? col.width ?? 150;
		this.colWidths = newWidths;
	}
	get filteredRows() {
		if (this.serverSide) return this.rows;
		const entries = Object.entries(this.filters).filter(([, v]) => v !== "");
		if (!entries.length) return this.rows;
		return this.rows.filter((row) => entries.every(([key, val]) => String(row[key] ?? "").toLowerCase().includes(val.toLowerCase())));
	}
	get sortedRows() {
		if (this.serverSide || !this.sortKey) return this.filteredRows;
		const key = this.sortKey;
		const dir = this.sortDirection === "asc" ? 1 : -1;
		return [...this.filteredRows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal == null) return bVal == null ? 0 : 1;
			if (bVal == null) return -1;
			if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
	}
	get pagedRows() {
		if (this.serverSide) return this.rows;
		const start = (this.currentPage - 1) * this.pageSize;
		return this.sortedRows.slice(start, start + this.pageSize);
	}
	get processedRows() {
		return this.pagedRows;
	}
	get visibleRows() {
		if (!this.virtual) return this.processedRows;
		return this.processedRows.slice(this.startIndex, this.endIndex);
	}
	get totalRows() {
		return this.serverSide ? this.rows.length : this.filteredRows.length;
	}
	get totalPages() {
		return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
	}
	get orderedColumns() {
		if (!this.colOrder.length) return this.columns;
		const colMap = new Map(this.columns.map((c) => [c.key, c]));
		return this.colOrder.filter((k) => colMap.has(k)).map((k) => colMap.get(k));
	}
	get columnWidths() {
		const result = {};
		for (const col of this.columns) result[col.key] = this.colWidths[col.key] ?? col.width ?? 150;
		return result;
	}
	get totalGridWidth() {
		return this.orderedColumns.reduce((sum, col) => sum + (this.columnWidths[col.key] ?? 150), 0) + (this.selectable ? 44 : 0);
	}
	get gridTemplateColumns() {
		const cols = this.orderedColumns.map((col) => `${this.columnWidths[col.key] ?? 150}px`).join(" ");
		return this.selectable ? `44px ${cols}` : cols;
	}
	getPinnedLeftOffset(key) {
		let offset$1 = this.selectable ? 44 : 0;
		for (const col of this.orderedColumns) {
			if (col.key === key) return offset$1;
			if (col.pinned === "left") offset$1 += this.columnWidths[col.key] ?? 150;
		}
		return 0;
	}
	get topSpacerHeight() {
		return this.virtual ? this.startIndex * this.rowHeight : 0;
	}
	get bottomSpacerHeight() {
		if (!this.virtual) return 0;
		return Math.max(0, (this.processedRows.length - this.endIndex) * this.rowHeight);
	}
	get allSelected() {
		return this.processedRows.length > 0 && this.selectedIndices.length === this.processedRows.length;
	}
	get someSelected() {
		return this.selectedIndices.length > 0 && !this.allSelected;
	}
	_emitSelect() {
		this.elementRef.dispatchEvent(new CustomEvent("ml:select", {
			bubbles: true,
			composed: true,
			detail: {
				selectedRows: this.selectedIndices,
				allSelected: this.allSelected
			}
		}));
	}
};
DataGridComponent = __decorate([MelodicComponent({
	selector: "ml-data-grid",
	template: dataGridTemplate,
	styles: dataGridStyles,
	attributes: [
		"selectable",
		"striped",
		"hoverable",
		"size",
		"grid-title",
		"description",
		"server-side",
		"page-size",
		"virtual",
		"show-filter-row"
	]
})], DataGridComponent);
var MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
var MONTH_ABBREVS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
var DAY_ABBREVS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
function toIsoDate(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function parseDate(iso) {
	const [y, m, d] = iso.split("T")[0].split("-").map(Number);
	return new Date(y, m - 1, d);
}
function isSameDay(a, b) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(date) {
	return isSameDay(date, /* @__PURE__ */ new Date());
}
function addDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
function addMonths(date, months) {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}
function startOfWeek(date, weekStartsOn = 0) {
	const d = new Date(date);
	const diff = (d.getDay() - weekStartsOn + 7) % 7;
	d.setDate(d.getDate() - diff);
	return d;
}
function getISOWeekNumber(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
}
function formatTime(iso) {
	const date = new Date(iso);
	const h = date.getHours();
	const m = date.getMinutes();
	const ampm = h >= 12 ? "PM" : "AM";
	const hour = h % 12 || 12;
	return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
function formatMonthYear(date) {
	return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}
function formatDateRange(start, end) {
	const sMonth = MONTH_ABBREVS[start.getMonth()];
	const eMonth = MONTH_ABBREVS[end.getMonth()];
	if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return `${sMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
	if (start.getFullYear() === end.getFullYear()) return `${sMonth} ${start.getDate()} – ${eMonth} ${end.getDate()}, ${start.getFullYear()}`;
	return `${sMonth} ${start.getDate()}, ${start.getFullYear()} – ${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}
function getMonthGrid(year, month, weekStartsOn = 0) {
	const firstDayOfWeek = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();
	const today = /* @__PURE__ */ new Date();
	const todayIso$1 = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
	const result = [];
	const offset$1 = (firstDayOfWeek - weekStartsOn + 7) % 7;
	const prevMonth = month === 0 ? 11 : month - 1;
	const prevYear = month === 0 ? year - 1 : year;
	for (let i = offset$1 - 1; i >= 0; i--) {
		const d = daysInPrevMonth - i;
		const iso = toIsoDate(prevYear, prevMonth, d);
		result.push({
			date: d,
			month: prevMonth,
			year: prevYear,
			iso,
			isCurrentMonth: false,
			isToday: iso === todayIso$1,
			events: []
		});
	}
	for (let d = 1; d <= daysInMonth; d++) {
		const iso = toIsoDate(year, month, d);
		result.push({
			date: d,
			month,
			year,
			iso,
			isCurrentMonth: true,
			isToday: iso === todayIso$1,
			events: []
		});
	}
	const totalNeeded = Math.ceil(result.length / 7) * 7;
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;
	for (let t = 1; result.length < totalNeeded; t++) {
		const iso = toIsoDate(nextYear, nextMonth, t);
		result.push({
			date: t,
			month: nextMonth,
			year: nextYear,
			iso,
			isCurrentMonth: false,
			isToday: iso === todayIso$1,
			events: []
		});
	}
	return result;
}
function getWeekDays(date, weekStartsOn = 0) {
	const start = startOfWeek(date, weekStartsOn);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
function getWeekdayHeaders(weekStartsOn = 0) {
	return Array.from({ length: 7 }, (_, i) => {
		const idx = (weekStartsOn + i) % 7;
		return {
			short: DAY_ABBREVS[idx],
			full: DAY_NAMES[idx]
		};
	});
}
function getEventsForDate(events, iso) {
	return events.filter((e) => {
		return e.start.split("T")[0] === iso;
	});
}
function getMonthAbbrev(date) {
	return MONTH_ABBREVS[date.getMonth()];
}
function getDayName(date) {
	return DAY_NAMES[date.getDay()];
}
function getMinutesFromMidnight(iso) {
	const date = new Date(iso);
	return date.getHours() * 60 + date.getMinutes();
}
function minutesToGridRow(minutes) {
	return Math.floor(minutes / 30) + 1;
}
function layoutOverlappingEvents(events) {
	if (events.length === 0) return [];
	const sorted = [...events].sort((a, b) => {
		const aStart = getMinutesFromMidnight(a.start);
		const bStart = getMinutesFromMidnight(b.start);
		if (aStart !== bStart) return aStart - bStart;
		const aDuration = getMinutesFromMidnight(a.end) - aStart;
		return getMinutesFromMidnight(b.end) - bStart - aDuration;
	});
	const columns = [];
	const eventColumns = /* @__PURE__ */ new Map();
	for (const event of sorted) {
		const start = getMinutesFromMidnight(event.start);
		const end = getMinutesFromMidnight(event.end);
		let placed = false;
		for (let col = 0; col < columns.length; col++) if (columns[col][columns[col].length - 1].end <= start) {
			columns[col].push({ end });
			eventColumns.set(event.id, col);
			placed = true;
			break;
		}
		if (!placed) {
			columns.push([{ end }]);
			eventColumns.set(event.id, columns.length - 1);
		}
	}
	const groups = [];
	const visited = /* @__PURE__ */ new Set();
	for (const event of sorted) {
		if (visited.has(event.id)) continue;
		const group = [event];
		visited.add(event.id);
		let groupEnd = getMinutesFromMidnight(event.end);
		let maxCol = eventColumns.get(event.id) + 1;
		for (const other of sorted) {
			if (visited.has(other.id)) continue;
			if (getMinutesFromMidnight(other.start) < groupEnd) {
				group.push(other);
				visited.add(other.id);
				groupEnd = Math.max(groupEnd, getMinutesFromMidnight(other.end));
				maxCol = Math.max(maxCol, eventColumns.get(other.id) + 1);
			}
		}
		groups.push({
			events: group,
			totalColumns: maxCol
		});
	}
	const result = [];
	for (const group of groups) for (const event of group.events) {
		const start = getMinutesFromMidnight(event.start);
		const end = getMinutesFromMidnight(event.end);
		const col = eventColumns.get(event.id);
		const total = group.totalColumns;
		result.push({
			event,
			gridRowStart: minutesToGridRow(start),
			gridRowEnd: minutesToGridRow(end),
			left: col / total,
			width: 1 / total
		});
	}
	return result;
}
function getTimeSlots() {
	const slots = [];
	for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) {
		const ampm = h >= 12 ? "PM" : "AM";
		const hour = h % 12 || 12;
		const label = m === 0 ? `${hour} ${ampm}` : "";
		slots.push({
			label,
			hour: h,
			minute: m
		});
	}
	return slots;
}
function getWeekColumns(date, weekStartsOn, events) {
	return getWeekDays(date, weekStartsOn).map((d) => {
		const iso = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
		const dayEvents = getEventsForDate(events, iso).filter((e) => !e.allDay);
		return {
			date: iso,
			dayLabel: DAY_ABBREVS[d.getDay()],
			dayNumber: d.getDate(),
			isToday: isToday(d),
			events: layoutOverlappingEvents(dayEvents)
		};
	});
}
function getDayColumn(date, events) {
	const iso = toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
	const dayEvents = getEventsForDate(events, iso).filter((e) => !e.allDay);
	return {
		date: iso,
		dayLabel: DAY_ABBREVS[date.getDay()],
		dayNumber: date.getDate(),
		isToday: isToday(date),
		events: layoutOverlappingEvents(dayEvents)
	};
}
function getMiniCalendarDots(year, month, events) {
	const dots = /* @__PURE__ */ new Set();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	for (let d = 1; d <= daysInMonth; d++) {
		const iso = toIsoDate(year, month, d);
		if (events.some((e) => e.start.split("T")[0] === iso)) dots.add(iso);
	}
	return dots;
}
var VIEW_LABELS = {
	month: "Month view",
	week: "Week view",
	day: "Day view"
};
function renderDefaultHeaderLeft(c) {
	return html`
		<div class="ml-cv__today-badge">
			<span class="ml-cv__today-badge-month">${c.todayMonthAbbrev}</span>
			<span class="ml-cv__today-badge-day">${c.todayDayNumber}</span>
		</div>
		<div class="ml-cv__title-group">
			<div class="ml-cv__title-row">
				<h2 class="ml-cv__title">${c.headerTitle}</h2>
				${when(c.view !== "day", () => html` <span class="ml-cv__week-badge">Week ${c.weekNumber}</span> `)}
			</div>
			<span class="ml-cv__subtitle">${c.headerSubtitle}</span>
		</div>
	`;
}
function renderDefaultHeaderActions(c) {
	return html`
		${when(!c.hideNav, () => html`
				<div class="ml-cv__nav-group">
					<button type="button" class="ml-cv__nav-btn" aria-label="Previous" @click=${c.navigatePrev}>
						<ml-icon icon="caret-left" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-cv__nav-btn" aria-label="Next" @click=${c.navigateNext}>
						<ml-icon icon="caret-right" size="sm"></ml-icon>
					</button>
				</div>
			`)}

		${when(!c.hideTodayButton, () => html`<button type="button" class="ml-cv__today-btn" @click=${c.goToToday}>Today</button>`)}

		${when(!c.hideViewSelector, () => html`
				<div class="ml-cv__view-dropdown">
					<button
						type="button"
						class=${classMap({
		"ml-cv__view-trigger": true,
		"ml-cv__view-trigger--open": c.isViewDropdownOpen
	})}
						@click=${c.toggleViewDropdown}
					>
						${VIEW_LABELS[c.view]}
						<ml-icon icon="caret-down" size="xs"></ml-icon>
					</button>
					${when(c.isViewDropdownOpen, () => html`
							<div class="ml-cv__view-menu">
								<button
									type="button"
									class=${classMap({
		"ml-cv__view-option": true,
		"ml-cv__view-option--active": c.view === "month"
	})}
									@click=${() => c.setView("month")}
								>
									Month view
								</button>
								<button
									type="button"
									class=${classMap({
		"ml-cv__view-option": true,
		"ml-cv__view-option--active": c.view === "week"
	})}
									@click=${() => c.setView("week")}
								>
									Week view
								</button>
								<button
									type="button"
									class=${classMap({
		"ml-cv__view-option": true,
		"ml-cv__view-option--active": c.view === "day"
	})}
									@click=${() => c.setView("day")}
								>
									Day view
								</button>
							</div>
						`)}
				</div>
			`)}

		${when(!c.hideAddButton, () => html`
				<button type="button" class="ml-cv__add-btn" @click=${c.handleAddEvent}>
					<ml-icon icon="plus" size="xs"></ml-icon>
					${c.addButtonText}
				</button>
			`)}
	`;
}
function renderHeader(c) {
	return html`
		<div class="ml-cv__header">
			<div class="ml-cv__header-left">
				${when(c.hasHeaderLeftSlot, () => html`<slot name="header-left"></slot>`, () => renderDefaultHeaderLeft(c))}
			</div>

			<div class="ml-cv__header-right">
				${when(c.hasHeaderActionsSlot, () => html`<slot name="header-actions"></slot>`, () => renderDefaultHeaderActions(c))}
			</div>
		</div>
	`;
}
function renderEventPill(c, event) {
	const color = event.color || "blue";
	return html`
		<div
			class=${classMap({
		"ml-cv__event-pill": true,
		[`ml-cv__event-pill--${color}`]: true
	})}
			@click=${(e) => {
		e.stopPropagation();
		c.handleEventClick(event);
	}}
		>
			${when(!event.allDay, () => html`
				<span class="ml-cv__event-pill-time">${formatTime(event.start)}</span>
			`)}
			<span class="ml-cv__event-pill-title">${event.title}</span>
		</div>
	`;
}
function renderMonthView(c) {
	const headers = c.weekdayHeaders;
	const grid = c.monthGrid;
	const todayDayIndex = (/* @__PURE__ */ new Date()).getDay();
	const weekStartsOn = c.weekStartsOn;
	return html`
		<div class="ml-cv__month">
			<div class="ml-cv__weekday-header">
				${repeat(headers, (h) => h.short, (h, i) => {
		const dayIndex = (weekStartsOn + i) % 7;
		return html`
						<div class=${classMap({
			"ml-cv__weekday": true,
			"ml-cv__weekday--today": dayIndex === todayDayIndex
		})}>${h.short}</div>
					`;
	})}
			</div>

			<div class="ml-cv__month-grid">
				${repeat(grid, (day) => day.iso, (day) => {
		const visible = day.events.slice(0, c.maxVisibleEvents);
		const overflow = day.events.length - c.maxVisibleEvents;
		return html`
						<div
							class=${classMap({
			"ml-cv__day-cell": true,
			"ml-cv__day-cell--other-month": !day.isCurrentMonth
		})}
							@click=${() => c.handleDateClick(day.iso)}
						>
							<div class=${classMap({
			"ml-cv__day-number": true,
			"ml-cv__day-number--today": day.isToday
		})}>${day.date}</div>

							<div class="ml-cv__day-events">
								${repeat(visible, (e) => e.id, (e) => renderEventPill(c, e))}
								${when(overflow > 0, () => html`
									<button
										type="button"
										class="ml-cv__more-link"
										@click=${(e) => {
			e.stopPropagation();
			c.showMoreEvents(day.iso);
		}}
									>${overflow} more...</button>
								`)}
							</div>

							<button
								type="button"
								class="ml-cv__day-add"
								aria-label="Add event"
								@click=${(e) => {
			e.stopPropagation();
			c.handleAddEventOnDate(day.iso);
		}}
							>+</button>
						</div>
					`;
	})}
			</div>
		</div>
	`;
}
function renderTimeEvent$1(c, pe, colIndex) {
	const color = pe.event.color || "blue";
	return html`
		<div
			class=${classMap({
		"ml-cv__time-event": true,
		[`ml-cv__time-event--${color}`]: true
	})}
			style="grid-row: ${pe.gridRowStart} / ${pe.gridRowEnd}; grid-column: ${colIndex + 2}; margin-left: ${pe.left * 100}%; width: ${pe.width * 100}%;"
			@click=${(e) => {
		e.stopPropagation();
		c.handleEventClick(pe.event);
	}}
		>
			<div class="ml-cv__time-event-title">${pe.event.title}</div>
			<div class="ml-cv__time-event-time">${formatTime(pe.event.start)} – ${formatTime(pe.event.end)}</div>
		</div>
	`;
}
function renderWeekView(c) {
	const columns = c.weekColumns;
	const timeSlots = c.timeSlots;
	return html`
		<div class="ml-cv__time-layout">
			<div class="ml-cv__time-header ml-cv__time-header--week">
				<div class="ml-cv__time-header-gutter"></div>
				${repeat(columns, (col) => col.date, (col) => html`
					<div class=${classMap({
		"ml-cv__time-header-day": true,
		"ml-cv__time-header-day--today": col.isToday
	})}>
						<span class="ml-cv__time-header-label">${col.dayLabel}</span>
						<span class="ml-cv__time-header-number">${col.dayNumber}</span>
					</div>
				`)}
			</div>

			<div class="ml-cv__time-scroll">
				<div class="ml-cv__time-body ml-cv__time-body--week" style="--cv-rows: ${48};">
					<!-- Time gutter column -->
					<div class="ml-cv__time-gutter" style="grid-row: 1 / ${49}; grid-column: 1;"></div>

					<!-- Day columns (background grid lines) -->
					${repeat(columns, (col) => col.date, (_col, colIdx) => html`
						<div
							class=${classMap({
		"ml-cv__time-column": true,
		"ml-cv__time-column--last": colIdx === 6
	})}
							style="grid-row: 1 / ${49}; grid-column: ${colIdx + 2};"
						></div>
					`)}

					<!-- Row grid lines -->
					${repeat(timeSlots, (_slot, i) => `row-${i}`, (_, i) => html`
						<div class="ml-cv__time-row" style="grid-row: ${i + 1}; grid-column: 1 / ${columns.length + 2};"></div>
					`)}

					<!-- Time slot labels in gutter -->
					${repeat(timeSlots, (_slot, i) => `label-${i}`, (slot, i) => html`
						<div class="ml-cv__time-label" style="grid-row: ${i + 1}; grid-column: 1;">${slot.label}</div>
					`)}

					<!-- Events placed on the grid -->
					${repeat(columns.flatMap((col, colIdx) => col.events.map((pe) => ({
		pe,
		colIdx
	}))), (entry) => entry.pe.event.id, (entry) => renderTimeEvent$1(c, entry.pe, entry.colIdx))}
				</div>
			</div>
		</div>
	`;
}
function renderTimeEvent(c, pe) {
	const color = pe.event.color || "blue";
	return html`
		<div
			class=${classMap({
		"ml-cv__time-event": true,
		[`ml-cv__time-event--${color}`]: true
	})}
			style="grid-row: ${pe.gridRowStart} / ${pe.gridRowEnd}; grid-column: 2; margin-left: ${pe.left * 100}%; width: ${pe.width * 100}%;"
			@click=${(e) => {
		e.stopPropagation();
		c.handleEventClick(pe.event);
	}}
		>
			<div class="ml-cv__time-event-title">${pe.event.title}</div>
			<div class="ml-cv__time-event-time">${formatTime(pe.event.start)} – ${formatTime(pe.event.end)}</div>
		</div>
	`;
}
function renderMiniCalendar(c) {
	const miniGrid = c.miniCalendarGrid;
	const miniHeaders = c.miniCalendarWeekdays;
	const dots = c.miniCalendarDots;
	const selectedIso = c.currentIsoDate;
	return html`
		<div class="ml-cv__mini-cal">
			<div class="ml-cv__mini-cal-header">
				<span class="ml-cv__mini-cal-title">${c.miniCalendarTitle}</span>
				<div class="ml-cv__mini-cal-nav">
					<button type="button" class="ml-cv__mini-cal-btn" aria-label="Previous month" @click=${c.miniCalPrevMonth}>
						<ml-icon icon="caret-left" size="xs"></ml-icon>
					</button>
					<button type="button" class="ml-cv__mini-cal-btn" aria-label="Next month" @click=${c.miniCalNextMonth}>
						<ml-icon icon="caret-right" size="xs"></ml-icon>
					</button>
				</div>
			</div>

			<div class="ml-cv__mini-cal-weekdays">
				${repeat(miniHeaders, (h) => h, (h) => html`
					<div class="ml-cv__mini-cal-weekday">${h}</div>
				`)}
			</div>

			<div class="ml-cv__mini-cal-grid">
				${repeat(miniGrid, (day) => day.iso, (day) => html`
					<button
						type="button"
						class=${classMap({
		"ml-cv__mini-cal-day": true,
		"ml-cv__mini-cal-day--other": !day.isCurrentMonth,
		"ml-cv__mini-cal-day--today": day.isToday,
		"ml-cv__mini-cal-day--selected": day.iso === selectedIso
	})}
						@click=${() => c.handleMiniCalSelect(day.iso)}
					>
						${day.date}
						${when(dots.has(day.iso), () => html`<span class="ml-cv__mini-cal-dot"></span>`)}
					</button>
				`)}
			</div>
		</div>
	`;
}
function renderSidebarEvents(c) {
	const events = c.dayEvents;
	return html`
		<div class="ml-cv__sidebar-title">Events for ${c.dayViewDateLabel}</div>
		${when(events.length === 0, () => html`
			<div class="ml-cv__sidebar-empty">No events scheduled</div>
		`)}
		${when(events.length > 0, () => html`
			<div class="ml-cv__sidebar-events">
				${repeat(events, (e) => e.id, (e) => {
		return html`
						<div class="ml-cv__sidebar-event" @click=${() => c.handleEventClick(e)}>
							<div class=${`ml-cv__sidebar-event-bar ml-cv__sidebar-event-bar--${e.color || "blue"}`}></div>
							<div class="ml-cv__sidebar-event-content">
								<div class="ml-cv__sidebar-event-title">${e.title}</div>
								<div class="ml-cv__sidebar-event-time">
									${e.allDay ? "All day" : `${formatTime(e.start)} – ${formatTime(e.end)}`}
								</div>
							</div>
						</div>
					`;
	})}
			</div>
		`)}
	`;
}
function renderDayView(c) {
	const column = c.dayColumn;
	const timeSlots = c.timeSlots;
	return html`
		<div class="ml-cv__day-layout">
			<div class="ml-cv__day-main">
				<div class="ml-cv__time-layout">
					<div class="ml-cv__time-header ml-cv__time-header--day">
						<div class="ml-cv__time-header-gutter"></div>
						<div class=${classMap({
		"ml-cv__time-header-day": true,
		"ml-cv__time-header-day--today": column.isToday
	})}>
							<span class="ml-cv__time-header-label">${column.dayLabel}</span>
							<span class="ml-cv__time-header-number">${column.dayNumber}</span>
						</div>
					</div>

					<div class="ml-cv__time-scroll">
						<div class="ml-cv__time-body ml-cv__time-body--day" style="--cv-rows: ${48};">
							<!-- Time gutter column -->
							<div class="ml-cv__time-gutter" style="grid-row: 1 / ${49}; grid-column: 1;"></div>

							<!-- Day column background -->
							<div class="ml-cv__time-column" style="grid-row: 1 / ${49}; grid-column: 2;"></div>

							<!-- Row grid lines -->
							${repeat(timeSlots, (_slot, i) => `row-${i}`, (_, i) => html`
								<div class="ml-cv__time-row" style="grid-row: ${i + 1}; grid-column: 1 / 3;"></div>
							`)}

							<!-- Time slot labels -->
							${repeat(timeSlots, (_slot, i) => `label-${i}`, (slot, i) => html`
								<div class="ml-cv__time-label" style="grid-row: ${i + 1}; grid-column: 1;">${slot.label}</div>
							`)}

							<!-- Events -->
							${repeat(column.events, (pe) => pe.event.id, (pe) => renderTimeEvent(c, pe))}
						</div>
					</div>
				</div>
			</div>

			<div class="ml-cv__day-sidebar">
				${renderMiniCalendar(c)}
				${renderSidebarEvents(c)}
			</div>
		</div>
	`;
}
function calendarViewTemplate(c) {
	return html`
		<div class="ml-cv">
			${renderHeader(c)}
			${when(c.view === "month", () => renderMonthView(c))}
			${when(c.view === "week", () => renderWeekView(c))}
			${when(c.view === "day", () => renderDayView(c))}
		</div>
	`;
}
const calendarViewStyles = () => css`
	:host {
		display: block;
		font-family: var(--ml-font-sans);

		/* ── Calendar View: surface ── */
		--ml-calendar-view-bg: var(--ml-color-surface);
		--ml-calendar-view-border-width: var(--ml-border);
		--ml-calendar-view-border-color: var(--ml-color-border);
		--ml-calendar-view-radius: var(--ml-radius-lg);

		/* ── Calendar View: header ── */
		--ml-calendar-view-header-padding: var(--ml-space-4) var(--ml-space-5);
		--ml-calendar-view-title-size: var(--ml-text-lg);
		--ml-calendar-view-title-weight: var(--ml-font-semibold);
		--ml-calendar-view-title-color: var(--ml-color-text);
		--ml-calendar-view-subtitle-color: var(--ml-color-text-muted);

		/* ── Calendar View: today badge ── */
		--ml-calendar-view-today-badge-bg: var(--ml-color-primary);
		--ml-calendar-view-today-badge-color: var(--ml-color-text-inverse);

		/* ── Calendar View: navigation buttons ── */
		--ml-calendar-view-nav-color: var(--ml-color-text-muted);
		--ml-calendar-view-nav-hover-bg: var(--ml-color-surface-raised);
		--ml-calendar-view-nav-hover-color: var(--ml-color-text);

		/* ── Calendar View: day cells ── */
		--ml-calendar-view-cell-min-height: 120px;
		--ml-calendar-view-cell-hover-bg: var(--ml-color-surface-sunken);
		--ml-calendar-view-cell-other-bg: var(--ml-color-surface-sunken);
		--ml-calendar-view-cell-other-color: var(--ml-color-text-disabled);

		/* ── Calendar View: today indicator ── */
		--ml-calendar-view-today-bg: var(--ml-color-primary);
		--ml-calendar-view-today-color: var(--ml-color-text-inverse);

		/* ── Calendar View: weekday header ── */
		--ml-calendar-view-weekday-color: var(--ml-color-text-muted);
		--ml-calendar-view-weekday-today-color: var(--ml-color-primary);

		/* ── Calendar View: event pill ── */
		--ml-calendar-view-event-radius: var(--ml-radius-sm);
		--ml-calendar-view-event-border-width: 3px;

		/* ── Calendar View: week badge ── */
		--ml-calendar-view-week-badge-color: var(--ml-color-primary);
		--ml-calendar-view-week-badge-bg: var(--ml-purple-50);

		/* ── Calendar View: add button ── */
		--ml-calendar-view-add-bg: var(--ml-color-primary);
		--ml-calendar-view-add-hover-bg: var(--ml-color-primary-hover);
		--ml-calendar-view-add-color: var(--ml-color-text-inverse);

		/* ── Calendar View: view menu ── */
		--ml-calendar-view-menu-bg: var(--ml-color-surface);
		--ml-calendar-view-menu-shadow: var(--ml-shadow-lg);
		--ml-calendar-view-menu-active-color: var(--ml-color-primary);

		/* ── Calendar View: sidebar ── */
		--ml-calendar-view-sidebar-event-hover-bg: var(--ml-color-surface-raised);

		/* ── Calendar View: mini calendar ── */
		--ml-calendar-view-mini-selected-bg: var(--ml-color-primary);
		--ml-calendar-view-mini-selected-hover-bg: var(--ml-color-primary-hover);
		--ml-calendar-view-mini-selected-color: var(--ml-color-text-inverse);
		--ml-calendar-view-mini-dot-color: var(--ml-color-primary);

		/* ── Calendar View: focus ring ── */
		--ml-calendar-view-focus-ring: var(--ml-shadow-focus-ring);
	}

	.ml-cv {
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-calendar-view-radius);
		background-color: var(--ml-calendar-view-bg);
		overflow: hidden;
	}

	/* ── Header ── */
	.ml-cv__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-calendar-view-header-padding);
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__header-left {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-cv__today-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--ml-calendar-view-radius);
		background-color: var(--ml-calendar-view-today-badge-bg);
		color: var(--ml-calendar-view-today-badge-color);
		line-height: 1;
		flex-shrink: 0;
	}

	.ml-cv__today-badge-month {
		font-size: 0.5625rem;
		font-weight: var(--ml-font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.ml-cv__today-badge-day {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-bold);
	}

	.ml-cv__title-group {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-cv__title-row {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	.ml-cv__title {
		font-size: var(--ml-calendar-view-title-size);
		font-weight: var(--ml-calendar-view-title-weight);
		color: var(--ml-calendar-view-title-color);
		margin: 0;
	}

	.ml-cv__week-badge {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-week-badge-color);
		background-color: var(--ml-calendar-view-week-badge-bg);
		padding: var(--ml-space-0-5) var(--ml-space-2);
		border-radius: var(--ml-radius-full);
	}

	.ml-cv__subtitle {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-subtitle-color);
	}

	.ml-cv__header-right {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	/* Slotted header content */
	::slotted([slot="header-left"]) {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	::slotted([slot="header-actions"]) {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	.ml-cv__nav-group {
		display: flex;
		align-items: center;
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		overflow: hidden;
	}

	.ml-cv__nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: none;
		background: none;
		color: var(--ml-calendar-view-nav-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out), color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__nav-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
		color: var(--ml-calendar-view-nav-hover-color);
	}

	.ml-cv__nav-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
		z-index: 1;
	}

	.ml-cv__nav-btn + .ml-cv__nav-btn {
		border-left: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__today-btn {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__today-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	/* View dropdown */
	.ml-cv__view-dropdown {
		position: relative;
	}

	.ml-cv__view-trigger {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-trigger:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__view-trigger:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	.ml-cv__view-trigger ml-icon {
		transition: transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-trigger--open ml-icon {
		transform: rotate(180deg);
	}

	.ml-cv__view-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		min-width: 140px;
		background-color: var(--ml-calendar-view-menu-bg);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		box-shadow: var(--ml-calendar-view-menu-shadow);
		padding: var(--ml-space-1);
		z-index: 10;
	}

	.ml-cv__view-option {
		display: flex;
		align-items: center;
		width: 100%;
		padding: var(--ml-space-2) var(--ml-space-3);
		border: none;
		border-radius: var(--ml-radius-sm);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-option:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__view-option--active {
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-menu-active-color);
	}

	.ml-cv__add-btn {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: none;
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-calendar-view-add-bg);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-add-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__add-btn:hover {
		background-color: var(--ml-calendar-view-add-hover-bg);
	}

	.ml-cv__add-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	/* ── Month View ── */
	.ml-cv__month {
		display: flex;
		flex-direction: column;
	}

	.ml-cv__weekday-header {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__weekday {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
	}

	.ml-cv__weekday--today {
		color: var(--ml-calendar-view-weekday-today-color);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.ml-cv__day-cell {
		position: relative;
		min-height: var(--ml-calendar-view-cell-min-height);
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		padding: var(--ml-space-1);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__day-cell:nth-child(7n) {
		border-right: none;
	}

	.ml-cv__day-cell:hover {
		background-color: var(--ml-calendar-view-cell-hover-bg);
	}

	.ml-cv__day-cell--other-month {
		background-color: var(--ml-calendar-view-cell-other-bg);
	}

	.ml-cv__day-cell--other-month .ml-cv__day-number {
		color: var(--ml-calendar-view-cell-other-color);
	}

	.ml-cv__day-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-title-color);
		margin-bottom: var(--ml-space-0-5);
	}

	.ml-cv__day-number--today {
		background-color: var(--ml-calendar-view-today-bg);
		color: var(--ml-calendar-view-today-color);
		border-radius: var(--ml-radius-full);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__day-events {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.ml-cv__event-pill {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
		padding: 1px var(--ml-space-1-5);
		border-radius: var(--ml-calendar-view-event-radius);
		border-left: var(--ml-calendar-view-event-border-width) solid;
		font-size: 0.6875rem;
		line-height: 1.45;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__event-pill:hover {
		opacity: 0.85;
	}

	.ml-cv__event-pill-time {
		flex-shrink: 0;
		font-weight: var(--ml-font-medium);
	}

	.ml-cv__event-pill-title {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Event pill colors */
	.ml-cv__event-pill--gray { background-color: var(--ml-gray-50); border-left-color: var(--ml-gray-400); color: var(--ml-gray-700); }
	.ml-cv__event-pill--blue { background-color: var(--ml-blue-50); border-left-color: var(--ml-blue-500); color: var(--ml-blue-700); }
	.ml-cv__event-pill--purple { background-color: var(--ml-purple-50); border-left-color: var(--ml-purple-500); color: var(--ml-purple-700); }
	.ml-cv__event-pill--green { background-color: var(--ml-green-50); border-left-color: var(--ml-green-500); color: var(--ml-green-700); }
	.ml-cv__event-pill--pink { background-color: var(--ml-red-50); border-left-color: var(--ml-red-400); color: var(--ml-red-700); }
	.ml-cv__event-pill--orange { background-color: var(--ml-amber-50); border-left-color: var(--ml-amber-500); color: var(--ml-amber-700); }
	.ml-cv__event-pill--yellow { background-color: var(--ml-amber-25, var(--ml-amber-50)); border-left-color: var(--ml-amber-400); color: var(--ml-amber-700); }

	.ml-cv__more-link {
		font-size: 0.6875rem;
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		padding: 1px var(--ml-space-1-5);
		cursor: pointer;
		border: none;
		background: none;
		text-align: left;
		font-family: var(--ml-font-sans);
	}

	.ml-cv__more-link:hover {
		color: var(--ml-calendar-view-menu-active-color);
	}

	.ml-cv__day-add {
		position: absolute;
		bottom: var(--ml-space-1);
		right: var(--ml-space-1);
		display: none;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-calendar-view-add-bg);
		color: var(--ml-calendar-view-add-color);
		font-size: var(--ml-text-sm);
		cursor: pointer;
		line-height: 1;
	}

	.ml-cv__day-cell:hover .ml-cv__day-add {
		display: flex;
	}

	/* ── Time Grid (Week & Day views) — CSS Grid layout ── */
	.ml-cv__time-layout {
		display: flex;
		flex-direction: column;
	}

	.ml-cv__time-header {
		display: grid;
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header--week {
		grid-template-columns: 60px repeat(7, 1fr);
	}

	.ml-cv__time-header--day {
		grid-template-columns: 60px 1fr;
	}

	.ml-cv__time-header-gutter {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--ml-space-2) 0;
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header-day:last-child {
		border-right: none;
	}

	.ml-cv__time-header-label {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
	}

	.ml-cv__time-header-number {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-label {
		color: var(--ml-calendar-view-weekday-today-color);
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-number {
		background-color: var(--ml-calendar-view-today-bg);
		color: var(--ml-calendar-view-today-color);
		border-radius: var(--ml-radius-full);
	}

	.ml-cv__time-scroll {
		overflow-y: auto;
		max-height: 720px;
	}

	/* CSS Grid body: columns + rows for time grid */
	.ml-cv__time-body {
		display: grid;
		grid-template-rows: repeat(var(--cv-rows), 40px);
	}

	.ml-cv__time-body--week {
		grid-template-columns: 60px repeat(7, 1fr);
	}

	.ml-cv__time-body--day {
		grid-template-columns: 60px 1fr;
	}

	.ml-cv__time-gutter {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-column {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-column--last {
		border-right: none;
	}

	.ml-cv__time-row {
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		pointer-events: none;
	}

	.ml-cv__time-label {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: var(--ml-space-1) var(--ml-space-2) 0;
		font-size: 0.625rem;
		color: var(--ml-calendar-view-weekday-color);
		white-space: nowrap;
		pointer-events: none;
	}

	/* Events placed via grid-row on the CSS grid */
	.ml-cv__time-event {
		box-sizing: border-box;
		min-width: 0;
		min-height: 0;
		border-radius: var(--ml-calendar-view-event-radius);
		border-left: var(--ml-calendar-view-event-border-width) solid;
		padding: var(--ml-space-1) var(--ml-space-1-5);
		font-size: 0.6875rem;
		overflow: hidden;
		cursor: pointer;
		z-index: 1;
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__time-event:hover {
		opacity: 0.85;
	}

	.ml-cv__time-event-title {
		font-weight: var(--ml-font-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-cv__time-event-time {
		font-size: 0.625rem;
		opacity: 0.8;
	}

	/* Time event colors */
	.ml-cv__time-event--gray { background-color: var(--ml-gray-50); border-left-color: var(--ml-gray-400); color: var(--ml-gray-700); }
	.ml-cv__time-event--blue { background-color: var(--ml-blue-50); border-left-color: var(--ml-blue-500); color: var(--ml-blue-700); }
	.ml-cv__time-event--purple { background-color: var(--ml-purple-50); border-left-color: var(--ml-purple-500); color: var(--ml-purple-700); }
	.ml-cv__time-event--green { background-color: var(--ml-green-50); border-left-color: var(--ml-green-500); color: var(--ml-green-700); }
	.ml-cv__time-event--pink { background-color: var(--ml-red-50); border-left-color: var(--ml-red-400); color: var(--ml-red-700); }
	.ml-cv__time-event--orange { background-color: var(--ml-amber-50); border-left-color: var(--ml-amber-500); color: var(--ml-amber-700); }
	.ml-cv__time-event--yellow { background-color: var(--ml-amber-25, var(--ml-amber-50)); border-left-color: var(--ml-amber-400); color: var(--ml-amber-700); }

	/* ── Day View with sidebar ── */
	.ml-cv__day-layout {
		display: grid;
		grid-template-columns: 1fr 280px;
	}

	.ml-cv__day-main {
		overflow: hidden;
	}

	.ml-cv__day-sidebar {
		border-left: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		padding: var(--ml-space-4);
		overflow-y: auto;
		max-height: 780px;
	}

	/* Mini calendar in sidebar */
	.ml-cv__mini-cal {
		margin-bottom: var(--ml-space-4);
	}

	.ml-cv__mini-cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-cv__mini-cal-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
	}

	.ml-cv__mini-cal-nav {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.ml-cv__mini-cal-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: var(--ml-radius-sm);
		background: none;
		color: var(--ml-calendar-view-nav-color);
		cursor: pointer;
	}

	.ml-cv__mini-cal-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
		color: var(--ml-calendar-view-nav-hover-color);
	}

	.ml-cv__mini-cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: var(--ml-space-1);
	}

	.ml-cv__mini-cal-weekday {
		font-size: 0.625rem;
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
		padding: var(--ml-space-0-5) 0;
	}

	.ml-cv__mini-cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.ml-cv__mini-cal-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--ml-radius-full);
		background: none;
		font-size: 0.6875rem;
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		padding: 0;
		gap: 1px;
	}

	.ml-cv__mini-cal-day:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__mini-cal-day--other {
		color: var(--ml-calendar-view-cell-other-color);
	}

	.ml-cv__mini-cal-day--today {
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected {
		background-color: var(--ml-calendar-view-mini-selected-bg);
		color: var(--ml-calendar-view-mini-selected-color);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected:hover {
		background-color: var(--ml-calendar-view-mini-selected-hover-bg);
	}

	.ml-cv__mini-cal-dot {
		width: 3px;
		height: 3px;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-calendar-view-mini-dot-color);
	}

	.ml-cv__mini-cal-day--selected .ml-cv__mini-cal-dot {
		background-color: var(--ml-calendar-view-mini-selected-color);
	}

	/* Sidebar event list */
	.ml-cv__sidebar-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
		margin-bottom: var(--ml-space-3);
	}

	.ml-cv__sidebar-events {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
	}

	.ml-cv__sidebar-event {
		display: flex;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2);
		border-radius: var(--ml-radius-md);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__sidebar-event:hover {
		background-color: var(--ml-calendar-view-sidebar-event-hover-bg);
	}

	.ml-cv__sidebar-event-bar {
		width: 3px;
		border-radius: var(--ml-radius-full);
		flex-shrink: 0;
	}

	.ml-cv__sidebar-event-bar--gray { background-color: var(--ml-gray-400); }
	.ml-cv__sidebar-event-bar--blue { background-color: var(--ml-blue-500); }
	.ml-cv__sidebar-event-bar--purple { background-color: var(--ml-purple-500); }
	.ml-cv__sidebar-event-bar--green { background-color: var(--ml-green-500); }
	.ml-cv__sidebar-event-bar--pink { background-color: var(--ml-red-400); }
	.ml-cv__sidebar-event-bar--orange { background-color: var(--ml-amber-500); }
	.ml-cv__sidebar-event-bar--yellow { background-color: var(--ml-amber-400); }

	.ml-cv__sidebar-event-content {
		flex: 1;
		min-width: 0;
	}

	.ml-cv__sidebar-event-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-cv__sidebar-event-time {
		font-size: var(--ml-text-xs);
		color: var(--ml-calendar-view-weekday-color);
	}

	.ml-cv__sidebar-empty {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
		padding: var(--ml-space-6) 0;
	}
`;
var CalendarViewComponent = class CalendarViewComponent$1 {
	constructor() {
		this.view = "month";
		this.date = "";
		this.weekStartsOn = 0;
		this.maxVisibleEvents = 3;
		this.addButtonText = "Add event";
		this.hideNav = false;
		this.hideTodayButton = false;
		this.hideViewSelector = false;
		this.hideAddButton = false;
		this.events = [];
		this.isViewDropdownOpen = false;
		this._miniCalYear = 0;
		this._miniCalMonth = 0;
		this._hasScrolledToTime = false;
		this._boundCloseDropdown = null;
		this.navigatePrev = () => {
			const d = this._currentDate;
			let next;
			if (this.view === "month") next = addMonths(d, -1);
			else if (this.view === "week") next = addDays(d, -7);
			else next = addDays(d, -1);
			this.setDate(next);
		};
		this.navigateNext = () => {
			const d = this._currentDate;
			let next;
			if (this.view === "month") next = addMonths(d, 1);
			else if (this.view === "week") next = addDays(d, 7);
			else next = addDays(d, 1);
			this.setDate(next);
		};
		this.goToToday = () => {
			this.setDate(/* @__PURE__ */ new Date());
		};
		this.toggleViewDropdown = () => {
			this.isViewDropdownOpen = !this.isViewDropdownOpen;
		};
		this.setView = (view) => {
			this.view = view;
			this.isViewDropdownOpen = false;
			this._hasScrolledToTime = false;
			this.elementRef.dispatchEvent(new CustomEvent("ml:view-change", {
				bubbles: true,
				composed: true,
				detail: { view }
			}));
		};
		this.handleEventClick = (event) => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:event-click", {
				bubbles: true,
				composed: true,
				detail: { event }
			}));
		};
		this.handleDateClick = (iso) => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:date-click", {
				bubbles: true,
				composed: true,
				detail: { date: iso }
			}));
		};
		this.handleAddEvent = () => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:add-event", {
				bubbles: true,
				composed: true,
				detail: {}
			}));
		};
		this.handleAddEventOnDate = (iso) => {
			this.elementRef.dispatchEvent(new CustomEvent("ml:add-event", {
				bubbles: true,
				composed: true,
				detail: { date: iso }
			}));
		};
		this.showMoreEvents = (iso) => {
			this.date = iso;
			this.setView("day");
		};
		this.miniCalPrevMonth = () => {
			if (this._miniCalMonth === 0) {
				this._miniCalMonth = 11;
				this._miniCalYear--;
			} else this._miniCalMonth--;
		};
		this.miniCalNextMonth = () => {
			if (this._miniCalMonth === 11) {
				this._miniCalMonth = 0;
				this._miniCalYear++;
			} else this._miniCalMonth++;
		};
		this.handleMiniCalSelect = (iso) => {
			this.setDate(parseDate(iso));
		};
	}
	get hasHeaderLeftSlot() {
		return this.elementRef?.querySelector("[slot=\"header-left\"]") !== null;
	}
	get hasHeaderActionsSlot() {
		return this.elementRef?.querySelector("[slot=\"header-actions\"]") !== null;
	}
	get _currentDate() {
		if (this.date) return parseDate(this.date);
		return /* @__PURE__ */ new Date();
	}
	onCreate() {
		if (!this.date) {
			const now = /* @__PURE__ */ new Date();
			this.date = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
		}
		const d = this._currentDate;
		this._miniCalYear = d.getFullYear();
		this._miniCalMonth = d.getMonth();
		this._boundCloseDropdown = (e) => {
			if (!this.isViewDropdownOpen) return;
			const path = e.composedPath();
			const shadow = this.elementRef.shadowRoot;
			if (!shadow) return;
			const dropdown = shadow.querySelector(".ml-cv__view-dropdown");
			if (dropdown && !path.includes(dropdown)) this.isViewDropdownOpen = false;
		};
		document.addEventListener("click", this._boundCloseDropdown, true);
	}
	onDestroy() {
		if (this._boundCloseDropdown) document.removeEventListener("click", this._boundCloseDropdown, true);
	}
	onRender() {
		if ((this.view === "week" || this.view === "day") && !this._hasScrolledToTime) {
			const shadow = this.elementRef.shadowRoot;
			if (!shadow) return;
			const scrollEl = shadow.querySelector(".ml-cv__time-scroll");
			if (scrollEl) {
				scrollEl.scrollTop = 480;
				this._hasScrolledToTime = true;
			}
		}
	}
	get todayMonthAbbrev() {
		return getMonthAbbrev(/* @__PURE__ */ new Date());
	}
	get todayDayNumber() {
		return (/* @__PURE__ */ new Date()).getDate();
	}
	get headerTitle() {
		return formatMonthYear(this._currentDate);
	}
	get weekNumber() {
		return getISOWeekNumber(this._currentDate);
	}
	get headerSubtitle() {
		if (this.view === "month") return `Week ${this.weekNumber}`;
		if (this.view === "week") {
			const start = startOfWeek(this._currentDate, this.weekStartsOn);
			return formatDateRange(start, addDays(start, 6));
		}
		return getDayName(this._currentDate);
	}
	get currentIsoDate() {
		const d = this._currentDate;
		return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
	}
	get weekdayHeaders() {
		return getWeekdayHeaders(this.weekStartsOn);
	}
	get monthGrid() {
		const d = this._currentDate;
		const grid = getMonthGrid(d.getFullYear(), d.getMonth(), this.weekStartsOn);
		for (const cell of grid) cell.events = getEventsForDate(this.events, cell.iso);
		return grid;
	}
	get weekColumns() {
		return getWeekColumns(this._currentDate, this.weekStartsOn, this.events);
	}
	get timeSlots() {
		return getTimeSlots();
	}
	get dayColumn() {
		return getDayColumn(this._currentDate, this.events);
	}
	get dayEvents() {
		return getEventsForDate(this.events, this.currentIsoDate);
	}
	get dayViewDateLabel() {
		return this._currentDate.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric"
		});
	}
	get miniCalendarTitle() {
		return formatMonthYear(new Date(this._miniCalYear, this._miniCalMonth, 1));
	}
	get miniCalendarWeekdays() {
		return getWeekdayHeaders(this.weekStartsOn).map((h) => h.short.charAt(0));
	}
	get miniCalendarGrid() {
		return getMonthGrid(this._miniCalYear, this._miniCalMonth, this.weekStartsOn);
	}
	get miniCalendarDots() {
		return getMiniCalendarDots(this._miniCalYear, this._miniCalMonth, this.events);
	}
	setDate(d) {
		this.date = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
		this._miniCalYear = d.getFullYear();
		this._miniCalMonth = d.getMonth();
		this.elementRef.dispatchEvent(new CustomEvent("ml:date-change", {
			bubbles: true,
			composed: true,
			detail: { date: this.date }
		}));
	}
};
CalendarViewComponent = __decorate([MelodicComponent({
	selector: "ml-calendar-view",
	template: calendarViewTemplate,
	styles: calendarViewStyles,
	attributes: [
		"view",
		"date",
		"week-starts-on",
		"max-visible-events",
		"add-button-text",
		"hide-nav",
		"hide-today-button",
		"hide-view-selector",
		"hide-add-button"
	]
})], CalendarViewComponent);
const PHOSPHOR_ICON_MAP = {
	"acorn": "",
	"activity": "",
	"address-book": "",
	"address-book-tabs": "",
	"air-traffic-control": "",
	"airplane": "",
	"airplane-in-flight": "",
	"airplane-landing": "",
	"airplane-takeoff": "",
	"airplane-taxiing": "",
	"airplane-tilt": "",
	"airplay": "",
	"alarm": "",
	"alien": "",
	"align-bottom": "",
	"align-bottom-simple": "",
	"align-center-horizontal": "",
	"align-center-horizontal-simple": "",
	"align-center-vertical": "",
	"align-center-vertical-simple": "",
	"align-left": "",
	"align-left-simple": "",
	"align-right": "",
	"align-right-simple": "",
	"align-top": "",
	"align-top-simple": "",
	"amazon-logo": "",
	"ambulance": "",
	"anchor": "",
	"anchor-simple": "",
	"android-logo": "",
	"angle": "",
	"angular-logo": "",
	"aperture": "",
	"app-store-logo": "",
	"app-window": "",
	"apple-logo": "",
	"apple-podcasts-logo": "",
	"approximate-equals": "",
	"archive": "",
	"archive-box": "",
	"archive-tray": "",
	"armchair": "",
	"arrow-arc-left": "",
	"arrow-arc-right": "",
	"arrow-bend-double-up-left": "",
	"arrow-bend-double-up-right": "",
	"arrow-bend-down-left": "",
	"arrow-bend-down-right": "",
	"arrow-bend-left-down": "",
	"arrow-bend-left-up": "",
	"arrow-bend-right-down": "",
	"arrow-bend-right-up": "",
	"arrow-bend-up-left": "",
	"arrow-bend-up-right": "",
	"arrow-circle-down": "",
	"arrow-circle-down-left": "",
	"arrow-circle-down-right": "",
	"arrow-circle-left": "",
	"arrow-circle-right": "",
	"arrow-circle-up": "",
	"arrow-circle-up-left": "",
	"arrow-circle-up-right": "",
	"arrow-clockwise": "",
	"arrow-counter-clockwise": "",
	"arrow-down": "",
	"arrow-down-left": "",
	"arrow-down-right": "",
	"arrow-elbow-down-left": "",
	"arrow-elbow-down-right": "",
	"arrow-elbow-left": "",
	"arrow-elbow-left-down": "",
	"arrow-elbow-left-up": "",
	"arrow-elbow-right": "",
	"arrow-elbow-right-down": "",
	"arrow-elbow-right-up": "",
	"arrow-elbow-up-left": "",
	"arrow-elbow-up-right": "",
	"arrow-fat-down": "",
	"arrow-fat-left": "",
	"arrow-fat-line-down": "",
	"arrow-fat-line-left": "",
	"arrow-fat-line-right": "",
	"arrow-fat-line-up": "",
	"arrow-fat-lines-down": "",
	"arrow-fat-lines-left": "",
	"arrow-fat-lines-right": "",
	"arrow-fat-lines-up": "",
	"arrow-fat-right": "",
	"arrow-fat-up": "",
	"arrow-left": "",
	"arrow-line-down": "",
	"arrow-line-down-left": "",
	"arrow-line-down-right": "",
	"arrow-line-left": "",
	"arrow-line-right": "",
	"arrow-line-up": "",
	"arrow-line-up-left": "",
	"arrow-line-up-right": "",
	"arrow-right": "",
	"arrow-square-down": "",
	"arrow-square-down-left": "",
	"arrow-square-down-right": "",
	"arrow-square-in": "",
	"arrow-square-left": "",
	"arrow-square-out": "",
	"arrow-square-right": "",
	"arrow-square-up": "",
	"arrow-square-up-left": "",
	"arrow-square-up-right": "",
	"arrow-u-down-left": "",
	"arrow-u-down-right": "",
	"arrow-u-left-down": "",
	"arrow-u-left-up": "",
	"arrow-u-right-down": "",
	"arrow-u-right-up": "",
	"arrow-u-up-left": "",
	"arrow-u-up-right": "",
	"arrow-up": "",
	"arrow-up-left": "",
	"arrow-up-right": "",
	"arrows-clockwise": "",
	"arrows-counter-clockwise": "",
	"arrows-down-up": "",
	"arrows-horizontal": "",
	"arrows-in": "",
	"arrows-in-cardinal": "",
	"arrows-in-line-horizontal": "",
	"arrows-in-line-vertical": "",
	"arrows-in-simple": "",
	"arrows-left-right": "",
	"arrows-merge": "",
	"arrows-out": "",
	"arrows-out-cardinal": "",
	"arrows-out-line-horizontal": "",
	"arrows-out-line-vertical": "",
	"arrows-out-simple": "",
	"arrows-split": "",
	"arrows-vertical": "",
	"article": "",
	"article-medium": "",
	"article-ny-times": "",
	"asclepius": "",
	"asterisk": "",
	"asterisk-simple": "",
	"at": "",
	"atom": "",
	"avocado": "",
	"axe": "",
	"baby": "",
	"baby-carriage": "",
	"backpack": "",
	"backspace": "",
	"bag": "",
	"bag-simple": "",
	"balloon": "",
	"bandaids": "",
	"bank": "",
	"barbell": "",
	"barcode": "",
	"barn": "",
	"barricade": "",
	"baseball": "",
	"baseball-cap": "",
	"baseball-helmet": "",
	"basket": "",
	"basketball": "",
	"bathtub": "",
	"battery-charging": "",
	"battery-charging-vertical": "",
	"battery-empty": "",
	"battery-full": "",
	"battery-high": "",
	"battery-low": "",
	"battery-medium": "",
	"battery-plus": "",
	"battery-plus-vertical": "",
	"battery-vertical-empty": "",
	"battery-vertical-full": "",
	"battery-vertical-high": "",
	"battery-vertical-low": "",
	"battery-vertical-medium": "",
	"battery-warning": "",
	"battery-warning-vertical": "",
	"beach-ball": "",
	"beanie": "",
	"bed": "",
	"beer-bottle": "",
	"beer-stein": "",
	"behance-logo": "",
	"bell": "",
	"bell-ringing": "",
	"bell-simple": "",
	"bell-simple-ringing": "",
	"bell-simple-slash": "",
	"bell-simple-z": "",
	"bell-slash": "",
	"bell-z": "",
	"belt": "",
	"bezier-curve": "",
	"bicycle": "",
	"binary": "",
	"binoculars": "",
	"biohazard": "",
	"bird": "",
	"blueprint": "",
	"bluetooth": "",
	"bluetooth-connected": "",
	"bluetooth-slash": "",
	"bluetooth-x": "",
	"boat": "",
	"bomb": "",
	"bone": "",
	"book": "",
	"book-bookmark": "",
	"book-open": "",
	"book-open-text": "",
	"book-open-user": "",
	"bookmark": "",
	"bookmark-simple": "",
	"bookmarks": "",
	"bookmarks-simple": "",
	"books": "",
	"boot": "",
	"boules": "",
	"bounding-box": "",
	"bowl-food": "",
	"bowl-steam": "",
	"bowling-ball": "",
	"box-arrow-down": "",
	"box-arrow-up": "",
	"boxing-glove": "",
	"brackets-angle": "",
	"brackets-curly": "",
	"brackets-round": "",
	"brackets-square": "",
	"brain": "",
	"brandy": "",
	"bread": "",
	"bridge": "",
	"briefcase": "",
	"briefcase-metal": "",
	"broadcast": "",
	"broom": "",
	"browser": "",
	"browsers": "",
	"bug": "",
	"bug-beetle": "",
	"bug-droid": "",
	"building": "",
	"building-apartment": "",
	"building-office": "",
	"buildings": "",
	"bulldozer": "",
	"bus": "",
	"butterfly": "",
	"cable-car": "",
	"cactus": "",
	"caduceus": "",
	"cake": "",
	"calculator": "",
	"calendar": "",
	"calendar-blank": "",
	"calendar-check": "",
	"calendar-dot": "",
	"calendar-dots": "",
	"calendar-heart": "",
	"calendar-minus": "",
	"calendar-plus": "",
	"calendar-slash": "",
	"calendar-star": "",
	"calendar-x": "",
	"call-bell": "",
	"camera": "",
	"camera-plus": "",
	"camera-rotate": "",
	"camera-slash": "",
	"campfire": "",
	"car": "",
	"car-battery": "",
	"car-profile": "",
	"car-simple": "",
	"cardholder": "",
	"cards": "",
	"cards-three": "",
	"caret-circle-double-down": "",
	"caret-circle-double-left": "",
	"caret-circle-double-right": "",
	"caret-circle-double-up": "",
	"caret-circle-down": "",
	"caret-circle-left": "",
	"caret-circle-right": "",
	"caret-circle-up": "",
	"caret-circle-up-down": "",
	"caret-double-down": "",
	"caret-double-left": "",
	"caret-double-right": "",
	"caret-double-up": "",
	"caret-down": "",
	"caret-left": "",
	"caret-line-down": "",
	"caret-line-left": "",
	"caret-line-right": "",
	"caret-line-up": "",
	"caret-right": "",
	"caret-up": "",
	"caret-up-down": "",
	"carrot": "",
	"cash-register": "",
	"cassette-tape": "",
	"castle-turret": "",
	"cat": "",
	"cell-signal-full": "",
	"cell-signal-high": "",
	"cell-signal-low": "",
	"cell-signal-medium": "",
	"cell-signal-none": "",
	"cell-signal-slash": "",
	"cell-signal-x": "",
	"cell-tower": "",
	"certificate": "",
	"chair": "",
	"chalkboard": "",
	"chalkboard-simple": "",
	"chalkboard-teacher": "",
	"champagne": "",
	"charging-station": "",
	"chart-bar": "",
	"chart-bar-horizontal": "",
	"chart-donut": "",
	"chart-line": "",
	"chart-line-down": "",
	"chart-line-up": "",
	"chart-pie": "",
	"chart-pie-slice": "",
	"chart-polar": "",
	"chart-scatter": "",
	"chat": "",
	"chat-centered": "",
	"chat-centered-dots": "",
	"chat-centered-slash": "",
	"chat-centered-text": "",
	"chat-circle": "",
	"chat-circle-dots": "",
	"chat-circle-slash": "",
	"chat-circle-text": "",
	"chat-dots": "",
	"chat-slash": "",
	"chat-teardrop": "",
	"chat-teardrop-dots": "",
	"chat-teardrop-slash": "",
	"chat-teardrop-text": "",
	"chat-text": "",
	"chats": "",
	"chats-circle": "",
	"chats-teardrop": "",
	"check": "",
	"check-circle": "",
	"check-fat": "",
	"check-square": "",
	"check-square-offset": "",
	"checkerboard": "",
	"checks": "",
	"cheers": "",
	"cheese": "",
	"chef-hat": "",
	"cherries": "",
	"church": "",
	"cigarette": "",
	"cigarette-slash": "",
	"circle": "",
	"circle-dashed": "",
	"circle-half": "",
	"circle-half-tilt": "",
	"circle-notch": "",
	"circle-wavy": "",
	"circle-wavy-check": "",
	"circle-wavy-question": "",
	"circle-wavy-warning": "",
	"circles-four": "",
	"circles-three": "",
	"circles-three-plus": "",
	"circuitry": "",
	"city": "",
	"clipboard": "",
	"clipboard-text": "",
	"clock": "",
	"clock-afternoon": "",
	"clock-clockwise": "",
	"clock-countdown": "",
	"clock-counter-clockwise": "",
	"clock-user": "",
	"closed-captioning": "",
	"cloud": "",
	"cloud-arrow-down": "",
	"cloud-arrow-up": "",
	"cloud-check": "",
	"cloud-fog": "",
	"cloud-lightning": "",
	"cloud-moon": "",
	"cloud-rain": "",
	"cloud-slash": "",
	"cloud-snow": "",
	"cloud-sun": "",
	"cloud-warning": "",
	"cloud-x": "",
	"clover": "",
	"club": "",
	"coat-hanger": "",
	"coda-logo": "",
	"code": "",
	"code-block": "",
	"code-simple": "",
	"codepen-logo": "",
	"codesandbox-logo": "",
	"coffee": "",
	"coffee-bean": "",
	"coin": "",
	"coin-vertical": "",
	"coins": "",
	"columns": "",
	"columns-plus-left": "",
	"columns-plus-right": "",
	"command": "",
	"compass": "",
	"compass-rose": "",
	"compass-tool": "",
	"computer-tower": "",
	"confetti": "",
	"contactless-payment": "",
	"control": "",
	"cookie": "",
	"cooking-pot": "",
	"copy": "",
	"copy-simple": "",
	"copyleft": "",
	"copyright": "",
	"corners-in": "",
	"corners-out": "",
	"couch": "",
	"court-basketball": "",
	"cow": "",
	"cowboy-hat": "",
	"cpu": "",
	"crane": "",
	"crane-tower": "",
	"credit-card": "",
	"cricket": "",
	"crop": "",
	"cross": "",
	"crosshair": "",
	"crosshair-simple": "",
	"crown": "",
	"crown-cross": "",
	"crown-simple": "",
	"cube": "",
	"cube-focus": "",
	"cube-transparent": "",
	"currency-btc": "",
	"currency-circle-dollar": "",
	"currency-cny": "",
	"currency-dollar": "",
	"currency-dollar-simple": "",
	"currency-eth": "",
	"currency-eur": "",
	"currency-gbp": "",
	"currency-inr": "",
	"currency-jpy": "",
	"currency-krw": "",
	"currency-kzt": "",
	"currency-ngn": "",
	"currency-rub": "",
	"cursor": "",
	"cursor-click": "",
	"cursor-text": "",
	"cylinder": "",
	"database": "",
	"desk": "",
	"desktop": "",
	"desktop-tower": "",
	"detective": "",
	"dev-to-logo": "",
	"device-mobile": "",
	"device-mobile-camera": "",
	"device-mobile-slash": "",
	"device-mobile-speaker": "",
	"device-rotate": "",
	"device-tablet": "",
	"device-tablet-camera": "",
	"device-tablet-speaker": "",
	"devices": "",
	"diamond": "",
	"diamonds-four": "",
	"dice-five": "",
	"dice-four": "",
	"dice-one": "",
	"dice-six": "",
	"dice-three": "",
	"dice-two": "",
	"disc": "",
	"disco-ball": "",
	"discord-logo": "",
	"divide": "",
	"dna": "",
	"dog": "",
	"door": "",
	"door-open": "",
	"dot": "",
	"dot-outline": "",
	"dots-nine": "",
	"dots-six": "",
	"dots-six-vertical": "",
	"dots-three": "",
	"dots-three-circle": "",
	"dots-three-circle-vertical": "",
	"dots-three-outline": "",
	"dots-three-outline-vertical": "",
	"dots-three-vertical": "",
	"download": "",
	"download-simple": "",
	"dress": "",
	"dresser": "",
	"dribbble-logo": "",
	"drone": "",
	"drop": "",
	"drop-half": "",
	"drop-half-bottom": "",
	"drop-simple": "",
	"drop-slash": "",
	"dropbox-logo": "",
	"ear": "",
	"ear-slash": "",
	"egg": "",
	"egg-crack": "",
	"eject": "",
	"eject-simple": "",
	"elevator": "",
	"empty": "",
	"engine": "",
	"envelope": "",
	"envelope-open": "",
	"envelope-simple": "",
	"envelope-simple-open": "",
	"equalizer": "",
	"equals": "",
	"eraser": "",
	"escalator-down": "",
	"escalator-up": "",
	"exam": "",
	"exclamation-mark": "",
	"exclude": "",
	"exclude-square": "",
	"export": "",
	"eye": "",
	"eye-closed": "",
	"eye-slash": "",
	"eyedropper": "",
	"eyedropper-sample": "",
	"eyeglasses": "",
	"eyes": "",
	"face-mask": "",
	"facebook-logo": "",
	"factory": "",
	"faders": "",
	"faders-horizontal": "",
	"fallout-shelter": "",
	"fan": "",
	"farm": "",
	"fast-forward": "",
	"fast-forward-circle": "",
	"feather": "",
	"fediverse-logo": "",
	"figma-logo": "",
	"file": "",
	"file-archive": "",
	"file-arrow-down": "",
	"file-arrow-up": "",
	"file-audio": "",
	"file-c": "",
	"file-c-sharp": "",
	"file-cloud": "",
	"file-code": "",
	"file-cpp": "",
	"file-css": "",
	"file-csv": "",
	"file-dashed": "",
	"file-doc": "",
	"file-dotted": "",
	"file-html": "",
	"file-image": "",
	"file-ini": "",
	"file-jpg": "",
	"file-js": "",
	"file-jsx": "",
	"file-lock": "",
	"file-magnifying-glass": "",
	"file-md": "",
	"file-minus": "",
	"file-pdf": "",
	"file-plus": "",
	"file-png": "",
	"file-ppt": "",
	"file-py": "",
	"file-rs": "",
	"file-search": "",
	"file-sql": "",
	"file-svg": "",
	"file-text": "",
	"file-ts": "",
	"file-tsx": "",
	"file-txt": "",
	"file-video": "",
	"file-vue": "",
	"file-x": "",
	"file-xls": "",
	"file-zip": "",
	"files": "",
	"film-reel": "",
	"film-script": "",
	"film-slate": "",
	"film-strip": "",
	"fingerprint": "",
	"fingerprint-simple": "",
	"finn-the-human": "",
	"fire": "",
	"fire-extinguisher": "",
	"fire-simple": "",
	"fire-truck": "",
	"first-aid": "",
	"first-aid-kit": "",
	"fish": "",
	"fish-simple": "",
	"flag": "",
	"flag-banner": "",
	"flag-banner-fold": "",
	"flag-checkered": "",
	"flag-pennant": "",
	"flame": "",
	"flashlight": "",
	"flask": "",
	"flip-horizontal": "",
	"flip-vertical": "",
	"floppy-disk": "",
	"floppy-disk-back": "",
	"flow-arrow": "",
	"flower": "",
	"flower-lotus": "",
	"flower-tulip": "",
	"flying-saucer": "",
	"folder": "",
	"folder-dashed": "",
	"folder-dotted": "",
	"folder-lock": "",
	"folder-minus": "",
	"folder-notch": "",
	"folder-notch-minus": "",
	"folder-notch-open": "",
	"folder-notch-plus": "",
	"folder-open": "",
	"folder-plus": "",
	"folder-simple": "",
	"folder-simple-dashed": "",
	"folder-simple-dotted": "",
	"folder-simple-lock": "",
	"folder-simple-minus": "",
	"folder-simple-plus": "",
	"folder-simple-star": "",
	"folder-simple-user": "",
	"folder-star": "",
	"folder-user": "",
	"folders": "",
	"football": "",
	"football-helmet": "",
	"footprints": "",
	"fork-knife": "",
	"four-k": "",
	"frame-corners": "",
	"framer-logo": "",
	"function": "",
	"funnel": "",
	"funnel-simple": "",
	"funnel-simple-x": "",
	"funnel-x": "",
	"game-controller": "",
	"garage": "",
	"gas-can": "",
	"gas-pump": "",
	"gauge": "",
	"gavel": "",
	"gear": "",
	"gear-fine": "",
	"gear-six": "",
	"gender-female": "",
	"gender-intersex": "",
	"gender-male": "",
	"gender-neuter": "",
	"gender-nonbinary": "",
	"gender-transgender": "",
	"ghost": "",
	"gif": "",
	"gift": "",
	"git-branch": "",
	"git-commit": "",
	"git-diff": "",
	"git-fork": "",
	"git-merge": "",
	"git-pull-request": "",
	"github-logo": "",
	"gitlab-logo": "",
	"gitlab-logo-simple": "",
	"globe": "",
	"globe-hemisphere-east": "",
	"globe-hemisphere-west": "",
	"globe-simple": "",
	"globe-simple-x": "",
	"globe-stand": "",
	"globe-x": "",
	"goggles": "",
	"golf": "",
	"goodreads-logo": "",
	"google-cardboard-logo": "",
	"google-chrome-logo": "",
	"google-drive-logo": "",
	"google-logo": "",
	"google-photos-logo": "",
	"google-play-logo": "",
	"google-podcasts-logo": "",
	"gps": "",
	"gps-fix": "",
	"gps-slash": "",
	"gradient": "",
	"graduation-cap": "",
	"grains": "",
	"grains-slash": "",
	"graph": "",
	"graphics-card": "",
	"greater-than": "",
	"greater-than-or-equal": "",
	"grid-four": "",
	"grid-nine": "",
	"guitar": "",
	"hair-dryer": "",
	"hamburger": "",
	"hammer": "",
	"hand": "",
	"hand-arrow-down": "",
	"hand-arrow-up": "",
	"hand-coins": "",
	"hand-deposit": "",
	"hand-eye": "",
	"hand-fist": "",
	"hand-grabbing": "",
	"hand-heart": "",
	"hand-palm": "",
	"hand-peace": "",
	"hand-pointing": "",
	"hand-soap": "",
	"hand-swipe-left": "",
	"hand-swipe-right": "",
	"hand-tap": "",
	"hand-waving": "",
	"hand-withdraw": "",
	"handbag": "",
	"handbag-simple": "",
	"hands-clapping": "",
	"hands-praying": "",
	"handshake": "",
	"hard-drive": "",
	"hard-drives": "",
	"hard-hat": "",
	"hash": "",
	"hash-straight": "",
	"head-circuit": "",
	"headlights": "",
	"headphones": "",
	"headset": "",
	"heart": "",
	"heart-break": "",
	"heart-half": "",
	"heart-straight": "",
	"heart-straight-break": "",
	"heartbeat": "",
	"hexagon": "",
	"high-definition": "",
	"high-heel": "",
	"highlighter": "",
	"highlighter-circle": "",
	"hockey": "",
	"hoodie": "",
	"horse": "",
	"hospital": "",
	"hourglass": "",
	"hourglass-high": "",
	"hourglass-low": "",
	"hourglass-medium": "",
	"hourglass-simple": "",
	"hourglass-simple-high": "",
	"hourglass-simple-low": "",
	"hourglass-simple-medium": "",
	"house": "",
	"house-line": "",
	"house-simple": "",
	"hurricane": "",
	"ice-cream": "",
	"identification-badge": "",
	"identification-card": "",
	"image": "",
	"image-broken": "",
	"image-square": "",
	"images": "",
	"images-square": "",
	"infinity": "",
	"info": "",
	"instagram-logo": "",
	"intersect": "",
	"intersect-square": "",
	"intersect-three": "",
	"intersection": "",
	"invoice": "",
	"island": "",
	"jar": "",
	"jar-label": "",
	"jeep": "",
	"joystick": "",
	"kanban": "",
	"key": "",
	"key-return": "",
	"keyboard": "",
	"keyhole": "",
	"knife": "",
	"ladder": "",
	"ladder-simple": "",
	"lamp": "",
	"lamp-pendant": "",
	"laptop": "",
	"lasso": "",
	"lastfm-logo": "",
	"layout": "",
	"leaf": "",
	"lectern": "",
	"lego": "",
	"lego-smiley": "",
	"lemniscate": "",
	"less-than": "",
	"less-than-or-equal": "",
	"letter-circle-h": "",
	"letter-circle-p": "",
	"letter-circle-v": "",
	"lifebuoy": "",
	"lightbulb": "",
	"lightbulb-filament": "",
	"lighthouse": "",
	"lightning": "",
	"lightning-a": "",
	"lightning-slash": "",
	"line-segment": "",
	"line-segments": "",
	"line-vertical": "",
	"link": "",
	"link-break": "",
	"link-simple": "",
	"link-simple-break": "",
	"link-simple-horizontal": "",
	"link-simple-horizontal-break": "",
	"linkedin-logo": "",
	"linktree-logo": "",
	"linux-logo": "",
	"list": "",
	"list-bullets": "",
	"list-checks": "",
	"list-dashes": "",
	"list-heart": "",
	"list-magnifying-glass": "",
	"list-numbers": "",
	"list-plus": "",
	"list-star": "",
	"lock": "",
	"lock-key": "",
	"lock-key-open": "",
	"lock-laminated": "",
	"lock-laminated-open": "",
	"lock-open": "",
	"lock-simple": "",
	"lock-simple-open": "",
	"lockers": "",
	"log": "",
	"magic-wand": "",
	"magnet": "",
	"magnet-straight": "",
	"magnifying-glass": "",
	"magnifying-glass-minus": "",
	"magnifying-glass-plus": "",
	"mailbox": "",
	"map-pin": "",
	"map-pin-area": "",
	"map-pin-line": "",
	"map-pin-plus": "",
	"map-pin-simple": "",
	"map-pin-simple-area": "",
	"map-pin-simple-line": "",
	"map-trifold": "",
	"markdown-logo": "",
	"marker-circle": "",
	"martini": "",
	"mask-happy": "",
	"mask-sad": "",
	"mastodon-logo": "",
	"math-operations": "",
	"matrix-logo": "",
	"medal": "",
	"medal-military": "",
	"medium-logo": "",
	"megaphone": "",
	"megaphone-simple": "",
	"member-of": "",
	"memory": "",
	"messenger-logo": "",
	"meta-logo": "",
	"meteor": "",
	"metronome": "",
	"microphone": "",
	"microphone-slash": "",
	"microphone-stage": "",
	"microscope": "",
	"microsoft-excel-logo": "",
	"microsoft-outlook-logo": "",
	"microsoft-powerpoint-logo": "",
	"microsoft-teams-logo": "",
	"microsoft-word-logo": "",
	"minus": "",
	"minus-circle": "",
	"minus-square": "",
	"money": "",
	"money-wavy": "",
	"monitor": "",
	"monitor-arrow-up": "",
	"monitor-play": "",
	"moon": "",
	"moon-stars": "",
	"moped": "",
	"moped-front": "",
	"mosque": "",
	"motorcycle": "",
	"mountains": "",
	"mouse": "",
	"mouse-left-click": "",
	"mouse-middle-click": "",
	"mouse-right-click": "",
	"mouse-scroll": "",
	"mouse-simple": "",
	"music-note": "",
	"music-note-simple": "",
	"music-notes": "",
	"music-notes-minus": "",
	"music-notes-plus": "",
	"music-notes-simple": "",
	"navigation-arrow": "",
	"needle": "",
	"network": "",
	"network-slash": "",
	"network-x": "",
	"newspaper": "",
	"newspaper-clipping": "",
	"not-equals": "",
	"not-member-of": "",
	"not-subset-of": "",
	"not-superset-of": "",
	"notches": "",
	"note": "",
	"note-blank": "",
	"note-pencil": "",
	"notebook": "",
	"notepad": "",
	"notification": "",
	"notion-logo": "",
	"nuclear-plant": "",
	"number-circle-eight": "",
	"number-circle-five": "",
	"number-circle-four": "",
	"number-circle-nine": "",
	"number-circle-one": "",
	"number-circle-seven": "",
	"number-circle-six": "",
	"number-circle-three": "",
	"number-circle-two": "",
	"number-circle-zero": "",
	"number-eight": "",
	"number-five": "",
	"number-four": "",
	"number-nine": "",
	"number-one": "",
	"number-seven": "",
	"number-six": "",
	"number-square-eight": "",
	"number-square-five": "",
	"number-square-four": "",
	"number-square-nine": "",
	"number-square-one": "",
	"number-square-seven": "",
	"number-square-six": "",
	"number-square-three": "",
	"number-square-two": "",
	"number-square-zero": "",
	"number-three": "",
	"number-two": "",
	"number-zero": "",
	"numpad": "",
	"nut": "",
	"ny-times-logo": "",
	"octagon": "",
	"office-chair": "",
	"onigiri": "",
	"open-ai-logo": "",
	"option": "",
	"orange": "",
	"orange-slice": "",
	"oven": "",
	"package": "",
	"paint-brush": "",
	"paint-brush-broad": "",
	"paint-brush-household": "",
	"paint-bucket": "",
	"paint-roller": "",
	"palette": "",
	"panorama": "",
	"pants": "",
	"paper-plane": "",
	"paper-plane-right": "",
	"paper-plane-tilt": "",
	"paperclip": "",
	"paperclip-horizontal": "",
	"parachute": "",
	"paragraph": "",
	"parallelogram": "",
	"park": "",
	"password": "",
	"path": "",
	"patreon-logo": "",
	"pause": "",
	"pause-circle": "",
	"paw-print": "",
	"paypal-logo": "",
	"peace": "",
	"pen": "",
	"pen-nib": "",
	"pen-nib-straight": "",
	"pencil": "",
	"pencil-circle": "",
	"pencil-line": "",
	"pencil-ruler": "",
	"pencil-simple": "",
	"pencil-simple-line": "",
	"pencil-simple-slash": "",
	"pencil-slash": "",
	"pentagon": "",
	"pentagram": "",
	"pepper": "",
	"percent": "",
	"person": "",
	"person-arms-spread": "",
	"person-simple": "",
	"person-simple-bike": "",
	"person-simple-circle": "",
	"person-simple-hike": "",
	"person-simple-run": "",
	"person-simple-ski": "",
	"person-simple-snowboard": "",
	"person-simple-swim": "",
	"person-simple-tai-chi": "",
	"person-simple-throw": "",
	"person-simple-walk": "",
	"perspective": "",
	"phone": "",
	"phone-call": "",
	"phone-disconnect": "",
	"phone-incoming": "",
	"phone-list": "",
	"phone-outgoing": "",
	"phone-pause": "",
	"phone-plus": "",
	"phone-slash": "",
	"phone-transfer": "",
	"phone-x": "",
	"phosphor-logo": "",
	"pi": "",
	"piano-keys": "",
	"picnic-table": "",
	"picture-in-picture": "",
	"piggy-bank": "",
	"pill": "",
	"ping-pong": "",
	"pint-glass": "",
	"pinterest-logo": "",
	"pinwheel": "",
	"pipe": "",
	"pipe-wrench": "",
	"pix-logo": "",
	"pizza": "",
	"placeholder": "",
	"planet": "",
	"plant": "",
	"play": "",
	"play-circle": "",
	"play-pause": "",
	"playlist": "",
	"plug": "",
	"plug-charging": "",
	"plugs": "",
	"plugs-connected": "",
	"plus": "",
	"plus-circle": "",
	"plus-minus": "",
	"plus-square": "",
	"poker-chip": "",
	"police-car": "",
	"polygon": "",
	"popcorn": "",
	"popsicle": "",
	"potted-plant": "",
	"power": "",
	"prescription": "",
	"presentation": "",
	"presentation-chart": "",
	"printer": "",
	"prohibit": "",
	"prohibit-inset": "",
	"projector-screen": "",
	"projector-screen-chart": "",
	"pulse": "",
	"push-pin": "",
	"push-pin-simple": "",
	"push-pin-simple-slash": "",
	"push-pin-slash": "",
	"puzzle-piece": "",
	"qr-code": "",
	"question": "",
	"question-mark": "",
	"queue": "",
	"quotes": "",
	"rabbit": "",
	"racquet": "",
	"radical": "",
	"radio": "",
	"radio-button": "",
	"radioactive": "",
	"rainbow": "",
	"rainbow-cloud": "",
	"ranking": "",
	"read-cv-logo": "",
	"receipt": "",
	"receipt-x": "",
	"record": "",
	"rectangle": "",
	"rectangle-dashed": "",
	"recycle": "",
	"reddit-logo": "",
	"repeat": "",
	"repeat-once": "",
	"replit-logo": "",
	"resize": "",
	"rewind": "",
	"rewind-circle": "",
	"road-horizon": "",
	"robot": "",
	"rocket": "",
	"rocket-launch": "",
	"rows": "",
	"rows-plus-bottom": "",
	"rows-plus-top": "",
	"rss": "",
	"rss-simple": "",
	"rug": "",
	"ruler": "",
	"sailboat": "",
	"scales": "",
	"scan": "",
	"scan-smiley": "",
	"scissors": "",
	"scooter": "",
	"screencast": "",
	"screwdriver": "",
	"scribble": "",
	"scribble-loop": "",
	"scroll": "",
	"seal": "",
	"seal-check": "",
	"seal-percent": "",
	"seal-question": "",
	"seal-warning": "",
	"seat": "",
	"seatbelt": "",
	"security-camera": "",
	"selection": "",
	"selection-all": "",
	"selection-background": "",
	"selection-foreground": "",
	"selection-inverse": "",
	"selection-plus": "",
	"selection-slash": "",
	"shapes": "",
	"share": "",
	"share-fat": "",
	"share-network": "",
	"shield": "",
	"shield-check": "",
	"shield-checkered": "",
	"shield-chevron": "",
	"shield-plus": "",
	"shield-slash": "",
	"shield-star": "",
	"shield-warning": "",
	"shipping-container": "",
	"shirt-folded": "",
	"shooting-star": "",
	"shopping-bag": "",
	"shopping-bag-open": "",
	"shopping-cart": "",
	"shopping-cart-simple": "",
	"shovel": "",
	"shower": "",
	"shrimp": "",
	"shuffle": "",
	"shuffle-angular": "",
	"shuffle-simple": "",
	"sidebar": "",
	"sidebar-simple": "",
	"sigma": "",
	"sign-in": "",
	"sign-out": "",
	"signature": "",
	"signpost": "",
	"sim-card": "",
	"siren": "",
	"sketch-logo": "",
	"skip-back": "",
	"skip-back-circle": "",
	"skip-forward": "",
	"skip-forward-circle": "",
	"skull": "",
	"skype-logo": "",
	"slack-logo": "",
	"sliders": "",
	"sliders-horizontal": "",
	"slideshow": "",
	"smiley": "",
	"smiley-angry": "",
	"smiley-blank": "",
	"smiley-meh": "",
	"smiley-melting": "",
	"smiley-nervous": "",
	"smiley-sad": "",
	"smiley-sticker": "",
	"smiley-wink": "",
	"smiley-x-eyes": "",
	"snapchat-logo": "",
	"sneaker": "",
	"sneaker-move": "",
	"snowflake": "",
	"soccer-ball": "",
	"sock": "",
	"solar-panel": "",
	"solar-roof": "",
	"sort-ascending": "",
	"sort-descending": "",
	"soundcloud-logo": "",
	"spade": "",
	"sparkle": "",
	"speaker-hifi": "",
	"speaker-high": "",
	"speaker-low": "",
	"speaker-none": "",
	"speaker-simple-high": "",
	"speaker-simple-low": "",
	"speaker-simple-none": "",
	"speaker-simple-slash": "",
	"speaker-simple-x": "",
	"speaker-slash": "",
	"speaker-x": "",
	"speedometer": "",
	"sphere": "",
	"spinner": "",
	"spinner-ball": "",
	"spinner-gap": "",
	"spiral": "",
	"split-horizontal": "",
	"split-vertical": "",
	"spotify-logo": "",
	"spray-bottle": "",
	"square": "",
	"square-half": "",
	"square-half-bottom": "",
	"square-logo": "",
	"square-split-horizontal": "",
	"square-split-vertical": "",
	"squares-four": "",
	"stack": "",
	"stack-minus": "",
	"stack-overflow-logo": "",
	"stack-plus": "",
	"stack-simple": "",
	"stairs": "",
	"stamp": "",
	"standard-definition": "",
	"star": "",
	"star-and-crescent": "",
	"star-four": "",
	"star-half": "",
	"star-of-david": "",
	"steam-logo": "",
	"steering-wheel": "",
	"steps": "",
	"stethoscope": "",
	"sticker": "",
	"stool": "",
	"stop": "",
	"stop-circle": "",
	"storefront": "",
	"strategy": "",
	"stripe-logo": "",
	"student": "",
	"subset-of": "",
	"subset-proper-of": "",
	"subtitles": "",
	"subtitles-slash": "",
	"subtract": "",
	"subtract-square": "",
	"subway": "",
	"suitcase": "",
	"suitcase-rolling": "",
	"suitcase-simple": "",
	"sun": "",
	"sun-dim": "",
	"sun-horizon": "",
	"sunglasses": "",
	"superset-of": "",
	"superset-proper-of": "",
	"swap": "",
	"swatches": "",
	"swimming-pool": "",
	"sword": "",
	"synagogue": "",
	"syringe": "",
	"t-shirt": "",
	"table": "",
	"tabs": "",
	"tag": "",
	"tag-chevron": "",
	"tag-simple": "",
	"target": "",
	"taxi": "",
	"tea-bag": "",
	"telegram-logo": "",
	"television": "",
	"television-simple": "",
	"tennis-ball": "",
	"tent": "",
	"terminal": "",
	"terminal-window": "",
	"test-tube": "",
	"text-a-underline": "",
	"text-aa": "",
	"text-align-center": "",
	"text-align-justify": "",
	"text-align-left": "",
	"text-align-right": "",
	"text-b": "",
	"text-bolder": "",
	"text-columns": "",
	"text-h": "",
	"text-h-five": "",
	"text-h-four": "",
	"text-h-one": "",
	"text-h-six": "",
	"text-h-three": "",
	"text-h-two": "",
	"text-indent": "",
	"text-italic": "",
	"text-outdent": "",
	"text-strikethrough": "",
	"text-subscript": "",
	"text-superscript": "",
	"text-t": "",
	"text-t-slash": "",
	"text-underline": "",
	"textbox": "",
	"thermometer": "",
	"thermometer-cold": "",
	"thermometer-hot": "",
	"thermometer-simple": "",
	"threads-logo": "",
	"three-d": "",
	"thumbs-down": "",
	"thumbs-up": "",
	"ticket": "",
	"tidal-logo": "",
	"tiktok-logo": "",
	"tilde": "",
	"timer": "",
	"tip-jar": "",
	"tipi": "",
	"tire": "",
	"toggle-left": "",
	"toggle-right": "",
	"toilet": "",
	"toilet-paper": "",
	"toolbox": "",
	"tooth": "",
	"tornado": "",
	"tote": "",
	"tote-simple": "",
	"towel": "",
	"tractor": "",
	"trademark": "",
	"trademark-registered": "",
	"traffic-cone": "",
	"traffic-sign": "",
	"traffic-signal": "",
	"train": "",
	"train-regional": "",
	"train-simple": "",
	"tram": "",
	"translate": "",
	"trash": "",
	"trash-simple": "",
	"tray": "",
	"tray-arrow-down": "",
	"tray-arrow-up": "",
	"treasure-chest": "",
	"tree": "",
	"tree-evergreen": "",
	"tree-palm": "",
	"tree-structure": "",
	"tree-view": "",
	"trend-down": "",
	"trend-up": "",
	"triangle": "",
	"triangle-dashed": "",
	"trolley": "",
	"trolley-suitcase": "",
	"trophy": "",
	"truck": "",
	"truck-trailer": "",
	"tumblr-logo": "",
	"twitch-logo": "",
	"twitter-logo": "",
	"umbrella": "",
	"umbrella-simple": "",
	"union": "",
	"unite": "",
	"unite-square": "",
	"upload": "",
	"upload-simple": "",
	"usb": "",
	"user": "",
	"user-check": "",
	"user-circle": "",
	"user-circle-check": "",
	"user-circle-dashed": "",
	"user-circle-gear": "",
	"user-circle-minus": "",
	"user-circle-plus": "",
	"user-focus": "",
	"user-gear": "",
	"user-list": "",
	"user-minus": "",
	"user-plus": "",
	"user-rectangle": "",
	"user-sound": "",
	"user-square": "",
	"user-switch": "",
	"users": "",
	"users-four": "",
	"users-three": "",
	"van": "",
	"vault": "",
	"vector-three": "",
	"vector-two": "",
	"vibrate": "",
	"video": "",
	"video-camera": "",
	"video-camera-slash": "",
	"video-conference": "",
	"vignette": "",
	"vinyl-record": "",
	"virtual-reality": "",
	"virus": "",
	"visor": "",
	"voicemail": "",
	"volleyball": "",
	"wall": "",
	"wallet": "",
	"warehouse": "",
	"warning": "",
	"warning-circle": "",
	"warning-diamond": "",
	"warning-octagon": "",
	"washing-machine": "",
	"watch": "",
	"wave-sawtooth": "",
	"wave-sine": "",
	"wave-square": "",
	"wave-triangle": "",
	"waveform": "",
	"waveform-slash": "",
	"waves": "",
	"webcam": "",
	"webcam-slash": "",
	"webhooks-logo": "",
	"wechat-logo": "",
	"whatsapp-logo": "",
	"wheelchair": "",
	"wheelchair-motion": "",
	"wifi-high": "",
	"wifi-low": "",
	"wifi-medium": "",
	"wifi-none": "",
	"wifi-slash": "",
	"wifi-x": "",
	"wind": "",
	"windmill": "",
	"windows-logo": "",
	"wine": "",
	"wrench": "",
	"x": "",
	"x-circle": "",
	"x-logo": "",
	"x-square": "",
	"yarn": "",
	"yin-yang": "",
	"youtube-logo": ""
};
const iconTemplate = (c) => {
	return html`<i class="${c.format === "regular" ? "ph" : `ph-${c.format}`}">${PHOSPHOR_ICON_MAP[c.icon] ?? ""}</i>`;
};
const iconStyles = () => css`
	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Color — defaults to inherited text color */
		--ml-icon-color: currentColor;

		/* Size — default 24px (md) */
		--ml-icon-size: 24px;

		color: var(--ml-icon-color);
	}

	:host([size='xs']) {
		--ml-icon-size: 12px;
	}
	:host([size='sm']) {
		--ml-icon-size: 16px;
	}
	:host([size='md']) {
		--ml-icon-size: 24px;
	}
	:host([size='lg']) {
		--ml-icon-size: 32px;
	}
	:host([size='xl']) {
		--ml-icon-size: 48px;
	}

	i {
		font-style: normal;
		font-size: var(--ml-icon-size);
		line-height: 1;
		speak: never;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	i.ph { font-family: 'Phosphor' !important; }
	i.ph-bold { font-family: 'Phosphor-Bold' !important; }
	i.ph-fill { font-family: 'Phosphor-Fill' !important; }
	i.ph-light { font-family: 'Phosphor-Light' !important; }
	i.ph-thin { font-family: 'Phosphor-Thin' !important; }
`;
var IconComponent = class IconComponent$1 {
	constructor() {
		this.icon = "";
		this.format = "regular";
	}
};
IconComponent = __decorate([MelodicComponent({
	selector: "ml-icon",
	template: iconTemplate,
	styles: iconStyles,
	attributes: [
		"icon",
		"format",
		"size"
	]
})], IconComponent);
function tabsTemplate(c) {
	const hasTabs = c.tabs.length > 0;
	return html`
		<div
			class=${classMap({
		"ml-tabs": true,
		[`ml-tabs--${c.variant}`]: true,
		[`ml-tabs--${c.size}`]: true,
		[`ml-tabs--${c.orientation}`]: true
	})}
		>
			<div
				class="ml-tabs__list"
				role="tablist"
				aria-orientation=${c.orientation}
				@keydown=${c.handleKeyDown}
			>
				${hasTabs ? repeat(c.tabs, (tab) => `${tab.value}-${c.value === tab.value}`, (tab) => renderTabButton(c, tab)) : html`<slot name="tab" @slotchange=${c.handleTabSlotChange}></slot>`}
			</div>

			<div class="ml-tabs__panels">
				<slot></slot>
			</div>
		</div>
	`;
}
function renderTabButton(c, tab) {
	const isActive = c.value === tab.value;
	return html`
		<button
			type="button"
			role="tab"
			class=${classMap({
		"ml-tabs__tab": true,
		"ml-tabs__tab--active": isActive,
		"ml-tabs__tab--disabled": !!tab.disabled
	})}
			data-value=${tab.value}
			aria-selected=${isActive}
			aria-disabled=${tab.disabled || false}
			tabindex=${isActive ? "0" : "-1"}
			?disabled=${tab.disabled}
			@click=${() => c.handleTabClick(tab.value, tab.href)}
		>
			${when(!!tab.icon, () => html`<ml-icon icon=${tab.icon} size="sm"></ml-icon>`)}
			<span class="ml-tabs__tab-label">${tab.label}</span>
		</button>
	`;
}
const tabsStyles = () => css`
	:host {
		/* Tab list */
		--ml-tabs-list-gap: var(--ml-space-1);
		--ml-tabs-list-border-width: var(--ml-border);
		--ml-tabs-list-border-color: var(--ml-color-border);

		/* Tab button base */
		--ml-tabs-tab-gap: var(--ml-space-2);
		--ml-tabs-tab-padding-y: var(--ml-space-2);
		--ml-tabs-tab-padding-x: var(--ml-space-4);
		--ml-tabs-tab-font-family: var(--ml-font-sans);
		--ml-tabs-tab-font-weight: var(--ml-font-medium);
		--ml-tabs-tab-color: var(--ml-color-text-secondary);
		--ml-tabs-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Tab hover */
		--ml-tabs-tab-hover-color: var(--ml-color-text);

		/* Tab focus */
		--ml-tabs-tab-focus-color: var(--ml-color-primary);

		/* Tab active */
		--ml-tabs-tab-active-color: var(--ml-color-primary);

		/* Tab disabled */
		--ml-tabs-tab-disabled-color: var(--ml-color-text-muted);
		--ml-tabs-tab-disabled-opacity: 0.6;

		/* Label */
		--ml-tabs-tab-label-line-height: var(--ml-leading-tight);

		/* Panels */
		--ml-tabs-panels-padding-top: var(--ml-space-4);

		/* Vertical border */
		--ml-tabs-vertical-border-padding: var(--ml-space-2);
		--ml-tabs-vertical-border-margin: var(--ml-space-4);

		/* Line variant - indicator */
		--ml-tabs-line-indicator-height: 2px;
		--ml-tabs-line-indicator-color: var(--ml-color-primary);

		/* Enclosed variant */
		--ml-tabs-enclosed-tab-radius: var(--ml-radius);
		--ml-tabs-enclosed-active-bg: var(--ml-color-surface);
		--ml-tabs-enclosed-active-border-color: var(--ml-color-border);
		--ml-tabs-enclosed-active-color: var(--ml-color-text);
		--ml-tabs-enclosed-hover-bg: var(--ml-color-surface-secondary);

		/* Pills variant */
		--ml-tabs-pills-tab-radius: var(--ml-radius);
		--ml-tabs-pills-active-bg: var(--ml-color-primary-subtle);
		--ml-tabs-pills-active-color: var(--ml-color-primary);
		--ml-tabs-pills-hover-bg: var(--ml-color-surface-secondary);

		/* Size: sm */
		--ml-tabs-sm-padding-y: var(--ml-space-1-5);
		--ml-tabs-sm-padding-x: var(--ml-space-3);
		--ml-tabs-sm-font-size: var(--ml-text-sm);

		/* Size: md */
		--ml-tabs-md-padding-y: var(--ml-space-2);
		--ml-tabs-md-padding-x: var(--ml-space-4);
		--ml-tabs-md-font-size: var(--ml-text-sm);

		/* Size: lg */
		--ml-tabs-lg-padding-y: var(--ml-space-2-5);
		--ml-tabs-lg-padding-x: var(--ml-space-5);
		--ml-tabs-lg-font-size: var(--ml-text-base);

		display: block;
		width: 100%;
	}

	.ml-tabs {
		display: flex;
		flex-direction: column;
	}

	/* Vertical orientation */
	.ml-tabs--vertical {
		flex-direction: row;
	}

	.ml-tabs--vertical .ml-tabs__list {
		flex-direction: column;
		border-bottom: none;
		border-right: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		padding-right: var(--ml-tabs-vertical-border-padding);
		margin-right: var(--ml-tabs-vertical-border-margin);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		flex: 1;
		min-width: 0;
	}

	/* Tab list */
	.ml-tabs__list {
		display: flex;
		gap: var(--ml-tabs-list-gap);
		position: relative;
	}

	/* Tab button base */
	.ml-tabs__tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap);
		padding: var(--ml-tabs-tab-padding-y) var(--ml-tabs-tab-padding-x);
		font-family: var(--ml-tabs-tab-font-family);
		font-weight: var(--ml-tabs-tab-font-weight);
		color: var(--ml-tabs-tab-color);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition),
			background-color var(--ml-tabs-tab-transition),
			border-color var(--ml-tabs-tab-transition);
	}

	.ml-tabs__tab:hover:not(:disabled) {
		color: var(--ml-tabs-tab-hover-color);
	}

	.ml-tabs__tab:focus-visible {
		outline: 2px solid var(--ml-tabs-tab-focus-color);
		outline-offset: 2px;
	}

	.ml-tabs__tab--active {
		color: var(--ml-tabs-tab-active-color);
	}

	.ml-tabs__tab--disabled {
		color: var(--ml-tabs-tab-disabled-color);
		cursor: not-allowed;
		opacity: var(--ml-tabs-tab-disabled-opacity);
	}

	.ml-tabs__tab-label {
		line-height: var(--ml-tabs-tab-label-line-height);
	}

	/* Panels */
	.ml-tabs__panels {
		padding-top: var(--ml-tabs-panels-padding-top);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		padding-top: 0;
	}

	/* ============================================
	   VARIANT: Line (underline style)
	   ============================================ */
	.ml-tabs--line .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		gap: 0;
	}

	.ml-tabs--line .ml-tabs__tab {
		position: relative;
		padding-bottom: calc(var(--ml-tabs-tab-padding-y) + var(--ml-tabs-line-indicator-height));
		margin-bottom: -1px;
	}

	.ml-tabs--line .ml-tabs__tab::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--ml-tabs-line-indicator-height);
		background-color: transparent;
		transition: background-color var(--ml-tabs-tab-transition);
	}

	.ml-tabs--line .ml-tabs__tab--active::after {
		background-color: var(--ml-tabs-line-indicator-color);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__list {
		border-bottom: none;
		border-right: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab {
		padding-bottom: var(--ml-tabs-tab-padding-y);
		padding-right: calc(var(--ml-tabs-tab-padding-x) + var(--ml-tabs-line-indicator-height));
		margin-bottom: 0;
		margin-right: -1px;
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab::after {
		bottom: auto;
		left: auto;
		top: 0;
		right: 0;
		width: var(--ml-tabs-line-indicator-height);
		height: 100%;
	}

	/* ============================================
	   VARIANT: Enclosed (bordered tab style)
	   ============================================ */
	.ml-tabs--enclosed .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		gap: 0;
	}

	.ml-tabs--enclosed .ml-tabs__tab {
		position: relative;
		border: var(--ml-tabs-list-border-width) solid transparent;
		border-bottom: none;
		border-radius: var(--ml-tabs-enclosed-tab-radius) var(--ml-tabs-enclosed-tab-radius) 0 0;
		margin-bottom: -1px;
		background-color: transparent;
	}

	.ml-tabs--enclosed .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-enclosed-hover-bg);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active {
		background-color: var(--ml-tabs-enclosed-active-bg);
		border-color: var(--ml-tabs-enclosed-active-border-color);
		color: var(--ml-tabs-enclosed-active-color);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--ml-tabs-enclosed-active-bg);
	}

	/* ============================================
	   VARIANT: Pills (soft rounded style)
	   ============================================ */
	.ml-tabs--pills .ml-tabs__list {
		gap: var(--ml-tabs-list-gap);
	}

	.ml-tabs--pills .ml-tabs__tab {
		border-radius: var(--ml-tabs-pills-tab-radius);
	}

	.ml-tabs--pills .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-pills-hover-bg);
	}

	.ml-tabs--pills .ml-tabs__tab--active {
		background-color: var(--ml-tabs-pills-active-bg);
		color: var(--ml-tabs-pills-active-color);
	}

	/* ============================================
	   SIZE VARIANTS
	   ============================================ */
	.ml-tabs--sm .ml-tabs__tab {
		padding: var(--ml-tabs-sm-padding-y) var(--ml-tabs-sm-padding-x);
		font-size: var(--ml-tabs-sm-font-size);
	}

	.ml-tabs--md .ml-tabs__tab {
		padding: var(--ml-tabs-md-padding-y) var(--ml-tabs-md-padding-x);
		font-size: var(--ml-tabs-md-font-size);
	}

	.ml-tabs--lg .ml-tabs__tab {
		padding: var(--ml-tabs-lg-padding-y) var(--ml-tabs-lg-padding-x);
		font-size: var(--ml-tabs-lg-font-size);
	}

	/* ============================================
	   SLOTTED TAB STYLING
	   ============================================ */
	::slotted(ml-tab) {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap);
		padding: var(--ml-tabs-tab-padding-y) var(--ml-tabs-tab-padding-x);
		font-family: var(--ml-tabs-tab-font-family);
		font-weight: var(--ml-tabs-tab-font-weight);
		color: var(--ml-tabs-tab-color);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition),
			background-color var(--ml-tabs-tab-transition);
	}

	::slotted(ml-tab:hover) {
		color: var(--ml-tabs-tab-hover-color);
	}

	::slotted(ml-tab[active]) {
		color: var(--ml-tabs-tab-active-color);
	}

	::slotted(ml-tab[disabled]) {
		color: var(--ml-tabs-tab-disabled-color);
		cursor: not-allowed;
	}
`;
var TabsComponent = class TabsComponent$1 {
	constructor() {
		this.value = "";
		this.variant = "line";
		this.size = "md";
		this.orientation = "horizontal";
		this.routed = false;
		this.tabs = [];
		this._slottedTabs = [];
		this._handleNavigation = this.onNavigation.bind(this);
		this._handleTabClick = (event) => {
			const { value, href } = event.detail;
			this.handleTabClick(value, href);
		};
		this.handleTabSlotChange = (event) => {
			this._slottedTabs = event.target.assignedElements({ flatten: true });
			if (!this.value && this._slottedTabs.length > 0) {
				const firstTab = this._slottedTabs.find((tab) => !tab.hasAttribute("disabled"));
				if (firstTab) this.value = firstTab.getAttribute("value") || "";
			}
			this.updateTabStates();
			this.updatePanelVisibility();
		};
		this.handleTabClick = (tabValue, href) => {
			if (this.getTabByValue(tabValue)?.disabled) return;
			if (this.routed && href) {
				window.history.pushState({}, "", href);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
			this.value = tabValue;
			this.updateTabStates();
			this.updatePanelVisibility();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: tabValue }
			}));
		};
		this.handleKeyDown = (event) => {
			const enabledTabs = this.getAllTabs().filter((t) => !t.disabled);
			const currentIndex = enabledTabs.findIndex((t) => t.value === this.value);
			let newIndex = currentIndex;
			switch (event.key) {
				case "ArrowLeft":
				case "ArrowUp":
					event.preventDefault();
					newIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
					break;
				case "ArrowRight":
				case "ArrowDown":
					event.preventDefault();
					newIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
					break;
				case "Home":
					event.preventDefault();
					newIndex = 0;
					break;
				case "End":
					event.preventDefault();
					newIndex = enabledTabs.length - 1;
					break;
				default: return;
			}
			if (newIndex !== currentIndex && enabledTabs[newIndex]) {
				const tab = enabledTabs[newIndex];
				this.handleTabClick(tab.value, tab.href);
				this.focusTab(tab.value);
			}
		};
	}
	onCreate() {
		this.elementRef.addEventListener("ml:tab-click", this._handleTabClick);
		if (this.routed) {
			window.addEventListener("NavigationEvent", this._handleNavigation);
			this.syncWithRoute();
		}
	}
	onRender() {
		this.updatePanelVisibility();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:tab-click", this._handleTabClick);
		if (this.routed) window.removeEventListener("NavigationEvent", this._handleNavigation);
	}
	getAllTabs() {
		if (this.tabs.length > 0) return this.tabs;
		return this._slottedTabs.map((el) => ({
			value: el.getAttribute("value") || "",
			label: el.getAttribute("label") || el.textContent || "",
			icon: el.getAttribute("icon") || void 0,
			disabled: el.hasAttribute("disabled"),
			href: el.getAttribute("href") || void 0
		}));
	}
	getTabByValue(value) {
		return this.getAllTabs().find((t) => t.value === value);
	}
	updateTabStates() {
		this._slottedTabs.forEach((tab) => {
			const isActive = tab.getAttribute("value") === this.value;
			tab.toggleAttribute("active", isActive);
		});
	}
	updatePanelVisibility() {
		if (this.routed) return;
		this.elementRef.querySelectorAll("ml-tab-panel").forEach((panel) => {
			const isActive = panel.getAttribute("value") === this.value;
			panel.style.display = isActive ? "" : "none";
		});
	}
	focusTab(value) {
		((this.elementRef.shadowRoot?.querySelector(".ml-tabs__list"))?.querySelector(`[data-value="${value}"]`))?.focus();
	}
	syncWithRoute() {
		const path = window.location.pathname;
		const matchingTab = this.getAllTabs().find((tab) => tab.href && path.startsWith(tab.href));
		if (matchingTab) {
			this.value = matchingTab.value;
			this.updateTabStates();
		}
	}
	onNavigation() {
		this.syncWithRoute();
	}
};
TabsComponent = __decorate([MelodicComponent({
	selector: "ml-tabs",
	template: tabsTemplate,
	styles: tabsStyles,
	attributes: [
		"value",
		"variant",
		"size",
		"orientation",
		"routed"
	]
})], TabsComponent);
function tabTemplate(c) {
	return html`
		<button
			type="button"
			role="tab"
			class=${classMap({
		"ml-tab": true,
		"ml-tab--active": c.active,
		"ml-tab--disabled": c.disabled
	})}
			aria-selected=${c.active}
			aria-disabled=${c.disabled}
			tabindex=${c.active ? "0" : "-1"}
			?disabled=${c.disabled}
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
			<span class="ml-tab__label">${c.label}</span>
			<slot></slot>
		</button>
	`;
}
const tabStyles = () => css`
	:host {
		/* Tab base */
		--ml-tab-gap: var(--ml-space-2);
		--ml-tab-padding-y: var(--ml-space-2);
		--ml-tab-padding-x: var(--ml-space-4);
		--ml-tab-font-family: var(--ml-font-sans);
		--ml-tab-font-weight: var(--ml-font-medium);
		--ml-tab-color: var(--ml-color-text-secondary);
		--ml-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Tab hover */
		--ml-tab-hover-color: var(--ml-color-text);

		/* Tab focus */
		--ml-tab-focus-color: var(--ml-color-primary);

		/* Tab active */
		--ml-tab-active-color: var(--ml-color-primary);

		/* Tab disabled */
		--ml-tab-disabled-color: var(--ml-color-text-muted);

		/* Label */
		--ml-tab-label-line-height: var(--ml-leading-tight);

		display: contents;
	}

	.ml-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tab-gap);
		padding: var(--ml-tab-padding-y) var(--ml-tab-padding-x);
		font-family: var(--ml-tab-font-family);
		font-weight: var(--ml-tab-font-weight);
		font-size: inherit;
		color: var(--ml-tab-color);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tab-transition),
			background-color var(--ml-tab-transition);
	}

	.ml-tab:hover:not(:disabled) {
		color: var(--ml-tab-hover-color);
	}

	.ml-tab:focus-visible {
		outline: 2px solid var(--ml-tab-focus-color);
		outline-offset: 2px;
	}

	.ml-tab--active {
		color: var(--ml-tab-active-color);
	}

	.ml-tab--disabled {
		color: var(--ml-tab-disabled-color);
		cursor: not-allowed;
	}

	.ml-tab__label {
		line-height: var(--ml-tab-label-line-height);
	}
`;
var TabComponent = class TabComponent$1 {
	constructor() {
		this.value = "";
		this.label = "";
		this.icon = "";
		this.disabled = false;
		this.active = false;
		this.href = "";
		this.handleClick = () => {
			if (this.disabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:tab-click", {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					href: this.href
				}
			}));
		};
	}
};
TabComponent = __decorate([MelodicComponent({
	selector: "ml-tab",
	template: tabTemplate,
	styles: tabStyles,
	attributes: [
		"value",
		"label",
		"icon",
		"disabled",
		"active",
		"href"
	]
})], TabComponent);
function tabPanelTemplate(_c) {
	return html`
		<div class="ml-tab-panel" role="tabpanel">
			<slot></slot>
		</div>
	`;
}
const tabPanelStyles = () => css`
	:host {
		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-tab-panel {
		outline: none;
	}

	.ml-tab-panel:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}
`;
var TabPanelComponent = class TabPanelComponent$1 {
	constructor() {
		this.value = "";
	}
};
TabPanelComponent = __decorate([MelodicComponent({
	selector: "ml-tab-panel",
	template: tabPanelTemplate,
	styles: tabPanelStyles,
	attributes: ["value"]
})], TabPanelComponent);
function breadcrumbTemplate(_c) {
	return html`
		<nav class="ml-breadcrumb" aria-label="Breadcrumb">
			<ol class="ml-breadcrumb__list">
				<slot></slot>
			</ol>
		</nav>
	`;
}
const breadcrumbStyles = () => css`
	:host {
		/* Gap between breadcrumb items */
		--ml-breadcrumb-gap: var(--ml-space-1);

		display: block;
	}

	.ml-breadcrumb__list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--ml-breadcrumb-gap);
		list-style: none;
		margin: 0;
		padding: 0;
	}
`;
var BreadcrumbComponent = class BreadcrumbComponent$1 {
	constructor() {
		this.separator = "chevron";
	}
};
BreadcrumbComponent = __decorate([MelodicComponent({
	selector: "ml-breadcrumb",
	template: breadcrumbTemplate,
	styles: breadcrumbStyles,
	attributes: ["separator"]
})], BreadcrumbComponent);
function breadcrumbItemTemplate(c) {
	const separatorIcon = c.separator === "slash" ? "slash-forward" : "caret-right";
	return html`
		<li
			class=${classMap({
		"ml-breadcrumb-item": true,
		"ml-breadcrumb-item--current": c.current
	})}
		>
			<span class="ml-breadcrumb-item__separator">
				<ml-icon icon=${separatorIcon} size="sm"></ml-icon>
			</span>
			${when(!!c.href && !c.current, () => html`
					<a class="ml-breadcrumb-item__link" href=${c.href}>
						${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
						<slot></slot>
					</a>
				`, () => html`
					<span class="ml-breadcrumb-item__text" aria-current=${c.current ? "page" : false}>
						${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
						<slot></slot>
					</span>
				`)}
		</li>
	`;
}
const breadcrumbItemStyles = () => css`
	:host {
		display: contents;
	}

	.ml-breadcrumb-item {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-breadcrumb-item__separator {
		display: flex;
		align-items: center;
		color: var(--ml-color-text-tertiary);
	}

	/* Hide separator on first item */
	:host(:first-child) .ml-breadcrumb-item__separator {
		display: none;
	}

	.ml-breadcrumb-item__link {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		text-decoration: none;
		border-radius: var(--ml-radius-sm);
		padding: var(--ml-space-1) var(--ml-space-1);
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-breadcrumb-item__link:hover {
		color: var(--ml-color-text);
	}

	.ml-breadcrumb-item__text {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		padding: var(--ml-space-1) var(--ml-space-1);
	}

	.ml-breadcrumb-item--current .ml-breadcrumb-item__text {
		color: var(--ml-color-text);
		font-weight: var(--ml-font-semibold);
	}
`;
var BreadcrumbItemComponent = class BreadcrumbItemComponent$1 {
	constructor() {
		this.href = "";
		this.icon = "";
		this.current = false;
		this.separator = "chevron";
	}
	onCreate() {
		const parent = this.elementRef.closest("ml-breadcrumb");
		if (parent) {
			const sep = parent.getAttribute("separator");
			if (sep === "slash" || sep === "chevron") this.separator = sep;
		}
	}
};
BreadcrumbItemComponent = __decorate([MelodicComponent({
	selector: "ml-breadcrumb-item",
	template: breadcrumbItemTemplate,
	styles: breadcrumbItemStyles,
	attributes: [
		"href",
		"icon",
		"current",
		"separator"
	]
})], BreadcrumbItemComponent);
function paginationTemplate(c) {
	return html`
		<nav class="ml-pagination" aria-label="Pagination">
			<button
				class=${classMap({
		"ml-pagination__btn": true,
		"ml-pagination__btn--nav": true,
		"ml-pagination__btn--disabled": !c.hasPrevious
	})}
				aria-label="Previous page"
				disabled=${!c.hasPrevious}
				@click=${c.previous}
			>
				<ml-icon icon="arrow-left" size="sm"></ml-icon>
				Previous
			</button>

			<div class="ml-pagination__pages">
				${repeat(c.pages, (p, i) => p.type === "page" ? `page-${p.value}` : `ellipsis-${i}`, (p) => {
		if (p.type === "ellipsis") return html`<span class="ml-pagination__ellipsis">...</span>`;
		return html`
							<button
								class=${classMap({
			"ml-pagination__btn": true,
			"ml-pagination__btn--page": true,
			"ml-pagination__btn--active": p.value === Number(c.page)
		})}
								aria-label=${`Page ${p.value}`}
								aria-current=${p.value === Number(c.page) ? "page" : false}
								@click=${() => c.goToPage(p.value)}
							>
								${p.value}
							</button>
						`;
	})}
			</div>

			<button
				class=${classMap({
		"ml-pagination__btn": true,
		"ml-pagination__btn--nav": true,
		"ml-pagination__btn--disabled": !c.hasNext
	})}
				aria-label="Next page"
				disabled=${!c.hasNext}
				@click=${c.next}
			>
				Next
				<ml-icon icon="arrow-right" size="sm"></ml-icon>
			</button>
		</nav>
	`;
}
const paginationStyles = () => css`
	:host {
		/* Layout */
		--ml-pagination-gap: var(--ml-space-3);
		--ml-pagination-pages-gap: var(--ml-space-1);

		/* Button base */
		--ml-pagination-btn-padding-y: var(--ml-space-2);
		--ml-pagination-btn-padding-x: var(--ml-space-3);
		--ml-pagination-btn-font-size: var(--ml-text-sm);
		--ml-pagination-btn-font-weight: var(--ml-font-medium);
		--ml-pagination-btn-color: var(--ml-color-text-secondary);
		--ml-pagination-btn-bg: transparent;
		--ml-pagination-btn-radius: var(--ml-radius-md);
		--ml-pagination-btn-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Button hover */
		--ml-pagination-btn-hover-bg: var(--ml-color-surface-hover);
		--ml-pagination-btn-hover-color: var(--ml-color-text);

		/* Button page size */
		--ml-pagination-btn-page-size: 40px;

		/* Nav button */
		--ml-pagination-nav-font-weight: var(--ml-font-semibold);

		/* Active state */
		--ml-pagination-active-bg: var(--ml-color-primary);
		--ml-pagination-active-color: var(--ml-color-text-inverse);
		--ml-pagination-active-font-weight: var(--ml-font-semibold);

		/* Disabled state */
		--ml-pagination-disabled-opacity: 0.5;

		/* Ellipsis */
		--ml-pagination-ellipsis-font-size: var(--ml-text-sm);
		--ml-pagination-ellipsis-color: var(--ml-color-text-tertiary);

		display: block;
	}

	.ml-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-pagination-gap);
	}

	.ml-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--ml-pagination-pages-gap);
	}

	.ml-pagination__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		padding: var(--ml-pagination-btn-padding-y) var(--ml-pagination-btn-padding-x);
		font-size: var(--ml-pagination-btn-font-size);
		font-weight: var(--ml-pagination-btn-font-weight);
		color: var(--ml-pagination-btn-color);
		background: var(--ml-pagination-btn-bg);
		border: none;
		border-radius: var(--ml-pagination-btn-radius);
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--ml-pagination-btn-transition),
			color var(--ml-pagination-btn-transition);
	}

	.ml-pagination__btn:hover:not(:disabled) {
		background-color: var(--ml-pagination-btn-hover-bg);
		color: var(--ml-pagination-btn-hover-color);
	}

	.ml-pagination__btn--nav {
		font-weight: var(--ml-pagination-nav-font-weight);
	}

	.ml-pagination__btn--page {
		min-width: var(--ml-pagination-btn-page-size);
		height: var(--ml-pagination-btn-page-size);
		padding: 0;
	}

	.ml-pagination__btn--active,
	.ml-pagination__btn--active:hover {
		background-color: var(--ml-pagination-active-bg);
		color: var(--ml-pagination-active-color);
		font-weight: var(--ml-pagination-active-font-weight);
	}

	.ml-pagination__btn--disabled,
	.ml-pagination__btn:disabled {
		opacity: var(--ml-pagination-disabled-opacity);
		cursor: not-allowed;
	}

	.ml-pagination__ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-pagination-btn-page-size);
		height: var(--ml-pagination-btn-page-size);
		font-size: var(--ml-pagination-ellipsis-font-size);
		color: var(--ml-pagination-ellipsis-color);
	}
`;
var PaginationComponent = class PaginationComponent$1 {
	constructor() {
		this.page = 1;
		this.totalPages = 1;
		this.siblings = 1;
		this.goToPage = (page) => {
			const currentPage = Number(this.page);
			const total = Number(this.totalPages);
			if (page < 1 || page > total || page === currentPage) return;
			this.page = page;
			this.elementRef.dispatchEvent(new CustomEvent("ml:page-change", {
				bubbles: true,
				composed: true,
				detail: { page: this.page }
			}));
		};
		this.previous = () => {
			this.goToPage(Number(this.page) - 1);
		};
		this.next = () => {
			this.goToPage(Number(this.page) + 1);
		};
	}
	get pages() {
		const total = Math.max(1, Number(this.totalPages));
		const current = Math.min(Math.max(1, Number(this.page)), total);
		const siblings = Math.max(0, Number(this.siblings));
		const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => ({
			type: "page",
			value: start + i
		}));
		const leftSibling = Math.max(current - siblings, 1);
		const rightSibling = Math.min(current + siblings, total);
		const showLeftEllipsis = leftSibling > 2;
		const showRightEllipsis = rightSibling < total - 1;
		if (!showLeftEllipsis && !showRightEllipsis) return range(1, total);
		if (!showLeftEllipsis && showRightEllipsis) return [
			...range(1, Math.max(rightSibling, 3 + siblings)),
			{ type: "ellipsis" },
			{
				type: "page",
				value: total
			}
		];
		if (showLeftEllipsis && !showRightEllipsis) return [
			{
				type: "page",
				value: 1
			},
			{ type: "ellipsis" },
			...range(Math.min(leftSibling, total - 2 - siblings), total)
		];
		return [
			{
				type: "page",
				value: 1
			},
			{ type: "ellipsis" },
			...range(leftSibling, rightSibling),
			{ type: "ellipsis" },
			{
				type: "page",
				value: total
			}
		];
	}
	get hasPrevious() {
		return Number(this.page) > 1;
	}
	get hasNext() {
		return Number(this.page) < Number(this.totalPages);
	}
};
PaginationComponent = __decorate([MelodicComponent({
	selector: "ml-pagination",
	template: paginationTemplate,
	styles: paginationStyles,
	attributes: [
		"page",
		"total-pages",
		"siblings"
	]
})], PaginationComponent);
function sidebarTemplate(c) {
	const hasNavConfig = c.navigation.length > 0;
	const hasFooterConfig = c.footerNavigation.length > 0;
	const isCollapsed = c.collapsed;
	return html`
		<aside
			class=${classMap({
		"ml-sidebar": true,
		[`ml-sidebar--${c.variant}`]: true,
		"ml-sidebar--collapsed": isCollapsed
	})}
			role="navigation"
			@keydown=${c.handleKeyDown}
		>
			<div class="ml-sidebar__header">
				<slot name="header"></slot>
			</div>

			${when(c.hasSearch && !isCollapsed, () => html`
				<div class="ml-sidebar__search">
					<slot name="search"></slot>
				</div>
			`)}

			<div class="ml-sidebar__main">
				${hasNavConfig ? repeat(c.navigation, (_group, index) => `nav-group-${index}`, (group) => renderNavGroup(c, group)) : html`<slot @slotchange=${c.handleDefaultSlotChange}></slot>`}
			</div>

			<div class="ml-sidebar__footer">
				${hasFooterConfig ? html`
						<div class="ml-sidebar__footer-nav">
							${repeat(c.footerNavigation, (item) => item.value, (item) => renderNavItem(c, item, 0))}
						</div>
					` : html`
						<div class="ml-sidebar__footer-nav">
							<slot name="footer-nav"></slot>
						</div>
					`}

				${when(c.hasFeature && !isCollapsed, () => html`
					<div class="ml-sidebar__feature">
						<slot name="feature"></slot>
					</div>
				`)}

				${when(c.hasUser, () => html`
					<div class="ml-sidebar__user">
						<slot name="user"></slot>
					</div>
				`)}
			</div>
		</aside>
	`;
}
function renderNavGroup(c, group) {
	const isCollapsed = c.collapsed;
	return html`
		<div class="ml-sidebar__group">
			${when(!!group.label && !isCollapsed, () => html`
				<span class="ml-sidebar__group-label">${group.label}</span>
			`)}
			<div class="ml-sidebar__group-items">
				${repeat(group.items, (item) => item.value, (item) => renderNavItem(c, item, 0))}
			</div>
		</div>
	`;
}
function renderNavItem(c, item, level) {
	const isActive = c.active === item.value;
	const hasChildren = !!item.children && item.children.length > 0;
	const isExpanded = c.expandedItems.has(item.value);
	const isCollapsed = c.collapsed;
	const linkClasses = classMap({
		"ml-sidebar__item-link": true,
		"ml-sidebar__item-link--active": isActive,
		"ml-sidebar__item-link--disabled": !!item.disabled,
		"ml-sidebar__item-link--expanded": isExpanded,
		"ml-sidebar__item-link--collapsed": isCollapsed,
		"ml-sidebar__item-link--has-children": hasChildren
	});
	const handleClick = (event) => {
		if (item.disabled) return;
		if (hasChildren) {
			event.preventDefault();
			c.handleConfigToggle(item);
			return;
		}
		c.handleConfigItemClick(item.value, item.href);
	};
	const content = html`
		<div class="ml-sidebar__item-leading">
			${when(!!item.icon, () => html`<ml-icon icon=${item.icon} size="sm"></ml-icon>`)}
		</div>
		${when(!isCollapsed, () => html`
			<span class="ml-sidebar__item-label">${item.label}</span>
			<div class="ml-sidebar__item-trailing">
				${when(!!item.badge, () => html`
					<span class=${classMap({
		"ml-sidebar__item-badge": true,
		[`ml-sidebar__item-badge--${item.badgeColor || "default"}`]: true
	})}>${item.badge}</span>
				`)}
				${when(!!item.external, () => html`<ml-icon icon="arrow-square-out" size="xs"></ml-icon>`)}
				${when(hasChildren, () => html`
					<ml-icon
						class="ml-sidebar__item-chevron"
						icon="caret-right"
						size="xs"
					></ml-icon>
				`)}
			</div>
		`)}
	`;
	return html`
		<div class="ml-sidebar__item" style="--level: ${level}">
			${when(!!item.href && !hasChildren, () => html`
					<a
						class=${linkClasses}
						href=${item.href}
						?target=${item.external ? "_blank" : null}
						?rel=${item.external ? "noopener noreferrer" : null}
						@click=${handleClick}
					>
						${content}
					</a>
				`, () => html`
					<button
						type="button"
						class=${linkClasses}
						?disabled=${item.disabled}
						@click=${handleClick}
					>
						${content}
					</button>
				`)}
			${when(hasChildren && isExpanded && !isCollapsed, () => html`
				<div class="ml-sidebar__item-submenu">
					${repeat(item.children, (child) => child.value, (child) => renderNavItem(c, child, level + 1))}
				</div>
			`)}
		</div>
	`;
}
const sidebarStyles = () => css`
	:host {
		/* Container */
		--ml-sidebar-width: 280px;
		--ml-sidebar-bg: var(--ml-color-surface);
		--ml-sidebar-border-width: var(--ml-border);
		--ml-sidebar-border-color: var(--ml-color-border);
		--ml-sidebar-transition: var(--ml-duration-200) var(--ml-ease-in-out);

		/* Slim expanded shadow */
		--ml-sidebar-slim-expanded-shadow: var(--ml-shadow-lg);

		/* Header */
		--ml-sidebar-header-padding: var(--ml-space-4);

		/* Search */
		--ml-sidebar-search-padding-y: var(--ml-space-3);
		--ml-sidebar-search-padding-x: var(--ml-space-4);

		/* Main nav area */
		--ml-sidebar-main-padding-y: var(--ml-space-2);

		/* Scrollbar */
		--ml-sidebar-scrollbar-width: 4px;
		--ml-sidebar-scrollbar-color: var(--ml-color-border);
		--ml-sidebar-scrollbar-radius: var(--ml-radius-full);

		/* Footer */
		--ml-sidebar-footer-nav-padding: var(--ml-space-2);
		--ml-sidebar-footer-nav-gap: var(--ml-space-0-5);
		--ml-sidebar-feature-padding-y: var(--ml-space-3);
		--ml-sidebar-feature-padding-x: var(--ml-space-4);
		--ml-sidebar-user-padding-y: var(--ml-space-3);
		--ml-sidebar-user-padding-x: var(--ml-space-4);

		/* Group label */
		--ml-sidebar-group-label-padding-y: var(--ml-space-2);
		--ml-sidebar-group-label-padding-x: var(--ml-space-4);
		--ml-sidebar-group-label-font-family: var(--ml-font-sans);
		--ml-sidebar-group-label-font-size: var(--ml-text-xs);
		--ml-sidebar-group-label-font-weight: var(--ml-font-semibold);
		--ml-sidebar-group-label-color: var(--ml-color-text-muted);
		--ml-sidebar-group-label-letter-spacing: 0.05em;
		--ml-sidebar-group-label-line-height: var(--ml-leading-tight);

		/* Group items */
		--ml-sidebar-group-items-gap: var(--ml-space-0-5);
		--ml-sidebar-group-items-padding-x: var(--ml-space-2);

		/* Item link */
		--ml-sidebar-item-gap: var(--ml-space-3);
		--ml-sidebar-item-padding-y: var(--ml-space-2);
		--ml-sidebar-item-padding-x: var(--ml-space-3);
		--ml-sidebar-item-radius: var(--ml-radius);
		--ml-sidebar-item-color: var(--ml-color-text-secondary);
		--ml-sidebar-item-font-family: var(--ml-font-sans);
		--ml-sidebar-item-font-size: var(--ml-text-sm);
		--ml-sidebar-item-font-weight: var(--ml-font-medium);
		--ml-sidebar-item-line-height: var(--ml-leading-tight);
		--ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Item hover */
		--ml-sidebar-item-hover-bg: var(--ml-gray-100);
		--ml-sidebar-item-hover-color: var(--ml-color-text);

		/* Item focus */
		--ml-sidebar-item-focus-color: var(--ml-color-primary);

		/* Item active */
		--ml-sidebar-item-active-bg: var(--ml-color-primary);
		--ml-sidebar-item-active-color: var(--ml-color-text-inverse);
		--ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover);

		/* Active indicator (left border accent) */
		--ml-sidebar-item-active-indicator-width: 0px;
		--ml-sidebar-item-active-indicator-color: transparent;

		/* Item disabled */
		--ml-sidebar-item-disabled-color: var(--ml-color-text-muted);
		--ml-sidebar-item-disabled-opacity: 0.6;

		/* Icon colors (separate from text) */
		--ml-sidebar-item-icon-color: inherit;
		--ml-sidebar-item-active-icon-color: inherit;
		--ml-sidebar-item-hover-icon-color: inherit;

		/* Item icon size */
		--ml-sidebar-item-icon-size: 20px;

		/* Item trailing gap */
		--ml-sidebar-item-trailing-gap: var(--ml-space-2);

		/* Badge */
		--ml-sidebar-badge-min-size: 20px;
		--ml-sidebar-badge-padding-x: var(--ml-space-1-5);
		--ml-sidebar-badge-radius: var(--ml-radius-full);
		--ml-sidebar-badge-font-size: var(--ml-text-xs);
		--ml-sidebar-badge-font-weight: var(--ml-font-medium);
		--ml-sidebar-badge-bg: var(--ml-color-surface-tertiary);
		--ml-sidebar-badge-color: var(--ml-color-text-secondary);

		/* Active badge overrides */
		--ml-sidebar-item-active-badge-bg: var(--ml-sidebar-badge-bg);
		--ml-sidebar-item-active-badge-color: var(--ml-sidebar-badge-color);

		/* Chevron transition */
		--ml-sidebar-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out);

		display: block;
		height: 100%;
	}

	/* ============================================
	   SIDEBAR CONTAINER
	   ============================================ */
	.ml-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: var(--ml-sidebar-width);
		background-color: var(--ml-sidebar-bg);
		border-right: var(--ml-sidebar-border-width) solid var(--ml-sidebar-border-color);
		transition: width var(--ml-sidebar-transition);
	}

	/* Slim variant - collapsed (icons only) */
	.ml-sidebar--slim {
		--ml-sidebar-width: 64px;
		overflow: hidden;
	}

	/* Slim variant - expanded on hover */
	.ml-sidebar--slim:not(.ml-sidebar--collapsed) {
		--ml-sidebar-width: 280px;
		box-shadow: var(--ml-sidebar-slim-expanded-shadow);
		z-index: 50;
		position: relative;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-sidebar__header {
		flex-shrink: 0;
		padding: var(--ml-sidebar-header-padding);
		border-bottom: var(--ml-sidebar-border-width) solid var(--ml-sidebar-border-color);
	}

	.ml-sidebar__header:empty {
		display: none;
	}

	/* ============================================
	   SEARCH
	   ============================================ */
	.ml-sidebar__search {
		flex-shrink: 0;
		padding: var(--ml-sidebar-search-padding-y) var(--ml-sidebar-search-padding-x);
	}

	/* ============================================
	   MAIN NAV AREA
	   ============================================ */
	.ml-sidebar__main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--ml-sidebar-main-padding-y) 0;
	}

	/* Scrollbar styling */
	.ml-sidebar__main::-webkit-scrollbar {
		width: var(--ml-sidebar-scrollbar-width);
	}

	.ml-sidebar__main::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-sidebar__main::-webkit-scrollbar-thumb {
		background-color: var(--ml-sidebar-scrollbar-color);
		border-radius: var(--ml-sidebar-scrollbar-radius);
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-sidebar__footer {
		flex-shrink: 0;
		margin-top: auto;
		border-top: var(--ml-sidebar-border-width) solid var(--ml-sidebar-border-color);
	}

	.ml-sidebar__footer-nav {
		padding: var(--ml-sidebar-footer-nav-padding);
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-footer-nav-gap);
	}

	.ml-sidebar__footer-nav:empty {
		display: none;
	}

	.ml-sidebar__feature {
		padding: var(--ml-sidebar-feature-padding-y) var(--ml-sidebar-feature-padding-x);
	}

	.ml-sidebar__user {
		padding: var(--ml-sidebar-user-padding-y) var(--ml-sidebar-user-padding-x);
		border-top: var(--ml-sidebar-border-width) solid var(--ml-sidebar-border-color);
	}

	/* ============================================
	   CONFIG-RENDERED GROUPS
	   ============================================ */
	.ml-sidebar__group {
		padding: var(--ml-space-1) 0;
	}

	.ml-sidebar__group-label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y) var(--ml-sidebar-group-label-padding-x);
		font-family: var(--ml-sidebar-group-label-font-family);
		font-size: var(--ml-sidebar-group-label-font-size);
		font-weight: var(--ml-sidebar-group-label-font-weight);
		color: var(--ml-sidebar-group-label-color);
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing);
		line-height: var(--ml-sidebar-group-label-line-height);
	}

	.ml-sidebar__group-items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap);
		padding: 0 var(--ml-sidebar-group-items-padding-x);
	}

	/* ============================================
	   CONFIG-RENDERED ITEMS
	   ============================================ */
	.ml-sidebar__item {
		--level: 0;
	}

	.ml-sidebar__item-link {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-gap);
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y) var(--ml-sidebar-item-padding-x);
		padding-left: calc(var(--ml-sidebar-item-padding-x) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-left: var(--ml-sidebar-item-active-indicator-width) solid transparent;
		border-radius: var(--ml-sidebar-item-radius);
		background: transparent;
		color: var(--ml-sidebar-item-color);
		font-family: var(--ml-sidebar-item-font-family);
		font-size: var(--ml-sidebar-item-font-size);
		font-weight: var(--ml-sidebar-item-font-weight);
		line-height: var(--ml-sidebar-item-line-height);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition),
			color var(--ml-sidebar-item-transition);
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) {
		background-color: var(--ml-sidebar-item-hover-bg);
		color: var(--ml-sidebar-item-hover-color);
	}

	.ml-sidebar__item-link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color);
		outline-offset: -2px;
	}

	.ml-sidebar__item-link--active {
		background-color: var(--ml-sidebar-item-active-bg);
		color: var(--ml-sidebar-item-active-color);
		border-left-color: var(--ml-sidebar-item-active-indicator-color);
	}

	.ml-sidebar__item-link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg);
		color: var(--ml-sidebar-item-active-color);
	}

	.ml-sidebar__item-link--disabled {
		color: var(--ml-sidebar-item-disabled-color);
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity);
	}

	.ml-sidebar__item-link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y);
	}

	/* Leading area (icon) */
	.ml-sidebar__item-leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size);
		height: var(--ml-sidebar-item-icon-size);
		color: var(--ml-sidebar-item-icon-color);
	}

	.ml-sidebar__item-link--active .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-active-icon-color);
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-hover-icon-color);
	}

	/* Label */
	.ml-sidebar__item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Trailing area */
	.ml-sidebar__item-trailing {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-trailing-gap);
		flex-shrink: 0;
	}

	/* Badge */
	.ml-sidebar__item-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-sidebar-badge-min-size);
		height: var(--ml-sidebar-badge-min-size);
		padding: 0 var(--ml-sidebar-badge-padding-x);
		border-radius: var(--ml-sidebar-badge-radius);
		font-size: var(--ml-sidebar-badge-font-size);
		font-weight: var(--ml-sidebar-badge-font-weight);
		line-height: 1;
		background-color: var(--ml-sidebar-badge-bg);
		color: var(--ml-sidebar-badge-color);
	}

	.ml-sidebar__item-badge--primary {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar__item-badge--success {
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	.ml-sidebar__item-badge--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-color-warning);
	}

	.ml-sidebar__item-badge--error {
		background-color: var(--ml-color-error-subtle);
		color: var(--ml-color-error);
	}

	.ml-sidebar__item-link--active .ml-sidebar__item-badge {
		background-color: var(--ml-sidebar-item-active-badge-bg);
		color: var(--ml-sidebar-item-active-badge-color);
	}

	/* Chevron for expandable items */
	.ml-sidebar__item-chevron {
		transition: transform var(--ml-sidebar-chevron-transition);
	}

	.ml-sidebar__item-link--expanded .ml-sidebar__item-chevron {
		transform: rotate(90deg);
	}

	/* Submenu */
	.ml-sidebar__item-submenu {
		overflow: hidden;
	}

	/* ============================================
	   COLLAPSED STATE (slim + collapsed)
	   ============================================ */
	.ml-sidebar--collapsed .ml-sidebar__search,
	.ml-sidebar--collapsed .ml-sidebar__feature,
	.ml-sidebar--collapsed .ml-sidebar__group-label {
		display: none;
	}

	/* Slotted elements in collapsed state */
	::slotted([slot="search"]),
	::slotted([slot="feature"]) {
		transition: opacity var(--ml-sidebar-item-transition);
	}
`;
var SidebarComponent = class SidebarComponent$1 {
	constructor() {
		this.variant = "default";
		this.active = "";
		this.collapsed = false;
		this.navigation = [];
		this.footerNavigation = [];
		this._hoverTimer = null;
		this._handleItemClick = this.onItemClick.bind(this);
		this._handleMouseEnter = this.onMouseEnter.bind(this);
		this._handleMouseLeave = this.onMouseLeave.bind(this);
		this.handleDefaultSlotChange = () => {
			this.updateItemStates();
		};
		this.handleConfigItemClick = (value, href) => {
			this.activateItem(value, href);
		};
		this.handleConfigToggle = (item) => {
			const next = new Set(this.expandedItems);
			if (next.has(item.value)) next.delete(item.value);
			else next.add(item.value);
			this.expandedItems = next;
		};
		this.handleKeyDown = (event) => {
			const sidebar = this.elementRef.shadowRoot?.querySelector(".ml-sidebar__main");
			if (!sidebar) return;
			const focusable = Array.from(sidebar.querySelectorAll(".ml-sidebar__item-link:not([disabled]), button:not([disabled]), a"));
			const currentIndex = focusable.indexOf(event.target);
			let newIndex = currentIndex;
			switch (event.key) {
				case "ArrowUp":
					event.preventDefault();
					newIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
					break;
				case "ArrowDown":
					event.preventDefault();
					newIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0;
					break;
				case "Home":
					event.preventDefault();
					newIndex = 0;
					break;
				case "End":
					event.preventDefault();
					newIndex = focusable.length - 1;
					break;
				default: return;
			}
			if (newIndex !== currentIndex && focusable[newIndex]) focusable[newIndex].focus();
		};
		this.expandedItems = /* @__PURE__ */ new Set();
	}
	get hasSearch() {
		return this.elementRef?.querySelector("[slot=\"search\"]") !== null;
	}
	get hasFeature() {
		return this.elementRef?.querySelector("[slot=\"feature\"]") !== null;
	}
	get hasUser() {
		return this.elementRef?.querySelector("[slot=\"user\"]") !== null;
	}
	onCreate() {
		if (this.variant === "slim") this.collapsed = true;
		this.elementRef.addEventListener("ml:sidebar-item-click", this._handleItemClick);
		if (this.variant === "slim") {
			this.elementRef.addEventListener("mouseenter", this._handleMouseEnter);
			this.elementRef.addEventListener("mouseleave", this._handleMouseLeave);
		}
	}
	onRender() {
		this.updateItemStates();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:sidebar-item-click", this._handleItemClick);
		this.elementRef.removeEventListener("mouseenter", this._handleMouseEnter);
		this.elementRef.removeEventListener("mouseleave", this._handleMouseLeave);
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
	}
	activateItem(value, href) {
		this.active = value;
		this.updateItemStates();
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value }
		}));
		this.elementRef.dispatchEvent(new CustomEvent("ml:item-click", {
			bubbles: true,
			composed: true,
			detail: {
				value,
				href
			}
		}));
	}
	onItemClick(event) {
		const { value, href } = event.detail;
		this.activateItem(value, href);
	}
	onMouseEnter() {
		if (this.variant !== "slim") return;
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
		this._hoverTimer = setTimeout(() => {
			this.collapsed = false;
			this.updateItemStates();
		}, 150);
	}
	onMouseLeave() {
		if (this.variant !== "slim") return;
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
		this._hoverTimer = setTimeout(() => {
			this.collapsed = true;
			this.updateItemStates();
		}, 150);
	}
	updateItemStates() {
		this.elementRef.querySelectorAll("ml-sidebar-item").forEach((item) => {
			const value = item.getAttribute("value") || "";
			item.toggleAttribute("active", value === this.active);
			item.toggleAttribute("collapsed", this.collapsed);
		});
		this.elementRef.querySelectorAll("ml-sidebar-group").forEach((group) => {
			group.toggleAttribute("collapsed", this.collapsed);
		});
	}
};
SidebarComponent = __decorate([MelodicComponent({
	selector: "ml-sidebar",
	template: sidebarTemplate,
	styles: sidebarStyles,
	attributes: ["variant", "active"]
})], SidebarComponent);
function sidebarGroupTemplate(c) {
	return html`
		<div class="ml-sidebar-group">
			${when(!!c.label && !c.collapsed, () => html`
				<span class="ml-sidebar-group__label">${c.label}</span>
			`)}
			<div class="ml-sidebar-group__items">
				<slot></slot>
			</div>
		</div>
	`;
}
const sidebarGroupStyles = () => css`
	:host {
		--ml-sidebar-group-padding-y: var(--ml-space-1);
		--ml-sidebar-group-label-padding-y: var(--ml-space-2);
		--ml-sidebar-group-label-padding-x: var(--ml-space-4);
		--ml-sidebar-group-label-font-size: var(--ml-text-xs);
		--ml-sidebar-group-label-font-weight: var(--ml-font-semibold);
		--ml-sidebar-group-label-color: var(--ml-color-text-muted);
		--ml-sidebar-group-label-letter-spacing: 0.05em;
		--ml-sidebar-group-items-gap: var(--ml-space-0-5);
		--ml-sidebar-group-items-padding-x: var(--ml-space-2);

		display: block;
	}

	.ml-sidebar-group {
		padding: var(--ml-sidebar-group-padding-y) 0;
	}

	.ml-sidebar-group__label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y) var(--ml-sidebar-group-label-padding-x);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-sidebar-group-label-font-size);
		font-weight: var(--ml-sidebar-group-label-font-weight);
		color: var(--ml-sidebar-group-label-color);
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing);
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar-group__items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap);
		padding: 0 var(--ml-sidebar-group-items-padding-x);
	}
`;
var SidebarGroupComponent = class SidebarGroupComponent$1 {
	constructor() {
		this.label = "";
		this.collapsed = false;
	}
};
SidebarGroupComponent = __decorate([MelodicComponent({
	selector: "ml-sidebar-group",
	template: sidebarGroupTemplate,
	styles: sidebarGroupStyles,
	attributes: ["label", "collapsed"]
})], SidebarGroupComponent);
function sidebarItemTemplate(c) {
	const level = parseInt(c.level, 10) || 0;
	const isCollapsed = c.collapsed;
	const content = html`
		<div class="ml-sidebar-item__leading">
			<slot name="leading">
				${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm" format=${c["icon-format"] || "regular"}></ml-icon>`)}
			</slot>
		</div>
		${when(!isCollapsed, () => html`
			<span class="ml-sidebar-item__label">${c.label}</span>
			<div class="ml-sidebar-item__trailing">
				<slot name="trailing">
					${when(!!c.badge, () => html`
						<span class=${classMap({
		"ml-sidebar-item__badge": true,
		[`ml-sidebar-item__badge--${c["badge-color"]}`]: true
	})}>${c.badge}</span>
					`)}
					${when(c.external, () => html`<ml-icon icon="arrow-square-out" size="xs"></ml-icon>`)}
				</slot>
				${when(c.hasChildren, () => html`
					<ml-icon
						class="ml-sidebar-item__chevron"
						icon="caret-right"
						size="xs"
					></ml-icon>
				`)}
			</div>
		`)}
	`;
	const linkClasses = classMap({
		"ml-sidebar-item__link": true,
		"ml-sidebar-item__link--active": c.active,
		"ml-sidebar-item__link--disabled": c.disabled,
		"ml-sidebar-item__link--expanded": c.expanded,
		"ml-sidebar-item__link--collapsed": isCollapsed,
		"ml-sidebar-item__link--has-children": c.hasChildren
	});
	return html`
		<div class="ml-sidebar-item" style="--level: ${level}">
			${when(!!c.href && !c.hasChildren, () => html`
					<a
						class=${linkClasses}
						href=${c.href}
						?target=${c.external ? "_blank" : null}
						?rel=${c.external ? "noopener noreferrer" : null}
						@click=${c.handleClick}
					>
						${content}
					</a>
				`, () => html`
					<button
						type="button"
						class=${linkClasses}
						?disabled=${c.disabled}
						@click=${c.handleClick}
					>
						${content}
					</button>
				`)}
			${when(c.hasChildren && c.expanded && !isCollapsed, () => html`
				<div class="ml-sidebar-item__submenu">
					<slot @slotchange=${c.handleSlotChange}></slot>
				</div>
			`)}
			${when(!c.hasChildren || !c.expanded || isCollapsed, () => html`
				<div style="display: none">
					<slot @slotchange=${c.handleSlotChange}></slot>
				</div>
			`)}
		</div>
	`;
}
const sidebarItemStyles = () => css`
	:host {
		/* Item link */
		--ml-sidebar-item-gap: var(--ml-space-3);
		--ml-sidebar-item-padding-y: var(--ml-space-2);
		--ml-sidebar-item-padding-x: var(--ml-space-3);
		--ml-sidebar-item-radius: var(--ml-radius);
		--ml-sidebar-item-color: var(--ml-color-text-secondary);
		--ml-sidebar-item-font-family: var(--ml-font-sans);
		--ml-sidebar-item-font-size: var(--ml-text-sm);
		--ml-sidebar-item-font-weight: var(--ml-font-medium);
		--ml-sidebar-item-line-height: var(--ml-leading-tight);
		--ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Item hover */
		--ml-sidebar-item-hover-bg: var(--ml-gray-100);
		--ml-sidebar-item-hover-color: var(--ml-color-text);

		/* Item focus */
		--ml-sidebar-item-focus-color: var(--ml-color-primary);

		/* Item active */
		--ml-sidebar-item-active-bg: var(--ml-color-primary);
		--ml-sidebar-item-active-color: var(--ml-color-text-inverse);
		--ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover);

		/* Active indicator (left border accent) */
		--ml-sidebar-item-active-indicator-width: 0px;
		--ml-sidebar-item-active-indicator-color: transparent;

		/* Item disabled */
		--ml-sidebar-item-disabled-color: var(--ml-color-text-muted);
		--ml-sidebar-item-disabled-opacity: 0.6;

		/* Icon colors (separate from text) */
		--ml-sidebar-item-icon-color: inherit;
		--ml-sidebar-item-active-icon-color: inherit;
		--ml-sidebar-item-hover-icon-color: inherit;

		/* Item icon size */
		--ml-sidebar-item-icon-size: 20px;

		/* Item trailing gap */
		--ml-sidebar-item-trailing-gap: var(--ml-space-2);

		/* Badge */
		--ml-sidebar-item-badge-min-size: 20px;
		--ml-sidebar-item-badge-padding-x: var(--ml-space-1-5);
		--ml-sidebar-item-badge-radius: var(--ml-radius-full);
		--ml-sidebar-item-badge-font-size: var(--ml-text-xs);
		--ml-sidebar-item-badge-font-weight: var(--ml-font-medium);
		--ml-sidebar-item-badge-bg: var(--ml-color-surface-tertiary);
		--ml-sidebar-item-badge-color: var(--ml-color-text-secondary);

		/* Active badge overrides */
		--ml-sidebar-item-active-badge-bg: var(--ml-sidebar-item-badge-bg);
		--ml-sidebar-item-active-badge-color: var(--ml-sidebar-item-badge-color);

		/* Chevron transition */
		--ml-sidebar-item-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out);

		display: block;
	}

	.ml-sidebar-item {
		--level: 0;
	}

	.ml-sidebar-item__link {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-gap);
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y) var(--ml-sidebar-item-padding-x);
		padding-left: calc(var(--ml-sidebar-item-padding-x) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-left: var(--ml-sidebar-item-active-indicator-width) solid transparent;
		border-radius: var(--ml-sidebar-item-radius);
		background: transparent;
		color: var(--ml-sidebar-item-color);
		font-family: var(--ml-sidebar-item-font-family);
		font-size: var(--ml-sidebar-item-font-size);
		font-weight: var(--ml-sidebar-item-font-weight);
		line-height: var(--ml-sidebar-item-line-height);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition),
			color var(--ml-sidebar-item-transition);
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled):not(.ml-sidebar-item__link--active) {
		background-color: var(--ml-sidebar-item-hover-bg);
		color: var(--ml-sidebar-item-hover-color);
	}

	.ml-sidebar-item__link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color);
		outline-offset: -2px;
	}

	.ml-sidebar-item__link--active {
		background-color: var(--ml-sidebar-item-active-bg);
		color: var(--ml-sidebar-item-active-color);
		border-left-color: var(--ml-sidebar-item-active-indicator-color);
	}

	.ml-sidebar-item__link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg);
		color: var(--ml-sidebar-item-active-color);
	}

	.ml-sidebar-item__link--disabled {
		color: var(--ml-sidebar-item-disabled-color);
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity);
	}

	.ml-sidebar-item__link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y);
	}

	/* Leading area (icon) */
	.ml-sidebar-item__leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size);
		height: var(--ml-sidebar-item-icon-size);
		color: var(--ml-sidebar-item-icon-color);
	}

	.ml-sidebar-item__link--active .ml-sidebar-item__leading {
		color: var(--ml-sidebar-item-active-icon-color);
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled):not(.ml-sidebar-item__link--active) .ml-sidebar-item__leading {
		color: var(--ml-sidebar-item-hover-icon-color);
	}

	/* Label */
	.ml-sidebar-item__label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:host([collapsed]) .ml-sidebar-item__label {
		display: none;
	}

	/* Trailing area */
	.ml-sidebar-item__trailing {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-trailing-gap);
		flex-shrink: 0;
	}

	:host([collapsed]) .ml-sidebar-item__trailing {
		display: none;
	}

	/* Badge */
	.ml-sidebar-item__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-sidebar-item-badge-min-size);
		height: var(--ml-sidebar-item-badge-min-size);
		padding: 0 var(--ml-sidebar-item-badge-padding-x);
		border-radius: var(--ml-sidebar-item-badge-radius);
		font-size: var(--ml-sidebar-item-badge-font-size);
		font-weight: var(--ml-sidebar-item-badge-font-weight);
		line-height: 1;
		background-color: var(--ml-sidebar-item-badge-bg);
		color: var(--ml-sidebar-item-badge-color);
	}

	.ml-sidebar-item__badge--primary {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar-item__badge--success {
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	.ml-sidebar-item__badge--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-color-warning);
	}

	.ml-sidebar-item__badge--error {
		background-color: var(--ml-color-error-subtle);
		color: var(--ml-color-error);
	}

	.ml-sidebar-item__link--active .ml-sidebar-item__badge {
		background-color: var(--ml-sidebar-item-active-badge-bg);
		color: var(--ml-sidebar-item-active-badge-color);
	}

	/* Chevron for expandable items */
	.ml-sidebar-item__chevron {
		transition: transform var(--ml-sidebar-item-chevron-transition);
	}

	.ml-sidebar-item__link--expanded .ml-sidebar-item__chevron {
		transform: rotate(90deg);
	}

	/* Submenu */
	.ml-sidebar-item__submenu {
		overflow: hidden;
	}
`;
var SidebarItemComponent = class SidebarItemComponent$1 {
	constructor() {
		this.icon = "";
		this["icon-format"] = "";
		this.label = "";
		this.value = "";
		this.href = "";
		this.active = false;
		this.disabled = false;
		this.badge = "";
		this["badge-color"] = "default";
		this.external = false;
		this.expanded = false;
		this.collapsed = false;
		this.level = "0";
		this._hasChildren = false;
		this.handleSlotChange = (event) => {
			this._hasChildren = event.target.assignedElements({ flatten: true }).some((el) => el.tagName === "ML-SIDEBAR-ITEM");
		};
		this.handleClick = (event) => {
			if (this.disabled) return;
			if (this.hasChildren) {
				event.preventDefault();
				this.expanded = !this.expanded;
				this.elementRef.toggleAttribute("expanded", this.expanded);
				return;
			}
			this.elementRef.dispatchEvent(new CustomEvent("ml:sidebar-item-click", {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					href: this.href
				}
			}));
		};
	}
	get hasChildren() {
		return this._hasChildren;
	}
	onCreate() {
		this._hasChildren = this.elementRef.querySelector("ml-sidebar-item") !== null;
	}
	onDestroy() {}
};
SidebarItemComponent = __decorate([MelodicComponent({
	selector: "ml-sidebar-item",
	template: sidebarItemTemplate,
	styles: sidebarItemStyles,
	attributes: [
		"icon",
		"icon-format",
		"label",
		"value",
		"href",
		"active",
		"disabled",
		"badge",
		"badge-color",
		"external",
		"expanded",
		"collapsed",
		"level"
	]
})], SidebarItemComponent);
function stepsTemplate(c) {
	const hasSteps = c.steps.length > 0;
	const isCompact = c.compact;
	return html`
		<div
			class=${classMap({
		"ml-steps": true,
		[`ml-steps--${c.variant}`]: true,
		[`ml-steps--${c.orientation}`]: true,
		"ml-steps--compact": isCompact
	})}
		>
			<div
				class="ml-steps__list"
				role="tablist"
				aria-orientation=${c.orientation}
				@keydown=${c.handleKeyDown}
			>
				${hasSteps ? repeat(c.steps, (step) => `${step.value}-${c.active === step.value}`, (step, index) => renderConfigStep(c, step, index)) : html`<slot name="step" @slotchange=${c.handleStepSlotChange}></slot>`}
			</div>

			${when(isCompact, () => html`
				<div class="ml-steps__compact-label">
					Step ${c.getCurrentStepNumber()} of ${c.getTotalSteps()}
				</div>
			`)}

			<div class="ml-steps__panels">
				<slot></slot>
			</div>
		</div>
	`;
}
function renderConfigStep(c, step, index) {
	const allSteps = c.steps;
	const isFirst = index === 0;
	const isLast = index === allSteps.length - 1;
	const status = c.getStepStatus(step.value);
	const isBar = c.variant === "bar";
	const isCompact = c.compact;
	return html`
		<div
			class=${classMap({
		"ml-step": true,
		[`ml-step--${status}`]: true,
		[`ml-step--${c.variant}`]: true,
		[`ml-step--${c.orientation}`]: true,
		[`ml-step--${c.color}`]: true,
		"ml-step--first": isFirst,
		"ml-step--last": isLast,
		"ml-step--disabled": !!step.disabled,
		"ml-step--compact": isCompact
	})}
			role="tab"
			data-value=${step.value}
			aria-selected=${status === "current"}
			aria-disabled=${step.disabled || false}
			tabindex=${status === "current" ? "0" : "-1"}
			@click=${() => c.handleStepClick(step.value, step.href)}
		>
			${when(isBar, () => renderBarStep$1(c, step))}
			${when(!isBar && !isCompact, () => renderStandardStep$1(c, step, index, isFirst, isLast, status))}
			${when(!isBar && isCompact, () => renderCompactDot(c, status))}
		</div>
	`;
}
function renderBarStep$1(_c, step) {
	return html`
		<div class="ml-step__bar"></div>
		<div class="ml-step__content">
			<span class="ml-step__label">${step.label}</span>
			${when(!!step.description, () => html`<span class="ml-step__description">${step.description}</span>`)}
		</div>
	`;
}
function renderStandardStep$1(c, step, index, isFirst, isLast, status) {
	return html`
		<div class="ml-step__track">
			<div class="ml-step__connector-before ${isFirst ? "ml-step__connector--hidden" : `ml-step__connector--${c.connector}`}"></div>
			<div class="ml-step__indicator">
				${renderConfigIndicator(c, step, index, status)}
			</div>
			<div class="ml-step__connector-after ${isLast ? "ml-step__connector--hidden" : `ml-step__connector--${c.connector}`}"></div>
		</div>
		<div class="ml-step__content">
			<span class="ml-step__label">${step.label}</span>
			${when(!!step.description, () => html`<span class="ml-step__description">${step.description}</span>`)}
		</div>
	`;
}
function renderCompactDot(_c, _status) {
	return html`<div class="ml-step__dot"></div>`;
}
function renderConfigIndicator(c, step, index, status) {
	switch (c.variant) {
		case "numbered": return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--numbered">
					${when(status === "completed", () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
					${when(status !== "completed", () => html`<span>${index + 1}</span>`)}
				</div>
			`;
		case "circles": return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--circles">
					${when(status === "completed", () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
					${when(status !== "completed", () => html`<div class="ml-step__indicator-dot"></div>`)}
				</div>
			`;
		case "icons": return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--icons">
					<ml-icon icon=${step.icon || "circle"} size="sm"></ml-icon>
				</div>
			`;
		default: return html``;
	}
}
const stepsStyles = () => css`
	:host {
		/* Compact label */
		--ml-steps-compact-gap: var(--ml-space-3);
		--ml-steps-compact-label-font-family: var(--ml-font-sans);
		--ml-steps-compact-label-font-size: var(--ml-text-sm);
		--ml-steps-compact-label-font-weight: var(--ml-font-medium);
		--ml-steps-compact-label-color: var(--ml-color-text-secondary);
		--ml-steps-compact-label-margin-top: var(--ml-space-3);

		/* Panels */
		--ml-steps-panels-padding-top: var(--ml-space-6);
		--ml-steps-compact-panels-padding-top: var(--ml-space-4);

		/* Focus ring */
		--ml-steps-focus-color: var(--ml-color-primary);
		--ml-steps-focus-radius: var(--ml-radius);

		/* Disabled state */
		--ml-steps-disabled-opacity: 0.5;

		/* Connector */
		--ml-steps-connector-thickness: 2px;
		--ml-steps-connector-color: var(--ml-color-border);
		--ml-steps-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator (numbered & circles) */
		--ml-steps-indicator-size: 32px;
		--ml-steps-indicator-border-width: 2px;
		--ml-steps-indicator-font-size: var(--ml-text-sm);
		--ml-steps-indicator-font-weight: var(--ml-font-medium);
		--ml-steps-indicator-font-family: var(--ml-font-sans);
		--ml-steps-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator upcoming */
		--ml-steps-upcoming-border-color: var(--ml-color-border);
		--ml-steps-upcoming-color: var(--ml-color-text-secondary);
		--ml-steps-upcoming-bg: var(--ml-color-surface);

		/* Indicator dot (circles variant) */
		--ml-steps-dot-size: 10px;

		/* Icons variant */
		--ml-steps-icon-indicator-size: 40px;
		--ml-steps-icon-indicator-radius: var(--ml-radius-lg);
		--ml-steps-icon-upcoming-color: var(--ml-color-text-muted);
		--ml-steps-icon-current-border-color: var(--ml-color-text);
		--ml-steps-icon-current-color: var(--ml-color-text);

		/* Completed indicator text */
		--ml-steps-completed-indicator-text: #fff;

		/* Bar variant */
		--ml-steps-bar-height: 4px;
		--ml-steps-bar-radius: 2px;
		--ml-steps-bar-color: var(--ml-color-border);

		/* Compact / dots */
		--ml-steps-compact-dot-size: 12px;
		--ml-steps-compact-dot-color: var(--ml-color-border);

		/* Content spacing */
		--ml-steps-content-gap: var(--ml-space-1);
		--ml-steps-track-gap: var(--ml-space-3);
		--ml-steps-vertical-content-padding: var(--ml-space-6);

		/* Label */
		--ml-steps-label-font-family: var(--ml-font-sans);
		--ml-steps-label-font-size: var(--ml-text-sm);
		--ml-steps-label-font-weight: var(--ml-font-medium);
		--ml-steps-label-color: var(--ml-color-text);
		--ml-steps-label-line-height: var(--ml-leading-tight);
		--ml-steps-label-upcoming-color: var(--ml-color-text-secondary);

		/* Description */
		--ml-steps-desc-font-family: var(--ml-font-sans);
		--ml-steps-desc-font-size: var(--ml-text-xs);
		--ml-steps-desc-color: var(--ml-color-text-muted);
		--ml-steps-desc-line-height: var(--ml-leading-normal);

		display: block;
		width: 100%;
	}

	.ml-steps {
		display: flex;
		flex-direction: column;
	}

	/* ============================================
	   STEP LIST
	   ============================================ */
	.ml-steps__list {
		display: flex;
		position: relative;
	}

	.ml-steps--horizontal .ml-steps__list {
		flex-direction: row;
	}

	.ml-steps--vertical .ml-steps__list {
		flex-direction: column;
	}

	/* ============================================
	   COMPACT LABEL (Step X of Y)
	   ============================================ */
	.ml-steps--compact .ml-steps__list {
		gap: var(--ml-steps-compact-gap);
		justify-content: center;
		align-items: center;
	}

	.ml-steps__compact-label {
		font-family: var(--ml-steps-compact-label-font-family);
		font-size: var(--ml-steps-compact-label-font-size);
		font-weight: var(--ml-steps-compact-label-font-weight);
		color: var(--ml-steps-compact-label-color);
		text-align: center;
		margin-top: var(--ml-steps-compact-label-margin-top);
	}

	/* ============================================
	   PANELS
	   ============================================ */
	.ml-steps__panels {
		padding-top: var(--ml-steps-panels-padding-top);
	}

	.ml-steps--compact .ml-steps__panels {
		padding-top: var(--ml-steps-compact-panels-padding-top);
	}

	/* ============================================
	   INLINE STEP STYLES (for config-mode rendering)
	   These mirror step.styles.ts for config-rendered steps
	   ============================================ */

	/* Base step */
	.ml-step {
		display: flex;
		align-items: flex-start;
		cursor: pointer;
		flex: 1;
		min-width: 0;
	}

	.ml-step--disabled {
		cursor: not-allowed;
		opacity: var(--ml-steps-disabled-opacity);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-steps-focus-color);
		outline-offset: 2px;
		border-radius: var(--ml-steps-focus-radius);
	}

	/* Horizontal layout */
	.ml-step--horizontal {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.ml-step--horizontal .ml-step__track {
		display: flex;
		align-items: center;
		width: 100%;
		margin-bottom: var(--ml-steps-track-gap);
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-steps-connector-thickness);
	}

	.ml-step--horizontal .ml-step__connector--hidden {
		visibility: hidden;
	}

	/* Vertical layout */
	.ml-step--vertical {
		flex-direction: row;
		align-items: stretch;
		text-align: left;
	}

	.ml-step--vertical .ml-step__track {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: var(--ml-steps-track-gap);
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-steps-connector-thickness);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding);
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* Connectors */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step__connector--solid {
		background-color: var(--ml-steps-connector-color);
	}

	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-steps-connector-color) 0,
			var(--ml-steps-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 100% 2px;
		background-repeat: no-repeat;
		background-position: center;
	}

	.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-steps-connector-color) 0,
			var(--ml-steps-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 2px 100%;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Connector coloring - completed */
	.ml-step--completed.ml-step--primary .ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--completed.ml-step--success .ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--completed.ml-step--primary.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--primary.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* Connector coloring - current (before colored, after gray) */
	.ml-step--current.ml-step--primary .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--current.ml-step--success .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--current.ml-step--primary.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--primary.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* ============================================
	   INDICATOR
	   ============================================ */
	.ml-step__indicator {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-step__indicator-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color var(--ml-steps-indicator-transition),
			border-color var(--ml-steps-indicator-transition),
			color var(--ml-steps-indicator-transition);
	}

	/* Numbered */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-steps-indicator-size);
		height: var(--ml-steps-indicator-size);
		border-radius: 50%;
		font-size: var(--ml-steps-indicator-font-size);
		font-weight: var(--ml-steps-indicator-font-weight);
		font-family: var(--ml-steps-indicator-font-family);
	}

	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
		color: var(--ml-steps-upcoming-color);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text);
	}

	/* Circles */
	.ml-step__indicator-inner--circles {
		width: var(--ml-steps-indicator-size);
		height: var(--ml-steps-indicator-size);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-steps-dot-size);
		height: var(--ml-steps-dot-size);
		border-radius: 50%;
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-steps-upcoming-border-color);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text);
	}

	/* Icons */
	.ml-step__indicator-inner--icons {
		width: var(--ml-steps-icon-indicator-size);
		height: var(--ml-steps-icon-indicator-size);
		border-radius: var(--ml-steps-icon-indicator-radius);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
	}

	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-upcoming-border-color);
		background-color: var(--ml-steps-upcoming-bg);
		color: var(--ml-steps-icon-upcoming-color);
	}

	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-icon-current-border-color);
		background-color: var(--ml-steps-upcoming-bg);
		color: var(--ml-steps-icon-current-color);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-success);
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	/* ============================================
	   BAR VARIANT
	   ============================================ */
	.ml-step--bar {
		flex-direction: column;
		gap: 0;
	}

	.ml-step--bar .ml-step__bar {
		width: 100%;
		height: var(--ml-steps-bar-height);
		border-radius: var(--ml-steps-bar-radius);
		background-color: var(--ml-steps-bar-color);
		margin-bottom: var(--ml-steps-track-gap);
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--bar.ml-step--current.ml-step--primary .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--primary .ml-step__bar {
		background-color: var(--ml-color-primary);
	}

	.ml-step--bar.ml-step--current.ml-step--success .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--success .ml-step__bar {
		background-color: var(--ml-color-success);
	}

	.ml-step--bar.ml-step--vertical {
		flex-direction: row;
	}

	.ml-step--bar.ml-step--vertical .ml-step__bar {
		width: var(--ml-steps-bar-height);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-steps-track-gap);
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding);
	}

	.ml-step--bar.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   COMPACT / DOTS
	   ============================================ */
	.ml-step--compact {
		flex: 0 0 auto;
		min-width: auto;
		align-items: center;
		justify-content: center;
	}

	.ml-step__dot {
		width: var(--ml-steps-compact-dot-size);
		height: var(--ml-steps-compact-dot-size);
		border-radius: 50%;
		background-color: var(--ml-steps-compact-dot-color);
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--compact.ml-step--current.ml-step--primary .ml-step__dot,
	.ml-step--compact.ml-step--completed.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--compact.ml-step--current.ml-step--success .ml-step__dot,
	.ml-step--compact.ml-step--completed.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}

	/* ============================================
	   CONTENT
	   ============================================ */
	.ml-step__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-steps-content-gap);
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-steps-label-font-family);
		font-size: var(--ml-steps-label-font-size);
		font-weight: var(--ml-steps-label-font-weight);
		color: var(--ml-steps-label-color);
		line-height: var(--ml-steps-label-line-height);
		transition: color var(--ml-steps-connector-transition);
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-steps-label-upcoming-color);
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-steps-desc-font-family);
		font-size: var(--ml-steps-desc-font-size);
		color: var(--ml-steps-desc-color);
		line-height: var(--ml-steps-desc-line-height);
	}

	/* ============================================
	   SLOTTED STEP STYLING
	   ============================================ */
	::slotted(ml-step) {
		flex: 1;
		min-width: 0;
	}
`;
var StepsComponent = class StepsComponent$1 {
	constructor() {
		this.active = "";
		this.variant = "numbered";
		this.orientation = "horizontal";
		this.connector = "solid";
		this.color = "primary";
		this.compact = false;
		this.routed = false;
		this.steps = [];
		this._slottedSteps = [];
		this._handleNavigation = this.onNavigation.bind(this);
		this.handleStepSlotChange = (event) => {
			this._slottedSteps = event.target.assignedElements({ flatten: true });
			if (!this.active && this._slottedSteps.length > 0) {
				const firstStep = this._slottedSteps.find((step) => !step.hasAttribute("disabled"));
				if (firstStep) this.active = firstStep.getAttribute("value") || "";
			}
			this.updateSlottedStepStates();
			this.updatePanelVisibility();
		};
		this.handleStepClick = (stepValue, href) => {
			if (this.getStepByValue(stepValue)?.disabled) return;
			if (this.routed && href) {
				window.history.pushState({}, "", href);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
			this.active = stepValue;
			this.updateSlottedStepStates();
			this.updatePanelVisibility();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: stepValue }
			}));
		};
		this.handleSlottedStepClick = (event) => {
			const { value, href } = event.detail;
			this.handleStepClick(value, href);
		};
		this.handleKeyDown = (event) => {
			const enabledSteps = this.getAllSteps().filter((s) => !s.disabled);
			const currentIndex = enabledSteps.findIndex((s) => s.value === this.active);
			let newIndex = currentIndex;
			const isVertical = this.orientation === "vertical";
			switch (event.key) {
				case "ArrowLeft":
					if (isVertical) return;
					event.preventDefault();
					newIndex = currentIndex > 0 ? currentIndex - 1 : enabledSteps.length - 1;
					break;
				case "ArrowRight":
					if (isVertical) return;
					event.preventDefault();
					newIndex = currentIndex < enabledSteps.length - 1 ? currentIndex + 1 : 0;
					break;
				case "ArrowUp":
					if (!isVertical) return;
					event.preventDefault();
					newIndex = currentIndex > 0 ? currentIndex - 1 : enabledSteps.length - 1;
					break;
				case "ArrowDown":
					if (!isVertical) return;
					event.preventDefault();
					newIndex = currentIndex < enabledSteps.length - 1 ? currentIndex + 1 : 0;
					break;
				case "Home":
					event.preventDefault();
					newIndex = 0;
					break;
				case "End":
					event.preventDefault();
					newIndex = enabledSteps.length - 1;
					break;
				default: return;
			}
			if (newIndex !== currentIndex && enabledSteps[newIndex]) {
				const step = enabledSteps[newIndex];
				this.handleStepClick(step.value, step.href);
				this.focusStep(step.value);
			}
		};
	}
	onCreate() {
		this.elementRef.addEventListener("ml:step-click", this.handleSlottedStepClick);
		if (this.routed) {
			window.addEventListener("NavigationEvent", this._handleNavigation);
			this.syncWithRoute();
		}
	}
	onRender() {
		this.updatePanelVisibility();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:step-click", this.handleSlottedStepClick);
		if (this.routed) window.removeEventListener("NavigationEvent", this._handleNavigation);
	}
	getStepStatus(stepValue) {
		const allSteps = this.getAllSteps();
		const activeIndex = allSteps.findIndex((s) => s.value === this.active);
		const stepIndex = allSteps.findIndex((s) => s.value === stepValue);
		if (stepIndex < activeIndex) return "completed";
		if (stepIndex === activeIndex) return "current";
		return "upcoming";
	}
	getCurrentStepNumber() {
		return this.getAllSteps().findIndex((s) => s.value === this.active) + 1;
	}
	getTotalSteps() {
		return this.getAllSteps().length;
	}
	getAllSteps() {
		if (this.steps.length > 0) return this.steps;
		return this._slottedSteps.map((el) => ({
			value: el.getAttribute("value") || "",
			label: el.getAttribute("label") || el.textContent || "",
			description: el.getAttribute("description") || void 0,
			icon: el.getAttribute("icon") || void 0,
			disabled: el.hasAttribute("disabled"),
			href: el.getAttribute("href") || void 0
		}));
	}
	getStepByValue(value) {
		return this.getAllSteps().find((s) => s.value === value);
	}
	updateSlottedStepStates() {
		const allSteps = this.getAllSteps();
		this._slottedSteps.forEach((step, index) => {
			const value = step.getAttribute("value") || "";
			const status = this.getStepStatus(value);
			step.setAttribute("status", status);
			step.setAttribute("variant", this.variant);
			step.setAttribute("connector", this.connector);
			step.setAttribute("color", this.color);
			step.setAttribute("orientation", this.orientation);
			step.setAttribute("step-number", String(index + 1));
			step.toggleAttribute("first", index === 0);
			step.toggleAttribute("last", index === allSteps.length - 1);
			step.toggleAttribute("compact", this.compact);
		});
	}
	updatePanelVisibility() {
		if (this.routed) return;
		this.elementRef.querySelectorAll("ml-step-panel").forEach((panel) => {
			const isActive = panel.getAttribute("value") === this.active;
			panel.style.display = isActive ? "" : "none";
		});
	}
	focusStep(value) {
		((this.elementRef.shadowRoot?.querySelector(".ml-steps__list"))?.querySelector(`[data-value="${value}"]`))?.focus();
	}
	syncWithRoute() {
		const path = window.location.pathname;
		const matchingStep = this.getAllSteps().find((step) => step.href && path.startsWith(step.href));
		if (matchingStep) {
			this.active = matchingStep.value;
			this.updateSlottedStepStates();
		}
	}
	onNavigation() {
		this.syncWithRoute();
	}
};
StepsComponent = __decorate([MelodicComponent({
	selector: "ml-steps",
	template: stepsTemplate,
	styles: stepsStyles,
	attributes: [
		"active",
		"variant",
		"orientation",
		"connector",
		"color",
		"compact",
		"routed"
	]
})], StepsComponent);
function stepTemplate(c) {
	const isBar = c.variant === "bar";
	const isCompact = c.compact;
	return html`
		<div
			class=${classMap({
		"ml-step": true,
		[`ml-step--${c.status}`]: true,
		[`ml-step--${c.variant}`]: true,
		[`ml-step--${c.orientation}`]: true,
		[`ml-step--${c.color}`]: true,
		"ml-step--first": c.first,
		"ml-step--last": c.last,
		"ml-step--disabled": c.disabled,
		"ml-step--compact": isCompact
	})}
			role="tab"
			aria-selected=${c.status === "current"}
			aria-disabled=${c.disabled}
			tabindex=${c.status === "current" ? "0" : "-1"}
			@click=${c.handleClick}
		>
			${when(isBar, () => renderBarStep(c))}
			${when(!isBar && !isCompact, () => renderStandardStep(c))}
			${when(!isBar && isCompact, () => renderCompactStep(c))}
		</div>
	`;
}
function renderBarStep(c) {
	return html`
		<div class="ml-step__bar"></div>
		<div class="ml-step__content">
			<span class="ml-step__label">${c.label}</span>
			${when(!!c.description, () => html`<span class="ml-step__description">${c.description}</span>`)}
		</div>
	`;
}
function renderStandardStep(c) {
	return html`
		<div class="ml-step__track">
			<div class="ml-step__connector-before ${c.first ? "ml-step__connector--hidden" : `ml-step__connector--${c.connector}`}"></div>
			<div class="ml-step__indicator">
				${renderIndicator(c)}
			</div>
			<div class="ml-step__connector-after ${c.last ? "ml-step__connector--hidden" : `ml-step__connector--${c.connector}`}"></div>
		</div>
		<div class="ml-step__content">
			<span class="ml-step__label">${c.label}</span>
			${when(!!c.description, () => html`<span class="ml-step__description">${c.description}</span>`)}
		</div>
	`;
}
function renderCompactStep(_c) {
	return html`
		<div class="ml-step__dot"></div>
	`;
}
function renderIndicator(c) {
	switch (c.variant) {
		case "numbered": return renderNumberedIndicator(c);
		case "circles": return renderCirclesIndicator(c);
		case "icons": return renderIconsIndicator(c);
		default: return renderNumberedIndicator(c);
	}
}
function renderNumberedIndicator(c) {
	const isCompleted = c.status === "completed";
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--numbered">
			${when(isCompleted, () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
			${when(!isCompleted, () => html`<span>${c["step-number"]}</span>`)}
		</div>
	`;
}
function renderCirclesIndicator(c) {
	const isCompleted = c.status === "completed";
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--circles">
			${when(isCompleted, () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
			${when(!isCompleted, () => html`<div class="ml-step__indicator-dot"></div>`)}
		</div>
	`;
}
function renderIconsIndicator(c) {
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--icons">
			<ml-icon icon=${c.icon || "circle"} size="sm"></ml-icon>
		</div>
	`;
}
const stepStyles = () => css`
	:host {
		/* Focus ring */
		--ml-step-focus-color: var(--ml-color-primary);
		--ml-step-focus-radius: var(--ml-radius);

		/* Disabled state */
		--ml-step-disabled-opacity: 0.5;

		/* Connector */
		--ml-step-connector-thickness: 2px;
		--ml-step-connector-color: var(--ml-color-border);
		--ml-step-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator (numbered & circles) */
		--ml-step-indicator-size: 32px;
		--ml-step-indicator-border-width: 2px;
		--ml-step-indicator-font-size: var(--ml-text-sm);
		--ml-step-indicator-font-weight: var(--ml-font-medium);
		--ml-step-indicator-font-family: var(--ml-font-sans);
		--ml-step-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator upcoming */
		--ml-step-upcoming-border-color: var(--ml-color-border);
		--ml-step-upcoming-color: var(--ml-color-text-secondary);
		--ml-step-upcoming-bg: var(--ml-color-surface);

		/* Indicator dot (circles variant) */
		--ml-step-dot-size: 10px;

		/* Icons variant */
		--ml-step-icon-indicator-size: 40px;
		--ml-step-icon-indicator-radius: var(--ml-radius-lg);
		--ml-step-icon-upcoming-color: var(--ml-color-text-muted);
		--ml-step-icon-current-border-color: var(--ml-color-text);
		--ml-step-icon-current-color: var(--ml-color-text);

		/* Completed indicator text */
		--ml-step-completed-indicator-text: #fff;

		/* Bar variant */
		--ml-step-bar-height: 4px;
		--ml-step-bar-radius: 2px;
		--ml-step-bar-color: var(--ml-color-border);

		/* Compact / dots */
		--ml-step-compact-dot-size: 12px;
		--ml-step-compact-dot-color: var(--ml-color-border);

		/* Content spacing */
		--ml-step-content-gap: var(--ml-space-1);
		--ml-step-track-gap: var(--ml-space-3);
		--ml-step-vertical-content-padding: var(--ml-space-6);

		/* Label */
		--ml-step-label-font-family: var(--ml-font-sans);
		--ml-step-label-font-size: var(--ml-text-sm);
		--ml-step-label-font-weight: var(--ml-font-medium);
		--ml-step-label-color: var(--ml-color-text);
		--ml-step-label-line-height: var(--ml-leading-tight);
		--ml-step-label-upcoming-color: var(--ml-color-text-secondary);

		/* Description */
		--ml-step-desc-font-family: var(--ml-font-sans);
		--ml-step-desc-font-size: var(--ml-text-xs);
		--ml-step-desc-color: var(--ml-color-text-muted);
		--ml-step-desc-line-height: var(--ml-leading-normal);

		display: contents;
	}

	/* ============================================
	   BASE STEP
	   ============================================ */
	.ml-step {
		display: flex;
		align-items: flex-start;
		cursor: pointer;
		flex: 1;
		min-width: 0;
	}

	.ml-step--disabled {
		cursor: not-allowed;
		opacity: var(--ml-step-disabled-opacity);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-step-focus-color);
		outline-offset: 2px;
		border-radius: var(--ml-step-focus-radius);
	}

	/* ============================================
	   HORIZONTAL LAYOUT
	   ============================================ */
	.ml-step--horizontal {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.ml-step--horizontal .ml-step__track {
		display: flex;
		align-items: center;
		width: 100%;
		margin-bottom: var(--ml-step-track-gap);
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-step-connector-thickness);
	}

	.ml-step--horizontal .ml-step__connector--hidden {
		visibility: hidden;
	}

	/* ============================================
	   VERTICAL LAYOUT
	   ============================================ */
	.ml-step--vertical {
		flex-direction: row;
		align-items: stretch;
		text-align: left;
	}

	.ml-step--vertical .ml-step__track {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: var(--ml-step-track-gap);
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-step-connector-thickness);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding);
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   CONNECTORS
	   ============================================ */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Solid connector */
	.ml-step__connector--solid {
		background-color: var(--ml-step-connector-color);
	}

	/* Dotted connector */
	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	/* Horizontal dotted */
	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-step-connector-color) 0,
			var(--ml-step-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 100% 2px;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Vertical dotted */
	.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-step-connector-color) 0,
			var(--ml-step-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 2px 100%;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Connector coloring - Completed: both halves colored */
	.ml-step--completed.ml-step--primary .ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--completed.ml-step--success .ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--completed.ml-step--primary .ml-step--horizontal .ml-step__connector--dotted,
	.ml-step--completed.ml-step--primary.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--primary.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* Current: before-connector colored, after-connector gray */
	.ml-step--current.ml-step--primary .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--current.ml-step--success .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--current.ml-step--primary.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--primary.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* ============================================
	   INDICATOR BASE
	   ============================================ */
	.ml-step__indicator {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-step__indicator-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color var(--ml-step-indicator-transition),
			border-color var(--ml-step-indicator-transition),
			color var(--ml-step-indicator-transition);
	}

	/* ============================================
	   NUMBERED VARIANT
	   ============================================ */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-step-indicator-size);
		height: var(--ml-step-indicator-size);
		border-radius: 50%;
		font-size: var(--ml-step-indicator-font-size);
		font-weight: var(--ml-step-indicator-font-weight);
		font-family: var(--ml-step-indicator-font-family);
	}

	/* Numbered - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
		color: var(--ml-step-upcoming-color);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text);
	}

	/* Numbered - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text);
	}

	/* ============================================
	   CIRCLES VARIANT
	   ============================================ */
	.ml-step__indicator-inner--circles {
		width: var(--ml-step-indicator-size);
		height: var(--ml-step-indicator-size);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-step-dot-size);
		height: var(--ml-step-dot-size);
		border-radius: 50%;
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Circles - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-step-upcoming-border-color);
	}

	/* Circles - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	/* Circles - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	/* Circles - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text);
	}

	/* Circles - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text);
	}

	/* ============================================
	   ICONS VARIANT
	   ============================================ */
	.ml-step__indicator-inner--icons {
		width: var(--ml-step-icon-indicator-size);
		height: var(--ml-step-icon-indicator-size);
		border-radius: var(--ml-step-icon-indicator-radius);
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
	}

	/* Icons - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-upcoming-border-color);
		background-color: var(--ml-step-upcoming-bg);
		color: var(--ml-step-icon-upcoming-color);
	}

	/* Icons - Current */
	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-icon-current-border-color);
		background-color: var(--ml-step-upcoming-bg);
		color: var(--ml-step-icon-current-color);
	}

	/* Icons - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	/* Icons - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-success);
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	/* ============================================
	   BAR VARIANT
	   ============================================ */
	.ml-step--bar {
		flex-direction: column;
		gap: 0;
	}

	.ml-step--bar .ml-step__bar {
		width: 100%;
		height: var(--ml-step-bar-height);
		border-radius: var(--ml-step-bar-radius);
		background-color: var(--ml-step-bar-color);
		margin-bottom: var(--ml-step-track-gap);
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Bar - Current & Completed (primary) */
	.ml-step--bar.ml-step--current.ml-step--primary .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--primary .ml-step__bar {
		background-color: var(--ml-color-primary);
	}

	/* Bar - Current & Completed (success) */
	.ml-step--bar.ml-step--current.ml-step--success .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--success .ml-step__bar {
		background-color: var(--ml-color-success);
	}

	/* Bar - Vertical */
	.ml-step--bar.ml-step--vertical {
		flex-direction: row;
	}

	.ml-step--bar.ml-step--vertical .ml-step__bar {
		width: var(--ml-step-bar-height);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-step-track-gap);
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding);
	}

	.ml-step--bar.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   COMPACT / DOTS MODE
	   ============================================ */
	.ml-step--compact {
		flex: 0 0 auto;
		min-width: auto;
		align-items: center;
		justify-content: center;
	}

	.ml-step__dot {
		width: var(--ml-step-compact-dot-size);
		height: var(--ml-step-compact-dot-size);
		border-radius: 50%;
		background-color: var(--ml-step-compact-dot-color);
		transition: background-color var(--ml-step-connector-transition);
	}

	.ml-step--compact.ml-step--current.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}
	.ml-step--compact.ml-step--current.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}
	.ml-step--compact.ml-step--completed.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}
	.ml-step--compact.ml-step--completed.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}

	/* ============================================
	   CONTENT (LABEL + DESCRIPTION)
	   ============================================ */
	.ml-step__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-step-content-gap);
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-step-label-font-family);
		font-size: var(--ml-step-label-font-size);
		font-weight: var(--ml-step-label-font-weight);
		color: var(--ml-step-label-color);
		line-height: var(--ml-step-label-line-height);
		transition: color var(--ml-step-connector-transition);
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-step-label-upcoming-color);
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-step-desc-font-family);
		font-size: var(--ml-step-desc-font-size);
		color: var(--ml-step-desc-color);
		line-height: var(--ml-step-desc-line-height);
	}
`;
var StepComponent = class StepComponent$1 {
	constructor() {
		this.value = "";
		this.label = "";
		this.description = "";
		this.icon = "";
		this.href = "";
		this.disabled = false;
		this.status = "upcoming";
		this.variant = "numbered";
		this.connector = "solid";
		this.color = "primary";
		this.orientation = "horizontal";
		this["step-number"] = "1";
		this.first = false;
		this.last = false;
		this.compact = false;
		this.handleClick = () => {
			if (this.disabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:step-click", {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					href: this.href
				}
			}));
		};
	}
};
StepComponent = __decorate([MelodicComponent({
	selector: "ml-step",
	template: stepTemplate,
	styles: stepStyles,
	attributes: [
		"value",
		"label",
		"description",
		"icon",
		"disabled",
		"status",
		"variant",
		"connector",
		"color",
		"orientation",
		"step-number",
		"first",
		"last",
		"compact"
	]
})], StepComponent);
function stepPanelTemplate(_c) {
	return html`
		<div class="ml-step-panel" role="tabpanel">
			<slot></slot>
		</div>
	`;
}
const stepPanelStyles = () => css`
	:host {
		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-step-panel {
		outline: none;
	}
`;
var StepPanelComponent = class StepPanelComponent$1 {
	constructor() {
		this.value = "";
	}
};
StepPanelComponent = __decorate([MelodicComponent({
	selector: "ml-step-panel",
	template: stepPanelTemplate,
	styles: stepPanelStyles,
	attributes: ["value"]
})], StepPanelComponent);
const dialogTemplate = () => html`<dialog class="ml-dialog">
		<div class="ml-dialog-header">
			<slot name="dialog-header"></slot>
		</div>

		<div class="ml-dialog-body">
			<slot></slot>
		</div>

		<div class="ml-dialog-footer">
			<slot name="dialog-footer"></slot>
		</div>
	</dialog> `;
const dialogStyles = () => css`
	:host {
		/* Dialog panel */
		--ml-dialog-max-width: 500px;
		--ml-dialog-bg: var(--ml-color-surface);
		--ml-dialog-radius: var(--ml-radius-xl);
		--ml-dialog-shadow: var(--ml-shadow-xl);
		--ml-dialog-transition: var(--ml-transition-normal);

		/* Backdrop */
		--ml-dialog-backdrop-color: rgba(0, 0, 0, 0.5);

		/* Size variants */
		--ml-dialog-sm-max-width: 400px;
		--ml-dialog-md-max-width: 500px;
		--ml-dialog-lg-max-width: 640px;
		--ml-dialog-xl-max-width: 800px;

		/* Header */
		--ml-dialog-header-padding: var(--ml-space-6);
		--ml-dialog-header-gap: var(--ml-space-4);
		--ml-dialog-header-title-font-size: var(--ml-text-lg);
		--ml-dialog-header-title-font-weight: var(--ml-font-semibold);
		--ml-dialog-header-title-color: var(--ml-color-text);
		--ml-dialog-header-title-line-height: var(--ml-leading-tight);
		--ml-dialog-header-desc-font-size: var(--ml-text-sm);
		--ml-dialog-header-desc-color: var(--ml-color-text-secondary);
		--ml-dialog-header-desc-line-height: var(--ml-leading-relaxed);

		/* Body */
		--ml-dialog-body-padding: var(--ml-space-6);
		--ml-dialog-body-font-size: var(--ml-text-sm);
		--ml-dialog-body-color: var(--ml-color-text-secondary);
		--ml-dialog-body-line-height: var(--ml-leading-relaxed);

		/* Footer */
		--ml-dialog-footer-padding-y: var(--ml-space-4);
		--ml-dialog-footer-padding-x: var(--ml-space-6);
		--ml-dialog-footer-gap: var(--ml-space-3);
		--ml-dialog-footer-border-color: var(--ml-color-border);
		--ml-dialog-footer-bg: var(--ml-color-surface);

		display: contents;
	}

	/* Dialog base */
	dialog.ml-dialog {
		position: fixed;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--ml-dialog-max-width);
		max-height: calc(100vh - var(--ml-space-8));
		margin: auto;
		padding: 0;
		background-color: var(--ml-dialog-bg);
		border: none;
		border-radius: var(--ml-dialog-radius);
		box-shadow: var(--ml-dialog-shadow);
		outline: none;
		overflow: hidden;
		transform: scale(0.95) translateY(10px);
		opacity: 0;
		transition:
			transform var(--ml-dialog-transition),
			opacity var(--ml-dialog-transition),
			overlay var(--ml-dialog-transition) allow-discrete,
			display var(--ml-dialog-transition) allow-discrete;
	}

	dialog.ml-dialog[open] {
		transform: scale(1) translateY(0);
		opacity: 1;
	}

	@starting-style {
		dialog.ml-dialog[open] {
			transform: scale(0.95) translateY(10px);
			opacity: 0;
		}
	}

	/* Backdrop */
	dialog.ml-dialog::backdrop {
		background-color: rgba(0, 0, 0, 0);
		transition:
			background-color var(--ml-dialog-transition),
			overlay var(--ml-dialog-transition) allow-discrete,
			display var(--ml-dialog-transition) allow-discrete;
	}

	dialog.ml-dialog[open]::backdrop {
		background-color: var(--ml-dialog-backdrop-color);
	}

	@starting-style {
		dialog.ml-dialog[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Size variants */
	dialog.ml-dialog--sm {
		max-width: var(--ml-dialog-sm-max-width);
	}

	dialog.ml-dialog--md {
		max-width: var(--ml-dialog-md-max-width);
	}

	dialog.ml-dialog--lg {
		max-width: var(--ml-dialog-lg-max-width);
	}

	dialog.ml-dialog--xl {
		max-width: var(--ml-dialog-xl-max-width);
	}

	dialog.ml-dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Header */
	.ml-dialog-header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-dialog-header-gap);
		padding: var(--ml-dialog-header-padding);
		padding-bottom: 0;
	}

	.ml-dialog-header:not(:has(*)) {
		display: none;
	}

	.ml-dialog-header ::slotted(*) {
		flex: 1;
		min-width: 0;
	}

	.ml-dialog-header ::slotted(h1),
	.ml-dialog-header ::slotted(h2),
	.ml-dialog-header ::slotted(h3),
	.ml-dialog-header ::slotted(h4) {
		margin: 0;
		font-size: var(--ml-dialog-header-title-font-size);
		font-weight: var(--ml-dialog-header-title-font-weight);
		color: var(--ml-dialog-header-title-color);
		line-height: var(--ml-dialog-header-title-line-height);
	}

	.ml-dialog-header ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-dialog-header-desc-font-size);
		color: var(--ml-dialog-header-desc-color);
		line-height: var(--ml-dialog-header-desc-line-height);
	}

	/* Body */
	.ml-dialog-body {
		flex: 1 1 auto;
		padding: var(--ml-dialog-body-padding);
		overflow-y: auto;
		font-size: var(--ml-dialog-body-font-size);
		color: var(--ml-dialog-body-color);
		line-height: var(--ml-dialog-body-line-height);
	}

	.ml-dialog-body ::slotted(p) {
		margin: 0;
	}

	.ml-dialog-body ::slotted(p + p) {
		margin-top: var(--ml-space-4);
	}

	/* Footer */
	.ml-dialog-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-dialog-footer-gap);
		padding: var(--ml-dialog-footer-padding-y) var(--ml-dialog-footer-padding-x);
		border-top: 1px solid var(--ml-dialog-footer-border-color);
		background-color: var(--ml-dialog-footer-bg);
	}

	.ml-dialog-footer:not(:has(*)) {
		display: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		dialog.ml-dialog {
			max-width: 100%;
			max-height: 90vh;
			margin: auto auto 0;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		dialog.ml-dialog--full {
			max-height: 100vh;
			border-radius: 0;
		}

		.ml-dialog-header,
		.ml-dialog-body,
		.ml-dialog-footer {
			padding-left: var(--ml-space-4);
			padding-right: var(--ml-space-4);
		}

		.ml-dialog-footer {
			flex-wrap: wrap;
		}
	}
`;
var DialogRef = class {
	constructor(_dialogID, _dialogEl) {
		this._dialogID = _dialogID;
		this._dialogEl = _dialogEl;
		this._afterOpenedCallback = null;
		this._afterClosedCallback = null;
		this._disableClose = false;
		this._handleCancel = this.onCancel.bind(this);
		this._handleBackdropClick = this.onBackdropClick.bind(this);
		this._dialogEl.addEventListener("cancel", this._handleCancel);
		this._dialogEl.addEventListener("click", this._handleBackdropClick);
	}
	get dialogID() {
		return this._dialogID;
	}
	get data() {
		return this._data;
	}
	get disableClose() {
		return this._disableClose;
	}
	applyConfig(config) {
		if (config.data !== void 0) this._data = config.data;
		if (config.disableClose !== void 0) this._disableClose = config.disableClose;
		if (config.size && config.size !== "auto") this._dialogEl.classList.add(`ml-dialog--${config.size}`);
		if (config.width) this._dialogEl.style.maxWidth = config.width;
		if (config.panelClass) {
			const classes = Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass];
			this._dialogEl.classList.add(...classes);
		}
		return this;
	}
	open() {
		this._dialogEl.showModal();
		this._afterOpenedCallback?.();
	}
	close(result) {
		this._dialogEl.close();
		this._afterClosedCallback?.(result);
	}
	afterOpened(callback) {
		this._afterOpenedCallback = callback;
	}
	afterClosed(callback) {
		this._afterClosedCallback = callback;
	}
	onCancel(event) {
		if (this._disableClose) event.preventDefault();
	}
	onBackdropClick(event) {
		if (event.target === this._dialogEl && !this._disableClose) this.close();
	}
};
var DialogService = class DialogService$1 {
	constructor() {
		this._dialogs = /* @__PURE__ */ new Map();
	}
	addDialog(dialogID, dialogEl) {
		const dialogRef = new DialogRef(dialogID, dialogEl);
		this._dialogs.set(dialogID, {
			dialogRef,
			dialogComponent: void 0
		});
		dialogEl.addEventListener("close", () => {
			const elements = this._dialogs.get(dialogID);
			this.cleanUpDialog(dialogID, elements?.dialogComponent);
		});
		return dialogRef;
	}
	removeDialog(dialogID) {
		this._dialogs.delete(dialogID);
	}
	open(dialogComponentOrID, config) {
		let dialogID = dialogComponentOrID;
		let dialogElements = this._dialogs.get(dialogID);
		if (typeof dialogComponentOrID !== "string") {
			const dialogComponent = this.mountDialog(dialogComponentOrID);
			dialogID = ((dialogComponent.shadowRoot?.querySelector("ml-dialog")).shadowRoot?.querySelector("dialog")).id;
			dialogElements = this._dialogs.get(dialogID);
			dialogElements.dialogComponent = dialogComponent;
			if (config) dialogElements.dialogRef.applyConfig(config);
			dialogComponent.component.onDialogRefSet?.(dialogElements.dialogRef);
		}
		dialogElements.dialogRef.open();
		return dialogElements.dialogRef;
	}
	close(dialogID, result) {
		if (this._dialogs.has(dialogID)) this._dialogs.get(dialogID).dialogRef.close(result);
	}
	cleanUpDialog(dialogID, dialogComponent) {
		if (dialogComponent) {
			this.unmountDialog(dialogComponent);
			this.removeDialog(dialogID);
		}
	}
	mountDialog(component) {
		const dialogElement = document.createElement(component.selector);
		document.body.appendChild(dialogElement);
		return dialogElement;
	}
	unmountDialog(component) {
		component.remove();
	}
};
DialogService = __decorate([Injectable()], DialogService);
var _ref;
var DialogComponent = class DialogComponent$1 {
	constructor() {
		this._dialogID = newID();
		this._registered = false;
	}
	onCreate() {
		this.registerDialog();
	}
	registerDialog() {
		if (this._registered) return;
		const dialogEl = this.elementRef.shadowRoot?.querySelector("dialog");
		if (!dialogEl) return;
		this._dialogEl = dialogEl;
		this._dialogID = this.createDialogID();
		this._dialogEl.id = this._dialogID;
		this._dialogRef = this._dialogService.addDialog(this._dialogID, this._dialogEl);
		this._registered = true;
	}
	onDestroy() {
		this._dialogService.removeDialog(this._dialogID);
	}
	open() {
		this.registerDialog();
		this._dialogRef.open();
	}
	close(result) {
		this._dialogRef.close(result);
	}
	createDialogID() {
		return this.elementRef.getAttributeNames().find((attr) => attr.startsWith("#"))?.slice(1) ?? this._dialogID;
	}
};
__decorate([Service(DialogService), __decorateMetadata("design:type", typeof (_ref = typeof DialogService !== "undefined" && DialogService) === "function" ? _ref : Object)], DialogComponent.prototype, "_dialogService", void 0);
DialogComponent = __decorate([MelodicComponent({
	selector: "ml-dialog",
	template: dialogTemplate,
	styles: dialogStyles,
	attributes: []
})], DialogComponent);
function drawerTemplate(c) {
	const side = c.side === "left" ? "left" : "right";
	const size = c.size === "sm" || c.size === "md" || c.size === "lg" || c.size === "xl" ? c.size : "md";
	return html`
		<dialog
			class=${classMap({
		"ml-drawer": true,
		"ml-drawer--left": side === "left",
		"ml-drawer--right": side === "right",
		"ml-drawer--sm": size === "sm",
		"ml-drawer--md": size === "md",
		"ml-drawer--lg": size === "lg",
		"ml-drawer--xl": size === "xl"
	})}
		>
			<div class="ml-drawer__panel">
				<div class="ml-drawer__header">
					<div class="ml-drawer__header-content">
						<slot name="drawer-header"></slot>
					</div>
					${when(c.showClose, () => html`
							<button class="ml-drawer__close" @click=${c.close} aria-label="Close">
								<ml-icon icon="x" size="sm" format="bold"></ml-icon>
							</button>
						`)}
				</div>
				<div class="ml-drawer__body">
					<slot></slot>
				</div>
				<div class="ml-drawer__footer">
					<slot name="drawer-footer"></slot>
				</div>
			</div>
		</dialog>
	`;
}
const drawerStyles = () => css`
	:host {
		/* Backdrop */
		--ml-drawer-backdrop-color: rgba(0, 0, 0, 0.5);
		--ml-drawer-backdrop-transition: var(--ml-duration-300) var(--ml-ease-out);

		/* Panel */
		--ml-drawer-bg: var(--ml-color-surface);
		--ml-drawer-shadow: var(--ml-shadow-xl);

		/* Size variants */
		--ml-drawer-sm-width: 320px;
		--ml-drawer-md-width: 480px;
		--ml-drawer-lg-width: 640px;
		--ml-drawer-xl-width: 800px;

		/* Header */
		--ml-drawer-header-padding: var(--ml-space-6);
		--ml-drawer-header-gap: var(--ml-space-4);
		--ml-drawer-header-title-font-size: var(--ml-text-lg);
		--ml-drawer-header-title-font-weight: var(--ml-font-semibold);
		--ml-drawer-header-title-color: var(--ml-color-text);
		--ml-drawer-header-title-line-height: var(--ml-leading-tight);
		--ml-drawer-header-desc-font-size: var(--ml-text-sm);
		--ml-drawer-header-desc-color: var(--ml-color-text-secondary);

		/* Close button */
		--ml-drawer-close-size: 32px;
		--ml-drawer-close-radius: var(--ml-radius-md);
		--ml-drawer-close-color: var(--ml-color-text-tertiary);
		--ml-drawer-close-hover-bg: var(--ml-color-surface-hover);
		--ml-drawer-close-hover-color: var(--ml-color-text);
		--ml-drawer-close-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Body */
		--ml-drawer-body-padding: var(--ml-space-6);
		--ml-drawer-body-font-size: var(--ml-text-sm);
		--ml-drawer-body-color: var(--ml-color-text-secondary);
		--ml-drawer-body-line-height: var(--ml-leading-relaxed);

		/* Footer */
		--ml-drawer-footer-padding-y: var(--ml-space-4);
		--ml-drawer-footer-padding-x: var(--ml-space-6);
		--ml-drawer-footer-gap: var(--ml-space-3);
		--ml-drawer-footer-border-color: var(--ml-color-border);

		display: contents;
	}

	dialog.ml-drawer {
		position: fixed;
		inset: 0;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		max-width: none;
		max-height: none;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	dialog.ml-drawer:not([open]) {
		display: none;
	}

	/* Backdrop */
	dialog.ml-drawer::backdrop {
		background-color: rgba(0, 0, 0, 0);
		transition:
			background-color var(--ml-drawer-backdrop-transition),
			overlay var(--ml-drawer-backdrop-transition) allow-discrete,
			display var(--ml-drawer-backdrop-transition) allow-discrete;
	}

	dialog.ml-drawer[open]::backdrop {
		background-color: var(--ml-drawer-backdrop-color);
	}

	@starting-style {
		dialog.ml-drawer[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Panel */
	.ml-drawer__panel {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--ml-drawer-bg);
		box-shadow: var(--ml-drawer-shadow);
	}

	/* Side variants - panel is off-screen by default */
	dialog.ml-drawer--right .ml-drawer__panel {
		right: 0;
	}

	dialog.ml-drawer--left .ml-drawer__panel {
		left: 0;
	}

	/* Size variants */
	.ml-drawer--sm .ml-drawer__panel {
		width: var(--ml-drawer-sm-width);
	}

	.ml-drawer--md .ml-drawer__panel {
		width: var(--ml-drawer-md-width);
	}

	.ml-drawer--lg .ml-drawer__panel {
		width: var(--ml-drawer-lg-width);
	}

	.ml-drawer--xl .ml-drawer__panel {
		width: var(--ml-drawer-xl-width);
	}

	/* Header */
	.ml-drawer__header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-drawer-header-gap);
		padding: var(--ml-drawer-header-padding);
		padding-bottom: 0;
	}

	.ml-drawer__header:not(:has(slot[name="drawer-header"] *)) {
		padding-bottom: 0;
	}

	.ml-drawer__header-content {
		flex: 1;
		min-width: 0;
	}

	.ml-drawer__header-content ::slotted(h1),
	.ml-drawer__header-content ::slotted(h2),
	.ml-drawer__header-content ::slotted(h3),
	.ml-drawer__header-content ::slotted(h4) {
		margin: 0;
		font-size: var(--ml-drawer-header-title-font-size);
		font-weight: var(--ml-drawer-header-title-font-weight);
		color: var(--ml-drawer-header-title-color);
		line-height: var(--ml-drawer-header-title-line-height);
	}

	.ml-drawer__header-content ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-drawer-header-desc-font-size);
		color: var(--ml-drawer-header-desc-color);
	}

	.ml-drawer__close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-drawer-close-size);
		height: var(--ml-drawer-close-size);
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-drawer-close-radius);
		cursor: pointer;
		color: var(--ml-drawer-close-color);
		transition:
			background-color var(--ml-drawer-close-transition),
			color var(--ml-drawer-close-transition);
	}

	.ml-drawer__close:hover {
		background-color: var(--ml-drawer-close-hover-bg);
		color: var(--ml-drawer-close-hover-color);
	}

	/* Body */
	.ml-drawer__body {
		flex: 1;
		padding: var(--ml-drawer-body-padding);
		overflow-y: auto;
		font-size: var(--ml-drawer-body-font-size);
		color: var(--ml-drawer-body-color);
		line-height: var(--ml-drawer-body-line-height);
	}

	/* Footer */
	.ml-drawer__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-drawer-footer-gap);
		padding: var(--ml-drawer-footer-padding-y) var(--ml-drawer-footer-padding-x);
		border-top: 1px solid var(--ml-drawer-footer-border-color);
	}

	.ml-drawer__footer:not(:has(*)) {
		display: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.ml-drawer__panel {
			width: 100% !important;
		}
	}
`;
var DrawerComponent = class DrawerComponent$1 {
	constructor() {
		this.side = "right";
		this.size = "md";
		this.showClose = true;
		this.close = () => {
			if (!this._dialogEl?.open) return;
			this.cancelAnimations();
			const prop = this._positionProp;
			const width = this._panelEl.offsetWidth;
			const anim = this._panelEl.animate([{ [prop]: "0px" }, { [prop]: `${-width}px` }], {
				duration: 300,
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
				fill: "forwards"
			});
			anim.onfinish = () => {
				this._panelEl.style[prop] = "";
				this._dialogEl.close();
			};
			this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
				bubbles: true,
				composed: true
			}));
		};
		this.handleBackdropClick = (event) => {
			if (event.target === this._dialogEl) this.close();
		};
		this.handleDialogCancel = (event) => {
			event.preventDefault();
			this.close();
		};
	}
	get _positionProp() {
		return this.side === "left" ? "left" : "right";
	}
	cancelAnimations() {
		for (const anim of this._panelEl.getAnimations()) anim.cancel();
	}
	onCreate() {
		this._dialogEl = this.elementRef.shadowRoot?.querySelector("dialog");
		this._panelEl = this._dialogEl?.querySelector(".ml-drawer__panel");
		this._dialogEl?.addEventListener("click", this.handleBackdropClick);
		this._dialogEl?.addEventListener("cancel", this.handleDialogCancel);
	}
	onDestroy() {
		this._dialogEl?.removeEventListener("click", this.handleBackdropClick);
		this._dialogEl?.removeEventListener("cancel", this.handleDialogCancel);
	}
	open() {
		if (this._dialogEl?.open) return;
		this.cancelAnimations();
		this._dialogEl.showModal();
		const prop = this._positionProp;
		const width = this._panelEl.offsetWidth;
		this._panelEl.style[prop] = `${-width}px`;
		this._panelEl.getBoundingClientRect();
		const anim = this._panelEl.animate([{ [prop]: `${-width}px` }, { [prop]: "0px" }], {
			duration: 300,
			easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			fill: "forwards"
		});
		anim.onfinish = () => {
			this._panelEl.style[prop] = "0px";
		};
		this.elementRef.dispatchEvent(new CustomEvent("ml:open", {
			bubbles: true,
			composed: true
		}));
	}
};
DrawerComponent = __decorate([MelodicComponent({
	selector: "ml-drawer",
	template: drawerTemplate,
	styles: drawerStyles,
	attributes: [
		"side",
		"size",
		"show-close"
	]
})], DrawerComponent);
function dropdownTemplate(c) {
	return html`
		<div class="ml-dropdown">
			<div class="ml-dropdown__trigger" @click=${c.toggle}>
				<slot name="trigger"></slot>
			</div>
			<div
				class="ml-dropdown__menu"
				role="menu"
				popover="auto"
			>
				<slot></slot>
				${when(c.arrow, () => html`<div class="ml-dropdown__arrow"></div>`)}
			</div>
		</div>
	`;
}
const dropdownStyles = () => css`
	:host {
		/* Menu */
		--ml-dropdown-padding: var(--ml-space-1);
		--ml-dropdown-border-color: var(--ml-color-border);
		--ml-dropdown-radius: var(--ml-radius-lg);
		--ml-dropdown-bg: var(--ml-color-surface);
		--ml-dropdown-color: var(--ml-color-text);
		--ml-dropdown-shadow: var(--ml-shadow-lg);
		--ml-dropdown-min-width: 180px;
		--ml-dropdown-transition: var(--ml-duration-150) var(--ml-ease-out);

		/* Arrow */
		--ml-dropdown-arrow-size: 8px;
		--ml-dropdown-arrow-bg: var(--ml-color-surface);
		--ml-dropdown-arrow-border-color: var(--ml-color-border);

		display: inline-block;
	}

	.ml-dropdown {
		position: relative;
		display: inline-block;
	}

	.ml-dropdown__trigger {
		display: inline-block;
		cursor: pointer;
	}

	.ml-dropdown__menu {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-dropdown-padding);
		border: 1px solid var(--ml-dropdown-border-color);
		border-radius: var(--ml-dropdown-radius);
		background-color: var(--ml-dropdown-bg);
		color: var(--ml-dropdown-color);
		box-shadow: var(--ml-dropdown-shadow);
		min-width: var(--ml-dropdown-min-width);
		overflow: visible;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-dropdown-transition),
			transform var(--ml-dropdown-transition),
			overlay var(--ml-dropdown-transition) allow-discrete,
			display var(--ml-dropdown-transition) allow-discrete;
	}

	.ml-dropdown__menu:not(:popover-open) {
		display: none;
	}

	.ml-dropdown__menu:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-dropdown__menu:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.ml-dropdown__arrow {
		position: absolute;
		width: var(--ml-dropdown-arrow-size);
		height: var(--ml-dropdown-arrow-size);
		background-color: var(--ml-dropdown-arrow-bg);
		border: 1px solid var(--ml-dropdown-arrow-border-color);
		transform: rotate(45deg);
	}

	.ml-dropdown__menu[data-placement^='top'] .ml-dropdown__arrow {
		border-top: none;
		border-left: none;
	}

	.ml-dropdown__menu[data-placement^='bottom'] .ml-dropdown__arrow {
		border-bottom: none;
		border-right: none;
	}

	.ml-dropdown__menu[data-placement^='left'] .ml-dropdown__arrow {
		border-bottom: none;
		border-left: none;
	}

	.ml-dropdown__menu[data-placement^='right'] .ml-dropdown__arrow {
		border-top: none;
		border-right: none;
	}
`;
var DropdownComponent = class DropdownComponent$1 {
	constructor() {
		this.placement = "bottom-start";
		this.offset = 4;
		this.arrow = false;
		this.isOpen = false;
		this._focusedIndex = -1;
		this._cleanupAutoUpdate = null;
		this.toggle = () => {
			const menuEl = this.getMenuEl();
			if (menuEl) menuEl.togglePopover();
		};
		this.handleToggle = (event) => {
			if (event.newState === "open") {
				this.isOpen = true;
				this.startPositioning();
				this.focusFirstItem();
				this.elementRef.dispatchEvent(new CustomEvent("ml:open", {
					bubbles: true,
					composed: true
				}));
			} else {
				this.isOpen = false;
				this.clearFocus();
				this._cleanupAutoUpdate?.();
				this._cleanupAutoUpdate = null;
				this.returnFocusToTrigger();
				this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
					bubbles: true,
					composed: true
				}));
			}
		};
		this.handleItemSelect = (event) => {
			event.stopPropagation();
			const { value } = event.detail;
			this.elementRef.dispatchEvent(new CustomEvent("ml:select", {
				bubbles: true,
				composed: true,
				detail: { value }
			}));
			this.close();
		};
		this.handleKeyDown = (event) => {
			if (!this.isOpen) {
				if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					this.open();
				}
				return;
			}
			const items = this.getNavigableItems();
			if (!items.length) return;
			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					this.focusNextItem(items);
					break;
				case "ArrowUp":
					event.preventDefault();
					this.focusPreviousItem(items);
					break;
				case "Enter":
				case " ":
					event.preventDefault();
					if (this._focusedIndex >= 0 && this._focusedIndex < items.length) {
						const item = items[this._focusedIndex];
						if (!item.disabled) item.handleClick();
					}
					break;
				case "Escape":
					event.preventDefault();
					this.close();
					break;
				case "Tab":
					this.close();
					break;
				case "Home":
					event.preventDefault();
					this.focusItemAtIndex(items, this.findFirstEnabled(items));
					break;
				case "End":
					event.preventDefault();
					this.focusItemAtIndex(items, this.findLastEnabled(items));
					break;
				default: break;
			}
		};
	}
	onCreate() {
		const menuEl = this.getMenuEl();
		if (menuEl) menuEl.addEventListener("toggle", this.handleToggle);
		this.elementRef.addEventListener("ml:item-select", this.handleItemSelect);
		this.elementRef.addEventListener("keydown", this.handleKeyDown);
	}
	onDestroy() {
		this._cleanupAutoUpdate?.();
		const menuEl = this.getMenuEl();
		if (menuEl) menuEl.removeEventListener("toggle", this.handleToggle);
		this.elementRef.removeEventListener("ml:item-select", this.handleItemSelect);
		this.elementRef.removeEventListener("keydown", this.handleKeyDown);
	}
	open() {
		const menuEl = this.getMenuEl();
		if (menuEl && !this.isOpen) menuEl.showPopover();
	}
	close() {
		const menuEl = this.getMenuEl();
		if (menuEl && this.isOpen) menuEl.hidePopover();
	}
	getNavigableItems() {
		const slot = this.elementRef.shadowRoot?.querySelector(".ml-dropdown__menu slot:not([name])");
		if (!slot) return [];
		const items = [];
		const assigned = slot.assignedElements();
		for (const el of assigned) if (el.tagName === "ML-DROPDOWN-ITEM") items.push(el);
		else if (el.tagName === "ML-DROPDOWN-GROUP") {
			const groupSlot = el.shadowRoot?.querySelector("slot:not([name])");
			if (groupSlot) {
				for (const child of groupSlot.assignedElements()) if (child.tagName === "ML-DROPDOWN-ITEM") items.push(child);
			}
		}
		return items;
	}
	focusFirstItem() {
		const items = this.getNavigableItems();
		const index = this.findFirstEnabled(items);
		this.focusItemAtIndex(items, index);
	}
	focusNextItem(items) {
		let index = this._focusedIndex + 1;
		while (index < items.length) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index++;
		}
	}
	focusPreviousItem(items) {
		let index = this._focusedIndex - 1;
		while (index >= 0) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index--;
		}
	}
	focusItemAtIndex(items, index) {
		if (index < 0) return;
		for (let i = 0; i < items.length; i++) items[i].focused = i === index;
		this._focusedIndex = index;
	}
	clearFocus() {
		const items = this.getNavigableItems();
		for (const item of items) item.focused = false;
		this._focusedIndex = -1;
	}
	findFirstEnabled(items) {
		return items.findIndex((item) => !item.disabled);
	}
	findLastEnabled(items) {
		for (let i = items.length - 1; i >= 0; i--) if (!items[i].disabled) return i;
		return -1;
	}
	returnFocusToTrigger() {
		const triggerSlot = this.elementRef.shadowRoot?.querySelector("slot[name=\"trigger\"]");
		if (triggerSlot) {
			const assigned = triggerSlot.assignedElements();
			if (assigned.length > 0) assigned[0].focus();
		}
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const menuEl = this.getMenuEl();
		if (!triggerEl || !menuEl) return;
		const update = () => this.updatePosition(triggerEl, menuEl);
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, menuEl, update);
	}
	updatePosition(triggerEl, menuEl) {
		const arrowEl = this.arrow ? this.elementRef.shadowRoot?.querySelector(".ml-dropdown__arrow") : null;
		const middleware = [
			offset(this.offset),
			flip(),
			shift({ padding: 8 })
		];
		if (arrowEl) middleware.push(arrow({
			element: arrowEl,
			padding: 8
		}));
		const { x, y, placement, middlewareData } = computePosition(triggerEl, menuEl, {
			placement: this.placement,
			middleware
		});
		menuEl.style.left = `${x}px`;
		menuEl.style.top = `${y}px`;
		menuEl.dataset.placement = placement;
		if (arrowEl && middlewareData.arrow) this.positionArrow(arrowEl, placement, middlewareData.arrow);
	}
	positionArrow(arrowEl, placement, arrowData) {
		const side = placement.split("-")[0];
		arrowEl.style.left = arrowData.x === void 0 ? "" : `${arrowData.x}px`;
		arrowEl.style.right = "";
		arrowEl.style.top = arrowData.y === void 0 ? "" : `${arrowData.y}px`;
		arrowEl.style.bottom = "";
		if (side === "top") arrowEl.style.bottom = "-4px";
		if (side === "bottom") arrowEl.style.top = "-4px";
		if (side === "left") arrowEl.style.right = "-4px";
		if (side === "right") arrowEl.style.left = "-4px";
	}
	getTriggerEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-dropdown__trigger");
	}
	getMenuEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-dropdown__menu");
	}
};
DropdownComponent = __decorate([MelodicComponent({
	selector: "ml-dropdown",
	template: dropdownTemplate,
	styles: dropdownStyles,
	attributes: [
		"placement",
		"offset",
		"arrow"
	]
})], DropdownComponent);
function dropdownItemTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-dropdown-item": true,
		"ml-dropdown-item--focused": c.focused,
		"ml-dropdown-item--disabled": c.disabled,
		"ml-dropdown-item--destructive": c.destructive
	})}
			role="menuitem"
			tabindex="-1"
			aria-disabled=${c.disabled || false}
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon class="ml-dropdown-item__icon" icon=${c.icon} size="sm"></ml-icon>`)}
			<span class="ml-dropdown-item__label"><slot></slot></span>
			${when(!!c.addon, () => html`<span class="ml-dropdown-item__addon">${c.addon}</span>`)}
		</div>
	`;
}
const dropdownItemStyles = () => css`
	:host {
		/* Item base */
		--ml-dropdown-item-gap: var(--ml-space-2);
		--ml-dropdown-item-padding: var(--ml-space-2);
		--ml-dropdown-item-radius: var(--ml-radius-md);
		--ml-dropdown-item-font-size: 14px;
		--ml-dropdown-item-line-height: 20px;
		--ml-dropdown-item-color: var(--ml-color-text);
		--ml-dropdown-item-transition: var(--ml-duration-100) var(--ml-ease-out);

		/* Item hover/focused */
		--ml-dropdown-item-hover-bg: var(--ml-color-surface-hover);

		/* Item disabled */
		--ml-dropdown-item-disabled-opacity: 0.5;

		/* Item destructive */
		--ml-dropdown-item-destructive-color: var(--ml-color-error);
		--ml-dropdown-item-destructive-hover-bg: var(--ml-color-error-subtle);

		/* Icon */
		--ml-dropdown-item-icon-color: var(--ml-color-text-secondary);

		/* Addon (shortcut text) */
		--ml-dropdown-item-addon-font-size: 12px;
		--ml-dropdown-item-addon-color: var(--ml-color-text-tertiary);

		display: block;
	}

	.ml-dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--ml-dropdown-item-gap);
		padding: var(--ml-dropdown-item-padding) var(--ml-dropdown-item-padding);
		border-radius: var(--ml-dropdown-item-radius);
		font-size: var(--ml-dropdown-item-font-size);
		line-height: var(--ml-dropdown-item-line-height);
		color: var(--ml-dropdown-item-color);
		cursor: pointer;
		user-select: none;
		transition: background-color var(--ml-dropdown-item-transition);
	}

	.ml-dropdown-item:hover {
		background-color: var(--ml-dropdown-item-hover-bg);
	}

	.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-hover-bg);
	}

	.ml-dropdown-item--disabled {
		opacity: var(--ml-dropdown-item-disabled-opacity);
		cursor: not-allowed;
	}

	.ml-dropdown-item--disabled:hover {
		background-color: transparent;
	}

	.ml-dropdown-item--destructive {
		color: var(--ml-dropdown-item-destructive-color);
	}

	.ml-dropdown-item--destructive:hover {
		background-color: var(--ml-dropdown-item-destructive-hover-bg);
	}

	.ml-dropdown-item--destructive.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-destructive-hover-bg);
	}

	.ml-dropdown-item__icon {
		flex-shrink: 0;
		color: var(--ml-dropdown-item-icon-color);
	}

	.ml-dropdown-item--destructive .ml-dropdown-item__icon {
		color: var(--ml-dropdown-item-destructive-color);
	}

	.ml-dropdown-item__label {
		flex: 1;
		min-width: 0;
	}

	.ml-dropdown-item__addon {
		flex-shrink: 0;
		font-size: var(--ml-dropdown-item-addon-font-size);
		color: var(--ml-dropdown-item-addon-color);
	}
`;
var DropdownItemComponent = class DropdownItemComponent$1 {
	constructor() {
		this.value = "";
		this.icon = "";
		this.addon = "";
		this.disabled = false;
		this.destructive = false;
		this.focused = false;
		this.handleClick = () => {
			if (this.disabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:item-select", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
	}
};
DropdownItemComponent = __decorate([MelodicComponent({
	selector: "ml-dropdown-item",
	template: dropdownItemTemplate,
	styles: dropdownItemStyles,
	attributes: [
		"value",
		"icon",
		"addon",
		"disabled",
		"destructive"
	]
})], DropdownItemComponent);
function dropdownSeparatorTemplate() {
	return html`<div class="ml-dropdown-separator" role="separator"></div>`;
}
const dropdownSeparatorStyles = () => css`
	:host {
		display: block;
	}

	.ml-dropdown-separator {
		height: 1px;
		margin: var(--ml-space-1) 0;
		background-color: var(--ml-color-border);
	}
`;
var DropdownSeparatorComponent = class DropdownSeparatorComponent$1 {};
DropdownSeparatorComponent = __decorate([MelodicComponent({
	selector: "ml-dropdown-separator",
	template: dropdownSeparatorTemplate,
	styles: dropdownSeparatorStyles
})], DropdownSeparatorComponent);
function dropdownGroupTemplate(c) {
	return html`
		<div class="ml-dropdown-group" role="group">
			${when(!!c.label, () => html`<div class="ml-dropdown-group__label">${c.label}</div>`)}
			<slot></slot>
		</div>
	`;
}
const dropdownGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-dropdown-group__label {
		padding: var(--ml-space-2) var(--ml-space-2) var(--ml-space-1);
		font-size: 12px;
		font-weight: 500;
		line-height: 16px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ml-color-text-tertiary);
	}
`;
var DropdownGroupComponent = class DropdownGroupComponent$1 {
	constructor() {
		this.label = "";
	}
};
DropdownGroupComponent = __decorate([MelodicComponent({
	selector: "ml-dropdown-group",
	template: dropdownGroupTemplate,
	styles: dropdownGroupStyles,
	attributes: ["label"]
})], DropdownGroupComponent);
function tooltipTemplate(c) {
	return html`
		<div class="ml-tooltip">
			<div
				class="ml-tooltip__trigger"
				@mouseenter=${c.show}
				@mouseleave=${c.hide}
				@focus=${c.show}
				@blur=${c.hide}
			>
				<slot></slot>
			</div>
			<div
				class=${classMap({
		"ml-tooltip__content": true,
		"ml-tooltip__content--visible": c.isVisible
	})}
				role="tooltip"
				aria-hidden=${!c.isVisible}
			>
				${c.content}
				<div class="ml-tooltip__arrow"></div>
			</div>
		</div>
	`;
}
const tooltipStyles = () => css`
	:host {
		/* Tooltip content */
		--ml-tooltip-max-width: 320px;
		--ml-tooltip-padding-y: var(--ml-space-2);
		--ml-tooltip-padding-x: var(--ml-space-3);
		--ml-tooltip-bg: var(--ml-tooltip-bg);
		--ml-tooltip-color: var(--ml-tooltip-text);
		--ml-tooltip-font-size: var(--ml-text-xs);
		--ml-tooltip-font-weight: var(--ml-font-medium);
		--ml-tooltip-line-height: var(--ml-leading-snug);
		--ml-tooltip-radius: var(--ml-radius);
		--ml-tooltip-shadow: var(--ml-shadow-lg);
		--ml-tooltip-transition: var(--ml-duration-150) var(--ml-ease-out);

		/* Arrow */
		--ml-tooltip-arrow-size: 8px;

		display: inline-block;
	}

	.ml-tooltip {
		position: relative;
		display: inline-block;
	}

	.ml-tooltip__trigger {
		display: inline-block;
	}

	.ml-tooltip__content {
		position: fixed;
		z-index: 9999;
		max-width: var(--ml-tooltip-max-width);
		padding: var(--ml-tooltip-padding-y) var(--ml-tooltip-padding-x);
		background-color: var(--ml-tooltip-bg);
		color: var(--ml-tooltip-color);
		font-size: var(--ml-tooltip-font-size);
		font-weight: var(--ml-tooltip-font-weight);
		line-height: var(--ml-tooltip-line-height);
		border-radius: var(--ml-tooltip-radius);
		box-shadow: var(--ml-tooltip-shadow);
		text-align: center;
		word-wrap: break-word;
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-tooltip-transition),
			transform var(--ml-tooltip-transition);
	}

	.ml-tooltip__content--visible {
		opacity: 1;
		transform: scale(1);
	}

	.ml-tooltip__arrow {
		position: absolute;
		width: var(--ml-tooltip-arrow-size);
		height: var(--ml-tooltip-arrow-size);
		background-color: var(--ml-tooltip-bg);
		transform: rotate(45deg);
	}

	.ml-tooltip__content[data-placement^='top'] .ml-tooltip__arrow {
		bottom: -4px;
	}

	.ml-tooltip__content[data-placement^='bottom'] .ml-tooltip__arrow {
		top: -4px;
	}

	.ml-tooltip__content[data-placement^='left'] .ml-tooltip__arrow {
		right: -4px;
	}

	.ml-tooltip__content[data-placement^='right'] .ml-tooltip__arrow {
		left: -4px;
	}
`;
var TooltipComponent = class TooltipComponent$1 {
	constructor() {
		this.content = "";
		this.placement = "top";
		this.delay = 200;
		this.isVisible = false;
		this._showTimeout = null;
		this._hideTimeout = null;
		this.show = () => {
			if (this._hideTimeout) {
				clearTimeout(this._hideTimeout);
				this._hideTimeout = null;
			}
			this._showTimeout = window.setTimeout(() => {
				this.isVisible = true;
				this.updatePosition();
			}, this.delay);
		};
		this.hide = () => {
			if (this._showTimeout) {
				clearTimeout(this._showTimeout);
				this._showTimeout = null;
			}
			this._hideTimeout = window.setTimeout(() => {
				this.isVisible = false;
			}, 100);
		};
	}
	onInit() {}
	onDestroy() {
		if (this._showTimeout) clearTimeout(this._showTimeout);
		if (this._hideTimeout) clearTimeout(this._hideTimeout);
	}
	updatePosition() {
		const trigger = this.elementRef.shadowRoot?.querySelector(".ml-tooltip__trigger");
		const tooltip = this.elementRef.shadowRoot?.querySelector(".ml-tooltip__content");
		const arrow$1 = this.elementRef.shadowRoot?.querySelector(".ml-tooltip__arrow");
		if (!trigger || !tooltip) return;
		const { x, y, placement } = computePosition(trigger, tooltip, {
			placement: this.placement,
			middleware: [
				offset(8),
				flip(),
				shift({ padding: 8 })
			]
		});
		tooltip.style.left = `${x}px`;
		tooltip.style.top = `${y}px`;
		tooltip.setAttribute("data-placement", placement);
		if (arrow$1) {
			const side = placement.split("-")[0];
			arrow$1.style.left = "";
			arrow$1.style.right = "";
			arrow$1.style.top = "";
			arrow$1.style.bottom = "";
			if (side === "top" || side === "bottom") {
				arrow$1.style.left = "50%";
				arrow$1.style.marginLeft = "-4px";
			} else {
				arrow$1.style.top = "50%";
				arrow$1.style.marginTop = "-4px";
			}
		}
	}
};
TooltipComponent = __decorate([MelodicComponent({
	selector: "ml-tooltip",
	template: tooltipTemplate,
	styles: tooltipStyles,
	attributes: [
		"content",
		"placement",
		"delay"
	]
})], TooltipComponent);
function popoverTemplate(c) {
	return html`
		<div class="ml-popover">
			<div class="ml-popover__trigger" @click=${c.toggle}>
				<slot name="trigger"></slot>
			</div>
			<div
				class="ml-popover__content"
				popover=${c.manual ? "manual" : "auto"}
			>
				<slot></slot>
				${when(c.arrow, () => html`<div class="ml-popover__arrow"></div>`)}
			</div>
		</div>
	`;
}
const popoverStyles = () => css`
	:host {
		/* Content panel */
		--ml-popover-padding-y: var(--ml-space-3);
		--ml-popover-padding-x: var(--ml-space-4);
		--ml-popover-border-color: var(--ml-color-border);
		--ml-popover-radius: var(--ml-radius-lg);
		--ml-popover-bg: var(--ml-color-surface);
		--ml-popover-color: var(--ml-color-text);
		--ml-popover-shadow: var(--ml-shadow-lg);
		--ml-popover-content-overflow: visible;
		--ml-popover-transition: var(--ml-duration-150) var(--ml-ease-out);

		/* Arrow */
		--ml-popover-arrow-size: 8px;
		--ml-popover-arrow-bg: var(--ml-color-surface);
		--ml-popover-arrow-border-color: var(--ml-color-border);

		display: inline-block;
	}

	.ml-popover {
		position: relative;
		display: inline-block;
	}

	.ml-popover__trigger {
		display: inline-block;
		cursor: pointer;
	}

	.ml-popover__content {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-popover-padding-y) var(--ml-popover-padding-x);
		border: 1px solid var(--ml-popover-border-color);
		border-radius: var(--ml-popover-radius);
		background-color: var(--ml-popover-bg);
		color: var(--ml-popover-color);
		box-shadow: var(--ml-popover-shadow);
		overflow: var(--ml-popover-content-overflow);
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-popover-transition),
			transform var(--ml-popover-transition),
			overlay var(--ml-popover-transition) allow-discrete,
			display var(--ml-popover-transition) allow-discrete;
	}

	.ml-popover__content:not(:popover-open) {
		display: none;
	}

	.ml-popover__content:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-popover__content:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.ml-popover__arrow {
		position: absolute;
		width: var(--ml-popover-arrow-size);
		height: var(--ml-popover-arrow-size);
		background-color: var(--ml-popover-arrow-bg);
		border: 1px solid var(--ml-popover-arrow-border-color);
		transform: rotate(45deg);
	}

	.ml-popover__content[data-placement^='top'] .ml-popover__arrow {
		border-top: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='bottom'] .ml-popover__arrow {
		border-bottom: none;
		border-right: none;
	}

	.ml-popover__content[data-placement^='left'] .ml-popover__arrow {
		border-bottom: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='right'] .ml-popover__arrow {
		border-top: none;
		border-right: none;
	}
`;
var PopoverComponent = class PopoverComponent$1 {
	constructor() {
		this.placement = "bottom";
		this.offset = 8;
		this.manual = false;
		this.arrow = false;
		this.isOpen = false;
		this._cleanupAutoUpdate = null;
		this.toggle = () => {
			const popoverEl = this.getPopoverEl();
			if (popoverEl) popoverEl.togglePopover();
		};
		this.handleToggle = (event) => {
			if (event.newState === "open") {
				this.isOpen = true;
				this.startPositioning();
			} else {
				this.isOpen = false;
				this._cleanupAutoUpdate?.();
				this._cleanupAutoUpdate = null;
			}
		};
	}
	onCreate() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.addEventListener("toggle", this.handleToggle);
	}
	onDestroy() {
		this._cleanupAutoUpdate?.();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.removeEventListener("toggle", this.handleToggle);
	}
	open() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && !this.isOpen) popoverEl.showPopover();
	}
	close() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) popoverEl.hidePopover();
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;
		const update = () => this.updatePosition(triggerEl, popoverEl);
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, popoverEl, update);
	}
	updatePosition(triggerEl, popoverEl) {
		const arrowEl = this.arrow ? this.elementRef.shadowRoot?.querySelector(".ml-popover__arrow") : null;
		const middleware = [
			offset(this.offset),
			flip(),
			shift({ padding: 8 })
		];
		if (arrowEl) middleware.push(arrow({
			element: arrowEl,
			padding: 8
		}));
		const { x, y, placement, middlewareData } = computePosition(triggerEl, popoverEl, {
			placement: this.placement,
			middleware
		});
		popoverEl.style.left = `${x}px`;
		popoverEl.style.top = `${y}px`;
		popoverEl.dataset.placement = placement;
		if (arrowEl && middlewareData.arrow) this.positionArrow(arrowEl, placement, middlewareData.arrow);
	}
	positionArrow(arrowEl, placement, arrowData) {
		const side = placement.split("-")[0];
		arrowEl.style.left = arrowData.x === void 0 ? "" : `${arrowData.x}px`;
		arrowEl.style.right = "";
		arrowEl.style.top = arrowData.y === void 0 ? "" : `${arrowData.y}px`;
		arrowEl.style.bottom = "";
		if (side === "top") arrowEl.style.bottom = "-4px";
		if (side === "bottom") arrowEl.style.top = "-4px";
		if (side === "left") arrowEl.style.right = "-4px";
		if (side === "right") arrowEl.style.left = "-4px";
	}
	getTriggerEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-popover__trigger");
	}
	getPopoverEl() {
		return this.elementRef.shadowRoot?.querySelector(".ml-popover__content");
	}
};
PopoverComponent = __decorate([MelodicComponent({
	selector: "ml-popover",
	template: popoverTemplate,
	styles: popoverStyles,
	attributes: [
		"placement",
		"offset",
		"manual",
		"arrow"
	]
})], PopoverComponent);
function appShellTemplate(c) {
	const sidebarRight = c["sidebar-position"] === "right";
	const collapsed = c["sidebar-collapsed"];
	const headerFixed = c["header-fixed"];
	const mobileOpen = c.mobileOpen;
	const isMobile = c.mobile;
	return html`
		<div
			class=${classMap({
		"ml-app-shell": true,
		"ml-app-shell--sidebar-right": sidebarRight,
		"ml-app-shell--sidebar-collapsed": collapsed,
		"ml-app-shell--header-fixed": headerFixed,
		"ml-app-shell--mobile-open": mobileOpen
	})}
		>
			${when(isMobile, () => html`
				<div
					class=${classMap({
		"ml-app-shell__backdrop": true,
		"ml-app-shell__backdrop--visible": mobileOpen
	})}
					@click=${c.closeMobileSidebar}
				></div>
			`)}

			<aside
				class=${classMap({
		"ml-app-shell__sidebar": true,
		"ml-app-shell__sidebar--mobile-open": mobileOpen
	})}
			>
				<slot name="sidebar"></slot>
			</aside>

			<div class="ml-app-shell__main">
				<header class="ml-app-shell__header">
					${when(isMobile, () => html`
						<button
							class="ml-app-shell__menu-btn"
							type="button"
							aria-label="Toggle navigation"
							@click=${c.toggleMobileSidebar}
						>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					`)}
					<slot name="header"></slot>
				</header>

				<div class="ml-app-shell__content">
					<slot></slot>
				</div>
			</div>
		</div>
	`;
}
const appShellStyles = () => css`
	:host {
		display: block;
		height: 100%;

		/* Border */
		--ml-app-shell-border-width: var(--ml-border);
		--ml-app-shell-border-color: var(--ml-color-border);

		/* Header */
		--ml-app-shell-header-bg: var(--ml-color-surface);

		/* Mobile sidebar */
		--ml-app-shell-sidebar-width: var(--ml-sidebar-width, 280px);
		--ml-app-shell-sidebar-bg: var(--ml-color-surface);
		--ml-app-shell-sidebar-transition: var(--ml-duration-200);

		/* Backdrop */
		--ml-app-shell-backdrop-bg: rgba(0, 0, 0, 0.4);
		--ml-app-shell-backdrop-transition: var(--ml-duration-200);

		/* Menu button */
		--ml-app-shell-menu-btn-size: 36px;
		--ml-app-shell-menu-btn-margin: var(--ml-space-3);
		--ml-app-shell-menu-btn-radius: var(--ml-radius);
		--ml-app-shell-menu-btn-color: var(--ml-color-text-secondary);
		--ml-app-shell-menu-btn-hover-bg: var(--ml-color-surface-secondary);
		--ml-app-shell-menu-btn-hover-color: var(--ml-color-text);
		--ml-app-shell-menu-btn-focus-color: var(--ml-color-primary);
		--ml-app-shell-menu-btn-transition: var(--ml-duration-150);

		/* Scrollbar */
		--ml-app-shell-scrollbar-width: 6px;
		--ml-app-shell-scrollbar-thumb-color: var(--ml-color-border);
		--ml-app-shell-scrollbar-thumb-radius: var(--ml-radius-full);
	}

	/* ============================================
	   SHELL GRID LAYOUT
	   ============================================ */
	.ml-app-shell {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr;
		height: 100%;
		overflow: hidden;
	}

	/* Sidebar on the right */
	.ml-app-shell--sidebar-right {
		grid-template-columns: 1fr auto;
	}

	.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
		order: 2;
		border-left: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
		border-right: none;
	}

	.ml-app-shell--sidebar-right .ml-app-shell__main {
		order: 1;
	}

	/* ============================================
	   SIDEBAR
	   ============================================ */
	.ml-app-shell__sidebar {
		grid-row: 1 / -1;
		overflow: hidden;
		border-right: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
	}

	::slotted([slot="sidebar"]) {
		height: 100%;
	}

	/* ============================================
	   MAIN AREA
	   ============================================ */
	.ml-app-shell__main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-app-shell__header {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		border-bottom: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
		background-color: var(--ml-app-shell-header-bg);
	}

	.ml-app-shell__header:empty {
		display: none;
	}

	/* Fixed/sticky header */
	.ml-app-shell--header-fixed .ml-app-shell__header {
		position: sticky;
		top: 0;
		z-index: 10;
	}

	/* ============================================
	   CONTENT
	   ============================================ */
	.ml-app-shell__content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Scrollbar styling */
	.ml-app-shell__content::-webkit-scrollbar {
		width: var(--ml-app-shell-scrollbar-width);
	}

	.ml-app-shell__content::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-app-shell__content::-webkit-scrollbar-thumb {
		background-color: var(--ml-app-shell-scrollbar-thumb-color);
		border-radius: var(--ml-app-shell-scrollbar-thumb-radius);
	}

	/* ============================================
	   MOBILE MENU BUTTON
	   ============================================ */
	.ml-app-shell__menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-app-shell-menu-btn-size);
		height: var(--ml-app-shell-menu-btn-size);
		margin-left: var(--ml-app-shell-menu-btn-margin);
		padding: 0;
		border: none;
		border-radius: var(--ml-app-shell-menu-btn-radius);
		background: transparent;
		color: var(--ml-app-shell-menu-btn-color);
		cursor: pointer;
		transition: background-color var(--ml-app-shell-menu-btn-transition) var(--ml-ease-in-out);
	}

	.ml-app-shell__menu-btn:hover {
		background-color: var(--ml-app-shell-menu-btn-hover-bg);
		color: var(--ml-app-shell-menu-btn-hover-color);
	}

	.ml-app-shell__menu-btn:focus-visible {
		outline: 2px solid var(--ml-app-shell-menu-btn-focus-color);
		outline-offset: -2px;
	}

	/* ============================================
	   MOBILE BACKDROP
	   ============================================ */
	.ml-app-shell__backdrop {
		display: none;
	}

	/* ============================================
	   RESPONSIVE: MOBILE (<768px)
	   ============================================ */
	@media (max-width: 767px) {
		.ml-app-shell {
			grid-template-columns: 1fr;
		}

		.ml-app-shell__sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 50;
			width: var(--ml-app-shell-sidebar-width);
			transform: translateX(-100%);
			transition: transform var(--ml-app-shell-sidebar-transition) var(--ml-ease-in-out);
			border-right: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
			background-color: var(--ml-app-shell-sidebar-bg);
		}

		.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
			left: auto;
			right: 0;
			transform: translateX(100%);
			border-left: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
			border-right: none;
		}

		.ml-app-shell__sidebar--mobile-open {
			transform: translateX(0);
		}

		/* Backdrop */
		.ml-app-shell__backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 40;
			background-color: var(--ml-app-shell-backdrop-bg);
			opacity: 0;
			pointer-events: none;
			transition: opacity var(--ml-app-shell-backdrop-transition) var(--ml-ease-in-out);
		}

		.ml-app-shell__backdrop--visible {
			opacity: 1;
			pointer-events: auto;
		}
	}
`;
var AppShellComponent = class AppShellComponent$1 {
	constructor() {
		this["sidebar-position"] = "left";
		this["sidebar-collapsed"] = false;
		this["header-fixed"] = false;
		this.mobile = false;
		this.mobileOpen = false;
		this._mediaQuery = null;
		this._handleMediaChange = this.onMediaChange.bind(this);
		this.toggleMobileSidebar = () => {
			this.mobileOpen = !this.mobileOpen;
		};
		this.closeMobileSidebar = () => {
			this.mobileOpen = false;
		};
	}
	onCreate() {
		this._mediaQuery = window.matchMedia("(min-width: 768px)");
		this._mediaQuery.addEventListener("change", this._handleMediaChange);
		this.mobile = !this._mediaQuery.matches;
	}
	onDestroy() {
		this._mediaQuery?.removeEventListener("change", this._handleMediaChange);
	}
	onMediaChange(event) {
		this.mobile = !event.matches;
		if (event.matches) this.mobileOpen = false;
	}
};
AppShellComponent = __decorate([MelodicComponent({
	selector: "ml-app-shell",
	template: appShellTemplate,
	styles: appShellStyles,
	attributes: [
		"sidebar-position",
		"sidebar-collapsed",
		"header-fixed"
	]
})], AppShellComponent);
function heroSectionTemplate(c) {
	const isSplit = c.variant === "split" || c.variant === "split-reverse";
	return html`
		<section
			class=${classMap({
		"ml-hero": true,
		[`ml-hero--${c.variant}`]: true,
		[`ml-hero--${c.size}`]: true,
		[`ml-hero--bg-${c.background}`]: c.background !== "none"
	})}
		>
			<div class="ml-hero__container">
				<div class="ml-hero__content">
					<slot name="eyebrow">
						${when(false, () => html``)}
					</slot>

					<slot name="title">
						${when(!!c.title, () => html`
							<h1 class="ml-hero__title">${c.title}</h1>
						`)}
					</slot>

					<slot name="description">
						${when(!!c.description, () => html`
							<p class="ml-hero__description">${c.description}</p>
						`)}
					</slot>

					<div class="ml-hero__actions">
						<slot name="actions"></slot>
					</div>

					${when(!isSplit, () => html`
						<div class="ml-hero__social-proof">
							<slot name="social-proof"></slot>
						</div>
					`)}
				</div>

				${when(isSplit, () => html`
					<div class="ml-hero__media">
						<slot name="media"></slot>
					</div>
				`)}

				${when(!isSplit, () => html`
					<div class="ml-hero__media ml-hero__media--below">
						<slot name="media"></slot>
					</div>
				`)}
			</div>

			${when(isSplit, () => html`
				<div class="ml-hero__social-proof">
					<slot name="social-proof"></slot>
				</div>
			`)}
		</section>
	`;
}
const heroSectionStyles = () => css`
	:host {
		display: block;
		width: 100%;

		/* Font */
		--ml-hero-font-family: var(--ml-font-sans);

		/* Size: sm */
		--ml-hero-sm-padding: var(--ml-space-12) var(--ml-space-6);
		--ml-hero-sm-title-size: var(--ml-text-3xl);
		--ml-hero-sm-description-size: var(--ml-text-base);

		/* Size: md */
		--ml-hero-md-padding: var(--ml-space-20) var(--ml-space-6);
		--ml-hero-md-title-size: var(--ml-text-4xl);
		--ml-hero-md-description-size: var(--ml-text-lg);

		/* Size: lg */
		--ml-hero-lg-padding: calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6);
		--ml-hero-lg-title-size: var(--ml-text-5xl);
		--ml-hero-lg-description-size: var(--ml-text-xl);

		/* Background variants */
		--ml-hero-bg-subtle: var(--ml-color-surface-secondary);
		--ml-hero-bg-gradient: linear-gradient(
			135deg,
			var(--ml-color-primary-subtle) 0%,
			var(--ml-color-surface) 50%,
			var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100%
		);

		/* Container */
		--ml-hero-container-max-width: var(--ml-container-xl, 1280px);
		--ml-hero-content-max-width: 800px;
		--ml-hero-split-gap: var(--ml-space-12);

		/* Eyebrow */
		--ml-hero-eyebrow-margin-bottom: var(--ml-space-4);
		--ml-hero-eyebrow-font-size: var(--ml-text-sm);
		--ml-hero-eyebrow-font-weight: var(--ml-font-semibold);
		--ml-hero-eyebrow-color: var(--ml-color-primary);
		--ml-hero-eyebrow-letter-spacing: 0.05em;

		/* Title */
		--ml-hero-title-margin-bottom: var(--ml-space-4);
		--ml-hero-title-font-weight: var(--ml-font-bold);
		--ml-hero-title-color: var(--ml-color-text);
		--ml-hero-title-letter-spacing: -0.025em;
		--ml-hero-title-line-height: var(--ml-leading-tight);

		/* Description */
		--ml-hero-description-margin-bottom: var(--ml-space-8);
		--ml-hero-description-color: var(--ml-color-text-secondary);
		--ml-hero-description-line-height: var(--ml-leading-relaxed);
		--ml-hero-description-max-width: 640px;

		/* Actions */
		--ml-hero-actions-gap: var(--ml-space-3);

		/* Media */
		--ml-hero-media-radius: var(--ml-radius-lg);
		--ml-hero-media-below-margin: var(--ml-space-10);

		/* Social proof */
		--ml-hero-social-proof-margin: var(--ml-space-10);
	}

	/* ============================================
	   HERO CONTAINER
	   ============================================ */
	.ml-hero {
		position: relative;
		width: 100%;
		font-family: var(--ml-hero-font-family);
	}

	/* ============================================
	   SIZE VARIANTS (padding & font sizes)
	   ============================================ */
	.ml-hero--sm {
		padding: var(--ml-hero-sm-padding);
	}

	.ml-hero--md {
		padding: var(--ml-hero-md-padding);
	}

	.ml-hero--lg {
		padding: var(--ml-hero-lg-padding);
	}

	.ml-hero--sm .ml-hero__title,
	.ml-hero--sm ::slotted([slot="title"]) {
		font-size: var(--ml-hero-sm-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--md .ml-hero__title,
	.ml-hero--md ::slotted([slot="title"]) {
		font-size: var(--ml-hero-md-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--lg .ml-hero__title,
	.ml-hero--lg ::slotted([slot="title"]) {
		font-size: var(--ml-hero-lg-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--sm .ml-hero__description,
	.ml-hero--sm ::slotted([slot="description"]) {
		font-size: var(--ml-hero-sm-description-size);
	}

	.ml-hero--md .ml-hero__description,
	.ml-hero--md ::slotted([slot="description"]) {
		font-size: var(--ml-hero-md-description-size);
	}

	.ml-hero--lg .ml-hero__description,
	.ml-hero--lg ::slotted([slot="description"]) {
		font-size: var(--ml-hero-lg-description-size);
	}

	/* ============================================
	   BACKGROUND VARIANTS
	   ============================================ */
	.ml-hero--bg-subtle {
		background-color: var(--ml-hero-bg-subtle);
	}

	.ml-hero--bg-gradient {
		background: var(--ml-hero-bg-gradient);
	}

	/* ============================================
	   LAYOUT: CONTAINER
	   ============================================ */
	.ml-hero__container {
		max-width: var(--ml-hero-container-max-width);
		margin: 0 auto;
		width: 100%;
	}

	/* ============================================
	   LAYOUT: CENTERED
	   ============================================ */
	.ml-hero--centered .ml-hero__container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.ml-hero--centered .ml-hero__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: var(--ml-hero-content-max-width);
	}

	.ml-hero--centered .ml-hero__media--below {
		margin-top: var(--ml-hero-media-below-margin);
		width: 100%;
		display: flex;
		justify-content: center;
	}

	/* ============================================
	   LAYOUT: SPLIT
	   ============================================ */
	.ml-hero--split .ml-hero__container,
	.ml-hero--split-reverse .ml-hero__container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--ml-hero-split-gap);
		align-items: center;
	}

	.ml-hero--split-reverse .ml-hero__content {
		order: 2;
	}

	.ml-hero--split-reverse .ml-hero__media {
		order: 1;
	}

	.ml-hero--split .ml-hero__content,
	.ml-hero--split-reverse .ml-hero__content {
		display: flex;
		flex-direction: column;
	}

	/* ============================================
	   CONTENT ELEMENTS
	   ============================================ */

	/* Eyebrow */
	::slotted([slot="eyebrow"]) {
		display: inline-block;
		margin-bottom: var(--ml-hero-eyebrow-margin-bottom);
		font-size: var(--ml-hero-eyebrow-font-size);
		font-weight: var(--ml-hero-eyebrow-font-weight);
		color: var(--ml-hero-eyebrow-color);
		text-transform: uppercase;
		letter-spacing: var(--ml-hero-eyebrow-letter-spacing);
	}

	/* Title */
	.ml-hero__title,
	::slotted([slot="title"]) {
		margin: 0 0 var(--ml-hero-title-margin-bottom) 0;
		font-weight: var(--ml-hero-title-font-weight);
		color: var(--ml-hero-title-color);
		letter-spacing: var(--ml-hero-title-letter-spacing);
	}

	/* Description */
	.ml-hero__description,
	::slotted([slot="description"]) {
		margin: 0 0 var(--ml-hero-description-margin-bottom) 0;
		color: var(--ml-hero-description-color);
		line-height: var(--ml-hero-description-line-height);
		max-width: var(--ml-hero-description-max-width);
	}

	/* Actions */
	.ml-hero__actions {
		display: flex;
		gap: var(--ml-hero-actions-gap);
		flex-wrap: wrap;
	}

	.ml-hero--centered .ml-hero__actions {
		justify-content: center;
	}

	.ml-hero__actions:empty {
		display: none;
	}

	/* Media */
	.ml-hero__media {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-hero__media:empty {
		display: none;
	}

	::slotted([slot="media"]) {
		max-width: 100%;
		height: auto;
		border-radius: var(--ml-hero-media-radius);
	}

	/* Social proof */
	.ml-hero__social-proof {
		margin-top: var(--ml-hero-social-proof-margin);
		width: 100%;
	}

	.ml-hero--centered .ml-hero__social-proof {
		text-align: center;
	}

	.ml-hero__social-proof:empty {
		display: none;
	}

	/* ============================================
	   RESPONSIVE: collapse split to stacked
	   ============================================ */
	@media (max-width: 768px) {
		.ml-hero--split .ml-hero__container,
		.ml-hero--split-reverse .ml-hero__container {
			grid-template-columns: 1fr;
		}

		.ml-hero--split .ml-hero__content,
		.ml-hero--split-reverse .ml-hero__content {
			order: 1;
			text-align: center;
			align-items: center;
		}

		.ml-hero--split .ml-hero__media,
		.ml-hero--split-reverse .ml-hero__media {
			order: 2;
		}

		.ml-hero--split .ml-hero__actions,
		.ml-hero--split-reverse .ml-hero__actions {
			justify-content: center;
		}

		.ml-hero--lg {
			padding: var(--ml-space-16) var(--ml-space-4);
		}

		.ml-hero--md {
			padding: var(--ml-space-12) var(--ml-space-4);
		}

		.ml-hero--sm {
			padding: var(--ml-space-8) var(--ml-space-4);
		}

		.ml-hero--lg .ml-hero__title,
		.ml-hero--lg ::slotted([slot="title"]) {
			font-size: var(--ml-text-3xl);
		}

		.ml-hero--md .ml-hero__title,
		.ml-hero--md ::slotted([slot="title"]) {
			font-size: var(--ml-text-2xl);
		}
	}
`;
var HeroSectionComponent = class HeroSectionComponent$1 {
	constructor() {
		this.variant = "centered";
		this.size = "lg";
		this.background = "none";
		this.title = "";
		this.description = "";
	}
};
HeroSectionComponent = __decorate([MelodicComponent({
	selector: "ml-hero-section",
	template: heroSectionTemplate,
	styles: heroSectionStyles,
	attributes: [
		"variant",
		"size",
		"background",
		"title",
		"description"
	]
})], HeroSectionComponent);
function pageHeaderTemplate(c) {
	const hasTitle = !!(c.title || c.hasTitleSlot);
	const hasDescription = !!(c.description || c.hasDescriptionSlot);
	return html`
		<header
			class=${classMap({
		"ml-page-header": true,
		[`ml-page-header--${c.variant}`]: true,
		"ml-page-header--divider": c.divider
	})}
		>
			${when(c.hasBreadcrumb, () => html`
				<div class="ml-page-header__breadcrumb">
					<slot name="breadcrumb"></slot>
				</div>
			`)}

			<div class="ml-page-header__main">
				<div class="ml-page-header__content">
					${when(hasTitle, () => html`
						<div class="ml-page-header__title">
							${when(c.hasTitleSlot, () => html`<slot name="title"></slot>`, () => html`<h1>${c.title}</h1>`)}
						</div>
					`)}

					${when(hasDescription, () => html`
						<div class="ml-page-header__description">
							${when(c.hasDescriptionSlot, () => html`<slot name="description"></slot>`, () => html`<p>${c.description}</p>`)}
						</div>
					`)}

					${when(c.hasMeta, () => html`
						<div class="ml-page-header__meta">
							<slot name="meta"></slot>
						</div>
					`)}
				</div>

				${when(c.hasActions, () => html`
					<div class="ml-page-header__actions">
						<slot name="actions"></slot>
					</div>
				`)}
			</div>

			${when(c.hasTabs, () => html`
				<div class="ml-page-header__tabs">
					<slot name="tabs"></slot>
				</div>
			`)}
		</header>
	`;
}
const pageHeaderStyles = () => css`
	:host {
		display: block;

		/* Padding */
		--ml-page-header-padding: var(--ml-space-6) var(--ml-space-6) var(--ml-space-4);
		--ml-page-header-compact-padding: var(--ml-space-4) var(--ml-space-6) var(--ml-space-3);
		--ml-page-header-mobile-padding: var(--ml-space-4);

		/* Font */
		--ml-page-header-font-family: var(--ml-font-sans);
		--ml-page-header-color: var(--ml-color-text);

		/* Border */
		--ml-page-header-border-width: var(--ml-border);
		--ml-page-header-border-color: var(--ml-color-border);

		/* Title */
		--ml-page-header-title-size: var(--ml-text-2xl);
		--ml-page-header-title-weight: var(--ml-font-semibold);
		--ml-page-header-title-line-height: var(--ml-leading-tight);
		--ml-page-header-title-color: var(--ml-color-text);
		--ml-page-header-compact-title-size: var(--ml-text-lg);

		/* Description */
		--ml-page-header-description-size: var(--ml-text-sm);
		--ml-page-header-description-line-height: var(--ml-leading-normal);
		--ml-page-header-description-color: var(--ml-color-text-secondary);

		/* Spacing */
		--ml-page-header-breadcrumb-margin: var(--ml-space-3);
		--ml-page-header-main-gap: var(--ml-space-4);
		--ml-page-header-content-gap: var(--ml-space-1);
		--ml-page-header-meta-gap: var(--ml-space-2);
		--ml-page-header-meta-margin: var(--ml-space-2);
		--ml-page-header-actions-gap: var(--ml-space-2);
		--ml-page-header-centered-actions-margin: var(--ml-space-4);
		--ml-page-header-tabs-margin: var(--ml-space-4);
	}

	/* ============================================
	   PAGE HEADER CONTAINER
	   ============================================ */
	.ml-page-header {
		padding: var(--ml-page-header-padding);
		font-family: var(--ml-page-header-font-family);
		color: var(--ml-page-header-color);
	}

	.ml-page-header--divider {
		border-bottom: var(--ml-page-header-border-width) solid var(--ml-page-header-border-color);
	}

	/* ============================================
	   COMPACT VARIANT
	   ============================================ */
	.ml-page-header--compact {
		padding: var(--ml-page-header-compact-padding);
	}

	.ml-page-header--compact .ml-page-header__title h1 {
		font-size: var(--ml-page-header-compact-title-size);
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-page-header--centered {
		text-align: center;
	}

	.ml-page-header--centered .ml-page-header__main {
		flex-direction: column;
		align-items: center;
	}

	.ml-page-header--centered .ml-page-header__content {
		align-items: center;
	}

	.ml-page-header--centered .ml-page-header__actions {
		margin-top: var(--ml-page-header-centered-actions-margin);
	}

	.ml-page-header--centered .ml-page-header__breadcrumb {
		justify-content: center;
	}

	/* ============================================
	   BREADCRUMB
	   ============================================ */
	.ml-page-header__breadcrumb {
		display: flex;
		margin-bottom: var(--ml-page-header-breadcrumb-margin);
	}

	/* ============================================
	   MAIN (title row + actions)
	   ============================================ */
	.ml-page-header__main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-page-header-main-gap);
	}

	/* ============================================
	   CONTENT (title + description + meta)
	   ============================================ */
	.ml-page-header__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-page-header-content-gap);
		min-width: 0;
		flex: 1;
	}

	/* ============================================
	   TITLE
	   ============================================ */
	.ml-page-header__title h1 {
		margin: 0;
		font-size: var(--ml-page-header-title-size);
		font-weight: var(--ml-page-header-title-weight);
		line-height: var(--ml-page-header-title-line-height);
		color: var(--ml-page-header-title-color);
	}

	.ml-page-header__title ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-title-size);
		font-weight: var(--ml-page-header-title-weight);
		line-height: var(--ml-page-header-title-line-height);
		color: var(--ml-page-header-title-color);
	}

	/* ============================================
	   DESCRIPTION
	   ============================================ */
	.ml-page-header__description p {
		margin: 0;
		font-size: var(--ml-page-header-description-size);
		line-height: var(--ml-page-header-description-line-height);
		color: var(--ml-page-header-description-color);
	}

	.ml-page-header__description ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-description-size);
		line-height: var(--ml-page-header-description-line-height);
		color: var(--ml-page-header-description-color);
	}

	/* ============================================
	   META
	   ============================================ */
	.ml-page-header__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-meta-gap);
		margin-top: var(--ml-page-header-meta-margin);
	}

	/* ============================================
	   ACTIONS
	   ============================================ */
	.ml-page-header__actions {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-actions-gap);
		flex-shrink: 0;
	}

	/* ============================================
	   TABS
	   ============================================ */
	.ml-page-header__tabs {
		margin-top: var(--ml-page-header-tabs-margin);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 640px) {
		.ml-page-header {
			padding: var(--ml-page-header-mobile-padding);
		}

		.ml-page-header__main {
			flex-direction: column;
		}

		.ml-page-header__actions {
			width: 100%;
		}

		.ml-page-header__actions ::slotted(*) {
			flex: 1;
		}
	}
`;
var PageHeaderComponent = class PageHeaderComponent$1 {
	constructor() {
		this.title = "";
		this.description = "";
		this.variant = "default";
		this.divider = true;
	}
	get hasBreadcrumb() {
		return this.elementRef?.querySelector("[slot=\"breadcrumb\"]") !== null;
	}
	get hasTitleSlot() {
		return this.elementRef?.querySelector("[slot=\"title\"]") !== null;
	}
	get hasDescriptionSlot() {
		return this.elementRef?.querySelector("[slot=\"description\"]") !== null;
	}
	get hasActions() {
		return this.elementRef?.querySelector("[slot=\"actions\"]") !== null;
	}
	get hasTabs() {
		return this.elementRef?.querySelector("[slot=\"tabs\"]") !== null;
	}
	get hasMeta() {
		return this.elementRef?.querySelector("[slot=\"meta\"]") !== null;
	}
};
PageHeaderComponent = __decorate([MelodicComponent({
	selector: "ml-page-header",
	template: pageHeaderTemplate,
	styles: pageHeaderStyles,
	attributes: [
		"variant",
		"divider",
		"title",
		"description"
	]
})], PageHeaderComponent);
function loginPageTemplate(c) {
	const isSplit = c.variant === "split";
	const cardContent = html`
		<div class="ml-auth__logo">
			<slot name="logo"></slot>
		</div>

		${when(c.hasHeaderSlot, () => html`
				<div class="ml-auth__header">
					<slot name="header"></slot>
				</div>
			`, () => html`
				<div class="ml-auth__header">
					<h1 class="ml-auth__title">${c.title}</h1>
					<p class="ml-auth__description">${c.description}</p>
				</div>
			`)}

		<div class="ml-auth__social">
			<slot name="social"></slot>
		</div>

		<div class="ml-auth__form">
			<slot name="form"></slot>
		</div>

		<div class="ml-auth__footer">
			<slot name="footer"></slot>
		</div>
	`;
	return html`
		<div class=${classMap({
		"ml-auth": true,
		"ml-auth--centered": !isSplit,
		"ml-auth--split": isSplit
	})}>
			${when(isSplit, () => html`
					<div class="ml-auth__form-side">
						<div class="ml-auth__card">
							${cardContent}
						</div>
					</div>
					<div class="ml-auth__brand-side">
						<div class="ml-auth__brand-content">
							<slot name="brand"></slot>
						</div>
					</div>
				`, () => html`
					<div class="ml-auth__card">
						${cardContent}
					</div>
				`)}
		</div>
	`;
}
const authLayoutCss = `
	/* ============================================
	   AUTH LAYOUT - SHARED STYLES
	   ============================================ */
	:host {
		display: block;
		width: 100%;
		height: 100%;

		/* Background */
		--ml-auth-bg: var(--ml-color-surface-secondary);

		/* Font */
		--ml-auth-font-family: var(--ml-font-sans);

		/* Card */
		--ml-auth-card-max-width: 440px;
		--ml-auth-card-bg: var(--ml-color-surface);
		--ml-auth-card-border-width: var(--ml-border);
		--ml-auth-card-border-color: var(--ml-color-border);
		--ml-auth-card-radius: var(--ml-radius-xl);
		--ml-auth-card-shadow: var(--ml-shadow-lg);
		--ml-auth-card-padding: var(--ml-space-10);

		/* Centered variant */
		--ml-auth-centered-padding: var(--ml-space-6);

		/* Split variant */
		--ml-auth-split-padding: var(--ml-space-10);
		--ml-auth-split-form-padding: var(--ml-auth-split-padding);
		--ml-auth-split-brand-padding: var(--ml-auth-split-padding);
		--ml-auth-split-form-bg: var(--ml-color-surface);
		--ml-auth-split-brand-bg: var(--ml-color-primary);
		--ml-auth-split-brand-color: var(--ml-color-text-inverse);
		--ml-auth-split-brand-max-width: 480px;

		/* Logo */
		--ml-auth-logo-margin: var(--ml-space-6);

		/* Header */
		--ml-auth-header-margin: var(--ml-space-8);
		--ml-auth-title-size: var(--ml-text-2xl);
		--ml-auth-title-weight: var(--ml-font-bold);
		--ml-auth-title-color: var(--ml-color-text);
		--ml-auth-title-line-height: var(--ml-leading-tight);
		--ml-auth-title-margin: var(--ml-space-2);
		--ml-auth-description-size: var(--ml-text-sm);
		--ml-auth-description-color: var(--ml-color-text-muted);
		--ml-auth-description-line-height: var(--ml-leading-normal);

		/* Form / Social / Footer spacing */
		--ml-auth-form-margin: var(--ml-space-6);
		--ml-auth-social-margin: var(--ml-space-6);
		--ml-auth-footer-size: var(--ml-text-sm);
		--ml-auth-footer-color: var(--ml-color-text-muted);

		/* Mobile */
		--ml-auth-mobile-padding: var(--ml-space-6);
	}

	/* ============================================
	   BASE WRAPPER
	   ============================================ */
	.ml-auth {
		display: flex;
		min-height: 100%;
		height: 100%;
		font-family: var(--ml-auth-font-family);
		background-color: var(--ml-auth-bg);
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-auth--centered {
		align-items: center;
		justify-content: center;
		padding: var(--ml-auth-centered-padding);
	}

	.ml-auth--centered .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width);
		background-color: var(--ml-auth-card-bg);
		border: var(--ml-auth-card-border-width) solid var(--ml-auth-card-border-color);
		border-radius: var(--ml-auth-card-radius);
		box-shadow: var(--ml-auth-card-shadow);
		padding: var(--ml-auth-card-padding);
	}

	/* ============================================
	   SPLIT VARIANT
	   ============================================ */
	.ml-auth--split {
		flex-direction: row;
	}

	.ml-auth--split .ml-auth__form-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-auth-split-form-padding);
		background-color: var(--ml-auth-split-form-bg);
	}

	.ml-auth--split .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width);
	}

	.ml-auth--split .ml-auth__brand-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-auth-split-brand-padding);
		background-color: var(--ml-auth-split-brand-bg);
		color: var(--ml-auth-split-brand-color);
		position: relative;
		overflow: hidden;
	}

	.ml-auth__brand-content {
		position: relative;
		z-index: 1;
		text-align: center;
		width: 100%;
		height: 100%;
		max-width: var(--ml-auth-split-brand-max-width);
	}

	.ml-auth__brand-content ::slotted(*) {
		color: inherit;
	}

	/* ============================================
	   LOGO AREA
	   ============================================ */
	.ml-auth__logo {
		display: flex;
		justify-content: center;
		margin-bottom: var(--ml-auth-logo-margin);
	}

	.ml-auth__logo:empty {
		display: none;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-auth__header {
		text-align: center;
		margin-bottom: var(--ml-auth-header-margin);
	}

	.ml-auth__title {
		margin: 0 0 var(--ml-auth-title-margin) 0;
		font-size: var(--ml-auth-title-size);
		font-weight: var(--ml-auth-title-weight);
		color: var(--ml-auth-title-color);
		line-height: var(--ml-auth-title-line-height);
	}

	.ml-auth__description {
		margin: 0;
		font-size: var(--ml-auth-description-size);
		color: var(--ml-auth-description-color);
		line-height: var(--ml-auth-description-line-height);
	}

	/* ============================================
	   FORM AREA
	   ============================================ */
	.ml-auth__form {
		margin-bottom: var(--ml-auth-form-margin);
	}

	.ml-auth__form:empty {
		display: none;
	}

	/* ============================================
	   SOCIAL LOGIN
	   ============================================ */
	.ml-auth__social {
		margin-bottom: var(--ml-auth-social-margin);
	}

	.ml-auth__social:empty {
		display: none;
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-auth__footer {
		text-align: center;
		font-size: var(--ml-auth-footer-size);
		color: var(--ml-auth-footer-color);
	}

	.ml-auth__footer:empty {
		display: none;
	}

	/* ============================================
	   RESPONSIVE - SPLIT COLLAPSE
	   ============================================ */
	@media (max-width: 768px) {
		.ml-auth--split {
			flex-direction: column;
		}

		.ml-auth--split .ml-auth__brand-side {
			display: none;
		}

		.ml-auth--split .ml-auth__form-side {
			min-height: 100%;
			padding: var(--ml-auth-mobile-padding);
		}
	}
`;
const loginPageStyles = () => css`
	${authLayoutCss}
`;
var LoginPageComponent = class LoginPageComponent$1 {
	constructor() {
		this.variant = "centered";
		this.title = "Log in to your account";
		this.description = "Welcome back! Please enter your details.";
	}
	get hasHeaderSlot() {
		return this.elementRef?.querySelector("[slot=\"header\"]") !== null;
	}
	get hasBrandSlot() {
		return this.elementRef?.querySelector("[slot=\"brand\"]") !== null;
	}
};
LoginPageComponent = __decorate([MelodicComponent({
	selector: "ml-login-page",
	template: loginPageTemplate,
	styles: loginPageStyles,
	attributes: [
		"variant",
		"title",
		"description"
	]
})], LoginPageComponent);
function signupPageTemplate(c) {
	const isSplit = c.variant === "split";
	const cardContent = html`
		<div class="ml-auth__logo">
			<slot name="logo"></slot>
		</div>

		${when(c.hasHeaderSlot, () => html`
				<div class="ml-auth__header">
					<slot name="header"></slot>
				</div>
			`, () => html`
				<div class="ml-auth__header">
					<h1 class="ml-auth__title">${c.title}</h1>
					<p class="ml-auth__description">${c.description}</p>
				</div>
			`)}

		<div class="ml-auth__social">
			<slot name="social"></slot>
		</div>

		<div class="ml-auth__form">
			<slot name="form"></slot>
		</div>

		<div class="ml-auth__footer">
			<slot name="footer"></slot>
		</div>
	`;
	return html`
		<div class=${classMap({
		"ml-auth": true,
		"ml-auth--centered": !isSplit,
		"ml-auth--split": isSplit
	})}>
			${when(isSplit, () => html`
					<div class="ml-auth__form-side">
						<div class="ml-auth__card">
							${cardContent}
						</div>
					</div>
					<div class="ml-auth__brand-side">
						<div class="ml-auth__brand-content">
							<slot name="brand"></slot>
						</div>
					</div>
				`, () => html`
					<div class="ml-auth__card">
						${cardContent}
					</div>
				`)}
		</div>
	`;
}
const signupPageStyles = () => css`
	${authLayoutCss}
`;
var SignupPageComponent = class SignupPageComponent$1 {
	constructor() {
		this.variant = "centered";
		this.title = "Create an account";
		this.description = "Start your journey today.";
	}
	get hasHeaderSlot() {
		return this.elementRef?.querySelector("[slot=\"header\"]") !== null;
	}
	get hasBrandSlot() {
		return this.elementRef?.querySelector("[slot=\"brand\"]") !== null;
	}
};
SignupPageComponent = __decorate([MelodicComponent({
	selector: "ml-signup-page",
	template: signupPageTemplate,
	styles: signupPageStyles,
	attributes: [
		"variant",
		"title",
		"description"
	]
})], SignupPageComponent);
function dashboardPageTemplate(c) {
	const showAside = c.layout === "default" && c.hasAside;
	return html`
		<ml-app-shell>
			<slot name="sidebar" slot="sidebar"></slot>

			<ml-page-header
				slot="header"
				title=${c.title}
				description=${c.description}
			>
				${when(c.hasHeaderActions, () => html`
					<slot name="header-actions" slot="actions"></slot>
				`)}
			</ml-page-header>

			<div
				class=${classMap({
		"ml-dashboard": true,
		[`ml-dashboard--${c.layout}`]: true
	})}
			>
				${when(c.hasMetrics, () => html`
					<div class="ml-dashboard__metrics">
						<slot name="metrics"></slot>
					</div>
				`)}

				<div class="ml-dashboard__body">
					<div class="ml-dashboard__main">
						<slot name="main"></slot>
					</div>

					${when(showAside, () => html`
						<div class="ml-dashboard__aside">
							<slot name="aside"></slot>
						</div>
					`)}
				</div>
			</div>
		</ml-app-shell>
	`;
}
const dashboardPageStyles = () => css`
	:host {
		display: block;
		height: 100%;

		/* Font */
		--ml-dashboard-font-family: var(--ml-font-sans);

		/* Padding */
		--ml-dashboard-padding: var(--ml-space-6);
		--ml-dashboard-mobile-padding: var(--ml-space-4);

		/* Metrics grid */
		--ml-dashboard-metrics-min-width: 200px;
		--ml-dashboard-metrics-gap: var(--ml-space-4);
		--ml-dashboard-metrics-margin: var(--ml-space-6);
		--ml-dashboard-metrics-mobile-gap: var(--ml-space-3);
		--ml-dashboard-metrics-mobile-margin: var(--ml-space-4);

		/* Body grid */
		--ml-dashboard-body-gap: var(--ml-space-6);
		--ml-dashboard-body-mobile-gap: var(--ml-space-4);

		/* Main & aside */
		--ml-dashboard-main-gap: var(--ml-space-6);
		--ml-dashboard-aside-gap: var(--ml-space-6);
	}

	/* ============================================
	   DASHBOARD CONTENT AREA
	   ============================================ */
	.ml-dashboard {
		padding: var(--ml-dashboard-padding);
		font-family: var(--ml-dashboard-font-family);
	}

	/* ============================================
	   METRICS ROW
	   ============================================ */
	.ml-dashboard__metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--ml-dashboard-metrics-min-width), 1fr));
		gap: var(--ml-dashboard-metrics-gap);
		margin-bottom: var(--ml-dashboard-metrics-margin);
	}

	/* ============================================
	   BODY (MAIN + ASIDE GRID)
	   ============================================ */
	.ml-dashboard__body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--ml-dashboard-body-gap);
	}

	/* Default layout: 2/3 main + 1/3 aside */
	.ml-dashboard--default .ml-dashboard__body {
		grid-template-columns: 2fr 1fr;
	}

	/* Wide layout: full-width main, aside below */
	.ml-dashboard--wide .ml-dashboard__body {
		grid-template-columns: 1fr;
	}

	/* Full layout: main only, no aside */
	.ml-dashboard--full .ml-dashboard__body {
		grid-template-columns: 1fr;
	}

	/* ============================================
	   MAIN CONTENT
	   ============================================ */
	.ml-dashboard__main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-dashboard-main-gap);
	}

	/* ============================================
	   ASIDE
	   ============================================ */
	.ml-dashboard__aside {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-dashboard-aside-gap);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 1024px) {
		.ml-dashboard--default .ml-dashboard__body {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.ml-dashboard {
			padding: var(--ml-dashboard-mobile-padding);
		}

		.ml-dashboard__metrics {
			grid-template-columns: 1fr;
			gap: var(--ml-dashboard-metrics-mobile-gap);
			margin-bottom: var(--ml-dashboard-metrics-mobile-margin);
		}

		.ml-dashboard__body {
			gap: var(--ml-dashboard-body-mobile-gap);
		}
	}
`;
var DashboardPageComponent = class DashboardPageComponent$1 {
	constructor() {
		this.title = "";
		this.description = "";
		this.layout = "default";
	}
	get hasMetrics() {
		return this.elementRef?.querySelector("[slot=\"metrics\"]") !== null;
	}
	get hasAside() {
		return this.elementRef?.querySelector("[slot=\"aside\"]") !== null;
	}
	get hasHeaderActions() {
		return this.elementRef?.querySelector("[slot=\"header-actions\"]") !== null;
	}
};
DashboardPageComponent = __decorate([MelodicComponent({
	selector: "ml-dashboard-page",
	template: dashboardPageTemplate,
	styles: dashboardPageStyles,
	attributes: [
		"title",
		"description",
		"layout"
	]
})], DashboardPageComponent);
export { APP_CONFIG, AbortError, ActivityFeedComponent, ActivityFeedItemComponent, AlertComponent, AppShellComponent, AvatarComponent, BadgeComponent, BadgeGroupComponent, Binding, BreadcrumbComponent, BreadcrumbItemComponent, ButtonComponent, ButtonGroupComponent, ButtonGroupItemComponent, CalendarComponent, CalendarViewComponent, CardComponent, CheckboxComponent, ComponentBase, ComponentStateBaseService, ContainerComponent, DashboardPageComponent, DatePickerComponent, DialogComponent, DialogRef, DialogService, Directive, DividerComponent, DrawerComponent, DropdownComponent, DropdownGroupComponent, DropdownItemComponent, DropdownSeparatorComponent, EffectsBase, FORM_CONTROL_MARKER, FORM_GROUP_MARKER, FormControl, FormFieldComponent, FormGroup, HeroSectionComponent, HttpBaseError, HttpClient, HttpError, IconComponent, Inject, Injectable, InjectionEngine, Injector, InputComponent, ListComponent, ListItemComponent, LoginPageComponent, MelodicComponent, NetworkError, PageHeaderComponent, PaginationComponent, PopoverComponent, ProgressComponent, ROUTE_CONTEXT_EVENT, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_INIT_STATE, RX_STATE_DEBUG, RadioCardComponent, RadioCardGroupComponent, RadioComponent, RadioGroupComponent, RouteContextEvent, RouteContextService, RouteMatcher, RouterLinkComponent, RouterOutletComponent, RouterService, SIGNAL_MARKER, SelectComponent, Service, SidebarComponent, SidebarGroupComponent, SidebarItemComponent, SignalEffect, SignalStoreService, SignupPageComponent, SliderComponent, SpinnerComponent, StackComponent, StepComponent, StepPanelComponent, StepsComponent, TabComponent, TabPanelComponent, TableComponent, TabsComponent, TagComponent, TemplateResult, TextareaComponent, ToastComponent, ToastContainerComponent, ToastService, ToggleComponent, TooltipComponent, Validators, VirtualScroller, activityFeedItemStyles, activityFeedItemTemplate, activityFeedStyles, activityFeedTemplate, allTokens, announce, appShellStyles, appShellTemplate, applyGlobalStyles, applyTheme, arrow, autoUpdate, baseThemeCss, bootstrap, borderTokens, breadcrumbItemStyles, breadcrumbItemTemplate, breadcrumbStyles, breadcrumbTemplate, breakpointTokens, breakpoints, buildPathFromRoute, calendarViewStyles, calendarViewTemplate, classMap, clickOutside, colorTokens, componentBaseStyles, computePosition, computed, containerStyles, containerTemplate, createAction, createAsyncValidator, createBrandTheme, createDeactivateGuard, createFocusTrap, createFormControl, createFormGroup, createGuard, createLiveRegion, createReducer, createResolver, createState, createTheme, createToken, createValidator, css, darkTheme, darkThemeCss, dashboardPageStyles, dashboardPageTemplate, defineConfig, directive, drawerStyles, drawerTemplate, dropdownGroupStyles, dropdownGroupTemplate, dropdownItemStyles, dropdownItemTemplate, dropdownSeparatorStyles, dropdownSeparatorTemplate, dropdownStyles, dropdownTemplate, environment, findRouteByName, flip, focusFirst, focusLast, focusTrap, focusVisible, formControlDirective, formFieldStyles, formFieldTemplate, getActiveEffect, getAttributeDirective, getEnvironment, getFirstFocusable, getFocusableElements, getLastFocusable, getRegisteredDirectives, getResolvedTheme, getTheme, getTokenKey, hasAttributeDirective, heroSectionStyles, heroSectionTemplate, html, injectTheme, isDirective, isFocusVisible, isSignal, lightTheme, lightThemeCss, listItemStyles, listItemTemplate, listStyles, listTemplate, loginPageStyles, loginPageTemplate, matchRouteTree, newID, offset, onAction, onThemeChange, pageHeaderStyles, pageHeaderTemplate, paginationStyles, paginationTemplate, portalDirective, primitiveColors, progressStyles, progressTemplate, props, provideConfig, provideHttp, provideRX, registerAttributeDirective, render, repeat, repeatRaw, resetStyles, routerLinkDirective, selectStyles, selectTemplate, setActiveEffect, shadowTokens, shift, sidebarGroupStyles, sidebarGroupTemplate, sidebarItemStyles, sidebarItemTemplate, sidebarStyles, sidebarTemplate, signal, signupPageStyles, signupPageTemplate, sliderStyles, sliderTemplate, spacingTokens, stepPanelStyles, stepPanelTemplate, stepStyles, stepTemplate, stepsStyles, stepsTemplate, styleMap, tabPanelStyles, tabPanelTemplate, tabStyles, tabTemplate, tableStyles, tableTemplate, tabsStyles, tabsTemplate, toastContainerStyles, toastContainerTemplate, toastStyles, toastTemplate, toggleTheme, tokensToCss, tooltipDirective, transitionTokens, typographyTokens, unregisterAttributeDirective, unsafeHTML, visuallyHiddenStyles, when };

//# sourceMappingURL=melodic-components.js.map