#!/usr/bin/env node

/**
 * Updates benchmark HTML with current bundle size
 * Run with: npm run benchmark:update
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';

try {
	// Calculate bundle sizes
	const candidates = ['./lib/index.js', './dist/melodic.js', './dist/index.js'];
	const distFile = candidates.find((file) => existsSync(file));
	if (!distFile) {
		throw new Error('No build output found. Run `npm run build:lib` or `npm run build` first.');
	}
	const content = readFileSync(distFile);
	const gzipped = gzipSync(content);

	const minifiedSize = (content.length / 1024).toFixed(2);
	const gzippedSize = (gzipped.length / 1024).toFixed(2);

	console.log('📊 Bundle Size Analysis:');
	console.log(`   Minified: ${minifiedSize} kB`);
	console.log(`   Gzipped:  ${gzippedSize} kB`);

	// Update benchmark HTML file
	const htmlPath = './web/benchmark/index.html';
	let html = readFileSync(htmlPath, 'utf-8');

	const gzLine = /data-bundle-gz>[^<]+</;
	const minLine = /data-bundle-min>[^<]+</;

	if (gzLine.test(html)) {
		html = html.replace(gzLine, `data-bundle-gz>${gzippedSize} kB<`);
	} else {
		console.warn('⚠ Could not find data-bundle-gz marker to update');
	}

	if (minLine.test(html)) {
		html = html.replace(minLine, `data-bundle-min>${minifiedSize} kB min<`);
	} else {
		console.warn('⚠ Could not find data-bundle-min marker to update');
	}

	writeFileSync(htmlPath, html);
	console.log(`✓ Updated ${htmlPath}`);

	console.log('\n✨ Benchmark HTML updated successfully!');
	console.log('   Run `npm run benchmark` to view in browser');

} catch (error) {
	console.error('❌ Error updating benchmarks:', error.message);
	process.exit(1);
}
