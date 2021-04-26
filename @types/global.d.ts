declare type TODO = any;
declare type Nullable<T> = T | null;

// AKA: Date.now() format
declare type TIMESTAMP = number;

// Do not need these properties on any input
declare type Input<T> = Omit<T, 'uid'|'created_at'|'last_updated'>;

/**
 * VARS/BINDINGS (via wranger.toml)
 */
declare const DATABASE: import('worktop/kv').KV.Namespace;
declare const JWT_SECRET: string;