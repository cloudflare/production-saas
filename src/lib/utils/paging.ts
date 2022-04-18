/**
 * Parse the pagination URL query parameter(s)
 * @param input The incoming `req.query` values
 */
export function parse(input: URLSearchParams) {
	let query = Object.fromEntries(input);

	let limit = +query.limit || 50;
	limit = limit < 0 ? 50 : Math.min(limit, 50);

	let page = +query.page || 1;
	page = page < 0 ? 1 : Math.max(page, 1);

	return { limit, page };
}
