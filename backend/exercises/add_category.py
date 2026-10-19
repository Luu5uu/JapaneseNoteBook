from sqlalchemy import insert
from app.db.session import get_engine
from app.modules.vocabulary.models import categories


engine = get_engine()

with engine.begin() as connection:
    statement = insert(categories).values(name="Noun")
    connection.execute(statement)

print("Category added.")

engine.dispose()