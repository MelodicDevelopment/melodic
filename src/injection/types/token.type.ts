import type { INewable } from '../../interfaces';
import type { IInjectionToken } from '../interfaces/iinjection-token.interface';

export type Token<T> = string | symbol | INewable<T> | IInjectionToken<T>;

/**
 * The identity used to key a binding in the injector. Tokens are keyed by their
 * own identity (the string, the symbol, or the class constructor) — never by a
 * derived string — so two distinct tokens that happen to share a description or
 * class name cannot collide.
 */
export type TokenKey = string | symbol | INewable<unknown>;
