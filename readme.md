# Welcome!

To read about the origin and background of this project please have a look at the announcement on the Cloudflare blog: [An Open-Source CMS on the Cloudflare Stack](https://blog.cloudflare.com/production-saas-intro/)

# Getting started

You will need to have node and npm installed on your machine. Two widely
used tools that can help you with managing both are:
* [Volta](https://volta.sh/)
* [NVM](https://github.com/nvm-sh/nvm)

To install dependencies, run:

> npm install

Make a copy of the template file '.env.example', fill out the values
and rename it '.env.dev'

> cp .env.example .env.dev

For the JWT token field, you will need a long, random string. A
password manager can create one for you. Keep it secret!

An example: 

Ozusn8$LoZFvaVUt9*0H9h*DA2gCsM6UWt&mR0sx6@SyJrO&8q1ebEO6XFcr6&3OgAPEH^SzJEruiN03VJvoq%8tgMYjX5M7AwC939Ll&7QS!KrHlZB#Ln&wO!%im@9*

To run a local development server,
run:

> npm run build

To find all available commands, check the scripts section in the package.json file

# Deployment

If you don't already have a Cloudflare account, please create one here [Cloudflare Signup](https://dash.cloudflare.com/signup)

Please fill out your *account_id* and the *id* of your KV namespace values in the `wrangler.toml` file.
Using Cloudflare's [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) you can deploy this project by running:

> wrangler publish
