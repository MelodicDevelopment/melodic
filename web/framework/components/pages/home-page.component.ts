import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-home',
	template: () => html`
		<div class="page">
			<!-- Hero -->
			<section class="hero">
				<div class="hero-content">
					<div class="hero-badge">
						<span class="badge-version">v1.0</span>
						<span>Now available</span>
					</div>
					<h1>Build fast, <span class="gradient-text">stay fast</span></h1>
					<p class="hero-lead">
						A lightweight web component framework with reactive state, built-in routing, and an expressive template system. No virtual DOM, just
						fast native rendering.
					</p>
					<div class="hero-actions">
						<a class="btn btn-primary btn-lg" :routerLink="/docs">
							Get started
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
						<a class="btn btn-ghost btn-lg" href="https://github.com/nickhoppy/melodic" target="_blank" rel="noopener">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
								/>
							</svg>
							View on GitHub
						</a>
					</div>
				</div>
				<div class="hero-code">
					<div class="code-card">
						<div class="code-header">
							<span class="dot red"></span>
							<span class="dot yellow"></span>
							<span class="dot green"></span>
							<span class="file-name">app.component.ts</span>
						</div>
						<pre class="code-block"><code><span class="decorator">@MelodicComponent</span>({
  <span class="property">selector</span>: <span class="string">'my-app'</span>,
  <span class="property">template</span>: () => <span class="function">html</span>\`
    <span class="tag">&lt;h1&gt;</span>Hello, \${<span class="keyword">this</span>.name}!<span class="tag">&lt;/h1&gt;</span>
    <span class="tag">&lt;button</span> <span class="attr">@click</span>=\${<span class="keyword">this</span>.greet}<span class="tag">&gt;</span>
      Click me
    <span class="tag">&lt;/button&gt;</span>
  \`
})
<span class="keyword">export class</span> <span class="class">AppComponent</span> {
  <span class="property">name</span> = <span class="string">'World'</span>;

  <span class="function">greet</span>() {
    <span class="function">alert</span>(<span class="string">\`Hello, \${<span class="keyword">this</span>.name}!\`</span>);
  }
}</code></pre>
					</div>
				</div>
			</section>

			<!-- Install -->
			<section class="install">
				<div class="install-inner">
					<code class="install-command">npm install @nickhoppy/melodic</code>
					<button class="copy-btn" title="Copy to clipboard">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					</button>
				</div>
			</section>

			<!-- Features -->
			<section class="features">
				<div class="section-header">
					<span class="section-label">Features</span>
					<h2>Everything you need, nothing you don't</h2>
					<p>A complete framework in under 8kb gzipped.</p>
				</div>
				<div class="features-grid">
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
							</svg>
						</div>
						<h3>Fast Templates</h3>
						<p>Parse-once, update-forever. Template literals that compile to efficient DOM operations.</p>
					</article>
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<path d="M12 6v6l4 2" />
							</svg>
						</div>
						<h3>Reactive State</h3>
						<p>Automatic dependency tracking. Change a property, watch the UI update instantly.</p>
					</article>
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
							</svg>
						</div>
						<h3>Shadow DOM</h3>
						<p>True encapsulation. Styles and DOM isolated by default with native browser support.</p>
					</article>
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polygon points="12 2 2 7 12 12 22 7 12 2" />
								<polyline points="2 17 12 22 22 17" />
								<polyline points="2 12 12 17 22 12" />
							</svg>
						</div>
						<h3>Built-in Router</h3>
						<p>Nested routes, guards, lazy loading. Everything you need for complex SPAs.</p>
					</article>
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14 2 14 8 20 8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
							</svg>
						</div>
						<h3>TypeScript First</h3>
						<p>Full type safety with decorators. Excellent IDE support and autocomplete.</p>
					</article>
					<article class="feature-card">
						<div class="feature-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<line x1="3" y1="9" x2="21" y2="9" />
								<line x1="9" y1="21" x2="9" y2="9" />
							</svg>
						</div>
						<h3>Directives</h3>
						<p>Powerful primitives for DOM manipulation. repeat, when, classMap, and more.</p>
					</article>
				</div>
			</section>

			<!-- Comparison -->
			<section class="comparison">
				<div class="comparison-inner">
					<div class="section-header">
						<span class="section-label">Why Melodic</span>
						<h2>Modern features, minimal footprint</h2>
					</div>
					<div class="comparison-table">
						<div class="comparison-header">
							<div class="comparison-cell"></div>
							<div class="comparison-cell highlight">Melodic</div>
							<div class="comparison-cell">React</div>
							<div class="comparison-cell">Vue</div>
							<div class="comparison-cell">Angular</div>
						</div>
						<div class="comparison-row">
							<div class="comparison-cell label">Bundle size</div>
							<div class="comparison-cell highlight">~8kb</div>
							<div class="comparison-cell">~45kb</div>
							<div class="comparison-cell">~34kb</div>
							<div class="comparison-cell">~130kb</div>
						</div>
						<div class="comparison-row">
							<div class="comparison-cell label">Virtual DOM</div>
							<div class="comparison-cell highlight">No</div>
							<div class="comparison-cell">Yes</div>
							<div class="comparison-cell">Yes</div>
							<div class="comparison-cell">No</div>
						</div>
						<div class="comparison-row">
							<div class="comparison-cell label">Native encapsulation</div>
							<div class="comparison-cell highlight">Yes</div>
							<div class="comparison-cell">No</div>
							<div class="comparison-cell">Scoped</div>
							<div class="comparison-cell">Emulated</div>
						</div>
						<div class="comparison-row">
							<div class="comparison-cell label">Built-in routing</div>
							<div class="comparison-cell highlight">Yes</div>
							<div class="comparison-cell">No</div>
							<div class="comparison-cell">Optional</div>
							<div class="comparison-cell">Yes</div>
						</div>
					</div>
				</div>
			</section>

			<!-- CTA -->
			<section class="cta">
				<div class="cta-content">
					<h2>Ready to build something fast?</h2>
					<p>Get started in minutes with our quickstart guide.</p>
					<a class="btn btn-primary btn-lg" :routerLink="/docs">
						Read the docs
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</a>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
		}

		/* Hero */
		.hero {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
			align-items: center;
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem 4rem;
		}

		.hero-badge {
			display: inline-flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.5rem 1rem 0.5rem 0.5rem;
			background: var(--alt-gray-100);
			border-radius: var(--alt-radius-full);
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--alt-gray-600);
			margin-bottom: 1.5rem;
		}

		.badge-version {
			background: linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%);
			color: white;
			padding: 0.25rem 0.625rem;
			border-radius: var(--alt-radius-full);
			font-weight: 600;
		}

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2.5rem, 5vw, 3.5rem);
			font-weight: 700;
			line-height: 1.1;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.gradient-text {
			background: linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.hero-lead {
			font-size: 1.25rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
			max-width: 500px;
		}

		.hero-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
		}

		.btn-lg {
			padding: 0.875rem 1.75rem;
			font-size: 1rem;
		}

		.btn-primary {
			background: linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%);
			color: var(--alt-white);
			box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
		}

		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
		}

		.btn-ghost {
			background: var(--alt-white);
			color: var(--alt-gray-700);
			border: 1px solid var(--alt-gray-200);
		}

		.btn-ghost:hover {
			background: var(--alt-gray-50);
			border-color: var(--alt-gray-300);
		}

		/* Code Card */
		.hero-code {
			display: flex;
			justify-content: flex-end;
		}

		.code-card {
			width: 100%;
			max-width: 500px;
			background: var(--alt-gray-900);
			border-radius: var(--alt-radius-lg);
			overflow: hidden;
			box-shadow: var(--alt-shadow-lg), 0 0 40px rgba(6, 182, 212, 0.1);
		}

		.code-header {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 1rem 1.25rem;
			background: var(--alt-gray-800);
			border-bottom: 1px solid var(--alt-gray-700);
		}

		.dot {
			width: 12px;
			height: 12px;
			border-radius: 50%;
		}

		.dot.red {
			background: #ef4444;
		}
		.dot.yellow {
			background: #eab308;
		}
		.dot.green {
			background: #22c55e;
		}

		.file-name {
			margin-left: auto;
			font-family: var(--alt-font-mono);
			font-size: 0.8125rem;
			color: var(--alt-gray-500);
		}

		.code-block {
			margin: 0;
			padding: 1.5rem;
			font-family: var(--alt-font-mono);
			font-size: 0.8125rem;
			line-height: 1.7;
			color: var(--alt-gray-300);
			overflow-x: auto;
		}

		.code-block .decorator {
			color: #fbbf24;
		}
		.code-block .keyword {
			color: #c084fc;
		}
		.code-block .string {
			color: #86efac;
		}
		.code-block .function {
			color: #60a5fa;
		}
		.code-block .property {
			color: #93c5fd;
		}
		.code-block .class {
			color: #67e8f9;
		}
		.code-block .tag {
			color: #f87171;
		}
		.code-block .attr {
			color: #a5b4fc;
		}

		/* Install */
		.install {
			background: var(--alt-gray-50);
			padding: 2rem;
			border-top: 1px solid var(--alt-gray-200);
			border-bottom: 1px solid var(--alt-gray-200);
		}

		.install-inner {
			display: flex;
			align-items: center;
			justify-content: space-between;
			max-width: 400px;
			margin: 0 auto;
			padding: 0.875rem 1.25rem;
			background: var(--alt-gray-900);
			border-radius: var(--alt-radius-md);
		}

		.install-command {
			font-family: var(--alt-font-mono);
			font-size: 0.9375rem;
			color: var(--alt-gray-300);
		}

		.copy-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.5rem;
			background: transparent;
			border: none;
			border-radius: var(--alt-radius-sm);
			color: var(--alt-gray-500);
			cursor: pointer;
			transition: all var(--alt-transition-fast);
		}

		.copy-btn:hover {
			color: var(--alt-white);
			background: var(--alt-gray-700);
		}

		/* Section Styles */
		.section-header {
			text-align: center;
			max-width: 640px;
			margin: 0 auto 3rem;
		}

		.section-label {
			display: inline-block;
			font-size: 0.875rem;
			font-weight: 600;
			color: #06b6d4;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.75rem;
		}

		.section-header h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		.section-header p {
			font-size: 1.125rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Features */
		.features {
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.features-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
			gap: 1.5rem;
		}

		.feature-card {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-normal);
		}

		.feature-card:hover {
			border-color: rgba(6, 182, 212, 0.4);
			box-shadow: var(--alt-shadow-lg);
			transform: translateY(-4px);
		}

		.feature-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 48px;
			height: 48px;
			background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
			border-radius: var(--alt-radius-md);
			color: #06b6d4;
			margin-bottom: 1.5rem;
		}

		.feature-card h3 {
			font-family: var(--alt-font-display);
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.feature-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Comparison */
		.comparison {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
		}

		.comparison-inner {
			max-width: 900px;
			margin: 0 auto;
		}

		.comparison-table {
			background: var(--alt-white);
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			overflow: hidden;
		}

		.comparison-header,
		.comparison-row {
			display: grid;
			grid-template-columns: 2fr repeat(4, 1fr);
		}

		.comparison-header {
			background: var(--alt-gray-50);
			border-bottom: 1px solid var(--alt-gray-200);
		}

		.comparison-row:not(:last-child) {
			border-bottom: 1px solid var(--alt-gray-100);
		}

		.comparison-cell {
			padding: 1rem 1.25rem;
			font-size: 0.9375rem;
			color: var(--alt-gray-600);
			text-align: center;
		}

		.comparison-cell.label {
			text-align: left;
			font-weight: 500;
			color: var(--alt-gray-900);
		}

		.comparison-cell.highlight {
			background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
			font-weight: 600;
			color: #06b6d4;
		}

		.comparison-header .comparison-cell {
			font-weight: 600;
			color: var(--alt-gray-900);
		}

		/* CTA */
		.cta {
			background: var(--alt-gradient-dark);
			padding: 6rem 2rem;
			text-align: center;
		}

		.cta-content {
			max-width: 640px;
			margin: 0 auto;
		}

		.cta h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 4vw, 2.75rem);
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.cta p {
			font-size: 1.25rem;
			color: var(--alt-gray-400);
			margin: 0 0 2rem;
		}

		/* Responsive */
		@media (max-width: 1024px) {
			.hero {
				grid-template-columns: 1fr;
				padding: 4rem 2rem;
			}

			.hero-code {
				display: none;
			}
		}

		@media (max-width: 640px) {
			.hero {
				padding: 3rem 1.25rem;
			}

			.features,
			.comparison,
			.cta {
				padding: 4rem 1.25rem;
			}

			.features-grid {
				grid-template-columns: 1fr;
			}

			.comparison-table {
				overflow-x: auto;
			}

			.comparison-header,
			.comparison-row {
				min-width: 600px;
			}
		}
	`
})
export class FrameworkHomePageComponent {}
