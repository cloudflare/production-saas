/**
 * Parse the pagination URL query parameter(s)
 * @param input The incoming `req.query` values
 */
export function parse(input: URLSearchParams) {
	const query = Object.fromEntries(input);
	return {
		limit: Math.min(+query.limit || 50, 50),
		page: Math.min(+query.page || 1, 1),
	}
}
