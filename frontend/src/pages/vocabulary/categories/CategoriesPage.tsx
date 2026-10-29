import { useEffect, useState } from "react";
import PageShell from "../../../components/PageShell";
import Icon from "../../../components/Icon";
import CategoryForm from "../components/CategoryForm";
import DeleteConfirmation from "../components/DeleteConfirmation";
import CategoryCard from "./CategoryCard";
import * as vocabularyApi from "../vocabularyApi";
import type { Category } from "../types";
import type { Navigate } from "../../../navigation";
import "./categories.css";

export default function CategoriesPage({
  onNavigate,
}: {
  onNavigate: Navigate;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState(false);
  const [deletion, setDeletion] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const wordCount = categories.reduce(
    (sum, category) => sum + category.entry_count,
    0,
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    vocabularyApi
      .listCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch((error) => {
        if (active) setError(vocabularyApi.errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  async function createCategory(name: string) {
    const category = await vocabularyApi.createCategory(name);
    setCategories((previous) => [...previous, category]);
    setNotice("Category created. Open it to add your first word.");
  }

  async function deleteCategory() {
    if (!deletion || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await vocabularyApi.deleteCategory(deletion.id);
      setCategories((previous) =>
        previous.filter((item) => item.id !== deletion.id),
      );
      setDeletion(null);
      setNotice("Category deleted.");
    } catch (error) {
      setDeleteError(vocabularyApi.errorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell onNavigate={onNavigate}>
      <section className="categories-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION</p>
          <h1>Vocabulary</h1>
          <p>Choose a category. Pick up where you left off.</p>
        </div>
        <button
          className="primary-button"
          disabled={loading || !!error}
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" />
          New category
        </button>
      </section>
      {loading ? (
        <div className="page-state" role="status">
          Opening your collection…
        </div>
      ) : error ? (
        <div className="page-state">
          <p role="alert">{error}</p>
          <button
            className="secondary-button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="collection-summary">
            <span>
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </span>
            <span>{wordCount} words collected</span>
          </div>
          {notice && (
            <p className="collection-notice" role="status">
              {notice}
            </p>
          )}
          {categories.length === 0 ? (
            <div className="collection-empty">
              <Icon name="book" />
              <h2>A fresh page for your words.</h2>
              <p>
                Start with a lesson, a word type, or anything you want to
                review.
              </p>
              <button
                className="primary-button"
                onClick={() => setCreating(true)}
              >
                Create your first category
              </button>
            </div>
          ) : (
            <section className="category-grid" aria-label="Your categories">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  onOpen={() => onNavigate("/vocabulary/" + category.id)}
                  onDelete={() => {
                    setDeletion(category);
                    setDeleteError("");
                  }}
                />
              ))}
            </section>
          )}
        </>
      )}
      {creating && (
        <CategoryForm save={createCategory} close={() => setCreating(false)} />
      )}
      {deletion && (
        <DeleteConfirmation
          deletion={{ kind: "category", item: deletion }}
          deleting={deleting}
          deleteError={deleteError}
          draftDirty={false}
          onClose={() => setDeletion(null)}
          onConfirm={deleteCategory}
        />
      )}
    </PageShell>
  );
}
