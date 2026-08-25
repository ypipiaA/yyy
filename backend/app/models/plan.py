"""训练计划模型

字段与前端 localStorage 契约（规格 §0.2）对齐：
Plan.goal_label ↔ goalLabel、Plan.days_per_week ↔ days、
PlanDay.focus ↔ focus、PlanExercise.equipment ↔ equipment。
created_at 保存客户端提供的 ISO 字符串原文，不做时区转换。
"""
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    goal = Column(String(20))
    goal_label = Column(String(50), default="")
    days_per_week = Column(Integer)
    level = Column(String(20))
    is_active = Column(Integer, default=0)
    # 客户端 ISO 时间戳原文（如 2026-08-25T10:00:00.000Z）
    created_at = Column(String(40), default="")

    user = relationship("User", back_populates="plans")
    days = relationship(
        "PlanDay",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PlanDay.day_number",
    )


class PlanDay(Base):
    __tablename__ = "plan_days"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="CASCADE"))
    day_number = Column(Integer)
    name = Column(String(50))
    focus = Column(String(100), default="")

    plan = relationship("Plan", back_populates="days")
    exercises = relationship(
        "PlanExercise",
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="PlanExercise.id",
    )


class PlanExercise(Base):
    __tablename__ = "plan_exercises"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("plan_days.id", ondelete="CASCADE"))
    name = Column(String(100))
    muscle = Column(String(50), default="")
    equipment = Column(String(50), default="")
    sets = Column(Integer)
    reps = Column(String(20))
    rest = Column(Integer)

    day = relationship("PlanDay", back_populates="exercises")
