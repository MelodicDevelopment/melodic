// `@melodicdev/core/routing` registers the router-link directive and defines
// <router-outlet> / <router-link> as a side effect of importing it, so this
// one import replaces the four deep imports this file used to make. (The old
// comment claimed the order mattered — it does not: the directive registry is
// consulted at render time, not at module-evaluation time.)
import '../../src/routing';

import './components';
import { bootstrap } from '../../src/bootstrap';
import { provideConfig } from '../../src/config';
import { provideHttp } from '../../src/http/functions/provide-http.function';
import { provideRouter } from '../../src/routing';
import { provideRX } from '../../src/state';
import { appConfig } from './config/app.config';
import { appState, appReducers, appEffects } from './state/app.state';

await bootstrap({
	target: '#my-app',
	rootComponent: 'my-app',
	providers: [
		provideConfig(appConfig),
		// Registers the router before any outlet mounts, so navigation works
		// from app startup. A root <router-outlet .routes=…> still works; this
		// is the documented way to make the router available everywhere.
		provideRouter(),
		provideRX(appState, appReducers, appEffects, true),
		provideHttp(
			{ baseURL: appConfig.apiBaseURL },
			{
				request: [
					{
						intercept(request) {
							console.log('Request Interceptor:', request);
							return Promise.resolve(request);
						},
						error(error) {
							console.error('Request Interceptor Error:', error);
							return Promise.reject(error);
						}
					}
				],
				response: [
					{
						intercept(response) {
							console.log('Response Interceptor:', response);
							return Promise.resolve(response);
						},
						error(error) {
							console.error('Response Interceptor Error:', error);
							return Promise.reject(error);
						}
					}
				]
			}
		)
	],
	onError: (error: Error) => {
		console.error('Global error handler:', error);
	},
	onBefore: () => {
		console.log('App is initializing...');
	},
	onReady: () => {
		console.log('App is ready!');
	}
});
