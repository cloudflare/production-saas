import { email } from '.';
import type { User } from 'lib/models/user';

/**
 * Send the User a Welcome email
 * @NOTE Relies on a pre-existing "welcome" template
 * @see https://mc.sendgrid.com/dynamic-templates
 */
export function welcome(user: User) {
	let firstname = user.firstname || 'Guest';
	return email('welcome', 'd-b93ad7e5ffa94ea785adeba34300e0e6', {
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
	return email('new.email', 'd-34320639ad42459a851b946fe1eadfe8', { email: address });
}

/**
 * Send the "your password changed" email
 */
export function password(address: string) {
	return email('new.password', 'd-fc893c19238a46fc8554a15766d66f84', { email: address });
}
