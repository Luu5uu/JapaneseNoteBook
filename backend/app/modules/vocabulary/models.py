from sqlalchemy import (
    Table, Column, Integer, String, Text, DateTime, ForeignKey,
    CheckConstraint, Index, func, text,
)
from sqlalchemy.dialects.postgresql import ARRAY

from app.db.base import metadata

DEFAULT_LABELS = ["kanji", "hiragana", "romaji", "note"]

categories = Table(
    "categories", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    CheckConstraint("length(btrim(name)) > 0", name="ck_categories_name"),
)
Index("uq_categories_name_normalized", func.lower(func.btrim(categories.c.name)), unique=True)

entries = Table(
    "vocabulary_entries", metadata,
    Column("id", Integer, primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
    Column("word", String(255), nullable=False),
    Column("kanji", Text),
    Column("hiragana", Text),
    Column("katakana", Text),
    Column("romaji", Text),
    Column("note", Text),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    Column("updated_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    CheckConstraint("length(btrim(word)) > 0", name="ck_entries_word"),
)
Index("ix_entries_category_id", entries.c.category_id)

settings = Table(
    "vocabulary_settings", metadata,
    Column("id", Integer, primary_key=True),
    Column("default_labels", ARRAY(Text), nullable=False),
    Column("custom_labels", ARRAY(Text), nullable=False, server_default=text("'{}'::text[]")),
    CheckConstraint("id = 1", name="ck_settings_singleton"),
)

# Extra fields belong to an entry ID, never to the spelling of its word.
entry_fields = Table(
    "entry_fields", metadata,
    Column("id", Integer, primary_key=True),
    Column("entry_id", Integer, ForeignKey("vocabulary_entries.id", ondelete="CASCADE"), nullable=False),
    Column("label", String(80), nullable=False),
    Column("value", Text, nullable=False),
    Column("position", Integer, nullable=False),
    CheckConstraint("length(btrim(label)) > 0", name="ck_entry_fields_label"),
    CheckConstraint("length(btrim(value)) > 0", name="ck_entry_fields_value"),
    CheckConstraint("position >= 0", name="ck_entry_fields_position"),
)
# The leading entry_id also indexes loading and cascading deletion of an entry's fields.
Index("uq_entry_fields_label", entry_fields.c.entry_id,
      func.lower(func.btrim(entry_fields.c.label)), unique=True)
