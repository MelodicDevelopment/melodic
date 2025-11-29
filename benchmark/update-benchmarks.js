#!/usr/bin/env node

/**
 * Updates benchmark HTML with current bundle size
 * Run with: npm run benchmark:update
 */

import { readFileSync, writeFileSync } from 'fs';
import { gzipSync } from 'zlib';

try {
	// Calculate bundle sizes
	const distFile = './dist/melodic.js';
	const content = readFileSync(distFile);
	const gzipped = gzipSync(content);

	const minifiedSize = (content.length / 1024).toFixed(2);
	const gzippedSize = (gzipped.length / 1024).toFixed(2);

	console.log('📊 Bundle Size Analysis:');
	console.log(`   Minified: ${minifiedSize} kB`);
	console.log(`   Gzipped:  ${gzippedSize} kB`);

	// Update HTML file
	const htmlPath = './benchmark/performance-test.html';
	let html = readFileSync(htmlPath, 'utf-8');

	// Update the bundle size line
	const oldLine = html.match(/<strong>Bundle Size:<\/strong> [\d.]+ kB gzipped \([\d.]+ kB minified\)/);
	const newLine = `<strong>Bundle Size:</strong> ${gzippedSize} kB gzipped (${minifiedSize} kB minified)`;

	if (oldLine) {
		html = html.replace(oldLine[0], newLine);
		writeFileSync(htmlPath, html);
		console.log(`✓ Updated ${htmlPath}`);
		console.log(`  ${oldLine[0]}`);
		console.log(`  → ${newLine}`);
	} else {
		console.warn('⚠ Could not find bundle size line to update');
	}

	// Also update console output bundle size references (lines 401)
	html = html.replace(
		/Bundle Size: [\d.]+ kB gzipped \([\d.]+% smaller than v[\d.]+\)/g,
		`Bundle Size: ${gzippedSize} kB gzipped`
	);
	writeFileSync(htmlPath, html);

	console.log('\n✨ Benchmark HTML updated successfully!');
	console.log('   Run `npm run benchmark` to view in browser');

} catch (error) {
	console.error('❌ Error updating benchmarks:', error.message);
	process.exit(1);
}
