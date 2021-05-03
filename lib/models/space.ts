import * as keys from 'lib/utils/keys';
import * as database from 'lib/utils/database';

import type { Handler } from 'worktop';
import type { UID } from 'worktop/utils';
import type { User, UserID } from './user';
import type { KeyID } from 'lib/utils/keys';

export type SpaceID = UID<11>;

// TODO: Maybe Org
type Owner = {
	type: 'user';
	uid: UserID;
}

export interface Space {
	uid: SpaceID;
	name: string;
	ownerid: Owner;
	created_at: TIMESTAMP;
	last_updated?: Nullable<TIMESTAMP>;
}

// ID helpers to normalize ID types/values
export const toUID = () => keys.gen(11) as SpaceID;
export const toKID = (uid: SpaceID) => `spaces::${uid}` as KeyID;
export const isUID = (x: SpaceID|string): x is SpaceID => x.length === 11;

// Construct the "owners::" KeyID for KV
export const toOwnerKID = (userid: UserID) => `owners::user:${userid}` as keys.KeyID;

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
export function list(user: User): Promise<Space[]> {
	const key = toOwnerKID(user.uid);
	return database.read<Space[]>(key).then(x => x || []);
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
		uid: await keys.until(toUID, find),
		name: values.name.trim(),
		created_at: Date.now(),
		last_updated: null,
		ownerid: {
			type: 'user',
			uid: user.uid,
		}
	};

	// Create the new record
	if (!await save(doc)) return;

	// TODO: update owner key count
	// TODO: update Stripe quantity

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
	space.last_updated = Date.now();
	space.name = changes.name;

	if (!await save(space)) return false;

	return space;
}

/**
 * Destroy a `Space` document.
 * @IMPORTANT Consumer must run ownership check.
 */
export async function destroy(doc: Space): Promise<boolean> {
	const key = toKID(doc.uid);
	const bool = await database.remove(key);

	if (bool) {
		// TODO: update owner key count
		// TODO: update Stripw quantity
	}

	return bool;
}

/**
 * Format a `Space` document for public display
 * @NOTE Ensures `ownerid` is never public!
 */
export function output(doc: Space) {
	const { uid, name, created_at, last_updated } = doc;
	return { uid, name, created_at, last_updated };
}

/**
 * Middleware to load a `Space` document.
 * Asserts the `suid` looks right before touching KV.
 */
export const load: Handler<{ spaceid: SpaceID | string }> = async function (req, res) {
	if (!isUID(req.params.spaceid)) {
		return res.send(400, 'Invalid Space identifier');
	}

	const doc = await find(req.params.spaceid);
	if (!doc) return res.send(404, 'Space not found');

	// @ts-ignore - todo(worktop)
	req.space = doc;
}

/**
 * User Authorization Middleware.
 * Determine if the `req.user` is allowed to access the `req.space` document.
 */
export const isAuthorized: Handler = function (req, res) {
	// @ts-ignore - todo(worktop)
	const { user, space } = req as {
		user: User; space: Space;
	};

	// TODO: show 404 instead?
	if (space.ownerid.uid !== user.uid) {
		return res.send(403);
	}
}
