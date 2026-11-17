#!/usr/bin/env node
/**
 * Bundle size check — fails when a ".min.js" CDN bundle is not really minified.
 *
 *   node scripts/check-bundle-size.mjs            # core bundle (bundle/)
 *   node scripts/check-bundle-size.mjs --all      # + components bundle (assets/)
 *   node scripts/check-bundle-size.mjs --json     # machine-readable sizes
 *
 * Why this exists: through 4.0.1 the "min" bundles kept all their whitespace
 * (Vite's lib mode does not strip it for ES output) and gzipped LARGER than the
 * unminified files — 49,120 vs 46,420 bytes for core. Nothing noticed, because
 * nothing measured. This measures, and it is also where the benchmark page
 * gets the bundle size it displays (web/benchmark/update-benchmarks.js).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const BUNDLES = {
	core: {
		dev: 'bundle/melodic-core.js',
		min: 'bundle/melodic-core.min.js'
	},
	components: {
		dev: 'packages/melodic-components/assets/melodic-components.js',
		min: 'packages/melodic-components/assets/melodic-components.min.js'
	}
};

/** Raw, gzip (level 9) and brotli byte sizes of a file, or null if missing. */
export function measure(relativePath) {
	const file = join(repoRoot, relativePath);
	if (!existsSync(file)) {
		return null;
	}
	const content = readFileSync(file);
	return {
		file: relativePath,
		raw: content.length,
		gzip: gzipSync(content, { level: 9 }).length,
		brotli: brotliCompressSync(content).length,
		// Longest-line heuristic is unreliable (templates hold newlines), so
		// count indented lines instead: minified output has almost none.
		indentedLines: content.toString('utf8').split('\n').filter((line) => /^\s+\S/.test(line)).length,
		lines: content.toString('utf8').split('\n').length
	};
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	const args = new Set(process.argv.slice(2));
	const names = args.has('--all') ? Object.keys(BUNDLES) : ['core'];
	const report = {};
	let failures = 0;

	for (const name of names) {
		const dev = measure(BUNDLES[name].dev);
		const min = measure(BUNDLES[name].min);
		if (!dev || !min) {
			console.error(`check-bundle-size: ${name} bundle is missing — build it first (npm run build:bundle / build:components)`);
			process.exit(2);
		}
		report[name] = { dev, min };

		const checks = [
			['min is smaller than dev (raw)', min.raw < dev.raw, `${min.raw} vs ${dev.raw}`],
			['min is smaller than dev (gzip)', min.gzip < dev.gzip, `${min.gzip} vs ${dev.gzip}`],
			// A real minifier removes at least a quarter of the raw bytes.
			['min is at most 75% of dev (raw)', min.raw <= dev.raw * 0.75, `${((min.raw / dev.raw) * 100).toFixed(1)}%`]
		];
		if (!args.has('--json')) {
			console.log(`${name}:`);
			console.log(`  dev  ${dev.raw} B raw, ${dev.gzip} B gzip, ${dev.brotli} B brotli`);
			console.log(`  min  ${min.raw} B raw, ${min.gzip} B gzip, ${min.brotli} B brotli`);
		}
		for (const [label, ok, detail] of checks) {
			if (!ok) {
				failures += 1;
			}
			if (!args.has('--json')) {
				console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} — ${detail}`);
			}
		}
	}

	if (args.has('--json')) {
		console.log(JSON.stringify(report, null, '\t'));
	} else {
		console.log(failures === 0 ? '\ncheck-bundle-size: PASS' : `\ncheck-bundle-size: ${failures} failure(s)`);
	}
	process.exit(failures > 0 ? 1 : 0);
}
