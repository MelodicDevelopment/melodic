import './components';
import { bootstrap } from '../src/bootstrap';
import { provideHttp } from '../src/http/provide-http.function';
import { provideRX } from '../src/state';
import { appState, appReducers, appEffects } from './state/app.state';

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
