"""营养追踪路由

“今日”类端点接受客户端本地日期 ?date=YYYY-MM-DD（推荐显式传入，见规格 §0.3）；
缺省使用服务器本地今天。日期区间统一为半开区间 [day, day+1)。
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.nutrition import Meal, NutritionGoal, WaterRecord
from ..services.common import get_or_create_nutrition_goal, get_or_create_user
from ..utils.dates import DATE_RE, day_range

router = APIRouter()


class FoodItem(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fat: float = Field(ge=0)
    amount: int = Field(default=100, gt=0, le=5000)
    category: Optional[str] = None


class MealCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    foods: List[FoodItem] = Field(min_length=1)


class NutritionGoalCreate(BaseModel):
    calories: int = Field(default=2000, gt=0, le=20000)
    protein: int = Field(default=150, gt=0, le=1000)
    carbs: int = Field(default=250, gt=0, le=2000)
    fat: int = Field(default=65, gt=0, le=1000)
    fiber: int = Field(default=25, gt=0, le=500)
    water: int = Field(default=2000, gt=0, le=20000)


class WaterRecordCreate(BaseModel):
    amount: int = Field(default=250, gt=0, le=5000)


class MealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    date: datetime
    foods: List[FoodItem]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float


class NutritionGoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    calories: int
    protein: int
    carbs: int
    fat: int
    fiber: int
    water: int


@router.get("/goals", response_model=NutritionGoalResponse)
def get_nutrition_goals(db: Session = Depends(get_db)) -> NutritionGoal:
    return get_or_create_nutrition_goal(db)


@router.put("/goals", response_model=NutritionGoalResponse)
def update_nutrition_goals(
    goals_data: NutritionGoalCreate, db: Session = Depends(get_db)
) -> NutritionGoal:
    goals = get_or_create_nutrition_goal(db)
    for key, value in goals_data.model_dump().items():
        setattr(goals, key, value)
    db.commit()
    db.refresh(goals)
    return goals


@router.get("/meals", response_model=List[MealResponse])
def get_meals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list:
    meals = (
        db.query(Meal)
        .filter(Meal.user_id == DEFAULT_USER_ID)
        .order_by(Meal.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return meals


@router.post("/meals", response_model=MealResponse, status_code=201)
def create_meal(meal_data: MealCreate, db: Session = Depends(get_db)) -> Meal:
    get_or_create_user(db)
    total_calories = sum(f.calories * f.amount / 100 for f in meal_data.foods)
    total_protein = sum(f.protein * f.amount / 100 for f in meal_data.foods)
    total_carbs = sum(f.carbs * f.amount / 100 for f in meal_data.foods)
    total_fat = sum(f.fat * f.amount / 100 for f in meal_data.foods)

    meal = Meal(
        user_id=DEFAULT_USER_ID,
        name=meal_data.name,
        foods=[f.model_dump() for f in meal_data.foods],
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
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> dict:
    meal = (
        db.query(Meal)
        .filter(Meal.id == meal_id, Meal.user_id == DEFAULT_USER_ID)
        .first()
    )
    if not meal:
        raise HTTPException(status_code=404, detail="餐次不存在")
    db.delete(meal)
    db.commit()
    return {"message": "餐次已删除"}


@router.get("/today")
def get_today_nutrition(
    date: Optional[str] = Query(None, pattern=DATE_RE),
    db: Session = Depends(get_db),
) -> dict:
    """某日营养汇总。推荐显式传客户端本地日期 ?date=YYYY-MM-DD。"""
    start, end = day_range(date)

    meals = (
        db.query(Meal)
        .filter(
            Meal.user_id == DEFAULT_USER_ID,
            Meal.date >= start,
            Meal.date < end,
        )
        .all()
    )

    water_records = (
        db.query(WaterRecord)
        .filter(
            WaterRecord.user_id == DEFAULT_USER_ID,
            WaterRecord.recorded_at >= start,
            WaterRecord.recorded_at < end,
        )
        .all()
    )

    return {
        "calories": round(sum(m.total_calories for m in meals)),
        "protein": round(sum(m.total_protein for m in meals)),
        "carbs": round(sum(m.total_carbs for m in meals)),
        "fat": round(sum(m.total_fat for m in meals)),
        "water": sum(w.amount for w in water_records),
    }


@router.post("/water", status_code=201)
def add_water(
    water_data: WaterRecordCreate, db: Session = Depends(get_db)
) -> dict:
    get_or_create_user(db)
    record = WaterRecord(user_id=DEFAULT_USER_ID, amount=water_data.amount)
    db.add(record)
    db.commit()
    return {"message": "喝水记录已添加"}


@router.get("/water/today")
def get_today_water(
    date: Optional[str] = Query(None, pattern=DATE_RE),
    db: Session = Depends(get_db),
) -> dict:
    """某日饮水总量。推荐显式传客户端本地日期 ?date=YYYY-MM-DD。"""
    start, end = day_range(date)
    records = (
        db.query(WaterRecord)
        .filter(
            WaterRecord.user_id == DEFAULT_USER_ID,
            WaterRecord.recorded_at >= start,
            WaterRecord.recorded_at < end,
        )
        .all()
    )
    return {"total": sum(r.amount for r in records)}
