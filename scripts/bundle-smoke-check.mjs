#!/usr/bin/env node
/**
 * Bundle smoke check — boots BOTH prebuilt `bundle/` artifacts in a browser and
 * asserts the dev/production split is real.
 *
 *   node scripts/bundle-smoke-check.mjs
 *
 * Why this exists: through 3.x, `bundle/melodic-core.js` was nominally the
 * "development" build but `vite build` set `import.meta.env.DEV` to false
 * regardless of `--mode`, so BOTH artifacts folded every dev diagnostic away
 * and no CDN consumer could get a build that warns. The fix is a `define` in
 * vite.config.bundle.ts — and the only way to know it still holds is to run
 * both bundles and check whether a deliberate mistake produces a warning.
 */
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, openPage } from './lib/chrome-driver.mjs';
import { serveDirectory } from './lib/static-server.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * A page that boots the bundle and deliberately renders a template with a
 * binding in an unsupported position — a diagnostic that exists only in dev.
 */
function pageFor(bundleUrl) {
	return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>bundle smoke</title></head>
<body>
<div id="host"></div>
<script type="module">
	window.__warnings = [];
	const nativeWarn = console.warn.bind(console);
	console.warn = (...args) => { window.__warnings.push(args.map(String).join(' ')); nativeWarn(...args); };

	import { html, render, signal, isDevMode } from '${bundleUrl}';

	// Ordinary rendering must work in both builds.
	const name = signal('world');
	render(html\`<p id="greeting">hello \${name()}</p>\`, document.getElementById('host'));

	// A binding inside an HTML comment is unsupported and warns in dev only.
	render(html\`<div><!-- \${'x'} --></div>\`, document.createElement('div'));

	window.__result = {
		devMode: isDevMode(),
		greeting: document.getElementById('greeting')?.textContent ?? null,
		warnings: window.__warnings.slice()
	};
	document.body.dataset.ready = 'true';
</script>
</body>
</html>`;
}

const bundles = [
	{ name: 'development', file: join(repoRoot, 'bundle/melodic-core.js'), url: '/bundle/melodic-core.js', expectDev: true },
	{ name: 'production', file: join(repoRoot, 'bundle/melodic-core.min.js'), url: '/bundle/melodic-core.min.js', expectDev: false }
];

for (const bundle of bundles) {
	if (!existsSync(bundle.file)) {
		console.error(`bundle-smoke-check: ${bundle.file} is missing — run \`npm run build:bundle\``);
		process.exit(2);
	}
}

// The page and the bundle must share an origin, so both are served from the
// repo root over HTTP.
const site = await serveDirectory(repoRoot);
const browser = await launchChrome();

let failures = 0;
const record = (name, ok, detail = '') => {
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
	for (const bundle of bundles) {
		const pageName = `.bundle-smoke-${bundle.name}.html`;
		writeFileSync(join(repoRoot, pageName), pageFor(bundle.url));

		const page = await openPage(browser.wsUrl, `${site.origin}/${pageName}`, { settleMs: 1500 });
		const result = await page.evaluate('window.__result ?? null');

		if (!result) {
			record(`${bundle.name} bundle: boots`, false, [...page.pageErrors, ...page.consoleErrors].slice(0, 2).join(' | ').slice(0, 300));
			await page.close();
			continue;
		}

		record(`${bundle.name} bundle: boots and renders`, result.greeting === 'hello world', `rendered ${JSON.stringify(result.greeting)}`);
		record(`${bundle.name} bundle: isDevMode() === ${bundle.expectDev}`, result.devMode === bundle.expectDev, `got ${result.devMode}`);

		const warned = result.warnings.some((text) => text.includes('[Melodic]'));
		record(
			`${bundle.name} bundle: diagnostics ${bundle.expectDev ? 'ARE' : 'are NOT'} emitted`,
			warned === bundle.expectDev,
			warned ? `warned: ${result.warnings[0]?.slice(0, 120)}` : 'silent'
		);

		record(`${bundle.name} bundle: no errors`, page.pageErrors.length === 0 && page.consoleErrors.length === 0, page.pageErrors.slice(0, 2).join(' | ').slice(0, 200));

		await page.close();
	}
} finally {
	browser.close();
	site.close();
	for (const bundle of bundles) {
		rmSync(join(repoRoot, `.bundle-smoke-${bundle.name}.html`), { force: true });
	}
}

console.log(failures === 0 ? '\nbundle-smoke-check: PASS' : `\nbundle-smoke-check: ${failures} failure(s)`);
process.exit(failures > 0 ? 1 : 0);
