import * as res from 'worktop/response';
import type { ULID } from 'worktop/utils';

export * from 'worktop/utils';
export { until } from 'worktop/kv';

export function isULID(x?: string): x is ULID {
	return !!x && x.length === 26;
}

export const send: typeof res.send = function (code, data, headers) {
	if (code >= 400 && typeof data === 'string') {
		data = { status: code, error: data };
	}
	return res.send(code, data, headers);
}
