import type { ScriptDetail } from "../types";
export default function DialogueTable({ script }: { script: ScriptDetail }) {
  return (
    <div
      className="script-grid-scroll"
      tabIndex={0}
      aria-label="Dialogue, scroll horizontally for more roles"
    >
      <table className="script-grid">
        <caption>Dialogue in speaking order</caption>
        <thead>
          <tr>
            <th scope="col">Turn</th>
            {script.roles.map((role) => (
              <th scope="col" key={role.id}>
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {script.lines.map((line) => (
            <tr key={line.id}>
              <th scope="row">{line.position}</th>
              {script.roles.map((role) => (
                <td
                  key={role.id}
                  className={
                    role.id === line.role_id ? "script-active-cell" : ""
                  }
                >
                  {role.id === line.role_id ? (
                    <>
                      <p lang="ja" className="script-line-text">
                        {line.text}
                      </p>
                      {line.spoken_text && (
                        <p lang="ja" className="script-reading">
                          {line.spoken_text}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="script-silent">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
