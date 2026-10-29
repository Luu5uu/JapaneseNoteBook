import { useEffect, useState } from "react";
import Icon from "../../../components/Icon";
import Modal from "../../../components/Modal";
import CategorySidebar from "./CategorySidebar";
import EntryList from "./EntryList";
import EntryForm from "./EntryForm";
import CategoryForm from "../components/CategoryForm";
import DeleteConfirmation from "../components/DeleteConfirmation";
import * as vocabularyApi from "../vocabularyApi";
import { errorMessage } from "../vocabularyApi";
import type { Category, Entry, EntryData, Template, Deletion } from "../types";
import type { Navigate, RegisterGuard } from "../../../navigation";
import "./entries.css";

const pageSize = 24;

type Props = {
  categoryId: number;
  onNavigate: Navigate;
  registerGuard: RegisterGuard;
};

export default function CategoryEntriesPage({
  categoryId,
  onNavigate,
  registerGuard,
}: Props) {
  // Shared data: selecting a category updates both the list and the entry form.
  const [categories, setCategories] = useState<Category[]>([]);
  const selectedId = categoryId;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<Template>({
    labels: [],
    custom_labels: [],
  });
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [bootAttempt, setBootAttempt] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [categoryDialog, setCategoryDialog] = useState<Category | "new" | null>(
    null,
  );
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const activeCategory = categories.find(
    (category) => category.id === selectedId,
  );

  // Keep navigation and the selected category in sync, including browser Back.
  useEffect(() => {
    setQuery("");
    setDebouncedQuery("");
    setPage(0);
    setDraftDirty(false);
    setEditDirty(false);
    setEditing(null);
    setCategoryDialog(null);
    setDeletion(null);
    setNotice("");
  }, [categoryId]);

  useEffect(() => {
    return registerGuard(() => {
      if (formBusy || editBusy || deleting) return false;
      if (!draftDirty && !editDirty) return true;
      return window.confirm("Discard unsaved changes and leave this page?");
    });
  }, [registerGuard, formBusy, editBusy, deleting, draftDirty, editDirty]);

  // Load the notebook when the page opens or the user retries.
  useEffect(() => {
    let active = true;
    setBooting(true);
    setBootError("");
    void Promise.all([
      vocabularyApi.listCategories(),
      vocabularyApi.getDefaultTemplate(),
    ])
      .then(([items, template]) => {
        if (!active) return;
        setCategories(items);
        setDefaultTemplate(template);
      })
      .catch((error) => {
        if (active) setBootError(errorMessage(error));
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, [bootAttempt]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (selectedId === null || booting || bootError) {
      setEntries([]);
      setTotal(0);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setListError("");
    setEntries([]);
    void vocabularyApi
      .listEntries(
        selectedId,
        debouncedQuery,
        pageSize,
        page * pageSize,
        controller.signal,
      )
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && data.items.length === 0) {
          setPage(page - 1);
          return;
        }
        setEntries(data.items);
        setTotal(data.total);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setListError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, debouncedQuery, page, revision, booting, bootError]);

  useEffect(() => {
    if (!draftDirty && !editDirty) return;
    function protect(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [draftDirty, editDirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // User actions update the database, then refresh the displayed data.
  function selectCategory(id: number) {
    if (id !== selectedId) onNavigate("/vocabulary/" + id);
  }
  function refresh() {
    setRevision((value) => value + 1);
    void vocabularyApi
      .listCategories()
      .then(setCategories)
      .catch((error) => setListError(errorMessage(error)));
  }
  async function saveTemplate(template: Template) {
    const result = await vocabularyApi.saveDefaultTemplate(template);
    setDefaultTemplate(result);
  }
  async function addEntry(data: EntryData) {
    if (!activeCategory) return;
    await vocabularyApi.createEntry(activeCategory.id, data);
    setPage(0);
    refresh();
    setNotice("Word added to " + activeCategory.name + ".");
  }
  async function saveCategory(name: string) {
    if (categoryDialog === "new") {
      const category = await vocabularyApi.createCategory(name);
      setCategories((previous) => [...previous, category]);
      if (!draftDirty) {
        onNavigate("/vocabulary/" + category.id);
        setQuery("");
        setDebouncedQuery("");
        setPage(0);
      }
      setNotice("Category created.");
    } else if (categoryDialog) {
      const category = await vocabularyApi.renameCategory(
        categoryDialog.id,
        name,
      );
      setCategories((previous) =>
        previous.map((item) => (item.id === category.id ? category : item)),
      );
      setNotice("Category renamed.");
    }
  }
  async function confirmDelete() {
    if (!deletion || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (deletion.kind === "category") {
        await vocabularyApi.deleteCategory(deletion.item.id);
        const remaining = categories.filter(
          (item) => item.id !== deletion.item.id,
        );
        setCategories(remaining);
        onNavigate("/vocabulary", true);
        setDraftDirty(false);
        setQuery("");
        setDebouncedQuery("");
        setPage(0);
        setNotice("Category deleted.");
      } else {
        await vocabularyApi.deleteEntry(deletion.item.id);
        refresh();
        setNotice("Entry deleted.");
      }
      setDeletion(null);
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  }
  function closeEdit() {
    if (editDirty && !window.confirm("Discard changes to this entry?")) return;
    setEditing(null);
    setEditDirty(false);
  }
  return (
    <div
      className={"app-shell " + (sidebarCollapsed ? "sidebar-collapsed" : "")}
    >
      <CategorySidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onHome={() => onNavigate("/")}
        onOverview={() => onNavigate("/vocabulary")}
        categories={categories}
        selectedId={selectedId}
        busy={formBusy}
        unavailable={booting || !!bootError}
        onSelect={selectCategory}
        onCreate={() => setCategoryDialog("new")}
        hasSelection={!!activeCategory}
        onRename={() => {
          if (activeCategory) {
            setCategoryDialog(activeCategory);
          }
        }}
        onDelete={() => {
          if (activeCategory) {
            setDeletion({ kind: "category", item: activeCategory });
            setDeleteError("");
          }
        }}
      />
      <div className="main-content">
        <header className="topbar">
          <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
            <button onClick={() => onNavigate("/")}>Home</button>
            <span>/</span>
            <button onClick={() => onNavigate("/vocabulary")}>
              Vocabulary
            </button>
            {activeCategory && (
              <>
                <span>/</span>
                <span aria-current="page">{activeCategory.name}</span>
              </>
            )}
          </nav>
          <span className="edition">YOUR LEARNING, AT YOUR PACE</span>
        </header>
        {booting ? (
          <div className="page-state" role="status">
            Opening your notebook…
          </div>
        ) : bootError ? (
          <div className="page-state">
            <h1>Could not open your notebook</h1>
            <p role="alert">{bootError}</p>
            <button
              className="primary-button"
              onClick={() => setBootAttempt((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : !activeCategory ? (
          <div className="welcome page-state">
            <div className="empty-icon">
              <Icon name="book" />
            </div>
            <p className="eyebrow">YOUR COLLECTION</p>
            <h1>Category not found</h1>
            <p>
              This category may have been deleted. Choose another from your
              collection.
            </p>
            <button
              className="primary-button"
              onClick={() => onNavigate("/vocabulary")}
            >
              <Icon name="back" />
              All categories
            </button>
          </div>
        ) : (
          <>
            <section className="workspace-heading">
              <div>
                <p className="eyebrow">YOUR VOCABULARY</p>
                <h1>{activeCategory.name}</h1>
                <p>A little practice. A growing vocabulary.</p>
              </div>
            </section>
            <div className="workspace-grid">
              <EntryList
                categoryName={activeCategory.name}
                entries={entries}
                total={total}
                query={query}
                searchTerm={debouncedQuery}
                loading={loading}
                listError={listError}
                page={page}
                pageSize={pageSize}
                onQueryChange={setQuery}
                onPageChange={setPage}
                onRetry={() => setRevision((value) => value + 1)}
                onEdit={(entry) => {
                  setEditing(entry);
                  setEditDirty(false);
                }}
                onDelete={(entry) => {
                  setDeletion({ kind: "entry", item: entry });
                  setDeleteError("");
                }}
              />
              <aside className="add-panel" aria-label="Add entry">
                <div className="add-panel-heading">
                  <div>
                    <p className="eyebrow">ONE WORD AT A TIME</p>
                    <h2>Add an entry</h2>
                  </div>
                  <span className="panel-plus">
                    <Icon name="plus" />
                  </span>
                </div>
                <EntryForm
                  key={activeCategory.id}
                  defaultLabels={defaultTemplate.labels}
                  defaultCustomLabels={defaultTemplate.custom_labels}
                  onSave={addEntry}
                  onDefault={saveTemplate}
                  onDirty={setDraftDirty}
                  onBusy={setFormBusy}
                />
              </aside>
            </div>
          </>
        )}
        <footer className="page-footer">
          Keep a little of what you learn, every day.
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span className="toast-check">✓</span>
          {notice}
        </div>
      )}
      {categoryDialog && (
        <CategoryForm
          category={categoryDialog === "new" ? undefined : categoryDialog}
          save={saveCategory}
          close={() => setCategoryDialog(null)}
        />
      )}
      {editing && (
        <Modal title="Edit entry" close={closeEdit} busy={editBusy}>
          <EntryForm
            editing
            entry={editing}
            defaultLabels={defaultTemplate.labels}
            defaultCustomLabels={defaultTemplate.custom_labels}
            onDirty={setEditDirty}
            onBusy={setEditBusy}
            onDefault={saveTemplate}
            onSave={async (data) => {
              await vocabularyApi.updateEntry(editing.id, data);
              setEditing(null);
              setEditDirty(false);
              refresh();
              setNotice("Entry updated.");
            }}
          />
        </Modal>
      )}
      {deletion && (
        <DeleteConfirmation
          deletion={deletion}
          deleting={deleting}
          deleteError={deleteError}
          draftDirty={draftDirty}
          onClose={() => setDeletion(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
