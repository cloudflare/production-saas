// Dependencies
import { Router, compose } from 'worktop';
import * as Cache from 'worktop/cfw.cache';
import * as CORS from 'worktop/cors';
import { toError } from 'lib/utils';
import * as cfw from 'worktop/cfw';

// Routes
import * as Auth from './routes/auth';
import * as Users from './routes/users';
import * as Schemas from './routes/schemas';
import * as Documents from './routes/docs';
import * as Spaces from './routes/spaces';

// Context / App Environment
import type { Context } from './lib/context';

const API = new Router<Context>();

API.prepare = compose(
	Cache.sync(),
	CORS.preflight({
		origin: '*', // TODO?
		maxage: 86400, // 1 day
		credentials: true,
	}),
);

API.onerror = function (req, context) {
	let { error, status=500 } = context;
	return toError(status, error);
}

API.add('POST', '/auth/login', Auth.login);
API.add('POST', '/auth/register', Auth.register);
API.add('POST', '/auth/refresh', Auth.refresh);
API.add('POST', '/auth/forgot', Auth.forgot);
API.add('POST', '/auth/reset', Auth.reset);

API.add('GET', '/spaces', Spaces.list);
API.add('POST', '/spaces', Spaces.create);
API.add('GET', '/spaces/:spaceid', Spaces.show);
API.add('PUT', '/spaces/:spaceid', Spaces.update);
API.add('DELETE', '/spaces/:spaceid', Spaces.destroy);

API.add('GET', '/spaces/:spaceid/documents', Documents.list);
API.add('POST', '/spaces/:spaceid/documents', Documents.create);
API.add('GET', '/spaces/:spaceid/documents/:docid', Documents.show);
API.add('PUT', '/spaces/:spaceid/documents/:docid', Documents.update);
API.add('DELETE', '/spaces/:spaceid/documents/:docid', Documents.destroy);

API.add('GET', '/spaces/:spaceid/schemas', Schemas.list);
API.add('POST', '/spaces/:spaceid/schemas', Schemas.create);
API.add('GET', '/spaces/:spaceid/schemas/:schemaid', Schemas.show);
API.add('PUT', '/spaces/:spaceid/schemas/:schemaid', Schemas.update);
API.add('DELETE', '/spaces/:spaceid/schemas/:schemaid', Schemas.destroy);

API.add('PUT', '/users/:userid', Users.update);

// init: Service Worker
// TODO: Migrate to Module Worker
cfw.listen(API.run);
