import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";

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
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (["POST", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    const host = req.get("x-forwarded-host") || req.get("host");
    if (origin && new URL(origin).host !== host) {
      res.status(403).json({ error: "Cross-origin requests are not allowed." });
      return;
    }
  }
  next();
});

app.use("/api", router);
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ errorType: err instanceof Error ? err.name : "Error" }, "Request failed");
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

export default app;
