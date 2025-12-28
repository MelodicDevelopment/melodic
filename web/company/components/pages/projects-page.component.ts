import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-projects',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Projects</p>
				<h1>Products and platforms we maintain.</h1>
				<p>In addition to client work, we build internal products that keep our tooling sharp.</p>
			</section>

			<section class="cards">
				<article>
					<h2>Melodic Framework</h2>
					<p>Composable web component framework with routing, state, and templates.</p>
					<div class="meta">
						<span>Open source</span>
						<span>TypeScript</span>
					</div>
					<a class="link" href="/framework/docs">Documentation</a>
				</article>
				<article>
					<h2>Signalboard</h2>
					<p>Operational analytics workspace for distributed teams and customer success.</p>
					<div class="meta">
						<span>Private beta</span>
						<span>Realtime</span>
					</div>
					<a class="link" :routerLink="/contact">Request access</a>
				</article>
				<article>
					<h2>Loopline</h2>
					<p>AI-assisted release planning that keeps stakeholders aligned and informed.</p>
					<div class="meta">
						<span>Roadmapping</span>
						<span>Internal</span>
					</div>
					<a class="link" :routerLink="/contact">Partner with us</a>
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

		.cards {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(73, 33, 109, 0.12);
			display: grid;
			gap: 0.9rem;
		}

		h2 {
			margin: 0;
			font-size: 1.4rem;
		}

		.meta {
			display: flex;
			gap: 0.6rem;
			flex-wrap: wrap;
			color: var(--md-ink-fade);
			font-size: 0.85rem;
		}

		.meta span {
			padding: 0.3rem 0.7rem;
			border-radius: 999px;
			background: rgba(0, 157, 217, 0.12);
			color: var(--md-blue);
			font-weight: 600;
		}

		.link {
			font-weight: 700;
			color: var(--md-purple);
		}
	`
})
export class ProjectsPageComponent {}
