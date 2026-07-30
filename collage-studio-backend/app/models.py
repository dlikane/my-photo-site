"""Pydantic models for a CollageDoc: a recursive split tree of frames plus
independent seam "inserts". Mirrored in the frontend by src/model/collageTypes.ts
-- keep field names/shapes in sync between the two.
"""

from __future__ import annotations

import time
import uuid
from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

MAX_ZOOM = 1 / 0.3  # crop window never shrinks below ~30% of the base cover-crop box


def _id() -> str:
    return uuid.uuid4().hex[:12]


class FocalPoint(BaseModel):
    x: float = 0.5
    y: float = 0.5


class ImageRef(BaseModel):
    # Opaque session-scoped key (name|size|lastModified fingerprint, generated
    # client-side) into the frontend's in-memory image pool -- not a filesystem
    # path. The backend never resolves this itself; the frontend attaches the
    # matching bytes as a multipart upload when calling /api/export.
    imageKey: str
    focal: FocalPoint = Field(default_factory=FocalPoint)
    zoom: float = 1.0


class FrameNode(BaseModel):
    type: Literal["frame"] = "frame"
    id: str = Field(default_factory=_id)
    image: Optional[ImageRef] = None


class SplitNode(BaseModel):
    type: Literal["split"] = "split"
    id: str = Field(default_factory=_id)
    orientation: Literal["horizontal", "vertical"]
    ratio: float = 0.5
    first: "Node"
    second: "Node"


Node = Annotated[Union[FrameNode, SplitNode], Field(discriminator="type")]
SplitNode.model_rebuild()


class BorderSpec(BaseModel):
    width: int = 14
    color: str = "#000000"


class BorderConfig(BaseModel):
    external: BorderSpec = Field(default_factory=lambda: BorderSpec(width=14))
    grid: BorderSpec = Field(default_factory=lambda: BorderSpec(width=8))


class InsertBorder(BaseModel):
    enabled: bool = False
    width: int = 6
    color: str = "#ffffff"


class SeamRef(BaseModel):
    frameIdA: str
    frameIdB: str


class PositionPct(BaseModel):
    cxPct: float
    cyPct: float


class Insert(BaseModel):
    id: str = Field(default_factory=_id)
    sourceFrameId: str
    seam: Optional[SeamRef] = None
    position: Optional[PositionPct] = None
    sizePct: float = 0.26
    focal: FocalPoint = Field(default_factory=FocalPoint)
    zoom: float = 1.6
    featherPx: int = 18
    cornerRadiusPct: float = 0.08
    border: Optional[InsertBorder] = None


class CanvasSize(BaseModel):
    width: int = 2000
    height: int = 2500


class CollageDoc(BaseModel):
    id: str = Field(default_factory=_id)
    name: str = "Untitled collage"
    createdAt: float = Field(default_factory=time.time)
    updatedAt: float = Field(default_factory=time.time)
    canvas: CanvasSize = Field(default_factory=CanvasSize)
    border: BorderConfig = Field(default_factory=BorderConfig)
    jpegQuality: int = 92
    insertBorderDefault: InsertBorder = Field(default_factory=InsertBorder)
    tree: Node = Field(default_factory=FrameNode)
    inserts: list[Insert] = Field(default_factory=list)
