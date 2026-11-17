import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { createConsoleApi } from '../../src/devtools/console-api';
import { html } from '../../src/template';
import { signal, computed } from '../../src/signals';

describe('review 2026-11 — melodic.inspect()', () => {
	it('lists signal and computed fields under sources', () => {
		@MelodicComponent({
			selector: 'dt-inspect-signals',
			template: () => html`<span>x</span>`
		})
		class InspectSignals {
			count = signal(1);
			doubled = computed(() => this.count() * 2);
			label = 'plain';
			handler = (): void => undefined;
		}
		void InspectSignals;

		const element = document.createElement('dt-inspect-signals');
		document.body.appendChild(element);

		const inspection = createConsoleApi().inspect(element);

		expect(inspection?.sources.sort()).toEqual(['count', 'doubled']);
		expect(inspection?.properties).toEqual({ label: 'plain' });

		element.remove();
	});
});
