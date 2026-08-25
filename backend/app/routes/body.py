"""身体数据路由

契约（规格 §0.2）：{ "id": 1, "date": "2026-08-25", "weight": 65.5 }
date 为客户端本地日期字符串，允许补录任意日期。
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.body import BodyRecord
from ..services.common import get_or_create_user
from ..utils.dates import DATE_RE

router = APIRouter()


class BodyRecordCreate(BaseModel):
    date: str = Field(pattern=DATE_RE)
    weight: float = Field(gt=20, lt=400)


class BodyRecordResponse(BaseModel):
    id: int
    date: str
    weight: float


def _record_to_dict(record: BodyRecord) -> dict:
    return {"id": record.id, "date": record.date, "weight": record.weight}


def _get_record_or_404(db: Session, record_id: int) -> BodyRecord:
    record = (
        db.query(BodyRecord)
        .filter(
            BodyRecord.id == record_id, BodyRecord.user_id == DEFAULT_USER_ID
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("/", response_model=List[BodyRecordResponse])
def get_body_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list:
    records = (
        db.query(BodyRecord)
        .filter(BodyRecord.user_id == DEFAULT_USER_ID)
        .order_by(BodyRecord.date.desc(), BodyRecord.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_record_to_dict(r) for r in records]


# 注意：/latest 必须先于 /{record_id} 注册
@router.get("/latest", response_model=BodyRecordResponse)
def get_latest_record(db: Session = Depends(get_db)) -> dict:
    """最新体重记录；无记录时 404（前端 catch 后兜底本地数据）。"""
    record = (
        db.query(BodyRecord)
        .filter(BodyRecord.user_id == DEFAULT_USER_ID)
        .order_by(BodyRecord.date.desc(), BodyRecord.id.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="no records")
    return _record_to_dict(record)


@router.post("/", response_model=BodyRecordResponse, status_code=201)
def create_body_record(
    record_data: BodyRecordCreate, db: Session = Depends(get_db)
) -> dict:
    get_or_create_user(db)
    record = BodyRecord(
        user_id=DEFAULT_USER_ID,
        date=record_data.date,
        weight=record_data.weight,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_to_dict(record)


@router.put("/{record_id}", response_model=BodyRecordResponse)
def update_body_record(
    record_id: int, record_data: BodyRecordCreate, db: Session = Depends(get_db)
) -> dict:
    record = _get_record_or_404(db, record_id)
    record.date = record_data.date
    record.weight = record_data.weight
    db.commit()
    db.refresh(record)
    return _record_to_dict(record)


@router.delete("/{record_id}")
def delete_body_record(record_id: int, db: Session = Depends(get_db)) -> dict:
    record = _get_record_or_404(db, record_id)
    db.delete(record)
    db.commit()
    return {"message": "记录已删除"}
