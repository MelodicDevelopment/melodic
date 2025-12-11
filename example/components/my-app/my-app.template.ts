import { html } from '../../../src/template/template';
import type { MyAppComponent } from './my-app.component';

export function myAppTemplate(self: MyAppComponent) {
	return html`
		<div class="app">
			<header class="header">
				<h1 class="logo">Melodic</h1>
				<nav class="nav">
					<router-link href="/home">Home</router-link>
					<router-link href="/demos">Demos</router-link>
					<router-link href="/about">About</router-link>
					<router-link href="/contact">Contact</router-link>
					<router-link href="/settings">Settings</router-link>
				</nav>
			</header>
			<main class="content">
				<router-outlet .routes=${self.routes}></router-outlet>
			</main>
			<footer class="footer">
				<p>Melodic Framework - A lightweight web component framework</p>
			</footer>
		</div>
	`;
}
