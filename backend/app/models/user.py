"""用户模型"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), default="")
    # 前端契约中 height 为字符串（如 "175"），原样存取
    height = Column(String(20), default="")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    plans = relationship("Plan", back_populates="user")
    workouts = relationship("Workout", back_populates="user")
    body_records = relationship("BodyRecord", back_populates="user")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    rest_duration = Column(Integer, default=90)
    timer_sound = Column(Integer, default=1)
    theme = Column(String(20), default="light")

    user = relationship("User", back_populates="settings")
