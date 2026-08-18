"""营养追踪路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.nutrition import NutritionGoal, Meal, WaterRecord

router = APIRouter()


class FoodItem(BaseModel):
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    amount: int = 100
    category: Optional[str] = None


class MealCreate(BaseModel):
    name: str
    foods: List[FoodItem]


class NutritionGoalCreate(BaseModel):
    calories: int = 2000
    protein: int = 150
    carbs: int = 250
    fat: int = 65
    fiber: int = 25
    water: int = 2000


class WaterRecordCreate(BaseModel):
    amount: int = 250


class MealResponse(BaseModel):
    id: int
    name: str
    date: datetime
    foods: List[FoodItem]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    created_at: datetime

    class Config:
        from_attributes = True


class NutritionGoalResponse(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int
    fiber: int
    water: int

    class Config:
        from_attributes = True


@router.get("/goals", response_model=NutritionGoalResponse)
def get_nutrition_goals(db: Session = Depends(get_db)):
    goals = db.query(NutritionGoal).first()
    if not goals:
        goals = NutritionGoal()
        db.add(goals)
        db.commit()
        db.refresh(goals)
    return goals


@router.put("/goals", response_model=NutritionGoalResponse)
def update_nutrition_goals(goals_data: NutritionGoalCreate, db: Session = Depends(get_db)):
    goals = db.query(NutritionGoal).first()
    if not goals:
        goals = NutritionGoal()
        db.add(goals)
    
    for key, value in goals_data.dict().items():
        setattr(goals, key, value)
    
    db.commit()
    db.refresh(goals)
    return goals


@router.get("/meals", response_model=List[MealResponse])
def get_meals(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    meals = db.query(Meal).order_by(Meal.date.desc()).offset(skip).limit(limit).all()
    return meals


@router.post("/meals", response_model=MealResponse)
def create_meal(meal_data: MealCreate, db: Session = Depends(get_db)):
    total_calories = sum(f.calories * f.amount / 100 for f in meal_data.foods)
    total_protein = sum(f.protein * f.amount / 100 for f in meal_data.foods)
    total_carbs = sum(f.carbs * f.amount / 100 for f in meal_data.foods)
    total_fat = sum(f.fat * f.amount / 100 for f in meal_data.foods)
    
    meal = Meal(
        name=meal_data.name,
        foods=[f.dict() for f in meal_data.foods],
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fat=total_fat,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="餐次不存在")
    db.delete(meal)
    db.commit()
    return {"message": "餐次已删除"}


@router.get("/today")
def get_today_nutrition(db: Session = Depends(get_db)):
    from datetime import date
    today = date.today()
    
    meals = db.query(Meal).filter(
        Meal.date >= datetime.combine(today, datetime.min.time()),
        Meal.date < datetime.combine(today, datetime.max.time())
    ).all()
    
    total_calories = sum(m.total_calories for m in meals)
    total_protein = sum(m.total_protein for m in meals)
    total_carbs = sum(m.total_carbs for m in meals)
    total_fat = sum(m.total_fat for m in meals)
    
    water_records = db.query(WaterRecord).filter(
        WaterRecord.recorded_at >= datetime.combine(today, datetime.min.time()),
        WaterRecord.recorded_at < datetime.combine(today, datetime.max.time())
    ).all()
    
    total_water = sum(w.amount for w in water_records)
    
    return {
        "calories": round(total_calories),
        "protein": round(total_protein),
        "carbs": round(total_carbs),
        "fat": round(total_fat),
        "water": total_water,
    }


@router.post("/water")
def add_water(water_data: WaterRecordCreate, db: Session = Depends(get_db)):
    record = WaterRecord(amount=water_data.amount)
    db.add(record)
    db.commit()
    return {"message": "喝水记录已添加"}


@router.get("/water/today")
def get_today_water(db: Session = Depends(get_db)):
    from datetime import date
    today = date.today()
    
    records = db.query(WaterRecord).filter(
        WaterRecord.recorded_at >= datetime.combine(today, datetime.min.time()),
        WaterRecord.recorded_at < datetime.combine(today, datetime.max.time())
    ).all()
    
    total = sum(r.amount for r in records)
    return {"total": total}