import type { ReactNode } from "react";
import { Disclosure } from "./ui/disclosure";

/*
 * What every module's articles (its articles.tsx) are built from, with articleText.ts. Pure (no
 * store, no browser APIs), because the build renders them to static HTML.
 */

/** A link around some words, for texts that put one mid-sentence. */
export type Link = (children: ReactNode) => ReactNode;

/**
 * Two kinds of section. A `Section` is always open: summaries (the at-a-glance
 * table) and navigation (lists of pages, the call to race). An `Explanation`
 * is the longer reading (how it works, pseudocode, why…) and starts closed.
 */
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

export const Explanation = ({ title, children }: { title: string; children: ReactNode }) => (
  <Disclosure title={title}>{children}</Disclosure>
);
