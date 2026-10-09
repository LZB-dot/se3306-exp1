# 实验一：CSR / SSR / SSG 渲染对比 —— 实验报告

| 项目 | 内容 |
| --- | --- |
| 课程 | 《现代 Web 前端框架与工程化》SE3306 |
| 实验 | 实验一 · CSR / SSR / SSG 渲染对比 |
| 姓名 | 李泽滨 |
| 学号 | 2024034743037 |
| 完成日期 | 2026-12-12 |
| 代码仓库 | <https://github.com/LZB-dot/se3306-exp1>（公开仓库） |
| CSR 部署地址 | 主：<https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/csr/>（CloudBase 静态托管，国内节点）　备：`https://LZB-dot.github.io/se3306-exp1/csr/` |
| SSG 部署地址 | 主：<https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/ssg/>（CloudBase 静态托管，国内节点）　备：`https://LZB-dot.github.io/se3306-exp1/ssg/` |
| SSR 部署地址 | `（CloudBase 云托管，待部署后填写）`；本地 `node server.js` → `http://localhost:3000` |

---

## 一、实验目的

1. 直观理解三种渲染模式（CSR / SSR / SSG）的执行流程与本质区别，并延伸认识 ISR 与混合渲染；
2. 用客观指标（首屏 HTML 大小、FCP 白屏时间、LCP、SEO 可见性）量化三种模式的差异，使课堂结论有数据支撑；
3. 建立渲染模式选型的工程判断力，用「选型三问」做决策：内容变不变？要不要个性化？首屏多敏感？
4. 通过一手实证理解课上「五个时代」的演进逻辑：为什么 SPA 之后 SSR 会回来、SSG 为什么最稳。

## 二、实验环境与工具

| 类别 | 内容 |
| --- | --- |
| 硬件 | 个人计算机一台，可联网 |
| 软件 | Node.js 20+（本机 v22.22.2）、pnpm、Chrome（含 DevTools）、VS Code |
| 技术栈 | Vite 6（CSR 脚手架与构建）、Express 4（SSR）、Node 构建脚本（SSG） |
| 版本管理 | Git + GitHub（仓库 `LZB-dot/se3306-exp1`） |
| 部署 | GitHub Actions + GitHub Pages（CSR / SSG）；SSR 需常驻 Node 服务 |
| AI 辅助 | WorkBuddy Agent（详见根目录 `AI使用声明.md`） |

本地复现命令：

```bash
# 任务一 CSR
cd lab1-csr && pnpm install && pnpm run dev        # http://localhost:5173
# 任务二 SSR
cd lab1-ssr && pnpm install && node server.js      # http://localhost:3000
# 任务三 SSG
cd lab1-ssg && node build-ssg.js                   # 产物 dist/index.html
```

## 三、实验原理简述

**CSR（客户端渲染）**：服务器只返回空 HTML 骨架 + JS 引用，浏览器下载并执行 JS 后才渲染出内容。首屏慢、SEO 差，但交互体验好。

**SSR（服务端渲染）**：服务器当场把数据拼进完整 HTML 再返回，首屏快、SEO 好；浏览器拿到 HTML 后需经「水合 Hydration」把静态页面重新激活才能获得交互能力。

**SSG（静态站点生成）**：在**构建期**就生成静态 HTML，部署后每次访问只做静态文件响应，零计算。最快最稳，但内容更新必须重新构建。

**ISR（增量静态再生成）**：SSG 的补丁，给页面设置 revalidate 时间，过期后访问触发后台重新生成，兼顾静态速度与内容新鲜度。

关键测量指标（Web Vitals）：LCP ≤ 2.5s（加载速度）、INP ≤ 200ms（交互响应）、CLS ≤ 0.1（视觉稳定性）。渲染策略直接影响这些指标：SSG / SSR 利于降低 LCP；CSR 的大 JS 包容易拉高 INP。

## 四、实验内容与步骤

仓库目录结构：

