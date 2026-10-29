export const labelNames = {
  kanji: "Kanji",
  hiragana: "Hiragana",
  katakana: "Katakana",
  romaji: "Romaji",
  note: "Note",
} as const;

export type Label = keyof typeof labelNames;
export const allLabels = Object.keys(labelNames) as Label[];

export type Category = { id: number; name: string; entry_count: number };
export type CustomField = { label: string; value: string };
export type EntryData = { word: string; custom_fields: CustomField[] } & Record<
  Label,
  string | null
>;
export type Entry = EntryData & {
  id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
};
export type EntryPage = { items: Entry[]; total: number };
export type Template = { labels: Label[]; custom_labels: string[] };

export type Deletion =
  { kind: "category"; item: Category } | { kind: "entry"; item: Entry };
