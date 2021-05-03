import * as DB from 'worktop/kv';
import type { KV } from 'worktop/kv';

// TODO(worktop): add expiration settings
export function write<T>(key: string, value: T): Promise<boolean> {
	return DB.write(DATABASE, key, value, true);
}

export function read<T>(key: string): Promise<T|false> {
	return DB.read<T>(DATABASE, key, 'json');
}

export function remove(key: string): Promise<boolean> {
	return DB.remove(DATABASE, key);
}

interface PaginateData<T> {
	done: boolean;
	keys: T;
}

interface PaginateOptions {
	limit?: number;
	raw?: boolean;
}

// NOTE: already in next worktop
type KeyInfo = KV.KeyList['keys'];
export function paginate(prefix: string, options: PaginateOptions & { raw: true }): AsyncGenerator<PaginateData<KeyInfo>>;
export function paginate(prefix: string, options?: PaginateOptions & { raw: false }): AsyncGenerator<PaginateData<string[]>>;
export async function * paginate(prefix: string, options: PaginateOptions = {}): AsyncGenerator<PaginateData<KeyInfo|string[]>> {
	let { limit, raw } = options;
	let cursor: string | undefined;

	while (true) {
		let results = await DATABASE.list({ prefix, limit, cursor });
		cursor = results.cursor;

		yield {
			done: results.list_complete,
			keys: raw ? results.keys : results.keys.map(x => x.name),
		};

		if (results.list_complete) return;
	}
}
