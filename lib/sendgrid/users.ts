import { email } from '.';
import type { User } from 'lib/models/user';

/**
 * Send the User a Welcome email
 * @NOTE Relies on a pre-existing "welcome" template
 * @see https://mc.sendgrid.com/dynamic-templates
 */
export function welcome(user: User) {
	let firstname = user.firstname || 'Guest';
	return email('welcome', 'd-588add1d1843463d904c0d3e2bedadf8', {
		email: user.email,
		name: firstname,
	}, {
		firstname
	});
}

/**
 * Send the "your email changed" email
 */
export function contact(address: string) {
	return email('new.email', 'd-343e97d7060143f4ba9580d4a10dcf5c', { email: address });
}

/**
 * Send the "your password changed" email
 */
export function password(address: string) {
	return email('new.password', 'd-7e078ad44d6a43b3a8ee4d142ad7543b', { email: address });
}
