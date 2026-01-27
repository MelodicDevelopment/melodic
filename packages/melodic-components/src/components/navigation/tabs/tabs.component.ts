import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { TabsVariant, TabsOrientation, TabConfig } from './tabs.types.js';
import { tabsTemplate } from './tabs.template.js';
import { tabsStyles } from './tabs.styles.js';

/**
 * ml-tabs - Tabbed interface component with optional router integration
 *
 * @example Simple mode with slotted panels:
 * ```html
 * <ml-tabs value="tab1">
 *   <ml-tab slot="tab" value="tab1" label="First"></ml-tab>
 *   <ml-tab slot="tab" value="tab2" label="Second"></ml-tab>
 *   <ml-tab-panel value="tab1">Content 1</ml-tab-panel>
 *   <ml-tab-panel value="tab2">Content 2</ml-tab-panel>
 * </ml-tabs>
 * ```
 *
 * @example With tab configs:
 * ```html
 * <ml-tabs .tabs=${tabs} value="users">
 *   <ml-tab-panel value="users">Users content</ml-tab-panel>
 *   <ml-tab-panel value="settings">Settings content</ml-tab-panel>
 * </ml-tabs>
 * ```
 *
 * @example Routed mode with child routes:
 * ```html
 * <ml-tabs routed .tabs=${[
 *   { value: 'users', label: 'Users', href: '/admin/users' },
 *   { value: 'settings', label: 'Settings', href: '/admin/settings' }
 * ]}>
 *   <router-outlet></router-outlet>
 * </ml-tabs>
 * ```
 *
 * @slot tab - Tab header elements (ml-tab)
 * @slot default - Tab panel content or router-outlet
 *
 * @fires ml-change - Emitted when active tab changes
 */
@MelodicComponent({
	selector: 'ml-tabs',
	template: tabsTemplate,
	styles: tabsStyles,
	attributes: ['value', 'variant', 'size', 'orientation', 'routed']
})
export class TabsComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	elementRef!: HTMLElement;

	/** Currently active tab value */
	value = '';

	/** Visual variant */
	variant: TabsVariant = 'line';

	/** Size variant */
	size: Size = 'md';

	/** Tab orientation */
	orientation: TabsOrientation = 'horizontal';

	/** Enable router integration */
	routed = false;

	/** Tab configurations (alternative to slotted ml-tab elements) */
	tabs: TabConfig[] = [];

	/** Internal tracking of slotted tabs */
	_slottedTabs: HTMLElement[] = [];

	/** Navigation event listener for routed mode */
	private readonly _handleNavigation = this.onNavigation.bind(this);

	onCreate(): void {
		if (this.routed) {
			window.addEventListener('NavigationEvent', this._handleNavigation);
			this.syncWithRoute();
		}
	}

	onRender(): void {
		// Ensure panels are correctly shown/hidden after each render
		this.updatePanelVisibility();
	}

	onDestroy(): void {
		if (this.routed) {
			window.removeEventListener('NavigationEvent', this._handleNavigation);
		}
	}

	/** Handle tab slot changes */
	handleTabSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;
		this._slottedTabs = slot.assignedElements({ flatten: true }) as HTMLElement[];

		// Set initial value if not set
		if (!this.value && this._slottedTabs.length > 0) {
			const firstTab = this._slottedTabs.find((tab) => !tab.hasAttribute('disabled'));
			if (firstTab) {
				this.value = firstTab.getAttribute('value') || '';
			}
		}

		this.updateTabStates();
		this.updatePanelVisibility();
	};

	/** Handle tab click */
	handleTabClick = (tabValue: string, href?: string): void => {
		const tab = this.getTabByValue(tabValue);
		if (tab?.disabled) return;

		if (this.routed && href) {
			window.history.pushState({}, '', href);
			window.dispatchEvent(new PopStateEvent('popstate'));
		}

		this.value = tabValue;
		this.updateTabStates();
		this.updatePanelVisibility();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: tabValue }
			})
		);
	};

	/** Handle keyboard navigation */
	handleKeyDown = (event: KeyboardEvent): void => {
		const allTabs = this.getAllTabs();
		const enabledTabs = allTabs.filter((t) => !t.disabled);
		const currentIndex = enabledTabs.findIndex((t) => t.value === this.value);

		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
				break;
			case 'ArrowRight':
			case 'ArrowDown':
				event.preventDefault();
				newIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = enabledTabs.length - 1;
				break;
			default:
				return;
		}

		if (newIndex !== currentIndex && enabledTabs[newIndex]) {
			const tab = enabledTabs[newIndex];
			this.handleTabClick(tab.value, tab.href);
			this.focusTab(tab.value);
		}
	};

	/** Get all tabs (from config or slotted) */
	getAllTabs(): TabConfig[] {
		if (this.tabs.length > 0) {
			return this.tabs;
		}

		return this._slottedTabs.map((el) => ({
			value: el.getAttribute('value') || '',
			label: el.getAttribute('label') || el.textContent || '',
			icon: el.getAttribute('icon') || undefined,
			disabled: el.hasAttribute('disabled'),
			href: el.getAttribute('href') || undefined
		}));
	}

	/** Get tab by value */
	private getTabByValue(value: string): TabConfig | undefined {
		return this.getAllTabs().find((t) => t.value === value);
	}

	/** Update active state on slotted tabs */
	private updateTabStates(): void {
		this._slottedTabs.forEach((tab) => {
			const isActive = tab.getAttribute('value') === this.value;
			tab.toggleAttribute('active', isActive);
		});
	}

	/** Update panel visibility */
	private updatePanelVisibility(): void {
		if (this.routed) return;

		const panels = this.elementRef.querySelectorAll('ml-tab-panel');
		panels.forEach((panel) => {
			const isActive = panel.getAttribute('value') === this.value;
			(panel as HTMLElement).style.display = isActive ? '' : 'none';
		});
	}

	/** Focus a specific tab */
	private focusTab(value: string): void {
		const tabList = this.elementRef.shadowRoot?.querySelector('.ml-tabs__list');
		const button = tabList?.querySelector(`[data-value="${value}"]`) as HTMLElement;
		button?.focus();
	}

	/** Sync active tab with current route (for routed mode) */
	private syncWithRoute(): void {
		const path = window.location.pathname;
		const matchingTab = this.getAllTabs().find((tab) => tab.href && path.startsWith(tab.href));
		if (matchingTab) {
			this.value = matchingTab.value;
			this.updateTabStates();
		}
	}

	/** Handle navigation events (routed mode) */
	private onNavigation(): void {
		this.syncWithRoute();
	}
}
