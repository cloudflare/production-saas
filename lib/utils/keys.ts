import { uid } from 'worktop/utils';
import type { UID } from 'worktop/utils';

export { until } from 'worktop/kv';
export { uid as gen };

// Pattern match for for strict typesafety
export type KeyID<T extends string = string> =
	T extends UID<number> ? never
	: T extends `${string}::${T}` ? string : never;

export interface KeyMaker<T extends UID<number>, R extends Dict<string>> {
	toUID(): T;
	isUID(uid: T|string): uid is T;
	toKID(uid: T, replace?: R): KeyID<T>;
}

type sizeof<T> = T extends UID<infer X> ? X : never;
export function factory<
	T extends UID<N>,
	// TODO: inspect `prefix` for "{{ }}"
	R extends Dict<string> = Dict<string>,
	N extends number = sizeof<T>
>(prefix: string, len: N): KeyMaker<T, R> {
	return {
		toUID: () => uid(len) as T,
		isUID: (x: T|string): x is T => x.length === len,
		toKID: (x: T, inject?: R) => {
			let y = `${prefix}::${x}`;
			for (let k in inject) {
				// "foo::{{k}}::bar" -> "foo::value::bar"
				y = y.replace('{{' + k + '}}', inject[k]);
			}
			return y as KeyID<T>;
		}
	};
}
