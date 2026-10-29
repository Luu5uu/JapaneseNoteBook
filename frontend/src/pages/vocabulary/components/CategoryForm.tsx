import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "../../../components/Modal";
import { errorMessage } from "../vocabularyApi";
import type { Category } from "../types";
export default function CategoryForm({
  category,
  save,
  close,
}: {
  category?: Category;
  save: (name: string) => Promise<void>;
  close: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await save(name.trim());
      close();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={category ? "Rename category" : "New category"}
      close={close}
      busy={busy}
    >
      <p className="dialog-description">
        Make a place for the words you want to remember.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="category-name">Category name</label>
        <input
          id="category-name"
          autoFocus
          required
          maxLength={255}
          value={name}
          placeholder="e.g. Verbs, Expressions, Lesson 1"
          onChange={(event) => setName(event.target.value)}
          disabled={busy}
        />
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className="primary-button" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : category ? "Save name" : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
