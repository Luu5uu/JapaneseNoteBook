from sqlalchemy import (
    Table, Column, Integer, String, Text, DateTime, ForeignKey,
    CheckConstraint, Index, func,
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
    CheckConstraint("id = 1", name="ck_settings_singleton"),
)
