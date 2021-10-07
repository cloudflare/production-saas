import { compose } from 'worktop';
import * as utils from 'worktop/utils';
import { send } from 'worktop/response';
import * as User from 'lib/models/user';

/**
 * PUT /users/:userid
 * @requires Authentication
 */
export const update = compose(
	User.authenticate,
	async function (req, context) {
		let user = context.user!;

		if (context.params.userid !== user.uid) {
			return send(403, 'You cannot do that');
		}

		type Input = Partial<User.User>;
		const input = await utils.body<Input>(req);

		// TODO: input validations
		// Only continue if we have new values
		if (input && Object.keys(input).length > 0) {
			const doc = await User.update(user, input);
			if (!doc) return send(500, 'Error updating user document');
			user = doc;
		}

		const output = await User.tokenize(user);
		return send(200, output);
	}
);
