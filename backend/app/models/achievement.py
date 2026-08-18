"""成就数据模型"""
from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime

from ..database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    achievement_id = Column(String(50))
    unlocked_at = Column(DateTime, default=datetime.now)


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    badge_id = Column(String(50))
    earned_at = Column(DateTime, default=datetime.now)