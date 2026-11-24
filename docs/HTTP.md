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
- [Error bodies that are not JSON](#error-bodies-that-are-not-json)

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

`defaultHeaders` and `credentials` are sent to the `baseURL`'s origin and to the page's own
origin only. A request to an absolute URL on any other origin does **not** receive them — a
default `Authorization` header is meant for your API, not for a third party. Headers and
`credentials` passed on the request itself are always sent. To send the client defaults
everywhere, opt in:

```typescript
const http = new HttpClient({
	baseURL: 'https://api.example.com',
	defaultHeaders: { 'X-Client': 'web' },
	allowCrossOriginDefaults: true
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

A plain object or array body is JSON-stringified, and `Content-Type: application/json` is added unless a `Content-Type` header is already set. Strings, `FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams` and `ReadableStream` are passed to `fetch` unchanged, and typed arrays and `DataView` are sent as binary like an `ArrayBuffer`. For a `FormData` body the `Content-Type` header is removed so the browser can set the multipart boundary.

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
- `body`: request body for `delete`. `post`, `put` and `patch` take the body as their second argument and ignore this option
- `deduplicate`: when `true` (the default for `GET`), identical inflight requests share one fetch and one interceptor pass. Two requests are identical only when their method, URL, query `params`, `headers` (case-insensitive names, any order), `credentials`, `mode`, `responseType` and body all match — a request carrying a different `Authorization` header is never merged with another
- `onProgress`: receive progress updates (if the browser provides them)
- `responseType`: `'json' | 'text' | 'blob' | 'arrayBuffer'` — decode the body as this type instead of inferring it from `content-type`. By default any JSON content type (`application/json`, `application/problem+json`, `application/vnd.api+json`, …) is parsed, `text/*` is returned as a string, and a known binary type (images, audio, video, fonts, PDF, zip, octet-stream) as a `Blob`; anything else is read as text, so pass `responseType: 'blob'` for downloads such as spreadsheets
- `signal`: an `AbortSignal` that aborts the request (`controller.signal`, `AbortSignal.timeout(…)`); combined with `timeout`
- `timeout`: abort the request after this many milliseconds; the request rejects with `AbortError`
- `abortController`: **deprecated** — pass `signal` (`controller.signal`) instead. Still honored
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
- `retry()` — a one-shot function that re-issues the original request (re-running request interceptors, so token-refresh flows work). Only one retry may be issued per error pass, across all interceptors — a second call throws — and it also throws once `MAX_RETRIES` (3) is reached.

**Recovery semantics:**

- Return an `IHttpResponse` to recover — the remaining response interceptors run on it.
- Reject (or resolve `void`) to defer to the next interceptor's `error()`. Once a handler has called `retry()`, no later `error()` handler runs: the pass ends with that handler's response, or with the current error.
- An error thrown by a handler replaces the one being propagated, so "catch `HttpError`, throw a domain error" works. If no handler recovers, the last error thrown — the original, or one a handler threw in its place — reaches the caller.

For a deduplicated request the error handlers run **once for the shared request**, like
`intercept()` does — three callers sharing one `401` trigger one refresh and one `retry()`,
and all three receive its result. A caller that aborts its own participation is reported to
the error handlers for that caller alone.

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

A request cancelled this way does not reject and makes no fetch: it resolves with a response
whose `status` is `0`, `statusText` is `'Request Cancelled'` and `data` is `null`. Set
`cancel.cancelledResponse` to supply your own values for those fields.

For active requests, pass an `AbortController`'s `signal` and call `abort()`. The request
rejects with `AbortError`.

```typescript
const controller = new AbortController();

const promise = http.get('/slow', { signal: controller.signal });
controller.abort();
```

To give up after a fixed time, pass `timeout` in milliseconds; it also rejects with
`AbortError`.

```typescript
await http.get('/slow', { timeout: 5000 });
```

The `abortController` option is deprecated; pass `signal: controller.signal` instead.

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

## Error bodies that are not JSON

A failing gateway routinely returns an HTML error page under
`content-type: application/json`. That body is **not** treated as a transport failure: the
response keeps its status and arrives as an `HttpError` with the raw text as `data`, so
retry and auth interceptors keyed on `HttpError` (and on `error.response.status`) fire as
they should.

```typescript
try {
	await http.get('/api/thing');
} catch (error) {
	if (error instanceof HttpError && error.response?.status === 502) {
		// error.response.data is the raw HTML
	}
}
```

An empty body under a JSON content-type (common on 201/204) parses to `null`. A successful
response whose body does not parse logs a dev warning and returns the raw text.
