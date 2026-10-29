from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, BeforeValidator

from app.modules.vocabulary.custom_labels import clean_label, require_unique_labels

Label = Literal["kanji", "hiragana", "katakana", "romaji", "note"]


class InputModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class CategoryCreate(InputModel):
    name: str = Field(min_length=1, max_length=255)


class CategoryRead(BaseModel):
    id: int
    name: str
    entry_count: int = 0


CustomLabel = Annotated[str, BeforeValidator(clean_label)]


class CustomField(InputModel):
    label: CustomLabel
    value: str = Field(max_length=10000)


class EntryFields(InputModel):
    custom_fields: list[CustomField] = Field(default_factory=list, max_length=100)

    @field_validator("custom_fields")
    @classmethod
    def unique_custom_fields(cls, fields):
        require_unique_labels([field.label for field in fields])
        return fields

    kanji: str | None = Field(default=None, max_length=1000)
    hiragana: str | None = Field(default=None, max_length=1000)
    katakana: str | None = Field(default=None, max_length=1000)
    romaji: str | None = Field(default=None, max_length=1000)
    note: str | None = Field(default=None, max_length=10000)

    @field_validator("kanji", "hiragana", "katakana", "romaji", "note")
    @classmethod
    def empty_to_none(cls, value):
        return value or None


class EntryCreate(EntryFields):
    word: str = Field(min_length=1, max_length=255)


class EntryUpdate(EntryFields):
    word: str | None = Field(default=None, min_length=1, max_length=255)

    @field_validator("word")
    @classmethod
    def supplied_word_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("Word cannot be empty.")
        return value


class EntryRead(EntryCreate):
    id: int
    category_id: int
    created_at: datetime
    updated_at: datetime


class EntryPage(BaseModel):
    items: list[EntryRead]
    total: int


class DefaultTemplate(InputModel):
    labels: list[Label] = Field(max_length=5)
    custom_labels: list[CustomLabel] = Field(default_factory=list, max_length=100)

    @field_validator("custom_labels")
    @classmethod
    def unique_custom_labels(cls, names):
        return require_unique_labels(names)


    @field_validator("labels")
    @classmethod
    def no_duplicates(cls, value):
        if len(value) != len(set(value)):
            raise ValueError("Each label can only appear once.")
        return value
