import { useEffect, useState } from "react";
import type { Navigate } from "../../../../navigation";
import { listScripts, errorMessage } from "../scriptsApi";
import type { ScriptSummary } from "../types";
import ScriptLayout from "../components/ScriptLayout";

export default function ScriptsPage({ onNavigate }: { onNavigate: Navigate }) {
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listScripts(offset, controller.signal)
      .then(setScripts)
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [offset, attempt]);
  return (
    <ScriptLayout
      title="Your scripts"
      subtitle="Keep classroom dialogues together, one conversation at a time."
      onNavigate={onNavigate}
      action={
        <button
          className="primary-button"
          onClick={() => onNavigate("/scripts/new")}
        >
          New script
        </button>
      }
    >
      {loading ? (
        <p role="status">Loading scripts…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => setAttempt(attempt + 1)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {scripts.length === 0 ? (
            <div className="script-empty">
              <h2>
                {offset
                  ? "No more scripts"
                  : "Your next conversation starts here"}
              </h2>
              <p>
                {offset
                  ? "Go back to see earlier results."
                  : "Add a title, your characters, and their lines to create your first script."}
              </p>
            </div>
          ) : (
            <div className="script-cards">
              {scripts.map((script) => (
                <button
                  key={script.id}
                  className="script-card"
                  onClick={() => onNavigate(`/scripts/${script.id}`)}
                >
                  <span className="eyebrow">DIALOGUE</span>
                  <h2>{script.title}</h2>
                  <p>{new Date(script.created_at).toLocaleDateString()}</p>
                  <span>Open script →</span>
                </button>
              ))}
            </div>
          )}
          <div className="script-actions">
            <button
              className="secondary-button"
              disabled={offset === 0}
              onClick={() => setOffset(offset - 24)}
            >
              Previous
            </button>
            <span>Page {offset / 24 + 1}</span>
            <button
              className="secondary-button"
              disabled={scripts.length < 24}
              onClick={() => setOffset(offset + 24)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </ScriptLayout>
  );
}
