"""成就系统路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.achievement import Achievement, Badge

router = APIRouter()


class AchievementResponse(BaseModel):
    id: int
    achievement_id: str
    unlocked_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    badge_id: str
    earned_at: datetime

    class Config:
        from_attributes = True


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(db: Session = Depends(get_db)):
    achievements = db.query(Achievement).order_by(Achievement.unlocked_at.desc()).all()
    return achievements


@router.post("/achievements/{achievement_id}")
def unlock_achievement(achievement_id: str, db: Session = Depends(get_db)):
    existing = db.query(Achievement).filter(Achievement.achievement_id == achievement_id).first()
    if existing:
        return {"message": "成就已解锁"}
    
    achievement = Achievement(achievement_id=achievement_id)
    db.add(achievement)
    db.commit()
    return {"message": "成就已解锁"}


@router.get("/badges", response_model=List[BadgeResponse])
def get_badges(db: Session = Depends(get_db)):
    badges = db.query(Badge).order_by(Badge.earned_at.desc()).all()
    return badges


@router.post("/badges/{badge_id}")
def earn_badge(badge_id: str, db: Session = Depends(get_db)):
    existing = db.query(Badge).filter(Badge.badge_id == badge_id).first()
    if existing:
        return {"message": "徽章已获得"}
    
    badge = Badge(badge_id=badge_id)
    db.add(badge)
    db.commit()
    return {"message": "徽章已获得"}


@router.get("/stats")
def get_achievement_stats(db: Session = Depends(get_db)):
    total_achievements = db.query(Achievement).count()
    total_badges = db.query(Badge).count()
    
    return {
        "total_achievements": total_achievements,
        "total_badges": total_badges,
    }