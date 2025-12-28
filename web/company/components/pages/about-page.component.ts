import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-about',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">About</p>
				<h1>We build software with care, curiosity, and momentum.</h1>
				<p>
					Melodic Development is a senior-led studio focused on product strategy and engineering. We stay lean,
					hands-on, and deeply involved through launch.
				</p>
			</section>

			<section class="values">
				<article>
					<h2>Clear outcomes</h2>
					<p>Every engagement starts with a shared definition of impact and success metrics.</p>
				</article>
				<article>
					<h2>Senior craft</h2>
					<p>We keep teams senior and small, ensuring depth across design, engineering, and delivery.</p>
				</article>
				<article>
					<h2>Operational empathy</h2>
					<p>We care about the teams who run the product, not just the ones who ship it.</p>
				</article>
			</section>

			<section class="team">
				<h3>Core disciplines</h3>
				<div class="pill-row">
					<span>Product strategy</span>
					<span>Design systems</span>
					<span>Full-stack engineering</span>
					<span>Platform architecture</span>
					<span>Launch operations</span>
				</div>
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
			line-height: 1.7;
			color: var(--md-ink-soft);
		}

		.values {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(73, 33, 109, 0.1);
		}

		h2 {
			margin: 0 0 0.6rem;
			font-size: 1.4rem;
		}

		.team {
			padding: 1.5rem 2rem;
			border-radius: var(--md-radius-lg);
			background: rgba(255, 255, 255, 0.7);
			border: 1px solid rgba(73, 33, 109, 0.1);
		}

		.team h3 {
			margin: 0 0 1rem;
			font-size: 1.1rem;
		}

		.pill-row {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		.pill-row span {
			padding: 0.4rem 0.9rem;
			border-radius: 999px;
			background: rgba(255, 0, 130, 0.12);
			color: var(--md-pink);
			font-weight: 600;
			font-size: 0.85rem;
		}
	`
})
export class AboutPageComponent {}
