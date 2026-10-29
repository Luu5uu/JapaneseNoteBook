from sqlalchemy import select, insert, update, delete, func, or_
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import get_engine
from app.modules.vocabulary.models import categories, entries, settings, entry_fields, DEFAULT_LABELS
from app.modules.vocabulary.entry_field_store import attach_fields, replace_fields


class NotebookError(Exception):
    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message


def database():
    engine = get_engine()
    if engine is None:
        raise NotebookError(503, "Database is not configured.")
    return engine


def require_category(connection, category_id):
    row = connection.execute(
        select(categories).where(categories.c.id == category_id)
    ).mappings().first()
    if row is None:
        raise NotebookError(404, "Category not found.")
    return dict(row)


def list_categories():
    with database().connect() as connection:
        statement = (
            select(categories, func.count(entries.c.id).label("entry_count"))
            .outerjoin(entries).group_by(categories.c.id)
            .order_by(func.lower(categories.c.name), categories.c.id)
        )
        return [dict(row) for row in connection.execute(statement).mappings()]


def create_category(name):
    with database().begin() as connection:
        row = connection.execute(
            insert(categories).values(name=name).returning(categories)
        ).mappings().one()
        return {**row, "entry_count": 0}


def rename_category(category_id, name):
    with database().begin() as connection:
        row = connection.execute(
            update(categories).where(categories.c.id == category_id)
            .values(name=name).returning(categories)
        ).mappings().first()
        if row is None:
            raise NotebookError(404, "Category not found.")
        count = connection.scalar(select(func.count()).select_from(entries).where(entries.c.category_id == category_id))
        return {**row, "entry_count": count}


def delete_category(category_id):
    with database().begin() as connection:
        row = connection.execute(
            delete(categories).where(categories.c.id == category_id).returning(categories.c.id)
        ).first()
        if row is None:
            raise NotebookError(404, "Category not found.")


def list_entries(category_id, query="", limit=100, offset=0):
    with database().connect() as connection:
        require_category(connection, category_id)
        conditions = [entries.c.category_id == category_id]
        if query.strip():
            fixed_matches = [
                entries.c[field].icontains(query.strip(), autoescape=True)
                for field in ("word", "kanji", "hiragana", "katakana", "romaji", "note")
            ]
            custom_match = select(entry_fields.c.id).where(
                entry_fields.c.entry_id == entries.c.id,
                or_(entry_fields.c.label.icontains(query.strip(), autoescape=True),
                    entry_fields.c.value.icontains(query.strip(), autoescape=True)),
            ).exists()
            conditions.append(or_(*fixed_matches, custom_match))
        total = connection.scalar(select(func.count()).select_from(entries).where(*conditions))
        statement = select(entries).where(*conditions).order_by(entries.c.id.desc()).limit(limit).offset(offset)
        items = attach_fields(connection, connection.execute(statement).mappings())
        return {"items": items, "total": total}


def create_entry(category_id, data):
    data = dict(data)
    fields = data.pop("custom_fields", [])
    with database().begin() as connection:
        # Hold the category while inserting so a simultaneous delete cannot orphan an entry.
        category = connection.execute(
            select(categories.c.id).where(categories.c.id == category_id).with_for_update(read=True)
        ).first()
        if category is None:
            raise NotebookError(404, "Category not found.")
        row = connection.execute(
            insert(entries).values(category_id=category_id, **data).returning(entries)
        ).mappings().one()
        replace_fields(connection, row["id"], fields)
        return attach_fields(connection, [row])[0]


def update_entry(entry_id, data):
    data = dict(data)
    fields = data.pop("custom_fields", None)
    with database().begin() as connection:
        row = connection.execute(
            update(entries).where(entries.c.id == entry_id)
            .values(**data, updated_at=func.now()).returning(entries)
        ).mappings().first()
        if row is None:
            raise NotebookError(404, "Entry not found.")
        # An omitted custom_fields key leaves existing fields untouched.
        # An explicitly empty list removes them.
        if fields is not None:
            replace_fields(connection, entry_id, fields)
        return attach_fields(connection, [row])[0]


def delete_entry(entry_id):
    with database().begin() as connection:
        row = connection.execute(delete(entries).where(entries.c.id == entry_id).returning(entries.c.id)).first()
        if row is None:
            raise NotebookError(404, "Entry not found.")


def get_template():
    with database().connect() as connection:
        row = connection.execute(select(settings).where(settings.c.id == 1)).mappings().first()
        if row is None:
            return {"labels": DEFAULT_LABELS, "custom_labels": []}
        return {"labels": row["default_labels"], "custom_labels": row["custom_labels"]}


def save_template(labels, custom_labels):
    with database().begin() as connection:
        statement = pg_insert(settings).values(id=1, default_labels=labels, custom_labels=custom_labels)
        connection.execute(statement.on_conflict_do_update(
            index_elements=[settings.c.id],
            set_={"default_labels": labels, "custom_labels": custom_labels},
        ))
    return {"labels": labels, "custom_labels": custom_labels}
