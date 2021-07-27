import _ from "lodash";

import { NumberConstraints, NumberQuestion } from "./number-question";
import { ChoiceConstraints, ChoiceQuestion } from "./choice-question";
import {
  SupportedFormats,
  TextConstraints,
  TextQuestion,
} from "./text-question";
import { QuestionType, QuestionObject, Question } from "./question";
import { FormObject } from "./forms";

import { ALLOWED_JOBS } from "../../config";
import Validator from "../../utils/validator";
import { validateJobObject } from "../job";

export function validateQuestionObject(
  obj: Partial<QuestionObject>
): string[] | null {
  const errors = [];

  if (_.isNil(obj.type) || !Object.values(QuestionType).includes(obj.type)) {
    errors.push("Invalid Question Type");
  }

  if (!Validator.isRequiredString(obj.text)) {
    errors.push("The text should be a valid string");
  }

  if (!Validator.isNullOrString(obj.description)) {
    errors.push("The description should be a valid string or null");
  }

  if (!_.isUndefined(obj.constraints)) {
    if (!Validator.isObject(obj.constraints)) {
      errors.push("The constraints must be a object");
    } else {
      if (!Validator.isBoolOrUndefined(obj.constraints?.required)) {
        errors.push("Value of constraints.required must be a boolen");
      }

      if (obj.type === QuestionType.Choice) {
        const constraints: ChoiceConstraints = obj.constraints;
        const choicesValidation = new Validator(constraints.choices);

        choicesValidation.apply(Validator.isRequired);
        choicesValidation.apply(Validator.isStringArray);
        choicesValidation.apply(Validator.isNotHavingDuplicates);

        if (!choicesValidation.validate()) {
          errors.push(
            "Value of constraints.choices must be a array of non-empty strings without duplicates"
          );
        }

        if (!Validator.isNilOrPositiveInteger(constraints.maxSelection)) {
          errors.push(
            "Value of constraints.maxSelection must be a positive integer or null"
          );
        }
      } else if (obj.type === QuestionType.Text) {
        const constraints: TextConstraints = obj.constraints;

        if (
          !_.isUndefined(constraints.format) &&
          !(
            Validator.isRequiredString(constraints.format) &&
            Object.values(SupportedFormats).includes(constraints.format)
          )
        ) {
          errors.push(
            "Value of constraints.format must be a either of supported values"
          );
        }
      } else {
        const constraints: NumberConstraints = obj.constraints;

        if (!Validator.isBoolOrUndefined(constraints.isInteger)) {
          errors.push("Value of constraints.isInteger must be a boolen");
        }

        if (!Validator.isNilOrNumber(constraints.maximum)) {
          errors.push("Value of constraints.maximum must be a number or null");
        }

        if (!Validator.isNilOrNumber(constraints.minimum)) {
          errors.push("Value of constraints.minimum must be a number or null");
        }

        if (
          Validator.isNumeric(constraints.maximum) &&
          Validator.isNumeric(constraints.minimum)
        ) {
          if (constraints.maximum! < constraints.minimum!) {
            errors.push(
              "Value of constraints.minimum must be a less or equal to constraints.maximum"
            );
          }
        }
      }
    }
  }

  return errors.length > 0 ? errors : null;
}

export function validateFormObject(
  obj: Partial<FormObject>,
  checkId = false,
  checkCreationTime = false
): any {
  const errors: any = {};

  if (checkId) {
    if (!Validator.isUUID(obj.id)) {
      errors.id = "id must be a valid uuid";
    }
  }

  if (checkCreationTime) {
    if (!Validator.isISODateString(obj.creationTime)) {
      errors.creationTime = "creationTime must be valid ISO-8601 string";
    }
  }

  if (!Validator.isRequiredString(obj.name)) {
    errors.name = "name must be valid string";
  }

  if (!Validator.isUUID(obj.owner)) {
    errors.owner = "owner must be a valid uuid";
  }

  if (!Validator.isNullOrString(obj.description)) {
    errors.description = "description must be a valid string or null";
  }

  if (!_.isUndefined(obj.questions)) {
    if (!_.isArray(obj.questions)) {
      errors.questions = "questions must be array of questions";
    } else {
      errors.questions = [];

      for (const qObj of obj.questions) {
        errors.questions.push(validateQuestionObject(qObj));
      }

      if (_.every(errors.questions, _.isNull)) {
        delete errors.questions;
      }
    }
  }

  if (!_.isUndefined(obj.jobs)) {
    if (!_.isArray(obj.jobs)) {
      errors.jobs =
        "jobs must be array of objects with name and optional params";
    } else {
      errors.jobs = [];

      for (const jObj of obj.jobs) {
        errors.jobs.push(validateJobObject(jObj, ALLOWED_JOBS));
      }

      if (_.every(errors.jobs, _.isNull)) {
        delete errors.jobs;
      }
    }
  }

  return Object.keys(errors).length === 0 ? null : errors;
}

export function checkConstraints(question: Question, value: any): boolean {
  if (question.getType() === QuestionType.Choice) {
    return ChoiceQuestion.checkConstraints(question, value);
  } else if (question.getType() === QuestionType.Text) {
    return TextQuestion.checkConstraints(question, value);
  } else {
    return NumberQuestion.checkConstraints(question, value);
  }
}
