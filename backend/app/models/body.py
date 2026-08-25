"""身体数据模型

date 为客户端本地日期字符串 YYYY-MM-DD（允许补录任意日期），
与前端契约 {"id": 1, "date": "2026-08-25", "weight": 65.5} 逐字段一致。
"""
from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class BodyRecord(Base):
    __tablename__ = "body_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    date = Column(String(10), index=True)
    weight = Column(Float)

    user = relationship("User", back_populates="body_records")
