import * as keys from 'lib/utils/keys';
import * as database from 'lib/utils/database';
import * as Customers from 'lib/stripe/customers';
import * as Owner from './owner';

import type { Handler } from 'worktop';
import type { ULID } from 'worktop/utils';
import type { Options } from 'worktop/kv';
import type { Space, SpaceID } from './space';
import type { User } from './user';

export type SchemaID = ULID;

export interface Field {
	/** @example "title" */
	name: string;
	/** @example "Title" */
	label: string,
	required: boolean;
	// TODO: Array/Object/Reference types
	// @see https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions
	type: 'Text' | 'RichText' | 'Integer' | 'Number' | 'Date' | 'Boolean';
	// localized: boolean;
}

export interface Schema {
	uid: SchemaID;
	name: string;
	fields: Field[];
	spaceid: SpaceID;
	owner: Owner.Owner;
	created_at: TIMESTAMP;
	last_updated?: Nullable<TIMESTAMP>;
}

// ID helpers to normalize ID types/values
export const toUID = keys.ulid;
export const toKID = (spaceid: SpaceID, uid: SchemaID) => `spaces::${spaceid}::types::${uid}`;
export const isUID = (x: SchemaID|string): x is SchemaID => x.length === 26;

/**
 * Find a `Space` document by its `uid` value.
 */
export function find(spaceid: SpaceID, uid: SchemaID) {
	const key = toKID(spaceid, uid);
	return database.read<Schema>(key);
}

/**
 * Find all `Schema` documents belonging to the `Space`.
 */
export async function list(spaceid: SpaceID, options?: Pick<Options.Paginate, 'limit'|'page'>): Promise<Schema[]> {
	// pass empty UID for `prefix` value only
	const prefix = toKID(spaceid, '' as SchemaID);
	// retrive the fully-formatted Key IDs (aka, KIDs)
	const keys = await database.paginate({ ...options, prefix });
	return Promise.all(keys.map(database.read)) as Promise<Schema[]>;
}

/**
 * Synchronize the User's list of SchemaIDs
 */
export async function sync(user: User, delta: 1 | -1): Promise<boolean> {
	// retrieve current limits/counts
	const owner = Owner.format('user', user.uid);
	const limits = await Owner.getCounts(owner);

	// update the `schemas` count for this user
	limits.schemas = (limits.schemas || 0) + delta;
	const success = await Owner.setCounts(owner, limits);

	// only update the Stripe Customer sheet if `limits` updated
	const output = success && await Customers.update(user.stripe.customer,{
		metadata: { ...limits, userid: user.uid }
	});

	return !!output;
}

/**
 * Save/Overwrite the `Space` document.
 */
export function save(doc: Schema): Promise<boolean> {
	const key = toKID(doc.spaceid, doc.uid);
	return database.write<Schema>(key, doc);
}

/**
 * Create a new `Schema` document for a User
 * @NOTE Handles its own `uid` value/uniqueness.
 * @TODO finish me
 */
export async function insert(values: { name: string }, space: Space, user: User): Promise<Schema|void> {
	const toFind = find.bind(0, space.uid);

	const doc: Schema = {
		// Create new `SchemaID`s until available
		uid: await keys.until(toUID, toFind),
		name: values.name.trim(),
		spaceid: space.uid,
		created_at: Date.now(),
		last_updated: null,
		fields: [], // TODO
		owner: {
			type: 'user',
			uid: user.uid,
		}
	};

	// Create the new record
	if (!await save(doc)) return;

	// increment owner count
	if (await sync(user, 1)) return doc;
}

/**
 * Update a `Space` document with the given `changes`.
 * @NOTE Only the `name` can be changed.
 * @TODO input & field management
 */
export async function update(schema: Schema, changes: { name?: string }): Promise<Schema|false> {
	changes.name = (changes.name || '').trim();
	if (schema.name === changes.name) return schema;
	if (!changes.name.length) return schema;

	// Explicitly choose properties to update
	// ~> AKA, do not allow `uid` or `created_at` updates
	schema.last_updated = Date.now();
	schema.name = changes.name;

	if (!await save(schema)) return false;

	return schema;
}

/**
 * Destroy a `Space` document.
 * @IMPORTANT Consumer must run ownership check.
 */
export async function destroy(doc: Schema, user: User): Promise<boolean> {
	const key = toKID(doc.spaceid, doc.uid);
	if (!await database.remove(key)) return false;

	// decrement `schemas` count
	return sync(user, -1);
}

/**
 * Format a `Schema` document for public display
 * @NOTE Ensures `owner` is never public!
 */
export function output(doc: Schema) {
	const { uid, name, fields, created_at, last_updated } = doc;
	return { uid, name, fields, created_at, last_updated };
}

/**
 * Middleware to load a `Schema` document.
 * Asserts the `suid` looks right before touching KV.
 */
export const load: Handler<{ spaceid: SpaceID|string, schemaid: SchemaID|string }> = async function (req, res) {
	const { spaceid, schemaid } = req.params;

	if (!isUID(schemaid)) {
		return res.send(400, 'Invalid Schema identifier');
	}

	const doc = await find(spaceid as SpaceID, schemaid);
	if (!doc) return res.send(404, 'Schema not found');

	// @ts-ignore - todo(worktop)
	req.schema = doc;
}
