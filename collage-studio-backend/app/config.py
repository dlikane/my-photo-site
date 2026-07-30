"""App-level settings: where collage JSON docs and rendered exports live.

Stored in appdata/config.json (gitignored). Auto-created on first run pointing
at folders inside appdata/ so the app works out of the box; repoint collagesDir/
outputDir (e.g. to a network drive) via the Settings panel, which calls save_config().
"""

import json
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPDATA_DIR = os.path.join(BACKEND_DIR, "appdata")
CONFIG_PATH = os.path.join(APPDATA_DIR, "config.json")

DEFAULTS = {
    "collagesDir": os.path.join(APPDATA_DIR, "collages"),
    "outputDir": os.path.join(APPDATA_DIR, "output"),
}


def _resolve(path):
    if not os.path.isabs(path):
        path = os.path.join(BACKEND_DIR, path)
    return os.path.normpath(path)


def load_config():
    if not os.path.exists(CONFIG_PATH):
        save_config(DEFAULTS)
        return dict(DEFAULTS)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    cfg = {**DEFAULTS, **cfg}
    cfg["collagesDir"] = _resolve(cfg["collagesDir"])
    cfg["outputDir"] = _resolve(cfg["outputDir"])
    os.makedirs(cfg["collagesDir"], exist_ok=True)
    os.makedirs(cfg["outputDir"], exist_ok=True)
    return cfg


def save_config(cfg):
    os.makedirs(APPDATA_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    return load_config()
