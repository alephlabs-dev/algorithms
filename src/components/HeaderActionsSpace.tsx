import { lang } from "@/i18n";
import { Button } from "./ui/button";

/** The LanguageButton's look (src/components/LanguageSwitch.tsx), shared so its space here is exact. */
export const languageButton =
  "tap-target relative grid h-9 min-w-9 place-items-center rounded-full px-2 font-mono text-xs font-semibold uppercase text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/**
 * The exact space of the landing header's theme toggle and language button,
 * empty. The prerendered page shows it until the app, once live, puts the
 * real ones in, so the header's links never shift (#182). Pure: no store.
 */
export const HeaderActionsSpace = () => (
  <>
    <Button asChild variant="ghost" size="icon" className="invisible">
      <span aria-hidden />
    </Button>
    <span aria-hidden className={`${languageButton} invisible`}>
      {lang === "en" ? "es" : "en"}
    </span>
  </>
);
