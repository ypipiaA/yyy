"""备份导入/导出路由测试（A-5）"""
from fastapi.testclient import TestClient

from tests.conftest import SAMPLE_BODY, SAMPLE_LOG, SAMPLE_PLAN, SAMPLE_PROFILE


def _seed(client: TestClient) -> None:
    client.post("/api/plans/", json=SAMPLE_PLAN)
    client.post("/api/workouts/", json=SAMPLE_LOG)
    client.post("/api/body/", json=SAMPLE_BODY)
    client.put("/api/settings/profile", json=SAMPLE_PROFILE)


def test_export_structure(client: TestClient) -> None:
    """导出结构与前端备份格式一致：{app, version, data:{plan, logs, bodyRecords, profile}}。"""
    _seed(client)
    response = client.get("/api/backup/export")
    assert response.status_code == 200
    backup = response.json()

    assert backup["app"] == "fittrack"
    assert backup["version"] == 3
    data = backup["data"]
    assert set(data.keys()) == {"plan", "logs", "bodyRecords", "profile"}

    assert data["plan"]["goalLabel"] == "增肌塑形"
    assert data["plan"]["planDays"][0]["exercises"][0]["name"] == "杠铃卧推"
    assert data["logs"][0]["dayName"] == "第 1 天"
    assert data["logs"][0]["exercises"][0]["sets"][0]["done"] is True
    assert data["bodyRecords"][0] == {
        "id": data["bodyRecords"][0]["id"],
        "date": "2026-08-25",
        "weight": 65.5,
    }
    assert data["profile"] == {"name": "小明", "height": "175"}


def test_export_empty_database(client: TestClient) -> None:
    response = client.get("/api/backup/export")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["plan"] is None
    assert data["logs"] == []
    assert data["bodyRecords"] == []


def test_import_roundtrip(client: TestClient) -> None:
    """导出 → 导入 → 数据完整恢复（导入为全量替换）。"""
    _seed(client)
    backup = client.get("/api/backup/export").json()

    # 再加一条脏数据，导入后应被替换掉
    client.post("/api/body/", json={"date": "2026-08-26", "weight": 70.0})

    response = client.post("/api/backup/import", json=backup)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["imported"]["plan"] == 1
    assert result["imported"]["logs"] == 1
    assert result["imported"]["bodyRecords"] == 1

    # 验证替换后的数据
    body_records = client.get("/api/body/").json()
    assert len(body_records) == 1
    assert body_records[0]["date"] == "2026-08-25"

    plan = client.get("/api/plans/active").json()
    assert plan["goalLabel"] == "增肌塑形"

    logs = client.get("/api/workouts/").json()
    assert len(logs) == 1
    assert logs[0]["date"] == "2026-08-25T12:34:56.000Z"

    profile = client.get("/api/settings/profile").json()
    assert profile == {"name": "小明", "height": "175"}


def test_import_skips_invalid_entries(client: TestClient) -> None:
    """非法条目跳过并计数，不中断整体导入、不崩溃。"""
    payload = {
        "app": "fittrack",
        "version": 3,
        "data": {
            "plan": {},  # 缺必填字段 → 跳过
            "logs": [
                SAMPLE_LOG,
                {"foo": "bar"},  # 非法 → 跳过
                "不是对象",  # 非法 → 跳过
            ],
            "bodyRecords": [
                SAMPLE_BODY,
                {"date": "bad-date", "weight": 65},  # 非法 → 跳过
            ],
            "profile": SAMPLE_PROFILE,
        },
    }
    response = client.post("/api/backup/import", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["imported"] == {
        "plan": 0,
        "logs": 1,
        "bodyRecords": 1,
        "profile": 1,
    }
    assert result["skipped"]["plan"] == 1
    assert result["skipped"]["logs"] == 2
    assert result["skipped"]["bodyRecords"] == 1


def test_import_missing_data_key_422(client: TestClient) -> None:
    assert (
        client.post("/api/backup/import", json={"app": "fittrack"}).status_code
        == 422
    )
