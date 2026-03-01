import './components/app.component';
import { bootstrap } from '@melodicdev/core/bootstrap';
import { provideConfig } from '@melodicdev/core/config';
import { appConfig } from '@config';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	providers: [provideConfig(appConfig)],
	devMode: true
});
