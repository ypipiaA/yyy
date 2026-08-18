"""FitTrack 健身助手后端"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routes import plans, workouts, body, stats, settings, nutrition, achievements
from app.database import engine, Base

app = FastAPI(
    title="FitTrack API",
    description="FitTrack 健身助手后端 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

Base.metadata.create_all(bind=engine)

frontend_path = Path(__file__).parent.parent
app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")