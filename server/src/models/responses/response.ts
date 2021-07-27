export interface ResponseObject {
  id: string;
  formId: string;
  owner: string;
  answers: any[];
  creationTime: string;
  traceId?: string;
}

export class Response {
  private _id: string;
  private _owner: string;
  private _formId: string;
  private _answers: any[];
  private _creationTime: string;
  private _traceId: string | undefined;

  constructor(
    id: string,
    formId: string,
    owner: string,
    answers: any[],
    creationTime: string,
    traceId?: string
  ) {
    this._id = id;
    this._formId = formId;
    this._owner = owner;
    this._answers = answers;
    this._creationTime = creationTime;
    this._traceId = traceId;
  }

  getId(): string {
    return this._id;
  }

  getOwner(): string {
    return this._owner;
  }

  getFormId(): string {
    return this._formId;
  }

  getAnswers(): any[] {
    return this._answers;
  }

  getCreationTime(): string {
    return this._creationTime;
  }

  getTraceId(): string | undefined {
    return this._traceId;
  }

  toObject(): ResponseObject {
    return {
      id: this.getId(),
      formId: this.getFormId(),
      owner: this.getOwner(),
      answers: this.getAnswers(),
      creationTime: this.getCreationTime(),
      traceId: this.getTraceId(),
    };
  }

  static fromObject(obj: ResponseObject): Response {
    return new Response(
      obj.id,
      obj.formId,
      obj.owner,
      obj.answers,
      obj.creationTime,
      obj.traceId
    );
  }
}

export default Response;
