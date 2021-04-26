// Dependencies
import { Router } from 'worktop';
import * as Cache from 'worktop/cache';
import * as CORS from 'worktop/cors';

// Routes
import * as Auth from './routes/auth';
import * as Space from './routes/space';

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

API.add('GET', '/spaces', Space.list);
API.add('POST', '/spaces', Space.create);
API.add('GET', '/spaces/:suid', Space.show);
API.add('PUT', '/spaces/:suid', Space.update);
API.add('DELETE', '/spaces/:suid', Space.destroy);

Cache.listen(API.run);
