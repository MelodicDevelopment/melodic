import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/steps/steps.component';
import '../../../src/components/navigation/steps/step.component';
import '../../../src/components/navigation/steps/step-panel.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

const configSteps = [
	{ value: 'details', label: 'Your details' },
	{ value: 'company', label: 'Company' },
	{ value: 'done', label: 'Done' }
];

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('ml-steps config mode — stable repeat keys', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('reuses the same step elements across a selection change', async () => {
		el = createComponent('ml-steps', { properties: { steps: configSteps, active: 'details' } });
		await settle();

		const before = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]'));
		expect(before).toHaveLength(3);

		el.active = 'company';
		await settle();

		const after = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]'));
		for (let i = 0; i < 3; i++) {
			expect(after[i]).toBe(before[i]);
		}
		expect((after[1] as HTMLElement).getAttribute('aria-selected')).toBe('true');
	});

	it('keeps focus on the just-activated step through the async re-render', async () => {
		el = createComponent('ml-steps', { properties: { steps: configSteps, active: 'details' } });
		await settle();

		const stepDetails = el.shadowRoot!.querySelector('[data-value="details"]') as HTMLElement;
		stepDetails.focus();
		stepDetails.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
		await settle();

		const stepCompany = el.shadowRoot!.querySelector('[data-value="company"]') as HTMLElement;
		expect(el.active).toBe('company');
		expect(el.shadowRoot!.activeElement).toBe(stepCompany);
	});
});

describe('ml-steps slotted mode — keyboard focus and panels', () => {
	let el: HTMLElement;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	function buildSlottedSteps(): HTMLElement {
		const steps = document.createElement('ml-steps');
		steps.innerHTML = `
			<ml-step slot="step" value="one" label="Step One"></ml-step>
			<ml-step slot="step" value="two" label="Step Two"></ml-step>
			<ml-step-panel value="one">Content one</ml-step-panel>
			<ml-step-panel value="two">Content two</ml-step-panel>
		`;
		document.body.appendChild(steps);
		return steps;
	}

	it('moves focus into the next slotted step on ArrowRight', async () => {
		el = buildSlottedSteps();
		await settle();

		const [hostOne, hostTwo] = Array.from(el.querySelectorAll('ml-step'));
		const stepOne = hostOne.shadowRoot!.querySelector('.ml-step') as HTMLElement;
		const stepTwo = hostTwo.shadowRoot!.querySelector('.ml-step') as HTMLElement;

		stepOne.focus();
		// happy-dom doesn't propagate events across slots; dispatch on the list
		// (the handler under test) directly — browsers deliver the bubbled event there.
		const list = el.shadowRoot!.querySelector('.ml-steps__list') as HTMLElement;
		list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
		await settle();

		expect((el as any).active).toBe('two');
		expect(hostTwo.shadowRoot!.activeElement).toBe(stepTwo);
	});

	it('shows only the active panel and names panels after their steps', async () => {
		el = buildSlottedSteps();
		await settle();

		const [panelOne, panelTwo] = Array.from(el.querySelectorAll('ml-step-panel')) as HTMLElement[];
		expect(panelOne.style.display).toBe('');
		expect(panelTwo.style.display).toBe('none');

		expect(panelOne.shadowRoot!.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Step One');
		expect(panelTwo.shadowRoot!.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Step Two');
	});
});
