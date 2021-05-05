import { compose } from 'worktop';
import * as User from 'lib/models/user';
import * as Space from 'lib/models/space';

/**
 * GET /spaces
 * @requires Authentication
 */
export const list = compose(
	User.authenticate,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		const arr = await Space.list(user);
		const items = arr.map(Space.output);
		res.send(200, items);
	}
);

/**
 * POST /spaces
 * @requires Authentication
 */
export const create = compose(
	User.authenticate,
	async function (req, res) {
		const input = await req.body<{ name?: string }>();
		const name = input && input.name && input.name.trim();

		if (!name) {
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		const doc = await Space.insert({ name }, user);
		if (!doc) return res.send(500, 'Error creating document');

		const output = Space.output(doc);
		res.send(201, output);
	}
);

/**
 * GET /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const show = compose(
	Space.load,
	User.authenticate,
	Space.isAuthorized,
	function (req, res) {
		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
		res.send(200, Space.output(space));
	}
);

/**
 * PUT /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const update = compose(
	Space.load,
	User.authenticate,
	Space.isAuthorized,
	async function (req, res) {
		const input = await req.body<{ name?: string }>();
		const name = input && input.name && input.name.trim();

		if (!name) {
			return res.send(400, 'TODO: port over validation lib');
		}

		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
		const doc = await Space.update(space, { name });

		if (doc) res.send(200, Space.output(doc));
		else res.send(500, 'Error updating document');
	}
);

/**
 * DELETE /spaces/:spaceid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	Space.load,
	User.authenticate,
	Space.isAuthorized,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const doc = req.space as Space.Space;
		if (await Space.destroy(doc)) res.send(204);
		else res.send(500, 'Error while destroying Space');
	}
);
