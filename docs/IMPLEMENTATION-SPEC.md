# FitTrack 实现规格说明书（v1.0）

> 依据：前端审计、后端审计、PWA/集成审计三份报告 + 架构师对源码的二次核对。
> 项目根目录：`F:/py/fitness-app/.claude/worktrees/gracious-nobel-5c4eb2`
> 分发对象：三名（组）实现工程师，分别领取工作包 A / B / C。

---

## 0. 总则（所有工作包必读）

### 0.1 文件所有权矩阵（并行冲突的唯一裁决依据）

| 路径 | 工作包 A | 工作包 B | 工作包 C |
|---|---|---|---|
| `backend/**`（含 `backend/tests/`） | ✅ 独占 | ❌ | ❌ |
| `js/` 下 14 个**已有**文件 | ❌ | ✅ | ✅（仅 B 完成后，改集成点） |
| `js/vendor/chart.umd.min.js`（新增） | ❌ | ✅ **例外授权**：B 允许新增此纯资源文件 | ❌ |
| `js/` 下**新建**业务文件 | ❌ | ❌ | ✅ |
| `css/style.css` | ❌ | ✅ | ✅（串行，追加到文件尾部区块） |
| `service-worker.js`、`manifest.json` | ❌ | ✅ | ✅（串行，只允许改 `CACHE_NAME` 与 `urlsToCache`） |
| `index.html` | ❌ | ❌（改动点列清单，见 §2.9） | ✅ 独占 |
| `docs/**`、`README.md` | 各自补充自己的段落，按包分小节 | 同左 | 同左 |

**执行顺序**：A ∥ B 并行；C 在 B 合入后串行开始。C 开工前必须 rebase 到含 B 的主干。

### 0.2 前后端数据契约（Wire Format，A、B 共同遵守）

前端 localStorage 中的数据形状是**唯一权威格式**，后端 API 的请求/响应必须与之逐字段一致（camelCase）。这样 `storage.js` 无需转换层。

**计划 Plan**（`fittrack_plan`）：
```json
{
  "id": 1,
  "goal": "muscle",
  "goalLabel": "增肌塑形",
  "days": 4,
  "level": "beginner",
  "createdAt": "2026-08-25T10:00:00.000Z",
  "planDays": [
    { "name": "第 1 天", "focus": "推（胸/肩/三头）",
      "exercises": [
        { "name": "杠铃卧推", "muscle": "胸", "equipment": "杠铃",
          "sets": 4, "reps": "8-12", "rest": 90 }
      ] }
  ]
}
```
> 注意：`days` 是 **int**（每周天数），训练日数组叫 `planDays`。`id` 仅后端返回时携带，本地模式可无。

**训练记录 Workout Log**（`fittrack_logs` 数组元素）：
```json
{
  "id": 1,
  "date": "2026-08-25T12:34:56.000Z",
  "dayName": "第 1 天",
  "focus": "推（胸/肩/三头）",
  "duration": 3120,
  "exercises": [
    { "name": "杠铃卧推", "muscle": "胸",
      "sets": [ { "weight": 60, "reps": 10, "done": true } ] }
  ]
}
```
> 完成标记字段统一为 `done`（不是 `completed`）。`date` 由**客户端**提供，服务端原样存储。

**身体记录 Body Record**（`fittrack_body` 数组元素）：
```json
{ "id": 1, "date": "2026-08-25", "weight": 65.5 }
```
> `date` 是客户端本地日期字符串 `YYYY-MM-DD`，允许补录任意日期。

**个人资料 Profile**（`fittrack_profile`）：
```json
{ "name": "小明", "height": "175" }
```

### 0.3 时间与时区（A、B、C 共同遵守）

- “某一天”的判定一律使用**客户端本地日期**，统一通过 `storage.js` 的 `formatDate()`（本地时区）生成 `YYYY-MM-DD`。**禁止**使用 `new Date().toISOString().split('T')[0]` 判定“今天”。
- 时间戳（如 `log.date`）存 ISO 字符串，由客户端生成；后端不得用服务器时间覆盖。
- 后端所有“今日/按日”查询端点接受客户端传入的 `date=YYYY-MM-DD` 查询参数，日期区间一律用半开区间 `[day, day+1)`。

### 0.4 通用约束

1. **GitHub Pages 子路径约束**：所有资源引用必须为相对路径（现状已合规，PWA 审计 BUG-6 已核对通过）。任何新增的 `src/href/url()/fetch/caches` 路径一律 `./` 或裸相对路径，**禁止**以 `/` 开头。
2. **纯前端模式是第一公民**：`API.USE_API === false` 时，一切功能（含 C 的新功能）必须在无后端、离线状态下完整工作。任何 API 调用必须有 localStorage 路径兜底。
3. **XSS 基线**：所有插入 `innerHTML` 的动态字符串（用户输入、localStorage 读出、导入 JSON、API 响应）必须经过 `escapeHtml()`（B 在 `storage.js` 提供，见 §2.4）。C 的新代码同样强制执行。
4. **SW 缓存版本**：凡改动 `js/`、`css/`、`index.html` 的 PR，合入前必须 bump `service-worker.js` 的 `PRECACHE_NAME` 版本号（见 §2.2 改造后结构）。
5. **脚本加载顺序**：新建 js 文件在 `index.html` 中的 `<script>` 必须插在 `js/app.js` **之前**、其依赖（`storage.js` 等）之后；所有入口逻辑放 `DOMContentLoaded`。
6. **全局命名**：新文件只允许暴露一个全局对象（如 `Heatmap`、`Records`、`WorkoutSession`），不得与现有全局（`Storage/API/Timer/Stats/Body/NutritionUI/AchievementsUI/Settings/ThemeManager/showToast/formatDate/...`)冲突。

