import { Injector } from '../../injection';
import type { IAppConfig } from '../interfaces/iapp-config.interface';
import type { IMelodicApp } from '../interfaces/imelodic-app.interface';
import type { Token } from '../../injection';
import { isDevMode, setDevMode } from '../../devtools/dev-mode';
import { installConsoleApi } from '../../devtools/console-api';
import { HttpClient } from '../../http/classes/http-client.class';

export async function bootstrap(config: IAppConfig = {}): Promise<IMelodicApp> {
	// `devMode` now drives the framework-wide switch (template diagnostics,
	// DevTools hooks, dev warnings) rather than only bootstrap's own logging.
	// Left unset it follows the build: `import.meta.env.DEV` under a bundler,
	// a localhost check without one.
	if (config.devMode !== undefined) {
		setDevMode(config.devMode);
	}

	const devMode = isDevMode();

	if (devMode) {
		// `window.melodic` — component registry, mounted instances, injector
		// contents and the framework event stream, from the console.
		installConsoleApi();
	}
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

	let rootElement: HTMLElement | undefined;
	let destroyed = false;

	const removeErrorHandlers = (): void => {
		for (const { type, handler } of errorHandlers) {
			window.removeEventListener(type, handler);
		}
		errorHandlers.length = 0;
	};

	// Anything acquired so far is released if a later step fails: no window
	// handlers or half-mounted root may outlive a bootstrap that threw.
	let boundApp: IMelodicApp | null = null;

	const rollback = (): void => {
		removeErrorHandlers();
		if (rootElement?.parentNode) {
			rootElement.parentNode.removeChild(rootElement);
		}
		// onReady now runs after the binding, so a throwing hook must not leave
		// a half-built app resolvable.
		if (boundApp && Injector.getBinding('IMelodicApp')?.getInstance() === boundApp) {
			Injector.unbind('IMelodicApp');
		}
	};

	try {
		if (config.onBefore) {
			if (devMode) {
				console.log('[Melodic] Running onBefore hook...');
			}

			await config.onBefore();
		}

		if (config.providers) {
			for (const provider of config.providers) {
				provider(Injector);
			}

			if (devMode) {
				console.log('[Melodic] Custom providers registered');
			}
		}

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
			rootElement,
			// Populated below, once the injector is known to have one.
			http: undefined,

			get<T>(token: Token<T>): T {
				return Injector.get(token);
			},

			destroy() {
				if (destroyed) {
					return;
				}
				destroyed = true;

				removeErrorHandlers();

				if (rootElement?.parentNode) {
					rootElement.parentNode.removeChild(rootElement);
				}

				// Release the global binding — but only if it still refers to this
				// app, so destroying a stale handle never unbinds a newer app.
				if (Injector.getBinding('IMelodicApp')?.getInstance() === app) {
					Injector.unbind('IMelodicApp');
				}
				app.rootElement = undefined;

				if (devMode) {
					console.log('[Melodic] Application destroyed');
				}
			}
		};

		// `IMelodicApp.http` is documented as the app's HTTP client; it was
		// never populated, so `app.http` was always undefined.
		if (Injector.has(HttpClient)) {
			app.http = Injector.get(HttpClient);
		}

		// Bind BEFORE onReady: the hook is the documented place to kick off
		// startup work, and that work commonly resolves `IMelodicApp`.
		Injector.bindValue('IMelodicApp', app);
		boundApp = app;

		if (config.onReady) {
			config.onReady();
		}

		if (devMode) {
			console.log('[Melodic] Bootstrap complete');
		}

		return app;
	} catch (error) {
		rollback();
		throw error;
	}
}
