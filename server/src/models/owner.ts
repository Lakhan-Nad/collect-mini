import _ from "lodash";

import Validator from "../utils/validator";

export interface OwnerObject {
  name: string;
  id: string;
  creationTime: string;
  traceId?: string;
}

export class Owner {
  private _name: string;
  private _id: string;
  private _creationTime: string;
  private _traceId: string | undefined;

  constructor(
    name: string,
    id: string,
    creationTime: string,
    traceId?: string
  ) {
    this._name = name;
    this._id = id;
    this._creationTime = creationTime;
    this._traceId = traceId;
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getCreationTime(): string {
    return this._creationTime;
  }

  getTraceId(): string | undefined {
    return this._traceId;
  }

  static fromObject(obj: OwnerObject): Owner {
    return new Owner(obj.name, obj.id, obj.creationTime, obj.traceId);
  }

  toObject(): OwnerObject {
    return {
      name: this.getName(),
      id: this.getId(),
      creationTime: this.getCreationTime(),
      traceId: this.getTraceId(),
    };
  }
}

export function validateOwnerObject(
  obj: Partial<OwnerObject>,
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

  if (!_.isString(obj.name) || !obj.name.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
    errors.name = "name must be alphanumeric starting with a alphabet";
  }

  return Object.keys(errors).length === 0 ? null : errors;
}
