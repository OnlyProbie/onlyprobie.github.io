# Remywwo 个人网站项目文档

## 1. 项目概述

这是一个基于 **Vue 3** 的个人博客/作品集网站，采用现代化的技术栈构建。网站主要用于展示技术博客、每日碎记、产品思考和旅行兴趣等内容模块。网站使用 Markdown 作为内容格式，通过 ViteSSG 进行静态站点生成，支持服务端渲染（SSG）以获得更好的 SEO 和加载性能。

项目地址：https://github.com/Remywwo/remywwo.github.io

## 2. 目录结构说明

```
remywwo.github.io/
├── pages/                    # 页面路由目录（基于文件系统的路由）
│   ├── [...404].md          # 404 错误页面
│   ├── index.md             # 首页（文章列表）
│   ├── about.md             # 关于页面
│   ├── daily/               # 碎记模块
│   │   ├── index.md         # 日历入口页
│   │   ├── [date].md        # Fallback 路由（显示暂无记录）
│   │   └── YYYY-MM-DD.md    # 碎记文章
│   ├── posts/               # 技术博客模块
│   │   ├── index.md         # 博客列表页
│   │   └── *.md             # 博客文章
│   ├── product/             # 产品思考模块
│   │   ├── index.md         # 产品列表页
│   │   └── [slug].md        # 产品详情页
│   ├── interest/            # 兴趣模块
│   │   └── index.md         # 兴趣主页
│   ├── content/             # 内容生成目录
│   │   └── product/         # 产品源文件
│   ├── design/              # 设计模块
│   └── thinking/             # 思考模块
├── src/                      # Vue 组件和业务逻辑
│   ├── components/          # Vue 组件
│   │   ├── NavBar.vue       # 导航栏
│   │   ├── Footer.vue       # 页脚
│   │   ├── ProfileCard.vue   # 个人资料卡片
│   │   ├── ListPosts.vue     # 文章列表组件（支持分页）
│   │   ├── DailyCalendar.vue # 日历组件
│   │   ├── DailyDetail.vue   # 碎记详情（fallback 组件）
│   │   ├── WrapperPost.vue   # 文章包装组件
│   │   └── ...
│   ├── composables/         # Vue Composables
│   │   └── useHoliday.ts    # 节假日计算逻辑
│   ├── data/                # 自动生成的数据文件
│   │   ├── interestsAuto.ts  # 兴趣数据
│   │   └── productsAuto.ts   # 产品数据
│   ├── lib/                  # 工具库
│   │   └── markdown.ts       # Markdown 解析实例
│   ├── styles/              # 样式文件
│   ├── logics/              # 业务逻辑
│   ├── types.ts             # TypeScript 类型定义
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── scripts/                  # 构建脚本
│   ├── generateInterests.ts  # 生成兴趣数据
│   ├── generateProducts.ts   # 生成产品数据
│   ├── rss.ts               # 生成 RSS 订阅
│   └── slugify.ts           # URL slug 处理
├── content-creator/          # 内容创作工具（独立 Next.js 应用）
├── public/                  # 静态公共资源
│   └── geojson/             # 地图 GeoJSON 数据
├── .github/workflows/        # GitHub Actions
├── vite.config.ts           # Vite 配置
├── unocss.config.ts         # UnoCSS 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖管理
```

## 3. 主要功能模块

### 3.1 首页 (pages/index.md)

- 展示文章列表（ListPosts 组件）
- 支持分页功能
- 卡片标题 hover 呼吸灯动画
- 自动计算阅读时长

### 3.2 博客模块 (pages/posts/)

- 技术文章列表展示
- 支持 Markdown 格式渲染
- 使用 Shiki 进行代码高亮（支持 TwoSlash 语法）
- GitHub 风格的 alerts（tip、warning、danger 等）
- 自动生成目录（Table of Contents）
- 自动计算阅读时长

### 3.3 碎记模块 (pages/daily/)

- **DailyCalendar 组件**：完整的日历视图
  - 显示农历日期和节假日信息
  - 从路由获取日期列表，标记有记录的日子
  - 支持节气显示
  - 调休/补班标记
  - 点击日期跳转到详情页
