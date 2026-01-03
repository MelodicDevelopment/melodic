import './components/app.component';
import { bootstrap } from '@melodicdev/core/bootstrap';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	devMode: true
});
