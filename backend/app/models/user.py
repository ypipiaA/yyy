"""用户模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), default="用户")
    height = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    plans = relationship("Plan", back_populates="user")
    workouts = relationship("Workout", back_populates="user")
    body_records = relationship("BodyRecord", back_populates="user")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    rest_duration = Column(Integer, default=90)
    timer_sound = Column(Integer, default=1)
    theme = Column(String(20), default="light")

    user = relationship("User", back_populates="settings")