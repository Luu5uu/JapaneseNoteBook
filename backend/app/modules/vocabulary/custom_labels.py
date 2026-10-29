"""Shared validation for custom field names and saved layouts."""
import unicodedata

RESERVED_LABELS = {"word", "kanji", "hiragana", "katakana", "romaji", "note"}


def clean_label(value: str) -> str:
    # Normalize width and whitespace before checking reserved or duplicate names.
    if not isinstance(value, str):
        raise ValueError("Custom label names must be text.")
    name = " ".join(unicodedata.normalize("NFKC", value).split())
    if not name or len(name) > 80:
        raise ValueError("Custom label names must contain 1 to 80 characters.")
    if name.lower() in RESERVED_LABELS:
        raise ValueError(f"{name} is a built-in field. Use the existing field instead.")
    return name


def require_unique_labels(names: list[str]) -> list[str]:
    keys = [name.lower() for name in names]
    if len(keys) != len(set(keys)):
        raise ValueError("Each custom label can only appear once, ignoring letter case.")
    return names
