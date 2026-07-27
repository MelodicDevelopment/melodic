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
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const version = process.argv[2] ?? pkg.version;

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
const page = join(dir, 'index.html');
writeFileSync(page, html);

const chrome =
	process.env.CHROME_BIN ??
	[
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/usr/bin/google-chrome',
		'/usr/bin/google-chrome-stable',
		'/usr/bin/chromium-browser',
		'/usr/bin/chromium'
	].find(existsSync);

if (!chrome) {
	console.error('cdn-smoke-check: no Chrome/Chromium found (set CHROME_BIN)');
	process.exit(2);
}

console.log(`cdn-smoke-check: @melodicdev/core@${version} via ${chrome}`);
const dom = execFileSync(
	chrome,
	['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=30000', '--dump-dom', pathToFileURL(page).href],
	{ encoding: 'utf8', timeout: 120_000, maxBuffer: 32 * 1024 * 1024 }
);

const errors = /<pre id="smoke-errors">([\s\S]*?)<\/pre>/.exec(dom)?.[1].trim();
if (dom.includes('SMOKE-OK') && !errors) {
	console.log(`cdn-smoke-check: PASS — esm.sh module graph for ${version} boots clean`);
} else {
	console.error(`cdn-smoke-check: FAIL for @melodicdev/core@${version}`);
	console.error(errors ? `page errors:\n${errors}` : 'no SMOKE-OK marker (module graph likely failed to link; run without --headless to inspect)');
	process.exit(1);
}
