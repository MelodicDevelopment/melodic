import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.ico': 'image/x-icon'
};

/**
 * Serve `root` over HTTP on an ephemeral port.
 *
 * HTTP rather than `file://` because Chrome treats every `file://` document as
 * its own opaque origin: an ES module import from one file path to another is
 * blocked as cross-origin, so a page cannot import a bundle sitting in a
 * different directory.
 *
 * @param {string} root directory to serve
 * @param {{ spaFallback?: boolean }} options `spaFallback` serves index.html for
 *   unknown paths, so a client-side router's deep links resolve.
 */
export function serveDirectory(root, { spaFallback = false } = {}) {
	return new Promise((ready) => {
		const server = createServer((req, res) => {
			const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
			let filePath = join(root, urlPath);

			if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
				const indexed = join(filePath, 'index.html');
				if (existsSync(indexed)) {
					filePath = indexed;
				} else if (spaFallback) {
					filePath = join(root, 'index.html');
				}
			}

			if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
				res.writeHead(404).end('not found');
				return;
			}

			res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
			res.end(readFileSync(filePath));
		});

		server.listen(0, '127.0.0.1', () =>
			ready({
				server,
				port: server.address().port,
				origin: `http://127.0.0.1:${server.address().port}`,
				close: () => server.close()
			})
		);
	});
}
