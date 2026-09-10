/**
 * The param names a route path declares, inferred from the path string.
 *
 * ```typescript
 * type P = RouteParams<'users/:userId/posts/:postId'>;
 * //   { userId: string; postId: string }
 * ```
 *
 * Route params were `Record<string, string>` everywhere, so `params.usreId`
 * was a valid read that returned `undefined` at runtime. Passing the path as a
 * type argument turns that into a compile error:
 *
 * ```typescript
 * const { userId } = router.getParams<'users/:userId'>();
 * ```
 */
export type RouteParams<Path extends string> = string extends Path
	? Record<string, string>
	: MergeParams<ExtractParams<Path>>;

/** Union of the param names in a path. */
type ExtractParams<Path extends string> = Path extends `${infer Head}/${infer Rest}`
	? ParamName<Head> | ExtractParams<Rest>
	: ParamName<Path>;

/** The param name a single path segment declares, if any. */
type ParamName<Segment extends string> = Segment extends `:${infer Name}`
	? Name
	: Segment extends `*${infer Name}`
		? Name
		: never;

type MergeParams<Names extends string> = [Names] extends [never] ? Record<string, never> : { [K in Names]: string };
