import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpClient } from '../../src/http';
import { HttpError, NetworkError } from '../../src/http/classes/http-error.class';
import type { IHttpResponse } from '../../src/http';


describe('http client', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('parses JSON responses', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const response = await client.get<{ ok: boolean }>('/status');

		expect(response.data).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('throws NetworkError when fetch rejects', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		await expect(client.get('/fail', { deduplicate: false })).rejects.toBeInstanceOf(NetworkError);
	});

	it('runs request/response interceptors', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		client.interceptors.request({
			intercept: async (config) => {
				return {
					...config,
					headers: {
						...config.headers,
						'x-test': '1'
					}
				};
			}
		});
		client.interceptors.response({
			intercept: async (response) => {
				return {
					...response,
					data: {
						...(response.data as { ok: boolean }),
						flagged: true
					}
				};
			}
		});

		const response = await client.get('/status');
		expect(response.data).toEqual({ ok: true, flagged: true });

		const options = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
		const headers = options?.headers as Record<string, string> | undefined;
		expect(headers?.['x-test']).toBe('1');
	});

	it('propagates HttpError when no response interceptor defines error()', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: 'unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		client.interceptors.response({
			intercept: async (response) => response
		});

		await expect(client.get('/secure', { deduplicate: false })).rejects.toBeInstanceOf(HttpError);
	});

	it('recovers when a response interceptor error() returns a replacement response', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: 'bad' }), {
				status: 500,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const downstreamIntercept = vi.fn(async (r: IHttpResponse) => ({
			...r,
			data: { ...(r.data as object), transformed: true }
		}));

		client.interceptors.response({
			intercept: async (response) => response,
			error: async (_err) => ({
				data: { recovered: true } as unknown,
				status: 200,
				statusText: 'OK',
				headers: new Headers(),
				config: {}
			} as IHttpResponse)
		});
		client.interceptors.response({
			intercept: downstreamIntercept
		});

		const response = await client.get('/broken', { deduplicate: false });
		expect(response.data).toEqual({ recovered: true, transformed: true });
		expect(downstreamIntercept).toHaveBeenCalledOnce();
	});

	it('falls through to the next error() when an earlier one rejects', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: 'bad' }), {
				status: 500,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const firstError = vi.fn(async () => {
			throw new Error('first handler gave up');
		});
		const secondError = vi.fn(async () => ({
			data: { recovered: true } as unknown,
			status: 200,
			statusText: 'OK',
			headers: new Headers(),
			config: {}
		} as IHttpResponse));

		client.interceptors.response({
			intercept: async (response) => response,
			error: firstError
		});
		client.interceptors.response({
			intercept: async (response) => response,
			error: secondError
		});

		const response = await client.get('/broken', { deduplicate: false });
		expect(firstError).toHaveBeenCalledOnce();
		expect(secondError).toHaveBeenCalledOnce();
		expect(response.data).toEqual({ recovered: true });
	});

	it('supports a single retry via context.retry() on auth refresh', async () => {
		let call = 0;
		const fetchMock = vi.fn().mockImplementation(async () => {
			call++;
			if (call === 1) {
				return new Response(JSON.stringify({ message: 'unauthorized' }), {
					status: 401,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const errorHandler = vi.fn(async (_err: Error, ctx: { retry: () => Promise<IHttpResponse>; retryCount: number }) => {
			if (ctx.retryCount > 0) {
				throw _err;
			}
			return await ctx.retry();
		});

		client.interceptors.response({
			intercept: async (response) => response,
			error: errorHandler
		});

		const response = await client.get('/resource', { deduplicate: false });
		expect(response.data).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('caps retry() at MAX_RETRIES to prevent infinite loops', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: 'unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		client.interceptors.response({
			intercept: async (response) => response,
			error: async (_err, ctx) => await ctx.retry()
		});

		await expect(client.get('/loop', { deduplicate: false })).rejects.toThrow();
		// Initial attempt + 3 retries = 4 fetch calls
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});

	it('resolves an empty JSON body to null instead of throwing', async () => {
		// 204/201 with an application/json content-type but no body.
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('', {
				status: 204,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const response = await client.post('/items', { name: 'x' });
		// Regression: this used to throw on JSON.parse('') and surface as NetworkError.
		expect(response.status).toBe(204);
		expect(response.data).toBeNull();
	});

	it('joins base URL and path with exactly one slash', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient({ baseURL: 'https://api.test/' });
		await client.get('/users', { deduplicate: false });
		expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/users');
	});

	it('skips null/undefined params and expands array params', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		await client.get('/search', {
			deduplicate: false,
			params: { q: 'x', skip: undefined, tags: ['a', 'b'] }
		});

		const url = fetchMock.mock.calls[0]?.[0] as string;
		expect(url).toContain('q=x');
		expect(url).not.toContain('skip');
		expect(url).toContain('tags=a');
		expect(url).toContain('tags=b');
	});

	it('does not fan out retries when multiple error handlers each call retry()', async () => {
		const fetchMock = vi.fn().mockImplementation(
			async () =>
				new Response(JSON.stringify({ message: 'fail' }), {
					status: 500,
					headers: { 'content-type': 'application/json' }
				})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		client.interceptors.response({ intercept: async (r) => r, error: async (_e, ctx) => await ctx.retry() });
		client.interceptors.response({ intercept: async (r) => r, error: async (_e, ctx) => await ctx.retry() });

		await expect(client.get('/x', { deduplicate: false })).rejects.toThrow();
		// One retry per error pass, chained to MAX_RETRIES: initial + 3 = 4.
		// The old per-handler guard let both handlers retry each pass (7+ fetches).
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});

	it('aborts a request that exceeds its timeout', async () => {
		const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
			return new Promise((_resolve, reject) => {
				init.signal?.addEventListener('abort', () => {
					const reason = (init.signal as AbortSignal).reason;
					reject(reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError'));
				});
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		await expect(client.get('/slow', { deduplicate: false, timeout: 10 })).rejects.toThrow(/timed out/i);
	});

	it('does not deduplicate distinct FormData uploads', async () => {
		const fetchMock = vi.fn().mockImplementation(
			async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const a = new FormData();
		a.append('file', 'one');
		const b = new FormData();
		b.append('file', 'two');

		await Promise.all([
			client.post('/upload', a, { deduplicate: true }),
			client.post('/upload', b, { deduplicate: true })
		]);

		// Two distinct uploads must both go out, not be merged into one.
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('runs each response interceptor exactly once on a retried response', async () => {
		let call = 0;
		const fetchMock = vi.fn().mockImplementation(async () => {
			call++;
			if (call === 1) {
				return new Response(JSON.stringify({ message: 'unauthorized' }), {
					status: 401,
					headers: { 'content-type': 'application/json' }
				});
			}
			return new Response(JSON.stringify({ count: 0 }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		client.interceptors.response({
			intercept: async (r) => r,
			error: async (_err, ctx) => await ctx.retry()
		});
		// A downstream "data transform" interceptor: applying it twice is visible.
		client.interceptors.response({
			intercept: async (r) => ({
				...r,
				data: { count: (r.data as { count: number }).count + 1 } as unknown
			})
		});

		const response = await client.get<{ count: number }>('/resource', { deduplicate: false });
		// Before the fix the retried response ran interceptors [i+1..n] a second
		// time and count came back as 2.
		expect(response.data.count).toBe(1);
	});

	it('rethrows the error thrown by an error interceptor (domain-error mapping)', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: 'bad' }), {
				status: 500,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		class DomainError extends Error {}

		const client = new HttpClient();
		client.interceptors.response({
			intercept: async (r) => r,
			error: async (err) => {
				throw new DomainError(`mapped: ${err.message}`);
			}
		});

		// Before the fix the domain error was swallowed and the original
		// HttpError surfaced instead.
		await expect(client.get('/broken', { deduplicate: false })).rejects.toBeInstanceOf(DomainError);
	});

	it('passes the replaced error to subsequent error interceptors', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } })
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const seen: string[] = [];
		client.interceptors.response({
			intercept: async (r) => r,
			error: async () => {
				throw new Error('first-mapped');
			}
		});
		client.interceptors.response({
			intercept: async (r) => r,
			error: async (err) => {
				seen.push(err.message);
				throw new Error('second-mapped');
			}
		});

		await expect(client.get('/broken', { deduplicate: false })).rejects.toThrow('second-mapped');
		expect(seen).toEqual(['first-mapped']);
	});

	it('returns a string for text responses even when onProgress is supplied', async () => {
		const body = 'hello progress';
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(body, {
				status: 200,
				headers: {
					'content-type': 'text/plain',
					'content-length': String(body.length)
				}
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const progressEvents: number[] = [];
		const response = await client.get<string>('/text', {
			deduplicate: false,
			onProgress: (p) => progressEvents.push(p.loaded)
		});

		// Before the fix the progress branch returned a Blob for text/*.
		expect(typeof response.data).toBe('string');
		expect(response.data).toBe(body);
		expect(progressEvents.length).toBeGreaterThan(0);
	});

	it('aborts via a caller-supplied signal in config', async () => {
		const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
			return new Promise((_resolve, reject) => {
				// Mirror real fetch: reject immediately for a pre-aborted signal.
				if (init.signal?.aborted) {
					reject(new DOMException('Aborted', 'AbortError'));
					return;
				}
				init.signal?.addEventListener('abort', () => {
					reject(new DOMException('Aborted', 'AbortError'));
				});
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const controller = new AbortController();
		const request = client.get('/slow', { deduplicate: false, signal: controller.signal });

		controller.abort();
		await expect(request).rejects.toThrow(/aborted/i);
	});

	it('runs response interceptors exactly once for deduplicated concurrent requests', async () => {
		let resolveFetch: (value: Response) => void;
		const fetchPromise = new Promise<Response>((resolve) => {
			resolveFetch = resolve;
		});
		const fetchMock = vi.fn().mockReturnValue(fetchPromise);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const intercept = vi.fn(async (r: IHttpResponse) => ({
			...r,
			data: { ...(r.data as object), count: ((r.data as { count?: number }).count ?? 0) + 1 } as unknown
		}));
		client.interceptors.response({ intercept });

		const first = client.get<{ count: number }>('/shared');
		const second = client.get<{ count: number }>('/shared');

		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledOnce();

		resolveFetch!(
			new Response(JSON.stringify({}), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);

		const [a, b] = await Promise.all([first, second]);
		// One shared response, one interceptor pass — not once per caller.
		expect(intercept).toHaveBeenCalledOnce();
		expect(a.data.count).toBe(1);
		expect(b.data.count).toBe(1);
	});

	it('ref-counts cancellation for deduplicated requests', async () => {
		const abortedSignals: AbortSignal[] = [];
		const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
			return new Promise<Response>((resolve, reject) => {
				init.signal?.addEventListener('abort', () => {
					abortedSignals.push(init.signal as AbortSignal);
					reject(new DOMException('Aborted', 'AbortError'));
				});
				// Resolve on a macrotask so abort listeners get a chance to fire.
				setTimeout(() => {
					resolve(
						new Response(JSON.stringify({ ok: true }), {
							status: 200,
							headers: { 'content-type': 'application/json' }
						})
					);
				}, 20);
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const controllerA = new AbortController();
		const controllerB = new AbortController();

		const first = client.get('/ref', { signal: controllerA.signal });
		const second = client.get('/ref', { signal: controllerB.signal });

		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledOnce();

		// One participant aborts: ITS promise rejects, the underlying request
		// survives for the other participant.
		controllerA.abort();
		await expect(first).rejects.toThrow(/aborted/i);
		expect(abortedSignals.length).toBe(0);

		const response = await second;
		expect(response.data).toEqual({ ok: true });
	});

	it('aborts the underlying request once ALL deduplicated participants abort', async () => {
		let underlyingAborted = false;
		const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
			return new Promise<Response>((_resolve, reject) => {
				init.signal?.addEventListener('abort', () => {
					underlyingAborted = true;
					reject(new DOMException('Aborted', 'AbortError'));
				});
			});
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const controllerA = new AbortController();
		const controllerB = new AbortController();

		const first = client.get('/all-abort', { signal: controllerA.signal });
		const second = client.get('/all-abort', { signal: controllerB.signal });

		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledOnce();

		controllerA.abort();
		await expect(first).rejects.toThrow(/aborted/i);
		expect(underlyingAborted).toBe(false);

		controllerB.abort();
		await expect(second).rejects.toThrow(/aborted/i);
		expect(underlyingAborted).toBe(true);
	});

	it('deduplicates in-flight requests with the same key', async () => {
		let resolveFetch: (value: Response) => void;
		const fetchPromise = new Promise<Response>((resolve) => {
			resolveFetch = resolve;
		});
		const fetchMock = vi.fn().mockReturnValue(fetchPromise);
		vi.stubGlobal('fetch', fetchMock);

		const client = new HttpClient();
		const first = client.get('/data');
		const second = client.get('/data');

		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledOnce();

		resolveFetch!(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);

		const [firstResponse, secondResponse] = await Promise.all([first, second]);
		expect(firstResponse.data).toEqual({ ok: true });
		expect(secondResponse.data).toEqual({ ok: true });
	});
});
