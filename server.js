import { config } from "dotenv";
config();
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { envVariables } from "./env-loader.js";
import axios from "axios";

installGlobals();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

// Create a request handler for Remix
const remixHandler = createRequestHandler({
  // @ts-ignore
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : () => import("./build/server/index.js"),
});

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny"));

// handle SSR requests
app.all("*", remixHandler);
// Function to make a request to /start-bot
const notifyStart = async () => {
  try {
    await axios.get(`http://localhost:${port}/start-bot`);
    console.log("Requested /start-bot");
  } catch (error) {
    console.error("Error requesting /start-bot:", error);
  }
};

envVariables.parse(process.env);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Express server listening at http://localhost:${port}`);
  await notifyStart();
});
