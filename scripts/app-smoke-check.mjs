#!/usr/bin/env node
/**
 * App smoke check — boots the built demo and example apps in headless Chrome
 * and exercises them.
 *
 *   node scripts/app-smoke-check.mjs            # both apps
 *   node scripts/app-smoke-check.mjs demo       # one app
 *
 * Why this exists: the unit tests run against happy-dom and never execute the
 * real apps, and a build only type-checks and bundles. A change to when
 * components re-render, or to how a panel is hidden, can pass all of that and
 * still leave a blank page or a dead button in a browser.
 *
 * So this does not merely snapshot the DOM: it clicks things, switches tabs,
 * navigates routes, and asserts the result changed — plus fails on any uncaught
 * exception, console error, or failed resource load.
 */
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, openPage } from './lib/chrome-driver.mjs';
import { serveDirectory } from './lib/static-server.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Helpers injected into the page. Melodic renders into shadow roots, so every
 * query has to pierce them — `document.querySelector` finds almost nothing in
 * a Melodic app.
 */
const PAGE_HELPERS = `
	window.__deepAll = (selector, root = document) => {
		// An ELEMENT's own shadow root has to be searched explicitly: its
		// querySelectorAll only sees light-DOM descendants, so a component that
		// renders everything into its shadow root looks empty without this.
		const roots = [root];
		if (root.shadowRoot) roots.push(root.shadowRoot);

		const found = [];
		for (const scope of roots) {
			found.push(...scope.querySelectorAll(selector));
			for (const el of scope.querySelectorAll('*')) {
				if (el.shadowRoot) found.push(...window.__deepAll(selector, el.shadowRoot));
			}
		}
		return [...new Set(found)];
	};
	window.__deep = (selector, root = document) => window.__deepAll(selector, root)[0] ?? null;
	window.__label = (el) => (el.getAttribute('aria-label') || window.__deepText(el) || '').trim();
	window.__deepText = (root = document.body) => {
		let text = '';
		const walk = (node) => {
			for (const child of node.childNodes) {
				if (child.nodeType === 3) text += child.textContent;
				else if (child.nodeType === 1) {
					if (child.shadowRoot) walk(child.shadowRoot);
					walk(child);
				}
			}
		};
		walk(root);
		return text.replace(/\\s+/g, ' ').trim();
	};
	window.__customElementCount = () => window.__deepAll('*').filter((el) => el.tagName.includes('-')).length;
	'helpers-ready';
`;

const checks = [];
let failures = 0;

