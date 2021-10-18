import { toHEX } from 'worktop/buffer';
import { PBKDF2 } from 'worktop/crypto';
import * as database from 'lib/utils/database';
import * as utils from 'lib/utils';

import type { UID } from 'lib/utils';
import type { User, UserID } from 'lib/models/user';

export type SALT = UID<128>;
export type PASSWORD = UID<64>;
export type TOKEN = UID<100>;

/**
 * Generate a new `UID<128>` value.
 * @NOTE This is a `user`-specific password salter.
 */
export const salt = () => utils.uid(128) as SALT;

/**
 * Hash a raw `password` string.
 * Applies `PBKDF2` with a SHA256 hexadecimal digest.
 */
export function hash(password: string, salt: SALT): Promise<PASSWORD> {
	return PBKDF2('SHA-256', password, salt, 1000, 64).then(toHEX) as Promise<PASSWORD>;
}

/**
 * Determine if the incoming `password` matches the `User.password` value.
 */
export async function compare(user: User, password: PASSWORD|string): Promise<boolean> {
	return await hash(password, user.salt) === user.password;
}

/**
 * Prepare a new password for storage
 */
export async function prepare(password: string) {
	const token = salt();
	const hashed = await hash(password, token);
	return { salt: token, password: hashed };
}

// NOTE: "reset::{token}" keys point to `User.uid` values
export const toUID = () => utils.uid(100) as TOKEN;
export const toKID = (token: TOKEN) => `reset::${token}`;
export const isUID = (x: TOKEN | string): x is TOKEN => x.length === 100;

/**
 * Check if the `reset::{token}` document exists.
 * @NOTE Only exists if a "Password Reset" initiated within 7 days.
 */
export function find(token: TOKEN) {
	const key = toKID(token);
	return database.read<UserID>(key);
}

/**
 * Insert a new `reset::{token}` document.
 * @NOTE Initiates the "Password Reset" pipeline.
 */
export async function forgot(user: User): Promise<boolean> {
	// Create new TOKENs until find unused value
	const token = await utils.until(toUID, find);

	// Persist the TOKEN value to storage; auto-expire after 12 hours (in secs)
	await database.write(toKID(token), user.uid, { expirationTtl: 12 * 60 * 60 });

	// TODO: send email to `user.email` with reset link

	return true;
}
