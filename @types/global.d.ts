declare type TODO = any;
declare type Nullable<T> = T | null;
declare type Dict<T> = Record<string, T>;

// AKA: Date.now() format
declare type TIMESTAMP = number;

// Do not need these properties on any input
declare type Input<T> = Omit<T, 'uid'|'created_at'|'last_updated'>;

/**
 * VARS/BINDINGS (via wranger.toml)
 */
declare const DATABASE: import('worktop/kv').KV.Namespace;
declare const JWT_SECRET: string;

declare const SENDGRID_TOKEN: string; // API token
declare const SENDGRID_EMAIL: string; // from: email address
declare const SENDGRID_NAME: string; // from: display name
