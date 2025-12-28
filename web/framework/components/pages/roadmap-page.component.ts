import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-roadmap',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Roadmap</p>
				<h1>Where Melodic is headed next.</h1>
				<p>We ship in small, deliberate releases with a focus on developer experience.</p>
			</section>

			<section class="timeline">
				<article>
					<h2>Now</h2>
					<ul>
						<li>Docs refresh and starter templates</li>
						<li>Improved router devtools</li>
						<li>More component examples</li>
					</ul>
				</article>
				<article>
					<h2>Next</h2>
					<ul>
						<li>CLI scaffolding</li>
						<li>Form validation helpers</li>
						<li>Accessibility audits</li>
					</ul>
				</article>
				<article>
					<h2>Later</h2>
					<ul>
						<li>Official integrations</li>
						<li>Component marketplace</li>
						<li>Community plugins</li>
					</ul>
				</article>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: grid;
			gap: 3rem;
		}

		.hero {
			max-width: 720px;
		}

		.eyebrow {
			text-transform: uppercase;
			letter-spacing: 0.2em;
			font-size: 0.75rem;
			color: var(--md-ink-fade);
			margin: 0 0 0.8rem;
		}

		h1 {
			font-family: var(--md-font-display);
			font-size: clamp(2.3rem, 3vw, 3rem);
			margin: 0 0 1rem;
		}

		p {
			margin: 0;
			color: var(--md-ink-soft);
			line-height: 1.7;
		}

		.timeline {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 1.8rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(0, 157, 217, 0.12);
		}

		h2 {
			margin: 0 0 0.8rem;
			font-size: 1.4rem;
		}

		ul {
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.5rem;
			color: var(--md-ink-fade);
		}
	`
})
export class RoadmapPageComponent {}
