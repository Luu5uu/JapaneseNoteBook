import { useState } from "react";
import Icon from "../../../components/Icon";
import { cleanLabel, labelError, maxCustomFields } from "../customLabels";
import type { CustomField } from "../types";

type Props = {
  fields: CustomField[];
  idPrefix: string;
  creating: boolean;
  onChange: (fields: CustomField[]) => void;
  onCloseCreate: () => void;
  onDirty: (dirty: boolean) => void;
};

// Custom fields are draft data until the parent EntryForm is saved.
export default function CustomFieldsEditor({
  fields,
  idPrefix,
  creating,
  onChange,
  onCloseCreate,
  onDirty,
}: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function addLabel() {
    const message = labelError(
      name,
      fields.map((field) => field.label),
    );
    if (message) {
      setError(message);
      return;
    }
    if (fields.length >= maxCustomFields) {
      setError("An entry can have up to 100 custom labels.");
      return;
    }
    onChange([...fields, { label: cleanLabel(name), value: "" }]);
    setName("");
    setError("");
    onCloseCreate();
  }

  return (
    <>
      {fields.map((field, index) => (
        <div className="optional-field custom-field" key={field.label}>
          <div className="label-line">
            <label htmlFor={`${idPrefix}-custom-${index}`}>{field.label}</label>
            <button
              type="button"
              className="remove-label"
              aria-label={`Remove ${field.label} field`}
              onClick={() =>
                onChange(fields.filter((_, position) => position !== index))
              }
            >
              <Icon name="close" />
            </button>
          </div>
          <textarea
            id={`${idPrefix}-custom-${index}`}
            rows={2}
            maxLength={10000}
            value={field.value}
            placeholder="Add your own notes…"
            onChange={(event) =>
              onChange(
                fields.map((item, position) =>
                  position === index
                    ? { ...item, value: event.target.value }
                    : item,
                ),
              )
            }
          />
        </div>
      ))}
      {creating && (
        <div className="custom-label-creator">
          <label htmlFor={`${idPrefix}-custom-label-name`}>
            Custom label name
          </label>
          <input
            id={`${idPrefix}-custom-label-name`}
            autoFocus
            maxLength={80}
            value={name}
            placeholder="e.g. Meaning, Example, Polite form"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
              onDirty(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLabel();
              }
            }}
          />
          <p className="field-hint">
            Creates a field for this entry. Save the layout to reuse it.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="custom-label-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setName("");
                setError("");
                onCloseCreate();
              }}
            >
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={addLabel}>
              Create label
            </button>
          </div>
        </div>
      )}
    </>
  );
}