```
se3306-exp1/
├── lab1-csr/        # Vite CSR 版（index.html + src/main.js）
├── lab1-ssr/        # Express SSR 版（server.js）
├── lab1-ssg/        # SSG 版（build-ssg.js、dist/）
├── AI使用声明.md     # AI 使用与审查记录
└── README.md        # 本实验报告
```

### 任务一：Vite 纯 CSR 应用

```bash
pnpm create vite lab1-csr -- --template vanilla --no-interactive
cd lab1-csr && pnpm install && pnpm run dev   # http://localhost:5173
```

核心代码（`src/main.js`）：构造 10 篇文章数据 → `getElementById` 找到 `<div id="app">` → `innerHTML` 拼接并插入 DOM。`index.html` 中只保留一个空容器。

自检记录（文字 + 截图）：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）5173 端口能看到 10 篇文章 | ✅ / ❌ | `docs/screenshots/task1-01.png` |
| （2）网页源代码里看不到文章正文 | ✅ / ❌ | `docs/screenshots/task1-02.png` |
| （3）DevTools Network 能看到 main.js 请求 | ✅ / ❌ | `docs/screenshots/task1-03.png` |

> 截图请放入 `docs/screenshots/` 并在上方表格中填写实际文件名。

选做体会（手写版 index.html + main.js 双击即开，与 Vite 版对比）：
> 【此处填写：Vite 版多了什么？空壳 + JS 的 CSR 本质是否相同？】

### 任务二：Express 实现 SSR

```bash
cd lab1-ssr && pnpm init && pnpm add express
node server.js    # http://localhost:3000
```

`server.js` 注册首页路由，请求到来时把 10 篇文章拼进完整 HTML 再 `res.send()`，因此正文中出现在响应源码里。

自检记录：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）页面能看到 10 篇文章 | ✅ / ❌ | `docs/screenshots/task2-01.png` |
| （2）源代码里含文章正文（SEO 友好） | ✅ / ❌ | `docs/screenshots/task2-02.png` |
| （3）证明「每次请求都现拼一遍 HTML」 | ✅ / ❌ | `docs/screenshots/task2-03.png` |

第（3）项的实证方式：页面底部输出了**本次渲染时间**。连续刷新，时间戳每次都变 → 说明 HTML 是在请求时在服务器端生成的；若改到构建期生成（对比任务三），刷新则不再变化。

### 任务三：SSG 静态生成

```bash
cd lab1-ssg && node build-ssg.js
npx serve dist                      # 方式一，需联网
python -m http.server 8080 -d dist  # 方式二，无需联网
```

`build-ssg.js` 用同一份数据在**构建期**拼 HTML，`fs.writeFileSync` 写入 `dist/index.html`。Jekyll / Hugo / Next.js SSG 的本质就是这件事。

自检记录：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）`dist/index.html` 生成成功 | ✅ / ❌ | `docs/screenshots/task3-01.png` |
| （2）本地预览能访问 | ✅ / ❌ | `docs/screenshots/task3-02.png` |
| （3）证明内容在构建时已写死 | ✅ / ❌ | `docs/screenshots/task3-03.png` |

第（3）项实证：页面底部是**构建时间**，反复刷新不会变化 → 说明内容在构建期就已写死，运行时零计算。

### 任务四：指标测量与对比

测量方式 A（DevTools Performance）：F12 → Performance → 录制 → Ctrl+R 刷新 → 停止 → 在 Timings 轨道读 FCP、LCP。
测量方式 B（Lighthouse）：F12 → Lighthouse → Analyze page load → 读 Performance 分数与 LCP、CLS、TBT。
首屏 HTML 大小：右键「查看网页源代码」→ 全选复制 → 看字节数。SEO 可见性：源码里有没有正文。

**同一环境下逐项实测，填写下表：**

