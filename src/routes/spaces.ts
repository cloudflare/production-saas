import { compose } from 'worktop';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';
import * as utils from 'lib/utils';

/**
 * GET /spaces
 * @requires Authentication
 */
export const list = compose(
	User.authenticate,
	async function (req, context) {
		const IDs = await Space.list(context.user!);
		const rows = await Promise.all(IDs.map(Space.find));

		let i=0, output=[];
		for (; i < rows.length; i++) {
			if (rows[i]) output.push(
				Space.output(rows[i] as Space.Space)
			);
		}

		return utils.reply(200, output);
	}
);

/**
 * POST /spaces
 * @requires Authentication
 */
export const create = compose(
	User.authenticate,
	async function (req, context) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) {
			return utils.reply(400, 'TODO: port over validation lib');
		}

		const doc = await Space.insert({ name }, context.user!);
		if (!doc) return utils.reply(500, 'Error creating document');

		const output = Space.output(doc);
		return utils.reply(201, output);
	}
);

/**
 * GET /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const show = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	function (req, context) {
		const space = context.space!;
		return utils.reply(200, Space.output(space));
	}
);

/**
 * PUT /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const update = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, context) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) return utils.reply(400, 'TODO: port over validation lib');
		const doc = await Space.update(context.space!, { name });

		if (doc) return utils.reply(200, Space.output(doc));
		return utils.reply(500, 'Error updating document');
	}
);

/**
 * DELETE /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, context) {
		const { user, space } = context;
		if (await Space.destroy(space!, user!)) return utils.reply(204);
		return utils.reply(500, 'Error while destroying Space');
	}
);
