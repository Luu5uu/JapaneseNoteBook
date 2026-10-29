import type { DraftRole } from "../types";
export default function RoleEditor({
  roles,
  onChange,
  onRemove,
  onAdd,
}: {
  roles: DraftRole[];
  onChange: (key: string, name: string) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="script-section">
      <div className="script-section-heading">
        <div>
          <h2>02 / Roles</h2>
          <p>Add at least one character. Their order sets the columns below.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onAdd}>
          Add role
        </button>
      </div>
      <div className="script-role-list">
        {roles.map((role, index) => (
          <div key={role.key} className="script-role">
            <label>
              Role {index + 1}
              <input
                required
                maxLength={100}
                value={role.name}
                onChange={(event) => onChange(role.key, event.target.value)}
                placeholder="Character name"
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              disabled={roles.length === 1}
              aria-label={`Remove role ${index + 1}`}
              onClick={() => onRemove(role.key)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
