# rspress-plugin-ai-summary

Rspress v2 插件，用于在 MDX 页面中展示 AI 生成的文章总结。插件提供双语文案、逐字展示、长内容折叠和主题自适应样式；它只负责展示已经写入文档的总结，不会请求任何 AI 服务。

## 安装

```bash
pnpm add rspress-plugin-ai-summary
```

## 配置

在 `rspress.config.ts` 中注册插件：

```typescript
import { defineConfig } from '@rspress/core';
import { pluginAISummary } from 'rspress-plugin-ai-summary';

export default defineConfig({
    plugins: [
        pluginAISummary(),
    ],
});
```

## 使用

注册插件后，可以在任意 `.mdx` 页面中直接使用全局组件，无需单独导入：

```mdx
<AISummary>
    **核心内容**：这是一段由 AI 生成的文章总结。

    **内容要点**：
    - 支持 Markdown 和 MDX 内容
    - 自动适配 Rspress 明暗主题
    - 较长内容可以展开或收起
</AISummary>
```

可以通过 `title` 属性覆盖默认标题：

```mdx
<AISummary title="本页摘要">
    摘要内容。
</AISummary>
```

组件会根据 Rspress 当前语言显示中文或英文界面文案。以 `en` 开头的语言代码使用英文，其他语言默认使用中文。

## 本地开发

```bash
pnpm install
pnpm build
```

构建产物位于 `dist/`。
