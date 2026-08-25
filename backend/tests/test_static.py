"""静态目录与敏感路径测试（回归 P0-2、P1-7）"""
from fastapi.testclient import TestClient


def test_root_serves_index_html(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "<!DOCTYPE" in response.text or "<html" in response.text


def test_sensitive_paths_are_404(client: TestClient) -> None:
    """验收红线：数据库、后端源码、配置文件一律 404。"""
    for path in [
        "/fittrack.db",
        "/data/fittrack.db",
        "/app/main.py",
        "/app/database.py",
        "/pyproject.toml",
        "/backend/data/fittrack.db",
        "/backend/app/main.py",
        "/backend/pyproject.toml",
        "/backend/requirements.txt",
        "/tests/conftest.py",
    ]:
        response = client.get(path)
        assert response.status_code == 404, (
            f"敏感路径 {path} 返回 {response.status_code}，必须 404"
        )


def test_frontend_assets_are_served(client: TestClient) -> None:
    """前端静态资源（js/css）正常可访问。"""
    for path in ["/js/app.js", "/css/style.css", "/manifest.json"]:
        response = client.get(path)
        assert response.status_code == 200, f"{path} 应可访问"
