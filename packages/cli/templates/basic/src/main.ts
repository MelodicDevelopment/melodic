import './components/app.component';
import { bootstrap } from '@melodicdev/core/bootstrap';
import { setGlobalStylesAttribute } from '@melodicdev/core/components';
import { melodicStylesAttribute } from '../melodic-styles.config';

setGlobalStylesAttribute(melodicStylesAttribute);

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	devMode: true
});
