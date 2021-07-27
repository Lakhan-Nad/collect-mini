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

export enum SupportedFormats {
  email = "email",
  url = "url",
  any = "any",
}

export interface TextConstraints {
  required?: boolean;
  format?: SupportedFormats;
}

export type TextAnswer = string | null;

export const TextQuestion: QuestionConstructor<TextConstraints> = class
  extends BaseQuestion
  implements Question
{
  static defaultConstraints: TextConstraints = {
    required: true,
    format: SupportedFormats.any,
  };

  constructor(
    text: string,
    description?: StringOrNull,
    constraints?: TextConstraints
  ) {
    super(
      QuestionType.Text,
      text,
      description,
      TextQuestion.defaultConstraints
    );

    if (!_.isUndefined(constraints)) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: TextConstraints): void {
    const setConstraints: TextConstraints = _.cloneDeep(this.getConstraints());

    if (!_.isUndefined(constraints.required)) {
      setConstraints.required = constraints.required;
    }

    if (!_.isUndefined(constraints.format)) {
      setConstraints.format = constraints.format;
    }

    super.setConstraints(setConstraints);
  }

  static checkConstraints(question: Question, value: any): boolean {
    const constraints: TextConstraints = question.getConstraints();

    const validation = new Validator(value);

    if (constraints.required) {
      validation.apply(Validator.isRequiredString);
    } else {
      validation.apply(Validator.isNullOrString);
    }

    if (Validator.isString(value)) {
      if (constraints.format === SupportedFormats.email) {
        validation.apply(Validator.isEmail);
      }

      if (constraints.format === SupportedFormats.url) {
        validation.apply(Validator.isURL);
      }
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
    if (obj.type !== QuestionType.Text) {
      throw Error(
        `Invalid Type, expected ${QuestionType.Text} got ${obj.type}`
      );
    }
    return new TextQuestion(obj.text, obj.description, obj.constraints);
  }
};
