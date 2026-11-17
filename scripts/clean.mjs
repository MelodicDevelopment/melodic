#!/usr/bin/env node
/**
 * Removes build output directories before a build.
 *
 *   node scripts/clean.mjs lib            # relative to the current directory
 *   node scripts/clean.mjs lib dist
 *
 * Why this exists: `tsc` only writes files, it never deletes them. A source
 * file that was renamed or removed kept its compiled twin in `lib/` forever,
 * and since `lib` is in `files`, the orphan was published — 4.0.1 shipped
 * `lib/template/classes/compiled-template.class.js`, which has no source.
 *
 * Cross-platform (no `rm -rf`), and it refuses anything that is not a plain
 * subdirectory of the current directory, so a typo cannot delete the project.
 */
import { rmSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const targets = process.argv.slice(2);
if (targets.length === 0) {
	console.error('clean: pass at least one directory, e.g. `node scripts/clean.mjs lib`');
	process.exit(2);
}

const cwd = process.cwd();
for (const target of targets) {
	const absolute = resolve(cwd, target);
	const fromCwd = relative(cwd, absolute);
	if (fromCwd === '' || fromCwd === '..' || fromCwd.startsWith(`..${sep}`) || isAbsolute(fromCwd)) {
		console.error(`clean: refusing to remove "${target}" — it is not inside ${cwd}`);
		process.exit(2);
	}
	rmSync(absolute, { recursive: true, force: true });
}
