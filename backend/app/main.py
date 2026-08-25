"""FitTrack 健身助手后端"""
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import Base, SessionLocal, engine
from app.routes import (
    achievements,
    backup,
    body,
    nutrition,
    plans,
    settings,
    stats,
    workouts,
)
from app.services.common import get_or_create_user

logger = logging.getLogger("fittrack")

app = FastAPI(
    title="FitTrack API",
    description="FitTrack 健身助手后端 API（单机单用户）",
    version="1.1.0",
)

# CORS：默认仅允许本机来源；可用 FITTRACK_CORS_ORIGINS（逗号分隔）覆盖。
# 不再使用 allow_origins=["*"] 与 allow_credentials=True 同开的危险组合。
_cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FITTRACK_CORS_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plans.router, prefix="/api/plans", tags=["训练计划"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["训练记录"])
app.include_router(body.router, prefix="/api/body", tags=["身体数据"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])
app.include_router(settings.router, prefix="/api/settings", tags=["设置"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["营养追踪"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["成就系统"])
app.include_router(backup.router, prefix="/api/backup", tags=["备份"])

Base.metadata.create_all(bind=engine)

# 启动时确保默认用户存在（单机单用户）
_db = SessionLocal()
try:
    get_or_create_user(_db)
finally:
    _db.close()


class FrontendStaticFiles(StaticFiles):
    """前端静态资源挂载：屏蔽后端源码、数据库、配置等敏感路径。"""

    _blocked_dirs = frozenset(
        {"backend", "data", "app", "tests", "docs", ".git", ".claude"}
    )
    _blocked_suffixes = (".py", ".db", ".sqlite", ".sqlite3", ".toml")

    async def get_response(self, path: str, scope: Any) -> Any:
        # Windows 下 Starlette 会把路径规范成反斜杠，先统一分隔符
        normalized = path.replace("\\", "/").lstrip("/").lower()
        first_segment = normalized.split("/", 1)[0]
        if (
            first_segment in self._blocked_dirs
            or normalized.endswith(self._blocked_suffixes)
        ):
            raise StarletteHTTPException(status_code=404)
        return await super().get_response(path, scope)


# 静态挂载必须放在所有 API 路由注册之后；
# frontend_path 指向项目根（index.html 所在目录），而非 backend/。
frontend_path = Path(__file__).resolve().parent.parent.parent
if (frontend_path / "index.html").is_file():
    app.mount(
        "/",
        FrontendStaticFiles(directory=str(frontend_path), html=True),
        name="frontend",
    )
else:
    logger.warning(
        "未找到前端 index.html（%s），跳过静态资源挂载", frontend_path
    )
