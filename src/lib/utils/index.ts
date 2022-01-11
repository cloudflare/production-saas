import * as res from 'worktop/response';
import type { ULID } from 'worktop/utils';

export * from 'worktop/utils';
export { until } from 'worktop/cfw.kv';

export function isULID(x?: string): x is ULID {
	return !!x && x.length === 26;
}

export const reply: typeof res.reply = function (code, data, headers) {
	if (code >= 400 && typeof data === 'string') {
		data = { status: code, error: data };
	}
	return res.reply(code, data, headers);
}

export function toError(code: number, error?: Error): Response {
	let body = error && error.message || res.STATUS_CODES[code];
	return reply(code, body || String(code));
}

export const seconds = (): TIMESTAMP => Date.now() / 1e3 | 0;
