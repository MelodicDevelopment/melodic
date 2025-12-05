type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type HttpRequestBody =
	| BodyInit // FormData, Blob, ArrayBuffer, URLSearchParams, ReadableStream, string
	| JsonValue // Plain objects, arrays, primitives
	| null
	| undefined;
