"""Store custom fields in bulk, inside the entry operation's transaction."""
from sqlalchemy import delete, insert, select

from app.modules.vocabulary.models import entry_fields


def attach_fields(connection, rows):
    items = [dict(row) for row in rows]
    by_id = {item["id"]: item for item in items}
    for item in items:
        item["custom_fields"] = []
    if items:
        statement = (select(entry_fields)
                     .where(entry_fields.c.entry_id.in_(by_id))
                     .order_by(entry_fields.c.position, entry_fields.c.id))
        for field in connection.execute(statement).mappings():
            by_id[field["entry_id"]]["custom_fields"].append({
                "label": field["label"], "value": field["value"],
            })
    return items


def replace_fields(connection, entry_id, fields):
    connection.execute(delete(entry_fields).where(entry_fields.c.entry_id == entry_id))
    records = []
    for position, field in enumerate(fields):
        value = field["value"].strip()
        if value:
            records.append({"entry_id": entry_id, "label": field["label"],
                            "value": value, "position": position})
    if records:
        connection.execute(insert(entry_fields), records)
