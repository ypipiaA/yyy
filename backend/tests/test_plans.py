"""训练计划路由测试（契约对齐 §0.2 + 回归 P1-6）"""
import copy

from fastapi.testclient import TestClient

from tests.conftest import SAMPLE_PLAN


def test_create_plan_matches_frontend_contract(client: TestClient) -> None:
    """用 §0.2 示例 JSON 原文创建计划，响应字段名与前端读取的完全一致。"""
    response = client.post("/api/plans/", json=SAMPLE_PLAN)
    assert response.status_code == 201, response.text
    plan = response.json()

    assert isinstance(plan["id"], int)
    assert plan["goal"] == "muscle"
    assert plan["goalLabel"] == "增肌塑形"
    assert plan["days"] == 4
    assert plan["level"] == "beginner"
    assert plan["createdAt"] == "2026-08-25T10:00:00.000Z"
    assert len(plan["planDays"]) == 1

    day = plan["planDays"][0]
    assert day["name"] == "第 1 天"
    assert day["focus"] == "推（胸/肩/三头）"
    ex = day["exercises"][0]
    assert ex == {
        "name": "杠铃卧推",
        "muscle": "胸",
        "equipment": "杠铃",
        "sets": 4,
        "reps": "8-12",
        "rest": 90,
    }


def test_get_plans_active_first(client: TestClient) -> None:
    """GET /api/plans/ 按激活优先排序，前端取 plans[0] 即当前计划。"""
    first = client.post("/api/plans/", json=SAMPLE_PLAN).json()
    second_data = copy.deepcopy(SAMPLE_PLAN)
    second_data["goalLabel"] = "第二个计划"
    second = client.post("/api/plans/", json=second_data).json()

    plans = client.get("/api/plans/").json()
    assert len(plans) == 2
    assert plans[0]["id"] == second["id"]
    assert plans[0]["isActive"] is True

    # 激活第一个后重新排序
    assert client.put(f"/api/plans/{first['id']}/activate").status_code == 200
    plans = client.get("/api/plans/").json()
    assert plans[0]["id"] == first["id"]


def test_get_active_plan(client: TestClient) -> None:
    assert client.get("/api/plans/active").status_code == 404

    created = client.post("/api/plans/", json=SAMPLE_PLAN).json()
    active = client.get("/api/plans/active")
    assert active.status_code == 200
    assert active.json()["id"] == created["id"]


def test_activate_missing_plan_keeps_current_active(client: TestClient) -> None:
    """回归 P1-6：激活不存在的计划返回 404，且原激活状态不被清零。"""
    created = client.post("/api/plans/", json=SAMPLE_PLAN).json()

    response = client.put("/api/plans/99999/activate")
    assert response.status_code == 404

    active = client.get("/api/plans/active")
    assert active.status_code == 200
    assert active.json()["id"] == created["id"]


def test_update_plan_replaces_days(client: TestClient) -> None:
    """PUT /api/plans/{id} 整体替换计划内容。"""
    created = client.post("/api/plans/", json=SAMPLE_PLAN).json()

    updated_data = copy.deepcopy(SAMPLE_PLAN)
    updated_data["goalLabel"] = "减脂计划"
    updated_data["goal"] = "fat"
    updated_data["planDays"] = [
        {"name": "第 1 天", "focus": "全身", "exercises": []},
        {"name": "第 2 天", "focus": "有氧", "exercises": []},
    ]
    response = client.put(f"/api/plans/{created['id']}", json=updated_data)
    assert response.status_code == 200, response.text
    plan = response.json()
    assert plan["goalLabel"] == "减脂计划"
    assert [d["name"] for d in plan["planDays"]] == ["第 1 天", "第 2 天"]

    # 更新不存在的计划 → 404
    assert client.put("/api/plans/99999", json=updated_data).status_code == 404


def test_delete_plan(client: TestClient) -> None:
    created = client.post("/api/plans/", json=SAMPLE_PLAN).json()
    assert client.delete(f"/api/plans/{created['id']}").status_code == 200
    assert client.get(f"/api/plans/{created['id']}").status_code == 404
    assert client.delete(f"/api/plans/{created['id']}").status_code == 404


def test_plan_validation_422(client: TestClient) -> None:
    # 非法枚举
    bad_goal = copy.deepcopy(SAMPLE_PLAN)
    bad_goal["goal"] = "hacking"
    assert client.post("/api/plans/", json=bad_goal).status_code == 422

    # days 超范围
    bad_days = copy.deepcopy(SAMPLE_PLAN)
    bad_days["days"] = 9
    assert client.post("/api/plans/", json=bad_days).status_code == 422

    # sets 非正数
    bad_sets = copy.deepcopy(SAMPLE_PLAN)
    bad_sets["planDays"][0]["exercises"][0]["sets"] = 0
    assert client.post("/api/plans/", json=bad_sets).status_code == 422

    # 缺必填字段
    assert client.post("/api/plans/", json={"goal": "muscle"}).status_code == 422
