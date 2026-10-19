"""Baseline for the original category table."""
from alembic import op
import sqlalchemy as sa

revision = "0001_categories"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
    )


def downgrade():
    op.drop_table("categories")
