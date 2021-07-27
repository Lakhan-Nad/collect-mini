import _ from "lodash";

import {
  StringOrNull,
  QuestionType,
  QuestionObject,
  QuestionConstructor,
  Question,
  BaseQuestion,
} from "./question";

import Validator from "../../utils/validator";

export interface NumberConstraints {
  required?: boolean;
  maximum?: number | null;
  minimum?: number | null;
  isInteger?: boolean;
}

export type NumberAnswer = number | null;

export const NumberQuestion: QuestionConstructor<NumberConstraints> = class
  extends BaseQuestion
  implements Question
{
  static defaultConstraints: NumberConstraints = {
    required: true,
    isInteger: false,
    maximum: null,
    minimum: null,
  };

  constructor(
    text: string,
    description?: StringOrNull,
    constraints?: NumberConstraints
  ) {
    super(
      QuestionType.Number,
      text,
      description,
      NumberQuestion.defaultConstraints
    );

    if (!_.isUndefined(constraints)) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: NumberConstraints): void {
    const setConstraints: NumberConstraints = _.cloneDeep(
      this.getConstraints()
    );

    if (!_.isUndefined(constraints.required)) {
      setConstraints.required = constraints.required;
    }

    if (!_.isUndefined(constraints.isInteger)) {
      setConstraints.isInteger = constraints.isInteger;
    }

    if (!_.isUndefined(constraints.maximum)) {
      setConstraints.maximum = _.isNull(constraints.maximum)
        ? null
        : setConstraints.isInteger
        ? _.floor(constraints.maximum)
        : constraints.maximum;
    }

    if (!_.isUndefined(constraints.minimum)) {
      setConstraints.minimum = _.isNull(constraints.minimum)
        ? null
        : setConstraints.isInteger
        ? _.floor(constraints.minimum)
        : constraints.minimum;
    }

    super.setConstraints(setConstraints);
  }

  static checkConstraints(question: Question, value: any): boolean {
    const constraints: NumberConstraints = question.getConstraints();

    const validation = new Validator(value);

    if (constraints.required) {
      validation.apply(Validator.isNumeric, constraints.isInteger);
    } else {
      validation.apply(Validator.isNumberOrNull, constraints.isInteger);
    }

    if (Validator.isNumeric(value, constraints.isInteger)) {
      validation.apply(Validator.isMaximum, constraints.maximum);
      validation.apply(Validator.isMinimum, constraints.minimum);
    }

    return validation.validate();
  }

  toObject(): QuestionObject {
    return {
      type: this.getType(),
      text: this.text,
      description: this.description,
      constraints: this.getConstraints(),
    };
  }

  static fromObject(obj: QuestionObject): Question {
    if (obj.type !== QuestionType.Number) {
      throw Error(
        `Invalid Type, expected ${QuestionType.Number} got ${obj.type}`
      );
    }
    return new NumberQuestion(obj.text, obj.description, obj.constraints);
  }
};
