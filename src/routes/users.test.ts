import * as assert from 'uvu/assert';
import { suite } from '../../test/e2e';

const test = suite('routes.users');

test('GET /users', async ctx => {
	let res = await ctx.send('GET', '/users');
	assert.is(res.statusCode, 404);
	assert.equal(res.data, {
		status: 404,
		error: 'Not Found'
	});
});

test('PUT /users', async ctx => {
	let res = await ctx.send('PUT', '/users');
	assert.is(res.statusCode, 404);
	assert.equal(res.data, {
		status: 404,
		error: 'Not Found'
	});
});

test('PUT /users/123', async ctx => {
	let res = await ctx.send('PUT', '/users/123');
	assert.is(res.statusCode, 401);
	assert.equal(res.data, {
		status: 401,
		error: 'Missing Authorization header'
	});
});

test.run();
