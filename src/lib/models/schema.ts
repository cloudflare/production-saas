import * as utils from 'lib/utils';
import * as database from 'lib/utils/database';
import * as Customers from 'lib/stripe/customers';
import * as Owner from './owner';

import type { ULID } from 'lib/utils';
import type { Handler } from 'lib/context';
import type { Options } from 'worktop/cfw.kv';
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
export const toUID = utils.ulid;
export const isUID = utils.isULID;
export const toKID = (spaceid: SpaceID, uid: SchemaID) => `spaces::${spaceid}::types::${uid}`;

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
	// retrieve the fully-formatted Key IDs (aka, KIDs)
	const keys = await database.paginate({ ...options, prefix });
	// convert keys into complete documents
	return database.collect<Schema>(keys);
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
		uid: await utils.until(toUID, toFind),
		name: values.name.trim(),
		spaceid: space.uid,
		created_at: utils.seconds(),
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
	schema.last_updated = utils.seconds();
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
export const load: Handler = async function (req, context) {
	const { spaceid, schemaid } = context.params;

	if (!isUID(schemaid!)) {
		return utils.reply(400, 'Invalid Schema identifier');
	}

	let item = await find(spaceid!, schemaid);
	if (!item) return utils.reply(404, 'Schema not found');

	context.schema = item;
}
