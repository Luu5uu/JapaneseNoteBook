from fastapi import APIRouter, Query, Response

from app.modules.vocabulary import service
from app.modules.vocabulary.schemas import (
    CategoryCreate, CategoryRead, EntryCreate, EntryUpdate,
    EntryRead, EntryPage, DefaultTemplate,
)

router = APIRouter(tags=["Vocabulary"])


@router.get("/categories", response_model=list[CategoryRead])
def get_categories():
    return service.list_categories()


@router.post("/categories", response_model=CategoryRead, status_code=201)
def add_category(data: CategoryCreate):
    return service.create_category(data.name)


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def rename_category(category_id: int, data: CategoryCreate):
    return service.rename_category(category_id, data.name)


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int):
    service.delete_category(category_id)
    return Response(status_code=204)


@router.get("/categories/{category_id}/entries", response_model=EntryPage)
def get_entries(category_id: int, q: str = Query(default="", max_length=255),
                limit: int = Query(default=100, ge=1, le=200),
                offset: int = Query(default=0, ge=0)):
    return service.list_entries(category_id, q, limit, offset)


@router.post("/categories/{category_id}/entries", response_model=EntryRead, status_code=201)
def add_entry(category_id: int, data: EntryCreate):
    return service.create_entry(category_id, data.model_dump())


@router.patch("/entries/{entry_id}", response_model=EntryRead)
def edit_entry(entry_id: int, data: EntryUpdate):
    return service.update_entry(entry_id, data.model_dump(exclude_unset=True))


@router.delete("/entries/{entry_id}", status_code=204)
def remove_entry(entry_id: int):
    service.delete_entry(entry_id)
    return Response(status_code=204)


@router.get("/vocabulary/settings/default-template", response_model=DefaultTemplate)
def get_template():
    return service.get_template()


@router.put("/vocabulary/settings/default-template", response_model=DefaultTemplate)
def set_template(data: DefaultTemplate):
    return service.save_template(data.labels, data.custom_labels)
