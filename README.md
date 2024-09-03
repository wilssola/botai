# Bem-vindo ao repositório do BotAI!

- 📖 [BotAI](https://botai.tecwolf.com.br)
- 📖 [BotAI Docs](https://botai.tecwolf.com.br/docs)

## Modo de Desenvolvimento

Primeiro, instale as dependências:

```sh
npm install
```

Defina todas as variáveis de ambiente em `.env.default` e salve em `.env`.
Depois disso, inicie a aplicação no modo de desenvolvimento:

```sh
npm run dev
```

## Modo de Produção

Inicie a aplicação no modo de produção:

```sh
npm start
```

Agora você precisará escolher um host para subir a aplicação.

Recomendamos o uso do [Fly](https://fly.io/).

## Deploy no Fly

Para criar um novo app no Fly, sem fazer o deploy da aplicação logo em seguida, use o seguinte comando:

```sh
flyctl launch --no-deploy
```

Para configurar as variáveis de ambiente no Fly, faça uso do comando `flyctl secrets set`:

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

Para fazer o deploy da aplicação no Fly, usando uma build do Docker feita localmente na sua máquina, use o comando:

```sh
fly deploy --local-only --ha=false
```

Para fazer o deploy da aplicação no Fly, usando uma build do Docker feita na nuvem por uma máquina do Fly, use o
comando:

```sh
fly deploy --ha=false
```

### Configurando o PostgresSQL [(Saiba mais)](https://fly.io/docs/postgres/connecting/connecting-external/)

Para alocar um IP público e permitir conexões externas com o PostgresSQL, você pode usar o comando
`fly ips allocate-v6`:

```sh
fly ips allocate-v6 --app <pg-app-name>
```

Para se conectar bastar usar a URL no seguinte padrão:

```
DATABASE_URL="postgres://<username>:<password>@<pg-app-name>.fly.dev:5432/<app-name>?sslmode=require"
```

Caso queira se conectar diretamente ao PostgresSQL no Fly, você pode usar o comando `fly pg connect`:

```sh
fly pg connect --app <pg-app-name>
```

Ou, caso tenha o PostgresSQL instalado na sua máquina, você pode se conectar localmente ao PostgresSQL do Fly.
Para isso é necessário rodar um proxy localmente, usando o comando `fly proxy`:

```sh
fly proxy 5432:5432 --app <pg-app-name>
```

E então, você pode se conectar ao PostgresSQL localmente, usando a URL no seguinte padrão ou o comando `psql`:

```
DATABASE_URL="postgres://<username>:<password>@localhost:5432/<app-name>"
psql "sslmode=require host=<pg-app-name>.fly.dev dbname=<db-name> user=<username> password=<password>"
```

### Configurando o Prisma Pulse [(Saiba mais)](https://www.prisma.io/docs/pulse/database-setup/general-database-instructions)

Para o Prisma Pulse funcionar corretamente, é necessário configurar o PostgresSQL no Fly.
Primeiro, verifique se o `wal_level` do PostgresSQL no Fly está configurado para `logical`:

```sh
fly postgres config show --app <pg-app-name>
```

Caso o `wal_level` do PostgresSQL no Fly não esteja configurado para `logical`, faça a alteração:

```sh
fly postgres config update --wal-level logical --app <pg-app-name>
```

### Configurando o Redis [(Saiba mais)](https://fly.io/docs/upstash/redis/)

Para criar um novo Redis no Fly, use o seguinte comando:

```sh
fly redis create
```

Para se conectar bastar usar a URL no seguinte padrão:

```
redis://<user>:<password>@fly-<redis-app-name>.upstash.io:6379
```

Para acessar o Redis localmente, você pode usar o comando `fly proxy`:

```sh
fly redis proxy
```

E então, você pode se conectar ao Redis localmente, usando a URL no seguinte padrão:

```
REDIS_URL="redis://<user>:<password>@localhost:16379"
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
