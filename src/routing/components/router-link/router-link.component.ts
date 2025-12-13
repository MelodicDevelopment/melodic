import { MelodicComponent } from '../../../components/melodic-component.decorator';
import { html, css } from '../../../template/template';
import { Service } from '../../../injection/decorators/service.decorator';
import { RouterService } from '../../services/router.service';
import type { INavigationOptions } from '../../services/router.service';

@MelodicComponent({
	selector: 'router-link',
	template: () => html`<a part="link"><slot></slot></a>`,
	styles: () => css`
		:host {
			display: inline-block;
			cursor: pointer;
		}
		a {
			color: inherit;
			text-decoration: inherit;
			font: inherit;
			display: block;
		}
	`,
	attributes: ['href', 'active-class']
})
export class RouterLinkComponent {
	@Service(RouterService) private _router!: RouterService;

	elementRef!: HTMLElement;

	/** Target path for navigation */
	href: string = '';

	/** Custom data to pass with navigation */
	data: unknown = null;

	/** Query parameters to append */
	queryParams: Record<string, string> = {};

	/** CSS class to apply when this link is active */
	activeClass: string = 'active';

	/** Whether to match exact path or prefix */
	exactMatch: boolean = false;

	/** Whether to replace history instead of push */
	replace: boolean = false;

	#anchorElement: HTMLAnchorElement | null = null;
	#navigationCleanup: (() => void) | null = null;

	onCreate(): void {
		// Get the anchor element
		this.#anchorElement = this.elementRef.shadowRoot?.querySelector('a') ?? null;

		// Read initial attributes
		const initialHref = this.elementRef.getAttribute('href');
		if (initialHref) {
			this.href = initialHref;
		}

		const initialActiveClass = this.elementRef.getAttribute('active-class');
		if (initialActiveClass) {
			this.activeClass = initialActiveClass;
		}

		// Update anchor href for accessibility
		this.#updateAnchorHref();

		// Click handler
		this.elementRef.addEventListener(
			'click',
			(e: MouseEvent) => {
				e.preventDefault();

				// Don't navigate if modifier keys are pressed (allow new tab, etc.)
				if (e.ctrlKey || e.metaKey || e.shiftKey) {
					window.open(this.#buildFullPath(), '_blank');
					return;
				}

				this.#navigate();
			},
			false
		);

		// Listen for navigation to update active state
		const handler = () => this.#updateActiveState();
		window.addEventListener('NavigationEvent', handler);
		this.#navigationCleanup = () => window.removeEventListener('NavigationEvent', handler);

		// Initial active state
		this.#updateActiveState();
	}

	onDestroy(): void {
		this.#navigationCleanup?.();
	}

	onAttributeChange(attribute: string, _oldVal: unknown, newVal: unknown): void {
		if (attribute === 'href') {
			this.href = newVal as string;
			this.#updateAnchorHref();
			this.#updateActiveState();
		} else if (attribute === 'active-class') {
			this.activeClass = newVal as string;
			this.#updateActiveState();
		}
	}

	onPropertyChange(name: string): void {
		if (name === 'href' || name === 'queryParams') {
			this.#updateAnchorHref();
			this.#updateActiveState();
		}
	}

	/**
	 * Build the full path including query params.
	 */
	#buildFullPath(): string {
		let path = this.href;

		if (this.queryParams && Object.keys(this.queryParams).length > 0) {
			const params = new URLSearchParams(this.queryParams);
			path = `${path}?${params.toString()}`;
		}

		return path;
	}

	/**
	 * Update the anchor element's href attribute.
	 */
	#updateAnchorHref(): void {
		if (this.#anchorElement) {
			this.#anchorElement.href = this.#buildFullPath();
		}
	}

	/**
	 * Perform the navigation.
	 */
	async #navigate(): Promise<void> {
		const options: INavigationOptions = {
			data: this.data,
			replace: this.replace,
			queryParams: this.queryParams
		};

		await this._router.navigate(this.href, options);
	}

	/**
	 * Update the active state based on current URL.
	 */
	#updateActiveState(): void {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith('/') ? this.href : `/${this.href}`;
		const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
		const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';

		let isActive: boolean;

		if (this.exactMatch) {
			isActive = normalizedCurrentPath === normalizedLinkPath;
		} else {
			// Prefix match - link is active if current path starts with link path
			isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + '/');
		}

		// Update host element class
		if (isActive) {
			this.elementRef.classList.add(this.activeClass);
			this.#anchorElement?.setAttribute('aria-current', 'page');
		} else {
			this.elementRef.classList.remove(this.activeClass);
			this.#anchorElement?.removeAttribute('aria-current');
		}
	}

	/**
	 * Programmatically check if this link is currently active.
	 */
	isActive(): boolean {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith('/') ? this.href : `/${this.href}`;

		if (this.exactMatch) {
			return currentPath === linkPath;
		}

		return currentPath.startsWith(linkPath);
	}
}
