import { MelodicComponent } from '../../../components/decorators/melodic-component.decorator';
import { css, html } from '../../../template/functions/html.function';
import { RouterLinkCore } from '../../classes/router-link-core.class';

/**
 * `<router-link>` element. Thin wrapper over `RouterLinkCore` — the same
 * implementation that powers the `:routerLink` directive — so both stay in
 * sync (safe-URL enforcement, native modifier/middle-click behavior, active
 * class management).
 */
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
	private _anchorElement: HTMLAnchorElement | null = null;
	private _core: RouterLinkCore | null = null;

	public href: string = '';
	public data: unknown = null;
	public queryParams: Record<string, string> = {};
	public activeClass: string = 'active';
	public exactMatch: boolean = false;
	public replace: boolean = false;
	public elementRef!: HTMLElement;

	public onCreate(): void {
		this._anchorElement = this.elementRef.shadowRoot?.querySelector('a') ?? null;

		const initialHref = this.elementRef.getAttribute('href');
		if (initialHref) {
			this.href = initialHref;
		}

		const initialActiveClass = this.elementRef.getAttribute('active-class');
		if (initialActiveClass) {
			this.activeClass = initialActiveClass;
		}

		this._core = new RouterLinkCore(this.elementRef, () => this._anchorElement);
		this.syncCore();
	}

	public onDestroy(): void {
		this._core?.destroy();
		this._core = null;
	}

	public onAttributeChange(attribute: string, _: unknown, newVal: unknown): void {
		if (attribute === 'href') {
			this.href = newVal as string;
			this.syncCore();
		} else if (attribute === 'active-class') {
			this.activeClass = newVal as string;
			this.syncCore();
		}
	}

	public onPropertyChange(name: string): void {
		if (name === 'href' || name === 'queryParams' || name === 'activeClass' || name === 'exactMatch' || name === 'replace' || name === 'data') {
			// Property changes land after this hook returns — sync on microtask.
			queueMicrotask(() => this.syncCore());
		}
	}

	private syncCore(): void {
		this._core?.setOptions({
			href: this.href,
			activeClass: this.activeClass,
			exactMatch: this.exactMatch,
			replace: this.replace,
			data: this.data,
			queryParams: this.queryParams
		});
	}
}
