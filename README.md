# Linka

Linka 是一个基于 WXT、React 和 Tailwind CSS 构建的浏览器扩展，用来把新标签页变成个人工作区。它会集中展示书签、当前浏览标签页、浏览快照和搜索入口，帮助你更快回到正在处理的网页上下文。

## 功能特性

- 新标签页工作区：在一个页面里查看书签、当前浏览和浏览快照。
- 多搜索引擎：支持百度、Google、Bing，并可从页面内切换。
- 书签管理：支持打开、编辑、删除、移动排序、添加当前页书签和创建书签文件夹。
- 当前浏览管理：读取当前窗口和标签页，支持切换标签页、关闭标签页、按浏览器标签组或域名聚合展示。
- 浏览快照：可保存选中的当前标签页，并在之后一键恢复，恢复时会尽量保留标签组信息。
- 自动会话快照：后台监听标签页变化，保存“上次浏览”快照。
- 个性化设置：支持页面标题、顶部高度、简洁模式、栏目显示、卡片/图标视图、URL 显示、壁纸亮度和模糊等配置。
- 本地持久化：工作区数据存储在 `browser.storage.local`，新标签页设置存储在 `localStorage`。

## 技术栈

- [WXT](https://wxt.dev/)：浏览器扩展开发框架
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI / shadcn 风格组件
- lucide-react 图标
- @dnd-kit 拖拽排序
- Vitest 单元测试

## 环境要求

- Node.js 20 或更高版本
- npm
- Chromium 系浏览器或 Firefox

## 快速开始

安装依赖：

```bash
npm install
```

启动 Chromium 开发模式：

```bash
npm run dev
```

启动 Firefox 开发模式：

```bash
npm run dev:firefox
```

WXT 会生成 `.output/` 开发产物，并自动打开或提示加载扩展。也可以在浏览器扩展管理页手动加载 `.output/chrome-mv3`。

## 常用脚本

```bash
npm run dev            # 启动 Chromium 开发模式
npm run dev:firefox    # 启动 Firefox 开发模式
npm run build          # 构建 Chromium 扩展
npm run build:firefox  # 构建 Firefox 扩展
npm run zip            # 打包 Chromium 扩展 zip
npm run zip:firefox    # 打包 Firefox 扩展 zip
npm run compile        # TypeScript 类型检查
npm run test           # 运行 Vitest 测试
```

## 浏览器安装

### Chromium / Chrome / Edge

1. 执行 `npm run build`。
2. 打开 `chrome://extensions/` 或 `edge://extensions/`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择 `.output/chrome-mv3` 目录。

### Firefox

1. 执行 `npm run build:firefox`。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击“临时载入附加组件”。
4. 选择 `.output/firefox-mv2/manifest.json`。

## 项目结构

```text
.
├── entrypoints/
│   ├── background.ts        # 后台脚本，监听标签页变化并生成自动快照
│   ├── content.ts           # 内容脚本入口
│   ├── newtab/              # 新标签页主界面
│   └── popup/               # 扩展弹窗入口
├── public/
│   └── logo/                # 搜索引擎图标等静态资源
├── src/
│   ├── components/ui/       # 通用 UI 组件
│   └── lib/                 # 浏览器 API、存储、搜索、URL、建议逻辑
├── openspec/                # 需求和变更说明
├── wxt.config.ts            # WXT 和扩展 manifest 配置
└── package.json
```

## 权限说明

扩展在 `wxt.config.ts` 中声明了以下权限：

- `tabs`：读取、切换、关闭和打开标签页。
- `storage`：保存工作区、快照和用户偏好。
- `bookmarks`：读取、创建、更新、删除和移动书签。
- `favicon`：获取页面图标。
- `tabGroups`：读取和恢复浏览器标签组信息。

## 数据说明

- 工作区状态 key：`linka.workspaceState`
- 新标签页设置 key：`linka:newtab-settings`
- 自动快照 id：`auto-session-latest`

目前项目主要围绕浏览器本地数据工作，不依赖后端服务。

## 开发建议

- 修改浏览器 API 相关逻辑后，优先运行 `npm run compile` 和 `npm run test`。
- 修改新标签页 UI 后，建议在 1920x1080 和较窄窗口下检查布局。
- `.output/`、`.wxt/`、`node_modules/` 是生成目录，不应提交。
- 精确设计还原记录可参考 `design-qa.md`。
