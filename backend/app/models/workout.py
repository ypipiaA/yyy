"""训练记录模型

Workout.date 保存客户端提供的 ISO 时间戳原文（规格 §0.3：后端不得用服务器时间覆盖）。
ISO 字符串按字典序即时间序，可直接用于排序与范围过滤。
WorkoutExercise.sets 为 JSON 数组，元素形如 {"weight": 60, "reps": 10, "done": true}
（完成标记字段统一为 done，不是 completed）。
"""
from sqlalchemy import JSON, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    plan_id = Column(
        Integer, ForeignKey("plans.id", ondelete="SET NULL"), nullable=True
    )
    day_name = Column(String(50), default="")
    focus = Column(String(100), default="")
    duration = Column(Integer, default=0)
    # 客户端 ISO 时间戳原文
    date = Column(String(40), index=True)

    user = relationship("User", back_populates="workouts")
    exercises = relationship(
        "WorkoutExercise",
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.id",
    )


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"))
    name = Column(String(100))
    muscle = Column(String(50), default="")
    sets = Column(JSON)
    volume = Column(Float, default=0)

    workout = relationship("Workout", back_populates="exercises")
