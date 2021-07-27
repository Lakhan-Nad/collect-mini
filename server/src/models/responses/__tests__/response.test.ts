import { v4 as uuid } from "uuid";

import { Response, ResponseObject } from "../response";
import { validateResponseObject, checkAnswers } from "../helpers";
import { NumberQuestion } from "../../forms/number-question";

describe("response", () => {
  test("from-to-object", () => {
    const obj: ResponseObject = {
      answers: ["1"],
      creationTime: new Date().toISOString(),
      formId: "1",
      owner: "1",
      id: "1",
    };

    const res = Response.fromObject(obj);

    const getObj = res.toObject();

    expect(getObj).toStrictEqual(obj);
  });

  test("validateResponseObject", () => {
    expect(
      validateResponseObject({
        id: "a",
        formId: uuid(),
        owner: uuid(),
        answers: [],
      })
    ).toBeNull();
    expect(
      validateResponseObject(
        {
          id: "a",
          formId: uuid(),
          owner: uuid(),
          answers: [],
        },
        true
      )
    ).not.toBeNull();
  });

  test("checkAnswers", () => {
    const ques1 = new NumberQuestion("1", "", {
      required: true,
    });

    const ques2 = new NumberQuestion("1", "", {
      required: false,
      isInteger: true,
    });

    expect(checkAnswers([ques1, ques2], [])).toBe(false);
    expect(checkAnswers([ques1, ques2], [1])).toBe(false);
    expect(checkAnswers([ques1, ques2], [null, 2])).toBe(false);
    expect(checkAnswers([ques1, ques2], [2.4, 2.5])).toBe(false);
    expect(checkAnswers([ques1, ques2], [2, null])).toBe(true);
    expect(checkAnswers([ques1, ques2], [2.4, 2])).toBe(true);
  });
});
