"""Create a local application role and database, then save ignored configuration."""
from getpass import getpass
from pathlib import Path
import secrets

import psycopg
from psycopg import sql

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"
APP_USER = "jnb_app"
DATABASE = "japanese_notebook"


def main() -> None:
    if ENV_PATH.exists():
        print("backend/.env already exists. No changes were made.")
        print("Use the health check to verify it, or edit the existing configuration locally.")
        return

    print("Connect to your LOCAL PostgreSQL installation.")
    print("The administrator password stays in this terminal and is not saved.")
    admin_user = input("PostgreSQL administrator username [postgres]: ").strip() or "postgres"
    admin_password = getpass("PostgreSQL administrator password (hidden): ")
    app_password = secrets.token_urlsafe(32)

    try:
        with psycopg.connect(
            host="127.0.0.1", port=5432, dbname="postgres",
            user=admin_user, password=admin_password,
            connect_timeout=5, autocommit=True,
        ) as connection:
            if connection.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (APP_USER,)).fetchone():
                print("The jnb_app role already exists. No credentials were changed.")
                print("Configure backend/.env locally using the existing application credentials.")
                return
            if connection.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DATABASE,)).fetchone():
                print("The japanese_notebook database already exists. No changes were made.")
                print("Configure backend/.env locally using its existing credentials.")
                return
            connection.execute(sql.SQL("CREATE ROLE {} LOGIN PASSWORD {}").format(
                sql.Identifier(APP_USER), sql.Literal(app_password),
            ))
            try:
                connection.execute(sql.SQL("CREATE DATABASE {} OWNER {}").format(
                    sql.Identifier(DATABASE), sql.Identifier(APP_USER),
                ))
            except psycopg.Error:
                connection.execute(sql.SQL("DROP ROLE {}").format(sql.Identifier(APP_USER)))
                raise

        with psycopg.connect(
            host="127.0.0.1", port=5432, dbname=DATABASE,
            user=APP_USER, password=app_password, connect_timeout=5,
        ) as connection:
            connection.execute("SELECT 1")

        with ENV_PATH.open("x", encoding="utf-8") as env_file:
            env_file.write(
                "DB_HOST=127.0.0.1\nDB_PORT=5432\n"
                f"DB_NAME={DATABASE}\nDB_USER={APP_USER}\n"
                f"DB_PASSWORD={app_password}\n"
            )
        print("Database connection verified.")
        print("Created database: japanese_notebook")
        print("Created application user: jnb_app (not a PostgreSQL superuser)")
        print("Saved the generated application password in backend/.env.")
        print("Do not share or commit this file. Restart the backend to load it.")
    except psycopg.Error:
        print("Database setup failed. Check that PostgreSQL is running on port 5432")
        print("and that the local administrator username and password are correct.")
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
