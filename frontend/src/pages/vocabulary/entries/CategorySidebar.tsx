import Icon from "../../../components/Icon";
import type { Category } from "../types";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onHome: () => void;
  onOverview: () => void;
  categories: Category[];
  selectedId: number | null;
  busy: boolean;
  unavailable: boolean;
  onSelect: (id: number) => void;
  onCreate: () => void;
  hasSelection: boolean;
  onRename: () => void;
  onDelete: () => void;
};

export default function CategorySidebar({
  collapsed,
  onToggle,
  onHome,
  onOverview,
  categories,
  selectedId,
  busy,
  unavailable,
  onSelect,
  onCreate,
  hasSelection,
  onRename,
  onDelete,
}: Props) {
  const allCount = categories.reduce(
    (sum, category) => sum + category.entry_count,
    0,
  );
  return (
    <aside className="sidebar" aria-label="Category navigation">
      <button
        className="sidebar-toggle icon-button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="category-sidebar-content"
        aria-label={
          collapsed ? "Expand category sidebar" : "Collapse category sidebar"
        }
        title={collapsed ? "Expand categories" : "Collapse categories"}
      >
        <Icon name={collapsed ? "menu" : "back"} />
      </button>
      {collapsed && (
        <div className="sidebar-rail">
          <button
            className="icon-button"
            onClick={onHome}
            aria-label="Home"
            title="Home"
          >
            <Icon name="book" />
          </button>
          <button
            className="icon-button"
            onClick={onOverview}
            aria-label="All categories"
            title="All categories"
          >
            <Icon name="grid" />
          </button>
        </div>
      )}
      <div
        id="category-sidebar-content"
        className="sidebar-content"
        hidden={collapsed}
      >
        <button
          className="brand sidebar-brand"
          onClick={onHome}
          aria-label="Japanese Notebook home"
        >
          <span className="brand-icon">
            <Icon name="book" />
          </span>
          <span>
            Japanese<span className="brand-second">NoteBook</span>
          </span>
        </button>
        <p className="sidebar-caption">A home for every word.</p>
        <button className="sidebar-overview" onClick={onOverview}>
          <Icon name="grid" />
          All categories
        </button>
        <div className="sidebar-section">
          <span>YOUR CATEGORIES</span>
          <span>{categories.length}</span>
        </div>
        <nav aria-label="Categories" className="category-nav">
          {categories.map((category) => (
            <button
              key={category.id}
              disabled={busy}
              className={
                "category-link " + (selectedId === category.id ? "active" : "")
              }
              aria-current={selectedId === category.id ? "page" : undefined}
              onClick={() => onSelect(category.id)}
            >
              <Icon name="book" />
              <span className="category-name">{category.name}</span>
              <span className="category-count">{category.entry_count}</span>
            </button>
          ))}
        </nav>
        <button
          className="new-category-button"
          disabled={unavailable || busy}
          onClick={onCreate}
        >
          <Icon name="plus" />
          New category
        </button>
        {hasSelection && (
          <div className="category-management">
            <button
              className="secondary-button"
              disabled={busy || unavailable}
              onClick={onRename}
            >
              <Icon name="edit" />
              Rename category
            </button>

            <button
              className="secondary-button danger-icon"
              disabled={busy || unavailable}
              onClick={onDelete}
            >
              <Icon name="trash" />
              Delete category
            </button>
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="notebook-stats">
            <strong>{allCount}</strong>
            <span>{allCount === 1 ? "word collected" : "words collected"}</span>
          </div>
          <p>
            Small steps.
            <br />A growing vocabulary.
          </p>
          <span className="local-label">
            <span />
            Personal notebook
          </span>
        </div>
      </div>
    </aside>
  );
}
