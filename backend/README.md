# FitTrack 健身助手后端

基于FastAPI的FitTrack健身应用后端API。

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI应用入口
│   ├── database.py      # 数据库配置
│   ├── models/          # SQLAlchemy模型
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
├── tests/               # 测试文件
├── requirements.txt     # 生产依赖
├── requirements-test.txt # 测试依赖
└── pyproject.toml       # 项目配置
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt
```

### 2. 启动开发服务器

```bash
python -m uvicorn app.main:app --reload
```

访问API文档：http://localhost:8000/docs

### 3. 运行测试

```bash
pytest
```

## API端点

### 训练计划
- `GET /api/plans/` - 获取所有计划
- `POST /api/plans/` - 创建新计划
- `PUT /api/plans/{id}/activate` - 激活计划
- `DELETE /api/plans/{id}` - 删除计划

### 训练记录
- `GET /api/workouts/` - 获取训练记录
- `POST /api/workouts/` - 创建训练记录
- `GET /api/workouts/stats/summary` - 获取训练统计

### 身体数据
- `GET /api/body/` - 获取体重记录
- `POST /api/body/` - 记录体重
- `GET /api/body/latest` - 获取最新体重

### 统计
- `GET /api/stats/overview` - 获取统计概览
- `GET /api/stats/weekly` - 获取每周统计
- `GET /api/stats/muscle` - 获取部位统计
- `GET /api/stats/progress/{exercise}` - 获取动作进步

### 设置
- `GET /api/settings/profile` - 获取个人资料
- `PUT /api/settings/profile` - 更新个人资料
- `GET /api/settings/settings` - 获取设置
- `PUT /api/settings/settings` - 更新设置

## 数据库

使用SQLite数据库，文件位于 `backend/fittrack.db`。

## 开发指南

### 代码规范
- 使用Black进行代码格式化
- 使用Flake8进行代码检查
- 使用Mypy进行类型检查
- 遵循PEP 8风格指南

### 测试规范
- 为每个API端点编写测试
- 使用pytest进行测试
- 保持测试独立性和可重复性

### Git规范
- 使用清晰的提交信息
- 每个提交只做一件事
- 确保测试通过