import { Service } from '../../../../src/injection';
import { MelodicComponent } from '../../../../src/components';
import { html } from '../../../../src/template';
import { APP_CONFIG } from '../../../../src/config';
import type { AppConfig } from '../../config/app.config';

@MelodicComponent({
	selector: 'home-page',
	template: (c: HomePageComponent) => html`
		<div class="page">
			<h1>Home Page: ${c.config.appName}</h1>
			<p>Welcome to the Melodic Router Demo!</p>
			<p>Use the navigation links above to explore different pages.</p>
		</div>
	`
})
export class HomePageComponent {
	@Service(APP_CONFIG) config!: AppConfig;
}
