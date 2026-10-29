import type { ReactNode } from "react";
import PageShell from "../../../../components/PageShell";
import type { Navigate } from "../../../../navigation";
import "../scripts.css";

export default function ScriptLayout({
  title,
  subtitle,
  onNavigate,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  onNavigate: Navigate;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <PageShell onNavigate={onNavigate}>
      <nav className="script-breadcrumb" aria-label="Breadcrumb">
        <button onClick={() => onNavigate("/")}>Home</button>
        <span>/</span>
        <button onClick={() => onNavigate("/scripts")}>Script Practice</button>
      </nav>
      <header className="script-heading">
        <div>
          <p className="eyebrow">WORDS INTO CONVERSATIONS</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </PageShell>
  );
}
