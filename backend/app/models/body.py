"""身体数据模型"""
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class BodyRecord(Base):
    __tablename__ = "body_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    weight = Column(Float)
    recorded_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="body_records")