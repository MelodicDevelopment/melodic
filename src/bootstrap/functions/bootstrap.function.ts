import { Injector } from '../../injection';
import type { IAppConfig } from '../interfaces/iapp-config.interface';
import type { IMelodicApp } from '../interfaces/imelodic-app.interface';
import type { Token } from '../../injection';

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
	const rollback = (): void => {
		removeErrorHandlers();
		if (rootElement?.parentNode) {
			rootElement.parentNode.removeChild(rootElement);
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

		if (config.onReady) {
			config.onReady();
		}

		if (devMode) {
			console.log('[Melodic] Bootstrap complete');
		}

		Injector.bindValue('IMelodicApp', app);

		return app;
	} catch (error) {
		rollback();
		throw error;
	}
}
