import * as Base64 from 'worktop/base64';
import * as crypto from 'worktop/crypto';

import type { User } from 'lib/models/user';

export interface TokenData {
	uid: User['uid'];
	salt: User['salt'];
	exp: number;
}

const header = encode({
	alg: 'HS256',
	typ: 'JWT'
});

function encode(input: string | object) {
	return Base64.base64url(typeof input === 'string' ? input : JSON.stringify(input));
}

/**
 * Compute *just* the signature segment from `payload` (and known header).
 * @param {string} head The encoded `header` segment.
 * @param {string} payload The encoded `payload` segment.
 */
async function toSignature(head: string, payload: string): Promise<string> {
	const content = head + '.' + payload;

	const key = await crypto.keyload({ name: 'HMAC', hash: 'SHA-256' }, JWT_SECRET, ['sign']);
	const signature = await crypto.sign('HMAC', key, content);

	// @ts-ignore – internal TypeScript bug: ArrayLike<number> vs number[]
	const ascii = String.fromCharCode.apply(null, new Uint8Array(signature));
	return encode(ascii);
}

/**
 * Create a HS256 (HMAC-256) JWT for the User.
 * @NOTE Tokens expire in 6 hours
 */
export async function sign(user: User): Promise<string> {
	const { uid, salt } = user;
	const exp = Date.now() + (60e3 * 60 * 6); // 6 hours (ms)
	const payload = encode({ uid, salt, exp } as TokenData);

	const signature = await toSignature(header, payload);
	return header + '.' + payload + '.' + signature;
}

// Reusable (and vague) JWT error message
export const INVALID = new Error('Invalid token');

/**
 * Verify an incoming JWT looks correct & has valid signature.
 */
export async function verify(token: string): Promise<TokenData> {
	const segs = token.split('.');
	if (segs.length !== 3) throw INVALID;

	const [hh, pp, ss] = segs;
	// NOTE: Our JWT header is static
	if (hh !== header) throw INVALID;

	const content = Base64.decode(pp);
	const payload: TokenData = JSON.parse(content);

	if (!payload.exp) throw INVALID;
	if (payload.exp < Date.now()) throw new Error('Expired token');

	const signature = await toSignature(hh, pp);
	if (signature !== ss) throw INVALID;

	return payload;
}
