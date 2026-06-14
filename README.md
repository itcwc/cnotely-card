# cnotely

闪记便笺工作台 — 剪藏即制卡（Capture is Creation）

## 项目简介

cnotely 是一个纯前端知识管理工具，将碎片化笔记与间隔重复闪卡无缝结合。采用 macOS 桌面隐喻的交互设计 + Apple 风格磨砂玻璃 UI，用户可在仿桌面环境中管理卡片、分类和链接，通过内置复习模式进行间隔重复记忆。所有数据存储在浏览器 IndexedDB 中，无需后端服务。

## 功能特性

### macOS 风格桌面工作台

- **桌面图标**：卡片/链接以 macOS 风格图标排列，支持自动排列和自由排列两种布局
- **Dock 栏**：底部 Dock 包含新建按钮、分类快捷入口、清空桌面、废纸篓
- **窗口系统**：卡片以 macOS 窗口打开，支持拖拽移动、调整大小、最小化、关闭、固定
- **右键菜单**：桌面图标和分类支持右键操作（打开、编辑名称/图标/颜色、移到废纸篓）
- **废纸篓**：删除的卡片进入废纸篓，支持恢复和彻底删除；可拖拽到 Dock 废纸篓区域删除

### 卡片系统

- **记忆卡（qa）**：问答式闪卡，正面问题、背面答案，支持 3D 翻转
- **文章卡（article）**：长文阅读笔记，Markdown 渲染 + PrismJS 代码高亮
- **分类管理**：卡片可归入不同分类，每个分类有独立颜色和图标，支持右键编辑
- **Markdown 编辑器**：分屏编辑 + 实时预览，工具栏支持常用 Markdown 语法，快捷键操作；正面亮色 / 背面暗色双主题面板

### 复习模式

- **闪卡翻转复习**：3D 翻转动画，点击或空格键翻面
- **间隔重复算法**：基于艾宾浩斯遗忘曲线，标记"没记住"或"已掌握"自动计算下次复习时间
- **键盘快捷键**：Space 翻面、1 没记住、2 已掌握
- **进度统计**：已刷数量、待复习剩余、按分类分组展示
- **全部重置**：支持一键重置所有卡片学习进度（需确认）
- **Session 快照机制**：复习过程中使用不可变快照防止卡片列表动态变化导致的迭代异常

### 创建面板

- 四种创建类型：链接、分类、记忆卡、文章卡
- 链接创建支持自动获取 favicon（网页图标 / 文字图标双模式）
- 分类创建支持 16 种预设图标和自定义颜色
- Apple 风格白色磨砂玻璃弹窗设计

### UI 设计体系

- **Apple 风格磨砂玻璃（Frosted Glass）**：全局统一的设计语言
  - 弹窗主体 `rgba(255,255,255,0.75)` + `backdrop-filter: blur(40px) saturate(180%)`
  - Header/Footer 半透明磨砂底色，与内容区融为一体
  - 所有子元素去 border 化，用半透明背景色区分层级
  - 圆角 16px、0.5px 极细分隔线、轻量级阴影
- **亮色/暗色双版本**：编辑器正面为亮色磨砂，背面为暗色磨砂
- **文字颜色规范**：主文字 `#1a1a2e`、次要 `#5a5e64`、标签 `#424245`、提示 `#4e535c`
- **Teleport 下拉菜单**：分类选择器通过 Vue Teleport 渲染到 body 层级，不受弹窗 overflow 限制

## 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | ^3.5.13 | Composition API + `<script setup>` |
| 构建工具 | Vite | ^6.3.5 | 开发服务器 + HMR |
| 路由 | Vue Router | ^4.5.0 | SPA 路由管理，HTML5 History 模式 |
| CSS | Tailwind CSS | ^4.1.7 | 原子化 CSS，通过 `@tailwindcss/vite` 插件集成 |
| 本地数据库 | Dexie.js | ^4.4.2 | IndexedDB 封装，支持版本迁移（当前 v7） |
| Markdown 渲染 | Marked | ^18.0.3 | GFM 语法解析 |
| 代码高亮 | PrismJS | ^1.30.0 | 多语言语法高亮，tomorrow 主题 |
| 图标 | Lucide Vue Next | ^0.469.0 | Vue 3 原生图标组件 |

## 项目结构

```
app/
├── src/
│   ├── components/
│   │   ├── AppLauncher.vue        # 创建面板（链接/分类/记忆卡/文章卡）— 磨砂玻璃弹窗
│   │   ├── CardEditor.vue         # Markdown 分屏编辑器 — 亮色/暗色双版磨砂玻璃
│   │   ├── CardWindowContent.vue  # 卡片窗口内容（翻转/Markdown 渲染）
│   │   ├── ContextMenu.vue        # 右键上下文菜单
│   │   ├── DesktopIcon.vue        # 桌面图标（拖拽排序）
│   │   └── WindowFrame.vue        # macOS 风格窗口框架
│   ├── composables/
│   │   └── useCardStore.js        # 核心状态管理 + 艾宾浩斯间隔重复算法
│   ├── db/
│   │   └── index.js               # Dexie 数据库定义 + 种子数据
│   ├── router/
│   │   └── index.js               # 路由配置
│   ├── views/
│   │   ├── DesktopView.vue        # 桌面主视图（含废纸篓/分类编辑弹窗）
│   │   └── ReviewView.vue         # 复习视图
│   ├── App.vue
│   ├── main.js
│   └── style.css                  # 全局样式（Tailwind + 自定义 CSS）
├── demo/
│   └── 示例页面/                   # 原型设计稿（HTML 静态页面）
├── index.html
├── package.json
└── vite.config.js
```

## 快速开始

```bash
cd app
npm install
npm run dev
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（HMR 热更新） |
| `npm run build` | 生产构建，输出到 `app/dist/` |
| `npm run preview` | 预览生产构建结果 |

## 架构说明

- **状态管理**：采用自定义 composable `useCardStore()` 实现全局单例状态管理，未使用 Pinia/Vuex
- **数据持久化**：所有数据存储在浏览器 IndexedDB 中，通过 Dexie.js 管理，支持 7 个版本的自动迁移
- **纯前端**：无后端依赖，无需服务器，数据完全本地化
- **UI 组件**：核心弹窗组件均采用自定义语义化 CSS class（scoped），不依赖 Tailwind 内联类，确保磨砂玻璃效果一致性
