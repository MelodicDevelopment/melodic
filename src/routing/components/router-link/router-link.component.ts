import { MelodicComponent } from '../../../components/decorators/melodic-component.decorator';
import { Service } from '../../../injection/decorators/service.decorator';
import { css, html } from '../../../template/functions/html.function';
import type { INavigationOptions } from '../../interfaces/inavigation-options.interface';
import { RouterService } from '../../services/router.service';

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

	private _anchorElement: HTMLAnchorElement | null = null;
	private _navigationCleanup: (() => void) | null = null;

	public href: string = '';
	public data: unknown = null;
	public queryParams: Record<string, string> = {};
	public activeClass: string = 'active';
	public exactMatch: boolean = false;
	public replace: boolean = false;
	public elementRef!: HTMLElement;

	onCreate(): void {
		this._anchorElement = this.elementRef.shadowRoot?.querySelector('a') ?? null;

		const initialHref = this.elementRef.getAttribute('href');
		if (initialHref) {
			this.href = initialHref;
		}

		const initialActiveClass = this.elementRef.getAttribute('active-class');
		if (initialActiveClass) {
			this.activeClass = initialActiveClass;
		}

		this.updateAnchorHref();

		this.elementRef.addEventListener(
			'click',
			(e: MouseEvent) => {
				e.preventDefault();

				// Don't navigate if modifier keys are pressed (allow new tab, etc.)
				if (e.ctrlKey || e.metaKey || e.shiftKey) {
					window.open(this.buildFullPath(), '_blank');
					return;
				}

				this.navigate();
			},
			false
		);

		const handler = () => this.updateActiveState();
		window.addEventListener('NavigationEvent', handler);
		this._navigationCleanup = () => window.removeEventListener('NavigationEvent', handler);

		this.updateActiveState();
	}

	onDestroy(): void {
		this._navigationCleanup?.();
	}

	onAttributeChange(attribute: string, _: unknown, newVal: unknown): void {
		if (attribute === 'href') {
			this.href = newVal as string;
			this.updateAnchorHref();
			this.updateActiveState();
		} else if (attribute === 'active-class') {
			this.activeClass = newVal as string;
			this.updateActiveState();
		}
	}

	onPropertyChange(name: string): void {
		if (name === 'href' || name === 'queryParams') {
			this.updateAnchorHref();
			this.updateActiveState();
		}
	}

	isActive(): boolean {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith('/') ? this.href : `/${this.href}`;

		if (this.exactMatch) {
			return currentPath === linkPath;
		}

		return currentPath.startsWith(linkPath);
	}

	private buildFullPath(): string {
		let path = this.href;

		if (this.queryParams && Object.keys(this.queryParams).length > 0) {
			const params = new URLSearchParams(this.queryParams);
			path = `${path}?${params.toString()}`;
		}

		return path;
	}

	private updateAnchorHref(): void {
		if (this._anchorElement) {
			this._anchorElement.href = this.buildFullPath();
		}
	}

	private async navigate(): Promise<void> {
		const options: INavigationOptions = {
			data: this.data,
			replace: this.replace,
			queryParams: this.queryParams
		};

		await this._router.navigate(this.href, options);
	}

	private updateActiveState(): void {
		const currentPath = window.location.pathname;
		const linkPath = this.href.startsWith('/') ? this.href : `/${this.href}`;
		const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
		const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';

		let isActive: boolean;

		if (this.exactMatch) {
			isActive = normalizedCurrentPath === normalizedLinkPath;
		} else {
			isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + '/');
		}

		if (isActive) {
			this.elementRef.classList.add(this.activeClass);
			this._anchorElement?.setAttribute('aria-current', 'page');
		} else {
			this.elementRef.classList.remove(this.activeClass);
			this._anchorElement?.removeAttribute('aria-current');
		}
	}
}
