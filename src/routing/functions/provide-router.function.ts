import type { Provider } from '../../bootstrap/types/provider.type';
import type { IRoute } from '../interfaces/iroute.interface';
import { RouterService } from '../services/router.service';
import { installHistoryEvents } from './install-history-events.function';

/**
 * Register the router during bootstrap.
 *
 * ```typescript
 * await bootstrap({
 *   providers: [provideRouter(routes)]
 * });
 * ```
 *
 * Installs the history `NavigationEvent` patch (idempotently), eagerly
 * constructs the shared `RouterService` singleton and, when `routes` are
 * supplied, registers them so navigation works before any `<router-outlet>`
 * mounts. A root `<router-outlet .routes=${routes}>` remains supported —
 * routes registered here simply act as the default set.
 */
export function provideRouter(routes?: IRoute[]): Provider {
	return (injector) => {
		installHistoryEvents();

		const router = injector.get(RouterService);

		if (routes && routes.length > 0) {
			router.setRoutes(routes);
		}
	};
}
