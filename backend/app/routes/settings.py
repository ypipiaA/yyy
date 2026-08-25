"""设置路由

个人资料契约（规格 §0.2）：{ "name": "小明", "height": "175" }
（字段名 name 而非 nickname；height 为字符串，兼容数值输入）。
"""
from typing import Literal, Optional, Union

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.common import get_or_create_settings, get_or_create_user

router = APIRouter()

THEME_WHITELIST = ("light", "dark", "midnight", "forest", "auto")


class ProfileUpdate(BaseModel):
    name: str = Field(default="", max_length=50)
    height: Optional[Union[str, float]] = ""

    @field_validator("height")
    @classmethod
    def _height_to_str(cls, v: Optional[Union[str, float]]) -> str:
        if v is None:
            return ""
        return str(v)[:20]


class SettingsUpdate(BaseModel):
    restDuration: Optional[int] = Field(default=None, ge=10, le=600)
    timerSound: Optional[bool] = None
    theme: Optional[Literal["light", "dark", "midnight", "forest", "auto"]] = None


@router.get("/profile")
def get_profile(db: Session = Depends(get_db)) -> dict:
    user = get_or_create_user(db)
    return {"name": user.nickname or "", "height": user.height or ""}


@router.put("/profile")
def update_profile(profile: ProfileUpdate, db: Session = Depends(get_db)) -> dict:
    user = get_or_create_user(db)
    user.nickname = profile.name
    user.height = profile.height
    db.commit()
    return {"message": "资料已更新"}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)) -> dict:
    settings = get_or_create_settings(db)
    return {
        "restDuration": settings.rest_duration,
        "timerSound": bool(settings.timer_sound),
        "theme": settings.theme,
    }


@router.put("/settings")
def update_settings(
    settings_update: SettingsUpdate, db: Session = Depends(get_db)
) -> dict:
    settings = get_or_create_settings(db)
    if settings_update.restDuration is not None:
        settings.rest_duration = settings_update.restDuration
    if settings_update.timerSound is not None:
        settings.timer_sound = int(settings_update.timerSound)
    if settings_update.theme is not None:
        settings.theme = settings_update.theme
    db.commit()
    return {"message": "设置已更新"}
