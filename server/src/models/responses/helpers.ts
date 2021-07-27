import _ from "lodash";

import { ResponseObject } from "./response";

import Validator from "../../utils/validator";
import { checkConstraints } from "../forms/helper";
import { Question } from "../forms/question";

export function validateResponseObject(
  obj: Partial<ResponseObject>,
  checkId = false,
  checkCreationTime = false
): any {
  const errors: any = {};

  if (checkId) {
    if (!Validator.isBigIntString(obj.id)) {
      errors.id = "id must be a valid uuid";
    }
  }

  if (checkCreationTime) {
    if (!Validator.isISODateString(obj.creationTime)) {
      errors.creationTime = "creationTime must be valid ISO-8601 string";
    }
  }

  if (!Validator.isUUID(obj.formId)) {
    errors.formId = "fromId must be valid uuid";
  }

  if (!Validator.isUUID(obj.owner)) {
    errors.owner = "owner must be a valid uuid";
  }

  if (!Validator.isArray(obj.answers, (value) => !_.isUndefined(value))) {
    errors.answers = "answers must be a array";
  }

  return Object.keys(errors).length === 0 ? null : errors;
}

export function checkAnswers(questions: Question[], answers: any[]): boolean {
  if (questions.length !== answers.length) {
    return false;
  }

  return questions.every((q, index) => checkConstraints(q, answers[index]));
}
