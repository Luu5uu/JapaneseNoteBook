import { allLabels } from "./types";

export const maxCustomFields = 100;

export function cleanLabel(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function labelError(name: string, existingNames: string[]) {
  const cleaned = cleanLabel(name);
  const key = cleaned.toLowerCase();
  if (!cleaned || [...cleaned].length > 80) {
    return "Use a label name between 1 and 80 characters.";
  }
  if (["word", ...allLabels].some((label) => label === key)) {
    return "This is a built-in field. Choose it from Add label instead.";
  }
  if (existingNames.some((label) => cleanLabel(label).toLowerCase() === key)) {
    return "This label is already in the entry.";
  }
  return "";
}
