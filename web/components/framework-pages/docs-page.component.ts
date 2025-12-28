import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-framework-docs',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<h1>Documentation</h1>
					<p class="hero-lead">Learn how to build fast, composable web components with Melodic.</p>
				</div>
			</section>

			<section class="docs">
				<aside class="sidebar">
					<nav class="doc-nav">
						<div class="nav-section">
							<h4>Getting Started</h4>
							<a href="#" class="active">Introduction</a>
							<a href="#">Installation</a>
							<a href="#">Quick Start</a>
						</div>
						<div class="nav-section">
							<h4>Core Concepts</h4>
							<a href="#">Components</a>
							<a href="#">Templates</a>
							<a href="#">Reactivity</a>
							<a href="#">Lifecycle</a>
						</div>
						<div class="nav-section">
							<h4>Directives</h4>
							<a href="#">Built-in Directives</a>
							<a href="#">Custom Directives</a>
						</div>
						<div class="nav-section">
							<h4>Routing</h4>
							<a href="#">Router Setup</a>
							<a href="#">Navigation</a>
							<a href="#">Route Guards</a>
						</div>
						<div class="nav-section">
							<h4>Advanced</h4>
							<a href="#">Signals</a>
							<a href="#">Services</a>
							<a href="#">Testing</a>
						</div>
					</nav>
				</aside>

				<main class="doc-content">
					<article>
						<h2>Introduction</h2>
						<p>
							Melodic is a lightweight web component framework built on native browser APIs. It provides a familiar, expressive syntax while
							delivering exceptional performance through direct DOM manipulation.
						</p>

						<h3>Why Melodic?</h3>
						<ul>
							<li><strong>Tiny footprint</strong> - Under 8kb gzipped, with no dependencies</li>
							<li><strong>Native performance</strong> - No virtual DOM overhead</li>
							<li><strong>True encapsulation</strong> - Shadow DOM by default</li>
							<li><strong>TypeScript first</strong> - Full type safety and excellent DX</li>
							<li><strong>Batteries included</strong> - Routing, state management, directives</li>
						</ul>

						<h3>Quick Example</h3>
						<div class="code-example">
							<pre><code><span class="keyword">import</span> { MelodicComponent } <span class="keyword">from</span> <span class="string">'@melodicdev/core'</span>;
<span class="keyword">import</span> { html } <span class="keyword">from</span> <span class="string">'@melodicdev/core'</span>;

<span class="decorator">@MelodicComponent</span>({
  <span class="property">selector</span>: <span class="string">'hello-world'</span>,
  <span class="property">template</span>: () => <span class="function">html</span>\`
    <span class="tag">&lt;h1&gt;</span>Hello, \${<span class="keyword">this</span>.name}!<span class="tag">&lt;/h1&gt;</span>
  \`
})
<span class="keyword">export class</span> <span class="class">HelloWorld</span> {
  <span class="property">name</span> = <span class="string">'World'</span>;
}</code></pre>
						</div>

						<h3>Next Steps</h3>
						<p>
							Ready to get started? Check out the <a href="#">Installation guide</a> to set up your first Melodic project, or dive into the
							<a href="#">Quick Start</a> for a hands-on tutorial.
						</p>
					</article>

					<nav class="doc-pagination">
						<div></div>
						<a href="#" class="next">
							<span>Installation</span>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
					</nav>
				</main>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
		}

		.hero {
			background: var(--alt-gray-50);
			padding: 4rem 2rem;
			border-bottom: 1px solid var(--alt-gray-200);
		}

		.hero-content {
			max-width: 1280px;
			margin: 0 auto;
		}

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 4vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.hero-lead {
			font-size: 1.125rem;
			color: var(--alt-gray-600);
			margin: 0;
		}

		.docs {
			display: grid;
			grid-template-columns: 260px 1fr;
			max-width: 1280px;
			margin: 0 auto;
			padding: 0 2rem;
		}

		.sidebar {
			border-right: 1px solid var(--alt-gray-200);
			padding: 2rem 2rem 2rem 0;
			position: sticky;
			top: 80px;
			height: calc(100vh - 80px);
			overflow-y: auto;
		}

		.nav-section {
			margin-bottom: 1.5rem;
		}

		.nav-section h4 {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-gray-500);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin: 0 0 0.75rem;
		}

		.nav-section a {
			display: block;
			padding: 0.5rem 0.75rem;
			font-size: 0.9375rem;
			color: var(--alt-gray-600);
			border-radius: var(--alt-radius-sm);
			transition: all var(--alt-transition-fast);
		}

		.nav-section a:hover {
			color: var(--alt-gray-900);
			background: var(--alt-gray-100);
		}

		.nav-section a.active {
			color: #06b6d4;
			background: rgba(6, 182, 212, 0.1);
		}

		.doc-content {
			padding: 2rem 0 4rem 3rem;
			max-width: 800px;
		}

		.doc-content h2 {
			font-family: var(--alt-font-display);
			font-size: 2rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.doc-content h3 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 2.5rem 0 1rem;
		}

		.doc-content p {
			font-size: 1.0625rem;
			line-height: 1.7;
			color: var(--alt-gray-700);
			margin: 0 0 1.25rem;
		}

		.doc-content ul {
			margin: 0 0 1.5rem;
			padding-left: 1.5rem;
		}

		.doc-content li {
			font-size: 1rem;
			line-height: 1.7;
			color: var(--alt-gray-700);
			margin-bottom: 0.5rem;
		}

		.doc-content a {
			color: #06b6d4;
			font-weight: 500;
		}

		.doc-content a:hover {
			text-decoration: underline;
		}

		.code-example {
			background: var(--alt-gray-900);
			border-radius: var(--alt-radius-lg);
			overflow: hidden;
			margin: 1.5rem 0;
		}

		.code-example pre {
			margin: 0;
			padding: 1.5rem;
			font-family: var(--alt-font-mono);
			font-size: 0.875rem;
			line-height: 1.7;
			color: var(--alt-gray-300);
			overflow-x: auto;
		}

		.code-example .keyword {
			color: #c084fc;
		}
		.code-example .string {
			color: #86efac;
		}
		.code-example .decorator {
			color: #fbbf24;
		}
		.code-example .function {
			color: #60a5fa;
		}
		.code-example .property {
			color: #93c5fd;
		}
		.code-example .class {
			color: #67e8f9;
		}
		.code-example .tag {
			color: #f87171;
		}

		.doc-pagination {
			display: flex;
			justify-content: space-between;
			margin-top: 4rem;
			padding-top: 2rem;
			border-top: 1px solid var(--alt-gray-200);
		}

		.doc-pagination a {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			color: #06b6d4;
		}

		.doc-pagination a:hover {
			text-decoration: underline;
		}

		@media (max-width: 900px) {
			.docs {
				grid-template-columns: 1fr;
			}

			.sidebar {
				display: none;
			}

			.doc-content {
				padding: 2rem 0 4rem;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.docs {
				padding-left: 1.25rem;
				padding-right: 1.25rem;
			}
		}
	`
})
export class AltFrameworkDocsPageComponent {}
