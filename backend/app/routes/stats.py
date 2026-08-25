"""统计路由

- streak 语义对齐前端 stats.js calcStreak：今天没练但昨天练过时不归零；
- “今日/按日”端点接受客户端本地日期 ?date=YYYY-MM-DD 作为锚点（推荐显式传入）；
- 完成组的判定字段为 done（对齐规格 §0.2，不是 completed）。
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.workout import Workout, WorkoutExercise
from ..services.common import calculate_streak, workout_summary
from ..utils.dates import DATE_RE, parse_client_iso

router = APIRouter()


def _anchor_date(date_str: Optional[str]) -> datetime:
    if date_str:
        return datetime.strptime(date_str, "%Y-%m-%d")
    now = datetime.now()
    return datetime(now.year, now.month, now.day)


@router.get("/overview")
def get_stats_overview(
    date: Optional[str] = Query(None, pattern=DATE_RE),
    db: Session = Depends(get_db),
) -> dict:
    summary = workout_summary(db)

    total_sets = 0
    exercises = (
        db.query(WorkoutExercise)
        .join(Workout, WorkoutExercise.workout_id == Workout.id)
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .all()
    )
    for ex in exercises:
        if isinstance(ex.sets, list):
            total_sets += len(
                [s for s in ex.sets if isinstance(s, dict) and s.get("done")]
            )

    total_duration = (
        db.query(func.sum(Workout.duration))
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .scalar()
        or 0
    )

    anchor = _anchor_date(date).date()
    streak = calculate_streak(db, anchor)

    return {
        "total_workouts": summary["total"],
        "week_workouts": summary["this_week"],
        "total_volume": summary["total_volume"],
        "total_sets": total_sets,
        "total_duration": total_duration,
        "streak": streak,
    }


@router.get("/weekly")
def get_weekly_stats(
    date: Optional[str] = Query(None, pattern=DATE_RE),
    db: Session = Depends(get_db),
) -> list:
    """以锚点日期（缺省服务器本地今天）为末日的最近 7 天训练次数。"""
    anchor = _anchor_date(date).date()

    counts: dict = {}
    rows = db.query(Workout.date).filter(Workout.user_id == DEFAULT_USER_ID).all()
    for (raw,) in rows:
        if not raw:
            continue
        try:
            day = parse_client_iso(raw).date()
        except ValueError:
            continue
        counts[day] = counts.get(day, 0) + 1

    week_data = []
    for i in range(6, -1, -1):
        day = anchor - timedelta(days=i)
        week_data.append({"date": day.isoformat(), "count": counts.get(day, 0)})
    return week_data


@router.get("/muscle")
def get_muscle_stats(db: Session = Depends(get_db)) -> list:
    exercises = (
        db.query(WorkoutExercise)
        .join(Workout, WorkoutExercise.workout_id == Workout.id)
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .all()
    )
    muscle_count: dict = {}
    for exercise in exercises:
        muscle = exercise.muscle
        if muscle:
            muscle_count[muscle] = muscle_count.get(muscle, 0) + 1

    return [{"muscle": k, "count": v} for k, v in muscle_count.items()]


@router.get("/progress/{exercise_name}")
def get_exercise_progress(
    exercise_name: str, db: Session = Depends(get_db)
) -> list:
    """某动作历次训练的最大重量（仅统计已完成组，date 返回客户端原始时间戳）。"""
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .order_by(Workout.date)
        .all()
    )
    progress = []
    for workout in workouts:
        for exercise in workout.exercises:
            if exercise.name != exercise_name:
                continue
            max_weight = 0.0
            if isinstance(exercise.sets, list):
                for s in exercise.sets:
                    if isinstance(s, dict) and s.get("done"):
                        max_weight = max(max_weight, s.get("weight", 0) or 0)
            progress.append({"date": workout.date, "weight": max_weight})

    return progress
