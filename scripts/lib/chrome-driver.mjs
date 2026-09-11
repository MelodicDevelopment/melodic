/**
 * A minimal Chrome driver over the DevTools Protocol.
 *
 * `--dump-dom` was the obvious tool for this and is what
 * `scripts/cdn-smoke-check.mjs` used, but it silently produces **no output** on
 * current Chrome builds (verified empty on 152 for `--headless`, `=old` and
 * `=new`, even for a trivial local file). CDP is the supported path and gives
 * us what `--dump-dom` never did: the console, page errors, and the ability to
 * interact with the page rather than only snapshot it.
 *
 * No dependencies — Node's built-in WebSocket speaks CDP directly.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function findChrome() {
	return (
		process.env.CHROME_BIN ??
		[
			'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
			'/Applications/Chromium.app/Contents/MacOS/Chromium',
			'/usr/bin/google-chrome',
			'/usr/bin/google-chrome-stable',
			'/usr/bin/chromium-browser',
			'/usr/bin/chromium'
		].find(existsSync)
	);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Launch headless Chrome with a throwaway profile and an open debugging port. */
export async function launchChrome({ port = 0 } = {}) {
	const chrome = findChrome();
	if (!chrome) {
		throw new Error('no Chrome/Chromium found (set CHROME_BIN)');
	}

	const profile = mkdtempSync(join(tmpdir(), 'melodic-chrome-'));
	const child = spawn(
		chrome,
		[
			'--headless=new',
			'--disable-gpu',
			'--no-sandbox',
			'--hide-scrollbars',
			`--remote-debugging-port=${port}`,
			`--user-data-dir=${profile}`,
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-extensions',
			'--disable-component-update',
			'--disable-background-networking',
			'--disable-sync',
			'--disable-features=Translate,MediaRouter',
			'about:blank'
		],
		{ stdio: ['ignore', 'ignore', 'pipe'] }
	);

	// Chrome prints the chosen port on stderr when asked for port 0.
	const wsUrl = await new Promise((resolve, reject) => {
		let buffer = '';
		const timer = setTimeout(() => reject(new Error('Chrome did not report a debugging port within 30s')), 30_000);

		child.stderr.on('data', (chunk) => {
			buffer += chunk.toString();
			const match = buffer.match(/ws:\/\/[^\s]+/);
			if (match) {
				clearTimeout(timer);
				resolve(match[0]);
			}
		});

		child.on('exit', (code) => {
			clearTimeout(timer);
			reject(new Error(`Chrome exited early (code ${code})`));
		});
	});

	return {
		wsUrl,
		close: () => {
			child.kill('SIGTERM');
			try {
				rmSync(profile, { recursive: true, force: true });
			} catch {
				/* the profile is in tmp; leaking it is harmless */
			}
		}
	};
}

/** A CDP connection with request/response correlation and event listeners. */
class CdpSession {
	constructor(socket) {
		this._socket = socket;
		this._nextId = 0;
		this._pending = new Map();
		this._listeners = new Map();

		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);

			if (message.id !== undefined) {
				const pending = this._pending.get(message.id);
				this._pending.delete(message.id);
				if (!pending) return;
				if (message.error) pending.reject(new Error(`${message.error.message} (${JSON.stringify(message.params ?? {})})`));
				else pending.resolve(message.result);
				return;
			}

			for (const listener of this._listeners.get(message.method) ?? []) {
				listener(message.params);
			}
		});
	}

	send(method, params = {}, sessionId) {
		const id = ++this._nextId;
		return new Promise((resolve, reject) => {
			this._pending.set(id, { resolve, reject });
			this._socket.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
		});
	}

	on(method, listener) {
		const listeners = this._listeners.get(method) ?? [];
		listeners.push(listener);
		this._listeners.set(method, listeners);
	}

	close() {
		this._socket.close();
	}
}

async function connect(wsUrl) {
	const socket = new WebSocket(wsUrl);
	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve, { once: true });
		socket.addEventListener('error', () => reject(new Error(`could not connect to ${wsUrl}`)), { once: true });
	});
	return new CdpSession(socket);
}

/**
 * Open `url`, wait for the app to settle, and return a handle for inspecting
 * and driving the page.
 *
 * Everything the page reports about itself — console errors, uncaught
 * exceptions, failed requests — is collected from the moment navigation starts,
 * so a failure during bootstrap is caught rather than missed.
 */
export async function openPage(wsUrl, url, { settleMs = 1200 } = {}) {
	const browser = await connect(wsUrl);

	const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
	const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

	const consoleErrors = [];
	const consoleWarnings = [];
	const pageErrors = [];
	const failedRequests = [];

	browser.on('Runtime.consoleAPICalled', (params) => {
		if (params.sessionId && params.sessionId !== sessionId) return;
		const text = (params.args ?? []).map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '').join(' ');
		if (params.type === 'error') consoleErrors.push(text);
		if (params.type === 'warning') consoleWarnings.push(text);
	});

	browser.on('Runtime.exceptionThrown', (params) => {
		const details = params.exceptionDetails ?? {};
		pageErrors.push(details.exception?.description ?? details.text ?? 'unknown exception');
	});

	browser.on('Network.loadingFailed', (params) => {
		if (params.type === 'Document' || params.type === 'Script' || params.type === 'Stylesheet') {
			failedRequests.push(`${params.type}: ${params.errorText}`);
		}
	});

	await browser.send('Runtime.enable', {}, sessionId);
	await browser.send('Page.enable', {}, sessionId);
	await browser.send('Network.enable', {}, sessionId);

	await browser.send('Page.navigate', { url }, sessionId);

	// Wait for the load event, then let the app's own microtask/rAF work finish.
	await new Promise((resolve) => {
		const timer = setTimeout(resolve, 20_000);
		browser.on('Page.loadEventFired', () => {
			clearTimeout(timer);
			resolve();
		});
	});
	await sleep(settleMs);

	/** Evaluate an expression in the page and return its JSON value. */
	const evaluate = async (expression) => {
		const result = await browser.send(
			'Runtime.evaluate',
			{ expression, returnByValue: true, awaitPromise: true, userGesture: true },
			sessionId
		);

		if (result.exceptionDetails) {
			throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
		}

		return result.result.value;
	};

	return {
		evaluate,
		/** Let pending renders and timers run. */
		settle: (ms = 250) => sleep(ms),
		consoleErrors,
		consoleWarnings,
		pageErrors,
		failedRequests,
		close: async () => {
			await browser.send('Target.closeTarget', { targetId }).catch(() => undefined);
			browser.close();
		}
	};
}
