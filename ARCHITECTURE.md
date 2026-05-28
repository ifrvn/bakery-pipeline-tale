# 烘焙流水线物语 — 项目架构文档

> 最后更新：2026-05-28（添加 JUMP/SUB 指令、新增第 3 关、关卡列表页动态化）

---

## 一、项目概述

**烘焙流水线物语（Bakery Pipeline Tale）** 是一款面向儿童的编程启蒙游戏，以温馨烘焙店为背景，玩家通过拖拽指令卡片为"小烘焙师"编写程序，控制其在传送带之间取放原料。核心机制对标 *Human Resource Machine（HRM）*，用「取原料 / 放成品 / 跳转 / 条件判断」等可视化指令，循序渐进地引导玩家理解顺序、循环、条件、运算等编程逻辑。

---

## 二、技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API) | 页面 UI 与组件 |
| 状态管理 | Pinia | 跨组件事件总线（emitter store） |
| 路由 | vue-router v5 + unplugin-vue-router | 基于文件系统的自动路由 |
| 游戏渲染 | PixiJS v8 | WebGL/WebGPU 2D 场景渲染 |
| 拖拽交互 | vue-draggable-plus | 基于 Sortable.js 的拖拽排序（指令卡片 + 程序列表） |
| 样式 | UnoCSS + SASS/SCSS | 原子 CSS + 组件作用域样式 |
| 构建工具 | Vite v8 | 开发服务器 & 生产构建 |
| 包管理 | pnpm (workspace) | monorepo 支持 |
| 代码规范 | ESLint + Prettier | 代码质量与格式化 |

---

## 三、目录结构

```
bakery-pipeline-tale/
├── index.html                    # HTML 入口
├── vite.config.js                # Vite 配置（插件：VueRouter/Vue/UnoCSS/DevTools）
├── uno.config.js                 # UnoCSS 配置（presetUno/Attributify/Icons）
├── eslint.config.js              # ESLint 配置
├── package.json                  # 依赖声明
├── pnpm-workspace.yaml           # pnpm workspace 配置
├── public/                       # 静态资源（直接复制，不经 Vite 处理）
└── src/
    ├── main.js                   # 应用入口（createApp + Pinia + Router）
    ├── App.vue                   # 根组件（仅 RouterView）
    ├── router/
    │   └── index.js              # 路由实例（基于文件系统自动生成路由）
    ├── stores/
    │   └── emitter.js            # Pinia Store：事件总线（emit / on）
    ├── styles/
    │   └── main.scss             # 全局样式
    ├── assets/
    │   └── images/               # 图片资源（含 landing_bg.png）
    ├── components/
    │   ├── ControlPanel.vue      # 游戏控制面板（指令卡片 + 程序列表 + 操作按钮）
    │   └── OpCard.vue            # 指令卡片组件（可复用，支持拖拽/点击/禁用状态）
    ├── pages/                    # 文件路由页面
    │   ├── index.vue             # 主页（Landing 页，点击进入关卡列表）
    │   ├── levels/
    │   │   └── index.vue         # 关卡选择列表页（含进度解锁逻辑）
    │   └── play/
    │       └── [id].vue          # 游戏关卡页（动态路由，初始化 PixiJS 场景）
    └── game/                     # 游戏核心（纯逻辑，与 Vue 解耦）
        ├── core/
        │   └── createEmitter.js  # 基础发布-订阅工具
        ├── engine/
        │   └── pixi/
        │       └── createPixiApp.js  # PixiJS Application 初始化封装
        ├── entities/
        │   ├── createConveyorBelt.js # 传送带实体（渲染 + 状态）
        │   └── createWorker.js       # 小人实体（移动动画 + 拾取/放下）
        ├── levelConfigs/
        │   ├── index.js          # 关卡配置集合 + getLevelConfigsById()
        │   ├── materials.js      # 原料定义（MATERIALS 枚举）
        │   └── ops.js            # 指令定义（OP 枚举）
        ├── logic/
        │   ├── index.js          # GameRunner（程序执行引擎）
        │   ├── inbox.js          # INBOX 指令逻辑
        │   ├── outbox.js         # OUTBOX 指令逻辑
        │   ├── jump.js           # JUMP 跳转指令逻辑
        │   ├── sub.js            # SUB 丢弃指令逻辑
        │   └── common.js         # 公共工具（历史遗留，updateState 草稿）
        ├── runtime/
        │   └── createGameApp.js  # 顶层运行时（PixiApp + Scene + ResizeObserver + Ticker）
        └── scenes/
            └── createGameScene.js # 游戏场景工厂（View 布局 + GameRunner 组装）
```

