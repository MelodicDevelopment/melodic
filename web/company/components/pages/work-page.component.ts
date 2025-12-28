import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-work',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Work</p>
				<h1>Case studies that show measurable impact.</h1>
				<p>We focus on outcomes: faster launches, clearer workflows, and stronger product adoption.</p>
			</section>

			<section class="case-grid">
				<article>
					<h2>Atlas Freight</h2>
					<p class="summary">Built a real-time logistics control tower across 12 regions.</p>
					<ul>
						<li>Unified data streams into a single ops dashboard</li>
						<li>Reduced dispatch response time by 44%</li>
						<li>Automated incident alerts</li>
					</ul>
					<span class="tag">Operations</span>
					<span class="tag">Realtime</span>
				</article>
				<article>
					<h2>Brightlane Health</h2>
					<p class="summary">Modernized patient intake and claims processing.</p>
					<ul>
						<li>Replaced legacy portal with secure workflow tools</li>
						<li>Shipped in 9 weeks with compliance baked in</li>
						<li>Improved CSAT by 31%</li>
					</ul>
					<span class="tag">Healthcare</span>
					<span class="tag">Security</span>
				</article>
				<article>
					<h2>Northwind Labs</h2>
					<p class="summary">Created a launch-ready MVP for a new analytics product.</p>
					<ul>
						<li>Defined the product roadmap and pricing model</li>
						<li>Delivered a multi-tenant dashboard</li>
						<li>Onboarded first 5 enterprise customers</li>
					</ul>
					<span class="tag">B2B SaaS</span>
					<span class="tag">Go-to-market</span>
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

		.case-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(73, 33, 109, 0.12);
		}

		h2 {
			margin: 0 0 0.75rem;
			font-size: 1.4rem;
		}

		.summary {
			color: var(--md-ink-soft);
			margin-bottom: 1rem;
		}

		ul {
			margin: 0 0 1.5rem;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.5rem;
			color: var(--md-ink-fade);
		}

		.tag {
			display: inline-flex;
			padding: 0.3rem 0.7rem;
			border-radius: 999px;
			background: rgba(255, 0, 130, 0.12);
			color: var(--md-pink);
			font-size: 0.75rem;
			font-weight: 600;
			margin-right: 0.4rem;
		}
	`
})
export class WorkPageComponent {}
