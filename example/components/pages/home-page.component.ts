import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template';

@MelodicComponent({
	selector: 'home-page',
	template: () => html`
		<div class="page">
			<h1>Home Page</h1>
			<p>Welcome to the Melodic Router Demo!</p>
			<p>Use the navigation links above to explore different pages.</p>
		</div>
	`,
	styles: () => css`
		.page {
			padding: 2rem;
		}
		h1 {
			color: #333;
			margin-bottom: 1rem;
		}
		p {
			color: #666;
			line-height: 1.6;
		}
	`
})
export class HomePageComponent {}
