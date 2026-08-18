# FitTrack 健身助手 v3.0

FitTrack是一个功能丰富的全栈健身应用，支持训练计划、训练记录、营养追踪、成就系统等功能。

## 新增功能

### 1. 扩展动作库
- 从原来的40+动作扩展到100+动作
- 每个动作包含：难度等级、详细说明、训练要点、视频链接
- 新增前臂和柔韧性训练类别
- 支持按难度、器械、肌肉部位筛选动作

### 2. 智能训练计划
- 新增周期化训练模板（力量、增肌、减脂）
- 支持自定义动作和训练参数
- 智能推荐系统根据历史数据推荐动作
- 新增7天训练分化模板

### 3. 营养追踪系统
- 完整的食物数据库（100+常见食物）
- 支持搜索和添加食物
- 卡路里和宏量营养素追踪
- 喝水记录和目标设定
- 营养目标自动计算（根据体重和目标）

### 4. 成就系统
- 15+成就解锁条件
- 徽章系统（15种不同徽章）
- 连续训练记录追踪
- 成就弹窗通知
- 进度追踪和统计

### 5. 主题系统
- 4种预设主题（浅色、深色、午夜蓝、森林绿）
- 跟随系统主题设置
- 字体大小调整
- 动画开关控制

### 6. 增强的数据可视化
- 卡路里进度环
- 宏量营养素进度条
- 喝水记录图表
- 营养趋势分析

### 7. PWA支持
- 离线使用支持
- 可安装到桌面
- Service Worker缓存
- 后台同步

### 8. 后端API增强
- 营养追踪API
- 成就系统API
- 数据同步支持
- RESTful设计规范

## 技术栈

### 前端
- HTML5 / CSS3 / JavaScript (ES6+)
- Chart.js 图表库
- LocalStorage 本地存储
- Service Worker 离线支持

### 后端
- Python FastAPI
- SQLAlchemy ORM
- SQLite 数据库
- Pydantic 数据验证

## 项目结构

```
fitness-app/
├── index.html              # 主页面
├── manifest.json           # PWA配置
├── service-worker.js       # Service Worker
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── api.js              # API客户端
│   ├── app.js              # 主应用逻辑
│   ├── exercises.js        # 动作库
│   ├── plans.js            # 计划生成
│   ├── storage.js          # 数据存储
│   ├── timer.js            # 计时器
│   ├── stats.js            # 统计功能
│   ├── body.js             # 身体数据
│   ├── nutrition.js        # 营养追踪
│   ├── nutrition-ui.js     # 营养UI
│   ├── achievements.js     # 成就系统
│   ├── achievements-ui.js  # 成就UI
│   ├── theme.js            # 主题管理
│   └── settings.js         # 设置
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI入口
│   │   ├── database.py     # 数据库配置
│   │   ├── models/         # 数据模型
│   │   └── routes/         # API路由
│   └── requirements.txt    # 依赖
└── icons/                  # PWA图标
```

## 快速开始

### 1. 安装后端依赖
```bash
cd backend
py -m pip install -r requirements.txt
```

### 2. 启动后端服务器
```bash
cd backend
py -m uvicorn app.main:app --reload
```

### 3. 访问应用
- 打开浏览器访问：http://localhost:8000
- 或直接打开 index.html（纯前端模式）

### 4. 启用PWA
- 在支持PWA的浏览器中访问应用
- 点击"安装到桌面"按钮
- 享受离线使用体验

## 功能使用指南

### 训练计划
1. 选择训练目标（增肌、减脂、力量、耐力）
2. 设置每周训练天数
3. 选择经验水平
4. 点击"生成计划"按钮
5. 保存计划并开始训练

### 营养追踪
1. 点击"营养"选项卡
2. 设置每日营养目标
3. 添加食物记录
4. 记录喝水量
5. 查看营养进度

### 成就系统
1. 点击"成就"选项卡
2. 查看已解锁成就
3. 获得徽章奖励
4. 追踪训练进度

### 主题切换
1. 点击"设置"选项卡
2. 选择主题（浅色、深色、午夜蓝、森林绿）
3. 调整字体大小
4. 开关动画效果

## API文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 主要API端点
- `/api/plans/` - 训练计划
- `/api/workouts/` - 训练记录
- `/api/body/` - 身体数据
- `/api/nutrition/` - 营养追踪
- `/api/achievements/` - 成就系统
- `/api/stats/` - 统计数据
- `/api/settings/` - 用户设置

## 开发指南

### 代码规范
- 遵循PEP 8（Python）
- 使用ES6+语法（JavaScript）
- 保持代码简洁和可读性

### 测试
```bash
# 后端测试
cd backend
py -m pytest

# 代码检查
py -m flake8 app/
py -m mypy app/
```

### 部署
- 前端：部署到任何Web服务器
- 后端：使用Uvicorn或Gunicorn
- 数据库：SQLite（生产环境可升级到PostgreSQL）

## 更新日志

### v3.0 (2024)
- 新增营养追踪系统
- 新增成就系统
- 新增主题切换功能
- 扩展动作库
- 添加PWA支持
- 增强数据可视化

### v2.0
- 新增训练计划生成
- 新增统计功能
- 新增身体数据追踪
- 优化用户界面

### v1.0
- 基础训练记录功能
- 休息计时器
- 数据导出/导入

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues反馈。