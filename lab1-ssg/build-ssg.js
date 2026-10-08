// lab1-ssg/build-ssg.js —— SSG：构建期就把文章列表写死成静态 HTML
// Jekyll / Hugo / Next.js SSG 的本质就是这件事，手写一遍就能看穿它们的工作原理
const fs = require('fs');
const path = require('path');

const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `文章标题 ${i + 1}`,
  body: `这是第 ${i + 1} 篇文章的正文内容……`
}));

/** 统一转义：输出静态 HTML 同样要转义，避免内容含尖括号时破坏页面结构 */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

// 构建时刻：一旦写入文件，之后再怎么访问都不会变 —— 这就是 SSG
const builtAt = new Date();
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SSG 文章列表</title>
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
  <p class="meta">渲染模式：SSG ｜ 构建时间：${escapeHtml(builtAt.toLocaleString('zh-CN'))}（反复刷新不会变化，证明内容在构建期已写死）</p>
</body>
</html>`;

const outDir = path.join(__dirname, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

console.log('静态页面已生成到 dist/index.html');
console.log('构建时间：', builtAt.toLocaleString('zh-CN'));
console.log('HTML 字节数：', Buffer.byteLength(html, 'utf8'), 'bytes');
