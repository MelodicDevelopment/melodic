import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-home',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div>
					<p class="eyebrow">Melodic Framework</p>
					<h1>Build UI that is composable, fast, and easy to reason about.</h1>
					<p>
						Melodic is a lightweight web component framework with routing, state, and templates baked in.
						Designed for teams that want clarity without sacrificing speed.
					</p>
					<div class="actions">
					<a class="btn primary" :routerLink="/framework/docs">Read the docs</a>
					<a class="btn ghost" :routerLink="/framework/download">Download</a>
					</div>
				</div>
				<div class="hero-card">
					<span>Install</span>
					<pre><code>npm i @melodicdev/core</code></pre>
					<span>Bootstrap</span>
					<pre><code>import { bootstrap } from '@melodicdev/core';

await bootstrap({
	target: '#app',
	rootComponent: 'my-app'
});</code></pre>
				</div>
			</section>

			<section class="features">
				<div class="section-head">
					<h2>Why teams choose Melodic</h2>
					<p>Modern features without the framework weight.</p>
				</div>
				<div class="grid">
					<article>
						<h3>Composable components</h3>
						<p>Define clean, scoped components with templates, styles, and minimal boilerplate.</p>
					</article>
					<article>
						<h3>Built-in routing</h3>
						<p>Nested routes, guards, and lazy loading without extra dependencies.</p>
					</article>
					<article>
						<h3>State you can trust</h3>
						<p>Signals and reducers that stay readable even as the app grows.</p>
					</article>
				</div>
			</section>

			<section class="highlight">
				<div>
					<p class="eyebrow">Developer experience</p>
					<h2>Readable by default, fast by design.</h2>
					<p>Ship quickly with predictable templates, a simple component lifecycle, and a tiny runtime.</p>
				</div>
				<ul>
					<li>TypeScript-first API with type-only imports.</li>
					<li>Shadow DOM styling with scoped CSS.</li>
					<li>Small bundle footprint for production builds.</li>
				</ul>
			</section>

			<section class="cta">
				<div>
					<h2>Ready to build with Melodic?</h2>
					<p>Start with the docs, follow a tutorial, and deploy in minutes.</p>
				</div>
					<a class="btn primary" :routerLink="/framework/docs">Get started</a>
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

		p {
			margin: 0;
			line-height: 1.7;
			color: var(--md-ink-soft);
		}

		.actions {
			display: flex;
			gap: 1rem;
			margin-top: 1.5rem;
			flex-wrap: wrap;
		}

		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.75rem 1.4rem;
			border-radius: 999px;
			font-weight: 700;
			border: 1px solid transparent;
			font-size: 0.95rem;
			transition: transform 0.2s ease;
		}

		.btn.primary {
			background: linear-gradient(135deg, var(--md-blue), var(--md-purple));
			color: white;
			box-shadow: 0 14px 28px rgba(0, 157, 217, 0.25);
		}

		.btn.ghost {
			border: 1px solid rgba(0, 157, 217, 0.25);
			color: var(--md-blue);
			background: rgba(255, 255, 255, 0.7);
		}

		.hero-card {
			background: #0f1627;
			color: #e8f3ff;
			padding: 1.6rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow);
			font-family: 'SFMono-Regular', 'Menlo', monospace;
			font-size: 0.85rem;
		}

		.hero-card span {
			display: block;
			text-transform: uppercase;
			letter-spacing: 0.16em;
			font-size: 0.65rem;
			color: rgba(232, 243, 255, 0.6);
			margin-bottom: 0.5rem;
		}

		.hero-card pre {
			margin: 0 0 1.2rem;
			white-space: pre-wrap;
		}

		.section-head {
			max-width: 600px;
		}

		.section-head h2 {
			font-family: var(--md-font-display);
			font-size: clamp(2rem, 3vw, 2.6rem);
			margin: 0 0 0.6rem;
		}

		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1.5rem;
			margin-top: 2rem;
		}

		article {
			background: var(--md-surface);
			padding: 1.6rem;
			border-radius: var(--md-radius-md);
			border: 1px solid rgba(0, 157, 217, 0.12);
			box-shadow: var(--md-shadow-soft);
		}

		article h3 {
			margin: 0 0 0.6rem;
		}

		.highlight {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 2rem;
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			background: linear-gradient(135deg, rgba(0, 157, 217, 0.12), rgba(73, 33, 109, 0.12));
			border: 1px solid rgba(0, 157, 217, 0.18);
		}

		.highlight ul {
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.6rem;
			color: var(--md-ink-soft);
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
			border: 1px solid rgba(0, 157, 217, 0.18);
		}

		.cta h2 {
			margin: 0 0 0.5rem;
			font-family: var(--md-font-display);
		}

		@media (max-width: 720px) {
			.hero {
				grid-template-columns: 1fr;
			}
		}
	`
})
export class HomePageComponent {}
