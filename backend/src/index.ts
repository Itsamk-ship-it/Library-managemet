import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, isProd } from "./config/env.js";
import routes from "./routes/index.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use(morgan(isProd ? "combined" : "dev"));

app.use(
  cors({
    origin: env.clientOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  })
);

// Global rate limit across the whole API (in addition to per-route limits).
app.use("/api", rateLimit({ windowSeconds: 60, max: 300, keyPrefix: "global" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n[api] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