---

## 1. 工作包 A：后端（只改 `backend/**`）

### 1.1 目标

修复后端审计 P0-1 ~ P2-12 全部问题，使 `USE_API=true` 时前端**不做任何改动**即可与后端按 §0.2 契约通信；补齐前端语义需要的端点；建立 pytest 冒烟与回归测试。

### 1.2 改动清单（文件级）

#### A-1 模型层修复（P0-1、P2-9、优化 8）
文件：`app/models/plan.py`、`workout.py`、`body.py`、`user.py`、`nutrition.py`、`achievement.py`、`app/database.py`

- 所有 `user_id` 列补 `ForeignKey("users.id")`（`Plan.user_id`、`Workout.user_id`、`BodyRecord.user_id`、`UserSettings.user_id`，以及 nutrition/achievement 模型中同类列）。
- `database.py`：`declarative_base` 改从 `sqlalchemy.orm` 导入；加 `event.listens_for(engine, "connect")` 执行 `PRAGMA foreign_keys=ON`；数据库文件路径改为环境变量 `FITTRACK_DB_PATH`（默认 `backend/data/fittrack.db`，目录不存在则创建）。**必须**把现有 `backend/fittrack.db` 移入 `backend/data/`（配合 A-2 防下载）。
- 新增常量 `DEFAULT_USER_ID = 1`（建议放 `app/database.py` 或 `app/utils/`），启动时 get-or-create 该 User；所有路由创建数据时写入 `user_id=DEFAULT_USER_ID`，所有查询按其过滤。

#### A-2 静态目录与安全（P0-2、P1-7）
文件：`app/main.py`

- `frontend_path = Path(__file__).parent.parent.parent`（项目根）。
- 静态挂载放在**路由注册之后**（现状已是），并断言 `frontend_path / "index.html"` 存在，否则跳过挂载并打 warning（避免测试环境炸）。
- 验收红线：`GET /fittrack.db`、`GET /data/fittrack.db`、`GET /app/main.py`、`GET /pyproject.toml` 全部 404。
- CORS：`allow_origins` 改为环境变量 `FITTRACK_CORS_ORIGINS`（逗号分隔，默认 `http://localhost:8000,http://127.0.0.1:8000`）；去掉 `allow_credentials=True` 与通配同开的组合。

#### A-3 Schema 对齐（P0-3、P0-4、P1-5、优化 4）
文件：`app/routes/plans.py`、`workouts.py`、`body.py`、`settings.py`

按 §0.2 契约重写全部 Pydantic 模型（请求与响应均用 camelCase 字段名；内部 ORM 列名可保持 snake_case，路由内做映射）：

- `PlanCreate/PlanResponse`：`goal: Literal["muscle","fat","strength","endurance"]`、`goalLabel: str`、`days: int (ge=1, le=7)`、`level: Literal["beginner","intermediate","advanced"]`、`createdAt: datetime`、`planDays: List[PlanDayIn]`；`PlanDayIn` 含 `name/focus/exercises: List[ExerciseIn]`；`ExerciseIn` 含 `name, muscle, equipment, sets(int gt=0 le=20), reps(str|int), rest(int ge=0 le=600)`。响应模型嵌套完整（消灭裸 `list`）。
- `WorkoutCreate/WorkoutResponse`：`date: datetime`（必填，客户端时间）、`dayName/focus: str`、`duration: int (ge=0)`、`exercises: List[WorkoutExerciseIn]`，set 项 `{weight: float ge=0, reps: int ge=0, done: bool}`。`plan_id`→ `planId: Optional[int] = None`（响应中同名可空）。
- `BodyRecordCreate`：`date: str`（`YYYY-MM-DD` 正则校验，允许补录）、`weight: float (gt=20, lt=400)`；响应 `{id, date, weight}`。
- `settings.py`：profile 契约 `{name: str(max 50), height: str|float 可空)}`；`theme: Literal[...]` 白名单。
- 数值/枚举校验按后端审计优化 4 全量补齐（营养 `amount gt=0`、achievement id 对照白名单等）。

#### A-4 路由逻辑修复（P1-6、P2-10、P2-11、P2-12）
文件：`app/routes/plans.py`、`workouts.py`、`body.py`、`nutrition.py`、`stats.py`

- `activate_plan`：先查计划（按 `user_id` 过滤），404 早退；再在同一事务内去激活其余 + 激活目标，单次 commit。
- `create_plan`/`create_workout`：单事务——全部 `db.add` + `db.flush()` 取 id，最后一次 `db.commit()`；任何异常整体回滚。
- `GET /api/body/latest`：无记录返回 404 `{"detail": "no records"}`（前端 storage.js 的 catch 会兜底本地）。
- 日期过滤：抽 `app/utils/dates.py` 工具 `day_range(date_str) -> (start, end)` 半开区间；`nutrition.py` 三处重复统一替换；`today` 类端点接受 `?date=YYYY-MM-DD`（缺省用服务器本地今天，但文档注明推荐显式传）。
- `calculate_streak`：昨天有训练、今天没有时 streak 不归零（对齐前端 `stats.js calcStreak` 语义：`dates[0]` 为今天或昨天均可起算）。
- get-or-create（User/Settings/NutritionGoal）抽成 `app/services/common.py` 复用；删除 `workouts.py /stats/summary` 与 `stats.py /overview` 的重复实现（保留 `stats.py`，`workouts.py` 内部转发或直接删端点——`js/api.js` 的 `getSummary()` 调 `/workouts/stats/summary`，因此**保留路径**、内部调用共享 service）。

#### A-5 补齐前端所需端点（功能缺口 1）
文件：`app/routes/plans.py`、`workouts.py`、`body.py`，新增 `app/routes/backup.py`

