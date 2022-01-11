import { compose } from 'worktop';
import * as paging from 'lib/utils/paging';
import * as Schema from 'lib/models/schema';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';
import * as utils from 'lib/utils';

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
	async function (req, context) {
		const { limit, page } = paging.parse(context.url.searchParams);
		const spaceid = context.params.spaceid as Space.SpaceID; // todo
		const items = await Schema.list(spaceid, { limit, page });

		const output = items.map(Schema.output);
		return utils.reply(200, output);
	}
);

/**
 * POST /spaces/:spaceid/schemas
 * @requires Authentication,Ownership
 */
export const create = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, context) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) {
			return utils.reply(400, 'TODO: port over validation lib');
		}

		const { user, space } = context;

		const doc = await Schema.insert({ name }, space!, user!);
		if (!doc) return utils.reply(500, 'Error creating document');

		const output = Schema.output(doc);
		return utils.reply(201, output);
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
	function (req, context) {
		const doc = context.schema!;
		return utils.reply(200, Schema.output(doc));
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
	async function (req, context) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) {
			return utils.reply(400, 'TODO: port over validation lib');
		}

		const { schema } = context;

		const doc = await Schema.update(schema!, { name });
		if (doc) return utils.reply(200, Schema.output(doc));
		return utils.reply(500, 'Error updating document');
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
	async function (req, context) {
		const { user, schema } = context;
		if (await Schema.destroy(schema!, user!)) return utils.reply(204);
		return utils.reply(500, 'Error while destroying Schema');
	}
);
