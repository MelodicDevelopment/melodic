import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/sidebar/sidebar.component';
import '../../../src/components/navigation/sidebar/sidebar-item.component';
// Register ml-icon so config-driven rendering doesn't error
import '../../../src/components/general/icon/icon.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowQueryAll,
	shadowHasClass,
	captureEvent
} from '../../helpers/component-test-utils';

describe('ml-sidebar', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders sidebar structure', () => {
		el = createComponent('ml-sidebar');
		expect(shadowQuery(el, '.ml-sidebar')).toBeTruthy();
		expect(shadowQuery(el, '.ml-sidebar__header')).toBeTruthy();
		expect(shadowQuery(el, '.ml-sidebar__main')).toBeTruthy();
		expect(shadowQuery(el, '.ml-sidebar__footer')).toBeTruthy();
	});

	it('applies variant class', async () => {
		el = createComponent('ml-sidebar', { attributes: { variant: 'slim' } });
		await flush();
		expect(shadowHasClass(el, '.ml-sidebar', 'ml-sidebar--slim')).toBe(true);
	});

	it('applies collapsed class when collapsed', async () => {
		el = createComponent('ml-sidebar');
		el.collapsed = true;
		await flush();
		expect(shadowHasClass(el, '.ml-sidebar', 'ml-sidebar--collapsed')).toBe(true);
	});

	it('renders config-driven navigation groups', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				navigation: [
					{
						label: 'General',
						items: [
							{ value: 'home', label: 'Home', icon: 'house' },
							{ value: 'settings', label: 'Settings', icon: 'gear' }
						]
					}
				]
			}
		});
		await flush();

		const groups = shadowQueryAll(el, '.ml-sidebar__group');
		expect(groups.length).toBe(1);

		const groupLabel = shadowQuery(el, '.ml-sidebar__group-label');
		expect(groupLabel).toBeTruthy();
		expect(groupLabel!.textContent).toContain('General');

		const items = shadowQueryAll(el, '.ml-sidebar__item');
		expect(items.length).toBe(2);
	});

	it('tracks active item and applies active class', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				active: 'home',
				navigation: [
					{
						items: [
							{ value: 'home', label: 'Home' },
							{ value: 'about', label: 'About' }
						]
					}
				]
			}
		});
		await flush();

		const links = shadowQueryAll(el, '.ml-sidebar__item-link');
		expect(links.length).toBe(2);
		expect(links[0].classList.contains('ml-sidebar__item-link--active')).toBe(true);
		expect(links[1].classList.contains('ml-sidebar__item-link--active')).toBe(false);
	});

	it('emits ml:change event on config item click', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				navigation: [
					{
						items: [
							{ value: 'home', label: 'Home' },
							{ value: 'about', label: 'About' }
						]
					}
				]
			}
		});
		await flush();

		const eventPromise = captureEvent(el, 'ml:change');
		const buttons = shadowQueryAll<HTMLButtonElement>(el, '.ml-sidebar__item-link');
		buttons[1].click();
		const event = await eventPromise;
		expect(event.detail.value).toBe('about');
	});

	it('updates active item after click', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				navigation: [
					{
						items: [
							{ value: 'home', label: 'Home' },
							{ value: 'about', label: 'About' }
						]
					}
				]
			}
		});
		await flush();

		const buttons = shadowQueryAll<HTMLButtonElement>(el, '.ml-sidebar__item-link');
		buttons[1].click();
		await flush();

		expect(el.active).toBe('about');
		const links = shadowQueryAll(el, '.ml-sidebar__item-link');
		expect(links[1].classList.contains('ml-sidebar__item-link--active')).toBe(true);
	});

	// REGRESSION: expandedItems Set reassignment must trigger re-render for submenus
	it('toggles submenu on parent item click', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				navigation: [
					{
						items: [
							{
								value: 'parent',
								label: 'Parent',
								children: [
									{ value: 'child1', label: 'Child 1' },
									{ value: 'child2', label: 'Child 2' }
								]
							}
						]
					}
				]
			}
		});
		await flush();

		// Initially no submenu visible
		let submenu = shadowQuery(el, '.ml-sidebar__item-submenu');
		expect(submenu).toBeFalsy();

		// Click parent to expand
		const parentBtn = shadowQuery<HTMLButtonElement>(el, '.ml-sidebar__item-link');
		parentBtn!.click();
		await flush();

		// Submenu should now be rendered
		submenu = shadowQuery(el, '.ml-sidebar__item-submenu');
		expect(submenu).toBeTruthy();
		expect(el.expandedItems.has('parent')).toBe(true);

		// Click again to collapse
		const parentBtnAgain = shadowQuery<HTMLButtonElement>(el, '.ml-sidebar__item-link--has-children');
		parentBtnAgain!.click();
		await flush();

		submenu = shadowQuery(el, '.ml-sidebar__item-submenu');
		expect(submenu).toBeFalsy();
		expect(el.expandedItems.has('parent')).toBe(false);
	});

	it('hides group labels when collapsed', async () => {
		el = createComponent('ml-sidebar', {
			properties: {
				navigation: [
					{
						label: 'Section',
						items: [{ value: 'a', label: 'Item A' }]
					}
				]
			}
		});
		await flush();
		expect(shadowQuery(el, '.ml-sidebar__group-label')).toBeTruthy();

		el.collapsed = true;
		await flush();
		expect(shadowQuery(el, '.ml-sidebar__group-label')).toBeFalsy();
	});
});

