import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Navigate, RegisterGuard } from "../../../../navigation";
import ScriptLayout from "../components/ScriptLayout";
import { createScript, errorMessage } from "../scriptsApi";
import type { DraftLine, DraftRole } from "../types";
import RoleEditor from "./RoleEditor";
import LineEditor from "./LineEditor";

export default function CreateScriptPage({
  onNavigate,
  registerGuard,
}: {
  onNavigate: Navigate;
  registerGuard: RegisterGuard;
}) {
  const [title, setTitle] = useState("");
  const [roles, setRoles] = useState<DraftRole[]>([{ key: "first", name: "" }]);
  const [lines, setLines] = useState<DraftLine[]>([
    { key: "first", roleKey: "first", text: "", spokenText: "" },
  ]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  useEffect(
    () =>
      registerGuard(
        () =>
          !saving && (!dirty || window.confirm("Discard this unsaved script?")),
      ),
    [dirty, saving, registerGuard],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || saving) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const change = () => {
    setDirty(true);
    setError("");
  };
  function removeRole(key: string) {
    if (roles.length <= 1) return;
    if (lines.some((line) => line.roleKey === key)) {
      setError(
        "Reassign this role's lines to another speaker before removing the role.",
      );
      return;
    }
    change();
    setRoles(roles.filter((role) => role.key !== key));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const names = roles.map((role) => role.name.trim().toLowerCase());
    if (
      !title.trim() ||
      names.some((name) => !name) ||
      lines.some((line) => !line.text.trim())
    ) {
      setError(
        "Enter a title, a name for every role, and text for every line.",
      );
      return;
    }
    if (new Set(names).size !== names.length) {
      setError("Each role needs a different name.");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const script = await createScript({
        title: title.trim(),
        roles: roles.map((role) => ({ name: role.name.trim() })),
        lines: lines.map((line) => ({
          role_index: roles.findIndex((role) => role.key === line.roleKey),
          text: line.text.trim(),
          spoken_text: line.spokenText.trim() || null,
        })),
      });
      onNavigate(`/scripts/${script.id}`, true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  return (
    <ScriptLayout
      title="Create a script"
      subtitle="Give every character a voice. Arrange the conversation your way."
      onNavigate={onNavigate}
    >
      <form onSubmit={save}>
        <fieldset disabled={saving} className="script-fieldset">
          <section className="script-section">
            <h2>01 / The scene</h2>
            <label>
              Script title
              <input
                required
                maxLength={255}
                value={title}
                onChange={(event) => {
                  change();
                  setTitle(event.target.value);
                }}
                placeholder="e.g. See you later"
              />
            </label>
          </section>
          <RoleEditor
            roles={roles}
            onChange={(key, name) => {
              change();
              setRoles(
                roles.map((role) =>
                  role.key === key ? { ...role, name } : role,
                ),
              );
            }}
            onRemove={removeRole}
            onAdd={() => {
              change();
              setRoles([...roles, { key: crypto.randomUUID(), name: "" }]);
            }}
          />
          <LineEditor
            roles={roles}
            lines={lines}
            onChange={(key, update) => {
              change();
              setLines(
                lines.map((line) =>
                  line.key === key ? { ...line, ...update } : line,
                ),
              );
            }}
            onAdd={() => {
              change();
              setLines([
                ...lines,
                {
                  key: crypto.randomUUID(),
                  roleKey: roles[0].key,
                  text: "",
                  spokenText: "",
                },
              ]);
            }}
            onRemove={(key) => {
              change();
              setLines(lines.filter((line) => line.key !== key));
            }}
            onMove={(index, direction) => {
              const next = [...lines];
              [next[index], next[index + direction]] = [
                next[index + direction],
                next[index],
              ];
              change();
              setLines(next);
            }}
          />
          {error && (
            <p className="script-error" role="alert">
              {error}
            </p>
          )}
          <div className="script-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("/scripts")}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit">
              {saving ? "Saving…" : "Save script"}
            </button>
          </div>
        </fieldset>
      </form>
    </ScriptLayout>
  );
}
