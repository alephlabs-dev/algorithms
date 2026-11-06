import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import { house } from "./house.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const native = (name) => [{ messageId: "native", data: { name } }];

// The rule itself; src/components/ui/ is let off in eslint.config.js.
tester.run("no-native-controls", house.rules["no-native-controls"], {
  valid: [
    { code: "<TextField label='Value' />" },
    { code: "<Button type='button' />" },
    { code: "<form><label>Value</label></form>" },
  ],
  invalid: [
    { code: "<input />", errors: native("input") },
    { code: "<input type='text' />", errors: native("input") },
    { code: "<input type='number' />", errors: native("input") },
    { code: "<input type='search' />", errors: native("input") },
    { code: "<input type='checkbox' />", errors: native("input") },
    { code: "<input type={kind} />", errors: native("input") },
    { code: "<select />", errors: native("select") },
    { code: "<textarea />", errors: native("textarea") },
  ],
});
