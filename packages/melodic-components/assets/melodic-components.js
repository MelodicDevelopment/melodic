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
			"DEV": false,
			"MODE": "development",
			"PROD": true,
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
var warned$1 = /* @__PURE__ */ new Set();
function devWarn(key, ...message) {
	if (!isDevMode() || warned$1.has(key)) return;
	warned$1.add(key);
	console.warn("[Melodic]", ...message);
}
function resetDevWarnings() {
	warned$1.clear();
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
var renderScopedDepth = 0;
function createRenderScopedComputed(factory) {
	renderScopedDepth++;
	try {
		return factory();
	} finally {
		renderScopedDepth--;
	}
}
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
	if (owner?.isRendering && renderScopedDepth === 0) devWarn(`computed-in-render:${owner.selector ?? "component"}${options.name ? `:${options.name}` : ""}`, `computed()${options.name ? ` '${options.name}'` : ""} was created while <${owner.selector ?? "a component"}> was rendering. A new one is created on every render and they accumulate for the life of the component. Create it in a field initializer or onInit, or use store.select(key, fn, cacheKey), which is render-scoped.`);
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
			"DEV": false,
			"MODE": "development",
			"PROD": true,
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
	let warned$2 = false;
	const report = (position, index) => {
		warned$2 = true;
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
	return warned$2;
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
var _ref$1;
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
__decorate([Service(RouterService), __decorateMetadata("design:type", typeof (_ref$1 = typeof RouterService !== "undefined" && RouterService) === "function" ? _ref$1 : Object)], RouterOutletComponent.prototype, "_router", void 0);
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
	const sig = createRenderScopedComputed(create);
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
	:root:not([data-theme]) {
		${Object.entries(darkTheme).map(([key, value]) => `${key}: ${value};`).join("\n		")}

		color-scheme: dark;
	}
}`;
const baseThemeCss = `:root {
	${tokensToCss(allTokens)}

	/* Default to light color scheme */
	color-scheme: light;
}`;
var currentTheme = null;
var themeListeners = /* @__PURE__ */ new Set();
var mediaQueryCleanup = null;
function readDocumentTheme() {
	if (typeof document === "undefined") return "system";
	const attribute = document.documentElement.getAttribute("data-theme");
	return attribute === "light" || attribute === "dark" ? attribute : "system";
}
function getTheme() {
	currentTheme ??= readDocumentTheme();
	return currentTheme;
}
function getResolvedTheme() {
	const theme = getTheme();
	if (theme === "system") {
		if (typeof window === "undefined" || !window.matchMedia) return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return theme;
}
function applyTheme(theme) {
	if (mediaQueryCleanup) {
		mediaQueryCleanup();
		mediaQueryCleanup = null;
	}
	currentTheme = theme;
	if (typeof document === "undefined" || typeof window === "undefined" || !window.matchMedia) {
		notifyListeners(theme, theme === "dark" ? "dark" : "light");
		return;
	}
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
var THEME_NAME_PATTERN = /^[a-z0-9-]+$/;
var TOKEN_NAME_PATTERN = /^--[a-zA-Z0-9_-]+$/;
var UNSAFE_VALUE_PATTERN = /[;{}<>\u0000-\u001f\u007f]/;
function assertValidThemeName(name) {
	if (!THEME_NAME_PATTERN.test(name)) throw new Error(`[melodic] Invalid theme name "${name}". Theme names may only contain lowercase letters, digits, and hyphens (matching ${THEME_NAME_PATTERN}).`);
}
function assertValidOverride(key, value) {
	if (!TOKEN_NAME_PATTERN.test(key)) throw new Error(`[melodic] Invalid theme token "${key}". Token names must be CSS custom properties (e.g. "--ml-color-primary") matching ${TOKEN_NAME_PATTERN}.`);
	if (UNSAFE_VALUE_PATTERN.test(value)) throw new Error(`[melodic] Invalid value for theme token "${key}". Values must not contain ";", "{", "}", "<", ">", or control characters.`);
}
function createTheme(name, overrides) {
	assertValidThemeName(name);
	return `[data-theme="${name}"] {\n\t${Object.entries(overrides).map(([key, value]) => {
		const stringValue = String(value ?? "");
		assertValidOverride(key, stringValue);
		return `${key}: ${stringValue};`;
	}).join("\n	")}\n}`;
}
function injectTheme(name, overrides) {
	if (typeof document === "undefined") throw new Error("injectTheme requires a DOM (document is undefined).");
	const css$1 = createTheme(name, overrides);
	const style = document.createElement("style");
	style.id = `ml-theme-${name}`;
	style.textContent = css$1;
	const existing = document.getElementById(style.id);
	if (existing) existing.remove();
	document.head.appendChild(style);
	return style;
}
function setColorWithVariants(overrides, token, color, mode) {
	const interactionMix = mode === "dark" ? "white" : "black";
	const subtleMix = mode === "dark" ? "black" : "white";
	overrides[token] = color;
	overrides[`${token}-hover`] = `color-mix(in srgb, ${color}, ${interactionMix} 12%)`;
	overrides[`${token}-active`] = `color-mix(in srgb, ${color}, ${interactionMix} 22%)`;
	overrides[`${token}-subtle`] = `color-mix(in srgb, ${color}, ${subtleMix} 88%)`;
}
function createBrandTheme(name, options) {
	const overrides = {};
	const mode = options.mode ?? "light";
	if (options.primary) setColorWithVariants(overrides, "--ml-color-primary", options.primary, mode);
	if (options.secondary) setColorWithVariants(overrides, "--ml-color-secondary", options.secondary, mode);
	if (options.success) setColorWithVariants(overrides, "--ml-color-success", options.success, mode);
	if (options.warning) setColorWithVariants(overrides, "--ml-color-warning", options.warning, mode);
	if (options.danger) setColorWithVariants(overrides, "--ml-color-danger", options.danger, mode);
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
			const { middlewareData: resultData, ...rest } = result;
			state = {
				...state,
				...rest,
				middlewareData: resultData ? {
					...state.middlewareData,
					...resultData
				} : state.middlewareData
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
	update();
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
				y: newY,
				middlewareData: { offset: {
					mainAxis,
					crossAxis
				} }
			};
		}
	};
}
function applyOffsetToPosition(position, side, offsetData) {
	const { mainAxis, crossAxis } = offsetData;
	let { x, y } = position;
	switch (side) {
		case "top":
			y -= mainAxis;
			x += crossAxis;
			break;
		case "bottom":
			y += mainAxis;
			x += crossAxis;
			break;
		case "left":
			x -= mainAxis;
			y += crossAxis;
			break;
		case "right":
			x += mainAxis;
			y += crossAxis;
			break;
		default: break;
	}
	return {
		x,
		y
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
			const { x, y, placement, rects, middlewareData } = state;
			const side = getSide(placement);
			if (!hasOverflow(detectOverflow(x, y, rects.floating, padding), side)) return;
			const offsetData = middlewareData.offset;
			const oppositePlacement = getOppositePlacement(placement);
			const fallbacks = options.fallbackPlacements ?? [oppositePlacement];
			for (const fallback of fallbacks) {
				const newSide = getSide(fallback);
				let newPos = getBasePlacementForFlip(rects.reference, rects.floating, fallback);
				if (offsetData) newPos = applyOffsetToPosition(newPos, newSide, offsetData);
				if (!hasOverflow(detectOverflow(newPos.x, newPos.y, rects.floating, padding), newSide)) return {
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
	const { padding = 0, mainAxis = false, crossAxis = true } = options;
	return {
		name: "shift",
		fn(state) {
			const { x, y, placement, rects } = state;
			const viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			const side = getSide(placement);
			const isVerticalPlacement = side === "top" || side === "bottom";
			const shiftX = isVerticalPlacement ? crossAxis : mainAxis;
			const shiftY = isVerticalPlacement ? mainAxis : crossAxis;
			let newX = x;
			let newY = y;
			if (shiftX) {
				const minX = padding;
				const maxX = viewport.width - rects.floating.width - padding;
				newX = Math.max(minX, Math.min(newX, maxX));
			}
			if (shiftY) {
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
function getDeepActiveElement() {
	let active = document.activeElement;
	while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
	return active;
}
function isDeepFocusWithin(container) {
	let node = getDeepActiveElement();
	while (node) {
		if (node === container) return true;
		node = node instanceof ShadowRoot ? node.host : node.parentNode;
	}
	return false;
}
function collectFocusables(container) {
	const slots = Array.from(container.querySelectorAll("slot"));
	if (slots.length === 0) return getFocusableElements(container);
	const focusables = getFocusableElements(container);
	for (const slot of slots) for (const assigned of slot.assignedElements({ flatten: true })) if (assigned instanceof HTMLElement) {
		focusables.push(...getFocusableElements(assigned));
		if (assigned.matches("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")) focusables.push(assigned);
	}
	return focusables;
}
function createFocusTrap(container, options = {}) {
	const { initialFocus = null, returnFocus = null, autoFocus = true } = options;
	let active = false;
	let previouslyFocused = null;
	const containerRoot = container.getRootNode();
	const hostEl = containerRoot instanceof ShadowRoot ? containerRoot.host : null;
	const handledEvents = /* @__PURE__ */ new WeakSet();
	function handleKeydown(event) {
		if (event.key !== "Tab" || !active) return;
		if (handledEvents.has(event)) return;
		handledEvents.add(event);
		const focusables = collectFocusables(container);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const activeElement = getDeepActiveElement();
		if (event.shiftKey) {
			if (activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else if (activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
	function activate() {
		if (active) return;
		active = true;
		previouslyFocused = getDeepActiveElement();
		container.addEventListener("keydown", handleKeydown);
		hostEl?.addEventListener("keydown", handleKeydown);
		if (initialFocus) initialFocus.focus();
		else if (autoFocus) {
			const first = collectFocusables(container)[0];
			if (first) first.focus();
		}
	}
	function deactivate(deactivateOptions = {}) {
		if (!active) return;
		active = false;
		container.removeEventListener("keydown", handleKeydown);
		hostEl?.removeEventListener("keydown", handleKeydown);
		if (deactivateOptions.returnFocus === false) return;
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
var CLEAR_DELAY_MS = 50;
var MESSAGE_GAP_MS = 150;
var regions = {
	polite: {
		element: null,
		queue: [],
		flushing: false
	},
	assertive: {
		element: null,
		queue: [],
		flushing: false
	}
};
function applyVisuallyHiddenStyles(element) {
	Object.assign(element.style, {
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
}
function getLiveRegion(priority) {
	const state = regions[priority];
	if (state.element && document.body.contains(state.element)) return state.element;
	const region = document.createElement("div");
	region.id = priority === "polite" ? "ml-live-region" : "ml-live-region-assertive";
	region.setAttribute("aria-live", priority);
	region.setAttribute("aria-atomic", "true");
	region.setAttribute("role", priority === "assertive" ? "alert" : "status");
	applyVisuallyHiddenStyles(region);
	document.body.appendChild(region);
	state.element = region;
	return region;
}
function flushQueue(priority) {
	const state = regions[priority];
	const message = state.queue.shift();
	if (message === void 0) {
		state.flushing = false;
		return;
	}
	state.flushing = true;
	const region = getLiveRegion(priority);
	region.textContent = "";
	setTimeout(() => {
		region.textContent = message;
		setTimeout(() => flushQueue(priority), MESSAGE_GAP_MS);
	}, CLEAR_DELAY_MS);
}
function announce(message, priority = "polite") {
	const state = regions[priority];
	state.queue.push(message);
	if (!state.flushing) flushQueue(priority);
}
function createLiveRegion(options = {}) {
	const { id, priority = "polite", atomic = true } = options;
	const region = document.createElement("div");
	if (id) region.id = id;
	region.setAttribute("aria-live", priority);
	region.setAttribute("aria-atomic", atomic.toString());
	region.setAttribute("role", "status");
	applyVisuallyHiddenStyles(region);
	return region;
}
function supportsAriaElementReferences() {
	return typeof Element !== "undefined" && "ariaDescribedByElements" in Element.prototype;
}
function setCrossRootDescription(target, describers) {
	const reflected = target;
	if ("ariaDescribedByElements" in reflected) {
		reflected.ariaDescribedByElements = describers.length > 0 ? describers : null;
		target.removeAttribute("aria-description");
		return;
	}
	const text = describers.map((element) => element.textContent?.trim() ?? "").filter(Boolean).join(". ");
	if (text) target.setAttribute("aria-description", text);
	else target.removeAttribute("aria-description");
}
function setCrossRootLabel(target, labels) {
	const reflected = target;
	if ("ariaLabelledByElements" in reflected) {
		reflected.ariaLabelledByElements = labels.length > 0 ? labels : null;
		return;
	}
	const text = labels.map((element) => element.textContent?.trim() ?? "").filter(Boolean).join(" ");
	if (text) target.setAttribute("aria-label", text);
	else target.removeAttribute("aria-label");
}
function setCrossRootActiveDescendant(target, active) {
	const reflected = target;
	if ("ariaActiveDescendantElement" in reflected) {
		reflected.ariaActiveDescendantElement = active;
		return;
	}
	if (active?.id) target.setAttribute("aria-activedescendant", active.id);
	else target.removeAttribute("aria-activedescendant");
}
function getFocusableControl(element) {
	const root = element.shadowRoot;
	if (root) {
		const control = root.querySelector("button, [role=\"button\"], a[href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])");
		if (control) return control;
	}
	return element;
}
function clearCrossRootDescription(target) {
	setCrossRootDescription(target, []);
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
		if (!event.composedPath().includes(element)) callback(event);
	}
	document.addEventListener("click", handleClick, true);
	return () => {
		document.removeEventListener("click", handleClick, true);
	};
}
function watchLightSlots(host, onChange) {
	const observer = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => mutation.type === "childList" ? mutation.target === host : mutation.target.parentNode === host)) onChange();
	});
	observer.observe(host, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["slot"]
	});
	onChange();
	return () => observer.disconnect();
}
function hasLightSlot(host, slotName) {
	return host.querySelector(`:scope > [slot="${slotName}"]`) !== null;
}
var VirtualScroller = class {
	constructor() {
		this._viewport = null;
		this._resizeObserver = null;
		this._options = null;
		this._handleScroll = () => {
			this._compute();
		};
	}
	attach(viewport, options) {
		this._viewport = viewport;
		this._options = options;
		this._resizeObserver = new ResizeObserver(() => {
			this._compute();
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
		this._compute();
	}
	_compute() {
		if (!this._viewport || !this._options) return;
		const { rowHeight, itemCount, onUpdate, enabled, buffer = 3 } = this._options;
		const count = itemCount();
		if (enabled && !enabled()) {
			onUpdate(0, count);
			return;
		}
		const viewportHeight = this._viewport.clientHeight;
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
function watchSlotPresence(shadow, onChange) {
	shadow.querySelectorAll("slot").forEach((slot) => {
		const update = () => {
			const hasContent = slot.assignedNodes().some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim() !== "");
			onChange(slot.name, hasContent);
		};
		slot.addEventListener("slotchange", update);
		update();
	});
}
var warned = /* @__PURE__ */ new Set();
function warnDeprecatedOnce(key, message) {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(message);
}
function warnDeprecatedTitleOnce(tag, replacement) {
	warnDeprecatedOnce(`${tag}.title`, `[${tag}] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "${replacement}" instead. The "title" shim will be removed in the next major release.`);
}
function defineLegacyAliases(proto, tag, aliases) {
	for (const [alias, prop] of Object.entries(aliases)) Object.defineProperty(proto, alias, {
		get() {
			return this[prop];
		},
		set(value) {
			warnDeprecatedOnce(`${tag}.${alias}`, `[${tag}] The quoted "${alias}" property is deprecated — use the camelCase property "${prop}" (attribute "${alias}"). The alias will be removed in the next major release.`);
			this[prop] = value;
		},
		enumerable: false,
		configurable: true
	});
}
var OverlayPositioner = class {
	constructor(_getConfig) {
		this._getConfig = _getConfig;
		this._cleanupAutoUpdate = null;
	}
	get active() {
		return this._cleanupAutoUpdate !== null;
	}
	start(triggerEl, floatingEl) {
		this.stop();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, floatingEl, () => this.position(triggerEl, floatingEl));
	}
	stop() {
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = null;
	}
	position(triggerEl, floatingEl) {
		const config = this._getConfig();
		if (config.matchTriggerWidth) floatingEl.style.width = `${triggerEl.offsetWidth}px`;
		const middleware = [
			offset(config.offset),
			flip(),
			shift({ padding: config.shiftPadding ?? 8 })
		];
		const arrowEl = config.arrowElement ?? null;
		if (arrowEl) middleware.push(arrow({
			element: arrowEl,
			padding: config.arrowPadding ?? 8
		}));
		const { x, y, placement, middlewareData } = computePosition(triggerEl, floatingEl, {
			placement: config.placement,
			middleware
		});
		floatingEl.style.left = `${x}px`;
		floatingEl.style.top = `${y}px`;
		if (config.placementAttribute) floatingEl.dataset.placement = placement;
		if (arrowEl && middlewareData.arrow) positionOverlayArrow(arrowEl, placement, middlewareData.arrow);
	}
};
function positionOverlayArrow(arrowEl, placement, arrowData) {
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
var ToggleDismissGuard = class {
	constructor() {
		this._justDismissed = false;
	}
	dismissed() {
		this._justDismissed = true;
		setTimeout(() => {
			this._justDismissed = false;
		}, 0);
	}
	shouldSkipToggle() {
		if (this._justDismissed) {
			this._justDismissed = false;
			return true;
		}
		return false;
	}
};
function tooltipTemplate(c) {
	return html`
		<div class="ml-tooltip">
			<div
				class="ml-tooltip__trigger"
				@mouseenter=${c.show}
				@mouseleave=${c.hide}
				@focusin=${c.show}
				@focusout=${c.hide}
			>
				<slot></slot>
			</div>
			<div
				id=${c.tooltipID}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-tooltip-max-width: 320px
	 * --ml-tooltip-padding-y: var(--ml-space-2)
	 * --ml-tooltip-padding-x: var(--ml-space-3)
	 * --ml-tooltip-color: var(--ml-tooltip-text, var(--ml-white))
	 * --ml-tooltip-font-size: var(--ml-text-xs)
	 * --ml-tooltip-font-weight: var(--ml-font-medium)
	 * --ml-tooltip-line-height: var(--ml-leading-snug)
	 * --ml-tooltip-radius: var(--ml-radius)
	 * --ml-tooltip-shadow: var(--ml-shadow-lg)
	 * --ml-tooltip-z-index: 9999
	 * --ml-tooltip-transition-duration: var(--ml-duration-150)
	 * --ml-tooltip-transition-easing: var(--ml-ease-out)
	 *
	 * Arrow
	 * --ml-tooltip-arrow-size: 8px
	 */

	:host {
		/* ── Tooltip: content ──
		   --ml-tooltip-max-width, --ml-tooltip-padding-y, --ml-tooltip-padding-x,
		   --ml-tooltip-color, --ml-tooltip-font-size, --ml-tooltip-font-weight,
		   --ml-tooltip-line-height, --ml-tooltip-radius, --ml-tooltip-shadow,
		   --ml-tooltip-z-index, --ml-tooltip-transition-duration,
		   --ml-tooltip-transition-easing
		   ── Tooltip: arrow ──
		   --ml-tooltip-arrow-size
		   ── Theme-level ──
		   --ml-tooltip-bg / --ml-tooltip-text are defined by the THEME (light and
		   dark presets) and intentionally NOT re-declared here: shadowing
		   --ml-tooltip-bg on :host would override the theme's dark value and
		   consumer overrides, and a same-name alias would be self-referential.
		   Rules reference var(--ml-tooltip-bg, fallback) directly. */

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
		z-index: var(--ml-tooltip-z-index, 9999);
		max-width: var(--ml-tooltip-max-width, 320px);
		padding: var(--ml-tooltip-padding-y, var(--ml-space-2)) var(--ml-tooltip-padding-x, var(--ml-space-3));
		background-color: var(--ml-tooltip-bg, var(--ml-gray-900));
		color: var(--ml-tooltip-color, var(--ml-tooltip-text, var(--ml-white)));
		font-size: var(--ml-tooltip-font-size, var(--ml-text-xs));
		font-weight: var(--ml-tooltip-font-weight, var(--ml-font-medium));
		line-height: var(--ml-tooltip-line-height, var(--ml-leading-snug));
		border-radius: var(--ml-tooltip-radius, var(--ml-radius));
		box-shadow: var(--ml-tooltip-shadow, var(--ml-shadow-lg));
		text-align: center;
		word-wrap: break-word;
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-tooltip-transition-duration, var(--ml-duration-150)) var(--ml-tooltip-transition-easing, var(--ml-ease-out)),
			transform var(--ml-tooltip-transition-duration, var(--ml-duration-150)) var(--ml-tooltip-transition-easing, var(--ml-ease-out));
	}

	.ml-tooltip__content--visible {
		opacity: 1;
		transform: scale(1);
	}

	.ml-tooltip__arrow {
		position: absolute;
		width: var(--ml-tooltip-arrow-size, 8px);
		height: var(--ml-tooltip-arrow-size, 8px);
		background-color: var(--ml-tooltip-bg, var(--ml-gray-900));
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
		this.anchorEl = null;
		this.tooltipID = newID();
		this._showTimeout = null;
		this._hideTimeout = null;
		this._positioner = new OverlayPositioner(() => ({
			placement: this.placement,
			offset: 8,
			arrowElement: this.elementRef.shadowRoot?.querySelector(".ml-tooltip__arrow"),
			placementAttribute: true
		}));
		this.show = () => {
			if (this._hideTimeout) {
				clearTimeout(this._hideTimeout);
				this._hideTimeout = null;
			}
			this._showTimeout = window.setTimeout(() => {
				this.isVisible = true;
				this.startPositioning();
				document.addEventListener("keydown", this.handleDocumentKeydown, true);
			}, this.delay);
		};
		this.hide = () => {
			if (this._showTimeout) {
				clearTimeout(this._showTimeout);
				this._showTimeout = null;
			}
			this._hideTimeout = window.setTimeout(() => {
				this.dismiss();
			}, 100);
		};
		this.handleDocumentKeydown = (event) => {
			if (event.key !== "Escape") return;
			if (this._showTimeout) {
				clearTimeout(this._showTimeout);
				this._showTimeout = null;
			}
			if (this._hideTimeout) {
				clearTimeout(this._hideTimeout);
				this._hideTimeout = null;
			}
			this.dismiss();
		};
		this.syncTriggerAria = () => {
			const root = this.elementRef.shadowRoot;
			const trigger = ((root?.querySelector(".ml-tooltip__trigger slot"))?.assignedElements() ?? [])[0];
			const content = root?.querySelector(".ml-tooltip__content");
			if (!trigger || trigger.hasAttribute("aria-describedby")) return;
			setCrossRootDescription(trigger, content ? [content] : []);
		};
	}
	onCreate() {
		this.elementRef.shadowRoot?.addEventListener("slotchange", this.syncTriggerAria);
		this.syncTriggerAria();
	}
	onDestroy() {
		if (this._showTimeout) clearTimeout(this._showTimeout);
		if (this._hideTimeout) clearTimeout(this._hideTimeout);
		this.stopPositioning();
		document.removeEventListener("keydown", this.handleDocumentKeydown, true);
		this.elementRef.shadowRoot?.removeEventListener("slotchange", this.syncTriggerAria);
	}
	dismiss() {
		this.isVisible = false;
		this.stopPositioning();
		document.removeEventListener("keydown", this.handleDocumentKeydown, true);
	}
	startPositioning() {
		const trigger = this.getReferenceEl();
		const tooltip = this.elementRef.shadowRoot?.querySelector(".ml-tooltip__content");
		if (!trigger || !tooltip) return;
		this._positioner.start(trigger, tooltip);
	}
	stopPositioning() {
		this._positioner.stop();
	}
	getReferenceEl() {
		return this.anchorEl ?? this.elementRef.shadowRoot?.querySelector(".ml-tooltip__trigger");
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
var tooltipStates = /* @__PURE__ */ new WeakMap();
function parseValue(value) {
	if (typeof value === "string") return { content: value };
	if (value && typeof value === "object" && "content" in value) return value;
	return { content: String(value ?? "") };
}
function ensureInserted(element, tooltip) {
	if (tooltip.isConnected || !element.parentNode) return;
	element.parentNode.insertBefore(tooltip, element.nextSibling);
}
function createState$1(element) {
	const tooltip = document.createElement("ml-tooltip");
	tooltip.style.position = "absolute";
	tooltip.style.width = "0";
	tooltip.style.height = "0";
	tooltip.style.overflow = "visible";
	tooltip.anchorEl = element;
	const component = tooltip.component;
	const show = () => {
		ensureInserted(element, tooltip);
		component?.show();
	};
	const hide = () => {
		component?.hide();
	};
	element.addEventListener("mouseenter", show);
	element.addEventListener("mouseleave", hide);
	element.addEventListener("focusin", show);
	element.addEventListener("focusout", hide);
	const state = {
		tooltip,
		pendingRemoval: false,
		ownsDescribedBy: false,
		show,
		hide
	};
	describeWhenReady(element, tooltip, state);
	return state;
}
function describeWhenReady(element, tooltip, state) {
	if (element.hasAttribute("aria-describedby")) return;
	const attach = () => {
		const content = tooltip.shadowRoot?.querySelector(".ml-tooltip__content");
		if (!content || state.pendingRemoval) return false;
		setCrossRootDescription(element, [content]);
		state.ownsDescribedBy = true;
		return true;
	};
	if (attach()) return;
	Promise.resolve().then(() => attach()).then((done) => {
		if (!done) setTimeout(attach, 0);
	});
}
function destroyState(element, state) {
	element.removeEventListener("mouseenter", state.show);
	element.removeEventListener("mouseleave", state.hide);
	element.removeEventListener("focusin", state.show);
	element.removeEventListener("focusout", state.hide);
	if (state.ownsDescribedBy) {
		clearCrossRootDescription(element);
		element.removeAttribute("aria-describedby");
	}
	state.tooltip.anchorEl = null;
	state.tooltip.remove();
	if (tooltipStates.get(element) === state) tooltipStates.delete(element);
}
function tooltipDirective(element, value) {
	if (!value) return;
	const { content, placement } = parseValue(value);
	if (!content) return;
	let state = tooltipStates.get(element);
	if (state) state.pendingRemoval = false;
	else {
		state = createState$1(element);
		tooltipStates.set(element, state);
	}
	if (state.tooltip.getAttribute("content") !== content) state.tooltip.setAttribute("content", content);
	const resolvedPlacement = placement ?? "top";
	if (state.tooltip.getAttribute("placement") !== resolvedPlacement) state.tooltip.setAttribute("placement", resolvedPlacement);
	ensureInserted(element, state.tooltip);
	const currentState = state;
	return () => {
		currentState.pendingRemoval = true;
		queueMicrotask(() => {
			if (currentState.pendingRemoval) destroyState(element, currentState);
		});
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Size — default md (1.5rem)
	 * --ml-spinner-size: 1.5rem
	 *
	 * Track opacity
	 * --ml-spinner-track-opacity: 0.25
	 *
	 * Animation
	 * --ml-spinner-animation-duration: 0.75s
	 */

	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Color — defaults to currentColor via stroke in SVG */
		--ml-spinner-color: currentColor;
	}

	.spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner__svg {
		animation: spin var(--ml-spinner-animation-duration, 0.75s) linear infinite;
	}

	.spinner__track {
		opacity: var(--ml-spinner-track-opacity, 0.25);
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
		width: var(--ml-spinner-size, 1.5rem);
		height: var(--ml-spinner-size, 1.5rem);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	${visuallyHiddenStyles}
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
	const classes = classMap({
		"ml-button": true,
		[`ml-button--${c.resolvedVariant}`]: true,
		[`ml-button--${c.size}`]: true,
		"ml-button--disabled": c.isDisabled,
		"ml-button--loading": c.loading,
		"ml-button--full-width": c.fullWidth
	});
	const content = html`
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
	`;
	if (c.href != null) return html`
			<a
				href=${c.isDisabled ? void 0 : c.href}
				target=${c.target ?? void 0}
				rel=${c.rel ?? void 0}
				download=${c.download ?? void 0}
				class=${classes}
				role="button"
				@click=${c.handleClick}
				aria-disabled=${c.isDisabled ? "true" : "false"}
				aria-busy=${c.loading ? "true" : "false"}
			>
				${content}
			</a>
		`;
	return html`
		<button
			type="${c.type}"
			class=${classes}
			?disabled=${c.isDisabled}
			@click=${c.handleClick}
			aria-disabled=${c.isDisabled ? "true" : "false"}
			aria-busy=${c.loading ? "true" : "false"}
		>
			${content}
		</button>
	`;
}
const buttonStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Colors
	 * --ml-button-bg: var(--ml-color-primary)
	 * --ml-button-border-color: var(--ml-color-primary)
	 * --ml-button-color: var(--ml-color-text-inverse)
	 * --ml-button-hover-bg: var(--ml-color-primary-hover)
	 * --ml-button-hover-border-color: var(--ml-color-primary-hover)
	 * --ml-button-hover-color: var(--ml-color-text-inverse)
	 * --ml-button-active-bg: var(--ml-color-primary-active)
	 * --ml-button-active-border-color: var(--ml-color-primary-active)
	 * --ml-button-shadow: var(--ml-shadow-xs)
	 * --ml-button-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Typography
	 * --ml-button-font-family: var(--ml-font-sans)
	 * --ml-button-font-weight: var(--ml-font-semibold)
	 * --ml-button-font-size: var(--ml-text-sm)
	 * --ml-button-line-height: var(--ml-leading-tight)
	 *
	 * Spacing
	 * --ml-button-height: 2.5rem
	 * --ml-button-padding: 0 var(--ml-space-3-5)
	 * --ml-button-gap: var(--ml-space-2)
	 * --ml-button-border-width: var(--ml-border)
	 * --ml-button-border-radius: var(--ml-radius)
	 *
	 * Disabled
	 * --ml-button-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-button-transition-duration: var(--ml-duration-150)
	 * --ml-button-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: inline-block;
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
		gap: var(--ml-button-gap, var(--ml-space-2));
		position: relative;
		font-family: var(--ml-button-font-family, var(--ml-font-sans));
		font-weight: var(--ml-button-font-weight, var(--ml-font-semibold));
		font-size: var(--ml-button-font-size, var(--ml-text-sm));
		line-height: var(--ml-button-line-height, var(--ml-leading-tight));
		white-space: nowrap;
		text-align: center;
		height: var(--ml-button-height, 2.5rem);
		padding: var(--ml-button-padding, 0 var(--ml-space-3-5));
		border: var(--ml-button-border-width, var(--ml-border)) solid var(--ml-button-border-color, var(--ml-color-primary));
		border-radius: var(--ml-button-border-radius, var(--ml-radius));
		background-color: var(--ml-button-bg, var(--ml-color-primary));
		color: var(--ml-button-color, var(--ml-color-text-inverse));
		box-shadow: var(--ml-button-shadow, var(--ml-shadow-xs));
		transition:
			background-color var(--ml-button-transition-duration, var(--ml-duration-150)) var(--ml-button-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-button-transition-duration, var(--ml-duration-150)) var(--ml-button-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-button-transition-duration, var(--ml-duration-150)) var(--ml-button-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-button-transition-duration, var(--ml-duration-150)) var(--ml-button-transition-easing, var(--ml-ease-in-out)),
			transform var(--ml-button-transition-duration, var(--ml-duration-150)) var(--ml-button-transition-easing, var(--ml-ease-in-out));
	}

	.ml-button:focus {
		outline: none;
	}

	.ml-button:focus-visible {
		box-shadow: var(--ml-button-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-button:hover:not(:disabled) {
		background-color: var(--ml-button-hover-bg, var(--ml-color-primary-hover));
		border-color: var(--ml-button-hover-border-color, var(--ml-color-primary-hover));
		color: var(--ml-button-hover-color, var(--ml-color-text-inverse));
	}

	.ml-button:active:not(:disabled) {
		background-color: var(--ml-button-active-bg, var(--ml-color-primary-active));
		border-color: var(--ml-button-active-border-color, var(--ml-color-primary-active));
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
		opacity: var(--ml-button-disabled-opacity, 0.5);
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
		gap: var(--ml-button-gap, var(--ml-space-2));
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
		this.href = null;
		this.target = null;
		this.rel = null;
		this.download = null;
		this._internals = null;
		this._internalsAttached = false;
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
			if (this.href == null && !event.defaultPrevented) {
				if (this.type === "submit") this.submitForm();
				else if (this.type === "reset") this.findForm()?.reset();
			}
		};
	}
	get isDisabled() {
		return this.disabled || this.loading;
	}
	get resolvedVariant() {
		return this.variant === "error" ? "danger" : this.variant;
	}
	submitForm() {
		const form = this.findForm();
		if (!form) return;
		if (typeof form.requestSubmit === "function") form.requestSubmit();
		else form.submit();
	}
	findForm() {
		const viaInternals = this.getInternalsForm();
		if (viaInternals) return viaInternals;
		let el = this.elementRef;
		while (el) {
			const form = el.closest("form");
			if (form) return form;
			const root = el.getRootNode();
			el = root instanceof ShadowRoot ? root.host : null;
		}
		return null;
	}
	getInternalsForm() {
		if (this._internals === null && !this._internalsAttached) {
			this._internalsAttached = true;
			try {
				if (typeof this.elementRef.attachInternals === "function") this._internals = this.elementRef.attachInternals();
			} catch {
				this._internals = null;
			}
		}
		try {
			return this._internals?.form ?? null;
		} catch {
			return null;
		}
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
		"full-width",
		"href",
		"target",
		"rel",
		"download"
	]
})], ButtonComponent);
function buttonGroupTemplate(c) {
	return html`
		<div
			class=${classMap({
		"ml-button-group": true,
		"ml-button-group--disabled": c.disabled,
		"ml-button-group--error": !!c.error
	})}
			role="group"
		>
			<slot @slotchange=${c.handleSlotChange}></slot>
		</div>
		${when(!!c.error, () => html`<span class="ml-button-group__error">${c.error}</span>`)}
	`;
}
const buttonGroupStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Disabled
	 * --ml-button-group-disabled-opacity: 0.5
	 *
	 * Spacing
	 * --ml-button-group-item-offset: -1px
	 *
	 * Error
	 * --ml-button-group-error-font-size: var(--ml-text-sm)
	 * --ml-button-group-error-color: var(--ml-color-danger)
	 * --ml-button-group-error-margin-top: var(--ml-space-1)
	 * --ml-button-group-error-line-height: var(--ml-leading-tight)
	 */

	:host {
		display: inline-block;
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: var(--ml-button-group-disabled-opacity, 0.5);
		pointer-events: none;
	}

	.ml-button-group__error {
		display: block;
		margin-top: var(--ml-button-group-error-margin-top, var(--ml-space-1));
		font-size: var(--ml-button-group-error-font-size, var(--ml-text-sm));
		color: var(--ml-button-group-error-color, var(--ml-color-danger));
		line-height: var(--ml-button-group-error-line-height, var(--ml-leading-tight));
	}

	::slotted(ml-button-group-item) {
		margin-left: var(--ml-button-group-item-offset, -1px);
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
registerAdapter((el) => el.tagName === "ML-BUTTON-GROUP", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => {
		const e = el;
		return e.multiple ? e.values ?? [] : e.value ?? "";
	},
	setValue: (el, value) => {
		const e = el;
		if (Array.isArray(value)) e.values = value;
		else e.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
var ButtonGroupComponent = class ButtonGroupComponent$1 {
	constructor() {
		this.value = "";
		this.variant = "outline";
		this.size = "md";
		this.disabled = false;
		this.multiple = false;
		this.values = [];
		this.error = "";
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
	onRender() {
		this.syncItems();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:item-click", this._handleItemClick);
	}
	syncItems() {
		this.elementRef.querySelectorAll("ml-button-group-item").forEach((item) => {
			const itemValue = item.value ?? item.getAttribute("value") ?? "";
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
		"multiple",
		"error"
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
					name="${c.name}"
					maxlength=${c.maxlength ?? ""}
					minlength=${c.minlength ?? ""}
					min="${c.min}"
					max="${c.max}"
					step="${c.step}"
					pattern="${c.pattern}"
					inputmode="${c.inputmode}"
					aria-label=${c.label ? "" : c.fieldLabel}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-input-label-font-size: var(--ml-text-sm)
	 * --ml-input-label-font-weight: var(--ml-font-medium)
	 * --ml-input-label-color: var(--ml-color-text-secondary)
	 * --ml-input-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-input-required-color: var(--ml-color-danger)
	 *
	 * Wrapper
	 * --ml-input-bg: var(--ml-color-input-bg)
	 * --ml-input-border-width: var(--ml-border)
	 * --ml-input-border-color: var(--ml-color-border)
	 * --ml-input-border-radius: var(--ml-radius)
	 * --ml-input-shadow: none
	 * --ml-input-hover-border-color: var(--ml-color-border)
	 * --ml-input-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-input-gap: var(--ml-space-2)
	 *
	 * Field
	 * --ml-input-color: var(--ml-color-text)
	 * --ml-input-font-family: var(--ml-font-sans)
	 * --ml-input-font-size: var(--ml-text-sm)
	 * --ml-input-line-height: var(--ml-leading-normal)
	 * --ml-input-placeholder-color: var(--ml-color-text-muted)
	 *
	 * Focus
	 * --ml-input-focus-border-color: var(--ml-color-primary)
	 * --ml-input-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-input-focus-inset-shadow: none
	 *
	 * Error
	 * --ml-input-error-border-color: var(--ml-color-danger)
	 * --ml-input-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-input-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-input-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-input-disabled-color: var(--ml-color-text-muted)
	 *
	 * Hint
	 * --ml-input-hint-color: var(--ml-color-text-muted)
	 * --ml-input-hint-font-size: var(--ml-text-sm)
	 *
	 * Prefix / Suffix
	 * --ml-input-addon-color: var(--ml-color-text-muted)
	 *
	 * Transition
	 * --ml-input-transition-duration: var(--ml-duration-150)
	 * --ml-input-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
		min-width: 0;
	}

	.ml-input {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-input__label {
		font-size: var(--ml-input-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-input-label-font-weight, var(--ml-font-medium));
		color: var(--ml-input-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-input-label-line-height, var(--ml-leading-tight));
	}

	.ml-input__required {
		color: var(--ml-input-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-input__wrapper {
		display: flex;
		align-items: center;
		gap: var(--ml-input-gap, var(--ml-space-2));
		padding: var(--ml-input-padding, var(--ml-space-2-5) var(--ml-space-3-5));
		background-color: var(--ml-input-bg, var(--ml-color-input-bg));
		border: var(--ml-input-border-width, var(--ml-border)) solid var(--ml-input-border-color, var(--ml-color-border));
		border-radius: var(--ml-input-border-radius, var(--ml-radius));
		box-shadow: var(--ml-input-shadow, none);
		transition:
			border-color var(--ml-input-transition-duration, var(--ml-duration-150)) var(--ml-input-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-input-transition-duration, var(--ml-duration-150)) var(--ml-input-transition-easing, var(--ml-ease-in-out));
	}

	.ml-input__wrapper:hover:not(.ml-input--disabled .ml-input__wrapper) {
		border-color: var(--ml-input-hover-border-color, var(--ml-color-border));
	}

	.ml-input__field {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--ml-input-color, var(--ml-color-text));
		font-family: var(--ml-input-font-family, var(--ml-font-sans));
		font-size: var(--ml-input-font-size, var(--ml-text-sm));
		line-height: var(--ml-input-line-height, var(--ml-leading-normal));
	}

	.ml-input__field:focus {
		outline: none;
	}

	.ml-input__field::placeholder {
		color: var(--ml-input-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-input__field:disabled {
		cursor: not-allowed;
		color: var(--ml-input-disabled-color, var(--ml-color-text-muted));
	}

	.ml-input__hint,
	.ml-input__error {
		font-size: var(--ml-input-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-input-label-line-height, var(--ml-leading-tight));
	}

	.ml-input__hint {
		color: var(--ml-input-hint-color, var(--ml-color-text-muted));
	}

	.ml-input__error {
		color: var(--ml-input-error-color, var(--ml-color-danger));
	}

	.ml-input--focused .ml-input__wrapper {
		border-color: var(--ml-input-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-input-focus-shadow, var(--ml-shadow-focus-ring)), var(--ml-input-focus-inset-shadow, none);
	}

	.ml-input--error .ml-input__wrapper {
		border-color: var(--ml-input-error-border-color, var(--ml-color-danger));
	}

	.ml-input--error.ml-input--focused .ml-input__wrapper {
		box-shadow: var(--ml-input-error-focus-shadow, var(--ml-shadow-ring-error));
	}

	.ml-input--disabled .ml-input__wrapper {
		background-color: var(--ml-input-disabled-bg, var(--ml-color-input-disabled-bg));
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
		color: var(--ml-input-addon-color, var(--ml-color-text-muted));
		flex-shrink: 0;
	}
`;
registerAdapter((el) => el.tagName === "ML-INPUT", {
	inputEvent: "ml:input",
	blurEvent: "focusout",
	getValue: (el) => el.value ?? "",
	setValue: (el, value) => {
		el.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
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
		this.name = "";
		this.maxlength = null;
		this.minlength = null;
		this.min = "";
		this.max = "";
		this.step = "";
		this.pattern = "";
		this.inputmode = "";
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
	get fieldLabel() {
		return this.label || this.elementRef?.getAttribute("aria-label") || this.placeholder || "";
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
		"autocomplete",
		"name",
		"maxlength",
		"minlength",
		"min",
		"max",
		"step",
		"pattern",
		"inputmode"
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
				name="${c.name}"
				aria-label=${c.label ? "" : c.fieldLabel}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-textarea-label-font-size: var(--ml-text-sm)
	 * --ml-textarea-label-font-weight: var(--ml-font-medium)
	 * --ml-textarea-label-color: var(--ml-color-text-secondary)
	 * --ml-textarea-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-textarea-required-color: var(--ml-color-danger)
	 *
	 * Field
	 * --ml-textarea-bg: var(--ml-color-input-bg)
	 * --ml-textarea-border-width: var(--ml-border)
	 * --ml-textarea-border-color: var(--ml-color-border)
	 * --ml-textarea-border-radius: var(--ml-radius)
	 * --ml-textarea-shadow: none
	 * --ml-textarea-color: var(--ml-color-text)
	 * --ml-textarea-font-family: var(--ml-font-sans)
	 * --ml-textarea-font-size: var(--ml-text-sm)
	 * --ml-textarea-line-height: var(--ml-leading-normal)
	 * --ml-textarea-padding: var(--ml-space-3) var(--ml-space-3-5)
	 * --ml-textarea-min-height: 80px
	 * --ml-textarea-placeholder-color: var(--ml-color-text-muted)
	 * --ml-textarea-hover-border-color: var(--ml-color-border)
	 *
	 * Focus
	 * --ml-textarea-focus-border-color: var(--ml-color-primary)
	 * --ml-textarea-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-textarea-focus-inset-shadow: none
	 *
	 * Error
	 * --ml-textarea-error-border-color: var(--ml-color-danger)
	 * --ml-textarea-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-textarea-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-textarea-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-textarea-disabled-color: var(--ml-color-text-muted)
	 *
	 * Hint / Counter
	 * --ml-textarea-hint-color: var(--ml-color-text-muted)
	 * --ml-textarea-hint-font-size: var(--ml-text-sm)
	 * --ml-textarea-counter-font-size: var(--ml-text-xs)
	 * --ml-textarea-counter-color: var(--ml-color-text-muted)
	 *
	 * Transition
	 * --ml-textarea-transition-duration: var(--ml-duration-150)
	 * --ml-textarea-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
		min-width: 0;
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-textarea__label {
		font-size: var(--ml-textarea-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-textarea-label-font-weight, var(--ml-font-medium));
		color: var(--ml-textarea-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-textarea-label-line-height, var(--ml-leading-tight));
	}

	.ml-textarea__required {
		color: var(--ml-textarea-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-textarea__field {
		box-sizing: border-box;
		width: 100%;
		min-height: var(--ml-textarea-min-height, 80px);
		padding: var(--ml-textarea-padding, var(--ml-space-3) var(--ml-space-3-5));
		background-color: var(--ml-textarea-bg, var(--ml-color-input-bg));
		border: var(--ml-textarea-border-width, var(--ml-border)) solid var(--ml-textarea-border-color, var(--ml-color-border));
		border-radius: var(--ml-textarea-border-radius, var(--ml-radius));
		box-shadow: var(--ml-textarea-shadow, none);
		color: var(--ml-textarea-color, var(--ml-color-text));
		font-family: var(--ml-textarea-font-family, var(--ml-font-sans));
		font-size: var(--ml-textarea-font-size, var(--ml-text-sm));
		line-height: var(--ml-textarea-line-height, var(--ml-leading-normal));
		resize: none;
		transition:
			border-color var(--ml-textarea-transition-duration, var(--ml-duration-150)) var(--ml-textarea-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-textarea-transition-duration, var(--ml-duration-150)) var(--ml-textarea-transition-easing, var(--ml-ease-in-out));
	}

	.ml-textarea__field:hover:not(:disabled) {
		border-color: var(--ml-textarea-hover-border-color, var(--ml-color-border));
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-textarea-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-textarea-focus-shadow, var(--ml-shadow-focus-ring)), var(--ml-textarea-focus-inset-shadow, none);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-textarea-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-textarea-disabled-bg, var(--ml-color-input-disabled-bg));
		cursor: not-allowed;
		color: var(--ml-textarea-disabled-color, var(--ml-color-text-muted));
	}

	.ml-textarea__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	.ml-textarea__error,
	.ml-textarea__hint {
		font-size: var(--ml-textarea-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-textarea-label-line-height, var(--ml-leading-tight));
	}

	.ml-textarea__error {
		color: var(--ml-textarea-error-color, var(--ml-color-danger));
	}

	.ml-textarea__hint {
		color: var(--ml-textarea-hint-color, var(--ml-color-text-muted));
	}

	.ml-textarea__counter {
		font-size: var(--ml-textarea-counter-font-size, var(--ml-text-xs));
		color: var(--ml-textarea-counter-color, var(--ml-color-text-muted));
		margin-left: auto;
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-textarea-error-border-color, var(--ml-color-danger));
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: var(--ml-textarea-error-focus-shadow, var(--ml-shadow-ring-error));
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
registerAdapter((el) => el.tagName === "ML-TEXTAREA", {
	inputEvent: "ml:input",
	blurEvent: "focusout",
	getValue: (el) => el.value ?? "",
	setValue: (el, value) => {
		el.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
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
		this.name = "";
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
	get fieldLabel() {
		return this.label || this.elementRef?.getAttribute("aria-label") || this.placeholder || "";
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
		"resize",
		"name"
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
		"ml-checkbox--disabled": c.disabled,
		"ml-checkbox--error": !!c.error
	})}
		>
			<input
				type="checkbox"
				class="ml-checkbox__input"
				name="${c.name}"
				value="${c.value}"
				.checked=${c.checked}
				.indeterminate=${c.indeterminate}
				?disabled=${c.disabled}
				aria-invalid=${c.error ? "true" : void 0}
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
		${when(!!c.error, () => html`<span class="ml-checkbox__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-checkbox__hint">${c.hint}</span>`)}`)}
	`;
}
const checkboxStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Box
	 * --ml-checkbox-box-size: 1.25rem
	 * --ml-checkbox-box-bg: var(--ml-color-input-bg)
	 * --ml-checkbox-box-border-width: var(--ml-border)
	 * --ml-checkbox-box-border-color: var(--ml-color-border-strong)
	 * --ml-checkbox-box-border-radius: var(--ml-radius-xs)
	 * --ml-checkbox-box-color: var(--ml-color-text-inverse)
	 *
	 * Checked
	 * --ml-checkbox-checked-bg: var(--ml-color-primary)
	 * --ml-checkbox-checked-border-color: var(--ml-color-primary)
	 * --ml-checkbox-checked-hover-bg: var(--ml-color-primary-hover)
	 * --ml-checkbox-checked-hover-border-color: var(--ml-color-primary-hover)
	 *
	 * Hover
	 * --ml-checkbox-hover-border-color: var(--ml-color-primary)
	 *
	 * Focus
	 * --ml-checkbox-focus-border-color: var(--ml-color-primary)
	 * --ml-checkbox-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Label
	 * --ml-checkbox-label-font-size: var(--ml-text-sm)
	 * --ml-checkbox-label-font-weight: var(--ml-font-medium)
	 * --ml-checkbox-label-color: var(--ml-color-text-secondary)
	 * --ml-checkbox-label-line-height: 1.25rem
	 *
	 * Hint
	 * --ml-checkbox-hint-font-size: var(--ml-text-sm)
	 * --ml-checkbox-hint-color: var(--ml-color-text-muted)
	 *
	 * Error
	 * --ml-checkbox-error-border-color: var(--ml-color-danger)
	 * --ml-checkbox-error-color: var(--ml-color-danger)
	 * --ml-checkbox-error-margin-top: var(--ml-space-0-5)
	 * --ml-checkbox-error-line-height: var(--ml-leading-tight)
	 *
	 * Gap
	 * --ml-checkbox-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-checkbox-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-checkbox-transition-duration: var(--ml-duration-150)
	 * --ml-checkbox-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-checkbox {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-checkbox-gap, var(--ml-space-3));
		cursor: pointer;
		user-select: none;
	}

	.ml-checkbox:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		border-color: var(--ml-checkbox-hover-border-color, var(--ml-color-primary));
	}

	.ml-checkbox__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-checkbox__input:focus-visible + .ml-checkbox__box {
		border-color: var(--ml-checkbox-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-checkbox-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-checkbox__box {
		position: relative;
		flex-shrink: 0;
		display: block;
		width: var(--ml-checkbox-box-size, 1.25rem);
		height: var(--ml-checkbox-box-size, 1.25rem);
		background-color: var(--ml-checkbox-box-bg, var(--ml-color-input-bg));
		border: var(--ml-checkbox-box-border-width, var(--ml-border)) solid var(--ml-checkbox-box-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-checkbox-box-border-radius, var(--ml-radius-xs));
		color: var(--ml-checkbox-box-color, var(--ml-color-text-inverse));
		transition:
			background-color var(--ml-checkbox-transition-duration, var(--ml-duration-150)) var(--ml-checkbox-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-checkbox-transition-duration, var(--ml-duration-150)) var(--ml-checkbox-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-checkbox-transition-duration, var(--ml-duration-150)) var(--ml-checkbox-transition-easing, var(--ml-ease-in-out));
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
		font-size: var(--ml-checkbox-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-checkbox-label-font-weight, var(--ml-font-medium));
		color: var(--ml-checkbox-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-checkbox-label-line-height, 1.25rem);
	}

	.ml-checkbox__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-checkbox-box-size, 1.25rem) + var(--ml-checkbox-gap, var(--ml-space-3)));
		font-size: var(--ml-checkbox-hint-font-size, var(--ml-text-sm));
		color: var(--ml-checkbox-hint-color, var(--ml-color-text-muted));
		line-height: var(--ml-leading-tight);
	}

	.ml-checkbox__error {
		display: block;
		margin-top: var(--ml-checkbox-error-margin-top, var(--ml-space-0-5));
		margin-left: calc(var(--ml-checkbox-box-size, 1.25rem) + var(--ml-checkbox-gap, var(--ml-space-3)));
		font-size: var(--ml-checkbox-hint-font-size, var(--ml-text-sm));
		color: var(--ml-checkbox-error-color, var(--ml-color-danger));
		line-height: var(--ml-checkbox-error-line-height, var(--ml-leading-tight));
	}

	.ml-checkbox--error .ml-checkbox__box {
		border-color: var(--ml-checkbox-error-border-color, var(--ml-color-danger));
	}

	.ml-checkbox--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-checkbox--disabled .ml-checkbox__box,
	.ml-checkbox--disabled .ml-checkbox__label {
		opacity: var(--ml-checkbox-disabled-opacity, 0.5);
	}

	.ml-checkbox--checked .ml-checkbox__box,
	.ml-checkbox--indeterminate .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-bg, var(--ml-color-primary));
		border-color: var(--ml-checkbox-checked-border-color, var(--ml-color-primary));
	}

	.ml-checkbox--checked:hover:not(.ml-checkbox--disabled) .ml-checkbox__box,
	.ml-checkbox--indeterminate:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-hover-bg, var(--ml-color-primary-hover));
		border-color: var(--ml-checkbox-checked-hover-border-color, var(--ml-color-primary-hover));
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
registerAdapter((el) => el.tagName === "ML-CHECKBOX", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => Boolean(el.checked),
	setValue: (el, value) => {
		el.checked = Boolean(value);
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
var CheckboxComponent = class CheckboxComponent$1 {
	constructor() {
		this.label = "";
		this.hint = "";
		this.error = "";
		this.size = "md";
		this.checked = false;
		this.name = "";
		this.value = "on";
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
		"error",
		"size",
		"checked",
		"indeterminate",
		"disabled",
		"name",
		"value"
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
				tabindex=${c.tabbable ? "0" : "-1"}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Circle
	 * --ml-radio-circle-size: 1.25rem
	 * --ml-radio-circle-bg: var(--ml-color-input-bg)
	 * --ml-radio-circle-border-width: var(--ml-border)
	 * --ml-radio-circle-border-color: var(--ml-color-border-strong)
	 * --ml-radio-circle-border-radius: var(--ml-radius-full)
	 *
	 * Dot
	 * --ml-radio-dot-size: 0.5rem
	 * --ml-radio-dot-color: var(--ml-color-primary)
	 *
	 * Checked
	 * --ml-radio-checked-border-color: var(--ml-color-primary)
	 * --ml-radio-checked-bg: var(--ml-color-primary-subtle)
	 * --ml-radio-checked-hover-border-color: var(--ml-color-primary-hover)
	 * --ml-radio-checked-hover-dot-color: var(--ml-color-primary-hover)
	 *
	 * Hover
	 * --ml-radio-hover-border-color: var(--ml-color-primary)
	 *
	 * Focus
	 * --ml-radio-focus-border-color: var(--ml-color-primary)
	 * --ml-radio-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Label
	 * --ml-radio-label-font-size: var(--ml-text-sm)
	 * --ml-radio-label-font-weight: var(--ml-font-medium)
	 * --ml-radio-label-color: var(--ml-color-text-secondary)
	 * --ml-radio-label-line-height: 1.25rem
	 *
	 * Hint
	 * --ml-radio-hint-font-size: var(--ml-text-sm)
	 * --ml-radio-hint-color: var(--ml-color-text-muted)
	 *
	 * Gap
	 * --ml-radio-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-radio-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-radio-transition-duration: var(--ml-duration-150)
	 * --ml-radio-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-radio {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-radio-gap, var(--ml-space-3));
		cursor: pointer;
		user-select: none;
	}

	.ml-radio--disabled {
		cursor: not-allowed;
	}

	.ml-radio--disabled .ml-radio__circle,
	.ml-radio--disabled .ml-radio__label {
		opacity: var(--ml-radio-disabled-opacity, 0.5);
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
		width: var(--ml-radio-circle-size, 1.25rem);
		height: var(--ml-radio-circle-size, 1.25rem);
		background-color: var(--ml-radio-circle-bg, var(--ml-color-input-bg));
		border: var(--ml-radio-circle-border-width, var(--ml-border)) solid var(--ml-radio-circle-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-radio-circle-border-radius, var(--ml-radius-full));
		transition:
			background-color var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio__input:focus-visible + .ml-radio__circle {
		border-color: var(--ml-radio-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-radio-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio--checked .ml-radio__circle {
		border-color: var(--ml-radio-checked-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-checked-bg, var(--ml-color-primary-subtle));
	}

	.ml-radio:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-hover-border-color, var(--ml-color-primary));
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-checked-hover-border-color, var(--ml-color-primary-hover));
	}

	.ml-radio__dot {
		width: var(--ml-radio-dot-size, 0.5rem);
		height: var(--ml-radio-dot-size, 0.5rem);
		border-radius: var(--ml-radio-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-dot-color, var(--ml-color-primary));
		transform: scale(0);
		transition: transform var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio--checked .ml-radio__dot {
		transform: scale(1);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__dot {
		background-color: var(--ml-radio-checked-hover-dot-color, var(--ml-color-primary-hover));
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
		font-size: var(--ml-radio-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-label-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-radio-label-line-height, 1.25rem);
	}

	.ml-radio__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-radio-circle-size, 1.25rem) + var(--ml-radio-gap, var(--ml-space-3)));
		font-size: var(--ml-radio-hint-font-size, var(--ml-text-sm));
		color: var(--ml-radio-hint-color, var(--ml-color-text-muted));
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
		this.tabbable = true;
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
			aria-labelledby=${c.label ? "legend" : void 0}
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
registerAdapter((el) => el.tagName === "ML-RADIO-GROUP", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => el.value ?? "",
	setValue: (el, value) => {
		el.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
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
			event.stopImmediatePropagation();
			this.value = event.detail.value;
			this.updateChildRadios();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
		this.handleKeyDown = (event) => {
			if (this.disabled) return;
			let direction = 0;
			if (event.key === "ArrowRight" || event.key === "ArrowDown") direction = 1;
			else if (event.key === "ArrowLeft" || event.key === "ArrowUp") direction = -1;
			else return;
			const radios = this.getEnabledRadios();
			if (radios.length === 0) return;
			event.preventDefault();
			const originRadio = event.target?.closest?.("ml-radio") ?? null;
			let index = originRadio ? radios.indexOf(originRadio) : -1;
			if (index === -1) index = radios.findIndex((radio) => this.getRadioValue(radio) === this.value && this.value !== "");
			if (index === -1) index = direction === 1 ? -1 : 0;
			const next = radios[(index + direction + radios.length) % radios.length];
			this.selectRadio(next);
		};
	}
	onInit() {
		this.elementRef.addEventListener("ml:change", this.handleChildChange);
		this.elementRef.addEventListener("keydown", this.handleKeyDown);
	}
	onCreate() {
		(this.elementRef.shadowRoot?.querySelector("slot"))?.addEventListener("slotchange", () => this.updateChildRadios());
	}
	onRender() {
		this.updateChildRadios();
	}
	selectRadio(radio) {
		this.value = this.getRadioValue(radio);
		this.updateChildRadios();
		this.focusRadio(radio);
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value: this.value }
		}));
	}
	focusRadio(radio) {
		(radio.shadowRoot?.querySelector(".ml-radio__input"))?.focus();
	}
	getRadioValue(radio) {
		return radio.value ?? radio.getAttribute("value") ?? "";
	}
	getEnabledRadios() {
		return Array.from(this.elementRef.querySelectorAll("ml-radio")).filter((radio) => radio.disabled !== true && !radio.hasAttribute("disabled"));
	}
	updateChildRadios() {
		const radios = this.elementRef.querySelectorAll("ml-radio");
		if (this.value === "") {
			for (const radio of radios) if (radio.checked === true || radio.hasAttribute("checked")) {
				this.value = this.getRadioValue(radio);
				break;
			}
		}
		let tabbableRadio = null;
		if (this.value !== "") tabbableRadio = Array.from(radios).find((radio) => this.getRadioValue(radio) === this.value && radio.disabled !== true && !radio.hasAttribute("disabled")) ?? null;
		if (!tabbableRadio) tabbableRadio = this.getEnabledRadios()[0] ?? null;
		radios.forEach((radio) => {
			if (this.name) radio.name = this.name;
			radio.disabled = this.disabled;
			const radioValue = this.getRadioValue(radio);
			radio.checked = this.value !== "" && radioValue === this.value;
			radio.tabbable = radio === tabbableRadio;
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Legend
	 * --ml-radio-card-group-legend-font-size: var(--ml-text-sm)
	 * --ml-radio-card-group-legend-font-weight: var(--ml-font-medium)
	 * --ml-radio-card-group-legend-color: var(--ml-color-text-secondary)
	 * --ml-radio-card-group-legend-line-height: var(--ml-leading-tight)
	 * --ml-radio-card-group-legend-margin-bottom: var(--ml-space-3)
	 *
	 * Required indicator
	 * --ml-radio-card-group-required-color: var(--ml-color-danger)
	 *
	 * Options gap
	 * --ml-radio-card-group-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-radio-card-group-disabled-opacity: 0.5
	 *
	 * Hint / Error
	 * --ml-radio-card-group-hint-color: var(--ml-color-text-muted)
	 * --ml-radio-card-group-error-color: var(--ml-color-danger)
	 * --ml-radio-card-group-message-font-size: var(--ml-text-sm)
	 * --ml-radio-card-group-message-line-height: var(--ml-leading-tight)
	 */

	:host {
		display: block;
	}

	.ml-radio-card-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-card-group__legend {
		font-size: var(--ml-radio-card-group-legend-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-card-group-legend-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-card-group-legend-color, var(--ml-color-text-secondary));
		margin-bottom: var(--ml-radio-card-group-legend-margin-bottom, var(--ml-space-3));
		line-height: var(--ml-radio-card-group-legend-line-height, var(--ml-leading-tight));
	}

	.ml-radio-card-group__required {
		color: var(--ml-radio-card-group-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-radio-card-group__options {
		display: flex;
		gap: var(--ml-radio-card-group-gap, var(--ml-space-3));
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
		opacity: var(--ml-radio-card-group-disabled-opacity, 0.5);
	}

	.ml-radio-card-group__hint,
	.ml-radio-card-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-radio-card-group-message-font-size, var(--ml-text-sm));
		line-height: var(--ml-radio-card-group-message-line-height, var(--ml-leading-tight));
	}

	.ml-radio-card-group__hint {
		color: var(--ml-radio-card-group-hint-color, var(--ml-color-text-muted));
	}

	.ml-radio-card-group__error {
		color: var(--ml-radio-card-group-error-color, var(--ml-color-danger));
	}
`;
registerAdapter((el) => el.tagName === "ML-RADIO-CARD-GROUP", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => el.value ?? "",
	setValue: (el, value) => {
		el.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
var RadioCardGroupComponent = class RadioCardGroupComponent$1 {
	constructor() {
		this.value = "";
		this.label = "";
		this.hint = "";
		this.error = "";
		this.orientation = "vertical";
		this.disabled = false;
		this.required = false;
		this.handleGroupKeyDown = (event) => {
			if (![
				"ArrowDown",
				"ArrowRight",
				"ArrowUp",
				"ArrowLeft"
			].includes(event.key)) return;
			const cards = [...this.elementRef.querySelectorAll("ml-radio-card")].filter((card) => !card.hasAttribute("disabled") && !card.hasAttribute("group-disabled"));
			if (cards.length === 0) return;
			const next = cards[(Math.max(0, cards.findIndex((card) => (card.getAttribute("value") ?? "") === this.value)) + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + cards.length) % cards.length];
			event.preventDefault();
			this.value = next.getAttribute("value") ?? "";
			this.syncCards();
			next.focus();
			this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			}));
		};
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
		this.elementRef.addEventListener("keydown", this.handleGroupKeyDown);
		this.elementRef.shadowRoot?.querySelector("slot")?.addEventListener("slotchange", this.handleSlotChange);
	}
	onRender() {
		this.syncCards();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:card-select", this._handleCardSelect);
		this.elementRef.removeEventListener("keydown", this.handleGroupKeyDown);
	}
	syncCards() {
		const cards = this.elementRef.querySelectorAll("ml-radio-card");
		if (this.value === "") {
			for (const card of cards) if (card.hasAttribute("selected")) {
				this.value = card.getAttribute("value") ?? "";
				break;
			}
		}
		const enabled = [...cards].filter((card) => !card.hasAttribute("disabled"));
		const tabStopCard = enabled.find((card) => (card.getAttribute("value") ?? "") === this.value) ?? enabled[0];
		cards.forEach((card) => {
			const isSelected = (card.getAttribute("value") ?? "") === this.value;
			card.toggleAttribute("selected", isSelected);
			card.toggleAttribute("group-disabled", this.disabled);
			card.toggleAttribute("tab-stop", card === tabStopCard);
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
			tabindex=${c.isDisabled || !c.tabStop ? "-1" : "0"}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Card
	 * --ml-radio-card-padding: var(--ml-space-4)
	 * --ml-radio-card-border-width: var(--ml-border)
	 * --ml-radio-card-border-color: var(--ml-color-border)
	 * --ml-radio-card-border-radius: var(--ml-radius-lg)
	 * --ml-radio-card-bg: var(--ml-color-surface)
	 * --ml-radio-card-gap: var(--ml-space-3)
	 *
	 * Hover
	 * --ml-radio-card-hover-border-color: var(--ml-color-border-strong)
	 * --ml-radio-card-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Selected
	 * --ml-radio-card-selected-border-color: var(--ml-color-primary)
	 * --ml-radio-card-selected-bg: var(--ml-color-primary-subtle)
	 * --ml-radio-card-selected-ring: 0 0 0 1px var(--ml-color-primary)
	 * --ml-radio-card-selected-hover-border-color: var(--ml-color-primary-hover)
	 * --ml-radio-card-selected-hover-ring: 0 0 0 1px var(--ml-color-primary-hover)
	 *
	 * Focus
	 * --ml-radio-card-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Circle
	 * --ml-radio-card-circle-size: 1.25rem
	 * --ml-radio-card-circle-border-width: var(--ml-border)
	 * --ml-radio-card-circle-border-color: var(--ml-color-border-strong)
	 * --ml-radio-card-circle-bg: var(--ml-color-input-bg)
	 * --ml-radio-card-circle-border-radius: var(--ml-radius-full)
	 *
	 * Dot
	 * --ml-radio-card-dot-size: 0.5rem
	 * --ml-radio-card-dot-color: var(--ml-color-primary)
	 *
	 * Icon
	 * --ml-radio-card-icon-color: var(--ml-color-text-muted)
	 * --ml-radio-card-icon-selected-color: var(--ml-color-primary)
	 *
	 * Label
	 * --ml-radio-card-label-font-size: var(--ml-text-sm)
	 * --ml-radio-card-label-font-weight: var(--ml-font-medium)
	 * --ml-radio-card-label-color: var(--ml-color-text)
	 * --ml-radio-card-label-line-height: var(--ml-leading-tight)
	 *
	 * Description
	 * --ml-radio-card-description-font-size: var(--ml-text-sm)
	 * --ml-radio-card-description-color: var(--ml-color-text-muted)
	 * --ml-radio-card-description-line-height: var(--ml-leading-normal)
	 *
	 * Detail
	 * --ml-radio-card-detail-font-size: var(--ml-text-sm)
	 * --ml-radio-card-detail-font-weight: var(--ml-font-medium)
	 * --ml-radio-card-detail-color: var(--ml-color-text)
	 * --ml-radio-card-detail-line-height: var(--ml-leading-tight)
	 *
	 * Disabled
	 * --ml-radio-card-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-radio-card-transition-duration: var(--ml-duration-150)
	 * --ml-radio-card-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-radio-card {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap, var(--ml-space-3));
		padding: var(--ml-radio-card-padding, var(--ml-space-4));
		border: var(--ml-radio-card-border-width, var(--ml-border)) solid var(--ml-radio-card-border-color, var(--ml-color-border));
		border-radius: var(--ml-radio-card-border-radius, var(--ml-radius-lg));
		background-color: var(--ml-radio-card-bg, var(--ml-color-surface));
		cursor: pointer;
		transition:
			border-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-hover-border-color, var(--ml-color-border-strong));
		background-color: var(--ml-radio-card-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-radio-card--selected {
		border-color: var(--ml-radio-card-selected-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
		box-shadow: var(--ml-radio-card-selected-ring, 0 0 0 1px var(--ml-color-primary));
	}

	.ml-radio-card--selected:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-selected-hover-border-color, var(--ml-color-primary-hover));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
		box-shadow: var(--ml-radio-card-selected-hover-ring, 0 0 0 1px var(--ml-color-primary-hover));
	}

	.ml-radio-card:focus-visible {
		outline: none;
		box-shadow: var(--ml-radio-card-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio-card--selected:focus-visible {
		box-shadow: var(--ml-radio-card-selected-ring, 0 0 0 1px var(--ml-color-primary)), var(--ml-radio-card-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio-card--disabled {
		opacity: var(--ml-radio-card-disabled-opacity, 0.5);
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
		width: var(--ml-radio-card-circle-size, 1.25rem);
		height: var(--ml-radio-card-circle-size, 1.25rem);
		border: var(--ml-radio-card-circle-border-width, var(--ml-border)) solid var(--ml-radio-card-circle-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-radio-card-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-card-circle-bg, var(--ml-color-input-bg));
		transition:
			border-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card--selected .ml-radio-card__circle {
		border-color: var(--ml-radio-card-selected-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-radio-card__dot {
		width: var(--ml-radio-card-dot-size, 0.5rem);
		height: var(--ml-radio-card-dot-size, 0.5rem);
		border-radius: var(--ml-radio-card-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-card-dot-color, var(--ml-color-primary));
		transform: scale(0);
		transition: transform var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card--selected .ml-radio-card__dot {
		transform: scale(1);
	}

	/* Content area */
	.ml-radio-card__content {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap, var(--ml-space-3));
		flex: 1;
		min-width: 0;
	}

	.ml-radio-card__icon {
		flex-shrink: 0;
		color: var(--ml-radio-card-icon-color, var(--ml-color-text-muted));
	}

	.ml-radio-card--selected .ml-radio-card__icon {
		color: var(--ml-radio-card-icon-selected-color, var(--ml-color-primary));
	}

	.ml-radio-card__text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		min-width: 0;
	}

	.ml-radio-card__label {
		font-size: var(--ml-radio-card-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-card-label-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-card-label-color, var(--ml-color-text));
		line-height: var(--ml-radio-card-label-line-height, var(--ml-leading-tight));
	}

	.ml-radio-card__description {
		font-size: var(--ml-radio-card-description-font-size, var(--ml-text-sm));
		color: var(--ml-radio-card-description-color, var(--ml-color-text-muted));
		line-height: var(--ml-radio-card-description-line-height, var(--ml-leading-normal));
	}

	/* Detail (e.g. price) */
	.ml-radio-card__detail {
		flex-shrink: 0;
		font-size: var(--ml-radio-card-detail-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-card-detail-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-card-detail-color, var(--ml-color-text));
		line-height: var(--ml-radio-card-detail-line-height, var(--ml-leading-tight));
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
		this.tabStop = false;
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
		"group-disabled",
		"tab-stop"
	]
})], RadioCardComponent);
function toggleTemplate(c) {
	return html`
		<label
			class=${classMap({
		"ml-toggle": true,
		[`ml-toggle--${c.size}`]: true,
		"ml-toggle--checked": c.checked,
		"ml-toggle--disabled": c.disabled,
		"ml-toggle--error": !!c.error
	})}
		>
			<input
				type="checkbox"
				class="ml-toggle__input"
				.checked=${c.checked}
				?disabled=${c.disabled}
				aria-invalid=${c.error ? "true" : void 0}
				@change=${c.handleChange}
			/>
			<span class="ml-toggle__track">
				<span class="ml-toggle__thumb"></span>
			</span>
			${when(!!c.label, () => html`<span class="ml-toggle__label">${c.label}</span>`)}
		</label>
		${when(!!c.error, () => html`<span class="ml-toggle__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-toggle__hint">${c.hint}</span>`)}`)}
	`;
}
const toggleStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Track
	 * --ml-toggle-track-width: 2.75rem
	 * --ml-toggle-track-height: 1.5rem
	 * --ml-toggle-track-bg: var(--ml-color-toggle-off)
	 * --ml-toggle-track-hover-bg: var(--ml-color-toggle-off-hover)
	 * --ml-toggle-track-checked-bg: var(--ml-color-primary)
	 * --ml-toggle-track-checked-hover-bg: var(--ml-color-primary-hover)
	 * --ml-toggle-track-border-radius: var(--ml-radius-full)
	 *
	 * Thumb
	 * --ml-toggle-thumb-size: 1.25rem
	 * --ml-toggle-thumb-bg: var(--ml-white)
	 * --ml-toggle-thumb-border-radius: var(--ml-radius-full)
	 * --ml-toggle-thumb-shadow: var(--ml-shadow-sm)
	 * --ml-toggle-thumb-offset: 0.125rem
	 * --ml-toggle-thumb-translate: 1.25rem
	 *
	 * Focus
	 * --ml-toggle-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Label
	 * --ml-toggle-label-font-size: var(--ml-text-sm)
	 * --ml-toggle-label-font-weight: var(--ml-font-medium)
	 * --ml-toggle-label-color: var(--ml-color-text-secondary)
	 *
	 * Hint
	 * --ml-toggle-hint-font-size: var(--ml-text-sm)
	 * --ml-toggle-hint-color: var(--ml-color-text-muted)
	 *
	 * Error
	 * --ml-toggle-error-track-bg: var(--ml-color-danger)
	 * --ml-toggle-error-color: var(--ml-color-danger)
	 * --ml-toggle-error-margin-top: var(--ml-space-1)
	 * --ml-toggle-error-line-height: var(--ml-leading-tight)
	 *
	 * Gap
	 * --ml-toggle-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-toggle-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-toggle-transition-duration: var(--ml-duration-200)
	 * --ml-toggle-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-toggle-gap, var(--ml-space-3));
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-toggle--disabled .ml-toggle__track,
	.ml-toggle--disabled .ml-toggle__label {
		opacity: var(--ml-toggle-disabled-opacity, 0.5);
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
		width: var(--ml-toggle-track-width, 2.75rem);
		height: var(--ml-toggle-track-height, 1.5rem);
		background-color: var(--ml-toggle-track-bg, var(--ml-color-toggle-off));
		border-radius: var(--ml-toggle-track-border-radius, var(--ml-radius-full));
		transition:
			background-color var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out));
	}

	.ml-toggle__input:focus-visible + .ml-toggle__track {
		box-shadow: var(--ml-toggle-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-bg, var(--ml-color-primary));
	}

	.ml-toggle:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-hover-bg, var(--ml-color-toggle-off-hover));
	}

	.ml-toggle--checked:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-toggle__thumb {
		position: absolute;
		width: var(--ml-toggle-thumb-size, 1.25rem);
		height: var(--ml-toggle-thumb-size, 1.25rem);
		left: var(--ml-toggle-thumb-offset, 0.125rem);
		background-color: var(--ml-toggle-thumb-bg, var(--ml-white));
		border-radius: var(--ml-toggle-thumb-border-radius, var(--ml-radius-full));
		box-shadow: var(--ml-toggle-thumb-shadow, var(--ml-shadow-sm));
		transition: transform var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out));
	}

	/* --- Size variants --- */
	.ml-toggle--sm {
		--ml-toggle-track-width: 2.25rem;
		--ml-toggle-track-height: 1.25rem;
		--ml-toggle-thumb-size: 1rem;
		--ml-toggle-thumb-translate: 1rem;
	}

	.ml-toggle--sm.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle--md {
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-translate: 1.25rem;
	}

	.ml-toggle--md.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle--lg {
		--ml-toggle-track-width: 3rem;
		--ml-toggle-track-height: 1.75rem;
		--ml-toggle-thumb-size: 1.5rem;
		--ml-toggle-thumb-translate: 1.25rem;
		--ml-toggle-label-font-size: var(--ml-text-base);
	}

	.ml-toggle--lg.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle__label {
		font-size: var(--ml-toggle-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-toggle-label-font-weight, var(--ml-font-medium));
		color: var(--ml-toggle-label-color, var(--ml-color-text-secondary));
	}

	.ml-toggle__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(var(--ml-toggle-track-width, 2.75rem) + var(--ml-toggle-gap, var(--ml-space-3)));
		font-size: var(--ml-toggle-hint-font-size, var(--ml-text-sm));
		color: var(--ml-toggle-hint-color, var(--ml-color-text-muted));
		line-height: var(--ml-leading-tight);
	}

	.ml-toggle__error {
		display: block;
		margin-top: var(--ml-toggle-error-margin-top, var(--ml-space-1));
		margin-left: calc(var(--ml-toggle-track-width, 2.75rem) + var(--ml-toggle-gap, var(--ml-space-3)));
		font-size: var(--ml-toggle-hint-font-size, var(--ml-text-sm));
		color: var(--ml-toggle-error-color, var(--ml-color-danger));
		line-height: var(--ml-toggle-error-line-height, var(--ml-leading-tight));
	}

	.ml-toggle--error.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-error-track-bg, var(--ml-color-danger));
	}
`;
registerAdapter((el) => el.tagName === "ML-TOGGLE", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => Boolean(el.checked),
	setValue: (el, value) => {
		el.checked = Boolean(value);
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
var ToggleComponent = class ToggleComponent$1 {
	constructor() {
		this.label = "";
		this.hint = "";
		this.error = "";
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
		"error",
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
					<label id=${c.labelId} class="ml-select__label">
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
					aria-controls=${c.listboxId}
					aria-activedescendant=${c.activeDescendant}
					aria-labelledby=${c.label ? c.labelId : void 0}
					@click=${c.toggle}
				>
					<span class="ml-select__value">
						${when(c.multiple, () => renderMultiValue(c), () => renderSingleValue(c))}
					</span>
					<ml-icon icon="caret-down" size="sm" format="regular" class="ml-select__chevron"></ml-icon>
				</div>

				<div
					id=${c.listboxId}
					class="ml-select__dropdown"
					role="listbox"
					popover="auto"
					aria-multiselectable=${c.multiple || false}
				>
					${c.filteredOptions.length ? repeat(c.filteredOptions, (option) => option.value, (option, index) => renderOption(c, option, index)) : html`<div class="ml-select__empty">No results found</div>`}
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
			id=${c.optionId(index)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-select-label-font-size: var(--ml-text-sm)
	 * --ml-select-label-font-weight: var(--ml-font-medium)
	 * --ml-select-label-color: var(--ml-color-text-secondary)
	 * --ml-select-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-select-required-color: var(--ml-color-danger)
	 *
	 * Trigger
	 * --ml-select-bg: var(--ml-color-input-bg)
	 * --ml-select-border-width: var(--ml-border)
	 * --ml-select-border-color: var(--ml-color-border)
	 * --ml-select-border-radius: var(--ml-radius)
	 * --ml-select-color: var(--ml-color-text)
	 * --ml-select-font-family: var(--ml-font-sans)
	 * --ml-select-font-size: var(--ml-text-sm)
	 * --ml-select-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-select-gap: var(--ml-space-2)
	 * --ml-select-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Focus
	 * --ml-select-focus-border-color: var(--ml-color-primary)
	 * --ml-select-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-select-focus-inset-shadow: none
	 *
	 * Error
	 * --ml-select-error-border-color: var(--ml-color-danger)
	 * --ml-select-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-select-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-select-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-select-disabled-color: var(--ml-color-text-muted)
	 *
	 * Placeholder
	 * --ml-select-placeholder-color: var(--ml-color-text-muted)
	 *
	 * Chevron / Icons
	 * --ml-select-icon-color: var(--ml-color-text-muted)
	 *
	 * Dropdown
	 * --ml-select-dropdown-bg: var(--ml-color-surface)
	 * --ml-select-dropdown-border-color: var(--ml-color-border)
	 * --ml-select-dropdown-border-radius: var(--ml-radius)
	 * --ml-select-dropdown-shadow: var(--ml-shadow-lg)
	 * --ml-select-dropdown-max-height: 280px
	 * --ml-select-dropdown-padding: var(--ml-space-1-5)
	 *
	 * Option
	 * --ml-select-option-padding: var(--ml-space-2) var(--ml-space-3)
	 * --ml-select-option-border-radius: var(--ml-radius-sm)
	 * --ml-select-option-font-size: var(--ml-text-sm)
	 * --ml-select-option-font-weight: var(--ml-font-medium)
	 * --ml-select-option-color: var(--ml-color-text)
	 * --ml-select-option-hover-bg: var(--ml-color-surface-raised)
	 * --ml-select-option-selected-bg: var(--ml-color-primary-subtle)
	 * --ml-select-option-disabled-color: var(--ml-color-text-muted)
	 * --ml-select-option-check-color: var(--ml-color-primary)
	 *
	 * Tag (multi-select)
	 * --ml-select-tag-height: 20px
	 * --ml-select-tag-border-radius: var(--ml-radius-full)
	 * --ml-select-tag-border-color: var(--ml-color-border)
	 * --ml-select-tag-bg: var(--ml-color-surface)
	 * --ml-select-tag-font-size: var(--ml-text-xs)
	 * --ml-select-tag-font-weight: var(--ml-font-medium)
	 * --ml-select-tag-color: var(--ml-color-text)
	 * --ml-select-tag-remove-color: var(--ml-color-text-secondary)
	 * --ml-select-tag-remove-hover-color: var(--ml-color-text)
	 * --ml-select-tag-remove-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Hint
	 * --ml-select-hint-color: var(--ml-color-text-muted)
	 * --ml-select-hint-font-size: var(--ml-text-sm)
	 *
	 * Transition
	 * --ml-select-transition-duration: var(--ml-duration-150)
	 * --ml-select-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
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
		font-size: var(--ml-select-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-select-label-font-weight, var(--ml-font-medium));
		color: var(--ml-select-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-select-label-line-height, var(--ml-leading-tight));
	}

	.ml-select__required {
		color: var(--ml-select-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-select__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-select-gap, var(--ml-space-2));
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		padding: var(--ml-select-padding, var(--ml-space-2-5) var(--ml-space-3-5));
		background-color: var(--ml-select-bg, var(--ml-color-input-bg));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-border-color, var(--ml-color-border));
		border-radius: var(--ml-select-border-radius, var(--ml-radius));
		box-shadow: none;
		color: var(--ml-select-color, var(--ml-color-text));
		font-family: var(--ml-select-font-family, var(--ml-font-sans));
		font-size: var(--ml-select-font-size, var(--ml-text-sm));
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--ml-select-transition-duration, var(--ml-duration-150)) var(--ml-select-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-select-transition-duration, var(--ml-duration-150)) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select:not(.ml-select--disabled) .ml-select__trigger:hover {
		border-color: var(--ml-select-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-select__trigger:focus,
	.ml-select__trigger:focus-within {
		outline: none;
		border-color: var(--ml-select-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-select-focus-shadow, var(--ml-shadow-focus-ring)), var(--ml-select-focus-inset-shadow, none);
	}

	.ml-select--disabled .ml-select__trigger {
		background-color: var(--ml-select-disabled-bg, var(--ml-color-input-disabled-bg));
		cursor: not-allowed;
		color: var(--ml-select-disabled-color, var(--ml-color-text-muted));
	}

	.ml-select--disabled .ml-select__search {
		color: var(--ml-select-disabled-color, var(--ml-color-text-muted));
	}

	.ml-select__value {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap, var(--ml-space-2));
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
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
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
		color: var(--ml-select-color, var(--ml-color-text));
		padding: 0;
		line-height: 20px;
	}

	.ml-select__search::placeholder {
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__placeholder {
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__value-icon {
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
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
		height: var(--ml-select-tag-height, 20px);
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-tag-border-color, var(--ml-color-border));
		background-color: var(--ml-select-tag-bg, var(--ml-color-surface));
		font-size: var(--ml-select-tag-font-size, var(--ml-text-xs));
		font-weight: var(--ml-select-tag-font-weight, var(--ml-font-medium));
		color: var(--ml-select-tag-color, var(--ml-color-text));
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
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-select__tag-remove {
		border: none;
		background: transparent;
		padding: 2px;
		margin-left: var(--ml-space-0-5);
		margin-right: -4px;
		color: var(--ml-select-tag-remove-color, var(--ml-color-text-secondary));
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		transition: color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select__tag-remove:hover {
		color: var(--ml-select-tag-remove-hover-color, var(--ml-color-text));
		background-color: var(--ml-select-tag-remove-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__chevron {
		flex-shrink: 0;
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
		transition: transform var(--ml-duration-200) var(--ml-select-transition-easing, var(--ml-ease-in-out));
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
		background-color: var(--ml-select-dropdown-bg, var(--ml-color-surface));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-dropdown-border-color, var(--ml-color-border));
		border-radius: var(--ml-select-dropdown-border-radius, var(--ml-radius));
		box-shadow: var(--ml-select-dropdown-shadow, var(--ml-shadow-lg));
		max-height: var(--ml-select-dropdown-max-height, 280px);
		overflow-y: auto;
		padding: var(--ml-select-dropdown-padding, var(--ml-space-1-5));
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-select__dropdown:not(:popover-open) {
		display: none;
	}

	.ml-select__empty {
		padding: var(--ml-select-option-padding, var(--ml-space-2) var(--ml-space-3));
		font-size: var(--ml-select-option-font-size, var(--ml-text-sm));
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__option {
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap, var(--ml-space-2));
		padding: var(--ml-select-option-padding, var(--ml-space-2) var(--ml-space-3));
		border-radius: var(--ml-select-option-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		font-size: var(--ml-select-option-font-size, var(--ml-text-sm));
		font-weight: var(--ml-select-option-font-weight, var(--ml-font-medium));
		color: var(--ml-select-option-color, var(--ml-color-text));
		transition: background-color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select__option:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__option--focused {
		background-color: var(--ml-select-option-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__option--selected {
		background-color: var(--ml-select-option-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-select__option--selected:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-select__option--disabled {
		color: var(--ml-select-option-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
	}

	.ml-select__option-icon {
		flex-shrink: 0;
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
	}

	.ml-select__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-select__option--selected .ml-select__option-icon {
		color: var(--ml-select-option-check-color, var(--ml-color-primary));
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
		color: var(--ml-select-option-check-color, var(--ml-color-primary));
		margin-left: auto;
	}

	.ml-select__hint,
	.ml-select__error {
		font-size: var(--ml-select-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-select-label-line-height, var(--ml-leading-tight));
	}

	.ml-select__hint {
		color: var(--ml-select-hint-color, var(--ml-color-text-muted));
	}

	.ml-select__error {
		color: var(--ml-select-error-color, var(--ml-color-danger));
	}

	.ml-select--error .ml-select__trigger {
		border-color: var(--ml-select-error-border-color, var(--ml-color-danger));
	}

	.ml-select--error .ml-select__trigger:focus {
		box-shadow: var(--ml-select-error-focus-shadow, var(--ml-shadow-ring-error));
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
registerAdapter((el) => el.tagName === "ML-SELECT", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => {
		const e = el;
		return e.multiple ? e.values ?? [] : e.value ?? "";
	},
	setValue: (el, value) => {
		const e = el;
		if (Array.isArray(value)) e.values = value;
		else e.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
var TYPEAHEAD_RESET_MS = 700;
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
		this._uid = newID();
		this._positioner = new OverlayPositioner(() => ({
			placement: "bottom-start",
			offset: 4,
			matchTriggerWidth: true
		}));
		this._lastCloseTime = 0;
		this._syncingValues = false;
		this._typeaheadBuffer = "";
		this._typeaheadLastTime = 0;
		this.optionId = (index) => {
			return `${this.listboxId}-option-${index}`;
		};
		this.toggle = () => {
			if (this.disabled) return;
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
		this.stopPositioning();
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
	get labelId() {
		return `ml-select-label-${this._uid}`;
	}
	get listboxId() {
		return `ml-select-listbox-${this._uid}`;
	}
	get activeDescendant() {
		return this.isOpen && this.focusedIndex >= 0 ? this.optionId(this.focusedIndex) : void 0;
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
			this.startPositioning();
			this.elementRef.dispatchEvent(new CustomEvent("ml:open", {
				bubbles: true,
				composed: true
			}));
		} else {
			this.isOpen = false;
			this.focusedIndex = -1;
			this.search = "";
			this._typeaheadBuffer = "";
			this._lastCloseTime = Date.now();
			this.stopPositioning();
			this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
				bubbles: true,
				composed: true
			}));
		}
	}
	startPositioning() {
		const triggerEl = this.elementRef.shadowRoot?.querySelector(".ml-select__trigger");
		const dropdownEl = this.getDropdownEl();
		if (!triggerEl || !dropdownEl) return;
		this._positioner.start(triggerEl, dropdownEl);
	}
	stopPositioning() {
		this._positioner.stop();
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
				if (isSearchInput && (event.key === " " || !this.isOpen || this.focusedIndex < 0)) return;
				event.preventDefault();
				if (this.isOpen && this.focusedIndex >= 0) {
					const option = this.getActiveOptions()[this.focusedIndex];
					if (option && !option.disabled) this.selectOption(option);
				} else this.toggle();
				break;
			case "Escape":
				if (!this.isOpen) return;
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
				if (this.isOpen) {
					this.focusedIndex = this.findFirstEnabledIndex();
					this.scrollFocusedOptionIntoView();
				}
				break;
			case "End":
				event.preventDefault();
				if (this.isOpen) {
					this.focusedIndex = this.findLastEnabledIndex();
					this.scrollFocusedOptionIntoView();
				}
				break;
			case "Tab":
				this.close();
				break;
			default:
				if (!isSearchInput) this.handleTypeahead(event);
				break;
		}
	}
	handleTypeahead(event) {
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
		event.preventDefault();
		const now = Date.now();
		if (now - this._typeaheadLastTime > TYPEAHEAD_RESET_MS) this._typeaheadBuffer = "";
		this._typeaheadLastTime = now;
		this._typeaheadBuffer += event.key.toLowerCase();
		const query = this._typeaheadBuffer.length > 1 && this._typeaheadBuffer.split("").every((char) => char === this._typeaheadBuffer[0]) ? this._typeaheadBuffer[0] : this._typeaheadBuffer;
		const options = this.getActiveOptions();
		const startIndex = this.isOpen ? this.focusedIndex : options.findIndex((opt) => opt.value === this.value);
		const matchIndex = this.findTypeaheadMatch(query, startIndex);
		if (matchIndex < 0) return;
		if (this.isOpen) {
			this.focusedIndex = matchIndex;
			this.scrollFocusedOptionIntoView();
			return;
		}
		if (this.multiple) return;
		this.selectOption(options[matchIndex]);
	}
	findTypeaheadMatch(query, startIndex) {
		const options = this.getActiveOptions();
		for (let offset$1 = 1; offset$1 <= options.length; offset$1++) {
			const index = (startIndex + offset$1) % options.length;
			const option = options[index];
			if (!option.disabled && option.label.toLowerCase().startsWith(query)) return index;
		}
		return -1;
	}
	scrollFocusedOptionIntoView() {
		if (this.focusedIndex < 0) return;
		(this.elementRef.shadowRoot?.getElementById(this.optionId(this.focusedIndex)))?.scrollIntoView({ block: "nearest" });
	}
	focusNextOption() {
		let index = this.focusedIndex + 1;
		const options = this.getActiveOptions();
		while (index < options.length) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				this.scrollFocusedOptionIntoView();
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
				this.scrollFocusedOptionIntoView();
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label / Value
	 * --ml-slider-label-font-size: var(--ml-text-sm)
	 * --ml-slider-label-font-weight: var(--ml-font-medium)
	 * --ml-slider-label-color: var(--ml-color-text)
	 *
	 * Track
	 * --ml-slider-track-height: 6px
	 * --ml-slider-track-bg: var(--ml-color-surface-hover)
	 * --ml-slider-track-border-radius: var(--ml-radius-full)
	 *
	 * Fill
	 * --ml-slider-fill-color: var(--ml-color-primary)
	 *
	 * Thumb
	 * --ml-slider-thumb-size: 20px
	 * --ml-slider-thumb-bg: var(--ml-color-surface)
	 * --ml-slider-thumb-border-width: 2px
	 * --ml-slider-thumb-border-color: var(--ml-color-primary)
	 * --ml-slider-thumb-border-radius: var(--ml-radius-full)
	 * --ml-slider-thumb-shadow: var(--ml-shadow-sm)
	 * --ml-slider-thumb-hover-shadow: var(--ml-shadow-md)
	 * --ml-slider-thumb-focus-shadow: 0 0 0 3px var(--ml-color-primary-subtle)
	 *
	 * Error
	 * --ml-slider-error-fill-color: var(--ml-color-danger)
	 * --ml-slider-error-thumb-border-color: var(--ml-color-danger)
	 * --ml-slider-error-color: var(--ml-color-danger)
	 *
	 * Hint
	 * --ml-slider-hint-font-size: var(--ml-text-sm)
	 * --ml-slider-hint-color: var(--ml-color-text-tertiary)
	 *
	 * Disabled
	 * --ml-slider-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-slider-transition-duration: var(--ml-duration-150)
	 * --ml-slider-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-slider__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-slider__label {
		font-size: var(--ml-slider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-slider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-slider-label-color, var(--ml-color-text));
	}

	.ml-slider__value {
		font-size: var(--ml-slider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-slider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-slider-label-color, var(--ml-color-text));
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
		height: var(--ml-slider-track-height, 6px);
		background-color: var(--ml-slider-track-bg, var(--ml-color-surface-hover));
		border-radius: var(--ml-slider-track-border-radius, var(--ml-radius-full));
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
		height: var(--ml-slider-track-height, 6px);
		background-color: var(--ml-slider-fill-color, var(--ml-color-primary));
		border-radius: var(--ml-slider-track-border-radius, var(--ml-radius-full));
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
		background-color: var(--ml-slider-error-fill-color, var(--ml-color-danger));
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
		opacity: var(--ml-slider-disabled-opacity, 0.5);
	}

	/* Webkit thumb */
	.ml-slider__input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: var(--ml-slider-thumb-size, 20px);
		height: var(--ml-slider-thumb-size, 20px);
		border-radius: var(--ml-slider-thumb-border-radius, var(--ml-radius-full));
		background-color: var(--ml-slider-thumb-bg, var(--ml-color-surface));
		border: var(--ml-slider-thumb-border-width, 2px) solid var(--ml-slider-thumb-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-slider-thumb-shadow, var(--ml-shadow-sm));
		transition:
			box-shadow var(--ml-slider-transition-duration, var(--ml-duration-150)) var(--ml-slider-transition-easing, var(--ml-ease-in-out)),
			transform var(--ml-slider-transition-duration, var(--ml-duration-150)) var(--ml-slider-transition-easing, var(--ml-ease-in-out));
	}

	.ml-slider__input:hover::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-hover-shadow, var(--ml-shadow-md));
		transform: scale(1.1);
	}

	.ml-slider__input:focus-visible::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-focus-shadow, 0 0 0 3px var(--ml-color-primary-subtle));
	}

	.ml-slider--error .ml-slider__input::-webkit-slider-thumb {
		border-color: var(--ml-slider-error-thumb-border-color, var(--ml-color-danger));
	}

	/* Firefox thumb */
	.ml-slider__input::-moz-range-thumb {
		width: var(--ml-slider-thumb-size, 20px);
		height: var(--ml-slider-thumb-size, 20px);
		border-radius: var(--ml-slider-thumb-border-radius, var(--ml-radius-full));
		background-color: var(--ml-slider-thumb-bg, var(--ml-color-surface));
		border: var(--ml-slider-thumb-border-width, 2px) solid var(--ml-slider-thumb-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-slider-thumb-shadow, var(--ml-shadow-sm));
	}

	.ml-slider--error .ml-slider__input::-moz-range-thumb {
		border-color: var(--ml-slider-error-thumb-border-color, var(--ml-color-danger));
	}

	/* Hide browser track (we use custom track) */
	.ml-slider__input::-webkit-slider-runnable-track {
		height: var(--ml-slider-thumb-size, 20px);
		background: transparent;
	}

	.ml-slider__input::-moz-range-track {
		height: var(--ml-slider-thumb-size, 20px);
		background: transparent;
		border: none;
	}

	.ml-slider__hint {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size, var(--ml-text-sm));
		color: var(--ml-slider-hint-color, var(--ml-color-text-tertiary));
	}

	.ml-slider__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size, var(--ml-text-sm));
		color: var(--ml-slider-error-color, var(--ml-color-danger));
	}
`;
registerAdapter((el) => el.tagName === "ML-SLIDER", {
	inputEvent: "ml:input",
	blurEvent: "focusout",
	getValue: (el) => Number(el.value) || 0,
	setValue: (el, value) => {
		el.value = Number(value) || 0;
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
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
		return `calc(${p * 100}% + ${.5 - p} * var(--ml-slider-thumb-size))`;
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
					<label class="ml-form-field__label" @click=${c.handleLabelClick}>
						${c.label}
						${when(c.required, () => html`<span class="ml-form-field__required">*</span>`)}
					</label>
				`)}

			<div class="ml-form-field__control">
				<slot @slotchange=${c.handleSlotChange}></slot>
			</div>

			${when(!!c.error, () => html`<span id=${c.errorId} class="ml-form-field__error">${c.error}</span>`)}
			${when(!!c.hint, () => html`<span id=${c.hintId} class="ml-form-field__hint">${c.hint}</span>`)}
		</div>
	`;
}
const formFieldStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-form-field-label-font-size: var(--ml-text-sm)
	 * --ml-form-field-label-font-weight: var(--ml-font-medium)
	 * --ml-form-field-label-color: var(--ml-color-text-secondary)
	 * --ml-form-field-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-form-field-required-color: var(--ml-color-danger)
	 *
	 * Hint / Error
	 * --ml-form-field-hint-font-size: var(--ml-text-sm)
	 * --ml-form-field-hint-color: var(--ml-color-text-muted)
	 * --ml-form-field-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-form-field-disabled-label-color: var(--ml-color-text-muted)
	 *
	 * Slotted input
	 * --ml-form-field-input-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-form-field-input-font-size: var(--ml-text-sm)
	 * --ml-form-field-input-font-family: var(--ml-font-sans)
	 * --ml-form-field-input-color: var(--ml-color-text)
	 * --ml-form-field-input-bg: var(--ml-color-input-bg)
	 * --ml-form-field-input-border-width: var(--ml-border)
	 * --ml-form-field-input-border-color: var(--ml-color-border-strong)
	 * --ml-form-field-input-border-radius: var(--ml-radius)
	 * --ml-form-field-input-shadow: var(--ml-shadow-xs)
	 * --ml-form-field-input-focus-border-color: var(--ml-color-primary)
	 * --ml-form-field-input-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-form-field-input-placeholder-color: var(--ml-color-text-muted)
	 * --ml-form-field-input-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-form-field-input-disabled-color: var(--ml-color-text-muted)
	 * --ml-form-field-input-error-border-color: var(--ml-color-danger)
	 * --ml-form-field-input-error-focus-shadow: var(--ml-shadow-ring-error)
	 *
	 * Horizontal layout
	 * --ml-form-field-horizontal-gap: var(--ml-space-4)
	 * --ml-form-field-horizontal-label-padding-top: var(--ml-space-2-5)
	 *
	 * Transition
	 * --ml-form-field-transition-duration: var(--ml-duration-150)
	 * --ml-form-field-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
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
		gap: var(--ml-space-1-5) var(--ml-form-field-horizontal-gap, var(--ml-space-4));
		align-items: start;
	}

	.ml-form-field--horizontal .ml-form-field__label {
		grid-column: 1;
		grid-row: 1;
		padding-top: var(--ml-form-field-horizontal-label-padding-top, var(--ml-space-2-5));
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
		font-size: var(--ml-form-field-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-form-field-label-font-weight, var(--ml-font-medium));
		color: var(--ml-form-field-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-form-field-label-line-height, var(--ml-leading-tight));
	}

	.ml-form-field__required {
		color: var(--ml-form-field-required-color, var(--ml-color-danger));
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
		font-size: var(--ml-form-field-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-form-field-label-line-height, var(--ml-leading-tight));
	}

	.ml-form-field__hint {
		color: var(--ml-form-field-hint-color, var(--ml-color-text-muted));
	}

	.ml-form-field__error {
		color: var(--ml-form-field-error-color, var(--ml-color-danger));
	}

	/* Disabled state */
	.ml-form-field--disabled .ml-form-field__label {
		color: var(--ml-form-field-disabled-label-color, var(--ml-color-text-muted));
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
		padding: var(--ml-form-field-input-padding, var(--ml-space-2-5) var(--ml-space-3-5));
		font-size: var(--ml-form-field-input-font-size, var(--ml-text-sm));
		font-family: var(--ml-form-field-input-font-family, var(--ml-font-sans));
		color: var(--ml-form-field-input-color, var(--ml-color-text));
		background-color: var(--ml-form-field-input-bg, var(--ml-color-input-bg));
		border: var(--ml-form-field-input-border-width, var(--ml-border)) solid var(--ml-form-field-input-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-form-field-input-border-radius, var(--ml-radius));
		box-shadow: var(--ml-form-field-input-shadow, var(--ml-shadow-xs));
		box-sizing: border-box;
		transition:
			border-color var(--ml-form-field-transition-duration, var(--ml-duration-150)) var(--ml-form-field-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-form-field-transition-duration, var(--ml-duration-150)) var(--ml-form-field-transition-easing, var(--ml-ease-in-out));
	}

	::slotted(input:focus),
	::slotted(select:focus),
	::slotted(textarea:focus) {
		outline: none;
		border-color: var(--ml-form-field-input-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-form-field-input-focus-shadow, var(--ml-shadow-focus-ring));
	}

	::slotted(input::placeholder),
	::slotted(textarea::placeholder) {
		color: var(--ml-form-field-input-placeholder-color, var(--ml-color-text-muted));
	}

	::slotted(input:disabled),
	::slotted(select:disabled),
	::slotted(textarea:disabled) {
		background-color: var(--ml-form-field-input-disabled-bg, var(--ml-color-input-disabled-bg));
		cursor: not-allowed;
		color: var(--ml-form-field-input-disabled-color, var(--ml-color-text-muted));
	}

	/* Error state for slotted inputs */
	.ml-form-field--error ::slotted(input),
	.ml-form-field--error ::slotted(select),
	.ml-form-field--error ::slotted(textarea) {
		border-color: var(--ml-form-field-input-error-border-color, var(--ml-color-danger));
	}

	.ml-form-field--error ::slotted(input:focus),
	.ml-form-field--error ::slotted(select:focus),
	.ml-form-field--error ::slotted(textarea:focus) {
		box-shadow: var(--ml-form-field-input-error-focus-shadow, var(--ml-shadow-ring-error));
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
			this._controlResolved = false;
			this.connectSlottedControl();
		};
		this._control = null;
		this._controlResolved = false;
		this.handleLabelClick = (event) => {
			event.preventDefault();
			this._control?.focus();
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
		const ids = [];
		if (this.error) ids.push(this.errorId);
		if (this.hint) ids.push(this.hintId);
		return ids.join(" ");
	}
	onCreate() {
		this.connectSlottedControl();
	}
	onRender() {
		this.connectSlottedControl();
	}
	connectSlottedControl() {
		if (this._control && !this._control.isConnected) this._controlResolved = false;
		if (!this._controlResolved) {
			const slot = this.elementRef.shadowRoot?.querySelector("slot:not([name])");
			if (!slot) return;
			this._control = this.findFormControl(slot.assignedElements({ flatten: true }));
			this._controlResolved = true;
		}
		const control = this._control;
		if (!control) return;
		if (!control.id) control.id = this.fieldId;
		this.syncDescription(control);
		this.syncAttribute(control, "aria-invalid", this.error ? "true" : null);
		this.syncAttribute(control, "aria-required", this.required ? "true" : null);
		if ("disabled" in control) control.disabled = this.disabled;
		else this.syncAttribute(control, "aria-disabled", this.disabled ? "true" : null);
	}
	syncDescription(control) {
		const root = this.elementRef.shadowRoot;
		const describers = [this.error ? root?.getElementById(this.errorId) : null, this.hint ? root?.getElementById(this.hintId) : null].filter((element) => element !== null && element !== void 0);
		const reflected = control;
		if ("ariaDescribedByElements" in reflected) {
			reflected.ariaDescribedByElements = describers.length > 0 ? describers : null;
			this.syncAttribute(control, "aria-description", null);
			return;
		}
		const description = describers.map((element) => element.textContent?.trim() ?? "").filter(Boolean).join(". ");
		this.syncAttribute(control, "aria-description", description || null);
	}
	syncAttribute(el, name, value) {
		if (value === null) el.removeAttribute(name);
		else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
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
function dayGrid(c) {
	return html`
		<div class="ml-calendar__weekdays" role="row">
			${repeat(c.weekdays, (d) => d, (d) => html`
				<span class="ml-calendar__weekday" role="columnheader">${d}</span>
			`)}
		</div>

		<div class="ml-calendar__grid" @keydown=${c.handleGridKeyDown}>
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
					data-key=${day.iso}
					tabindex=${day.iso === c.dayTabStop ? "0" : "-1"}
					aria-selected=${day.isSelected ? "true" : "false"}
					aria-label=${day.iso}
					@click=${() => c.selectDay(day)}
				>
					<span class="ml-calendar__day-number">${day.date}</span>
					${day.isToday ? html`<span class="ml-calendar__today-dot"></span>` : ""}
				</button>
			`)}
		</div>
	`;
}
function monthGrid(c) {
	return html`
		<div class="ml-calendar__cell-grid" @keydown=${c.handleGridKeyDown}>
			${repeat(c.months, (m) => m.index, (m) => html`
				<button
					type="button"
					class=${classMap({
		"ml-calendar__cell": true,
		"ml-calendar__cell--selected": m.isSelected,
		"ml-calendar__cell--current": m.isCurrent,
		"ml-calendar__cell--disabled": m.isDisabled
	})}
					?disabled=${m.isDisabled}
					data-key=${String(m.index)}
					tabindex=${m.index === c.monthTabStop ? "0" : "-1"}
					aria-selected=${m.isSelected ? "true" : "false"}
					aria-label=${m.label}
					@click=${() => c.selectViewMonth(m)}
				>
					${m.label}
				</button>
			`)}
		</div>
	`;
}
function yearGrid(c) {
	return html`
		<div class="ml-calendar__cell-grid" @keydown=${c.handleGridKeyDown}>
			${repeat(c.years, (y) => y.year, (y) => html`
				<button
					type="button"
					class=${classMap({
		"ml-calendar__cell": true,
		"ml-calendar__cell--selected": y.isSelected,
		"ml-calendar__cell--current": y.isCurrent,
		"ml-calendar__cell--disabled": y.isDisabled
	})}
					?disabled=${y.isDisabled}
					data-key=${String(y.year)}
					tabindex=${y.year === c.yearTabStop ? "0" : "-1"}
					aria-selected=${y.isSelected ? "true" : "false"}
					aria-label=${String(y.year)}
					@click=${() => c.selectViewYear(y)}
				>
					${y.year}
				</button>
			`)}
		</div>
	`;
}
function calendarTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-calendar": true,
		[`ml-calendar--view-${c.view}`]: true
	})} role="grid" aria-label=${c.headerLabel}>
			<div class="ml-calendar__header">
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Previous" @click=${c.headerPrevFar}>
						<ml-icon icon="caret-double-left" size="sm"></ml-icon>
					</button>
					${when(c.view === "day", () => html`
						<button type="button" class="ml-calendar__nav" aria-label="Previous month" @click=${c.prevMonth}>
							<ml-icon icon="caret-left" size="sm"></ml-icon>
						</button>
					`)}
				</div>

				${when(c.view === "day", () => html`
						<div class="ml-calendar__title">
							<button
								type="button"
								class="ml-calendar__title-btn"
								aria-label="Select month"
								aria-expanded="false"
								@click=${c.openMonthView}
							>${c.monthLabel}</button>
							<button
								type="button"
								class="ml-calendar__title-btn"
								aria-label="Select year"
								aria-expanded="false"
								@click=${c.openYearView}
							>${c.viewYear}</button>
						</div>
					`, () => html`
						<button
							type="button"
							class="ml-calendar__title-btn ml-calendar__title-btn--wide"
							aria-label=${c.view === "month" ? "Back to day view" : "Select year"}
							aria-expanded="true"
							@click=${c.view === "month" ? c.openMonthView : c.openYearView}
						>${c.headerLabel}</button>
					`)}

				<div class="ml-calendar__nav-group">
					${when(c.view === "day", () => html`
						<button type="button" class="ml-calendar__nav" aria-label="Next month" @click=${c.nextMonth}>
							<ml-icon icon="caret-right" size="sm"></ml-icon>
						</button>
					`)}
					<button type="button" class="ml-calendar__nav" aria-label="Next" @click=${c.headerNextFar}>
						<ml-icon icon="caret-double-right" size="sm"></ml-icon>
					</button>
				</div>
			</div>

			${when(c.view === "day", () => dayGrid(c))}
			${when(c.view === "month", () => monthGrid(c))}
			${when(c.view === "year", () => yearGrid(c))}

			<div class="ml-calendar__footer">
				<button type="button" class="ml-calendar__today-btn" @click=${c.goToToday}>Today</button>
			</div>
		</div>
	`;
}
const calendarStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Calendar
	 * --ml-calendar-width: 280px
	 * --ml-calendar-font-family: var(--ml-font-sans)
	 *
	 * Month/year title
	 * --ml-calendar-month-font-size: var(--ml-text-sm)
	 * --ml-calendar-month-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-month-color: var(--ml-color-text)
	 * --ml-calendar-title-btn-padding-x: var(--ml-space-1-5)
	 * --ml-calendar-title-btn-padding-y: var(--ml-space-1)
	 * --ml-calendar-title-btn-border-radius: var(--ml-radius-md)
	 * --ml-calendar-title-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-title-btn-hover-color: var(--ml-color-text)
	 *
	 * Month/year cells
	 * --ml-calendar-cell-font-size: var(--ml-text-sm)
	 * --ml-calendar-cell-font-weight: var(--ml-font-regular)
	 * --ml-calendar-cell-color: var(--ml-color-text)
	 * --ml-calendar-cell-border-radius: var(--ml-radius-md)
	 * --ml-calendar-cell-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-cell-selected-bg: var(--ml-color-primary)
	 * --ml-calendar-cell-selected-color: var(--ml-color-text-inverse)
	 * --ml-calendar-cell-selected-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-cell-selected-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-cell-current-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-cell-height: 3rem
	 *
	 * Nav buttons
	 * --ml-calendar-nav-size: 2rem
	 * --ml-calendar-nav-border-radius: var(--ml-radius-md)
	 * --ml-calendar-nav-color: var(--ml-color-text-muted)
	 * --ml-calendar-nav-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-nav-hover-color: var(--ml-color-text)
	 *
	 * Weekday headers
	 * --ml-calendar-weekday-height: 2.25rem
	 * --ml-calendar-weekday-font-size: var(--ml-text-xs)
	 * --ml-calendar-weekday-font-weight: var(--ml-font-medium)
	 * --ml-calendar-weekday-color: var(--ml-color-text-muted)
	 *
	 * Day cells
	 * --ml-calendar-day-font-size: var(--ml-text-sm)
	 * --ml-calendar-day-font-weight: var(--ml-font-regular)
	 * --ml-calendar-day-color: var(--ml-color-text)
	 * --ml-calendar-day-border-radius: var(--ml-radius-full)
	 * --ml-calendar-day-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Today
	 * --ml-calendar-today-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-today-dot-size: 4px
	 * --ml-calendar-today-dot-color: var(--ml-color-primary)
	 *
	 * Selected
	 * --ml-calendar-selected-bg: var(--ml-color-primary)
	 * --ml-calendar-selected-color: var(--ml-color-text-inverse)
	 * --ml-calendar-selected-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-selected-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-selected-dot-color: var(--ml-color-text-inverse)
	 *
	 * Disabled
	 * --ml-calendar-disabled-opacity: 0.3
	 *
	 * Focus
	 * --ml-calendar-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Today button
	 * --ml-calendar-today-btn-border-color: var(--ml-color-border)
	 * --ml-calendar-today-btn-border-radius: var(--ml-radius-md)
	 * --ml-calendar-today-btn-bg: var(--ml-color-surface)
	 * --ml-calendar-today-btn-font-size: var(--ml-text-sm)
	 * --ml-calendar-today-btn-font-weight: var(--ml-font-medium)
	 * --ml-calendar-today-btn-color: var(--ml-color-text)
	 * --ml-calendar-today-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-today-btn-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Transition
	 * --ml-calendar-transition-duration: var(--ml-duration-150)
	 * --ml-calendar-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: inline-block;
	}

	.ml-calendar {
		width: var(--ml-calendar-width, 280px);
		font-family: var(--ml-calendar-font-family, var(--ml-font-sans));
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

	.ml-calendar__title {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-calendar__title-btn {
		border: none;
		background: none;
		padding: var(--ml-calendar-title-btn-padding-y, var(--ml-space-1)) var(--ml-calendar-title-btn-padding-x, var(--ml-space-1-5));
		border-radius: var(--ml-calendar-title-btn-border-radius, var(--ml-radius-md));
		font-family: inherit;
		font-size: var(--ml-calendar-month-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-month-font-weight, var(--ml-font-semibold));
		color: var(--ml-calendar-month-color, var(--ml-color-text));
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__title-btn:hover {
		background-color: var(--ml-calendar-title-btn-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-title-btn-hover-color, var(--ml-color-text));
	}

	.ml-calendar__title-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-calendar__title-btn--wide {
		min-width: 0;
	}

	/* Month / year cell grid */
	.ml-calendar__cell-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--ml-space-1);
		padding: var(--ml-space-1) 0;
	}

	.ml-calendar__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--ml-calendar-cell-height, 3rem);
		border: none;
		border-radius: var(--ml-calendar-cell-border-radius, var(--ml-radius-md));
		background: none;
		font-family: inherit;
		font-size: var(--ml-calendar-cell-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-cell-font-weight, var(--ml-font-regular));
		color: var(--ml-calendar-cell-color, var(--ml-color-text));
		cursor: pointer;
		padding: 0;
		transition:
			background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__cell:hover:not(:disabled):not(.ml-calendar__cell--selected) {
		background-color: var(--ml-calendar-cell-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-calendar__cell:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
		z-index: 1;
	}

	.ml-calendar__cell--current {
		font-weight: var(--ml-calendar-cell-current-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__cell--selected {
		background-color: var(--ml-calendar-cell-selected-bg, var(--ml-color-primary));
		color: var(--ml-calendar-cell-selected-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-calendar-cell-selected-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__cell--selected:hover:not(:disabled) {
		background-color: var(--ml-calendar-cell-selected-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-calendar__cell--disabled,
	.ml-calendar__cell:disabled {
		opacity: var(--ml-calendar-disabled-opacity, 0.3);
		cursor: not-allowed;
	}

	.ml-calendar__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-calendar-nav-size, 2rem);
		height: var(--ml-calendar-nav-size, 2rem);
		border: none;
		border-radius: var(--ml-calendar-nav-border-radius, var(--ml-radius-md));
		background: none;
		color: var(--ml-calendar-nav-color, var(--ml-color-text-muted));
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__nav:hover {
		background-color: var(--ml-calendar-nav-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-nav-hover-color, var(--ml-color-text));
	}

	.ml-calendar__nav:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
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
		height: var(--ml-calendar-weekday-height, 2.25rem);
		font-size: var(--ml-calendar-weekday-font-size, var(--ml-text-xs));
		font-weight: var(--ml-calendar-weekday-font-weight, var(--ml-font-medium));
		color: var(--ml-calendar-weekday-color, var(--ml-color-text-muted));
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
		border-radius: var(--ml-calendar-day-border-radius, var(--ml-radius-full));
		background: none;
		font-size: var(--ml-calendar-day-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-day-font-weight, var(--ml-font-regular));
		color: var(--ml-calendar-day-color, var(--ml-color-text));
		cursor: pointer;
		padding: 0;
		gap: 1px;
		transition:
			background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__day:hover:not(:disabled):not(.ml-calendar__day--selected) {
		background-color: var(--ml-calendar-day-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-calendar__day:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
		z-index: 1;
	}

	/* Other month days - hidden */
	.ml-calendar__day--other-month {
		visibility: hidden;
		pointer-events: none;
	}

	/* Today */
	.ml-calendar__day--today {
		font-weight: var(--ml-calendar-today-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__day-number {
		line-height: 1;
	}

	/* Today dot indicator */
	.ml-calendar__today-dot {
		width: var(--ml-calendar-today-dot-size, 4px);
		height: var(--ml-calendar-today-dot-size, 4px);
		border-radius: var(--ml-calendar-day-border-radius, var(--ml-radius-full));
		background-color: var(--ml-calendar-today-dot-color, var(--ml-color-primary));
	}

	.ml-calendar__day--selected .ml-calendar__today-dot {
		background-color: var(--ml-calendar-selected-dot-color, var(--ml-color-text-inverse));
	}

	/* Selected */
	.ml-calendar__day--selected {
		background-color: var(--ml-calendar-selected-bg, var(--ml-color-primary));
		color: var(--ml-calendar-selected-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-calendar-selected-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__day--selected:hover:not(:disabled) {
		background-color: var(--ml-calendar-selected-hover-bg, var(--ml-color-primary-hover));
	}

	/* Disabled */
	.ml-calendar__day--disabled:not(.ml-calendar__day--other-month) {
		opacity: var(--ml-calendar-disabled-opacity, 0.3);
		cursor: not-allowed;
	}

	/* Footer */
	.ml-calendar__footer {
		display: flex;
		justify-content: center;
		padding-top: var(--ml-space-3);
	}

	.ml-calendar__today-btn {
		border: var(--ml-border) solid var(--ml-calendar-today-btn-border-color, var(--ml-color-border));
		border-radius: var(--ml-calendar-today-btn-border-radius, var(--ml-radius-md));
		background-color: var(--ml-calendar-today-btn-bg, var(--ml-color-surface));
		font-family: var(--ml-calendar-font-family, var(--ml-font-sans));
		font-size: var(--ml-calendar-today-btn-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-today-btn-font-weight, var(--ml-font-medium));
		color: var(--ml-calendar-today-btn-color, var(--ml-color-text));
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), border-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__today-btn:hover {
		background-color: var(--ml-calendar-today-btn-hover-bg, var(--ml-color-surface-raised));
		border-color: var(--ml-calendar-today-btn-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-calendar__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
	}
`;
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
var MONTH_NAMES_SHORT = [
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
var WEEKDAYS = [
	"Su",
	"Mo",
	"Tu",
	"We",
	"Th",
	"Fr",
	"Sa"
];
var YEARS_PER_PAGE = 12;
var DEFAULT_MIN_YEAR_OFFSET = 120;
var DEFAULT_MAX_YEAR_OFFSET = 10;
function toIso(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayIso() {
	const d = /* @__PURE__ */ new Date();
	return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseYear(val) {
	if (typeof val === "number" && Number.isFinite(val)) return val;
	if (typeof val === "string" && val.trim() !== "") {
		const n = Number.parseInt(val, 10);
		if (Number.isFinite(n)) return n;
	}
	return null;
}
var CalendarComponent = class CalendarComponent$1 {
	constructor() {
		this.value = "";
		this.min = "";
		this.max = "";
		this.minYear = "";
		this.maxYear = "";
		this.viewMonth = (/* @__PURE__ */ new Date()).getMonth();
		this.viewYear = (/* @__PURE__ */ new Date()).getFullYear();
		this.view = "day";
		this.yearPageStart = 0;
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
		this.headerPrev = () => {
			if (this.view === "year") this.prevYearPage();
			else if (this.view === "month") this.prevYear();
			else this.prevMonth();
		};
		this.headerNext = () => {
			if (this.view === "year") this.nextYearPage();
			else if (this.view === "month") this.nextYear();
			else this.nextMonth();
		};
		this.headerPrevFar = () => {
			if (this.view === "year") this.prevYearPage();
			else this.prevYear();
		};
		this.headerNextFar = () => {
			if (this.view === "year") this.nextYearPage();
			else this.nextYear();
		};
		this.prevYearPage = () => {
			const next = this.yearPageStart - YEARS_PER_PAGE;
			const minPage = this.computeYearPageStart(this.resolvedMinYear);
			this.yearPageStart = Math.max(next, minPage);
		};
		this.nextYearPage = () => {
			const next = this.yearPageStart + YEARS_PER_PAGE;
			const maxPage = this.computeYearPageStart(this.resolvedMaxYear);
			this.yearPageStart = Math.min(next, maxPage);
		};
		this.openMonthView = () => {
			this.view = this.view === "month" ? "day" : "month";
		};
		this.openYearView = () => {
			if (this.view === "year") {
				this.view = "day";
				return;
			}
			this.yearPageStart = this.computeYearPageStart(this.viewYear);
			this.view = "year";
		};
		this.selectViewMonth = (month) => {
			if (month.isDisabled) return;
			this.viewMonth = month.index;
			this.view = "day";
		};
		this.selectViewYear = (year) => {
			if (year.isDisabled) return;
			this.viewYear = year.year;
			this.view = "month";
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
			this.view = "day";
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
		this.rovingKey = "";
		this.handleGridKeyDown = (event) => {
			const key = event.key;
			if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown" && key !== "Home" && key !== "End") return;
			const target = event.target;
			if (!target || target.tagName !== "BUTTON") return;
			const grid = target.closest(".ml-calendar__grid, .ml-calendar__cell-grid");
			if (!grid) return;
			const cells = Array.from(grid.querySelectorAll("button:not([disabled])"));
			if (cells.length === 0) return;
			const idx = cells.indexOf(target);
			if (idx === -1) return;
			const cols = this.view === "day" ? 7 : 3;
			let nextIdx = idx;
			switch (key) {
				case "ArrowLeft":
					nextIdx = idx - 1;
					break;
				case "ArrowRight":
					nextIdx = idx + 1;
					break;
				case "ArrowUp":
					nextIdx = idx - cols;
					break;
				case "ArrowDown":
					nextIdx = idx + cols;
					break;
				case "Home":
					nextIdx = 0;
					break;
				case "End":
					nextIdx = cells.length - 1;
					break;
			}
			if (nextIdx < 0 || nextIdx >= cells.length) {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			const next = cells[nextIdx];
			this.rovingKey = next.dataset.key ?? "";
			next.focus();
		};
	}
	onInit() {
		this.navigateToValue();
		this.yearPageStart = this.computeYearPageStart(this.viewYear);
	}
	onAttributeChange(name, _, newVal) {
		if (name === "value" && newVal) {
			this.navigateToValue();
			this.yearPageStart = this.computeYearPageStart(this.viewYear);
		}
	}
	onPropertyChange(name, _, newValue) {
		if (name !== "value" || !newValue) return;
		const parts = String(newValue).split("-");
		if (parts.length !== 3) return;
		this.viewYear = Number.parseInt(parts[0], 10);
		this.viewMonth = Number.parseInt(parts[1], 10) - 1;
		this.yearPageStart = this.computeYearPageStart(this.viewYear);
		this.rovingKey = String(newValue);
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
		return MONTH_NAMES[this.viewMonth];
	}
	get yearLabel() {
		return String(this.viewYear);
	}
	get yearRangeLabel() {
		return `${this.yearPageStart} – ${this.yearPageStart + YEARS_PER_PAGE - 1}`;
	}
	get headerLabel() {
		if (this.view === "year") return this.yearRangeLabel;
		if (this.view === "month") return this.yearLabel;
		return `${this.monthLabel} ${this.viewYear}`;
	}
	get weekdays() {
		return WEEKDAYS;
	}
	get resolvedMinYear() {
		return parseYear(this.minYear) ?? (/* @__PURE__ */ new Date()).getFullYear() - DEFAULT_MIN_YEAR_OFFSET;
	}
	get resolvedMaxYear() {
		return parseYear(this.maxYear) ?? (/* @__PURE__ */ new Date()).getFullYear() + DEFAULT_MAX_YEAR_OFFSET;
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
	get months() {
		const selectedMonth = this.selectedMonthForYear(this.viewYear);
		const now = /* @__PURE__ */ new Date();
		return MONTH_NAMES_SHORT.map((label, index) => ({
			index,
			label,
			isSelected: selectedMonth === index,
			isCurrent: now.getFullYear() === this.viewYear && now.getMonth() === index,
			isDisabled: this.isMonthDisabled(this.viewYear, index)
		}));
	}
	get years() {
		const result = [];
		const selectedYear = this.selectedYear();
		const now = (/* @__PURE__ */ new Date()).getFullYear();
		const minY = this.resolvedMinYear;
		const maxY = this.resolvedMaxYear;
		for (let i = 0; i < YEARS_PER_PAGE; i++) {
			const year = this.yearPageStart + i;
			const inRange = year >= minY && year <= maxY;
			result.push({
				year,
				isSelected: selectedYear === year,
				isCurrent: year === now,
				isDisabled: !inRange,
				isPlaceholder: !inRange
			});
		}
		return result;
	}
	get canPageYearsBack() {
		return this.yearPageStart > this.resolvedMinYear;
	}
	get canPageYearsForward() {
		return this.yearPageStart + YEARS_PER_PAGE - 1 < this.resolvedMaxYear;
	}
	get dayTabStop() {
		const candidates = this.days.filter((day) => day.isCurrentMonth && !day.isDisabled);
		if (candidates.length === 0) return "";
		if (this.rovingKey && candidates.some((day) => day.iso === this.rovingKey)) return this.rovingKey;
		return (candidates.find((day) => day.isSelected) ?? candidates.find((day) => day.isToday) ?? candidates[0]).iso;
	}
	get monthTabStop() {
		const candidates = this.months.filter((month) => !month.isDisabled);
		if (candidates.length === 0) return -1;
		const roving = Number.parseInt(this.rovingKey, 10);
		if (!Number.isNaN(roving) && candidates.some((month) => month.index === roving)) return roving;
		return (candidates.find((month) => month.isSelected) ?? candidates.find((month) => month.isCurrent) ?? candidates[0]).index;
	}
	get yearTabStop() {
		const candidates = this.years.filter((year) => !year.isDisabled);
		if (candidates.length === 0) return -1;
		const roving = Number.parseInt(this.rovingKey, 10);
		if (!Number.isNaN(roving) && candidates.some((year) => year.year === roving)) return roving;
		return (candidates.find((year) => year.isSelected) ?? candidates.find((year) => year.isCurrent) ?? candidates[0]).year;
	}
	computeYearPageStart(year) {
		const minY = this.resolvedMinYear;
		return minY + Math.floor((year - minY) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
	}
	selectedMonthForYear(year) {
		if (!this.value) return null;
		const parts = this.value.split("-");
		if (parts.length !== 3) return null;
		if (Number.parseInt(parts[0], 10) !== year) return null;
		return Number.parseInt(parts[1], 10) - 1;
	}
	selectedYear() {
		if (!this.value) return null;
		const parts = this.value.split("-");
		if (parts.length !== 3) return null;
		return Number.parseInt(parts[0], 10);
	}
	isMonthDisabled(year, month) {
		const monthEnd = toIso(year, month, new Date(year, month + 1, 0).getDate());
		const monthStart = toIso(year, month, 1);
		if (this.min && monthEnd < this.min) return true;
		if (this.max && monthStart > this.max) return true;
		return false;
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
		"max",
		"min-year",
		"max-year"
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
					type="text"
					class="ml-date-picker__input"
					.value=${c.displayValue}
					placeholder=${c.placeholder}
					?disabled=${c.disabled}
					?required=${c.required}
					autocomplete="off"
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
					min-year=${c.minYear}
					max-year=${c.maxYear}
					@ml:select=${c.handleDateSelect}
				></ml-calendar>
			</div>

			${when(!!c.error, () => html`<span class="ml-date-picker__error">${c.error}</span>`, () => html`${when(!!c.hint, () => html`<span class="ml-date-picker__hint">${c.hint}</span>`)}`)}
		</div>
	`;
}
const datePickerStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-date-picker-label-font-size: var(--ml-text-sm)
	 * --ml-date-picker-label-font-weight: var(--ml-font-medium)
	 * --ml-date-picker-label-color: var(--ml-color-text-secondary)
	 * --ml-date-picker-label-line-height: var(--ml-leading-tight)
	 * --ml-date-picker-label-margin-bottom: var(--ml-space-1-5)
	 *
	 * Required indicator
	 * --ml-date-picker-required-color: var(--ml-color-danger)
	 *
	 * Trigger
	 * --ml-date-picker-bg: var(--ml-color-input-bg)
	 * --ml-date-picker-border-width: var(--ml-border)
	 * --ml-date-picker-border-color: var(--ml-color-border)
	 * --ml-date-picker-border-radius: var(--ml-radius)
	 * --ml-date-picker-color: var(--ml-color-text)
	 * --ml-date-picker-font-family: var(--ml-font-sans)
	 * --ml-date-picker-font-size: var(--ml-text-sm)
	 * --ml-date-picker-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-date-picker-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Focus
	 * --ml-date-picker-focus-border-color: var(--ml-trigger-focus-border, var(--ml-color-primary))
	 * --ml-date-picker-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Error
	 * --ml-date-picker-error-border-color: var(--ml-color-danger)
	 * --ml-date-picker-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-date-picker-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-date-picker-disabled-opacity: 0.5
	 * --ml-date-picker-disabled-bg: var(--ml-color-input-disabled-bg)
	 *
	 * Icon
	 * --ml-date-picker-icon-color: var(--ml-color-text-muted)
	 *
	 * Popover
	 * --ml-date-picker-popover-padding: var(--ml-space-4)
	 * --ml-date-picker-popover-border-color: var(--ml-color-border)
	 * --ml-date-picker-popover-border-radius: var(--ml-radius-lg)
	 * --ml-date-picker-popover-bg: var(--ml-color-surface)
	 * --ml-date-picker-popover-shadow: var(--ml-shadow-lg)
	 *
	 * Hint
	 * --ml-date-picker-hint-color: var(--ml-color-text-muted)
	 * --ml-date-picker-hint-font-size: var(--ml-text-sm)
	 *
	 * Transition
	 * --ml-date-picker-transition-duration: var(--ml-duration-150)
	 * --ml-date-picker-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;

		--ml-date-picker-gap: var(--ml-space-2);

		/* --- Placeholder --- */
		--ml-date-picker-placeholder-color: var(--ml-color-text-muted);
	}

	/* Label */
	.ml-date-picker__label {
		display: block;
		font-size: var(--ml-date-picker-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-date-picker-label-font-weight, var(--ml-font-medium));
		color: var(--ml-date-picker-label-color, var(--ml-color-text-secondary));
		margin-bottom: var(--ml-date-picker-label-margin-bottom, var(--ml-space-1-5));
		line-height: var(--ml-date-picker-label-line-height, var(--ml-leading-tight));
	}

	.ml-date-picker__required {
		color: var(--ml-date-picker-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger wrapper */
	.ml-date-picker__trigger {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--ml-date-picker-border-width, var(--ml-border)) solid var(--ml-date-picker-border-color, var(--ml-color-border));
		border-radius: var(--ml-date-picker-border-radius, var(--ml-radius));
		background-color: var(--ml-date-picker-bg, var(--ml-color-input-bg));
		transition:
			border-color var(--ml-date-picker-transition-duration, var(--ml-duration-150)) var(--ml-date-picker-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-date-picker-transition-duration, var(--ml-duration-150)) var(--ml-date-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-date-picker__trigger:hover:not(:has(:disabled)) {
		border-color: var(--ml-date-picker-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-date-picker__trigger:focus-within {
		border-color: var(--ml-date-picker-focus-border-color, var(--ml-trigger-focus-border, var(--ml-color-primary)));
		box-shadow: var(--ml-date-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-date-picker--open .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-focus-border-color, var(--ml-trigger-focus-border, var(--ml-color-primary)));
		box-shadow: var(--ml-date-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-date-picker--error .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-error-border-color, var(--ml-color-danger));
	}

	.ml-date-picker--error .ml-date-picker__trigger:focus-within,
	.ml-date-picker--error.ml-date-picker--open .ml-date-picker__trigger {
		box-shadow: var(--ml-date-picker-error-focus-shadow, var(--ml-shadow-ring-error));
	}

	.ml-date-picker--disabled .ml-date-picker__trigger {
		opacity: var(--ml-date-picker-disabled-opacity, 0.5);
		cursor: not-allowed;
		background-color: var(--ml-date-picker-disabled-bg, var(--ml-color-input-disabled-bg));
	}

	/* Date input */
	.ml-date-picker__input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--ml-date-picker-color, var(--ml-color-text));
		font-family: var(--ml-date-picker-font-family, var(--ml-font-sans));
		font-size: var(--ml-date-picker-font-size, var(--ml-text-sm));
		padding: var(--ml-date-picker-padding, var(--ml-space-2-5) var(--ml-space-3-5));
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
		color: var(--ml-date-picker-icon-color, var(--ml-color-text-muted));
		transition: color var(--ml-date-picker-transition-duration, var(--ml-duration-150)) var(--ml-date-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-date-picker__calendar-btn:hover:not(:disabled) {
		color: var(--ml-date-picker-color, var(--ml-color-text));
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
		padding: var(--ml-date-picker-popover-padding, var(--ml-space-4));
		border: var(--ml-date-picker-border-width, var(--ml-border)) solid var(--ml-date-picker-popover-border-color, var(--ml-color-border));
		border-radius: var(--ml-date-picker-popover-border-radius, var(--ml-radius-lg));
		background-color: var(--ml-date-picker-popover-bg, var(--ml-color-surface));
		box-shadow: var(--ml-date-picker-popover-shadow, var(--ml-shadow-lg));
		z-index: 50;

		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-date-picker-transition-duration, var(--ml-duration-150)) var(--ml-ease-out),
			transform var(--ml-date-picker-transition-duration, var(--ml-duration-150)) var(--ml-ease-out),
			display var(--ml-date-picker-transition-duration, var(--ml-duration-150)) allow-discrete;
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
		margin-top: var(--ml-date-picker-label-margin-bottom, var(--ml-space-1-5));
		font-size: var(--ml-date-picker-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-date-picker-label-line-height, var(--ml-leading-tight));
	}

	.ml-date-picker__hint {
		color: var(--ml-date-picker-hint-color, var(--ml-color-text-muted));
	}

	.ml-date-picker__error {
		color: var(--ml-date-picker-error-color, var(--ml-color-danger));
	}
`;
registerAdapter((el) => el.tagName === "ML-DATE-PICKER", {
	inputEvent: "ml:change",
	blurEvent: "focusout",
	getValue: (el) => el.value ?? "",
	setValue: (el, value) => {
		el.value = value !== null && value !== void 0 ? String(value) : "";
	},
	setDisabled: (el, disabled) => {
		el.disabled = disabled;
	}
});
function formatDisplayDate(iso, locale) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
	if (!match) return iso ?? "";
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return new Intl.DateTimeFormat(locale || void 0, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(date);
}
function localeDateOrder(locale) {
	return new Intl.DateTimeFormat(locale || void 0, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(new Date(2001, 1, 3)).filter((part) => part.type === "year" || part.type === "month" || part.type === "day").map((part) => part.type);
}
function parseDateInput(text, locale) {
	const trimmed = text.trim();
	let year;
	let month;
	let day;
	let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
	if (match) {
		year = Number(match[1]);
		month = Number(match[2]);
		day = Number(match[3]);
	} else {
		match = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/.exec(trimmed);
		if (!match) return null;
		const order = localeDateOrder(locale);
		const values = {
			year: 0,
			month: 0,
			day: 0
		};
		order.forEach((part, index) => {
			values[part] = Number(match[index + 1]);
		});
		year = values.year;
		month = values.month;
		day = values.day;
		if (year < 100) year += year < 50 ? 2e3 : 1900;
	}
	if (month < 1 || month > 12) return null;
	const daysInMonth = new Date(year, month, 0).getDate();
	if (day < 1 || day > daysInMonth) return null;
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
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
		this.locale = "";
		this.min = "";
		this.max = "";
		this.minYear = "";
		this.maxYear = "";
		this.isOpen = false;
		this._positioner = new OverlayPositioner(() => ({
			placement: "bottom-start",
			offset: 4
		}));
		this._restoreFocusOnClose = false;
		this.toggleCalendar = () => {
			if (this.disabled) return;
			const popoverEl = this.getPopoverEl();
			if (popoverEl) popoverEl.togglePopover();
		};
		this.handleInput = (event) => {
			const input = event.target;
			const text = input.value.trim();
			if (!text) {
				if (this.value !== "") this.commitValue("");
				input.value = "";
				return;
			}
			const iso = parseDateInput(text, this.locale);
			if (iso && this.isWithinRange(iso)) {
				this.commitValue(iso);
				input.value = formatDisplayDate(iso, this.locale);
			} else input.value = this.displayValue;
		};
		this.handleInputClick = () => {
			if (!this.isOpen) this.toggleCalendar();
		};
		this.handleDateSelect = (event) => {
			event.stopPropagation();
			const detail = event.detail;
			this.commitValue(detail.value);
			this.closePopover(true);
		};
		this.handleKeyDown = (event) => {
			if (event.key === "Escape" && this.isOpen) {
				event.preventDefault();
				this.closePopover(true);
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
				this._positioner.stop();
				if (this._restoreFocusOnClose || isDeepFocusWithin(this.elementRef)) this.returnFocus();
				this._restoreFocusOnClose = false;
			}
		};
	}
	get displayValue() {
		return formatDisplayDate(this.value, this.locale);
	}
	onCreate() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.addEventListener("toggle", this._handleToggle);
	}
	onDestroy() {
		this._positioner.stop();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) popoverEl.removeEventListener("toggle", this._handleToggle);
	}
	isWithinRange(iso) {
		if (this.min && iso < this.min) return false;
		if (this.max && iso > this.max) return false;
		return true;
	}
	commitValue(iso) {
		this.value = iso;
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value: iso }
		}));
	}
	closePopover(restoreFocus = false) {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) {
			this._restoreFocusOnClose = restoreFocus;
			popoverEl.hidePopover();
		}
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;
		this._positioner.start(triggerEl, popoverEl);
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
		"max",
		"min-year",
		"max-year",
		"locale"
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
				${when(!!c.alertTitle, () => html`<div class="ml-alert__title">${c.alertTitle}</div>`)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Spacing
	 * --ml-alert-gap: var(--ml-space-3)
	 * --ml-alert-padding: var(--ml-space-4)
	 * --ml-alert-border-radius: var(--ml-radius-lg)
	 *
	 * Typography
	 * --ml-alert-title-font-weight: var(--ml-font-semibold)
	 * --ml-alert-title-font-size: var(--ml-text-sm)
	 * --ml-alert-title-margin-bottom: var(--ml-space-1)
	 * --ml-alert-message-font-size: var(--ml-text-sm)
	 * --ml-alert-message-line-height: var(--ml-leading-relaxed)
	 *
	 * Icon
	 * --ml-alert-icon-size: 1.25rem
	 *
	 * Dismiss button
	 * --ml-alert-dismiss-border-radius: var(--ml-radius-sm)
	 * --ml-alert-dismiss-opacity: 0.5
	 * --ml-alert-dismiss-hover-opacity: 1
	 *
	 * Transition
	 * --ml-alert-transition-duration: var(--ml-duration-150)
	 * --ml-alert-transition-easing: var(--ml-ease-in-out)
	 * --ml-alert-info-bg: var(--ml-color-info-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-info-border: var(--ml-color-info-border, var(--ml-color-border))
	 * --ml-alert-info-text: var(--ml-color-info-text, var(--ml-color-text))
	 * --ml-alert-info-icon: var(--ml-color-info, var(--ml-color-text-secondary))
	 * --ml-alert-success-bg: var(--ml-color-success-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-success-border: var(--ml-color-success-border, var(--ml-color-border))
	 * --ml-alert-success-text: var(--ml-color-success-text, var(--ml-color-text))
	 * --ml-alert-success-icon: var(--ml-color-success, var(--ml-color-text-secondary))
	 * --ml-alert-warning-bg: var(--ml-color-warning-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-warning-border: var(--ml-color-warning-border, var(--ml-color-border))
	 * --ml-alert-warning-text: var(--ml-color-warning-text, var(--ml-color-text))
	 * --ml-alert-warning-icon: var(--ml-color-warning, var(--ml-color-text-secondary))
	 * --ml-alert-error-bg: var(--ml-color-error-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-error-border: var(--ml-color-error-border, var(--ml-color-border))
	 * --ml-alert-error-text: var(--ml-color-error-text, var(--ml-color-text))
	 * --ml-alert-error-icon: var(--ml-color-error, var(--ml-color-text-secondary))
	 */

	:host {
		display: block;

		/* ── Alert: variants ──
		   Declared here so every property the rules reference has a value on
		   :host. Without these declarations the variant rules resolved against
		   nothing when the theme did not define them, and the alert rendered
		   transparent. */
	}

	:host([hidden]) {
		display: none;
	}

	.ml-alert {
		display: flex;
		gap: var(--ml-alert-gap, var(--ml-space-3));
		padding: var(--ml-alert-padding, var(--ml-space-4));
		border-radius: var(--ml-alert-border-radius, var(--ml-radius-lg));
		border: var(--ml-border) solid transparent;
	}

	.ml-alert--info {
		background-color: var(--ml-alert-info-bg, var(--ml-color-info-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-info-border, var(--ml-color-info-border, var(--ml-color-border)));
		color: var(--ml-alert-info-text, var(--ml-color-info-text, var(--ml-color-text)));
	}

	.ml-alert--info .ml-alert__icon {
		color: var(--ml-alert-info-icon, var(--ml-color-info, var(--ml-color-text-secondary)));
	}

	.ml-alert--success {
		background-color: var(--ml-alert-success-bg, var(--ml-color-success-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-success-border, var(--ml-color-success-border, var(--ml-color-border)));
		color: var(--ml-alert-success-text, var(--ml-color-success-text, var(--ml-color-text)));
	}

	.ml-alert--success .ml-alert__icon {
		color: var(--ml-alert-success-icon, var(--ml-color-success, var(--ml-color-text-secondary)));
	}

	.ml-alert--warning {
		background-color: var(--ml-alert-warning-bg, var(--ml-color-warning-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-warning-border, var(--ml-color-warning-border, var(--ml-color-border)));
		color: var(--ml-alert-warning-text, var(--ml-color-warning-text, var(--ml-color-text)));
	}

	.ml-alert--warning .ml-alert__icon {
		color: var(--ml-alert-warning-icon, var(--ml-color-warning, var(--ml-color-text-secondary)));
	}

	.ml-alert--error {
		background-color: var(--ml-alert-error-bg, var(--ml-color-error-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-error-border, var(--ml-color-error-border, var(--ml-color-border)));
		color: var(--ml-alert-error-text, var(--ml-color-error-text, var(--ml-color-text)));
	}

	.ml-alert--error .ml-alert__icon {
		color: var(--ml-alert-error-icon, var(--ml-color-error, var(--ml-color-text-secondary)));
	}

	.ml-alert__icon {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		margin-top: -3px;
	}

	.ml-alert__icon ml-icon {
		font-size: var(--ml-alert-icon-size, 1.25rem);
	}

	.ml-alert__icon svg {
		width: var(--ml-alert-icon-size, 1.25rem);
		height: var(--ml-alert-icon-size, 1.25rem);
	}

	.ml-alert__content {
		flex: 1;
		min-width: 0;
	}

	.ml-alert__title {
		font-weight: var(--ml-alert-title-font-weight, var(--ml-font-semibold));
		font-size: var(--ml-alert-title-font-size, var(--ml-text-sm));
		margin-bottom: var(--ml-alert-title-margin-bottom, var(--ml-space-1));
	}

	.ml-alert__message {
		font-size: var(--ml-alert-message-font-size, var(--ml-text-sm));
		line-height: var(--ml-alert-message-line-height, var(--ml-leading-relaxed));
	}

	.ml-alert__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-alert-dismiss-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		color: currentColor;
		opacity: var(--ml-alert-dismiss-opacity, 0.5);
		transition:
			opacity var(--ml-alert-transition-duration, var(--ml-duration-150)) var(--ml-alert-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-alert-transition-duration, var(--ml-duration-150)) var(--ml-alert-transition-easing, var(--ml-ease-in-out));
	}

	.ml-alert__dismiss:hover {
		opacity: var(--ml-alert-dismiss-hover-opacity, 1);
	}

	.ml-alert__dismiss:focus-visible {
		outline: none;
		opacity: var(--ml-alert-dismiss-hover-opacity, 1);
	}
`;
var AlertComponent = class AlertComponent$1 {
	constructor() {
		this.variant = "info";
		this.alertTitle = "";
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
	get title() {
		return this.alertTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-alert", "alert-title");
		this.alertTitle = value;
	}
};
AlertComponent = __decorate([MelodicComponent({
	selector: "ml-alert",
	template: alertTemplate,
	styles: alertStyles,
	attributes: [
		"variant",
		"alert-title",
		"title",
		"dismissible"
	]
})], AlertComponent);
var ToastService = class ToastService$1 {
	constructor() {
		this._containerEl = null;
		this._position = "top-right";
		this._active = [];
		this._maxVisible = 5;
	}
	setMaxVisible(max) {
		this._maxVisible = Math.max(0, max);
		this.enforceMaxVisible();
	}
	setPosition(position) {
		this._position = position;
		if (this._containerEl) this._containerEl.setAttribute("position", position);
	}
	show(config) {
		const container = this.ensureContainer();
		const toast = document.createElement("ml-toast");
		if (config.variant) toast.setAttribute("variant", config.variant);
		if (config.title) toast.setAttribute("toast-title", config.title);
		if (config.message) toast.setAttribute("message", config.message);
		if (config.duration !== void 0) toast.setAttribute("duration", String(config.duration));
		if (config.dismissible === false) toast.setAttribute("dismissible", "false");
		toast.setAttribute("role", config.variant === "error" ? "alert" : "status");
		container.appendChild(toast);
		this._active.push(toast);
		toast.addEventListener("ml:dismiss", () => this.forget(toast), { once: true });
		this.enforceMaxVisible();
		return {
			element: toast,
			dismiss: () => {
				this.forget(toast);
				toast.remove();
			}
		};
	}
	info(title, message) {
		return this.show({
			variant: "info",
			title,
			message
		});
	}
	success(title, message) {
		return this.show({
			variant: "success",
			title,
			message
		});
	}
	warning(title, message) {
		return this.show({
			variant: "warning",
			title,
			message
		});
	}
	error(title, message) {
		return this.show({
			variant: "error",
			title,
			message
		});
	}
	dismissAll() {
		for (const toast of [...this._active]) toast.remove();
		this._active.length = 0;
	}
	forget(toast) {
		const index = this._active.indexOf(toast);
		if (index !== -1) this._active.splice(index, 1);
	}
	enforceMaxVisible() {
		if (this._maxVisible === 0) return;
		while (this._active.length > this._maxVisible) this._active.shift()?.remove();
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
			role=${c.variant === "error" ? "alert" : "status"}
		>
			<div class="ml-toast__icon">
				${c.renderIcon()}
			</div>
			<div class="ml-toast__content">
				${when(!!c.toastTitle, () => html`<div class="ml-toast__title">${c.toastTitle}</div>`)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Background & border
	 * --ml-toast-bg: var(--ml-color-surface)
	 * --ml-toast-border-color: var(--ml-color-border)
	 * --ml-toast-border-radius: var(--ml-radius-lg)
	 * --ml-toast-shadow: var(--ml-shadow-lg)
	 *
	 * Spacing
	 * --ml-toast-gap: var(--ml-space-3)
	 * --ml-toast-padding: var(--ml-space-4)
	 * --ml-toast-min-width: 320px
	 * --ml-toast-max-width: 420px
	 *
	 * Title
	 * --ml-toast-title-font-size: var(--ml-text-sm)
	 * --ml-toast-title-font-weight: var(--ml-font-semibold)
	 * --ml-toast-title-color: var(--ml-color-text)
	 * --ml-toast-title-line-height: var(--ml-leading-tight)
	 *
	 * Message
	 * --ml-toast-message-font-size: var(--ml-text-sm)
	 * --ml-toast-message-color: var(--ml-color-text-secondary)
	 * --ml-toast-message-line-height: var(--ml-leading-relaxed)
	 * --ml-toast-message-margin-top: var(--ml-space-1)
	 *
	 * Icon variant colors
	 * --ml-toast-info-icon-color: var(--ml-color-primary)
	 * --ml-toast-success-icon-color: var(--ml-color-success)
	 * --ml-toast-warning-icon-color: var(--ml-color-warning)
	 * --ml-toast-error-icon-color: var(--ml-color-danger)
	 *
	 * Dismiss button
	 * --ml-toast-dismiss-border-radius: var(--ml-radius-sm)
	 * --ml-toast-dismiss-color: var(--ml-color-text-tertiary)
	 * --ml-toast-dismiss-hover-color: var(--ml-color-text)
	 *
	 * Transition
	 * --ml-toast-transition-duration: var(--ml-duration-150)
	 * --ml-toast-transition-easing: var(--ml-ease-in-out)
	 *
	 * Animation
	 * --ml-toast-animation-duration: var(--ml-duration-300)
	 * --ml-toast-animation-easing: var(--ml-ease-out)
	 */

	:host {
		display: block;
	}

	.ml-toast {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-toast-gap, var(--ml-space-3));
		padding: var(--ml-toast-padding, var(--ml-space-4));
		background-color: var(--ml-toast-bg, var(--ml-color-surface));
		border: 1px solid var(--ml-toast-border-color, var(--ml-color-border));
		border-radius: var(--ml-toast-border-radius, var(--ml-radius-lg));
		box-shadow: var(--ml-toast-shadow, var(--ml-shadow-lg));
		min-width: var(--ml-toast-min-width, 320px);
		max-width: var(--ml-toast-max-width, 420px);
		animation: ml-toast-in var(--ml-toast-animation-duration, var(--ml-duration-300)) var(--ml-toast-animation-easing, var(--ml-ease-out));
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
		color: var(--ml-toast-info-icon-color, var(--ml-color-primary));
	}

	.ml-toast--success .ml-toast__icon {
		color: var(--ml-toast-success-icon-color, var(--ml-color-success));
	}

	.ml-toast--warning .ml-toast__icon {
		color: var(--ml-toast-warning-icon-color, var(--ml-color-warning));
	}

	.ml-toast--error .ml-toast__icon {
		color: var(--ml-toast-error-icon-color, var(--ml-color-danger));
	}

	.ml-toast__content {
		flex: 1;
		min-width: 0;
	}

	.ml-toast__title {
		font-size: var(--ml-toast-title-font-size, var(--ml-text-sm));
		font-weight: var(--ml-toast-title-font-weight, var(--ml-font-semibold));
		color: var(--ml-toast-title-color, var(--ml-color-text));
		line-height: var(--ml-toast-title-line-height, var(--ml-leading-tight));
	}

	.ml-toast__message {
		font-size: var(--ml-toast-message-font-size, var(--ml-text-sm));
		color: var(--ml-toast-message-color, var(--ml-color-text-secondary));
		line-height: var(--ml-toast-message-line-height, var(--ml-leading-relaxed));
		margin-top: var(--ml-toast-message-margin-top, var(--ml-space-1));
	}

	.ml-toast__title + .ml-toast__message {
		margin-top: var(--ml-toast-message-margin-top, var(--ml-space-1));
	}

	.ml-toast__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-toast-dismiss-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		color: var(--ml-toast-dismiss-color, var(--ml-color-text-tertiary));
		transition: color var(--ml-toast-transition-duration, var(--ml-duration-150)) var(--ml-toast-transition-easing, var(--ml-ease-in-out));
	}

	.ml-toast__dismiss:hover {
		color: var(--ml-toast-dismiss-hover-color, var(--ml-color-text));
	}
`;
var ToastComponent = class ToastComponent$1 {
	constructor() {
		this.variant = "info";
		this.toastTitle = "";
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
	get title() {
		return this.toastTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-toast", "toast-title");
		this.toastTitle = value;
	}
	onCreate() {
		if (this.duration > 0) this._timer = setTimeout(() => this.dismiss(), this.duration);
	}
	onDestroy() {
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}
};
ToastComponent = __decorate([MelodicComponent({
	selector: "ml-toast",
	template: toastTemplate,
	styles: toastStyles,
	attributes: [
		"variant",
		"toast-title",
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
			role="region"
			aria-label="Notifications"
			aria-live="polite"
			aria-relevant="additions"
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

					<div class="ml-progress__track" role="progressbar" aria-valuenow=${c.clampedValue} aria-valuemin="0" aria-valuemax=${c.ariaMax} aria-label=${c.label || "Progress"}>
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
		<div
			class=${classMap({
		"ml-progress-circle": true,
		[`ml-progress-circle--${c.variant}`]: true,
		[`ml-progress-circle--${c.size}`]: true
	})}
			role="progressbar"
			aria-valuenow=${c.clampedValue}
			aria-valuemin="0"
			aria-valuemax=${c.ariaMax}
			aria-label=${c.label || "Progress"}
		>
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
		<div
			class=${classMap({
		"ml-progress-half": true,
		[`ml-progress-half--${c.variant}`]: true,
		[`ml-progress-half--${c.size}`]: true
	})}
			role="progressbar"
			aria-valuenow=${c.clampedValue}
			aria-valuemin="0"
			aria-valuemax=${c.ariaMax}
			aria-label=${c.label || "Progress"}
		>
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Progress: track heights
	 * --ml-progress-sm-height: 4px
	 * --ml-progress-md-height: 8px
	 * --ml-progress-lg-height: 12px
	 *
	 * Track
	 * --ml-progress-track-color: var(--ml-color-surface-sunken)
	 * --ml-progress-track-radius: var(--ml-radius-full)
	 *
	 * Fill
	 * --ml-progress-fill-color: var(--ml-color-primary)
	 * --ml-progress-fill-radius: var(--ml-radius-full)
	 *
	 * Label / value text
	 * --ml-progress-label-font-size: var(--ml-text-sm)
	 * --ml-progress-label-font-weight: var(--ml-font-medium)
	 * --ml-progress-label-color: var(--ml-color-text)
	 *
	 * Floating tooltip
	 * --ml-progress-floating-font-size: var(--ml-text-xs)
	 * --ml-progress-floating-font-weight: var(--ml-font-medium)
	 * --ml-progress-floating-color: var(--ml-color-text-inverse)
	 * --ml-progress-floating-bg: var(--ml-color-text)
	 * --ml-progress-floating-radius: var(--ml-radius-md)
	 * --ml-progress-floating-padding-y: var(--ml-space-1)
	 * --ml-progress-floating-padding-x: var(--ml-space-2)
	 *
	 * Spacing
	 * --ml-progress-header-margin-bottom: var(--ml-space-2)
	 * --ml-progress-value-bottom-margin-top: var(--ml-space-2)
	 * --ml-progress-bar-row-gap: var(--ml-space-3)
	 *
	 * Transition
	 * --ml-progress-transition-duration: var(--ml-duration-300)
	 * --ml-progress-transition-easing: var(--ml-ease-out)
	 *
	 * Circle
	 * --ml-progress-circle-track-color: var(--ml-color-surface-sunken)
	 * --ml-progress-circle-fill-color: var(--ml-color-primary)
	 * --ml-progress-circle-value-font-weight: var(--ml-font-semibold)
	 * --ml-progress-circle-value-color: var(--ml-color-text)
	 * --ml-progress-circle-label-font-size: var(--ml-text-xs)
	 * --ml-progress-circle-label-color: var(--ml-color-text-muted)
	 * --ml-progress-circle-label-margin-top: var(--ml-space-0-5)
	 *
	 * Half circle
	 * --ml-progress-half-track-color: var(--ml-color-surface-sunken)
	 * --ml-progress-half-fill-color: var(--ml-color-primary)
	 * --ml-progress-half-value-font-weight: var(--ml-font-semibold)
	 * --ml-progress-half-value-color: var(--ml-color-text)
	 * --ml-progress-half-label-font-size: var(--ml-text-xs)
	 * --ml-progress-half-label-color: var(--ml-color-text-muted)
	 * --ml-progress-half-label-margin-top: var(--ml-space-0-5)
	 * --ml-progress-half-center-padding-bottom: var(--ml-space-1)
	 */

	:host {
		display: block;

		/* ---- Linear ---- */
	}

	/* ===================== LINEAR ===================== */

	.ml-progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-progress-header-margin-bottom, var(--ml-space-2));
	}

	.ml-progress__label {
		font-size: var(--ml-progress-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-progress-label-font-weight, var(--ml-font-medium));
		color: var(--ml-progress-label-color, var(--ml-color-text));
	}

	.ml-progress__value {
		font-size: var(--ml-progress-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-progress-label-font-weight, var(--ml-font-medium));
		color: var(--ml-progress-label-color, var(--ml-color-text));
	}

	.ml-progress__value--bottom {
		display: block;
		margin-top: var(--ml-progress-value-bottom-margin-top, var(--ml-space-2));
	}

	/* Bar row for label-right layout */
	.ml-progress__bar-row {
		display: flex;
		align-items: center;
		gap: var(--ml-progress-bar-row-gap, var(--ml-space-3));
	}

	.ml-progress__track-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.ml-progress__track {
		width: 100%;
		background-color: var(--ml-progress-track-color, var(--ml-color-surface-sunken));
		border-radius: var(--ml-progress-track-radius, var(--ml-radius-full));
		overflow: hidden;
	}

	.ml-progress--sm .ml-progress__track {
		height: var(--ml-progress-sm-height, 4px);
	}

	.ml-progress--md .ml-progress__track {
		height: var(--ml-progress-md-height, 8px);
	}

	.ml-progress--lg .ml-progress__track {
		height: var(--ml-progress-lg-height, 12px);
	}

	.ml-progress__fill {
		height: 100%;
		background-color: var(--ml-progress-fill-color, var(--ml-color-primary));
		border-radius: var(--ml-progress-fill-radius, var(--ml-radius-full));
		transition: width var(--ml-progress-transition-duration, var(--ml-duration-300)) var(--ml-progress-transition-easing, var(--ml-ease-out));
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
		font-size: var(--ml-progress-floating-font-size, var(--ml-text-xs));
		font-weight: var(--ml-progress-floating-font-weight, var(--ml-font-medium));
		color: var(--ml-progress-floating-color, var(--ml-color-text-inverse));
		background-color: var(--ml-progress-floating-bg, var(--ml-color-text));
		padding: var(--ml-progress-floating-padding-y, var(--ml-space-1)) var(--ml-progress-floating-padding-x, var(--ml-space-2));
		border-radius: var(--ml-progress-floating-radius, var(--ml-radius-md));
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
		border-top: 5px solid var(--ml-progress-floating-bg, var(--ml-color-text));
	}

	.ml-progress__floating-arrow--up {
		border-bottom: 5px solid var(--ml-progress-floating-bg, var(--ml-color-text));
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
		stroke: var(--ml-progress-circle-track-color, var(--ml-color-surface-sunken));
	}

	.ml-progress-circle__fill {
		stroke: var(--ml-progress-circle-fill-color, var(--ml-color-primary));
		transition: stroke-dashoffset var(--ml-progress-transition-duration, var(--ml-duration-300)) var(--ml-progress-transition-easing, var(--ml-ease-out));
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
		font-weight: var(--ml-progress-circle-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-circle-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-circle--md .ml-progress-circle__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-circle-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-circle-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-circle-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-circle-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-circle__label {
		font-size: var(--ml-progress-circle-label-font-size, var(--ml-text-xs));
		color: var(--ml-progress-circle-label-color, var(--ml-color-text-muted));
		margin-top: var(--ml-progress-circle-label-margin-top, var(--ml-space-0-5));
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
		stroke: var(--ml-progress-half-track-color, var(--ml-color-surface-sunken));
	}

	.ml-progress-half__fill {
		stroke: var(--ml-progress-half-fill-color, var(--ml-color-primary));
		transition: stroke-dashoffset var(--ml-progress-transition-duration, var(--ml-duration-300)) var(--ml-progress-transition-easing, var(--ml-ease-out));
	}

	.ml-progress-half__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		text-align: center;
		padding-bottom: var(--ml-progress-half-center-padding-bottom, var(--ml-space-1));
	}

	.ml-progress-half--sm .ml-progress-half__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-progress-half-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-half-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-half--md .ml-progress-half__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-half-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-half-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-half-value-font-weight, var(--ml-font-semibold));
		color: var(--ml-progress-half-value-color, var(--ml-color-text));
		line-height: 1;
	}

	.ml-progress-half__label {
		font-size: var(--ml-progress-half-label-font-size, var(--ml-text-xs));
		color: var(--ml-progress-half-label-color, var(--ml-color-text-muted));
		margin-top: var(--ml-progress-half-label-margin-top, var(--ml-space-0-5));
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
	get clampedValue() {
		const max = Math.max(this.max, 1);
		return Math.min(Math.max(this.value, 0), max);
	}
	get ariaMax() {
		return Math.max(this.max, 1);
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
			<div class=${classMap({
		"ml-card__header": true,
		"ml-card__header--hidden": !c.hasHeader
	})}>
				<slot name="header"></slot>
			</div>
			<div class="ml-card__body">
				<slot></slot>
			</div>
			<div class=${classMap({
		"ml-card__footer": true,
		"ml-card__footer--hidden": !c.hasFooter
	})}>
				<slot name="footer"></slot>
			</div>
		</div>
	`;
}
const cardStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Background
	 * --ml-card-bg: var(--ml-color-surface)
	 * --ml-card-footer-bg: transparent
	 *
	 * Border
	 * --ml-card-border-width: var(--ml-border)
	 * --ml-card-border-color: var(--ml-color-border)
	 * --ml-card-border-radius: var(--ml-radius-lg)
	 *
	 * Spacing
	 * --ml-card-header-padding-y: var(--ml-space-4)
	 * --ml-card-header-padding-x: var(--ml-space-5)
	 * --ml-card-body-padding: var(--ml-space-5)
	 * --ml-card-footer-padding-y: var(--ml-space-4)
	 * --ml-card-footer-padding-x: var(--ml-space-5)
	 *
	 * Hover state
	 * --ml-card-hover-border-color: var(--ml-color-border-strong)
	 * --ml-card-hover-shadow: var(--ml-shadow-md)
	 *
	 * Focus state
	 * --ml-card-focus-border-color: var(--ml-color-primary)
	 * --ml-card-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Transition
	 * --ml-card-transition-duration: var(--ml-duration-200)
	 * --ml-card-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;

		/* Shadow */
		--ml-card-shadow: none;
	}

	.ml-card {
		background-color: var(--ml-card-bg, var(--ml-color-surface));
		border-radius: var(--ml-card-border-radius, var(--ml-radius-lg));
		overflow: hidden;
		height: 100%;
	}

	.ml-card--default {
		border: var(--ml-card-border-width, var(--ml-border)) solid var(--ml-card-border-color, var(--ml-color-border));
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-card--outlined {
		border: var(--ml-card-border-width, var(--ml-border)) solid var(--ml-card-border-color, var(--ml-color-border));
	}

	.ml-card--elevated {
		border: var(--ml-card-border-width, var(--ml-border)) solid var(--ml-color-border-muted);
		box-shadow: var(--ml-shadow-md);
	}

	.ml-card--filled {
		background-color: var(--ml-color-surface-raised);
		border: var(--ml-card-border-width, var(--ml-border)) solid transparent;
	}

	.ml-card--hoverable {
		transition:
			box-shadow var(--ml-card-transition-duration, var(--ml-duration-200)) var(--ml-card-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-card-transition-duration, var(--ml-duration-200)) var(--ml-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-card--hoverable:hover {
		border-color: var(--ml-card-hover-border-color, var(--ml-color-border-strong));
		box-shadow: var(--ml-card-hover-shadow, var(--ml-shadow-md));
	}

	.ml-card--clickable {
		cursor: pointer;
	}

	.ml-card--clickable:focus-visible {
		outline: none;
		border-color: var(--ml-card-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-card-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-card__header {
		padding: var(--ml-card-header-padding-y, var(--ml-space-4)) var(--ml-card-header-padding-x, var(--ml-space-5));
		border-bottom: var(--ml-card-border-width, var(--ml-border)) solid var(--ml-card-border-color, var(--ml-color-border));
	}

	.ml-card__header ::slotted(*) {
		margin: 0;
	}

	.ml-card__body {
		padding: var(--ml-card-body-padding, var(--ml-space-5));
	}

	.ml-card__footer {
		padding: var(--ml-card-footer-padding-y, var(--ml-space-4)) var(--ml-card-footer-padding-x, var(--ml-space-5));
		border-top: var(--ml-card-border-width, var(--ml-border)) solid var(--ml-card-border-color, var(--ml-color-border));
		background-color: var(--ml-card-footer-bg, transparent);
	}

	.ml-card__header--hidden,
	.ml-card__footer--hidden {
		display: none;
	}
`;
var CardComponent = class CardComponent$1 {
	constructor() {
		this.variant = "default";
		this.hoverable = false;
		this.clickable = false;
		this.hasHeader = false;
		this.hasFooter = false;
		this.handleClick = (event) => {
			if (this.clickable) this.elementRef.dispatchEvent(new CustomEvent("ml:click", {
				bubbles: true,
				composed: true,
				detail: { originalEvent: event }
			}));
		};
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "header") this.hasHeader = hasContent;
			else if (name === "footer") this.hasFooter = hasContent;
		});
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
			<span class="ml-divider__label">
				<slot></slot>
			</span>
		</div>
	`;
}
const dividerStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Color
	 * --ml-divider-color: var(--ml-color-border)
	 *
	 * Label
	 * --ml-divider-label-font-size: var(--ml-text-sm)
	 * --ml-divider-label-font-weight: var(--ml-font-medium)
	 * --ml-divider-label-color: var(--ml-color-text-muted)
	 * --ml-divider-label-padding: var(--ml-space-4)
	 *
	 * Vertical label
	 * --ml-divider-vertical-label-padding: var(--ml-space-3)
	 */

	:host {
		display: block;
	}

	:host([orientation='vertical']) {
		display: inline-block;
		height: 100%;
	}

	.ml-divider {
		display: flex;
		align-items: center;
	}

	/* The label slot is always rendered (so slotchange can fire);
	   hide the label span when there is no content. */
	.ml-divider:not(.ml-divider--with-label) .ml-divider__label {
		display: none;
	}

	.ml-divider--horizontal {
		width: 100%;
		height: 1px;
		background-color: var(--ml-divider-color, var(--ml-color-border));
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
		background-color: var(--ml-divider-color, var(--ml-color-border));
	}

	.ml-divider--horizontal .ml-divider__label {
		padding: 0 var(--ml-divider-label-padding, var(--ml-space-4));
		font-size: var(--ml-divider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-divider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-divider-label-color, var(--ml-color-text-muted));
		white-space: nowrap;
	}

	.ml-divider--vertical {
		flex-direction: column;
		width: 1px;
		min-height: 1rem;
		height: 100%;
		background-color: var(--ml-divider-color, var(--ml-color-border));
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
		background-color: var(--ml-divider-color, var(--ml-color-border));
	}

	.ml-divider--vertical .ml-divider__label {
		padding: var(--ml-divider-vertical-label-padding, var(--ml-space-3)) 0;
		font-size: var(--ml-divider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-divider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-divider-label-color, var(--ml-color-text-muted));
		writing-mode: vertical-rl;
	}
`;
var DividerComponent = class DividerComponent$1 {
	constructor() {
		this.orientation = "horizontal";
		this.hasLabel = false;
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "") this.hasLabel = hasContent;
		});
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-stack-direction: row
	 * --ml-stack-gap: var(--ml-space-4)
	 * --ml-stack-align: stretch
	 * --ml-stack-justify: flex-start
	 * --ml-stack-wrap: nowrap
	 */

	:host {
		/* ── Stack: layout ──
		   Set from the component's properties; override any of them from a
		   parent rule to change the layout without touching the markup. */

		display: block;
	}

	.ml-stack {
		display: flex;
		flex-direction: var(--ml-stack-direction, row);
		gap: var(--ml-stack-gap, var(--ml-space-4));
		align-items: var(--ml-stack-align, stretch);
		justify-content: var(--ml-stack-justify, flex-start);
		flex-wrap: var(--ml-stack-wrap, nowrap);
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
			"--ml-stack-direction": this.direction === "vertical" ? "column" : "row",
			"--ml-stack-gap": `var(--ml-space-${this.gap})`,
			"--ml-stack-align": alignMap[this.align],
			"--ml-stack-justify": justifyMap[this.justify],
			"--ml-stack-wrap": this.wrap ? "wrap" : "nowrap"
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Container: layout
	 * --ml-container-max-width: 1024px
	 * --ml-container-padding-x: var(--ml-space-4)
	 * --ml-container-margin-x: auto
	 */

	:host {
		display: block;
		width: 100%;
	}

	.ml-container {
		width: 100%;
		max-width: var(--ml-container-max-width, 1024px);
		padding-left: var(--ml-container-padding-x, var(--ml-space-4));
		padding-right: var(--ml-container-padding-x, var(--ml-space-4));
		margin-left: var(--ml-container-margin-x, auto);
		margin-right: var(--ml-container-margin-x, auto);
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
			"--ml-container-max-width": maxWidthMap[this.size],
			"--ml-container-padding-x": `var(--ml-space-${this.padding})`,
			"--ml-container-margin-x": this.centered ? "auto" : "0"
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
			${when(!!c.src && !c.imageError, () => html` <img class="ml-avatar__image" src="${c.src}" alt="${c.alt}" @error=${c.handleImageError} /> `, () => html`${when(!!c.initials, () => html`<span class="ml-avatar__initials">${c.getInitials()}</span>`, () => html`
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Avatar: colors
	 * --ml-avatar-bg: var(--ml-color-surface-raised)
	 * --ml-avatar-color: var(--ml-color-text-muted)
	 * --ml-avatar-font-weight: var(--ml-font-semibold)
	 * --ml-avatar-border-color: var(--ml-color-surface)
	 * --ml-avatar-shadow: var(--ml-shadow-xs)
	 * --ml-avatar-radius: var(--ml-radius-full)
	 *
	 * Avatar: fallback icon
	 * --ml-avatar-fallback-color: var(--ml-color-text-subtle)
	 */

	:host {
		display: inline-block;
	}

	.ml-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background-color: var(--ml-avatar-bg, var(--ml-color-surface-raised));
		color: var(--ml-avatar-color, var(--ml-color-text-muted));
		font-weight: var(--ml-avatar-font-weight, var(--ml-font-semibold));
		vertical-align: middle;
		border-radius: var(--ml-avatar-radius, var(--ml-radius-full));
		border: 2px solid var(--ml-avatar-border-color, var(--ml-color-surface));
		box-shadow: var(--ml-avatar-shadow, var(--ml-shadow-xs));
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
		color: var(--ml-avatar-fallback-color, var(--ml-color-text-subtle));
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
		this.imageError = false;
		this.handleImageError = () => {
			this.imageError = true;
		};
	}
	onPropertyChange(name, oldVal, newVal) {
		if (name === "src" && oldVal !== newVal) this.imageError = false;
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-badge-background: var(--ml-badge-default-bg)
	 * --ml-badge-border-color: var(--ml-badge-default-border)
	 * --ml-badge-text: var(--ml-badge-default-text)
	 *
	 * Badge: typography
	 * --ml-badge-font: var(--ml-font-sans)
	 * --ml-badge-font-weight: var(--ml-font-medium)
	 * --ml-badge-font-size: var(--ml-text-xs)
	 *
	 * Badge: spacing / shape
	 * --ml-badge-gap: var(--ml-space-1-5)
	 * --ml-badge-padding: var(--ml-space-1) var(--ml-space-3)
	 * --ml-badge-radius: var(--ml-radius-md)
	 * --ml-badge-border-width: var(--ml-border)
	 *
	 * Badge: pill shape
	 * --ml-badge-pill-radius: var(--ml-radius-full)
	 *
	 * Badge: dot
	 * --ml-badge-dot-size: 0.375rem
	 * --ml-badge-dot-size-xs: 0.3125rem
	 * --ml-badge-dot-size-lg: 0.5rem
	 * --ml-badge-dot-radius: var(--ml-radius-full)
	 *
	 * Badge: secondary variant
	 * --ml-badge-secondary-color: var(--ml-color-text-secondary)
	 *
	 * Badge: custom variant (consumer API: --ml-badge-bg / --ml-badge-color)
	 * --ml-badge-custom-color: var(--ml-badge-color, #fff)
	 */

	:host {
		display: inline-block;

		/* ── Badge: colors (default variant; variant classes reassign) ──
		   --ml-badge-background     - background color
		   --ml-badge-border-color   - border color
		   --ml-badge-text           - text color */
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-badge-gap, var(--ml-space-1-5));
		padding: var(--ml-badge-padding, var(--ml-space-1) var(--ml-space-3));
		font-family: var(--ml-badge-font, var(--ml-font-sans));
		font-size: var(--ml-badge-font-size, var(--ml-text-xs));
		font-weight: var(--ml-badge-font-weight, var(--ml-font-medium));
		line-height: 1;
		white-space: nowrap;
		color: var(--ml-badge-text, var(--ml-badge-default-text));
		background-color: var(--ml-badge-background, var(--ml-badge-default-bg));
		border-radius: var(--ml-badge-radius, var(--ml-radius-md));
		border: var(--ml-badge-border-width, var(--ml-border)) solid var(--ml-badge-border-color, var(--ml-badge-default-border));
	}

	.ml-badge--pill {
		border-radius: var(--ml-badge-pill-radius, var(--ml-radius-full));
	}

	.ml-badge__dot {
		width: var(--ml-badge-dot-size, 0.375rem);
		height: var(--ml-badge-dot-size, 0.375rem);
		border-radius: var(--ml-badge-dot-radius, var(--ml-radius-full));
		background-color: currentColor;
	}

	.ml-badge--lg .ml-badge__dot {
		width: var(--ml-badge-dot-size-lg, 0.5rem);
		height: var(--ml-badge-dot-size-lg, 0.5rem);
	}

	.ml-badge--xs .ml-badge__dot {
		width: var(--ml-badge-dot-size-xs, 0.3125rem);
		height: var(--ml-badge-dot-size-xs, 0.3125rem);
	}

	/* ── Size variants: reassign base spacing/typography properties ── */
	.ml-badge--xs {
		--ml-badge-padding: 1px var(--ml-space-1-5);
		--ml-badge-font-size: 0.6875rem;
	}

	.ml-badge--sm {
		--ml-badge-padding: 2px var(--ml-space-2);
		--ml-badge-font-size: var(--ml-text-xs);
	}

	.ml-badge--md {
		--ml-badge-padding: var(--ml-space-1) var(--ml-space-3);
		--ml-badge-font-size: var(--ml-text-xs);
	}

	.ml-badge--lg {
		--ml-badge-padding: var(--ml-space-1) var(--ml-space-4);
		--ml-badge-font-size: var(--ml-text-sm);
	}

	/* ── Color variants: reassign base color properties ── */
	.ml-badge--default {
		--ml-badge-background: var(--ml-badge-default-bg);
		--ml-badge-border-color: var(--ml-badge-default-border);
		--ml-badge-text: var(--ml-badge-default-text);
	}

	.ml-badge--primary {
		--ml-badge-background: var(--ml-badge-primary-bg);
		--ml-badge-border-color: var(--ml-badge-primary-border);
		--ml-badge-text: var(--ml-badge-primary-text);
	}

	.ml-badge--secondary {
		--ml-badge-background: var(--ml-badge-default-bg);
		--ml-badge-border-color: var(--ml-badge-default-border);
		--ml-badge-text: var(--ml-badge-secondary-color, var(--ml-color-text-secondary));
	}

	.ml-badge--success {
		--ml-badge-background: var(--ml-badge-success-bg);
		--ml-badge-border-color: var(--ml-badge-success-border);
		--ml-badge-text: var(--ml-badge-success-text);
	}

	.ml-badge--warning {
		--ml-badge-background: var(--ml-badge-warning-bg);
		--ml-badge-border-color: var(--ml-badge-warning-border);
		--ml-badge-text: var(--ml-badge-warning-text);
	}

	.ml-badge--error {
		--ml-badge-background: var(--ml-badge-error-bg);
		--ml-badge-border-color: var(--ml-badge-error-border);
		--ml-badge-text: var(--ml-badge-error-text);
	}

	/* Custom variant keeps its documented consumer API: set --ml-badge-bg and
	   optionally --ml-badge-color on the host. */
	.ml-badge--custom {
		--ml-badge-background: var(--ml-badge-bg, transparent);
		--ml-badge-border-color: transparent;
		--ml-badge-text: var(--ml-badge-custom-color, var(--ml-badge-color, #fff));
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Badge Group: base
	 * --ml-badge-group-font: var(--ml-font-sans)
	 * --ml-badge-group-font-weight: var(--ml-font-medium)
	 * --ml-badge-group-gap: var(--ml-space-2)
	 * --ml-badge-group-border-width: var(--ml-border)
	 *
	 * Badge Group: shapes
	 * --ml-badge-group-pill-radius: var(--ml-radius-full)
	 * --ml-badge-group-modern-radius: var(--ml-radius-md)
	 *
	 * Badge Group: inner label
	 * --ml-badge-group-label-bg: var(--ml-color-surface)
	 * --ml-badge-group-label-radius: var(--ml-radius-full)
	 * --ml-badge-group-label-modern-radius: var(--ml-radius-sm)
	 */

	:host {
		display: inline-block;
	}

	.ml-badge-group {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-badge-group-gap, var(--ml-space-2));
		font-family: var(--ml-badge-group-font, var(--ml-font-sans));
		font-weight: var(--ml-badge-group-font-weight, var(--ml-font-medium));
		line-height: 1;
		white-space: nowrap;
		border: var(--ml-badge-group-border-width, var(--ml-border)) solid transparent;
	}

	/* Themes */
	.ml-badge-group--pill {
		border-radius: var(--ml-badge-group-pill-radius, var(--ml-radius-full));
	}

	.ml-badge-group--modern {
		border-radius: var(--ml-badge-group-modern-radius, var(--ml-radius-md));
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
		font-weight: var(--ml-badge-group-font-weight, var(--ml-font-medium));
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-badge-group-label-radius, var(--ml-radius-full));
	}

	.ml-badge-group--modern .ml-badge-group__label {
		border-radius: var(--ml-badge-group-label-modern-radius, var(--ml-radius-sm));
	}

	/* Inner label colors - slightly stronger than the outer bg */
	.ml-badge-group__label--default {
		background-color: var(--ml-badge-group-label-bg, var(--ml-color-surface));
		color: var(--ml-badge-default-text);
		border: 1px solid var(--ml-badge-default-border);
	}

	.ml-badge-group__label--primary {
		background-color: var(--ml-badge-group-label-bg, var(--ml-color-surface));
		color: var(--ml-badge-primary-text);
		border: 1px solid var(--ml-badge-primary-border);
	}

	.ml-badge-group__label--success {
		background-color: var(--ml-badge-group-label-bg, var(--ml-color-surface));
		color: var(--ml-badge-success-text);
		border: 1px solid var(--ml-badge-success-border);
	}

	.ml-badge-group__label--warning {
		background-color: var(--ml-badge-group-label-bg, var(--ml-color-surface));
		color: var(--ml-badge-warning-text);
		border: 1px solid var(--ml-badge-warning-border);
	}

	.ml-badge-group__label--error {
		background-color: var(--ml-badge-group-label-bg, var(--ml-color-surface));
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
	const avatarSrc = c.avatarSrc;
	const dotColor = c.resolvedDotColor;
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tag: base
	 * --ml-tag-font: var(--ml-font-sans)
	 * --ml-tag-font-weight: var(--ml-font-medium)
	 * --ml-tag-radius: var(--ml-radius-md)
	 * --ml-tag-border-width: var(--ml-border)
	 * --ml-tag-border-color: var(--ml-color-border)
	 * --ml-tag-bg: var(--ml-color-surface)
	 * --ml-tag-color: var(--ml-color-text)
	 *
	 * Tag: dot colors
	 * --ml-tag-dot-success: var(--ml-color-success)
	 * --ml-tag-dot-warning: var(--ml-color-warning)
	 * --ml-tag-dot-danger: var(--ml-color-danger)
	 * --ml-tag-dot-info: var(--ml-color-info)
	 * --ml-tag-dot-primary: var(--ml-color-primary)
	 * --ml-tag-dot-secondary: var(--ml-color-secondary)
	 *
	 * Tag: count
	 * --ml-tag-count-color: var(--ml-color-text-secondary)
	 *
	 * Tag: close button
	 * --ml-tag-close-color: var(--ml-color-text-muted)
	 * --ml-tag-close-hover-color: var(--ml-color-text-secondary)
	 * --ml-tag-close-active-color: var(--ml-color-text)
	 *
	 * Tag: checkbox
	 * --ml-tag-checkbox-border: var(--ml-color-border-strong)
	 * --ml-tag-checkbox-bg: var(--ml-color-surface)
	 * --ml-tag-checkbox-checked-bg: var(--ml-color-primary)
	 * --ml-tag-checkbox-checked-border: var(--ml-color-primary)
	 * --ml-tag-checkbox-hover-border: var(--ml-color-primary)
	 * --ml-tag-checkbox-checked-hover-bg: var(--ml-color-primary-hover)
	 * --ml-tag-checkbox-checked-hover-border: var(--ml-color-primary-hover)
	 *
	 * Tag: disabled
	 * --ml-tag-disabled-opacity: 0.5
	 */

	:host {
		display: inline-block;
	}

	.ml-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-tag-font, var(--ml-font-sans));
		font-weight: var(--ml-tag-font-weight, var(--ml-font-medium));
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-tag-radius, var(--ml-radius-md));
		border: var(--ml-tag-border-width, var(--ml-border)) solid var(--ml-tag-border-color, var(--ml-color-border));
		background-color: var(--ml-tag-bg, var(--ml-color-surface));
		color: var(--ml-tag-color, var(--ml-color-text));
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
		background-color: var(--ml-tag-dot-success, var(--ml-color-success));
	}

	.ml-tag__dot--warning {
		background-color: var(--ml-tag-dot-warning, var(--ml-color-warning));
	}

	.ml-tag__dot--danger {
		background-color: var(--ml-tag-dot-danger, var(--ml-color-danger));
	}

	.ml-tag__dot--info {
		background-color: var(--ml-tag-dot-info, var(--ml-color-info));
	}

	.ml-tag__dot--primary {
		background-color: var(--ml-tag-dot-primary, var(--ml-color-primary));
	}

	.ml-tag__dot--secondary {
		background-color: var(--ml-tag-dot-secondary, var(--ml-color-secondary));
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
		font-weight: var(--ml-tag-font-weight, var(--ml-font-medium));
		color: var(--ml-tag-count-color, var(--ml-color-text-secondary));
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
		color: var(--ml-tag-close-color, var(--ml-color-text-muted));
		cursor: pointer;
		border-radius: var(--ml-radius-sm);
		transition: color 0.15s ease;
		line-height: 0;
	}

	.ml-tag__close:hover {
		color: var(--ml-tag-close-hover-color, var(--ml-color-text-secondary));
	}

	.ml-tag__close:active {
		color: var(--ml-tag-close-active-color, var(--ml-color-text));
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
		border: var(--ml-tag-border-width, var(--ml-border)) solid var(--ml-tag-checkbox-border, var(--ml-color-border-strong));
		border-radius: var(--ml-radius-sm);
		background: var(--ml-tag-checkbox-bg, var(--ml-color-surface));
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
		background-color: var(--ml-tag-checkbox-checked-bg, var(--ml-color-primary));
		border-color: var(--ml-tag-checkbox-checked-border, var(--ml-color-primary));
	}

	.ml-tag__checkbox:hover {
		border-color: var(--ml-tag-checkbox-hover-border, var(--ml-color-primary));
	}

	.ml-tag__checkbox--checked:hover {
		background-color: var(--ml-tag-checkbox-checked-hover-bg, var(--ml-color-primary-hover));
		border-color: var(--ml-tag-checkbox-checked-hover-border, var(--ml-color-primary-hover));
	}

	/* Disabled state */
	.ml-tag--disabled {
		opacity: var(--ml-tag-disabled-opacity, 0.5);
		pointer-events: none;
	}
`;
var TagComponent = class TagComponent$1 {
	constructor() {
		this.size = "md";
		this.dot = false;
		this.dotColor = "success";
		this.closable = false;
		this.avatarSrc = "";
		this.icon = "";
		this.count = "";
		this.checkable = false;
		this.checked = false;
		this.disabled = false;
		this.handleClose = (event) => {
			event.stopPropagation();
			if (this.disabled) return;
			this.elementRef.dispatchEvent(new CustomEvent("ml:dismiss", {
				bubbles: true,
				composed: true
			}));
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
	get resolvedDotColor() {
		const color = this.dotColor;
		return color === "error" ? "danger" : color;
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
defineLegacyAliases(TagComponent.prototype, "ml-tag", {
	"dot-color": "dotColor",
	"avatar-src": "avatarSrc"
});
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * List: divider
	 * --ml-list-divider-width: var(--ml-border)
	 * --ml-list-divider-color: var(--ml-color-border)
	 */

	:host {
		display: block;
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
		border-bottom: var(--ml-list-divider-width, var(--ml-border)) solid var(--ml-list-divider-color, var(--ml-color-border));
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
		<div class="ml-li">
			<div class=${classMap({
		"ml-li__leading": true,
		"ml-li__leading--hidden": !c.hasLeadingSlot
	})}>
				<slot name="leading"></slot>
			</div>
			<div class="ml-li__content">
				${when(!!c.primary, () => html`<span class="ml-li__primary">${c.primary}</span>`)}
				${when(!!c.secondary, () => html`<span class="ml-li__secondary">${c.secondary}</span>`)}
				<slot></slot>
			</div>
			<div class=${classMap({
		"ml-li__trailing": true,
		"ml-li__trailing--hidden": !c.hasTrailingSlot
	})}>
				<slot name="trailing"></slot>
			</div>
		</div>
	`;
}
const listItemStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-list-item-gap: var(--ml-space-3)
	 *
	 * List Item: primary text
	 * --ml-list-item-primary-font: var(--ml-font-sans)
	 * --ml-list-item-primary-size: var(--ml-text-sm)
	 * --ml-list-item-primary-weight: var(--ml-font-semibold)
	 * --ml-list-item-primary-color: var(--ml-color-text)
	 *
	 * List Item: secondary text
	 * --ml-list-item-secondary-font: var(--ml-font-sans)
	 * --ml-list-item-secondary-size: var(--ml-text-xs)
	 * --ml-list-item-secondary-color: var(--ml-color-text-secondary)
	 *
	 * List Item: interactive states
	 * --ml-list-item-hover-bg: var(--ml-color-bg-secondary)
	 * --ml-list-item-focus-color: var(--ml-color-primary)
	 * --ml-list-item-focus-radius: var(--ml-radius-md)
	 * --ml-list-item-disabled-opacity: 0.5
	 *
	 * --ml-list-item-padding: var(--_ml-list-padding, var(--ml-space-3) 0)
	 */

	:host {
		display: block;

		padding: var(--ml-list-item-padding, var(--_ml-list-padding, var(--ml-space-3) 0));
	}

	:host([disabled]) {
		opacity: var(--ml-list-item-disabled-opacity, 0.5);
		pointer-events: none;
	}

	:host([interactive]) {
		cursor: pointer;
	}

	:host([interactive]:hover) {
		background-color: var(--ml-list-item-hover-bg, var(--ml-color-bg-secondary));
	}

	:host([interactive]:focus-visible) {
		outline: 2px solid var(--ml-list-item-focus-color, var(--ml-color-primary));
		outline-offset: -2px;
		border-radius: var(--ml-list-item-focus-radius, var(--ml-radius-md));
	}

	:host([interactive]) .ml-li {
		padding-inline: var(--ml-space-3);
	}

	.ml-li {
		display: flex;
		align-items: center;
		gap: var(--ml-list-item-gap, var(--ml-space-3));
	}

	.ml-li__leading {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-li__leading--hidden,
	.ml-li__trailing--hidden {
		display: none;
	}

	.ml-li__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-li__primary {
		font-family: var(--ml-list-item-primary-font, var(--ml-font-sans));
		font-size: var(--ml-list-item-primary-size, var(--ml-text-sm));
		font-weight: var(--ml-list-item-primary-weight, var(--ml-font-semibold));
		color: var(--ml-list-item-primary-color, var(--ml-color-text));
		line-height: var(--ml-leading-normal);
	}

	.ml-li__secondary {
		font-family: var(--ml-list-item-secondary-font, var(--ml-font-sans));
		font-size: var(--ml-list-item-secondary-size, var(--ml-text-xs));
		color: var(--ml-list-item-secondary-color, var(--ml-color-text-secondary));
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
		this.hasLeadingSlot = false;
		this.hasTrailingSlot = false;
		this._handleKeyDown = (event) => {
			if (!this.interactive || this.disabled) return;
			if (event.target !== this.elementRef) return;
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			this.elementRef.click();
		};
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (shadow) watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "leading") this.hasLeadingSlot = hasContent;
			else if (name === "trailing") this.hasTrailingSlot = hasContent;
		});
		this.elementRef.addEventListener("keydown", this._handleKeyDown);
		this.syncHostA11y();
	}
	onRender() {
		this.syncHostA11y();
	}
	syncHostA11y() {
		const host = this.elementRef;
		if (this.interactive) {
			host.setAttribute("role", "button");
			if (this.disabled) {
				host.removeAttribute("tabindex");
				host.setAttribute("aria-disabled", "true");
			} else {
				host.setAttribute("tabindex", "0");
				host.removeAttribute("aria-disabled");
			}
		} else {
			host.setAttribute("role", "listitem");
			host.removeAttribute("tabindex");
			host.removeAttribute("aria-disabled");
		}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Activity Feed: list divider
	 * --ml-activity-feed-divider-width: var(--ml-border)
	 * --ml-activity-feed-divider-color: var(--ml-color-border)
	 */

	:host {
		display: block;
	}

	.ml-activity-feed {
		display: flex;
		flex-direction: column;
	}

	/* List variant: dividers between items */
	.ml-activity-feed--list ::slotted(ml-activity-feed-item:not(:last-of-type)) {
		border-bottom: var(--ml-activity-feed-divider-width, var(--ml-border)) solid var(--ml-activity-feed-divider-color, var(--ml-color-border));
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
					<slot name="avatar">
						<ml-avatar
							size=${c.avatarSize}
							src=${c.avatarSrc}
							initials=${c.avatarInitials}
						></ml-avatar>
					</slot>
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
		[`ml-afi__indicator--${c.indicatorColor}`]: c.isPresetColor
	})}
								style=${c.isPresetColor ? "" : `--ml-afi-indicator-bg: ${c.indicatorColor}`}
							></span>
						`)}
				</div>
				${when(!!c.subtitle, () => html`<div class="ml-afi__subtitle">${c.subtitle}</div>`)}
				<div class="ml-afi__description">
					<slot></slot>
				</div>
				<div class=${classMap({
		"ml-afi__content": true,
		"ml-afi__content--hidden": !c.hasContentSlot
	})}>
					<slot name="content"></slot>
				</div>
			</div>
		</article>
	`;
}
const activityFeedItemStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-activity-feed-item-gap: var(--ml-space-3)
	 *
	 * Activity Feed Item: connector
	 * --ml-activity-feed-item-connector-color: var(--ml-color-border)
	 * --ml-activity-feed-item-connector-width: 2px
	 * --ml-activity-feed-item-connector-radius: var(--ml-radius-full)
	 * --ml-activity-feed-item-connector-spacing: var(--ml-space-2)
	 *
	 * Activity Feed Item: name
	 * --ml-activity-feed-item-name-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-name-size: var(--ml-text-sm)
	 * --ml-activity-feed-item-name-weight: var(--ml-font-semibold)
	 * --ml-activity-feed-item-name-color: var(--ml-color-text)
	 *
	 * Activity Feed Item: timestamp
	 * --ml-activity-feed-item-timestamp-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-timestamp-size: var(--ml-text-xs)
	 * --ml-activity-feed-item-timestamp-color: var(--ml-color-text-tertiary)
	 *
	 * Activity Feed Item: subtitle
	 * --ml-activity-feed-item-subtitle-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-subtitle-size: var(--ml-text-xs)
	 * --ml-activity-feed-item-subtitle-color: var(--ml-color-text-secondary)
	 *
	 * Activity Feed Item: description
	 * --ml-activity-feed-item-description-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-description-size: var(--ml-text-sm)
	 * --ml-activity-feed-item-description-color: var(--ml-color-text-secondary)
	 * --ml-activity-feed-item-description-line-height: var(--ml-leading-relaxed)
	 *
	 * Activity Feed Item: description link
	 * --ml-activity-feed-item-link-color: var(--ml-color-primary)
	 * --ml-activity-feed-item-link-weight: var(--ml-font-medium)
	 *
	 * Activity Feed Item: indicator
	 * --ml-activity-feed-item-indicator-size: 8px
	 * --ml-activity-feed-item-indicator-radius: var(--ml-radius-full)
	 *
	 * Activity Feed Item: indicator colors
	 * --ml-activity-feed-item-indicator-gray: var(--ml-color-text-tertiary)
	 * --ml-activity-feed-item-indicator-primary: var(--ml-color-primary)
	 * --ml-activity-feed-item-indicator-success: var(--ml-color-success)
	 * --ml-activity-feed-item-indicator-warning: var(--ml-color-warning)
	 * --ml-activity-feed-item-indicator-error: var(--ml-color-error)
	 *
	 * --ml-activity-feed-item-padding: var(--ml-space-4) 0
	 */

	:host {
		display: block;

		padding: var(--ml-activity-feed-item-padding, var(--ml-space-4) 0);
	}

	.ml-afi {
		display: flex;
		gap: var(--ml-activity-feed-item-gap, var(--ml-space-3));
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
		width: var(--ml-activity-feed-item-connector-width, 2px);
		margin-top: var(--ml-activity-feed-item-connector-spacing, var(--ml-space-2));
		background-color: var(--ml-activity-feed-item-connector-color, var(--ml-color-border));
		border-radius: var(--ml-activity-feed-item-connector-radius, var(--ml-radius-full));
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
		font-family: var(--ml-activity-feed-item-name-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-name-size, var(--ml-text-sm));
		font-weight: var(--ml-activity-feed-item-name-weight, var(--ml-font-semibold));
		color: var(--ml-activity-feed-item-name-color, var(--ml-color-text));
	}

	.ml-afi__timestamp {
		font-family: var(--ml-activity-feed-item-timestamp-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-timestamp-size, var(--ml-text-xs));
		color: var(--ml-activity-feed-item-timestamp-color, var(--ml-color-text-tertiary));
	}

	.ml-afi__subtitle {
		font-family: var(--ml-activity-feed-item-subtitle-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-subtitle-size, var(--ml-text-xs));
		color: var(--ml-activity-feed-item-subtitle-color, var(--ml-color-text-secondary));
		margin-top: var(--ml-space-0-5);
	}

	.ml-afi__description {
		font-family: var(--ml-activity-feed-item-description-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-description-size, var(--ml-text-sm));
		color: var(--ml-activity-feed-item-description-color, var(--ml-color-text-secondary));
		line-height: var(--ml-activity-feed-item-description-line-height, var(--ml-leading-relaxed));
		margin-top: var(--ml-space-1);
	}

	.ml-afi__description ::slotted(a) {
		color: var(--ml-activity-feed-item-link-color, var(--ml-color-primary));
		text-decoration: none;
		font-weight: var(--ml-activity-feed-item-link-weight, var(--ml-font-medium));
	}

	.ml-afi__description ::slotted(a:hover) {
		text-decoration: underline;
	}

	.ml-afi__description ::slotted(strong) {
		font-weight: var(--ml-font-semibold);
		color: var(--ml-activity-feed-item-name-color, var(--ml-color-text));
	}

	.ml-afi__content {
		margin-top: var(--ml-space-2);
	}

	.ml-afi__content--hidden {
		display: none;
	}

	/* Indicator dot */
	.ml-afi__indicator {
		width: var(--ml-activity-feed-item-indicator-size, 8px);
		height: var(--ml-activity-feed-item-indicator-size, 8px);
		border-radius: var(--ml-activity-feed-item-indicator-radius, var(--ml-radius-full));
		flex-shrink: 0;
		background-color: var(--ml-afi-indicator-bg);
	}

	.ml-afi__indicator--gray {
		background-color: var(--ml-activity-feed-item-indicator-gray, var(--ml-color-text-tertiary));
	}

	.ml-afi__indicator--primary {
		background-color: var(--ml-activity-feed-item-indicator-primary, var(--ml-color-primary));
	}

	.ml-afi__indicator--success {
		background-color: var(--ml-activity-feed-item-indicator-success, var(--ml-color-success));
	}

	.ml-afi__indicator--warning {
		background-color: var(--ml-activity-feed-item-indicator-warning, var(--ml-color-warning));
	}

	.ml-afi__indicator--error {
		background-color: var(--ml-activity-feed-item-indicator-error, var(--ml-color-error));
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
		this.avatarSrc = "";
		this.avatarInitials = "";
		this.avatarSize = "sm";
		this.subtitle = "";
		this.indicator = false;
		this.indicatorColor = "gray";
		this.hasAvatarSlot = false;
		this.hasContentSlot = false;
	}
	get isPresetColor() {
		return INDICATOR_PRESETS.has(this.indicatorColor);
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "avatar") this.hasAvatarSlot = hasContent;
			else if (name === "content") this.hasContentSlot = hasContent;
		});
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
defineLegacyAliases(ActivityFeedItemComponent.prototype, "ml-activity-feed-item", {
	"avatar-src": "avatarSrc",
	"avatar-initials": "avatarInitials",
	"avatar-size": "avatarSize",
	"indicator-color": "indicatorColor"
});
function renderCell(column, row, index) {
	if (column.render) return column.render(row[column.key], row, index);
	return row[column.key] ?? "";
}
var TableCore = class {
	constructor(host, options) {
		this._scroller = new VirtualScroller();
		this._viewport = null;
		this._host = host;
		this._options = options;
	}
	sortRows(rows) {
		const key = this._host.sortKey;
		if (!key) return rows;
		const dir = this._host.sortDirection === "asc" ? 1 : -1;
		return [...rows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal == null) return bVal == null ? 0 : 1;
			if (bVal == null) return -1;
			if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
	}
	handleSortClick(column, beforeDispatch) {
		if (!column.sortable) return;
		if (this._host.sortKey === column.key) this._host.sortDirection = this._host.sortDirection === "asc" ? "desc" : "asc";
		else {
			this._host.sortKey = column.key;
			this._host.sortDirection = "asc";
		}
		beforeDispatch?.();
		const hadSelection = this.clearSelection();
		this._scroller.invalidate();
		this._host.elementRef.dispatchEvent(new CustomEvent("ml:sort", {
			bubbles: true,
			composed: true,
			detail: {
				key: this._host.sortKey,
				direction: this._host.sortDirection
			}
		}));
		if (hadSelection) this.emitSelect();
	}
	get allSelected() {
		const total = this._options.displayRows().length;
		return total > 0 && this._host.selectedIndices.length === total;
	}
	get someSelected() {
		return this._host.selectedIndices.length > 0 && !this.allSelected;
	}
	isRowSelected(index) {
		return this._host.selectedIndices.includes(index);
	}
	toggleSelectAll() {
		this._host.selectedIndices = this.allSelected ? [] : this._options.displayRows().map((_, i) => i);
		this.emitSelect();
	}
	toggleSelectRow(index, event) {
		event.stopPropagation();
		this._host.selectedIndices = this._host.selectedIndices.includes(index) ? this._host.selectedIndices.filter((i) => i !== index) : [...this._host.selectedIndices, index];
		this.emitSelect();
	}
	clearSelection() {
		const hadSelection = this._host.selectedIndices.length > 0;
		this._host.selectedIndices = [];
		return hadSelection;
	}
	emitSelect() {
		const display = this._options.displayRows();
		const selectedRows = this._host.selectedIndices.map((i) => display[i]).filter((row) => row !== void 0);
		const indexByRow = /* @__PURE__ */ new Map();
		this._host.rows.forEach((row, i) => {
			if (!indexByRow.has(row)) indexByRow.set(row, i);
		});
		const selectedIndices = selectedRows.map((row) => indexByRow.get(row)).filter((i) => i !== void 0);
		this._host.elementRef.dispatchEvent(new CustomEvent("ml:select", {
			bubbles: true,
			composed: true,
			detail: {
				selectedRows,
				selectedIndices,
				allSelected: this.allSelected
			}
		}));
	}
	emitRowClick(row, index) {
		this._host.elementRef.dispatchEvent(new CustomEvent("ml:row-click", {
			bubbles: true,
			composed: true,
			detail: {
				row,
				index
			}
		}));
	}
	attachScroller() {
		if (this._viewport) return;
		const shadow = this._host.elementRef.shadowRoot;
		if (!shadow) return;
		this._viewport = shadow.querySelector(this._options.viewportSelector);
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this._host.rowHeight,
			itemCount: () => this._options.displayRows().length,
			onUpdate: (start, end) => {
				this._host.startIndex = start;
				this._host.endIndex = end;
			},
			enabled: () => this._host.virtual
		});
	}
	detach() {
		this._scroller.detach();
		this._viewport = null;
	}
	invalidateScroller() {
		this._scroller.invalidate();
	}
	scrollViewportToTop() {
		if (this._viewport) this._viewport.scrollTop = 0;
	}
	handleRowsChange(afterCommit) {
		this._host.selectedIndices = [];
		queueMicrotask(() => {
			afterCommit?.();
			this._scroller.invalidate();
		});
	}
	syncRenderWindow() {
		this.attachScroller();
		const total = this._options.displayRows().length;
		if (this._host.virtual) {
			if (this._viewport && this._viewport.clientHeight === 0 && total > 0) {
				const approxEnd = Math.min(total, Math.ceil(600 / this._host.rowHeight) + 6);
				if (approxEnd !== this._host.endIndex) this._host.endIndex = approxEnd;
			}
		} else if (this._host.endIndex !== total) this._host.endIndex = total;
	}
	get visibleRows() {
		const display = this._options.displayRows();
		if (!this._host.virtual) return display;
		return display.slice(this._host.startIndex, this._host.endIndex);
	}
	get topSpacerHeight() {
		return this._host.virtual ? this._host.startIndex * this._host.rowHeight : 0;
	}
	get bottomSpacerHeight() {
		if (!this._host.virtual) return 0;
		return Math.max(0, (this._options.displayRows().length - this._host.endIndex) * this._host.rowHeight);
	}
};
function memoOn() {
	let lastDeps = null;
	let lastValue;
	return (deps, compute) => {
		if (lastDeps !== null && lastDeps.length === deps.length && lastDeps.every((dep, i) => Object.is(dep, deps[i]))) return lastValue;
		lastDeps = deps;
		lastValue = compute();
		return lastValue;
	};
}
function tableTemplate(c) {
	return html`
		<div class=${classMap({
		"ml-table": true,
		[`ml-table--${c.size}`]: true,
		"ml-table--striped": c.striped,
		"ml-table--hoverable": c.hoverable,
		"ml-table--row-clickable": c.clickableRows,
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
									part="header-cell"
									class=${classMap({
		"ml-table__th": true,
		"ml-table__th--sortable": !!col.sortable,
		"ml-table__th--sorted": c.sortKey === col.key,
		[`ml-table__th--${col.align ?? "left"}`]: true
	})}
									style=${col.width ? `width: ${col.width}` : ""}
									tabindex=${col.sortable ? "0" : ""}
									role=${col.sortable ? "columnheader button" : ""}
									@click=${() => c.handleSort(col)}
									@keydown=${(e) => c.handleHeaderKeyDown(col, e)}
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
									part="row"
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
										<td
											part="cell"
											class=${classMap({
			"ml-table__td": true,
			[`ml-table__td--${col.align ?? "left"}`]: true
		})}
										>
											${renderCell(col, row, absoluteIndex)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Table: surface
	 * --ml-table-bg: var(--ml-color-surface)
	 * --ml-table-font: var(--ml-font-sans)
	 *
	 * Deprecated aliases — prefer container-* and divider-* tokens below
	 * --ml-table-border-width: var(--ml-border)
	 * --ml-table-border-color: var(--ml-color-border)
	 * --ml-table-radius: var(--ml-radius-lg)
	 *
	 * Table: container chrome (outer border + radius)
	 * --ml-table-container-border-width: var(--ml-table-border-width)
	 * --ml-table-container-border-color: var(--ml-table-border-color)
	 * --ml-table-container-radius: var(--ml-table-radius)
	 *
	 * Table: internal dividers (header/row/footer separators)
	 * --ml-table-divider-width: var(--ml-table-border-width)
	 * --ml-table-divider-color: var(--ml-table-border-color)
	 *
	 * Table: header section
	 * --ml-table-title-color: var(--ml-color-text)
	 * --ml-table-description-color: var(--ml-color-text-muted)
	 *
	 * Table: column header
	 * --ml-table-header-bg: var(--ml-color-surface-sunken)
	 * --ml-table-header-color: var(--ml-color-text-muted)
	 * --ml-table-header-sorted-color: var(--ml-color-text)
	 *
	 * Table: sort icon
	 * --ml-table-sort-color: var(--ml-color-text-muted)
	 * --ml-table-sort-active-color: var(--ml-color-primary)
	 *
	 * Table: rows
	 * --ml-table-row-hover-bg: var(--ml-color-surface-sunken)
	 * --ml-table-row-hover-border-color: transparent
	 * --ml-table-row-hover-border-width: 0
	 * --ml-table-row-hover-border-left-width: 0
	 * --ml-table-row-hover-border-left-color: transparent
	 * --ml-table-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04))
	 * --ml-table-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.06))
	 * --ml-table-row-striped-bg: var(--ml-color-surface-sunken)
	 * --ml-table-row-striped-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Table: cells
	 * --ml-table-cell-color: var(--ml-color-text)
	 * --ml-table-cell-padding-y: var(--ml-space-4)
	 * --ml-table-cell-padding-x: var(--ml-space-6)
	 * --ml-table-cell-padding-y-sm: var(--ml-space-2-5)
	 * --ml-table-cell-padding-x-sm: var(--ml-space-4)
	 *
	 * Table: header cells
	 * --ml-table-header-padding-y: var(--ml-space-3)
	 * --ml-table-header-padding-x: var(--ml-space-6)
	 * --ml-table-header-padding-y-sm: var(--ml-space-2)
	 * --ml-table-header-padding-x-sm: var(--ml-space-4)
	 *
	 * Table: checkbox
	 * --ml-table-checkbox-accent: var(--ml-color-primary)
	 */

	:host {
		display: block;
	}

	.ml-table {
		border: var(--ml-table-container-border-width, var(--ml-table-border-width, var(--ml-border))) solid var(--ml-table-container-border-color, var(--ml-table-border-color, var(--ml-color-border)));
		border-radius: var(--ml-table-container-radius, var(--ml-table-radius, var(--ml-radius-lg)));
		background-color: var(--ml-table-bg, var(--ml-color-surface));
		overflow: hidden;
		font-family: var(--ml-table-font, var(--ml-font-sans));
	}

	/* ── Header ── */
	.ml-table__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-table-divider-width, var(--ml-table-border-width, var(--ml-border))) solid var(--ml-table-divider-color, var(--ml-table-border-color, var(--ml-color-border)));
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
		color: var(--ml-table-title-color, var(--ml-color-text));
		line-height: var(--ml-leading-tight);
	}

	.ml-table__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-table-description-color, var(--ml-color-text-muted));
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
		background-color: var(--ml-table-header-bg, var(--ml-color-surface-sunken));
	}

	.ml-table--sticky-header thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	thead tr {
		border-bottom: var(--ml-table-divider-width, var(--ml-table-border-width, var(--ml-border))) solid var(--ml-table-divider-color, var(--ml-table-border-color, var(--ml-color-border)));
	}

	.ml-table__th {
		padding: var(--ml-table-header-padding-y, var(--ml-space-3)) var(--ml-table-header-padding-x, var(--ml-space-6));
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-table-header-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
		white-space: nowrap;
		user-select: none;
	}

	.ml-table--sm .ml-table__th {
		padding: var(--ml-table-header-padding-y-sm, var(--ml-space-2)) var(--ml-table-header-padding-x-sm, var(--ml-space-4));
	}

	.ml-table__th--center { text-align: center; }
	.ml-table__th--right { text-align: right; }

	.ml-table__th--sortable {
		cursor: pointer;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__th--sortable:hover {
		color: var(--ml-table-header-sorted-color, var(--ml-color-text));
	}

	.ml-table__th--sorted {
		color: var(--ml-table-header-sorted-color, var(--ml-color-text));
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
		color: var(--ml-table-sort-color, var(--ml-color-text-muted));
	}

	.ml-table__th--sorted .ml-table__sort-icon {
		color: var(--ml-table-sort-active-color, var(--ml-color-primary));
	}

	/* ── Body rows ── */
	/* Divider rendered as an inset box-shadow (not border-bottom) so it never
	   participates in layout — hover/selected/striped state changes can't
	   collapse it and shift rows below by 1px. */
	.ml-table__row {
		box-shadow: inset 0 calc(-1 * var(--ml-table-divider-width, var(--ml-table-border-width, var(--ml-border)))) 0 var(--ml-table-divider-color, var(--ml-table-border-color, var(--ml-color-border)));
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__row:last-child {
		box-shadow: none;
	}

	.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-hover-bg, var(--ml-color-surface-sunken));
		border-color: var(--ml-table-row-hover-border-color, transparent);
		border-width: var(--ml-table-row-hover-border-width, 0);
		border-style: solid;
		border-left-width: var(--ml-table-row-hover-border-left-width, 0);
		border-left-color: var(--ml-table-row-hover-border-left-color, transparent);
	}

	.ml-table--row-clickable .ml-table__row {
		cursor: pointer;
	}

	.ml-table__row--selected {
		background-color: var(--ml-table-row-selected-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04)));
	}

	.ml-table--hoverable .ml-table__row--selected:hover {
		background-color: var(--ml-table-row-selected-hover-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.06)));
	}

	/* Striped */
	.ml-table--striped .ml-table__row:nth-child(even) {
		background-color: var(--ml-table-row-striped-bg, var(--ml-color-surface-sunken));
	}

	.ml-table--striped.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-striped-hover-bg, var(--ml-color-surface-raised));
	}

	/* ── Body cells ── */
	.ml-table__td {
		padding: var(--ml-table-cell-padding-y, var(--ml-space-4)) var(--ml-table-cell-padding-x, var(--ml-space-6));
		font-size: var(--ml-text-sm);
		color: var(--ml-table-cell-color, var(--ml-color-text));
		vertical-align: middle;
	}

	.ml-table--sm .ml-table__td {
		padding: var(--ml-table-cell-padding-y-sm, var(--ml-space-2-5)) var(--ml-table-cell-padding-x-sm, var(--ml-space-4));
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
		accent-color: var(--ml-table-checkbox-accent, var(--ml-color-primary));
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
		border-top: var(--ml-table-divider-width, var(--ml-table-border-width, var(--ml-border))) solid var(--ml-table-divider-color, var(--ml-table-border-color, var(--ml-color-border)));
	}

	.ml-table--sm .ml-table__footer--visible {
		padding: var(--ml-space-2) var(--ml-space-4);
	}
`;
var TableComponent = class TableComponent$1 {
	constructor() {
		this.clickableRows = false;
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
		this.manualSort = false;
		this.columns = [];
		this.rows = [];
		this.sortKey = "";
		this.sortDirection = "asc";
		this.selectedIndices = [];
		this.startIndex = 0;
		this.endIndex = 50;
		this._core = new TableCore(this, {
			viewportSelector: ".ml-table__wrapper",
			displayRows: () => this.sortedRows
		});
		this._sortedRowsMemo = memoOn();
		this.isRowSelected = (index) => {
			return this._core.isRowSelected(index);
		};
		this.handleHeaderKeyDown = (column, event) => {
			if (!column.sortable || event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			this.handleSort(column);
		};
		this.handleSort = (column) => {
			this._core.handleSortClick(column);
		};
		this.handleSelectAll = () => {
			this._core.toggleSelectAll();
		};
		this.handleSelectRow = (index, event) => {
			this._core.toggleSelectRow(index, event);
		};
		this.handleRowClick = (row, index) => {
			this._core.emitRowClick(row, index);
		};
	}
	get rowHeight() {
		return this.size === "sm" ? 36 : 44;
	}
	onPropertyChange(name, _oldVal, _newVal) {
		if (name === "columns") this._core.invalidateScroller();
		if (name === "rows") this._core.handleRowsChange();
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "footer") this.hasFooter = hasContent;
			else if (name === "header-actions") this.hasHeaderActions = hasContent;
		});
		this._core.attachScroller();
	}
	onRender() {
		this._core.syncRenderWindow();
	}
	onDestroy() {
		this._core.detach();
	}
	get sortedRows() {
		return this._sortedRowsMemo([
			this.rows,
			this.manualSort,
			this.sortKey,
			this.sortDirection
		], () => this.manualSort ? this.rows : this._core.sortRows(this.rows));
	}
	get visibleRows() {
		return this._core.visibleRows;
	}
	get topSpacerHeight() {
		return this._core.topSpacerHeight;
	}
	get bottomSpacerHeight() {
		return this._core.bottomSpacerHeight;
	}
	get colCount() {
		return this.columns.length + (this.selectable ? 1 : 0);
	}
	get allSelected() {
		return this._core.allSelected;
	}
	get someSelected() {
		return this._core.someSelected;
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
		"virtual",
		"manual-sort",
		"clickable-rows"
	]
})], TableComponent);
function pinStyle(c, col) {
	if (col.pinned === "left") return `left: ${c.getPinnedLeftOffset(col.key)}px`;
	if (col.pinned === "right") return `right: ${c.getPinnedRightOffset(col.key)}px`;
	return "";
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
		"ml-data-grid__th--pinned-left-edge": col.key === c.lastLeftPinnedKey,
		"ml-data-grid__th--pinned-right-edge": col.key === c.firstRightPinnedKey,
		"ml-data-grid__th--drag-over": c.dragOverKey === col.key,
		"ml-data-grid__th--dragging": c.draggingKey === col.key,
		"ml-data-grid__th--resizing": c.resizingKey === col.key
	})}
								style=${pinStyle(c, col)}
								draggable=${col.reorderable !== false ? "true" : "false"}
								@dragstart=${(e) => c.handleDragStart(col.key, e)}
								@dragover=${(e) => c.handleDragOver(col.key, e)}
								@dragend=${c.handleDragEnd}
								@drop=${() => c.handleDrop(col.key)}
								@click=${() => c.handleSort(col)}
								@keydown=${(e) => c.handleHeaderKeyDown(col, e)}
								tabindex=${col.sortable || col.reorderable !== false ? "0" : ""}
								role="columnheader"
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
										@click=${(e) => e.stopPropagation()}
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
		"ml-data-grid__filter-cell--pinned-left": col.pinned === "left",
		"ml-data-grid__filter-cell--pinned-right": col.pinned === "right"
	})}
									style=${pinStyle(c, col)}
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
		"ml-data-grid__td--pinned-right": col.pinned === "right",
		"ml-data-grid__td--pinned-left-edge": col.key === c.lastLeftPinnedKey,
		"ml-data-grid__td--pinned-right-edge": col.key === c.firstRightPinnedKey
	})}
										style=${pinStyle(c, col)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Data Grid: surface
	 * --ml-data-grid-bg: var(--ml-color-surface)
	 * --ml-data-grid-border-width: var(--ml-border)
	 * --ml-data-grid-border-color: var(--ml-color-border)
	 * --ml-data-grid-radius: var(--ml-radius-lg)
	 *
	 * Data Grid: header
	 * --ml-data-grid-header-bg: var(--ml-color-surface-sunken)
	 * --ml-data-grid-header-color: var(--ml-color-text-muted)
	 * --ml-data-grid-header-sorted-color: var(--ml-color-text)
	 *
	 * Data Grid: title
	 * --ml-data-grid-title-color: var(--ml-color-text)
	 * --ml-data-grid-description-color: var(--ml-color-text-muted)
	 *
	 * Data Grid: rows
	 * --ml-data-grid-row-hover-bg: var(--ml-color-surface-sunken)
	 * --ml-data-grid-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04))
	 * --ml-data-grid-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07))
	 * --ml-data-grid-row-striped-bg: var(--ml-color-surface-sunken)
	 * --ml-data-grid-row-striped-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Data Grid: cells
	 * --ml-data-grid-cell-color: var(--ml-color-text)
	 *
	 * Data Grid: drag-over
	 * --ml-data-grid-drag-over-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.08))
	 * --ml-data-grid-drag-over-color: var(--ml-color-primary)
	 *
	 * Data Grid: sort icon
	 * --ml-data-grid-sort-color: var(--ml-color-text-muted)
	 * --ml-data-grid-sort-active-color: var(--ml-color-primary)
	 *
	 * Data Grid: resize handle
	 * --ml-data-grid-resize-active-color: var(--ml-color-primary)
	 *
	 * Data Grid: checkbox
	 * --ml-data-grid-checkbox-accent: var(--ml-color-primary)
	 *
	 * Data Grid: filter input
	 * --ml-data-grid-filter-bg: var(--ml-color-surface-sunken)
	 * --ml-data-grid-filter-border-color: var(--ml-color-border)
	 * --ml-data-grid-filter-focus-color: var(--ml-color-primary)
	 * --ml-data-grid-filter-focus-ring: 0 0 0 2px var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.12))
	 *
	 * Data Grid: scrollbar
	 * --ml-data-grid-scrollbar-thumb: var(--ml-color-border)
	 * --ml-data-grid-scrollbar-thumb-hover: var(--ml-color-text-muted)
	 *
	 * Data Grid: footer
	 * --ml-data-grid-footer-bg: var(--ml-color-surface)
	 * --ml-data-grid-footer-color: var(--ml-color-text-muted)
	 * --ml-data-grid-page-btn-border: var(--ml-color-border)
	 * --ml-data-grid-page-btn-color: var(--ml-color-text-muted)
	 * --ml-data-grid-page-btn-hover-bg: var(--ml-color-surface-sunken)
	 * --ml-data-grid-page-btn-hover-color: var(--ml-color-text)
	 * --ml-data-grid-page-btn-hover-border: var(--ml-color-border-strong)
	 */

	:host {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 0;
		font-family: var(--ml-font-sans);
	}

	/* ── Root container ── */
	.ml-data-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
		border-radius: var(--ml-data-grid-radius, var(--ml-radius-lg));
		background-color: var(--ml-data-grid-bg, var(--ml-color-surface));
		overflow: hidden;
	}

	/* ── Toolbar ── */
	.ml-data-grid__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
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
		color: var(--ml-data-grid-title-color, var(--ml-color-text));
		line-height: var(--ml-leading-tight);
	}

	.ml-data-grid__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-description-color, var(--ml-color-text-muted));
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
		background: var(--ml-data-grid-scrollbar-thumb, var(--ml-color-border));
		border-radius: 3px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb:hover {
		background: var(--ml-data-grid-scrollbar-thumb-hover, var(--ml-color-text-muted));
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
		background: var(--ml-data-grid-header-bg, var(--ml-color-surface-sunken));
		border-bottom: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
	}

	/* ── Filter row — sticky below header ── */
	.ml-data-grid__filter-row {
		display: grid;
		position: sticky;
		top: var(--ml-grid-header-h, 40px);
		z-index: 2;
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
		border-bottom: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
		padding: var(--ml-space-2) 0;
	}

	/* ── Header cells ── */
	.ml-data-grid__th {
		position: relative;
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-data-grid-header-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		user-select: none;
		background: var(--ml-data-grid-header-bg, var(--ml-color-surface-sunken));
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
		color: var(--ml-data-grid-header-sorted-color, var(--ml-color-text));
	}

	.ml-data-grid__th--sorted {
		color: var(--ml-data-grid-header-sorted-color, var(--ml-color-text));
	}

	.ml-data-grid__th--drag-over {
		background: var(--ml-data-grid-drag-over-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.08)));
		color: var(--ml-data-grid-drag-over-color, var(--ml-color-primary));
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
		color: var(--ml-data-grid-sort-color, var(--ml-color-text-muted));
	}

	.ml-data-grid__th--sorted .ml-data-grid__sort-icon {
		color: var(--ml-data-grid-sort-active-color, var(--ml-color-primary));
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
		background: var(--ml-data-grid-resize-active-color, var(--ml-color-primary));
	}

	/* ── Filter cells ── */
	.ml-data-grid__filter-cell {
		display: flex;
		align-items: center;
		padding: 0 var(--ml-space-2);
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
		position: relative;
	}

	.ml-data-grid__filter-cell--pinned-left,
	.ml-data-grid__filter-cell--pinned-right {
		position: sticky;
		z-index: 3;
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
	}

	.ml-data-grid__filter-input {
		width: 100%;
		padding: var(--ml-space-1-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-family: var(--ml-font-sans);
		color: var(--ml-data-grid-cell-color, var(--ml-color-text));
		background: var(--ml-data-grid-filter-bg, var(--ml-color-surface-sunken));
		border: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-filter-border-color, var(--ml-color-border));
		border-radius: var(--ml-radius-sm);
		outline: none;
		transition: border-color var(--ml-duration-150);
	}

	.ml-data-grid__filter-input::placeholder {
		color: var(--ml-data-grid-header-color, var(--ml-color-text-muted));
	}

	.ml-data-grid__filter-input:focus {
		border-color: var(--ml-data-grid-filter-focus-color, var(--ml-color-primary));
		box-shadow: var(--ml-data-grid-filter-focus-ring, 0 0 0 2px var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.12)));
	}

	/* ── Virtual scroll spacers ── */
	.ml-data-grid__top-spacer,
	.ml-data-grid__bottom-spacer {
		display: block;
	}

	/* ── Data rows ── */
	.ml-data-grid__row {
		display: grid;
		border-bottom: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
		cursor: default;
	}

	.ml-data-grid__row:last-child {
		border-bottom: none;
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover {
		background-color: var(--ml-data-grid-row-hover-bg, var(--ml-color-surface-sunken));
	}

	.ml-data-grid__row--selected {
		background-color: var(--ml-data-grid-row-selected-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04)));
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover {
		background-color: var(--ml-data-grid-row-selected-hover-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07)));
	}

	.ml-data-grid--striped .ml-data-grid__row--even {
		background-color: var(--ml-data-grid-row-striped-bg, var(--ml-color-surface-sunken));
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover {
		background-color: var(--ml-data-grid-row-striped-hover-bg, var(--ml-color-surface-raised));
	}

	/* ── Data cells ── */
	.ml-data-grid__td {
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-cell-color, var(--ml-color-text));
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
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
	}

	.ml-data-grid__header-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-header-bg, var(--ml-color-surface-sunken));
	}

	.ml-data-grid__filter-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
	}

	.ml-data-grid--sm .ml-data-grid__check-cell {
		padding: var(--ml-space-2);
	}

	.ml-data-grid__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-data-grid-checkbox-accent, var(--ml-color-primary));
		cursor: pointer;
		margin: 0;
		flex-shrink: 0;
	}

	/* ── Pinned columns ── */
	.ml-data-grid__th--pinned-left,
	.ml-data-grid__td--pinned-left {
		position: sticky;
		z-index: 1;
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-left {
		z-index: 3;
		background: var(--ml-data-grid-header-bg, var(--ml-color-surface-sunken));
	}

	/* Pinned left shadow — renders only on the rightmost (boundary) left-pinned cell */
	.ml-data-grid__th--pinned-left-edge::after,
	.ml-data-grid__td--pinned-left-edge::after {
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
		z-index: 1;
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-right {
		z-index: 3;
		background: var(--ml-data-grid-header-bg, var(--ml-color-surface-sunken));
	}

	/* Pinned right shadow — renders only on the leftmost (boundary) right-pinned cell */
	.ml-data-grid__th--pinned-right-edge::before,
	.ml-data-grid__td--pinned-right-edge::before {
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
		background: var(--ml-data-grid-row-striped-bg, var(--ml-color-surface-sunken));
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-hover-bg, var(--ml-color-surface-sunken));
	}

	.ml-data-grid__row--selected .ml-data-grid__td--pinned-left,
	.ml-data-grid__row--selected .ml-data-grid__td--pinned-right,
	.ml-data-grid__row--selected .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04)));
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-hover-bg, var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07)));
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-striped-hover-bg, var(--ml-color-surface-raised));
	}

	/* ── Footer / Pagination ── */
	.ml-data-grid__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-border-color, var(--ml-color-border));
		background: var(--ml-data-grid-footer-bg, var(--ml-color-surface));
		flex-shrink: 0;
	}

	.ml-data-grid--sm .ml-data-grid__footer {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-data-grid__footer-count {
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-footer-color, var(--ml-color-text-muted));
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
		color: var(--ml-data-grid-footer-color, var(--ml-color-text-muted));
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
		border: var(--ml-data-grid-border-width, var(--ml-border)) solid var(--ml-data-grid-page-btn-border, var(--ml-color-border));
		border-radius: var(--ml-radius-md);
		background: var(--ml-data-grid-bg, var(--ml-color-surface));
		color: var(--ml-data-grid-page-btn-color, var(--ml-color-text-muted));
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
		background: var(--ml-data-grid-page-btn-hover-bg, var(--ml-color-surface-sunken));
		color: var(--ml-data-grid-page-btn-hover-color, var(--ml-color-text));
		border-color: var(--ml-data-grid-page-btn-hover-border, var(--ml-color-border-strong));
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
		this._core = new TableCore(this, {
			viewportSelector: ".ml-data-grid__viewport",
			displayRows: () => this.processedRows
		});
		this._resizeStartX = 0;
		this._resizeStartWidth = 0;
		this._headerHeight = 0;
		this._filteredRowsMemo = memoOn();
		this._sortedRowsMemo = memoOn();
		this._pagedRowsMemo = memoOn();
		this.isRowSelected = (index) => this._core.isRowSelected(index);
		this.handleSort = (col) => {
			this._core.handleSortClick(col, () => {
				this.currentPage = 1;
			});
		};
		this.handleFilterInput = (key, e) => {
			const val = e.target.value;
			this.filters = {
				...this.filters,
				[key]: val
			};
			this.currentPage = 1;
			const hadSelection = this._core.clearSelection();
			this._core.invalidateScroller();
			this.elementRef.dispatchEvent(new CustomEvent("ml:filter", {
				bubbles: true,
				composed: true,
				detail: { filters: this.filters }
			}));
			if (hadSelection) this._core.emitSelect();
		};
		this.handleSelectAll = () => {
			this._core.toggleSelectAll();
		};
		this.handleSelectRow = (index, e) => {
			this._core.toggleSelectRow(index, e);
		};
		this.handleRowClick = (row, index) => {
			this._core.emitRowClick(row, index);
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
			const width = Math.max(minW, this._resizeStartWidth + delta);
			this._pendingResizeWidth = width;
			this.elementRef.style.setProperty(`--ml-grid-col-${key}`, `${width}px`);
		};
		this._pendingResizeWidth = null;
		this.handleResizeEnd = () => {
			if (!this.resizingKey) return;
			if (this._pendingResizeWidth !== null) {
				this.colWidths = {
					...this.colWidths,
					[this.resizingKey]: this._pendingResizeWidth
				};
				this.elementRef.style.removeProperty(`--ml-grid-col-${this.resizingKey}`);
				this._pendingResizeWidth = null;
			}
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
		this.handleHeaderKeyDown = (col, event) => {
			if ((event.ctrlKey || event.metaKey) && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
				if (col.reorderable === false) return;
				event.preventDefault();
				this.moveColumn(col.key, event.key === "ArrowLeft" ? -1 : 1);
				return;
			}
			if (col.sortable && (event.key === "Enter" || event.key === " ")) {
				event.preventDefault();
				this.handleSort(col);
			}
		};
		this.moveColumn = (key, delta) => {
			const order = [...this.colOrder.length ? this.colOrder : this.columns.map((col) => col.key)];
			const from = order.indexOf(key);
			const to = from + delta;
			if (from === -1 || to < 0 || to >= order.length) return;
			order.splice(from, 1);
			order.splice(to, 0, key);
			this.colOrder = order;
			this.elementRef.dispatchEvent(new CustomEvent("ml:column-reorder", {
				bubbles: true,
				composed: true,
				detail: { order: this.colOrder }
			}));
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
			const hadSelection = this._core.clearSelection();
			this._core.scrollViewportToTop();
			this._core.invalidateScroller();
			this.elementRef.dispatchEvent(new CustomEvent("ml:page-change", {
				bubbles: true,
				composed: true,
				detail: {
					page: this.currentPage,
					pageSize: this.pageSize
				}
			}));
			if (hadSelection) this._core.emitSelect();
		};
	}
	get rowHeight() {
		return this.size === "sm" ? 36 : 44;
	}
	onPropertyChange(name, _oldVal, newVal) {
		if (name === "columns" && Array.isArray(newVal)) this._syncColumnState(newVal);
		if (name === "rows") this._core.handleRowsChange(() => {
			if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
		});
	}
	onCreate() {
		this._syncColumnState(this.columns);
		this._core.attachScroller();
	}
	onRender() {
		this.syncHeaderHeight();
		this._core.syncRenderWindow();
	}
	syncHeaderHeight() {
		if (this.resizingKey) return;
		const headerRow = this.elementRef.shadowRoot?.querySelector(".ml-data-grid__header-row");
		if (!headerRow) return;
		const height = headerRow.getBoundingClientRect().height;
		if (height > 0 && height !== this._headerHeight) {
			this._headerHeight = height;
			this.elementRef.style.setProperty("--ml-grid-header-h", `${height}px`);
		}
	}
	onDestroy() {
		this._core.detach();
	}
	_syncColumnState(cols) {
		this.colOrder = cols.map((c) => c.key);
		const newWidths = {};
		for (const col of cols) newWidths[col.key] = this.colWidths[col.key] ?? col.width ?? 150;
		this.colWidths = newWidths;
	}
	get _filterKey() {
		return JSON.stringify(this.filters);
	}
	get filteredRows() {
		return this._filteredRowsMemo([
			this.rows,
			this.serverSide,
			this._filterKey
		], () => {
			if (this.serverSide) return this.rows;
			const entries = Object.entries(this.filters).filter(([, v]) => v !== "");
			if (!entries.length) return this.rows;
			return this.rows.filter((row) => entries.every(([key, val]) => String(row[key] ?? "").toLowerCase().includes(val.toLowerCase())));
		});
	}
	get sortedRows() {
		const filtered = this.filteredRows;
		return this._sortedRowsMemo([
			filtered,
			this.serverSide,
			this.sortKey,
			this.sortDirection
		], () => this.serverSide ? filtered : this._core.sortRows(filtered));
	}
	get pagedRows() {
		if (this.serverSide) return this.rows;
		const sorted = this.sortedRows;
		return this._pagedRowsMemo([
			sorted,
			this.currentPage,
			this.pageSize
		], () => {
			const start = (this.currentPage - 1) * this.pageSize;
			return sorted.slice(start, start + this.pageSize);
		});
	}
	get processedRows() {
		return this.pagedRows;
	}
	get visibleRows() {
		return this._core.visibleRows;
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
		const cols = this.orderedColumns.map((col) => `var(--ml-grid-col-${col.key}, ${this.columnWidths[col.key] ?? 150}px)`).join(" ");
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
	getPinnedRightOffset(key) {
		let offset$1 = 0;
		for (let i = this.orderedColumns.length - 1; i >= 0; i--) {
			const col = this.orderedColumns[i];
			if (col.key === key) return offset$1;
			if (col.pinned === "right") offset$1 += this.columnWidths[col.key] ?? 150;
		}
		return 0;
	}
	get lastLeftPinnedKey() {
		let key = null;
		for (const col of this.orderedColumns) if (col.pinned === "left") key = col.key;
		return key;
	}
	get firstRightPinnedKey() {
		for (const col of this.orderedColumns) if (col.pinned === "right") return col.key;
		return null;
	}
	get topSpacerHeight() {
		return this._core.topSpacerHeight;
	}
	get bottomSpacerHeight() {
		return this._core.bottomSpacerHeight;
	}
	get allSelected() {
		return this._core.allSelected;
	}
	get someSelected() {
		return this._core.someSelected;
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
var activeLocale;
function setCalendarLocale(locale) {
	activeLocale = locale || void 0;
}
function resolvedLocale() {
	if (activeLocale) return activeLocale;
	if (typeof document !== "undefined") {
		const lang = document.documentElement.lang?.trim();
		if (lang) return lang;
	}
}
var nameCache = /* @__PURE__ */ new Map();
function names(kind, width) {
	const key = `${resolvedLocale() ?? "default"}:${kind}:${width}`;
	const cached$1 = nameCache.get(key);
	if (cached$1) return cached$1;
	const formatter = new Intl.DateTimeFormat(resolvedLocale(), kind === "month" ? { month: width } : { weekday: width });
	const values = kind === "month" ? Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2021, i, 1))) : Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2021, 0, 3 + i)));
	nameCache.set(key, values);
	return values;
}
function monthNames() {
	return names("month", "long");
}
function monthAbbrevs() {
	return names("month", "short");
}
function dayNames() {
	return names("weekday", "long");
}
function dayAbbrevs() {
	return names("weekday", "short");
}
function toIsoDate(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function parseDate(iso) {
	const [y, m, d] = iso.split("T")[0].split("-").map(Number);
	return new Date(y, m - 1, d);
}
function parseEventDate(iso) {
	return iso.includes("T") ? new Date(iso) : parseDate(iso);
}
function toLocalIsoDate(date) {
	return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
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
	const date = parseEventDate(iso);
	const h = date.getHours();
	const m = date.getMinutes();
	const ampm = h >= 12 ? "PM" : "AM";
	const hour = h % 12 || 12;
	return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
function formatMonthYear(date) {
	return `${monthNames()[date.getMonth()]} ${date.getFullYear()}`;
}
function formatDateRange(start, end) {
	const sMonth = monthAbbrevs()[start.getMonth()];
	const eMonth = monthAbbrevs()[end.getMonth()];
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
			short: dayAbbrevs()[idx],
			full: dayNames()[idx]
		};
	});
}
function getEventsForDate(events, iso) {
	return events.filter((e) => toLocalIsoDate(parseEventDate(e.start)) === iso);
}
function getMonthAbbrev(date) {
	return monthAbbrevs()[date.getMonth()];
}
function getDayName(date) {
	return dayNames()[date.getDay()];
}
function minutesToGridRow(minutes) {
	return Math.floor(minutes / 30) + 1;
}
function getEventSpan(event) {
	const startDate = parseEventDate(event.start);
	const endDate = parseEventDate(event.end);
	const start = startDate.getHours() * 60 + startDate.getMinutes();
	let end = endDate.getHours() * 60 + endDate.getMinutes();
	if (!isSameDay(startDate, endDate)) end = 1440;
	return {
		start,
		end: Math.max(end, start + 1)
	};
}
function layoutOverlappingEvents(events) {
	if (events.length === 0) return [];
	const spans = /* @__PURE__ */ new Map();
	for (const event of events) spans.set(event.id, getEventSpan(event));
	const spanOf = (event) => spans.get(event.id);
	const sorted = [...events].sort((a, b) => {
		const aSpan = spanOf(a);
		const bSpan = spanOf(b);
		if (aSpan.start !== bSpan.start) return aSpan.start - bSpan.start;
		return bSpan.end - bSpan.start - (aSpan.end - aSpan.start);
	});
	const columns = [];
	const eventColumns = /* @__PURE__ */ new Map();
	for (const event of sorted) {
		const { start, end } = spanOf(event);
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
		let groupEnd = spanOf(event).end;
		let maxCol = eventColumns.get(event.id) + 1;
		for (const other of sorted) {
			if (visited.has(other.id)) continue;
			const otherSpan = spanOf(other);
			if (otherSpan.start < groupEnd) {
				group.push(other);
				visited.add(other.id);
				groupEnd = Math.max(groupEnd, otherSpan.end);
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
		const { start, end } = spanOf(event);
		const col = eventColumns.get(event.id);
		const total = group.totalColumns;
		const gridRowStart = minutesToGridRow(start);
		const gridRowEnd = Math.max(minutesToGridRow(end), gridRowStart + 1);
		result.push({
			event,
			gridRowStart,
			gridRowEnd,
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
			dayLabel: dayAbbrevs()[d.getDay()],
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
		dayLabel: dayAbbrevs()[date.getDay()],
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
		if (events.some((e) => toLocalIsoDate(parseEventDate(e.start)) === iso)) dots.add(iso);
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
			role="button"
			tabindex="0"
			aria-label=${event.title}
			@click=${(e) => {
		e.stopPropagation();
		c.handleEventClick(event);
	}}
			@keydown=${(e) => {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
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
							role="gridcell"
							tabindex=${day.iso === c.dayTabStop ? "0" : "-1"}
							data-key=${day.iso}
							aria-label=${day.iso}
							@click=${() => c.handleDateClick(day.iso)}
							@keydown=${(e) => c.handleDayKeyDown(day.iso, e)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Calendar View: surface
	 * --ml-calendar-view-bg: var(--ml-color-surface)
	 * --ml-calendar-view-border-width: var(--ml-border)
	 * --ml-calendar-view-border-color: var(--ml-color-border)
	 * --ml-calendar-view-radius: var(--ml-radius-lg)
	 *
	 * Calendar View: header
	 * --ml-calendar-view-header-padding: var(--ml-space-4) var(--ml-space-5)
	 * --ml-calendar-view-title-size: var(--ml-text-lg)
	 * --ml-calendar-view-title-weight: var(--ml-font-semibold)
	 * --ml-calendar-view-title-color: var(--ml-color-text)
	 * --ml-calendar-view-subtitle-color: var(--ml-color-text-muted)
	 *
	 * Calendar View: today badge
	 * --ml-calendar-view-today-badge-bg: var(--ml-color-primary)
	 * --ml-calendar-view-today-badge-color: var(--ml-color-text-inverse)
	 *
	 * Calendar View: navigation buttons
	 * --ml-calendar-view-nav-color: var(--ml-color-text-muted)
	 * --ml-calendar-view-nav-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-view-nav-hover-color: var(--ml-color-text)
	 *
	 * Calendar View: day cells
	 * --ml-calendar-view-cell-min-height: 120px
	 * --ml-calendar-view-cell-hover-bg: var(--ml-color-surface-sunken)
	 * --ml-calendar-view-cell-other-bg: var(--ml-color-surface-sunken)
	 * --ml-calendar-view-cell-other-color: var(--ml-color-text-disabled)
	 *
	 * Calendar View: today indicator
	 * --ml-calendar-view-today-bg: var(--ml-color-primary)
	 * --ml-calendar-view-today-color: var(--ml-color-text-inverse)
	 *
	 * Calendar View: weekday header
	 * --ml-calendar-view-weekday-color: var(--ml-color-text-muted)
	 * --ml-calendar-view-weekday-today-color: var(--ml-color-primary)
	 *
	 * Calendar View: event pill
	 * --ml-calendar-view-event-radius: var(--ml-radius-sm)
	 * --ml-calendar-view-event-border-width: 3px
	 *
	 * Calendar View: week badge
	 * --ml-calendar-view-week-badge-color: var(--ml-color-primary)
	 * --ml-calendar-view-week-badge-bg: var(--ml-purple-50)
	 *
	 * Calendar View: add button
	 * --ml-calendar-view-add-bg: var(--ml-color-primary)
	 * --ml-calendar-view-add-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-view-add-color: var(--ml-color-text-inverse)
	 *
	 * Calendar View: view menu
	 * --ml-calendar-view-menu-bg: var(--ml-color-surface)
	 * --ml-calendar-view-menu-shadow: var(--ml-shadow-lg)
	 * --ml-calendar-view-menu-active-color: var(--ml-color-primary)
	 *
	 * Calendar View: sidebar
	 * --ml-calendar-view-sidebar-event-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Calendar View: mini calendar
	 * --ml-calendar-view-mini-selected-bg: var(--ml-color-primary)
	 * --ml-calendar-view-mini-selected-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-view-mini-selected-color: var(--ml-color-text-inverse)
	 * --ml-calendar-view-mini-dot-color: var(--ml-color-primary)
	 *
	 * Calendar View: focus ring
	 * --ml-calendar-view-focus-ring: var(--ml-shadow-focus-ring)
	 */

	:host {
		display: block;
		font-family: var(--ml-font-sans);
	}

	.ml-cv {
		border: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		border-radius: var(--ml-calendar-view-radius, var(--ml-radius-lg));
		background-color: var(--ml-calendar-view-bg, var(--ml-color-surface));
		overflow: hidden;
	}

	/* ── Header ── */
	.ml-cv__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-calendar-view-header-padding, var(--ml-space-4) var(--ml-space-5));
		border-bottom: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
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
		border-radius: var(--ml-calendar-view-radius, var(--ml-radius-lg));
		background-color: var(--ml-calendar-view-today-badge-bg, var(--ml-color-primary));
		color: var(--ml-calendar-view-today-badge-color, var(--ml-color-text-inverse));
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
		font-size: var(--ml-calendar-view-title-size, var(--ml-text-lg));
		font-weight: var(--ml-calendar-view-title-weight, var(--ml-font-semibold));
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		margin: 0;
	}

	.ml-cv__week-badge {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-week-badge-color, var(--ml-color-primary));
		background-color: var(--ml-calendar-view-week-badge-bg, var(--ml-purple-50));
		padding: var(--ml-space-0-5) var(--ml-space-2);
		border-radius: var(--ml-radius-full);
	}

	.ml-cv__subtitle {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-subtitle-color, var(--ml-color-text-muted));
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
		border: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
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
		color: var(--ml-calendar-view-nav-color, var(--ml-color-text-muted));
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out), color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__nav-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-view-nav-hover-color, var(--ml-color-text));
	}

	.ml-cv__nav-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring, var(--ml-shadow-focus-ring));
		z-index: 1;
	}

	.ml-cv__nav-btn + .ml-cv__nav-btn {
		border-left: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__today-btn {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__today-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-cv__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring, var(--ml-shadow-focus-ring));
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
		border: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-trigger:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-cv__view-trigger:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring, var(--ml-shadow-focus-ring));
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
		background-color: var(--ml-calendar-view-menu-bg, var(--ml-color-surface));
		border: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		border-radius: var(--ml-radius-md);
		box-shadow: var(--ml-calendar-view-menu-shadow, var(--ml-shadow-lg));
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
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-option:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-cv__view-option--active {
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-menu-active-color, var(--ml-color-primary));
	}

	.ml-cv__add-btn {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: none;
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-calendar-view-add-bg, var(--ml-color-primary));
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-add-color, var(--ml-color-text-inverse));
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__add-btn:hover {
		background-color: var(--ml-calendar-view-add-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-cv__add-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring, var(--ml-shadow-focus-ring));
	}

	/* ── Month View ── */
	.ml-cv__month {
		display: flex;
		flex-direction: column;
	}

	.ml-cv__weekday-header {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		border-bottom: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__weekday {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
		text-align: center;
	}

	.ml-cv__weekday--today {
		color: var(--ml-calendar-view-weekday-today-color, var(--ml-color-primary));
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.ml-cv__day-cell {
		position: relative;
		min-height: var(--ml-calendar-view-cell-min-height, 120px);
		border-right: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		border-bottom: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		padding: var(--ml-space-1);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__day-cell:nth-child(7n) {
		border-right: none;
	}

	.ml-cv__day-cell:hover {
		background-color: var(--ml-calendar-view-cell-hover-bg, var(--ml-color-surface-sunken));
	}

	.ml-cv__day-cell--other-month {
		background-color: var(--ml-calendar-view-cell-other-bg, var(--ml-color-surface-sunken));
	}

	.ml-cv__day-cell--other-month .ml-cv__day-number {
		color: var(--ml-calendar-view-cell-other-color, var(--ml-color-text-disabled));
	}

	.ml-cv__day-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		margin-bottom: var(--ml-space-0-5);
	}

	.ml-cv__day-number--today {
		background-color: var(--ml-calendar-view-today-bg, var(--ml-color-primary));
		color: var(--ml-calendar-view-today-color, var(--ml-color-text-inverse));
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
		border-radius: var(--ml-calendar-view-event-radius, var(--ml-radius-sm));
		border-left: var(--ml-calendar-view-event-border-width, 3px) solid;
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
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
		padding: 1px var(--ml-space-1-5);
		cursor: pointer;
		border: none;
		background: none;
		text-align: left;
		font-family: var(--ml-font-sans);
	}

	.ml-cv__more-link:hover {
		color: var(--ml-calendar-view-menu-active-color, var(--ml-color-primary));
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
		background-color: var(--ml-calendar-view-add-bg, var(--ml-color-primary));
		color: var(--ml-calendar-view-add-color, var(--ml-color-text-inverse));
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
		border-bottom: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__time-header--week {
		grid-template-columns: 60px repeat(7, 1fr);
	}

	.ml-cv__time-header--day {
		grid-template-columns: 60px 1fr;
	}

	.ml-cv__time-header-gutter {
		border-right: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__time-header-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--ml-space-2) 0;
		border-right: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__time-header-day:last-child {
		border-right: none;
	}

	.ml-cv__time-header-label {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
	}

	.ml-cv__time-header-number {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-label {
		color: var(--ml-calendar-view-weekday-today-color, var(--ml-color-primary));
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-number {
		background-color: var(--ml-calendar-view-today-bg, var(--ml-color-primary));
		color: var(--ml-calendar-view-today-color, var(--ml-color-text-inverse));
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
		border-right: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__time-column {
		border-right: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
	}

	.ml-cv__time-column--last {
		border-right: none;
	}

	.ml-cv__time-row {
		border-bottom: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
		pointer-events: none;
	}

	.ml-cv__time-label {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: var(--ml-space-1) var(--ml-space-2) 0;
		font-size: 0.625rem;
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
		white-space: nowrap;
		pointer-events: none;
	}

	/* Events placed via grid-row on the CSS grid */
	.ml-cv__time-event {
		box-sizing: border-box;
		min-width: 0;
		min-height: 0;
		border-radius: var(--ml-calendar-view-event-radius, var(--ml-radius-sm));
		border-left: var(--ml-calendar-view-event-border-width, 3px) solid;
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
		border-left: var(--ml-calendar-view-border-width, var(--ml-border)) solid var(--ml-calendar-view-border-color, var(--ml-color-border));
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
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
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
		color: var(--ml-calendar-view-nav-color, var(--ml-color-text-muted));
		cursor: pointer;
	}

	.ml-cv__mini-cal-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-view-nav-hover-color, var(--ml-color-text));
	}

	.ml-cv__mini-cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: var(--ml-space-1);
	}

	.ml-cv__mini-cal-weekday {
		font-size: 0.625rem;
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
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
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		cursor: pointer;
		padding: 0;
		gap: 1px;
	}

	.ml-cv__mini-cal-day:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-cv__mini-cal-day--other {
		color: var(--ml-calendar-view-cell-other-color, var(--ml-color-text-disabled));
	}

	.ml-cv__mini-cal-day--today {
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected {
		background-color: var(--ml-calendar-view-mini-selected-bg, var(--ml-color-primary));
		color: var(--ml-calendar-view-mini-selected-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected:hover {
		background-color: var(--ml-calendar-view-mini-selected-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-cv__mini-cal-dot {
		width: 3px;
		height: 3px;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-calendar-view-mini-dot-color, var(--ml-color-primary));
	}

	.ml-cv__mini-cal-day--selected .ml-cv__mini-cal-dot {
		background-color: var(--ml-calendar-view-mini-selected-color, var(--ml-color-text-inverse));
	}

	/* Sidebar event list */
	.ml-cv__sidebar-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
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
		background-color: var(--ml-calendar-view-sidebar-event-hover-bg, var(--ml-color-surface-raised));
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
		color: var(--ml-calendar-view-title-color, var(--ml-color-text));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-cv__sidebar-event-time {
		font-size: var(--ml-text-xs);
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
	}

	.ml-cv__sidebar-empty {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-weekday-color, var(--ml-color-text-muted));
		text-align: center;
		padding: var(--ml-space-6) 0;
	}
`;
var CalendarViewComponent = class CalendarViewComponent$1 {
	constructor() {
		this.view = "month";
		this.date = "";
		this.locale = "";
		this.weekStartsOn = 0;
		this.maxVisibleEvents = 3;
		this.addButtonText = "Add event";
		this.hideNav = false;
		this.hideTodayButton = false;
		this.hideViewSelector = false;
		this.hideAddButton = false;
		this.events = [];
		this.isViewDropdownOpen = false;
		this.miniCalYear = 0;
		this.miniCalMonth = 0;
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
		this.rovingDay = "";
		this.handleDayKeyDown = (iso, event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				this.handleDateClick(iso);
				return;
			}
			const delta = {
				ArrowLeft: -1,
				ArrowRight: 1,
				ArrowUp: -7,
				ArrowDown: 7
			}[event.key];
			if (delta === void 0) return;
			const grid = this.monthGrid;
			const index = grid.findIndex((day) => day.iso === iso);
			const next = grid[index + delta];
			if (index === -1 || !next) return;
			event.preventDefault();
			this.rovingDay = next.iso;
			(this.elementRef.shadowRoot?.querySelector(`.ml-cv__day-cell[data-key="${next.iso}"]`))?.focus();
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
			if (this.miniCalMonth === 0) {
				this.miniCalMonth = 11;
				this.miniCalYear--;
			} else this.miniCalMonth--;
		};
		this.miniCalNextMonth = () => {
			if (this.miniCalMonth === 11) {
				this.miniCalMonth = 0;
				this.miniCalYear++;
			} else this.miniCalMonth++;
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
		setCalendarLocale(this.locale);
		if (!this.date) {
			const now = /* @__PURE__ */ new Date();
			this.date = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
		}
		const d = this._currentDate;
		this.miniCalYear = d.getFullYear();
		this.miniCalMonth = d.getMonth();
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
		setCalendarLocale(this.locale);
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
		return this._currentDate.toLocaleDateString(this.locale || void 0, {
			weekday: "long",
			month: "long",
			day: "numeric"
		});
	}
	get miniCalendarTitle() {
		return formatMonthYear(new Date(this.miniCalYear, this.miniCalMonth, 1));
	}
	get miniCalendarWeekdays() {
		return getWeekdayHeaders(this.weekStartsOn).map((h) => h.short.charAt(0));
	}
	get miniCalendarGrid() {
		return getMonthGrid(this.miniCalYear, this.miniCalMonth, this.weekStartsOn);
	}
	get miniCalendarDots() {
		return getMiniCalendarDots(this.miniCalYear, this.miniCalMonth, this.events);
	}
	get dayTabStop() {
		const grid = this.monthGrid;
		if (grid.length === 0) return "";
		if (this.rovingDay && grid.some((day) => day.iso === this.rovingDay)) return this.rovingDay;
		return (grid.find((day) => day.isToday) ?? grid.find((day) => day.isCurrentMonth) ?? grid[0]).iso;
	}
	setDate(d) {
		this.date = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
		this.miniCalYear = d.getFullYear();
		this.miniCalMonth = d.getMonth();
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
		"hide-add-button",
		"locale"
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
	const className = c.format === "regular" ? "ph" : `ph-${c.format}`;
	const codepoint = PHOSPHOR_ICON_MAP[c.icon] ?? "";
	if (c.icon && !codepoint) devWarn(`unknown-icon:${c.icon}`, `<ml-icon icon="${c.icon}"> is not a known Phosphor icon name, so nothing is rendered. Check the name against https://phosphoricons.com (kebab-case, e.g. "caret-double-left").`);
	return html`<i class="${className}" aria-hidden="true">${codepoint}</i>`;
};
const iconStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Size — default 24px (md)
	 * --ml-icon-size: 24px
	 *
	 * --ml-icon-color: currentColor
	 */

	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		color: var(--ml-icon-color, currentColor);
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
		font-size: var(--ml-icon-size, 24px);
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
				${hasTabs ? repeat(c.tabs, (tab) => tab.value, (tab) => renderTabButton(c, tab)) : html`<slot name="tab" @slotchange=${c.handleTabSlotChange}></slot>`}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tab list
	 * --ml-tabs-list-gap: var(--ml-space-1)
	 * --ml-tabs-list-border-width: var(--ml-border)
	 * --ml-tabs-list-border-color: var(--ml-color-border)
	 *
	 * Tab button base
	 * --ml-tabs-tab-gap: var(--ml-space-2)
	 * --ml-tabs-tab-padding-y: var(--ml-space-2)
	 * --ml-tabs-tab-padding-x: var(--ml-space-4)
	 * --ml-tabs-tab-font-family: var(--ml-font-sans)
	 * --ml-tabs-tab-font-weight: var(--ml-font-medium)
	 * --ml-tabs-tab-color: var(--ml-color-text-secondary)
	 * --ml-tabs-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Tab hover
	 * --ml-tabs-tab-hover-color: var(--ml-color-text)
	 *
	 * Tab focus
	 * --ml-tabs-tab-focus-color: var(--ml-color-primary)
	 *
	 * Tab active
	 * --ml-tabs-tab-active-color: var(--ml-color-primary)
	 *
	 * Tab disabled
	 * --ml-tabs-tab-disabled-color: var(--ml-color-text-muted)
	 * --ml-tabs-tab-disabled-opacity: 0.6
	 *
	 * Label
	 * --ml-tabs-tab-label-line-height: var(--ml-leading-tight)
	 *
	 * Panels
	 * --ml-tabs-panels-padding-top: var(--ml-space-4)
	 *
	 * Vertical border
	 * --ml-tabs-vertical-border-padding: var(--ml-space-2)
	 * --ml-tabs-vertical-border-margin: var(--ml-space-4)
	 *
	 * Line variant - indicator
	 * --ml-tabs-line-indicator-height: 2px
	 * --ml-tabs-line-indicator-color: var(--ml-color-primary)
	 *
	 * Enclosed variant
	 * --ml-tabs-enclosed-tab-radius: var(--ml-radius)
	 * --ml-tabs-enclosed-active-bg: var(--ml-color-surface)
	 * --ml-tabs-enclosed-active-border-color: var(--ml-color-border)
	 * --ml-tabs-enclosed-active-color: var(--ml-color-text)
	 * --ml-tabs-enclosed-hover-bg: var(--ml-color-surface-secondary)
	 *
	 * Pills variant
	 * --ml-tabs-pills-tab-radius: var(--ml-radius)
	 * --ml-tabs-pills-active-bg: var(--ml-color-primary-subtle)
	 * --ml-tabs-pills-active-color: var(--ml-color-primary)
	 * --ml-tabs-pills-hover-bg: var(--ml-color-surface-secondary)
	 *
	 * Size: sm
	 * --ml-tabs-sm-padding-y: var(--ml-space-1-5)
	 * --ml-tabs-sm-padding-x: var(--ml-space-3)
	 * --ml-tabs-sm-font-size: var(--ml-text-sm)
	 *
	 * Size: md
	 * --ml-tabs-md-padding-y: var(--ml-space-2)
	 * --ml-tabs-md-padding-x: var(--ml-space-4)
	 * --ml-tabs-md-font-size: var(--ml-text-sm)
	 *
	 * Size: lg
	 * --ml-tabs-lg-padding-y: var(--ml-space-2-5)
	 * --ml-tabs-lg-padding-x: var(--ml-space-5)
	 * --ml-tabs-lg-font-size: var(--ml-text-base)
	 */

	:host {
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
		border-right: var(--ml-tabs-list-border-width, var(--ml-border)) solid var(--ml-tabs-list-border-color, var(--ml-color-border));
		padding-right: var(--ml-tabs-vertical-border-padding, var(--ml-space-2));
		margin-right: var(--ml-tabs-vertical-border-margin, var(--ml-space-4));
	}

	.ml-tabs--vertical .ml-tabs__panels {
		flex: 1;
		min-width: 0;
	}

	/* Tab list */
	.ml-tabs__list {
		display: flex;
		gap: var(--ml-tabs-list-gap, var(--ml-space-1));
		position: relative;
	}

	/* Tab button base */
	.ml-tabs__tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap, var(--ml-space-2));
		padding: var(--ml-tabs-tab-padding-y, var(--ml-space-2)) var(--ml-tabs-tab-padding-x, var(--ml-space-4));
		font-family: var(--ml-tabs-tab-font-family, var(--ml-font-sans));
		font-weight: var(--ml-tabs-tab-font-weight, var(--ml-font-medium));
		color: var(--ml-tabs-tab-color, var(--ml-color-text-secondary));
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			background-color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			border-color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-tabs__tab:hover:not(:disabled) {
		color: var(--ml-tabs-tab-hover-color, var(--ml-color-text));
	}

	.ml-tabs__tab:focus-visible {
		outline: 2px solid var(--ml-tabs-tab-focus-color, var(--ml-color-primary));
		outline-offset: 2px;
	}

	.ml-tabs__tab--active {
		color: var(--ml-tabs-tab-active-color, var(--ml-color-primary));
	}

	.ml-tabs__tab--disabled {
		color: var(--ml-tabs-tab-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
		opacity: var(--ml-tabs-tab-disabled-opacity, 0.6);
	}

	.ml-tabs__tab-label {
		line-height: var(--ml-tabs-tab-label-line-height, var(--ml-leading-tight));
	}

	/* Panels */
	.ml-tabs__panels {
		padding-top: var(--ml-tabs-panels-padding-top, var(--ml-space-4));
	}

	.ml-tabs--vertical .ml-tabs__panels {
		padding-top: 0;
	}

	/* ============================================
	   VARIANT: Line (underline style)
	   ============================================ */
	.ml-tabs--line .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width, var(--ml-border)) solid var(--ml-tabs-list-border-color, var(--ml-color-border));
		gap: 0;
	}

	.ml-tabs--line .ml-tabs__tab {
		position: relative;
		padding-bottom: calc(var(--ml-tabs-tab-padding-y, var(--ml-space-2)) + var(--ml-tabs-line-indicator-height, 2px));
		margin-bottom: -1px;
	}

	.ml-tabs--line .ml-tabs__tab::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--ml-tabs-line-indicator-height, 2px);
		background-color: transparent;
		transition: background-color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-tabs--line .ml-tabs__tab--active::after {
		background-color: var(--ml-tabs-line-indicator-color, var(--ml-color-primary));
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__list {
		border-bottom: none;
		border-right: var(--ml-tabs-list-border-width, var(--ml-border)) solid var(--ml-tabs-list-border-color, var(--ml-color-border));
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab {
		padding-bottom: var(--ml-tabs-tab-padding-y, var(--ml-space-2));
		padding-right: calc(var(--ml-tabs-tab-padding-x, var(--ml-space-4)) + var(--ml-tabs-line-indicator-height, 2px));
		margin-bottom: 0;
		margin-right: -1px;
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab::after {
		bottom: auto;
		left: auto;
		top: 0;
		right: 0;
		width: var(--ml-tabs-line-indicator-height, 2px);
		height: 100%;
	}

	/* ============================================
	   VARIANT: Enclosed (bordered tab style)
	   ============================================ */
	.ml-tabs--enclosed .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width, var(--ml-border)) solid var(--ml-tabs-list-border-color, var(--ml-color-border));
		gap: 0;
	}

	.ml-tabs--enclosed .ml-tabs__tab {
		position: relative;
		border: var(--ml-tabs-list-border-width, var(--ml-border)) solid transparent;
		border-bottom: none;
		border-radius: var(--ml-tabs-enclosed-tab-radius, var(--ml-radius)) var(--ml-tabs-enclosed-tab-radius, var(--ml-radius)) 0 0;
		margin-bottom: -1px;
		background-color: transparent;
	}

	.ml-tabs--enclosed .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-enclosed-hover-bg, var(--ml-color-surface-secondary));
	}

	.ml-tabs--enclosed .ml-tabs__tab--active {
		background-color: var(--ml-tabs-enclosed-active-bg, var(--ml-color-surface));
		border-color: var(--ml-tabs-enclosed-active-border-color, var(--ml-color-border));
		color: var(--ml-tabs-enclosed-active-color, var(--ml-color-text));
	}

	.ml-tabs--enclosed .ml-tabs__tab--active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--ml-tabs-enclosed-active-bg, var(--ml-color-surface));
	}

	/* ============================================
	   VARIANT: Pills (soft rounded style)
	   ============================================ */
	.ml-tabs--pills .ml-tabs__list {
		gap: var(--ml-tabs-list-gap, var(--ml-space-1));
	}

	.ml-tabs--pills .ml-tabs__tab {
		border-radius: var(--ml-tabs-pills-tab-radius, var(--ml-radius));
	}

	.ml-tabs--pills .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-pills-hover-bg, var(--ml-color-surface-secondary));
	}

	.ml-tabs--pills .ml-tabs__tab--active {
		background-color: var(--ml-tabs-pills-active-bg, var(--ml-color-primary-subtle));
		color: var(--ml-tabs-pills-active-color, var(--ml-color-primary));
	}

	/* ============================================
	   SIZE VARIANTS
	   ============================================ */
	.ml-tabs--sm .ml-tabs__tab {
		padding: var(--ml-tabs-sm-padding-y, var(--ml-space-1-5)) var(--ml-tabs-sm-padding-x, var(--ml-space-3));
		font-size: var(--ml-tabs-sm-font-size, var(--ml-text-sm));
	}

	.ml-tabs--md .ml-tabs__tab {
		padding: var(--ml-tabs-md-padding-y, var(--ml-space-2)) var(--ml-tabs-md-padding-x, var(--ml-space-4));
		font-size: var(--ml-tabs-md-font-size, var(--ml-text-sm));
	}

	.ml-tabs--lg .ml-tabs__tab {
		padding: var(--ml-tabs-lg-padding-y, var(--ml-space-2-5)) var(--ml-tabs-lg-padding-x, var(--ml-space-5));
		font-size: var(--ml-tabs-lg-font-size, var(--ml-text-base));
	}

	/* ============================================
	   SLOTTED TAB STYLING
	   ============================================ */
	::slotted(ml-tab) {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap, var(--ml-space-2));
		padding: var(--ml-tabs-tab-padding-y, var(--ml-space-2)) var(--ml-tabs-tab-padding-x, var(--ml-space-4));
		font-family: var(--ml-tabs-tab-font-family, var(--ml-font-sans));
		font-weight: var(--ml-tabs-tab-font-weight, var(--ml-font-medium));
		color: var(--ml-tabs-tab-color, var(--ml-color-text-secondary));
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			background-color var(--ml-tabs-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	::slotted(ml-tab:hover) {
		color: var(--ml-tabs-tab-hover-color, var(--ml-color-text));
	}

	::slotted(ml-tab[active]) {
		color: var(--ml-tabs-tab-active-color, var(--ml-color-primary));
	}

	::slotted(ml-tab[disabled]) {
		color: var(--ml-tabs-tab-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
	}
`;
function matchTabByRoute(entries, path) {
	const normalized = normalize(path);
	let best;
	let bestLength = -1;
	for (const entry of entries) {
		if (!entry.href) continue;
		const href = normalize(entry.href.split(/[?#]/)[0]);
		if (href === normalized) return entry;
		if (normalized.startsWith(`${href === "/" ? "" : href}/`) && href.length > bestLength) {
			best = entry;
			bestLength = href.length;
		}
	}
	return best;
}
function normalize(path) {
	const withSlash = path.startsWith("/") ? path : `/${path}`;
	return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}
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
		this._routedListenerAttached = false;
		this._handleTabClick = (event) => {
			event.stopPropagation();
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
				Injector.get(RouterService).navigate(href).then((result) => {
					if (result.success) this.activateTab(tabValue);
				});
				return;
			}
			this.activateTab(tabValue);
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
	syncRoutedListener() {
		if (this.routed === this._routedListenerAttached) return;
		if (this.routed) {
			window.addEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = true;
			this.syncWithRoute();
		} else {
			window.removeEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = false;
		}
	}
	onCreate() {
		this.elementRef.addEventListener("ml:tab-click", this._handleTabClick);
		this.syncRoutedListener();
	}
	onRender() {
		this.syncRoutedListener();
		this.updateTabStates();
		this.updatePanelVisibility();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:tab-click", this._handleTabClick);
		if (this._routedListenerAttached) {
			window.removeEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = false;
		}
	}
	activateTab(tabValue) {
		this.value = tabValue;
		this.updateTabStates();
		this.updatePanelVisibility();
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value: tabValue }
		}));
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
		const tabs = this.getAllTabs();
		this.elementRef.querySelectorAll("ml-tab-panel").forEach((panel) => {
			const value = panel.getAttribute("value");
			panel.hidden = !(value === this.value);
			const label = tabs.find((t) => t.value === value)?.label;
			if (label) panel.panelLabel = label;
		});
	}
	focusTab(value) {
		const button = (this.elementRef.shadowRoot?.querySelector(".ml-tabs__list"))?.querySelector(`[data-value="${value}"]`);
		if (button) {
			button.focus();
			return;
		}
		(this._slottedTabs.find((tab) => tab.getAttribute("value") === value)?.shadowRoot?.querySelector(".ml-tab"))?.focus();
	}
	syncWithRoute() {
		const matchingTab = matchTabByRoute(this.getAllTabs(), window.location.pathname);
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tab base
	 * --ml-tab-gap: var(--ml-space-2)
	 * --ml-tab-padding-y: var(--ml-space-2)
	 * --ml-tab-padding-x: var(--ml-space-4)
	 * --ml-tab-font-family: var(--ml-font-sans)
	 * --ml-tab-font-weight: var(--ml-font-medium)
	 * --ml-tab-color: var(--ml-color-text-secondary)
	 * --ml-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Tab hover
	 * --ml-tab-hover-color: var(--ml-color-text)
	 *
	 * Tab focus
	 * --ml-tab-focus-color: var(--ml-color-primary)
	 *
	 * Tab active
	 * --ml-tab-active-color: var(--ml-color-primary)
	 *
	 * Tab disabled
	 * --ml-tab-disabled-color: var(--ml-color-text-muted)
	 *
	 * Label
	 * --ml-tab-label-line-height: var(--ml-leading-tight)
	 */

	:host {
		display: contents;
	}

	.ml-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tab-gap, var(--ml-space-2));
		padding: var(--ml-tab-padding-y, var(--ml-space-2)) var(--ml-tab-padding-x, var(--ml-space-4));
		font-family: var(--ml-tab-font-family, var(--ml-font-sans));
		font-weight: var(--ml-tab-font-weight, var(--ml-font-medium));
		font-size: inherit;
		color: var(--ml-tab-color, var(--ml-color-text-secondary));
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			background-color var(--ml-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-tab:hover:not(:disabled) {
		color: var(--ml-tab-hover-color, var(--ml-color-text));
	}

	.ml-tab:focus-visible {
		outline: 2px solid var(--ml-tab-focus-color, var(--ml-color-primary));
		outline-offset: 2px;
	}

	.ml-tab--active {
		color: var(--ml-tab-active-color, var(--ml-color-primary));
	}

	.ml-tab--disabled {
		color: var(--ml-tab-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
	}

	.ml-tab__label {
		line-height: var(--ml-tab-label-line-height, var(--ml-leading-tight));
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
function tabPanelTemplate(c) {
	return html`
		<div class="ml-tab-panel" role="tabpanel" aria-label=${c.panelLabel || c.value}>
			<slot></slot>
		</div>
	`;
}
const tabPanelStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tab panel: focus
	 * --ml-tab-panel-focus-width: 2px
	 * --ml-tab-panel-focus-color: var(--ml-color-primary)
	 * --ml-tab-panel-focus-offset: 2px
	 */

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
		outline: var(--ml-tab-panel-focus-width, 2px) solid var(--ml-tab-panel-focus-color, var(--ml-color-primary));
		outline-offset: var(--ml-tab-panel-focus-offset, 2px);
	}
`;
var TabPanelComponent = class TabPanelComponent$1 {
	constructor() {
		this.value = "";
		this.panelLabel = "";
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Gap between breadcrumb items
	 * --ml-breadcrumb-gap: var(--ml-space-1)
	 */

	:host {
		display: block;
	}

	.ml-breadcrumb__list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--ml-breadcrumb-gap, var(--ml-space-1));
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
function routeAnchorClick(event, href, options = {}) {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
	if (!href || options.external || options.target && options.target !== "_self") return false;
	if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith(window.location.origin)) return false;
	if (!Injector.has(RouterService)) return false;
	event.preventDefault();
	Injector.get(RouterService).navigate(href);
	return true;
}
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
					<a class="ml-breadcrumb-item__link" href=${c.href} @click=${(event) => routeAnchorClick(event, c.href)}>
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
			"ml-pagination__btn--active": p.value === c.currentPage
		})}
								aria-label=${`Page ${p.value}`}
								aria-current=${p.value === c.currentPage ? "page" : false}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Pagination: focus
	 * --ml-pagination-focus-width: 2px
	 * --ml-pagination-focus-color: var(--ml-color-primary)
	 * --ml-pagination-focus-offset: 2px
	 *
	 * Layout
	 * --ml-pagination-gap: var(--ml-space-3)
	 * --ml-pagination-pages-gap: var(--ml-space-1)
	 *
	 * Button base
	 * --ml-pagination-btn-gap: var(--ml-space-2)
	 * --ml-pagination-btn-padding-y: var(--ml-space-2)
	 * --ml-pagination-btn-padding-x: var(--ml-space-3)
	 * --ml-pagination-btn-font-size: var(--ml-text-sm)
	 * --ml-pagination-btn-font-weight: var(--ml-font-medium)
	 * --ml-pagination-btn-color: var(--ml-color-text-secondary)
	 * --ml-pagination-btn-bg: transparent
	 * --ml-pagination-btn-radius: var(--ml-radius-md)
	 * --ml-pagination-btn-transition-duration: var(--ml-duration-150)
	 * --ml-pagination-btn-transition-easing: var(--ml-ease-in-out)
	 *
	 * Button hover
	 * --ml-pagination-btn-hover-bg: var(--ml-color-surface-hover)
	 * --ml-pagination-btn-hover-color: var(--ml-color-text)
	 *
	 * Button page size
	 * --ml-pagination-btn-page-size: 40px
	 *
	 * Nav button
	 * --ml-pagination-nav-font-weight: var(--ml-font-semibold)
	 *
	 * Active state
	 * --ml-pagination-active-bg: var(--ml-color-primary)
	 * --ml-pagination-active-color: var(--ml-color-text-inverse)
	 * --ml-pagination-active-font-weight: var(--ml-font-semibold)
	 *
	 * Disabled state
	 * --ml-pagination-disabled-opacity: 0.5
	 *
	 * Ellipsis
	 * --ml-pagination-ellipsis-font-size: var(--ml-text-sm)
	 * --ml-pagination-ellipsis-color: var(--ml-color-text-tertiary)
	 */

	:host {
		display: block;
	}

	.ml-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-pagination-gap, var(--ml-space-3));
	}

	.ml-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--ml-pagination-pages-gap, var(--ml-space-1));
	}

	.ml-pagination__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-pagination-btn-gap, var(--ml-space-2));
		padding: var(--ml-pagination-btn-padding-y, var(--ml-space-2)) var(--ml-pagination-btn-padding-x, var(--ml-space-3));
		font-size: var(--ml-pagination-btn-font-size, var(--ml-text-sm));
		font-weight: var(--ml-pagination-btn-font-weight, var(--ml-font-medium));
		color: var(--ml-pagination-btn-color, var(--ml-color-text-secondary));
		background: var(--ml-pagination-btn-bg, transparent);
		border: none;
		border-radius: var(--ml-pagination-btn-radius, var(--ml-radius-md));
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--ml-pagination-btn-transition-duration, var(--ml-duration-150)) var(--ml-pagination-btn-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-pagination-btn-transition-duration, var(--ml-duration-150)) var(--ml-pagination-btn-transition-easing, var(--ml-ease-in-out));
	}

	.ml-pagination__btn:hover:not(:disabled) {
		background-color: var(--ml-pagination-btn-hover-bg, var(--ml-color-surface-hover));
		color: var(--ml-pagination-btn-hover-color, var(--ml-color-text));
	}

	.ml-pagination__btn:focus-visible {
		outline: var(--ml-pagination-focus-width, 2px) solid var(--ml-pagination-focus-color, var(--ml-color-primary));
		outline-offset: var(--ml-pagination-focus-offset, 2px);
	}

	.ml-pagination__btn--nav {
		font-weight: var(--ml-pagination-nav-font-weight, var(--ml-font-semibold));
	}

	.ml-pagination__btn--page {
		min-width: var(--ml-pagination-btn-page-size, 40px);
		height: var(--ml-pagination-btn-page-size, 40px);
		padding: 0;
	}

	.ml-pagination__btn--active,
	.ml-pagination__btn--active:hover {
		background-color: var(--ml-pagination-active-bg, var(--ml-color-primary));
		color: var(--ml-pagination-active-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-pagination-active-font-weight, var(--ml-font-semibold));
	}

	.ml-pagination__btn--disabled,
	.ml-pagination__btn:disabled {
		opacity: var(--ml-pagination-disabled-opacity, 0.5);
		cursor: not-allowed;
	}

	.ml-pagination__ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-pagination-btn-page-size, 40px);
		height: var(--ml-pagination-btn-page-size, 40px);
		font-size: var(--ml-pagination-ellipsis-font-size, var(--ml-text-sm));
		color: var(--ml-pagination-ellipsis-color, var(--ml-color-text-tertiary));
	}
`;
var PaginationComponent = class PaginationComponent$1 {
	constructor() {
		this.page = 1;
		this.totalPages = 1;
		this.siblings = 1;
		this.goToPage = (page) => {
			if (page < 1 || page > this.totalPages || page === this.page) return;
			this.page = page;
			this.elementRef.dispatchEvent(new CustomEvent("ml:page-change", {
				bubbles: true,
				composed: true,
				detail: { page: this.page }
			}));
		};
		this.previous = () => {
			this.goToPage(this.page - 1);
		};
		this.next = () => {
			this.goToPage(this.page + 1);
		};
	}
	static #_ = this.propertyTypes = {
		page: "number",
		totalPages: "number",
		siblings: "number"
	};
	get pages() {
		const total = Math.max(1, this.totalPages);
		const current = Math.min(Math.max(1, this.page), total);
		const siblings = Math.max(0, this.siblings);
		const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => ({
			type: "page",
			value: start + i
		}));
		if (2 * siblings + 5 >= total) return range(1, total);
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
	get currentPage() {
		return Math.min(Math.max(1, Number(this.page) || 1), Math.max(1, this.totalPages));
	}
	get hasPrevious() {
		return this.currentPage > 1;
	}
	get hasNext() {
		return this.currentPage < this.totalPages;
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
						@click=${(event) => {
		routeAnchorClick(event, item.href ?? "", { external: item.external });
		handleClick(event);
	}}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Container
	 * --ml-sidebar-width: 280px
	 * --ml-sidebar-bg: var(--ml-color-surface)
	 * --ml-sidebar-border-width: var(--ml-border)
	 * --ml-sidebar-border-color: var(--ml-color-border)
	 * --ml-sidebar-transition: var(--ml-duration-200) var(--ml-ease-in-out)
	 *
	 * Slim expanded shadow
	 * --ml-sidebar-slim-expanded-shadow: var(--ml-shadow-lg)
	 *
	 * Header
	 * --ml-sidebar-header-padding: var(--ml-space-4)
	 *
	 * Search
	 * --ml-sidebar-search-padding-y: var(--ml-space-3)
	 * --ml-sidebar-search-padding-x: var(--ml-space-4)
	 *
	 * Main nav area
	 * --ml-sidebar-main-padding-y: var(--ml-space-2)
	 *
	 * Scrollbar
	 * --ml-sidebar-scrollbar-width: 4px
	 * --ml-sidebar-scrollbar-color: var(--ml-color-border)
	 * --ml-sidebar-scrollbar-radius: var(--ml-radius-full)
	 *
	 * Footer
	 * --ml-sidebar-footer-nav-padding: var(--ml-space-2)
	 * --ml-sidebar-footer-nav-gap: var(--ml-space-0-5)
	 * --ml-sidebar-feature-padding-y: var(--ml-space-3)
	 * --ml-sidebar-feature-padding-x: var(--ml-space-4)
	 * --ml-sidebar-user-padding-y: var(--ml-space-3)
	 * --ml-sidebar-user-padding-x: var(--ml-space-4)
	 *
	 * Group label
	 * --ml-sidebar-group-label-padding-y: var(--ml-space-2)
	 * --ml-sidebar-group-label-padding-x: var(--ml-space-4)
	 * --ml-sidebar-group-label-font-family: var(--ml-font-sans)
	 * --ml-sidebar-group-label-font-size: var(--ml-text-xs)
	 * --ml-sidebar-group-label-font-weight: var(--ml-font-semibold)
	 * --ml-sidebar-group-label-color: var(--ml-color-text-muted)
	 * --ml-sidebar-group-label-letter-spacing: 0.05em
	 * --ml-sidebar-group-label-line-height: var(--ml-leading-tight)
	 *
	 * Group items
	 * --ml-sidebar-group-items-gap: var(--ml-space-0-5)
	 * --ml-sidebar-group-items-padding-x: var(--ml-space-2)
	 *
	 * Item link
	 * --ml-sidebar-item-gap: var(--ml-space-3)
	 * --ml-sidebar-item-padding-y: var(--ml-space-2)
	 * --ml-sidebar-item-padding-x: var(--ml-space-3)
	 * --ml-sidebar-item-radius: var(--ml-radius)
	 * --ml-sidebar-item-color: var(--ml-color-text-secondary)
	 * --ml-sidebar-item-font-family: var(--ml-font-sans)
	 * --ml-sidebar-item-font-size: var(--ml-text-sm)
	 * --ml-sidebar-item-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-item-line-height: var(--ml-leading-tight)
	 * --ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Item hover
	 * --ml-sidebar-item-hover-bg: var(--ml-gray-100)
	 * --ml-sidebar-item-hover-color: var(--ml-color-text)
	 *
	 * Item focus
	 * --ml-sidebar-item-focus-color: var(--ml-color-primary)
	 *
	 * Item active
	 * --ml-sidebar-item-active-bg: var(--ml-color-primary)
	 * --ml-sidebar-item-active-color: var(--ml-color-text-inverse)
	 * --ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover)
	 *
	 * Active indicator (left border accent)
	 * --ml-sidebar-item-active-indicator-width: 0px
	 * --ml-sidebar-item-active-indicator-color: transparent
	 *
	 * Item disabled
	 * --ml-sidebar-item-disabled-color: var(--ml-color-text-muted)
	 * --ml-sidebar-item-disabled-opacity: 0.6
	 *
	 * Icon colors (separate from text)
	 * --ml-sidebar-item-icon-color: inherit
	 * --ml-sidebar-item-active-icon-color: inherit
	 * --ml-sidebar-item-hover-icon-color: inherit
	 *
	 * Item icon size
	 * --ml-sidebar-item-icon-size: 20px
	 *
	 * Item trailing gap
	 * --ml-sidebar-item-trailing-gap: var(--ml-space-2)
	 *
	 * Badge
	 * --ml-sidebar-badge-min-size: 20px
	 * --ml-sidebar-badge-padding-x: var(--ml-space-1-5)
	 * --ml-sidebar-badge-radius: var(--ml-radius-full)
	 * --ml-sidebar-badge-font-size: var(--ml-text-xs)
	 * --ml-sidebar-badge-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-badge-bg: var(--ml-color-surface-tertiary)
	 * --ml-sidebar-badge-color: var(--ml-color-text-secondary)
	 *
	 * Active badge overrides
	 * --ml-sidebar-item-active-badge-bg: var(--ml-sidebar-badge-bg)
	 * --ml-sidebar-item-active-badge-color: var(--ml-sidebar-badge-color)
	 *
	 * Chevron transition
	 * --ml-sidebar-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out)
	 */

	:host {
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
		width: var(--ml-sidebar-width, 280px);
		background-color: var(--ml-sidebar-bg, var(--ml-color-surface));
		border-right: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
		transition: width var(--ml-sidebar-transition, var(--ml-duration-200) var(--ml-ease-in-out));
	}

	/* Slim variant - collapsed (icons only) */
	.ml-sidebar--slim {
		--ml-sidebar-width: 64px;
		overflow: hidden;
	}

	/* Slim variant - expanded on hover */
	.ml-sidebar--slim:not(.ml-sidebar--collapsed) {
		--ml-sidebar-width: 280px;
		box-shadow: var(--ml-sidebar-slim-expanded-shadow, var(--ml-shadow-lg));
		z-index: 50;
		position: relative;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-sidebar__header {
		flex-shrink: 0;
		padding: var(--ml-sidebar-header-padding, var(--ml-space-4));
		border-bottom: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	.ml-sidebar__header:empty {
		display: none;
	}

	/* ============================================
	   SEARCH
	   ============================================ */
	.ml-sidebar__search {
		flex-shrink: 0;
		padding: var(--ml-sidebar-search-padding-y, var(--ml-space-3)) var(--ml-sidebar-search-padding-x, var(--ml-space-4));
	}

	/* ============================================
	   MAIN NAV AREA
	   ============================================ */
	.ml-sidebar__main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--ml-sidebar-main-padding-y, var(--ml-space-2)) 0;
	}

	/* Scrollbar styling */
	.ml-sidebar__main::-webkit-scrollbar {
		width: var(--ml-sidebar-scrollbar-width, 4px);
	}

	.ml-sidebar__main::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-sidebar__main::-webkit-scrollbar-thumb {
		background-color: var(--ml-sidebar-scrollbar-color, var(--ml-color-border));
		border-radius: var(--ml-sidebar-scrollbar-radius, var(--ml-radius-full));
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-sidebar__footer {
		flex-shrink: 0;
		margin-top: auto;
		border-top: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	.ml-sidebar__footer-nav {
		padding: var(--ml-sidebar-footer-nav-padding, var(--ml-space-2));
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-footer-nav-gap, var(--ml-space-0-5));
	}

	.ml-sidebar__footer-nav:empty {
		display: none;
	}

	.ml-sidebar__feature {
		padding: var(--ml-sidebar-feature-padding-y, var(--ml-space-3)) var(--ml-sidebar-feature-padding-x, var(--ml-space-4));
	}

	.ml-sidebar__user {
		padding: var(--ml-sidebar-user-padding-y, var(--ml-space-3)) var(--ml-sidebar-user-padding-x, var(--ml-space-4));
		border-top: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	/* ============================================
	   CONFIG-RENDERED GROUPS
	   ============================================ */
	.ml-sidebar__group {
		padding: var(--ml-space-1) 0;
	}

	.ml-sidebar__group-label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y, var(--ml-space-2)) var(--ml-sidebar-group-label-padding-x, var(--ml-space-4));
		font-family: var(--ml-sidebar-group-label-font-family, var(--ml-font-sans));
		font-size: var(--ml-sidebar-group-label-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-group-label-font-weight, var(--ml-font-semibold));
		color: var(--ml-sidebar-group-label-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing, 0.05em);
		line-height: var(--ml-sidebar-group-label-line-height, var(--ml-leading-tight));
	}

	.ml-sidebar__group-items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap, var(--ml-space-0-5));
		padding: 0 var(--ml-sidebar-group-items-padding-x, var(--ml-space-2));
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
		gap: var(--ml-sidebar-item-gap, var(--ml-space-3));
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2)) var(--ml-sidebar-item-padding-x, var(--ml-space-3));
		padding-left: calc(var(--ml-sidebar-item-padding-x, var(--ml-space-3)) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-left: var(--ml-sidebar-item-active-indicator-width, 0px) solid transparent;
		border-radius: var(--ml-sidebar-item-radius, var(--ml-radius));
		background: transparent;
		color: var(--ml-sidebar-item-color, var(--ml-color-text-secondary));
		font-family: var(--ml-sidebar-item-font-family, var(--ml-font-sans));
		font-size: var(--ml-sidebar-item-font-size, var(--ml-text-sm));
		font-weight: var(--ml-sidebar-item-font-weight, var(--ml-font-medium));
		line-height: var(--ml-sidebar-item-line-height, var(--ml-leading-tight));
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) {
		background-color: var(--ml-sidebar-item-hover-bg, var(--ml-gray-100));
		color: var(--ml-sidebar-item-hover-color, var(--ml-color-text));
	}

	.ml-sidebar__item-link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color, var(--ml-color-primary));
		outline-offset: -2px;
	}

	.ml-sidebar__item-link--active {
		background-color: var(--ml-sidebar-item-active-bg, var(--ml-color-primary));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
		border-left-color: var(--ml-sidebar-item-active-indicator-color, transparent);
	}

	.ml-sidebar__item-link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg, var(--ml-color-primary-hover));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
	}

	.ml-sidebar__item-link--disabled {
		color: var(--ml-sidebar-item-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity, 0.6);
	}

	.ml-sidebar__item-link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2));
	}

	/* Leading area (icon) */
	.ml-sidebar__item-leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size, 20px);
		height: var(--ml-sidebar-item-icon-size, 20px);
		color: var(--ml-sidebar-item-icon-color, inherit);
	}

	.ml-sidebar__item-link--active .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-active-icon-color, inherit);
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-hover-icon-color, inherit);
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
		gap: var(--ml-sidebar-item-trailing-gap, var(--ml-space-2));
		flex-shrink: 0;
	}

	/* Badge */
	.ml-sidebar__item-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-sidebar-badge-min-size, 20px);
		height: var(--ml-sidebar-badge-min-size, 20px);
		padding: 0 var(--ml-sidebar-badge-padding-x, var(--ml-space-1-5));
		border-radius: var(--ml-sidebar-badge-radius, var(--ml-radius-full));
		font-size: var(--ml-sidebar-badge-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-badge-font-weight, var(--ml-font-medium));
		line-height: 1;
		background-color: var(--ml-sidebar-badge-bg, var(--ml-color-surface-tertiary));
		color: var(--ml-sidebar-badge-color, var(--ml-color-text-secondary));
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
		background-color: var(--ml-sidebar-item-active-badge-bg, var(--ml-sidebar-badge-bg, var(--ml-color-surface-tertiary)));
		color: var(--ml-sidebar-item-active-badge-color, var(--ml-sidebar-badge-color, var(--ml-color-text-secondary)));
	}

	/* Chevron for expandable items */
	.ml-sidebar__item-chevron {
		transition: transform var(--ml-sidebar-chevron-transition, var(--ml-duration-200) var(--ml-ease-in-out));
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
		transition: opacity var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out));
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
		this.hasSearch = false;
		this.hasFeature = false;
		this.hasUser = false;
		this._slotWatcherCleanup = null;
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
			const focusable = this.getFocusableItems();
			if (focusable.length === 0) return;
			const target = event.target;
			const currentIndex = focusable.findIndex((entry) => entry.el === target || entry.host === target);
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
			if (newIndex !== currentIndex && focusable[newIndex]) focusable[newIndex].el.focus();
		};
		this.expandedItems = /* @__PURE__ */ new Set();
	}
	onCreate() {
		if (this.variant === "slim") this.collapsed = true;
		this._slotWatcherCleanup = watchLightSlots(this.elementRef, () => {
			this.hasSearch = hasLightSlot(this.elementRef, "search");
			this.hasFeature = hasLightSlot(this.elementRef, "feature");
			this.hasUser = hasLightSlot(this.elementRef, "user");
		});
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
		this._slotWatcherCleanup?.();
		this._slotWatcherCleanup = null;
		this.elementRef.removeEventListener("ml:sidebar-item-click", this._handleItemClick);
		this.elementRef.removeEventListener("mouseenter", this._handleMouseEnter);
		this.elementRef.removeEventListener("mouseleave", this._handleMouseLeave);
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
	}
	getFocusableItems() {
		const main = this.elementRef.shadowRoot?.querySelector(".ml-sidebar__main");
		if (!main) return [];
		const result = [];
		const visit = (node) => {
			if (node instanceof HTMLSlotElement) {
				node.assignedElements({ flatten: true }).forEach(visit);
				return;
			}
			if (node.tagName === "ML-SIDEBAR-ITEM") {
				const link = node.shadowRoot?.querySelector(".ml-sidebar-item__link");
				if (link && !link.hasAttribute("disabled") && !link.classList.contains("ml-sidebar-item__link--disabled")) result.push({
					el: link,
					host: node
				});
				if (node.hasAttribute("expanded") && !this.collapsed) Array.from(node.children).forEach(visit);
				return;
			}
			if (node.matches(".ml-sidebar__item-link:not([disabled]):not(.ml-sidebar__item-link--disabled), button:not([disabled]), a")) {
				result.push({
					el: node,
					host: null
				});
				return;
			}
			Array.from(node.children).forEach(visit);
		};
		Array.from(main.children).forEach(visit);
		return result;
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
		event.stopPropagation();
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-sidebar-group-padding-y: var(--ml-space-1)
	 * --ml-sidebar-group-label-padding-y: var(--ml-space-2)
	 * --ml-sidebar-group-label-padding-x: var(--ml-space-4)
	 * --ml-sidebar-group-label-font-size: var(--ml-text-xs)
	 * --ml-sidebar-group-label-font-weight: var(--ml-font-semibold)
	 * --ml-sidebar-group-label-color: var(--ml-color-text-muted)
	 * --ml-sidebar-group-label-letter-spacing: 0.05em
	 * --ml-sidebar-group-items-gap: var(--ml-space-0-5)
	 * --ml-sidebar-group-items-padding-x: var(--ml-space-2)
	 */

	:host {
		display: block;
	}

	.ml-sidebar-group {
		padding: var(--ml-sidebar-group-padding-y, var(--ml-space-1)) 0;
	}

	.ml-sidebar-group__label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y, var(--ml-space-2)) var(--ml-sidebar-group-label-padding-x, var(--ml-space-4));
		font-family: var(--ml-font-sans);
		font-size: var(--ml-sidebar-group-label-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-group-label-font-weight, var(--ml-font-semibold));
		color: var(--ml-sidebar-group-label-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing, 0.05em);
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar-group__items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap, var(--ml-space-0-5));
		padding: 0 var(--ml-sidebar-group-items-padding-x, var(--ml-space-2));
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
				${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm" format=${c.iconFormat || "regular"}></ml-icon>`)}
			</slot>
		</div>
		${when(!isCollapsed, () => html`
			<span class="ml-sidebar-item__label">${c.label}</span>
			<div class="ml-sidebar-item__trailing">
				<slot name="trailing">
					${when(!!c.badge, () => html`
						<span class=${classMap({
		"ml-sidebar-item__badge": true,
		[`ml-sidebar-item__badge--${c.badgeColor}`]: true
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
						@click=${(event) => {
		routeAnchorClick(event, c.href, { external: c.external });
		c.handleClick(event);
	}}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Item link
	 * --ml-sidebar-item-gap: var(--ml-space-3)
	 * --ml-sidebar-item-padding-y: var(--ml-space-2)
	 * --ml-sidebar-item-padding-x: var(--ml-space-3)
	 * --ml-sidebar-item-radius: var(--ml-radius)
	 * --ml-sidebar-item-color: var(--ml-color-text-secondary)
	 * --ml-sidebar-item-font-family: var(--ml-font-sans)
	 * --ml-sidebar-item-font-size: var(--ml-text-sm)
	 * --ml-sidebar-item-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-item-line-height: var(--ml-leading-tight)
	 * --ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Item hover
	 * --ml-sidebar-item-hover-bg: var(--ml-gray-100)
	 * --ml-sidebar-item-hover-color: var(--ml-color-text)
	 *
	 * Item focus
	 * --ml-sidebar-item-focus-color: var(--ml-color-primary)
	 *
	 * Item active
	 * --ml-sidebar-item-active-bg: var(--ml-color-primary)
	 * --ml-sidebar-item-active-color: var(--ml-color-text-inverse)
	 * --ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover)
	 *
	 * Active indicator (left border accent)
	 * --ml-sidebar-item-active-indicator-width: 0px
	 * --ml-sidebar-item-active-indicator-color: transparent
	 *
	 * Item disabled
	 * --ml-sidebar-item-disabled-color: var(--ml-color-text-muted)
	 * --ml-sidebar-item-disabled-opacity: 0.6
	 *
	 * Icon colors (separate from text)
	 * --ml-sidebar-item-icon-color: inherit
	 * --ml-sidebar-item-active-icon-color: inherit
	 * --ml-sidebar-item-hover-icon-color: inherit
	 *
	 * Item icon size
	 * --ml-sidebar-item-icon-size: 20px
	 *
	 * Item trailing gap
	 * --ml-sidebar-item-trailing-gap: var(--ml-space-2)
	 *
	 * Badge
	 * --ml-sidebar-item-badge-min-size: 20px
	 * --ml-sidebar-item-badge-padding-x: var(--ml-space-1-5)
	 * --ml-sidebar-item-badge-radius: var(--ml-radius-full)
	 * --ml-sidebar-item-badge-font-size: var(--ml-text-xs)
	 * --ml-sidebar-item-badge-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-item-badge-bg: var(--ml-color-surface-tertiary)
	 * --ml-sidebar-item-badge-color: var(--ml-color-text-secondary)
	 *
	 * Active badge overrides
	 * --ml-sidebar-item-active-badge-bg: var(--ml-sidebar-item-badge-bg)
	 * --ml-sidebar-item-active-badge-color: var(--ml-sidebar-item-badge-color)
	 *
	 * Chevron transition
	 * --ml-sidebar-item-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-sidebar-item {
		--level: 0;
	}

	.ml-sidebar-item__link {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-gap, var(--ml-space-3));
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2)) var(--ml-sidebar-item-padding-x, var(--ml-space-3));
		padding-left: calc(var(--ml-sidebar-item-padding-x, var(--ml-space-3)) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-left: var(--ml-sidebar-item-active-indicator-width, 0px) solid transparent;
		border-radius: var(--ml-sidebar-item-radius, var(--ml-radius));
		background: transparent;
		color: var(--ml-sidebar-item-color, var(--ml-color-text-secondary));
		font-family: var(--ml-sidebar-item-font-family, var(--ml-font-sans));
		font-size: var(--ml-sidebar-item-font-size, var(--ml-text-sm));
		font-weight: var(--ml-sidebar-item-font-weight, var(--ml-font-medium));
		line-height: var(--ml-sidebar-item-line-height, var(--ml-leading-tight));
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled):not(.ml-sidebar-item__link--active) {
		background-color: var(--ml-sidebar-item-hover-bg, var(--ml-gray-100));
		color: var(--ml-sidebar-item-hover-color, var(--ml-color-text));
	}

	.ml-sidebar-item__link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color, var(--ml-color-primary));
		outline-offset: -2px;
	}

	.ml-sidebar-item__link--active {
		background-color: var(--ml-sidebar-item-active-bg, var(--ml-color-primary));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
		border-left-color: var(--ml-sidebar-item-active-indicator-color, transparent);
	}

	.ml-sidebar-item__link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg, var(--ml-color-primary-hover));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
	}

	.ml-sidebar-item__link--disabled {
		color: var(--ml-sidebar-item-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity, 0.6);
	}

	.ml-sidebar-item__link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2));
	}

	/* Leading area (icon) */
	.ml-sidebar-item__leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size, 20px);
		height: var(--ml-sidebar-item-icon-size, 20px);
		color: var(--ml-sidebar-item-icon-color, inherit);
	}

	.ml-sidebar-item__link--active .ml-sidebar-item__leading {
		color: var(--ml-sidebar-item-active-icon-color, inherit);
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled):not(.ml-sidebar-item__link--active) .ml-sidebar-item__leading {
		color: var(--ml-sidebar-item-hover-icon-color, inherit);
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
		gap: var(--ml-sidebar-item-trailing-gap, var(--ml-space-2));
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
		min-width: var(--ml-sidebar-item-badge-min-size, 20px);
		height: var(--ml-sidebar-item-badge-min-size, 20px);
		padding: 0 var(--ml-sidebar-item-badge-padding-x, var(--ml-space-1-5));
		border-radius: var(--ml-sidebar-item-badge-radius, var(--ml-radius-full));
		font-size: var(--ml-sidebar-item-badge-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-item-badge-font-weight, var(--ml-font-medium));
		line-height: 1;
		background-color: var(--ml-sidebar-item-badge-bg, var(--ml-color-surface-tertiary));
		color: var(--ml-sidebar-item-badge-color, var(--ml-color-text-secondary));
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
		background-color: var(--ml-sidebar-item-active-badge-bg, var(--ml-sidebar-item-badge-bg, var(--ml-color-surface-tertiary)));
		color: var(--ml-sidebar-item-active-badge-color, var(--ml-sidebar-item-badge-color, var(--ml-color-text-secondary)));
	}

	/* Chevron for expandable items */
	.ml-sidebar-item__chevron {
		transition: transform var(--ml-sidebar-item-chevron-transition, var(--ml-duration-200) var(--ml-ease-in-out));
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
		this.iconFormat = "";
		this.label = "";
		this.value = "";
		this.href = "";
		this.active = false;
		this.disabled = false;
		this.badge = "";
		this.badgeColor = "default";
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
defineLegacyAliases(SidebarItemComponent.prototype, "ml-sidebar-item", {
	"icon-format": "iconFormat",
	"badge-color": "badgeColor"
});
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
				${hasSteps ? repeat(c.steps, (step) => step.value, (step, index) => renderConfigStep(c, step, index)) : html`<slot name="step" @slotchange=${c.handleStepSlotChange}></slot>`}
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
			@keydown=${(e) => {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		c.handleStepClick(step.value, step.href);
	}}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Compact label
	 * --ml-steps-compact-gap: var(--ml-space-3)
	 * --ml-steps-compact-label-font-family: var(--ml-font-sans)
	 * --ml-steps-compact-label-font-size: var(--ml-text-sm)
	 * --ml-steps-compact-label-font-weight: var(--ml-font-medium)
	 * --ml-steps-compact-label-color: var(--ml-color-text-secondary)
	 * --ml-steps-compact-label-margin-top: var(--ml-space-3)
	 *
	 * Panels
	 * --ml-steps-panels-padding-top: var(--ml-space-6)
	 * --ml-steps-compact-panels-padding-top: var(--ml-space-4)
	 *
	 * Focus ring
	 * --ml-steps-focus-color: var(--ml-color-primary)
	 * --ml-steps-focus-radius: var(--ml-radius)
	 *
	 * Disabled state
	 * --ml-steps-disabled-opacity: 0.5
	 *
	 * Connector
	 * --ml-steps-connector-thickness: 2px
	 * --ml-steps-connector-color: var(--ml-color-border)
	 * --ml-steps-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Indicator (numbered & circles)
	 * --ml-steps-indicator-size: 32px
	 * --ml-steps-indicator-border-width: 2px
	 * --ml-steps-indicator-font-size: var(--ml-text-sm)
	 * --ml-steps-indicator-font-weight: var(--ml-font-medium)
	 * --ml-steps-indicator-font-family: var(--ml-font-sans)
	 * --ml-steps-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Indicator upcoming
	 * --ml-steps-upcoming-border-color: var(--ml-color-border)
	 * --ml-steps-upcoming-color: var(--ml-color-text-secondary)
	 * --ml-steps-upcoming-bg: var(--ml-color-surface)
	 *
	 * Indicator dot (circles variant)
	 * --ml-steps-dot-size: 10px
	 *
	 * Icons variant
	 * --ml-steps-icon-indicator-size: 40px
	 * --ml-steps-icon-indicator-radius: var(--ml-radius-lg)
	 * --ml-steps-icon-upcoming-color: var(--ml-color-text-muted)
	 * --ml-steps-icon-current-border-color: var(--ml-color-text)
	 * --ml-steps-icon-current-color: var(--ml-color-text)
	 *
	 * Completed indicator text
	 * --ml-steps-completed-indicator-text: #fff
	 *
	 * Bar variant
	 * --ml-steps-bar-height: 4px
	 * --ml-steps-bar-radius: 2px
	 * --ml-steps-bar-color: var(--ml-color-border)
	 *
	 * Compact / dots
	 * --ml-steps-compact-dot-size: 12px
	 * --ml-steps-compact-dot-color: var(--ml-color-border)
	 *
	 * Content spacing
	 * --ml-steps-content-gap: var(--ml-space-1)
	 * --ml-steps-track-gap: var(--ml-space-3)
	 * --ml-steps-vertical-content-padding: var(--ml-space-6)
	 *
	 * Label
	 * --ml-steps-label-font-family: var(--ml-font-sans)
	 * --ml-steps-label-font-size: var(--ml-text-sm)
	 * --ml-steps-label-font-weight: var(--ml-font-medium)
	 * --ml-steps-label-color: var(--ml-color-text)
	 * --ml-steps-label-line-height: var(--ml-leading-tight)
	 * --ml-steps-label-upcoming-color: var(--ml-color-text-secondary)
	 *
	 * Description
	 * --ml-steps-desc-font-family: var(--ml-font-sans)
	 * --ml-steps-desc-font-size: var(--ml-text-xs)
	 * --ml-steps-desc-color: var(--ml-color-text-muted)
	 * --ml-steps-desc-line-height: var(--ml-leading-normal)
	 */

	:host {
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
		gap: var(--ml-steps-compact-gap, var(--ml-space-3));
		justify-content: center;
		align-items: center;
	}

	.ml-steps__compact-label {
		font-family: var(--ml-steps-compact-label-font-family, var(--ml-font-sans));
		font-size: var(--ml-steps-compact-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-steps-compact-label-font-weight, var(--ml-font-medium));
		color: var(--ml-steps-compact-label-color, var(--ml-color-text-secondary));
		text-align: center;
		margin-top: var(--ml-steps-compact-label-margin-top, var(--ml-space-3));
	}

	/* ============================================
	   PANELS
	   ============================================ */
	.ml-steps__panels {
		padding-top: var(--ml-steps-panels-padding-top, var(--ml-space-6));
	}

	.ml-steps--compact .ml-steps__panels {
		padding-top: var(--ml-steps-compact-panels-padding-top, var(--ml-space-4));
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
		opacity: var(--ml-steps-disabled-opacity, 0.5);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-steps-focus-color, var(--ml-color-primary));
		outline-offset: 2px;
		border-radius: var(--ml-steps-focus-radius, var(--ml-radius));
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
		margin-bottom: var(--ml-steps-track-gap, var(--ml-space-3));
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-steps-connector-thickness, 2px);
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
		margin-right: var(--ml-steps-track-gap, var(--ml-space-3));
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-steps-connector-thickness, 2px);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding, var(--ml-space-6));
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* Connectors */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-steps-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-step__connector--solid {
		background-color: var(--ml-steps-connector-color, var(--ml-color-border));
	}

	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-steps-connector-color, var(--ml-color-border)) 0,
			var(--ml-steps-connector-color, var(--ml-color-border)) 4px,
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
			var(--ml-steps-connector-color, var(--ml-color-border)) 0,
			var(--ml-steps-connector-color, var(--ml-color-border)) 4px,
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
			background-color var(--ml-steps-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			border-color var(--ml-steps-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-steps-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	/* Numbered */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-steps-indicator-size, 32px);
		height: var(--ml-steps-indicator-size, 32px);
		border-radius: 50%;
		font-size: var(--ml-steps-indicator-font-size, var(--ml-text-sm));
		font-weight: var(--ml-steps-indicator-font-weight, var(--ml-font-medium));
		font-family: var(--ml-steps-indicator-font-family, var(--ml-font-sans));
	}

	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-steps-upcoming-border-color, var(--ml-color-border));
		color: var(--ml-steps-upcoming-color, var(--ml-color-text-secondary));
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text, #fff);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text, #fff);
	}

	/* Circles */
	.ml-step__indicator-inner--circles {
		width: var(--ml-steps-indicator-size, 32px);
		height: var(--ml-steps-indicator-size, 32px);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-steps-dot-size, 10px);
		height: var(--ml-steps-dot-size, 10px);
		border-radius: 50%;
		transition: background-color var(--ml-steps-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-steps-upcoming-border-color, var(--ml-color-border));
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-steps-upcoming-border-color, var(--ml-color-border));
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text, #fff);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text, #fff);
	}

	/* Icons */
	.ml-step__indicator-inner--icons {
		width: var(--ml-steps-icon-indicator-size, 40px);
		height: var(--ml-steps-icon-indicator-size, 40px);
		border-radius: var(--ml-steps-icon-indicator-radius, var(--ml-radius-lg));
		border: var(--ml-steps-indicator-border-width, 2px) solid var(--ml-steps-upcoming-border-color, var(--ml-color-border));
	}

	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-upcoming-border-color, var(--ml-color-border));
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
		color: var(--ml-steps-icon-upcoming-color, var(--ml-color-text-muted));
	}

	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-icon-current-border-color, var(--ml-color-text));
		background-color: var(--ml-steps-upcoming-bg, var(--ml-color-surface));
		color: var(--ml-steps-icon-current-color, var(--ml-color-text));
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
		height: var(--ml-steps-bar-height, 4px);
		border-radius: var(--ml-steps-bar-radius, 2px);
		background-color: var(--ml-steps-bar-color, var(--ml-color-border));
		margin-bottom: var(--ml-steps-track-gap, var(--ml-space-3));
		transition: background-color var(--ml-steps-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
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
		width: var(--ml-steps-bar-height, 4px);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-steps-track-gap, var(--ml-space-3));
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding, var(--ml-space-6));
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
		width: var(--ml-steps-compact-dot-size, 12px);
		height: var(--ml-steps-compact-dot-size, 12px);
		border-radius: 50%;
		background-color: var(--ml-steps-compact-dot-color, var(--ml-color-border));
		transition: background-color var(--ml-steps-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
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
		gap: var(--ml-steps-content-gap, var(--ml-space-1));
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-steps-label-font-family, var(--ml-font-sans));
		font-size: var(--ml-steps-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-steps-label-font-weight, var(--ml-font-medium));
		color: var(--ml-steps-label-color, var(--ml-color-text));
		line-height: var(--ml-steps-label-line-height, var(--ml-leading-tight));
		transition: color var(--ml-steps-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-steps-label-upcoming-color, var(--ml-color-text-secondary));
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-steps-desc-font-family, var(--ml-font-sans));
		font-size: var(--ml-steps-desc-font-size, var(--ml-text-xs));
		color: var(--ml-steps-desc-color, var(--ml-color-text-muted));
		line-height: var(--ml-steps-desc-line-height, var(--ml-leading-normal));
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
		this._routedListenerAttached = false;
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
				Injector.get(RouterService).navigate(href).then((result) => {
					if (result.success) this.activateStep(stepValue);
				});
				return;
			}
			this.activateStep(stepValue);
		};
		this.handleSlottedStepClick = (event) => {
			event.stopPropagation();
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
	syncRoutedListener() {
		if (this.routed === this._routedListenerAttached) return;
		if (this.routed) {
			window.addEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = true;
			this.syncWithRoute();
		} else {
			window.removeEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = false;
		}
	}
	onCreate() {
		this.elementRef.addEventListener("ml:step-click", this.handleSlottedStepClick);
		this.syncRoutedListener();
	}
	onRender() {
		this.syncRoutedListener();
		this.updateSlottedStepStates();
		this.updatePanelVisibility();
	}
	onDestroy() {
		this.elementRef.removeEventListener("ml:step-click", this.handleSlottedStepClick);
		if (this._routedListenerAttached) {
			window.removeEventListener("NavigationEvent", this._handleNavigation);
			this._routedListenerAttached = false;
		}
	}
	activateStep(stepValue) {
		this.active = stepValue;
		this.updateSlottedStepStates();
		this.updatePanelVisibility();
		this.elementRef.dispatchEvent(new CustomEvent("ml:change", {
			bubbles: true,
			composed: true,
			detail: { value: stepValue }
		}));
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
		const activeIndex = allSteps.findIndex((step) => step.value === this.active);
		this._slottedSteps.forEach((step, index) => {
			const status = index < activeIndex ? "completed" : index === activeIndex ? "current" : "upcoming";
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
		const steps = this.getAllSteps();
		this.elementRef.querySelectorAll("ml-step-panel").forEach((panel) => {
			const value = panel.getAttribute("value");
			panel.hidden = !(value === this.active);
			const label = steps.find((s) => s.value === value)?.label;
			if (label) panel.panelLabel = label;
		});
	}
	focusStep(value) {
		const button = (this.elementRef.shadowRoot?.querySelector(".ml-steps__list"))?.querySelector(`[data-value="${value}"]`);
		if (button) {
			button.focus();
			return;
		}
		(this._slottedSteps.find((step) => step.getAttribute("value") === value)?.shadowRoot?.querySelector(".ml-step"))?.focus();
	}
	syncWithRoute() {
		const matchingStep = matchTabByRoute(this.getAllSteps(), window.location.pathname);
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
			@keydown=${(e) => {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		c.handleClick();
	}}
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
			${when(!isCompleted, () => html`<span>${c.stepNumber}</span>`)}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Focus ring
	 * --ml-step-focus-color: var(--ml-color-primary)
	 * --ml-step-focus-radius: var(--ml-radius)
	 *
	 * Disabled state
	 * --ml-step-disabled-opacity: 0.5
	 *
	 * Connector
	 * --ml-step-connector-thickness: 2px
	 * --ml-step-connector-color: var(--ml-color-border)
	 * --ml-step-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Indicator (numbered & circles)
	 * --ml-step-indicator-size: 32px
	 * --ml-step-indicator-border-width: 2px
	 * --ml-step-indicator-font-size: var(--ml-text-sm)
	 * --ml-step-indicator-font-weight: var(--ml-font-medium)
	 * --ml-step-indicator-font-family: var(--ml-font-sans)
	 * --ml-step-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Indicator upcoming
	 * --ml-step-upcoming-border-color: var(--ml-color-border)
	 * --ml-step-upcoming-color: var(--ml-color-text-secondary)
	 * --ml-step-upcoming-bg: var(--ml-color-surface)
	 *
	 * Indicator dot (circles variant)
	 * --ml-step-dot-size: 10px
	 *
	 * Icons variant
	 * --ml-step-icon-indicator-size: 40px
	 * --ml-step-icon-indicator-radius: var(--ml-radius-lg)
	 * --ml-step-icon-upcoming-color: var(--ml-color-text-muted)
	 * --ml-step-icon-current-border-color: var(--ml-color-text)
	 * --ml-step-icon-current-color: var(--ml-color-text)
	 *
	 * Completed indicator text
	 * --ml-step-completed-indicator-text: #fff
	 *
	 * Bar variant
	 * --ml-step-bar-height: 4px
	 * --ml-step-bar-radius: 2px
	 * --ml-step-bar-color: var(--ml-color-border)
	 *
	 * Compact / dots
	 * --ml-step-compact-dot-size: 12px
	 * --ml-step-compact-dot-color: var(--ml-color-border)
	 *
	 * Content spacing
	 * --ml-step-content-gap: var(--ml-space-1)
	 * --ml-step-track-gap: var(--ml-space-3)
	 * --ml-step-vertical-content-padding: var(--ml-space-6)
	 *
	 * Label
	 * --ml-step-label-font-family: var(--ml-font-sans)
	 * --ml-step-label-font-size: var(--ml-text-sm)
	 * --ml-step-label-font-weight: var(--ml-font-medium)
	 * --ml-step-label-color: var(--ml-color-text)
	 * --ml-step-label-line-height: var(--ml-leading-tight)
	 * --ml-step-label-upcoming-color: var(--ml-color-text-secondary)
	 *
	 * Description
	 * --ml-step-desc-font-family: var(--ml-font-sans)
	 * --ml-step-desc-font-size: var(--ml-text-xs)
	 * --ml-step-desc-color: var(--ml-color-text-muted)
	 * --ml-step-desc-line-height: var(--ml-leading-normal)
	 */

	:host {
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
		opacity: var(--ml-step-disabled-opacity, 0.5);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-step-focus-color, var(--ml-color-primary));
		outline-offset: 2px;
		border-radius: var(--ml-step-focus-radius, var(--ml-radius));
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
		margin-bottom: var(--ml-step-track-gap, var(--ml-space-3));
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-step-connector-thickness, 2px);
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
		margin-right: var(--ml-step-track-gap, var(--ml-space-3));
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-step-connector-thickness, 2px);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding, var(--ml-space-6));
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   CONNECTORS
	   ============================================ */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-step-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	/* Solid connector */
	.ml-step__connector--solid {
		background-color: var(--ml-step-connector-color, var(--ml-color-border));
	}

	/* Dotted connector */
	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	/* Horizontal dotted */
	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-step-connector-color, var(--ml-color-border)) 0,
			var(--ml-step-connector-color, var(--ml-color-border)) 4px,
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
			var(--ml-step-connector-color, var(--ml-color-border)) 0,
			var(--ml-step-connector-color, var(--ml-color-border)) 4px,
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
			background-color var(--ml-step-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			border-color var(--ml-step-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-step-indicator-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	/* ============================================
	   NUMBERED VARIANT
	   ============================================ */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-step-indicator-size, 32px);
		height: var(--ml-step-indicator-size, 32px);
		border-radius: 50%;
		font-size: var(--ml-step-indicator-font-size, var(--ml-text-sm));
		font-weight: var(--ml-step-indicator-font-weight, var(--ml-font-medium));
		font-family: var(--ml-step-indicator-font-family, var(--ml-font-sans));
	}

	/* Numbered - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-step-upcoming-border-color, var(--ml-color-border));
		color: var(--ml-step-upcoming-color, var(--ml-color-text-secondary));
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}

	/* Numbered - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}

	/* Numbered - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}

	/* Numbered - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text, #fff);
	}

	/* Numbered - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text, #fff);
	}

	/* ============================================
	   CIRCLES VARIANT
	   ============================================ */
	.ml-step__indicator-inner--circles {
		width: var(--ml-step-indicator-size, 32px);
		height: var(--ml-step-indicator-size, 32px);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-step-dot-size, 10px);
		height: var(--ml-step-dot-size, 10px);
		border-radius: 50%;
		transition: background-color var(--ml-step-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	/* Circles - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-step-upcoming-border-color, var(--ml-color-border));
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-step-upcoming-border-color, var(--ml-color-border));
	}

	/* Circles - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	/* Circles - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	/* Circles - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text, #fff);
	}

	/* Circles - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text, #fff);
	}

	/* ============================================
	   ICONS VARIANT
	   ============================================ */
	.ml-step__indicator-inner--icons {
		width: var(--ml-step-icon-indicator-size, 40px);
		height: var(--ml-step-icon-indicator-size, 40px);
		border-radius: var(--ml-step-icon-indicator-radius, var(--ml-radius-lg));
		border: var(--ml-step-indicator-border-width, 2px) solid var(--ml-step-upcoming-border-color, var(--ml-color-border));
	}

	/* Icons - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-upcoming-border-color, var(--ml-color-border));
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
		color: var(--ml-step-icon-upcoming-color, var(--ml-color-text-muted));
	}

	/* Icons - Current */
	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-icon-current-border-color, var(--ml-color-text));
		background-color: var(--ml-step-upcoming-bg, var(--ml-color-surface));
		color: var(--ml-step-icon-current-color, var(--ml-color-text));
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
		height: var(--ml-step-bar-height, 4px);
		border-radius: var(--ml-step-bar-radius, 2px);
		background-color: var(--ml-step-bar-color, var(--ml-color-border));
		margin-bottom: var(--ml-step-track-gap, var(--ml-space-3));
		transition: background-color var(--ml-step-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
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
		width: var(--ml-step-bar-height, 4px);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-step-track-gap, var(--ml-space-3));
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding, var(--ml-space-6));
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
		width: var(--ml-step-compact-dot-size, 12px);
		height: var(--ml-step-compact-dot-size, 12px);
		border-radius: 50%;
		background-color: var(--ml-step-compact-dot-color, var(--ml-color-border));
		transition: background-color var(--ml-step-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
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
		gap: var(--ml-step-content-gap, var(--ml-space-1));
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-step-label-font-family, var(--ml-font-sans));
		font-size: var(--ml-step-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-step-label-font-weight, var(--ml-font-medium));
		color: var(--ml-step-label-color, var(--ml-color-text));
		line-height: var(--ml-step-label-line-height, var(--ml-leading-tight));
		transition: color var(--ml-step-connector-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-step-label-upcoming-color, var(--ml-color-text-secondary));
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-step-desc-font-family, var(--ml-font-sans));
		font-size: var(--ml-step-desc-font-size, var(--ml-text-xs));
		color: var(--ml-step-desc-color, var(--ml-color-text-muted));
		line-height: var(--ml-step-desc-line-height, var(--ml-leading-normal));
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
		this.stepNumber = "1";
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
		"href",
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
defineLegacyAliases(StepComponent.prototype, "ml-step", { "step-number": "stepNumber" });
function stepPanelTemplate(c) {
	return html`
		<div class="ml-step-panel" role="tabpanel" aria-label=${c.panelLabel || c.value}>
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
		this.panelLabel = "";
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Dialog panel
	 * --ml-dialog-max-width: 500px
	 * --ml-dialog-bg: var(--ml-color-surface)
	 * --ml-dialog-radius: var(--ml-radius-xl)
	 * --ml-dialog-shadow: var(--ml-shadow-xl)
	 * --ml-dialog-transition: var(--ml-transition-normal)
	 *
	 * Backdrop
	 * --ml-dialog-backdrop-color: rgba(0, 0, 0, 0.5)
	 *
	 * Size variants
	 * --ml-dialog-sm-max-width: 400px
	 * --ml-dialog-md-max-width: 500px
	 * --ml-dialog-lg-max-width: 640px
	 * --ml-dialog-xl-max-width: 800px
	 *
	 * Header
	 * --ml-dialog-header-padding: var(--ml-space-6)
	 * --ml-dialog-header-gap: var(--ml-space-4)
	 * --ml-dialog-header-title-font-size: var(--ml-text-lg)
	 * --ml-dialog-header-title-font-weight: var(--ml-font-semibold)
	 * --ml-dialog-header-title-color: var(--ml-color-text)
	 * --ml-dialog-header-title-line-height: var(--ml-leading-tight)
	 * --ml-dialog-header-desc-font-size: var(--ml-text-sm)
	 * --ml-dialog-header-desc-color: var(--ml-color-text-secondary)
	 * --ml-dialog-header-desc-line-height: var(--ml-leading-relaxed)
	 *
	 * Body
	 * --ml-dialog-body-padding: var(--ml-space-6)
	 * --ml-dialog-body-font-size: var(--ml-text-sm)
	 * --ml-dialog-body-color: var(--ml-color-text-secondary)
	 * --ml-dialog-body-line-height: var(--ml-leading-relaxed)
	 *
	 * Footer
	 * --ml-dialog-footer-padding-y: var(--ml-space-4)
	 * --ml-dialog-footer-padding-x: var(--ml-space-6)
	 * --ml-dialog-footer-gap: var(--ml-space-3)
	 * --ml-dialog-footer-border-color: var(--ml-color-border)
	 * --ml-dialog-footer-bg: var(--ml-color-surface)
	 */

	:host {
		display: contents;
	}

	/* Dialog base */
	dialog.ml-dialog {
		position: fixed;
		display: none;
		flex-direction: column;
		width: 100%;
		max-width: var(--ml-dialog-max-width, 500px);
		max-height: calc(100vh - var(--ml-space-8));
		margin: auto;
		padding: 0;
		background-color: var(--ml-dialog-bg, var(--ml-color-surface));
		border: none;
		border-radius: var(--ml-dialog-radius, var(--ml-radius-xl));
		box-shadow: var(--ml-dialog-shadow, var(--ml-shadow-xl));
		outline: none;
		overflow: hidden;
		transform: scale(0.95) translateY(10px);
		opacity: 0;
		transition:
			transform var(--ml-dialog-transition, var(--ml-transition-normal)),
			opacity var(--ml-dialog-transition, var(--ml-transition-normal)),
			overlay var(--ml-dialog-transition, var(--ml-transition-normal)) allow-discrete,
			display var(--ml-dialog-transition, var(--ml-transition-normal)) allow-discrete;
	}

	dialog.ml-dialog[open] {
		display: flex;
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
			background-color var(--ml-dialog-transition, var(--ml-transition-normal)),
			overlay var(--ml-dialog-transition, var(--ml-transition-normal)) allow-discrete,
			display var(--ml-dialog-transition, var(--ml-transition-normal)) allow-discrete;
	}

	dialog.ml-dialog[open]::backdrop {
		background-color: var(--ml-dialog-backdrop-color, rgba(0, 0, 0, 0.5));
	}

	@starting-style {
		dialog.ml-dialog[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Size variants */
	dialog.ml-dialog--sm {
		max-width: var(--ml-dialog-sm-max-width, 400px);
	}

	dialog.ml-dialog--md {
		max-width: var(--ml-dialog-md-max-width, 500px);
	}

	dialog.ml-dialog--lg {
		max-width: var(--ml-dialog-lg-max-width, 640px);
	}

	dialog.ml-dialog--xl {
		max-width: var(--ml-dialog-xl-max-width, 800px);
	}

	dialog.ml-dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Header */
	.ml-dialog-header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-dialog-header-gap, var(--ml-space-4));
		padding: var(--ml-dialog-header-padding, var(--ml-space-6));
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
		font-size: var(--ml-dialog-header-title-font-size, var(--ml-text-lg));
		font-weight: var(--ml-dialog-header-title-font-weight, var(--ml-font-semibold));
		color: var(--ml-dialog-header-title-color, var(--ml-color-text));
		line-height: var(--ml-dialog-header-title-line-height, var(--ml-leading-tight));
	}

	.ml-dialog-header ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-dialog-header-desc-font-size, var(--ml-text-sm));
		color: var(--ml-dialog-header-desc-color, var(--ml-color-text-secondary));
		line-height: var(--ml-dialog-header-desc-line-height, var(--ml-leading-relaxed));
	}

	/* Body */
	.ml-dialog-body {
		flex: 1 1 auto;
		padding: var(--ml-dialog-body-padding, var(--ml-space-6));
		overflow-y: auto;
		font-size: var(--ml-dialog-body-font-size, var(--ml-text-sm));
		color: var(--ml-dialog-body-color, var(--ml-color-text-secondary));
		line-height: var(--ml-dialog-body-line-height, var(--ml-leading-relaxed));
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
		gap: var(--ml-dialog-footer-gap, var(--ml-space-3));
		padding: var(--ml-dialog-footer-padding-y, var(--ml-space-4)) var(--ml-dialog-footer-padding-x, var(--ml-space-6));
		border-top: 1px solid var(--ml-dialog-footer-border-color, var(--ml-color-border));
		background-color: var(--ml-dialog-footer-bg, var(--ml-color-surface));
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
var RUNAWAY_CALLBACK_COUNT = 20;
var DialogRef = class {
	constructor(_dialogID, _dialogEl) {
		this._dialogID = _dialogID;
		this._dialogEl = _dialogEl;
		this._afterOpenedCallbacks = [];
		this._afterClosedCallbacks = [];
		this._disableClose = false;
		this._closeNotified = false;
		this._popoversDismissed = false;
		this._handleCancel = this.onCancel.bind(this);
		this._handleBackdropClick = this.onBackdropClick.bind(this);
		this._handleClose = this.onClose.bind(this);
		this._dialogEl.addEventListener("cancel", this._handleCancel);
		this._dialogEl.addEventListener("click", this._handleBackdropClick);
		this._dialogEl.addEventListener("close", this._handleClose);
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
		this._closeNotified = false;
		this._popoversDismissed = false;
		this._pendingResult = void 0;
		this._dialogEl.showModal();
		this._afterOpenedCallbacks.forEach((callback) => callback());
		this._dialogEl.dispatchEvent(new CustomEvent("ml:open", {
			bubbles: true,
			composed: true
		}));
	}
	close(result) {
		this._pendingResult = result;
		this._dismissDescendantPopovers(this._dialogEl);
		this._popoversDismissed = true;
		this._dialogEl.close();
		this.notifyClosed();
	}
	afterOpened(callback) {
		this._afterOpenedCallbacks.push(callback);
		this.warnOnRunawayCallbacks("afterOpened", this._afterOpenedCallbacks.length);
		return () => {
			this._afterOpenedCallbacks = this._afterOpenedCallbacks.filter((entry) => entry !== callback);
		};
	}
	afterClosed(callback) {
		this._afterClosedCallbacks.push(callback);
		this.warnOnRunawayCallbacks("afterClosed", this._afterClosedCallbacks.length);
		return () => {
			this._afterClosedCallbacks = this._afterClosedCallbacks.filter((entry) => entry !== callback);
		};
	}
	warnOnRunawayCallbacks(method, count) {
		if (count !== RUNAWAY_CALLBACK_COUNT) return;
		devWarn(`dialog-ref-callbacks:${method}`, `DialogRef.${method}() has ${count} registered callbacks on one dialog. They all run on every open/close. If you are registering inside the code that opens the dialog, call the unsubscribe function it returns (or register once, outside).`);
	}
	onCancel(event) {
		if (this._disableClose) event.preventDefault();
	}
	onBackdropClick(event) {
		if (event.target === this._dialogEl && !this._disableClose) this.close();
	}
	onClose() {
		this.notifyClosed();
	}
	notifyClosed() {
		if (this._closeNotified) return;
		this._closeNotified = true;
		if (!this._popoversDismissed) this._dismissDescendantPopovers(this._dialogEl);
		this._popoversDismissed = false;
		const result = this._pendingResult;
		this._pendingResult = void 0;
		this._afterClosedCallbacks.forEach((callback) => callback(result));
		this._dialogEl.dispatchEvent(new CustomEvent("ml:close", {
			bubbles: true,
			composed: true,
			detail: { result }
		}));
	}
	_dismissDescendantPopovers(root) {
		root.querySelectorAll("*").forEach((el) => {
			if (el.hasAttribute("popover")) try {
				el.hidePopover();
			} catch {}
			if (el.shadowRoot) this._dismissDescendantPopovers(el.shadowRoot);
		});
	}
};
var DialogService = class DialogService$1 {
	constructor() {
		this._dialogs = /* @__PURE__ */ new Map();
	}
	addDialog(dialogID, dialogEl) {
		const previous = this._dialogs.get(dialogID);
		if (previous) previous.dialogEl.removeEventListener("close", previous.closeListener);
		const dialogRef = new DialogRef(dialogID, dialogEl);
		const closeListener = () => {
			const elements = this._dialogs.get(dialogID);
			this.cleanUpDialog(dialogID, elements?.dialogComponent);
		};
		this._dialogs.set(dialogID, {
			dialogRef,
			dialogEl,
			dialogComponent: void 0,
			closeListener
		});
		dialogEl.addEventListener("close", closeListener);
		return dialogRef;
	}
	removeDialog(dialogID, dialogEl) {
		const elements = this._dialogs.get(dialogID);
		if (!elements) return;
		if (dialogEl && elements.dialogEl !== dialogEl) return;
		elements.dialogEl.removeEventListener("close", elements.closeListener);
		this._dialogs.delete(dialogID);
	}
	open(dialogComponentOrID, config) {
		let dialogID = dialogComponentOrID;
		let dialogComponent;
		if (typeof dialogComponentOrID !== "string") {
			const mounted = this.mountDialog(dialogComponentOrID);
			const dialogEl = (mounted.shadowRoot?.querySelector("ml-dialog") ?? null)?.shadowRoot?.querySelector("dialog") ?? null;
			if (!dialogEl) {
				console.warn(`[DialogService] Component "${dialogComponentOrID.selector}" did not render an <ml-dialog>; cannot open.`);
				this.unmountDialog(mounted);
				return;
			}
			dialogID = dialogEl.id;
			dialogComponent = mounted;
		}
		const dialogElements = this._dialogs.get(dialogID);
		if (!dialogElements) {
			console.warn(`[DialogService] No dialog registered with id "${dialogID}"; open() ignored.`);
			if (dialogComponent) this.unmountDialog(dialogComponent);
			return;
		}
		if (dialogComponent) {
			dialogElements.dialogComponent = dialogComponent;
			if (config) dialogElements.dialogRef.applyConfig(config);
			dialogComponent.component.onDialogRefSet?.(dialogElements.dialogRef);
		}
		dialogElements.dialogRef.open();
		return dialogElements.dialogRef;
	}
	close(dialogID, result) {
		const dialogElements = this._dialogs.get(dialogID);
		if (!dialogElements) {
			console.warn(`[DialogService] No dialog registered with id "${dialogID}"; close() ignored.`);
			return;
		}
		dialogElements.dialogRef.close(result);
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
		if (!this._registered) return;
		this._dialogService.removeDialog(this._dialogID, this._dialogEl);
	}
	open() {
		this.registerDialog();
		if (!this._dialogRef) {
			console.warn("[ml-dialog] Cannot open: dialog element is not rendered yet.");
			return;
		}
		this._dialogRef.open();
	}
	close(result) {
		this._dialogRef?.close(result);
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Backdrop
	 * --ml-drawer-backdrop-color: rgba(0, 0, 0, 0.5)
	 * --ml-drawer-backdrop-transition: var(--ml-duration-300) var(--ml-ease-out)
	 *
	 * Panel
	 * --ml-drawer-bg: var(--ml-color-surface)
	 * --ml-drawer-shadow: var(--ml-shadow-xl)
	 *
	 * Size variants
	 * --ml-drawer-sm-width: 320px
	 * --ml-drawer-md-width: 480px
	 * --ml-drawer-lg-width: 640px
	 * --ml-drawer-xl-width: 800px
	 *
	 * Header
	 * --ml-drawer-header-padding: var(--ml-space-6)
	 * --ml-drawer-header-gap: var(--ml-space-4)
	 * --ml-drawer-header-title-font-size: var(--ml-text-lg)
	 * --ml-drawer-header-title-font-weight: var(--ml-font-semibold)
	 * --ml-drawer-header-title-color: var(--ml-color-text)
	 * --ml-drawer-header-title-line-height: var(--ml-leading-tight)
	 * --ml-drawer-header-desc-font-size: var(--ml-text-sm)
	 * --ml-drawer-header-desc-color: var(--ml-color-text-secondary)
	 *
	 * Close button
	 * --ml-drawer-close-size: 32px
	 * --ml-drawer-close-radius: var(--ml-radius-md)
	 * --ml-drawer-close-color: var(--ml-color-text-tertiary)
	 * --ml-drawer-close-hover-bg: var(--ml-color-surface-hover)
	 * --ml-drawer-close-hover-color: var(--ml-color-text)
	 * --ml-drawer-close-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Body
	 * --ml-drawer-body-padding: var(--ml-space-6)
	 * --ml-drawer-body-font-size: var(--ml-text-sm)
	 * --ml-drawer-body-color: var(--ml-color-text-secondary)
	 * --ml-drawer-body-line-height: var(--ml-leading-relaxed)
	 *
	 * Footer
	 * --ml-drawer-footer-padding-y: var(--ml-space-4)
	 * --ml-drawer-footer-padding-x: var(--ml-space-6)
	 * --ml-drawer-footer-gap: var(--ml-space-3)
	 * --ml-drawer-footer-border-color: var(--ml-color-border)
	 */

	:host {
		/* Slide animation (read by the component for the panel animation) */
		--ml-drawer-transition-duration: var(--ml-duration-300);
		--ml-drawer-transition-easing: cubic-bezier(0.16, 1, 0.3, 1);

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
			background-color var(--ml-drawer-backdrop-transition, var(--ml-duration-300) var(--ml-ease-out)),
			overlay var(--ml-drawer-backdrop-transition, var(--ml-duration-300) var(--ml-ease-out)) allow-discrete,
			display var(--ml-drawer-backdrop-transition, var(--ml-duration-300) var(--ml-ease-out)) allow-discrete;
	}

	dialog.ml-drawer[open]::backdrop {
		background-color: var(--ml-drawer-backdrop-color, rgba(0, 0, 0, 0.5));
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
		background-color: var(--ml-drawer-bg, var(--ml-color-surface));
		box-shadow: var(--ml-drawer-shadow, var(--ml-shadow-xl));
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
		width: var(--ml-drawer-sm-width, 320px);
	}

	.ml-drawer--md .ml-drawer__panel {
		width: var(--ml-drawer-md-width, 480px);
	}

	.ml-drawer--lg .ml-drawer__panel {
		width: var(--ml-drawer-lg-width, 640px);
	}

	.ml-drawer--xl .ml-drawer__panel {
		width: var(--ml-drawer-xl-width, 800px);
	}

	/* Header */
	.ml-drawer__header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-drawer-header-gap, var(--ml-space-4));
		padding: var(--ml-drawer-header-padding, var(--ml-space-6));
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
		font-size: var(--ml-drawer-header-title-font-size, var(--ml-text-lg));
		font-weight: var(--ml-drawer-header-title-font-weight, var(--ml-font-semibold));
		color: var(--ml-drawer-header-title-color, var(--ml-color-text));
		line-height: var(--ml-drawer-header-title-line-height, var(--ml-leading-tight));
	}

	.ml-drawer__header-content ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-drawer-header-desc-font-size, var(--ml-text-sm));
		color: var(--ml-drawer-header-desc-color, var(--ml-color-text-secondary));
	}

	.ml-drawer__close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-drawer-close-size, 32px);
		height: var(--ml-drawer-close-size, 32px);
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-drawer-close-radius, var(--ml-radius-md));
		cursor: pointer;
		color: var(--ml-drawer-close-color, var(--ml-color-text-tertiary));
		transition:
			background-color var(--ml-drawer-close-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-drawer-close-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-drawer__close:hover {
		background-color: var(--ml-drawer-close-hover-bg, var(--ml-color-surface-hover));
		color: var(--ml-drawer-close-hover-color, var(--ml-color-text));
	}

	/* Body */
	.ml-drawer__body {
		flex: 1;
		padding: var(--ml-drawer-body-padding, var(--ml-space-6));
		overflow-y: auto;
		font-size: var(--ml-drawer-body-font-size, var(--ml-text-sm));
		color: var(--ml-drawer-body-color, var(--ml-color-text-secondary));
		line-height: var(--ml-drawer-body-line-height, var(--ml-leading-relaxed));
	}

	/* Footer */
	.ml-drawer__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-drawer-footer-gap, var(--ml-space-3));
		padding: var(--ml-drawer-footer-padding-y, var(--ml-space-4)) var(--ml-drawer-footer-padding-x, var(--ml-space-6));
		border-top: 1px solid var(--ml-drawer-footer-border-color, var(--ml-color-border));
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
			const { duration, easing } = this.getAnimationTiming();
			const anim = this._panelEl.animate([{ [prop]: "0px" }, { [prop]: `${-width}px` }], {
				duration,
				easing,
				fill: "forwards"
			});
			anim.onfinish = () => {
				this._panelEl.style[prop] = "";
				this._dialogEl.close();
				this.elementRef.dispatchEvent(new CustomEvent("ml:closed", {
					bubbles: true,
					composed: true
				}));
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
	getAnimationTiming() {
		const styles = getComputedStyle(this._panelEl);
		const rawDuration = styles.getPropertyValue("--ml-drawer-transition-duration").trim();
		const rawEasing = styles.getPropertyValue("--ml-drawer-transition-easing").trim();
		let duration = NaN;
		if (rawDuration.endsWith("ms")) duration = Number.parseFloat(rawDuration);
		else if (rawDuration.endsWith("s")) duration = Number.parseFloat(rawDuration) * 1e3;
		if (!Number.isFinite(duration)) duration = 300;
		return {
			duration,
			easing: rawEasing || "cubic-bezier(0.16, 1, 0.3, 1)"
		};
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
		const { duration, easing } = this.getAnimationTiming();
		this._panelEl.style[prop] = `${-width}px`;
		this._panelEl.getBoundingClientRect();
		const anim = this._panelEl.animate([{ [prop]: `${-width}px` }, { [prop]: "0px" }], {
			duration,
			easing,
			fill: "forwards"
		});
		anim.onfinish = () => {
			this._panelEl.style[prop] = "0px";
			this.elementRef.dispatchEvent(new CustomEvent("ml:opened", {
				bubbles: true,
				composed: true
			}));
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Menu
	 * --ml-dropdown-padding: var(--ml-space-1)
	 * --ml-dropdown-border-color: var(--ml-color-border)
	 * --ml-dropdown-radius: var(--ml-radius-lg)
	 * --ml-dropdown-bg: var(--ml-color-surface)
	 * --ml-dropdown-color: var(--ml-color-text)
	 * --ml-dropdown-shadow: var(--ml-shadow-lg)
	 * --ml-dropdown-min-width: 180px
	 * --ml-dropdown-transition: var(--ml-duration-150) var(--ml-ease-out)
	 *
	 * Arrow
	 * --ml-dropdown-arrow-size: 8px
	 * --ml-dropdown-arrow-bg: var(--ml-color-surface)
	 * --ml-dropdown-arrow-border-color: var(--ml-color-border)
	 */

	:host {
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
		padding: var(--ml-dropdown-padding, var(--ml-space-1));
		border: 1px solid var(--ml-dropdown-border-color, var(--ml-color-border));
		border-radius: var(--ml-dropdown-radius, var(--ml-radius-lg));
		background-color: var(--ml-dropdown-bg, var(--ml-color-surface));
		color: var(--ml-dropdown-color, var(--ml-color-text));
		box-shadow: var(--ml-dropdown-shadow, var(--ml-shadow-lg));
		min-width: var(--ml-dropdown-min-width, 180px);
		overflow: visible;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-dropdown-transition, var(--ml-duration-150) var(--ml-ease-out)),
			transform var(--ml-dropdown-transition, var(--ml-duration-150) var(--ml-ease-out)),
			overlay var(--ml-dropdown-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete,
			display var(--ml-dropdown-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete;
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
		width: var(--ml-dropdown-arrow-size, 8px);
		height: var(--ml-dropdown-arrow-size, 8px);
		background-color: var(--ml-dropdown-arrow-bg, var(--ml-color-surface));
		border: 1px solid var(--ml-dropdown-arrow-border-color, var(--ml-color-border));
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
		this._positioner = new OverlayPositioner(() => ({
			placement: this.placement,
			offset: this.offset,
			arrowElement: this.arrow ? this.elementRef.shadowRoot?.querySelector(".ml-dropdown__arrow") : null,
			placementAttribute: true
		}));
		this._dismissGuard = new ToggleDismissGuard();
		this._restoreFocusOnClose = false;
		this.toggle = () => {
			if (this._dismissGuard.shouldSkipToggle()) return;
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
				this._dismissGuard.dismissed();
				const shouldRestoreFocus = this._restoreFocusOnClose || isDeepFocusWithin(this.elementRef);
				this._restoreFocusOnClose = false;
				this.clearFocus();
				this._positioner.stop();
				if (shouldRestoreFocus) this.returnFocusToTrigger();
				this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
					bubbles: true,
					composed: true
				}));
			}
			this.syncTriggerAria();
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
						if (!item.disabled) {
							this._restoreFocusOnClose = true;
							(item.component ?? item).handleClick();
						}
					}
					break;
				case "Escape":
					event.preventDefault();
					this._restoreFocusOnClose = true;
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
		this.syncTriggerAria = () => {
			const control = this.getTriggerControl();
			if (!control) return;
			control.setAttribute("aria-haspopup", "menu");
			control.setAttribute("aria-expanded", String(this.isOpen));
		};
	}
	onCreate() {
		const menuEl = this.getMenuEl();
		if (menuEl) menuEl.addEventListener("toggle", this.handleToggle);
		this.elementRef.addEventListener("ml:item-select", this.handleItemSelect);
		this.elementRef.addEventListener("keydown", this.handleKeyDown);
		this.elementRef.shadowRoot?.addEventListener("slotchange", this.syncTriggerAria);
		this.syncTriggerAria();
	}
	onDestroy() {
		this._positioner.stop();
		const menuEl = this.getMenuEl();
		if (menuEl) menuEl.removeEventListener("toggle", this.handleToggle);
		this.elementRef.removeEventListener("ml:item-select", this.handleItemSelect);
		this.elementRef.removeEventListener("keydown", this.handleKeyDown);
		this.elementRef.shadowRoot?.removeEventListener("slotchange", this.syncTriggerAria);
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
		const control = this.getTriggerControl();
		if (control) setCrossRootActiveDescendant(control, items[index]);
	}
	clearFocus() {
		const items = this.getNavigableItems();
		for (const item of items) item.focused = false;
		this._focusedIndex = -1;
		const control = this.getTriggerControl();
		if (control) setCrossRootActiveDescendant(control, null);
	}
	findFirstEnabled(items) {
		return items.findIndex((item) => !item.disabled);
	}
	findLastEnabled(items) {
		for (let i = items.length - 1; i >= 0; i--) if (!items[i].disabled) return i;
		return -1;
	}
	returnFocusToTrigger() {
		(this.getTriggerControl() ?? this.getAssignedTrigger())?.focus();
	}
	getAssignedTrigger() {
		return ((this.elementRef.shadowRoot?.querySelector("slot[name=\"trigger\"]"))?.assignedElements() ?? [])[0] ?? null;
	}
	getTriggerControl() {
		const trigger = this.getAssignedTrigger();
		return trigger ? getFocusableControl(trigger) : null;
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const menuEl = this.getMenuEl();
		if (!triggerEl || !menuEl) return;
		this._positioner.start(triggerEl, menuEl);
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
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon class="ml-dropdown-item__icon" icon=${c.icon} size="sm"></ml-icon>`)}
			<span class="ml-dropdown-item__label"><slot></slot></span>
			${when(!!c.addon, () => html`<span class="ml-dropdown-item__addon">${c.addon}</span>`)}
		</div>
	`;
}
const dropdownItemStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Item base
	 * --ml-dropdown-item-gap: var(--ml-space-2)
	 * --ml-dropdown-item-padding: var(--ml-space-2)
	 * --ml-dropdown-item-radius: var(--ml-radius-md)
	 * --ml-dropdown-item-font-size: 14px
	 * --ml-dropdown-item-line-height: 20px
	 * --ml-dropdown-item-color: var(--ml-color-text)
	 * --ml-dropdown-item-transition: var(--ml-duration-100) var(--ml-ease-out)
	 *
	 * Item hover/focused
	 * --ml-dropdown-item-hover-bg: var(--ml-color-surface-hover)
	 *
	 * Item disabled
	 * --ml-dropdown-item-disabled-opacity: 0.5
	 *
	 * Item destructive
	 * --ml-dropdown-item-destructive-color: var(--ml-color-error)
	 * --ml-dropdown-item-destructive-hover-bg: var(--ml-color-error-subtle)
	 *
	 * Icon
	 * --ml-dropdown-item-icon-color: var(--ml-color-text-secondary)
	 *
	 * Addon (shortcut text)
	 * --ml-dropdown-item-addon-font-size: 12px
	 * --ml-dropdown-item-addon-color: var(--ml-color-text-tertiary)
	 */

	:host {
		display: block;
	}

	.ml-dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--ml-dropdown-item-gap, var(--ml-space-2));
		padding: var(--ml-dropdown-item-padding, var(--ml-space-2)) var(--ml-dropdown-item-padding, var(--ml-space-2));
		border-radius: var(--ml-dropdown-item-radius, var(--ml-radius-md));
		font-size: var(--ml-dropdown-item-font-size, 14px);
		line-height: var(--ml-dropdown-item-line-height, 20px);
		color: var(--ml-dropdown-item-color, var(--ml-color-text));
		cursor: pointer;
		user-select: none;
		transition: background-color var(--ml-dropdown-item-transition, var(--ml-duration-100) var(--ml-ease-out));
	}

	.ml-dropdown-item:hover {
		background-color: var(--ml-dropdown-item-hover-bg, var(--ml-color-surface-hover));
	}

	.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-hover-bg, var(--ml-color-surface-hover));
	}

	.ml-dropdown-item--disabled {
		opacity: var(--ml-dropdown-item-disabled-opacity, 0.5);
		cursor: not-allowed;
	}

	.ml-dropdown-item--disabled:hover {
		background-color: transparent;
	}

	.ml-dropdown-item--destructive {
		color: var(--ml-dropdown-item-destructive-color, var(--ml-color-error));
	}

	.ml-dropdown-item--destructive:hover {
		background-color: var(--ml-dropdown-item-destructive-hover-bg, var(--ml-color-error-subtle));
	}

	.ml-dropdown-item--destructive.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-destructive-hover-bg, var(--ml-color-error-subtle));
	}

	.ml-dropdown-item__icon {
		flex-shrink: 0;
		color: var(--ml-dropdown-item-icon-color, var(--ml-color-text-secondary));
	}

	.ml-dropdown-item--destructive .ml-dropdown-item__icon {
		color: var(--ml-dropdown-item-destructive-color, var(--ml-color-error));
	}

	.ml-dropdown-item__label {
		flex: 1;
		min-width: 0;
	}

	.ml-dropdown-item__addon {
		flex-shrink: 0;
		font-size: var(--ml-dropdown-item-addon-font-size, 12px);
		color: var(--ml-dropdown-item-addon-color, var(--ml-color-text-tertiary));
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
	onCreate() {
		if (!this.elementRef.id) this.elementRef.id = newID();
		this.elementRef.setAttribute("role", "menuitem");
		this.elementRef.setAttribute("tabindex", "-1");
		this.syncHostAria();
	}
	onRender() {
		this.syncHostAria();
	}
	syncHostAria() {
		this.elementRef.setAttribute("aria-disabled", String(this.disabled));
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Content panel
	 * --ml-popover-padding-y: var(--ml-space-3)
	 * --ml-popover-padding-x: var(--ml-space-4)
	 * --ml-popover-border-color: var(--ml-color-border)
	 * --ml-popover-radius: var(--ml-radius-lg)
	 * --ml-popover-bg: var(--ml-color-surface)
	 * --ml-popover-color: var(--ml-color-text)
	 * --ml-popover-shadow: var(--ml-shadow-lg)
	 * --ml-popover-content-overflow: visible
	 * --ml-popover-transition: var(--ml-duration-150) var(--ml-ease-out)
	 *
	 * Arrow
	 * --ml-popover-arrow-size: 8px
	 * --ml-popover-arrow-bg: var(--ml-color-surface)
	 * --ml-popover-arrow-border-color: var(--ml-color-border)
	 */

	:host {
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
		padding: var(--ml-popover-padding-y, var(--ml-space-3)) var(--ml-popover-padding-x, var(--ml-space-4));
		border: 1px solid var(--ml-popover-border-color, var(--ml-color-border));
		border-radius: var(--ml-popover-radius, var(--ml-radius-lg));
		background-color: var(--ml-popover-bg, var(--ml-color-surface));
		color: var(--ml-popover-color, var(--ml-color-text));
		box-shadow: var(--ml-popover-shadow, var(--ml-shadow-lg));
		overflow: var(--ml-popover-content-overflow, visible);
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)),
			transform var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)),
			overlay var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete,
			display var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete;
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
		width: var(--ml-popover-arrow-size, 8px);
		height: var(--ml-popover-arrow-size, 8px);
		background-color: var(--ml-popover-arrow-bg, var(--ml-color-surface));
		border: 1px solid var(--ml-popover-arrow-border-color, var(--ml-color-border));
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
		this._positioner = new OverlayPositioner(() => ({
			placement: this.placement,
			offset: this.offset,
			arrowElement: this.arrow ? this.elementRef.shadowRoot?.querySelector(".ml-popover__arrow") : null,
			placementAttribute: true
		}));
		this._focusTrap = null;
		this._dismissGuard = new ToggleDismissGuard();
		this.handleKeyDown = (event) => {
			if (event.key !== "Escape" || !this.isOpen || !this.manual) return;
			event.preventDefault();
			event.stopPropagation();
			this.close();
		};
		this.toggle = () => {
			if (this._dismissGuard.shouldSkipToggle()) return;
			const popoverEl = this.getPopoverEl();
			if (popoverEl) popoverEl.togglePopover();
		};
		this.handleToggle = (event) => {
			if (event.newState === "open") {
				this.isOpen = true;
				this.startPositioning();
				this.activateFocusTrap();
				this.elementRef.dispatchEvent(new CustomEvent("ml:open", {
					bubbles: true,
					composed: true
				}));
			} else {
				this.isOpen = false;
				this._dismissGuard.dismissed();
				this._positioner.stop();
				this._focusTrap?.deactivate({ returnFocus: isDeepFocusWithin(this.elementRef) });
				this._focusTrap = null;
				this.elementRef.dispatchEvent(new CustomEvent("ml:close", {
					bubbles: true,
					composed: true
				}));
			}
		};
	}
	onCreate() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener("toggle", this.handleToggle);
			popoverEl.addEventListener("keydown", this.handleKeyDown);
		}
	}
	onDestroy() {
		this._positioner.stop();
		this._focusTrap?.deactivate({ returnFocus: false });
		this._focusTrap = null;
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.removeEventListener("toggle", this.handleToggle);
			popoverEl.removeEventListener("keydown", this.handleKeyDown);
		}
	}
	open() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && !this.isOpen) popoverEl.showPopover();
	}
	close() {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) popoverEl.hidePopover();
	}
	activateFocusTrap() {
		const popoverEl = this.getPopoverEl();
		if (!popoverEl) return;
		this._focusTrap?.deactivate({ returnFocus: false });
		this._focusTrap = createFocusTrap(popoverEl);
		this._focusTrap.activate();
	}
	startPositioning() {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;
		this._positioner.start(triggerEl, popoverEl);
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
	const sidebarRight = c.sidebarPosition === "right";
	const collapsed = c.sidebarCollapsed;
	const headerFixed = c.headerFixed;
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
			@keydown=${c.handleKeyDown}
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
				id="app-shell-sidebar"
				class=${classMap({
		"ml-app-shell__sidebar": true,
		"ml-app-shell__sidebar--mobile-open": mobileOpen
	})}
				aria-hidden=${isMobile && !mobileOpen ? "true" : "false"}
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
							aria-expanded=${mobileOpen ? "true" : "false"}
							aria-controls="app-shell-sidebar"
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Border
	 * --ml-app-shell-border-width: var(--ml-border)
	 * --ml-app-shell-border-color: var(--ml-color-border)
	 *
	 * Header
	 * --ml-app-shell-header-bg: var(--ml-color-surface)
	 *
	 * Mobile sidebar
	 * --ml-app-shell-sidebar-width: var(--ml-sidebar-width, 280px)
	 * --ml-app-shell-sidebar-collapsed-width: var(--ml-sidebar-collapsed-width, 64px)
	 * --ml-app-shell-sidebar-bg: var(--ml-color-surface)
	 * --ml-app-shell-sidebar-transition: var(--ml-duration-200)
	 *
	 * Backdrop
	 * --ml-app-shell-backdrop-bg: rgba(0, 0, 0, 0.4)
	 * --ml-app-shell-backdrop-transition: var(--ml-duration-200)
	 *
	 * Menu button
	 * --ml-app-shell-menu-btn-size: 36px
	 * --ml-app-shell-menu-btn-margin: var(--ml-space-3)
	 * --ml-app-shell-menu-btn-radius: var(--ml-radius)
	 * --ml-app-shell-menu-btn-color: var(--ml-color-text-secondary)
	 * --ml-app-shell-menu-btn-hover-bg: var(--ml-color-surface-secondary)
	 * --ml-app-shell-menu-btn-hover-color: var(--ml-color-text)
	 * --ml-app-shell-menu-btn-focus-color: var(--ml-color-primary)
	 * --ml-app-shell-menu-btn-transition: var(--ml-duration-150)
	 *
	 * Scrollbar
	 * --ml-app-shell-scrollbar-width: 6px
	 * --ml-app-shell-scrollbar-thumb-color: var(--ml-color-border)
	 * --ml-app-shell-scrollbar-thumb-radius: var(--ml-radius-full)
	 */

	:host {
		display: block;
		height: 100%;

		/* Viewport width below which the sidebar becomes a drawer. Kept in one
		   place so the CSS media query and the component's matchMedia agree. */
		--ml-app-shell-mobile-breakpoint: 768px;
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

	/*
	 * Collapsed sidebar: narrow the sidebar column to an icon rail. This
	 * modifier class was rendered but had no rules at all, so the documented
	 * icon-only collapse did nothing.
	 */
	.ml-app-shell--sidebar-collapsed .ml-app-shell__sidebar {
		width: var(--ml-app-shell-sidebar-collapsed-width, var(--ml-sidebar-collapsed-width, 64px));
		min-width: var(--ml-app-shell-sidebar-collapsed-width, var(--ml-sidebar-collapsed-width, 64px));
		transition: width var(--ml-app-shell-sidebar-transition, var(--ml-duration-200)) var(--ml-ease-in-out);
	}

	/* Sidebar on the right */
	.ml-app-shell--sidebar-right {
		grid-template-columns: 1fr auto;
	}

	.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
		order: 2;
		border-left: var(--ml-app-shell-border-width, var(--ml-border)) solid var(--ml-app-shell-border-color, var(--ml-color-border));
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
		border-right: var(--ml-app-shell-border-width, var(--ml-border)) solid var(--ml-app-shell-border-color, var(--ml-color-border));
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
		border-bottom: var(--ml-app-shell-border-width, var(--ml-border)) solid var(--ml-app-shell-border-color, var(--ml-color-border));
		background-color: var(--ml-app-shell-header-bg, var(--ml-color-surface));
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
		width: var(--ml-app-shell-scrollbar-width, 6px);
	}

	.ml-app-shell__content::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-app-shell__content::-webkit-scrollbar-thumb {
		background-color: var(--ml-app-shell-scrollbar-thumb-color, var(--ml-color-border));
		border-radius: var(--ml-app-shell-scrollbar-thumb-radius, var(--ml-radius-full));
	}

	/* ============================================
	   MOBILE MENU BUTTON
	   ============================================ */
	.ml-app-shell__menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-app-shell-menu-btn-size, 36px);
		height: var(--ml-app-shell-menu-btn-size, 36px);
		margin-left: var(--ml-app-shell-menu-btn-margin, var(--ml-space-3));
		padding: 0;
		border: none;
		border-radius: var(--ml-app-shell-menu-btn-radius, var(--ml-radius));
		background: transparent;
		color: var(--ml-app-shell-menu-btn-color, var(--ml-color-text-secondary));
		cursor: pointer;
		transition: background-color var(--ml-app-shell-menu-btn-transition, var(--ml-duration-150)) var(--ml-ease-in-out);
	}

	.ml-app-shell__menu-btn:hover {
		background-color: var(--ml-app-shell-menu-btn-hover-bg, var(--ml-color-surface-secondary));
		color: var(--ml-app-shell-menu-btn-hover-color, var(--ml-color-text));
	}

	.ml-app-shell__menu-btn:focus-visible {
		outline: 2px solid var(--ml-app-shell-menu-btn-focus-color, var(--ml-color-primary));
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
			width: var(--ml-app-shell-sidebar-width, var(--ml-sidebar-width, 280px));
			transform: translateX(-100%);
			transition: transform var(--ml-app-shell-sidebar-transition, var(--ml-duration-200)) var(--ml-ease-in-out);
			border-right: var(--ml-app-shell-border-width, var(--ml-border)) solid var(--ml-app-shell-border-color, var(--ml-color-border));
			background-color: var(--ml-app-shell-sidebar-bg, var(--ml-color-surface));
		}

		.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
			left: auto;
			right: 0;
			transform: translateX(100%);
			border-left: var(--ml-app-shell-border-width, var(--ml-border)) solid var(--ml-app-shell-border-color, var(--ml-color-border));
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
			background-color: var(--ml-app-shell-backdrop-bg, rgba(0, 0, 0, 0.4));
			opacity: 0;
			pointer-events: none;
			transition: opacity var(--ml-app-shell-backdrop-transition, var(--ml-duration-200)) var(--ml-ease-in-out);
		}

		.ml-app-shell__backdrop--visible {
			opacity: 1;
			pointer-events: auto;
		}
	}
`;
var AppShellComponent = class AppShellComponent$1 {
	constructor() {
		this.sidebarPosition = "left";
		this.sidebarCollapsed = false;
		this.headerFixed = false;
		this.mobile = false;
		this.mobileOpen = false;
		this._mediaQuery = null;
		this._handleMediaChange = this.onMediaChange.bind(this);
		this.toggleMobileSidebar = () => {
			this.mobileOpen = !this.mobileOpen;
			if (this.mobileOpen) queueMicrotask(() => {
				const sidebar = this.elementRef.shadowRoot?.querySelector(".ml-app-shell__sidebar");
				focusFirst(sidebar ?? this.elementRef);
			});
			else this.focusMenuButton();
		};
		this.closeMobileSidebar = () => {
			if (!this.mobileOpen) return;
			this.mobileOpen = false;
			this.focusMenuButton();
		};
		this.handleKeyDown = (event) => {
			if (event.key === "Escape" && this.mobileOpen) {
				event.preventDefault();
				this.closeMobileSidebar();
			}
		};
	}
	get mobileBreakpoint() {
		return getComputedStyle(this.elementRef).getPropertyValue("--ml-app-shell-mobile-breakpoint").trim() || "768px";
	}
	onCreate() {
		this._mediaQuery = window.matchMedia(`(min-width: ${this.mobileBreakpoint})`);
		this._mediaQuery.addEventListener("change", this._handleMediaChange);
		this.mobile = !this._mediaQuery.matches;
	}
	onDestroy() {
		this._mediaQuery?.removeEventListener("change", this._handleMediaChange);
	}
	focusMenuButton() {
		queueMicrotask(() => {
			(this.elementRef.shadowRoot?.querySelector(".ml-app-shell__menu-btn"))?.focus();
		});
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
defineLegacyAliases(AppShellComponent.prototype, "ml-app-shell", {
	"sidebar-position": "sidebarPosition",
	"sidebar-collapsed": "sidebarCollapsed",
	"header-fixed": "headerFixed"
});
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
						${when(!!c.heroTitle, () => html`
							<h1 class="ml-hero__title">${c.heroTitle}</h1>
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Font
	 * --ml-hero-font-family: var(--ml-font-sans)
	 *
	 * Size: sm
	 * --ml-hero-sm-padding: var(--ml-space-12) var(--ml-space-6)
	 * --ml-hero-sm-title-size: var(--ml-text-3xl)
	 * --ml-hero-sm-description-size: var(--ml-text-base)
	 *
	 * Size: md
	 * --ml-hero-md-padding: var(--ml-space-20) var(--ml-space-6)
	 * --ml-hero-md-title-size: var(--ml-text-4xl)
	 * --ml-hero-md-description-size: var(--ml-text-lg)
	 *
	 * Size: lg
	 * --ml-hero-lg-padding: calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6)
	 * --ml-hero-lg-title-size: var(--ml-text-5xl)
	 * --ml-hero-lg-description-size: var(--ml-text-xl)
	 *
	 * Background variants
	 * --ml-hero-bg-subtle: var(--ml-color-surface-secondary)
	 * --ml-hero-bg-gradient: linear-gradient( 135deg, var(--ml-color-primary-subtle) 0%, var(--ml-color-surface) 50%, var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100% )
	 *
	 * Container
	 * --ml-hero-container-max-width: var(--ml-container-xl, 1280px)
	 * --ml-hero-content-max-width: 800px
	 * --ml-hero-split-gap: var(--ml-space-12)
	 *
	 * Eyebrow
	 * --ml-hero-eyebrow-margin-bottom: var(--ml-space-4)
	 * --ml-hero-eyebrow-font-size: var(--ml-text-sm)
	 * --ml-hero-eyebrow-font-weight: var(--ml-font-semibold)
	 * --ml-hero-eyebrow-color: var(--ml-color-primary)
	 * --ml-hero-eyebrow-letter-spacing: 0.05em
	 *
	 * Title
	 * --ml-hero-title-margin-bottom: var(--ml-space-4)
	 * --ml-hero-title-font-weight: var(--ml-font-bold)
	 * --ml-hero-title-color: var(--ml-color-text)
	 * --ml-hero-title-letter-spacing: -0.025em
	 * --ml-hero-title-line-height: var(--ml-leading-tight)
	 *
	 * Description
	 * --ml-hero-description-margin-bottom: var(--ml-space-8)
	 * --ml-hero-description-color: var(--ml-color-text-secondary)
	 * --ml-hero-description-line-height: var(--ml-leading-relaxed)
	 * --ml-hero-description-max-width: 640px
	 *
	 * Actions
	 * --ml-hero-actions-gap: var(--ml-space-3)
	 *
	 * Media
	 * --ml-hero-media-radius: var(--ml-radius-lg)
	 * --ml-hero-media-below-margin: var(--ml-space-10)
	 *
	 * Social proof
	 * --ml-hero-social-proof-margin: var(--ml-space-10)
	 */

	:host {
		display: block;
		width: 100%;
	}

	/* ============================================
	   HERO CONTAINER
	   ============================================ */
	.ml-hero {
		position: relative;
		width: 100%;
		font-family: var(--ml-hero-font-family, var(--ml-font-sans));
	}

	/* ============================================
	   SIZE VARIANTS (padding & font sizes)
	   ============================================ */
	.ml-hero--sm {
		padding: var(--ml-hero-sm-padding, var(--ml-space-12) var(--ml-space-6));
	}

	.ml-hero--md {
		padding: var(--ml-hero-md-padding, var(--ml-space-20) var(--ml-space-6));
	}

	.ml-hero--lg {
		padding: var(--ml-hero-lg-padding, calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6));
	}

	.ml-hero--sm .ml-hero__title,
	.ml-hero--sm ::slotted([slot="title"]) {
		font-size: var(--ml-hero-sm-title-size, var(--ml-text-3xl));
		line-height: var(--ml-hero-title-line-height, var(--ml-leading-tight));
	}

	.ml-hero--md .ml-hero__title,
	.ml-hero--md ::slotted([slot="title"]) {
		font-size: var(--ml-hero-md-title-size, var(--ml-text-4xl));
		line-height: var(--ml-hero-title-line-height, var(--ml-leading-tight));
	}

	.ml-hero--lg .ml-hero__title,
	.ml-hero--lg ::slotted([slot="title"]) {
		font-size: var(--ml-hero-lg-title-size, var(--ml-text-5xl));
		line-height: var(--ml-hero-title-line-height, var(--ml-leading-tight));
	}

	.ml-hero--sm .ml-hero__description,
	.ml-hero--sm ::slotted([slot="description"]) {
		font-size: var(--ml-hero-sm-description-size, var(--ml-text-base));
	}

	.ml-hero--md .ml-hero__description,
	.ml-hero--md ::slotted([slot="description"]) {
		font-size: var(--ml-hero-md-description-size, var(--ml-text-lg));
	}

	.ml-hero--lg .ml-hero__description,
	.ml-hero--lg ::slotted([slot="description"]) {
		font-size: var(--ml-hero-lg-description-size, var(--ml-text-xl));
	}

	/* ============================================
	   BACKGROUND VARIANTS
	   ============================================ */
	.ml-hero--bg-subtle {
		background-color: var(--ml-hero-bg-subtle, var(--ml-color-surface-secondary));
	}

	.ml-hero--bg-gradient {
		background: var(--ml-hero-bg-gradient, linear-gradient( 135deg, var(--ml-color-primary-subtle) 0%, var(--ml-color-surface) 50%, var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100% ));
	}

	/* ============================================
	   LAYOUT: CONTAINER
	   ============================================ */
	.ml-hero__container {
		max-width: var(--ml-hero-container-max-width, var(--ml-container-xl, 1280px));
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
		max-width: var(--ml-hero-content-max-width, 800px);
	}

	.ml-hero--centered .ml-hero__media--below {
		margin-top: var(--ml-hero-media-below-margin, var(--ml-space-10));
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
		gap: var(--ml-hero-split-gap, var(--ml-space-12));
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
		margin-bottom: var(--ml-hero-eyebrow-margin-bottom, var(--ml-space-4));
		font-size: var(--ml-hero-eyebrow-font-size, var(--ml-text-sm));
		font-weight: var(--ml-hero-eyebrow-font-weight, var(--ml-font-semibold));
		color: var(--ml-hero-eyebrow-color, var(--ml-color-primary));
		text-transform: uppercase;
		letter-spacing: var(--ml-hero-eyebrow-letter-spacing, 0.05em);
	}

	/* Title */
	.ml-hero__title,
	::slotted([slot="title"]) {
		margin: 0 0 var(--ml-hero-title-margin-bottom, var(--ml-space-4)) 0;
		font-weight: var(--ml-hero-title-font-weight, var(--ml-font-bold));
		color: var(--ml-hero-title-color, var(--ml-color-text));
		letter-spacing: var(--ml-hero-title-letter-spacing, -0.025em);
	}

	/* Description */
	.ml-hero__description,
	::slotted([slot="description"]) {
		margin: 0 0 var(--ml-hero-description-margin-bottom, var(--ml-space-8)) 0;
		color: var(--ml-hero-description-color, var(--ml-color-text-secondary));
		line-height: var(--ml-hero-description-line-height, var(--ml-leading-relaxed));
		max-width: var(--ml-hero-description-max-width, 640px);
	}

	/* Actions */
	.ml-hero__actions {
		display: flex;
		gap: var(--ml-hero-actions-gap, var(--ml-space-3));
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
		border-radius: var(--ml-hero-media-radius, var(--ml-radius-lg));
	}

	/* Social proof */
	.ml-hero__social-proof {
		margin-top: var(--ml-hero-social-proof-margin, var(--ml-space-10));
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
		this.heroTitle = "";
		this.description = "";
	}
	get title() {
		return this.heroTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-hero-section", "hero-title");
		this.heroTitle = value;
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
		"hero-title",
		"title",
		"description"
	]
})], HeroSectionComponent);
function pageHeaderTemplate(c) {
	const hasTitle = !!(c.headerTitle || c.hasTitleSlot);
	const hasDescription = !!(c.description || c.hasDescriptionSlot);
	return html`
		<header
			class=${classMap({
		"ml-page-header": true,
		[`ml-page-header--${c.variant}`]: true,
		"ml-page-header--divider": c.divider
	})}
		>
			<div class=${classMap({
		"ml-page-header__breadcrumb": true,
		"ml-page-header__section--empty": !c.hasBreadcrumb
	})}>
				<slot name="breadcrumb"></slot>
			</div>

			<div class="ml-page-header__main">
				<div class="ml-page-header__content">
					<div class=${classMap({
		"ml-page-header__title": true,
		"ml-page-header__section--empty": !hasTitle
	})}>
						<slot name="title">${when(!!c.headerTitle, () => html`<h1>${c.headerTitle}</h1>`)}</slot>
					</div>

					<div class=${classMap({
		"ml-page-header__description": true,
		"ml-page-header__section--empty": !hasDescription
	})}>
						<slot name="description">${when(!!c.description, () => html`<p>${c.description}</p>`)}</slot>
					</div>

					<div class=${classMap({
		"ml-page-header__meta": true,
		"ml-page-header__section--empty": !c.hasMeta
	})}>
						<slot name="meta"></slot>
					</div>
				</div>

				<div class=${classMap({
		"ml-page-header__actions": true,
		"ml-page-header__section--empty": !c.hasActions
	})}>
					<slot name="actions"></slot>
				</div>
			</div>

			<div class=${classMap({
		"ml-page-header__tabs": true,
		"ml-page-header__section--empty": !c.hasTabs
	})}>
				<slot name="tabs"></slot>
			</div>
		</header>
	`;
}
const pageHeaderStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Padding
	 * --ml-page-header-padding: var(--ml-space-6) var(--ml-space-6) var(--ml-space-4)
	 * --ml-page-header-compact-padding: var(--ml-space-4) var(--ml-space-6) var(--ml-space-3)
	 * --ml-page-header-mobile-padding: var(--ml-space-4)
	 *
	 * Font
	 * --ml-page-header-font-family: var(--ml-font-sans)
	 * --ml-page-header-color: var(--ml-color-text)
	 *
	 * Border
	 * --ml-page-header-border-width: var(--ml-border)
	 * --ml-page-header-border-color: var(--ml-color-border)
	 *
	 * Title
	 * --ml-page-header-title-size: var(--ml-text-2xl)
	 * --ml-page-header-title-weight: var(--ml-font-semibold)
	 * --ml-page-header-title-line-height: var(--ml-leading-tight)
	 * --ml-page-header-title-color: var(--ml-color-text)
	 * --ml-page-header-compact-title-size: var(--ml-text-lg)
	 *
	 * Description
	 * --ml-page-header-description-size: var(--ml-text-sm)
	 * --ml-page-header-description-line-height: var(--ml-leading-normal)
	 * --ml-page-header-description-color: var(--ml-color-text-secondary)
	 *
	 * Spacing
	 * --ml-page-header-breadcrumb-margin: var(--ml-space-3)
	 * --ml-page-header-main-gap: var(--ml-space-4)
	 * --ml-page-header-content-gap: var(--ml-space-1)
	 * --ml-page-header-meta-gap: var(--ml-space-2)
	 * --ml-page-header-meta-margin: var(--ml-space-2)
	 * --ml-page-header-actions-gap: var(--ml-space-2)
	 * --ml-page-header-centered-actions-margin: var(--ml-space-4)
	 * --ml-page-header-tabs-margin: var(--ml-space-4)
	 */

	:host {
		display: block;
	}

	/* ============================================
	   PAGE HEADER CONTAINER
	   ============================================ */
	.ml-page-header {
		padding: var(--ml-page-header-padding, var(--ml-space-6) var(--ml-space-6) var(--ml-space-4));
		font-family: var(--ml-page-header-font-family, var(--ml-font-sans));
		color: var(--ml-page-header-color, var(--ml-color-text));
	}

	.ml-page-header--divider {
		border-bottom: var(--ml-page-header-border-width, var(--ml-border)) solid var(--ml-page-header-border-color, var(--ml-color-border));
	}

	/* ============================================
	   COMPACT VARIANT
	   ============================================ */
	.ml-page-header--compact {
		padding: var(--ml-page-header-compact-padding, var(--ml-space-4) var(--ml-space-6) var(--ml-space-3));
	}

	.ml-page-header--compact .ml-page-header__title h1 {
		font-size: var(--ml-page-header-compact-title-size, var(--ml-text-lg));
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
		margin-top: var(--ml-page-header-centered-actions-margin, var(--ml-space-4));
	}

	.ml-page-header--centered .ml-page-header__breadcrumb {
		justify-content: center;
	}

	/* ============================================
	   BREADCRUMB
	   ============================================ */
	.ml-page-header__breadcrumb {
		display: flex;
		margin-bottom: var(--ml-page-header-breadcrumb-margin, var(--ml-space-3));
	}

	/* ============================================
	   MAIN (title row + actions)
	   ============================================ */
	.ml-page-header__main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-page-header-main-gap, var(--ml-space-4));
	}

	/* ============================================
	   CONTENT (title + description + meta)
	   ============================================ */
	.ml-page-header__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-page-header-content-gap, var(--ml-space-1));
		min-width: 0;
		flex: 1;
	}

	/* ============================================
	   TITLE
	   ============================================ */
	.ml-page-header__title h1 {
		margin: 0;
		font-size: var(--ml-page-header-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-page-header-title-weight, var(--ml-font-semibold));
		line-height: var(--ml-page-header-title-line-height, var(--ml-leading-tight));
		color: var(--ml-page-header-title-color, var(--ml-color-text));
	}

	.ml-page-header__title ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-page-header-title-weight, var(--ml-font-semibold));
		line-height: var(--ml-page-header-title-line-height, var(--ml-leading-tight));
		color: var(--ml-page-header-title-color, var(--ml-color-text));
	}

	/* ============================================
	   DESCRIPTION
	   ============================================ */
	.ml-page-header__description p {
		margin: 0;
		font-size: var(--ml-page-header-description-size, var(--ml-text-sm));
		line-height: var(--ml-page-header-description-line-height, var(--ml-leading-normal));
		color: var(--ml-page-header-description-color, var(--ml-color-text-secondary));
	}

	.ml-page-header__description ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-description-size, var(--ml-text-sm));
		line-height: var(--ml-page-header-description-line-height, var(--ml-leading-normal));
		color: var(--ml-page-header-description-color, var(--ml-color-text-secondary));
	}

	/* ============================================
	   META
	   ============================================ */
	.ml-page-header__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-meta-gap, var(--ml-space-2));
		margin-top: var(--ml-page-header-meta-margin, var(--ml-space-2));
	}

	/* ============================================
	   ACTIONS
	   ============================================ */
	.ml-page-header__actions {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-actions-gap, var(--ml-space-2));
		flex-shrink: 0;
	}

	/* ============================================
	   TABS
	   ============================================ */
	.ml-page-header__tabs {
		margin-top: var(--ml-page-header-tabs-margin, var(--ml-space-4));
	}

	/* ============================================
	   EMPTY SECTIONS
	   Slots are always rendered (so slotchange can
	   fire); empty wrappers are hidden instead.
	   ============================================ */
	.ml-page-header__section--empty {
		display: none;
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 640px) {
		.ml-page-header {
			padding: var(--ml-page-header-mobile-padding, var(--ml-space-4));
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
		this.headerTitle = "";
		this.description = "";
		this.variant = "default";
		this.divider = true;
		this.hasBreadcrumb = false;
		this.hasTitleSlot = false;
		this.hasDescriptionSlot = false;
		this.hasActions = false;
		this.hasTabs = false;
		this.hasMeta = false;
	}
	get title() {
		return this.headerTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-page-header", "header-title");
		this.headerTitle = value;
	}
	onCreate() {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === "breadcrumb") this.hasBreadcrumb = hasContent;
			else if (name === "title") this.hasTitleSlot = hasContent;
			else if (name === "description") this.hasDescriptionSlot = hasContent;
			else if (name === "actions") this.hasActions = hasContent;
			else if (name === "tabs") this.hasTabs = hasContent;
			else if (name === "meta") this.hasMeta = hasContent;
		});
	}
};
PageHeaderComponent = __decorate([MelodicComponent({
	selector: "ml-page-header",
	template: pageHeaderTemplate,
	styles: pageHeaderStyles,
	attributes: [
		"variant",
		"divider",
		"header-title",
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

		<div class="ml-auth__header">
			<!-- Native slot fallback keeps header-slot presence reactive: content
			     assigned after mount projects and hides the default title, with no
			     render-time querySelector snapshot involved. -->
			<slot name="header">
				<h1 class="ml-auth__title">${c.pageTitle}</h1>
				<p class="ml-auth__description">${c.description}</p>
			</slot>
		</div>

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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Background
	 * --ml-auth-bg: var(--ml-color-surface-secondary)
	 *
	 * Font
	 * --ml-auth-font-family: var(--ml-font-sans)
	 *
	 * Card
	 * --ml-auth-card-max-width: 440px
	 * --ml-auth-card-bg: var(--ml-color-surface)
	 * --ml-auth-card-border-width: var(--ml-border)
	 * --ml-auth-card-border-color: var(--ml-color-border)
	 * --ml-auth-card-radius: var(--ml-radius-xl)
	 * --ml-auth-card-shadow: var(--ml-shadow-lg)
	 * --ml-auth-card-padding: var(--ml-space-10)
	 *
	 * Centered variant
	 * --ml-auth-centered-padding: var(--ml-space-6)
	 *
	 * Split variant
	 * --ml-auth-split-padding: var(--ml-space-10)
	 * --ml-auth-split-form-padding: var(--ml-auth-split-padding)
	 * --ml-auth-split-brand-padding: var(--ml-auth-split-padding)
	 * --ml-auth-split-form-bg: var(--ml-color-surface)
	 * --ml-auth-split-brand-bg: var(--ml-color-primary)
	 * --ml-auth-split-brand-color: var(--ml-color-text-inverse)
	 * --ml-auth-split-brand-max-width: 480px
	 *
	 * Logo
	 * --ml-auth-logo-margin: var(--ml-space-6)
	 *
	 * Header
	 * --ml-auth-header-margin: var(--ml-space-8)
	 * --ml-auth-title-size: var(--ml-text-2xl)
	 * --ml-auth-title-weight: var(--ml-font-bold)
	 * --ml-auth-title-color: var(--ml-color-text)
	 * --ml-auth-title-line-height: var(--ml-leading-tight)
	 * --ml-auth-title-margin: var(--ml-space-2)
	 * --ml-auth-description-size: var(--ml-text-sm)
	 * --ml-auth-description-color: var(--ml-color-text-muted)
	 * --ml-auth-description-line-height: var(--ml-leading-normal)
	 *
	 * Form / Social / Footer spacing
	 * --ml-auth-form-margin: var(--ml-space-6)
	 * --ml-auth-social-margin: var(--ml-space-6)
	 * --ml-auth-footer-size: var(--ml-text-sm)
	 * --ml-auth-footer-color: var(--ml-color-text-muted)
	 *
	 * Mobile
	 * --ml-auth-mobile-padding: var(--ml-space-6)
	 */

	:host {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* ============================================
	   BASE WRAPPER
	   ============================================ */
	.ml-auth {
		display: flex;
		min-height: 100%;
		height: 100%;
		font-family: var(--ml-auth-font-family, var(--ml-font-sans));
		background-color: var(--ml-auth-bg, var(--ml-color-surface-secondary));
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-auth--centered {
		align-items: center;
		justify-content: center;
		padding: var(--ml-auth-centered-padding, var(--ml-space-6));
	}

	.ml-auth--centered .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width, 440px);
		background-color: var(--ml-auth-card-bg, var(--ml-color-surface));
		border: var(--ml-auth-card-border-width, var(--ml-border)) solid var(--ml-auth-card-border-color, var(--ml-color-border));
		border-radius: var(--ml-auth-card-radius, var(--ml-radius-xl));
		box-shadow: var(--ml-auth-card-shadow, var(--ml-shadow-lg));
		padding: var(--ml-auth-card-padding, var(--ml-space-10));
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
		padding: var(--ml-auth-split-form-padding, var(--ml-auth-split-padding, var(--ml-space-10)));
		background-color: var(--ml-auth-split-form-bg, var(--ml-color-surface));
	}

	.ml-auth--split .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width, 440px);
	}

	.ml-auth--split .ml-auth__brand-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-auth-split-brand-padding, var(--ml-auth-split-padding, var(--ml-space-10)));
		background-color: var(--ml-auth-split-brand-bg, var(--ml-color-primary));
		color: var(--ml-auth-split-brand-color, var(--ml-color-text-inverse));
		position: relative;
		overflow: hidden;
	}

	.ml-auth__brand-content {
		position: relative;
		z-index: 1;
		text-align: center;
		width: 100%;
		height: 100%;
		max-width: var(--ml-auth-split-brand-max-width, 480px);
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
		margin-bottom: var(--ml-auth-logo-margin, var(--ml-space-6));
	}

	.ml-auth__logo:empty {
		display: none;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-auth__header {
		text-align: center;
		margin-bottom: var(--ml-auth-header-margin, var(--ml-space-8));
	}

	.ml-auth__title {
		margin: 0 0 var(--ml-auth-title-margin, var(--ml-space-2)) 0;
		font-size: var(--ml-auth-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-auth-title-weight, var(--ml-font-bold));
		color: var(--ml-auth-title-color, var(--ml-color-text));
		line-height: var(--ml-auth-title-line-height, var(--ml-leading-tight));
	}

	.ml-auth__description {
		margin: 0;
		font-size: var(--ml-auth-description-size, var(--ml-text-sm));
		color: var(--ml-auth-description-color, var(--ml-color-text-muted));
		line-height: var(--ml-auth-description-line-height, var(--ml-leading-normal));
	}

	/* ============================================
	   FORM AREA
	   ============================================ */
	.ml-auth__form {
		margin-bottom: var(--ml-auth-form-margin, var(--ml-space-6));
	}

	.ml-auth__form:empty {
		display: none;
	}

	/* ============================================
	   SOCIAL LOGIN
	   ============================================ */
	.ml-auth__social {
		margin-bottom: var(--ml-auth-social-margin, var(--ml-space-6));
	}

	.ml-auth__social:empty {
		display: none;
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-auth__footer {
		text-align: center;
		font-size: var(--ml-auth-footer-size, var(--ml-text-sm));
		color: var(--ml-auth-footer-color, var(--ml-color-text-muted));
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
			padding: var(--ml-auth-mobile-padding, var(--ml-space-6));
		}
	}
`;
const loginPageStyles = () => css`
	${authLayoutCss}
`;
var LoginPageComponent = class LoginPageComponent$1 {
	constructor() {
		this.variant = "centered";
		this.pageTitle = "Log in to your account";
		this.description = "Welcome back! Please enter your details.";
	}
	get title() {
		return this.pageTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-login-page", "page-title");
		this.pageTitle = value;
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
		"page-title",
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

		<div class="ml-auth__header">
			<!-- Native slot fallback keeps header-slot presence reactive: content
			     assigned after mount projects and hides the default title, with no
			     render-time querySelector snapshot involved. -->
			<slot name="header">
				<h1 class="ml-auth__title">${c.pageTitle}</h1>
				<p class="ml-auth__description">${c.description}</p>
			</slot>
		</div>

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
		this.pageTitle = "Create an account";
		this.description = "Start your journey today.";
	}
	get title() {
		return this.pageTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-signup-page", "page-title");
		this.pageTitle = value;
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
		"page-title",
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
				header-title=${c.pageTitle}
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
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Font
	 * --ml-dashboard-font-family: var(--ml-font-sans)
	 *
	 * Padding
	 * --ml-dashboard-padding: var(--ml-space-6)
	 * --ml-dashboard-mobile-padding: var(--ml-space-4)
	 *
	 * Metrics grid
	 * --ml-dashboard-metrics-min-width: 200px
	 * --ml-dashboard-metrics-gap: var(--ml-space-4)
	 * --ml-dashboard-metrics-margin: var(--ml-space-6)
	 * --ml-dashboard-metrics-mobile-gap: var(--ml-space-3)
	 * --ml-dashboard-metrics-mobile-margin: var(--ml-space-4)
	 *
	 * Body grid
	 * --ml-dashboard-body-gap: var(--ml-space-6)
	 * --ml-dashboard-body-mobile-gap: var(--ml-space-4)
	 *
	 * Main & aside
	 * --ml-dashboard-main-gap: var(--ml-space-6)
	 * --ml-dashboard-aside-gap: var(--ml-space-6)
	 */

	:host {
		display: block;
		height: 100%;
	}

	/* ============================================
	   DASHBOARD CONTENT AREA
	   ============================================ */
	.ml-dashboard {
		padding: var(--ml-dashboard-padding, var(--ml-space-6));
		font-family: var(--ml-dashboard-font-family, var(--ml-font-sans));
	}

	/* ============================================
	   METRICS ROW
	   ============================================ */
	.ml-dashboard__metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--ml-dashboard-metrics-min-width, 200px), 1fr));
		gap: var(--ml-dashboard-metrics-gap, var(--ml-space-4));
		margin-bottom: var(--ml-dashboard-metrics-margin, var(--ml-space-6));
	}

	/* ============================================
	   BODY (MAIN + ASIDE GRID)
	   ============================================ */
	.ml-dashboard__body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--ml-dashboard-body-gap, var(--ml-space-6));
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
		gap: var(--ml-dashboard-main-gap, var(--ml-space-6));
	}

	/* ============================================
	   ASIDE
	   ============================================ */
	.ml-dashboard__aside {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-dashboard-aside-gap, var(--ml-space-6));
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
			padding: var(--ml-dashboard-mobile-padding, var(--ml-space-4));
		}

		.ml-dashboard__metrics {
			grid-template-columns: 1fr;
			gap: var(--ml-dashboard-metrics-mobile-gap, var(--ml-space-3));
			margin-bottom: var(--ml-dashboard-metrics-mobile-margin, var(--ml-space-4));
		}

		.ml-dashboard__body {
			gap: var(--ml-dashboard-body-mobile-gap, var(--ml-space-4));
		}
	}
`;
var DashboardPageComponent = class DashboardPageComponent$1 {
	constructor() {
		this.pageTitle = "";
		this.description = "";
		this.layout = "default";
		this.hasMetrics = false;
		this.hasAside = false;
		this.hasHeaderActions = false;
		this._slotObserver = null;
	}
	get title() {
		return this.pageTitle;
	}
	set title(value) {
		warnDeprecatedTitleOnce("ml-dashboard-page", "page-title");
		this.pageTitle = value;
	}
	onCreate() {
		this._slotObserver = new MutationObserver((mutations) => {
			if (mutations.some((m) => m.type === "childList" ? m.target === this.elementRef : m.target.parentNode === this.elementRef)) this.syncSlotFlags();
		});
		this._slotObserver.observe(this.elementRef, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["slot"]
		});
		this.syncSlotFlags();
	}
	onDestroy() {
		this._slotObserver?.disconnect();
		this._slotObserver = null;
	}
	syncSlotFlags() {
		this.hasMetrics = this.elementRef.querySelector(":scope > [slot=\"metrics\"]") !== null;
		this.hasAside = this.elementRef.querySelector(":scope > [slot=\"aside\"]") !== null;
		this.hasHeaderActions = this.elementRef.querySelector(":scope > [slot=\"header-actions\"]") !== null;
	}
};
DashboardPageComponent = __decorate([MelodicComponent({
	selector: "ml-dashboard-page",
	template: dashboardPageTemplate,
	styles: dashboardPageStyles,
	attributes: [
		"page-title",
		"title",
		"description",
		"layout"
	]
})], DashboardPageComponent);
export { APP_CONFIG, AbortError, AbstractControl, ActivityFeedComponent, ActivityFeedItemComponent, AlertComponent, AppShellComponent, AvatarComponent, BadgeComponent, BadgeGroupComponent, Binding, BreadcrumbComponent, BreadcrumbItemComponent, ButtonComponent, ButtonGroupComponent, ButtonGroupItemComponent, CalendarComponent, CalendarViewComponent, CardComponent, CheckboxComponent, ComponentBase, ComponentStateBaseService, ContainerComponent, DashboardPageComponent, DatePickerComponent, DialogComponent, DialogRef, DialogService, Directive, DividerComponent, DrawerComponent, DropdownComponent, DropdownGroupComponent, DropdownItemComponent, DropdownSeparatorComponent, EffectsBase, FormArray, FormControl, FormFieldComponent, FormGroup, HeroSectionComponent, HttpBaseError, HttpClient, HttpError, IconComponent, Inject, Injectable, InjectionEngine, Injector, InputComponent, ListComponent, ListItemComponent, LoginPageComponent, MelodicComponent, NetworkError, PageHeaderComponent, PaginationComponent, PopoverComponent, ProgressComponent, ROUTE_CONTEXT_EVENT, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_INIT_STATE, RX_STATE_DEBUG, RadioCardComponent, RadioCardGroupComponent, RadioComponent, RadioGroupComponent, RouteContextEvent, RouteContextService, RouteMatcher, RouterLinkComponent, RouterLinkCore, RouterOutletComponent, RouterService, SIGNAL_MARKER, SelectComponent, Service, SidebarComponent, SidebarGroupComponent, SidebarItemComponent, SignalEffect, SignalStoreService, SignupPageComponent, SliderComponent, SpinnerComponent, StackComponent, StepComponent, StepPanelComponent, StepsComponent, TabComponent, TabPanelComponent, TableComponent, TabsComponent, TagComponent, TemplateResult, TextareaComponent, ToastComponent, ToastContainerComponent, ToastService, ToggleComponent, TooltipComponent, Validators, VirtualScroller, activityFeedItemStyles, activityFeedItemTemplate, activityFeedStyles, activityFeedTemplate, allTokens, announce, appShellStyles, appShellTemplate, appendQueryParams, applyGlobalStyles, applyTheme, arrow, attributeNames, attributeTypes, autoUpdate, baseThemeCss, batch, bootstrap, borderTokens, breadcrumbItemStyles, breadcrumbItemTemplate, breadcrumbStyles, breadcrumbTemplate, breakpointTokens, breakpoints, buildPathFromRoute, calendarViewStyles, calendarViewTemplate, checkboxAdapter, classMap, clearCrossRootDescription, clickOutside, colorTokens, componentBaseStyles, computePosition, computed, containerStyles, containerTemplate, createAction, createAsyncValidator, createBrandTheme, createDeactivateGuard, createFocusTrap, createFormArray, createFormControl, createFormGroup, createGuard, createLiveRegion, createReducer, createResolver, createState, createTheme, createToken, createValidator, css, darkTheme, darkThemeCss, dashboardPageStyles, dashboardPageTemplate, defineConfig, defineLegacyAliases, describeToken, devWarn, directive, disposeContainerParts, disposeDirectiveState, disposePart, disposeParts, drawerStyles, drawerTemplate, dropdownGroupStyles, dropdownGroupTemplate, dropdownItemStyles, dropdownItemTemplate, dropdownSeparatorStyles, dropdownSeparatorTemplate, dropdownStyles, dropdownTemplate, effect, emit, environment, findRouteByName, flip, focusFirst, focusLast, focusTrap, focusVisible, formControlDirective, formFieldStyles, formFieldTemplate, getActiveComponent, getActiveEffect, getAdapter, getAttributeDirective, getComponentDefinition, getComponentDefinitions, getDeepActiveElement, getEnvironment, getFirstFocusable, getFocusableControl, getFocusableElements, getGlobalMessage, getLastFocusable, getRegisteredDirectives, getResolvedTheme, getTheme, getTokenKey, hasAttributeDirective, hasLightSlot, heroSectionStyles, heroSectionTemplate, html, inject, injectOptional, injectTheme, installConsoleApi, installHistoryEvents, isDeepFocusWithin, isDevMode, isDirective, isFocusVisible, isSafeUrl, isSignal, lightTheme, lightThemeCss, listItemStyles, listItemTemplate, listStyles, listTemplate, live, loginPageStyles, loginPageTemplate, matchRouteTree, modelDirective, newID, offset, onAction, onThemeChange, pageHeaderStyles, pageHeaderTemplate, paginationStyles, paginationTemplate, parseUrlParts, portalDirective, primitiveColors, progressStyles, progressTemplate, props, provideConfig, provideHttp, provideRX, provideRouter, radioAdapter, refreshGlobalStyles, registerAdapter, registerAttributeDirective, registerDefaultMessages, render, repeat, repeatRaw, resetDevWarnings, resetStyles, resolveEnvironment, resolveMessage, routerLinkDirective, selectStyles, selectTemplate, setActiveComponent, setActiveEffect, setCrossRootActiveDescendant, setCrossRootDescription, setCrossRootLabel, setDefaultMessage, setDevMode, shadowTokens, shift, sidebarGroupStyles, sidebarGroupTemplate, sidebarItemStyles, sidebarItemTemplate, sidebarStyles, sidebarTemplate, signal, signupPageStyles, signupPageTemplate, sliderStyles, sliderTemplate, spacingTokens, stepPanelStyles, stepPanelTemplate, stepStyles, stepTemplate, stepsStyles, stepsTemplate, styleMap, supportsAriaElementReferences, tabPanelStyles, tabPanelTemplate, tabStyles, tabTemplate, tableStyles, tableTemplate, tabsStyles, tabsTemplate, textAdapter, toastContainerStyles, toastContainerTemplate, toastStyles, toastTemplate, toggleTheme, tokensToCss, tooltipDirective, transitionTokens, typographyTokens, unregisterAttributeDirective, unsafeHTML, untracked, visuallyHiddenStyles, warnDeprecatedOnce, warnDeprecatedTitleOnce, watchLightSlots, watchSlotPresence, when };

//# sourceMappingURL=melodic-components.js.map