---

## 四、整体架构分层

```
┌─────────────────────────────────────────────┐
│                  页面层（Vue）                │
│  pages/index.vue  →  pages/levels/index.vue │
│              ↓                               │
│         pages/play/[id].vue                 │
│   （初始化游戏、监听状态、解锁下一关）          │
├─────────────────────────────────────────────┤
│                  组件层（Vue）                │
│         components/ControlPanel.vue         │
│  （指令卡片拖拽/点击 → 程序列表 → 播放/重置） │
├─────────────────────────────────────────────┤
│              状态桥接层（Pinia）              │
│            stores/emitter.js                │
│  （Game → Vue 的单向状态通知事件总线）        │
├─────────────────────────────────────────────┤
│             游戏运行时层（JS）                │
│  createGameApp → createGameScene            │
│      → createGameRunner（逻辑引擎）          │
│      → createGameView（PixiJS 渲染视图）     │
├─────────────────────────────────────────────┤
│              游戏实体层（PixiJS）             │
│  createConveyorBelt  ·  createWorker        │
├─────────────────────────────────────────────┤
│             底层引擎层（PixiJS v8）           │
│          createPixiApp（Application）        │
└─────────────────────────────────────────────┘
```

---

## 五、核心模块详解

### 5.1 游戏运行时 `createGameApp`

**文件**：`src/game/runtime/createGameApp.js`

负责整个游戏生命周期的顶层管理：

1. 调用 `createPixiApp` 初始化 PixiJS Application，将 canvas 插入 DOM 容器
2. 使用 `ResizeObserver` 监听容器尺寸变化，驱动 `setSize` 自适应
3. 调用外部传入的 `createScene` 工厂函数构建游戏场景，获得 `sceneCtl`（含 `api`、`setSize`、`update`、`dispose`）
4. 通过 `app.ticker` 驱动每帧 `sceneCtl.update(dt)`（dt 最大限制 50ms 防止跳帧）
5. 暴露 `start() / stop() / dispose()` 和 `sceneCtl` 给 Vue 页面

### 5.2 游戏场景 `createGameScene`

**文件**：`src/game/scenes/createGameScene.js`

组装一局游戏所需的所有对象：

- **createGameView**（内部函数）：
  - 创建 PixiJS `Container` 作为世界坐标根节点
  - 绘制背景（暖米色圆角矩形）
  - 实例化左侧 `inboxBelt`（输入传送带）和右侧 `outboxBelt`（输出传送带）
  - 实例化 `worker`（小人）
  - 实现 `setSize`：根据容器尺寸等比缩放 `world` Container，保持关卡场景居中显示
- 从 `getLevelConfigsById` 读取关卡配置（原料列表、可用指令、成功信息）
- 调用 `createGameRunner` 将视图与逻辑组合，返回运行时控制器

### 5.3 程序执行引擎 `createGameRunner`

**文件**：`src/game/logic/index.js`

游戏的"虚拟机"，负责执行玩家编写的指令序列：

```
state 状态机:
  idle ──play()──▶ running ──指令遍历完毕──▶ evaluateAfterRun() ──▶ finished(success/fail)
                     │                                                         │
                     └── 任意指令返回 false ──────────────────────────────────┘
```

| 字段 | 说明 |
|------|------|
| `status` | `idle` / `running` / `finished` |
| `pointer` | 当前执行的指令索引（-1 表示未运行） |
| `result` | `success` / `fail` / `''` |
| `message` | 结果描述文本 |
| `inboxCount` | 输入带剩余数量 |
| `outboxCount` | 输出带当前数量 |
| `carryingName` | 小人手持原料名称 |

每次状态变更通过 `useEmitterStore().emit()` 广播给 Vue 层。

**指令调度**（handlers 映射表）：