describe('ml-sidebar slotted keyboard navigation', () => {
	let el: HTMLElement;

	afterEach(() => {
		if (el) el.remove();
	});

	async function settle(): Promise<void> {
		await flush();
		await new Promise((r) => setTimeout(r, 0));
		await flush();
	}

	function buildSlottedSidebar(): HTMLElement {
		const sidebar = document.createElement('ml-sidebar');
		sidebar.innerHTML = `
			<ml-sidebar-item icon="house" label="Home" value="home"></ml-sidebar-item>
			<ml-sidebar-item icon="gear" label="Settings" value="settings"></ml-sidebar-item>
		`;
		document.body.appendChild(sidebar);
		return sidebar;
	}

	it('ArrowDown moves focus into the next slotted item link', async () => {
		el = buildSlottedSidebar();
		await settle();

		const [itemOne, itemTwo] = Array.from(el.querySelectorAll('ml-sidebar-item'));
		const linkOne = itemOne.shadowRoot!.querySelector('.ml-sidebar-item__link') as HTMLElement;
		const linkTwo = itemTwo.shadowRoot!.querySelector('.ml-sidebar-item__link') as HTMLElement;
		expect(linkOne).toBeTruthy();
		expect(linkTwo).toBeTruthy();

		linkOne.focus();
		// happy-dom doesn't propagate events across slots; dispatch on the aside
		// (where the listener is bound) with the link as the logical target via
		// a manual event whose target happy-dom sets to the aside — the handler
		// matches either the link or its host, so pre-focus the link and pass
		// the host as the event target by dispatching on it when possible.
		const aside = el.shadowRoot!.querySelector('.ml-sidebar') as HTMLElement;
		const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true });
		Object.defineProperty(event, 'target', { value: linkOne });
		aside.dispatchEvent(event);
		await settle();

		expect(itemTwo.shadowRoot!.activeElement).toBe(linkTwo);
	});

	it('skips disabled slotted items', async () => {
		el = document.createElement('ml-sidebar');
		el.innerHTML = `
			<ml-sidebar-item label="Home" value="home"></ml-sidebar-item>
			<ml-sidebar-item label="Blocked" value="blocked" disabled></ml-sidebar-item>
			<ml-sidebar-item label="Settings" value="settings"></ml-sidebar-item>
		`;
		document.body.appendChild(el);
		await settle();

		const items = Array.from(el.querySelectorAll('ml-sidebar-item'));
		const linkOne = items[0].shadowRoot!.querySelector('.ml-sidebar-item__link') as HTMLElement;
		const linkThree = items[2].shadowRoot!.querySelector('.ml-sidebar-item__link') as HTMLElement;

		linkOne.focus();
		const aside = el.shadowRoot!.querySelector('.ml-sidebar') as HTMLElement;
		const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true });
		Object.defineProperty(event, 'target', { value: linkOne });
		aside.dispatchEvent(event);
		await settle();

		expect(items[2].shadowRoot!.activeElement).toBe(linkThree);
	});
});
