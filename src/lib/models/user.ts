import { HS256 } from 'worktop/jwt';
import * as Password from 'lib/models/password';
import * as database from 'lib/utils/database';
import * as emails from 'lib/sendgrid/users';
import * as utils from 'lib/utils';
import * as Email from './email';

import * as Prices from 'lib/stripe/prices';
import * as Customers from 'lib/stripe/customers';
import * as Subscriptions from 'lib/stripe/subscriptions';

import type { UID } from 'lib/utils';
import type { Handler } from 'lib/context';
import type { SALT, PASSWORD } from 'lib/models/password';
import type { Subscription } from 'lib/stripe/subscriptions';
import type { Customer } from 'lib/stripe/customers';

export type UserID = UID<16>;

export interface User {
	uid: UserID;
	email: string;
	firstname: Nullable<string>;
	lastname: Nullable<string>;
	created_at: TIMESTAMP;
	last_updated: Nullable<TIMESTAMP>;
	password: PASSWORD;
	salt: SALT;
	stripe: {
		customer: Customer['id'];
		subscription: Subscription['id'];
	};
}

// Authentication attributes
export interface Credentials {
	email: string;
	password: string;
}

// ID helpers to normalize ID types/values
export const toUID = () => utils.uid(16) as UserID;
export const toKID = (uid: UserID) => `users::${uid}`;
export const isUID = (x: string | UserID): x is UserID => x.length === 16;

export interface TokenData {
	uid: User['uid'];
	salt: User['salt'];
}

// The JWT factory
// NOTE: tokens expire in 24 hours
export const JWT = HS256<TokenData>({
	key: JWT_SECRET,
	expires: 86400, // 24 hours
});

/**
 * Find a `User` document by its `uid` value.
 */
export function find(uid: UserID) {
	const key = toKID(uid);
	return database.read<User>(key);
}

/**
 * Save/Overwrite the `User` document.
 */
export function save(user: User): Promise<boolean> {
	const key = toKID(user.uid);
	return database.write<User>(key, user);
}

/**
 * Create a new `User` document from a `Credentials` set.
 * @NOTE Handles `password`, `salt`, and `uid` values.
 * @TODO throw w/ message instead of early returns?
 */
type Insert = Omit<Partial<User>, 'email'|'password'> & Credentials;
export async function insert(values: Insert): Promise<User|void> {
	// Generate a new salt & hash the original password
	const { password, salt } = await Password.prepare(values.password);

	// Create new `UserID`s until available
	const nxtUID = await utils.until(toUID, find);

	// Create the Stripe Customer record
	const subscription = await Customers.create({
		email: values.email,
		metadata: {
			userid: nxtUID,
			users: 1,
			documents: 0,
			schemas: 0,
			spaces: 0,
		}
	}).then(customer => {
		if (customer) {
			// Attach the FREE PLAN to the new customer
			return Subscriptions.create(customer.id, [Prices.FREE.id]);
		}
	});

	if (!subscription) return;

	const user: User = {
		uid: nxtUID,
		email: values.email,
		firstname: values.firstname || null,
		lastname: values.lastname || null,
		created_at: utils.seconds(),
		last_updated: null,
		stripe: {
			customer: subscription.customer,
			subscription: subscription.id,
		},
		password,
		salt,
	};

	// Create the new User record
	if (!await save(user)) return;

	// Create public-facing "emails::" key for login
	if (!await Email.save(user)) return;

	// Send "welcome" email
	await emails.welcome(user);

	return user;
}

/**
 * Format a User's full name
 */
export function fullname(user: User): string {
	let name = user.firstname || '';
	if (user.lastname) name += ' ' + user.lastname;
	return name;
}

/**
 * Update a `User` document with the given `changes`.
 * @NOTE Handles `password`, `salt`, and `uid` values.
 * @TODO Implement email sender for email/password changes.
 */
type UserChanges = Partial<Omit<User, 'password'> & { password: string }>;
export async function update(user: User, changes: UserChanges): Promise<User|void> {
	const hasPassword = changes.password && changes.password !== user.password;
	const prevFullname = fullname(user);
	const prevEmail = user.email;

	// Explicitly choose properties to update
	// ~> AKA, do not allow `uid` or `created_at` updates
	user.firstname = changes.firstname || user.firstname;
	user.lastname = changes.lastname || user.lastname;
	user.email = changes.email || user.email;
	user.last_updated = utils.seconds();

	if (hasPassword) {
		const sanitized = await Password.prepare(changes.password!);
		user.password = sanitized.password;
		user.salt = sanitized.salt;
	}

	if (!await save(user)) return;

	if (user.email !== prevEmail) {
		await Promise.all([
			Email.remove(prevEmail),
			Email.save(user),
		]);

		// Send "email changed" alert
		await emails.contact(prevEmail);
	}

	if (hasPassword) {
		// send "password changed" alert
		await emails.password(prevEmail);
	}

	// Forward any display details to Stripe
	if (user.email !== prevEmail || prevFullname !== fullname(user)) {
		await Customers.update(user.stripe.customer, {
			email: user.email,
			name: fullname(user),
		});
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
 * Format a `User` document for Auth response
 */
export async function respond(code: number, user: User): Promise<Response> {
	return utils.reply(code, {
		token: await JWT.sign(user),
		user: output(user),
	});
}

/**
 * Authentication middleware
 * Identifies a User via incoming `Authorization` header.
 */
export const authenticate: Handler = async function (req, context) {
	let auth = req.headers.get('authorization');
	if (!auth) return utils.reply(401, 'Missing Authorization header');

	let [schema, token] = auth.split(/\s+/);
	if (!token || schema.toLowerCase() !== 'bearer') {
		return utils.reply(401, 'Invalid Authorization format');
	}

	try {
		var payload = await JWT.verify(token);
	} catch (err) {
		return utils.reply(401, (err as Error).message);
	}

	// Does `user.uid` exist?
	let user = await find(payload.uid);
	// NOTE: user salt changes w/ password
	// AKA, mismatched salt is forgery or pre-reset token
	if (!user || payload.salt !== user.salt) {
		return utils.reply(401, 'Invalid token');
	}

	context.user = user;
}
