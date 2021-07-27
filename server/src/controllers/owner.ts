import { NextFunction, Request, Response } from "express";
import _ from "lodash";

import { insertOwner } from "../db/owner";
import { getFormByOwner } from "../db/forms";
import { validateOwnerObject } from "../models/owner";
import { getResponsesByOwner } from "../db/responses";

export function addOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name } = req.body;
  const errors = validateOwnerObject({ name });

  if (!_.isNull(errors)) {
    res.status(400).json({ error: errors });
  } else {
    insertOwner({
      name,
    })
      .then((val) => {
        if (!_.isNull(val)) {
          if (val instanceof Error) {
            res.status(400).json({ message: val.message });
          } else {
            res.status(201).json({
              data: val.toObject(),
            });
          }
        } else {
          res.status(500).json({
            error: "Internal Server Error",
            message: "Unable to add the owner",
          });
        }
      })
      .catch(next);
  }
}

export function getOwner(req: Request, res: Response): void {
  res.status(200).json({ data: req.owner.toObject() });
}

export function getForms(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ownerId: string = req.owner.getId();

  getFormByOwner(ownerId)
    .then((forms) => {
      if (!_.isNull(forms)) {
        res.status(200).json({
          data: forms.map((f) => f.toObject()),
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to fetch forms",
        });
      }
    })
    .catch(next);
}

export function getResponses(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ownerId: string = req.owner.getId();

  getResponsesByOwner(ownerId)
    .then((responses) => {
      if (!_.isNull(responses)) {
        res.status(200).json({
          data: responses.map((r) => r.toObject()),
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to fetch responses",
        });
      }
    })
    .catch(next);
}
