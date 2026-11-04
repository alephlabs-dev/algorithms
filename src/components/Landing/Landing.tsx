import type { ReactNode } from "react";
import { modules } from "@/consts/modules";
import type { Route } from "@/routes";
import { cn } from "@/utils/cn";
import { PageLink } from "../PageLink";
import { HeroDemo } from "./HeroDemo";
import { FourierThumb, GraphThumb, PathThumb, SortingThumb } from "./Thumbnails";

type Props = {
  /** In the app, links switch pages without reloading; in prerendered HTML they're plain links. */
  onNavigate?: (route: Route) => void;
  /** Extra controls for the header (the theme toggle), which need the app around them. */
  actions?: ReactNode;
};

const GITHUB = "https://github.com/alephlabs-dev/algorithms";

const buttonClass =
  "inline-flex h-13 items-center rounded-full px-6 font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

const features = [
  { title: "One step at a time", text: "Play, pause, or scrub back and forth. Every frame can be rebuilt." },
  { title: "The code, lit up", text: "Pseudocode with the running line highlighted, and the step in plain words." },
  { title: "Races", text: "Same input, same clock. See which algorithm really does less work." },
  { title: "Share any run", text: "The link carries the exact array or grid, so others see what you see." },
];

const thumbs: Record<string, ReactNode> = {
  sorting: <SortingThumb className="h-16 w-full" />,
  pathfinding: <PathThumb className="w-full" />,
  graphs: <GraphThumb className="h-20 w-full" />,
  fourier: <FourierThumb className="h-24 w-full" />,
};

/**
 * The front page: what this is, a live search to show it, and an index of
 * the modules. Pure, like the articles, so the build prerenders it whole.
 */
export const Landing = ({ onNavigate, actions }: Props) => {
  const open = modules.filter((m) => m.route);
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-24 px-4 pb-16 text-foreground md:px-8 lg:gap-32">
      <header className="flex flex-wrap items-center justify-between gap-4 pt-5 md:pt-7">
        <PageLink
          to={{ kind: "home" }}
          onNavigate={onNavigate}
          className="flex items-center gap-2.5 rounded-full text-lg font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary font-bold text-background"
          >
            ℵ
          </span>
          Algorithms <span className="hidden font-normal text-foreground/60 sm:inline">by Aleph Labs</span>
        </PageLink>
        <nav aria-label="Modules" className="flex items-center gap-1">
          {open.map((m) => (
            <PageLink
              key={m.id}
              to={m.route!}
              onNavigate={onNavigate}
              className="hidden rounded-full px-4 py-2.5 text-[15px] transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
            >
              {m.title}
            </PageLink>
          ))}
          <a
            href={GITHUB}
            className="rounded-full border border-edge px-4 py-2.5 text-[15px] transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            GitHub
          </a>
          {actions}
        </nav>
      </header>

      <section className="flex flex-wrap items-center gap-12 lg:gap-14">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-7">
          <span className="font-mono text-xs tracking-[0.08em] text-foreground/60 md:text-sm">
            OPEN SOURCE · STEP BY STEP · FREE
          </span>
          <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.03em] md:text-7xl">
            Watch algorithms think.
          </h1>
          <p className="max-w-[34ch] text-lg leading-relaxed text-foreground/80 md:text-xl">
            Every comparison, every cell explored, one step at a time, with the line of code it runs and what it means
            in plain words.
          </p>
          <div className="flex flex-wrap gap-3">
            <PageLink
              to={{ kind: "sorting" }}
              onNavigate={onNavigate}
              className={cn(buttonClass, "bg-foreground text-background hover:bg-foreground/90")}
            >
              Start with sorting
            </PageLink>
            <PageLink
              to={{ kind: "pathfinding" }}
              onNavigate={onNavigate}
              className={cn(buttonClass, "border border-line hover:bg-accent")}
            >
              Try pathfinding
            </PageLink>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_520px]">
          <HeroDemo />
        </div>
      </section>

      <section aria-labelledby="modules" className="flex flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground/80 pb-4">
          <h2 id="modules" className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            Modules
          </h2>
          <span className="font-mono text-xs text-foreground/60">
            {open.length} OPEN · {modules.length - open.length} IN PREPARATION
          </span>
        </div>
        <ol className="flex flex-col">
          {modules.map((m, k) => {
            const number = String(k + 1).padStart(2, "0");
            if (!m.route) {
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-edge py-5 text-foreground/60"
                >
                  <span className="w-10 font-mono text-sm">{number}</span>
                  <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
                    <h3 className="text-xl font-semibold">{m.title}</h3>
                    <p className="text-sm">{m.summary}</p>
                  </div>
                  <span className="rounded-full border border-dashed border-line px-3 py-1 font-mono text-[11px]">
                    IN PREPARATION
                  </span>
                </li>
              );
            }
            return (
              <li key={m.id} className="border-b border-edge">
                <PageLink
                  to={m.route}
                  onNavigate={onNavigate}
                  className="group flex flex-wrap items-center gap-x-8 gap-y-4 py-7 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-10 font-mono text-sm text-primary">{number}</span>
                  <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="text-2xl font-semibold md:text-3xl">{m.title}</h3>
                      <span className="font-mono text-xs text-foreground/60">{m.count}</span>
                    </div>
                    <p className="text-[15px] text-foreground/75">{m.summary}</p>
                  </div>
                  <div className="hidden w-56 shrink-0 sm:block">{thumbs[m.id]}</div>
                  <span className="font-semibold transition-colors group-hover:text-primary">Open →</span>
                </PageLink>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="Features" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, k) => (
          <div key={f.title} className="flex flex-col gap-2.5">
            <span className="font-mono text-sm text-primary">{String(k + 1).padStart(2, "0")}</span>
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="text-[15px] leading-relaxed text-foreground/75">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="flex flex-wrap justify-between gap-4 border-t border-edge pt-6 text-sm text-foreground/60">
        <span>Made by Aleph Labs</span>
        <a href={GITHUB} className="underline decoration-line underline-offset-4 hover:text-foreground">
          Open source on GitHub
        </a>
      </footer>
    </div>
  );
};
