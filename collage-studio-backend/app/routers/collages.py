import glob
import json
import os
import time

from fastapi import APIRouter, HTTPException

from ..config import load_config
from ..models import CollageDoc, CollageSummary

router = APIRouter(prefix="/api/collages", tags=["collages"])


def _doc_path(collages_dir: str, doc_id: str) -> str:
    return os.path.join(collages_dir, f"{doc_id}.json")


@router.get("", response_model=list[CollageSummary])
def list_collages():
    cfg = load_config()
    summaries = []
    for path in glob.glob(os.path.join(cfg["collagesDir"], "*.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            summaries.append(CollageSummary(id=data["id"], name=data.get("name", data["id"]),
                                             updatedAt=data.get("updatedAt", 0)))
        except (json.JSONDecodeError, KeyError, OSError):
            continue
    summaries.sort(key=lambda s: s.updatedAt, reverse=True)
    return summaries


@router.post("", response_model=CollageDoc)
def create_collage(name: str = "Untitled collage"):
    cfg = load_config()
    doc = CollageDoc(name=name)
    _save(cfg["collagesDir"], doc)
    return doc


@router.get("/{doc_id}", response_model=CollageDoc)
def get_collage(doc_id: str):
    cfg = load_config()
    path = _doc_path(cfg["collagesDir"], doc_id)
    if not os.path.exists(path):
        raise HTTPException(404, f"No collage with id {doc_id}")
    with open(path, "r", encoding="utf-8") as f:
        return CollageDoc.model_validate(json.load(f))


@router.put("/{doc_id}", response_model=CollageDoc)
def update_collage(doc_id: str, doc: CollageDoc):
    if doc.id != doc_id:
        raise HTTPException(400, "Body id does not match URL id")
    cfg = load_config()
    doc.updatedAt = time.time()
    _save(cfg["collagesDir"], doc)
    return doc


@router.delete("/{doc_id}")
def delete_collage(doc_id: str):
    cfg = load_config()
    path = _doc_path(cfg["collagesDir"], doc_id)
    if not os.path.exists(path):
        raise HTTPException(404, f"No collage with id {doc_id}")
    os.remove(path)
    return {"deleted": doc_id}


def _save(collages_dir: str, doc: CollageDoc):
    os.makedirs(collages_dir, exist_ok=True)
    with open(_doc_path(collages_dir, doc.id), "w", encoding="utf-8") as f:
        f.write(doc.model_dump_json(indent=2))
