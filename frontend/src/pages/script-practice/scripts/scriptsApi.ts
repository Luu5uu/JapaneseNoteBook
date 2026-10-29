import type { ScriptSummary, ScriptDetail, ScriptInput } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch("/api/v1/scripts" + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg: string }) => item.msg).join(" ")
          : "Unable to load or save this script. Please try again.",
    );
  }
  return response.json();
}

export const listScripts = (offset: number, signal?: AbortSignal) =>
  request<ScriptSummary[]>(`?limit=24&offset=${offset}`, { signal });
export const getScript = (id: number, signal?: AbortSignal) =>
  request<ScriptDetail>(`/${id}`, { signal });
export const createScript = (data: ScriptInput) =>
  request<{ id: number; title: string }>("", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const errorMessage = (error: unknown) =>
  error instanceof TypeError
    ? "Cannot reach the server. Check your connection and try again."
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
