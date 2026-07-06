import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../../src/components/sections/page-section/page-section.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-page-section', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the section container', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section')).toBeTruthy();
	});

	it('renders title when provided', async () => {
		el = createComponent('ml-page-section', { properties: { sectionTitle: 'Recent Activity' } });
		await flush();
		const title = shadowQuery(el, '.ml-page-section__title');
		expect(title?.textContent).toBe('Recent Activity');
	});

	it('does not render header when no title', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section__header')).toBeNull();
	});

	it('renders subtitle when provided', async () => {
		el = createComponent('ml-page-section', {
			properties: { sectionTitle: 'Activity', subtitle: 'Last 7 days' }
		});
		await flush();
		const subtitle = shadowQuery(el, '.ml-page-section__subtitle');
		expect(subtitle?.textContent).toBe('Last 7 days');
	});

	it('renders action link when action-label is set', async () => {
		el = createComponent('ml-page-section', {
			properties: { sectionTitle: 'Members', actionLabel: 'View All', actionHref: '/members' }
		});
		await flush();
		const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
		expect(link?.textContent).toBe('View All');
		expect(link?.getAttribute('href')).toBe('/members');
	});

	it('supports the legacy kebab-case property aliases', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			el = createComponent('ml-page-section', {
				properties: { title: 'Members', 'action-label': 'View All', 'action-href': '/members' }
			});
			await flush();
			const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
			expect(link?.textContent).toBe('View All');
			expect(link?.getAttribute('href')).toBe('/members');
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('accepts section-title/action-label/action-href as attributes', async () => {
		el = createComponent('ml-page-section', {
			attributes: { 'section-title': 'Members', 'action-label': 'View All', 'action-href': '/members' }
		});
		await flush();
		expect(shadowQuery(el, '.ml-page-section__title')?.textContent).toBe('Members');
		const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
		expect(link?.textContent).toBe('View All');
		expect(link?.getAttribute('href')).toBe('/members');
	});

	it('maps the deprecated title attribute to sectionTitle', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			el = createComponent('ml-page-section', { attributes: { title: 'Legacy' } });
			await flush();
			expect(shadowQuery(el, '.ml-page-section__title')?.textContent).toBe('Legacy');
			expect(el.sectionTitle).toBe('Legacy');
		} finally {
			warnSpy.mockRestore();
		}
	});

	describe('action-href sanitization', () => {
		it.each([
			['/members', '/members'],
			['#top', '#top'],
			['?page=2', '?page=2'],
			['members', 'members'],
			['https://example.com/members', 'https://example.com/members'],
			['http://example.com', 'http://example.com']
		])('allows safe URL %j', async (href, expected) => {
			el = createComponent('ml-page-section', {
				properties: { sectionTitle: 'T', actionLabel: 'Go', actionHref: href }
			});
			await flush();
			const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
			expect(link?.getAttribute('href')).toBe(expected);
		});

		it.each([
			'javascript:alert(1)',
			'JavaScript:alert(1)',
			'java\tscript:alert(1)',
			' javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'vbscript:msgbox(1)'
		])('neutralizes unsafe URL %j', async (href) => {
			el = createComponent('ml-page-section', {
				properties: { sectionTitle: 'T', actionLabel: 'Go', actionHref: href }
			});
			await flush();
			const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
			expect(link?.getAttribute('href')).toBe(`unsafe:${href}`);
		});
	});

	it('defaults to md padding', () => {
		el = createComponent('ml-page-section');
		expect(shadowHasClass(el, '.ml-page-section', 'ml-page-section--pad-md')).toBe(true);
	});

	it('applies padding variant', async () => {
		el = createComponent('ml-page-section', { properties: { padding: 'lg' } });
		await flush();
		expect(shadowHasClass(el, '.ml-page-section', 'ml-page-section--pad-lg')).toBe(true);
	});

	it('renders content slot', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section__content')).toBeTruthy();
		expect(shadowQuery(el, '.ml-page-section__content slot:not([name])')).toBeTruthy();
	});
});
