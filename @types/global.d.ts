declare type TODO = any;
declare type Nullable<T> = T | null;

// AKA: Date.now() format
declare type TIMESTAMP = number;

// Do not need these properties on any input
declare type Input<T> = Omit<T, 'uid'|'created_at'|'last_updated'>;

declare const DATABASE: import('worktop/kv').KV.Namespace;
