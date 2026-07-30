from fastapi import APIRouter

from ..config import load_config, save_config
from ..models import AppConfig

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("", response_model=AppConfig)
def get_config():
    return load_config()


@router.put("", response_model=AppConfig)
def put_config(cfg: AppConfig):
    return save_config(cfg.model_dump())
