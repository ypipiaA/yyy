"""pytest 公共 fixture：内存 SQLite + StaticPool + get_db 依赖覆盖"""
import os
import tempfile
from typing import Iterator

# 必须在导入 app 之前设置，避免测试污染 backend/data/fittrack.db
_tmpdir = tempfile.mkdtemp(prefix="fittrack-test-")
os.environ["FITTRACK_DB_PATH"] = os.path.join(_tmpdir, "startup.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services.common import get_or_create_user  # noqa: E402


@pytest.fixture()
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    # 预建默认用户（对齐应用启动行为）
    db: Session = TestingSessionLocal()
    try:
        get_or_create_user(db)
    finally:
        db.close()

    def override_get_db() -> Iterator[Session]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


# ---- 规格 §0.2 的示例 JSON（原文），供各测试复用 ----

SAMPLE_PLAN = {
    "goal": "muscle",
    "goalLabel": "增肌塑形",
    "days": 4,
    "level": "beginner",
    "createdAt": "2026-08-25T10:00:00.000Z",
    "planDays": [
        {
            "name": "第 1 天",
            "focus": "推（胸/肩/三头）",
            "exercises": [
                {
                    "name": "杠铃卧推",
                    "muscle": "胸",
                    "equipment": "杠铃",
                    "sets": 4,
                    "reps": "8-12",
                    "rest": 90,
                }
            ],
        }
    ],
}

SAMPLE_LOG = {
    "date": "2026-08-25T12:34:56.000Z",
    "dayName": "第 1 天",
    "focus": "推（胸/肩/三头）",
    "duration": 3120,
    "exercises": [
        {
            "name": "杠铃卧推",
            "muscle": "胸",
            "sets": [{"weight": 60, "reps": 10, "done": True}],
        }
    ],
}

SAMPLE_BODY = {"date": "2026-08-25", "weight": 65.5}

SAMPLE_PROFILE = {"name": "小明", "height": "175"}
