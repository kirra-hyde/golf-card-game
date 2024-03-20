import { describe, test, it, expect } from "vitest";
import { add } from "./utilties";

test("add works", function () {
  expect(add(2, 3)).toEqual(5);
});
