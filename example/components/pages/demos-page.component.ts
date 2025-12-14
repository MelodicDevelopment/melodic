import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template-result.class';

@MelodicComponent({
	selector: 'demos-page',
	template: () => html`<feature-demo></feature-demo>`,
	styles: () => css``
})
export class DemosPageComponent {}
