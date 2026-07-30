import json
import re
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from ..models import CollageDoc
from ..render_engine import ImageStore, render_collage

router = APIRouter(prefix="/api", tags=["export"])


def _safe_filename(name: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9 _-]", "_", name).strip()
    return safe or "collage"


@router.post("/export")
async def export(
    doc: str = Form(...),
    imageKeys: list[str] = Form(default=[]),
    images: list[UploadFile] = File(default=[]),
):
    """Stateless render: the frontend sends the collage JSON plus the raw
    bytes for every image it references (matched by imageKeys[i] <-> images[i]).
    Nothing is read from or written to local disk -- the rendered JPEG is
    streamed straight back in the response."""
    try:
        doc_obj = CollageDoc.model_validate(json.loads(doc))
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(400, f"Invalid collage doc: {e}")

    if len(imageKeys) != len(images):
        raise HTTPException(400, "imageKeys and images must be the same length")

    image_bytes = {key: await upload.read() for key, upload in zip(imageKeys, images)}

    try:
        final = render_collage(doc_obj, ImageStore(image_bytes), scale=1.0)
    except (KeyError, ValueError) as e:
        raise HTTPException(400, str(e))

    buf = BytesIO()
    final.save(buf, format="JPEG", quality=doc_obj.jpegQuality, subsampling=0)
    buf.seek(0)

    filename = f"{_safe_filename(doc_obj.name)}.jpg"
    return StreamingResponse(
        buf,
        media_type="image/jpeg",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
