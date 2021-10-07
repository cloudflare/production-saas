// Added via wrangler secret
const Authorization = `Bearer ${STRIPE_SECRET}`;
const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Nested `URLSearchParams` support
 * @example { a: { x:1, y:2 } } => a[x]=1&a[y]=2
 */
function encode(input: Dict<any>, prefix: string, output?: URLSearchParams) {
	output = output || new URLSearchParams;
	let tmp, k, pfx = prefix ? (prefix + '[') : '';

	for (let key in input) {
		tmp = input[key];

		k = pfx + key;
		if (pfx) k += ']';

		// TODO: handle Array separately
		if (tmp && typeof tmp === 'object') {
			encode(tmp, k, output);
		} else if (tmp !== void 0) {
			output.append(k, tmp);
		}
	}

	return output;
}

export function send<T>(method: string, pathname: string, body?: string | Dict<any>): Promise<T|void> {
	const headers: Dict<string> = { Authorization };
	const options: RequestInit = { method, headers };

	if (body != null) {
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.body = typeof body === 'string' ? body : encode(body, '');
	}

	// strip any leading "/" characters
	pathname = pathname.replace(/^[/]+/, '');
	return fetch(`${STRIPE_API}/${pathname}`, options).then(r => {
		if (r.ok) return r.json() as Promise<T>;
	});
}

export namespace Stripe {
	/** unix seconds */
	export type Timestamp = number;

	/** three-letter ISO code, lowercased */
	export type Currency = string;

	export type Metadata = Dict<any>;

	export interface Address {
		/** City, district, suburb, town, or village. */
		city: Nullable<string>;
		/** Two-letter country code (ISO 3166-1 alpha-2). */
		country: Nullable<string>;
		/** Address line 1 (e.g., street, PO Box, or company name). */
		line1: Nullable<string>;
		/** Address line 2 (e.g., apartment, suite, unit, or building). */
		line2: Nullable<string>;
		/** ZIP or postal code. */
		postal_code: Nullable<string>;
		/** State, county, province, or region. */
		state: Nullable<string>;
	}
}
