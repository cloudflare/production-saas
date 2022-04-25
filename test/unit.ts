import * as uvu from 'uvu';

export function describe(
	name: string,
	builder: (it: uvu.Test) => void
): void {
	let suite = uvu.suite(name);
	builder(suite);
	suite.run();
}
