import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'demos-page',
	template: () => html`<feature-demo></feature-demo>`,
	styles: () => css``
})
export class DemosPageComponent {}
