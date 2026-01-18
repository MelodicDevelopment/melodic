import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import type { ThemeMode } from '@melodicdev/components';
import { demoAppTemplate } from './demo-app.template';
import { demoAppStyles } from './demo-app.styles';

@MelodicComponent({
	selector: 'demo-app',
	template: demoAppTemplate,
	styles: demoAppStyles
})
export class DemoApp implements IElementRef {
	elementRef!: HTMLElement;

	isDark = false;

	constructor() {
		this.isDark = getResolvedTheme() === 'dark';
		onThemeChange((_: ThemeMode, resolved: 'light' | 'dark') => {
			this.isDark = resolved === 'dark';
		});
	}

	handleThemeToggle = (event: CustomEvent): void => {
		const { checked } = event.detail;
		applyTheme(checked ? 'dark' : 'light');
	};

	handleNavClick = (event: Event, targetId: string): void => {
		event.preventDefault();
		const root = this.elementRef?.shadowRoot;
		const target = root?.getElementById(targetId);
		if (!target) return;

		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${targetId}`);
	};
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
