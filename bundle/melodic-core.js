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
			const match = /([@.:]?[\w:-]+)\s*=\s*["']?$/.exec(html$1);
			const quotedAttrMatch = /([@.:]?[\w:-]+)\s*=\s*(["'])([^"']*)$/.exec(html$1);
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
		this.clearRenderedNodes(part);
		part.node.textContent = "";
		const fragment = document.createDocumentFragment();
		template.renderInto(fragment);
		part.renderedNodes = Array.from(fragment.childNodes);
		part.endMarker.parentNode.insertBefore(fragment, part.endMarker);
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
					if (part.node) if (isDirective(value)) part.directiveState = value.render(part.node, part.directiveState);
					else if (value instanceof TemplateResult) this.renderNestedTemplate(part, value);
					else if (value instanceof Node) this.renderNode(part, value);
					else if (Array.isArray(value)) this.renderArray(part, value);
					else {
						this.clearRenderedNodes(part);
						part.node.textContent = String(value ?? "");
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
var _ref$1;
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
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref$1 = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref$1 : Object)], RouterOutletComponent.prototype, "_router", void 0);
RouterOutletComponent = __decorate([MelodicComponent({
	selector: "router-outlet",
	template: () => html`<slot></slot>`
})], RouterOutletComponent);
var _ref;
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
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref : Object)], RouterLinkComponent.prototype, "_router", void 0);
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
export { AbortError, Binding, ComponentBase, ComponentStateBaseService, Directive, EffectsBase, HttpBaseError, HttpClient, HttpError, Inject, Injectable, InjectionEngine, Injector, MelodicComponent, NetworkError, ROUTE_CONTEXT_EVENT, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_INIT_STATE, RX_STATE_DEBUG, RouteContextEvent, RouteContextService, RouteMatcher, RouterLinkComponent, RouterOutletComponent, RouterService, SIGNAL_MARKER, Service, SignalEffect, SignalStoreService, TemplateResult, applyGlobalStyles, bootstrap, buildPathFromRoute, classMap, computed, createAction, createDeactivateGuard, createGuard, createReducer, createResolver, createState, createToken, css, directive, findRouteByName, getActiveEffect, getAttributeDirective, getRegisteredDirectives, getTokenKey, hasAttributeDirective, html, isDirective, isSignal, matchRouteTree, onAction, portalDirective, props, provideHttp, provideRX, registerAttributeDirective, render, repeat, repeatRaw, routerLinkDirective, setActiveEffect, signal, styleMap, unregisterAttributeDirective, unsafeHTML, when };

//# sourceMappingURL=melodic-core.js.map