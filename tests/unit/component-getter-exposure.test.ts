import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { Service } from '../../src/injection/decorators/service.decorator';
import { Injectable } from '../../src/injection/decorators/injectable.decorator';
import { html } from '../../src/template';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

/**
 * Regression: public computed (getter-only) properties must be mirrored onto
 * the host element. WS2 added a getter-only skip to stop eagerly invoking lazy
 * @Service getters during observe(); it over-reached and dropped public
 * computed getters from the host surface, so `el.computed` read `undefined`.
 */
describe('host exposure of getter-only accessors', () => {
	it('mirrors a public computed getter onto the host element', async () => {
		class ComputedComponent {
			first = 'Sarah';
			last = 'Mitchell';

			public get initials(): string {
				return `${this.first[0]}${this.last[0]}`;
			}
		}

		MelodicComponent({
			selector: 'test-computed-getter',
			template: (c: ComputedComponent) => html`<span>${c.initials}</span>`
		})(ComputedComponent);

		const el = document.createElement('test-computed-getter') as HTMLElement & { initials: string; first: string };
		document.body.appendChild(el);
		await flushMicrotasks();

		// Read the computed getter directly off the host.
		expect(el.initials).toBe('SM');

		// Still live: changing a reactive source updates the computed result.
		el.first = 'Tom';
		await flushMicrotasks();
		expect(el.initials).toBe('TM');

		document.body.removeChild(el);
	});

	it('does not eagerly invoke a lazy @Service getter during observe()', async () => {
		let constructed = 0;

		@Injectable()
		class LazyService {
			constructor() {
				constructed++;
			}
		}

		class ServiceConsumer {
			// Public (non-underscore) @Service getter — must stay lazy.
			@Service(LazyService)
			public svc!: LazyService;

			value = 1;
		}

		MelodicComponent({
			selector: 'test-lazy-service',
			template: (c: ServiceConsumer) => html`<span>${c.value}</span>`
		})(ServiceConsumer);

		const el = document.createElement('test-lazy-service');
		document.body.appendChild(el);
		await flushMicrotasks();

		// observe()/render must not have resolved the service yet.
		expect(constructed).toBe(0);

		// Accessing it on the host resolves it lazily, exactly once.
		const host = el as HTMLElement & { svc: LazyService };
		expect(host.svc).toBeInstanceOf(LazyService);
		expect(constructed).toBe(1);

		document.body.removeChild(el);
	});
});
