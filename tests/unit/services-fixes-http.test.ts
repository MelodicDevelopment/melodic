import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpClient } from '../../src/http';
import { AbortError, HttpError } from '../../src/http/classes/http-error.class';
import type { IHttpResponse } from '../../src/http';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** A fetch that never answers and rejects when its signal aborts, like the real one. */
function abortableFetch(): ReturnType<typeof vi.fn> {
	return vi.fn(
		(...args: [string, RequestInit]) =>
			new Promise<Response>((resolve, reject) => {
				void resolve;
				args[1].signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
			})
	);
}

describe('http fixes (2026-11 review)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	describe('deduplication', () => {
		it('a GET issued right after the last participant aborted starts a fresh request', async () => {
			const fetchMock = abortableFetch();
			vi.stubGlobal('fetch', fetchMock);

			const client = new HttpClient();
			const controller = new AbortController();

			const first = client.get('/x', { signal: controller.signal }).catch((error: Error) => error);
			await tick();
			expect(fetchMock).toHaveBeenCalledTimes(1);

			controller.abort();
			// Same tick: the dying request must not be joined.
			let secondSettled: string = 'pending';
			void client.get('/x').then(
				() => (secondSettled = 'resolved'),
				(error: Error) => (secondSettled = `rejected: ${error.name}`)
			);

			await tick();
			await tick();

			expect(await first).toBeInstanceOf(AbortError);
			expect(secondSettled).toBe('pending');
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('runs response error interceptors once for a shared failed request', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } }));
			vi.stubGlobal('fetch', fetchMock);

			const client = new HttpClient();
			let errorRuns = 0;
			client.interceptors.response({
				intercept: async <T>(response: IHttpResponse<T>) => response,
				error: async () => {
					errorRuns++;
				}
			});

			const results = await Promise.allSettled([client.get('/e'), client.get('/e'), client.get('/e')]);

			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(errorRuns).toBe(1);
			for (const result of results) {
				expect(result.status).toBe('rejected');
				expect((result as PromiseRejectedResult).reason).toBeInstanceOf(HttpError);
			}
		});

		it('a retry from a shared error handler runs once and answers every participant', async () => {
			let calls = 0;
			const fetchMock = vi.fn().mockImplementation(async () => {
				calls++;
				return calls === 1
					? new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })
					: new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
			});
			vi.stubGlobal('fetch', fetchMock);

			const client = new HttpClient();
			client.interceptors.response({
				intercept: async <T>(response: IHttpResponse<T>) => response,
				error: async (error, context) => {
					void error;
					return context.retry();
				}
			});

			const [a, b] = await Promise.all([client.get<{ ok: boolean }>('/me'), client.get<{ ok: boolean }>('/me')]);

			expect(a.data).toEqual({ ok: true });
			expect(b.data).toEqual({ ok: true });
			// One failed request plus ONE retry — not one retry per caller.
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('does not share a response between different responseTypes', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('abc', { status: 200, headers: { 'content-type': 'text/plain' } }));
			vi.stubGlobal('fetch', fetchMock);

			const client = new HttpClient();
			const [text, blob] = await Promise.all([client.get<string>('/f'), client.get<Blob>('/f', { responseType: 'blob' })]);

			expect(text.data).toBe('abc');
			expect(blob.data).toBeInstanceOf(Blob);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	describe('response decoding', () => {
		it('parses +json content types', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'bad' }), { status: 400, headers: { 'content-type': 'application/problem+json; charset=utf-8' } }))
			);

			const error = (await new HttpClient().post('/u', { a: 1 }).catch((e: unknown) => e)) as HttpError;

			expect(error).toBeInstanceOf(HttpError);
			expect(error.response.data).toEqual({ title: 'bad' });
		});

		it('still returns unknown content types as text by default', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('a,b', { status: 200, headers: { 'content-type': 'application/x-custom' } })));

			const response = await new HttpClient().get<string>('/csv');
			expect(response.data).toBe('a,b');
		});

		it('honors responseType: blob / arrayBuffer / text / json', async () => {
			const bytes = new Uint8Array([0x50, 0x4b, 0xff, 0xfe]);
			const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			vi.stubGlobal(
				'fetch',
				vi.fn().mockImplementation(async (url: string) =>
					url.includes('json') ? new Response('{"a":1}', { status: 200, headers: { 'content-type': 'text/plain' } }) : new Response(bytes, { status: 200, headers: { 'content-type': contentType } })
				)
			);

			const client = new HttpClient();

			const blob = await client.get<Blob>('/file', { responseType: 'blob' });
			expect(blob.data).toBeInstanceOf(Blob);
			expect(new Uint8Array(await blob.data.arrayBuffer())).toEqual(bytes);

			const buffer = await client.get<ArrayBuffer>('/file', { responseType: 'arrayBuffer' });
			expect(new Uint8Array(buffer.data)).toEqual(bytes);

			const json = await client.get<{ a: number }>('/json', { responseType: 'json' });
			expect(json.data).toEqual({ a: 1 });

			const text = await client.get<string>('/json', { responseType: 'text' });
			expect(text.data).toBe('{"a":1}');
		});
	});

	describe('request bodies', () => {
		it('sends typed arrays as binary, not as JSON', async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);

			const body = new Uint8Array([1, 2, 3]);
			await new HttpClient().post('/upload', body);

			const init = fetchMock.mock.calls[0][1] as RequestInit;
			expect(init.body).toBe(body);
			expect(Object.keys(init.headers as Record<string, string>).map((name) => name.toLowerCase())).not.toContain('content-type');
		});
	});

	describe('cross-origin defaults', () => {
		const config = {
			baseURL: 'https://api.mine.example',
			defaultHeaders: { Authorization: 'Bearer secret' },
			credentials: 'include' as RequestCredentials
		};

		function lastInit(fetchMock: ReturnType<typeof vi.fn>): { url: string; headers: Record<string, string>; credentials?: string } {
			const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
			return { url, headers: init.headers as Record<string, string>, credentials: init.credentials };
		}

		it('does not send default headers or credentials to another origin', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('', { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);

			await new HttpClient(config).get('https://third-party.example/x', { headers: { 'X-Mine': '1' } });

			const sent = lastInit(fetchMock);
			expect(sent.url).toBe('https://third-party.example/x');
			expect(sent.headers).toEqual({ 'X-Mine': '1' });
			expect(sent.credentials).toBeUndefined();
		});

		it('still sends them to the baseURL origin, relative or absolute, and to the page origin', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('', { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);
			const client = new HttpClient(config);

			await client.get('/users');
			expect(lastInit(fetchMock)).toEqual({ url: 'https://api.mine.example/users', headers: { Authorization: 'Bearer secret' }, credentials: 'include' });

			await client.get('https://api.mine.example/other');
			expect(lastInit(fetchMock).headers).toEqual({ Authorization: 'Bearer secret' });

			await client.get(`${window.location.origin}/local`);
			expect(lastInit(fetchMock).headers).toEqual({ Authorization: 'Bearer secret' });

			await new HttpClient({ defaultHeaders: { Authorization: 'Bearer secret' } }).get('/relative');
			expect(lastInit(fetchMock).headers).toEqual({ Authorization: 'Bearer secret' });
		});

		it('request-level credentials are honored cross-origin', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('', { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);

			await new HttpClient(config).get('https://third-party.example/x', { credentials: 'omit' });
			expect(lastInit(fetchMock).credentials).toBe('omit');
		});

		it('allowCrossOriginDefaults restores the old behaviour', async () => {
			const fetchMock = vi.fn().mockImplementation(async () => new Response('', { status: 200 }));
			vi.stubGlobal('fetch', fetchMock);

			await new HttpClient({ ...config, allowCrossOriginDefaults: true }).get('https://third-party.example/x');

			const sent = lastInit(fetchMock);
			expect(sent.headers).toEqual({ Authorization: 'Bearer secret' });
			expect(sent.credentials).toBe('include');
		});
	});
});
