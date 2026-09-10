const getTokenKey = (token) => token;
const describeToken = (key) => {
	if (typeof key === "string") return key;
	if (typeof key === "symbol") return key.toString();
	return key.name || "AnonymousToken";
};
function Inject(token) {
	return function(target, _, index) {
		if (!Object.getOwnPropertyDescriptor(target, "params")) target.params = Array.isArray(target.params) ? [...target.params] : [];
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
function resolveInjectedParams(target, resolve) {
	const paramTokens = target?.params;
	const dependencies = [];
	if (!Array.isArray(paramTokens)) return dependencies;
	for (let i = 0; i < paramTokens.length; i++) {
		const param = paramTokens[i];
		if (param && typeof param === "object" && param.__injectionToken !== void 0) dependencies.push(resolve(param.__injectionToken));
		else dependencies.push(void 0);
	}
	return dependencies;
}
var activeComponent = null;
const setActiveComponent = (component) => {
	activeComponent = component;
};
const getActiveComponent = () => activeComponent;
function readEnv$1() {
	try {
		return typeof import.meta !== "undefined" ? {
			"BASE_URL": "/",
			"DEV": true,
			"MODE": "development",
			"PROD": false,
			"SSR": false
		} : void 0;
	} catch {
		return;
	}
}
function detect() {
	const env = readEnv$1();
	if (env) {
		if (typeof env.DEV === "boolean") return env.DEV;
		if (typeof env.PROD === "boolean") return !env.PROD;
		if (typeof env.MODE === "string") return env.MODE !== "production";
	}
	if (typeof location !== "undefined" && typeof location.hostname === "string") return location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "[::1]" || location.hostname === "";
	return false;
}
var override = null;
var cached = null;
function isDevMode() {
	if (override !== null) return override;
	if (cached === null) cached = detect();
	return cached;
}
function setDevMode(enabled) {
	override = enabled;
}
var warned = /* @__PURE__ */ new Set();
function devWarn(key, ...message) {
	if (!isDevMode() || warned.has(key)) return;
	warned.add(key);
	console.warn("[Melodic]", ...message);
}
function resetDevWarnings() {
	warned.clear();
}
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
		this.warnOnRebind(key);
		this._bindings.set(key, binding);
		return binding;
	}
	warnOnRebind(key) {
		const existing = this._bindings.get(key);
		if (existing?.isSingleton && existing.getInstance() !== void 0) devWarn(`rebind:${describeToken(key)}`, `'${describeToken(key)}' was re-bound after its singleton had already been resolved. Consumers holding the previous instance keep it, so two versions are now live. Bind before the first resolution, or call Injector.unbind() first.`);
	}
	bindValue(token, value) {
		const key = getTokenKey(token);
		const binding = new Binding(key, token, "value");
		binding.setInstance(value);
		binding.setSingleton(true);
		this.warnOnRebind(key);
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
		if (!binding) throw new Error(`Dependency could not be found: ${describeToken(key)}`);
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
	entries() {
		return [...this._bindings.entries()];
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
			const chain = [...this._constructionStack, key].map(describeToken).join(" -> ");
			throw new Error(`Circular dependency detected: ${chain}`);
		}
		this._constructionStack.add(key);
		const prevActive = getActiveComponent();
		setActiveComponent(null);
		try {
			let instance;
			if (binding.type === "factory") instance = binding.factory();
			else instance = this.construct(binding, key);
			if (binding.isSingleton) binding.setInstance(instance);
			return instance;
		} finally {
			setActiveComponent(prevActive);
			this._constructionStack.delete(key);
		}
	}
	construct(binding, currentToken) {
		const cls = binding.targetClass;
		let dependencies = [];
		const resolveDependency = (depKey) => {
			const depBinding = this._bindings.get(depKey);
			if (!depBinding) throw new Error(`Dependency '${describeToken(depKey)}' not found (required by '${describeToken(currentToken)}')`);
			return this.resolve(depBinding, depKey);
		};
		const paramTokens = cls.params;
		if (Array.isArray(paramTokens) && paramTokens.length > 0) dependencies = resolveInjectedParams(cls, resolveDependency);
		else if (binding.dependencies.length > 0) dependencies = binding.dependencies.map(resolveDependency);
		if (binding.args.length > 0) dependencies = dependencies.concat(binding.args);
		return Reflect.construct(cls, dependencies);
	}
};
const Injector = new InjectionEngine();
function Service(token) {
	return function(target, propertyKey) {
		const metadataKey = `__service_${String(propertyKey)}`;
		target[metadataKey] = token;
		const cacheKey = `__cached_${String(propertyKey)}`;
		Object.defineProperty(target, propertyKey, {
			get() {
				if (!Object.prototype.hasOwnProperty.call(this, cacheKey)) this[cacheKey] = Injector.get(token);
				return this[cacheKey];
			},
			set(value) {
				Object.defineProperty(this, cacheKey, {
					value,
					writable: true,
					enumerable: false,
					configurable: true
				});
			},
			enumerable: true,
			configurable: true
		});
	};
}
function createToken(description) {
	return Symbol(description);
}
function inject(token) {
	return Injector.get(token);
}
function injectOptional(token, fallback) {
	return Injector.has(token) ? Injector.get(token) : fallback;
}
var registry$1 = /* @__PURE__ */ new Map();
function registerComponentDefinition(entry) {
	registry$1.set(entry.selector, entry);
}
function getComponentDefinition(selector) {
	return registry$1.get(selector);
}
function getComponentDefinitions() {
	return [...registry$1.values()];
}
var HOOK_KEY = "__MELODIC_DEVTOOLS_HOOK__";
var hook;
function createHook() {
	const listeners = /* @__PURE__ */ new Map();
	let id = 0;
	let listening = false;
	return {
		version: "1",
		components: /* @__PURE__ */ new Map(),
		get listening() {
			return listening;
		},
		nextId: () => ++id,
		emit(event) {
			if (!listening) return;
			for (const listener of listeners.get(event.type) ?? []) listener(event);
			for (const listener of listeners.get("*") ?? []) listener(event);
		},
		on(type, listener) {
			listening = true;
			let set = listeners.get(type);
			if (!set) {
				set = /* @__PURE__ */ new Set();
				listeners.set(type, set);
			}
			set.add(listener);
			return () => {
				set.delete(listener);
			};
		}
	};
}
function getHook() {
	if (hook !== void 0) return hook;
	if (typeof window === "undefined" || !isDevMode()) {
		hook = null;
		return hook;
	}
	hook = window[HOOK_KEY] ?? createHook();
	window[HOOK_KEY] = hook;
	return hook;
}
function emitDevtools(type, payload) {
	const active = getHook();
	if (!active || !active.listening) return;
	active.emit({
		type,
		ts: typeof performance !== "undefined" ? performance.now() : Date.now(),
		payload: payload?.()
	});
}
function devtoolsListening() {
	const active = getHook();
	return active !== null && active.listening;
}
function collectInstances(root, selector, found) {
	for (const element of root.querySelectorAll("*")) {
		const tag = element.tagName.toLowerCase();
		if (tag.includes("-") && (selector === void 0 || tag === selector)) found.push(element);
		if (element.shadowRoot) collectInstances(element.shadowRoot, selector, found);
	}
}
function isComponentElement(element) {
	return "component" in element && element.component !== void 0;
}
function createConsoleApi() {
	return {
		components: () => getComponentDefinitions().map((entry) => entry.selector),
		instances: (selector) => {
			const found = [];
			collectInstances(document, selector?.toLowerCase(), found);
			return found.filter(isComponentElement);
		},
		inspect: (element) => {
			if (!isComponentElement(element)) return null;
			const base = element;
			const component = base.component;
			const properties = {};
			const sources = [];
			for (const key of Object.keys(component)) {
				if (key.startsWith("_") || key === "elementRef") continue;
				const value = component[key];
				if (typeof value === "function" && "__signal" in value) {
					sources.push(key);
					continue;
				}
				if (typeof value === "function") continue;
				properties[key] = value;
			}
			return {
				selector: base.selector,
				element,
				properties,
				sources,
				rendering: base.isRendering
			};
		},
		bindings: () => Injector.entries().map(([key, binding]) => ({
			token: describeToken(key),
			type: binding.type,
			singleton: binding.isSingleton,
			resolved: binding.getInstance() !== void 0
		})),
		on: (type, listener) => getHook()?.on(type, listener) ?? (() => void 0),
		trace: () => {
			const hook$1 = getHook();
			if (!hook$1) return () => void 0;
			return hook$1.on("*", (event) => {
				console.log(`%c${event.type}`, "color:#7c3aed;font-weight:600", event.payload ?? "");
			});
		}
	};
}
function installConsoleApi() {
	if (typeof window === "undefined" || !isDevMode()) return;
	const target = window;
	if (target.melodic) return;
	target.melodic = createConsoleApi();
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
		this._opaqueCounter = 0;
	}
	generateRequestKey(identity) {
		const headers = Object.entries(identity.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
		return JSON.stringify([
			identity.method.toUpperCase(),
			identity.url,
			identity.params ? this.serializeParams(identity.params) : "",
			headers,
			identity.credentials ?? "",
			identity.mode ?? "",
			identity.body === void 0 || identity.body === null ? "" : this.serializeBody(identity.body)
		]);
	}
	serializeParams(params) {
		return JSON.stringify(Object.entries(params).filter(([, value]) => value !== null && value !== void 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
	}
	joinPendingRequest(key, signal$1) {
		const pending = this._pendingRequests.get(key);
		if (!pending) return null;
		this.registerParticipant(pending, signal$1);
		return pending.promise;
	}
	addPendingRequest(key, promise, abortController, signal$1) {
		const pending = {
			promise,
			abortController,
			remainingParticipants: 0,
			cleanups: []
		};
		this._pendingRequests.set(key, pending);
		this.registerParticipant(pending, signal$1);
		promise.then(() => this.removePendingRequest(key), () => this.removePendingRequest(key));
		return promise;
	}
	cancelPendingRequest(key, reason) {
		const pending = this._pendingRequests.get(key);
		if (pending) {
			pending.abortController.abort(reason);
			this.releasePendingRequest(key, pending);
		}
	}
	cancelAllRequests(reason) {
		this._pendingRequests.forEach((pending, key) => {
			pending.abortController.abort(reason);
			this.releasePendingRequest(key, pending);
		});
		this._pendingRequests.clear();
	}
	registerParticipant(pending, signal$1) {
		pending.remainingParticipants++;
		if (!signal$1) return;
		const leave = () => {
			pending.remainingParticipants--;
			if (pending.remainingParticipants === 0) pending.abortController.abort(signal$1.reason);
		};
		if (signal$1.aborted) leave();
		else {
			signal$1.addEventListener("abort", leave, { once: true });
			pending.cleanups.push(() => signal$1.removeEventListener("abort", leave));
		}
	}
	removePendingRequest(key) {
		const pending = this._pendingRequests.get(key);
		if (pending) this.releasePendingRequest(key, pending);
	}
	releasePendingRequest(key, pending) {
		this._pendingRequests.delete(key);
		const cleanups = pending.cleanups;
		pending.cleanups = [];
		for (const cleanup of cleanups) cleanup();
	}
	serializeBody(body) {
		if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof ReadableStream) return `opaque:${++this._opaqueCounter}`;
		let str;
		if (typeof body === "string") str = body;
		else if (body instanceof URLSearchParams) str = body.toString();
		else if (typeof body === "object" && body !== null) str = JSON.stringify(body);
		else str = String(body);
		return str;
	}
};
var MAX_RETRIES = 3;
function combineSignals(signals) {
	if (signals.length === 0) return;
	if (signals.length === 1) return signals[0];
	if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);
	const controller = new AbortController();
	for (const signal$1 of signals) {
		if (signal$1.aborted) {
			controller.abort(signal$1.reason);
			break;
		}
		signal$1.addEventListener("abort", () => controller.abort(signal$1.reason), { once: true });
	}
	return controller.signal;
}
function createTimeoutSignal(ms) {
	if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
	const controller = new AbortController();
	setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), ms);
	return controller.signal;
}
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
		const originalConfig = config;
		let requestConfig = this.mergeConfig(config);
		requestConfig = await this.executeRequestInterceptors(requestConfig);
		if (requestConfig.cancel?.cancelled) {
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
		} else if (this.shouldDefaultJsonContentType(requestConfig.body)) {
			const headers = { ...requestConfig.headers };
			if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
				headers["Content-Type"] = "application/json";
				requestConfig.headers = headers;
			}
		}
		const callerSignals = [];
		if (requestConfig.signal) callerSignals.push(requestConfig.signal);
		if (requestConfig.abortController) callerSignals.push(requestConfig.abortController.signal);
		if (requestConfig.timeout && requestConfig.timeout > 0) callerSignals.push(createTimeoutSignal(requestConfig.timeout));
		const callerSignal = combineSignals(callerSignals);
		try {
			if (requestConfig.deduplicate === true) return await this.executeDeduplicatedRequest(requestConfig, callerSignal);
			const response = await this.executeRequest(requestConfig, callerSignal);
			return await this.executeResponseInterceptors(response, 0);
		} catch (error) {
			return this.handleResponseError(error, originalConfig);
		}
	}
	async executeDeduplicatedRequest(config, callerSignal) {
		const requestKey = this._requestManager.generateRequestKey({
			method: config.method,
			url: config.url,
			params: config.params,
			headers: config.headers,
			credentials: config.credentials,
			mode: config.mode,
			body: config.body
		});
		let shared = this._requestManager.joinPendingRequest(requestKey, callerSignal);
		if (!shared) {
			const sharedController = new AbortController();
			const promise = this.executeRequest(config, sharedController.signal).then((response) => this.executeResponseInterceptors(response, 0));
			shared = this._requestManager.addPendingRequest(requestKey, promise, sharedController, callerSignal);
		}
		return this.raceCallerAbort(shared, callerSignal, config);
	}
	raceCallerAbort(promise, signal$1, config) {
		if (!signal$1) return promise;
		const toAbortError = () => {
			return new AbortError(signal$1.reason instanceof DOMException && signal$1.reason.name === "TimeoutError" ? "Request timed out" : "Request aborted", config);
		};
		if (signal$1.aborted) return Promise.reject(toAbortError());
		return new Promise((resolve, reject) => {
			const onAbort = () => reject(toAbortError());
			signal$1.addEventListener("abort", onAbort, { once: true });
			promise.then((value) => {
				signal$1.removeEventListener("abort", onAbort);
				resolve(value);
			}, (error) => {
				signal$1.removeEventListener("abort", onAbort);
				reject(error);
			});
		});
	}
	async handleResponseError(error, originalConfig) {
		const retryCount = originalConfig._retryCount ?? 0;
		let retryInitiated = false;
		let currentError = error;
		for (let i = 0; i < this._interceptors.response.length; i++) {
			const interceptor = this._interceptors.response[i];
			if (!interceptor.error) continue;
			const retry = async () => {
				if (retryInitiated) throw new Error("[HttpClient] retry() may only be called once per error pass");
				retryInitiated = true;
				if (retryCount >= MAX_RETRIES) throw new Error(`[HttpClient] Max retries (${MAX_RETRIES}) exceeded`);
				return this.internalRequest({
					...originalConfig,
					_retryCount: retryCount + 1,
					abortController: void 0
				});
			};
			const context = {
				retry,
				retryCount
			};
			try {
				const result = await interceptor.error(currentError, context);
				if (this.isHttpResponse(result)) return retryInitiated ? result : this.executeResponseInterceptors(result, i + 1);
			} catch (interceptorError) {
				currentError = interceptorError;
			}
			if (retryInitiated) break;
		}
		throw currentError;
	}
	isHttpResponse(value) {
		return !!value && typeof value === "object" && "data" in value && "status" in value && "headers" in value && "config" in value;
	}
	shouldDefaultJsonContentType(body) {
		if (body === null || body === void 0) return false;
		if (typeof body === "string") return false;
		if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams || body instanceof ReadableStream) return false;
		return typeof body === "object";
	}
	async executeRequest(config, signal$1) {
		return fetch(config.url, {
			method: config.method,
			headers: config.headers,
			body: this.prepareBody(config.body),
			credentials: config.credentials,
			mode: config.mode,
			signal: signal$1
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
			if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) throw new AbortError(error.name === "TimeoutError" ? "Request timed out" : "Request aborted", config);
			throw new NetworkError((error instanceof Error ? error.message : "Network error") || "Network error", config);
		});
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
	async executeResponseInterceptors(response, startIndex) {
		for (let i = startIndex; i < this._interceptors.response.length; i++) response = await this._interceptors.response[i].intercept(response);
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
		const baseUrl = this._clientConfig.baseURL || "";
		let fullUrl;
		if (!baseUrl || /^[a-z][a-z\d+\-.]*:\/\//i.test(url)) fullUrl = url;
		else fullUrl = `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
		if (params) {
			const pairs = [];
			for (const [key, value] of Object.entries(params)) {
				if (value === null || value === void 0) continue;
				const values = Array.isArray(value) ? value : [value];
				for (const v of values) {
					if (v === null || v === void 0) continue;
					pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
				}
			}
			if (pairs.length > 0) fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${pairs.join("&")}`;
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
			if (contentType.includes("application/json")) return this.parseJsonText(await blob.text(), response);
			if (contentType.includes("text/")) return await blob.text();
			if (this.isBinaryContentType(contentType)) return blob;
			return await blob.text();
		}
		if (contentType.includes("application/json")) return this.parseJsonText(await response.text(), response);
		if (contentType.includes("text/")) return await response.text();
		if (this.isBinaryContentType(contentType)) return await response.blob();
		return await response.text();
	}
	parseJsonText(text, response) {
		if (!text) return null;
		try {
			return JSON.parse(text);
		} catch {
			if (response.ok) console.warn(`[Melodic] [HttpClient] Response for ${response.url} declared JSON but did not parse; returning the raw text.`);
			return text;
		}
	}
	isBinaryContentType(contentType) {
		return contentType.includes("application/octet-stream") || contentType.includes("application/pdf") || contentType.includes("application/zip") || contentType.startsWith("image/") || contentType.startsWith("audio/") || contentType.startsWith("video/") || contentType.startsWith("font/");
	}
};
async function bootstrap(config = {}) {
	if (config.devMode !== void 0) setDevMode(config.devMode);
	const devMode = isDevMode();
	if (devMode) installConsoleApi();
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
	let rootElement;
	let destroyed = false;
	const removeErrorHandlers = () => {
		for (const { type, handler } of errorHandlers) window.removeEventListener(type, handler);
		errorHandlers.length = 0;
	};
	let boundApp = null;
	const rollback = () => {
		removeErrorHandlers();
		if (rootElement?.parentNode) rootElement.parentNode.removeChild(rootElement);
		if (boundApp && Injector.getBinding("IMelodicApp")?.getInstance() === boundApp) Injector.unbind("IMelodicApp");
	};
	try {
		if (config.onBefore) {
			if (devMode) console.log("[Melodic] Running onBefore hook...");
			await config.onBefore();
		}
		if (config.providers) {
			for (const provider of config.providers) provider(Injector);
			if (devMode) console.log("[Melodic] Custom providers registered");
		}
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
			http: void 0,
			get(token) {
				return Injector.get(token);
			},
			destroy() {
				if (destroyed) return;
				destroyed = true;
				removeErrorHandlers();
				if (rootElement?.parentNode) rootElement.parentNode.removeChild(rootElement);
				if (Injector.getBinding("IMelodicApp")?.getInstance() === app) Injector.unbind("IMelodicApp");
				app.rootElement = void 0;
				if (devMode) console.log("[Melodic] Application destroyed");
			}
		};
		if (Injector.has(HttpClient)) app.http = Injector.get(HttpClient);
		Injector.bindValue("IMelodicApp", app);
		boundApp = app;
		if (config.onReady) config.onReady();
		if (devMode) console.log("[Melodic] Bootstrap complete");
		return app;
	} catch (error) {
		rollback();
		throw error;
	}
}
function attributeNames(attributes) {
	if (!attributes) return [];
	return Array.isArray(attributes) ? attributes : Object.keys(attributes);
}
function attributeTypes(attributes) {
	if (!attributes || Array.isArray(attributes)) return {};
	return attributes;
}
function render(result, container) {
	result.renderInto(container);
}
const SIGNAL_MARKER = Symbol("melodic.signal");
const DEPENDENTS = Symbol("melodic.signal.dependents");
const isSignal = (value) => {
	return typeof value === "function" && SIGNAL_MARKER in value;
};
function disposeDirectiveState(state) {
	if (state !== null && typeof state === "object" && typeof state.__dispose === "function") try {
		state.__dispose();
	} catch (error) {
		console.error("Directive state disposal failed:", error);
	}
}
function disposePart(part) {
	if (part.eventWrapper) {
		if (part.eventAttached && part.node && part.name) part.node.removeEventListener(part.name, part.eventWrapper, part.eventOptions);
		part.eventWrapper = void 0;
		part.eventHandler = void 0;
		part.eventOptions = void 0;
		part.eventAttached = false;
	}
	if (part.actionCleanup) try {
		part.actionCleanup();
	} catch (error) {
		console.error("Action directive cleanup failed:", error);
	} finally {
		part.actionCleanup = void 0;
	}
	if (part.nestedContainer) {
		disposeContainerParts(part.nestedContainer);
		part.nestedContainer = void 0;
	}
	if (part.renderedContainers) {
		for (const container of part.renderedContainers) disposeContainerParts(container);
		part.renderedContainers = void 0;
	}
	if (part.arrayState) {
		for (const item of part.arrayState.items) disposeContainerParts(item.container);
		part.arrayState = void 0;
	}
	if (part.positionalArrayState) {
		for (const item of part.positionalArrayState.items) disposeContainerParts(item.container);
		part.positionalArrayState = void 0;
	}
	if (part.directiveState !== void 0) {
		disposeDirectiveState(part.directiveState);
		part.directiveState = void 0;
		part.directiveType = void 0;
	}
}
function disposeParts(parts) {
	for (const part of parts) disposePart(part);
}
function disposeContainerParts(container) {
	const parts = container.__parts;
	if (parts) disposeParts(parts);
}
var globalStylesAttribute = "melodic-styles";
var globalStyleSelector = `style[${globalStylesAttribute}], link[rel="stylesheet"][${globalStylesAttribute}]`;
var cachedCssSheets = [];
var loadingPromise = null;
var pendingRoots = /* @__PURE__ */ new Set();
const applyGlobalStyles = (root) => {
	if (hasCachedSheets()) {
		applyAdoptedSheets(root);
		return;
	}
	pendingRoots.add(root);
	if (!loadingPromise) loadingPromise = loadStyles().catch((error) => {
		devWarn("global-styles-load", "Global styles could not be read. A cross-origin stylesheet cannot be adopted into shadow roots — serve it same-origin or inline it in a <style melodic-styles> element.", error);
	}).finally(() => {
		for (const pending of pendingRoots) applyAdoptedSheets(pending);
		pendingRoots.clear();
	});
};
const refreshGlobalStyles = async () => {
	cachedCssSheets.length = 0;
	loadingPromise = null;
	await loadStyles().catch(() => void 0);
	for (const ref of [...adoptedRoots]) {
		const root = ref.deref();
		if (root) applyAdoptedSheets(root);
		else adoptedRoots.delete(ref);
	}
};
var adoptedRoots = /* @__PURE__ */ new Set();
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
				element.addEventListener("error", () => resolve(), { once: true });
			});
			try {
				cacheCssSheet(Array.from(element.sheet?.cssRules ?? []).map((rule) => rule.cssText).join("\n"));
			} catch (error) {
				devWarn(`global-styles-cors:${element.href}`, `Global stylesheet "${element.href}" is cross-origin, so its rules cannot be copied into shadow roots. Serve it from the same origin to have it adopted.`, error);
			}
		}
	}
};
var applyAdoptedSheets = (root) => {
	adoptedRoots.add(new WeakRef(root));
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
var cssTextCache = /* @__PURE__ */ new WeakMap();
var sheetCache = /* @__PURE__ */ new Map();
var constructedSheetsSupported;
function supportsConstructedStyleSheets() {
	if (constructedSheetsSupported === void 0) try {
		constructedSheetsSupported = typeof CSSStyleSheet !== "undefined" && typeof CSSStyleSheet.prototype.replaceSync === "function" && typeof ShadowRoot !== "undefined" && "adoptedStyleSheets" in ShadowRoot.prototype && new CSSStyleSheet() instanceof CSSStyleSheet;
	} catch {
		constructedSheetsSupported = false;
	}
	return constructedSheetsSupported;
}
function getComponentStyleSheet(stylesFactory) {
	if (!supportsConstructedStyleSheets()) return null;
	let cssText = cssTextCache.get(stylesFactory);
	if (cssText === void 0) {
		cssText = renderStylesToText(stylesFactory());
		cssTextCache.set(stylesFactory, cssText);
	}
	let sheet = sheetCache.get(cssText);
	if (sheet === void 0) {
		try {
			const created = new CSSStyleSheet();
			created.replaceSync(cssText);
			sheet = created;
		} catch {
			sheet = null;
		}
		sheetCache.set(cssText, sheet);
	}
	return sheet;
}
function renderStylesToText(result) {
	const host = document.createElement("style");
	render(result, host);
	const text = host.textContent ?? "";
	disposeContainerParts(host);
	return text;
}
var activeEffect = null;
const setActiveEffect = (effect$1) => {
	activeEffect = effect$1;
};
const getActiveEffect = () => activeEffect;
var MAX_FLUSH_RUNS = 100;
var batchDepth = 0;
var flushing = false;
var pendingNotifications = /* @__PURE__ */ new Set();
var pendingEffects = /* @__PURE__ */ new Set();
var flushRuns = /* @__PURE__ */ new Map();
function isCoalescingEffects() {
	return batchDepth > 0 || flushing;
}
function scheduleNotify(notify) {
	pendingNotifications.add(notify);
}
function scheduleEffect(effect$1) {
	pendingEffects.add(effect$1);
}
function unscheduleEffect(effect$1) {
	pendingEffects.delete(effect$1);
}
function flush() {
	if (batchDepth > 0 || flushing) return;
	flushBatch();
}
function circularError() {
	return /* @__PURE__ */ new Error(`Circular dependency detected in effect: exceeded ${MAX_FLUSH_RUNS} synchronous re-runs. An effect is repeatedly writing to a signal it also reads.`);
}
function rethrow(errors) {
	if (errors.length === 1) throw errors[0];
	if (errors.length > 1) throw new AggregateError(errors, `${errors.length} signal subscribers threw during flush`);
}
function flushBatch() {
	flushing = true;
	emitDevtools("flush:start", () => ({
		notifications: pendingNotifications.size,
		effects: pendingEffects.size
	}));
	const errors = [];
	try {
		while (pendingNotifications.size > 0 || pendingEffects.size > 0) {
			if (pendingNotifications.size > 0) {
				const notifications = [...pendingNotifications];
				pendingNotifications.clear();
				for (const notify of notifications) try {
					notify();
				} catch (error) {
					errors.push(error);
				}
			}
			if (pendingEffects.size > 0) {
				const effects = [...pendingEffects];
				pendingEffects.clear();
				for (const effect$1 of effects) {
					const runs = (flushRuns.get(effect$1) ?? 0) + 1;
					if (runs > MAX_FLUSH_RUNS) {
						pendingNotifications.clear();
						pendingEffects.clear();
						throw errors.length > 0 ? new AggregateError([circularError(), ...errors], "Circular dependency detected in effect") : circularError();
					}
					flushRuns.set(effect$1, runs);
					try {
						effect$1.runNow();
					} catch (error) {
						errors.push(error);
					}
				}
			}
		}
	} finally {
		flushing = false;
		flushRuns.clear();
		emitDevtools("flush:end");
	}
	rethrow(errors);
}
function batch(fn) {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0) flushBatch();
	}
}
var MAX_EFFECT_ITERATIONS = 100;
var SignalEffect = class {
	constructor(execute, options) {
		this.execute = execute;
		this._dependencies = /* @__PURE__ */ new Set();
		this._isRunning = false;
		this._needsRerun = false;
		this._destroyed = false;
		this._hasRun = false;
		this._onInvalidate = options?.onInvalidate;
		this.name = options?.name;
		this.run = () => {
			if (this._destroyed) return;
			if (this._hasRun && isCoalescingEffects()) {
				scheduleEffect(this);
				return;
			}
			this.runNow();
		};
	}
	get hasRun() {
		return this._hasRun;
	}
	get destroyed() {
		return this._destroyed;
	}
	invalidate() {
		if (this._destroyed) return;
		if (this._onInvalidate) {
			this._onInvalidate();
			return;
		}
		scheduleEffect(this);
	}
	runNow() {
		if (this._destroyed) return;
		if (this._isRunning) {
			this._needsRerun = true;
			return;
		}
		this._isRunning = true;
		this._hasRun = true;
		let iterations = 0;
		try {
			do {
				if (++iterations > MAX_EFFECT_ITERATIONS) {
					this._needsRerun = false;
					throw new Error(`Circular dependency detected in effect${this.name ? ` '${this.name}'` : ""}: exceeded ${MAX_EFFECT_ITERATIONS} synchronous re-runs. An effect is repeatedly writing to a signal it also reads.`);
				}
				this._needsRerun = false;
				this.clearDependencies();
				const prevEffect = getActiveEffect();
				setActiveEffect(this);
				try {
					emitDevtools("effect:run", () => ({ name: this.name }));
					this.execute();
				} finally {
					setActiveEffect(prevEffect);
				}
			} while (this._needsRerun && !this._destroyed);
		} finally {
			this._isRunning = false;
		}
	}
	addDependency(producer) {
		this._dependencies.add(producer);
	}
	clearDependencies() {
		this._dependencies.forEach((producer) => {
			producer[DEPENDENTS].delete(this);
		});
		this._dependencies.clear();
	}
	destroy() {
		this._destroyed = true;
		this._needsRerun = false;
		this.clearDependencies();
		unscheduleEffect(this);
	}
};
var destroyedMessage$1 = (name) => `Signal${name ? ` '${name}'` : ""} accessed after destruction. Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — the signal is destroyed when its component disconnects.`;
function notifyAll(subscribers, value) {
	const errors = [];
	for (const subscriber of subscribers) try {
		subscriber(value);
	} catch (error) {
		errors.push(error);
	}
	if (errors.length === 1) throw errors[0];
	if (errors.length > 1) throw new AggregateError(errors, `${errors.length} signal subscribers threw`);
}
function signal(initialValue, options = {}) {
	let value = initialValue;
	let destroyed = false;
	const subscribers = /* @__PURE__ */ new Set();
	const dependents = /* @__PURE__ */ new Set();
	const notify = () => {
		notifyAll([...subscribers], value);
	};
	const read = (() => {
		if (destroyed) throw new Error(destroyedMessage$1(options.name));
		const activeEffect$1 = getActiveEffect();
		if (activeEffect$1) {
			activeEffect$1.addDependency(read);
			dependents.add(activeEffect$1);
		}
		return value;
	});
	read.set = (newValue) => {
		if (destroyed) throw new Error(destroyedMessage$1(options.name));
		if (Object.is(value, newValue)) return;
		value = newValue;
		emitDevtools("signal:set", () => ({
			name: options.name,
			value: newValue
		}));
		if (subscribers.size > 0) scheduleNotify(notify);
		for (const dependent of [...dependents]) dependent.invalidate();
		flush();
	};
	read.update = (updater) => {
		if (destroyed) throw new Error(destroyedMessage$1(options.name));
		read.set(updater(value));
	};
	read.subscribe = (subscriber) => {
		if (destroyed) throw new Error(destroyedMessage$1(options.name));
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};
	read.unsubscribe = (subscriber) => {
		subscribers.delete(subscriber);
	};
	read.destroy = () => {
		if (destroyed) return;
		destroyed = true;
		emitDevtools("signal:destroy", () => ({ name: options.name }));
		subscribers.clear();
		dependents.clear();
	};
	emitDevtools("signal:create", () => ({
		name: options.name,
		value: initialValue
	}));
	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});
	Object.defineProperty(read, DEPENDENTS, {
		value: dependents,
		enumerable: false,
		configurable: false
	});
	return read;
}
var destroyedMessage = (name) => `Computed signal${name ? ` '${name}'` : ""} accessed after destruction. Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — the signal is destroyed when its component disconnects.`;
var READ_ONLY_MESSAGE = "Cannot write to a computed signal — its value is derived from its sources. Update the source signal(s) instead.";
function computed(computation, options = {}) {
	let value;
	let dirty = true;
	let destroyed = false;
	const subscribers = /* @__PURE__ */ new Set();
	const dependents = /* @__PURE__ */ new Set();
	const recompute = () => {
		tracker.clearDependencies();
		const prevEffect = getActiveEffect();
		setActiveEffect(tracker);
		try {
			value = computation();
			dirty = false;
			emitDevtools("computed:recompute", () => ({
				name: options.name,
				value
			}));
		} finally {
			setActiveEffect(prevEffect);
		}
	};
	const tracker = new SignalEffect(() => {}, { onInvalidate: () => {
		if (destroyed || dirty) return;
		dirty = true;
		for (const dependent of [...dependents]) dependent.invalidate();
		if (subscribers.size > 0) scheduleEffect(notifier);
	} });
	let lastNotified;
	const notifier = { runNow: () => {
		if (destroyed) return;
		if (dirty) recompute();
		if (!Object.is(lastNotified, value)) {
			lastNotified = value;
			notifyAll([...subscribers], value);
		}
	} };
	const read = (() => {
		if (destroyed) throw new Error(destroyedMessage(options.name));
		const activeEffect$1 = getActiveEffect();
		if (activeEffect$1) {
			activeEffect$1.addDependency(read);
			dependents.add(activeEffect$1);
		}
		if (dirty) recompute();
		return value;
	});
	read.set = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};
	read.update = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};
	read.subscribe = (subscriber) => {
		if (destroyed) throw new Error(destroyedMessage(options.name));
		if (dirty) recompute();
		if (subscribers.size === 0) lastNotified = value;
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};
	read.unsubscribe = (subscriber) => {
		subscribers.delete(subscriber);
	};
	read.destroy = () => {
		if (destroyed) return;
		destroyed = true;
		tracker.destroy();
		unscheduleEffect(notifier);
		dependents.clear();
		subscribers.clear();
	};
	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});
	Object.defineProperty(read, DEPENDENTS, {
		value: dependents,
		enumerable: false,
		configurable: false
	});
	const owner = getActiveComponent();
	owner?.registerDisposable(read);
	if (owner?.isRendering) devWarn(`computed-in-render:${owner.selector ?? "component"}${options.name ? `:${options.name}` : ""}`, `computed()${options.name ? ` '${options.name}'` : ""} was created while <${owner.selector ?? "a component"}> was rendering. A new one is created on every render and they accumulate for the life of the component. Create it in a field initializer or onInit, or use store.select(key, fn, cacheKey), which is render-scoped.`);
	return read;
}
function effect(fn, options = {}) {
	let cleanup = null;
	let destroyed = false;
	const runCleanup = () => {
		if (!cleanup) return;
		const pending = cleanup;
		cleanup = null;
		try {
			pending();
		} catch (error) {
			console.error(`[Melodic] Effect${options.name ? ` '${options.name}'` : ""} cleanup failed:`, error);
		}
	};
	const signalEffect = new SignalEffect(() => {
		runCleanup();
		const result = fn();
		cleanup = typeof result === "function" ? result : null;
	}, options.name !== void 0 ? { name: options.name } : void 0);
	const ref = {
		run: () => {
			if (!destroyed) signalEffect.run();
		},
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			signalEffect.destroy();
			runCleanup();
		},
		get destroyed() {
			return destroyed;
		}
	};
	getActiveComponent()?.registerDisposable(ref);
	if (!options.manual) signalEffect.run();
	return ref;
}
function untracked(fn) {
	const previous = getActiveEffect();
	setActiveEffect(null);
	try {
		return fn();
	} finally {
		setActiveEffect(previous);
	}
}
var globalMessages = {};
function registerDefaultMessages(messages) {
	for (const code of Object.keys(messages)) globalMessages[code] = messages[code];
}
function setDefaultMessage(code, message) {
	globalMessages[code] = message;
}
function getGlobalMessage(code) {
	return globalMessages[code];
}
function resolveMessage(message, params) {
	if (typeof message === "function") return message(params ?? {});
	return message;
}
var AbstractControl = class {
	constructor(initialValue, options = {}) {
		this.parent = null;
		this._validators = [];
		this._asyncValidators = [];
		this._touched = signal(false);
		this._dirty = signal(false);
		this._pending = signal(false);
		this._ownDisabled = signal(false);
		this._asyncValidationId = 0;
		this._destroyed = false;
		this._errorSources = /* @__PURE__ */ new Map();
		this.value = signal(initialValue);
		this.errors = signal(null);
		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._ownDisabled.set(options.disabled ?? false);
		this.updateOn = options.updateOn ?? "change";
		this.messages = options.messages ?? {};
		const consumer = getActiveComponent();
		if (consumer) consumer.registerDisposable(this);
	}
	initializeAggregates() {
		this.dirty = computed(() => this.computeDirty());
		this.touched = computed(() => this.computeTouched());
		this.pending = computed(() => this.computePending());
		this.disabled = computed(() => this.computeDisabled());
		this.pristine = computed(() => !this.dirty());
		this.untouched = computed(() => !this.touched());
		this.enabled = computed(() => !this.disabled());
		this.invalid = computed(() => !this.disabled() && (this.errors() !== null || this.hasInvalidChild()));
		this.valid = computed(() => !this.invalid() && !this.pending());
		this.state = computed(() => ({
			dirty: this.dirty(),
			touched: this.touched(),
			pristine: !this.dirty(),
			untouched: !this.touched(),
			valid: !this.invalid() && !this.pending(),
			invalid: this.invalid(),
			pending: this.pending(),
			disabled: this.disabled(),
			enabled: !this.disabled()
		}));
	}
	get destroyed() {
		return this._destroyed;
	}
	getRawValue() {
		return this.value();
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
	markAllAsTouched() {
		this.markAsTouched();
	}
	markAllAsUntouched() {
		this.markAsUntouched();
	}
	markAllAsDirty() {
		this.markAsDirty();
	}
	markAllAsPristine() {
		this.markAsPristine();
	}
	disable() {
		this._ownDisabled.set(true);
	}
	enable() {
		this._ownDisabled.set(false);
	}
	setValidators(validators) {
		this._validators = validators;
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
	setAsyncValidators(validators) {
		this._asyncValidators = validators;
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
	getErrorMessage(code) {
		const error = this.getError(code);
		if (!error) return "";
		const params = error.params;
		const localMessage = this.resolveFromChain(code);
		if (localMessage !== void 0) return resolveMessage(localMessage, params);
		const validatorMessage = this.resolveFromValidator(code);
		if (validatorMessage !== void 0) return resolveMessage(validatorMessage, params);
		const globalMessage = getGlobalMessage(code);
		if (globalMessage !== void 0) return resolveMessage(globalMessage, params);
		return code;
	}
	getFirstErrorMessage() {
		const errors = this.errors();
		if (!errors) return "";
		const codes = Object.keys(errors);
		if (codes.length === 0) return "";
		return this.getErrorMessage(codes[0]);
	}
	resolveFromValidator(code) {
		return this._errorSources.get(code)?.messages?.[code];
	}
	resolveFromChain(code) {
		let control = this;
		while (control !== null) {
			if (control.messages[code] !== void 0) return control.messages[code];
			control = control.parent;
		}
	}
	async runValidation() {
		const id = ++this._asyncValidationId;
		const value = this.value();
		let errors = null;
		this._errorSources.clear();
		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) {
				for (const code of Object.keys(result)) this._errorSources.set(code, validator);
				errors = {
					...errors ?? {},
					...result
				};
			}
		}
		if (errors !== null) {
			this._pending.set(false);
			this.errors.set(errors);
			return;
		}
		if (this._asyncValidators.length > 0) {
			this._pending.set(true);
			try {
				const results = await Promise.all(this._asyncValidators.map(async (v) => ({
					validator: v,
					result: await v(value)
				})));
				if (id !== this._asyncValidationId || this._destroyed) return;
				for (const { validator, result } of results) if (result !== null) {
					for (const code of Object.keys(result)) this._errorSources.set(code, validator);
					errors = {
						...errors ?? {},
						...result
					};
				}
			} catch (error) {
				if (id !== this._asyncValidationId || this._destroyed) return;
				console.error("Async validator failed:", error);
				errors = {
					...errors ?? {},
					asyncValidator: {
						code: "asyncValidator",
						params: { message: error instanceof Error ? error.message : String(error) }
					}
				};
			} finally {
				if (id === this._asyncValidationId && !this._destroyed) this._pending.set(false);
			}
		}
		if (id === this._asyncValidationId && !this._destroyed) this.errors.set(errors);
	}
	computeDirty() {
		return this._dirty();
	}
	computeTouched() {
		return this._touched();
	}
	computePending() {
		return this._pending();
	}
	computeDisabled() {
		return this._ownDisabled();
	}
	hasInvalidChild() {
		return false;
	}
	shouldValidateOnChange() {
		return this.updateOn === "change";
	}
	destroySignals() {
		this.value.destroy();
		this.errors.destroy();
		this._touched.destroy();
		this._dirty.destroy();
		this._pending.destroy();
		this._ownDisabled.destroy();
		this.dirty.destroy();
		this.touched.destroy();
		this.pristine.destroy();
		this.untouched.destroy();
		this.valid.destroy();
		this.invalid.destroy();
		this.pending.destroy();
		this.disabled.destroy();
		this.enabled.destroy();
		this.state.destroy();
	}
};
var MAX_RENDERS_PER_TASK = 25;
var ComponentBase = class extends HTMLElement {
	constructor(meta, component, pending) {
		super();
		this._renderScheduled = false;
		this._booleanProperties = /* @__PURE__ */ new Set();
		this._numberProperties = /* @__PURE__ */ new Set();
		this._stringProperties = /* @__PURE__ */ new Set();
		this._rendering = false;
		this._selectEpoch = 0;
		this._renderScopedSelects = /* @__PURE__ */ new Map();
		this._reactiveSourceEntries = [];
		this._created = false;
		this._destroyed = false;
		this._teardownScheduled = false;
		this._dirty = true;
		this._renderEffect = null;
		this._rendersThisTask = 0;
		this._renderBurstReset = null;
		this._renderLoopReported = false;
		this._devtoolsId = 0;
		this._renderCount = 0;
		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;
		const declaredTypes = {
			...attributeTypes(meta.attributes),
			...component.constructor.propertyTypes ?? {}
		};
		for (const [attribute, type] of Object.entries(declaredTypes)) {
			const prop = attribute.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
			if (type === "boolean") this._booleanProperties.add(prop);
			else if (type === "number") this._numberProperties.add(prop);
			else if (type === "string") this._stringProperties.add(prop);
		}
		this._disposables = pending?.disposables ?? /* @__PURE__ */ new Set();
		this._selectCache = pending?.selectCache ?? /* @__PURE__ */ new Map();
		this._root = this.attachShadow({ mode: "open" });
		applyGlobalStyles(this._root);
		this._style = this.renderStyles();
		const prevActive = getActiveComponent();
		setActiveComponent(this);
		try {
			untracked(() => {
				this.observe();
				if (this._component.onInit) this._component.onInit();
			});
		} finally {
			setActiveComponent(prevActive);
		}
	}
	get component() {
		return this._component;
	}
	get isRendering() {
		return this._rendering;
	}
	get selector() {
		return this._meta.selector;
	}
	registerDisposable(d) {
		this._disposables.add(d);
	}
	requestRender() {
		this.scheduleRender();
	}
	getSelectCache() {
		return this._selectCache;
	}
	touchSelectEntry(fullKey) {
		if (this._renderScopedSelects.has(fullKey)) this._renderScopedSelects.set(fullKey, this._selectEpoch);
	}
	trackSelectEntry(fullKey, sig) {
		if (!this._rendering) return;
		this._renderScopedSelects.set(fullKey, this._selectEpoch);
		sig.subscribe(() => this.scheduleRender());
	}
	connectedCallback() {
		this._teardownScheduled = false;
		emitDevtools("component:connect", () => ({
			id: this.devtoolsId(),
			selector: this._meta.selector
		}));
		this.subscribeReactiveSources();
		this.render();
		const prev = getActiveComponent();
		setActiveComponent(this);
		try {
			untracked(() => {
				if (!this._created) {
					this._created = true;
					this._component.onCreate?.();
				}
				this._component.onConnect?.();
			});
		} finally {
			setActiveComponent(prev);
		}
	}
	disconnectedCallback() {
		emitDevtools("component:disconnect", () => ({
			id: this.devtoolsId(),
			selector: this._meta.selector
		}));
		for (const entry of this._reactiveSourceEntries) {
			for (const unsubscribe of entry.unsubscribers) unsubscribe();
			entry.unsubscribers = [];
		}
		try {
			untracked(() => this._component.onDisconnect?.());
		} finally {
			if (!this._teardownScheduled && !this._destroyed) {
				this._teardownScheduled = true;
				queueMicrotask(() => {
					this._teardownScheduled = false;
					if (!this.isConnected && !this._destroyed) this.teardown();
				});
			}
		}
	}
	attributeChangedCallback(attribute, oldVal, newVal) {
		const prop = attribute.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
		const component = this._component;
		const current = component[prop];
		const value = this.coerceAttributeValue(prop, newVal, current);
		if (!Object.is(current, value)) {
			component[prop] = value;
			this.scheduleRender();
		}
		if (this._component.onAttributeChange !== void 0) untracked(() => this._component.onAttributeChange(attribute, oldVal, newVal));
	}
	coerceAttributeValue(prop, raw, current) {
		if (this._stringProperties.has(prop)) return raw;
		if (this._booleanProperties.has(prop) || typeof current === "boolean") return raw !== null && raw !== "false";
		if (this._numberProperties.has(prop) || typeof current === "number") {
			if (raw === null || raw.trim() === "") return raw;
			const parsed = Number(raw);
			return Number.isNaN(parsed) ? raw : parsed;
		}
		if ((current === void 0 || current === null) && (raw === "true" || raw === "false")) return raw === "true";
		return raw;
	}
	teardown() {
		this._destroyed = true;
		if (this._devtoolsId !== 0) {
			emitDevtools("component:destroy", () => ({
				id: this._devtoolsId,
				selector: this._meta.selector
			}));
			getHook()?.components.delete(this._devtoolsId);
		}
		if (this._renderBurstReset !== null) {
			clearTimeout(this._renderBurstReset);
			this._renderBurstReset = null;
		}
		this._renderEffect?.destroy();
		this._renderEffect = null;
		const root = this._root;
		const parts = root.__parts;
		if (parts) disposeParts(parts);
		delete root.__parts;
		delete root.__templateKey;
		try {
			if (this._component.onDestroy !== void 0) untracked(() => this._component.onDestroy());
		} finally {
			for (const d of this._disposables) try {
				d.destroy();
			} catch (error) {
				console.error("Disposable cleanup failed:", error);
			}
			this._disposables.clear();
			this._selectCache.clear();
		}
	}
	renderStyles() {
		if (!this._meta.styles) return null;
		const sheet = getComponentStyleSheet(this._meta.styles);
		if (sheet) {
			this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
			return null;
		}
		const styleNode = document.createElement("style");
		render(this._meta.styles(), styleNode);
		return this._root.appendChild(styleNode);
	}
	render() {
		if (this.enteredRenderLoop()) return;
		this._dirty = false;
		if (!this._renderEffect) this._renderEffect = new SignalEffect(() => this.renderTemplate(), {
			name: this._meta.selector,
			onInvalidate: () => this.scheduleRender()
		});
		if (!devtoolsListening()) {
			this._renderEffect.runNow();
			return;
		}
		const started = performance.now();
		this._renderEffect.runNow();
		const elapsed = performance.now() - started;
		this._renderCount++;
		const record = getHook()?.components.get(this.devtoolsId());
		if (record) {
			record.renders = this._renderCount;
			record.lastRenderMs = elapsed;
		}
		emitDevtools("component:render", () => ({
			id: this.devtoolsId(),
			selector: this._meta.selector,
			ms: elapsed,
			renders: this._renderCount
		}));
	}
	devtoolsId() {
		if (this._devtoolsId === 0) {
			const hook$1 = getHook();
			if (!hook$1) return 0;
			this._devtoolsId = hook$1.nextId();
			hook$1.components.set(this._devtoolsId, {
				id: this._devtoolsId,
				selector: this._meta.selector,
				host: new WeakRef(this),
				renders: this._renderCount,
				lastRenderMs: 0
			});
		}
		return this._devtoolsId;
	}
	renderTemplate() {
		const prev = getActiveComponent();
		setActiveComponent(this);
		this._rendering = true;
		this._selectEpoch++;
		try {
			if (this._meta.template) {
				render(this._meta.template(this._component, this._meta.template.length > 1 ? this.getAttributeValues() : void 0), this._root);
				if (this._style && this._style.parentNode !== this._root) this._root.appendChild(this._style);
			}
			if (this._component.onRender !== void 0) untracked(() => this._component.onRender());
		} finally {
			this._rendering = false;
			setActiveComponent(prev);
			this.sweepRenderScopedSelects();
		}
	}
	enteredRenderLoop() {
		if (++this._rendersThisTask <= MAX_RENDERS_PER_TASK) {
			if (this._renderBurstReset === null) this._renderBurstReset = setTimeout(() => {
				this._renderBurstReset = null;
				this._rendersThisTask = 0;
				this._renderLoopReported = false;
			}, 0);
			return false;
		}
		if (!this._renderLoopReported) {
			this._renderLoopReported = true;
			console.error(`[Melodic] <${this._meta.selector}> rendered ${MAX_RENDERS_PER_TASK} times without yielding and was stopped. A render loop is usually a property or signal written from onRender (or from the template itself), which schedules the render that writes it again.`);
		}
		return true;
	}
	sweepRenderScopedSelects() {
		for (const [key, epoch] of this._renderScopedSelects) {
			if (epoch === this._selectEpoch) continue;
			const sig = this._selectCache.get(key);
			this._renderScopedSelects.delete(key);
			this._selectCache.delete(key);
			if (sig) {
				this._disposables.delete(sig);
				sig.destroy();
			}
		}
	}
	scheduleRender() {
		this._dirty = true;
		if (this._renderScheduled) return;
		this._renderScheduled = true;
		queueMicrotask(() => {
			this._renderScheduled = false;
			if (this.isConnected && this._dirty) this.render();
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
		const getterOnly = [];
		const sourceProps = [];
		const filtered = properties.filter((prop) => {
			if (prop.startsWith("_") || prop === "elementRef" || prop === "constructor") return false;
			const descriptor = this.getPropertyDescriptor(this._component, prop);
			const isServiceAccessor = `__service_${prop}` in this._component;
			if (descriptor && descriptor.get && (!descriptor.set || isServiceAccessor)) {
				getterOnly.push(prop);
				return false;
			}
			const value = this._component[prop];
			if (isSignal(value) || value instanceof AbstractControl) {
				sourceProps.push(prop);
				return false;
			}
			if (typeof value === "function") return false;
			return true;
		});
		for (const prop of sourceProps) this.observeReactiveSource(prop);
		for (const prop of filtered) {
			const descriptor = this.getPropertyDescriptor(this._component, prop);
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue === void 0 ? this._component[prop] : wrapperValue;
			if (typeof value === "boolean") this._booleanProperties.add(prop);
			else if (typeof value === "number") this._numberProperties.add(prop);
			let componentGetter = () => value;
			let componentSetter = (newVal) => {
				if (!Object.is(value, newVal)) {
					this._component.onPropertyChange?.(prop, value, newVal);
					value = newVal;
					this.scheduleRender();
				}
			};
			if (descriptor?.get) {
				const originalGetter = descriptor.get;
				componentGetter = () => originalGetter.call(this._component);
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
			if (prop in HTMLElement.prototype) devWarn(`native-prop:${this._meta.selector}:${prop}`, `<${this._meta.selector}> declares a property "${prop}", which is also a native HTMLElement property. The native behaviour is kept on the element; the component's field is still reactive internally, but \`element.${prop}\` reads the platform value. Rename the field to avoid the collision.`);
			else Object.defineProperty(this, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});
		}
		for (const prop of getterOnly) {
			if (Object.prototype.hasOwnProperty.call(this, prop)) continue;
			Object.defineProperty(this, prop, {
				get: () => this._component[prop],
				set: () => {},
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
	subscribeReactiveSources() {
		if (this._destroyed) return;
		for (const entry of this._reactiveSourceEntries) {
			for (const unsubscribe of entry.unsubscribers) unsubscribe();
			entry.unsubscribers = entry.signals.map((signal$1) => signal$1.subscribe(() => this.scheduleRender()));
		}
	}
	collectSourceSignals(value) {
		if (isSignal(value)) return [value];
		if (value instanceof AbstractControl) return [value.value, value.state];
		return [];
	}
	observeReactiveSource(prop) {
		const component = this._component;
		const entry = {
			signals: this.collectSourceSignals(component[prop]),
			unsubscribers: []
		};
		this._reactiveSourceEntries.push(entry);
		const descriptor = this.getPropertyDescriptor(this._component, prop);
		if (descriptor && (descriptor.get || descriptor.set)) return;
		let current = component[prop];
		Object.defineProperty(this._component, prop, {
			get: () => current,
			set: (newVal) => {
				if (Object.is(current, newVal)) return;
				this._component.onPropertyChange?.(prop, current, newVal);
				current = newVal;
				for (const unsubscribe of entry.unsubscribers) unsubscribe();
				entry.unsubscribers = [];
				entry.signals = this.collectSourceSignals(newVal);
				if (this.isConnected && !this._destroyed) entry.unsubscribers = entry.signals.map((signal$1) => signal$1.subscribe(() => this.scheduleRender()));
				this.scheduleRender();
			},
			enumerable: true,
			configurable: true
		});
	}
};
var RESERVED_SELECTORS = new Set([
	"annotation-xml",
	"color-profile",
	"font-face",
	"font-face-src",
	"font-face-uri",
	"font-face-format",
	"font-face-name",
	"missing-glyph"
]);
function assertValidSelector(selector) {
	if (typeof selector !== "string" || selector.length === 0) throw new Error("@MelodicComponent: \"selector\" is required and must be a non-empty string (e.g. \"app-card\").");
	if (!selector.includes("-")) throw new Error(`@MelodicComponent: invalid selector "${selector}". Custom element names must contain a hyphen — use a prefixed name such as "app-${selector}".`);
	if (!/^[a-z]/.test(selector) || /[A-Z]/.test(selector) || /\s/.test(selector)) throw new Error(`@MelodicComponent: invalid selector "${selector}". Custom element names must start with a lowercase letter and must not contain uppercase letters or whitespace.`);
	if (RESERVED_SELECTORS.has(selector)) throw new Error(`@MelodicComponent: "${selector}" is a reserved name and cannot be used as a custom element selector.`);
}
function warnAboutAttributes(meta, component) {
	if (!isDevMode()) return;
	for (const name of attributeNames(meta.attributes)) if (/[A-Z]/.test(name)) devWarn(`attr-case:${meta.selector}:${name}`, `<${meta.selector}> observes attribute "${name}", which can never fire — HTML lowercases attribute names. Use "${name.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}" (it maps to the "${name}" property).`);
	const prototype = component.prototype;
	if (!prototype) return;
	for (const name of attributeNames(meta.attributes)) {
		const prop = name.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
		if (typeof prototype[prop] === "function") devWarn(`attr-method:${meta.selector}:${name}`, `<${meta.selector}> observes attribute "${name}", but "${prop}" is a method. Setting the attribute would replace the method with the attribute string.`);
	}
}
function MelodicComponent(meta) {
	return function(component) {
		assertValidSelector(meta.selector);
		warnAboutAttributes(meta, component);
		const existing = getComponentDefinition(meta.selector);
		if (existing && existing.componentClass !== component) devWarn(`duplicate-selector:${meta.selector}`, `Two classes were registered as <${meta.selector}> ('${existing.componentClass?.name ?? "unknown"}' and '${component.name}'). The first registration wins and the second is ignored — custom element names are global.`);
		if (customElements.get(meta.selector) === void 0) {
			const webComponent = class extends ComponentBase {
				constructor() {
					const dependencies = resolveInjectedParams(component, (token) => Injector.get(token));
					const disposables = /* @__PURE__ */ new Set();
					const selectCache = /* @__PURE__ */ new Map();
					const placeholder = {
						getSelectCache: () => selectCache,
						registerDisposable: (d) => {
							disposables.add(d);
						}
					};
					const prevActive = getActiveComponent();
					setActiveComponent(placeholder);
					let userInstance;
					try {
						userInstance = untracked(() => Reflect.construct(component, dependencies));
					} finally {
						setActiveComponent(prevActive);
					}
					super(meta, userInstance, {
						disposables,
						selectCache
					});
				}
				static #_ = this.observedAttributes = attributeNames(meta.attributes);
			};
			const componentWithSelector = component;
			componentWithSelector.selector = meta.selector;
			customElements.define(meta.selector, webComponent);
		}
		registerComponentDefinition({
			selector: meta.selector,
			componentClass: component,
			meta
		});
		emitDevtools("component:define", () => ({
			selector: meta.selector,
			className: component.name
		}));
	};
}
function emit(host, name, detail, options = {}) {
	return host.dispatchEvent(new CustomEvent(name, {
		detail,
		bubbles: options.bubbles ?? true,
		composed: options.composed ?? true,
		cancelable: options.cancelable ?? false
	}));
}
function readEnv() {
	try {
		return typeof import.meta !== "undefined" ? {
			"BASE_URL": "/",
			"DEV": true,
			"MODE": "development",
			"PROD": false,
			"SSR": false
		} : void 0;
	} catch {
		return;
	}
}
function isEnvironment(value) {
	return value === "dev" || value === "qa" || value === "prod";
}
function resolveEnvironment(env) {
	if (env && isEnvironment(env.VITE_ENV)) return env.VITE_ENV;
	const mode = env?.MODE;
	if (typeof mode === "string") {
		if (mode === "development") return "dev";
		if (mode === "production") return "prod";
		if (isEnvironment(mode)) return mode;
	}
	if (env?.PROD) return "prod";
	return "dev";
}
function getEnvironment() {
	return resolveEnvironment(readEnv());
}
const environment = getEnvironment();
var UNSAFE_MERGE_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype"
]);
function deepMerge(target, source) {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		if (UNSAFE_MERGE_KEYS.has(key)) continue;
		const targetVal = result[key];
		const sourceVal = source[key];
		if (sourceVal !== null && typeof sourceVal === "object" && !Array.isArray(sourceVal) && targetVal !== null && typeof targetVal === "object" && !Array.isArray(targetVal)) result[key] = deepMerge(targetVal, sourceVal);
		else result[key] = sourceVal;
	}
	return result;
}
function defineConfig(definition) {
	const envOverrides = definition[environment];
	const resolved = envOverrides ? deepMerge(definition.base, envOverrides) : { ...definition.base };
	if (definition.extends) return deepMerge(definition.extends, resolved);
	return resolved;
}
const APP_CONFIG = createToken("APP_CONFIG");
function provideConfig(config) {
	return (injector) => {
		injector.bindValue(APP_CONFIG, config);
	};
}
var FormControl = class extends AbstractControl {
	constructor(initialValue, options = {}) {
		super(initialValue, options);
		this.initialValue = initialValue;
		this.initializeAggregates();
		this.runValidation();
	}
	setValue(value, options) {
		if (this._ownDisabled()) return;
		this.value.set(value);
		if (options?.markAsPristine) this._dirty.set(false);
		this.runValidation();
	}
	patchValue(value, options) {
		const current = this.value();
		if (typeof current === "object" && current !== null && !Array.isArray(current)) this.setValue({
			...current,
			...value
		}, options);
		else this.setValue(value, options);
	}
	reset(value) {
		this.value.set(value ?? this.initialValue);
		this._dirty.set(false);
		this._touched.set(false);
		this.runValidation();
	}
	destroy() {
		if (this._destroyed) return;
		this._destroyed = true;
		this.destroySignals();
	}
};
var FormGroup = class FormGroup extends AbstractControl {
	constructor(initialControls, options = {}) {
		super(FormGroup.computeValue(initialControls), options);
		this.controls = signal({ ...initialControls });
		for (const key of Object.keys(initialControls)) initialControls[key].parent = this;
		this.initializeAggregates();
		this._childValueEffect = new SignalEffect(() => {
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].value();
			this.value.set(FormGroup.computeValue(controls));
			if (this.shouldValidateOnChange()) this.runValidation();
		});
		this._childValueEffect.run();
	}
	get(name) {
		return this.controls()[name];
	}
	contains(name) {
		return name in this.controls();
	}
	addControl(name, control) {
		control.parent = this;
		this.controls.update((current) => ({
			...current,
			[name]: control
		}));
	}
	removeControl(name) {
		const control = this.controls()[name];
		if (!control) return;
		control.parent = null;
		this.controls.update((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});
		control.destroy();
	}
	setValue(value, options) {
		batch(() => {
			if (this._ownDisabled()) return;
			const controls = this.controls();
			const controlKeys = Object.keys(controls);
			const valueKeys = Object.keys(value);
			for (const key of valueKeys) if (!(key in controls)) throw new Error(`FormGroup.setValue: unknown control name '${key}'. Use patchValue() for partial updates.`);
			for (const key of controlKeys) if (!(key in value)) throw new Error(`FormGroup.setValue: missing value for control name '${key}'. Use patchValue() for partial updates.`);
			for (const key of controlKeys) controls[key].setValue(value[key], options);
			if (options?.markAsPristine) this._dirty.set(false);
		});
	}
	getRawValue() {
		return FormGroup.computeValue(this.controls(), true);
	}
	patchValue(value, options) {
		batch(() => {
			if (this._ownDisabled()) return;
			const controls = this.controls();
			for (const key of Object.keys(value)) if (value[key] !== void 0) controls[key]?.setValue(value[key], options);
			if (options?.markAsPristine) this._dirty.set(false);
		});
	}
	reset(value) {
		batch(() => {
			const controls = this.controls();
			for (const key of Object.keys(controls)) {
				const resetValue = value?.[key];
				controls[key].reset(resetValue);
			}
		});
	}
	markAllAsTouched() {
		batch(() => {
			this.markAsTouched();
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].markAllAsTouched();
		});
	}
	markAllAsUntouched() {
		batch(() => {
			this._touched.set(false);
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].markAllAsUntouched();
		});
	}
	markAllAsDirty() {
		batch(() => {
			this._dirty.set(true);
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].markAllAsDirty();
		});
	}
	markAllAsPristine() {
		batch(() => {
			this._dirty.set(false);
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].markAllAsPristine();
		});
	}
	disable() {
		batch(() => {
			this._ownDisabled.set(true);
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].disable();
		});
	}
	enable() {
		batch(() => {
			this._ownDisabled.set(false);
			const controls = this.controls();
			for (const key of Object.keys(controls)) controls[key].enable();
		});
	}
	async validate() {
		const controls = this.controls();
		await Promise.all(Object.keys(controls).map((key) => controls[key].validate()));
		await this.runValidation();
	}
	destroy() {
		if (this._destroyed) return;
		this._destroyed = true;
		this._childValueEffect.destroy();
		const controls = this.controls();
		for (const key of Object.keys(controls)) controls[key].destroy();
		this.destroySignals();
		this.controls.destroy();
	}
	computeDirty() {
		if (this._dirty()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key].dirty());
	}
	computeTouched() {
		if (this._touched()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key].touched());
	}
	computePending() {
		if (this._pending()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => {
			const control = controls[key];
			return !control.disabled() && control.pending();
		});
	}
	hasInvalidChild() {
		const controls = this.controls();
		return Object.keys(controls).some((key) => {
			const control = controls[key];
			return !control.disabled() && control.invalid();
		});
	}
	static computeValue(controls, includeDisabled = false) {
		const result = {};
		for (const key of Object.keys(controls)) {
			const control = controls[key];
			if (!includeDisabled && control.disabled()) continue;
			result[key] = includeDisabled ? control.getRawValue() : control.value();
		}
		return result;
	}
};
var FormArray = class extends AbstractControl {
	constructor(initialControls, options = {}) {
		super(initialControls.map((c) => c.value()), options);
		this.controls = signal([...initialControls]);
		for (const control of initialControls) control.parent = this;
		this.initializeAggregates();
		this._childValueEffect = new SignalEffect(() => {
			const controls = this.controls();
			for (const control of controls) control.value();
			this.value.set(controls.filter((c) => !c.disabled()).map((c) => c.value()));
			if (this.shouldValidateOnChange()) this.runValidation();
		});
		this._childValueEffect.run();
	}
	get length() {
		return this.controls().length;
	}
	at(index) {
		return this.controls()[index];
	}
	push(control) {
		control.parent = this;
		this.controls.update((current) => [...current, control]);
	}
	insert(index, control) {
		control.parent = this;
		this.controls.update((current) => {
			const next = [...current];
			next.splice(index, 0, control);
			return next;
		});
	}
	removeAt(index) {
		const control = this.controls()[index];
		if (!control) return;
		control.parent = null;
		this.controls.update((current) => current.filter((_, i) => i !== index));
		control.destroy();
	}
	clear() {
		const controls = this.controls();
		for (const control of controls) control.parent = null;
		this.controls.set([]);
		for (const control of controls) control.destroy();
	}
	setValue(value, options) {
		batch(() => {
			if (this._ownDisabled()) return;
			const controls = this.controls();
			if (value.length !== controls.length) throw new Error(`FormArray.setValue: expected ${controls.length} value(s) but received ${value.length}. Use patchValue() for partial updates.`);
			value.forEach((v, i) => {
				controls[i].setValue(v, options);
			});
			if (options?.markAsPristine) this._dirty.set(false);
		});
	}
	getRawValue() {
		return this.controls().map((c) => c.getRawValue());
	}
	patchValue(value, options) {
		batch(() => {
			if (this._ownDisabled()) return;
			const controls = this.controls();
			value.forEach((v, i) => {
				if (v !== void 0) controls[i]?.setValue(v, options);
			});
			if (options?.markAsPristine) this._dirty.set(false);
		});
	}
	reset(value) {
		batch(() => {
			this.controls().forEach((control, i) => {
				control.reset(value?.[i]);
			});
		});
	}
	markAllAsTouched() {
		batch(() => {
			this.markAsTouched();
			for (const control of this.controls()) control.markAllAsTouched();
		});
	}
	markAllAsUntouched() {
		batch(() => {
			this._touched.set(false);
			for (const control of this.controls()) control.markAllAsUntouched();
		});
	}
	markAllAsDirty() {
		batch(() => {
			this._dirty.set(true);
			for (const control of this.controls()) control.markAllAsDirty();
		});
	}
	markAllAsPristine() {
		batch(() => {
			this._dirty.set(false);
			for (const control of this.controls()) control.markAllAsPristine();
		});
	}
	disable() {
		batch(() => {
			this._ownDisabled.set(true);
			for (const control of this.controls()) control.disable();
		});
	}
	enable() {
		batch(() => {
			this._ownDisabled.set(false);
			for (const control of this.controls()) control.enable();
		});
	}
	async validate() {
		await Promise.all(this.controls().map((c) => c.validate()));
		await this.runValidation();
	}
	destroy() {
		if (this._destroyed) return;
		this._destroyed = true;
		this._childValueEffect.destroy();
		for (const control of this.controls()) control.destroy();
		this.destroySignals();
		this.controls.destroy();
	}
	computeDirty() {
		if (this._dirty()) return true;
		return this.controls().some((c) => c.dirty());
	}
	computeTouched() {
		if (this._touched()) return true;
		return this.controls().some((c) => c.touched());
	}
	computePending() {
		if (this._pending()) return true;
		return this.controls().some((c) => !c.disabled() && c.pending());
	}
	hasInvalidChild() {
		return this.controls().some((c) => !c.disabled() && c.invalid());
	}
};
function createFormControl(initialValue, options) {
	return new FormControl(initialValue, options);
}
function createFormGroup(controls, options) {
	return new FormGroup(controls, options);
}
function createFormArray(controls, options) {
	return new FormArray(controls, options);
}
registerDefaultMessages({
	required: "This field is required",
	minLength: (params) => `Minimum length is ${params.min} characters`,
	maxLength: (params) => `Maximum length is ${params.max} characters`,
	pattern: "Value does not match required pattern",
	email: "Please enter a valid email address",
	min: (params) => `Value must be at least ${params.min}`,
	max: (params) => `Value must be at most ${params.max}`,
	range: (params) => `Value must be between ${params.min} and ${params.max}`
});
var EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function isEmpty(value) {
	return value === null || value === void 0 || value === "" || Array.isArray(value) && value.length === 0;
}
const Validators = {
	required(value) {
		return isEmpty(value) ? { required: { code: "required" } } : null;
	},
	minLength(min) {
		return (value) => {
			if (!value || value.length === 0) return null;
			return value.length < min ? { minLength: {
				code: "minLength",
				params: {
					min,
					actual: value.length
				}
			} } : null;
		};
	},
	maxLength(max) {
		return (value) => {
			if (!value) return null;
			return value.length > max ? { maxLength: {
				code: "maxLength",
				params: {
					max,
					actual: value.length
				}
			} } : null;
		};
	},
	pattern(regex) {
		return (value) => {
			if (!value) return null;
			return !regex.test(value) ? { pattern: {
				code: "pattern",
				params: { pattern: regex.toString() }
			} } : null;
		};
	},
	email(value) {
		if (!value) return null;
		return !EMAIL_REGEX.test(value) ? { email: { code: "email" } } : null;
	},
	min(minValue) {
		return (value) => {
			if (value === null || value === void 0) return null;
			return value < minValue ? { min: {
				code: "min",
				params: {
					min: minValue,
					actual: value
				}
			} } : null;
		};
	},
	max(maxValue) {
		return (value) => {
			if (value === null || value === void 0) return null;
			return value > maxValue ? { max: {
				code: "max",
				params: {
					max: maxValue,
					actual: value
				}
			} } : null;
		};
	},
	range(minValue, maxValue) {
		return (value) => {
			if (value === null || value === void 0) return null;
			if (value < minValue || value > maxValue) return { range: {
				code: "range",
				params: {
					min: minValue,
					max: maxValue,
					actual: value
				}
			} };
			return null;
		};
	},
	compose(...validators) {
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
	composeAsync(...validators) {
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
function createValidator(code, validationFn, defaultMessage, options = {}) {
	if (defaultMessage !== void 0 && options.global) setDefaultMessage(code, defaultMessage);
	const validator = ((value) => {
		if (validationFn(value)) return null;
		return { [code]: { code } };
	});
	if (defaultMessage !== void 0) Object.defineProperty(validator, "messages", {
		value: { [code]: defaultMessage },
		enumerable: false
	});
	return validator;
}
function createAsyncValidator(code, validationFn, defaultMessage, options = {}) {
	if (defaultMessage !== void 0 && options.global) setDefaultMessage(code, defaultMessage);
	const validator = (async (value) => {
		if (await validationFn(value)) return null;
		return { [code]: { code } };
	});
	if (defaultMessage !== void 0) Object.defineProperty(validator, "messages", {
		value: { [code]: defaultMessage },
		enumerable: false
	});
	return validator;
}
var registry = [];
function registerAdapter(predicate, adapter) {
	registry.unshift({
		predicate,
		adapter
	});
}
function getAdapter(element) {
	for (const entry of registry) if (entry.predicate(element)) return entry.adapter;
}
const textAdapter = {
	inputEvent: "input",
	blurEvent: "focusout",
	getValue(element) {
		return element.value ?? "";
	},
	setValue(element, value) {
		element.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled(element, disabled) {
		if (disabled) element.setAttribute("disabled", "");
		else element.removeAttribute("disabled");
	}
};
const checkboxAdapter = {
	inputEvent: "change",
	blurEvent: "focusout",
	getValue(element) {
		return element.checked;
	},
	setValue(element, value) {
		element.checked = Boolean(value);
	},
	setDisabled(element, disabled) {
		if (disabled) element.setAttribute("disabled", "");
		else element.removeAttribute("disabled");
	}
};
const radioAdapter = {
	inputEvent: "change",
	blurEvent: "focusout",
	getValue(element) {
		const input = element;
		return input.checked ? input.value : "";
	},
	setValue(element, value) {
		const input = element;
		input.checked = input.value === value;
	},
	setDisabled(element, disabled) {
		if (disabled) element.setAttribute("disabled", "");
		else element.removeAttribute("disabled");
	}
};
function registerNativeAdapters() {
	registerAdapter((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT", textAdapter);
	registerAdapter((el) => el.tagName === "INPUT" && el.type === "radio", radioAdapter);
	registerAdapter((el) => el.tagName === "INPUT" && el.type === "checkbox", checkboxAdapter);
}
registerNativeAdapters();
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
function formControlDirective(element, value, _) {
	if (!(value instanceof AbstractControl)) {
		console.warn("formControl directive: value must be an AbstractControl");
		return;
	}
	const control = value;
	const adapter = getAdapter(element);
	if (!adapter) {
		console.warn(`formControl directive: no adapter registered for <${element.tagName.toLowerCase()}>`);
		return;
	}
	const cleanupFns = [];
	const syncElementValue = (val) => {
		if (control.destroyed) return;
		adapter.setValue(element, val);
	};
	const syncDisabled = (disabled) => {
		if (control.destroyed) return;
		adapter.setDisabled?.(element, disabled);
	};
	const syncClasses = () => {
		if (control.destroyed) return;
		element.classList.toggle("mf-valid", control.valid());
		element.classList.toggle("mf-invalid", control.invalid());
		element.classList.toggle("mf-dirty", control.dirty());
		element.classList.toggle("mf-pristine", control.pristine());
		element.classList.toggle("mf-touched", control.touched());
		element.classList.toggle("mf-pending", control.pending());
		element.classList.toggle("mf-disabled", control.disabled());
	};
	const syncError = () => {
		if (control.destroyed) return;
		if (!control.touched() || !control.errors()) {
			element.removeAttribute("error");
			return;
		}
		const message = control.getFirstErrorMessage();
		if (message) element.setAttribute("error", message);
		else element.removeAttribute("error");
	};
	const writeToModel = () => {
		if (control.destroyed) return;
		control.setValue(adapter.getValue(element));
		control.markAsDirty();
	};
	const handleInput = (event) => {
		const target = event.target;
		if (target !== element && !element.contains(target)) return;
		if (control.updateOn === "change") writeToModel();
	};
	const handleBlur = () => {
		if (control.updateOn === "blur") writeToModel();
		control.markAsTouched();
	};
	const handleSubmit = () => {
		if (control.updateOn === "submit") {
			writeToModel();
			control.markAsTouched();
			control.validate();
		}
	};
	syncElementValue(control.value());
	syncDisabled(control.disabled());
	syncClasses();
	syncError();
	cleanupFns.push(control.value.subscribe((v) => syncElementValue(v)));
	cleanupFns.push(control.disabled.subscribe((d) => syncDisabled(d)));
	cleanupFns.push(control.state.subscribe(() => syncClasses()));
	cleanupFns.push(control.state.subscribe(() => syncError()));
	element.addEventListener(adapter.inputEvent, handleInput);
	element.addEventListener(adapter.blurEvent, handleBlur);
	const form = control.updateOn === "submit" ? element.closest("form") : null;
	form?.addEventListener("submit", handleSubmit);
	element.setAttribute("data-form-control", "");
	return () => {
		element.removeEventListener(adapter.inputEvent, handleInput);
		element.removeEventListener(adapter.blurEvent, handleBlur);
		form?.removeEventListener("submit", handleSubmit);
		element.removeAttribute("data-form-control");
		for (const fn of cleanupFns) fn();
	};
}
registerAttributeDirective("formControl", formControlDirective);
function modelDirective(element, value, name) {
	if (!isSignal(value)) {
		devWarn("model-not-signal", ":model expects a signal — for example `:model=${this.name}` where `name = signal(\"\")`. Received:", value);
		return;
	}
	const model = value;
	const adapter = getAdapter(element);
	if (!adapter) {
		devWarn(`model-no-adapter:${element.tagName}`, `:model has no adapter registered for <${element.tagName.toLowerCase()}>, so it cannot read or write its value.`);
		return;
	}
	let writingBack = false;
	const pushToElement = (next) => {
		if (writingBack) return;
		adapter.setValue(element, next);
	};
	const handleInput = (event) => {
		const target = event.target;
		if (target !== element && !element.contains(target)) return;
		writingBack = true;
		try {
			model.set(adapter.getValue(element));
		} finally {
			writingBack = false;
		}
	};
	pushToElement(model());
	const unsubscribe = model.subscribe(pushToElement);
	element.addEventListener(adapter.inputEvent, handleInput);
	return () => {
		unsubscribe();
		element.removeEventListener(adapter.inputEvent, handleInput);
	};
}
registerAttributeDirective("model", modelDirective);
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
		this._reEscape = /[-[\]{}()+?.,\\^$|#\s*]/g;
		this._reToken = /(\*\*)|:(\w+)|\*(\w+)|(\*)/g;
		this._reParam = /([:*])(\w+)/g;
		this._names = [];
		this._isWildcard = false;
		this._route = route;
		this._rules = rules;
		this._isWildcard = route.includes("*");
		const escapedRoute = this.buildPattern(route);
		this._routeRegex = /* @__PURE__ */ new RegExp("^" + escapedRoute + "$");
		this._prefixRegex = /* @__PURE__ */ new RegExp("^" + escapedRoute + "(?:/|$)");
	}
	buildPattern(route) {
		this._reToken.lastIndex = 0;
		let pattern = "";
		let lastIndex = 0;
		let anonCount = 0;
		let match;
		while ((match = this._reToken.exec(route)) !== null) {
			pattern += route.slice(lastIndex, match.index).replace(this._reEscape, "\\$&");
			if (match[1] || match[4]) {
				this._names.push(`_wildcard${anonCount++}`);
				pattern += "(.*)";
			} else if (match[2]) {
				this._names.push(match[2]);
				pattern += "([^/]+)";
			} else if (match[3]) {
				this._names.push(match[3]);
				pattern += "(.*)";
			}
			lastIndex = this._reToken.lastIndex;
		}
		pattern += route.slice(lastIndex).replace(this._reEscape, "\\$&");
		return pattern;
	}
	decode(value) {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
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
			value = this.decode(matches[i]);
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
			const value = this.decode(matches[i + 1]);
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
			result = result.replace(re, (token) => token.charAt(0) === "*" ? params[param].split("/").map(encodeURIComponent).join("/") : encodeURIComponent(params[param]));
		}
		return result.replace(this._reParam, "").replace(/\*+/g, "");
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
function resolveRedirectTarget(redirectTo, basePath) {
	if (redirectTo.startsWith("/")) return redirectTo;
	return basePath ? `/${basePath}/${redirectTo}` : `/${redirectTo}`;
}
var matcherCache = /* @__PURE__ */ new WeakMap();
function getMatcher(route) {
	let matcher = matcherCache.get(route);
	if (!matcher) {
		matcher = new RouteMatcher(route.path);
		matcherCache.set(route, matcher);
	}
	return matcher;
}
function substituteRedirectParams(redirectTo, params) {
	if (!redirectTo.includes(":") && !redirectTo.includes("*")) return redirectTo;
	return redirectTo.replace(/[:*](\w+)/g, (token, name) => {
		const value = params[name];
		return value === void 0 ? token : encodeURIComponent(value);
	});
}
var MAX_MATCH_DEPTH = 64;
function matchRouteLevel(routes, remainingPath, basePath, accumulatedMatches, accumulatedParams, depth = 0) {
	if (depth > MAX_MATCH_DEPTH) throw new Error(`Route tree nesting exceeds ${MAX_MATCH_DEPTH} levels — check for cyclic children definitions`);
	let partialFallback = null;
	for (const route of routes) {
		const matcher = getMatcher(route);
		const exactMatch = matcher.parse(remainingPath);
		if (route.redirectTo && exactMatch !== null) {
			const redirectParams = {
				...accumulatedParams,
				...exactMatch
			};
			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: false,
				redirectTo: resolveRedirectTarget(substituteRedirectParams(route.redirectTo, redirectParams), basePath)
			};
		}
		if (exactMatch !== null) {
			const matchedPath = remainingPath;
			const fullPath = basePath && matchedPath ? `${basePath}/${matchedPath}` : basePath || matchedPath;
			const match = {
				route,
				params: exactMatch,
				matchedPath,
				remainingPath: "",
				fullPath,
				children: route.children
			};
			Object.assign(accumulatedParams, exactMatch);
			accumulatedMatches.push(match);
			if (route.children) {
				const emptyRedirect = route.children.find((child) => child.path === "" && child.redirectTo);
				if (emptyRedirect && emptyRedirect.redirectTo) return {
					matches: accumulatedMatches,
					params: accumulatedParams,
					isExactMatch: false,
					redirectTo: resolveRedirectTarget(substituteRedirectParams(emptyRedirect.redirectTo, accumulatedParams), fullPath)
				};
				if (route.children.find((child) => child.path === "" && !child.redirectTo)) return matchRouteLevel(route.children, "", fullPath, accumulatedMatches, accumulatedParams, depth + 1);
			}
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
				if (route.children && prefixResult.remainingPath) {
					const matchesLengthBefore = accumulatedMatches.length;
					const paramsSnapshot = { ...accumulatedParams };
					Object.assign(accumulatedParams, prefixResult.params);
					accumulatedMatches.push(match);
					const childResult = matchRouteLevel(route.children, prefixResult.remainingPath, fullPath, accumulatedMatches, accumulatedParams, depth + 1);
					if (childResult.isExactMatch || childResult.redirectTo) return childResult;
					if (!partialFallback) partialFallback = {
						matches: [...childResult.matches],
						params: { ...childResult.params },
						isExactMatch: false
					};
					accumulatedMatches.length = matchesLengthBefore;
					for (const key of Object.keys(accumulatedParams)) delete accumulatedParams[key];
					Object.assign(accumulatedParams, paramsSnapshot);
					continue;
				}
				Object.assign(accumulatedParams, prefixResult.params);
				accumulatedMatches.push(match);
				return {
					matches: accumulatedMatches,
					params: accumulatedParams,
					isExactMatch: prefixResult.remainingPath === ""
				};
			}
		}
	}
	return partialFallback ?? {
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
	if (findAndBuildPath(routes, name)) return "/" + pathParts.join("/").split("/").filter(Boolean).join("/");
	return null;
}
const routerStateEvent = (type, data, title, url) => {
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
var historyEventsInstalled = false;
function installHistoryEvents() {
	if (historyEventsInstalled) return;
	historyEventsInstalled = true;
	const pushState = history.pushState;
	history.pushState = (data, title, url) => {
		pushState.apply(history, [
			data,
			title,
			url
		]);
		const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("push", data, title, url) });
		window.dispatchEvent(navigationEvent);
	};
	const replaceState = history.replaceState;
	history.replaceState = (data, title, url) => {
		replaceState.apply(history, [
			data,
			title,
			url
		]);
		const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("replace", data, title, url) });
		window.dispatchEvent(navigationEvent);
	};
}
function parseUrlParts(url) {
	const hashIndex = url.indexOf("#");
	const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
	const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
	const queryIndex = withoutHash.indexOf("?");
	const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
	return {
		pathname: queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash,
		search,
		hash
	};
}
function appendQueryParams(url, queryParams) {
	const serialized = (queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams(queryParams ?? {})).toString();
	if (!serialized) return url;
	const { pathname, search, hash } = parseUrlParts(url);
	return `${pathname}${search ? `${search}&${serialized}` : `?${serialized}`}${hash}`;
}
function __decorateMetadata(k, v) {
	if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
var childrenLoads = /* @__PURE__ */ new WeakMap();
var componentLoads = /* @__PURE__ */ new WeakMap();
var MAX_LAZY_LOADS = 64;
var MAX_REDIRECTS = 10;
var HISTORY_INDEX_KEY = "__melodicHistoryIndex";
function loadRouteChildren(route) {
	let pending = childrenLoads.get(route);
	if (!pending) {
		pending = Promise.resolve().then(() => route.loadChildren());
		pending.catch(() => childrenLoads.delete(route));
		childrenLoads.set(route, pending);
	}
	return pending;
}
function loadRouteComponent(route) {
	let pending = componentLoads.get(route);
	if (!pending) {
		pending = Promise.resolve().then(() => route.loadComponent());
		pending.catch(() => componentLoads.delete(route));
		componentLoads.set(route, pending);
	}
	return pending;
}
var RouterService = class RouterService$1 {
	constructor() {
		this._routes = [];
		this._currentMatches = [];
		this._currentPath = `${window.location.pathname}${window.location.search}`;
		this._navigationId = 0;
		this._pendingTarget = null;
		this._historyIndex = 0;
		this._ignorePopStates = 0;
		this._scrollPositions = /* @__PURE__ */ new Map();
		this._scrollRestoration = true;
		this._previousScrollRestoration = null;
		installHistoryEvents();
		this._contextService = Injector.has(RouteContextService) ? Injector.get(RouteContextService) : new RouteContextService();
		this._committedRoute = signal(null);
		this._params = signal({});
		this._queryParams = signal(new URLSearchParams(window.location.search));
		this._resolvedData = signal({});
		this._events = signal(null);
		this._historyIndex = this.readHistoryIndex(history.state) ?? 0;
		this.enableScrollRestoration(true);
		this._navigationListener = (event) => {
			this._route = event.detail.state;
		};
		window.addEventListener("NavigationEvent", this._navigationListener);
		this._popStateListener = (event) => {
			this.handlePopState(event);
		};
		window.addEventListener("popstate", this._popStateListener);
	}
	get committedRoute() {
		return this._committedRoute;
	}
	get params() {
		return this._params;
	}
	get queryParams() {
		return this._queryParams;
	}
	get resolvedData() {
		return this._resolvedData;
	}
	get events() {
		return this._events;
	}
	destroy() {
		window.removeEventListener("NavigationEvent", this._navigationListener);
		window.removeEventListener("popstate", this._popStateListener);
		if (this._previousScrollRestoration !== null && "scrollRestoration" in history) {
			history.scrollRestoration = this._previousScrollRestoration;
			this._previousScrollRestoration = null;
		}
	}
	enableScrollRestoration(enabled) {
		this._scrollRestoration = enabled;
		if (!("scrollRestoration" in history)) return;
		if (enabled) {
			if (this._previousScrollRestoration === null) this._previousScrollRestoration = history.scrollRestoration;
			history.scrollRestoration = "manual";
		} else if (this._previousScrollRestoration !== null) {
			history.scrollRestoration = this._previousScrollRestoration;
			this._previousScrollRestoration = null;
		}
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
		return this.targetQueryParams();
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
		return matchRouteTree(this._routes, this.normalizePath(path));
	}
	emit(type, id, url, trigger, extra = {}) {
		this._events.set({
			type,
			id,
			url,
			trigger,
			...extra
		});
		emitDevtools(`nav:${type}`, () => ({
			id,
			url,
			trigger,
			...extra
		}));
	}
	async resolveMatch(path, isCurrent) {
		for (let loads = 0; loads <= MAX_LAZY_LOADS; loads++) {
			const result = this.matchPath(path);
			if (result.redirectTo) return { result };
			const last = result.matches[result.matches.length - 1];
			if (last && last.route.loadChildren && !last.route.children) {
				try {
					const module = await loadRouteChildren(last.route);
					last.route.children = module.routes;
				} catch (error) {
					console.error("Failed to load child routes:", error);
					return {
						result,
						error: `Failed to load child routes: ${error instanceof Error ? error.message : String(error)}`
					};
				}
				if (!isCurrent()) return {
					result,
					superseded: true
				};
				continue;
			}
			const pendingComponents = result.matches.filter((match) => match.route.loadComponent).map((match) => loadRouteComponent(match.route));
			if (pendingComponents.length > 0) {
				try {
					await Promise.all(pendingComponents);
				} catch (error) {
					console.error("Failed to load component:", error);
					return {
						result,
						error: `Failed to load component: ${error instanceof Error ? error.message : String(error)}`
					};
				}
				if (!isCurrent()) return {
					result,
					superseded: true
				};
			}
			return { result };
		}
		return {
			result: this.matchPath(path),
			error: `Route '${path}' exceeded ${MAX_LAZY_LOADS} lazy child loads`
		};
	}
	parseUrl(url) {
		return parseUrlParts(url);
	}
	normalizePath(url) {
		const { pathname } = this.parseUrl(url);
		return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	}
	targetPathname() {
		return this._pendingTarget ? this._pendingTarget.pathname : window.location.pathname;
	}
	targetQueryParams() {
		return new URLSearchParams(this._pendingTarget ? this._pendingTarget.queryParams : window.location.search);
	}
	setCurrentMatches(result) {
		this._currentMatches = result.matches;
		this._contextService.setMatchResult(result);
	}
	commit(result) {
		this.setCurrentMatches(result);
		this.publishRouteState(result);
		this._committedRoute.set(result);
	}
	publishRouteState(result) {
		this._params.set({ ...result.params });
		this._queryParams.set(this.targetQueryParams());
		this._resolvedData.set(this._contextService.getMergedResolvedData());
	}
	async initialNavigation() {
		const navId = ++this._navigationId;
		const currentUrl = `${window.location.pathname}${window.location.search}`;
		this.emit("start", navId, currentUrl, "initial");
		const resolved = await this.resolveMatch(window.location.pathname, () => this._navigationId === navId);
		if (resolved.superseded || this._navigationId !== navId) {
			this.emit("superseded", navId, currentUrl, "initial");
			return {
				success: false,
				error: "Navigation superseded"
			};
		}
		const matchResult = resolved.result;
		if (matchResult.redirectTo) {
			if (this.normalizePath(window.location.pathname) !== this.normalizePath(matchResult.redirectTo)) {
				this.emit("redirect", navId, currentUrl, "initial", { redirectTo: matchResult.redirectTo });
				return this.navigateInternal(matchResult.redirectTo, { replace: true }, {
					chain: [currentUrl],
					skipDeactivation: true
				});
			}
			const message = `Route '${currentUrl}' redirects to itself`;
			console.error(`[Melodic] ${message}`);
			this.emit("error", navId, currentUrl, "initial", { error: message });
			this.commit({
				matches: [],
				params: {},
				isExactMatch: false
			});
			return {
				success: false,
				error: message
			};
		}
		if (resolved.error) {
			this.commit({
				matches: [],
				params: {},
				isExactMatch: false
			});
			this.emit("error", navId, currentUrl, "initial", { error: resolved.error });
			return {
				success: false,
				error: resolved.error
			};
		}
		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				this.emit("superseded", navId, currentUrl, "initial");
				return {
					success: false,
					error: "Navigation superseded"
				};
			}
			if (guardResult !== true) {
				if (typeof guardResult === "string") {
					this.emit("redirect", navId, currentUrl, "initial", { redirectTo: guardResult });
					return this.navigateInternal(guardResult, { replace: true }, {
						chain: [currentUrl],
						skipDeactivation: true
					});
				}
				this.emit("blocked", navId, currentUrl, "initial", { error: "Navigation blocked by guard" });
				return {
					success: false,
					error: "Navigation blocked by guard"
				};
			}
			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				this.emit("superseded", navId, currentUrl, "initial");
				return {
					success: false,
					error: "Navigation superseded"
				};
			}
			if (!resolverResult.success) {
				this.commit({
					matches: [],
					params: {},
					isExactMatch: false
				});
				const error = resolverResult.error ?? "Navigation blocked by resolver";
				this.emit("error", navId, currentUrl, "initial", { error });
				return {
					success: false,
					error
				};
			}
		}
		this._currentPath = currentUrl;
		this.commit(matchResult);
		this.emit("end", navId, currentUrl, "initial", { result: matchResult });
		return {
			success: true,
			url: currentUrl
		};
	}
	async navigate(path, options = {}) {
		return this.navigateInternal(path, options, null);
	}
	async navigateInternal(path, options, redirect) {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false, scrollToTop = true, onSameUrlNavigation = "ignore" } = options;
		const fullPath = appendQueryParams(path, queryParams);
		const chain = redirect ? redirect.chain : [];
		const skipDeactivation = skipGuards || (redirect?.skipDeactivation ?? false);
		const navId = ++this._navigationId;
		const { pathname, search, hash } = this.parseUrl(fullPath);
		this._pendingTarget = {
			pathname,
			queryParams: new URLSearchParams(search)
		};
		this.emit("start", navId, fullPath, "imperative");
		if (chain.length >= MAX_REDIRECTS) {
			const error = `Redirect limit (${MAX_REDIRECTS}) exceeded: ${[...chain, fullPath].join(" → ")}`;
			console.error(`[Melodic] ${error}`);
			this._pendingTarget = null;
			this.emit("error", navId, fullPath, "imperative", { error });
			return {
				success: false,
				error
			};
		}
		const superseded = () => {
			this.emit("superseded", navId, fullPath, "imperative");
			return {
				success: false,
				error: "Navigation superseded"
			};
		};
		const redirectOptions = () => ({
			replace,
			scrollToTop,
			skipResolvers
		});
		try {
			const targetUrl = `${pathname}${search}`;
			if (onSameUrlNavigation === "ignore" && targetUrl === this._currentPath && this._committedRoute() !== null) {
				if (hash) {
					this.pushOrReplace(replace, data, fullPath);
					this.scrollToHash(hash.slice(1));
				} else if (scrollToTop) window.scrollTo(0, 0);
				this.emit("end", navId, fullPath, "imperative", { result: this._committedRoute() ?? void 0 });
				return {
					success: true,
					url: fullPath
				};
			}
			if (!skipDeactivation && this._currentMatches.length > 0) {
				const deactivateResult = await this.runDeactivationGuards(fullPath);
				if (this._navigationId !== navId) return superseded();
				if (deactivateResult !== true) {
					if (typeof deactivateResult === "string") {
						this.emit("redirect", navId, fullPath, "imperative", { redirectTo: deactivateResult });
						return this.navigateInternal(deactivateResult, redirectOptions(), {
							chain: [...chain, fullPath],
							skipDeactivation: true
						});
					}
					this.emit("blocked", navId, fullPath, "imperative", { error: "Navigation blocked by guard" });
					return {
						success: false,
						error: "Navigation blocked by guard"
					};
				}
			}
			const resolved = await this.resolveMatch(path, () => this._navigationId === navId);
			if (resolved.superseded || this._navigationId !== navId) return superseded();
			const matchResult = resolved.result;
			if (matchResult.redirectTo) {
				this.emit("redirect", navId, fullPath, "imperative", { redirectTo: matchResult.redirectTo });
				return this.navigateInternal(matchResult.redirectTo, {
					...options,
					queryParams: void 0
				}, {
					chain: [...chain, fullPath],
					skipDeactivation: true
				});
			}
			if (resolved.error) {
				this.emit("error", navId, fullPath, "imperative", { error: resolved.error });
				return {
					success: false,
					error: resolved.error
				};
			}
			if (!skipGuards && matchResult.matches.length > 0) {
				const guardResult = await this.runGuards(matchResult);
				if (this._navigationId !== navId) return superseded();
				if (guardResult !== true) {
					if (typeof guardResult === "string") {
						this.emit("redirect", navId, fullPath, "imperative", { redirectTo: guardResult });
						return this.navigateInternal(guardResult, redirectOptions(), {
							chain: [...chain, fullPath],
							skipDeactivation: true
						});
					}
					this.emit("blocked", navId, fullPath, "imperative", { error: "Navigation blocked by guard" });
					return {
						success: false,
						error: "Navigation blocked by guard"
					};
				}
			}
			if (!skipResolvers && matchResult.matches.length > 0) {
				const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
				if (this._navigationId !== navId) return superseded();
				if (!resolverResult.success) {
					const error = resolverResult.error ?? "Navigation blocked by resolver";
					this.emit("error", navId, fullPath, "imperative", { error });
					return {
						success: false,
						error
					};
				}
			}
			this.setCurrentMatches(matchResult);
			this.rememberScrollPosition();
			this.pushOrReplace(replace, data, fullPath);
			this._currentPath = targetUrl;
			this.publishRouteState(matchResult);
			this._committedRoute.set(matchResult);
			if (hash) this.scrollToHash(hash.slice(1));
			else if (scrollToTop) window.scrollTo(0, 0);
			this.emit("end", navId, fullPath, "imperative", { result: matchResult });
			return {
				success: true,
				url: fullPath
			};
		} finally {
			if (this._navigationId === navId) this._pendingTarget = null;
		}
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
		this.navigate(path, {
			replace: true,
			data
		});
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
			console.error(`[Melodic] ${method} guard for '${context.targetPath}' threw; treating as blocked:`, error);
			return false;
		}
	}
	createGuardContext(match, matchResult) {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			queryParams: this.targetQueryParams(),
			targetPath: this.targetPathname(),
			currentPath: window.location.pathname,
			data: match.route.data
		};
	}
	async runResolvers(matchResult, isCurrent = () => true) {
		const collected = [];
		for (let depth = 0; depth < matchResult.matches.length; depth++) {
			const match = matchResult.matches[depth];
			const resolvers = match.route.resolve;
			if (!resolvers) continue;
			const context = this.createResolverContext(match, matchResult);
			const entries = Object.entries(resolvers);
			const settled = await Promise.all(entries.map(async ([key, resolver]) => {
				try {
					return {
						key,
						value: await this.executeResolver(resolver, context)
					};
				} catch (error) {
					return {
						key,
						error
					};
				}
			}));
			const failure = settled.find((entry) => "error" in entry);
			if (failure && "error" in failure) {
				const error = failure.error;
				console.error(`[Melodic] Resolver '${failure.key}' for '${match.fullPath}' failed:`, error);
				return {
					success: false,
					error: `Resolver '${failure.key}' failed: ${error instanceof Error ? error.message : String(error)}`
				};
			}
			const resolvedData = {};
			for (const entry of settled) resolvedData[entry.key] = entry.value;
			collected.push({
				depth,
				data: resolvedData
			});
		}
		if (!isCurrent()) return {
			success: false,
			error: "Navigation superseded"
		};
		this._contextService.clearResolvedData();
		for (const { depth, data } of collected) this._contextService.setResolvedData(depth, data);
		return { success: true };
	}
	async handlePopState(event) {
		if (this._ignorePopStates > 0) {
			this._ignorePopStates--;
			this._historyIndex = this.readHistoryIndex(event.state) ?? this._historyIndex;
			return;
		}
		const targetPath = `${window.location.pathname}${window.location.search}`;
		const previousPath = this._currentPath;
		const previousIndex = this._historyIndex;
		const targetIndex = this.readHistoryIndex(event.state);
		this.rememberScrollPosition(previousIndex);
		if (targetPath === previousPath && this._committedRoute() !== null) {
			this._historyIndex = targetIndex ?? this._historyIndex;
			if (window.location.hash) this.scrollToHash(window.location.hash.slice(1));
			else this.restoreScrollPosition(this._historyIndex);
			return;
		}
		const navId = ++this._navigationId;
		this.emit("start", navId, targetPath, "popstate");
		const revert = () => {
			if (targetIndex !== null) {
				this._ignorePopStates++;
				history.go(previousIndex - targetIndex);
			} else history.replaceState(event.state, "", previousPath);
		};
		const deactivateResult = await this.runDeactivationGuards(targetPath);
		if (this._navigationId !== navId) {
			this.emit("superseded", navId, targetPath, "popstate");
			return;
		}
		if (deactivateResult !== true) {
			if (typeof deactivateResult === "string") {
				this.emit("redirect", navId, targetPath, "popstate", { redirectTo: deactivateResult });
				await this.navigateInternal(deactivateResult, { replace: true }, {
					chain: [targetPath],
					skipDeactivation: true
				});
			} else {
				this.emit("blocked", navId, targetPath, "popstate", { error: "Navigation blocked by guard" });
				revert();
			}
			return;
		}
		this._historyIndex = targetIndex ?? this._historyIndex;
		const resolved = await this.resolveMatch(window.location.pathname, () => this._navigationId === navId);
		if (resolved.superseded || this._navigationId !== navId) {
			this.emit("superseded", navId, targetPath, "popstate");
			return;
		}
		const matchResult = resolved.result;
		if (matchResult.redirectTo) {
			this.emit("redirect", navId, targetPath, "popstate", { redirectTo: matchResult.redirectTo });
			await this.navigateInternal(matchResult.redirectTo, { replace: true }, {
				chain: [targetPath],
				skipDeactivation: true
			});
			return;
		}
		if (resolved.error) {
			this._currentPath = targetPath;
			this.commit({
				matches: [],
				params: {},
				isExactMatch: false
			});
			this.emit("error", navId, targetPath, "popstate", { error: resolved.error });
			return;
		}
		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				this.emit("superseded", navId, targetPath, "popstate");
				return;
			}
			if (guardResult !== true) {
				if (typeof guardResult === "string") {
					this.emit("redirect", navId, targetPath, "popstate", { redirectTo: guardResult });
					await this.navigateInternal(guardResult, { replace: true }, {
						chain: [targetPath],
						skipDeactivation: true
					});
				} else {
					this.emit("blocked", navId, targetPath, "popstate", { error: "Navigation blocked by guard" });
					this._historyIndex = previousIndex;
					revert();
				}
				return;
			}
			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				this.emit("superseded", navId, targetPath, "popstate");
				return;
			}
			if (!resolverResult.success) {
				this._currentPath = targetPath;
				this.commit({
					matches: [],
					params: {},
					isExactMatch: false
				});
				this.emit("error", navId, targetPath, "popstate", { error: resolverResult.error ?? "Navigation blocked by resolver" });
				return;
			}
		}
		this._currentPath = targetPath;
		this.commit(matchResult);
		if (window.location.hash) this.scrollToHash(window.location.hash.slice(1));
		else this.restoreScrollPosition(this._historyIndex);
		this.emit("end", navId, targetPath, "popstate", { result: matchResult });
		const navigationEvent = new CustomEvent("NavigationEvent", { detail: routerStateEvent("push", event.state, "", window.location.pathname) });
		window.dispatchEvent(navigationEvent);
	}
	pushOrReplace(replace, data, fullPath) {
		const index = replace ? this._historyIndex : this._historyIndex + 1;
		const state = this.stampHistoryIndex(data, index);
		if (replace) history.replaceState(state, "", fullPath);
		else {
			history.pushState(state, "", fullPath);
			for (const key of [...this._scrollPositions.keys()]) if (key >= index) this._scrollPositions.delete(key);
		}
		this._historyIndex = index;
	}
	stampHistoryIndex(data, index) {
		if (data === null || data === void 0) return { [HISTORY_INDEX_KEY]: index };
		if (typeof data === "object") return {
			...data,
			[HISTORY_INDEX_KEY]: index
		};
		return data;
	}
	readHistoryIndex(state) {
		if (state && typeof state === "object") {
			const value = state[HISTORY_INDEX_KEY];
			if (typeof value === "number") return value;
		}
		return null;
	}
	rememberScrollPosition(index = this._historyIndex) {
		if (!this._scrollRestoration) return;
		this._scrollPositions.set(index, {
			x: window.scrollX,
			y: window.scrollY
		});
	}
	restoreScrollPosition(index) {
		if (!this._scrollRestoration) return;
		const position = this._scrollPositions.get(index);
		this.afterRender(() => window.scrollTo(position?.x ?? 0, position?.y ?? 0));
	}
	scrollToHash(id) {
		if (!id) return;
		this.afterRender(() => {
			this.findDeep(document, id)?.scrollIntoView();
		});
	}
	findDeep(root, id) {
		const direct = typeof root.getElementById === "function" ? root.getElementById(id) : root.querySelector(`[id="${id.replace(/["\\]/g, "\\$&")}"]`);
		if (direct) return direct;
		for (const element of root.querySelectorAll("*")) if (element.shadowRoot) {
			const found = this.findDeep(element.shadowRoot, id);
			if (found) return found;
		}
		return null;
	}
	afterRender(fn) {
		queueMicrotask(() => {
			if (typeof requestAnimationFrame === "function") requestAnimationFrame(fn);
			else fn();
		});
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
			queryParams: this.targetQueryParams(),
			targetPath: this.targetPathname()
		};
	}
};
RouterService = __decorate([Injectable(), __decorateMetadata("design:paramtypes", [])], RouterService);
var SAFE_SCHEMES = new Set(["http", "https"]);
function isSafeUrl(url) {
	if (!url) return true;
	const normalized = url.replace(/[\t\n\r]/g, "").replace(/^[\u0000-\u0020]+/, "");
	const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
	if (!schemeMatch) return true;
	return SAFE_SCHEMES.has(schemeMatch[1].toLowerCase());
}
var RouterLinkCore = class {
	constructor(host, getAnchor) {
		this._options = { href: "" };
		this._appliedActiveClass = null;
		this._cleanups = [];
		this._host = host;
		this._getAnchor = getAnchor ?? (() => host.tagName.toLowerCase() === "a" ? host : null);
		this._router = Injector.get(RouterService);
		const clickHandler = (e) => this.handleClick(e);
		const auxClickHandler = (e) => this.handleAuxClick(e);
		const navigationHandler = () => this.updateActiveState();
		host.addEventListener("click", clickHandler);
		host.addEventListener("auxclick", auxClickHandler);
		window.addEventListener("NavigationEvent", navigationHandler);
		this._cleanups.push(() => host.removeEventListener("click", clickHandler), () => host.removeEventListener("auxclick", auxClickHandler), () => window.removeEventListener("NavigationEvent", navigationHandler));
	}
	setOptions(options) {
		this._options = options;
		this.applyHref();
		this.updateActiveState();
	}
	destroy() {
		this._cleanups.forEach((cleanup) => cleanup());
		this._cleanups = [];
	}
	buildFullPath() {
		let path = this._options.href ?? "";
		const queryParams = this._options.queryParams;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			path = `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
		}
		return path;
	}
	isSafe() {
		return isSafeUrl(this._options.href ?? "") && isSafeUrl(this.buildFullPath());
	}
	warnUnsafe() {
		console.warn(`routerLink: blocked unsafe URL '${this._options.href}'. Only http(s), relative, query and hash URLs are allowed.`);
	}
	applyHref() {
		const anchor = this._getAnchor();
		if (!anchor) return;
		if (this.isSafe()) anchor.href = this.buildFullPath();
		else {
			this.warnUnsafe();
			anchor.removeAttribute("href");
		}
	}
	handleClick(e) {
		if (e.defaultPrevented) return;
		if (e.button !== void 0 && e.button !== 0) return;
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
			if (!this._getAnchor()) this.openInNewTab();
			return;
		}
		e.preventDefault();
		if (!this.isSafe()) {
			this.warnUnsafe();
			return;
		}
		const { href, data = null, replace = false, queryParams = {} } = this._options;
		const navOptions = {
			data,
			replace,
			queryParams
		};
		this._router.navigate(href, navOptions);
	}
	handleAuxClick(e) {
		if (e.defaultPrevented || e.button !== 1) return;
		if (this._getAnchor()) return;
		e.preventDefault();
		this.openInNewTab();
	}
	openInNewTab() {
		if (!this.isSafe()) {
			this.warnUnsafe();
			return;
		}
		window.open(this.buildFullPath(), "_blank");
	}
	updateActiveState() {
		const { href = "", activeClass = "active", exactMatch = false } = this._options;
		const currentPath = window.location.pathname;
		const linkPath = (href.startsWith("/") ? href : `/${href}`).split(/[?#]/)[0];
		const normalizedCurrentPath = currentPath.replace(/\/$/, "") || "/";
		const normalizedLinkPath = linkPath.replace(/\/$/, "") || "/";
		let isActive;
		if (exactMatch) isActive = normalizedCurrentPath === normalizedLinkPath;
		else isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + "/");
		if (this._appliedActiveClass && this._appliedActiveClass !== activeClass) this._host.classList.remove(this._appliedActiveClass);
		const ariaTarget = this._getAnchor();
		if (isActive) {
			this._host.classList.add(activeClass);
			this._appliedActiveClass = activeClass;
			ariaTarget?.setAttribute("aria-current", "page");
		} else {
			this._host.classList.remove(activeClass);
			this._appliedActiveClass = null;
			ariaTarget?.removeAttribute("aria-current");
		}
	}
};
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
function provideRouter(routes, options = {}) {
	return (injector) => {
		installHistoryEvents();
		const router = injector.get(RouterService);
		if (options.scrollRestoration === false) router.enableScrollRestoration(false);
		if (routes && routes.length > 0) router.setRoutes(routes);
	};
}
function isDirective(value) {
	return typeof value === "object" && value !== null && value.__directive === true && typeof value.render === "function";
}
function clearBetween(start, end, keep) {
	const parent = start.parentNode;
	if (!parent) return;
	let node = start.nextSibling;
	while (node && node !== end) {
		const next = node.nextSibling;
		if (node !== keep) parent.removeChild(node);
		node = next;
	}
}
function removeRange(start, end) {
	let node = start;
	while (node) {
		const next = node.nextSibling;
		node.parentNode?.removeChild(node);
		if (node === end) break;
		node = next;
	}
}
function moveRange(start, end, referenceNode) {
	const parent = referenceNode.parentNode;
	if (!parent) return;
	const fragment = document.createDocumentFragment();
	let node = start;
	while (node) {
		const next = node.nextSibling;
		fragment.appendChild(node);
		if (node === end) break;
		node = next;
	}
	parent.insertBefore(fragment, referenceNode);
}
function renderDetachedItem(template, container, start, end) {
	const target = container;
	const structureChanged = target.__parts !== void 0 && target.__templateKey !== template.templateKey;
	template.renderInto(container);
	if (!structureChanged) return false;
	clearBetween(start, end);
	end.parentNode?.insertBefore(container, end);
	return true;
}
var MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
var COMMENT_NODE_MARKER = `<!--${MARKER}-->`;
var ATTRIBUTE_MARKER_PREFIX = `__${MARKER}_`;
var ATTRIBUTE_MARKER_REGEX = new RegExp(`${ATTRIBUTE_MARKER_PREFIX}(\\d+)__`, "g");
var createAttributeMarker = (index) => `${ATTRIBUTE_MARKER_PREFIX}${index}__`;
var templateCache = /* @__PURE__ */ new Map();
function scanTagState(text, state) {
	let { inTag, quote } = state;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (inTag) {
			if (quote) {
				if (char === quote) quote = null;
				continue;
			}
			if (char === "\"" || char === "'") {
				quote = char;
				continue;
			}
			if (char === ">") inTag = false;
			continue;
		}
		if (char !== "<") continue;
		if (text.startsWith("<!--", i)) {
			const end = text.indexOf("-->", i + 4);
			if (end === -1) return {
				inTag: false,
				quote: null
			};
			i = end + 2;
			continue;
		}
		if (text.startsWith("</", i)) {
			const end = text.indexOf(">", i);
			if (end === -1) return {
				inTag: true,
				quote: null
			};
			i = end;
			continue;
		}
		if (/[a-zA-Z]/.test(text[i + 1] ?? "")) inTag = true;
	}
	return {
		inTag,
		quote
	};
}
var warnedUnsafeProperties = /* @__PURE__ */ new Set();
function warnUnsafePropertyBinding(name) {
	if (warnedUnsafeProperties.has(name)) return;
	if (!isDevMode()) return;
	warnedUnsafeProperties.add(name);
	console.warn(`[Melodic] Property binding ".${name}" assigns raw HTML and is an XSS hazard if the value is not fully trusted. Prefer text interpolation, or unsafeHTML() with sanitized content.`);
}
function warnUnkeyedArrayChurn(state, recreated, total) {
	if (state.warnedChurn || recreated < 2 || total < 2) return;
	if (!isDevMode()) return;
	state.warnedChurn = true;
	console.warn(`[Melodic] An interpolated array rebuilt ${recreated} of ${total} items on one update. Unkeyed arrays are reused by index, so entries that change position lose their DOM nodes (and with them focus, scroll position, and in-flight clicks). Use repeat(items, keyFn, template) to track items by identity instead.`);
}
var warnedPartiallyKeyedParts = /* @__PURE__ */ new WeakSet();
function warnPartiallyKeyedArray(part, values) {
	if (!isDevMode() || warnedPartiallyKeyedParts.has(part)) return;
	let keyed = 0;
	for (const value of values) if (value && typeof value === "object" && value.__keyed === true) keyed++;
	if (keyed === 0 || keyed === values.length) return;
	warnedPartiallyKeyedParts.add(part);
	console.warn(`[Melodic] An interpolated array mixes keyed and unkeyed items (${keyed} of ${values.length} keyed). Keyed diffing requires every item to carry a key, so this array falls back to index-based reuse. Key every item, or none.`);
}
var ANY_MARKER_REGEX = /* @__PURE__ */ new RegExp(`${COMMENT_NODE_MARKER}|${ATTRIBUTE_MARKER_PREFIX}\\d+__|__(?:event|prop|action|bool)-\\d+__`);
function describeSnippet(html$1, index) {
	const start = Math.max(0, index - 40);
	const end = Math.min(html$1.length, index + 80);
	const snippet = html$1.slice(start, end).replace(new RegExp(`${COMMENT_NODE_MARKER}|${ATTRIBUTE_MARKER_PREFIX}\\d+__|__(?:event|prop|action|bool)-\\d+__=""`, "g"), "${…}").replace(/\s+/g, " ").trim();
	return `${start > 0 ? "…" : ""}${snippet}${end < html$1.length ? "…" : ""}`;
}
function warnUnsupportedBinding(position, html$1, index) {
	console.warn(`[Melodic] Template contains a binding in an unsupported position (${position}). The parser cannot track bindings here, so the value will not render or update. Offending template: ${describeSnippet(html$1, index)}`);
}
function warnUnsupportedBindingPositions(html$1) {
	if (!isDevMode()) return false;
	let warned$1 = false;
	const report = (position, index) => {
		warned$1 = true;
		warnUnsupportedBinding(position, html$1, index);
	};
	const rawTextRegex = /<(textarea|title)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>/gi;
	let rawTextMatch;
	while ((rawTextMatch = rawTextRegex.exec(html$1)) !== null) if (ANY_MARKER_REGEX.test(rawTextMatch[2])) report(`inside <${rawTextMatch[1].toLowerCase()}> content`, rawTextMatch.index);
	const tagNameIndex = html$1.search(/* @__PURE__ */ new RegExp(`</?${COMMENT_NODE_MARKER}`));
	if (tagNameIndex !== -1) report("tag-name position", tagNameIndex);
	let searchFrom = 0;
	for (;;) {
		const open = html$1.indexOf("<!--", searchFrom);
		if (open === -1) break;
		if (html$1.startsWith(COMMENT_NODE_MARKER, open)) {
			searchFrom = open + COMMENT_NODE_MARKER.length;
			continue;
		}
		const close = html$1.indexOf("-->", open + 4);
		const content = close === -1 ? html$1.slice(open + 4) : html$1.slice(open + 4, close);
		if (content.includes(MARKER) || /__(?:event|prop|action|bool)-\d+__/.test(content)) report("inside an HTML comment", open);
		searchFrom = close === -1 ? html$1.length : close + 3;
	}
	return warned$1;
}
function warnLeakedBindings(partPaths, expressionCount, html$1) {
	if (!isDevMode()) return;
	const anchored = /* @__PURE__ */ new Set();
	for (const partPath of partPaths) if (partPath.attributeIndices) for (const index of partPath.attributeIndices) anchored.add(index);
	else if (partPath.index >= 0) anchored.add(partPath.index);
	const lost = [];
	for (let index = 0; index < expressionCount; index++) if (!anchored.has(index)) lost.push(index);
	if (lost.length === 0) return;
	const markerIndex = html$1.indexOf(createAttributeMarker(lost[0]));
	console.warn(`[Melodic] Template part marker leaked: ${lost.length} binding${lost.length === 1 ? "" : "s"} (value index ${lost.join(", ")}) could not be anchored to the parsed template and will never render or update. The usual cause is an unbalanced quote in an attribute value, which swallows the markup that follows it. Offending template: ${describeSnippet(html$1, markerIndex === -1 ? 0 : markerIndex)}`);
}
function extractListenerOptions(value) {
	const { capture, once, passive } = value;
	if (capture === void 0 && once === void 0 && passive === void 0) return;
	const options = {};
	if (capture !== void 0) options.capture = capture;
	if (once !== void 0) options.once = once;
	if (passive !== void 0) options.passive = passive;
	return options;
}
function sameListenerOptions(a, b) {
	return !!a?.capture === !!b?.capture && !!a?.once === !!b?.once && !!a?.passive === !!b?.passive;
}
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
	get templateKey() {
		return getTemplateKey(this.strings);
	}
	renderOnce(container) {
		const target = container;
		const templateKey = getTemplateKey(this.strings);
		const cache = this.getTemplate(templateKey);
		const clone = cache.element.content.cloneNode(true);
		const parts = this.prepareParts(clone, cache);
		this.commit(parts);
		target.appendChild(clone);
		target.__parts = parts;
		target.__templateKey = templateKey;
		return Array.from(target.childNodes);
	}
	renderInto(container) {
		const target = container;
		const templateKey = getTemplateKey(this.strings);
		const existingKey = target.__templateKey;
		if (existingKey && existingKey !== templateKey) {
			if (target.__parts) disposeParts(target.__parts);
			delete target.__parts;
		}
		if (!target.__parts) {
			const cache = this.getTemplate(templateKey);
			const clone = cache.element.content.cloneNode(true);
			const parts = this.prepareParts(clone, cache);
			target.__parts = parts;
			target.__templateKey = templateKey;
			this.commit(parts);
			target.textContent = "";
			target.appendChild(clone);
			return;
		}
		if (!target.__templateKey) target.__templateKey = templateKey;
		this.commit(target.__parts);
	}
	getTemplate(key) {
		let cached$1 = templateCache.get(key);
		if (cached$1) {
			templateCache.delete(key);
			templateCache.set(key, cached$1);
			return cached$1;
		}
		const parts = [];
		let html$1 = this.strings[0];
		const attrPreProcessor = this.getAttributePreProcessor(parts);
		let activeAttributeName = null;
		let activeAttributeQuote = null;
		let tagState = scanTagState(html$1, {
			inTag: false,
			quote: null
		});
		for (let i = 1; i < this.strings.length; i++) {
			let s = this.strings[i];
			const valueIndex = i - 1;
			const match = tagState.inTag ? /([@.:?]?[\w:-]+)\s*=\s*["']?$/.exec(html$1) : null;
			const doubleQuotedAttrMatch = tagState.inTag ? /([@.:?]?[\w:-]+)\s*=\s*(")([^"]*)$/.exec(html$1) : null;
			const singleQuotedAttrMatch = tagState.inTag ? /([@.:?]?[\w:-]+)\s*=\s*(')([^']*)$/.exec(html$1) : null;
			const quotedAttrMatch = doubleQuotedAttrMatch && singleQuotedAttrMatch ? doubleQuotedAttrMatch.index >= singleQuotedAttrMatch.index ? doubleQuotedAttrMatch : singleQuotedAttrMatch : doubleQuotedAttrMatch ?? singleQuotedAttrMatch;
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
					} else {
						const consumedQuote = attrKey !== "___" && match ? /(["'])$/.exec(match[0])?.[1] ?? null : null;
						html$1 = attrPreProcessor[attrKey](valueIndex, html$1, match ? match[1] : void 0, match);
						if (consumedQuote && s.startsWith(consumedQuote)) s = s.slice(1);
					}
				}
			}
			html$1 += s;
			tagState = scanTagState(s, tagState);
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
		const hasUnsupportedBinding = warnUnsupportedBindingPositions(html$1);
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
		if (!hasUnsupportedBinding) warnLeakedBindings(partPaths, this.strings.length - 1, html$1);
		cached$1 = {
			element,
			parts,
			partPaths
		};
		if (templateCache.size >= 500) {
			const oldestKey = templateCache.keys().next().value;
			if (oldestKey) templateCache.delete(oldestKey);
		}
		templateCache.set(key, cached$1);
		return cached$1;
	}
	commitCompositeAttribute(part, element) {
		const name = part.name;
		const strings = part.attributeStrings;
		const indices = part.attributeIndices;
		let composed = strings[0] ?? "";
		const directiveSegments = [];
		for (let i = 0; i < indices.length; i++) {
			const segmentValue = this.values[indices[i]];
			if (isDirective(segmentValue)) {
				directiveSegments.push({
					index: indices[i],
					value: segmentValue
				});
				composed += strings[i + 1] ?? "";
			} else composed += `${segmentValue ?? ""}${strings[i + 1] ?? ""}`;
		}
		if (part.segmentDirectiveStates) {
			for (const [index, entry] of part.segmentDirectiveStates) if (!directiveSegments.some((segment) => segment.index === index)) {
				disposeDirectiveState(entry.state);
				part.segmentDirectiveStates.delete(index);
			}
		}
		if (part.previousValue !== composed) {
			if (composed === "" && directiveSegments.length === 0 && strings.every((segment) => segment === "")) element.removeAttribute(name);
			else element.setAttribute(name, composed);
			part.previousValue = composed;
			if (part.segmentDirectiveStates) {
				for (const entry of part.segmentDirectiveStates.values()) disposeDirectiveState(entry.state);
				part.segmentDirectiveStates.clear();
			}
		}
		if (directiveSegments.length === 0) return;
		const states = part.segmentDirectiveStates ??= /* @__PURE__ */ new Map();
		for (const segment of directiveSegments) {
			const existing = states.get(segment.index);
			if (existing && existing.type !== segment.value.type) {
				disposeDirectiveState(existing.state);
				states.delete(segment.index);
			}
			const state = segment.value.render(element, states.get(segment.index)?.state, name);
			states.set(segment.index, {
				state,
				type: segment.value.type
			});
		}
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
		if (part.nestedContainer) {
			disposeContainerParts(part.nestedContainer);
			part.nestedContainer = void 0;
		}
		if (part.renderedContainers) {
			for (const container of part.renderedContainers) disposeContainerParts(container);
			part.renderedContainers = void 0;
		}
		if (part.arrayState) {
			for (const item of part.arrayState.items) disposeContainerParts(item.container);
			part.arrayState = void 0;
		}
		if (part.positionalArrayState) {
			for (const item of part.positionalArrayState.items) disposeContainerParts(item.container);
			part.positionalArrayState = void 0;
		}
		if (part.startMarker && part.endMarker) clearBetween(part.startMarker, part.endMarker, part.node);
	}
	clearDirectiveDOM(part) {
		const state = part.directiveState;
		if (!state) return;
		disposeDirectiveState(state);
		if (typeof state !== "object") {
			part.directiveState = void 0;
			part.directiveType = void 0;
			return;
		}
		const { startMarker, endMarker } = state;
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
		part.directiveType = void 0;
	}
	renderNestedTemplate(part, template) {
		this.ensureMarkers(part);
		if (part.nestedContainer) {
			if (part.nestedContainer.__templateKey === getTemplateKey(template.strings)) {
				template.renderInto(part.nestedContainer);
				return;
			}
		}
		this.clearRenderedNodes(part);
		part.node.textContent = "";
		const container = document.createDocumentFragment();
		template.renderInto(container);
		part.nestedContainer = container;
		part.endMarker.parentNode.insertBefore(container, part.endMarker);
	}
	renderNode(part, node) {
		this.ensureMarkers(part);
		this.clearRenderedNodes(part);
		part.node.textContent = "";
		part.endMarker.parentNode.insertBefore(node, part.endMarker);
	}
	renderArray(part, values) {
		this.ensureMarkers(part);
		part.node.textContent = "";
		const parent = part.endMarker.parentNode;
		const keyedValues = this.getKeyedValues(values);
		if (keyedValues) {
			if (!part.arrayState) this.clearRenderedNodes(part);
			const previousItems = part.arrayState?.items ?? [];
			const available = /* @__PURE__ */ new Map();
			for (const item of previousItems) {
				const bucket = available.get(item.key);
				if (bucket) bucket.push(item);
				else available.set(item.key, [item]);
			}
			const seenKeys = /* @__PURE__ */ new Set();
			const nextItems = [];
			for (const item of keyedValues) {
				if (seenKeys.has(item.key)) devWarn("array-duplicate-key", `An interpolated keyed array contains a duplicate key (${String(item.key)}). Keys must be unique — entries sharing a key cannot be tracked apart across renders.`);
				seenKeys.add(item.key);
				const bucket = available.get(item.key);
				const existing = bucket?.shift();
				if (existing) {
					if (bucket.length === 0) available.delete(item.key);
					this.updateArrayItem(existing, item.value);
					nextItems.push(existing);
				} else {
					const created = this.createArrayItem(item.value, parent, part.endMarker);
					nextItems.push({
						key: item.key,
						...created
					});
				}
			}
			for (const bucket of available.values()) for (const oldItem of bucket) {
				disposeContainerParts(oldItem.container);
				removeRange(oldItem.start, oldItem.end);
			}
			let referenceNode = this.firstArrayNode(part);
			for (const item of nextItems) {
				if (item.start === referenceNode) {
					referenceNode = item.end.nextSibling ?? part.endMarker;
					continue;
				}
				moveRange(item.start, item.end, referenceNode);
			}
			part.arrayState = { items: nextItems };
			return;
		}
		warnPartiallyKeyedArray(part, values);
		this.renderPositionalArray(part, values, parent);
	}
	renderPositionalArray(part, values, parent) {
		const endMarker = part.endMarker;
		const isUpdate = part.positionalArrayState !== void 0;
		if (!isUpdate) this.clearRenderedNodes(part);
		const state = part.positionalArrayState ?? { items: [] };
		const items = state.items;
		let recreated = 0;
		for (let index = 0; index < values.length; index++) {
			const value = values[index];
			const existing = items[index];
			if (existing) {
				if (this.updateArrayItem(existing, value)) recreated++;
			} else items[index] = this.createArrayItem(value, parent, endMarker);
		}
		if (items.length > values.length) for (const removed of items.splice(values.length)) {
			disposeContainerParts(removed.container);
			removeRange(removed.start, removed.end);
		}
		part.positionalArrayState = state;
		if (isUpdate) warnUnkeyedArrayChurn(state, recreated, values.length);
	}
	firstArrayNode(part) {
		const textNode = part.node;
		if (textNode && textNode.parentNode === part.startMarker.parentNode && textNode.nextSibling) return textNode.nextSibling;
		return part.startMarker.nextSibling ?? part.endMarker;
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
		this.renderArrayItemValue(value, container);
		const start = document.createComment("item-start");
		const end = document.createComment("item-end");
		parent.insertBefore(start, endMarker);
		parent.insertBefore(container, endMarker);
		parent.insertBefore(end, endMarker);
		return {
			value,
			container,
			start,
			end
		};
	}
	renderArrayItemValue(value, container) {
		if (value instanceof TemplateResult) value.renderInto(container);
		else if (value instanceof Node) container.appendChild(value);
		else if (value !== null && value !== void 0) container.appendChild(document.createTextNode(String(value)));
	}
	updateArrayItem(item, value) {
		const hasPartTree = item.container.__parts !== void 0;
		if (value instanceof TemplateResult && hasPartTree) {
			const replaced = renderDetachedItem(value, item.container, item.start, item.end);
			item.value = value;
			return replaced;
		}
		if (!(value instanceof TemplateResult) && value === item.value) return false;
		const only = item.start.nextSibling;
		if (!(value instanceof TemplateResult) && !(value instanceof Node) && value !== null && value !== void 0 && !hasPartTree && only !== null && only.nextSibling === item.end && only.nodeType === Node.TEXT_NODE) {
			only.nodeValue = String(value);
			item.value = value;
			return false;
		}
		disposeContainerParts(item.container);
		clearBetween(item.start, item.end);
		item.container = document.createDocumentFragment();
		this.renderArrayItemValue(value, item.container);
		item.end.parentNode?.insertBefore(item.container, item.end);
		item.value = value;
		return true;
	}
	commitEventPart(part, value) {
		const element = part.node;
		const name = part.name;
		const isFunctionHandler = typeof value === "function";
		const isHandleEventObject = !isFunctionHandler && value !== null && typeof value === "object" && typeof value.handleEvent === "function";
		const active = isFunctionHandler || isHandleEventObject;
		const newOptions = isHandleEventObject ? extractListenerOptions(value) : void 0;
		if (!part.eventWrapper) part.eventWrapper = function(event) {
			const handler = part.eventHandler;
			if (typeof handler === "function") handler.call(this, event);
			else if (handler !== null && typeof handler === "object") handler.handleEvent(event);
		};
		const optionsChanged = !sameListenerOptions(part.eventOptions, newOptions);
		if (part.eventAttached && (!active || optionsChanged)) {
			element.removeEventListener(name, part.eventWrapper, part.eventOptions);
			part.eventAttached = false;
		}
		part.eventHandler = active ? value : void 0;
		part.eventOptions = newOptions;
		if (active && (!part.eventAttached || newOptions?.once)) {
			element.addEventListener(name, part.eventWrapper, newOptions);
			part.eventAttached = true;
		}
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
						if (nowDirective) {
							if (part.directiveState !== void 0 && part.directiveType !== value.type) this.clearDirectiveDOM(part);
							part.directiveState = value.render(part.node, part.directiveState);
							part.directiveType = value.type;
						} else if (value instanceof TemplateResult) this.renderNestedTemplate(part, value);
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
						if (isCompositeAttribute) {
							this.commitCompositeAttribute(part, element);
							continue;
						}
						if (!isDirective(value) && part.directiveState !== void 0) {
							disposeDirectiveState(part.directiveState);
							part.directiveState = void 0;
							part.directiveType = void 0;
						}
						if (isDirective(value)) {
							if (part.directiveState !== void 0 && part.directiveType !== value.type) {
								disposeDirectiveState(part.directiveState);
								part.directiveState = void 0;
							}
							part.directiveState = value.render(element, part.directiveState, part.name);
							part.directiveType = value.type;
						} else if (typeof value === "boolean" && part.name.startsWith("aria-")) element.setAttribute(part.name, String(value));
						else if (value === null || value === void 0 || value === false) element.removeAttribute(part.name);
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
					if (part.node && part.name) {
						if (!isDirective(value) && part.directiveState !== void 0) {
							disposeDirectiveState(part.directiveState);
							part.directiveState = void 0;
							part.directiveType = void 0;
						}
						if (isDirective(value)) {
							if (part.directiveState !== void 0 && part.directiveType !== value.type) {
								disposeDirectiveState(part.directiveState);
								part.directiveState = void 0;
							}
							part.directiveState = value.render(part.node, part.directiveState, part.name);
							part.directiveType = value.type;
						} else {
							if (part.name === "innerHTML" || part.name === "outerHTML") warnUnsafePropertyBinding(part.name);
							part.node[part.name] = value;
						}
					}
					break;
				case "event":
					if (part.node && part.name) this.commitEventPart(part, value);
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
var _ref;
var OUTLET_REGISTER_EVENT = "melodic:outlet-register";
var RouterOutletComponent = class RouterOutletComponent$1 {
	constructor() {
		this._depth = 0;
		this._context = null;
		this._currentComponent = null;
		this._currentSignature = null;
		this._currentElement = null;
		this._childOutlets = /* @__PURE__ */ new Map();
		this._parentOutlet = null;
		this._initialized = false;
		this._routeSubscriptionCleanup = null;
		this._renderGeneration = 0;
		this.routes = [];
		this.name = "primary";
	}
	onInit() {
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
			else {
				this._routeSubscriptionCleanup = this._router.committedRoute.subscribe((result) => {
					this.renderCommitted(result ?? null);
				});
				const committed = this._router.committedRoute();
				if (committed) this.renderCommitted(committed);
				else this._router.initialNavigation();
			}
		});
	}
	onDestroy() {
		this._renderGeneration++;
		this._routeSubscriptionCleanup?.();
		this._routeSubscriptionCleanup = null;
		if (this._parentOutlet) this._parentOutlet.unregisterChildOutlet(this.name);
	}
	onPropertyChange(name, oldValue, newValue) {
		if (name === "routes" && this._initialized) {
			this._currentComponent = null;
			this._currentSignature = null;
			if (this._depth === 0) {
				this._router.setRoutes(newValue ?? []);
				this._router.initialNavigation();
			}
		}
	}
	getDepth() {
		return this._depth;
	}
	getContext() {
		return this._context;
	}
	findParentOutlet() {
		let node = this.elementRef;
		for (let hops = 0; hops < 64; hops++) {
			const ancestor = node.parentElement?.closest?.("router-outlet");
			if (ancestor && ancestor !== this.elementRef) {
				this.adoptParentOutlet(ancestor);
				return;
			}
			const root = node.getRootNode();
			if (!(root instanceof ShadowRoot)) break;
			const host = root.host;
			if (host.tagName.toLowerCase() === "router-outlet" && host !== this.elementRef) {
				this.adoptParentOutlet(host);
				return;
			}
			node = host;
		}
		this._depth = 0;
	}
	adoptParentOutlet(element) {
		this._parentOutlet = element.component ?? null;
		this._depth = (this._parentOutlet?._depth ?? -1) + 1;
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
			parent: this._context,
			matches: this._context.matches
		};
	}
	async renderCommitted(result) {
		if (!this._initialized || !result) return;
		const routes = this.routes.length > 0 ? this.routes : this._router.getRoutes();
		if (routes.length === 0) return;
		if (result.matches.length > 0) {
			const match = result.matches[0];
			this._context = {
				depth: 0,
				routes,
				currentMatch: match,
				ancestorMatches: [match],
				params: match.params,
				remainingPath: match.remainingPath,
				basePath: "",
				parent: void 0,
				matches: result.matches
			};
			await this.renderMatch(match);
		} else await this.render404();
	}
	async renderFromContext() {
		if (!this._context || this.routes.length === 0) return;
		const match = this._context.matches?.[this._depth];
		if (match) {
			this._context = {
				...this._context,
				currentMatch: match,
				ancestorMatches: [...this._context.ancestorMatches, match],
				params: {
					...this._context.params,
					...match.params
				}
			};
			await this.renderMatch(match);
		} else await this.render404();
	}
	matchSignature(match) {
		return `${match.fullPath}|${JSON.stringify(match.params)}`;
	}
	async renderMatch(match) {
		const route = match.route;
		const signature = this.matchSignature(match);
		if (route.component === this._currentComponent) {
			if (signature !== this._currentSignature) {
				this._currentSignature = signature;
				this.notifyRouteChange(match);
			}
			this.updateChildOutlets();
			return;
		}
		this._currentSignature = signature;
		const generation = ++this._renderGeneration;
		if (route.loadComponent) {
			try {
				await route.loadComponent();
			} catch (error) {
				console.error("Failed to load component:", error);
				if (generation === this._renderGeneration) await this.render404();
				return;
			}
			if (generation !== this._renderGeneration) return;
		}
		if (route.component) await this.renderComponent(route.component);
		else {
			this.clearCurrentElement();
			this._currentComponent = null;
			this.updateChildOutlets();
		}
	}
	notifyRouteChange(match) {
		const element = this._currentElement;
		if (!element) return;
		element.component?.onRouteChange?.({
			params: { ...match.params },
			queryParams: this._router.getQueryParams(),
			resolvedData: this._router.getResolvedData(),
			match
		});
		element.requestRender?.();
	}
	clearCurrentElement() {
		if (this._currentElement) {
			this._currentElement.remove();
			this._currentElement = null;
		}
	}
	async renderComponent(componentTag) {
		const shadowRoot = this.elementRef.shadowRoot;
		if (!shadowRoot) return;
		this.clearCurrentElement();
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
		this._renderGeneration++;
		const notFoundRoute = this.routes.find((r) => r.path === "404" || r.path === "**");
		if (notFoundRoute?.component) await this.renderComponent(notFoundRoute.component);
		else if (this._depth === 0 && window.location.pathname !== "/404") this._router.navigate("/404", { replace: true });
	}
};
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref : Object)], RouterOutletComponent.prototype, "_router", void 0);
RouterOutletComponent = __decorate([MelodicComponent({
	selector: "router-outlet",
	template: () => html`<slot></slot>`
})], RouterOutletComponent);
var RouterLinkComponent = class RouterLinkComponent$1 {
	constructor() {
		this._anchorElement = null;
		this._core = null;
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
		this._core = new RouterLinkCore(this.elementRef, () => this._anchorElement);
		this.syncCore();
	}
	onDestroy() {
		this._core?.destroy();
		this._core = null;
	}
	onAttributeChange(attribute, _, newVal) {
		if (attribute === "href") {
			this.href = newVal;
			this.syncCore();
		} else if (attribute === "active-class") {
			this.activeClass = newVal;
			this.syncCore();
		}
	}
	onPropertyChange(name) {
		if (name === "href" || name === "queryParams" || name === "activeClass" || name === "exactMatch" || name === "replace" || name === "data") queueMicrotask(() => this.syncCore());
	}
	syncCore() {
		this._core?.setOptions({
			href: this.href,
			activeClass: this.activeClass,
			exactMatch: this.exactMatch,
			replace: this.replace,
			data: this.data,
			queryParams: this.queryParams
		});
	}
};
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
	const core = new RouterLinkCore(element);
	core.setOptions(options);
	element.setAttribute("router-link", "");
	return (() => {
		core.destroy();
	});
}
registerAttributeDirective("routerLink", routerLinkDirective);
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
	addEffect(actions, effect$1) {
		this._effects.push({
			actions,
			effect: effect$1
		});
	}
	getEffects() {
		return this._effects;
	}
};
var nextSelectorId = 0;
var selectorKeys = /* @__PURE__ */ new WeakMap();
function getSelectorCacheKey(selectFn) {
	let key = selectorKeys.get(selectFn);
	if (key === void 0) {
		key = `fn#${++nextSelectorId}`;
		selectorKeys.set(selectFn, key);
	}
	return key;
}
function getComponentCachedSelect(consumer, fullKey, create) {
	const cache = consumer.getSelectCache();
	const cached$1 = cache.get(fullKey);
	if (cached$1) {
		consumer.touchSelectEntry?.(fullKey);
		return cached$1;
	}
	const sig = create();
	cache.set(fullKey, sig);
	consumer.registerDisposable(sig);
	consumer.trackSelectEntry?.(fullKey, sig);
	return sig;
}
var nextInstanceId = 0;
var ComponentStateBaseService = class extends EffectsBase {
	constructor(_initState, _reducerConfig = { reducers: [] }, _debug = false) {
		super();
		this._initState = _initState;
		this._reducerConfig = _reducerConfig;
		this._debug = _debug;
		this._instanceId = ++nextInstanceId;
		this._state = signal(_initState);
	}
	get state() {
		return this._state();
	}
	resetState() {
		this._state.set(this._initState);
	}
	select(selectFn, cacheKey) {
		const consumer = getActiveComponent();
		if (consumer) return getComponentCachedSelect(consumer, `cs:${this._instanceId}::${cacheKey ?? getSelectorCacheKey(selectFn)}`, () => computed(() => selectFn(this._state())));
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
		this.getEffects().filter((effect$1) => effect$1.actions.some((a) => a().type === action.type)).forEach((effect$1) => {
			effect$1.effect(action).then((newAction) => {
				if (newAction === void 0) return;
				(Array.isArray(newAction) ? newAction : [newAction]).forEach((na) => this.dispatch(na));
			}).catch((error) => {
				console.error(`[ComponentState] Effect for action '${action.type}' failed:`, error);
			});
		});
	}
};
var SignalStoreService = class SignalStoreService$1 {
	constructor() {
		if (this._debug) console.info("RX State Debugging: Enabled");
	}
	select(key, selectFn, cacheKey) {
		const consumer = getActiveComponent();
		if (consumer) return getComponentCachedSelect(consumer, `${String(key)}::${cacheKey ?? getSelectorCacheKey(selectFn)}`, () => computed(() => selectFn(this._state[key]())));
		return computed(() => selectFn(this._state[key]()));
	}
	logState() {
		console.log(this.snapshot());
	}
	snapshot() {
		return untracked(() => this.getCurrentState());
	}
	snapshotSlice(key) {
		return untracked(() => this._state[key]());
	}
	dispatch(x, y) {
		const key = typeof x === "string" ? x : void 0;
		const action = typeof x === "string" ? y : x;
		if (this._debug) {
			console.log(`Action: ${action.type}`);
			console.log(`Payload:`, action.payload);
			console.log(`Current State:`, this.getCurrentState());
		}
		const before = devtoolsListening() ? this.snapshot() : void 0;
		if (key) this.dispatchWithKey(key, action);
		else this.dispatchWithoutKey(action);
		emitDevtools("store:dispatch", () => ({
			action: action.type,
			payload: action.payload,
			key,
			before,
			after: this.snapshot()
		}));
	}
	dispatchWithKey(key, action) {
		if (!this._reducerMap[key]) throw new Error(`Reducer not found for key: ${key}`);
		const matching = this._reducerMap[key].reducers.filter((reducer) => reducer.action.type === action.type);
		if (matching.length > 0) {
			batch(() => {
				let sliceState = this._state[key]();
				for (const reducer of matching) sliceState = reducer.reducer(sliceState, action);
				this._state[key].set(sliceState);
			});
			if (this._debug) console.log(`New State:`, this.getCurrentState());
		}
		const actionEffects = this.getEffectsForActionType(action.type).filter((entry) => entry.key === key).map((entry) => entry.effect);
		this.runEffects(actionEffects, action);
	}
	dispatchWithoutKey(action) {
		const reducerEntries = this.getReducersForActionType(action.type);
		if (reducerEntries.length > 0) {
			batch(() => {
				for (const { key, reducer } of reducerEntries) {
					const newState = reducer.reducer(this._state[key](), action);
					this._state[key].set(newState);
				}
			});
			if (this._debug) console.log(`New State:`, this.getCurrentState());
		}
		const actionEffects = this.getEffectsForActionType(action.type).map((entry) => entry.effect);
		this.runEffects(actionEffects, action);
	}
	runEffects(actionEffects, action) {
		actionEffects.forEach((effect$1) => {
			effect$1.effect(action).then((newAction) => {
				if (newAction === void 0) return;
				(Array.isArray(newAction) ? newAction : [newAction]).forEach((na) => {
					this.dispatch(na);
				});
			}).catch((error) => {
				console.error(`[SignalStore] Effect for action '${action.type}' failed:`, error);
			});
		});
	}
	getReducersForActionType(actionType) {
		if (!this._reducerIndex) {
			const index = /* @__PURE__ */ new Map();
			for (const key of Object.keys(this._reducerMap)) for (const reducer of this._reducerMap[key]?.reducers ?? []) {
				const type = reducer.action.type;
				let entries = index.get(type);
				if (!entries) {
					entries = [];
					index.set(type, entries);
				}
				entries.push({
					key,
					reducer
				});
			}
			this._reducerIndex = index;
		}
		return this._reducerIndex.get(actionType) ?? [];
	}
	getEffectsForActionType(actionType) {
		if (!this._effectIndex) {
			const index = /* @__PURE__ */ new Map();
			for (const key of Object.keys(this._effectMap)) {
				const effectClass = this._effectMap[key];
				if (!effectClass) continue;
				const effectService = Injector.get(effectClass);
				for (const effect$1 of effectService.getEffects()) for (const actionRef of effect$1.actions) {
					const type = actionRef().type;
					let entries = index.get(type);
					if (!entries) {
						entries = [];
						index.set(type, entries);
					}
					if (!entries.some((entry) => entry.key === key && entry.effect === effect$1)) entries.push({
						key,
						effect: effect$1
					});
				}
			}
			this._effectIndex = index;
		}
		return this._effectIndex.get(actionType) ?? [];
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
function directive(renderFn, type) {
	return {
		__directive: true,
		type,
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
				items: [],
				startMarker,
				endMarker,
				__dispose: () => {
					for (const item of state.items) disposeContainerParts(item.container);
					state.items = [];
				}
			};
			updateList$1(items, keyFn, template, state);
			return state;
		}
		updateList$1(items, keyFn, template, previousState);
		return previousState;
	}, "repeat");
}
function updateList$1(newItems, keyFn, template, state) {
	const oldItems = state.items;
	const newKeyToIndex = /* @__PURE__ */ new Map();
	const newEntries = [];
	const newKeys = new Array(newItems.length);
	let duplicateKey;
	let hasDuplicate = false;
	for (let i = 0; i < newItems.length; i++) {
		const key = keyFn(newItems[i], i);
		newKeys[i] = key;
		if (!hasDuplicate && newKeyToIndex.has(key)) {
			hasDuplicate = true;
			duplicateKey = key;
		}
		newKeyToIndex.set(key, i);
	}
	if (hasDuplicate) devWarn("repeat-duplicate-key", `repeat() received a duplicate key (${String(duplicateKey)}). Keys must be unique — with a repeated key one item shadows the other, leaving orphaned DOM behind on every update. Use a key that is unique per item (an id, not an index into a filtered list).`);
	if (oldItems.length === newItems.length) {
		let allKeysMatch = true;
		for (let i = 0; i < newItems.length; i++) if (oldItems[i].key !== newKeys[i]) {
			allKeysMatch = false;
			break;
		}
		if (allKeysMatch) {
			for (let i = 0; i < newItems.length; i++) renderDetachedItem(template(newItems[i], i), oldItems[i].container, oldItems[i].start, oldItems[i].end);
			return;
		}
	}
	const oldItemsByKey = /* @__PURE__ */ new Map();
	const oldIndexByKey = /* @__PURE__ */ new Map();
	for (let i = 0; i < oldItems.length; i++) {
		const oldItem = oldItems[i];
		const bucket = oldItemsByKey.get(oldItem.key);
		if (bucket) bucket.push(oldItem);
		else {
			oldItemsByKey.set(oldItem.key, [oldItem]);
			oldIndexByKey.set(oldItem.key, i);
		}
	}
	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = newKeys[i];
		const bucket = oldItemsByKey.get(key);
		if (bucket && bucket.length > 0) {
			const oldItem = bucket.shift();
			if (bucket.length === 0) oldItemsByKey.delete(key);
			renderDetachedItem(template(item, i), oldItem.container, oldItem.start, oldItem.end);
			newEntries.push({
				item: oldItem,
				oldIndex: oldIndexByKey.get(key) ?? -1,
				isNew: false
			});
		} else {
			const repeatItem = createRepeatItem(item, i, key, template);
			newEntries.push({
				item: repeatItem,
				oldIndex: -1,
				isNew: true
			});
		}
	}
	for (const bucket of oldItemsByKey.values()) for (const oldItem of bucket) removeItemRange(oldItem);
	if (newEntries.length === 0) {
		state.items = [];
		return;
	}
	const lisPositions = getLisPositions(newEntries);
	const parent = state.startMarker.parentNode;
	let nextSibling = state.endMarker;
	for (let i = newEntries.length - 1; i >= 0; i--) {
		const entry = newEntries[i];
		if (entry.isNew) insertItemRange(entry.item, parent, nextSibling);
		else if (!lisPositions.has(i)) moveItemRange(entry.item, nextSibling);
		nextSibling = entry.item.start;
	}
	state.items = newEntries.map((entry) => entry.item);
}
function createRepeatItem(item, index, key, template) {
	const templateResult = template(item, index);
	const container = document.createDocumentFragment();
	return {
		key,
		container,
		nodes: templateResult.renderOnce(container),
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
	item.nodes = [];
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
	disposeContainerParts(item.container);
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
function repeatRaw(items, keyFn, factory, update) {
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
		updateList(items, keyFn, factory, update, previousState);
		return previousState;
	}, "repeatRaw");
}
function updateList(newItems, keyFn, factory, update, state) {
	const oldItems = state.keyToItem;
	const newKeyToItem = /* @__PURE__ */ new Map();
	const parent = state.startMarker.parentNode;
	const endMarker = state.endMarker;
	const reuse = (existing, item, index) => {
		if (update) {
			update(existing.element, item, index);
			return existing.element;
		}
		const next = factory(item, index);
		if (next !== existing.element) existing.element.replaceWith(next);
		return next;
	};
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
			for (const [key, existing] of oldItems) {
				newKeyToItem.set(key, {
					key,
					element: reuse(existing, newItems[i], i)
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
			const element = reuse(existing, item, i);
			newKeyToItem.set(key, {
				key,
				element
			});
			fragment.appendChild(element);
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
				template: null,
				falseTemplate: null,
				container: null,
				startMarker,
				endMarker,
				__dispose: () => {
					if (state.container) {
						disposeContainerParts(state.container);
						state.container = null;
					}
				}
			};
			if (condition) {
				state.template = template();
				renderContent(state, true);
			} else if (falseTemplate) {
				state.falseTemplate = falseTemplate();
				renderContent(state, false);
			}
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
		} else if (condition && previousState.condition) updateContent(previousState, template(), true);
		else if (!condition && !previousState.condition) {
			if (falseTemplate) updateContent(previousState, falseTemplate(), false);
			else if (previousState.container) removeContent(previousState);
		}
		previousState.condition = condition;
		return previousState;
	}, "when");
}
function renderContent(state, useTrueTemplate) {
	const parent = state.startMarker.parentNode;
	if (!parent) throw new Error("when() directive: markers not in DOM");
	const templateToRender = useTrueTemplate ? state.template : state.falseTemplate;
	if (!templateToRender) return;
	const container = document.createDocumentFragment();
	templateToRender.renderInto(container);
	state.container = container;
	parent.insertBefore(container, state.endMarker);
}
function updateContent(state, newTemplate, useTrueTemplate) {
	const container = state.container;
	if (container && container.__templateKey === newTemplate.templateKey) newTemplate.renderInto(container);
	else {
		removeContent(state);
		if (useTrueTemplate) state.template = newTemplate;
		else state.falseTemplate = newTemplate;
		renderContent(state, useTrueTemplate);
	}
	if (useTrueTemplate) state.template = newTemplate;
	else state.falseTemplate = newTemplate;
}
function removeContent(state) {
	if (state.container) disposeContainerParts(state.container);
	clearBetween(state.startMarker, state.endMarker);
	state.container = null;
	state.template = null;
	state.falseTemplate = null;
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
	}, "classMap");
}
function live(value) {
	return directive((container, previousState, name) => {
		const element = container;
		const property = name ?? "value";
		const current = element[property];
		if (Object.is(current, value) || typeof current === "string" && String(value ?? "") === current) return;
		element[property] = value;
	}, "live");
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
	}, "styleMap");
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
	}, "unsafeHTML");
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
export { APP_CONFIG, AbortError, AbstractControl, Binding, ComponentBase, ComponentStateBaseService, Directive, EffectsBase, FormArray, FormControl, FormGroup, HttpBaseError, HttpClient, HttpError, Inject, Injectable, InjectionEngine, Injector, MelodicComponent, NetworkError, ROUTE_CONTEXT_EVENT, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_INIT_STATE, RX_STATE_DEBUG, RouteContextEvent, RouteContextService, RouteMatcher, RouterLinkComponent, RouterLinkCore, RouterOutletComponent, RouterService, SIGNAL_MARKER, Service, SignalEffect, SignalStoreService, TemplateResult, Validators, appendQueryParams, applyGlobalStyles, attributeNames, attributeTypes, batch, bootstrap, buildPathFromRoute, checkboxAdapter, classMap, computed, createAction, createAsyncValidator, createDeactivateGuard, createFormArray, createFormControl, createFormGroup, createGuard, createReducer, createResolver, createState, createToken, createValidator, css, defineConfig, describeToken, devWarn, directive, disposeContainerParts, disposeDirectiveState, disposePart, disposeParts, effect, emit, environment, findRouteByName, formControlDirective, getActiveComponent, getActiveEffect, getAdapter, getAttributeDirective, getComponentDefinition, getComponentDefinitions, getEnvironment, getGlobalMessage, getRegisteredDirectives, getTokenKey, hasAttributeDirective, html, inject, injectOptional, installConsoleApi, installHistoryEvents, isDevMode, isDirective, isSafeUrl, isSignal, live, matchRouteTree, modelDirective, onAction, parseUrlParts, portalDirective, props, provideConfig, provideHttp, provideRX, provideRouter, radioAdapter, refreshGlobalStyles, registerAdapter, registerAttributeDirective, registerDefaultMessages, render, repeat, repeatRaw, resetDevWarnings, resolveEnvironment, resolveMessage, routerLinkDirective, setActiveComponent, setActiveEffect, setDefaultMessage, setDevMode, signal, styleMap, textAdapter, unregisterAttributeDirective, unsafeHTML, untracked, when };

//# sourceMappingURL=melodic-core.js.map