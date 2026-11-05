import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useStore } from "@/store";
import { Button } from "./ui/button";
import { localized } from "@/i18n";

const text = localized({
  en: { switchTo: (theme: "dark" | "light") => `Switch to ${theme} theme` },
  es: { switchTo: (theme) => `Cambiar a tema ${theme === "dark" ? "oscuro" : "claro"}` },
});

/** Switches between the dark stage and the light "blueprint" paper. */
export const ThemeToggle = () => {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={text.switchTo(next)}
      title={text.switchTo(next)}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};
