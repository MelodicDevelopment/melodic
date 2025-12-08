import { ActionEffect, ActionEffects } from '../types/action-effect.type';
import { Action, ActionPayload, ActionRef, TypedAction, TypedActionRef } from '../types/action.type';

export abstract class EffectsBase implements ActionEffects {
	private _effects: ActionEffect[] = [];

	protected addEffect<T extends string, P extends ActionPayload>(
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
