// For eslint/house.test.js: a dynamic import of the store, followed by an export-from further down.
export const load = () => import("@/store");
export { localized } from "../../src/i18n";
