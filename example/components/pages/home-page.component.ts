import { MelodicComponent } from '../../../src/components';
import { html } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'home-page',
	template: () => html`
		<div class="page">
			<h1>Home Page</h1>
			<p>Welcome to the Melodic Router Demo!</p>
			<p>Use the navigation links above to explore different pages.</p>
		</div>
	`
})
export class HomePageComponent {}
