import * as assert from 'uvu/assert';
import { describe } from '../../../test/unit';
import * as paging from './paging';

describe('parse', it => {
	it('should return default values', () => {
		let input = new URLSearchParams;
		let output = paging.parse(input);
		assert.equal(output, {
			limit: 50,
			page: 1,
		});
	});

	it('limit :: should not exceed 50', () => {
		let input = new URLSearchParams('limit=100');
		let output = paging.parse(input);
		assert.is(output.limit, 50);
	});

	it('should reject NaN values', () => {
		let input = new URLSearchParams('limit=foo&page=bar');
		let output = paging.parse(input);
		assert.is(output.limit, 50);
		assert.is(output.page, 1);
	});

	it('should respect positive input values', () => {
		let input = new URLSearchParams('limit=10&page=5');
		let output = paging.parse(input);
		assert.is(output.limit, 10);
		assert.is(output.page, 5);

		input = new URLSearchParams('limit=1&page=3');
		output = paging.parse(input);
		assert.is(output.limit, 1);
		assert.is(output.page, 3);
	});

	it('should ignore zero input values', () => {
		let input = new URLSearchParams('limit=0&page0');
		let output = paging.parse(input);
		assert.is(output.limit, 50);
		assert.is(output.page, 1);
	});

	it('should ignore negative values', () => {
		let input = new URLSearchParams('limit=-20&page=-3');
		let output = paging.parse(input);
		assert.is(output.limit, 50);
		assert.is(output.page, 1);

		input = new URLSearchParams('limit=-1&page=-1');
		output = paging.parse(input);
		assert.is(output.limit, 50);
		assert.is(output.page, 1);
	});
});
