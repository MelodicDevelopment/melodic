/**
 * Compile-only type tests for {@link HttpRequestBody}.
 *
 * This file is never imported or executed — it exists purely so `tsc` (via the
 * `noEmit` typecheck in tsconfig.json) proves that the body parameter of
 * HttpClient.post/put/patch accepts the cases below. It is excluded from the
 * published build (see tsconfig.build.json). If any assertion stops compiling,
 * the regression is caught at build time.
 */
import type { HttpClient } from '../classes/http-client.class';

interface IPhone {
	number: string;
	type: string;
}

interface ICreatePersonRequest {
	firstName: string;
	phones?: IPhone[];
}

export function typeChecks(http: HttpClient): void {
	const req: ICreatePersonRequest = { firstName: 'Sam', phones: [{ number: '555', type: 'mobile' }] };

	// Interface-typed DTO with a nested interface array — the original repro.
	void http.post('/people', req);
	void http.put('/people/1', req);
	void http.patch('/people/1', { ...req });

	// BodyInit cases must still type-check.
	void http.post('/upload', new FormData());
	void http.post('/raw', 'a raw string body');
	void http.post('/bytes', new Blob(['x']));
	void http.post('/form', new URLSearchParams({ a: 'b' }));

	// Plain JSON values still allowed.
	void http.post('/n', 42);
	void http.post('/arr', [{ a: 1 }, { b: 2 }]);
	void http.post('/empty');
}