| 端点 | 语义 |
|---|---|
| `GET /api/plans/active` | 返回当前激活计划（无则 404）。前端 `storage.js getPlan` 后续可迁移到它；本期 `GET /api/plans/` 仍按 `is_active desc, created_at desc` 排序保证 `plans[0]` 是激活计划 |
| `PUT /api/plans/{id}` | 整体替换计划内容（body 同 `PlanCreate`），单事务删旧 days 重建 |
| `DELETE /api/workouts/{id}` | 删除训练记录，404 处理 |
| `PUT /api/body/{id}` | 修改体重记录 |
| `GET /api/workouts/?date_from=&date_to=` | 在现有 skip/limit 上增加可选日期过滤 |
| `POST /api/backup/export`（GET 亦可） | 返回 §0.2 四类数据的完整 JSON（与前端备份格式 `{app, version, data:{plan, logs, bodyRecords, profile}}` 一致） |
| `POST /api/backup/import` | 接收同格式 JSON，事务内全量替换该用户数据 |

#### A-6 工程配置（P1-8、优化 2、9）
文件：`backend/pyproject.toml`、`requirements.txt`、`requirements-test.txt`

- `build-backend = "setuptools.build_meta"`。
- 删除未使用的 `python-jose`、`passlib`；`requirements.txt` 与 `pyproject.toml dependencies` 对齐为单一来源（pyproject 为准，requirements.txt 由其生成或直接引用）。
- Pydantic v2 API：`.dict()` → `.model_dump()`、`class Config` → `model_config = ConfigDict(from_attributes=True)`。
- mypy：给路由函数补返回类型标注，或将 `disallow_untyped_defs` 降为 `false` 并留 TODO（二选一，不许保留"配置声明但从未通过"的状态）。

#### A-7 测试（`backend/tests/`）
新增：`tests/conftest.py`、`tests/test_smoke.py`、`tests/test_plans.py`、`tests/test_workouts.py`、`tests/test_body.py`、`tests/test_backup.py`、`tests/test_static.py`

- `conftest.py`：`sqlite:///:memory:` + `StaticPool`，依赖覆盖 `get_db`，`TestClient` fixture。
- **冒烟**：对每个已注册路由发一次合法请求，断言非 500（专杀 P0-1/P0-4/P1-5 这类"一跑就炸"）。
- 每个资源：happy-path（用 §0.2 的示例 JSON 原文作为请求体，断言响应字段名与前端读取的完全一致，含 `date`/`done`/`planDays`）、404、422（缺必填/非法枚举/负数）。
- `test_workouts.py` 必含：创建无 `planId` 的自由训练 → `GET /api/workouts/` 200（回归 P0-4）。
- `test_plans.py` 必含：激活不存在的计划 → 404 且原激活状态不被清零（回归 P1-6）。
- `test_static.py`：`GET /` 返回 index.html；`GET /fittrack.db`、`/data/fittrack.db`、`/app/main.py` 404（回归 P0-2）。

### 1.3 验收标准

1. `pytest backend/tests -q` 全绿；冒烟测试覆盖全部路由。
2. 用 §0.2 的三段示例 JSON 直接 POST 创建计划/训练/体重，均 200/201，且 GET 返回体可被前端现有渲染代码直接消费（字段名逐一核对）。
3. `uvicorn app.main:app` 启动后浏览器打开 `http://localhost:8000/` 能加载前端页面；`/fittrack.db` 等敏感路径 404。
4. 不修改 `js/` 下任何文件（前端契约兼容由 schema 对齐保证）。

### 1.4 注意事项

- 本机曾检测到 `python` 为 Windows Store 占位程序；工程师需自行确认使用真实 Python ≥3.10（建议 `py -3` 或 venv）。
- 不引入 Alembic；schema 变更靠 `create_all` + 开发期删库即可（数据库尚无生产数据），但请在 `backend/README.md` 注明。
- 认证不在本期范围：CORS 收紧 + 单用户常量即可，README 明示"单机单用户"。

---

## 2. 工作包 B：前端修复与优化

**允许改动**：`js/` 下 14 个已有文件、`css/style.css`、`service-worker.js`、`manifest.json`；例外授权新增 `js/vendor/chart.umd.min.js`。**禁止**改 `index.html`（改动点全部登记到 §2.9 交 C 执行）。

### 2.1 P0：数据安全线（必须最先合入）

#### B-1 修复导出/导入链（前端审计 BUG-1，PWA 审计 BUG-3）
文件：`js/storage.js`、`js/settings.js`

- `Storage.exportAll()` 改 `async`，`await` 四个读取方法；同时并入营养与成就数据：
  ```js
  data: { plan, logs, bodyRecords, profile,
          nutrition: nutritionTracker.exportData(),   // meals/water/goals
          achievements: achievementSystem.exportData() }
  ```
  `version` 升为 `3`。
- `Storage.importAll(json)` 改 `async` 并加**结构校验**：
  - `data.plan` 必须满足 `Array.isArray(data.plan?.planDays)` 才写入；否则跳过并计数；
  - `logs`/`bodyRecords` 逐条校验必备字段（`date`、`exercises`/`weight`），非法条目丢弃；
  - 兼容 version 2/无版本的旧备份（缺失的 nutrition/achievements 段跳过）；建立 `MIGRATIONS` 版本迁移表（当前 2→3 为空迁移，占位即可，回应 GAP-9）。
- `settings.js`：`exportData`/`importData` 相应 `await`；导入失败给出具体 toast（如"计划数据格式不正确，已跳过"）。
- 防御兜底：`app.js loadSavedPlan()` 与 `initWorkout()` 中，`currentPlan` 存在但 `!Array.isArray(currentPlan.planDays)` 时视为无计划并清除坏数据（自愈已被 BUG-1 污染的用户）。

