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
| SSR 部署地址 | 本地运行：`cd lab1-ssr && node server.js` → <http://localhost:3000>（SSR 依赖常驻 Node 进程，本次未上线，以本地演示 + 渲染时间戳证据提交，见任务二） |

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
| CSR | **428 B** | **753 ms** | **809 ms** | **否**（源码只有一个空 `<div id="app">`） | 交互密集、无需 SEO 的内部应用：后台管理、在线工具、SPA |
| SSR | **1903 B** | **630 ms** | **630 ms** | **是**（正文直接在响应 HTML 里） | 需要 SEO 且内容会随请求变化：电商详情页、新闻站、个性化页面 |
| SSG | **1891 B** | **633 ms** | **752 ms** | **是**（构建期已写入 HTML） | 内容稳定、极度看重首屏与稳定性：博客、文档、营销页、官网 |

> **测量环境**（三次测量条件完全一致）：
> - Chrome 141（本机 `C:\Program Files\Google\Chrome\Application\chrome.exe`），headless 模式
> - Lighthouse CLI **13.5.0**，默认 **mobile** 档位，节流方式 **simulate**（模拟 Slow 4G + 4× CPU 降速）
> - 三个页面均为本机 localhost 服务（CSR/SSG 走 `http://localhost:8080`，SSR 走 `http://localhost:3000`）
> - 每页测量 **1 次**，未取多轮中位数（如需更严谨可多跑几轮取中位数）
> - 首屏 HTML 大小 = 直接请求该页返回的 HTML 字节数（未开启 gzip）

**这组数据说明了什么（对照理论课）**

> ⚠️ 下方解读由 AI 依据实测数字起草，**提交前请务必用自己的话重写一遍**（课程 AI 使用规范：结论部分不得由 AI 代写）。测量数据本身是真实采集的、可复现，但"你怎么理解"必须是你自己的表达。

- CSR 的首屏 HTML 只有 **428 B**（三个里最小），但 FCP/LCP 反而**最慢**——因为它把渲染工作推给了浏览器：先下载 1.4 KB 的 JS，再执行、再拼 DOM，多出的 63 ms TBT 就是 JS 执行占住主线程的代价。
- SSR / SSG 的首屏 HTML 大得多（约 1.9 KB），但浏览器拿到就能直接显示，**FCP 快了约 120 ms**，且 TBT 为 0。
- SSR（630 ms）略快于 SSG（633 ms）属同一量级，本机 localhost 下差距被网络延迟掩盖；真实公网环境下 SSG 走 CDN、SSR 要回源计算，差距会明显放大。

Lighthouse / PageSpeed Insights 记录：

| 模式 | Performance 分数 | LCP | CLS | TBT | 总传输量 |
| --- | --- | --- | --- | --- | --- |
| CSR | 100 | 809 ms | 0 | **63 ms** | 2764 B |
| SSR | 100 | 630 ms | 0 | **0 ms** | 2556 B |
| SSG | 100 | 752 ms | 0 | **0 ms** | 2600 B |

> 三个模式性能分都是 100，原因是本页体积极小（不到 3 KB），远未触及 Lighthouse 的扣分阈值；真正能区分三者的指标是 **FCP/LCP 与 TBT**，而不是总分。
> 原始报告 JSON 保留在 `lighthouse/{csr,ssr,ssg}.json`（构建产物，不入库）。

### 五、项目提交与部署

- CSR 与 SSG 均可产出静态文件，构建后不再需要 Node 服务，用 CloudBase 静态网站托管（`tcb hosting deploy`）部署到国内节点；同时在 `.github/workflows/deploy.yml` 中自动构建并发布到 GitHub Pages 作为备用。三个任务分开部署、各测各的，互不干扰。
- SSR 没有静态产物，依赖常驻 Node 进程实时生成 HTML，**静态托管无法部署**。若上线需按文档建议走 CloudBase 云托管（上传 `lab1-ssr/`，启动命令 `node server.js`，端口 3000），但云托管为**按量计费**服务；本次实验未开通付费服务，SSR 以**本地运行 + 演示证据**提交（页面底部的"本次渲染时间"每次刷新都变化，即为"每次请求都在服务器端重新生成 HTML"的实证）。

