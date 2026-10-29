import { useState, useRef } from "react";
import type { FormEvent } from "react";
import Icon from "../../../components/Icon";
import { errorMessage } from "../vocabularyApi";
import { allLabels, labelNames } from "../types";
import CustomFieldsEditor from "./CustomFieldsEditor";
import { maxCustomFields } from "../customLabels";
import type { CustomField, Template } from "../types";
import type { Entry, EntryData, Label } from "../types";
const emptyValues = (): Record<Label | "word", string> => ({
  word: "",
  kanji: "",
  hiragana: "",
  katakana: "",
  romaji: "",
  note: "",
});

export default function EntryForm({
  entry,
  defaultLabels,
  defaultCustomLabels,
  onSave,
  onDefault,
  onDirty,
  onBusy,
  editing = false,
}: {
  entry?: Entry;
  defaultLabels: Label[];
  defaultCustomLabels: string[];
  onSave: (data: EntryData) => Promise<void>;
  onDefault: (template: Template) => Promise<void>;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  editing?: boolean;
}) {
  // Start with empty fields, or populate them when editing an existing entry.
  const [values, setValues] = useState(() => {
    const initialValues = emptyValues();
    if (entry) {
      initialValues.word = entry.word;
      for (const label of allLabels) {
        initialValues[label] = entry[label] ?? "";
      }
    }
    return initialValues;
  });
  const [labels, setLabels] = useState<Label[]>(() =>
    entry ? allLabels.filter((label) => !!entry[label]) : [...defaultLabels],
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(() =>
    entry
      ? entry.custom_fields.map((field) => ({ ...field }))
      : defaultCustomLabels.map((label) => ({ label, value: "" })),
  );
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [error, setError] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const wordRef = useRef<HTMLInputElement>(null);
  const idPrefix = editing ? "edit" : "new";

  function change(field: Label | "word", value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    onDirty(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.word.trim() || saving) return;
    if (creatingLabel) {
      setError("Create or cancel the new label before saving.");
      return;
    }
    setSaving(true);
    onBusy(true);
    setError("");
    const data: EntryData = {
      word: values.word.trim(),
      custom_fields: customFields.map((field) => ({
        label: field.label,
        value: field.value.trim(),
      })),
      kanji: null,
      hiragana: null,
      katakana: null,
      romaji: null,
      note: null,
    };
    // Hidden or blank optional fields are saved as null.
    for (const label of labels) {
      data[label] = values[label].trim() || null;
    }
    try {
      await onSave(data);
      onDirty(false);
      if (!editing) {
        setValues(emptyValues());
        setLabels([...defaultLabels]);
        setCustomFields(
          defaultCustomLabels.map((label) => ({ label, value: "" })),
        );
        setCreatingLabel(false);
        setTemplateMessage("");
        wordRef.current?.focus();
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
      onBusy(false);
    }
  }

  async function saveDefault() {
    if (creatingLabel) {
      setError("Create or cancel the new label before saving the layout.");
      return;
    }
    setTemplateSaving(true);
    onBusy(true);
    setError("");
    setTemplateMessage("");
    try {
      await onDefault({
        labels: [...labels],
        custom_labels: customFields.map((field) => field.label),
      });
      setTemplateMessage("Default layout saved for all categories.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setTemplateSaving(false);
      onBusy(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <fieldset disabled={saving || templateSaving}>
        <label htmlFor={idPrefix + "-word"}>
          Word <span className="required">*</span>
        </label>
        <input
          ref={wordRef}
          autoFocus={editing}
          id={idPrefix + "-word"}
          lang="ja"
          value={values.word}
          onChange={(event) => change("word", event.target.value)}
          placeholder="e.g. 食べる"
          required
          maxLength={255}
        />
        <p className="field-hint">
          Only Word is required. Add what helps you learn.
        </p>
        {labels.map((label) => (
          <div className="optional-field" key={label}>
            <div className="label-line">
              <label htmlFor={idPrefix + "-" + label}>
                {labelNames[label]}
              </label>
              <button
                type="button"
                className="remove-label"
                aria-label={"Remove " + labelNames[label] + " field"}
                onClick={() => {
                  setLabels(labels.filter((item) => item !== label));
                  onDirty(true);
                }}
              >
                <Icon name="close" />
              </button>
            </div>
            {label === "note" ? (
              <textarea
                id={idPrefix + "-" + label}
                rows={3}
                maxLength={10000}
                value={values[label]}
                onChange={(event) => change(label, event.target.value)}
                placeholder="Meaning, example sentence, or a little reminder…"
              />
            ) : (
              <input
                id={idPrefix + "-" + label}
                maxLength={1000}
                value={values[label]}
                onChange={(event) => change(label, event.target.value)}
                placeholder={
                  label === "romaji"
                    ? "e.g. taberu"
                    : label === "hiragana"
                      ? "e.g. たべる"
                      : "Optional"
                }
                lang={label === "romaji" ? "en" : "ja"}
              />
            )}
          </div>
        ))}
        <CustomFieldsEditor
          fields={customFields}
          idPrefix={idPrefix}
          creating={creatingLabel}
          onChange={(fields) => {
            setCustomFields(fields);
            onDirty(true);
          }}
          onCloseCreate={() => setCreatingLabel(false)}
          onDirty={onDirty}
        />
        {(labels.length < allLabels.length ||
          customFields.length < maxCustomFields) && (
          <label className="add-label-control">
            <span className="sr-only">Add label</span>
            <select
              aria-label="Add label"
              value=""
              onChange={(event) => {
                if (event.target.value === "__custom") {
                  setCreatingLabel(true);
                } else if (event.target.value) {
                  setLabels([...labels, event.target.value as Label]);
                  onDirty(true);
                }
              }}
            >
              <option value="">+ Add label</option>
              {allLabels
                .filter((label) => !labels.includes(label))
                .map((label) => (
                  <option key={label} value={label}>
                    {labelNames[label]}
                  </option>
                ))}
              {customFields.length < maxCustomFields && (
                <option value="__custom">+ Create custom label</option>
              )}
            </select>
          </label>
        )}
        {!editing && (
          <div className="template-controls">
            <button type="button" className="text-button" onClick={saveDefault}>
              {templateSaving ? "Saving layout…" : "Save layout as default"}
            </button>
            <button
              type="button"
              className="text-button muted"
              onClick={() => {
                setLabels([...defaultLabels]);
                setCustomFields(
                  defaultCustomLabels.map((label) => ({
                    label,
                    value:
                      customFields.find((field) => field.label === label)
                        ?.value ?? "",
                  })),
                );
                setCreatingLabel(false);
                setTemplateMessage("");
                onDirty(true);
              }}
            >
              Use default
            </button>
          </div>
        )}
        {templateMessage && (
          <p className="success-text" role="status">
            {templateMessage}
          </p>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="primary-button full-width"
          disabled={saving || !values.word.trim()}
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add word"}
          {!saving && <Icon name={editing ? "edit" : "plus"} />}
        </button>
      </fieldset>
    </form>
  );
}