#### B-2 修复 clearAll（BUG-6）
文件：`js/storage.js`

- `clearAll()` 改为遍历删除所有 `fittrack_` 前缀 key：
  ```js
  Object.keys(localStorage).filter(k => k.startsWith('fittrack_')).forEach(k => localStorage.removeItem(k));
  ```
  （一并清掉 `fittrack_use_api`，消除 BUG-13/BUG-5 的残留开关隐患。）
- `_set` 加 try/catch，`QuotaExceededError` 时 `showToast('存储空间不足，数据未保存')` 并 return false（优化 2）。

#### B-3 XSS 加固（BUG-5）
文件：`js/storage.js`（新增工具）、`js/app.js`、`js/plans.js`、`js/nutrition-ui.js`、`js/body.js`、`js/achievements-ui.js`、`js/stats.js`

- `storage.js` 顶部新增全局 `escapeHtml(str)`（`&<>"'` 五字符实体化，非字符串原样返回数字）。
- 逐处转义（最小清单，逐一过审）：
  - `nutrition-ui.js:87` `${meal.name}`；`nutrition-ui.js:141` `data-food` 内联 JSON **改为存 `data-index` 查 `filtered` 数组**；
  - `app.js` renderExercises/renderHistory 中 `ex.name/day.name/day.focus/log.dayName/log.focus`；
  - `plans.js` 渲染中 `plan.goalLabel/day.name/day.focus/ex.name/ex.muscle/ex.equipment`；
  - `stats.js:195` exerciseSelect 的 option 文本；`body.js`、`achievements-ui.js` 中来自存储的字符串。
- 原则：**数值经 `Number()` 收敛，字符串经 `escapeHtml()`**，两者取一，不允许裸插值。

### 2.2 P0：PWA 离线能力（PWA 审计 BUG-1/2/4/7）
文件：`service-worker.js`、新增 `js/vendor/chart.umd.min.js`

- 下载 Chart.js 4.4.1 UMD 到 `js/vendor/chart.umd.min.js`（≈200KB，提交入库）。
- SW 重构：
  - 拆双缓存：`PRECACHE_NAME = 'fittrack-precache-v3'`、`RUNTIME_NAME = 'fittrack-runtime'`；activate 时只清理非当前 precache 与非 runtime 的旧缓存。
  - `urlsToCache` 增加 `./js/vendor/chart.umd.min.js`（此时 index.html 仍引用 CDN，不冲突；C 合入换源后即生效——见 §2.9-①）。
  - **install 不再吞错**：删除 `.catch(console.error)`，让 `addAll` 失败导致安装失败（BUG-2）。
  - fetch 分层策略（BUG-4 + 优化 1）：
    1. `if (request.method !== 'GET') return;`（不 respondWith，直接放行）；
    2. URL 含 `/api/` → 不拦截（network-only）；
    3. `request.mode === 'navigate'` → network-first，失败回 `caches.match('./index.html')`；
    4. 其余（js/css/icons/字体，含跨域 CDN）→ **cache-first**：命中即回，未命中 fetch 后写入 runtime 缓存（放宽 `type === 'basic'` 限制，允许 `cors`；`opaque` 不缓存直接透传）；
    5. 全路径兜底 `return new Response('', { status: 503, statusText: 'offline' })`，杜绝返回 `undefined`。
  - 删除死代码 `sync`/`syncData`/`push`/`notificationclick` 处理器（优化 4；C 的功能不依赖它们）。
  - 更新提示：SW 加 `message` 监听响应 `{type:'SKIP_WAITING'}` → `self.skipWaiting()`；`app.js` 注册处监听 `updatefound`/`statechange`，检测到 `installed && navigator.serviceWorker.controller` 时 `showToast('新版本已就绪，刷新后生效')`（点击刷新交互留给后续，toast 即达标）。
- `manifest.json`：为 192/512 图标补 `"purpose": "any"` 声明，并新增 `"id": "./"` 字段。maskable 变体图标需要设计资源，登记 TODO 不阻塞本包。

### 2.3 P1：核心逻辑 bug
文件：`js/theme.js`、`js/app.js`、`js/achievements.js`、`js/achievements-ui.js`、`js/nutrition.js`、`js/nutrition-ui.js`、`js/timer.js`

- **B-4 主题系统（BUG-2）**：`theme.js` 的 `THEMES` 各主题 vars 改写为 CSS 实际变量名（`--bg/--bg-soft/--surface/--surface-hover/--border/--text/--text-muted/--primary/--primary-dark/--primary-soft/--accent/--danger/--warning`，值从 `style.css:1-94` 抄录）；`applyTheme` 中 theme-color meta 的映射同步修正（light 用品牌绿 `#16a34a`，深色主题用各自 `--bg`）；`setFontSize` 的 `sizes` 提为类常量 `FONT_SIZES`；`style.css` 的 `body` 加 `font-size: var(--font-size-base, 16px)`。主题切换 UI 由 C 落地（§2.9-⑤），B 保证 `ThemeManager.setTheme/setFontSize/toggleAnimations` 可被安全调用且 `applyTheme()` 初始不破坏现状。
- **B-5 营养 UTC 日切（BUG-4）**：`nutrition.js` 五处 `toISOString().split('T')[0]` 全部替换为 `formatDate(new Date())`；`getDateIntake/getWeeklyTrend` 同理用本地日期。一次性迁移：加载时把已有 meal/water 记录中"UTC 日期字段与本地日期不一致"的历史数据保持原样（不强行重算，注释说明），仅保证**新写入**一律本地日期。
- **B-6 成就系统（BUG-3）**：
  - `app.js` 新增 `buildAchievementStats(logs, records)`：真实统计 `maxWeight`（全 logs 已完成 set 的最大 weight）、`earlyMorningWorkouts`（`getHours() < 8`）、`lateNightWorkouts`（`>= 22`）、`weekendWorkouts`（`getDay() ∈ {0,6}`）；
  - `finishBtn.onclick` 保存记录后调用 `AchievementsUI.checkNewAchievements(await buildAchievementStats(...))`；
  - 首次启动写注册日期：`achievementSystem.setRegistrationDate()` 若 `registrationDate` 为 null 则写入今天（`app.js` DOMContentLoaded 中调用）；
  - `achievements.js`：成就定义补显式 `target` 字段，`calculateProgress` 改用之（修 BUG-12）；解锁时写 `fittrack_achievement_${id}` 时间戳，`getUnlockDate` 即可用。
