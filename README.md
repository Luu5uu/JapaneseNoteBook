# Japanese Notebook

A personal vocabulary notebook for Japanese learners. Organize words into your own categories, record readings and notes, and keep everything in a local PostgreSQL database.

The current version focuses on collecting and managing vocabulary, with an English interface and support for Japanese text.

## Features

- Start from a home page with Vocabulary and Script Practice. Create, list, and read scripts with multiple roles and ordered lines.
- Browse category cards, create categories, and delete them with confirmation.
- Open a category to manage words and switch categories with a collapsible sidebar.
- Create, rename, and delete categories such as Nouns, Verbs, or Lesson 3.
- Add, edit, and delete vocabulary entries. Only **Word** is required.
- Choose built-in optional fields: **Kanji, Hiragana, Katakana, Romaji, and Note**.
- Create custom labels such as Meaning or Example sentence, edit their values, and search their names and content.
- Save a default field layout shared across categories, or adjust fields for an individual entry.
- Search words, readings, and notes within the selected category.
- Switch between card and table views, with pagination for larger collections.
- Use a responsive layout on desktop and smaller screens.
- Receive confirmation before deletion and warnings about unsaved entry changes.

Each entry belongs to one category. The same word can appear in multiple categories as independent records with different fields and notes. Deleting a category removes its own entries without affecting entries in other categories.

This is a local, single-user application. Audio playback, scheduled review, LLM features, accounts, and cloud synchronization are not implemented yet.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Database | PostgreSQL, SQLAlchemy Core, Psycopg |
| Database migrations | Alembic |
| Backend tests | pytest, FastAPI TestClient |

## Project Structure

```text
JapaneseNoteBook/
|-- backend/
|   |-- app/
|   |   |-- core/                 # Environment configuration
|   |   |-- db/                   # Shared database engine and metadata
|   |   |-- modules/vocabulary/   # Tables, validation, services, and API routes
|   |   `-- main.py               # FastAPI application
|   |-- migrations/              # Versioned database changes
|   |-- scripts/                 # Database setup utilities
|   |-- tests/                   # Health and vocabulary API tests
|   |-- exercises/               # Earlier learning exercises
|   `-- .env.example             # Configuration template without credentials
`-- frontend/
    |-- src/
    |   |-- App.tsx              # Selects the page to display
    |   |-- navigation.ts        # Hash URLs and unsaved-change navigation guard
    |   |-- components/          # Shared page shell, icons, modal, and UI styles
    |   |-- pages/home/          # Home page and learning-module cards
    |   |-- pages/vocabulary/    # Vocabulary feature module
    |   |   |-- categories/      # Category overview page and cards
    |   |   |-- entries/         # Selected category page, sidebar, and entry UI
    |   |   |-- components/      # Category form and deletion dialog shared by both pages
    |   |   |-- vocabularyApi.ts # Shared vocabulary API requests
    |   |   `-- types.ts         # Shared vocabulary types
    |   |-- styles.css           # Global font, colors, and browser defaults
    |   `-- main.tsx             # React entry point
    `-- vite.config.ts           # Development server and API proxy
```

## Frontend Reading Guide

Start with `frontend/src/App.tsx`, which chooses a page based on the hash URL:

| URL | Page | Purpose |
| --- | --- | --- |
| `#/` | `pages/home/HomePage.tsx` | Choose Vocabulary or Script Practice |
| `#/vocabulary` | `pages/vocabulary/categories/CategoriesPage.tsx` | Browse, add, and delete categories |
| `#/vocabulary/2` | `pages/vocabulary/entries/CategoryEntriesPage.tsx` | Manage words in category 2 |

Category URLs survive refresh. The selected category page registers an unsaved-change
check with `navigation.ts` before leaving. The sidebar can collapse without clearing
the entry form. Each page keeps its own CSS next to its components; reusable control
styles live in `components/ui.css`, and basic defaults remain in `styles.css`.

