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
			return utils.reply(403, 'You cannot do that');
		}

		type Input = Partial<User.User>;
		const input = await utils.body<Input>(req);

		// TODO: input validations
		// Only continue if we have new values
		if (input && Object.keys(input).length > 0) {
			const doc = await User.update(user, input);
			if (!doc) return utils.reply(500, 'Error updating user document');
			user = doc;
		}

		return User.respond(200, user);
	}
);
