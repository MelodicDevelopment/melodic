import './components/app.component';
import { bootstrap } from '@melodic/core/bootstrap';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	devMode: true
});
