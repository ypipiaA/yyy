"""训练计划路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.plan import Plan, PlanDay, PlanExercise

router = APIRouter()


class ExerciseCreate(BaseModel):
    name: str
    sets: int
    reps: str
    rest: int
    category: str
    muscle: str
    description: str = ""
    tips: str = ""


class DayCreate(BaseModel):
    day_number: int
    name: str
    muscle_groups: List[str]
    exercises: List[ExerciseCreate]


class PlanCreate(BaseModel):
    name: str
    goal: str
    days_per_week: int
    level: str
    days: List[DayCreate]


class PlanResponse(BaseModel):
    id: int
    name: str
    goal: str
    days_per_week: int
    level: str
    is_active: int
    created_at: datetime
    days: list = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).all()
    return plans


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")
    return plan


@router.post("/", response_model=PlanResponse)
def create_plan(plan_data: PlanCreate, db: Session = Depends(get_db)):
    plan = Plan(
        name=plan_data.name,
        goal=plan_data.goal,
        days_per_week=plan_data.days_per_week,
        level=plan_data.level
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    for day_data in plan_data.days:
        day = PlanDay(
            plan_id=plan.id,
            day_number=day_data.day_number,
            name=day_data.name,
            muscle_groups=day_data.muscle_groups
        )
        db.add(day)
        db.commit()
        db.refresh(day)

        for exercise_data in day_data.exercises:
            exercise = PlanExercise(
                day_id=day.id,
                **exercise_data.dict()
            )
            db.add(exercise)
    
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{plan_id}/activate")
def activate_plan(plan_id: int, db: Session = Depends(get_db)):
    db.query(Plan).update({Plan.is_active: 0})
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")
    plan.is_active = 1
    db.commit()
    return {"message": "计划已激活"}


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")
    db.delete(plan)
    db.commit()
    return {"message": "计划已删除"}