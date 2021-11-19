// NOTE: IDs are copied via Stripe Dashboard
// ---

import type { Stripe } from '.';

export interface Product {
	id: `prod_${string}`;
	object: 'product';
	created: Stripe.Timestamp;
	description: Nullable<string>;
	active: boolean;
	name: string;
	livemode: boolean;
	images: string[];
	package_dimensions: null;
	shippable: Nullable<boolean>;
	statement_descriptor: Nullable<string>;
	unit_label: Nullable<string>;
	updated: Nullable<Stripe.Timestamp>;
	url: Nullable<string>;
	metadata: Limits;
}

export interface Limits {
	users: number;
	spaces: number;
	schemas: number;
	documents: number;
}

export const FREE: Partial<Product> = {
	id: 'prod_JQkUZOkysPKJdv',
	name: 'Free Plan',
	metadata: {
		users: 3,
		spaces: 1,
		schemas: 12,
		documents: 1e3
	}
};

export const STARTUP: Partial<Product> = {
	id: 'prod_JQkUSBk5zuAy0E',
	name: 'Startup Plan',
	metadata: {
		users: 10,
		spaces: 5,
		schemas: 48,
		documents: 10e3
	}
};

export const UNLIMITED: Partial<Product> = {
	id: 'prod_JQkVmkIkqYRxKt',
	name: 'Unlimited Plan',
	metadata: {
		users: Infinity,
		spaces: Infinity,
		schemas: Infinity,
		documents: Infinity
	}
};

export const VANITY: Partial<Product> = {
	id: 'prod_JQli56oajMj3ID',
	name: 'Vanity Domain'
};
