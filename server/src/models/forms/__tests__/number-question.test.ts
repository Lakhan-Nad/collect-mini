import { NumberQuestion } from "../number-question";
import { QuestionType } from "../question";

describe("number-question", () => {
  test("set-constraints", () => {
    const question = new NumberQuestion("constraint test", null, {
      minimum: 8.67,
      maximum: 8.68,
      isInteger: true,
    });
    const constraintsSet = question.getConstraints();
    expect(constraintsSet).toHaveProperty("required");
    expect(constraintsSet.required).toBe(true);
    expect(constraintsSet).toHaveProperty("minimum");
    expect(constraintsSet.minimum).toBeCloseTo(8.0001);
  });

  test("valid-number-only", () => {
    const question = new NumberQuestion("enter any number", null);
    expect(NumberQuestion.checkConstraints(question, "")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, "37")).toEqual(false);
  });

  test("is-integer", () => {
    const question = new NumberQuestion(
      "Add any number greater than 2",
      "The question takes input any number greater than value 2",
      {
        isInteger: true,
        required: true,
      }
    );
    expect(NumberQuestion.checkConstraints(question, 373.212)).toBe(false);
    expect(NumberQuestion.checkConstraints(question, "83")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, "24.55")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, 83)).toEqual(true);
  });

  test("number-minimum", () => {
    const question = new NumberQuestion(
      "Add any number greater than 2",
      "The question takes input any number greater than value 2",
      {
        minimum: 5,
        required: true,
      }
    );
    expect(NumberQuestion.checkConstraints(question, 1)).toBe(false);
    expect(NumberQuestion.checkConstraints(question, "83")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, "2.5")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, 5)).toEqual(true);
  });

  test("number-maximum", () => {
    const question = new NumberQuestion(
      "Add any number greater than 2",
      "The question takes input any number greater than value 2",
      {
        maximum: 6,
      }
    );
    expect(NumberQuestion.checkConstraints(question, 373.212)).toBe(false);
    expect(NumberQuestion.checkConstraints(question, "83")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, "2.5")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, 2)).toEqual(true);
    expect(NumberQuestion.checkConstraints(question, 6.0001)).toEqual(false);
  });

  test("question-required", () => {
    const question = new NumberQuestion("this question is not required", null, {
      required: false,
    });
    expect(NumberQuestion.checkConstraints(question, null)).toEqual(true);
    expect(NumberQuestion.checkConstraints(question, undefined)).toEqual(true);
    expect(NumberQuestion.checkConstraints(question, "")).toEqual(false);
    expect(NumberQuestion.checkConstraints(question, 67)).toEqual(true);
  });

  test("question-min-max-null", () => {
    const question = new NumberQuestion("this question is not required", null, {
      required: false,
      maximum: null,
    });
    expect(NumberQuestion.checkConstraints(question, null)).toEqual(true);
    expect(NumberQuestion.checkConstraints(question, 31)).toEqual(true);

    const question2 = new NumberQuestion(
      "this question is not required",
      null,
      {
        minimum: null,
        maximum: 45,
      }
    );
    expect(NumberQuestion.checkConstraints(question2, null)).toEqual(false);
    expect(NumberQuestion.checkConstraints(question2, 31)).toEqual(true);
    expect(NumberQuestion.checkConstraints(question2, 90)).toEqual(false);
  });

  test("from-to-object", () => {
    const question = new NumberQuestion("a question to serialize", null, {
      isInteger: false,
      minimum: 45,
    });
    const inObject = question.toObject();
    expect(inObject.text).toEqual("a question to serialize");
    expect(question).toStrictEqual(NumberQuestion.fromObject(inObject));
    expect(inObject.type).toEqual(question.getType());
    inObject.type = QuestionType.Choice;
    expect(() => {
      NumberQuestion.fromObject(inObject);
    }).toThrow(new Error(`Invalid Type, expected number got choice`));
  });
});
