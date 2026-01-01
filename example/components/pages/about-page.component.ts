import { MelodicComponent } from '../../../src/components';
import { html } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'about-page',
	template: () => html`
		<div class="page">
			<h1>About Page</h1>
			<p>Melodic is a lightweight web component framework featuring:</p>
			<ul>
				<li>Custom element system using TypeScript decorators</li>
				<li>Ultra-fast template system with tagged template literals</li>
				<li>Plugin-friendly directive system for DOM manipulation</li>
				<li>Shadow DOM encapsulation</li>
				<li>Reactive property observation</li>
			</ul>
		</div>
	`
})
export class AboutPageComponent {}
