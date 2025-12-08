import './services/todo.service';
import './components';
import { bootstrap } from '../src/bootstrap';
import { provideHttp } from '../src/http/provide-http.function';

await bootstrap({
	target: '#my-app',
	rootComponent: 'my-app',
	devMode: true,
	providers: [provideHttp({ baseURL: '/data' })],
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
