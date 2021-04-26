import { compose } from 'worktop';
import * as User from 'lib/models/user';
import * as Space from 'lib/models/space';

import type { SpaceID } from 'lib/models/space';

/**
 * GET /spaces
 * @NOTE Requires Authentication
 */
export const list = compose(
	User.authenticate,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		const user = req.user as User.User;
	}
);

/**
 * POST /spaces
 * @NOTE Requires Authentication
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
 * @NOTE Requires Authentication
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
 * @NOTE Requires Authentication
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
 * @NOTE Requires Authentication
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
