/**
 * Example Component using Shared State Service
 * Demonstrates how multiple components can share state via signals in a service
 */

import { MelodicComponent } from '../components/melodic-component.decorator';
import { Service } from '../injection/decorators/service.decorator';
import { AppStateService } from './app-state.service';
import { themeToggleTemplate } from './theme-toggle.template';
import type { IElementRef } from '../components/interfaces/ielement-ref.interface';

@MelodicComponent({
	selector: 'theme-toggle',
	template: themeToggleTemplate
})
export class ThemeToggleComponent implements IElementRef {
	elementRef!: HTMLElement;

	@Service(AppStateService) appState!: AppStateService;

	// Access shared signals from the service
	// The component will automatically re-render when these signals change
	// even if they're modified by OTHER components!

	toggleTheme = () => {
		this.appState.toggleTheme();
	};

	login = () => {
		this.appState.login('John Doe', 'john@example.com');
	};

	logout = () => {
		this.appState.logout();
	};

	addNotification = () => {
		const messages = [
			'New message received',
			'Task completed successfully',
			'Update available',
			'Meeting in 10 minutes',
			'File uploaded'
		];
		const message = messages[Math.floor(Math.random() * messages.length)];
		this.appState.addNotification(message);
	};
}
