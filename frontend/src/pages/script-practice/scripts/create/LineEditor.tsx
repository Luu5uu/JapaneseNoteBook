import type { DraftLine, DraftRole } from "../types";
export default function LineEditor({
  roles,
  lines,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: {
  roles: DraftRole[];
  lines: DraftLine[];
  onChange: (key: string, change: Partial<DraftLine>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onMove: (index: number, direction: number) => void;
}) {
  return (
    <section className="script-section">
      <div className="script-section-heading">
        <div>
          <h2>03 / Dialogue</h2>
          <p>
            Read from top to bottom. Each row is one turn, spoken by one role.
            Scroll sideways to see more roles.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onAdd}>
          Add line
        </button>
      </div>
      <div
        className="script-grid-scroll"
        tabIndex={0}
        aria-label="Dialogue editor, scroll horizontally for more roles"
      >
        <table className="script-grid">
          <thead>
            <tr>
              <th scope="col">Turn</th>
              {roles.map((role, index) => (
                <th scope="col" key={role.key}>
                  {role.name.trim() || `Role ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key}>
                <th scope="row">
                  <span>Turn {index + 1}</span>
                  <label>
                    Speaker
                    <select
                      aria-label={`Speaker for turn ${index + 1}`}
                      value={line.roleKey}
                      onChange={(event) =>
                        onChange(line.key, { roleKey: event.target.value })
                      }
                    >
                      {roles.map((role, i) => (
                        <option key={role.key} value={role.key}>
                          {role.name.trim() || `Role ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="script-turn-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Move turn ${index + 1} up`}
                      onClick={() => onMove(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === lines.length - 1}
                      aria-label={`Move turn ${index + 1} down`}
                      onClick={() => onMove(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={lines.length === 1}
                      aria-label={`Remove turn ${index + 1}`}
                      onClick={() => onRemove(line.key)}
                    >
                      Remove
                    </button>
                  </div>
                </th>
                {roles.map((role) => (
                  <td
                    key={role.key}
                    className={
                      role.key === line.roleKey ? "script-active-cell" : ""
                    }
                  >
                    {role.key === line.roleKey ? (
                      <>
                        <label>
                          Line {index + 1}
                          <textarea
                            aria-label={`Line ${index + 1}`}
                            lang="ja"
                            required
                            rows={3}
                            value={line.text}
                            onChange={(event) =>
                              onChange(line.key, { text: event.target.value })
                            }
                            placeholder="Enter the dialogue"
                          />
                        </label>
                        <label>
                          Reading (optional)
                          <input
                            aria-label={`Reading for line ${index + 1}`}
                            lang="ja"
                            value={line.spokenText}
                            onChange={(event) =>
                              onChange(line.key, {
                                spokenText: event.target.value,
                              })
                            }
                            placeholder="Text to read aloud later"
                          />
                        </label>
                      </>
                    ) : (
                      <span
                        className="script-silent"
                        aria-label="No line this turn"
                      >
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
