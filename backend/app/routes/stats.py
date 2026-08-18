"""统计路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..database import get_db
from ..models.workout import Workout, WorkoutExercise
from ..models.body import BodyRecord

router = APIRouter()


@router.get("/overview")
def get_stats_overview(db: Session = Depends(get_db)):
    total_workouts = db.query(Workout).count()
    
    week_ago = datetime.now() - timedelta(days=7)
    week_workouts = db.query(Workout).filter(Workout.completed_at >= week_ago).count()
    
    total_volume = db.query(func.sum(WorkoutExercise.volume)).scalar() or 0
    
    total_sets = 0
    workouts = db.query(WorkoutExercise).all()
    for w in workouts:
        if isinstance(w.sets, list):
            total_sets += len([s for s in w.sets if isinstance(s, dict) and s.get("completed")])
    
    total_duration = db.query(func.sum(Workout.duration)).scalar() or 0
    
    streak = calculate_streak(db)
    
    return {
        "total_workouts": total_workouts,
        "week_workouts": week_workouts,
        "total_volume": round(total_volume, 1),
        "total_sets": total_sets,
        "total_duration": total_duration,
        "streak": streak
    }


def calculate_streak(db: Session) -> int:
    workouts = db.query(Workout).order_by(Workout.completed_at.desc()).all()
    if not workouts:
        return 0
    
    streak = 0
    today = datetime.now().date()
    
    for workout in workouts:
        workout_date = workout.completed_at.date()
        if workout_date == today - timedelta(days=streak):
            streak += 1
        elif workout_date < today - timedelta(days=streak):
            break
    
    return streak


@router.get("/weekly")
def get_weekly_stats(db: Session = Depends(get_db)):
    today = datetime.now().date()
    week_data = []
    
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = db.query(Workout).filter(
            func.date(Workout.completed_at) == date
        ).count()
        week_data.append({
            "date": date.isoformat(),
            "count": count
        })
    
    return week_data


@router.get("/muscle")
def get_muscle_stats(db: Session = Depends(get_db)):
    exercises = db.query(WorkoutExercise).all()
    muscle_count = {}
    
    for exercise in exercises:
        muscle = exercise.muscle
        if muscle:
            muscle_count[muscle] = muscle_count.get(muscle, 0) + 1
    
    return [{"muscle": k, "count": v} for k, v in muscle_count.items()]


@router.get("/progress/{exercise_name}")
def get_exercise_progress(exercise_name: str, db: Session = Depends(get_db)):
    workouts = db.query(Workout).order_by(Workout.completed_at).all()
    progress = []
    
    for workout in workouts:
        for exercise in workout.exercises:
            if exercise.name == exercise_name:
                max_weight = 0
                if isinstance(exercise.sets, list):
                    for s in exercise.sets:
                        if isinstance(s, dict) and s.get("completed"):
                            max_weight = max(max_weight, s.get("weight", 0))
                
                progress.append({
                    "date": workout.completed_at.isoformat(),
                    "weight": max_weight
                })
    
    return progress