| 指令键 | 处理函数 | 说明 |
|--------|----------|------|
| `inbox` | `runInbox` | 移动小人到输入带旁，取走首个原料；带为空时返回 `'terminate'` 自然终止 |
| `outbox` | `runOutbox` | 移动小人到输出带旁，放下手持原料 |
| `jump` | `runJump` | 返回 `{ jumpTo }` 跳转到指定行（0-based），不执行任何动画 |
| `sub` | `runSub` | 丢弃小人手中原料（废料处理），无需移动 |

`play(programOps)` 接收 `{ title, target? }[]` 对象数组，按序异步执行：
- 返回 `false` → 已在 handler 内调用 `setFail`，终止
- 返回 `'terminate'` → 自然终止，交由 `evaluateAfterRun` 判断成败
- 返回 `{ jumpTo }` → 跳转至目标行
- 返回 `true` → 继续下一条

内置 **2000 步上限**，防止死循环程序卡死游戏。

### 5.4 实体：传送带 `createConveyorBelt`

**文件**：`src/game/entities/createConveyorBelt.js`

纯 PixiJS 实体，不依赖 Vue：

- **渲染**：棕色矩形轨道 + 顶底两条深色导轨
- **状态**：`items[]`（原料数据）+ `sprites[]`（对应 Graphics）
- **槽位系统**：按 `itemCapacity` 均匀分布 `slots`，`layout()` 将图形对齐槽位
- **核心 API**：
  - `setItems(items)` — 重置传送带内容
  - `takeNext()` — 从头部取走一个，返回 `{ item, gfx }`
  - `put(taken)` — 向尾部放入一个
  - `getPickupPoint()` / `getDropPoint()` — 计算小人应站位的世界坐标

### 5.5 实体：小人 `createWorker`

**文件**：`src/game/entities/createWorker.js`

- **渲染**：白色圆形身体 + 双眼 + 顶部携带物容器
- **移动**：`moveTo(target, duration)` 返回 Promise，帧更新时用缓动函数（ease-in-out）插值，到达目标后 resolve
- **拾取/放下**：`pick(item)` 将 item.gfx 挂到 carry 容器；`drop()` 解除挂载并返回 item
- **update(dt)**：由 GameApp ticker 每帧调用，驱动插值移动

### 5.6 关卡配置 `levelConfigs`

**文件**：`src/game/levelConfigs/`

```
OP（指令枚举）             MATERIALS（原料枚举）
─────────────────          ─────────────────────
INBOX  / OUTBOX            BREAD（面包坯）
ADD    / SUB               CREAM（奶油）
JUMP                       STRAWBERRY（草莓）
JUMP_IF_STRAWBERRY         SCRAP（废料）
```

`levelConfigs` 数组（当前 3 关）每项包含：

| 字段 | 说明 |
|------|------|
| `level` | 关卡编号 |
| `levelName` | 关卡名称 |
| `levelDesc` | 关卡描述（显示在面板） |
| `inboxItems` | 输入传送带初始原料列表 |
| `expectedOutCount` | 期望输出数量（可选，默认等于 inboxItems.length） |
| `availableOps` | 可用指令集合（显示为卡片） |
| `successMessage` | 通关提示文案 |

辅助函数 `getLevelCount()` 返回关卡总数，供关卡列表页动态渲染使用。

### 5.7 控制面板 `ControlPanel.vue`

**文件**：`src/components/ControlPanel.vue`

纯 Vue 展示/交互组件，通过 props 接收 `api` 和 `config`，不直接引用 PixiJS：

- **指令卡片区**（左侧浮动，`VueDraggable` clone 模式）：按 `config.availableOps` 渲染 `OpCard`，支持拖出复制到程序列表，也支持点击追加
- **程序列表区**（右侧面板，`VueDraggable` sort 模式）：接收拖入的指令卡片，支持列表内**拖拽排序**（⠿ 把手）和逐条删除；正在执行的行高亮
- **结果区**：`status === 'finished'` 时展示成功（绿色）或失败（红色）信息
- **操作栏**：播放 / 重置 / 清空 按钮，按 `state.status` 控制 disabled 状态

### 5.8 指令卡片 `OpCard.vue`

**文件**：`src/components/OpCard.vue`

可复用的原子组件，渲染单张指令卡片：

