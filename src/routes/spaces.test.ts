import * as assert from 'uvu/assert';
import { define } from '../../test/e2e';

define('GET /spaces', it => {
	it('should return 401 if no user', async ctx => {
		let res = await ctx.send('GET', '/spaces');
		assert.is(res.statusCode, 401);
		assert.equal(res.data, {
			status: 401,
			error: 'Missing Authorization header'
		});
	});
});

define('POST /spaces', it => {
	it('should return 401 if no user', async ctx => {
		let res = await ctx.send('POST', '/spaces');
		assert.is(res.statusCode, 401);
		assert.equal(res.data, {
			status: 401,
			error: 'Missing Authorization header'
		});
	});
});
