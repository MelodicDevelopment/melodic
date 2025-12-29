import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-community',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Community</span>
					<h1>Join the community</h1>
					<p class="hero-lead">Connect with other developers building with Melodic.</p>
				</div>
			</section>

			<section class="community">
				<div class="channels-grid">
					<a href="https://github.com/nickhoppy/melodic" target="_blank" rel="noopener" class="channel-card">
						<div class="channel-icon github">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
								/>
							</svg>
						</div>
						<h2>GitHub</h2>
						<p>Star the repo, report issues, and contribute to the framework.</p>
					</a>

					<a href="https://github.com/nickhoppy/melodic/discussions" target="_blank" rel="noopener" class="channel-card">
						<div class="channel-icon discussions">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
						</div>
						<h2>Discussions</h2>
						<p>Ask questions, share ideas, and get help from the community.</p>
					</a>

					<a href="https://discord.gg/melodicdev" target="_blank" rel="noopener" class="channel-card">
						<div class="channel-icon discord">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"
								/>
							</svg>
						</div>
						<h2>Discord</h2>
						<p>Chat in real-time with other Melodic developers.</p>
					</a>

					<a href="https://twitter.com/melodicdev" target="_blank" rel="noopener" class="channel-card">
						<div class="channel-icon twitter">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
								/>
							</svg>
						</div>
						<h2>Twitter</h2>
						<p>Follow for updates, tips, and announcements.</p>
					</a>
				</div>

				<div class="contribute">
					<h2>Contribute to Melodic</h2>
					<p>Melodic is open source and we welcome contributions of all kinds.</p>
					<div class="contribute-grid">
						<div class="contribute-item">
							<h3>Report Issues</h3>
							<p>Found a bug? Open an issue on GitHub with reproduction steps.</p>
						</div>
						<div class="contribute-item">
							<h3>Submit PRs</h3>
							<p>Fix bugs, add features, or improve documentation.</p>
						</div>
						<div class="contribute-item">
							<h3>Write Guides</h3>
							<p>Share your knowledge by writing tutorials and guides.</p>
						</div>
						<div class="contribute-item">
							<h3>Help Others</h3>
							<p>Answer questions in discussions and on Discord.</p>
						</div>
					</div>
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

		.community {
			max-width: 1000px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.channels-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
			gap: 1.5rem;
			margin-bottom: 4rem;
		}

		.channel-card {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding: 2rem;
			background: var(--alt-white);
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-normal);
		}

		.channel-card:hover {
			border-color: var(--alt-gray-300);
			box-shadow: var(--alt-shadow-md);
			transform: translateY(-4px);
		}

		.channel-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 56px;
			height: 56px;
			border-radius: var(--alt-radius-lg);
			margin-bottom: 1rem;
		}

		.channel-icon.github {
			background: var(--alt-gray-900);
			color: white;
		}

		.channel-icon.discussions {
			background: #8b5cf6;
			color: white;
		}

		.channel-icon.discord {
			background: #5865f2;
			color: white;
		}

		.channel-icon.twitter {
			background: #000;
			color: white;
		}

		.channel-card h2 {
			font-family: var(--alt-font-display);
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.channel-card p {
			font-size: 0.9375rem;
			line-height: 1.5;
			color: var(--alt-gray-600);
			margin: 0;
		}

		.contribute {
			background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
			padding: 3rem;
			border-radius: var(--alt-radius-xl);
			border: 1px solid var(--alt-gray-200);
		}

		.contribute h2 {
			font-family: var(--alt-font-display);
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
			text-align: center;
		}

		.contribute > p {
			font-size: 1.0625rem;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
			text-align: center;
		}

		.contribute-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1.5rem;
		}

		.contribute-item {
			text-align: center;
		}

		.contribute-item h3 {
			font-size: 1.0625rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.contribute-item p {
			font-size: 0.9375rem;
			line-height: 1.5;
			color: var(--alt-gray-600);
			margin: 0;
		}

		@media (max-width: 640px) {
			.hero,
			.community {
				padding: 4rem 1.25rem;
			}

			.contribute {
				padding: 2rem;
			}
		}
	`
})
export class FrameworkCommunityPageComponent {}
