import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { api, allLabels, labelNames, errorMessage } from "./api";
import type { Category, Entry, EntryData, EntryPage, Label, Template } from "./api";

type IconName = "book" | "plus" | "search" | "grid" | "table" | "edit" | "trash" | "close" | "arrow";
const paths: Record<IconName, string> = {
  book: "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3V4Z",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  table: "M3 4h18v16H3ZM3 10h18M3 15h18M10 4v16",
  edit: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
};
function Icon({ name }: { name: IconName }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Modal({ title, children, close, busy = false }: { title: string; children: ReactNode; close: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close} disabled={busy}><Icon name="close" /></button></div>
    {children}
  </dialog>;
}

const emptyValues = (): Record<Label | "word", string> => ({
  word: "", kanji: "", hiragana: "", katakana: "", romaji: "", note: "",
});

function EntryEditor({ entry, defaultLabels, onSave, onDefault, onDirty, onBusy, editing = false }: {
  entry?: Entry;
  defaultLabels: Label[];
  onSave: (data: EntryData) => Promise<void>;
  onDefault: (labels: Label[]) => Promise<void>;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  editing?: boolean;
}) {
  const [values, setValues] = useState(() => entry
    ? { word: entry.word, ...Object.fromEntries(allLabels.map(label => [label, entry[label] ?? ""])) } as Record<Label | "word", string>
    : emptyValues());
  const [labels, setLabels] = useState<Label[]>(() => entry ? allLabels.filter(label => !!entry[label]) : [...defaultLabels]);
  const [saving, setSaving] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [error, setError] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const wordRef = useRef<HTMLInputElement>(null);
  const idPrefix = editing ? "edit" : "new";

  function change(field: Label | "word", value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    onDirty(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.word.trim() || saving) return;
    setSaving(true); onBusy(true); setError("");
    const data = {
      word: values.word.trim(),
      ...Object.fromEntries(allLabels.map(label => [label, labels.includes(label) ? values[label].trim() || null : null])),
    } as EntryData;
    try {
      await onSave(data);
      onDirty(false);
      if (!editing) {
        setValues(emptyValues()); setLabels([...defaultLabels]);
        setTemplateMessage(""); wordRef.current?.focus();
      }
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); onBusy(false); }
  }

  async function saveDefault() {
    setTemplateSaving(true); onBusy(true); setError(""); setTemplateMessage("");
    try { await onDefault([...labels]); setTemplateMessage("Default layout saved for all categories."); }
    catch (error) { setError(errorMessage(error)); }
    finally { setTemplateSaving(false); onBusy(false); }
  }

  return <form className="entry-form" onSubmit={submit}>
    <fieldset disabled={saving || templateSaving}>
      <label htmlFor={idPrefix + "-word"}>Word <span className="required">*</span></label>
      <input ref={wordRef} autoFocus={editing} id={idPrefix + "-word"} lang="ja" value={values.word} onChange={event => change("word", event.target.value)} placeholder="e.g. 食べる" required maxLength={255} />
      <p className="field-hint">Only Word is required. Add what helps you learn.</p>
      {labels.map(label => <div className="optional-field" key={label}>
        <div className="label-line">
          <label htmlFor={idPrefix + "-" + label}>{labelNames[label]}</label>
          <button type="button" className="remove-label" aria-label={"Remove " + labelNames[label] + " field"} onClick={() => { setLabels(labels.filter(item => item !== label)); onDirty(true); }}><Icon name="close" /></button>
        </div>
        {label === "note"
          ? <textarea id={idPrefix + "-" + label} rows={3} maxLength={10000} value={values[label]} onChange={event => change(label, event.target.value)} placeholder="Meaning, example sentence, or a little reminder…" />
          : <input id={idPrefix + "-" + label} maxLength={1000} value={values[label]} onChange={event => change(label, event.target.value)} placeholder={label === "romaji" ? "e.g. taberu" : label === "hiragana" ? "e.g. たべる" : "Optional"} lang={label === "romaji" ? "en" : "ja"} />}
      </div>)}
      {labels.length < allLabels.length && <label className="add-label-control">
        <span className="sr-only">Add label</span>
        <select aria-label="Add label" value="" onChange={event => {
          if (event.target.value) { setLabels([...labels, event.target.value as Label]); onDirty(true); }
        }}>
          <option value="">+ Add label</option>
          {allLabels.filter(label => !labels.includes(label)).map(label => <option key={label} value={label}>{labelNames[label]}</option>)}
        </select>
      </label>}
      {!editing && <div className="template-controls">
        <button type="button" className="text-button" onClick={saveDefault}>{templateSaving ? "Saving layout…" : "Save layout as default"}</button>
        <button type="button" className="text-button muted" onClick={() => { setLabels([...defaultLabels]); setTemplateMessage(""); onDirty(true); }}>Use default</button>
      </div>}
      {templateMessage && <p className="success-text" role="status">{templateMessage}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      <button type="submit" className="primary-button full-width" disabled={saving || !values.word.trim()}>
        {saving ? "Saving…" : editing ? "Save changes" : "Add word"}{!saving && <Icon name={editing ? "edit" : "plus"} />}
      </button>
    </fieldset>
  </form>;
}

function CategoryEditor({ category, save, close }: { category?: Category; save: (name: string) => Promise<void>; close: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!name.trim() || busy) return;
    setBusy(true); setError("");
    try { await save(name.trim()); close(); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <Modal title={category ? "Rename category" : "New category"} close={close} busy={busy}>
    <p className="dialog-description">Make a place for the words you want to remember.</p>
    <form onSubmit={submit}>
      <label htmlFor="category-name">Category name</label>
      <input id="category-name" autoFocus required maxLength={255} value={name} placeholder="e.g. Verbs, Expressions, Lesson 1" onChange={event => setName(event.target.value)} disabled={busy} />
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="dialog-actions"><button type="button" className="secondary-button" disabled={busy} onClick={close}>Cancel</button><button className="primary-button" disabled={busy || !name.trim()}>{busy ? "Saving…" : category ? "Save name" : "Create category"}</button></div>
    </form>
  </Modal>;
}

type Deletion = { kind: "category"; item: Category } | { kind: "entry"; item: Entry };
const pageSize = 24;

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [defaultLabels, setDefaultLabels] = useState<Label[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [bootAttempt, setBootAttempt] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [categoryDialog, setCategoryDialog] = useState<Category | "new" | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const activeCategory = categories.find(category => category.id === selectedId);
  const allCount = categories.reduce((sum, category) => sum + category.entry_count, 0);

  useEffect(() => {
    let active = true;
    setBooting(true); setBootError("");
    void Promise.all([api<Category[]>("/categories"), api<Template>("/vocabulary/settings/default-template")])
      .then(([items, template]) => {
        if (!active) return;
        setCategories(items); setDefaultLabels(template.labels);
        setSelectedId(previous => items.some(item => item.id === previous) ? previous : items[0]?.id ?? null);
      }).catch(error => { if (active) setBootError(errorMessage(error)); })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, [bootAttempt]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(query); setPage(0); }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (selectedId === null || booting || bootError) { setEntries([]); setTotal(0); return; }
    const controller = new AbortController();
    setLoading(true); setListError(""); setEntries([]);
    void api<EntryPage>(`/categories/${selectedId}/entries?q=${encodeURIComponent(debouncedQuery)}&limit=${pageSize}&offset=${page * pageSize}`, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        if (page > 0 && data.items.length === 0) { setPage(page - 1); return; }
        setEntries(data.items); setTotal(data.total);
      }).catch(error => { if (!controller.signal.aborted) setListError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedId, debouncedQuery, page, revision, booting, bootError]);

  useEffect(() => {
    if (!draftDirty && !editDirty) return;
    function protect(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [draftDirty, editDirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function selectCategory(id: number) {
    if (id === selectedId) return;
    if (draftDirty && !window.confirm("Discard the unsaved entry and switch categories?")) return;
    setDraftDirty(false); setSelectedId(id); setQuery(""); setDebouncedQuery(""); setPage(0);
  }
  function refresh() {
    setRevision(value => value + 1);
    void api<Category[]>("/categories").then(setCategories).catch(error => setListError(errorMessage(error)));
  }
  async function saveTemplate(labels: Label[]) {
    const result = await api<Template>("/vocabulary/settings/default-template", { method: "PUT", body: JSON.stringify({ labels }) });
    setDefaultLabels(result.labels);
  }
  async function addEntry(data: EntryData) {
    if (!activeCategory) return;
    await api<Entry>(`/categories/${activeCategory.id}/entries`, { method: "POST", body: JSON.stringify(data) });
    setPage(0); refresh(); setNotice("Word added to " + activeCategory.name + ".");
  }
  async function saveCategory(name: string) {
    if (categoryDialog === "new") {
      const category = await api<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) });
      setCategories(previous => [...previous, category]);
      if (!draftDirty) { setSelectedId(category.id); setQuery(""); setDebouncedQuery(""); setPage(0); }
      setNotice("Category created.");
    } else if (categoryDialog) {
      const category = await api<Category>(`/categories/${categoryDialog.id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      setCategories(previous => previous.map(item => item.id === category.id ? category : item));
      setNotice("Category renamed.");
    }
  }
  async function confirmDelete() {
    if (!deletion || deleting) return;
    setDeleting(true); setDeleteError("");
    try {
      if (deletion.kind === "category") {
        await api<void>(`/categories/${deletion.item.id}`, { method: "DELETE" });
        const remaining = categories.filter(item => item.id !== deletion.item.id);
        setCategories(remaining); setSelectedId(remaining[0]?.id ?? null); setDraftDirty(false);
        setQuery(""); setDebouncedQuery(""); setPage(0);
        setNotice("Category deleted.");
      } else {
        await api<void>(`/entries/${deletion.item.id}`, { method: "DELETE" });
        refresh(); setNotice("Entry deleted.");
      }
      setDeletion(null);
    } catch (error) { setDeleteError(errorMessage(error)); }
    finally { setDeleting(false); }
  }
  function closeEdit() {
    if (editDirty && !window.confirm("Discard changes to this entry?")) return;
    setEditing(null); setEditDirty(false);
  }
  function entryActions(entry: Entry) {
    return <div className="entry-actions">
      <button className="icon-button" aria-label={"Edit " + entry.word} onClick={() => { setEditing(entry); setEditDirty(false); }}><Icon name="edit" /></button>
      <button className="icon-button danger-icon" aria-label={"Delete " + entry.word} onClick={() => { setDeletion({ kind: "entry", item: entry }); setDeleteError(""); }}><Icon name="trash" /></button>
    </div>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => event.preventDefault()}><span className="brand-icon"><Icon name="book" /></span><span>Japanese<span className="brand-second">NoteBook</span></span></a>
      <p className="sidebar-caption">A home for every word.</p>
      <div className="sidebar-section"><span>YOUR CATEGORIES</span><span>{categories.length}</span></div>
      <nav aria-label="Categories" className="category-nav">
        {categories.map(category => <button key={category.id} disabled={formBusy} className={"category-link " + (selectedId === category.id ? "active" : "")} aria-current={selectedId === category.id ? "page" : undefined} onClick={() => selectCategory(category.id)}>
          <Icon name="book" /><span className="category-name">{category.name}</span><span className="category-count">{category.entry_count}</span>
        </button>)}
      </nav>
      <button className="new-category-button" disabled={booting || !!bootError || formBusy} onClick={() => setCategoryDialog("new")}><Icon name="plus" />New category</button>
      <div className="sidebar-bottom"><div className="notebook-stats"><strong>{allCount}</strong><span>{allCount === 1 ? "word collected" : "words collected"}</span></div><p>Small steps.<br />A growing vocabulary.</p><span className="local-label"><span />Personal notebook</span></div>
    </aside>
    <div className="main-content">
      <header className="topbar"><span>Vocabulary notebook</span><span className="edition">YOUR LEARNING, AT YOUR PACE</span></header>
      {booting ? <div className="page-state" role="status">Opening your notebook…</div>
      : bootError ? <div className="page-state"><h1>Could not open your notebook</h1><p role="alert">{bootError}</p><button className="primary-button" onClick={() => setBootAttempt(value => value + 1)}>Try again</button></div>
      : !activeCategory ? <div className="welcome page-state"><div className="empty-icon"><Icon name="book" /></div><p className="eyebrow">A FRESH PAGE</p><h1>Your words start here.</h1><p>Create a category to start collecting what you learn.</p><button className="primary-button" onClick={() => setCategoryDialog("new")}><Icon name="plus" />Create your first category</button></div>
      : <>
        <section className="workspace-heading">
          <div><p className="eyebrow">YOUR VOCABULARY</p><h1>{activeCategory.name}</h1><p>A little practice. A growing vocabulary.</p></div>
          <div className="heading-actions"><button className="secondary-button" disabled={formBusy} onClick={() => setCategoryDialog(activeCategory)}><Icon name="edit" />Rename</button><button className="icon-button bordered danger-icon" aria-label="Delete category" disabled={formBusy} onClick={() => { setDeletion({ kind: "category", item: activeCategory }); setDeleteError(""); }}><Icon name="trash" /></button></div>
        </section>
        <div className="workspace-grid">
          <section className="entries-section" aria-label="Vocabulary entries">
            <div className="entries-toolbar">
              <div className="search-input"><Icon name="search" /><input aria-label="Search entries" placeholder="Search words, readings, notes…" value={query} maxLength={255} onChange={event => setQuery(event.target.value)} /></div>
              <div className="view-switch" aria-label="Entry view">
                <button aria-label="Card view" aria-pressed={view === "cards"} className={view === "cards" ? "selected" : ""} onClick={() => setView("cards")}><Icon name="grid" /></button>
                <button aria-label="Table view" aria-pressed={view === "table"} className={view === "table" ? "selected" : ""} onClick={() => setView("table")}><Icon name="table" /></button>
              </div>
            </div>
            <div className="entries-meta"><span>{loading ? "Loading…" : `${total} ${total === 1 ? "entry" : "entries"}`}</span><span>Newest first</span></div>
            {listError ? <div className="inline-state"><p role="alert">{listError}</p><button className="secondary-button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>
            : loading ? <div className="loading-entries" role="status"><span className="loading-dot" />Loading your words…</div>
            : entries.length === 0 ? <div className="empty-entries"><div className="empty-icon"><Icon name={debouncedQuery ? "search" : "book"} /></div><h2>{debouncedQuery ? "No matching words" : "A new chapter starts here."}</h2><p>{debouncedQuery ? "Try a different word, reading, or note." : "Add your first word using the entry form. A word is enough to get started."}</p>{debouncedQuery && <button className="text-button" onClick={() => setQuery("")}>Clear search</button>}</div>
            : view === "cards" ? <div className="entry-cards">{entries.map(entry => <article className="entry-card" key={entry.id}>
                <div className="entry-card-top"><span className="entry-marker" /><span className="entry-date">{new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>{entryActions(entry)}</div>
                <h2 lang="ja">{entry.word}</h2>
                <dl>{allLabels.filter(label => entry[label]).map(label => <div key={label} className={"entry-detail " + (label === "note" ? "entry-note" : "")}><dt>{labelNames[label]}</dt><dd lang={["kanji", "hiragana", "katakana"].includes(label) ? "ja" : undefined}>{entry[label]}</dd></div>)}</dl>
              </article>)}</div>
            : <div className="table-scroll"><table><caption className="sr-only">Entries in {activeCategory.name}</caption><thead><tr><th>Word</th>{allLabels.map(label => <th key={label}>{labelNames[label]}</th>)}<th>Actions</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><th scope="row" lang="ja">{entry.word}</th>{allLabels.map(label => <td key={label}>{entry[label] ?? ""}</td>)}<td>{entryActions(entry)}</td></tr>)}</tbody></table></div>}
            {total > pageSize && <div className="pagination"><button className="secondary-button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><button className="secondary-button" disabled={(page + 1) * pageSize >= total || loading} onClick={() => setPage(page + 1)}>Next</button></div>}
          </section>
          <aside className="add-panel" aria-label="Add entry">
            <div className="add-panel-heading"><div><p className="eyebrow">ONE WORD AT A TIME</p><h2>Add an entry</h2></div><span className="panel-plus"><Icon name="plus" /></span></div>
            <EntryEditor key={activeCategory.id} defaultLabels={defaultLabels} onSave={addEntry} onDefault={saveTemplate} onDirty={setDraftDirty} onBusy={setFormBusy} />
          </aside>
        </div>
      </>}
      <footer className="page-footer">Keep a little of what you learn, every day.</footer>
    </div>
    {notice && <div className="toast" role="status"><span className="toast-check">✓</span>{notice}</div>}
    {categoryDialog && <CategoryEditor category={categoryDialog === "new" ? undefined : categoryDialog} save={saveCategory} close={() => setCategoryDialog(null)} />}
    {editing && <Modal title="Edit entry" close={closeEdit} busy={editBusy}>
      <EntryEditor editing entry={editing} defaultLabels={defaultLabels} onDirty={setEditDirty} onBusy={setEditBusy} onDefault={saveTemplate} onSave={async data => {
        await api<Entry>(`/entries/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) });
        setEditing(null); setEditDirty(false); refresh(); setNotice("Entry updated.");
      }} />
    </Modal>}
    {deletion && <Modal title={deletion.kind === "category" ? "Delete category?" : "Delete entry?"} busy={deleting} close={() => setDeletion(null)}>
      <p className="delete-description">{deletion.kind === "category"
        ? `This will permanently delete “${deletion.item.name}” and its ${deletion.item.entry_count} ${deletion.item.entry_count === 1 ? "entry" : "entries"}. Entries in other categories will stay in your notebook.`
        : `“${deletion.item.word}” will be permanently removed from this category.`}</p>
      {deletion.kind === "category" && draftDirty && <p className="field-hint">Your unsaved entry in this category will also be discarded.</p>}
      {deleteError && <p className="error-message" role="alert">{deleteError}</p>}
      <div className="dialog-actions"><button className="secondary-button" disabled={deleting} onClick={() => setDeletion(null)}>Cancel</button><button className="danger-button" disabled={deleting} onClick={confirmDelete}>{deleting ? "Deleting…" : deletion.kind === "category" ? "Delete category" : "Delete entry"}</button></div>
    </Modal>}
  </div>;
}
