import { compose } from 'worktop';
import * as paging from 'lib/utils/paging';
import * as Document from 'lib/models/doc';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';
import * as utils from 'lib/utils';

// TODO:
//  - request validation
//  - handle `fields` options

/**
 * GET /spaces/:spaceid/documents
 * @requires Authentication,Ownership
 * @TODO maybe: `?include=schema`
 */
export const list = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, context) {
		const spaceid = context.params.spaceid as Space.SpaceID;
		const { limit, page } = paging.parse(context.url.searchParams);
		const items = await Document.list(spaceid, { limit, page });

		const output = items.map(Document.output);
		return utils.reply(200, output);
	}
);

/**
 * POST /spaces/:spaceid/documents
 * @requires Authentication,Ownership
 */
export const create = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, context) {
		const input = await utils.body<{ slug?: string }>(req);
		const slug = input && input.slug && input.slug.trim();

		if (!slug) {
			// TODO: maybe default `slug` to `uid` if blank?
			return utils.reply(400, 'TODO: port over validation lib');
		}

		const { user, space, schema } = context;
		const exists = await Document.lookup(space!.uid, slug);
		if (exists) return utils.reply(422, 'A document already exists with this slug');

		// TODO: valiadate `schema.fields` okay

		const doc = await Document.insert({ slug }, schema!, user!);
		if (!doc) return utils.reply(500, 'Error creating document');

		const output = Document.output(doc);
		return utils.reply(201, output);
	}
);

/**
 * GET /spaces/:spaceid/documents/:docid
 * @requires Authentication,Ownership
 */
export const show = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Document.load,
	function (req, context) {
		const doc = context.document!;
		return utils.reply(200, Document.output(doc));
	}
);

/**
 * PUT /spaces/:spaceid/documents/:docid
 * @requires Authentication,Ownership
 */
export const update = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Document.load,
	async function (req, context) {
		const input = await utils.body<{ slug?: string }>(req);
		const slug = input && input.slug && input.slug.trim();

		if (!slug) {
			return utils.reply(400, 'TODO: port over validation lib');
		}

		const doc = await Document.update(context.document!, { slug });
		if (!doc) return utils.reply(500, 'Error updating document');
		else return utils.reply(200, Document.output(doc));
	}
);

/**
 * DELETE /spaces/:spaceid/documents/:docid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Document.load,
	async function (req, context) {
		const { user, document } = context;
		if (await Document.destroy(document!, user!)) return utils.reply(204);
		else return utils.reply(500, 'Error while destroying document');
	}
);
