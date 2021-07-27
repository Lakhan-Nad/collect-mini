import { Long } from "mongodb";

import * as helpers from "../helpers";

test("bigIntToLong", () => {
  expect(helpers.bigIntToLong(BigInt(2)).equals(Long.fromNumber(2))).toBe(true);

  expect(
    helpers
      .bigIntToLong(BigInt("1152921504606846976"))
      .equals(Long.fromString("1152921504606846976"))
  ).toBe(true);
});

test("longToBigInt", () => {
  expect(helpers.longToBigInt(Long.fromString("1152921504606846976"))).toBe(
    BigInt(1152921504606846976)
  );
});

test("getComponentsFromLong", () => {
  expect(
    helpers.getComponentsFromLong(Long.fromString("1152921504606846976"))
  ).toStrictEqual([Math.pow(2, 10), 0]);

  expect(
    helpers.getComponentsFromLong(Long.fromString("1152921504606846979"))
  ).toStrictEqual([Math.pow(2, 10), 3]);
});