- **B-7 训练计时（BUG-8）+ change 监听（BUG-7）**：
  - `daySelect.addEventListener('change', renderExercises)` 改为 `daySelect.onchange = renderExercises`；
  - `renderExercises` 末尾**删除** `startWorkoutTimer()`；改为"惰性启动"：`exerciseList` 上用事件委托监听 `.set-done` 的首次勾选（`workoutTimerInterval === null && workoutSeconds === 0` 时）启动计时；
  - `finishBtn` 保存后 `stopWorkoutTimer(); workoutSeconds = 0; updateWorkoutTimerDisplay();` 不再自动重启；切换训练日仅在计时未启动时重置显示。
  - （C 会在此之上加显式"开始训练"按钮与引导模式，见 §3.4；B 的惰性启动逻辑保留为兜底。）
- **B-8 休息计时器（BUG-9）**：`timer.js addTime()` 删除 `if (this.running) return;`，运行中直接 `this.remaining += 30` 并刷新显示；`updateRing` 的 ratio 加 `Math.min(1, ...)`。
- **B-9 营养死代码（BUG-11）**：删除 `calculateNutritionGoals`（无调用方且公式错误）。若保留则必须按标准宏量重写（蛋白 2g/kg×4kcal、脂肪 25% 热量 ÷9、余热量 ÷4 归碳水）——二选一，默认删。

### 2.4 P2：API 模式一致性（BUG-13、PWA BUG-5）
文件：`js/api.js`、`js/storage.js`

- `API.BASE_URL` 改为 `` `${location.origin}/api` ``（同源部署即通；GitHub Pages 上 `USE_API` 恒 false 不发请求）。
- `storage.js` API 分支：
  - `deleteLog/deleteBodyRecord`：`USE_API` 时先调 `API.workouts.delete(id)/API.body.delete(id)`（A 包已补端点；本地条目须携带后端 `id`，无 id 时仅删本地并 warn）；
  - `savePlan`：已有计划时改调 `API.request PUT /plans/{id}`（api.js 增加 `plans.update(id, plan)`）；
  - 所有 API **写**失败：除 console.error 外增加 `showToast('后端同步失败，数据已保存在本地')`。
- 本期不做双向同步协议（登记为后续路线图）；README 注明"API 模式为实验特性，单一数据源以后端为准"。

### 2.5 性能优化（优化 1、3、4）
文件：`js/app.js`、`js/stats.js`、`js/storage.js`、`js/nutrition-ui.js`

- `Storage` 加内存缓存：`_get` 结果按 key 缓存，`_set/removeItem` 时失效（写穿）。这一条即消灭"6 动作 6 次全量 JSON.parse"与 `Stats.refresh` 的 4 次重复解析，实现最简、收益最大。
- `renderExercises`：`getLogs` 一次取出后循环内查找（替代逐动作 `getExerciseLastRecord` 各自读盘——或依赖上一条缓存后保持现状，任选其一，写明取舍）。
- `nutrition-ui.js` 搜索加 150ms debounce；搜索结果点击改事件委托（配合 B-3 的 `data-index` 改造）。
- `renderHistory`（app.js/body.js）、`renderMeals` 的按钮监听改容器级事件委托。

### 2.6 深色模式与主题一致性（优化 5、6）
文件：`css/style.css`、`js/stats.js`、`js/body.js`

- `.nav` 背景改 `color-mix(in srgb, var(--surface) 88%, transparent)`（或 `rgba` 变量方案），确保三套主题 + 系统深色下正常。
- Chart.js 颜色改从 CSS 变量读取：新增工具（放 `stats.js` 顶部，`body.js` 复用全局）`chartColors()` → `getComputedStyle(document.documentElement)` 取 `--text-muted/--border/--surface`，用于 ticks/grid/doughnut 描边。

### 2.7 可访问性与移动端（优化 8、10、12 中不动 index.html 的部分）
文件：`js/app.js`、`js/body.js`、`js/nutrition-ui.js`、`css/style.css`、`js/storage.js`

- 动态生成的删除按钮 `✕` 加 `aria-label="删除记录"`；toast 元素创建时加 `aria-live="polite" role="status"`。
- 动态生成的数字输入（set-weight/set-reps）加 `inputmode="decimal"` / `inputmode="numeric"`。
- CSS：`@media (prefers-reduced-motion: reduce)` 应用 `.no-animations` 同款规则；`.toast` 的 bottom 改 `calc(2rem + env(safe-area-inset-bottom))`；`sets-table input` 触控目标 ≥44px（调 padding/height）。
- 页签激活时 `btn.scrollIntoView({inline:'center', behavior:'smooth', block:'nearest'})`（`app.js initTabs`）。
- `prompt()/confirm()` 替换（优化 9）**仅限营养添加流程**改为内联表单（`nutrition-ui.js` 在 `food-search` 容器内渲染克数输入 + 餐次选择，不再 `prompt`）；删除确认类 `confirm` 本期保留。

