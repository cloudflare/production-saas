import { compose } from 'worktop';
import * as Email from 'lib/models/email';
import * as Password from 'lib/models/password';
import * as User from 'lib/models/user';
import * as utils from 'lib/utils';

import type { Handler } from 'lib/context';
import type { Credentials } from 'lib/models/user';
import type { TOKEN } from 'lib/models/password';

// TODO: email,password validations

/**
 * POST /auth/register
 */
export const register: Handler = async req => {
	const input = await utils.body<Credentials>(req);

	if (!input || !input.email || !input.password) {
		return utils.reply(400, 'TODO: port over validation lib');
	}

	// Check for existing user email
	const { email, password } = input;
	const userid = await Email.find(email);
	if (userid) return utils.reply(400, 'An account already exists for this address');

	const user = await User.insert({ email, password });
	if (!user) return utils.reply(500, 'Error creating account');

	return User.respond(201, user);
}

/**
 * POST /auth/login
 */
export const login: Handler = async req => {
	const input = await utils.body<Credentials>(req);

	if (!input || !input.email || !input.password) {
		return utils.reply(400, 'TODO: port over validation lib');
	}

	// the amibiguous error message to send
	const ambiguous = 'Invalid credentials';

	// Check for existing user email
	const { email, password } = input;
	const userid = await Email.find(email);
	if (!userid) return utils.reply(401, ambiguous);

	const user = await User.find(userid);
	if (!user) return utils.reply(401, ambiguous);

	const isMatch = await Password.compare(user, password);
	if (!isMatch) return utils.reply(401, ambiguous);

	return User.respond(200, user);
}

/**
 * POST /auth/refresh
 * Exchange a valid JWT for new JWT and `User` data
 */
export const refresh: Handler = compose(
	User.authenticate,
	async (req, context) => {
		const user = context.user!;
		return User.respond(200, user);
	}
) as Handler;

/**
 * POST /auth/forgot
 * Initialize the Password Reset process
 */
export const forgot: Handler = async req => {
	type Input = { email?: string };
	const input = await utils.body<Input>(req);

	if (!input || !input.email) {
		return utils.reply(400, 'TODO: port over validation lib');
	}

	// the amibiguous message to send
	const ambiguous = 'A link to reset your password will be sent to your email address if an account exists';

	// Check for existing user email
	const userid = await Email.find(input.email);
	if (!userid) return utils.reply(200, ambiguous);

	const user = await User.find(userid);
	if (!user) return utils.reply(200, ambiguous);

	if (await Password.forgot(user)) return utils.reply(200, ambiguous);
	else return utils.reply(400, 'Error while resetting password');
}

/**
 * POST /auth/reset
 */
export const reset: Handler = async req => {
	type Input = Credentials & { token?: TOKEN };
	const input = await utils.body<Input>(req);

	if (!input || !input.email || !input.password || !input.token) {
		return utils.reply(400, 'TODO: port over validation lib');
	}

	// the amibiguous message to send
	const ambiguous = 'Invalid token';
	const { token, email, password } = input;

	const isValid = Password.isUID(token);
	if (!isValid) return utils.reply(400, ambiguous);

	const userid = await Password.find(token);
	if (!userid) return utils.reply(400, ambiguous);

	let user = await User.find(userid);
	if (!user) return utils.reply(400, ambiguous);

	if (user.email !== email) {
		return utils.reply(400, ambiguous);
	}

	// regenerate salt
	user = await User.update(user, { password });
	if (!user) return utils.reply(500, 'Error updating user document');

	return User.respond(200, user);
}
