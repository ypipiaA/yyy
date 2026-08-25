"""全路由冒烟测试：对每个已注册路由发一次合法请求，断言非 500。

专杀"一跑就炸"类问题（P0-1 缺 FK、P0-4 空 planId、P1-5 裸 list 序列化等）。
同时用覆盖率守卫断言冒烟清单覆盖了全部 API 路由。
"""
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import SAMPLE_BODY, SAMPLE_LOG, SAMPLE_PLAN, SAMPLE_PROFILE

# (method, 路由模板, 实际请求 URL, JSON body 或 None)
SMOKE_REQUESTS = [
    # 训练计划
    ("GET", "/api/plans/", "/api/plans/", None),
    ("GET", "/api/plans/active", "/api/plans/active", None),
    ("GET", "/api/plans/{plan_id}", "/api/plans/1", None),
    ("POST", "/api/plans/", "/api/plans/", SAMPLE_PLAN),
    ("PUT", "/api/plans/{plan_id}", "/api/plans/1", SAMPLE_PLAN),
    ("PUT", "/api/plans/{plan_id}/activate", "/api/plans/1/activate", None),
    ("DELETE", "/api/plans/{plan_id}", "/api/plans/1", None),
    # 训练记录
    ("GET", "/api/workouts/", "/api/workouts/", None),
    ("GET", "/api/workouts/stats/summary", "/api/workouts/stats/summary", None),
    ("GET", "/api/workouts/{workout_id}", "/api/workouts/1", None),
    ("POST", "/api/workouts/", "/api/workouts/", SAMPLE_LOG),
    ("DELETE", "/api/workouts/{workout_id}", "/api/workouts/1", None),
    # 身体数据
    ("GET", "/api/body/", "/api/body/", None),
    ("GET", "/api/body/latest", "/api/body/latest", None),
    ("POST", "/api/body/", "/api/body/", SAMPLE_BODY),
    ("PUT", "/api/body/{record_id}", "/api/body/1", SAMPLE_BODY),
    ("DELETE", "/api/body/{record_id}", "/api/body/1", None),
    # 统计
    ("GET", "/api/stats/overview", "/api/stats/overview?date=2026-08-25", None),
    ("GET", "/api/stats/weekly", "/api/stats/weekly?date=2026-08-25", None),
    ("GET", "/api/stats/muscle", "/api/stats/muscle", None),
    (
        "GET",
        "/api/stats/progress/{exercise_name}",
        "/api/stats/progress/%E6%9D%A0%E9%93%83%E5%8D%A7%E6%8E%A8",
        None,
    ),
    # 设置
    ("GET", "/api/settings/profile", "/api/settings/profile", None),
    ("PUT", "/api/settings/profile", "/api/settings/profile", SAMPLE_PROFILE),
    ("GET", "/api/settings/settings", "/api/settings/settings", None),
    (
        "PUT",
        "/api/settings/settings",
        "/api/settings/settings",
        {"restDuration": 90, "timerSound": True, "theme": "dark"},
    ),
    # 营养追踪
    ("GET", "/api/nutrition/goals", "/api/nutrition/goals", None),
    (
        "PUT",
        "/api/nutrition/goals",
        "/api/nutrition/goals",
        {
            "calories": 2200,
            "protein": 160,
            "carbs": 260,
            "fat": 70,
            "fiber": 30,
            "water": 2500,
        },
    ),
    ("GET", "/api/nutrition/meals", "/api/nutrition/meals", None),
    (
        "POST",
        "/api/nutrition/meals",
        "/api/nutrition/meals",
        {
            "name": "早餐",
            "foods": [
                {
                    "name": "鸡蛋",
                    "calories": 155,
                    "protein": 13,
                    "carbs": 1.1,
                    "fat": 11,
                    "amount": 100,
                }
            ],
        },
    ),
    (
        "DELETE",
        "/api/nutrition/meals/{meal_id}",
        "/api/nutrition/meals/1",
        None,
    ),
    ("GET", "/api/nutrition/today", "/api/nutrition/today?date=2026-08-25", None),
    ("POST", "/api/nutrition/water", "/api/nutrition/water", {"amount": 250}),
    (
        "GET",
        "/api/nutrition/water/today",
        "/api/nutrition/water/today?date=2026-08-25",
        None,
    ),
    # 成就系统
    (
        "GET",
        "/api/achievements/achievements",
        "/api/achievements/achievements",
        None,
    ),
    (
        "POST",
        "/api/achievements/achievements/{achievement_id}",
        "/api/achievements/achievements/firstWorkout",
        None,
    ),
    ("GET", "/api/achievements/badges", "/api/achievements/badges", None),
    (
        "POST",
        "/api/achievements/badges/{badge_id}",
        "/api/achievements/badges/beginner",
        None,
    ),
    ("GET", "/api/achievements/stats", "/api/achievements/stats", None),
    # 备份
    ("GET", "/api/backup/export", "/api/backup/export", None),
    ("POST", "/api/backup/export", "/api/backup/export", None),
    (
        "POST",
        "/api/backup/import",
        "/api/backup/import",
        {"app": "fittrack", "version": 3, "data": {}},
    ),
]


def test_smoke_all_routes(client: TestClient) -> None:
    """每个路由发一次合法请求，断言非 500。"""
    for method, template, url, body in SMOKE_REQUESTS:
        response = client.request(method, url, json=body)
        assert response.status_code < 500, (
            f"{method} {url} 返回 {response.status_code}: {response.text}"
        )


def test_smoke_covers_every_api_route() -> None:
    """覆盖率守卫：所有已注册 API 路由都必须出现在冒烟清单里。"""
    covered = {(m, t) for m, t, _, _ in SMOKE_REQUESTS}
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        if not route.path.startswith("/api/"):
            continue
        for method in route.methods - {"HEAD", "OPTIONS"}:
            assert (method, route.path) in covered, (
                f"路由 {method} {route.path} 未被冒烟测试覆盖"
            )
