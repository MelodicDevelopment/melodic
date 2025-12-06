import { Injector } from '../../injection';
import { HttpClient } from '../../http';
import type { IHttpClientConfig } from '../../http';
import type { INewable } from '../../interfaces';

/**
 * Application configuration
 */
export interface AppConfig {
	/**
	 * HTTP client configuration
	 * Sets up a global HttpClient instance available via DI
	 */
	http?: IHttpClientConfig;

	/**
	 * Enable development mode
	 * - Logs bootstrap lifecycle events
	 * - Could enable additional debugging features
	 */
	devMode?: boolean;

	/**
	 * Global error handler for uncaught errors and unhandled promise rejections
	 */
	onError?: (error: Error, context: 'error' | 'unhandledrejection') => void;

	/**
	 * Called before bootstrap begins
	 * Use for async setup: loading config, checking auth, initializing analytics
	 */
	onBefore?: () => void | Promise<void>;

	/**
	 * Called after bootstrap completes
	 * Use for: hiding loading screens, starting background tasks
	 */
	onReady?: () => void;

	/**
	 * Root component selector to mount (optional)
	 * If provided, creates this element and appends to target
	 */
	rootComponent?: string;

	/**
	 * Mount target for rootComponent (selector or element)
	 */
	target?: string | HTMLElement;
}

/**
 * Application instance returned by bootstrap
 */
export interface MelodicApp {
	/** Whether dev mode is enabled */
	isDevMode: boolean;

	/** Get a service from the injector */
	get<T>(token: string | INewable<T>): T;

	/** The configured HTTP client (if http config was provided) */
	http?: HttpClient;

	/** The mounted root element (if rootComponent was provided) */
	rootElement?: HTMLElement;

	/** Cleanup error handlers */
	destroy(): void;
}

/**
 * Bootstrap a Melodic application
 *
 * Handles global application configuration that can't be done via decorators:
 * - HTTP client setup with runtime config (auth tokens, base URLs)
 * - Global error handling
 * - Lifecycle hooks for async initialization
 * - Optional root component mounting
 *
 * @example
 * ```typescript
 * // Minimal - just HTTP config
 * await bootstrap({
 *   http: { baseURL: '/api' }
 * });
 *
 * // Full configuration
 * await bootstrap({
 *   http: {
 *     baseURL: '/api',
 *     defaultHeaders: { 'Authorization': `Bearer ${token}` }
 *   },
 *   devMode: true,
 *   onError: (err, ctx) => sendToSentry(err),
 *   onBefore: async () => {
 *     await loadConfig();
 *     await checkAuth();
 *   },
 *   onReady: () => {
 *     hideLoadingSpinner();
 *   },
 *   rootComponent: 'my-app',
 *   target: '#app'
 * });
 * ```
 */
export async function bootstrap(config: AppConfig = {}): Promise<MelodicApp> {
	const devMode = config.devMode ?? false;
	const errorHandlers: { type: string; handler: EventListener }[] = [];

	if (devMode) {
		console.log('[Melodic] Bootstrap starting...');
	}

	// Setup global error handlers
	if (config.onError) {
		const errorHandler = (event: ErrorEvent) => {
			config.onError!(event.error, 'error');
		};
		const rejectionHandler = (event: PromiseRejectionEvent) => {
			config.onError!(event.reason, 'unhandledrejection');
		};

		window.addEventListener('error', errorHandler as EventListener);
		window.addEventListener('unhandledrejection', rejectionHandler as EventListener);

		errorHandlers.push(
			{ type: 'error', handler: errorHandler as EventListener },
			{ type: 'unhandledrejection', handler: rejectionHandler as EventListener }
		);
	}

	// Call onBefore hook
	if (config.onBefore) {
		if (devMode) {
			console.log('[Melodic] Running onBefore hook...');
		}
		await config.onBefore();
	}

	// Configure HTTP client
	let httpClient: HttpClient | undefined;
	if (config.http) {
		httpClient = new HttpClient(config.http);

		// Register with injector so services can inject it
		const holder = class {};
		const dep = Injector.bind(HttpClient, holder as unknown as INewable<HttpClient>);
		dep.setInstance(httpClient);
		dep.setSingleton(true);

		if (devMode) {
			console.log('[Melodic] HTTP client configured', { baseURL: config.http.baseURL });
		}
	}

	// Mount root component if specified
	let rootElement: HTMLElement | undefined;
	if (config.rootComponent && config.target) {
		const targetEl = typeof config.target === 'string'
			? document.querySelector<HTMLElement>(config.target)
			: config.target;

		if (!targetEl) {
			throw new Error(`[Melodic] Target element not found: ${config.target}`);
		}

		// Check if component is registered
		if (!customElements.get(config.rootComponent)) {
			throw new Error(
				`[Melodic] Component <${config.rootComponent}> is not registered. ` +
				`Make sure to import the component file before calling bootstrap().`
			);
		}

		rootElement = document.createElement(config.rootComponent);
		targetEl.appendChild(rootElement);

		if (devMode) {
			console.log('[Melodic] Mounted root component', {
				component: config.rootComponent,
				target: config.target
			});
		}
	}

	// Create app instance
	const app: MelodicApp = {
		isDevMode: devMode,
		http: httpClient,
		rootElement,

		get<T>(token: string | INewable<T>): T {
			return Injector.get(token);
		},

		destroy() {
			// Remove error handlers
			for (const { type, handler } of errorHandlers) {
				window.removeEventListener(type, handler);
			}

			// Remove root element
			if (rootElement?.parentNode) {
				rootElement.parentNode.removeChild(rootElement);
			}

			if (devMode) {
				console.log('[Melodic] Application destroyed');
			}
		}
	};

	// Call onReady hook
	if (config.onReady) {
		config.onReady();
	}

	if (devMode) {
		console.log('[Melodic] Bootstrap complete');
	}

	return app;
}
