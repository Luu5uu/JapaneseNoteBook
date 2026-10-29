import type { ReactNode } from "react";
import { allLabels, labelNames } from "../types";
import type { Entry } from "../types";

export default function EntryCard({
  entry,
  actions,
}: {
  entry: Entry;
  actions: ReactNode;
}) {
  return (
    <article className="entry-card">
      <div className="entry-card-top">
        <span className="entry-marker" />
        <span className="entry-date">
          {new Date(entry.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {actions}
      </div>
      <h2 lang="ja">{entry.word}</h2>
      <dl>
        {allLabels
          .filter((label) => entry[label])
          .map((label) => (
            <div
              key={label}
              className={
                "entry-detail " + (label === "note" ? "entry-note" : "")
              }
            >
              <dt>{labelNames[label]}</dt>
              <dd
                lang={
                  ["kanji", "hiragana", "katakana"].includes(label)
                    ? "ja"
                    : undefined
                }
              >
                {entry[label]}
              </dd>
            </div>
          ))}
        {entry.custom_fields.map((field) => (
          <div key={field.label} className="entry-detail entry-custom-detail">
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
