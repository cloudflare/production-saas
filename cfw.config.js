// @ts-ignore
const ENV = process.env;

/**
 * @type {import('cfw').Config}
 */
module.exports = {
	entry: 'index.ts',
	profile: 'workers.demo',
	globals: {
		DATABASE: 'KV:802e0f5c830c45d09fcae3f506579341',
		JWT_SECRET: `SECRET:${ENV.JWT_SECRET}`,
		STRIPE_SECRET: `SECRET:${ENV.STRIPE_SECRET}`,
	}
}
