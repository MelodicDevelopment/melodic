import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-home',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div>
					<p class="eyebrow">Melodic Development</p>
					<h1>Senior product engineering for teams ready to move.</h1>
					<p class="lead">
						We partner with founders and product leaders to design, build, and launch modern software with clarity
						and momentum.
					</p>
					<div class="actions">
						<a class="btn primary" :routerLink="/contact">Book a consult</a>
					<a class="btn ghost" href="/framework/home">Explore Melodic Framework</a>
					</div>
				</div>
				<div class="hero-card">
					<h3>What we deliver</h3>
					<ul>
						<li>Strategy and product discovery</li>
						<li>Design systems and UX</li>
						<li>Full-stack engineering</li>
						<li>Launch readiness + handoff</li>
					</ul>
				</div>
			</section>

			<section class="services">
				<div class="section-head">
					<h2>Services built for fast-moving teams</h2>
					<p>Pick the engagement style that fits your product stage.</p>
				</div>
				<div class="grid">
					<article>
						<h3>Discovery sprint</h3>
						<p>Align stakeholders, map the opportunity, and produce a build-ready blueprint in 2-3 weeks.</p>
					</article>
					<article>
						<h3>Product build</h3>
						<p>Full-stack delivery with weekly demos, QA, and launch readiness built in.</p>
					</article>
					<article>
						<h3>Acceleration partner</h3>
						<p>Extend your team with senior specialists to unblock critical initiatives.</p>
					</article>
				</div>
			</section>

			<section class="work">
				<div class="section-head">
					<h2>Selected outcomes</h2>
					<p>Proof that thoughtful strategy and modern engineering lead to measurable results.</p>
				</div>
				<div class="work-list">
					<div>
						<h4>Fintech platform rebuild</h4>
						<p>Cut approval time by 38% with a new underwriting workflow engine.</p>
					</div>
					<div>
						<h4>Healthcare operations hub</h4>
						<p>Unified patient data into a single dashboard, reducing escalations by 52%.</p>
					</div>
					<div>
						<h4>Logistics realtime tracking</h4>
						<p>Enabled dispatch teams to resolve delays before SLAs were impacted.</p>
					</div>
				</div>
			</section>

			<section class="framework">
				<div>
					<p class="eyebrow">Built in-house</p>
					<h2>Melodic Framework</h2>
					<p>Our lightweight framework powers fast, elegant component-driven UI without the bloat.</p>
					<a class="btn secondary" href="/framework/docs">Go to docs</a>
				</div>
				<div class="framework-code">
					<pre><code>npm i @melodicdev/core

import { bootstrap } from '@melodicdev/core';

await bootstrap({
	target: '#app',
	rootComponent: 'my-app'
});</code></pre>
				</div>
			</section>

			<section class="cta">
				<div>
					<h2>Ready to build something ambitious?</h2>
					<p>Tell us about your product goals and we will propose a clear path to launch.</p>
				</div>
				<a class="btn primary" :routerLink="/contact">Start a project</a>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
			gap: 4rem;
		}

		.hero {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 2.5rem;
			align-items: center;
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
			font-size: clamp(2.6rem, 4vw, 3.4rem);
			margin: 0 0 1rem;
		}

		.lead {
			font-size: 1.05rem;
			line-height: 1.7;
			color: var(--md-ink-soft);
			margin: 0 0 1.5rem;
		}

		.actions {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
		}

		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.75rem 1.4rem;
			border-radius: 999px;
			font-weight: 700;
			font-size: 0.95rem;
			border: 1px solid transparent;
			transition: transform 0.2s ease;
		}

		.btn.primary {
			background: linear-gradient(135deg, var(--md-pink), var(--md-purple));
			color: white;
			box-shadow: 0 12px 26px rgba(73, 33, 109, 0.18);
		}

		.btn.secondary {
			background: var(--md-purple);
			color: white;
		}

		.btn.ghost {
			border-color: rgba(73, 33, 109, 0.2);
			color: var(--md-purple);
			background: rgba(255, 255, 255, 0.7);
		}

		.btn:hover {
			transform: translateY(-2px);
		}

		.hero-card {
			background: var(--md-surface);
			padding: 1.75rem;
			border-radius: var(--md-radius-lg);
			border: 1px solid rgba(73, 33, 109, 0.12);
			box-shadow: var(--md-shadow-soft);
		}

		.hero-card h3 {
			margin: 0 0 0.75rem;
			font-size: 1.2rem;
		}

		.hero-card ul {
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.5rem;
			color: var(--md-ink-fade);
		}

		.section-head {
			max-width: 640px;
		}

		.section-head h2 {
			font-family: var(--md-font-display);
			font-size: clamp(2rem, 3vw, 2.6rem);
			margin: 0 0 0.6rem;
		}

		.section-head p {
			margin: 0;
			color: var(--md-ink-soft);
			line-height: 1.6;
		}

		.services .grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1.25rem;
			margin-top: 2rem;
		}

		.services article {
			background: var(--md-surface);
			padding: 1.6rem;
			border-radius: var(--md-radius-md);
			border: 1px solid rgba(73, 33, 109, 0.1);
		}

		.services h3 {
			margin: 0 0 0.6rem;
		}

		.services p {
			margin: 0;
			color: var(--md-ink-soft);
			line-height: 1.6;
		}

		.work-list {
			display: grid;
			gap: 1rem;
			margin-top: 1.5rem;
		}

		.work-list div {
			padding: 1.4rem 1.6rem;
			border-radius: var(--md-radius-md);
			background: rgba(255, 255, 255, 0.7);
			border: 1px solid rgba(73, 33, 109, 0.1);
		}

		.work-list h4 {
			margin: 0 0 0.4rem;
			font-size: 1.1rem;
		}

		.work-list p {
			margin: 0;
			color: var(--md-ink-soft);
			line-height: 1.6;
		}

		.framework {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
			gap: 2rem;
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			background: rgba(255, 255, 255, 0.65);
			border: 1px solid rgba(73, 33, 109, 0.12);
		}

		.framework-code {
			background: #0f0b1e;
			color: #f8f4ff;
			padding: 1.4rem;
			border-radius: var(--md-radius-md);
			font-family: 'SFMono-Regular', 'Menlo', monospace;
			font-size: 0.85rem;
			line-height: 1.6;
		}

		.framework-code pre {
			margin: 0;
			white-space: pre-wrap;
		}

		.cta {
			display: flex;
			flex-wrap: wrap;
			gap: 1.5rem;
			align-items: center;
			justify-content: space-between;
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			background: rgba(255, 255, 255, 0.7);
			border: 1px solid rgba(73, 33, 109, 0.12);
		}

		.cta h2 {
			margin: 0 0 0.5rem;
			font-family: var(--md-font-display);
		}

		.cta p {
			margin: 0;
			color: var(--md-ink-soft);
			line-height: 1.6;
		}
	`
})
export class HomePageComponent {}
