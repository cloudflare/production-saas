import * as JWT from 'lib/utils/jwt';
import * as keys from 'lib/utils/keys';
import * as Password from 'lib/models/password';
import * as database from 'lib/utils/database';
import * as emails from 'lib/sendgrid/users';
import * as Email from './email';

import * as Prices from 'lib/stripe/prices';
import * as Customers from 'lib/stripe/customers';
import * as Subscriptions from 'lib/stripe/subscriptions';

import type { Handler } from 'worktop';
import type { UID } from 'worktop/utils';
import type { SALT, PASSWORD } from 'lib/models/password';
import type { Subscription } from 'lib/stripe/subscriptions';
import type { Customer } from 'lib/stripe/customers';

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
export const toUID = () => keys.gen(16) as UserID;
export const toKID = (uid: UserID) => `users::${uid}`;
export const isUID = (x: string | UserID): x is UserID => x.length === 16;

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
export async function insert(values: Credentials): Promise<User|void> {
	// Generate a new salt & hash the original password
	const { password, salt } = await Password.prepare(values.password);

	// Create new `UserID`s until available
	const nxtUID = await keys.until(toUID, find);

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
		created_at: Date.now(),
		last_updated: null,
		email: values.email,
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
	user.last_updated = Date.now();

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

/**
 * Authentication middleware
 * Identifies a User via incoming `Authorization` header.
 * @TODO Potentially add `Cookie` identity-parsing fallback.
 */
export const authenticate: Handler = async function (req, res) {
	// TODO? Generic error messages instead?
	const auth = req.headers.get('authorization');
	if (!auth) return res.send(401, 'Missing Authorization header');

	const [schema, token] = auth.split(' ');
	if (schema !== 'Bearer') return res.send(401, 'Invalid Authorization format');
	if (!token) return res.send(401, 'Missing Authorization token');

	try {
		var user = await identify(token);
	} catch (err) {
		return res.send(401, err.message);
	}

	// @ts-ignore
	// TODO(worktop) https://github.com/lukeed/worktop/issues/7
	req.user = user;
}
