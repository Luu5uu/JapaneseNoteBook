"""Check the actual scripts migration in an isolated PostgreSQL schema."""
import importlib.util
from uuid import uuid4

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, delete, func, insert, select, text
from sqlalchemy.exc import IntegrityError

from app.core.config import BACKEND_DIR, get_settings
from app.modules.script_practice.scripts.models import scripts, script_roles, script_lines


@pytest.fixture
def database():
    url = get_settings().database_url
    if url is None:
        pytest.skip("Configure PostgreSQL to run schema tests.")
    schema = "jnb_script_test_" + uuid4().hex
    admin = create_engine(url, connect_args={"connect_timeout": 10})
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    try:
        migration_path = BACKEND_DIR / "migrations/versions/0004_scripts_create_scripts.py"
        spec = importlib.util.spec_from_file_location("scripts_migration", migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        with engine.begin() as connection:
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
        yield engine
    finally:
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


def add_script(connection, title, names):
    script_id = connection.scalar(insert(scripts).values(title=title).returning(scripts.c.id))
    role_ids = []
    for position, name in enumerate(names, start=1):
        role_ids.append(connection.scalar(insert(script_roles).values(
            script_id=script_id, name=name, position=position,
        ).returning(script_roles.c.id)))
    return script_id, role_ids


def test_single_and_multiple_roles_with_global_line_order(database):
    with database.begin() as connection:
        single, _ = add_script(connection, "Solo", ["Narrator"])
        script_id, roles = add_script(connection, "See you later", ["Mother", "Brian", "Narrator"])
        # Speaking order is independent of the roles' column order.
        for position, role_id, line in [(3, roles[1], "I will return."),
                                         (1, roles[0], "See you later."),
                                         (2, roles[1], "I am leaving.")]:
            connection.execute(insert(script_lines).values(
                script_id=script_id, role_id=role_id, position=position, text=line,
            ))
        rows = connection.execute(select(script_lines.c.role_id).where(
            script_lines.c.script_id == script_id,
        ).order_by(script_lines.c.position)).scalars().all()
        assert rows == [roles[0], roles[1], roles[1]]
        assert connection.scalar(select(func.count()).select_from(script_roles).where(
            script_roles.c.script_id == single,
        )) == 1


def test_cross_script_role_duplicate_order_and_blank_title_rejected(database):
    with database.begin() as connection:
        a, roles_a = add_script(connection, "First", ["Mother"])
        _, roles_b = add_script(connection, "Second", ["Brian"])
        connection.execute(insert(script_lines).values(script_id=a, role_id=roles_a[0], position=1, text="Hello"))
        invalid_operations = [
            insert(script_lines).values(script_id=a, role_id=roles_b[0], position=2, text="Wrong script"),
            insert(script_lines).values(script_id=a, role_id=roles_a[0], position=1, text="Duplicate turn"),
            insert(script_roles).values(script_id=a, name=" mother ", position=2),
            insert(scripts).values(title="   "),
        ]
        for operation in invalid_operations:
            with pytest.raises(IntegrityError):
                with connection.begin_nested():
                    connection.execute(operation)


def test_deleting_one_script_preserves_the_other(database):
    with database.begin() as connection:
        first, first_roles = add_script(connection, "First", ["Brian"])
        second, second_roles = add_script(connection, "Second", ["Brian"])
        for script_id, role_ids in [(first, first_roles), (second, second_roles)]:
            connection.execute(insert(script_lines).values(
                script_id=script_id, role_id=role_ids[0], position=1, text="Hello",
            ))
        connection.execute(delete(scripts).where(scripts.c.id == first))
        assert connection.execute(select(script_roles.c.script_id)).scalars().all() == [second]
        assert connection.execute(select(script_lines.c.script_id)).scalars().all() == [second]



def test_script_api_round_trip_and_pagination(database, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.modules.script_practice.scripts import service

    monkeypatch.setattr(service, "get_engine", lambda: database)
    client = TestClient(app)
    payload = {
        "title": "  Three speakers  ",
        "roles": [{"name": "Mother"}, {"name": "Brian"}, {"name": "Narrator"}],
        "lines": [
            {"role_index": 2, "text": "A new day."},
            {"role_index": 0, "text": "See you later.", "spoken_text": "See you later"},
            {"role_index": 0, "text": "Have a good day."},
        ],
    }
    response = client.post("/api/v1/scripts", json=payload)
    assert response.status_code == 201, response.text
    script_id = response.json()["id"]
    detail = client.get(f"/api/v1/scripts/{script_id}").json()
    assert detail["title"] == "Three speakers"
    assert [role["position"] for role in detail["roles"]] == [1, 2, 3]
    assert [line["position"] for line in detail["lines"]] == [1, 2, 3]
    assert [line["role_id"] for line in detail["lines"]] == [
        detail["roles"][2]["id"], detail["roles"][0]["id"], detail["roles"][0]["id"],
    ]
    assert detail["lines"][1]["spoken_text"] == "See you later"
    second = client.post("/api/v1/scripts", json=payload).json()["id"]
    assert client.get("/api/v1/scripts?limit=1").json()[0]["id"] == second
    assert client.get("/api/v1/scripts?limit=1&offset=1").json()[0]["id"] == script_id
    assert client.get("/api/v1/scripts?offset=2").json() == []
    assert client.get("/api/v1/scripts/999999").status_code == 404
    assert client.get("/api/v1/scripts?limit=0").status_code == 422


@pytest.mark.parametrize("change", [
    {"title": "   "}, {"roles": []}, {"lines": []},
    {"roles": [{"name": "Mother"}, {"name": " mother "}]},
    {"lines": [{"role_index": 3, "text": "Hello"}]},
    {"lines": [{"role_index": -1, "text": "Hello"}]},
    {"lines": [{"role_index": 0, "text": "  "}]},
])
def test_invalid_script_inputs_do_not_write(database, monkeypatch, change):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.modules.script_practice.scripts import service
    monkeypatch.setattr(service, "get_engine", lambda: database)
    payload = {"title": "Test", "roles": [{"name": "Mother"}],
               "lines": [{"role_index": 0, "text": "Hello"}]}
    payload.update(change)
    assert TestClient(app).post("/api/v1/scripts", json=payload).status_code == 422
    with database.connect() as connection:
        assert connection.scalar(select(func.count()).select_from(scripts)) == 0


def test_script_creation_rolls_back_after_roles(database, monkeypatch):
    from app.modules.script_practice.scripts import service
    from app.modules.script_practice.scripts.schemas import ScriptCreate
    monkeypatch.setattr(service, "get_engine", lambda: database)
    def fail_lines(*args):
        raise RuntimeError("Simulated line failure")
    monkeypatch.setattr(service, "create_lines", fail_lines)
    data = ScriptCreate(title="Rollback", roles=[{"name": "Solo"}],
                        lines=[{"role_index": 0, "text": "Hello"}])
    with pytest.raises(RuntimeError, match="Simulated line failure"):
        service.create_script(data)
    with database.connect() as connection:
        for table in (scripts, script_roles, script_lines):
            assert connection.scalar(select(func.count()).select_from(table)) == 0
