export type StringOrNull = string | null;

export enum QuestionType {
  Text = "text",
  Number = "number",
  Choice = "choice",
}

export type Constraints = {
  [key: string]: any;
};

export interface QuestionObject {
  type: QuestionType;
  text: string;
  description?: StringOrNull;
  constraints?: Constraints;
}

export interface Question {
  text: string;
  description: StringOrNull;
  getType: () => QuestionType;
  getConstraints: () => Constraints;
  setConstraints: (constraints: Constraints) => void;
  toObject: () => QuestionObject;
}

export interface QuestionConstructor<C extends Constraints, T = Question> {
  new (text: string, description?: StringOrNull, constraints?: C): T;
  defaultConstraints: C;
  checkConstraints: (question: T, value: any) => boolean;
  fromObject: (obj: QuestionObject) => Question;
}

export abstract class BaseQuestion {
  private _text: string;
  private _description: StringOrNull;
  private _type: QuestionType;
  private _constraints: Constraints;

  constructor(
    type: QuestionType,
    text: string,
    description?: StringOrNull,
    constraints?: Constraints
  ) {
    this._text = text;
    this._description = description ?? null;
    this._constraints = constraints ?? {};
    this._type = type;
  }

  get text(): string {
    return this._text;
  }

  set text(v: string) {
    this._text = v;
  }

  set description(v: StringOrNull) {
    this._description = v;
  }

  get description(): StringOrNull {
    return this._description;
  }

  getType(): QuestionType {
    return this._type;
  }

  setConstraints(constraints: Constraints): void {
    this._constraints = constraints;
  }

  getConstraints(): Constraints {
    return this._constraints;
  }
}
