# Bem-vindo ao repositório do BotAI!

- 📖 [BotAI Docs](https://botai.tecwolf.com.br/docs)
- 📖 [BotAI](https://botai.tecwolf.com.br)

## Development

Run the dev server:

```sh
npm run dev
```

## Deploy padrão

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### Deploy no Fly

Para criar um novo app no Fly, sem fazer o deploy da aplicação logo em seguida:

```sh
flyctl launch --no-deploy
```

Para configurar as variáveis de ambiente no Fly:

```sh
flyctl secrets set APP_URL="0.0.0.0"
flyctl secrets set PORT=3000
flyctl secrets set APP_DOMAIN=""

flyctl secrets set DIRECT_DATABASE_URL=""
flyctl secrets set DATABASE_URL=""
flyctl secrets set PULSE_API_KEY=""
flyctl secrets set MONGO_URI=""

flyctl secrets set SESSION_SECRET=""

flyctl secrets set HCAPTCHA_SITEKEY=""
flyctl secrets set HCAPTCHA_SECRET=""

flyctl secrets set SMTP_HOST=""
flyctl secrets set SMTP_PORT=587
flyctl secrets set MAIL_USER=""
flyctl secrets set MAIL_PASS=""
```

Para fazer o deploy da aplicação no Fly, usando uma build do Docker feita localmente na sua máquina:

```sh
fly deploy --local-only --ha=false
```

Para fazer o deploy da aplicação no Fly, usando uma build do Docker feita na nuvem por uma máquina do Fly:

```sh
fly deploy --ha=false
```

#### Configurando o PostgresSQL

Para alocar um IP público e permitir conexões externas com o PostgresSQL:
[Saiba mais](https://fly.io/docs/postgres/connecting/connecting-external/)

```sh
fly ips allocate-v6 --app <pg-app-name>
```

Para se conectar diretamente ao PostgresSQL no Fly:

```sh
fly pg connect --app <pg-app-name>
```

Ou:

```sh
psql "sslmode=require host=<pg-app-name>.fly.dev dbname=<db-name> user=<username> password=<password>"
```

#### Configurando o Prisma Pulse

Para o Prisma Pulse funcionar corretamente, é necessário configurar o PostgresSQL no Fly:
[Saiba mais](https://www.prisma.io/docs/pulse/database-setup/general-database-instructions)

Verifique se o `wal_level` do PostgresSQL no Fly está configurado para `logical`:

```sh
fly postgres config show --app <pg-app-name>
```

Caso o `wal_level` do PostgresSQL no Fly não esteja configurado para `logical`, faça a alteração:

```sh
fly postgres config update --wal-level logical --app <pg-app-name>
```

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting
experience. You can use whatever css framework you prefer. See
the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
