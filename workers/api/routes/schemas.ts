import { compose } from 'worktop';
import * as paging from 'lib/utils/paging';
import * as Schema from 'lib/models/schema';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';

// TODO:
//  - request validation
//  - handle `fields` options

/**
 * GET /spaces/:spaceid/schemas
 * @requires Authentication,Ownership
 */
export const list = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, res) {
		const { limit, page } = paging.parse(req.query);
		const spaceid = req.params.spaceid as Space.SpaceID;
		const items = await Schema.list(spaceid, { limit, page });

		const output = items.map(Schema.output);
		res.send(200, output);
	}
);

/**
 * POST /spaces/:spaceid/schemas
 * @requires Authentication,Ownership
 */
export const create = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, res) {
		const input = await req.body<{ name?: string }>();
		const name = input && input.name && input.name.trim();

		if (!name) {
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const { user, space } = req as {
			space: Space.Space;
			user: User.User;
		};

		const doc = await Schema.insert({ name }, space, user);
		if (!doc) return res.send(500, 'Error creating document');

		const output = Schema.output(doc);
		res.send(201, output);
	}
);

/**
 * GET /spaces/:spaceid/schemas/:schemaid
 * @requires Authentication,Ownership
 */
export const show = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Schema.load,
	function (req, res) {
		// @ts-ignore - todo(worktop)
		const doc = req.schema as Schema.Schema;
		res.send(200, Schema.output(doc));
	}
);

/**
 * PUT /spaces/:spaceid/schemas/:schemaid
 * @requires Authentication,Ownership
 */
export const update = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Schema.load,
	async function (req, res) {
		const input = await req.body<{ name?: string }>();
		const name = input && input.name && input.name.trim();

		if (!name) {
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const { schema } = req as {
			schema: Schema.Schema;
			space: Space.Space;
			user: User.User;
		};

		const doc = await Schema.update(schema, { name });
		if (!doc) res.send(500, 'Error updating document');
		else res.send(200, Schema.output(doc));
	}
);

/**
 * DELETE /spaces/:spaceid/schemas/:schemaid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	Schema.load,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const { user, schema } = req as {
			schema: Schema.Schema;
			space: Space.Space;
			user: User.User;
		};
		if (await Schema.destroy(schema, user)) res.send(204);
		else res.send(500, 'Error while destroying Schema');
	}
);
