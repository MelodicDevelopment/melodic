# HTTP Client

Melodic includes a small, promise-based HTTP client with interceptors, request deduplication, cancellation, and base configuration.

## Table of Contents

- [Overview](#overview)
- [Creating a Client](#creating-a-client)
- [Making Requests](#making-requests)
- [Request Config](#request-config)
- [Interceptors](#interceptors)
- [Cancellation](#cancellation)
- [Provider Integration](#provider-integration)

## Overview

```typescript
import { HttpClient } from '@melodicdev/core/http';

const http = new HttpClient({
	baseURL: 'https://api.example.com',
	defaultHeaders: { 'Content-Type': 'application/json' }
});
```

## Creating a Client

```typescript
import { HttpClient } from '@melodicdev/core/http';

const http = new HttpClient({
	baseURL: 'https://api.example.com',
	defaultHeaders: {
		Accept: 'application/json'
	}
});
```

## Making Requests

```typescript
const users = await http.get<{ id: string; name: string }[]>('/users');

const created = await http.post('/users', {
	name: 'Ada Lovelace'
});

await http.delete(`/users/${created.data.id}`);
```

Each method returns an `IHttpResponse<T>` with `data`, `status`, `headers`, and the original request config.

## Request Config

All request methods accept an optional config object:

```typescript
await http.get('/users', {
	params: { limit: 10 },
	headers: { 'X-Trace-Id': '123' },
	deduplicate: true
});
```

Supported config options include:

- `headers`: request headers
- `params`: query params (merged into the URL)
- `body`: request body for `post`, `put`, `patch`
- `deduplicate`: when `true`, identical inflight requests are shared
- `onProgress`: receive progress updates (if the browser provides them)
- `abortController`: supply your own `AbortController`
- `credentials` / `mode`: forwarded to `fetch`
- `cancel`: manual cancellation flag

## Interceptors

Register request/response interceptors for auth, logging, or transformations.

```typescript
http.interceptors.request({
	intercept: async (request) => {
		return {
			...request,
			headers: {
				...request.headers,
				Authorization: 'Bearer token'
			}
		};
	}
});

http.interceptors.response({
	intercept: async (response) => response
});
```

### Response error handling and retry

A response interceptor may define an optional `error(error, context)` handler. It is invoked when:

- The underlying request fails (non-2xx, network, abort), or
- A prior interceptor's `intercept()` throws.

`context` provides:

- `retryCount` — retries already attempted for this request (0 on first failure).
- `retry()` — a one-shot function that re-issues the original request (re-running request interceptors, so token-refresh flows work). Throws if called twice in one handler, or once `MAX_RETRIES` (3) is reached.

**Recovery semantics:**

- Return an `IHttpResponse` to recover — the remaining response interceptors run on it.
- Reject (or resolve `void`) to defer to the next interceptor's `error()`.
- If no handler recovers, the original error is rethrown to the caller.

```typescript
http.interceptors.response({
	intercept: async (response) => response,
	error: async (err, { retry, retryCount }) => {
		if ((err as HttpError).response?.status !== 401) throw err;
		if (retryCount > 0) throw err; // already tried once — give up
		await refreshToken();
		return await retry();
	}
});
```

## Cancellation

You can cancel a request before it runs by setting `cancel`.

```typescript
import type { IRequestCancellation } from '@melodicdev/core/http';

const cancel: IRequestCancellation = {
	cancelled: true,
	cancelReason: 'User navigated away'
};

const response = await http.get('/slow', { cancel });
```

For active requests, pass a shared `AbortController` and call `abort()`.

```typescript
const controller = new AbortController();

const promise = http.get('/slow', { abortController: controller });
controller.abort();
```

## Provider Integration

If you are using `bootstrap`, register a shared `HttpClient` with `provideHttp`.

```typescript
import { bootstrap } from '@melodicdev/core';
import { provideHttp } from '@melodicdev/core/http';

await bootstrap({
	providers: [
		provideHttp({
			baseURL: 'https://api.example.com'
		})
	]
});
```
