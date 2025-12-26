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
});
