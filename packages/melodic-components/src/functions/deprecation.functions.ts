const warned = new Set<string>();

/** Log a deprecation warning once per key for the page's lifetime. */
export function warnDeprecatedOnce(key: string, message: string): void {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(message);
}

/**
 * Deprecation warning for the `title` shim several components carry: `title`
 * collides with the global HTML title attribute (native tooltip), so each
 * component exposes a prefixed replacement (`alert-title`, `page-title`, ...).
 */
export function warnDeprecatedTitleOnce(tag: string, replacement: string): void {
	warnDeprecatedOnce(
		`${tag}.title`,
		`[${tag}] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "${replacement}" instead. The "title" shim will be removed in the next major release.`
	);
}

/**
 * Define deprecated quoted kebab-case property aliases (`el['dot-color']`)
 * that forward to their camelCase properties, warning once per alias on
 * first use. Kebab-case ATTRIBUTES already reach the camelCase property via
 * attributeChangedCallback — these aliases only serve legacy JS property
 * access and will be removed in the next major release.
 *
 * Call at module scope, right after the class definition:
 *
 *     defineLegacyAliases(TagComponent.prototype, 'ml-tag', { 'dot-color': 'dotColor' });
 */
export function defineLegacyAliases<T extends object>(proto: T, tag: string, aliases: Record<string, keyof T & string>): void {
	for (const [alias, prop] of Object.entries(aliases)) {
		Object.defineProperty(proto, alias, {
			// The getter is deliberately silent: property observation reads every
			// property once at construction, which must not trigger the warning.
			get(this: T) {
				return (this as Record<string, unknown>)[prop];
			},
			set(this: T, value: unknown) {
				warnDeprecatedOnce(
					`${tag}.${alias}`,
					`[${tag}] The quoted "${alias}" property is deprecated — use the camelCase property "${prop}" (attribute "${alias}"). The alias will be removed in the next major release.`
				);
				(this as Record<string, unknown>)[prop] = value;
			},
			enumerable: false,
			configurable: true
		});
	}
}
