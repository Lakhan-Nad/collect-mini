import { validateJobObject } from "../job";

test("validateJobObject", () => {
  expect(validateJobObject({ name: "" }, ["mail", ""])).not.toBeNull();
  expect(validateJobObject({ name: "2" }, ["mail"])).not.toBeNull();
  expect(validateJobObject({ name: "2" }, ["2"])).toBeNull();
  expect(validateJobObject({ name: "2", params: [] }, ["2"])).not.toBeNull();
  expect(validateJobObject({ name: "2", params: {} }, ["2"])).toBeNull();
  expect(validateJobObject({ name: "2", params: { a: 2 } }, ["2"])).toBeNull();
});
