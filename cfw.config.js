// @ts-ignore - @types/node
const ENV = process.env;

/**
 * @type {import('cfw').Config}
 */
const shared = {
	entry: 'index.ts',
	profile: 'workers.demo',
	module: true,
	globals: {
		DATABASE: 'KV:802e0f5c830c45d09fcae3f506579341',
		JWT_SECRET: `SECRET:${ENV.JWT_SECRET}`,
		STRIPE_SECRET: `SECRET:${ENV.STRIPE_SECRET}`,
		SENDGRID_TOKEN: `SECRET:${ENV.SENDGRID_TOKEN}`,
		SENDGRID_EMAIL: 'ENV:demo@ley.dev',
		SENDGRID_NAME: 'ENV:DEMO CMS',
	}
}

module.exports = shared;
