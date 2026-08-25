"""身体数据路由测试（契约对齐 §0.2）"""
from fastapi.testclient import TestClient

from tests.conftest import SAMPLE_BODY


def test_create_body_record_matches_contract(client: TestClient) -> None:
    """用 §0.2 示例 JSON 原文创建，响应为 {id, date, weight}。"""
    response = client.post("/api/body/", json=SAMPLE_BODY)
    assert response.status_code == 201, response.text
    record = response.json()
    assert isinstance(record["id"], int)
    assert record["date"] == "2026-08-25"
    assert record["weight"] == 65.5
    assert set(record.keys()) == {"id", "date", "weight"}


def test_latest_returns_404_when_empty(client: TestClient) -> None:
    """无记录时 404（前端 storage.js 的 catch 会兜底本地）。"""
    response = client.get("/api/body/latest")
    assert response.status_code == 404


def test_latest_returns_newest_by_date(client: TestClient) -> None:
    client.post("/api/body/", json={"date": "2026-08-20", "weight": 66.0})
    client.post("/api/body/", json={"date": "2026-08-25", "weight": 65.5})
    # 补录更早的日期，latest 仍按日期取最新
    client.post("/api/body/", json={"date": "2026-08-01", "weight": 67.0})

    latest = client.get("/api/body/latest")
    assert latest.status_code == 200
    assert latest.json()["date"] == "2026-08-25"
    assert latest.json()["weight"] == 65.5


def test_update_body_record(client: TestClient) -> None:
    created = client.post("/api/body/", json=SAMPLE_BODY).json()
    response = client.put(
        f"/api/body/{created['id']}",
        json={"date": "2026-08-24", "weight": 64.8},
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["date"] == "2026-08-24"
    assert updated["weight"] == 64.8

    assert (
        client.put("/api/body/99999", json=SAMPLE_BODY).status_code == 404
    )


def test_delete_body_record(client: TestClient) -> None:
    created = client.post("/api/body/", json=SAMPLE_BODY).json()
    assert client.delete(f"/api/body/{created['id']}").status_code == 200
    assert client.get("/api/body/latest").status_code == 404
    assert client.delete(f"/api/body/{created['id']}").status_code == 404


def test_body_validation_422(client: TestClient) -> None:
    # 体重超范围
    assert (
        client.post(
            "/api/body/", json={"date": "2026-08-25", "weight": 10}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/body/", json={"date": "2026-08-25", "weight": 500}
        ).status_code
        == 422
    )
    # 非法日期格式
    assert (
        client.post(
            "/api/body/", json={"date": "08/25/2026", "weight": 65.5}
        ).status_code
        == 422
    )
    # 缺必填
    assert client.post("/api/body/", json={"weight": 65.5}).status_code == 422
