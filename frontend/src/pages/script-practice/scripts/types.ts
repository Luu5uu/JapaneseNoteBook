export type ScriptSummary = { id: number; title: string; created_at: string };
export type Role = { id: number; name: string; position: number };
export type Line = {
  id: number;
  role_id: number;
  position: number;
  text: string;
  spoken_text: string | null;
};
export type ScriptDetail = ScriptSummary & { roles: Role[]; lines: Line[] };
export type ScriptInput = {
  title: string;
  roles: { name: string }[];
  lines: { role_index: number; text: string; spoken_text: string | null }[];
};
export type DraftRole = { key: string; name: string };
export type DraftLine = {
  key: string;
  roleKey: string;
  text: string;
  spokenText: string;
};
