#!/usr/bin/env node

/**
 * Records the core bundle size and writes it into the benchmark page.
 *
 *   npm run benchmark:update                     # rebuilds bundle/, then measures it
 *   node web/benchmark/update-benchmarks.js      # measures the existing bundle/
 *   node web/benchmark/update-benchmarks.js <dev.js> <min.js>   # measure other files
 *
 * What is measured: `bundle/melodic-core.min.js`, the complete framework as one
 * minified file — the only honest "how big is Melodic" number, since it is what
 * a CDN user downloads and the upper bound for a bundler user (who tree-shakes
 * down from it).
 *
 * Until 4.0.1 this script measured `lib/index.js`, which is the re-export
 * barrel — about 2 kB of `export … from` lines and none of the framework. The
 * page displayed "0.11 kB" as a result, and the README carried a "2.87 kB,
 * smallest full-featured web component framework" claim from v0.1 that was
 * never re-measured. The real figure is roughly thirteen times that.
 *
 * Results are also written to web/benchmark/bundle-size.json, which is tracked
 * in git so a size change shows up in review as a diff.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUNDLES, measure } from '../../scripts/check-bundle-size.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const toRepoPath = (file) => relative(repoRoot, resolve(process.cwd(), file));
const kB = (bytes) => (bytes / 1024).toFixed(2);

try {
	const [devArg, minArg] = process.argv.slice(2);
	const devPath = devArg ? toRepoPath(devArg) : BUNDLES.core.dev;
	const minPath = minArg ? toRepoPath(minArg) : BUNDLES.core.min;

	const dev = measure(devPath);
	const min = measure(minPath);
	if (!dev || !min) {
		throw new Error(`Bundle not found (${!dev ? devPath : minPath}). Run \`npm run build:bundle\` first.`);
	}
	if (min.gzip >= dev.gzip) {
		throw new Error(
			`The minified bundle (${min.gzip} B gzip) is not smaller than the dev bundle (${dev.gzip} B gzip) — it is stale or not really minified. Run \`npm run build:bundle\`.`
		);
	}

	const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));

	console.log('Bundle size (complete core framework, one file):');
	console.log(`   Minified: ${kB(min.raw)} kB`);
	console.log(`   Gzipped:  ${kB(min.gzip)} kB`);
	console.log(`   Brotli:   ${kB(min.brotli)} kB`);

	// Tracked baseline.
	const record = {
		note: 'Written by web/benchmark/update-benchmarks.js (npm run benchmark:update). Sizes in bytes.',
		version: pkg.version,
		core: {
			dev: { raw: dev.raw, gzip: dev.gzip, brotli: dev.brotli },
			min: { raw: min.raw, gzip: min.gzip, brotli: min.brotli }
		}
	};
	const jsonPath = join(here, 'bundle-size.json');
	writeFileSync(jsonPath, JSON.stringify(record, null, '\t') + '\n');
	console.log(`Updated ${relative(repoRoot, jsonPath)}`);

	// Benchmark page.
	const htmlPath = join(here, 'index.html');
	let html = readFileSync(htmlPath, 'utf-8');

	const gzLine = /data-bundle-gz>[^<]+</;
	const minLine = /data-bundle-min>[^<]+</;

	if (gzLine.test(html)) {
		html = html.replace(gzLine, `data-bundle-gz>${kB(min.gzip)} kB<`);
	} else {
		console.warn('Could not find data-bundle-gz marker to update');
	}

	if (minLine.test(html)) {
		html = html.replace(minLine, `data-bundle-min>${kB(min.raw)} kB min<`);
	} else {
		console.warn('Could not find data-bundle-min marker to update');
	}

	writeFileSync(htmlPath, html);
	console.log(`Updated ${relative(repoRoot, htmlPath)}`);
	console.log('Run `npm run benchmark` to view in browser');
} catch (error) {
	console.error('Error updating benchmarks:', error.message);
	process.exit(1);
}
