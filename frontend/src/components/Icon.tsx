type IconName =
  | "book"
  | "plus"
  | "search"
  | "grid"
  | "table"
  | "edit"
  | "trash"
  | "close"
  | "arrow"
  | "back"
  | "menu"
  | "chat";
const paths: Record<IconName, string> = {
  back: "M19 12H5m5-5-5 5 5 5",
  menu: "M4 6h16M4 12h16M4 18h16",
  chat: "M4 4h16v12H9l-5 4V4Z M8 8h8M8 12h5",
  book: "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3V4Z",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  table: "M3 4h18v16H3ZM3 10h18M3 15h18M10 4v16",
  edit: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
};
export default function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
