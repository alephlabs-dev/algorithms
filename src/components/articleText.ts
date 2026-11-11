import { localized } from "@/i18n";

/** Words every module's articles share. */
export const articleText = localized({
  en: {
    howItWorks: (title: string) => `How ${title} works`,
    pseudocode: "Pseudocode",
    raceThem: "Race them",
    startRace: "Start a race",
    howRaceWorks: "How the race works",
    learnEach: "Learn each algorithm",
  },
  es: {
    howItWorks: (title) => `Cómo funciona ${title}`,
    pseudocode: "Pseudocódigo",
    raceThem: "Hazlos competir",
    startRace: "Empieza una carrera",
    howRaceWorks: "Cómo funciona la carrera",
    learnEach: "Aprende cada algoritmo",
  },
});
