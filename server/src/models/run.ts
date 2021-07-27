import { Form, FormObject } from "./forms/forms";
import { Job } from "./job";
import Response, { ResponseObject } from "./responses/response";

export interface RunObject {
  id: string;
  form: FormObject;
  response: ResponseObject;
  job: Job;
  queueTime: string;
}

export function makeRunObject(
  job: Job,
  form: Form,
  response: Response
): RunObject {
  return {
    id: response.getId() + ":" + job.name,
    job: job,
    queueTime: new Date().toISOString(),
    form: form.toObject(),
    response: response.toObject(),
  };
}
