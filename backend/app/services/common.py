"""共享业务逻辑：get-or-create 与统计汇总

- get-or-create（User/UserSettings/NutritionGoal）统一在此实现，各路由复用；
- workout_summary 同时服务于 GET /api/workouts/stats/summary 与 GET /api/stats/overview，
  消除两处重复实现；
- calculate_streak 对齐前端 stats.js calcStreak 语义：
  最近一次训练在今天或昨天均可起算（昨天有训练、今天还没练时 streak 不归零）。
"""
from datetime import date as date_cls
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID
from ..models.nutrition import NutritionGoal
from ..models.user import User, UserSettings
from ..models.workout import Workout, WorkoutExercise
from ..utils.dates import parse_client_iso


def get_or_create_user(db: Session) -> User:
    """获取（或创建）默认用户。单机单用户，id 恒为 DEFAULT_USER_ID。"""
    user = db.get(User, DEFAULT_USER_ID)
    if not user:
        user = User(id=DEFAULT_USER_ID, nickname="")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_or_create_settings(db: Session) -> UserSettings:
    user = get_or_create_user(db)
    settings = (
        db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    )
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_or_create_nutrition_goal(db: Session) -> NutritionGoal:
    user = get_or_create_user(db)
    goal = db.query(NutritionGoal).filter(NutritionGoal.user_id == user.id).first()
    if not goal:
        goal = NutritionGoal(user_id=user.id)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal


def workout_summary(db: Session) -> dict:
    """训练统计汇总（供 /api/workouts/stats/summary 与 /api/stats/overview 共用）。"""
    base = db.query(Workout).filter(Workout.user_id == DEFAULT_USER_ID)
    total = base.count()

    # ISO 字符串按字典序即时间序，可直接比较
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S")
    week_count = base.filter(Workout.date >= week_ago).count()

    total_volume = (
        db.query(func.sum(WorkoutExercise.volume))
        .join(Workout, WorkoutExercise.workout_id == Workout.id)
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .scalar()
        or 0
    )

    return {
        "total": total,
        "this_week": week_count,
        "total_volume": round(total_volume, 1),
    }


def workout_days(db: Session) -> set:
    """该用户所有训练发生的日期集合（set[date]）。"""
    rows = (
        db.query(Workout.date).filter(Workout.user_id == DEFAULT_USER_ID).all()
    )
    days = set()
    for (raw,) in rows:
        if not raw:
            continue
        try:
            days.add(parse_client_iso(raw).date())
        except ValueError:
            continue
    return days


def calculate_streak(db: Session, anchor: Optional[date_cls] = None) -> int:
    """连续训练天数。anchor 为客户端“今天”（缺省用服务器本地今天）。

    今天没练但昨天练过时，从昨天起算，不归零。
    """
    days = workout_days(db)
    if not days:
        return 0
    today = anchor or datetime.now().date()
    start = today if today in days else today - timedelta(days=1)
    if start not in days:
        return 0
    streak = 0
    current = start
    while current in days:
        streak += 1
        current -= timedelta(days=1)
    return streak
