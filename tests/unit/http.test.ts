import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpClient } from '../../src/http';
import { NetworkError } from '../../src/http/classes/http-error.class';


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
