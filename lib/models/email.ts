import * as database from 'lib/utils/database';

import type { User, UserID } from './user';

// NOTE: "emails::{email}" keys point to `User.uid` values
export const toKID = (email: string) => `emails::${email}`;

/**
 * Find the `UserID` associated with an `User.email` value.
 * @NOTE A `User` only has one "emails::{email}" document associated.
 */
export function find(email: string) {
	const key = toKID(email);
	return database.read<UserID>(key);
}

/**
 * Create an `Email` record for the current `User` document.
 */
export function save(user: User) {
	const key = toKID(user.email);
	return database.write<UserID>(key, user.uid);
}

/**
 * Remove an existing `Email` record for an email.
 */
export function remove(email: string) {
	const key = toKID(email);
	return database.remove(key);
}
