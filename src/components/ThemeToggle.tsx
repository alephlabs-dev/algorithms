import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useStore } from "@/store";
import { Button } from "./ui/button";

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
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};
