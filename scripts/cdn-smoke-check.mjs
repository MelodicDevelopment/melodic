#!/usr/bin/env node
/**
 * CDN smoke check for @melodicdev/core (run AFTER `npm publish`).
 *
 *   node scripts/cdn-smoke-check.mjs [version]   # default: package.json version
 *
 * Boots a real component through the bare esm.sh import-map pattern from the
 * docs — bootstrap, MelodicComponent, html, css, signal, HttpClient, and the
 * signal store — in headless Chrome and fails on any console/module error.
 *
 * Why this exists: esm.sh rebuilds each `exports`-map entry into a standalone
 * module. In 3.0.0 its rebuild of runtime `export *` barrel chains silently
 * dropped names (`Injectable` vanished from /es2022/injection.mjs while
 * state.mjs still imported it), so the CDN served a self-inconsistent module
 * graph. The npm package itself was internally consistent — no unit test can
 * see this failure; it only exists at the CDN. Pinning the exact version in
 * the URL busts esm.sh's cache so a fresh publish is actually what's tested.
 */
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchChrome, openPage } from './lib/chrome-driver.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const version = process.argv[2] ?? pkg.version;

/**
 * Fail early, and clearly, when the version simply is not published.
 *
 * This check imports the package FROM THE CDN, so running it before
 * `npm publish` produced a bare "the module graph likely failed to link" —
 * which reads like a serious packaging bug rather than "you have not published
 * yet", the overwhelmingly more likely cause.
 */
async function assertPublished() {
	const response = await fetch(`https://registry.npmjs.org/@melodicdev/core/${version}`).catch(() => null);

	if (response?.ok) {
		return;
	}

	if (response?.status === 404) {
		console.error(`cdn-smoke-check: @melodicdev/core@${version} is not on npm.`);
		console.error('');
		console.error('This check runs AFTER publishing — it imports the package from esm.sh.');
		console.error('Publish first:');
		console.error('');
		console.error('  npm publish --access public');
		console.error(`  npm run smoke:cdn -- ${version}`);
		process.exit(2);
	}

	console.error(`cdn-smoke-check: could not reach the npm registry (${response ? `HTTP ${response.status}` : 'network error'}).`);
	process.exit(2);
}

await assertPublished();

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>@melodicdev/core@${version} CDN smoke</title>
<script type="importmap">
{
	"imports": {
		"@melodicdev/core": "https://esm.sh/@melodicdev/core@${version}",
		"@melodicdev/core/signals": "https://esm.sh/@melodicdev/core@${version}/signals"
	}
}
</script>
</head>
<body>
<pre id="smoke-errors"></pre>
<script>
	const report = (msg) => {
		document.getElementById('smoke-errors').textContent += msg + '\\n';
	};
	addEventListener('error', (e) => report('[error] ' + (e.message || e.error)));
	addEventListener('unhandledrejection', (e) => report('[rejection] ' + (e.reason?.stack || e.reason)));
</script>
<script type="module">
	import {
		bootstrap, MelodicComponent, ComponentBase, html, css, signal, computed,
		HttpClient, provideHttp, Injectable, Service, Injector,
		provideRX, createState, createAction, createReducer, onAction, props, SignalStoreService
	} from '@melodicdev/core';
	import { signal as signalViaSubpath } from '@melodicdev/core/signals';

	const assert = (cond, what) => {
		if (!cond) throw new Error('smoke assertion failed: ' + what);
	};

	// The 3.0.0 regression: names travelling through \`export *\` barrel chains.
	assert(typeof Injectable === 'function', 'Injectable is exported');
	assert(typeof Service === 'function', 'Service is exported');
	assert(signalViaSubpath === signal, 'subpath /signals shares the root signal binding');

	// Signals
	const count = signal(41);
	const doubled = computed(() => count() * 2);
	assert(doubled() === 82, 'computed tracks signal');

	// Signal store
	const increment = createAction('[Smoke] Increment', props());
	const state = createState({ count: 0 });
	const reducers = { count: createReducer(onAction(increment, (s) => s + 1)) };

	// Component (decorator applied as a plain function — no-build page)
	MelodicComponent({
		selector: 'smoke-app',
		template: (self) => html\`<span>count:\${self.count()}</span>\`,
		styles: () => css\`span { font-weight: bold; }\`
	})(class {
		count = count;
	});

	await bootstrap({
		providers: [provideHttp({ baseURL: '/smoke' }), provideRX(state, reducers, {})]
	});

	// DI-resolved HttpClient and store
	assert(Injector.get(HttpClient) instanceof HttpClient, 'HttpClient resolves from the injector');
	const store = Injector.get(SignalStoreService);
	store.dispatch(increment());
	assert(state.count() === 1, 'store dispatch ran the reducer');

	// Boot the component and verify it renders and re-renders
	const el = document.createElement('smoke-app');
	document.body.appendChild(el);
	await new Promise((r) => requestAnimationFrame(() => r()));
	assert(el.shadowRoot?.textContent.includes('count:41'), 'component rendered initial state');
	count.set(42);
	await new Promise((r) => requestAnimationFrame(() => r()));
	assert(el.shadowRoot?.textContent.includes('count:42'), 'component re-rendered on signal change');

	const ok = document.createElement('div');
	ok.id = 'smoke-ok';
	ok.textContent = 'SMOKE-OK';
	document.body.appendChild(ok);
</script>
</body>
</html>
`;

const dir = mkdtempSync(join(tmpdir(), 'melodic-cdn-smoke-'));
const pageFile = join(dir, 'index.html');
writeFileSync(pageFile, html);

// `--dump-dom` was how this ran, and it silently produces NO OUTPUT on current
// Chrome builds (verified empty on 152 for --headless, =old and =new, even for
// a trivial local file) — the check would have reported a false failure for
// every publish. Driving the page over the DevTools Protocol also lets us read
// the console directly instead of scraping it out of the DOM.
const browser = await launchChrome();

try {
	// esm.sh has to fetch and rebuild the module graph, so allow a generous
	// settle window before asserting.
	const page = await openPage(browser.wsUrl, pathToFileURL(pageFile).href, { settleMs: 4000 });

	const reported = await page.evaluate(`document.getElementById('smoke-errors')?.textContent?.trim() ?? ''`);
	const ok = await page.evaluate(`Boolean(document.getElementById('smoke-ok'))`);
	const failures = [...page.pageErrors, ...page.consoleErrors, reported].filter(Boolean);

	await page.close();

	if (ok && failures.length === 0) {
		console.log(`cdn-smoke-check: PASS — esm.sh module graph for ${version} boots clean`);
	} else {
		console.error(`cdn-smoke-check: FAIL for @melodicdev/core@${version}`);
		if (failures.length > 0) {
			console.error(`page errors:\n${failures.join('\n')}`);
		} else {
			console.error('no SMOKE-OK marker: the page never finished its module script.');
			console.error(`Check https://esm.sh/@melodicdev/core@${version} in a browser — esm.sh may still be building`);
			console.error('this version, or its rebuild of the entry barrels dropped an export.');
		}
		process.exit(1);
	}
} finally {
	browser.close();
}
