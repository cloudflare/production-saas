import * as DB from 'worktop/kv';
import type { KeyID } from 'lib/utils/keys';

// TODO(worktop): add expiration settings
export function write<T>(key: KeyID, value: T): Promise<boolean> {
	return DB.write(DATABASE, key, value, true);
}

export function read<T>(key: KeyID): Promise<T|false> {
	return DB.read<T>(DATABASE, key, 'json');
}

export function remove(key: KeyID): Promise<boolean> {
	return DB.remove(DATABASE, key);
}
