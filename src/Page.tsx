import type { ReactNode } from "react";
import { About } from "./components/About";
import { Landing } from "./components/Landing/Landing";
import { href, type Route } from "./routes";

type Props = {
  route: Route;
  /** In the app, links switch pages without reloading; in prerendered HTML they're plain links. */
  onNavigate?: (route: Route) => void;
  /** The visualizer. Empty in the prerender and on the client's first render. */
  stage?: ReactNode;
  /** The landing header's extra controls (theme, language), which need the app around them. */
  actions?: ReactNode;
  /** Client-only pieces that render nothing of their own (screen sync, analytics). */
  client?: ReactNode;
};

/**
 * Everything in #root, for both the prerender (src/seo/render.tsx) and the app
 * (src/Root.tsx). Both must render the same tree, so the app hydrates the
 * prerendered HTML instead of replacing it (#140). Pure: no store and no
 * browser APIs. Whatever needs them comes in through the slots, which the app
 * fills only after hydration.
 */
export const Page = ({ route, onNavigate, stage, actions, client }: Props) => (
  <>
    {route.page === "home" ? (
      <Landing onNavigate={onNavigate} actions={actions} />
    ) : (
      <>
        <div id="stage" className="min-h-dvh">
          {stage}
        </div>
        {/* Below the stage: the page's written content. Keyed by page, so each page's explanations start closed. */}
        <About key={href(route)} route={route} onNavigate={onNavigate} />
      </>
    )}
    {client}
  </>
);
