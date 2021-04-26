import * as Email from 'lib/models/email';
import * as Password from 'lib/models/password';
import * as User from 'lib/models/user';

import type { Handler } from 'worktop';
import type { Credentials } from 'lib/models/user';
import type { TOKEN } from 'lib/models/password';

// TODO: email,password validations

/**
 * POST /auth/register
 */
export const register: Handler = async (req, res) => {
	const input = await req.body<Credentials>();

	if (!input || !input.email || !input.password) {
		return res.send(400, 'TODO: port over validation lib');
	}

	// Check for existing user email
	const { email, password } = input;
	const userid = await Email.find(email);
	if (userid) return res.send(400, 'An account already exists for this address');

	const user = await User.insert({ email, password });
	if (!user) return res.send(500, 'Error creating account');

	const output = await User.tokenize(user);
	res.send(201, output);
}

/**
 * POST /auth/login
 */
export const login: Handler = async (req, res) => {
	const input = await req.body<Credentials>();

	if (!input || !input.email || !input.password) {
		return res.send(400, 'TODO: port over validation lib');
	}

	// the amibiguous error message to send
	const ambiguous = 'Invalid credentials';

	// Check for existing user email
	const { email, password } = input;
	const userid = await Email.find(email);
	if (!userid) return res.send(401, ambiguous);

	const user = await User.find(userid);
	if (!user) return res.send(401, ambiguous);

	const isMatch = await Password.compare(user, password);
	if (!isMatch) return res.send(401, ambiguous);

	const output = await User.tokenize(user);
	res.send(200, output);
}

/**
 * POST /auth/forgot
 * Initialize the Password Reset process
 */
export const forgot: Handler = async (req, res) => {
	type Input = { email?: string };
	const input = await req.body<Input>();

	if (!input || !input.email) {
		return res.send(400, 'TODO: port over validation lib');
	}

	// the amibiguous message to send
	const ambiguous = 'A link to reset your password will be sent to your email address if an account exists';

	// Check for existing user email
	const userid = await Email.find(input.email);
	if (!userid) return res.send(200, ambiguous);

	const user = await User.find(userid);
	if (!user) return res.send(200, ambiguous);

	if (await Password.forgot(user)) res.send(200, ambiguous);
	else res.send(400, 'Error while resetting password');
}

/**
 * POST /auth/reset
 */
export const reset: Handler = async (req, res) => {
	type Input = Credentials & { token?: TOKEN };
	const input = await req.body<Input>();

	if (!input || !input.email || !input.password || !input.token) {
		return res.send(400, 'TODO: port over validation lib');
	}

	// the amibiguous message to send
	const ambiguous = 'Invalid token';
	const { token, email, password } = input;

	const isValid = Password.RESET.isUID(token);
	if (!isValid) return res.send(400, ambiguous);

	const userid = await Password.find(token);
	if (!userid) return res.send(400, ambiguous);

	let user = await User.find(userid);
	if (!user) return res.send(400, ambiguous);

	if (user.email !== email) {
		return res.send(400, ambiguous);
	}

	// regenerate salt
	user = await User.update(user, { password });
	if (!user) return res.send(500, 'Error updating user document');

	const output = await User.tokenize(user);
	res.send(200, output);
}
