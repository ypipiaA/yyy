"""训练计划路由

请求/响应逐字段对齐前端 localStorage 契约（规格 §0.2，camelCase）：
{ id, goal, goalLabel, days, level, createdAt, planDays: [ { name, focus,
  exercises: [ { name, muscle, equipment, sets, reps, rest } ] } ] }
"""
from datetime import datetime
from typing import List, Literal, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.plan import Plan, PlanDay, PlanExercise
from ..services.common import get_or_create_user
from ..utils.dates import now_iso

router = APIRouter()


class ExerciseIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    muscle: str = Field(default="", max_length=50)
    equipment: str = Field(default="", max_length=50)
    sets: int = Field(gt=0, le=20)
    reps: Union[int, str] = ""
    rest: int = Field(ge=0, le=600)


class PlanDayIn(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    focus: str = Field(default="", max_length=100)
    exercises: List[ExerciseIn] = []


class PlanCreate(BaseModel):
    goal: Literal["muscle", "fat", "strength", "endurance"]
    goalLabel: str = Field(default="", max_length=50)
    days: int = Field(ge=1, le=7)
    level: Literal["beginner", "intermediate", "advanced"]
    createdAt: Optional[str] = None
    planDays: List[PlanDayIn]

    @field_validator("createdAt")
    @classmethod
    def _valid_iso(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("createdAt 必须是 ISO 时间字符串")
        return v


class ExerciseOut(BaseModel):
    name: str
    muscle: str
    equipment: str
    sets: int
    reps: Union[int, str]
    rest: int


class PlanDayOut(BaseModel):
    name: str
    focus: str
    exercises: List[ExerciseOut]


class PlanResponse(BaseModel):
    id: int
    goal: str
    goalLabel: str
    days: int
    level: str
    createdAt: str
    isActive: bool
    planDays: List[PlanDayOut]


def _plan_to_dict(plan: Plan) -> dict:
    return {
        "id": plan.id,
        "goal": plan.goal,
        "goalLabel": plan.goal_label or "",
        "days": plan.days_per_week,
        "level": plan.level,
        "createdAt": plan.created_at or "",
        "isActive": bool(plan.is_active),
        "planDays": [
            {
                "name": day.name,
                "focus": day.focus or "",
                "exercises": [
                    {
                        "name": ex.name,
                        "muscle": ex.muscle or "",
                        "equipment": ex.equipment or "",
                        "sets": ex.sets,
                        "reps": ex.reps,
                        "rest": ex.rest,
                    }
                    for ex in day.exercises
                ],
            }
            for day in plan.days
        ],
    }


def _insert_days(db: Session, plan: Plan, plan_days: List[PlanDayIn]) -> None:
    """在当前事务内写入训练日与动作（不 commit，由调用方统一提交）。"""
    for index, day_data in enumerate(plan_days, start=1):
        day = PlanDay(
            plan_id=plan.id,
            day_number=index,
            name=day_data.name,
            focus=day_data.focus,
        )
        db.add(day)
        db.flush()
        for ex in day_data.exercises:
            db.add(
                PlanExercise(
                    day_id=day.id,
                    name=ex.name,
                    muscle=ex.muscle,
                    equipment=ex.equipment,
                    sets=ex.sets,
                    reps=str(ex.reps),
                    rest=ex.rest,
                )
            )


def _get_plan_or_404(db: Session, plan_id: int) -> Plan:
    plan = (
        db.query(Plan)
        .filter(Plan.id == plan_id, Plan.user_id == DEFAULT_USER_ID)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")
    return plan


@router.get("/", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)) -> list:
    """所有计划：激活计划排在最前（前端取 plans[0] 作为当前计划）。"""
    plans = (
        db.query(Plan)
        .filter(Plan.user_id == DEFAULT_USER_ID)
        .order_by(Plan.is_active.desc(), Plan.created_at.desc())
        .all()
    )
    return [_plan_to_dict(p) for p in plans]


# 注意：/active 必须先于 /{plan_id} 注册
@router.get("/active", response_model=PlanResponse)
def get_active_plan(db: Session = Depends(get_db)) -> dict:
    plan = (
        db.query(Plan)
        .filter(Plan.user_id == DEFAULT_USER_ID, Plan.is_active == 1)
        .order_by(Plan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="没有激活的计划")
    return _plan_to_dict(plan)


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)) -> dict:
    return _plan_to_dict(_get_plan_or_404(db, plan_id))


@router.post("/", response_model=PlanResponse, status_code=201)
def create_plan(plan_data: PlanCreate, db: Session = Depends(get_db)) -> dict:
    """创建计划（单事务）：新计划自动成为激活计划。"""
    get_or_create_user(db)
    try:
        db.query(Plan).filter(Plan.user_id == DEFAULT_USER_ID).update(
            {Plan.is_active: 0}
        )
        plan = Plan(
            user_id=DEFAULT_USER_ID,
            goal=plan_data.goal,
            goal_label=plan_data.goalLabel,
            days_per_week=plan_data.days,
            level=plan_data.level,
            is_active=1,
            created_at=plan_data.createdAt or now_iso(),
        )
        db.add(plan)
        db.flush()
        _insert_days(db, plan, plan_data.planDays)
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(plan)
    return _plan_to_dict(plan)


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int, plan_data: PlanCreate, db: Session = Depends(get_db)
) -> dict:
    """整体替换计划内容（单事务：删旧 days 重建）。"""
    plan = _get_plan_or_404(db, plan_id)
    try:
        plan.goal = plan_data.goal
        plan.goal_label = plan_data.goalLabel
        plan.days_per_week = plan_data.days
        plan.level = plan_data.level
        if plan_data.createdAt:
            plan.created_at = plan_data.createdAt
        for day in list(plan.days):
            db.delete(day)
        db.flush()
        _insert_days(db, plan, plan_data.planDays)
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(plan)
    return _plan_to_dict(plan)


@router.put("/{plan_id}/activate")
def activate_plan(plan_id: int, db: Session = Depends(get_db)) -> dict:
    """激活计划：先查目标计划（404 早退），再在同一事务内去激活其余。"""
    plan = _get_plan_or_404(db, plan_id)
    db.query(Plan).filter(
        Plan.user_id == DEFAULT_USER_ID, Plan.id != plan.id
    ).update({Plan.is_active: 0})
    plan.is_active = 1
    db.commit()
    return {"message": "计划已激活"}


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)) -> dict:
    plan = _get_plan_or_404(db, plan_id)
    db.delete(plan)
    db.commit()
    return {"message": "计划已删除"}
