"""Add per-entry custom fields without changing existing vocabulary records."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision = "0003_custom_fields"
down_revision = "0002_notebook"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "entry_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entry_id", sa.Integer(), sa.ForeignKey("vocabulary_entries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.CheckConstraint("length(btrim(label)) > 0", name="ck_entry_fields_label"),
        sa.CheckConstraint("length(btrim(value)) > 0", name="ck_entry_fields_value"),
        sa.CheckConstraint("position >= 0", name="ck_entry_fields_position"),
    )
    op.create_index("uq_entry_fields_label", "entry_fields",
                    ["entry_id", sa.text("lower(btrim(label))")], unique=True)
    op.add_column("vocabulary_settings", sa.Column(
        "custom_labels", ARRAY(sa.Text()), nullable=False,
        server_default=sa.text("'{}'::text[]"),
    ))


def downgrade():
    # Refuse to silently discard user-created fields or layouts.
    connection = op.get_bind()
    populated = connection.scalar(sa.text("SELECT EXISTS (SELECT 1 FROM entry_fields)"))
    custom_layout = connection.scalar(sa.text(
        "SELECT EXISTS (SELECT 1 FROM vocabulary_settings WHERE cardinality(custom_labels) > 0)"
    ))
    if populated or custom_layout:
        raise RuntimeError("Export and remove custom fields and layouts before downgrading.")
    op.drop_column("vocabulary_settings", "custom_labels")
    op.drop_table("entry_fields")
