// src/main.js —— CSR（客户端渲染）：页面 content 全部由浏览器执行 JS 后生成

const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `文章标题 ${i + 1}`,
  body: `这是第 ${i + 1} 篇文章的正文内容……`
}));

/** 统一转义：避免用 innerHTML 拼接时被注入 HTML/脚本 */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

const app = document.getElementById('app');

// 渲染耗时：可用来自查「CSR 的内容是在浏览器端渲染的」
const renderStart = performance.now();
app.innerHTML =
  '<h1>文章列表</h1>' +
  posts
    .map(
      (p) =>
        `<article data-id="${escapeHtml(p.id)}">
           <h2>${escapeHtml(p.title)}</h2>
           <p>${escapeHtml(p.body)}</p>
         </article>`
    )
    .join('');
const renderCost = (performance.now() - renderStart).toFixed(2);

app.insertAdjacentHTML(
  'beforeend',
  `<footer class="meta">渲染模式：CSR ｜ 本机渲染耗时 ${escapeHtml(renderCost)} ms ｜ 共 ${posts.length} 篇</footer>`
);

// 注意：右键「查看网页源代码」时 <div id="app"> 内是空的 —— 这就是 CSR
console.log('[CSR] DOM 渲染完成，耗时', renderCost, 'ms');
