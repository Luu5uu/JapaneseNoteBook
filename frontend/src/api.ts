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
export type EntryData = { word: string } & Record<Label, string | null>;
export type Entry = EntryData & {
  id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
};
export type EntryPage = { items: Entry[]; total: number };
export type Template = { labels: Label[] };

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch("/api/v1" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    let message = "Something went wrong. Please try again.";
    if (typeof data.detail === "string") message = data.detail;
    else if (Array.isArray(data.detail)) {
      message = data.detail.map((item: { loc?: string[]; msg: string }) =>
        `${item.loc?.slice(1).join(".") || "Input"}: ${item.msg}`).join(" ");
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") return "The request took too long. Check the backend and try again.";
  if (error instanceof TypeError) return "Cannot reach the notebook. Check that the backend is running.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
