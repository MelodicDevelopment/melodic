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
