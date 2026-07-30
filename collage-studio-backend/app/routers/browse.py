"""Backend-driven filesystem browser.

Browsers can't hand back a real, reopenable absolute path from a native file
dialog (File System Access API / <input type=file> both withhold it for
security). Since this app only ever runs on localhost for a single local user,
the browser instead lists directories/images itself and the frontend renders
that as a picker panel -- selecting an image records the true absolute path,
which /api/collages and the export step can reopen later at full resolution.
"""

import hashlib
import os
import string

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

from ..config import APPDATA_DIR
from ..render_engine import IMAGE_EXTENSIONS

router = APIRouter(prefix="/api/browse", tags=["browse"])

THUMB_CACHE_DIR = os.path.join(APPDATA_DIR, "thumbcache")


def _is_image(name: str) -> bool:
    return os.path.splitext(name)[1].lower() in IMAGE_EXTENSIONS


@router.get("/roots")
def roots():
    if os.name == "nt":
        drives = []
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            if os.path.exists(drive):
                drives.append({"name": drive, "path": drive})
        return {"roots": drives}
    return {"roots": [{"name": "/", "path": "/"}]}


@router.get("/list")
def list_dir(path: str):
    if not os.path.isdir(path):
        raise HTTPException(404, f"Not a directory: {path}")

    entries = []
    try:
        with os.scandir(path) as it:
            for entry in it:
                try:
                    is_dir = entry.is_dir()
                except OSError:
                    continue
                if not is_dir and not _is_image(entry.name):
                    continue
                entries.append({
                    "name": entry.name,
                    "path": os.path.normpath(entry.path),
                    "isDir": is_dir,
                })
    except PermissionError:
        raise HTTPException(403, f"Permission denied: {path}")

    entries.sort(key=lambda e: (not e["isDir"], e["name"].lower()))
    parent = os.path.dirname(path.rstrip("\\/")) or None
    if parent == path:
        parent = None
    return {"path": os.path.normpath(path), "parent": parent, "entries": entries}


def _cached_derivative(path: str, kind: str, long_edge: int) -> str:
    if not os.path.isfile(path) or not _is_image(path):
        raise HTTPException(404, f"Not an image file: {path}")

    stat = os.stat(path)
    key = f"{path}|{stat.st_mtime_ns}|{stat.st_size}|{kind}|{long_edge}"
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
    os.makedirs(THUMB_CACHE_DIR, exist_ok=True)
    cache_path = os.path.join(THUMB_CACHE_DIR, f"{digest}.jpg")

    if not os.path.exists(cache_path):
        img = Image.open(path)
        img = ImageOps.exif_transpose(img).convert("RGB")
        scale = long_edge / max(img.width, img.height)
        if scale < 1:
            img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
        img.save(cache_path, quality=85)

    return cache_path


@router.get("/thumbnail")
def thumbnail(path: str, size: int = 256):
    cache_path = _cached_derivative(path, "thumb", size)
    return FileResponse(cache_path, media_type="image/jpeg")


@router.get("/preview")
def preview(path: str, size: int = 1600):
    cache_path = _cached_derivative(path, "preview", size)
    return FileResponse(cache_path, media_type="image/jpeg")
