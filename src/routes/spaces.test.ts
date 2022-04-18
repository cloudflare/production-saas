import * as assert from 'uvu/assert';
import { suite } from '../../test/e2e';

const test = suite('routes.spaces');

test('GET /spaces', async ctx => {
	let res = await ctx.send('GET', '/spaces');
	assert.is(res.statusCode, 401);
	assert.equal(res.data, {
		status: 401,
		error: 'Missing Authorization header'
	});
});

test('POST /spaces', async ctx => {
	let res = await ctx.send('POST', '/spaces');
	assert.is(res.statusCode, 401);
	assert.equal(res.data, {
		status: 401,
		error: 'Missing Authorization header'
	});
});

test.run();
