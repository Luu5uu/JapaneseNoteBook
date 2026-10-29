import type { Category, Entry, EntryData, EntryPage, Template } from "./types";

// All vocabulary HTTP requests live here. Components call the named functions below.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
      message = data.detail
        .map(
          (item: { loc?: string[]; msg: string }) =>
            `${item.loc?.slice(1).join(".") || "Input"}: ${item.msg}`,
        )
        .join(" ");
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError")
    return "The request took too long. Check the backend and try again.";
  if (error instanceof TypeError)
    return "Cannot reach the notebook. Check that the backend is running.";
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function listCategories() {
  return request<Category[]>("/categories");
}

export function createCategory(name: string) {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameCategory(id: number, name: string) {
  return request<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(id: number) {
  return request<void>(`/categories/${id}`, { method: "DELETE" });
}

export function listEntries(
  categoryId: number,
  query: string,
  limit: number,
  offset: number,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    offset: String(offset),
  });
  return request<EntryPage>(`/categories/${categoryId}/entries?${params}`, {
    signal,
  });
}

export function createEntry(categoryId: number, data: EntryData) {
  return request<Entry>(`/categories/${categoryId}/entries`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEntry(id: number, data: EntryData) {
  return request<Entry>(`/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteEntry(id: number) {
  return request<void>(`/entries/${id}`, { method: "DELETE" });
}

export function getDefaultTemplate() {
  return request<Template>("/vocabulary/settings/default-template");
}

export function saveDefaultTemplate(template: Template) {
  return request<Template>("/vocabulary/settings/default-template", {
    method: "PUT",
    body: JSON.stringify(template),
  });
}
