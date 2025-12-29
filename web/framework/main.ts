// Import routing components and directives FIRST (before app components)
import '../../src/routing/directives/router-link.directive';
import '../../src/routing/services/router.service';
import '../../src/routing/components/router-outlet/router-outlet.component';
import '../../src/routing/components/router-link/router-link.component';

import { bootstrap } from '../../src/bootstrap';
import { injectGlobalStyles } from './global-styles';
import './components';

injectGlobalStyles();

await bootstrap({
	target: '#app-root',
	rootComponent: 'framework-app',
	devMode: true
});
