/** The whole number typed in a field (ASCII digits only, spaces around allowed), or null if it isn't one in min..max. */
export const parseWholeNumber = (text: string, min: number, max: number): number | null => {
  const trimmed = text.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= min && value <= max ? value : null;
};
