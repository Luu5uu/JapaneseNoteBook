import ScriptsPage from "./pages/script-practice/scripts/list/ScriptsPage";
import CreateScriptPage from "./pages/script-practice/scripts/create/CreateScriptPage";
import ScriptDetailPage from "./pages/script-practice/scripts/detail/ScriptDetailPage";
import HomePage from "./pages/home/HomePage";
import CategoriesPage from "./pages/vocabulary/categories/CategoriesPage";
import CategoryEntriesPage from "./pages/vocabulary/entries/CategoryEntriesPage";
import { useNavigation } from "./navigation";

export default function App() {
  const { path, navigate, registerGuard } = useNavigation();
  if (path === "/") return <HomePage onNavigate={navigate} />;
  if (path === "/vocabulary") return <CategoriesPage onNavigate={navigate} />;
  if (path === "/scripts") return <ScriptsPage onNavigate={navigate} />;
  if (path === "/scripts/new")
    return (
      <CreateScriptPage onNavigate={navigate} registerGuard={registerGuard} />
    );
  const scriptMatch = path.match(/^\/scripts\/(\d+)$/);
  if (
    scriptMatch &&
    Number.isSafeInteger(Number(scriptMatch[1])) &&
    Number(scriptMatch[1]) > 0
  ) {
    return (
      <ScriptDetailPage
        key={scriptMatch[1]}
        scriptId={Number(scriptMatch[1])}
        onNavigate={navigate}
      />
    );
  }
  const match = path.match(/^\/vocabulary\/(\d+)$/);
  if (match && Number.isSafeInteger(Number(match[1])) && Number(match[1]) > 0) {
    return (
      <CategoryEntriesPage
        categoryId={Number(match[1])}
        onNavigate={navigate}
        registerGuard={registerGuard}
      />
    );
  }
  return (
    <main className="page-state">
      <h1>Page not found</h1>
      <p>This page is not part of your notebook.</p>
      <button className="primary-button" onClick={() => navigate("/")}>
        Back to home
      </button>
    </main>
  );
}
