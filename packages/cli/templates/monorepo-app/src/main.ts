import './components/app.component';
import { bootstrap } from '@melodicdev/core/bootstrap';
import { provideConfig } from '@melodicdev/core/config';
import { appConfig } from './config/app.config';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	providers: [provideConfig(appConfig)]
	// `devMode` follows the build by default (import.meta.env.DEV under a
	// bundler, a localhost check without one). Pass it explicitly only to
	// override that — `devMode: true` in a production build ships every dev
	// diagnostic to your users.
});
