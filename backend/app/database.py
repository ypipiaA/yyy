"""数据库配置"""
import os
from pathlib import Path
from typing import Any, Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# 单机单用户：所有数据固定归属该用户（本期不做认证体系）
DEFAULT_USER_ID = 1

# 数据库文件路径：环境变量 FITTRACK_DB_PATH 可覆盖，
# 默认放在 backend/data/ 下（静态挂载会屏蔽该目录，防止被下载）
_default_db_path = Path(__file__).resolve().parent.parent / "data" / "fittrack.db"
DB_PATH = Path(os.environ.get("FITTRACK_DB_PATH", str(_default_db_path)))
if DB_PATH.name != ":memory:":
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection: Any, connection_record: Any) -> None:
    """为所有 SQLite 连接开启外键约束（含测试用内存库）"""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