| 模式 | 首屏 HTML 大小 | 白屏时间 FCP | LCP | SEO（源码含正文？） | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| CSR | （实测：___ bytes） | （实测：___ ms） | （实测：___ ms） | （实测：___） | （填写） |
| SSR | （实测：___ bytes） | （实测：___ ms） | （实测：___ ms） | （实测：___） | （填写） |
| SSG | （实测：___ bytes） | （实测：___ ms） | （实测：___ ms） | （实测：___） | （填写） |

> 测量环境说明（务必注明）：Chrome 版本 ___ 、是否禁用缓存 ___ 、是否勾选 Throttling（Slow 4G / No throttling）___ 、是否本地 localhost ___ 。

Lighthouse / PageSpeed Insights 记录：

| 模式 | Performance 分数 | LCP | CLS | TBT | 报告截图 |
| --- | --- | --- | --- | --- | --- |
| CSR | | | | | `docs/screenshots/task4-csr.png` |
| SSR | | | | | `docs/screenshots/task4-ssr.png` |
| SSG | | | | | `docs/screenshots/task4-ssg.png` |

### 五、项目提交与部署

- CSR 与 SSG 均可产出静态文件，构建后不再需要 Node 服务，用 CloudBase 静态网站托管（`tcb hosting deploy`）部署到国内节点；同时在 `.github/workflows/deploy.yml` 中自动构建并发布到 GitHub Pages 作为备用。三个任务分开部署、各测各的，互不干扰。
- SSR 没有静态产物，依赖常驻 Node 进程实时生成 HTML，静态托管无法部署，走 CloudBase 云托管：上传 `lab1-ssr/` 源码或代码包，启动命令 `node server.js`，容器端口 3000。