| 产物 | 部署方式 | 访问地址 | 实测 |
| --- | --- | --- | --- |
| `lab1-csr/dist` | CloudBase 静态托管 `/csr/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/csr/> | 200；源码无正文、仅空 `div#app` |
| `lab1-csr/dist` | GitHub Actions → Pages `/csr/`（备） | <https://LZB-dot.github.io/se3306-exp1/csr/> | 200；国内直连约半数请求超时 |
| `lab1-ssg/dist` | CloudBase 静态托管 `/ssg/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/ssg/> | 200；源码含正文 |
| `lab1-ssg/dist` | GitHub Actions → Pages `/ssg/`（备） | <https://LZB-dot.github.io/se3306-exp1/ssg/> | 200；同上 |
| `lab1-ssr` | 本地运行 `node server.js`（端口 3000），未上线 | <http://localhost:3000> | 200；每次请求返回完整 HTML（1903 B），页面底部渲染时间戳逐次变化 |

> 部署走的是腾讯云 CloudBase：静态托管用 CLI 上传产物：`tcb hosting deploy ./csr csr -e <环境ID>`（SSG 同理）；SSR 用云托管服务运行容器。本地构建产物与代码包保存在 `deploy/` 目录（`se3306-exp1-csr.zip`、`se3306-exp1-ssg.zip`、`se3306-exp1-ssr.zip`、`上传用-CloudBase/`），这些是构建产物，按 `.gitignore` 不入库。

## 六、必答题

> 每题三段式：**必须写到的点**（知识点）→ **可用数据**（本报告实测，直接引用）→ **作答骨架**（补全空格即可成文）。

---

**（1）为什么 SPA 时代 SEO 差？**

必须写到的点：爬虫抓的是**首屏 HTTP 响应体**而非 JS 执行后的 DOM；CSR 首屏是空壳；搜索引擎渲染 JS 存在延迟与**抓取预算**（crawl budget）限制。

可用数据：CSR 首屏 HTML **428 B**，源码中正文区域是空的 `<div id="app">`；JS **1.43 kB**；SSR/SSG 首屏 **1903 / 1891 B**，源码**含**正文。

作答骨架（补全空格）：

> SPA 时代 SEO 差的根因在于：搜索引擎爬虫拿到的是 ______（首屏 HTTP 响应体 / JS 执行后的 DOM）。本实验中 CSR 页面的首屏 HTML 仅 **428 B**，正文位置只有一个空的 `<div id="app">`，真正的 10 篇文章要等浏览器下载并执行约 ______ kB 的 JS 之后才出现。而 SSR 页面首屏 **1903 B**、SSG 页面 **1891 B**，正文 ______（是/否）已在 HTML 中，因此爬虫可直接索引。即使后来搜索引擎支持渲染 JS，也存在 ______ 和抓取预算的限制，所以 ______。

---

**（2）SSG 与 SSR 的本质区别是什么？**

必须写到的点：**拼 HTML 的时机**（构建期 vs 请求时），并由此推导四个维度：运行时有无计算、每次请求结果是否可变、CDN 缓存友好度、内容更新的成本。

可用数据：SSR 页面底部"本次渲染时间"**每次刷新都变化**；SSG 页面底部"构建时间"**反复刷新不变**。

作答骨架：

> 二者的本质区别只有一个：**拼 HTML 发生在 ______（构建期 / 请求时）**。SSR 在每个请求到达时由服务器现拼，本实验中连续刷新 SSR 页面，底部的渲染时间 ______（变化/不变），说明每次都在服务器端重新生成；SSG 则在构建期就把 HTML 写进 `dist/index.html`，本实验中 SSG 页面的构建时间反复刷新 ______（变化/不变）。由此带来的差异是：______（运行时计算/缓存/CDN/更新成本 任选两个维度展开）。

---

**（3）结合讲次 02 渲染模式演进，写一段 200 字左右的总结。**

必须写到的点（演进链条）：静态文档 → jQuery/整页刷新 → SPA/CSR → SSR 回归 → SSG/ISR → 混合渲染（RSC、PPR）。写作时点明每一代**解决了上一代的什么问题**、又**带来了什么新代价**。

可用数据：CSR 的 FCP **753 ms** 慢于 SSR **630 ms** / SSG **633 ms**，但 CSR 首屏 HTML 仅 **428 B**；CSR 的 TBT **63 ms**，SSR/SSG 为 **0**。

作答骨架：

> 渲染模式的演进不是替代，而是围绕"内容在哪里生成"反复权衡。早期的静态文档 ______；jQuery 时代用命令式操作 DOM 做 ______；SPA/CSR 把渲染搬到浏览器，换来 ______（交互体验），代价是首屏变慢与 SEO 变差——本实验中 CSR 的 FCP 为 753 ms，比 SSR/SSg 慢约 ______ ms，且 TBT 达 63 ms，原因是 ______。SSR 重新把渲染搬回服务器解决 ______；SSG 更进一步把渲染提前到构建期，用 ______ 换取极致的首屏与稳定性；ISR 则以 ______ 机制兼顾静态速度与内容新鲜度。最新的 RSC / PPR 走的是 ______。

---

**（4）前三个任务分别启用了什么服务器？三种方式运行机制是怎样的？**

必须写到的点：Vite **开发服务器**（dev 态按需编译 + HMR；`vite build` 之后是静态托管，不再有 Node 参与）、Express（常驻 Node 进程，每请求执行业务代码）、静态文件服务器（`npx serve` / `python -m http.server`，只做文件读取与 MIME 判断）。

可用数据：CSR dev 端口 **5173**、SSR **3000**、SSG 预览 **8080**；SSR 每次请求返回 **1903 B** 完整 HTML。

作答骨架：

> 任务一 CSR 用的是 ______（Vite 开发服务器），它按需编译模块、支持热更新；执行 `vite build` 后产物变成纯静态文件，此时再由任何静态服务器托管即可，Node ______（参与/不参与）运行。任务二 SSR 用的是 ______（Express），它是一个常驻的 Node 进程，每收到一次请求就执行一次 `app.get` 回调、现拼 HTML 再返回，本实验每次响应为 1903 B。任务三 SSG 预览用的是 ______（静态文件服务器），它只负责把 `dist/` 下的文件按路径读出来并加上 MIME 头，______（有/没有）任何业务逻辑，因此运行时零计算。

---

**（5）实时更新的股票行情页，CSR / SSR / SSG / ISR 哪个最合适？为什么？**

必须写到的点：用"选型三问"逐条筛——**内容变不变？要不要个性化？首屏多敏感？**；ISR 的 revalidate 到期触发再生成，秒级行情仍可能过期；真正实时的部分需要 WebSocket 或客户端轮询。

可用数据：CSR FCP 753 ms / SSR 630 ms / SSG 633 ms；CSR 有 JS 执行开销（TBT 63 ms）。

作答骨架：

> 用选型三问来筛：内容变不变？______。要不要个性化？______。首屏多敏感？______。据此，SSG 首先排除，因为 ______；ISR 通过 revalidate 定期再生成，但股票行情是秒级变化，ISR 的最小刷新间隔仍会 ______，所以也不适合承载实时数字。最终方案是 ______：页面外壳与静态内容用 ______（SSR/SSG）保证首屏与 SEO，实时数字交给 ______（WebSocket / 客户端轮询）在客户端持续更新。理由是 ______。

---

**（6）为什么 SSR 需要水合 Hydration？没有水合会怎样？**

必须写到的点：服务端返回的只是 HTML 文本，DOM 上没有**事件监听**也没有**组件状态**；水合是在浏览器端重新执行 JS，把事件与状态"接"到已有 DOM 上（**复用而非重建**）；没有水合则页面可见但不可交互；延伸——水合成本（JS 体积、TTI、注水前的不可交互空窗）正是 RSC 与部分水合要解决的问题。

可用数据：本实验 SSR 页面源码含正文但**不含任何 JS**（1903 B 内无 script），刷新按钮用的是原生 `onclick` 而非框架事件——可对比说明"有 HTML 不代表有交互"。

作答骨架：

> 服务端渲染输出的是 HTML **文本**，浏览器解析出的 DOM 上并没有 ______，也没有 ______。水合就是在浏览器端重新执行一遍 JS，把事件处理函数和组件状态"接"到已有的 DOM 节点上，注意它是 ______（复用 / 重建）DOM 而不是重新生成。如果没有水合，结果是 ______（页面看得见但点不动）。水合的代价在于 ______，这正是 React Server Components 与部分水合（Partial Hydration）要解决的问题，思路是 ______。

## 七、选答题（任选一）

> 任选一题作答即可。同样给出知识点 + 可用数据 + 作答骨架。

**（7）什么条件下 SSG 是最优解？内容更新频繁时如何补救（提示：ISR）？**

必须写到的点：内容**相对稳定**、读写比高、对首屏与稳定性极度敏感、流量可被 CDN 全托管；频繁更新的补救手段是 ISR 的 `revalidate`、按路径增量再生成、Webhook 触发重建（而非全站重建）。

可用数据：SSG 首屏 **1891 B**、FCP **633 ms**、TBT **0**、CLS **0**，构建后运行时零计算。

作答骨架：

> SSG 是最优解的条件可以概括为：内容 ______、读写比 ______、对首屏与稳定性 ______、且流量可以完全交给 ______。本实验中 SSG 页面首屏 1891 B、FCP 633 ms、TBT 为 0，构建完成后服务器只做静态文件响应，运行时 ______。当内容更新变频繁时，补救办法是 ______：给页面设置 revalidate 时间，过期后由下一次访问触发 ______，或用 CMS 的 Webhook 只重建 ______，而不是全站重新构建。

**（8）为什么虚拟 DOM 在 2015 年是革命性创新，2026 年 Svelte / Solid 却抛弃它？**

必须写到的点：当年痛点（jQuery 命令式手写 DOM、状态与视图同步困难）→ vDOM 的价值（声明式 + diff 批处理，避免全量重排）→ 今天的瓶颈（diff 本身的运行时开销、框架运行时体积）→ 新路线（编译期分析依赖、细粒度响应式，直接更新真实 DOM）。

可用数据：本实验 CSR 的 TBT 为 **63 ms**（JS 下载 + 执行 + 拼 DOM 的开销），可作为"运行时开销"的直观例子。

作答骨架：

> 2015 年的痛点是 ______：jQuery 时代需要手动操作 DOM 来同步状态，代码随规模膨胀迅速失控。虚拟 DOM 的价值在于把这件事变成 ______：开发者只声明 UI 应该长什么样，框架用 diff 找出最小变更并批量更新，避免了 ______。到了 2026 年，瓶颈转移到了 ______——diff 本身要遍历整棵树，框架运行时也要打进产物体积（本实验 CSR 页面光 JS 执行与 DOM 拼装就带来 ______ ms 的 TBT）。Svelte / Solid 的做法是 ______：在编译期就分析出状态与 DOM 的依赖关系，运行时直接做细粒度更新，______。

**（9）若一个营销页由 AI 生成工具（如 v0）默认输出为 Next.js SSR 应用，结合本实验测量数据分析该默认选择的合理性与代价。**

必须写到的点：合理性（首屏 HTML 完整、SEO 友好、便于接 LLM 动态内容）→ 代价（需常驻 Node 服务、无法纯 CDN 托管、TTFB 受后端影响、运维与成本）→ 对照实测数据给出你自己的判断。

可用数据：SSR 首屏 **1903 B**、FCP **630 ms**；SSG **1891 B**、**633 ms**；二者首屏与 FCP 几乎一致，但 SSG 无需常驻服务。另有：本次 SSR 未上线，正是因为云托管属按量计费。

作答骨架：

> 这个默认选择的合理性在于：营销页最看重 ______ 与 ______，SSR 能保证首屏 HTML 完整（本实验 SSR 首屏 1903 B，源码含正文）、SEO 友好，也方便接 ______。代价则是 ______：SSR 必须有一个常驻的 Node 进程，无法像 SSG 那样直接托管到 CDN，TTFB 会受后端性能影响，还要承担 ______ 成本——本实验中我最终没有把 SSR 上线，正是因为它需要 ______。但对照数据看，SSG 的首屏 1891 B、FCP 633 ms 与 SSR 的 1903 B、630 ms 几乎持平，因此对内容固定的营销页，我的判断是 ______。

## 八、Debug FAQ

实验过程中遇到的典型问题与解决方式：

| # | 现象 | 原因 | 解决方式 |
| --- | --- | --- | --- |
| 1 | 端口被占用 `EADDRINUSE` | 其他服务占用了 5173 / 3000 | 换端口或结束占用进程：`netstat -ano \| findstr :3000` 后 `taskkill` |
| 2 | `Cannot find module 'vite'` | 依赖未安装或装在了别的目录 | 确认执行目录正确后重新 `pnpm install` |
| 3 | Pages 部署后页面白屏 | 静态资源用了绝对路径 `/assets/...`，部署在 `/csr/` 子路径下请求 `/assets/...` 404 | 构建时注入 base：`GH_PAGES_BASE=/csr/ pnpm run build`，`vite.config.js` 读取该值 |
| 4 | `git push` 报 `Permission to xxx/se3306-exp1.git denied to LZB-dot` | 本机 Git 凭据管理器缓存的是另一个账号的凭据，即使 remote URL 里写了用户名也仍复用旧凭据 | 改用本机已有凭据对应的账号建仓库，或用 PAT 推送（Token 形式 `https://<user>:<token>@github.com/...`，推完立刻改回） |
| 5 | GitHub Actions 列表里找不到工作流 | 首次 push 时 Pages 的 Source 还没切成 GitHub Actions，工作流没有触发记录 | 先在 Settings → Pages → Source 选 GitHub Actions，再 `git commit --allow-empty && git push` 触发一次 |
| 6 | 静态托管平台访问返回 401 | 平台默认域名带访问鉴权，匿名请求被拦截；部分平台免费域名还标注「不含中国大陆」 | 换用节点在国内、默认域名免鉴权的平台（本实验最终改用腾讯云 CloudBase 静态托管） |
| 7 | CSR 页面上线后文章不显示 | 上传时多套了一层目录，或 `index.html` 不在站点根路径 | 确认上传后的根目录直接是 `index.html + assets/`，不要多出一层文件夹 |

## 九、实验体会

> 【此处由本人撰写。如果没头绪，按下面四个问题各答两三句，拼起来就是一段完整的体会。】

1. **动手前你以为的 vs 实测后看到的**：做之前我以为 CSR "首屏 HTML 小 = 快"，实测发现它 FCP 反而最慢（753 ms vs 630 ms），因为 ______。这个反差让我意识到 ______。
2. **哪个环节最出乎意料**：______（例如：SSR 与 SSG 的数字几乎一样，但运维成本差很多 / 部署比写代码难 / 子路径部署的一个 base 配置就能让页面白屏）。
3. **选型观的变化**：以前我会默认用 ______，现在拿到一个页面我先看"选型三问"：______。
4. **对课程的反馈或遗留疑问**：______（例如：想在真实公网环境再测一次，看看 SSG 走 CDN 后与 SSR 的差距会不会拉开）。

---

附：本报告的 AI 使用情况、原始输出与审核记录见根目录 [`AI使用声明.md`](./AI使用声明.md)。
