import { useEffect, useState } from "react";
import type { Navigate } from "../../../../navigation";
import { getScript, errorMessage } from "../scriptsApi";
import type { ScriptDetail } from "../types";
import ScriptLayout from "../components/ScriptLayout";
import DialogueTable from "./DialogueTable";

export default function ScriptDetailPage({
  scriptId,
  onNavigate,
}: {
  scriptId: number;
  onNavigate: Navigate;
}) {
  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setScript(null);
    setError("");
    getScript(scriptId, controller.signal)
      .then(setScript)
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      });
    return () => controller.abort();
  }, [scriptId, attempt]);
  return (
    <ScriptLayout
      title={script?.title ?? "Your script"}
      subtitle={
        script
          ? `${script.roles.length} roles · ${script.lines.length} lines`
          : "Your classroom conversation, all in one place."
      }
      onNavigate={onNavigate}
      action={
        <button
          className="secondary-button"
          onClick={() => onNavigate("/scripts")}
        >
          All scripts
        </button>
      }
    >
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => setAttempt(attempt + 1)}
          >
            Retry
          </button>
        </div>
      ) : script ? (
        <>
          <DialogueTable script={script} />
          <p className="script-footnote">
            Your script is saved. Voice practice will be added in a future
            update.
          </p>
        </>
      ) : (
        <p role="status">Loading script…</p>
      )}
    </ScriptLayout>
  );
}