| 产物 | 部署方式 | 访问地址 | 实测 |
| --- | --- | --- | --- |
| `lab1-csr/dist` | CloudBase 静态托管 `/csr/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/csr/> | 200；源码无正文、仅空 `div#app` |
| `lab1-csr/dist` | GitHub Actions → Pages `/csr/`（备） | <https://LZB-dot.github.io/se3306-exp1/csr/> | 200；国内直连约半数请求超时 |
| `lab1-ssg/dist` | CloudBase 静态托管 `/ssg/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/ssg/> | 200；源码含正文 |
| `lab1-ssg/dist` | GitHub Actions → Pages `/ssg/`（备） | <https://LZB-dot.github.io/se3306-exp1/ssg/> | 200；同上 |
| `lab1-ssr` | CloudBase 云托管（Dockerfile 构建，端口 3000） | `（待部署后填写）` | 本地已验证：每次请求返回完整 HTML，响应约 1903 B |

> 部署走的是腾讯云 CloudBase：静态托管用 CLI 上传产物：`tcb hosting deploy ./csr csr -e <环境ID>`（SSG 同理）；SSR 用云托管服务运行容器。本地构建产物与代码包保存在 `deploy/` 目录（`se3306-exp1-csr.zip`、`se3306-exp1-ssg.zip`、`se3306-exp1-ssr.zip`、`上传用-CloudBase/`），这些是构建产物，按 `.gitignore` 不入库。

## 六、必答题

> 下方给出的是**作答要点框架与证据索引**，结论部分请自己在「你的作答」处补写。

**（1）为什么 SPA 时代 SEO 差？**
要点：① 爬虫抓的是首屏 HTTP 响应体，不是 JS 执行后的 DOM；② CSR 返回的 `<div id="app">` 是空的，正文要靠 JS 生成；③ 早期搜索引擎基本不执行 JS，即使后来支持渲染队列，也存在延迟与预算限制；④ 佐证：本实验任务一「源代码里看不到文章正文」截图。
你的作答：___

**（2）SSG 与 SSR 的本质区别是什么？**
要点：对比维度放在**「拼 HTML 的时机」**——构建期 vs 请求时；由此推导运行状态（是否有运行时计算）、一致性（每次请求是否可能不同）、缓存/CDN 友好程度、更新成本。
你的作答：___

**（3）结合讲次 02 渲染模式演进，写一段 200 字左右的总结。**
要点线索：静态文档时代 → jQuery/整页刷新 → SPA/CSR → SSR 回归 → SSG/ISR → 混合渲染（RSC、PPR）。
你的作答：___

**（4）前三个任务分别启用了什么服务器？三种方式运行机制是怎样的？**
要点：① CSR 是 **Vite 开发服务器**（dev 态，按需编译 + 模块热更新；`vite build` 后是**静态托管**，已无 Node 参与）；② SSR 是 **Express**（Node 的 HTTP 服务，常驻进程，每请求执行业务代码）；③ SSG 预览用的是 **静态文件服务器**（`npx serve` / `python -m http.server`），只做文件读取与 MIME 判断，零业务逻辑。
你的作答：___

**（5）实时更新的股票行情页，CSR / SSR / SSG / ISR 哪个最合适？为什么？**
要点线索：内容高频变化 + 可能个性化 + 首屏敏感 → 逐条对着「选型三问」筛；注意 ISR 到期触发再生成，秒级行情仍可能过期；讨论是否需要 WebSocket / 客户端轮询。
你的作答：___

**（6）为什么 SSR 需要水合 Hydration？没有水合会怎样？**
要点：① 服务端只返回 HTML 文本，DOM 上没有事件监听、没有组件状态；② 水合是在浏览器端重新执行 JS，把事件与状态「接」到已有 DOM 上（复用而非重建）；③ 没有水合：页面看得见但点不动；④ 延伸思考：水合的成本（JS 体积、TTI、注水前的不可交互空窗），这正是 React Server Components 与部分水合要解决的问题。
你的作答：___

## 七、选答题（任选一）

**（7）什么条件下 SSG 是最优解？内容更新频繁时如何补救（提示：ISR）？**
要点：内容相对稳定、可读性远大于写、对首屏极度敏感、流量可 CDN 全托管；频繁更新时可用 ISR 的 revalidate、按路径增量再生成、Webhook 触发重建（而不是全站重建）。
你的作答：___

**（8）为什么虚拟 DOM 在 2015 年是革命性创新，2026 年 Svelte / Solid 却抛弃它？**
要点线索：当年痛点（命令式 jQuery 手写 DOM、状态与视图同步难）→ vDOM 的价值（声明式 + diff 批处理）→ 如今瓶颈（diff 本身的开销、运行时体积）→ 新路线（编译期分析依赖、细粒度响应式）。
你的作答：___

**（9）若一个营销页由 AI 生成工具（如 v0）默认输出为 Next.js SSR 应用，结合本实验测量数据分析该默认选择的合理性与代价。**
要点线索：合理性（首屏 HTML 完整、SEO、等待 LLM 友好）→ 代价（需要常驻服务、无法纯 CDN 托管、TTFB 受后端影响、运维成本）→ 对照本实验实测的 CSR/SSG 数据给出判断。
你的作答：___

## 八、Debug FAQ

实验过程中遇到的典型问题与解决方式：

| # | 现象 | 原因 | 解决方式 |
| --- | --- | --- | --- |
| 1 | 端口被占用 `EADDRINUSE` | 其他服务占用了 5173 / 3000 | 换端口或结束占用进程：`netstat -ano \| findstr :3000` 后 `taskkill` |
| 2 | `Cannot find module 'vite'` | 依赖未安装或装在了别的目录 | 确认执行目录正确后重新 `pnpm install` |
| 3 | Pages 部署后页面白屏 | 静态资源用了绝对路径 `/assets/...`，子路径部署 404 | 在 CI 中注入 `GH_PAGES_BASE=/仓库名/CSR子路径/`，`vite.config.js` 读入该值作为 `base` |
| 4 | | | |

## 九、实验体会

> 【此处由本人撰写：对三种渲染模式的直观感受、测量数据与课堂理论是否吻合、选型判断的变化等。】

---

附：本报告的 AI 使用情况、原始输出与审核记录见根目录 [`AI使用声明.md`](./AI使用声明.md)。
