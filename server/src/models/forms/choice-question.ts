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

export interface ChoiceConstraints {
  required?: boolean;
  maxSelection?: number | null;
  choices?: string[];
}

export type ChoiceAnswer = string[];

export const ChoiceQuestion: QuestionConstructor<ChoiceConstraints> = class
  extends BaseQuestion
  implements Question
{
  static defaultConstraints: ChoiceConstraints = {
    required: true,
    maxSelection: null,
    choices: [],
  };

  constructor(
    text: string,
    description?: StringOrNull,
    constraints?: ChoiceConstraints
  ) {
    super(
      QuestionType.Choice,
      text,
      description,
      ChoiceQuestion.defaultConstraints
    );

    if (!_.isUndefined(constraints)) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: ChoiceConstraints): void {
    const setConstraints: ChoiceConstraints = _.cloneDeep(
      this.getConstraints()
    );

    if (!_.isUndefined(constraints.required)) {
      setConstraints.required = constraints.required;
    }

    if (!_.isUndefined(constraints.choices)) {
      setConstraints.choices = constraints.choices;
    }

    if (!_.isUndefined(constraints.maxSelection)) {
      setConstraints.maxSelection = _.isNull(constraints.maxSelection)
        ? null
        : constraints.maxSelection;
    }

    super.setConstraints(setConstraints);
  }

  static checkConstraints(question: Question, value: any): boolean {
    const constraints: ChoiceConstraints = question.getConstraints();

    const validation = new Validator(value);

    validation.apply(
      Validator.isArray,
      (val) =>
        Validator.isRequiredString(val) && constraints.choices!.includes(val)
    );

    if (constraints.required) {
      validation.apply(Validator.isRequiredArray);
    }

    validation.apply(Validator.isNotHavingDuplicates);
    validation.apply(Validator.isArraySizeMaximum, constraints.maxSelection);

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
    if (obj.type !== QuestionType.Choice) {
      throw Error(
        `Invalid Type, expected ${QuestionType.Choice} got ${obj.type}`
      );
    }
    return new ChoiceQuestion(obj.text, obj.description, obj.constraints);
  }
};
