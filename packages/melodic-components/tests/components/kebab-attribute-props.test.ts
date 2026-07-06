/**
 * REGRESSION: kebab-case attributes must reach their (camelCase) properties.
 *
 * ComponentBase.attributeChangedCallback camelCases observed attribute names
 * (`dot-color` -> `dotColor`) before assigning to the component instance.
 * Several components used to declare QUOTED kebab-case class fields
 * (`public 'dot-color' = ...`), so those attributes never reached the props.
 * The fields are now camelCase with deprecated quoted-property accessor
 * aliases. These tests cover a representative set:
 *   - ml-tag `dot-color` (string union)
 *   - ml-app-shell `sidebar-collapsed` (boolean coercion)
 *   - ml-stat-card `trend-direction` (string union)
 * asserting that (a) the HTML attribute updates rendering, (b) the deprecated
 * quoted property alias still works and re-renders, and (c) the camelCase
 * property works.
 */
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/data-display/tag/tag.component';
import '../../src/components/sections/app-shell/app-shell.component';
import '../../src/components/data-display/stat-card/stat-card.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowHasClass
} from '../helpers/component-test-utils';

describe('kebab-case attribute -> camelCase property mapping', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	describe('ml-tag dot-color', () => {
		it('applies the dot-color ATTRIBUTE to rendering', async () => {
			el = createComponent('ml-tag', { attributes: { dot: '', 'dot-color': 'warning' } });
			await flush();
			expect(el.dotColor).toBe('warning');
			expect(shadowHasClass(el, '.ml-tag__dot', 'ml-tag__dot--warning')).toBe(true);
		});

		it('updates rendering when the attribute changes after mount', async () => {
			el = createComponent('ml-tag', { attributes: { dot: '', 'dot-color': 'warning' } });
			await flush();
			el.setAttribute('dot-color', 'info');
			await flush();
			expect(el.dotColor).toBe('info');
			expect(shadowHasClass(el, '.ml-tag__dot', 'ml-tag__dot--info')).toBe(true);
		});

		it('still supports the deprecated quoted property alias and re-renders', async () => {
			el = createComponent('ml-tag', { properties: { dot: true } });
			await flush();
			el['dot-color'] = 'danger';
			await flush();
			expect(el.dotColor).toBe('danger');
			expect(el['dot-color']).toBe('danger');
			expect(shadowHasClass(el, '.ml-tag__dot', 'ml-tag__dot--danger')).toBe(true);
		});

		it('supports the camelCase property', async () => {
			el = createComponent('ml-tag', { properties: { dot: true, dotColor: 'primary' } });
			await flush();
			expect(shadowHasClass(el, '.ml-tag__dot', 'ml-tag__dot--primary')).toBe(true);
		});
	});

	describe('ml-app-shell sidebar-collapsed (boolean)', () => {
		it('coerces the presence-style ATTRIBUTE to true and renders collapsed', async () => {
			el = createComponent('ml-app-shell', { attributes: { 'sidebar-collapsed': '' } });
			await flush();
			expect(el.sidebarCollapsed).toBe(true);
			expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-collapsed')).toBe(true);
		});

		it('coerces attribute removal back to false', async () => {
			el = createComponent('ml-app-shell', { attributes: { 'sidebar-collapsed': '' } });
			await flush();
			el.removeAttribute('sidebar-collapsed');
			await flush();
			expect(el.sidebarCollapsed).toBe(false);
			expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-collapsed')).toBe(false);
		});

		it('still supports the deprecated quoted property alias and re-renders', async () => {
			el = createComponent('ml-app-shell');
			el['sidebar-collapsed'] = true;
			await flush();
			expect(el.sidebarCollapsed).toBe(true);
			expect(el['sidebar-collapsed']).toBe(true);
			expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-collapsed')).toBe(true);
		});

		it('supports the camelCase property', async () => {
			el = createComponent('ml-app-shell');
			el.sidebarCollapsed = true;
			await flush();
			expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-collapsed')).toBe(true);
		});
	});

	describe('ml-stat-card trend-direction', () => {
		it('applies the trend-direction ATTRIBUTE to rendering', async () => {
			el = createComponent('ml-stat-card', {
				attributes: { label: 'Members', value: '1,247', trend: '+6', 'trend-direction': 'up' }
			});
			await flush();
			expect(el.trendDirection).toBe('up');
			expect(shadowHasClass(el, '.ml-stat-card__trend', 'ml-stat-card__trend--up')).toBe(true);
		});

		it('still supports the deprecated quoted property alias and re-renders', async () => {
			el = createComponent('ml-stat-card', { properties: { trend: '-2' } });
			await flush();
			el['trend-direction'] = 'down';
			await flush();
			expect(el.trendDirection).toBe('down');
			expect(el['trend-direction']).toBe('down');
			expect(shadowHasClass(el, '.ml-stat-card__trend', 'ml-stat-card__trend--down')).toBe(true);
		});

		it('supports the camelCase property', async () => {
			el = createComponent('ml-stat-card', { properties: { trend: '+1', trendDirection: 'up' } });
			await flush();
			expect(shadowHasClass(el, '.ml-stat-card__trend', 'ml-stat-card__trend--up')).toBe(true);
		});
	});
});
