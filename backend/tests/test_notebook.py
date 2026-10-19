"""Exercise the real PostgreSQL API in a temporary schema, without changing user records."""
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from app.core.config import get_settings
from app.db.base import metadata
from app.main import app
from app.modules.vocabulary import service


@pytest.fixture
def client(monkeypatch):
    url = get_settings().database_url
    if url is None:
        pytest.skip("Configure local PostgreSQL to run integration tests.")
    admin = create_engine(url, connect_args={"connect_timeout": 10})
    schema = "jnb_test_" + uuid4().hex
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}", "connect_timeout": 10})
    try:
        metadata.create_all(engine)
        monkeypatch.setattr(service, "get_engine", lambda: engine)
        with TestClient(app) as test_client:
            yield test_client
    finally:
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


def category(client, name):
    response = client.post("/api/v1/categories", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_categories_validate_and_rename(client):
    assert client.post("/api/v1/categories", json={"name": "   "}).status_code == 422
    first = category(client, " Noun ")
    assert client.post("/api/v1/categories", json={"name": "noun"}).status_code == 409
    second = category(client, "Verb")
    assert client.patch(f"/api/v1/categories/{second}", json={"name": " NOUN "}).status_code == 409
    renamed = client.patch(f"/api/v1/categories/{first}", json={"name": "Nouns"})
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Nouns"
    assert client.get("/api/v1/categories").json()[0]["entry_count"] == 0


def test_word_only_optional_fields_and_partial_update(client):
    cid = category(client, "Expressions")
    path = f"/api/v1/categories/{cid}/entries"
    assert client.post(path, json={"word": "   "}).status_code == 422
    saved = client.post(path, json={"word": "こんにちは", "hiragana": " ", "note": "hello"}).json()
    assert saved["hiragana"] is None
    patched = client.patch(f'/api/v1/entries/{saved["id"]}', json={"romaji": "konnichiwa"})
    assert patched.status_code == 200
    assert patched.json()["word"] == "こんにちは"
    assert patched.json()["note"] == "hello"
    assert patched.json()["romaji"] == "konnichiwa"
    assert client.patch(f'/api/v1/entries/{saved["id"]}', json={"word": None}).status_code == 422
    cleared = client.patch(f'/api/v1/entries/{saved["id"]}', json={"note": None}).json()
    assert cleared["note"] is None
    assert client.post(path, json={"word": "こんにちは"}).status_code == 201


def test_categories_own_independent_entries_and_delete_cascades(client):
    first, second = category(client, "Noun"), category(client, "Lesson 3")
    a = client.post(f"/api/v1/categories/{first}/entries", json={"word": "勉強", "note": "study"}).json()
    b = client.post(f"/api/v1/categories/{second}/entries", json={"word": "勉強", "romaji": "benkyou"}).json()
    assert a["id"] != b["id"]
    assert client.delete(f"/api/v1/categories/{first}").status_code == 204
    assert client.patch(f'/api/v1/entries/{a["id"]}', json={"note": "missing"}).status_code == 404
    rows = client.get(f"/api/v1/categories/{second}/entries").json()["items"]
    assert len(rows) == 1 and rows[0]["id"] == b["id"] and rows[0]["note"] is None
    assert client.delete(f'/api/v1/entries/{b["id"]}').status_code == 204
    assert client.get("/api/v1/categories").json()[0]["entry_count"] == 0


def test_template_is_global_optional_and_persistent(client):
    path = "/api/v1/vocabulary/settings/default-template"
    assert client.put(path, json={"labels": ["romaji", "romaji"]}).status_code == 422
    assert client.put(path, json={"labels": ["meaning"]}).status_code == 422
    assert client.put(path, json={"labels": ["note", "hiragana"]}).status_code == 200
    cid = category(client, "Verb")
    assert client.post(f"/api/v1/categories/{cid}/entries", json={"word": "食べる"}).status_code == 201
    assert client.get(path).json() == {"labels": ["note", "hiragana"]}
    assert client.put(path, json={"labels": []}).status_code == 200
    assert client.get(path).json() == {"labels": []}


def test_search_pagination_and_missing_category(client):
    cid = category(client, "Search")
    path = f"/api/v1/categories/{cid}/entries"
    for word, note in [("食べる", "eat"), ("読む", "read"), ("割合", "100%")]:
        assert client.post(path, json={"word": word, "note": note}).status_code == 201
    assert client.get(path, params={"q": "EAT"}).json()["total"] == 1
    assert client.get(path, params={"q": "%"}).json()["total"] == 1
    response = client.get(path, params={"limit": 1, "offset": 1}).json()
    assert response["total"] == 3 and response["items"][0]["word"] == "読む"
    assert client.get("/api/v1/categories/999999/entries").status_code == 404
    assert client.post("/api/v1/categories/999999/entries", json={"word": "test"}).status_code == 404
