import { html } from '../../../../src/template';
import type { CompanyAppComponent } from './company-app.component';

export function companyAppTemplate(self: CompanyAppComponent) {
	return html`
		<div class="app">
			<header class="site-header">
				<div class="brand">
					<a class="logo" :routerLink="/home" aria-label="Melodic Development home">
						<img src="/img/melodic-development.svg" alt="Melodic Development" />
					</a>
					<span class="tagline">Consulting studio for modern product teams</span>
				</div>
				<nav class="nav">
					<a :routerLink="/services">Services</a>
					<a :routerLink="/work">Work</a>
					<a :routerLink="/projects">Projects</a>
					<a :routerLink="/blog">Blog</a>
					<a :routerLink="/about">About</a>
					<a :routerLink="/contact">Contact</a>
					<a href="/framework/home" class="nav-external">Framework</a>
				</nav>
				<div class="actions">
					<a :routerLink="/contact" class="button primary">Book a consult</a>
				</div>
			</header>
			<main class="content">
				<router-outlet .routes=${self.routes}></router-outlet>
			</main>
			<footer class="site-footer">
				<div class="footer-inner">
					<div>
						<h4>Melodic Development</h4>
						<p>Product-grade software, delivered by a senior engineering studio.</p>
						<div class="footer-social">
							<a href="https://github.com/MelodicDevelopment" target="_blank" rel="noreferrer">GitHub</a>
							<a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
							<a href="https://x.com" target="_blank" rel="noreferrer">X</a>
						</div>
					</div>
					<div>
						<h5>Services</h5>
						<ul>
							<li>Product strategy</li>
							<li>Design + prototyping</li>
							<li>Full-stack engineering</li>
							<li>Platform enablement</li>
						</ul>
					</div>
					<div>
						<h5>Focus Areas</h5>
						<ul>
							<li>AI-powered tooling</li>
							<li>Internal platforms</li>
							<li>SaaS acceleration</li>
							<li>Developer experience</li>
						</ul>
					</div>
					<div>
						<h5>Contact</h5>
						<ul>
							<li>hello@melodic.dev</li>
							<li>Remote-first, US-based</li>
							<li>Now booking Q1</li>
						</ul>
					</div>
				</div>
				<p class="footer-note">&copy; 2025 Melodic Development. Crafted with the Melodic Framework.</p>
			</footer>
		</div>
	`;
}
