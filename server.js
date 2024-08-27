import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import { slowDown } from "express-slow-down";
import helmet from "helmet";
import morgan from "morgan";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

// Por questões de segurança, limitar o número de requisições por IP em um intervalo de tempo.
app.use(
  rateLimit({
    windowMs: 30 * 60 * 1000,
    limit: 5000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Por questões de desempenho, retardar o tempo de resposta das requisições por IP em um intervalo de tempo.
app.use(
  slowDown({
    windowMs: 1 * 60 * 1000,
    delayAfter: 100,
    delayMs: (hits) => hits * 100,
  })
);

// Por questões de segurança, definir o uso do helmet para proteger a aplicação de ataques de Cross-Site Scripting (XSS) e outros tipos de ataques.
// O helmet é uma coleção de middleware que ajuda a proteger aplicações web contra ataques comuns web, fazendo uso do Content-Security-Policy (CSP).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://hcaptcha.com",
          "https://*.hcaptcha.com",
        ],

        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://hcaptcha.com",
          "https://*.hcaptcha.com",
        ],

        "connect-src": [
          "'self'",
          "https://hcaptcha.com",
          "https://*.hcaptcha.com",
        ],

        "frame-src": [
          "'self'",
          "https://hcaptcha.com",
          "https://*.hcaptcha.com",
        ],
      },
    },
  })
);

// Configurar o Express para confiar no primeiro proxy na cadeia de proxies reversos.
// Isso é necessário para que o Express possa obter corretamente o IP do cliente quando o aplicativo está atrás de um proxy reverso, por exemplo um balanceador de carga.
app.set("trust proxy", 1);

// Ativar o gzip para compressão de pacotes enviados para o cliente.
app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Handle asset requests.
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "24h" }));

// Por questões, principalmente de desempenho, mas também de segurança, minificar o código front-end enviar para o cliente.
app.use(morgan("tiny"));

// Handle SSR requests.
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
