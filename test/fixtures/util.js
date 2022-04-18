import { Miniflare } from "miniflare";
import jwt from "jsonwebtoken"
import 'dotenv/config'

function getMiniflare() {
    return new Miniflare({
        // Autoload configuration from `.env`, `package.json` and `wrangler.toml`
        envPath: true,
        packagePath: true,
        wranglerConfigPath: true,
        // We don't want to rebuild our worker for each test, we're already doing
        // it once before we run all tests in package.json, so disable it here.
        // This will override the option in wrangler.toml.
        buildCommand: undefined,
    });
}

function getJwt(uid, salt) {
    return jwt.sign({
        uid: uid, //16 char
        salt: salt,
    }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: 86400 })
}

function getUser(uid, salt, created_at = 0, email = "email", password = "password", stripe_customer = "cus_0", stripe_subscription = "sub_0") {
    return {
        uid, email, created_at, password, salt, stripe: {
            customer: stripe_customer,
            subscription: stripe_subscription
        }
    }
}

export { getMiniflare, getJwt, getUser }