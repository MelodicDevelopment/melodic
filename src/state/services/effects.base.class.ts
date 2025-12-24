import type { ActionEffect, ActionEffects } from '../types/action-effect.type';
import type { Action, ActionIdentifier, ActionPayload, ActionRef, TypedAction, TypedActionRef } from '../types/action.type';

export abstract class EffectsBase implements ActionEffects {
	private readonly _effects: ActionEffect[] = [];

	protected addEffect<T extends ActionIdentifier, P extends ActionPayload>(
		actions: TypedActionRef<T, P>[],
		effect: (action: TypedAction<T, P>) => Promise<Action | Action[] | void>
	): void {
		this._effects.push({
			actions: actions as ActionRef[],
			effect: effect as (action: Action) => Promise<Action | Action[] | void>
		});
	}

	public getEffects(): ActionEffect[] {
		return this._effects;
	}
}
