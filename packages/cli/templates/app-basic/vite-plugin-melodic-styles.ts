import type { Plugin } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { transform } from 'esbuild';

interface MelodicStylesOptions {
	attribute?: string;
}

interface StoredLink {
	href: string;
	tag: string;
	placeholder: string;
}

/**
 * Vite plugin that preserves <link> tags with the melodic-styles attribute,
 * keeping them separate from the CSS bundle while still minifying them.
 */
export function melodicStylesPlugin(options: MelodicStylesOptions = {}): Plugin {
	const attr = options.attribute ?? 'melodic-styles';

	let root: string;
	let outDir: string;
	let publicDir: string | null = null;
	let isBuild = false;
	const storedLinks: StoredLink[] = [];
	let placeholderIndex = 0;

	const resolveSourceCss = async (href: string): Promise<string | null> => {
		const candidates: string[] = [];

		if (href.startsWith('/')) {
			if (publicDir) {
				candidates.push(resolve(publicDir, href.slice(1)));
			}
			candidates.push(resolve(root, href.slice(1)));
		} else {
			candidates.push(resolve(root, href));
		}

		for (const candidate of candidates) {
			try {
				return await readFile(candidate, 'utf-8');
			} catch {
				// Try next candidate.
			}
		}

		return null;
	};

	return {
		name: 'vite-plugin-melodic-styles',

		configResolved(config) {
			root = config.root;
			outDir = config.build.outDir;
			publicDir = config.publicDir.length > 0 ? config.publicDir : null;
			isBuild = config.command === 'build';
		},

		// Transform HTML to prevent Vite from processing these specific links
		transformIndexHtml: {
			order: 'pre',
			handler(html) {
				if (!isBuild) return html;

				const linkRegex = /<link\s+[^>]*?href=["']([^"']+)["'][^>]*>/gi;
				let match;
				let result = html;

				while ((match = linkRegex.exec(html)) !== null) {
					const fullTag = match[0];
					const href = match[1];

					if (!fullTag.includes(attr)) {
						continue;
					}

					const placeholder = `<!--melodic-styles:${placeholderIndex++}-->`;
					storedLinks.push({ href, tag: fullTag, placeholder });
					result = result.replace(fullTag, placeholder);
				}

				return result;
			}
		},

		// Restore the links and process the CSS after build
		async closeBundle() {
			if (!isBuild || storedLinks.length === 0) return;

			const processed = new Set<string>();

			for (const { href } of storedLinks) {
				if (processed.has(href)) {
					continue;
				}
				processed.add(href);

				const css = await resolveSourceCss(href);
				if (!css) {
					console.error(`[melodic-styles] Failed to read source for ${href}`);
					continue;
				}

				try {
					const { code } = await transform(css, {
						loader: 'css',
						minify: true
					});

					const destPath = resolve(root, outDir, href.startsWith('/') ? href.slice(1) : href);
					await mkdir(dirname(destPath), { recursive: true });
					await writeFile(destPath, code);
					console.log(`[melodic-styles] Minified: ${href}`);
				} catch (err) {
					console.error(`[melodic-styles] Failed to process ${href}:`, err);
				}
			}
		},

		// Post-process HTML files to restore the link tags
		async writeBundle(_, bundle) {
			if (!isBuild || storedLinks.length === 0) return;

			for (const [fileName, chunk] of Object.entries(bundle)) {
				if (fileName.endsWith('.html') && chunk.type === 'asset') {
					let html = chunk.source as string;

					for (const link of storedLinks) {
						html = html.replace(link.placeholder, link.tag);
					}

					const htmlPath = resolve(root, outDir, fileName);
					await writeFile(htmlPath, html);
				}
			}
		}
	};
}
