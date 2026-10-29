import { useCallback, useEffect, useRef, useState } from "react";

export type Navigate = (path: string, skipGuard?: boolean) => boolean;
export type RegisterGuard = (guard: () => boolean) => () => void;

// Hash URLs preserve the selected page on refresh without server routing rules.
export function useNavigation() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || "/");
  const currentPath = useRef(path);
  const guard = useRef<(() => boolean) | null>(null);

  const registerGuard: RegisterGuard = useCallback((callback) => {
    guard.current = callback;
    return () => {
      if (guard.current === callback) guard.current = null;
    };
  }, []);

  const navigate: Navigate = useCallback((nextPath, skipGuard = false) => {
    if (nextPath === currentPath.current) return true;
    if (!skipGuard && guard.current && !guard.current()) return false;
    window.history.pushState(null, "", "#" + nextPath);
    currentPath.current = nextPath;
    setPath(nextPath);
    window.scrollTo(0, 0);
    return true;
  }, []);

  useEffect(() => {
    function followHistory() {
      const nextPath = window.location.hash.slice(1) || "/";
      if (nextPath === currentPath.current) return;
      if (guard.current && !guard.current()) {
        window.history.replaceState(null, "", "#" + currentPath.current);
        return;
      }
      currentPath.current = nextPath;
      setPath(nextPath);
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", followHistory);
    return () => window.removeEventListener("hashchange", followHistory);
  }, []);

  return { path, navigate, registerGuard };
}
