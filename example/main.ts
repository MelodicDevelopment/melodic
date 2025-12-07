import './services/todo.service';
import './components';
import { bootstrap } from '../src/bootstrap';

await bootstrap({
	target: '#my-app',
	rootComponent: 'my-app',
	devMode: true,
	http: {
		baseURL: '/data'
	},
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
