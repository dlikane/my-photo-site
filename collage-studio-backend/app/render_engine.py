"""Compositing engine: split-tree layout, cover-crop, and seam inserts.

Ported and generalized from the "Contrasts" prototype
(M:\\projects\\running\\photo_collages\\collage_maker.py). The old tool only ever
laid out 2-3 fixed dominant/support panels; this generalizes that into an
arbitrary recursive binary split tree (see app.models.Node). The crop-box math
(compute_crop_box) and the seam-adjacency math (_rects_adjacent_seam) are
otherwise unchanged, and are mirrored in the frontend's src/model/geometry.ts
so the live preview never diverges from this render path.
"""

import math
from io import BytesIO

from PIL import Image, ImageDraw, ImageFilter, ImageOps

from .models import CollageDoc, FrameNode, Insert, SplitNode

MAX_ZOOM = 1 / 0.02  # crop window never shrinks below ~2% of the base cover-crop box (kept high/effectively "unlimited" for editing; mirrored in frontend model/collageTypes.ts)


# --------------------------------------------------------------------------- image loading

class ImageStore:
    """Loads + caches source images (EXIF-orientation corrected, RGB) for the
    lifetime of a single render call, keyed by the frontend's session-scoped
    imageKey. Backed by in-memory bytes uploaded with the request -- this
    process never reads from local disk."""

    def __init__(self, image_bytes: dict[str, bytes]):
        self._bytes = image_bytes
        self._cache: dict[str, Image.Image] = {}

    def get(self, key: str) -> Image.Image:
        if key not in self._cache:
            data = self._bytes.get(key)
            if data is None:
                raise KeyError(f"No uploaded image data for key: {key}")
            img = Image.open(BytesIO(data))
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            self._cache[key] = img
        return self._cache[key]


# --------------------------------------------------------------------------- crop geometry

def compute_crop_box(src_w, src_h, target_w, target_h, focal_xy=(0.5, 0.5), zoom=1.0):
    """Cover-crop box in source pixel coords. zoom==1.0 is a plain focal-centred
    cover crop (only crops what's needed to match the target aspect ratio).
    zoom>1 crops in further, clamped so the box never shrinks below ~2% of the
    base box (i.e. up to ~50x tighter crop -- effectively unlimited for
    editing purposes, just not literally infinite)."""
    fx, fy = focal_xy
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        base_h = src_h
        base_w = src_h * target_ratio
    else:
        base_w = src_w
        base_h = src_w / target_ratio

    zoom = max(1.0, min(zoom, MAX_ZOOM))
    crop_w = base_w / zoom
    crop_h = base_h / zoom

    cx = src_w * fx
    cy = src_h * fy
    left = cx - crop_w / 2
    top = cy - crop_h / 2
    left = max(0, min(left, src_w - crop_w))
    top = max(0, min(top, src_h - crop_h))
    return (left, top, left + crop_w, top + crop_h)


def cover_crop(img, target_w, target_h, focal_xy=(0.5, 0.5), zoom=1.0, flip_h=False, flip_v=False):
    box = compute_crop_box(img.width, img.height, target_w, target_h, focal_xy, zoom)
    cropped = img.crop(box)
    tile = cropped.resize((max(1, round(target_w)), max(1, round(target_h))), Image.LANCZOS)
    if flip_h:
        tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
    if flip_v:
        tile = tile.transpose(Image.FLIP_TOP_BOTTOM)
    return tile


# --------------------------------------------------------------------------- split-tree layout

