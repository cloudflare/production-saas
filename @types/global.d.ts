declare type TODO = any;
declare type Nullable<T> = T | null;
declare type Dict<T> = Record<string, T>;

/** @NOTE seconds */
declare type TIMESTAMP = number;

// Do not need these properties on any input
declare type Input<T> = Omit<T, 'uid'|'created_at'|'last_updated'>;

/**
 * VARS/BINDINGS (via wranger.toml)
 */
declare const DATABASE: import('worktop/cfw.kv').KV.Namespace;
declare const STRIPE_SECRET: string;
declare const JWT_SECRET: string;

declare const SENDGRID_TOKEN: string; // API token
declare const SENDGRID_EMAIL: string; // from: email address
declare const SENDGRID_NAME: string; // from: display name

// Add missing TypeScript definitions
// NOTE: Exists in "dom.iterable" but this
//       would bring other many other type errors
//       that cannot live in agreement with "webworker".
interface IterableCopy {
	[Symbol.iterator](): IterableIterator<[string, string]>;
	entries(): IterableIterator<[string, string]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<string>;
}

declare interface Headers extends IterableCopy {
	//
}

declare interface URLSearchParams extends IterableCopy {
	//
}
