from sqlalchemy import delete
from app.db.session import get_engine
from app.modules.vocabulary.models import categories


engine = get_engine()

with engine.begin() as connection:
    statement = delete(categories).where(categories.c.id == 1)
    result = connection.execute(statement)
    print("Rows deleted:", result.rowcount)

engine.dispose()