function record(name, ok, detail = '') {
	checks.push({ name, ok, detail });
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Fail on anything the page reported about itself. */
function assertClean(page, label) {
	const errors = page.pageErrors.slice();
	const consoleErrors = page.consoleErrors.slice();

	record(`${label}: no uncaught exceptions`, errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 300));
	record(`${label}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | ').slice(0, 300));
	record(`${label}: no failed resource loads`, page.failedRequests.length === 0, page.failedRequests.slice(0, 3).join(' | '));

	if (page.consoleWarnings.length > 0) {
		console.log(`     ${page.consoleWarnings.length} dev warning(s):`);
		for (const warning of [...new Set(page.consoleWarnings)].slice(0, 8)) {
			console.log(`       ${warning.slice(0, 180)}`);
		}
	}
}

async function checkDemo(wsUrl, origin) {
	const page = await openPage(wsUrl, `${origin}/`, { settleMs: 2500 });

	try {
		await page.evaluate(PAGE_HELPERS);

		const mounted = await page.evaluate('window.__customElementCount()');
		record('demo: components mounted', mounted > 20, `${mounted} custom elements`);

		const text = await page.evaluate('window.__deepText()');
		record('demo: rendered visible content', text.length > 500, `${text.length} chars of text`);

		assertClean(page, 'demo');

		// C21: a tab click must move both the panel and the tab's own state.
		const tabResult = await page.evaluate(`(() => {
			const tabs = window.__deep('ml-tabs');
			if (!tabs) return { skipped: 'no ml-tabs in the demo' };
			const buttons = window.__deepAll('[role="tab"]', tabs);
			if (buttons.length < 2) return { skipped: 'fewer than two tabs' };
			const before = tabs.value;
			buttons[1].click();
			return { before, clicked: true };
		})()`);

		if (tabResult.skipped) {
			record('demo: tabs switch on click', true, `skipped (${tabResult.skipped})`);
		} else {
			await page.settle(400);
			const after = await page.evaluate(`(() => {
				const tabs = window.__deep('ml-tabs');

				// Panel visibility is counted PER GROUP: the demo has several
				// independent ml-tabs, each of which should show exactly one.
				const groups = window.__deepAll('ml-tabs').map((group) => {
					const panels = [...group.querySelectorAll('ml-tab-panel')];
					return { total: panels.length, visible: panels.filter((p) => !p.hasAttribute('hidden')).length };
				});

				return { value: tabs.value, groups };
			})()`);

			record('demo: tabs switch on click', after.value !== tabResult.before, `${tabResult.before} -> ${after.value}`);

			// The panel-visibility change (inline display -> hidden attribute) is
			// exactly the kind of thing a unit test can pass and a page can break.
			const withPanels = after.groups.filter((group) => group.total > 0);
			const wrong = withPanels.filter((group) => group.visible !== 1);
			record(
				'demo: exactly one panel visible per tab group',
				wrong.length === 0,
				`${withPanels.length} group(s) with panels${wrong.length > 0 ? `; wrong: ${JSON.stringify(wrong)}` : ''}`
			);
		}

		// C36: ml-stack moved layout to custom properties. If they do not
		// resolve, the layout silently collapses.
		const layout = await page.evaluate(`(() => {
			const stack = window.__deep('ml-stack');
			if (!stack) return { skipped: true };
			const inner = stack.shadowRoot.querySelector('.ml-stack');
			const styles = getComputedStyle(inner);
			return { display: styles.display, direction: styles.flexDirection, gap: styles.gap };
		})()`);

		if (layout.skipped) {
			record('demo: ml-stack lays out', true, 'skipped (no ml-stack)');
		} else {
			record(
				'demo: ml-stack lays out',
				layout.display === 'flex' && layout.gap !== '' && layout.gap !== 'normal',
				`display:${layout.display} direction:${layout.direction} gap:${layout.gap}`
			);
		}

		// An input must actually accept typing and report it to the host.
		const input = await page.evaluate(`(() => {
			const field = window.__deep('ml-input');
			if (!field) return { skipped: true };
			const inner = field.shadowRoot.querySelector('input');
			inner.value = 'typed in a browser';
			inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
			return { hostValue: field.value };
		})()`);

		if (input.skipped) {
			record('demo: ml-input accepts input', true, 'skipped (no ml-input)');
		} else {
			record('demo: ml-input accepts input', input.hostValue === 'typed in a browser', `host value: ${JSON.stringify(input.hostValue)}`);
		}

		// C25: toggleTheme was a no-op after an inline anti-FOUC script.
		const theme = await page.evaluate(`(() => {
			const before = document.documentElement.getAttribute('data-theme');
			// The demo's theme control is an <ml-toggle label="Dark mode">; its
			// real focusable input lives in the toggle's shadow root.
			const toggle = window.__deepAll('ml-toggle').find((t) => /dark|theme/i.test(t.getAttribute('label') || ''));
			if (!toggle) return { skipped: true, before };

			const surfaceBefore = getComputedStyle(document.documentElement).getPropertyValue('--ml-color-surface').trim();
			const input = toggle.shadowRoot.querySelector('input');
			input.click();
			return { skipped: false, before, surfaceBefore };
		})()`);

		if (theme.skipped) {
			record('demo: theme toggle changes data-theme', true, 'skipped (no theme control found)');
		} else {
			await page.settle(400);
			const after = await page.evaluate(`(() => {
				const root = getComputedStyle(document.documentElement);
				return {
					attr: document.documentElement.getAttribute('data-theme'),
					// A token the light and dark palettes define differently. The
					// body's own background is transparent, so reading it proved
					// nothing about whether the theme actually took effect.
					surface: root.getPropertyValue('--ml-color-surface').trim(),
					text: root.getPropertyValue('--ml-color-text').trim()
				};
			})()`);

			record('demo: theme toggle changes data-theme', after.attr !== theme.before, `${theme.before} -> ${after.attr}`);
			record(
				'demo: the dark palette is actually applied',
				after.surface !== '' && after.surface !== theme.surfaceBefore,
				`--ml-color-surface ${theme.surfaceBefore || '(unset)'} -> ${after.surface || '(unset)'}`
			);
		}
	} finally {
		await page.close();
	}
}

async function checkExample(wsUrl, origin) {
	const page = await openPage(wsUrl, `${origin}/`, { settleMs: 2500 });

	try {
		await page.evaluate(PAGE_HELPERS);

		const mounted = await page.evaluate('window.__customElementCount()');
		record('example: components mounted', mounted > 0, `${mounted} custom elements`);

		const text = await page.evaluate('window.__deepText()');
		record('example: rendered visible content', text.length > 50, `${text.length} chars of text`);

		assertClean(page, 'example');

		// The behaviour most affected by render-time signal tracking: a click
		// that writes state must produce a visible re-render.
		const stateChange = await page.evaluate(`(() => {
			// The auth button flips a plain reactive property and re-labels
			// itself — the simplest end-to-end proof that a click re-renders.
			const button = window.__deepAll('button').find((b) => /log ?(in|out)/i.test(window.__label(b)));
			if (!button) return { skipped: true };
			const before = window.__label(button);
			button.click();
			return { skipped: false, before };
		})()`);

		if (stateChange.skipped) {
			record('example: a click re-renders', true, 'skipped (no auth button)');
		} else {
			await page.settle(400);
			const after = await page.evaluate(`(() => {
				const button = window.__deepAll('button').find((b) => /log ?(in|out)/i.test(window.__label(b)));
				return button ? window.__label(button) : null;
			})()`);

			record('example: a click re-renders', after !== stateChange.before, `${stateChange.before} -> ${after}`);
		}

		// Routing: navigate to a DIFFERENT path and confirm the outlet swapped
		// content. Picking whatever link came first was a no-op when it pointed
		// at the page already showing — which, with same-URL navigation now
		// ignored, proved nothing at all.
		const navigation = await page.evaluate(`(() => {
			const here = location.pathname;
			const links = window.__deepAll('a[href^="/"]').filter((a) => {
				const href = a.getAttribute('href');
				return href && href !== here && href !== '/';
			});
			if (links.length === 0) return { skipped: true, here };

			const link = links[0];
			return {
				skipped: false,
				from: here,
				href: link.getAttribute('href'),
				before: window.__deepText().slice(0, 300),
				clicked: (link.click(), true)
			};
		})()`);

		if (navigation.skipped) {
			record('example: router navigates', true, `skipped (no link away from ${navigation.here})`);
		} else {
			await page.settle(800);
			const after = await page.evaluate(`({ path: location.pathname, text: window.__deepText().slice(0, 300) })`);

			record('example: router changes the URL', after.path === navigation.href, `${navigation.from} -> ${after.path} (wanted ${navigation.href})`);
			record('example: outlet swapped content', after.text !== navigation.before, after.text === navigation.before ? 'page text unchanged' : 'page text changed');

			// Back/forward must restore the previous view — the popstate path,
			// which the history-index work touched.
			await page.evaluate('history.back()');
			await page.settle(800);
			const back = await page.evaluate(`({ path: location.pathname, text: window.__deepText().slice(0, 300) })`);
			record('example: back restores the previous route', back.path === navigation.from, `${after.path} -> ${back.path}`);
			record('example: back restores the previous view', back.text === navigation.before, back.text === navigation.before ? 'text matches' : 'text differs from the original');
		}

		// /admin sits behind an auth guard. Drive BOTH states explicitly rather
		// than inheriting whatever the previous check left behind.
		const authButton = `window.__deepAll('button').find((b) => /log ?(in|out)/i.test(window.__label(b)))`;
		const adminLink = `window.__deepAll('a[href^="/"]').find((a) => /admin/i.test(a.getAttribute('href') || ''))`;

		const hasAdmin = await page.evaluate(`Boolean(${adminLink})`);

		if (!hasAdmin) {
			record('example: guard blocks a protected route', true, 'skipped (no /admin link)');
		} else {
			// Ensure we are logged OUT, then try to reach /admin.
			await page.evaluate(`(() => {
				const button = ${authButton};
				if (button && /logout/i.test(window.__label(button))) button.click();
			})()`);
			await page.settle(400);
			await page.evaluate(`${adminLink}.click()`);
			await page.settle(900);

			const blocked = await page.evaluate(`({ path: location.pathname, text: window.__deepText().slice(0, 200) })`);
			record(
				'example: guard blocks a protected route when logged out',
				!blocked.path.startsWith('/admin') && blocked.text.length > 20,
				`-> ${blocked.path}`
			);

			// Log back IN, then the same link must be allowed through.
			await page.evaluate(`(() => {
				const button = ${authButton};
				if (button && /login/i.test(window.__label(button))) button.click();
			})()`);
			await page.settle(400);
			await page.evaluate(`${adminLink}.click()`);
			await page.settle(900);

			const allowed = await page.evaluate(`({ path: location.pathname, text: window.__deepText().slice(0, 200) })`);
			record(
				'example: guard admits a protected route when logged in',
				allowed.path.startsWith('/admin') && allowed.text.length > 20,
				`-> ${allowed.path}`
			);
		}

	} finally {
		await page.close();
	}
}

const APPS = {
	demo: { root: join(repoRoot, 'dist/demo'), check: checkDemo },
	example: { root: join(repoRoot, 'web/example/dist'), check: checkExample }
};

const requested = process.argv.slice(2);
const names = requested.length > 0 ? requested : Object.keys(APPS);

const chrome = await launchChrome();

try {
	for (const name of names) {
		const app = APPS[name];

		if (!app) {
			console.error(`app-smoke-check: unknown app '${name}' (known: ${Object.keys(APPS).join(', ')})`);
			process.exit(2);
		}

		if (!existsSync(join(app.root, 'index.html'))) {
			console.error(`app-smoke-check: ${name} is not built (${join(app.root, 'index.html')} missing)`);
			process.exit(2);
		}

		// spaFallback: the router's deep links must resolve the way they do
		// behind a real dev server.
		const site = await serveDirectory(app.root, { spaFallback: true });
		try {
			await app.check(chrome.wsUrl, site.origin);
		} finally {
			site.close();
		}
	}
} finally {
	chrome.close();
}

console.log(`\n${checks.length - failures}/${checks.length} checks passed`);
process.exit(failures > 0 ? 1 : 0);
