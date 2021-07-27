declare namespace Express {
  export interface Request {
    owner: import("./models/owner").Owner;
    form?: import("./models/forms/forms").Form;
    formResponse?: import("./models/responses/response").Response;
  }
}
