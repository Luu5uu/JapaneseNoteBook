from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings
from app.db.base import metadata
from app.modules.vocabulary import models  # Register the Core table definitions.

target_metadata = metadata
url = get_settings().database_url
if url is None:
    raise RuntimeError("Database is not configured. Run scripts/configure_database.py first.")


def run_migrations_offline():
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True,
                      dialect_opts={"paramstyle": "named"}, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_engine(url, poolclass=pool.NullPool, connect_args={"connect_timeout": 10})
    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
