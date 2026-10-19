from sqlalchemy import select
from app.db.session import get_engine
from app.modules.vocabulary.models import categories


engine = get_engine()

if engine is None:
    raise RuntimeError("Database is not configured.")

with engine.connect() as connection:
    statement = select(categories)
    result = connection.execute(statement)

    for row in result:
        print(row.id, row.name)

engine.dispose()