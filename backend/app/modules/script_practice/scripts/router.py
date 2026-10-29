from fastapi import APIRouter, HTTPException, Query

from app.modules.script_practice.scripts.schemas import ScriptCreate
from app.modules.script_practice.scripts import service

router = APIRouter(
    prefix="/scripts",
    tags=["Scripts"],
)


@router.post("", status_code=201)
def create_script(data: ScriptCreate):
    return service.create_script(data)

@router.get("/{script_id}")
def get_script(script_id: int):
    script = service.get_script(script_id)

    if script is None:
        raise HTTPException(
            status_code=404,
            detail="Script not found.",
        )

    return script

@router.get("")
def list_scripts(limit: int = Query(24, ge=1, le=100), offset: int = Query(0, ge=0)):
    return service.list_scripts(limit, offset)