def resolve_rects(node, rect, gutter):
    """Recursively resolves a split tree into {frameId: (x, y, w, h)} canvas
    rects. Generalizes the prototype's fixed dominant/support compute_panel_rects
    into an arbitrary-depth binary split."""
    x, y, w, h = rect

    if isinstance(node, FrameNode):
        return {node.id: (x, y, w, h)}

    assert isinstance(node, SplitNode)
    ratio = max(0.0, min(1.0, node.ratio))

    if node.orientation == "horizontal":
        avail = max(0, w - gutter)
        w1 = round(avail * ratio)
        w2 = avail - w1
        rects = resolve_rects(node.first, (x, y, w1, h), gutter)
        rects.update(resolve_rects(node.second, (x + w1 + gutter, y, w2, h), gutter))
    else:
        avail = max(0, h - gutter)
        h1 = round(avail * ratio)
        h2 = avail - h1
        rects = resolve_rects(node.first, (x, y, w, h1), gutter)
        rects.update(resolve_rects(node.second, (x, y + h1 + gutter, w, h2), gutter))
    return rects


def collect_frames(node, out=None):
    """Flat {frameId: FrameNode} map over the whole tree."""
    if out is None:
        out = {}
    if isinstance(node, FrameNode):
        out[node.id] = node
    else:
        collect_frames(node.first, out)
        collect_frames(node.second, out)
    return out


# --------------------------------------------------------------------------- insert (seam accent)

def _rects_adjacent_seam(rect_a, rect_b, gutter):
    """Midpoint of the gutter gap between two rects. Tolerance is derived from
    the actual gutter width (not a fixed pixel constant) so this behaves the
    same at preview scale and full render resolution."""
    ax, ay, aw, ah = rect_a
    bx, by, bw, bh = rect_b
    tol = gutter + 4

    gap_a_right_of_b = bx - (ax + aw)
    gap_b_right_of_a = ax - (bx + bw)
    if abs(gap_a_right_of_b) <= tol or abs(gap_b_right_of_a) <= tol:
        seam_x = (ax + aw + bx) / 2 if abs(gap_a_right_of_b) <= tol else (bx + bw + ax) / 2
        y0 = max(ay, by)
        y1 = min(ay + ah, by + bh)
        return (seam_x, (y0 + y1) / 2)

    gap_a_below_b = by - (ay + ah)
    gap_b_below_a = ay - (by + bh)
    if abs(gap_a_below_b) <= tol or abs(gap_b_below_a) <= tol:
        seam_y = (ay + ah + by) / 2 if abs(gap_a_below_b) <= tol else (by + bh + ay) / 2
        x0 = max(ax, bx)
        x1 = min(ax + aw, bx + bw)
        return ((x0 + x1) / 2, seam_y)

    raise ValueError("Insert seam frames must be geometrically adjacent.")


def make_feathered_panel(img, size, focal_xy, zoom, corner_radius_frac, feather_px):
    w, h = size
    panel = cover_crop(img, w, h, focal_xy, zoom)
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(min(w, h) * corner_radius_frac)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    if feather_px > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather_px))
    return panel, mask


def _insert_border_spec(insert: Insert, default_border):
    return insert.border if insert.border is not None else default_border


def _insert_shadow_spec(insert: Insert, default_shadow):
    return insert.shadow if insert.shadow is not None else default_shadow


def make_insert_shadow(size, corner_radius_frac, color, opacity, blur_px):
    """A blurred, colored silhouette of the insert's rounded shape, padded so
    the blur has room to spread outward without being clipped. Returned as
    (solid color layer, alpha mask, pad) -- paste with the mask, offset by -pad."""
    w, h = size
    pad = int(blur_px * 3) + 4
    mask = Image.new("L", (w + pad * 2, h + pad * 2), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(min(w, h) * corner_radius_frac)
    alpha = max(0, min(255, round(255 * opacity)))
    draw.rounded_rectangle([pad, pad, pad + w - 1, pad + h - 1], radius=radius, fill=alpha)
    if blur_px > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(blur_px))
    color_layer = Image.new("RGB", mask.size, color)
    return color_layer, mask, pad


