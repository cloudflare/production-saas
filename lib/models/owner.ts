import * as database from 'lib/utils/database';

import type { Limits } from 'lib/stripe/products';
import type { SpaceID } from './space';
import type { UserID } from './user';

// TODO: Add `Org` type
export type Owner = {
	type: 'user';
	uid: UserID;
}

// Mapping `[type]` to `<value>`
interface Ownership {
	counts: Limits;
	spaces: SpaceID[];
}

export type Content = keyof Ownership;

// Construct the ownership KV document ID
export const format = (type: 'user', uid: UserID) => ({ type, uid }) as Owner;
export const toKID = (owner: Owner, content: Content) => `owners::${owner.type}::${owner.uid}::${content}`;

export async function getCounts(owner: Owner): Promise<Limits> {
	const key = toKID(owner, 'counts');
	const values = await database.read<Limits>(key);
	return { users: 1, spaces: 0, schemas: 0, documents: 0, ...values };
}

export async function setCounts(owner: Owner, values: Limits): Promise<boolean> {
	const key = toKID(owner, 'counts');
	return database.write<Limits>(key, values);
}

export async function sync<T extends Exclude<Content, 'counts'>>(owner: Owner, content: T, value: Ownership[T]): Promise<Limits|void> {
	const key = toKID(owner, content);
	if (!await database.write<Ownership[T]>(key, value)) return;

	const limits = await getCounts(owner);
	limits[content] = value.length;

	if (await setCounts(owner, limits)) {
		return limits;
	}
}
