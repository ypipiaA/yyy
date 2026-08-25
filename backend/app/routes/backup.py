"""备份导入/导出路由

与前端备份格式一致：
{ "app": "fittrack", "version": 3, "exportedAt": "...",
  "data": { "plan": {...}|null, "logs": [...], "bodyRecords": [...],
            "profile": {"name": "...", "height": "..."} } }

导入时逐条校验，非法条目跳过并计数；事务内全量替换该用户数据。
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from ..database import DEFAULT_USER_ID, get_db
from ..models.body import BodyRecord
from ..models.plan import Plan
from ..models.workout import Workout, WorkoutExercise
from ..services.common import get_or_create_user
from ..utils.dates import now_iso
from .body import BodyRecordCreate
from .plans import PlanCreate, _insert_days, _plan_to_dict
from .workouts import WorkoutCreate, _workout_to_dict

router = APIRouter()

BACKUP_VERSION = 3


class BackupPayload(BaseModel):
    app: Optional[str] = None
    version: Optional[int] = None
    data: dict


def _export_data(db: Session) -> dict:
    user = get_or_create_user(db)
    active_plan = (
        db.query(Plan)
        .filter(Plan.user_id == DEFAULT_USER_ID, Plan.is_active == 1)
        .order_by(Plan.created_at.desc())
        .first()
    )
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == DEFAULT_USER_ID)
        .order_by(Workout.date.desc())
        .all()
    )
    body_records = (
        db.query(BodyRecord)
        .filter(BodyRecord.user_id == DEFAULT_USER_ID)
        .order_by(BodyRecord.date.desc(), BodyRecord.id.desc())
        .all()
    )
    return {
        "app": "fittrack",
        "version": BACKUP_VERSION,
        "exportedAt": now_iso(),
        "data": {
            "plan": _plan_to_dict(active_plan) if active_plan else None,
            "logs": [_workout_to_dict(w) for w in workouts],
            "bodyRecords": [
                {"id": r.id, "date": r.date, "weight": r.weight}
                for r in body_records
            ],
            "profile": {
                "name": user.nickname or "",
                "height": user.height or "",
            },
        },
    }


@router.get("/export")
def export_backup(db: Session = Depends(get_db)) -> dict:
    return _export_data(db)


@router.post("/export")
def export_backup_post(db: Session = Depends(get_db)) -> dict:
    return _export_data(db)


@router.post("/import")
def import_backup(payload: BackupPayload, db: Session = Depends(get_db)) -> dict:
    """事务内全量替换该用户数据；非法条目跳过并计数，不中断整体导入。"""
    user = get_or_create_user(db)
    data: dict = payload.data or {}
    imported = {"plan": 0, "logs": 0, "bodyRecords": 0, "profile": 0}
    skipped = {"plan": 0, "logs": 0, "bodyRecords": 0}

    try:
        # 全量清空该用户现有数据
        for plan in db.query(Plan).filter(Plan.user_id == DEFAULT_USER_ID).all():
            db.delete(plan)
        for workout in (
            db.query(Workout).filter(Workout.user_id == DEFAULT_USER_ID).all()
        ):
            db.delete(workout)
        db.query(BodyRecord).filter(
            BodyRecord.user_id == DEFAULT_USER_ID
        ).delete()
        db.flush()

        # 计划（单对象，缺失/非法时跳过）
        raw_plan = data.get("plan")
        if isinstance(raw_plan, dict):
            try:
                plan_data = PlanCreate.model_validate(raw_plan)
                plan = Plan(
                    user_id=DEFAULT_USER_ID,
                    goal=plan_data.goal,
                    goal_label=plan_data.goalLabel,
                    days_per_week=plan_data.days,
                    level=plan_data.level,
                    is_active=1,
                    created_at=plan_data.createdAt or now_iso(),
                )
                db.add(plan)
                db.flush()
                _insert_days(db, plan, plan_data.planDays)
                imported["plan"] = 1
            except ValidationError:
                skipped["plan"] += 1
        elif raw_plan is not None:
            skipped["plan"] += 1

        # 训练记录（逐条校验，非法条目跳过）
        raw_logs = data.get("logs")
        if isinstance(raw_logs, list):
            for raw_log in raw_logs:
                try:
                    log = WorkoutCreate.model_validate(raw_log)
                except (ValidationError, TypeError):
                    skipped["logs"] += 1
                    continue
                workout = Workout(
                    user_id=DEFAULT_USER_ID,
                    plan_id=None,
                    day_name=log.dayName,
                    focus=log.focus,
                    duration=log.duration,
                    date=log.date,
                )
                db.add(workout)
                db.flush()
                for ex in log.exercises:
                    volume = sum(s.weight * s.reps for s in ex.sets if s.done)
                    db.add(
                        WorkoutExercise(
                            workout_id=workout.id,
                            name=ex.name,
                            muscle=ex.muscle,
                            sets=[s.model_dump() for s in ex.sets],
                            volume=volume,
                        )
                    )
                imported["logs"] += 1

        # 体重记录（逐条校验）
        raw_records = data.get("bodyRecords")
        if isinstance(raw_records, list):
            for raw_record in raw_records:
                try:
                    record = BodyRecordCreate.model_validate(raw_record)
                except (ValidationError, TypeError):
                    skipped["bodyRecords"] += 1
                    continue
                db.add(
                    BodyRecord(
                        user_id=DEFAULT_USER_ID,
                        date=record.date,
                        weight=record.weight,
                    )
                )
                imported["bodyRecords"] += 1

        # 个人资料
        raw_profile = data.get("profile")
        if isinstance(raw_profile, dict):
            name = raw_profile.get("name")
            height = raw_profile.get("height")
            if isinstance(name, str):
                user.nickname = name[:50]
                imported["profile"] = 1
            if isinstance(height, (str, int, float)):
                user.height = str(height)[:20]
                imported["profile"] = 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"message": "导入完成", "imported": imported, "skipped": skipped}
