// Dependencies
import { Router } from 'worktop';
import * as Cache from 'worktop/cache';
import * as CORS from 'worktop/cors';

// Routes
import * as Auth from './routes/auth';
import * as Spaces from './routes/spaces';

const API = new Router;

API.prepare = CORS.preflight({
	origin: '*', // TODO?
	maxage: 86400, // 1 day
	credentials: true,
});

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

Cache.listen(API.run);
