import { compose } from 'worktop';
import * as paging from 'lib/utils/paging';
import * as Schema from 'lib/models/schema';
import * as Document from 'lib/models/doc';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';

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
	async function (req, res) {
		const { limit, page } = paging.parse(req.query);
		const spaceid = req.params.spaceid as Space.SpaceID;
		const items = await Document.list(spaceid, { limit, page });

		const output = items.map(Document.output);
		res.send(200, output);
	}
);

/**
 * POST /spaces/:spaceid/documents
 * @requires Authentication,Ownership
 */
export const create = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, res) {
		const input = await req.body<{ slug?: string }>();
		const slug = input && input.slug && input.slug.trim();

		if (!slug) {
			// TODO: maybe default `slug` to `uid` if blank?
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const { user, space, schema } = req as {
			schema: Schema.Schema;
			space: Space.Space;
			user: User.User;
		};

		const exists = await Document.lookup(space.uid, slug);
		if (exists) return res.send(422, 'A document already exists with this slug');

		// TODO: valiadate `schema.fields` okay

		const doc = await Document.insert({ slug }, schema, user);
		if (!doc) return res.send(500, 'Error creating document');

		const output = Document.output(doc);
		res.send(201, output);
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
	function (req, res) {
		// @ts-ignore - todo(worktop)
		const doc = req.document as Document.Doc;
		res.send(200, Document.output(doc));
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
	async function (req, res) {
		const input = await req.body<{ slug?: string }>();
		const slug = input && input.slug && input.slug.trim();

		if (!slug) {
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const { document } = req as {
			document: Document.Doc;
			schema: Schema.Schema;
			space: Space.Space;
			user: User.User;
		};

		const doc = await Document.update(document, { slug });
		if (!doc) res.send(500, 'Error updating document');
		else res.send(200, Document.output(doc));
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
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const { user, document } = req as {
			document: Document.Doc;
			schema: Schema.Schema;
			space: Space.Space;
			user: User.User;
		};
		if (await Document.destroy(document, user)) res.send(204);
		else res.send(500, 'Error while destroying document');
	}
);
