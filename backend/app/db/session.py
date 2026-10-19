from functools import lru_cache

from sqlalchemy import Engine, create_engine

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine | None:
    url = get_settings().database_url
    if url is None:
        return None
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
