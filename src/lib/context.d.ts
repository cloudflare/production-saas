import type * as worktop from 'worktop';
import type { KV } from 'worktop/cfw.kv';

import type { Schema, SchemaID } from 'lib/models/schema';
import type { Space, SpaceID } from 'lib/models/space';
import type { User, UserID } from 'lib/models/user';
import type { Doc, DocID } from 'lib/models/doc';

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

	// mutable values
	document?: Doc;
	schema?: Schema;
	space?: Space;
	user?: User;

	bindings: {
		JWT_SECRET: string;
		STRIPE_SECRET: string;
		DATABASE: KV.Namespace;
		SENDGRID_NAME: string;
		SENDGRID_TOKEN: string;
		SENDGRID_EMAIL: string;
	}
}
