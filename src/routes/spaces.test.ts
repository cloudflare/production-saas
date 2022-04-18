import { define } from '../../test/e2e';
import * as assert from '../../test/response';

define('GET /spaces', it => {
	it('should return 401 if no user', async ctx => {
		let res = await ctx.send('GET', '/spaces');
		assert.error(res, 401, 'Missing Authorization header');
	});
});

define('POST /spaces', it => {
	it('should return 401 if no user', async ctx => {
		let res = await ctx.send('POST', '/spaces');
		assert.error(res, 401, 'Missing Authorization header');
	});
});
