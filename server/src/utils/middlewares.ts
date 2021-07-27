import { NextFunction, Request, Response } from "express";
import _ from "lodash";

import Validator from "./validator";
import {
  requestCount,
  requestSize,
  responseCount,
  responseSize,
  responseTime,
} from "./prometheus";
import { nowTimeMilliS } from "./time";

import { getOwnerById } from "../db/owner";
import { getFormById } from "../db/forms";
import { getResponseById } from "../db/responses";

export function bodyIsObject(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (Validator.isObject(req.body)) {
    next();
  } else {
    res.status(400).json({ error: "Request Body must be a JSON Object" });
  }
}

export function bearerAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authString = req.headers.authorization;

  if (_.isNil(authString)) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const [, id] = authString.split(" ");

  if (!Validator.isUUID(id)) {
    res.status(401).json({ error: "Invalid authorization token format" });
    return;
  }

  getOwnerById(id)
    .then((e) => {
      if (!_.isNull(e)) {
        if (e instanceof Error) {
          res.status(401).json({ error: "Invalid authorization token" });
        } else {
          req.owner = e;
          next();
        }
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to complete authentication",
        });
      }
    })
    .catch(next);
}

export function formOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.form || req.form.getOwner() === req.owner.getId()) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized action" });
  }
}

export function formById(
  req: Request,
  res: Response,
  next: NextFunction,
  formId: string
): void {
  getFormById(formId)
    .then((f) => {
      if (!_.isNull(f)) {
        if (f instanceof Error) {
          res.status(404).json({ error: "Invalid formId" });
        } else {
          req.form = f;
          next();
        }
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to process the form",
        });
      }
    })
    .catch(next);
}

export function responseOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.formResponse || req.formResponse.getOwner() === req.owner.getId()) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized action" });
  }
}

export function responseById(
  req: Request,
  res: Response,
  next: NextFunction,
  responseId: string
): void {
  getResponseById(responseId)
    .then((r) => {
      if (!_.isNull(r)) {
        if (r instanceof Error) {
          res.status(404).json({ error: "Invalid responseId" });
        } else {
          req.formResponse = r;
          next();
        }
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to process the response",
        });
      }
    })
    .catch(next);
}

export function collectPrometheusMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const url = req.originalUrl
    .replace(
      /[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/i,
      "<id>"
    )
    .replace(/[0-9]+/, "<id>");

  const reqSize = Number.parseInt(req.get("content-length") || "0");

  requestCount.inc({ method: req.method, path: url }, 1);
  requestSize.observe({ method: req.method, path: url }, reqSize);

  const entryTime = nowTimeMilliS();

  res.once("finish", () => {
    const endTime = nowTimeMilliS();

    const resSize = Number.parseInt(res.get("content-length") || "0");

    responseCount.inc(
      { method: req.method, path: url, status: res.statusCode },
      1
    );

    responseSize.observe(
      { method: req.method, path: url, status: res.statusCode },
      resSize
    );

    responseTime.observe(
      { method: req.method, path: url, status: res.statusCode },
      endTime - entryTime
    );
  });

  next();
}
