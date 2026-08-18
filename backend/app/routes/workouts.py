"""训练记录路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.workout import Workout, WorkoutExercise

router = APIRouter()


class ExerciseSet(BaseModel):
    weight: float
    reps: int
    completed: bool


class WorkoutExerciseCreate(BaseModel):
    name: str
    category: str
    muscle: str
    sets: List[ExerciseSet]


class WorkoutCreate(BaseModel):
    plan_id: int = None
    day_number: int
    duration: int
    exercises: List[WorkoutExerciseCreate]


class ExerciseSetResponse(BaseModel):
    weight: float
    reps: int
    completed: bool


class WorkoutExerciseResponse(BaseModel):
    id: int
    name: str
    category: str
    muscle: str
    sets: List[ExerciseSetResponse]
    volume: float

    class Config:
        from_attributes = True


class WorkoutResponse(BaseModel):
    id: int
    plan_id: int = None
    day_number: int
    duration: int
    completed_at: datetime
    exercises: List[WorkoutExerciseResponse] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[WorkoutResponse])
def get_workouts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    workouts = db.query(Workout).order_by(Workout.completed_at.desc()).offset(skip).limit(limit).all()
    return workouts


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    return workout


@router.post("/", response_model=WorkoutResponse)
def create_workout(workout_data: WorkoutCreate, db: Session = Depends(get_db)):
    workout = Workout(
        plan_id=workout_data.plan_id,
        day_number=workout_data.day_number,
        duration=workout_data.duration
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    for exercise_data in workout_data.exercises:
        volume = sum(s.weight * s.reps for s in exercise_data.sets if s.completed)
        exercise = WorkoutExercise(
            workout_id=workout.id,
            name=exercise_data.name,
            category=exercise_data.category,
            muscle=exercise_data.muscle,
            sets=[s.dict() for s in exercise_data.sets],
            volume=volume
        )
        db.add(exercise)
    
    db.commit()
    db.refresh(workout)
    return workout


@router.get("/stats/summary")
def get_workout_summary(db: Session = Depends(get_db)):
    total = db.query(Workout).count()
    
    from datetime import timedelta
    from sqlalchemy import func
    week_ago = datetime.now() - timedelta(days=7)
    week_count = db.query(Workout).filter(Workout.completed_at >= week_ago).count()
    
    total_volume = db.query(func.sum(WorkoutExercise.volume)).scalar() or 0
    
    return {
        "total": total,
        "this_week": week_count,
        "total_volume": round(total_volume, 1)
    }