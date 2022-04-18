import * as assert from 'uvu/assert';
import { STATUS_CODES } from 'worktop/response';
import type { Response } from 'httpie';

export function error(res: Response, status: number, msg?: string) {
	assert.is(res.statusCode, status);

	assert.type(res.data, 'object');
	assert.is(res.data.status, status);

	let error = msg || STATUS_CODES[status];
	assert.is(res.data.error, error);
}
