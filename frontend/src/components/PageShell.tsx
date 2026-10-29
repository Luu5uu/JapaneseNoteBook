import type { ReactNode } from "react";
import Icon from "./Icon";
import type { Navigate } from "../navigation";
import "./PageShell.css";

export default function PageShell({
  children,
  onNavigate,
  home = false,
}: {
  children: ReactNode;
  onNavigate: Navigate;
  home?: boolean;
}) {
  return (
    <div className="library-shell">
      <header className="library-header">
        <button
          className="library-brand"
          onClick={() => onNavigate("/")}
          aria-label="Japanese Notebook home"
        >
          <span className="library-brand-icon">
            <Icon name="book" />
          </span>
          <span>
            Japanese <strong>Notebook</strong>
          </span>
        </button>
        {home ? (
          <span className="library-header-note">
            YOUR PERSONAL LEARNING SPACE
          </span>
        ) : (
          <button className="secondary-button" onClick={() => onNavigate("/")}>
            <Icon name="back" />
            Home
          </button>
        )}
      </header>
      <main className="library-main">{children}</main>
      <footer className="library-footer">
        <span>Japanese Notebook</span>
        <span>Keep a little of what you learn, every day.</span>
      </footer>
    </div>
  );
}
