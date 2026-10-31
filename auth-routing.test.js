import test from "node:test";
import assert from "node:assert/strict";
import { resolveReturnPath } from "../src/auth-routing.js";

test("successful sign-in preserves a requested protected route, query, and fragment", () => {
  assert.equal(
    resolveReturnPath("/matches?idea=12#scores"),
    "/matches?idea=12#scores",
  );
  assert.equal(resolveReturnPath("/merge"), "/merge");
});
test("ordinary sign-in goes to the dashboard", () => {
  assert.equal(resolveReturnPath(undefined), "/dashboard");
});
test("authentication pages cannot become redirect loops", () => {
  for (const path of [
    "/login",
    "/login/",
    "/LOGIN",
    "/register",
    "/forgot-password",
    "/reset-password?token=example",
  ])
    assert.equal(resolveReturnPath(path), "/dashboard");
});
test("external and malformed return paths are rejected", () => {
  for (const path of [
    "https://other.example",
    "//other.example",
    "/\\other.example",
    "/merge\n",
    {},
    null,
  ])
    assert.equal(resolveReturnPath(path), "/dashboard");
});
