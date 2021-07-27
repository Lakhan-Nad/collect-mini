import { NextFunction, Request, Response } from "express";
import _ from "lodash";

import { validateFormObject } from "../models/forms/helper";
import { insertForm } from "../db/forms";
import { getResponsesByForm, insertResponse } from "../db/responses";
import { checkAnswers } from "../models/responses/helpers";
import { FormObject } from "../models/forms/forms";
import { processRespsonse } from "../workers/producers";
import {
  createRandomId,
  newChildTraceId,
  newRootTraceId,
  recordLocalOperationStart,
  recordLocalOperationStop,
} from "../utils/tracer";
import { nowTimeMicroS } from "../utils/time";

export function addForm(req: Request, res: Response, next: NextFunction): void {
  const formData: FormObject = req.body;

  formData.owner = req.owner.getId();

  const formDataErrors = validateFormObject(formData);

  if (!_.isNull(formDataErrors)) {
    res.status(400).json({ error: formDataErrors });
  } else {
    insertForm(formData)
      .then((val) => {
        if (!_.isNull(val)) {
          res.status(201).json({ data: val.toObject() });
        } else {
          res.status(500).json({
            error: "Internal Server Error",
            message: "Unable to add the form",
          });
        }
      })
      .catch(next);
  }
}

export function getForm(req: Request, res: Response): void {
  res.status(200).json({ data: req.form!.toObject() });
}

export function getFormResponses(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { formId } = req.params;

  getResponsesByForm(formId)
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

export function addResponse(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { formId } = req.params;
  const { responses } = req.body;

  if (!_.isArray(responses)) {
    res
      .status(400)
      .json({ error: "Request body must have responses as an array" });
    return;
  }

  if (!checkAnswers(req.form!.getQuestions(), responses)) {
    res.status(400).json({ error: "Response doesn't satisy form constraints" });
    return;
  }

  const id = createRandomId();
  const rootTraceId = newRootTraceId(id);
  const mongoInsertId = newChildTraceId(rootTraceId);
  const startTime = nowTimeMicroS();

  insertResponse({
    answers: responses,
    formId,
    owner: req.owner.getId(),
    traceId: id,
  })
    .then((value) => {
      if (!_.isNull(value)) {
        recordLocalOperationStart(mongoInsertId, "Insert MongoDB", startTime);
        recordLocalOperationStop(mongoInsertId, nowTimeMicroS());

        res.status(201).json({ data: value.toObject() });
        processRespsonse(req.form!, value);
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Unable to submit the response",
        });
      }
    })
    .catch(next);
}
