"""成就系统路由

成就/徽章 id 对照前端 js/achievements.js 的定义白名单校验，
未知 id 返回 422，防止脏数据入库。
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.achievement import Achievement, Badge
from ..services.common import get_or_create_user

router = APIRouter()

# 与 js/achievements.js 的 ACHIEVEMENTS 定义一致
ACHIEVEMENT_IDS = frozenset(
    {
        "firstWorkout",
        "tenWorkouts",
        "fiftyWorkouts",
        "hundredWorkouts",
        "threeDayStreak",
        "sevenDayStreak",
        "thirtyDayStreak",
        "firstHeavyLift",
        "totalVolume1000",
        "totalVolume10000",
        "firstMonth",
        "oneYear",
        "earlyBird",
        "nightOwl",
        "weekendWarrior",
    }
)

# 与 js/achievements.js 各成就 reward.value 一致
BADGE_IDS = frozenset(
    {
        "beginner",
        "dedicated",
        "veteran",
        "legend",
        "consistent",
        "committed",
        "champion",
        "strong",
        "powerlifter",
        "elite",
        "monthly",
        "yearly",
        "earlyBird",
        "nightOwl",
        "weekendWarrior",
    }
)


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    achievement_id: str
    unlocked_at: datetime


class BadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    badge_id: str
    earned_at: datetime


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(db: Session = Depends(get_db)) -> list:
    achievements = (
        db.query(Achievement)
        .filter(Achievement.user_id == DEFAULT_USER_ID)
        .order_by(Achievement.unlocked_at.desc())
        .all()
    )
    return achievements


@router.post("/achievements/{achievement_id}")
def unlock_achievement(achievement_id: str, db: Session = Depends(get_db)) -> dict:
    if achievement_id not in ACHIEVEMENT_IDS:
        raise HTTPException(status_code=422, detail="未知成就 id")
    get_or_create_user(db)
    existing = (
        db.query(Achievement)
        .filter(
            Achievement.achievement_id == achievement_id,
            Achievement.user_id == DEFAULT_USER_ID,
        )
        .first()
    )
    if existing:
        return {"message": "成就已解锁"}

    achievement = Achievement(
        user_id=DEFAULT_USER_ID, achievement_id=achievement_id
    )
    db.add(achievement)
    db.commit()
    return {"message": "成就已解锁"}


@router.get("/badges", response_model=List[BadgeResponse])
def get_badges(db: Session = Depends(get_db)) -> list:
    badges = (
        db.query(Badge)
        .filter(Badge.user_id == DEFAULT_USER_ID)
        .order_by(Badge.earned_at.desc())
        .all()
    )
    return badges


@router.post("/badges/{badge_id}")
def earn_badge(badge_id: str, db: Session = Depends(get_db)) -> dict:
    if badge_id not in BADGE_IDS:
        raise HTTPException(status_code=422, detail="未知徽章 id")
    get_or_create_user(db)
    existing = (
        db.query(Badge)
        .filter(Badge.badge_id == badge_id, Badge.user_id == DEFAULT_USER_ID)
        .first()
    )
    if existing:
        return {"message": "徽章已获得"}

    badge = Badge(user_id=DEFAULT_USER_ID, badge_id=badge_id)
    db.add(badge)
    db.commit()
    return {"message": "徽章已获得"}


@router.get("/stats")
def get_achievement_stats(db: Session = Depends(get_db)) -> dict:
    total_achievements = (
        db.query(Achievement)
        .filter(Achievement.user_id == DEFAULT_USER_ID)
        .count()
    )
    total_badges = (
        db.query(Badge).filter(Badge.user_id == DEFAULT_USER_ID).count()
    )

    return {
        "total_achievements": total_achievements,
        "total_badges": total_badges,
    }
