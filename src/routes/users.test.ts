import * as assert from 'uvu/assert';
import { describe } from '../../test/e2e';

describe('GET /users', it => {
	it('should return 404', async ctx => {
		let res = await ctx.send('GET', '/users');
		assert.is(res.statusCode, 404);
		assert.equal(res.data, {
			status: 404,
			error: 'Not Found'
		});
	});
});

describe('PUT /users', it => {
	it('should return 404', async ctx => {
		let res = await ctx.send('PUT', '/users');
		assert.is(res.statusCode, 404);
		assert.equal(res.data, {
			status: 404,
			error: 'Not Found'
		});
	});
});

describe('PUT /users/123', it => {
	it('should return 401 if no user', async ctx => {
		let res = await ctx.send('PUT', '/users/123');
		assert.is(res.statusCode, 401);
		assert.equal(res.data, {
			status: 401,
			error: 'Missing Authorization header'
		});
	});
});
