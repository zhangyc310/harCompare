# HAR Compare - WebVPN 分析工具

一个用于对比 WebVPN 和源站 HAR 文件的 Web 应用，帮助分析 WebVPN 代理过程中引入的差异。

## 功能特点

### 核心功能

- **HAR 文件对比**：左侧上传 WebVPN HAR，右侧上传源站 HAR，自动匹配并对比请求
- **灵活的映射配置**：
  - **Hostname 映射**：将 WebVPN hostname 映射到源站（如 `www--cnki--net.lo.elib.pro` → `www.cnki.net`）
  - **URL 路径映射**：支持完整 URL 前缀映射，处理路径变化的情况
- **Cookie 智能处理**：自动识别并规范化 `_-_` 格式的 cookie 名称（如 `session_-_cnki.net` → `session`）

### 对比内容

| 对比项 | 说明 |
|--------|------|
| Request Headers | 对比请求头，URL 类型的 header（如 Referer）会自动规范化 |
| Request Cookies | 对比请求 cookie，支持名称规范化 |
| Request Body | 对比请求体内容 |
| Response Status | 对比响应状态码 |
| Response Headers | 对比响应头 |
| Response Cookies | 对比 Set-Cookie |
| Response Body | 对比响应体，支持 JSON 格式化和 diff 视图 |

### 可视化展示

- **统计摘要**：显示匹配率、一致率、差异数量
- **请求列表**：支持按状态、方法、URL 筛选
- **详细差异视图**：分栏对比，高亮显示差异
- **规范化对比**：显示原始值和规范化后的对比结果

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

### 预览生产版本

```bash
npm run preview
```

## 使用说明

### 1. 配置映射规则

在页面顶部的「映射配置」区域添加映射规则：

**Hostname 映射示例：**
```
www--cnki--net.lo.elib.pro  →  www.cnki.net
kns--cnki--net.lo.elib.pro  →  kns.cnki.net
```

**URL 路径映射示例：**
```
https://www--cnki--net.lo.elib.pro/kns8/  →  https://kns.cnki.net/kns8/
```

### 2. 上传 HAR 文件

- 左侧：上传通过 WebVPN 访问时录制的 HAR 文件
- 右侧：上传直接访问源站时录制的 HAR 文件

> 提示：在 Chrome DevTools 的 Network 面板中，右键点击请求列表，选择「Save all as HAR with content」导出 HAR 文件

### 3. 开始对比

点击「开始对比」按钮，查看对比结果：

- **绿色（一致）**：请求完全一致
- **橙色（有差异）**：请求存在差异，点击查看详情
- **蓝色（仅 WebVPN）**：仅在 WebVPN HAR 中存在
- **红色（仅源站）**：仅在源站 HAR 中存在

### 4. 查看差异详情

点击请求列表中的条目，右侧会显示详细的差异信息：

- **规范化后一致**：WebVPN 的值经过映射转换后与源站一致（正常）
- **规范化后仍有差异**：存在真实差异，需要关注

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design 5
- Tailwind CSS
- react-diff-viewer-continued

## 项目结构

```
src/
├── types/              # 类型定义
│   ├── har.ts          # HAR 格式类型
│   ├── mapping.ts      # 映射配置类型
│   └── diff.ts         # 差异结果类型
├── core/               # 核心逻辑
│   ├── Normalizer.ts   # URL/Cookie 规范化
│   ├── EntryMatcher.ts # 请求匹配
│   └── Comparator.ts   # 对比器
├── components/         # UI 组件
│   ├── Upload/         # 文件上传
│   ├── Mapping/        # 映射配置
│   ├── Result/         # 结果展示
│   └── Diff/           # 差异视图
└── App.tsx             # 主应用
```

## License

MIT
