import type { Provider } from '../bootstrap/types/provider.type';
import { APP_CONFIG } from './injection-tokens';

export function provideConfig<T>(config: T): Provider {
	return (injector) => {
		injector.bindValue(APP_CONFIG, config);
	};
}
