"""训练记录路由

请求/响应逐字段对齐前端 localStorage 契约（规格 §0.2，camelCase）：
{ id, date, dayName, focus, duration, planId?, exercises: [ { name, muscle,
  sets: [ { weight, reps, done } ] } ] }
完成标记字段统一为 done（不是 completed）；date 由客户端提供，原样存储。
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.plan import Plan
from ..models.workout import Workout, WorkoutExercise
from ..services.common import get_or_create_user, workout_summary
from ..utils.dates import DATE_RE

router = APIRouter()


class SetIn(BaseModel):
    weight: float = Field(ge=0)
    reps: int = Field(ge=0)
    done: bool = False


class WorkoutExerciseIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    muscle: str = Field(default="", max_length=50)
    sets: List[SetIn] = []


class WorkoutCreate(BaseModel):
    date: str
    dayName: str = Field(default="", max_length=50)
    focus: str = Field(default="", max_length=100)
    duration: int = Field(ge=0)
    planId: Optional[int] = None
    exercises: List[WorkoutExerciseIn] = []

    @field_validator("date")
    @classmethod
    def _valid_iso(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("date 必须是 ISO 时间字符串")
        return v


class SetOut(BaseModel):
    weight: float
    reps: int
    done: bool


class WorkoutExerciseOut(BaseModel):
    name: str
    muscle: str
    sets: List[SetOut]


class WorkoutResponse(BaseModel):
    id: int
    date: str
    dayName: str
    focus: str
    duration: int
    planId: Optional[int] = None
    exercises: List[WorkoutExerciseOut]


def _workout_to_dict(workout: Workout) -> dict:
    return {
        "id": workout.id,
        "date": workout.date or "",
        "dayName": workout.day_name or "",
        "focus": workout.focus or "",
        "duration": workout.duration or 0,
        "planId": workout.plan_id,
        "exercises": [
            {
                "name": ex.name,
                "muscle": ex.muscle or "",
                "sets": [
                    {
                        "weight": s.get("weight", 0),
                        "reps": s.get("reps", 0),
                        "done": bool(s.get("done")),
                    }
                    for s in (ex.sets or [])
                    if isinstance(s, dict)
                ],
            }
            for ex in workout.exercises
        ],
    }


def _get_workout_or_404(db: Session, workout_id: int) -> Workout:
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == DEFAULT_USER_ID)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    return workout


@router.get("/", response_model=List[WorkoutResponse])
def get_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    date_from: Optional[str] = Query(None, pattern=DATE_RE),
    date_to: Optional[str] = Query(None, pattern=DATE_RE),
    db: Session = Depends(get_db),
) -> list:
    """训练记录列表（最新在前）。date_from/date_to 为客户端本地日期，闭区间。"""
    query = db.query(Workout).filter(Workout.user_id == DEFAULT_USER_ID)
    # ISO 字符串按字典序即时间序：[date_from, date_to+1) 半开区间
    if date_from:
        query = query.filter(Workout.date >= date_from)
    if date_to:
        end = (
            datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
        ).strftime("%Y-%m-%d")
        query = query.filter(Workout.date < end)
    workouts = (
        query.order_by(Workout.date.desc()).offset(skip).limit(limit).all()
    )
    return [_workout_to_dict(w) for w in workouts]


# 注意：/stats/summary 必须先于 /{workout_id} 注册
@router.get("/stats/summary")
def get_workout_summary(db: Session = Depends(get_db)) -> dict:
    """训练统计摘要（与 /api/stats/overview 共享 service，消除重复实现）。"""
    return workout_summary(db)


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)) -> dict:
    return _workout_to_dict(_get_workout_or_404(db, workout_id))


@router.post("/", response_model=WorkoutResponse, status_code=201)
def create_workout(
    workout_data: WorkoutCreate, db: Session = Depends(get_db)
) -> dict:
    """创建训练记录（单事务）。planId 可空（自由训练）；无效 planId 置空不报错。"""
    get_or_create_user(db)
    plan_id = workout_data.planId
    if plan_id is not None:
        exists = (
            db.query(Plan.id)
            .filter(Plan.id == plan_id, Plan.user_id == DEFAULT_USER_ID)
            .first()
        )
        if not exists:
            plan_id = None
    try:
        workout = Workout(
            user_id=DEFAULT_USER_ID,
            plan_id=plan_id,
            day_name=workout_data.dayName,
            focus=workout_data.focus,
            duration=workout_data.duration,
            date=workout_data.date,
        )
        db.add(workout)
        db.flush()
        for ex_data in workout_data.exercises:
            volume = sum(s.weight * s.reps for s in ex_data.sets if s.done)
            db.add(
                WorkoutExercise(
                    workout_id=workout.id,
                    name=ex_data.name,
                    muscle=ex_data.muscle,
                    sets=[s.model_dump() for s in ex_data.sets],
                    volume=volume,
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(workout)
    return _workout_to_dict(workout)


@router.delete("/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)) -> dict:
    workout = _get_workout_or_404(db, workout_id)
    db.delete(workout)
    db.commit()
    return {"message": "训练记录已删除"}