`CategoryEntriesPage` coordinates shared data, loading, and user actions. Its child
components receive data and report user actions through callback props. The category
overview reuses `CategoryForm`, `DeleteConfirmation`, and `vocabularyApi` rather than
duplicating the existing category operations.

| File in `pages/vocabulary/` | Responsibility |
| --- | --- |
| `categories/CategoriesPage.tsx` | Browse and manage categories |
| `categories/CategoryCard.tsx` | Display one category card |
| `categories/categories.css` | Style the category overview |
| `entries/CategoryEntriesPage.tsx` | Compose the page and coordinate data updates |
| `entries/CategorySidebar.tsx` | Display and select categories |
| `entries/EntryList.tsx` | Search controls, card/table views, and pagination |
| `entries/EntryCard.tsx` | Display one vocabulary entry |
| `entries/EntryForm.tsx` | Add or edit a word and its optional fields |
| `entries/CustomFieldsEditor.tsx` | Create and edit custom fields in an entry draft |
| `customLabels.ts` | Validate custom label names in the frontend |
| `components/CategoryForm.tsx` | Create or rename a category |
| `components/DeleteConfirmation.tsx` | Confirm deletion of a category or entry |
| `vocabularyApi.ts` | Send HTTP requests to the backend |
| `types.ts` | Define vocabulary data types and field names |
| `entries/entries.css` | Style the vocabulary page |

For example, adding a word follows this path:
`EntryForm` -> `CategoryEntriesPage.addEntry` -> `vocabularyApi.createEntry` -> backend.
After saving, the page refreshes its data and passes the results to `EntryList`.

## Local Setup

The commands below use **Windows PowerShell**.

### Prerequisites

- Python 3.11 or later
- Node.js 22.12 or later and npm
- PostgreSQL running locally; this project has been tested with PostgreSQL 18
- Git

### 1. Clone the repository

```powershell
git clone https://github.com/Luu5uu/JapaneseNoteBook.git
cd JapaneseNoteBook
```

If you already have the repository, open its root directory instead.

### 2. Install backend dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

These commands use the virtual environment directly, so activating it is optional.

### 3. Configure PostgreSQL

Make sure PostgreSQL is running on `127.0.0.1:5432`, then run:

```powershell
.\.venv\Scripts\python.exe scripts/configure_database.py
```

The script asks for your local PostgreSQL administrator username and password. It creates the `japanese_notebook` database and a dedicated, non-superuser account named `jnb_app`, then saves a generated application password in `backend/.env`. The administrator password is not saved.

If `backend/.env` already exists, the script leaves it unchanged. If the database or application account already exists without an `.env` file, copy `.env.example` to `.env` and fill in the existing application credentials instead. You can also use that file to configure a different host or port.

`backend/.env` is excluded from Git. Keep credentials in that local file; do not commit them.

### 4. Initialize the database

From `backend/`:

```powershell
.\.venv\Scripts\python.exe scripts/initialize_database.py
```

This applies Alembic migrations. It also supports the project's original learning version of the `categories` table and preserves existing categories when adopting that schema.

### 5. Start the backend

From `backend/`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Interactive API documentation: http://127.0.0.1:8000/docs
- Database connection check: http://127.0.0.1:8000/api/v1/health/database

### 6. Start the frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**.

Keep both servers running while using the notebook. Vite forwards requests beginning with `/api` to the backend on port `8000`.

For later sessions, start PostgreSQL and repeat only the backend and frontend server commands. Dependency installation and initial database configuration are not required each time. Press `Ctrl+C` in each terminal to stop its server.

## Using the Notebook

1. Open **Vocabulary** from the home page, then create or select a category. Use the trash button on a category card to delete it, or rename it from the category workspace.
2. Enter a word and any readings or notes you want to keep.
3. Use **Add label** for preset fields, or choose **+ Create custom label** and enter a name. Use the remove buttons to remove fields from the current draft.
4. Select **Save layout as default** only when you want to change the default for future entries across all categories.
5. Click **Add word**, then search, edit, or switch views as needed.

