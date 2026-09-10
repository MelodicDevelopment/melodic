import type { Provider } from '../../bootstrap/types/provider.type';
import type { IRoute } from '../interfaces/iroute.interface';
import { RouterService } from '../services/router.service';
import { installHistoryEvents } from './install-history-events.function';

export interface IRouterOptions {
	/**
	 * Let the router remember and restore scroll positions across back/forward
	 * navigation (default `true`, which also sets `history.scrollRestoration`
	 * to `'manual'`). Pass `false` to leave the browser in charge.
	 */
	scrollRestoration?: boolean;
}

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
export function provideRouter(routes?: IRoute[], options: IRouterOptions = {}): Provider {
	return (injector) => {
		installHistoryEvents();

		const router = injector.get(RouterService);

		if (options.scrollRestoration === false) {
			router.enableScrollRestoration(false);
		}

		if (routes && routes.length > 0) {
			router.setRoutes(routes);
		}
	};
}
