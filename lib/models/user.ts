import * as JWT from 'lib/utils/jwt';
import * as keys from 'lib/utils/keys';
import * as Password from 'lib/models/password';
import * as database from 'lib/utils/database';
import * as Email from './email';

import type { UID } from 'worktop/utils';
import type { SALT, PASSWORD } from 'lib/models/password';

export type UserID = UID<16>;

export interface User {
	uid: UserID;
	email: string;
	password: PASSWORD;
	salt: SALT;
	firstname?: Nullable<string>;
	lastname?: Nullable<string>;
	created_at: TIMESTAMP;
	last_updated?: Nullable<TIMESTAMP>;
}

// Authentication attributes
export interface Credentials {
	email: string;
	password: string;
}

// TODO?: mark as pure
export const ID = keys.factory<UserID>('users', 16);

/**
 * Find a `User` document by its `uid` value.
 */
export function find(uid: UserID) {
	const key = ID.toKID(uid);
	return database.read<User>(key);
}

/**
 * Save/Overwrite the `User` document.
 */
export function save(user: User): Promise<boolean> {
	return database.write<User>(ID.toKID(user.uid), user);
}

/**
 * Create a new `User` document from a `Credentials` set.
 * @NOTE Handles `password`, `salt`, and `uid` values.
 * @TODO throw w/ message instead of early returns?
 */
export async function insert(values: Credentials): Promise<User|void> {
	// Generate a new salt & hash the original password
	const { password, salt } = await Password.prepare(values.password);

	const user: User = {
		// Create new `UserID`s until available
		uid: await keys.until(ID.toUID, find),
		created_at: Date.now(),
		last_updated: null,
		email: values.email,
		password,
		salt,
	};

	// Create the new User record
	if (!await save(user)) return;

	// Create public-facing "emails::" key for login
	if (!await Email.save(user)) return;

	// TODO: send welcome email

	return user;
}

/**
 * Update a `User` document with the given `changes`.
 * @NOTE Handles `password`, `salt`, and `uid` values.
 * @TODO Implement email sender for email/password changes.
 */
type UserChanges = Partial<Omit<User, 'password'> & { password: string }>;
export async function update(user: User, changes: UserChanges): Promise<User|false> {
	const hasPassword = changes.password && changes.password !== user.password;
	const prevEmail = user.email;

	// Explicitly choose properties to update
	// ~> AKA, do not allow `uid` or `created_at` updates
	user.firstname = changes.firstname || user.firstname;
	user.lastname = changes.lastname || user.lastname;
	user.email = changes.email || user.email;
	user.last_updated = Date.now();

	if (hasPassword) {
		const sanitized = await Password.prepare(changes.password!);
		user.password = sanitized.password;
		user.salt = sanitized.salt;
	}

	if (!await save(user)) return false;

	if (user.email !== prevEmail) {
		// TODO: send "email changed" emails
		await Promise.all([
			Email.remove(prevEmail),
			Email.save(user),
		]);
	}

	if (hasPassword) {
		// TODO: send "password changed" email
	}

	return user;
}

/**
 * Format a `User` document for public display
 * @NOTE Ensures `password` & `salt` are never public!
 */
export function output(user: User) {
	const { uid, firstname, lastname, email, created_at, last_updated } = user;
	return { uid, firstname, lastname, email, created_at, last_updated };
}

/**
 * Format a `User` document while computing a fresh JWT.
 */
export async function tokenize(user: User) {
	const token = await JWT.sign(user);
	return { user: output(user), token };
}

/**
 * Exchange a JWT for a `User` document, if valid.
 * @NOTE Does not handle `JWT.verify` errors!
 * @param token The incoming JWT token
 */
export async function identify(token: string): Promise<User|void> {
	const { uid, salt } = await JWT.verify(token);

	// Does `user.uid` exist?
	const user = await find(uid);
	if (!user) throw JWT.INVALID;

	// NOTE: user salt changes w/ password
	// AKA, mismatched salt is forgery or pre-reset token
	if (user.salt !== salt) throw JWT.INVALID;

	return user;
}