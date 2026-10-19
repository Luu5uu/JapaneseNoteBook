from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.config import Settings
from app.db.session import get_engine
from app.main import app


def test_api_is_available_without_a_database():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_missing_database_configuration():
    app.dependency_overrides[get_engine] = lambda: None
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/database")
        assert response.status_code == 503
        assert response.json()["status"] == "not_configured"
    finally:
        app.dependency_overrides.clear()


def test_database_health_executes_a_query():
    engine = MagicMock()
    app.dependency_overrides[get_engine] = lambda: engine
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/database")
        assert response.status_code == 200
        assert response.json()["status"] == "connected"
        query = engine.connect.return_value.__enter__.return_value.execute.call_args.args[0]
        assert str(query) == "SELECT 1"
    finally:
        app.dependency_overrides.clear()


def test_database_errors_do_not_expose_credentials():
    engine = MagicMock()
    engine.connect.side_effect = OperationalError("secret-database-url", {}, Exception("secret-password"))
    app.dependency_overrides[get_engine] = lambda: engine
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/database")
        assert response.status_code == 503
        assert response.json()["status"] == "unavailable"
        assert "secret" not in response.text
    finally:
        app.dependency_overrides.clear()


def test_password_special_characters_are_not_parsed_as_url_syntax():
    settings = Settings(_env_file=None, db_password="p@ss:/?#%word")
    assert settings.database_url.password == "p@ss:/?#%word"
