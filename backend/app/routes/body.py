"""身体数据路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.body import BodyRecord

router = APIRouter()


class BodyRecordCreate(BaseModel):
    weight: float


class BodyRecordResponse(BaseModel):
    id: int
    weight: float
    recorded_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[BodyRecordResponse])
def get_body_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = db.query(BodyRecord).order_by(BodyRecord.recorded_at.desc()).offset(skip).limit(limit).all()
    return records


@router.get("/latest")
def get_latest_record(db: Session = Depends(get_db)):
    record = db.query(BodyRecord).order_by(BodyRecord.recorded_at.desc()).first()
    if not record:
        return None
    return {"weight": record.weight, "recorded_at": record.recorded_at}


@router.post("/", response_model=BodyRecordResponse)
def create_body_record(record_data: BodyRecordCreate, db: Session = Depends(get_db)):
    record = BodyRecord(weight=record_data.weight)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_body_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(BodyRecord).filter(BodyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"message": "记录已删除"}