def paste_insert(canvas, doc: CollageDoc, insert: Insert, frame_rects, images, scale):
    if insert.position is not None:
        cx = insert.position.cxPct * canvas.width
        cy = insert.position.cyPct * canvas.height
    else:
        if insert.seam is None:
            raise ValueError(f"Insert {insert.id} has neither a seam nor a manual position.")
        rect_a = frame_rects.get(insert.seam.frameIdA)
        rect_b = frame_rects.get(insert.seam.frameIdB)
        if rect_a is None or rect_b is None:
            raise ValueError(f"Insert {insert.id} references a frame that no longer exists.")
        gutter = max(1, round(doc.border.grid.width * scale))
        cx, cy = _rects_adjacent_seam(rect_a, rect_b, gutter)

    if insert.imageKey is None:
        return None

    size_pct = insert.sizePct
    inset_size = max(1, int(min(canvas.width, canvas.height) * size_pct))
    feather = max(0, int(insert.featherPx * scale))

    img = images.get(insert.imageKey)
    focal_xy = (insert.focal.x, insert.focal.y)
    panel, mask = make_feathered_panel(img, (inset_size, inset_size), focal_xy, insert.zoom,
                                        insert.cornerRadiusPct, feather)

    px = int(cx - inset_size / 2)
    py = int(cy - inset_size / 2)

    shadow = _insert_shadow_spec(insert, doc.insertShadowDefault)
    if shadow and shadow.enabled:
        angle_rad = math.radians(shadow.angleDeg)
        offset = shadow.offsetPx * scale
        dx = math.cos(angle_rad) * offset
        dy = math.sin(angle_rad) * offset
        shadow_color, shadow_mask, shadow_pad = make_insert_shadow(
            (inset_size, inset_size), insert.cornerRadiusPct, shadow.color, shadow.opacity, shadow.blurPx * scale,
        )
        canvas.paste(shadow_color, (int(px + dx - shadow_pad), int(py + dy - shadow_pad)), shadow_mask)

    canvas.paste(panel, (px, py), mask)

    border = _insert_border_spec(insert, doc.insertBorderDefault)
    if border and border.enabled and border.width > 0:
        draw = ImageDraw.Draw(canvas)
        radius = int(min(inset_size, inset_size) * insert.cornerRadiusPct)
        bw = max(1, round(border.width * scale))
        draw.rounded_rectangle(
            [px, py, px + inset_size - 1, py + inset_size - 1],
            radius=radius, outline=border.color, width=bw,
        )

    return (px, py, inset_size, inset_size)


# --------------------------------------------------------------------------- top-level render

def render_collage(doc: CollageDoc, images: ImageStore, scale: float = 1.0) -> Image.Image:
    """Single render path used for both live preview export checks and the
    final high-res export -- parameterized only by scale."""
    canvas_w = max(1, round(doc.canvas.width * scale))
    canvas_h = max(1, round(doc.canvas.height * scale))
    ext_w = max(0, round(doc.border.external.width * scale))
    gutter = max(0, round(doc.border.grid.width * scale))

    canvas = Image.new("RGB", (canvas_w, canvas_h), doc.border.external.color)

    interior = (ext_w, ext_w, max(0, canvas_w - 2 * ext_w), max(0, canvas_h - 2 * ext_w))
    if interior[2] > 0 and interior[3] > 0:
        ix, iy, iw, ih = interior
        ImageDraw.Draw(canvas).rectangle([ix, iy, ix + iw - 1, iy + ih - 1], fill=doc.border.grid.color)

        frame_rects = resolve_rects(doc.tree, interior, gutter)
        frames = collect_frames(doc.tree)

        for frame_id, (x, y, w, h) in frame_rects.items():
            frame = frames[frame_id]
            if frame.image is None or w <= 0 or h <= 0:
                continue
            img = images.get(frame.image.imageKey)
            focal_xy = (frame.image.focal.x, frame.image.focal.y)
            tile = cover_crop(img, w, h, focal_xy, frame.image.zoom, frame.image.flipH, frame.image.flipV)
            canvas.paste(tile, (round(x), round(y)))

        for insert in doc.inserts:
            paste_insert(canvas, doc, insert, frame_rects, images, scale)

    return canvas
