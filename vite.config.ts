import { sentryVitePlugin } from "@sentry/vite-plugin";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "wilssola",
      project: "botai-app",
    }),
  ],

  build: {
    sourcemap: true,
    target: "esnext",
  },

  server: {
    proxy: {
      "/sse.**": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            res.on("close", () => {
              if (!res.writableEnded) {
                proxyReq.destroy();
              }
            });
          });
        },
      },
    },
  },
});
