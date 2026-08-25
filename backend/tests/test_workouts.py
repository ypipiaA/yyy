"""训练记录路由测试（契约对齐 §0.2 + 回归 P0-4 + streak 语义）"""
import copy
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from tests.conftest import SAMPLE_LOG


def test_create_free_workout_without_plan_id(client: TestClient) -> None:
    """回归 P0-4：创建无 planId 的自由训练后，GET /api/workouts/ 必须 200。"""
    response = client.post("/api/workouts/", json=SAMPLE_LOG)
    assert response.status_code == 201, response.text

    listing = client.get("/api/workouts/")
    assert listing.status_code == 200
    logs = listing.json()
    assert len(logs) == 1


def test_workout_response_matches_frontend_contract(client: TestClient) -> None:
    """响应字段名与前端读取的完全一致（date/done/dayName/focus）。"""
    created = client.post("/api/workouts/", json=SAMPLE_LOG).json()

    assert isinstance(created["id"], int)
    assert created["date"] == "2026-08-25T12:34:56.000Z"  # 客户端时间原样返回
    assert created["dayName"] == "第 1 天"
    assert created["focus"] == "推（胸/肩/三头）"
    assert created["duration"] == 3120
    assert created["planId"] is None

    ex = created["exercises"][0]
    assert ex["name"] == "杠铃卧推"
    assert ex["muscle"] == "胸"
    assert ex["sets"][0] == {"weight": 60, "reps": 10, "done": True}


def test_delete_workout(client: TestClient) -> None:
    created = client.post("/api/workouts/", json=SAMPLE_LOG).json()
    workout_id = created["id"]

    assert client.get(f"/api/workouts/{workout_id}").status_code == 200
    assert client.delete(f"/api/workouts/{workout_id}").status_code == 200
    assert client.get(f"/api/workouts/{workout_id}").status_code == 404
    assert client.delete(f"/api/workouts/{workout_id}").status_code == 404


def test_workout_date_filter(client: TestClient) -> None:
    """GET /api/workouts/?date_from=&date_to= 日期过滤（半开区间）。"""
    log_a = copy.deepcopy(SAMPLE_LOG)
    log_a["date"] = "2026-08-20T08:00:00.000Z"
    log_b = copy.deepcopy(SAMPLE_LOG)
    log_b["date"] = "2026-08-25T08:00:00.000Z"
    client.post("/api/workouts/", json=log_a)
    client.post("/api/workouts/", json=log_b)

    only_late = client.get("/api/workouts/?date_from=2026-08-25").json()
    assert len(only_late) == 1
    assert only_late[0]["date"].startswith("2026-08-25")

    only_early = client.get("/api/workouts/?date_to=2026-08-20").json()
    assert len(only_early) == 1
    assert only_early[0]["date"].startswith("2026-08-20")

    both = client.get(
        "/api/workouts/?date_from=2026-08-20&date_to=2026-08-25"
    ).json()
    assert len(both) == 2


def test_workout_validation_422(client: TestClient) -> None:
    bad_duration = copy.deepcopy(SAMPLE_LOG)
    bad_duration["duration"] = -1
    assert client.post("/api/workouts/", json=bad_duration).status_code == 422

    bad_date = copy.deepcopy(SAMPLE_LOG)
    bad_date["date"] = "不是日期"
    assert client.post("/api/workouts/", json=bad_date).status_code == 422

    bad_weight = copy.deepcopy(SAMPLE_LOG)
    bad_weight["exercises"][0]["sets"][0]["weight"] = -5
    assert client.post("/api/workouts/", json=bad_weight).status_code == 422

    # 缺必填 date
    missing_date = copy.deepcopy(SAMPLE_LOG)
    del missing_date["date"]
    assert client.post("/api/workouts/", json=missing_date).status_code == 422


def test_workout_invalid_plan_id_saved_as_free_workout(
    client: TestClient,
) -> None:
    """无效 planId 不应导致 500 / 外键炸裂，置空后照常保存。"""
    log = copy.deepcopy(SAMPLE_LOG)
    log["planId"] = 99999
    response = client.post("/api/workouts/", json=log)
    assert response.status_code == 201, response.text
    assert response.json()["planId"] is None


def test_summary_endpoint(client: TestClient) -> None:
    """GET /api/workouts/stats/summary（前端 getSummary 调用路径保留）。"""
    client.post("/api/workouts/", json=SAMPLE_LOG)
    summary = client.get("/api/workouts/stats/summary")
    assert summary.status_code == 200
    data = summary.json()
    assert data["total"] == 1
    assert data["total_volume"] == 600.0  # 60kg × 10 次


def test_streak_counts_from_yesterday(client: TestClient) -> None:
    """回归 A-4：昨天有训练、今天没有时 streak 不归零。"""
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)

    log = copy.deepcopy(SAMPLE_LOG)
    log["date"] = f"{yesterday.isoformat()}T10:00:00"
    client.post("/api/workouts/", json=log)

    overview = client.get(f"/api/stats/overview?date={today.isoformat()}")
    assert overview.status_code == 200
    assert overview.json()["streak"] == 1

    # 前天+昨天连续 → streak 2
    log2 = copy.deepcopy(SAMPLE_LOG)
    log2["date"] = f"{(today - timedelta(days=2)).isoformat()}T10:00:00"
    client.post("/api/workouts/", json=log2)
    overview = client.get(f"/api/stats/overview?date={today.isoformat()}")
    assert overview.json()["streak"] == 2
