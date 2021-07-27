import { QuestionType } from "../question";
import { SupportedFormats, TextQuestion } from "../text-question";

describe("text-question", () => {
  test("set-constraints", () => {
    const question = new TextQuestion("constraint test", null, {
      required: false,
    });
    const constraintsSet = question.getConstraints();
    expect(constraintsSet).toHaveProperty("required");
    expect(constraintsSet.required).toBe(false);
    expect(constraintsSet).toHaveProperty("format");
    expect(constraintsSet.format).toBe("any");
  });

  test("from-to-object", () => {
    const question = new TextQuestion("new question", null);
    expect(question.toObject().text).toEqual("new question");
    expect(question.toObject().type).toEqual("text");
    expect(question.toObject()).toHaveProperty("constraints");
    expect(TextQuestion.fromObject(question.toObject())).toEqual(question);
    const objectVal = question.toObject();
    objectVal.type = QuestionType.Number;
    expect(() => {
      TextQuestion.fromObject(objectVal);
    }).toThrow();
  });

  test("formats", () => {
    // email format
    const emailQuestion = new TextQuestion("email question", null, {
      format: SupportedFormats.email,
    });
    expect(
      TextQuestion.checkConstraints(emailQuestion, "myemail.32@domain.com")
    ).toEqual(true);
    expect(
      TextQuestion.checkConstraints(emailQuestion, "some.mail.com")
    ).toEqual(false);

    const urlQuestion = new TextQuestion(
      "url question",
      "a question can only hold valid urls",
      {
        format: SupportedFormats.url,
      }
    );

    expect(
      TextQuestion.checkConstraints(urlQuestion, "protocol://domain:port/path")
    ).toEqual(false);

    expect(
      TextQuestion.checkConstraints(urlQuestion, "http://domain:port/path")
    ).toEqual(false);

    expect(
      TextQuestion.checkConstraints(urlQuestion, "http://domain.com:443/path")
    ).toEqual(true);
  });

  test("required", () => {
    const requiredQuestion = new TextQuestion("this que cannot be empty", null);
    expect(TextQuestion.checkConstraints(requiredQuestion, null)).toEqual(
      false
    );
    expect(
      TextQuestion.checkConstraints(requiredQuestion, "nsfnjsnfjsf")
    ).toEqual(true);
    expect(TextQuestion.checkConstraints(requiredQuestion, "HHHHH")).toEqual(
      true
    );

    const notRequired = new TextQuestion(
      "answer for this is not required",
      null,
      {
        required: false,
      }
    );
    expect(TextQuestion.checkConstraints(notRequired, "")).toEqual(true);
    expect(TextQuestion.checkConstraints(notRequired, null)).toEqual(true);
  });
});
