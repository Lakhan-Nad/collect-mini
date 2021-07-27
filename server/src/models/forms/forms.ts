import { ChoiceQuestion } from "./choice-question";
import { NumberQuestion } from "./number-question";
import {
  StringOrNull,
  Question,
  QuestionObject,
  QuestionType,
} from "./question";
import { TextQuestion } from "./text-question";

import { Job } from "../job";

export interface FormObject {
  id: string;
  name: string;
  owner: string;
  description?: StringOrNull;
  questions?: QuestionObject[];
  jobs?: Job[];
  creationTime: string;
  traceId?: string;
}

export class Form {
  private _id: string;
  private _owner: string;
  private _name: string;
  private _description: StringOrNull;
  private _questions: Question[];
  private _jobs: Job[];
  private _creationTime: string;
  private _traceId: string | undefined;

  constructor(
    id: string,
    owner: string,
    name: string,
    creationTime: string,
    description?: StringOrNull,
    questions?: Question[],
    jobs?: Job[],
    traceId?: string
  ) {
    this._id = id;
    this._owner = owner;
    this._name = name;
    this._description = description ?? null;
    this._questions = questions ?? [];
    this._jobs = jobs ?? [];
    this._creationTime = creationTime;
    this._traceId = traceId;
  }

  get name(): string {
    return this._name;
  }

  set name(v: string) {
    this._name = v;
  }

  set description(v: StringOrNull) {
    this._description = v;
  }

  get description(): StringOrNull {
    return this._description;
  }

  getId(): string {
    return this._id;
  }

  getOwner(): string {
    return this._owner;
  }

  getCreationTime(): string {
    return this._creationTime;
  }

  getQuestions(): Question[] {
    return this._questions;
  }

  addQuestion(question: Question): void {
    this._questions.push(question);
  }

  getJobs(): Job[] {
    return this._jobs;
  }

  getTraceId(): string | undefined {
    return this._traceId;
  }

  toObject(): FormObject {
    return {
      id: this.getId(),
      owner: this.getOwner(),
      description: this.description,
      name: this.name,
      questions: this._questions.map((q) => q.toObject()),
      jobs: this.getJobs(),
      creationTime: this.getCreationTime(),
      traceId: this.getTraceId(),
    };
  }

  static fromObject(obj: FormObject): Form {
    const questions = obj.questions!.map((q) => {
      if (q.type === QuestionType.Choice) {
        return ChoiceQuestion.fromObject(q);
      } else if (q.type === QuestionType.Text) {
        return TextQuestion.fromObject(q);
      } else {
        return NumberQuestion.fromObject(q);
      }
    });

    return new Form(
      obj.id,
      obj.owner,
      obj.name,
      obj.creationTime,
      obj.description,
      questions,
      obj.jobs,
      obj.traceId
    );
  }
}
