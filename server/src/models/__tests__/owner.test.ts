import { v4 as uuid } from "uuid";

import { Owner, OwnerObject, validateOwnerObject } from "../owner";

describe("owner", () => {
  test("from-to-object", () => {
    const obj: OwnerObject = {
      id: "1",
      name: "a",
      creationTime: new Date().toString(),
    };

    const owner = Owner.fromObject(obj);

    const getObj = owner.toObject();

    expect(getObj).toStrictEqual(obj);
  });

  test("validateOwnerObject", () => {
    expect(validateOwnerObject({ name: "1" })).not.toBeNull();
    expect(validateOwnerObject({ name: "a", id: "1" })).toBeNull();
    expect(validateOwnerObject({ name: "a1", id: "1" })).toBeNull();
    expect(validateOwnerObject({ name: "a1", id: uuid() }, true)).toBeNull();
    expect(validateOwnerObject({ name: "a1", id: "1" }, true)).not.toBeNull();
    expect(
      validateOwnerObject(
        { name: "a1", id: uuid(), creationTime: "1" },
        true,
        true
      )
    ).not.toBeNull();
    expect(
      validateOwnerObject(
        { name: "a1", id: uuid(), creationTime: new Date().toISOString() },
        true,
        true
      )
    ).toBeNull();
  });
});
