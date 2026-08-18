"""训练记录模型"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    plan_id = Column(Integer, nullable=True)
    day_number = Column(Integer)
    duration = Column(Integer)
    completed_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="workouts")
    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String(100))
    category = Column(String(50))
    muscle = Column(String(50))
    sets = Column(JSON)
    volume = Column(Float, default=0)

    workout = relationship("Workout", back_populates="exercises")