from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Response, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.db.session import get_engine
from app.modules.vocabulary.router import router as vocabulary_router
from app.modules.vocabulary.service import NotebookError
from app.modules.script_practice.scripts.router import router as scripts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine = get_engine()
    if engine is not None:
        engine.dispose()
    get_engine.cache_clear()


app = FastAPI(title="JapaneseNoteBook API", version="0.1.0", lifespan=lifespan)
app.include_router(vocabulary_router, prefix="/api/v1")
app.include_router(scripts_router, prefix="/api/v1")


@app.exception_handler(NotebookError)
async def notebook_error(request: Request, error: NotebookError):
    return JSONResponse(status_code=error.status_code, content={"detail": error.message})


@app.exception_handler(IntegrityError)
async def conflict_error(request: Request, error: IntegrityError):
    constraint = getattr(getattr(error.orig, "diag", None), "constraint_name", "")
    message = ("A category with that name already exists."
               if constraint == "uq_categories_name_normalized"
               else "The record could not be saved because it conflicts with existing data.")
    return JSONResponse(status_code=409, content={"detail": message})


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, error: SQLAlchemyError):
    # Never include driver errors or connection details in public responses.
    return JSONResponse(status_code=503, content={"detail": "The database is unavailable. Please try again."})


class HealthResponse(BaseModel):
    status: Literal["ok", "connected", "not_configured", "unavailable"]
    message: str


@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health():
    return HealthResponse(status="ok", message="The API is running.")


@app.get("/api/v1/health/database", response_model=HealthResponse,
         responses={503: {"model": HealthResponse}}, tags=["Health"])
def database_health(response: Response, engine: Annotated[Engine | None, Depends(get_engine)]):
    if engine is None:
        response.status_code = 503
        return HealthResponse(status="not_configured", message="Database setup is required. Run the local database configuration script.")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        response.status_code = 503
        return HealthResponse(status="unavailable", message="Cannot connect to PostgreSQL. Check the database service and local configuration.")
    return HealthResponse(status="connected", message="The database connection is working.")
