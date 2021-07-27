import http from "http";

import express, { Request, Response, NextFunction } from "express";

import FormRouter from "./routes/forms";
import OwnerRouter from "./routes/owner";
import ResponseRouer from "./routes/responses";
import { ALLOWED_JOBS } from "./config";
import logger from "./logger";
import { SERVER_CONTEXT, ServerExtension } from "./utils/server";
import { collectPrometheusMetrics } from "./utils/middlewares";
import { register } from "./utils/prometheus";

const app = express();

app.enable("case sensitive routing");
app.disable("strict routing");
app.enable("trust proxy");
app.disable("x-powered-by");

app.use(collectPrometheusMetrics);

app.use("/forms", FormRouter);
app.use("/owners", OwnerRouter);
app.use("/responses", ResponseRouer);

app.get("/jobs", (req: Request, res: Response) => {
  void req;

  res.status(200).json({ jobs: ALLOWED_JOBS });
});

app.get("/metrics", async (req: Request, res: Response, next: NextFunction) => {
  void req;

  if (req.get("authorization") !== "Bearer prometheus") {
    res.status(403).send();
    return;
  }

  res.setHeader("content-type", register.contentType);
  register
    .metrics()
    .then((data) => res.send(data))
    .catch(next);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Invalid URL ${req.originalUrl}` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  void next;

  if (err?.expose === true) {
    res
      .status(err?.status || err?.statusCode || 500)
      .json({ message: err?.message || err?.data || "Internal Error" });
    return;
  }

  logger.error(SERVER_CONTEXT, req.originalUrl, err);

  res
    .status(500)
    .json({ error: "Internal Server Error", message: "Unexpected Error" });
});

export const server: ServerExtension = new ServerExtension(
  http.createServer(app)
);
