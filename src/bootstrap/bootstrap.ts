import { Injector } from '../injection';
import { HttpClient } from '../http';
import type { IAppConfig } from './interfaces/iapp-config.interface';
import type { IMelodicApp } from './interfaces/imelodic-app.interface';
import type { Token } from '../injection';

export async function bootstrap(config: IAppConfig = {}): Promise<IMelodicApp> {
	const devMode = config.devMode ?? false;
	const errorHandlers: { type: string; handler: EventListener }[] = [];

	if (devMode) {
		console.log('[Melodic] Bootstrap starting...');
	}

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

	if (config.onBefore) {
		if (devMode) {
			console.log('[Melodic] Running onBefore hook...');
		}

		await config.onBefore();
	}

	let httpClient: HttpClient | undefined;
	if (config.http) {
		httpClient = new HttpClient(config.http);
		Injector.bindValue(HttpClient, httpClient);

		if (devMode) {
			console.log('[Melodic] HTTP client configured', { baseURL: config.http.baseURL });
		}
	}

	let rootElement: HTMLElement | undefined;
	if (config.rootComponent && config.target) {
		const targetEl = typeof config.target === 'string' ? document.querySelector<HTMLElement>(config.target) : config.target;

		if (!targetEl) {
			throw new Error(`[Melodic] Target element not found: ${config.target}`);
		}

		// Check if component is registered
		if (!customElements.get(config.rootComponent)) {
			throw new Error(
				`[Melodic] Component <${config.rootComponent}> is not registered. ` + `Make sure to import the component file before calling bootstrap().`
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

	const app: IMelodicApp = {
		isDevMode: devMode,
		http: httpClient,
		rootElement,

		get<T>(token: Token<T>): T {
			return Injector.get(token);
		},

		destroy() {
			for (const { type, handler } of errorHandlers) {
				window.removeEventListener(type, handler);
			}

			if (rootElement?.parentNode) {
				rootElement.parentNode.removeChild(rootElement);
			}

			if (devMode) {
				console.log('[Melodic] Application destroyed');
			}
		}
	};

	if (config.onReady) {
		config.onReady();
	}

	if (devMode) {
		console.log('[Melodic] Bootstrap complete');
	}

	Injector.bindValue('IMelodicApp', app);

	return app;
}
