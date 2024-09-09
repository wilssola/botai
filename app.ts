import { createRequestHandler } from "@remix-run/express";
import { ServerBuild } from "@remix-run/node";
import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import { slowDown } from "express-slow-down";
import helmet from "helmet";
import morgan from "morgan";

/**
 * Creates a Vite development server if the environment is not production.
 */
const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

/**
 * Creates a Remix request handler.
 */
const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () =>
        viteDevServer.ssrLoadModule(
          "virtual:remix/server-build"
        ) as Promise<ServerBuild>
    : ((await import("./build/server")) as unknown as ServerBuild),
});

/**
 * Express application instance.
 */
export const app = express();

/**
 * For security reasons, limit the number of requests per IP in a time window.
 */
app.use(
  rateLimit({
    windowMs: 30 * 60 * 1000,
    limit: 5000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

/**
 * For performance reasons, slow down the response time of requests per IP in a time window.
 */
app.use(
  slowDown({
    windowMs: 60 * 1000,
    delayAfter: 100,
    delayMs: (hits) => hits * 100,
  })
);

/**
 * For security reasons, use helmet to protect the application from Cross-Site Scripting (XSS) and other types of attacks.
 * Helmet is a collection of middleware that helps secure web applications by setting various HTTP headers.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://*.hcaptcha.com",
          "https://*.sentry.io",
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https://*.hcaptcha.com"],
        "connect-src": [
          "'self'",
          "https://*.hcaptcha.com",
          "https://*.sentry.io",
          process.env.NODE_ENV !== "production" ? `ws://localhost:*` : "",
        ],
        "frame-src": ["'self'", "https://*.hcaptcha.com"],
        "worker-src": ["'self'", "blob:"],
        "img-src": ["'self'", "data:", "https://*.gravatar.com"],
      },
    },
  })
);

/**
 * Configure Express to trust the first proxy in the chain of reverse proxies.
 * This is necessary for Express to correctly obtain the client's IP when the application is behind a reverse proxy, such as a load balancer.
 */
app.set("trust proxy", 1);

/**
 * Enable gzip compression for packages sent to the client.
 */
app.use(compression());

/**
 * Disable the "X-Powered-By" header for security reasons.
 * @see http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
 */
app.disable("x-powered-by");

/**
 * Handle asset requests.
 */
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

/**
 * Cache everything else (like favicon.ico) for an hour.
 * You may want to be more aggressive with this caching.
 */
app.use(express.static("build/client", { maxAge: "24h" }));

/**
 * For performance and security reasons, minify the front-end code sent to the client.
 */
app.use(morgan("tiny"));

/**
 * Handle SSR requests.
 */
app.all("*", remixHandler);
