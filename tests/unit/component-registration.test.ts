import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';

/**
 * Custom elements cannot be redefined — a second customElements.define() for the
 * same name throws a DOMException. @MelodicComponent guards against that, which
 * matters when a module re-evaluates (dev-server hot reload re-runs decorators).
 *
 * These lock in the guard's actual semantics: the re-registration is skipped, so
 * the FIRST definition stays in effect. Swapping the implementation on already
 * mounted instances is true HMR and is deliberately not attempted here.
 */
describe('component registration', () => {
	it('does not throw when the same selector is registered twice', () => {
		class FirstDefinition {
			public label = 'first';
		}
		class SecondDefinition {
			public label = 'second';
		}

		const decorate = (target: object) =>
			MelodicComponent({
				selector: 'test-duplicate-registration',
				template: (component: { label: string }) => html`<span>${component.label}</span>`
			})(target as never);

		expect(() => decorate(FirstDefinition)).not.toThrow();
		expect(() => decorate(SecondDefinition)).not.toThrow();
	});

	it('keeps the first registration in effect', () => {
		class OriginalComponent {
			public label = 'original';
		}
		class ReplacementComponent {
			public label = 'replacement';
		}

		const decorate = (target: object) =>
			MelodicComponent({
				selector: 'test-registration-precedence',
				template: (component: { label: string }) => html`<span>${component.label}</span>`
			})(target as never);

		decorate(OriginalComponent);
		const registered = customElements.get('test-registration-precedence');
		decorate(ReplacementComponent);

		expect(customElements.get('test-registration-precedence')).toBe(registered);

		const element = document.createElement('test-registration-precedence');
		document.body.appendChild(element);
		expect(element.shadowRoot?.textContent).toContain('original');
		document.body.removeChild(element);
	});

	it('still validates the selector before consulting the registry', () => {
		class InvalidSelectorComponent {}

		expect(() =>
			MelodicComponent({
				selector: 'nohyphen',
				template: () => html`<span></span>`
			})(InvalidSelectorComponent as never)
		).toThrow(/must contain a hyphen/);
	});
});
