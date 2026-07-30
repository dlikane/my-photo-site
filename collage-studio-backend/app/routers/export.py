import json
import os

from fastapi import APIRouter, HTTPException

from ..config import load_config
from ..models import CollageDoc
from ..render_engine import export_collage

router = APIRouter(prefix="/api/collages", tags=["export"])


@router.post("/{doc_id}/export")
def export(doc_id: str):
    cfg = load_config()
    path = os.path.join(cfg["collagesDir"], f"{doc_id}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"No collage with id {doc_id}")
    with open(path, "r", encoding="utf-8") as f:
        doc = CollageDoc.model_validate(json.load(f))

    try:
        output_path = export_collage(doc, cfg["outputDir"])
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(400, str(e))

    return {"path": output_path}
