"""Adopt the original learning table, then run versioned migrations."""
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

from app.core.config import BACKEND_DIR
from app.db.session import get_engine


def main():
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Configure the database first.")
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    with engine.connect() as connection:
        inspector = inspect(connection)
        tables = inspector.get_table_names()
        versions = connection.execute(text("SELECT version_num FROM alembic_version")).scalars().all() if "alembic_version" in tables else []
        adopt = "categories" in tables and not versions
        if adopt:
            columns = inspector.get_columns("categories")
            if [(c["name"], str(c["type"]), c["nullable"]) for c in columns] != [
                ("id", "INTEGER", False), ("name", "VARCHAR(255)", False),
            ] or inspector.get_pk_constraint("categories")["constrained_columns"] != ["id"]:
                raise RuntimeError("The existing category table differs from the learning baseline. No migration was applied.")
            if set(tables) - {"categories", "alembic_version"}:
                raise RuntimeError("Unversioned tables were found. No migration was applied.")
            invalid = connection.scalar(text(
                "SELECT count(*) FROM categories WHERE length(btrim(name)) = 0"
            ))
            duplicates = connection.execute(text(
                "SELECT lower(btrim(name)) FROM categories GROUP BY lower(btrim(name)) HAVING count(*) > 1"
            )).first()
            if invalid or duplicates:
                raise RuntimeError("Resolve empty or duplicate category names before migrating.")
    if adopt:
        command.stamp(config, "0001_categories")
    command.upgrade(config, "head")
    engine.dispose()
    print("Notebook database is ready. Existing categories were preserved.")


if __name__ == "__main__":
    main()
