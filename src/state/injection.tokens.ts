import { createToken } from '../injection';
import type { ActionEffectsMap, ActionReducerMap, State } from './types';

export const RX_INIT_STATE = createToken<State<{ [key: string]: unknown }>>('RX_INIT_STATE');
export const RX_ACTION_PROVIDERS = createToken<ActionReducerMap<{ [key: string]: unknown }>>('RX_ACTION_PROVIDERS');
export const RX_EFFECTS_PROVIDERS = createToken<ActionEffectsMap<{ [key: string]: unknown }>>('RX_EFFECTS_PROVIDERS');
export const RX_STATE_DEBUG = createToken<boolean>('RX_STATE_DEBUG');