- **碎记文章**：`pages/daily/YYYY-MM-DD.md`
  - 使用 WrapperPost 包装
  - 自动计算阅读时长
  - 支持目录生成 `[[toc]]`
- **[date].md**：Fallback 路由，显示"暂无记录"

### 3.4 产品模块 (pages/product/)

- ProductCard 组件：产品卡片展示
- 产品数据从 `pages/content/product/` 目录自动生成

### 3.5 兴趣模块 (pages/interest/)

- 旅行照片管理（从 `public/images/interests/travel/` 自动读取）
- 中国地图相册

### 3.6 内容创作工具 (content-creator/)

独立运行的 Next.js 应用，提供：

- 可视化内容创建表单
- 支持多种内容类型：博客、碎记、产品、兴趣
- 实时 Markdown 预览
- 一键保存到正确目录

## 4. 技术实现细节

### 4.1 核心框架

- **Vue 3.5+**：渐进式 JavaScript 框架
- **Vue Router 4.x**：官方路由管理
- **Vite 5.x**：前端构建工具
- **vite-ssg**：静态站点生成

### 4.2 UI 和样式

- **UnoCSS**：原子化 CSS 引擎
- **@unocss/preset-icons**：图标支持
- **Floating-Vue**：浮动菜单组件
- **NProgress**：导航进度条

### 4.3 Markdown 处理

- **markdown-it**：Markdown 解析器
- **Shiki**：代码高亮（支持 VS Code 主题）
- **@shikijs/twoslash**：TypeScript 代码类型提示
- **markdown-it-anchor**：标题锚点生成
- **markdown-it-github-alerts**：GitHub 风格的提示框
- **markdown-it-table-of-contents**：目录生成

### 4.4 日期处理

- **lunar**：农历转换
- **chinese-holidays**：中国节假日

### 4.5 阅读时长自动计算

在 `vite.config.ts` 中通过 `frontmatterPreprocess` 自动计算：

- 中文：按字符数计算，每分钟约 200 字
- 英文：按单词数计算，每分钟约 250 词

```typescript
function calculateReadingTime(content: string, lang: string = 'zh'): string
```

### 4.6 路由系统

使用 `unplugin-vue-router` 实现基于文件系统的路由：

- `pages/*.md` → `/`
- `pages/posts/*.md` → `/posts/`
- `pages/daily/*.md` → `/daily/`
- `pages/daily/[date].md` → `/daily/:date` (fallback)

## 5. 构建与部署

### 5.1 本地开发

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 启动开发服务器
pnpm dev
# 访问 http://localhost:3333

# 构建生产版本
pnpm build
```

### 5.2 自动数据生成

开发服务器启动时自动运行：

```bash
esno ./scripts/generateInterests.ts  # 生成 src/data/interestsAuto.ts
esno ./scripts/generateProducts.ts   # 生成 src/data/productsAuto.ts
```

### 5.3 部署

GitHub Actions 自动部署，push 到 `main` 分支时自动构建并部署到 GitHub Pages。

## 6. 添加新内容

### 6.1 添加博客文章

在 `pages/posts/` 目录创建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2024-01-01
description: 文章描述
---

文章内容...
```

### 6.2 添加碎记

在 `pages/daily/` 目录创建 `YYYY-MM-DD.md` 文件：

```markdown
---
title: 碎记标题
date: 2024-01-01
---

[[toc]]

正文内容...
```

### 6.3 添加产品

在 `pages/content/product/` 目录创建 `.md` 文件：

```markdown
---
slug: product-slug
title: 产品名称
description: 产品描述
date: 2024-01-01
features:
  - 特性1
  - 特性2
techStack:
  - 技术栈1
---

产品内容...
```

### 6.4 添加旅行照片

将照片放入 `public/images/interests/travel/` 目录，文件名格式：
`城市-景点-YYYYMMDD.jpg` 或 `城市-YYYYMM.jpg`

## 7. 代码规范

项目使用 ESLint 和 lint-staged，提交前自动运行代码检查。

## 8. 许可证

- 代码：MIT License
- 文章和图片：CC BY-NC-SA 4.0
