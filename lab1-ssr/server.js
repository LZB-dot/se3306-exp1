// lab1-ssr/server.js —— SSR（服务端渲染）：正文在服务器端就拼进 HTML，随响应一起返回
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `文章标题 ${i + 1}`,
  body: `这是第 ${i + 1} 篇文章的正文内容……`
}));

/** 统一转义：服务端拼接 HTML 时必须转义，否则存在 XSS（AI 代码审查 ⑤ 安全） */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

app.get('/', (req, res) => {
  // 每次进来都会重新拼接一次 —— 时间戳即为证据：连续刷新，时间必然变化
  const renderedAt = new Date();
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SSR 文章列表</title>
  <style>
    body { max-width: 720px; margin: 0 auto; padding: 32px 16px; color: #1f2328;
           font-family: -apple-system, 'Microsoft YaHei', sans-serif; line-height: 1.6; }
    article { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
    article h2 { font-size: 17px; margin: 0 0 6px; }
    article p { margin: 0; color: #6b7280; font-size: 14px; }
    .meta { color: #6b7280; font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>文章列表</h1>
  ${posts
    .map(
      (p) =>
        `<article data-id="${escapeHtml(p.id)}"><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.body)}</p></article>`
    )
    .join('')}
  <p class="meta">渲染模式：SSR ｜ 本次渲染时间：${escapeHtml(renderedAt.toLocaleString('zh-CN'))}（刷新会变化，证明每次请求都在服务器端重新生成）</p>
</body>
</html>`;
  res.send(html); // 服务端拼接完整 HTML
});

app.listen(PORT, () => console.log(`SSR on http://localhost:${PORT}`));
