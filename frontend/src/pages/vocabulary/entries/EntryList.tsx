import { useState } from "react";
import Icon from "../../../components/Icon";
import EntryCard from "./EntryCard";
import { allLabels, labelNames } from "../types";
import type { Entry } from "../types";

type Props = {
  categoryName: string;
  entries: Entry[];
  total: number;
  query: string;
  searchTerm: string;
  loading: boolean;
  listError: string;
  page: number;
  pageSize: number;
  onQueryChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

export default function EntryList({
  categoryName,
  entries,
  total,
  query,
  searchTerm,
  loading,
  listError,
  page,
  pageSize,
  onQueryChange,
  onPageChange,
  onRetry,
  onEdit,
  onDelete,
}: Props) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const hasCustomFields = entries.some(
    (entry) => entry.custom_fields.length > 0,
  );
  function entryActions(entry: Entry) {
    return (
      <div className="entry-actions">
        <button
          className="icon-button"
          aria-label={"Edit " + entry.word}
          onClick={() => onEdit(entry)}
        >
          <Icon name="edit" />
        </button>
        <button
          className="icon-button danger-icon"
          aria-label={"Delete " + entry.word}
          onClick={() => onDelete(entry)}
        >
          <Icon name="trash" />
        </button>
      </div>
    );
  }

  return (
    <section className="entries-section" aria-label="Vocabulary entries">
      <div className="entries-toolbar">
        <div className="search-input">
          <Icon name="search" />
          <input
            aria-label="Search entries"
            placeholder="Search words, notes, custom fields…"
            value={query}
            maxLength={255}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="view-switch" aria-label="Entry view">
          <button
            aria-label="Card view"
            aria-pressed={view === "cards"}
            className={view === "cards" ? "selected" : ""}
            onClick={() => setView("cards")}
          >
            <Icon name="grid" />
          </button>
          <button
            aria-label="Table view"
            aria-pressed={view === "table"}
            className={view === "table" ? "selected" : ""}
            onClick={() => setView("table")}
          >
            <Icon name="table" />
          </button>
        </div>
      </div>
      <div className="entries-meta">
        <span>
          {loading
            ? "Loading…"
            : `${total} ${total === 1 ? "entry" : "entries"}`}
        </span>
        <span>Newest first</span>
      </div>
      {listError ? (
        <div className="inline-state">
          <p role="alert">{listError}</p>
          <button className="secondary-button" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="loading-entries" role="status">
          <span className="loading-dot" />
          Loading your words…
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-entries">
          <div className="empty-icon">
            <Icon name={searchTerm ? "search" : "book"} />
          </div>
          <h2>
            {searchTerm ? "No matching words" : "A new chapter starts here."}
          </h2>
          <p>
            {searchTerm
              ? "Try a different word, reading, or note."
              : "Add your first word using the entry form. A word is enough to get started."}
          </p>
          {searchTerm && (
            <button className="text-button" onClick={() => onQueryChange("")}>
              Clear search
            </button>
          )}
        </div>
      ) : view === "cards" ? (
        <div className="entry-cards">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              actions={entryActions(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Entries in {categoryName}</caption>
            <thead>
              <tr>
                <th>Word</th>
                {allLabels.map((label) => (
                  <th key={label}>{labelNames[label]}</th>
                ))}
                {hasCustomFields && <th>Custom fields</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <th scope="row" lang="ja">
                    {entry.word}
                  </th>
                  {allLabels.map((label) => (
                    <td key={label}>{entry[label] ?? ""}</td>
                  ))}
                  {hasCustomFields && (
                    <td className="custom-fields-cell">
                      <dl>
                        {entry.custom_fields.map((field) => (
                          <div key={field.label}>
                            <dt>{field.label}</dt>
                            <dd>{field.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  )}
                  <td>{entryActions(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > pageSize && (
        <div className="pagination">
          <button
            className="secondary-button"
            disabled={page === 0 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </span>
          <button
            className="secondary-button"
            disabled={(page + 1) * pageSize >= total || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
