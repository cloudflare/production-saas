import * as Base64 from 'worktop/base64';
import * as crypto from 'worktop/crypto';

import type { User } from 'lib/models/user';

function encode(input: string | object) {
	return Base64.base64url(typeof input === 'string' ? input : JSON.stringify(input));
}

const header = encode({
	alg: 'HS256',
	typ: 'JWT'
});

/**
 * Create a HS256 (HMAC-256) JWT for the User.
 * @NOTE Tokens expire in 6 hours
 */
export async function sign(user: User): Promise<string> {
	const key = await crypto.keyload({ name: 'HMAC', hash: 'SHA-256' }, JWT_SECRET, ['sign']);

	const { uid, salt } = user;
	const exp = Date.now() + (60e3 * 60 * 6); // 6 hours (ms)
	const payload = header + '.' + encode({ uid, salt, exp });

	const signature = await crypto.sign('HMAC', key, payload);
	// @ts-ignore – internal TypeScript bug: ArrayLike<number> vs number[]
	const ascii = String.fromCharCode.apply(null, new Uint8Array(signature));

	return payload + '.' + encode(ascii);
}