| prop | 类型 | 说明 |
|------|------|------|
| `title` | String（必填） | 指令名称（如 `inbox`） |
| `subTitle` | String | 指令副标题（如 `(取原料)`） |
| `disabled` | Boolean | 禁用状态（游戏运行中禁止操作） |

emit `click` 事件供父组件处理点击追加逻辑。

---

## 六、数据流向

```
用户拖拽/点击指令
      │
      ▼
ControlPanel.vue
  steps[] (本地 ref)
      │ play(programOps)
      ▼
GameRunner.play()                ← api.play()
  async for loop
      │ await handler(ctx)
      ▼
runInbox / runOutbox
  worker.moveTo()  ────────────── PixiJS 动画帧更新
  belt.takeNext() / belt.put()
      │
      ▼
updateState(partial)
  useEmitterStore().emit(state)
      │
      ▼
ControlPanel.vue
  onStateChange(s => state.value = s)  ← 反映到 UI
      │
      ▼（status === 'finished' && result === 'success'）
play/[id].vue
  localStorage.setItem('bakery-max-level', ...)  ← 解锁下一关
```

---

## 七、路由结构

路由由 `unplugin-vue-router` 根据 `src/pages/` 目录自动生成：

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `pages/index.vue` | Landing 页，点击进入关卡列表 |
| `/levels` | `pages/levels/index.vue` | 关卡选择，读取 `localStorage` 判断解锁进度 |
| `/play/:id` | `pages/play/[id].vue` | 游戏关卡，动态加载对应关卡配置并初始化 PixiJS |

关卡解锁进度持久化于 `localStorage` key `bakery-max-level`，默认值为 `1`（第 1 关已解锁）。

---

## 八、已实现 vs 待实现功能

### ✅ 已实现

- 游戏基础场景（传送带、小人、背景）
- 游戏基础逻辑（拖拽指令、按序播放、成功/失败判定）
- INBOX / OUTBOX 指令及动画
- **JUMP 跳转指令**（无条件循环，程序列表中显示目标行输入框）
- **SUB 丢弃指令**（废料处理，丢弃手持原料）
- 关卡选择与解锁进度持久化
- 响应式画布（ResizeObserver 自适应）
- Landing 页、关卡列表页、游戏页完整导航流程
- **OpCard 组件提取**（可复用指令卡片）
- **vue-draggable-plus 拖拽优化**（程序列表支持拖拽排序）
- **3 个关卡配置**（基础取放 / 循环生产 / 废料分拣）
- 关卡列表页动态读取 `getLevelCount()`，新增关卡无需改 UI
- 执行引擎防死循环保护（2000 步上限）

### 🚧 待实现

**逻辑层**
- ADD 合并指令（需手持 2 个原料相加）
- JUMP_IF_STRAWBERRY 条件跳转指令

**UI 层**
- 小人精细化绘制
- 原料图标素材
- 播放/暂停按钮素材
- 通关/失败结算弹框（显示步骤数、重玩/下一关按钮）
- 游戏场景优化（2D 俯视烘焙房间）
- 传送带样式优化（L 型 + 卡通版）

**动画层**
- INBOX/OUTBOX 指令执行动画细化
- ADD/SUB 指令执行动画
- 程序列表执行指示箭头跟随动画
- 传送带关卡开始/结算入场出场动画

---

## 九、关键设计决策

| 决策 | 说明 |
|------|------|
| **游戏逻辑与 Vue 解耦** | `src/game/` 目录下所有模块均为纯 JS，不依赖 Vue 响应式，仅通过 `emitter store` 向上通知状态变化，便于独立测试和后续迁移 |
| **世界坐标系** | 游戏场景使用以房间中心为原点的自定义坐标系（单位约等于 1 格），通过 `world.scale` 统一缩放适配不同屏幕，避免硬编码像素值 |
| **异步指令链** | 每条指令返回 `Promise<boolean>`，`GameRunner` 用 `async/await for` 串行执行，配合 PixiJS ticker 驱动的 `moveTo` Promise 实现动画等待 |
| **Emitter as Pinia Store** | 将事件总线实现为 Pinia Store，使 Vue DevTools 可追踪事件历史，同时保持 game 模块对 Vue 的最小依赖（仅 `useEmitterStore` 这一处调用） |
| **文件系统路由** | 使用 `unplugin-vue-router` 零配置路由，页面文件即路由，降低维护成本 |
