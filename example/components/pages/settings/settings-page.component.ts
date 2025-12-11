import { MelodicComponent } from '../../../../src/components/melodic-component.decorator';
import { settingsPageTemplate } from './settings-page.template';
import { settingsPageStyles } from './settings-page.styles';

// Log when this module is loaded to demonstrate lazy loading
console.log('[Lazy] Settings page module loaded!');

@MelodicComponent({
	selector: 'settings-page',
	template: settingsPageTemplate,
	styles: settingsPageStyles
})
export class SettingsPageComponent {}
