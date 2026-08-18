"""营养数据模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class NutritionGoal(Base):
    __tablename__ = "nutrition_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    calories = Column(Integer, default=2000)
    protein = Column(Integer, default=150)
    carbs = Column(Integer, default=250)
    fat = Column(Integer, default=65)
    fiber = Column(Integer, default=25)
    water = Column(Integer, default=2000)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String(100))
    date = Column(DateTime, default=datetime.now)
    foods = Column(JSON)
    total_calories = Column(Float, default=0)
    total_protein = Column(Float, default=0)
    total_carbs = Column(Float, default=0)
    total_fat = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.now)


class WaterRecord(Base):
    __tablename__ = "water_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    amount = Column(Integer, default=250)
    recorded_at = Column(DateTime, default=datetime.now)