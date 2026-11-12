import { languageButtonClass, otherLang } from "./languageButton";
import { Button } from "./ui/button";

/**
 * The exact space of the landing header's theme toggle and language button,
 * empty. The prerendered page shows it until the app, once live, puts the
 * real ones in, so the header's links never shift (#182). Pure: no store.
 */
export const HeaderActionsSpace = () => (
  <>
    {/* As the ThemeToggle's Button. */}
    <Button asChild variant="ghost" size="icon" className="invisible">
      <span aria-hidden />
    </Button>
    <span aria-hidden className={`${languageButtonClass} invisible`}>
      {otherLang}
    </span>
  </>
);
