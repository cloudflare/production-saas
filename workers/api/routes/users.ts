import { compose } from 'worktop';
import * as User from 'lib/models/user';

/**
 * PUT /users/:userid
 * @requires Authentication
 */
export const update = compose(
	User.authenticate,
	async function (req, res) {
		// @ts-ignore - todo(worktop)
		let user = req.user as User.User;

		if (req.params.userid !== user.uid) {
			return res.send(403, 'You cannot do that');
		}

		type Input = Partial<User.User>;
		const input = await req.body<Input>();

		// TODO: input validations
		// Only continue if we have new values
		if (input && Object.keys(input).length > 0) {
			const doc = await User.update(user, input);
			if (!doc) return res.send(500, 'Error updating user document');
			user = doc;
		}

		const output = await User.tokenize(user);
		res.send(200, output);
	}
);
