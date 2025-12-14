import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/functions/html.function';

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
		ul {
			color: #666;
			line-height: 1.8;
			margin-top: 1rem;
		}
	`
})
export class AboutPageComponent {}
