import { compose } from 'worktop';
import * as utils from 'worktop/utils';
import { send } from 'worktop/response';
import * as Space from 'lib/models/space';
import * as User from 'lib/models/user';

/**
 * GET /spaces
 * @requires Authentication
 */
export const list = compose(
	User.authenticate,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		const IDs = await Space.list(user);
		const rows = await Promise.all(
			IDs.map(Space.find)
		);

		let i=0, output=[];
		for (; i < rows.length; i++) {
			if (rows[i]) output.push(
				Space.output(rows[i] as Space.Space)
			);
		}

		return send(200, output);
	}
);

/**
 * POST /spaces
 * @requires Authentication
 */
export const create = compose(
	User.authenticate,
	async function (req, res) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) {
			return send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		const doc = await Space.insert({ name }, user);
		if (!doc) return send(500, 'Error creating document');

		const output = Space.output(doc);
		return send(201, output);
	}
);

/**
 * GET /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const show = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	function (req, res) {
		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
		return send(200, Space.output(space));
	}
);

/**
 * PUT /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const update = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, res) {
		const input = await utils.body<{ name?: string }>(req);
		const name = input && input.name && input.name.trim();

		if (!name) {
			return send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
		const doc = await Space.update(space, { name });

		if (doc) return send(200, Space.output(doc));
		return send(500, 'Error updating document');
	}
);

/**
 * DELETE /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	User.authenticate,
	Space.load, Space.isAuthorized,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const { user, space } = req as {
			space: Space.Space;
			user: User.User;
		};
		if (await Space.destroy(space, user)) return send(204);
		return send(500, 'Error while destroying Space');
	}
);
