"""日期工具：客户端本地日期的半开区间过滤

约定（见规格 §0.3）：
- “某一天”的判定以客户端本地日期为准，端点接受 ?date=YYYY-MM-DD；
- 缺省时用服务器本地“今天”（文档注明推荐显式传 date）；
- 日期区间一律使用半开区间 [day, day+1)。
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

DATE_RE = r"^\d{4}-\d{2}-\d{2}$"
_DATE_PATTERN = re.compile(DATE_RE)


def day_range(date_str: Optional[str] = None) -> Tuple[datetime, datetime]:
    """返回某天的 [start, end) 半开区间。

    date_str 为 ``YYYY-MM-DD``；缺省用服务器本地今天。
    """
    if date_str:
        if not _DATE_PATTERN.match(date_str):
            raise ValueError(f"非法日期格式: {date_str}")
        start = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        now = datetime.now()
        start = datetime(now.year, now.month, now.day)
    return start, start + timedelta(days=1)


def parse_client_iso(
    value: str, tz_offset_minutes: Optional[int] = None
) -> datetime:
    """解析客户端 ISO 时间戳（如 ``2026-08-25T12:34:56.000Z``）并换算为客户端本地时间。

    - 带时区信息（Z / ±HH:MM）：先统一到 UTC，再按 tz_offset_minutes
      （JS ``Date.getTimezoneOffset()`` 语义：UTC = 本地 + offset 分钟，
      如东八区为 -480）换算为客户端本地时间；未提供 offset 时退化为 UTC。
    - 无时区信息的 naive 字符串：视为已是客户端本地时间，原样返回。

    返回 naive datetime，仅用于服务器端统计聚合（日期归属）；
    存储层永远保存客户端原始字符串，不做覆盖。
    """
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        return dt
    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    if tz_offset_minutes:
        dt -= timedelta(minutes=tz_offset_minutes)
    return dt


def now_iso() -> str:
    """服务器当前时间的 ISO 字符串（带时区偏移），仅用于客户端未提供时间时兜底。"""
    return datetime.now().astimezone().isoformat()
