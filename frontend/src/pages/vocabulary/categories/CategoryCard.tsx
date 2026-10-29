import Icon from "../../../components/Icon";
import type { Category } from "../types";

export default function CategoryCard({
  category,
  index,
  onOpen,
  onDelete,
}: {
  category: Category;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="category-card">
      <button
        className="category-card-open"
        onClick={onOpen}
        aria-label={"Open " + category.name}
      >
        <div className="category-card-top">
          <span className="category-card-icon">
            <Icon name="book" />
          </span>
          <span className="category-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h2>{category.name}</h2>
        <p>
          {category.entry_count} {category.entry_count === 1 ? "word" : "words"}
        </p>
        <span className="category-card-link">
          Open category
          <Icon name="arrow" />
        </span>
      </button>
      <button
        className="icon-button danger-icon category-card-delete"
        onClick={onDelete}
        aria-label={"Delete category " + category.name}
        title="Delete category"
      >
        <Icon name="trash" />
      </button>
    </article>
  );
}
