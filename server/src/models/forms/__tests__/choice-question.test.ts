import { ChoiceQuestion } from "../choice-question";
import { QuestionType } from "../question";

describe("choice-question", () => {
  test("set-constraints", () => {
    expect(new ChoiceQuestion("some test", null).getConstraints()).toEqual(
      ChoiceQuestion.defaultConstraints
    );
    const question = new ChoiceQuestion("set constraints question", null, {
      maxSelection: 1,
      choices: ["a", "b", "c"],
    });
    const constraints = question.getConstraints();
    question.text = "a new text";
    question.description = "changed";
    expect(question.text).toEqual("a new text");
    expect(question.description).toEqual("changed");
    expect(constraints).toHaveProperty("required");
    expect(constraints.required).toBe(true);
    expect(constraints).toHaveProperty("choices");
    expect(constraints.choices).toHaveLength(3);
    expect(constraints).toHaveProperty("maxSelection");
    expect(constraints.maxSelection).toBeLessThanOrEqual(
      constraints.choices.length
    );
  });

  test("required-false", () => {
    const question = new ChoiceQuestion(
      "this question can select no option",
      null,
      {
        required: false,
        choices: ["a", "b", "c"],
      }
    );
    expect(ChoiceQuestion.checkConstraints(question, [])).toEqual(true);
    const questionRequired = new ChoiceQuestion(
      "this question must select some options",
      null,
      {
        maxSelection: 1,
        choices: ["a", "B"],
        required: true,
      }
    );
    expect(ChoiceQuestion.checkConstraints(questionRequired, [])).toEqual(
      false
    );
  });

  test("option-selected-length", () => {
    const questionMaxNull = new ChoiceQuestion(
      "this question must select minimum option",
      null,
      {
        choices: ["a", "B"],
        maxSelection: null,
      }
    );
    expect(ChoiceQuestion.checkConstraints(questionMaxNull, [])).toEqual(false);
    expect(ChoiceQuestion.checkConstraints(questionMaxNull, "")).toEqual(false);
    expect(
      ChoiceQuestion.checkConstraints(questionMaxNull, ["a", "B"])
    ).toEqual(true);

    const questionMaxSome = new ChoiceQuestion(
      "this question can select max of 2 options",
      null,
      {
        required: false,
        maxSelection: 2,
        choices: ["a", "b", "c"],
      }
    );
    expect(
      ChoiceQuestion.checkConstraints(questionMaxSome, ["a", "b", "c"])
    ).toEqual(false);
    expect(
      ChoiceQuestion.checkConstraints(questionMaxSome, ["a", "c"])
    ).toEqual(true);
  });

  test("options-not-in-choices", () => {
    const question = new ChoiceQuestion(
      "a choice selected is not in choices",
      null,
      {
        choices: ["a", "b", "c", "d"],
      }
    );

    expect(ChoiceQuestion.checkConstraints(question, ["a", "e"])).toEqual(
      false
    );
    expect(ChoiceQuestion.checkConstraints(question, ["a", "b", "c"])).toEqual(
      true
    );
  });

  test("from-to-object", () => {
    const question = new ChoiceQuestion("a question to serialize", null, {
      maxSelection: 3,
      choices: ["a", "b", "f", "ds"],
    });
    const inObject = question.toObject();
    expect(inObject.constraints).toHaveProperty("choices");
    expect(inObject.constraints!.choices).toHaveLength(4);
    expect(question).toStrictEqual(ChoiceQuestion.fromObject(inObject));
    expect(inObject.type).toEqual(question.getType());
    inObject.type = QuestionType.Choice;
    expect(ChoiceQuestion.fromObject(inObject)).toStrictEqual(question);
    expect(() => {
      inObject.type = QuestionType.Number;
      ChoiceQuestion.fromObject(inObject);
    }).toThrow();
  });
});
