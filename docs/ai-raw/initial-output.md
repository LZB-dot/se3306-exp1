# AI 原始输出留存

> 用途：《SE3306 AI 使用规范》第三节要求「原始输出 + 审核记录 + 最终版本」三件套留痕。
> 本文件保存 WorkBuddy Agent 生成的**关键初版片段**，供与仓库中的最终版本对照，证明「AI 初稿 → 本人修改」的真实轨迹。
> 生成环境：WorkBuddy 桌面端 Agent（会话内大模型）。审核人：李泽滨（2024034743037）。

---

## 一、AI 初版：CSR 渲染核心（未转义）

```js
const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, title: `文章标题 ${i + 1}`, body: `这是第 ${i + 1} 篇文章的正文内容……`
}));
const app = document.getElementById("app");
app.innerHTML = "<h1>文章列表</h1>" + posts.map(p =>
  `<article><h2>${p.title}</h2><p>${p.body}</p></article>`).join("");
```

**最终版本的差异**：新增 `escapeHtml()` 并在每一处插值调用；补充渲染耗时统计与页脚元信息。

---

## 二、AI 初版：SSR 服务端渲染（未转义）

```js
app.get("/", (req, res) => {
  const html = `<!DOCTYPE html><html><head><title>SSR 文章列表</title></head><body>
  <h1>文章列表</h1>
  ${posts.map(p => `<article><h2>${p.title}</h2><p>${p.body}</p></article>`).join("")}
  </body></html>`;
  res.send(html);
});
app.listen(3000, () => console.log("SSR on http://localhost:3000"));
```

**最终版本的差异**：
1. 新增 `escapeHtml()` 转义；
2. 页面底部增加本次渲染时间戳 —— 用于自检第 3 点「证明每次请求都重新生成 HTML」；
3. 端口改为 `process.env.PORT || 3000`，便于云托管注入端口。

---

## 三、AI 初版：SSG 构建脚本（未转义、相对路径）

```js
const fs = require("fs");
const html = `...同样的 10 篇文章...`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.html", html);
console.log("静态页面已生成到 dist/");
```

**最终版本的差异**：
1. 输出路径改为 `path.join(__dirname, 'dist')`，避免在其他目录下执行脚本时落到错误位置；
2. 页面底部增加构建时间戳（与 SSR 形成对照：刷新不变化 = 内容已写死）；
3. 构建日志打印 HTML 字节数，直接可用于 README 的「首屏 HTML 大小」一栏。

---

## 四、AI 初版中被删除的内容（记录错误，不留空白）

1. `lab1-csr/public/behavior-note.md`：生成过程中误将导航页内容写入该路径，已删除，导航页最终落在 `pages/index.html`；
2. `lab1-ssg/package.json` 中的 `"preview": "node preview.js"`：任务书未要求自定义预览脚本，已移除，预览按任务书用 `npx serve dist` 或 `python -m http.server`。

---

## 五、修改前后对照总结

| 维度 | AI 初版 | 最终版本 |
| --- | --- | --- |
| XSS 安全 | 模板字符串直接插值 | 三个 lab 统一 `escapeHtml()` 转义 |
| SSR 可证性 | 无证据手段 | 每次请求渲染时间戳 |
| SSG 可证性 | 无证据手段 | 构建时间戳 + 字节数日志 |
| 部署适配 | 默认根路径 | Vite `base` 读取 `GH_PAGES_BASE`，适配 Pages 子路径 |
| 冗余物 | 存在 2 处非任务产物 | 已删除 |
