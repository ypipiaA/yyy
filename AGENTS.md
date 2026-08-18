# FitTrack 健身助手开发指南

## 项目概述

FitTrack是一个全栈健身应用，包含：
- **前端**：HTML/CSS/JavaScript，纯前端实现
- **后端**：Python FastAPI，提供RESTful API
- **数据库**：SQLite，轻量级存储

## 项目结构

```
fitness-app/
├── index.html          # 前端入口
├── css/                # 样式文件
├── js/                 # JavaScript文件
├── backend/            # Python后端
│   ├── app/            # FastAPI应用
│   ├── tests/          # 测试文件
│   └── requirements.txt
├── opencode.json       # opencode配置
└── .opencode/          # opencode代理和技能
```

## 开发环境设置

### 后端开发

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-test.txt
   ```

3. 启动开发服务器：
   ```bash
   python -m uvicorn app.main:app --reload
   ```

4. 运行测试：
   ```bash
   pytest
   ```

### 前端开发

前端是纯静态文件，无需构建步骤。直接在浏览器中打开 `index.html` 即可。

## opencode使用

### 启动opencode

```bash
opencode
```

### 常用命令

- `/dev` - 启动后端开发服务器
- `/test` - 运行后端测试
- 直接与AI代理对话

### 代理角色

- **fitness-backend**：后端开发专家
- **api-reviewer**：API代码审查专家

## API文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发规范

### 代码风格
- Python: PEP 8 + Black格式化
- JavaScript: 现代ES6+语法
- HTML/CSS: 语义化标签

### 提交规范
- 使用清晰的提交信息
- 每个提交只做一件事
- 确保测试通过

### 测试规范
- 为每个功能编写测试
- 测试边界条件和异常情况
- 保持测试独立性

## 部署

### 后端部署

```bash
# 生产环境启动
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 前端部署

将静态文件部署到任何Web服务器即可。

## 常见问题

### 数据库重置

删除 `backend/fittrack.db` 文件，重启后端服务。

### 依赖更新

```bash
pip install --upgrade -r requirements.txt
```

### 代码格式化

```bash
# Python
black .

# JavaScript
prettier --write js/
```