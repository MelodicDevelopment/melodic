import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/avatar/avatar.component';
import '../../../src/components/data-display/activity-feed/activity-feed-item.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-activity-feed-item', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the feed item', () => {
		el = createComponent('ml-activity-feed-item');
		expect(shadowQuery(el, '.ml-afi')).toBeTruthy();
	});

	it('displays name', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { name: 'Jane Doe' } });
		await flush();
		const name = shadowQuery(el, '.ml-afi__name');
		expect(name?.textContent).toBe('Jane Doe');
	});

	it('displays timestamp', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { timestamp: '2 hours ago' } });
		await flush();
		const ts = shadowQuery(el, '.ml-afi__timestamp');
		expect(ts?.textContent).toBe('2 hours ago');
	});

	it('renders indicator when indicator is true', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { indicator: true } });
		await flush();
		expect(shadowQuery(el, '.ml-afi__indicator')).toBeTruthy();
	});

	it('does not render indicator by default', () => {
		el = createComponent('ml-activity-feed-item');
		expect(shadowQuery(el, '.ml-afi__indicator')).toBeNull();
	});

	it('applies preset indicator color class', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': 'success' }
		});
		await flush();
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--success')).toBe(true);
	});

	it('applies custom indicator color via CSS variable', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': '#c9a84c' }
		});
		await flush();
		const dot = shadowQuery<HTMLElement>(el, '.ml-afi__indicator');
		expect(dot?.style.getPropertyValue('--ml-afi-indicator-bg')).toBe('#c9a84c');
		// Should NOT have a preset class
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--#c9a84c')).toBe(false);
	});

	it('treats preset names as presets, not custom colors', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': 'warning' }
		});
		await flush();
		const dot = shadowQuery<HTMLElement>(el, '.ml-afi__indicator');
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--warning')).toBe(true);
		// Should NOT have inline custom color
		expect(dot?.style.getPropertyValue('--ml-afi-indicator-bg')).toBe('');
	});
});

describe('ml-activity-feed-item slot reactivity', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	async function settle(): Promise<void> {
		await flush();
		await new Promise((r) => setTimeout(r, 0));
		await flush();
	}

	it('renders the default ml-avatar as native slot fallback', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { 'avatar-initials': 'JD' } });
		await settle();

		const slot = el.shadowRoot!.querySelector('slot[name="avatar"]') as HTMLSlotElement;
		expect(slot).toBeTruthy();
		expect(slot.assignedNodes()).toHaveLength(0);
		expect(slot.querySelector('ml-avatar')).toBeTruthy();
	});

	it('projects a custom avatar inserted AFTER mount', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { name: 'Jane' } });
		await settle();
		expect(el.hasAvatarSlot).toBe(false);

		const custom = document.createElement('div');
		custom.slot = 'avatar';
		custom.textContent = 'X';
		el.appendChild(custom);
		await settle();

		expect(el.hasAvatarSlot).toBe(true);
		const slot = el.shadowRoot!.querySelector('slot[name="avatar"]') as HTMLSlotElement;
		expect(slot.assignedNodes()).toContain(custom);
	});

	it('projects extra content inserted AFTER mount', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { name: 'Jane' } });
		await settle();

		const wrapper = el.shadowRoot!.querySelector('.ml-afi__content') as HTMLElement;
		expect(wrapper.classList.contains('ml-afi__content--hidden')).toBe(true);

		const extra = document.createElement('div');
		extra.slot = 'content';
		extra.textContent = 'Attachment';
		el.appendChild(extra);
		await settle();

		expect(el.hasContentSlot).toBe(true);
		expect(wrapper.classList.contains('ml-afi__content--hidden')).toBe(false);
	});
});
