import type { ReadonlySignal, Signal } from '../../signals';
import type { ComponentBase } from '../../components/classes/component-base.class';

/**
 * Per-component caching shared by the store selectors (SignalStoreService and
 * ComponentStateBaseService). On a cache hit the entry is re-touched so a
 * render-scoped entry survives the post-render sweep; on a miss the created
 * signal is cached, registered for disposal with the component, and — when
 * created during a render pass — tracked as render-scoped (it re-renders the
 * component on change and is destroyed by the first render that stops using
 * it; see ComponentBase.trackSelectEntry).
 *
 * The touch/track hooks are optional-called: the constructor-time placeholder
 * scope (class-field initializers) exposes only the cache and disposal
 * surface, which yields the intended component-lifetime semantics there.
 */
export function getComponentCachedSelect<T>(consumer: ComponentBase, fullKey: string, create: () => ReadonlySignal<T>): ReadonlySignal<T> {
	const cache = consumer.getSelectCache();
	const cached = cache.get(fullKey) as ReadonlySignal<T> | undefined;
	if (cached) {
		consumer.touchSelectEntry?.(fullKey);
		return cached;
	}

	const sig = create();
	cache.set(fullKey, sig as unknown as Signal<unknown>);
	consumer.registerDisposable(sig as unknown as { destroy(): void });
	consumer.trackSelectEntry?.(fullKey, sig as unknown as Signal<unknown>);
	return sig;
}
