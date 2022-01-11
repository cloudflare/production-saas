import * as utils from 'lib/utils';
import * as database from 'lib/utils/database';
import * as Customers from 'lib/stripe/customers';
import * as Owner from './owner';

import type { Handler } from 'lib/context';
import type { UID } from 'lib/utils';
import type { User } from './user';

export type SpaceID = UID<11>;

export interface Space {
	uid: SpaceID;
	name: string;
	owner: Owner.Owner;
	created_at: TIMESTAMP;
	last_updated: Nullable<TIMESTAMP>;
}

// ID helpers to normalize ID types/values
export const toUID = () => utils.uid(11) as SpaceID;
export const toKID = (uid: SpaceID) => `spaces::${uid}`;
export const isUID = (x: SpaceID|string): x is SpaceID => x.length === 11;

/**
 * Find a `Space` document by its `uid` value.
 */
export function find(uid: SpaceID) {
	const key = toKID(uid);
	return database.read<Space>(key);
}

/**
 * Find all `Space` documents owned by the `User`.
 */
export function list(user: User): Promise<SpaceID[]> {
	const owner = Owner.format('user', user.uid);
	const ownerkey = Owner.toKID(owner, 'spaces');
	return database.read<SpaceID[]>(ownerkey).then(arr => arr || []);
}

/**
 * Synchronize the User's list of SpaceIDs
 */
export async function sync(user: User, list: SpaceID[]): Promise<boolean> {
	const owner = Owner.format('user', user.uid);
	const limits = await Owner.sync(owner, 'spaces', list);
	if (!limits) return false;

	const output = await Customers.update(user.stripe.customer,{
		metadata: { ...limits, userid: user.uid }
	});

	return !!output;
}

/**
 * Save/Overwrite the `Space` document.
 */
export function save(doc: Space): Promise<boolean> {
	const key = toKID(doc.uid);
	return database.write<Space>(key, doc);
}

/**
 * Create a new `Space` document for a User
 * @NOTE Handles its own `uid` value/uniqueness.
 */
export async function insert(values: { name: string }, user: User): Promise<Space|void> {
	const doc: Space = {
		// Create new `SpaceID`s until available
		uid: await utils.until(toUID, find),
		name: values.name.trim(),
		created_at: utils.seconds(),
		last_updated: null,
		owner: {
			type: 'user',
			uid: user.uid,
		}
	};

	// Create the new record
	if (!await save(doc)) return;

	// Update the owner's list of Spaces
	const spaceIDs = (await list(user)).concat(doc.uid);
	if (!await sync(user, spaceIDs)) return;

	return doc;
}

/**
 * Update a `Space` document with the given `changes`.
 * @NOTE Only the `name` can be changed.
 */
export async function update(space: Space, changes: { name?: string }): Promise<Space|false> {
	// NOTE: a
	changes.name = (changes.name || '').trim();
	if (space.name === changes.name) return space;
	if (!changes.name.length) return space;

	// Explicitly choose properties to update
	// ~> AKA, do not allow `uid` or `created_at` updates
	space.last_updated = utils.seconds();
	space.name = changes.name;

	if (!await save(space)) return false;

	return space;
}

/**
 * Destroy a `Space` document.
 * @IMPORTANT Consumer must run ownership check.
 */
export async function destroy(doc: Space, user: User): Promise<boolean> {
	const key = toKID(doc.uid);
	if (!await database.remove(key)) return false;

	// Get the owner's list of Spaces
	const spaceIDs = await list(user);
	const index = spaceIDs.indexOf(doc.uid);

	// NOTE: shouldn't happen
	if (index === -1) return true;
	spaceIDs.splice(index, 1);

	// Sync counts with Stripe
	// Sync counts/IDs with Owner key
	return sync(user, spaceIDs);
}

/**
 * Format a `Space` document for public display
 * @NOTE Ensures `owner` is never public!
 */
export function output(doc: Space) {
	const { uid, name, created_at, last_updated } = doc;
	return { uid, name, created_at, last_updated };
}

/**
 * Middleware to load a `Space` document.
 * Asserts the `suid` looks right before touching KV.
 */
export const load: Handler = async function (req, context) {
	const { spaceid } = context.params;

	if (!isUID(spaceid!)) {
		return utils.reply(400, 'Invalid Space identifier');
	}

	const item = await find(spaceid);
	if (!item) return utils.reply(404, 'Space not found');

	context.space = item;
}

/**
 * User Authorization Middleware.
 * Determine if the `User` is allowed to access the `Space` document.
 */
export const isAuthorized: Handler = function (req, context) {
	const { user, space } = context;

	// TODO: show 404 instead?
	if (space!.owner.uid !== user!.uid) {
		return utils.reply(403);
	}
}
