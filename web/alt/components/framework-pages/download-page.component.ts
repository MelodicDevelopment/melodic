import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-framework-download',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Download</span>
					<h1>Get Melodic</h1>
					<p class="hero-lead">Install Melodic via npm or use the CDN for quick prototyping.</p>
				</div>
			</section>

			<section class="download">
				<div class="download-grid">
					<div class="download-option">
						<h2>npm (Recommended)</h2>
						<p>The recommended way to install Melodic for production applications.</p>
						<div class="code-block">
							<code>npm install @melodicdev/core</code>
							<button class="copy-btn" title="Copy">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
								</svg>
							</button>
						</div>
						<p class="version">Current version: <strong>1.0.0</strong></p>
					</div>

					<div class="download-option">
						<h2>yarn</h2>
						<p>If you prefer yarn as your package manager.</p>
						<div class="code-block">
							<code>yarn add @melodicdev/core</code>
							<button class="copy-btn" title="Copy">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
								</svg>
							</button>
						</div>
					</div>

					<div class="download-option">
						<h2>pnpm</h2>
						<p>Fast, disk space efficient package manager.</p>
						<div class="code-block">
							<code>pnpm add @melodicdev/core</code>
							<button class="copy-btn" title="Copy">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
								</svg>
							</button>
						</div>
					</div>

					<div class="download-option full-width">
						<h2>CDN</h2>
						<p>For quick prototyping or learning. Not recommended for production.</p>
						<div class="code-block">
							<code>&lt;script type="module" src="https://unpkg.com/@melodicdev/core"&gt;&lt;/script&gt;</code>
							<button class="copy-btn" title="Copy">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div class="cli-section">
					<h2>Melodic CLI</h2>
					<p>Scaffold new projects and generate components with the Melodic CLI.</p>
					<div class="code-block">
						<code>npx @melodicdev/cli create my-app</code>
						<button class="copy-btn" title="Copy">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
							</svg>
						</button>
					</div>
					<a href="#" class="cli-link">Learn more about the CLI</a>
				</div>
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
			padding: 6rem 2rem;
			text-align: center;
		}

		.hero-content {
			max-width: 720px;
			margin: 0 auto;
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

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2.5rem, 5vw, 3.25rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.hero-lead {
			font-size: 1.25rem;
			color: var(--alt-gray-600);
			margin: 0;
		}

		.download {
			max-width: 900px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.download-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 1.5rem;
			margin-bottom: 3rem;
		}

		.download-option {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
		}

		.download-option.full-width {
			grid-column: 1 / -1;
		}

		.download-option h2 {
			font-family: var(--alt-font-display);
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.download-option > p {
			font-size: 0.9375rem;
			color: var(--alt-gray-600);
			margin: 0 0 1.25rem;
		}

		.code-block {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: var(--alt-gray-900);
			padding: 1rem 1.25rem;
			border-radius: var(--alt-radius-md);
		}

		.code-block code {
			font-family: var(--alt-font-mono);
			font-size: 0.875rem;
			color: var(--alt-gray-300);
		}

		.copy-btn {
			display: flex;
			padding: 0.25rem;
			color: var(--alt-gray-500);
			transition: color var(--alt-transition-fast);
		}

		.copy-btn:hover {
			color: var(--alt-white);
		}

		.version {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
			margin: 1rem 0 0;
		}

		.version strong {
			color: var(--alt-gray-700);
		}

		.cli-section {
			background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
			padding: 2.5rem;
			border-radius: var(--alt-radius-xl);
			border: 1px solid var(--alt-gray-200);
			text-align: center;
		}

		.cli-section h2 {
			font-family: var(--alt-font-display);
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.cli-section > p {
			font-size: 1rem;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
		}

		.cli-section .code-block {
			max-width: 400px;
			margin: 0 auto 1.5rem;
		}

		.cli-link {
			font-size: 0.9375rem;
			font-weight: 600;
			color: #06b6d4;
		}

		.cli-link:hover {
			text-decoration: underline;
		}

		@media (max-width: 640px) {
			.hero,
			.download {
				padding: 4rem 1.25rem;
			}
		}
	`
})
export class AltFrameworkDownloadPageComponent {}
