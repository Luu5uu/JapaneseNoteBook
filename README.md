# Japanese Notebook

A personal vocabulary notebook for Japanese learners. Organize words into your own categories, record readings and notes, and keep everything in a local PostgreSQL database.

The current version focuses on collecting and managing vocabulary, with an English interface and support for Japanese text.

## Features

- Create, rename, and delete categories such as Nouns, Verbs, or Lesson 3.
- Add, edit, and delete vocabulary entries. Only **Word** is required.
- Choose optional fields: **Kanji, Hiragana, Katakana, Romaji, and Note**.
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
    |   |-- App.tsx              # Notebook interface
    |   |-- api.ts               # API requests and shared frontend types
    |   |-- styles.css           # Layout and visual styles
    |   `-- main.tsx             # React entry point
    `-- vite.config.ts           # Development server and API proxy
```

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

1. Create a category or select an existing one.
2. Enter a word and any readings or notes you want to keep.
3. Use **Add label** or the remove buttons to choose optional fields.
4. Select **Save layout as default** only when you want to change the default for future entries across all categories.
5. Click **Add word**, then search, edit, or switch views as needed.

Changing a draft's fields does not automatically change the global default. Updating the default does not rewrite existing entries.

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
