"""Add vocabulary entries, default template, and category name constraints."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision = "0002_notebook"
down_revision = "0001_categories"
branch_labels = None
depends_on = None


def upgrade():
    op.create_check_constraint("ck_categories_name", "categories", "length(btrim(name)) > 0")
    op.create_index("uq_categories_name_normalized", "categories",
                    [sa.text("lower(btrim(name))")], unique=True)
    op.create_table(
        "vocabulary_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("word", sa.String(255), nullable=False),
        sa.Column("kanji", sa.Text()),
        sa.Column("hiragana", sa.Text()),
        sa.Column("katakana", sa.Text()),
        sa.Column("romaji", sa.Text()),
        sa.Column("note", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(word)) > 0", name="ck_entries_word"),
    )
    op.create_index("ix_entries_category_id", "vocabulary_entries", ["category_id"])
    table = op.create_table(
        "vocabulary_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("default_labels", ARRAY(sa.Text()), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_settings_singleton"),
    )
    op.bulk_insert(table, [{"id": 1, "default_labels": ["kanji", "hiragana", "romaji", "note"]}])


def downgrade():
    op.drop_table("vocabulary_settings")
    op.drop_table("vocabulary_entries")
    op.drop_index("uq_categories_name_normalized", table_name="categories")
    op.drop_constraint("ck_categories_name", "categories", type_="check")
