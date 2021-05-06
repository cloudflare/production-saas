import type { UserID } from './user';

// TODO: Add `Org` type
export type Owner = {
	type: 'user';
	uid: UserID;
}

// Construct the ownership KV document ID
export const toKID = (owner: Owner) => `owners::${owner.type}::${owner.uid}`;
