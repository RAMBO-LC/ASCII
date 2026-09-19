import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
// Production CORS is restricted to the real frontend origin(s).
// Override with CORS_ORIGINS="https://a.example,https://b.example".
// Local dev keeps working: localhost/127.0.0.1 + origin-less requests
// (curl, same-origin, mobile) are allowed outside production.
const allowedOrigins = (process.env.CORS_ORIGINS ??
  "https://ascii-marg-up-chi.vercel.app")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" &&
        /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("CORS: origin not allowed"));
    },
  }),
);
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
