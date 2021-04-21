import { Router } from 'worktop';
import * as Cache from 'worktop/cache';
import * as CORS from 'worktop/cors';

const API = new Router;

API.prepare = CORS.preflight({
	origin: '*', // TODO?
	maxage: 86400, // 1 day
	credentials: true,
});
Cache.listen(API.run);
