import { localized } from "@/i18n";

/** 1 → "1st", 2 → "2nd"… in Spanish "1.º", "2.º" (races have at most four lanes). */
export const ordinal = localized({
  en: (n: number) => ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`,
  es: (n) => `${n}.º`,
});
