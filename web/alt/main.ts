// Import routing components and directives FIRST (before app components)
import '../../src/routing/directives/router-link.directive';
import '../../src/routing/services/router.service';
import '../../src/routing/components/router-outlet/router-outlet.component';
import '../../src/routing/components/router-link/router-link.component';

import { bootstrap } from '../../src/bootstrap';
import { injectAltGlobalStyles } from './global-styles';
import './components';

injectAltGlobalStyles();

await bootstrap({
	target: '#alt-root',
	rootComponent: 'alt-app',
	devMode: true
});
