import { compose } from 'worktop';
import * as User from 'lib/models/user';
import * as utils from 'lib/utils';

/**
 * PUT /users/:userid
 * @requires Authentication
 */
export const update = compose(
	User.authenticate,
	async function (req, context) {
		let user = context.user!;

		if (context.params.userid !== user.uid) {
			return utils.send(403, 'You cannot do that');
		}

		type Input = Partial<User.User>;
		const input = await utils.body<Input>(req);

		// TODO: input validations
		// Only continue if we have new values
		if (input && Object.keys(input).length > 0) {
			const doc = await User.update(user, input);
			if (!doc) return utils.send(500, 'Error updating user document');
			user = doc;
		}

		const output = await User.tokenize(user);
		return utils.send(200, output);
	}
);
