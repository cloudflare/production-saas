import { uid } from 'worktop/utils';
import type { UID } from 'worktop/utils';

export { until } from 'worktop/kv';
export { uid as gen };

// Pattern match for for strict typesafety
export type KeyID<T extends string = string> =
	T extends UID<number> ? never
	: T extends `${string}::${T}` ? string : never;