### 2.8 死代码清理（优化 7）
文件：`js/theme.js`、`js/exercises.js`、`js/nutrition.js`、`js/achievements.js`、`js/api.js`

- 删除：`exercises.js` 的 `PERIODIZATION_TEMPLATES/MUSCLE_COLORS/DIFFICULTY_LEVELS` 与 4 个无调用筛选函数、全部 `video` 占位字段；`nutrition.js:287-298/371-390/414-423` 无调用方法（**保留** `getWeeklyTrend` 与 `exportData/importData`——前者 C 可能用、后者 B-1 已接线）；`achievements.js` 中 B-6 未修复接线的剩余死路径。
- `api.js` 保留现有分组（A 包对齐后即为活代码），仅删注释明显失效的说明。

### 2.9 委托给工作包 C 的 index.html 精确改动清单

C 在其第一个 PR 中原样执行以下六项（B 合入后立即可做）：

1. **①换 Chart.js 源**：第 12 行 `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>` → `<script src="js/vendor/chart.umd.min.js"></script>`。
2. **②viewport**：第 5 行 content 追加 `, viewport-fit=cover`。
3. **③静态数字输入**：`#body-weight`、`#profile-height`、`#timer-custom`、`#goal-calories/#goal-protein/#goal-carbs/#goal-fat` 加 `inputmode="decimal"`（整数型的用 `numeric`）。
4. **④导航可访问性**：`<nav class="nav">` 加 `role="tablist"`；每个 `.nav-btn` 加 `role="tab"`；各 `section.tab` 加 `role="tabpanel"`。`aria-selected` 由 B 已在 `initTabs` 中动态维护（B 需在 initTabs 里同步 setAttribute，此 JS 部分属 B）。
5. **⑤设置页外观卡片**：在"数据管理"卡片**之前**插入：
   ```html
   <div class="card">
     <h2>外观</h2>
     <div class="theme-switcher" id="theme-switcher"></div>
     <label>字号
       <select id="font-size-select">
         <option value="small">小</option><option value="medium" selected>中</option>
         <option value="large">大</option><option value="xlarge">特大</option>
       </select>
     </label>
     <label class="switch-label"><input type="checkbox" id="animations-toggle" checked> 界面动画</label>
   </div>
   ```
   对应 JS 接线由 B 预先写好（`settings.js` 中 `if (document.getElementById('theme-switcher')) { ...渲染主题按钮并绑定 ThemeManager... }`，元素不存在时静默跳过——保证 B 单独合入不报错）。
6. **⑥about 版本文案**：`v2.0` → `v2.1`（可选）。

### 2.10 验收标准

1. **数据链路**：导出备份 → 清空所有数据（localStorage 中无任何 `fittrack_` key）→ 导入该备份 → 计划/训练历史/体重/营养/成就全部恢复；导入一份 `{"data":{"plan":{}}}` 的坏文件不写入、不崩溃、toast 提示。
2. **XSS**：添加名为 `<img src=x onerror=alert(1)>` 的食物、导入含同类字符串的 `dayName` 备份，页面渲染为字面文本，无脚本执行。
3. **离线**：（与 C 的①合并后验证）断网刷新，8 个页签全部可进，统计/身体图表正常渲染；DevTools 无 `respondWith undefined` 类报错。
4. **计时**：打开训练页不计时；勾第一组开始计时；完成训练后计时停止且显示归零；保存 3 次计划后切换训练日仅触发一次渲染（DevTools 断点验证）。
5. **成就**：清空数据后完成一次训练，立即弹"初次训练"；早于 8 点的记录（可改系统时间或构造数据）使"早起鸟"可解锁。
6. **营养**：本地时间 00:30 添加食物记入"今天"（改系统时区/时间验证）。
7. **休息计时**：倒计时运行中点 +30秒 立即生效，圆环不超一圈。
8. **主题**：`ThemeManager.setTheme('dark')` 控制台调用后整站变色（含 nav、图表在下次渲染时取新变量）；无 UI 时页面表现与修复前一致。
9. 回归：现有全部功能手测通过；`service-worker.js` 版本已 bump。

### 2.11 注意事项

- 所有改动保持零构建、零依赖（除 vendored Chart.js 资源文件）。
- `storage.js` 加内存缓存后注意 `importAll/clearAll` 必须主动失效缓存。
- 不要顺手实现 §3 的功能（热力图/PR/引导模式），即使很顺手——那是 C 的地盘。

---

## 3. 工作包 C：新功能（B 合入后串行）

**允许改动**：`index.html`、`css/style.css`（在文件尾部追加 `/* ===== C 包新增 ===== */` 区块）、新建 `js/heatmap.js`、`js/records.js`、`js/workout-session.js`，以及 `js/app.js`、`js/stats.js`、`js/settings.js` 的集成点、`service-worker.js`（仅 CACHE 版本与 urlsToCache）。

**第一个 PR**：先执行 §2.9 的六项 index.html 委托改动 + 把三个新 js 文件与 vendor Chart.js 的 `<script>` 挂入（顺序见 §3.6），SW 预缓存列表加 `./js/heatmap.js`、`./js/records.js`、`./js/workout-session.js` 并 bump 版本。

### 3.0 选型结论

从 6 个候选中选择：**#1 训练日历热力图、#2 1RM/PR 追踪、#5 训练模式增强**。

理由：
- **#1、#2 完全由现有 `fittrack_logs` 派生**，零新数据源、零迁移风险，直接强化已有统计页，是"数据已在手、只差呈现"的最高性价比项；
- **#5 正面填补审计 GAP-3/GAP-8 指出的核心体验断层**（勾完一组要手动切页签开计时器），与 B-7 的计时修复天然衔接；
- 落选说明：#3 训练提醒依赖 Notification API，iOS PWA 支持残缺且无后端 push 通道，投入产出比低；#4 CSV 导出在 B-1 修好 JSON 备份后价值边际化；#6 周报卡片价值不低但与 #1/#2 信息重叠，留作下期。

