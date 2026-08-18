"""训练计划模型"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String(100))
    goal = Column(String(20))
    days_per_week = Column(Integer)
    level = Column(String(20))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", back_populates="plans")
    days = relationship("PlanDay", back_populates="plan", cascade="all, delete-orphan")


class PlanDay(Base):
    __tablename__ = "plan_days"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    day_number = Column(Integer)
    name = Column(String(50))
    muscle_groups = Column(JSON)

    plan = relationship("Plan", back_populates="days")
    exercises = relationship("PlanExercise", back_populates="day", cascade="all, delete-orphan")


class PlanExercise(Base):
    __tablename__ = "plan_exercises"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("plan_days.id"))
    name = Column(String(100))
    sets = Column(Integer)
    reps = Column(String(20))
    rest = Column(Integer)
    category = Column(String(50))
    muscle = Column(String(50))
    description = Column(String(500))
    tips = Column(String(500))

    day = relationship("PlanDay", back_populates="exercises")