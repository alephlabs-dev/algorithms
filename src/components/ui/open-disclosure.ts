/**
 * Opens the first `Disclosure` (./disclosure.tsx) inside `root`, if there is
 * one and it's closed. For links into the page from elsewhere, like the scroll
 * hint under the stage.
 */
export const openFirstDisclosure = (root: ParentNode) => {
  const details = root.querySelector<HTMLDetailsElement>("details[data-disclosure]");
  if (details && !details.open) details.open = true;
};