### 3.1 功能一：训练日历热力图（GitHub 风格）

- **新文件**：`js/heatmap.js`，全局对象 `Heatmap`。
- **UI 位置**：统计页 `#tab-stats`，`stats-grid` 与"每周训练频率"卡片之间插入：
  ```html
  <div class="card">
    <h2>训练日历</h2>
    <div id="workout-heatmap" class="heatmap-scroll"></div>
    <div class="heatmap-legend">少 <span class="hm-cell" data-level="0"></span>…<span class="hm-cell" data-level="4"></span> 多</div>
  </div>
  ```
- **实现**：纯 DOM/CSS Grid，**不用 Chart.js**。渲染最近 26 周（182 天）、7 行 × 26 列，周一为首行（与 `getWeekStart` 口径一致）；容器横向滚动、初始滚到最右（最近一周）。
- **数据**：`Heatmap.render(logs)` 接收 `Stats.refresh` 传入的 logs（不自行读盘）；按 `formatDate(log.date)` 聚合每日**完成组数**（`sets.filter(s=>s.done).length` 求和）。等级映射：0 组=0；1-5=1；6-12=2；13-20=3；>20=4。
- **样式**（style.css 追加区块）：`.hm-cell` 12×12px 圆角 3px；level 0 用 `var(--bg-soft)`，1-4 用 `color-mix(in srgb, var(--primary) X%, var(--bg-soft))`（X=30/50/75/100），自动适配全部主题与深色模式。单元格 `title="2026-08-25 · 18 组"` 提供悬浮详情，并设 `aria-label` 同文。
- **集成点**：`stats.js Stats.refresh()` 中 `updateSummary` 后调用 `Heatmap.render(logs)`（将 refresh 改为取一次 logs 传递各子方法，顺应 B 的性能方向）。
- **无新 localStorage key**。

### 3.2 功能二：1RM 计算器 + PR 追踪与进步曲线

- **新文件**：`js/records.js`，全局对象 `Records`。
- **公式**：Epley `1RM = weight × (1 + reps/30)`；`reps > 12` 时仍计算但 UI 标注"估算精度有限"；`reps === 1` 直接取 weight。
- **数据结构**：PR 一律从 `fittrack_logs` 派生（logs 是唯一事实源），另设**缓存键** `fittrack_prs`：
  ```json
  { "杠铃卧推": { "bestWeight": 80, "best1RM": 93.3, "bestVolumeSet": {"weight":70,"reps":10},
                  "date": "2026-08-20", "history": false } }
  ```
  `Records.rebuild(logs)` 全量重算并覆写该 key；在导入数据、删除记录后必须调用 rebuild（集成点：`settings.js importData` 成功后、`app.js` 删除记录处）。缓存仅为加速与"是否新 PR"比对，可随时重建。
- **UI 位置**（index.html，统计页）：
  1. "动作进步曲线"卡片内、`<canvas id="chart-progress">` 上方插入 `<div id="pr-summary" class="pr-summary"></div>`：显示当前所选动作的 `最大重量 / 估算1RM / 创造日期`；
  2. 其后新增独立卡片"1RM 计算器"：
     ```html
     <div class="card"><h2>1RM 计算器</h2>
       <form id="orm-form" class="form"><div class="form-row">
         <label>重量 (kg)<input type="number" id="orm-weight" inputmode="decimal" min="1" max="500" step="0.5" required></label>
         <label>次数<input type="number" id="orm-reps" inputmode="numeric" min="1" max="20" required></label>
       </div><button type="submit" class="btn btn-primary">计算</button></form>
       <div id="orm-result" class="orm-result"></div>
     </div>
     ```
     结果区渲染估算 1RM + 一张 95%/90%/85%/80%/75%/70% 强度对照小表（纯 DOM）。
- **进步曲线增强**：`stats.js renderProgressChart` 增加第二条 dataset"估算 1RM"（每次训练取该动作所有完成组的 max Epley 值），颜色 `var(--accent)` 经 `chartColors()` 读取。
- **新 PR 提示**：`app.js finishBtn.onclick` 保存 log 后调用 `Records.checkNewPRs(log)` → 与 `fittrack_prs` 比对，破纪录时 `showToast('🎉 新纪录：杠铃卧推 82.5kg')`（多个 PR 合并为一条），随后 rebuild。同时把 `bestWeight` 的全局最大值提供给 B-6 的 `buildAchievementStats`（读同一缓存，避免重复扫描——若 B 已实现扫描逻辑则保持 B 版本，Records 不重复上报）。

### 3.3 功能三：训练模式增强（引导界面 + 组间倒计时自动衔接）

