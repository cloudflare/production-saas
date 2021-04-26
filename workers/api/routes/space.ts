import { compose } from 'worktop';
import * as User from 'lib/models/user';
import * as Space from 'lib/models/space';

import type { SpaceID } from 'lib/models/space';

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
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		//
	}
);

/**
 * GET /spaces/:uid
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
 * PUT /spaces/:uid
 * @requires Authentication,Ownership
 */
export const update = compose(
	Space.load,
	User.authenticate,
	Space.isAuthorized,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
	}
);

/**
 * DELETE /spaces/:uid
 * @requires Authentication,Ownership
 */
export const destroy = compose(
	Space.load,
	User.authenticate,
	Space.isAuthorized,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
		// @ts-ignore - todo(worktop)
		const space = req.space as Space.Space;
	}
);
