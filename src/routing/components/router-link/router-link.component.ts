import { MelodicComponent } from '../../../components/melodic-component.decorator';
import { html } from '../../../template/template';
import { Service } from '../../../injection/decorators/service.decorator';
import { RouterService } from '../../services/router.service';

@MelodicComponent({
	selector: 'router-link',
	template: () => html`<a part="link"><slot></slot></a>`,
	attributes: ['href']
})
export class RouterLinkComponent {
	@Service('Router') private _router!: RouterService;

	elementRef!: HTMLElement;
	href: string = '';
	data: unknown = null;

	onCreate(): void {
		// Read initial href from attribute
		const initialHref = this.elementRef.getAttribute('href');
		if (initialHref) {
			this.href = initialHref;
		}

		this.elementRef.addEventListener(
			'click',
			(e: MouseEvent) => {
				e.preventDefault();
				this._router.navigate(this.href, this.data);
			},
			false
		);
	}

	onAttributeChange(attribute: string, _oldVal: unknown, newVal: unknown): void {
		if (attribute === 'href') {
			this.href = newVal as string;
		}
	}
}
