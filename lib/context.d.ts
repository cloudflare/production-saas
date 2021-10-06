import type * as worktop from 'worktop';
import type { KV } from 'worktop/kv';

import type { DocID } from 'lib/models/doc';
import type { SchemaID } from 'lib/models/schema';
import type { SpaceID } from 'lib/models/space';
import type { UserID } from 'lib/models/user';

// Readymade `Handler` signature w/ custom types
export type Handler = worktop.Handler<Context, Params>;

// Application Route Params
export interface Params {
	docid?: DocID;
	userid?: UserID;
	spaceid?: SpaceID;
	schemaid?: SchemaID;
}

// Application Context
export interface Context extends worktop.Context {
	params: Params & worktop.Params;

	bindings: {
		JWT_SECRET: string;
		STRIPE_SECRET: string;
		DATABASE: KV.Namespace;
		SENDGRID_NAME: string;
		SENDGRID_TOKEN: string;
		SENDGRID_EMAIL: string;
	}
}
