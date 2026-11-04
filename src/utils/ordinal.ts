/** 1 → "1st", 2 → "2nd"… (races have at most four lanes). */
export const ordinal = (n: number) => ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`;