Changing a draft's fields does not automatically change the global default. Updating the default does not rewrite existing entries.

## Custom Labels

Built-in fields stay in `vocabulary_entries`. Additional labels and their values are
stored as rows in `entry_fields`, linked to a specific vocabulary entry ID with a
cascading foreign key. The same word in different categories keeps independent fields.
Adding labels does not add database columns. Migration `0003_custom_fields` adds the
new table and a custom-label layout column without changing existing vocabulary data.
For an existing installation, run `scripts/initialize_database.py` from `backend/`
after pulling this update, then restart the backend.

Each entry supports up to 100 custom fields. Names must contain 1?80 characters;
values support up to 10,000 characters. Names are normalized for Unicode width and
whitespace and must be unique within an entry, ignoring case. Built-in names,
including Word, cannot be reused as custom labels. Blank values are not stored.

**Save layout as default** saves field names, not their values. It changes the layout
for future drafts across categories without rewriting existing entries. Custom fields
appear on cards and in a single **Custom fields** column in table view. Search covers
both their names and values. The backend loads fields for a page of entries in one
additional query rather than querying separately for every word.

## How It Works

```text
React interface -> FastAPI routes -> Service functions -> PostgreSQL
```

The frontend sends HTTP requests to the backend. Pydantic validates input, service functions use SQLAlchemy Core to read or update PostgreSQL, and the API returns JSON for React to display. The browser does not connect directly to the database.

Vocabulary is stored in PostgreSQL, not in the Git repository. Pushing the source code to GitHub does not upload your saved words or deploy the application.

## Checks

Run backend tests from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

Vocabulary integration tests require a configured, running PostgreSQL database and permission to create schemas. They create and remove temporary test schemas without modifying your notebook records. They are skipped if database credentials are not configured.

Check types and build the frontend from `frontend/`:

```powershell
npm run build
```

The generated frontend files are written to `frontend/dist/`.

## Troubleshooting

- **The page opens but categories do not load:** Check that the backend is running on port `8000` and inspect its terminal output.
- **Database connection fails:** Check the PostgreSQL service, host, port, and credentials in `backend/.env`. Restart the backend after changing configuration.
- **Tables are missing:** Run `scripts/initialize_database.py` from `backend/` using the virtual environment's Python.
- **Port 5173 is occupied:** Stop the other process using that port before restarting the frontend.


### Script creation and reading

Open **Script Practice** on the home page to list saved scripts, create a script,
or read its complete dialogue. A script requires a title, at least one named role,
and at least one nonempty line. Each turn has one speaker; roles are displayed in
columns and lines run from top to bottom. Use the speaker selector and arrow
buttons to change the dialogue order. An optional reading can be stored per line.
Role names must be unique within a script. A role with assigned lines must have
those lines reassigned before it can be removed from the draft.

The create endpoint saves the script, roles, and lines in one database transaction.
The browser preserves the draft after a failed request and warns before leaving
an unsaved form. Drafts are not persisted across browser reloads.

Endpoints:
- `POST /api/v1/scripts`: create a complete script.
- `GET /api/v1/scripts?limit=24&offset=0`: list scripts, newest first.
- `GET /api/v1/scripts/{script_id}`: read a script with ordered roles and lines.

Frontend files are grouped under `frontend/src/pages/script-practice/scripts/`:
- `list/`: script library page.
- `create/`: create page, role editor, and dialogue editor.
- `detail/`: saved script page and dialogue table.
- `components/`: shared script page layout.
- `scriptsApi.ts`, `types.ts`, and `scripts.css`: API calls, data types, and styles.

Backend files remain under `backend/app/modules/script_practice/scripts/`.
Voice playback, recording, speech recognition, AI feedback, and editing or deleting
saved scripts are not included in this stage.
