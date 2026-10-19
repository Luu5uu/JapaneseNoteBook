from sqlalchemy import update
from app.db.session import get_engine
from app.modules.vocabulary.models import categories


engine = get_engine()

with engine.begin() as connection:
    statement = (
        update(categories)
        .where(categories.c.id == 1)
        .values(name="Nouns")
    )
    result = connection.execute(statement)
    print("Rows updated:", result.rowcount)

engine.dispose()