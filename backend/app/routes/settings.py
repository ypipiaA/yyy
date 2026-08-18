"""设置路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models.user import User, UserSettings

router = APIRouter()


class ProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    height: Optional[float] = None


class SettingsUpdate(BaseModel):
    rest_duration: Optional[int] = None
    timer_sound: Optional[int] = None
    theme: Optional[str] = None


@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(nickname="用户")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "nickname": user.nickname,
        "height": user.height
    }


@router.put("/profile")
def update_profile(profile: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User()
        db.add(user)
    
    if profile.nickname is not None:
        user.nickname = profile.nickname
    if profile.height is not None:
        user.height = profile.height
    
    db.commit()
    return {"message": "资料已更新"}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(nickname="用户")
        db.add(user)
        db.commit()
    
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()
    
    return {
        "rest_duration": settings.rest_duration,
        "timer_sound": settings.timer_sound,
        "theme": settings.theme
    }


@router.put("/settings")
def update_settings(settings_update: SettingsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(nickname="用户")
        db.add(user)
        db.commit()
    
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
    
    if settings_update.rest_duration is not None:
        settings.rest_duration = settings_update.rest_duration
    if settings_update.timer_sound is not None:
        settings.timer_sound = settings_update.timer_sound
    if settings_update.theme is not None:
        settings.theme = settings_update.theme
    
    db.commit()
    return {"message": "设置已更新"}