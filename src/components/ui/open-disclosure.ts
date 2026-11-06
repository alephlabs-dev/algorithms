/**
 * Opens the first `Disclosure` (./disclosure.tsx) inside `root`, if there is
 * one and it's closed. For links into the page from elsewhere, like the scroll
 * hint under the stage.
 */
export const openFirstDisclosure = (root: ParentNode) => {
  const trigger = root.querySelector<HTMLButtonElement>("button[data-disclosure]");
  if (trigger?.getAttribute("aria-expanded") === "false") trigger.click();
};
