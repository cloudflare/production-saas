import { email } from '.';
import type { User } from 'lib/models/user';

/**
 * Send the User a Welcome email
 * @NOTE Relies on a pre-existing "welcome" template
 * @see https://mc.sendgrid.com/dynamic-templates
 */
export function welcome(user: User) {
	let firstname = user.firstname || 'Guest';
	return email('d-b93ad7e5ffa94ea785adeba34300e0e6', {
		email: user.email,
		name: firstname,
	}, {
		firstname
	});
}
