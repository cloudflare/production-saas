import * as res from 'worktop/response';
import type { ULID } from 'worktop/utils';

export * from 'worktop/utils';
export { until } from 'worktop/kv';

export function isULID(x?: string): x is ULID {
	return !!x && x.length === 26;
}
