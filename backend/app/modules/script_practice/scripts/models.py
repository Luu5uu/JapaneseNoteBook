"""Table definitions for scripts, their roles, and ordered dialogue lines."""
from sqlalchemy import (
    Table, Column, Integer, String, Text, DateTime,
    ForeignKey, ForeignKeyConstraint, UniqueConstraint,
    CheckConstraint, Index, func,
)

from app.db.base import metadata


# 1. The script itself. Roles and lines reference its primary key.
scripts = Table(
    "scripts", metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(255), nullable=False),
    Column("description", Text),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    Column("updated_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    CheckConstraint("length(btrim(title)) > 0", name="ck_scripts_title"),
)


# 2. Role position controls the left-to-right order of the editor's columns.
script_roles = Table(
    "script_roles", metadata,
    Column("id", Integer, primary_key=True),
    Column("script_id", Integer, ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False),
    Column("name", String(100), nullable=False),
    Column("position", Integer, nullable=False),
    CheckConstraint("length(btrim(name)) > 0", name="ck_script_roles_name"),
    CheckConstraint("position >= 1", name="ck_script_roles_position"),
    UniqueConstraint("script_id", "position", name="uq_script_roles_position"),
    # This pair is referenced by the composite foreign key in script_lines.
    UniqueConstraint("script_id", "id", name="uq_script_roles_script_id_id"),
)
Index(
    "uq_script_roles_name", script_roles.c.script_id,
    func.lower(func.btrim(script_roles.c.name)), unique=True,
)


# 3. Line position controls speaking order across ALL roles in a script.
script_lines = Table(
    "script_lines", metadata,
    Column("id", Integer, primary_key=True),
    Column("script_id", Integer, ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False),
    Column("role_id", Integer, nullable=False),
    Column("position", Integer, nullable=False),
    Column("text", Text, nullable=False),
    Column("spoken_text", Text),
    CheckConstraint("position >= 1", name="ck_script_lines_position"),
    CheckConstraint("length(btrim(text)) > 0", name="ck_script_lines_text"),
    UniqueConstraint("script_id", "position", name="uq_script_lines_position"),
    # A line and its speaker must belong to the same script.
    ForeignKeyConstraint(
        ["script_id", "role_id"],
        ["script_roles.script_id", "script_roles.id"],
        name="fk_script_lines_role_in_script", ondelete="CASCADE",
    ),
)
Index("ix_script_lines_role", script_lines.c.script_id, script_lines.c.role_id)
