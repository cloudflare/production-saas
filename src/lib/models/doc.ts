import * as utils from 'lib/utils';
import * as database from 'lib/utils/database';
import * as Customers from 'lib/stripe/customers';
import * as Owner from './owner';

import type { ULID } from 'lib/utils';
import type { Handler } from 'lib/context';
import type { Options } from 'worktop/cfw.kv';
import type { Schema, SchemaID } from './schema';
import type { SpaceID } from './space';
import type { User } from './user';

export type DocID = ULID;

export interface Doc {
	uid: DocID;
	slug: string;
	// TODO: `localized`
	fields: Record<string, string>;
	schemaid: SchemaID;
	spaceid: SpaceID;
	owner: Owner.Owner;
	created_at: TIMESTAMP;
	last_updated: Nullable<TIMESTAMP>;
}

// ID helpers to normalize ID types/values
export const toUID = utils.ulid;
export const isUID = utils.isULID;
export const toKID = (spaceid: SpaceID, uid: DocID) => `spaces::${spaceid}::docs::${uid}`;
export const toPID = (spaceid: SpaceID, slug: string) => `spaces::${spaceid}::slugs::${slug}`;

/**
 * Find a `Doc` document by its `uid` value.
 */
export function find(spaceid: SpaceID, uid: DocID) {
	const key = toKID(spaceid, uid);
	return database.read<Doc>(key);
}

/**
 * Find a `DocID` by its `slug` value.
 */
export function lookup(spaceid: SpaceID, slug: string): Promise<DocID | void> {
	const key = toPID(spaceid, slug);
	return database.read<DocID>(key);
}

/**
 * Find all `Doc` documents belonging to the `Space`.
 */
export async function list(spaceid: SpaceID, options?: Pick<Options.Paginate, 'limit'|'page'>): Promise<Doc[]> {
	// pass empty UID for `prefix` value only
	const prefix = toKID(spaceid, '' as DocID);
	// retrieve the fully-formatted Key IDs (aka, KIDs)
	const keys = await database.paginate({ ...options, prefix });
	// convert keys into complete documents
	return database.collect<Doc>(keys);
}

/**
 * Synchronize the User's `documents` count
 */
export async function sync(user: User, delta: 1 | -1): Promise<boolean> {
	// retrieve current limits/counts
	const owner = Owner.format('user', user.uid);
	const limits = await Owner.getCounts(owner);

	// update the `documents` count for this user
	limits.documents = (limits.documents || 0) + delta;
	const success = await Owner.setCounts(owner, limits);

	// only update the Stripe Customer sheet if `limits` updated
	const output = success && await Customers.update(user.stripe.customer,{
		metadata: { ...limits, userid: user.uid }
	});

	return !!output;
}

/**
 * Save/Overwrite the `Doc` document.
 */
export async function save(doc: Doc): Promise<boolean> {
	// save the raw document values
	let key = toKID(doc.spaceid, doc.uid);
	if (!await database.write<Doc>(key, doc)) {
		return false;
	}

	// save the "slug" alias link
	key = toPID(doc.spaceid, doc.slug);
	return database.write<DocID>(key, doc.uid);
}

/**
 * Create a new `Doc` document for a User
 * @NOTE Handles its own `uid` value/uniqueness.
 * @TODO finish me: slug|fields -- maybe slug = uid default
 */
export async function insert(values: Pick<Doc, 'slug'>, schema: Schema, user: User): Promise<Doc|void> {
	const toFind = find.bind(0, schema.spaceid);

	const doc: Doc = {
		// Create new `DocID`s until available
		uid: await utils.until(toUID, toFind),
		slug: values.slug.trim(),
		fields: {
			// TODO: normalize/validate
		},
		schemaid: schema.uid,
		spaceid: schema.spaceid,
		created_at: utils.seconds(),
		last_updated: null,
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
export async function update(schema: Doc, changes: Partial<Input<Doc>>): Promise<Doc|false> {
	changes.slug = (changes.slug || '').trim();
	if (schema.slug === changes.slug) return schema;
	if (!changes.slug.length) return schema;

	// Explicitly choose properties to update
	// ~> AKA, do not allow `uid` or `created_at` updates
	schema.last_updated = utils.seconds();
	schema.slug = changes.slug;

	// TODO: remove old slug alias if changed

	if (!await save(schema)) return false;

	return schema;
}

/**
 * Destroy a `Space` document.
 * @IMPORTANT Consumer must run ownership check.
 */
export async function destroy(doc: Doc, user: User): Promise<boolean> {
	const key = toKID(doc.spaceid, doc.uid);
	if (!await database.remove(key)) return false;

	// decrement `schemas` count
	return sync(user, -1);
}

/**
 * Format a `Doc` document for public display
 * @NOTE Ensures `owner` is never public!
 */
export function output(doc: Doc) {
	const { uid, slug, fields, created_at, last_updated } = doc;
	return { uid, slug, fields, created_at, last_updated };
}

/**
 * Middleware to load a `Doc` document.
 * Asserts the `suid` looks right before touching KV.
 */
export const load: Handler = async (req, context) => {
	let spaceid = context.params.spaceid!;
	let docid = context.params.docid!;
	let alias: DocID | void;

	if (isUID(docid)) {
		// no changes
	} else if (alias = await lookup(spaceid, docid)) {
		docid = alias; // was a valid slug
	} else {
		return utils.reply(400, 'Invalid document identifier');
	}

	let doc = await find(spaceid, docid);
	if (!doc) return utils.reply(404, 'Document not found');

	context.document = doc;
}
