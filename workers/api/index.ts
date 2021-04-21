import { Router } from 'worktop';
import * as Cache from 'worktop/cache';

const API = new Router;

Cache.listen(API.run);
