// Import global styles for portaled elements (must be in light DOM)
import './styles/portal-global.css';

// Import routing components and directives FIRST (before app components)
import '../src/routing/directives/router-link.directive';
import '../src/routing/services/router.service';
import '../src/routing/components/router-outlet/router-outlet.component';
import '../src/routing/components/router-link/router-link.component';

// Now import app components (which may use routing directives in templates)
import './components';
import { bootstrap } from '../src/bootstrap';
import { setGlobalStylesAttribute } from '../src/components';
import { melodicStylesAttribute } from '../melodic-styles.config';
import { provideHttp } from '../src/http/functions/provide-http.function';
import { provideRX } from '../src/state';
import { appState, appReducers, appEffects } from './state/app.state';

setGlobalStylesAttribute(melodicStylesAttribute);

await bootstrap({
	target: '#my-app',
	rootComponent: 'my-app',
	devMode: true,
	providers: [
		provideRX(appState, appReducers, appEffects, true),
		provideHttp(
			{ baseURL: '/data' },
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
