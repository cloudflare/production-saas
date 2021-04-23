import { uid } from 'worktop/utils';
import type { UID } from 'worktop/utils';

export { until } from 'worktop/kv';
export { uid as gen };

// Pattern match for for strict typesafety
export type KeyID<T extends string = string> =
	T extends UID<number> ? never
	: T extends `${string}::${T}` ? string : never;

export interface KeyMaker<T extends UID<number>> {
	toUID(): T;
	toKID(uid: T): KeyID<T>;
	isUID(uid: T|string): uid is T;
}

type sizeof<T> = T extends UID<infer X> ? X : never;
export function factory<T extends UID<N>, N extends number = sizeof<T>>(prefix: string, len: N): KeyMaker<T> {
	return {
		toUID: () => uid(len) as T,
		toKID: (x: T) => `${prefix}::${x}` as KeyID<T>,
		isUID: (x: T|string): x is T => x.length === len,
	};
}
