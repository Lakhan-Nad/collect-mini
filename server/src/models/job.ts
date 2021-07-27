import _ from "lodash";

export interface Job {
  name: string;
  params?: {
    [k: string]: any;
  };
}

export function validateJobObject(obj: Job, allowedJobs: string[]): any {
  const errors: any = {};

  if (
    !_.isString(obj.name) ||
    obj.name.length === 0 ||
    !allowedJobs.includes(obj.name)
  ) {
    errors.name = "name must be string and one of allowed jobs";
  }

  if (!_.isUndefined(obj.params)) {
    if (!_.isObjectLike(obj.params) || _.isArray(obj.params)) {
      errors.params = "The params must be a object";
    }
  }

  return Object.keys(errors).length === 0 ? null : errors;
}
