import Modal from "../../../components/Modal";
import type { Deletion } from "../types";

type Props = {
  deletion: Deletion;
  deleting: boolean;
  deleteError: string;
  draftDirty: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmation({
  deletion,
  deleting,
  deleteError,
  draftDirty,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      title={
        deletion.kind === "category" ? "Delete category?" : "Delete entry?"
      }
      busy={deleting}
      close={onClose}
    >
      <p className="delete-description">
        {deletion.kind === "category"
          ? `This will permanently delete “${deletion.item.name}” and its ${deletion.item.entry_count} ${deletion.item.entry_count === 1 ? "entry" : "entries"}. Entries in other categories will stay in your notebook.`
          : `“${deletion.item.word}” will be permanently removed from this category.`}
      </p>
      {deletion.kind === "category" && draftDirty && (
        <p className="field-hint">
          Your unsaved entry in this category will also be discarded.
        </p>
      )}
      {deleteError && (
        <p className="error-message" role="alert">
          {deleteError}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="secondary-button"
          disabled={deleting}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="danger-button"
          disabled={deleting}
          onClick={onConfirm}
        >
          {deleting
            ? "Deleting…"
            : deletion.kind === "category"
              ? "Delete category"
              : "Delete entry"}
        </button>
      </div>
    </Modal>
  );
}
