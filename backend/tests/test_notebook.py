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
    assert client.get(path).json() == {"labels": ["note", "hiragana"], "custom_labels": []}
    assert client.put(path, json={"labels": []}).status_code == 200
    assert client.get(path).json() == {"labels": [], "custom_labels": []}


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


def test_custom_fields_round_trip_partial_update_and_removal(client):
    cid = category(client, "Custom")
    url = f"/api/v1/categories/{cid}/entries"
    fields = [{"label": "  Example   sentence  ", "value": "  パンを食べます。  "},
              {"label": "Meaning", "value": "eat"}, {"label": "Blank", "value": " "}]
    created = client.post(url, json={"word": "食べる", "hiragana": "たべる", "custom_fields": fields})
    assert created.status_code == 201, created.text
    entry = created.json()
    expected = [{"label": "Example sentence", "value": "パンを食べます。"}, {"label": "Meaning", "value": "eat"}]
    assert entry["custom_fields"] == expected
    path = f'/api/v1/entries/{entry["id"]}'
    assert client.patch(path, json={"note": "fixed note"}).json()["custom_fields"] == expected
    changed = client.patch(path, json={"custom_fields": [{"label": "Meaning", "value": "to eat"}]}).json()
    assert changed["hiragana"] == "たべる" and changed["note"] == "fixed note"
    assert changed["custom_fields"] == [{"label": "Meaning", "value": "to eat"}]
    assert client.get(url).json()["items"][0]["custom_fields"] == changed["custom_fields"]
    assert client.patch(path, json={"custom_fields": []}).json()["custom_fields"] == []


@pytest.mark.parametrize("labels", [["Meaning", " meaning "], ["Ｍｅａｎｉｎｇ", "Meaning"],
                                   ["Hiragana"], [" WORD "], ["Ｒｏｍａｊｉ"], [""], ["x" * 81], [123]])
def test_custom_label_validation_for_entries_and_templates(client, labels):
    cid = category(client, "Validation")
    response = client.post(f"/api/v1/categories/{cid}/entries", json={
        "word": "test", "custom_fields": [{"label": label, "value": "value"} for label in labels],
    })
    assert response.status_code == 422, response.text
    template = client.put("/api/v1/vocabulary/settings/default-template", json={"labels": [], "custom_labels": labels})
    assert template.status_code == 422, template.text
    assert client.get(f"/api/v1/categories/{cid}/entries").json()["total"] == 0


def test_one_hundred_custom_fields_search_pagination_and_template(client):
    cid = category(client, "Many fields")
    url = f"/api/v1/categories/{cid}/entries"
    fields = [{"label": f"Field {i}", "value": "100% literal" if i < 2 else f"value {i}"} for i in range(100)]
    response = client.post(url, json={"word": "test", "custom_fields": fields})
    assert response.status_code == 201, response.text
    assert len(response.json()["custom_fields"]) == 100
    result = client.get(url, params={"q": "%", "limit": 1}).json()
    assert result["total"] == 1 and len(result["items"][0]["custom_fields"]) == 100
    assert client.get(url, params={"q": "FIELD 99"}).json()["total"] == 1
    assert client.get(url, params={"q": "_"}).json()["total"] == 0
    assert client.post(url, json={"word": "too many", "custom_fields": fields + [{"label": "Extra", "value": "v"}]}).status_code == 422
    template = {"labels": ["hiragana", "note"], "custom_labels": [field["label"] for field in fields]}
    assert client.put("/api/v1/vocabulary/settings/default-template", json=template).status_code == 200
    assert client.get("/api/v1/vocabulary/settings/default-template").json() == template
    assert client.put("/api/v1/vocabulary/settings/default-template", json={"labels": [], "custom_labels": []}).status_code == 200
    assert len(client.get(url).json()["items"][0]["custom_fields"]) == 100


def test_custom_fields_independence_and_cascade(client):
    from app.modules.vocabulary.models import entry_fields
    from sqlalchemy import select, func
    a, b = category(client, "Verb"), category(client, "Review")
    def add(cid, value):
        return client.post(f"/api/v1/categories/{cid}/entries", json={
            "word": "食べる", "custom_fields": [{"label": "Meaning", "value": value}],
        }).json()
    first, second = add(a, "eat"), add(b, "to eat")
    client.patch(f'/api/v1/entries/{first["id"]}', json={"custom_fields": [{"label": "Meaning", "value": "changed"}]})
    assert client.get(f"/api/v1/categories/{b}/entries").json()["items"][0]["custom_fields"][0]["value"] == "to eat"
    assert client.delete(f"/api/v1/categories/{a}").status_code == 204
    with service.database().connect() as connection:
        assert connection.scalar(select(func.count()).select_from(entry_fields)) == 1
    assert client.delete(f'/api/v1/entries/{second["id"]}').status_code == 204
    with service.database().connect() as connection:
        assert connection.scalar(select(func.count()).select_from(entry_fields)) == 0
