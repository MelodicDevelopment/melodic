import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-services',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Services</p>
				<h1>Engagements designed for clarity and momentum.</h1>
				<p>
					Choose a delivery model that fits your team. Each engagement includes senior engineering, product design,
					and dedicated project leadership.
				</p>
			</section>

			<section class="grid">
				<article>
					<h2>Discovery Sprint</h2>
					<p>Align stakeholders, map the opportunity, and produce a build-ready blueprint in 2-3 weeks.</p>
					<ul>
						<li>Product vision + KPIs</li>
						<li>UX flows + wireframes</li>
						<li>Architecture + timeline</li>
					</ul>
				</article>
				<article>
					<h2>Product Build</h2>
					<p>Full-stack delivery with weekly demos, QA, and launch readiness built in.</p>
					<ul>
						<li>Design system foundations</li>
						<li>Web + API development</li>
						<li>Analytics + observability</li>
					</ul>
				</article>
				<article>
					<h2>Acceleration Partner</h2>
					<p>Extend your team with senior specialists to unblock critical initiatives.</p>
					<ul>
						<li>Fractional tech leadership</li>
						<li>Performance + reliability</li>
						<li>Ship the backlog</li>
					</ul>
				</article>
			</section>

			<section class="addons">
				<h3>Specialty support</h3>
				<div class="pill-row">
					<span>Design audits</span>
					<span>Developer experience</span>
					<span>AI enablement</span>
					<span>Team enablement</span>
					<span>Launch strategy</span>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
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
			font-size: clamp(2.4rem, 3vw, 3rem);
			margin: 0 0 1rem;
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: var(--md-ink-soft);
		}

		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

		ul {
			margin: 1rem 0 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.5rem;
			color: var(--md-ink-fade);
		}

		.addons {
			padding: 1.5rem 2rem;
			border-radius: var(--md-radius-lg);
			background: rgba(255, 255, 255, 0.7);
			border: 1px solid rgba(73, 33, 109, 0.1);
		}

		.addons h3 {
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
			background: rgba(0, 157, 217, 0.12);
			color: var(--md-blue);
			font-weight: 600;
			font-size: 0.85rem;
		}
	`
})
export class ServicesPageComponent {}
