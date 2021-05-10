import { send } from '.';
import type { Stripe } from '.';

import type { UserID } from 'lib/models/user';
import type { Limits } from './products';

export interface Customer {
	id: `cus_${string}`;
	object: 'customer';
	balance: number;
	email: string;
	name: Nullable<string>;
	phone: Nullable<string>;
	address: Nullable<Stripe.Address>;
	description: string;
	created: Stripe.Timestamp;
	currency: Stripe.Currency;
	default_source: Nullable<`card_{string}`>;
	delinquent: boolean;
	discount: null; // TODO
	invoice_prefix: string;
	invoice_settings: {
		default_payment_method: Nullable<string>;
		footer: Nullable<string>;
		custom_fields: null | Array<{ name: string, value: string }>;
	};
	livemode: boolean;
	next_invoice_sequence: number;
	preferred_locales: string[];
	tax_exempt: 'none' | 'exempt' | 'reverse';
	shipping: null | {
		name: Nullable<string>;
		phone: Nullable<string>;
		address: Nullable<Stripe.Address>;
	};
	metadata: Limits & {
		userid: UserID;
	};
};

export function list(options?: { email?: string, limit?: number }) {
	return send<Customer[]>('GET', 'customers', options);
}

export function find(id: string) {
	return send<Customer>('GET', `customers/${id}`);
}

export function create(values: Partial<Customer>) {
	return send<Customer>('POST', 'customers', values);
}

export function update(customerid: Customer['id'], values: Partial<Customer>) {
	return send<Customer>('POST', `customers/${customerid}`, values);
}
