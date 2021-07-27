import { v4 as uuid } from "uuid";

import { Form, FormObject } from "../forms";

describe("forms", () => {
  test("from-to-object", () => {
    const obj: FormObject = {
      id: uuid(),
      name: "A",
      owner: uuid(),
      creationTime: new Date().toISOString(),
      description: null,
      jobs: [],
      questions: [],
    };

    const form = Form.fromObject(obj);
    const getObj = form.toObject();

    expect(getObj).toStrictEqual(obj);
  });
});
