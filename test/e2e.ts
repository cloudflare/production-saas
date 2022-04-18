import * as uvu from 'uvu';
import * as httpie from 'httpie';
import { Miniflare } from 'miniflare';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// prepare miniflare ctx
let ctx = new Miniflare({
	packagePath: true,
	envPath: '.env.dev',
	wranglerConfigEnv: 'test',
	wranglerConfigPath: true,
	// rely on "pretest" script
	buildCommand: ''
});

export const setup: uvu.Callback<Context> = async function (context) {
	context.$server ||= await ctx.createServer();
	context.$server!.listen(); // boot w/ free port

	let { port } = context.$server!.address() as AddressInfo;

	context.send = function (m, u, o) {
		let url = new URL(u.toString(), `http://localhost:${port}`);
		return httpie.send(m, url.href, o).catch((err: httpie.Response) => err);
	};
}

export const clean: uvu.Callback<Context> = function (context) {
	if (context.$server) {
		context.$server.close();
		context.$server = undefined;
	}
}

interface Context {
	$server?: Server;
	send: typeof httpie.send;
	// TODO: authorize()
}

export function suite(name: string): uvu.Test<Context> {
	let test = uvu.suite<Context>(name);
	test.before(setup);
	test.after(clean);
	return test;
}

export function describe(
	name: string,
	builder: (it: uvu.Test<Context>) => void
): void {
	let suite = uvu.suite<Context>(name);
	suite.before(setup);
	suite.after(clean);
	builder(suite);
	suite.run();
}