- **新文件**：`js/workout-session.js`，全局对象 `WorkoutSession`。
- **交互设计**：
  1. 训练页 `#workout-content` 顶部（计时行之上）插入按钮 `<button id="start-session" class="btn btn-primary" style="width:100%">▶ 开始训练</button>`；点击后进入"进行中"状态：按钮变为进度条文案（`进行中 · 已完成 3/16 组`），并调用 B-7 保留的 `startWorkoutTimer()`（显式启动优先于 B 的惰性启动；未点开始就勾组时仍走惰性启动并自动进入进行中状态）。
  2. **组间自动倒计时**：进行中状态下，勾选任一 `.set-done`（事件委托挂在 `#exercise-list`，与 B 的委托并存或合并）触发底部悬浮条 `#rest-bar`（fixed 定位，`bottom: calc(0px + env(safe-area-inset-bottom))`，宽度 100%）：显示 `休息 90s` 递减进度 + `+30s` / `跳过` 两按钮。倒计时秒数取当前动作的 `ex.rest`（从 `currentPlan.planDays[dayIndex].exercises[exIndex].rest` 读取；WorkoutSession 通过 `data-exercise` 索引定位）。
  3. 倒计时结束：`navigator.vibrate?.([200,100,200])`、rest-bar 闪烁 3 次后收起、toast"休息结束，继续下一组"。再次勾选自动重开。
  4. **当前动作高亮**：最近一次勾选所在 `.exercise-card` 加 `.active-exercise` 类（左侧 `var(--primary)` 竖条），其余移除。
  5. 完成训练（`finish-workout`）或切换训练日：`WorkoutSession.reset()` 收起 rest-bar、清除高亮、按钮复位为"▶ 开始训练"。
- **与休息计时页的关系**：rest-bar 内部直接复用倒计时逻辑**独立实现**（`setInterval` 简单递减即可），不劫持 `Timer` 页签的状态，两者互不干扰（Timer 页保持手动使用场景）。
- **localStorage**：本体**无新 key**。可选扩展 `fittrack_active_session`（进行中 session 的输入草稿，防误刷新丢失）标记为 P2 stretch，默认不做。
- **index.html 改动**：`#start-session` 按钮 + `<div id="rest-bar" class="rest-bar hidden" role="timer" aria-live="polite"></div>`（放 `</main>` 后、`<script>` 前）。
- **集成点**：`app.js initWorkout` 中 `renderExercises` 完成后调用 `WorkoutSession.bind(exerciseList, () => currentPlan, daySelect)`；`finishBtn.onclick` 尾部调用 `WorkoutSession.reset()`。

### 3.4 脚本加载顺序（index.html 最终态）

```
api.js → exercises.js → plans.js → storage.js → timer.js
→ records.js → heatmap.js          （新增：依赖 storage 的全局工具，先于 stats）
→ stats.js → body.js → nutrition.js → nutrition-ui.js
→ achievements.js → achievements-ui.js → theme.js → settings.js
→ workout-session.js               （新增：依赖 storage/timer 工具，先于 app）
→ app.js
```

### 3.5 验收标准

1. **§2.9 委托项**：六项全部落地；断网刷新后统计/身体图表正常（Chart.js 本地化闭环，联合 B 的 §2.10-3 一起验收）。
2. **热力图**：26 周格子渲染正确（今天在最右列、星期行对齐）；构造某日 18 组的记录显示 level 3 颜色；四套主题 + 系统深色下对比度正常；无记录时全 level 0 不报错。
3. **PR**：录入 60kg×10 → 统计页该动作 PR 显示 80（Epley）；再录 82.5kg×1 完成训练时 toast 新纪录；删除该条记录后 PR 回落（rebuild 生效）；1RM 计算器输入 100/5 显示 116.7 及强度表。
4. **引导模式**：点"开始训练"计时启动；勾一组底部弹出该动作 rest 秒数的倒计时并自动递减；+30s/跳过可用；倒计时结束震动（支持的设备）+提示；连续勾选自动重开；完成训练后 rest-bar 收起、按钮复位；**全程不影响"计时"页签的独立计时器**。
5. **纯前端约束**：以上全部在 `USE_API=false`、断网、GitHub Pages 子路径（`/yyy/`）模拟下可用；无绝对路径引用（grep `src="/`、`href="/`、`url(/` 为零）。
6. `service-worker.js` 版本已 bump 且新 js 文件在预缓存列表；旧缓存激活后被清理。
7. B 的 §2.10 全部验收项回归通过（C 不得破坏 B 的修复）。

### 3.6 注意事项

- C 对已有 js 文件的改动**仅限列明的集成点**（stats.js 的 refresh/renderProgressChart、app.js 的 initWorkout/finishBtn/DOMContentLoaded、settings.js 的 importData 后钩子）；发现 B 遗留 bug 时提 issue 回流给 B 责任人，不要顺手改出所有权之外的 diff。
- 所有新渲染路径使用 B 提供的 `escapeHtml()`；动作名进入 `title/aria-label` 属性同样转义。
- 热力图与 PR 均以 logs 为唯一事实源：任何"缓存/派生"数据损坏时必须能通过 rebuild 自愈，导入/清空数据流程要验证这一点。
- rest-bar 的 fixed 定位注意与 toast（`bottom: 2rem + safe-area`）避让：toast 显示时 rest-bar 存在的场景，将 toast 的 bottom 提高（CSS `body:has(.rest-bar:not(.hidden)) .toast { bottom: calc(6rem + env(safe-area-inset-bottom)); }`，不支持 `:has` 的浏览器容忍重叠）。

---

## 4. 里程碑与合并顺序

| 阶段 | 内容 | 出口条件 |
|---|---|---|
| M1（A ∥ B 并行） | A：A-1~A-7；B：§2.1~§2.8 | A：pytest 全绿 + §1.3；B：§2.10（第 3 条除外） |
| M2（C 串行） | C 第一个 PR：§2.9 委托项 + 脚本挂载 + SW 版本 | §2.10-3（离线闭环）+ §3.5-1 |
| M3 | C 三个功能各一个 PR（热力图 → PR → 引导模式，可并串自定） | §3.5-2~7 |
| M4（可选联调） | `USE_API=true` 下 A+B 契约联测（§0.2 逐字段） | 计划/训练/体重三链路端到端 CRUD 通过 |

遗留路线图（本期不做，勿顺手实现）：双向同步协议与 ID 对账、认证体系、maskable 图标设计、周报卡片（候选 #6）、训练提醒（候选 #3）、`fittrack_active_session` 草稿恢复。
