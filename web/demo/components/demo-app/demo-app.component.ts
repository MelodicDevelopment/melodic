import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import type { ThemeMode, SelectOption } from '@melodicdev/components';
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

	/** Sample options for select demos */
	countryOptions: SelectOption[] = [
		{ value: 'us', label: 'United States', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=32', avatarAlt: 'United States' },
		{ value: 'ca', label: 'Canada', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=12', avatarAlt: 'Canada' },
		{ value: 'mx', label: 'Mexico', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=15', avatarAlt: 'Mexico' },
		{ value: 'uk', label: 'United Kingdom', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=24', avatarAlt: 'United Kingdom' },
		{ value: 'de', label: 'Germany', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=18', avatarAlt: 'Germany' },
		{ value: 'fr', label: 'France', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=28', avatarAlt: 'France' }
	];

	statusOptions: SelectOption[] = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'inactive', label: 'Inactive', disabled: true }
	];

	multiSelectValues = ['us', 'ca'];

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

	handleMultiSelectChange = (event: CustomEvent): void => {
		const { values } = event.detail ?? {};
		if (Array.isArray(values)) {
			this.multiSelectValues = values;
		}
	};
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
