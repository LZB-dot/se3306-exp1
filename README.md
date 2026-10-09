# 实验一：CSR / SSR / SSG 渲染对比 —— 实验报告

| 项目 | 内容 |
| --- | --- |
| 课程 | 《现代 Web 前端框架与工程化》SE3306 |
| 实验 | 实验一 · CSR / SSR / SSG 渲染对比（第 2 周 · 约 3 学时） |
| 姓名 | 李泽滨 |
| 学号 | 2024034743037 |
| 完成日期 | 2026-10-09 |
| 代码仓库 | <https://github.com/LZB-dot/se3306-exp1>（公开仓库） |
| CSR 部署地址 | 主：<https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/csr/>（CloudBase 静态托管，国内节点）　备：<https://LZB-dot.github.io/se3306-exp1/csr/> |
| SSG 部署地址 | 主：<https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/ssg/>（CloudBase 静态托管，国内节点）　备：<https://LZB-dot.github.io/se3306-exp1/ssg/> |
| SSR 部署地址 | 本地运行：`cd lab1-ssr && node server.js` → <http://localhost:3000>。SSR 依赖常驻 Node 进程，静态托管无法部署，本次以本地演示 + 渲染时间戳取证提交，详见任务二 |

---

## 一、实验目的

1. 直观理解三种渲染模式（CSR / SSR / SSG）的执行流程与本质区别，并延伸认识 ISR 与混合渲染；
2. 用客观指标（首屏 HTML 大小、FCP 白屏时间、LCP、SEO 可见性）量化三种模式的差异，让讲次 02 的每个结论都有数据支撑；
3. 建立渲染模式选型的工程判断力，用理论课的「选型三问」做决策：内容变不变？要不要个性化？首屏多敏感？
4. 通过一手实证理解课上「五个时代」的演进逻辑：为什么 SPA 之后 SSR 会回来、SSG 为什么最稳。

## 二、实验环境与工具

| 类别 | 内容 |
| --- | --- |
| 硬件 | 个人计算机一台，可联网 |
| 软件 | Node.js 20+（本机 v22.22.2）、pnpm、Chrome（含 DevTools）、VS Code |
| 技术栈 | Vite 6（CSR 脚手架与构建）、Express 4（SSR）、Node 构建脚本（SSG） |
| 版本管理 | Git + GitHub（仓库 `LZB-dot/se3306-exp1`） |
| 部署 | CloudBase 静态网站托管（CSR / SSG 主链接）；GitHub Actions + GitHub Pages（备份链接）；SSR 需常驻 Node 服务，本次未上线 |

本地复现命令：

```bash
# 任务一 CSR
pnpm create vite lab1-csr -- --template vanilla --no-interactive
cd lab1-csr && pnpm install && pnpm run dev        # http://localhost:5173

# 任务二 SSR
cd lab1-ssr && pnpm init && pnpm add express
node server.js                                     # http://localhost:3000

# 任务三 SSG
cd lab1-ssg && node build-ssg.js                   # 产物 dist/index.html
npx serve dist                                     # 预览方式一，需联网
python -m http.server 8080 -d dist                 # 预览方式二，无需联网
```

> 命令里的 `&&` 在部分 shell 下不被支持（例如 PowerShell 5.1），拆成两条分开执行即可。

## 三、实验原理

### 3.1 渲染模式速览

- **CSR（客户端渲染）**：服务器只返回空 HTML 骨架 + JS 引用，浏览器下载并执行 JS 后才渲染出内容。首屏慢、SEO 差，交互体验好。代表：Vite + React / Vue。
- **SSR（服务端渲染）**：服务器当场把数据拼进完整 HTML 再返回，首屏快、SEO 好；浏览器拿到 HTML 后需经「水合 Hydration」把静态页面重新激活。
- **SSG（静态站点生成）**：在**构建期**就生成静态 HTML，部署到 CDN 后每次访问只做静态文件响应，零计算。最快最稳，但内容更新必须重新构建。代表：博客、文档、营销页。
- **ISR（增量静态再生成）**：SSG 的补丁，给页面设置 revalidate 时间，过期后由下一次访问触发后台重新生成，兼顾静态速度与内容新鲜度。

### 3.2 关键测量指标：Web Vitals

| 缩写 | 全称 | 中文名 | 衡量目标 | 优秀线 |
| --- | --- | --- | --- | --- |
| LCP | Largest Contentful Paint | 最大内容绘制 | 加载速度，主内容多久显示 | ≤ 2.5 秒 |
| INP | Interaction to Next Paint | 交互到下一帧绘制 | 交互响应灵敏度 | ≤ 200 毫秒 |
| CLS | Cumulative Layout Shift | 累积布局偏移 | 视觉稳定性 | ≤ 0.1 |

渲染策略直接影响 Web Vitals：SSG / SSR 有利于降低 LCP；CSR 的大 JS 包会阻塞主线程，容易拉高 INP；图片不预留宽高会直接拉高 CLS。

本实验实测首屏 HTML 大小、FCP、LCP、SEO 可见性四项，操作见任务四。官方标准见 <https://web.dev/vitals>（注意 webvitals.com 是第三方网站，不是官方）。

## 四、实验内容与步骤

仓库目录结构：

```
se3306-exp1/
├── lab1-csr/            # Vite CSR 版（index.html + src/main.js）
│   └── handwritten/     # 选做：不装任何依赖、双击即开的手写版
├── lab1-ssr/            # Express SSR 版（server.js）
├── lab1-ssg/            # SSG 版（build-ssg.js → dist/）
├── docs/screenshots/    # 各任务自检截图
├── AI使用声明.md         # AI 使用声明
└── README.md            # 本实验报告
```

### 任务一：Vite 纯 CSR 应用

```bash
pnpm create vite lab1-csr -- --template vanilla --no-interactive
cd lab1-csr && pnpm install && pnpm run dev   # http://localhost:5173
```

`template vanilla` 表示纯 JS 项目，不引入任何框架；`--no-interactive` 跳过脚手架的交互提问。

`index.html` 里只留一个空容器 `<div id="app"></div>`，核心代码在 `src/main.js`：

```js
const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, title: `文章标题 ${i + 1}`, body: `这是第 ${i + 1} 篇文章的正文内容……`
}));
const app = document.getElementById('app');
app.innerHTML = '<h1>文章列表</h1>' + posts.map(p =>
  `<article><h2>${p.title}</h2><p>${p.body}</p></article>`).join('');
```

`Array.from` 生成 10 篇模拟数据，`getElementById` 找到空容器，再把标题和正文拼成 HTML 塞进去。这一步发生在**浏览器运行时**，所以右键查看源代码时正文不可见——这就是 CSR 的空壳原理。

自检记录：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）`pnpm run dev` 后 5173 端口能看到 10 篇文章 | ✅ 通过 | `docs/screenshots/task1-01-page.png` |
| （2）查看网页源代码，看不到文章正文 | ✅ 通过，源码里 `<div id="app">` 内为空 | `docs/screenshots/task1-02-source.png` |
| （3）DevTools Network 能看到 main.js 请求 | ✅ 通过 | `docs/screenshots/task1-03-network.png` |

**选做：手写版对比**（`lab1-csr/handwritten/index.html` + `main.js`，不装任何依赖，双击即开）

对比下来，Vite 版多出来的东西是：开发服务器与热更新（改代码不用手动刷新）、按需编译、`vite build` 的打包与压缩、以及 `base` 配置对子路径部署的支持。但这些都属于**工程便利**，不改变渲染本质——手写版和 Vite 版的首屏都是空壳 + JS，内容一样要等浏览器执行 JS 之后才出现。CSR 的本质是「内容在浏览器端生成」，与用什么工具无关。

### 任务二：Express 实现 SSR

```bash
cd lab1-ssr && pnpm init && pnpm add express
node server.js    # http://localhost:3000
```

`server.js` 注册首页路由，请求到来时把 10 篇文章拼进完整 HTML 再 `res.send()`，因此正文直接出现在响应源码里。`require` 引入 Express，`app` 是应用实例，`app.listen` 让服务器监听 3000 端口，命令行打印 `SSR on http://localhost:3000` 即启动成功。

自检记录：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）页面能看到 10 篇文章 | ✅ 通过 | `docs/screenshots/task2-01-page.png` |
| （2）源代码里含文章正文（SEO 友好） | ✅ 通过 | `docs/screenshots/task2-02-source.png` |
| （3）证明「每次请求都现拼一遍 HTML」 | ✅ 通过 | `docs/screenshots/task2-03-timestamp.png` |

第（3）项的实证方式：我在页面底部输出了**本次渲染时间**。连续刷新多次，时间戳每次都变化，说明 HTML 是在请求到达那一刻才由服务器生成的；作为对照，任务三的 SSG 页面底部是**构建时间**，反复刷新始终不变。两个页面放在一起，"拼 HTML 的时机"这个本质区别就很直观了。

**选做：整页刷新体验**（页面底部加了 `<button onclick="location.reload()">刷新当前时间</button>`）

点一次按钮，浏览器重新发一次完整请求、服务器重新拼一遍 HTML、整页重绘。这就是课上说的时代一「每次点击整个世界重来」——和 CSR 只更新局部 DOM 的体验完全不同，也是后来 SPA 出现的原因。

### 任务三：SSG 静态生成

```bash
cd lab1-ssg && node build-ssg.js
npx serve dist                      # 预览方式一，需联网
python -m http.server 8080 -d dist  # 预览方式二，无需联网
```

`build-ssg.js` 用同一份数据在**构建期**拼 HTML，`fs.writeFileSync` 写入 `dist/index.html`。Jekyll / Hugo / Next.js 的 SSG 本质就是这件事，手写一遍就看穿了它们的工作原理：区别只在于它们还会处理 Markdown 解析、模板、分页、增量构建这些事。

自检记录：

| 自检项 | 结果 | 截图 |
| --- | --- | --- |
| （1）`dist/index.html` 生成成功 | ✅ 通过 | `docs/screenshots/task3-01-build.png` |
| （2）本地预览能访问 | ✅ 通过 | `docs/screenshots/task3-02-page.png` |
| （3）证明内容在构建时已写死 | ✅ 通过 | `docs/screenshots/task3-03-buildtime.png` |

第（3）项实证：页面底部是**构建时间**，反复刷新始终不变；构建脚本同时会打印 HTML 字节数，说明文件在那一刻就已落盘。之后每次访问，服务器只做静态文件读取，运行时零计算。

### 任务四：指标测量与对比

- **方式 A（DevTools Performance）**：F12 → Performance 面板 → 点录制 → Ctrl+R 刷新 → 停止 → 在 Timings 轨道读 FCP、LCP。
- **方式 B（Lighthouse）**：F12 → Lighthouse 面板 → Analyze page load → 等约 30 秒 → 读 Performance 分数与 LCP、CLS、TBT。
- **首屏 HTML 大小**：右键「查看网页源代码」→ 全选复制 → 记事本看字节数。
- **SEO 可见性**：源代码里有没有正文。

三个页面在同一环境下逐项实测：

| 模式 | 首屏 HTML 大小 | 白屏时间 FCP | LCP | SEO（源码含正文？） | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| CSR | **428 B** | **753 ms** | **809 ms** | **否**（源码只有一个空 `<div id="app">`） | 交互密集、不需要 SEO 的内部应用：后台管理系统、在线工具、SPA |
| SSR | **1903 B** | **630 ms** | **630 ms** | **是**（正文直接在响应 HTML 里） | 需要 SEO 且内容会随请求变化：电商详情页、新闻站、带个性化的页面 |
| SSG | **1891 B** | **633 ms** | **752 ms** | **是**（构建期已写入 HTML） | 内容稳定、极度看重首屏与稳定性：博客、文档、营销页、官网 |

> **测量环境**（三次测量条件完全一致）：
> - Chrome 141（本机 `C:\Program Files\Google\Chrome\Application\chrome.exe`），headless 模式
> - Lighthouse CLI **13.5.0**，默认 **mobile** 档位，节流方式 **simulate**（模拟 Slow 4G + 4× CPU 降速）
> - 三个页面均为本机 localhost 服务（CSR / SSG 走 `http://localhost:8080`，SSR 走 `http://localhost:3000`）
> - 每页测量 1 次，未取多轮中位数
> - 首屏 HTML 大小 = 直接请求该页返回的 HTML 字节数（未开启 gzip）

**这组数据说明了什么**

- CSR 的首屏 HTML 只有 428 B，是三个里最小的，但 FCP / LCP 反而最慢。原因是它把渲染工作推给了浏览器：先下载约 1.4 KB 的 JS，再执行、再拼 DOM，多出来的 63 ms TBT 就是 JS 占住主线程的代价。**小 HTML 不等于快**，这是我最意外的一点。
- SSR / SSG 的首屏 HTML 大得多（约 1.9 KB），但浏览器拿到就能直接显示，FCP 比 CSR 快约 120 ms，且 TBT 为 0。用「多传 1.5 KB 文本」换「少一次 JS 下载 + 执行 + 拼 DOM」，在弱网和低端机上这笔交换非常划算。
- SSR（630 ms）略快于 SSG（633 ms），属于同一量级。本机 localhost 下差距被网络延迟掩盖；真实公网环境里 SSG 走 CDN 边缘节点、SSR 要回源计算，差距会明显放大——这也解释了为什么"能静态化的页面尽量静态化"。

Lighthouse 记录：

| 模式 | Performance 分数 | LCP | CLS | TBT | 总传输量 |
| --- | --- | --- | --- | --- | --- |
| CSR | 100 | 809 ms | 0 | **63 ms** | 2764 B |
| SSR | 100 | 630 ms | 0 | **0 ms** | 2556 B |
| SSG | 100 | 752 ms | 0 | **0 ms** | 2600 B |

> 三个模式的性能分都是 100，原因是本页体积极小（不到 3 KB），远没触及 Lighthouse 的扣分阈值。真正能区分三者的指标是 **FCP / LCP 与 TBT**，而不是总分——只看分数会得出"三种模式一样好"的错误结论。

选做观察（PageSpeed Insights，<https://pagespeed.web.dev>）：把部署后的 CSR / SSG 地址丢进去可以直接看 LCP、INP、CLS 三项得分；本次两个页面体量太小，区分度同样不高。

## 五、项目提交与部署

三个实验分开部署，各测各的，互不干扰，不用改配置也不用改代码。

- **CSR 与 SSG** 输出的都是静态文件，构建完之后就不再需要 Node 服务，用 CloudBase 静态网站托管（`tcb hosting deploy`）部署到国内节点；同时在 `.github/workflows/deploy.yml` 里配置自动构建并发布到 GitHub Pages 作为备份。
- **SSR** 没有静态产物，依赖常驻 Node 进程实时生成 HTML，**静态托管无法部署**。它更接近一个 Web API / 服务，要上线得走云托管：上传整个 `lab1-ssr` 源码，启动命令 `node server.js`，端口 3000（仓库里已附 `Dockerfile`，`server.js` 读 `process.env.PORT` 与容器注入端口对齐）。本次未开通按量计费的云托管，SSR 以**本地运行 + 演示证据**提交：页面底部的"本次渲染时间"每次刷新都变化，即为"每次请求都在服务器端重新生成 HTML"的实证。

| 产物 | 部署方式 | 访问地址 | 实测 |
| --- | --- | --- | --- |
| `lab1-csr/dist` | CloudBase 静态托管 `/csr/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/csr/> | 200；源码无正文，仅空 `div#app` |
| `lab1-csr/dist` | GitHub Actions → Pages `/csr/`（备） | <https://LZB-dot.github.io/se3306-exp1/csr/> | 200；国内直连约半数请求超时 |
| `lab1-ssg/dist` | CloudBase 静态托管 `/ssg/`（主，国内节点） | <https://se3306-d6go5cz7kca0abeee-1502509077.tcloudbaseapp.com/ssg/> | 200；源码含正文 |
| `lab1-ssg/dist` | GitHub Actions → Pages `/ssg/`（备） | <https://LZB-dot.github.io/se3306-exp1/ssg/> | 200；同上 |
| `lab1-ssr` | 本地运行 `node server.js`（端口 3000），未上线 | <http://localhost:3000> | 200；每次请求返回完整 HTML（1903 B），页面底部渲染时间戳逐次变化 |

> 本地构建产物与代码包放在 `deploy/` 目录（`se3306-exp1-csr.zip` 等），属构建产物，按 `.gitignore` 不入库。

## 六、实验报告要求

### 必答题

**（1）为什么 SPA 时代 SEO 差？**

根因在于搜索引擎爬虫抓的是**首屏 HTTP 响应体**，而不是 JS 执行之后的 DOM。本实验中 CSR 页面的首屏 HTML 只有 428 B，正文位置是一个空的 `<div id="app">`，真正的 10 篇文章要等浏览器下载并执行约 1.4 KB 的 JS 之后才出现；而 SSR 首屏 1903 B、SSG 首屏 1891 B，正文已经在 HTML 里，爬虫可以直接索引。

即使后来搜索引擎支持渲染 JS，也仍然存在**渲染延迟**和**抓取预算**（crawl budget）的限制：爬虫给每个站点分配的资源是有限的，需要先执行 JS 才能拿到内容的页面，索引速度慢、覆盖率低。所以对需要被搜索到的页面，把内容放进首屏 HTML 才是根本解法——这正是 SSR 回归和 SSG 流行的直接原因。

**（2）SSG 与 SSR 的本质区别是什么？**

本质区别只有一个：**拼 HTML 发生在什么时候**。

- SSR 在**请求时**拼：每个请求到达，服务器执行一次路由回调，现拼一次 HTML 再返回。本实验中连续刷新 SSR 页面，底部的"本次渲染时间"每次都在变，就是这个过程的直接证据。
- SSG 在**构建期**拼：构建脚本执行一次，把成品写进 `dist/index.html` 就结束了。本实验中 SSG 页面底部的"构建时间"反复刷新都不变。

由此带来的差异有四个维度：

| 维度 | SSR | SSG |
| --- | --- | --- |
| 运行时计算 | 每个请求都要拼一次 HTML | 零计算，只读文件 |
| 每次请求结果 | 可以不同（能带个性化、实时数据） | 完全相同（内容写死） |
| 缓存与 CDN | 回源计算，缓存命中率低 | 可全量托管到 CDN 边缘节点 |
| 内容更新成本 | 改数据即生效 | 必须重新构建并重新部署 |

一句话概括：SSR 是"用时现做"，SSG 是"提前做好"。

**（3）结合讲次 02 渲染模式演进的理论，写一段 200 字左右的总结。**

渲染模式的演进不是简单的替代，而是围绕"内容在哪里生成"反复权衡。最早的静态文档时代，页面是服务器上写好的文件，只能看不能交互；jQuery 时代用命令式操作 DOM 做局部更新，但状态与视图的同步全靠手写，规模一大就失控。SPA / CSR 把渲染整个搬到浏览器，换来接近原生应用的交互体验，代价是首屏变慢与 SEO 变差——本实验中 CSR 的 FCP 为 753 ms，比 SSR 的 630 ms 慢约 120 ms，且 TBT 达 63 ms，原因就是浏览器要先下载并执行 JS 才能画出内容。于是 SSR 重新把渲染搬回服务器，用完整首屏 HTML 换回首屏速度与 SEO；SSG 更进一步把渲染提前到构建期，用"内容更新必须重新构建"换取极致的首屏速度与稳定性；ISR 则用 revalidate 定期再生成的机制，在静态速度与内容新鲜度之间找平衡。最新的 RSC / PPR 走的是混合路线：能静态的先静态，需要交互的才发到客户端，把水合成本也一并压下去。

**（4）前三个实验任务都启用了服务器，分别使用什么服务器？三种方式运行机制怎样？**

| 任务 | 用的服务器 | 端口 | 运行机制 |
| --- | --- | --- | --- |
| 任务一 CSR | Vite 开发服务器 | 5173 | 开发态按需编译模块、支持 HMR 热更新；执行 `vite build` 之后产物变成纯静态文件，此时交给任何静态服务器托管即可，Node 不再参与运行 |
| 任务二 SSR | Express（常驻 Node 进程） | 3000 | 每收到一次请求就执行一次 `app.get` 回调，现拼 HTML 再返回，本实验每次响应 1903 B；进程必须一直开着 |
| 任务三 SSG | 静态文件服务器（`npx serve` / `python -m http.server`） | 8080 | 只负责按 URL 路径把 `dist/` 下的文件读出来、加上 MIME 头返回，没有任何业务逻辑，因此运行时零计算 |

三者的关键差异在于**服务器是否参与内容生成**：Vite dev 服务器参与"编译"，Express 参与"渲染"，静态文件服务器什么都不参与，只做搬运。这也解释了为什么换成静态托管后行为会变——CSR 换托管没影响，SSR 换托管直接跑不起来。

**（5）实时更新的股票行情页，CSR / SSR / SSG / ISR 哪个最合适？为什么？**

用"选型三问"来筛：

1. **内容变不变？** 变，而且是秒级变化，几乎每次刷新数字都不同。
2. **要不要个性化？** 要，自选股列表、持仓、涨跌提醒都因人而异。
3. **首屏多敏感？** 敏感，用户点开就想立刻看到行情，白屏几秒就会流失。

据此：

- **SSG 首先排除**——内容在构建期就写死了，秒级变化的数字根本不可能靠重新构建跟上。
- **ISR 也不合适承载实时数字**——revalidate 的最小间隔通常是秒到分钟级，行情是亚秒级变化，ISR 拿到的永远是一份"刚生成就已经过期"的快照。
- **纯 SSR 只解决了一半**——首屏快、SEO 好、能带个性化，但 HTTP 响应是一次性的，返回之后数字就静止了。
- **纯 CSR 也不行**——首屏白屏最久（本实验 FCP 753 ms 是三者最慢），而且要等 JS 下载执行完才能发起行情请求。

**最终方案是 SSR（或 SSG）打底 + 客户端实时通道**：页面的外壳、静态文案、SEO 内容用 SSR 输出，保证首屏与抓取友好；真正的实时数字交给 **WebSocket**（或 SSE）在客户端持续推送更新，连接断开时降级为客户端轮询。这样拆的理由是，"首屏要快、要能被搜到"和"数字要一直动"本来就是两种需求，不该用同一种渲染模式硬扛。

**（6）为什么 SSR 需要水合 Hydration？没有水合会怎样？**

服务端渲染输出的是 HTML **文本**，浏览器把它解析成 DOM 之后，这些节点上既没有**事件监听**，也没有**组件状态**——它们只是长得像界面的字符串。水合就是在浏览器端重新执行一遍 JS，把事件处理函数和组件状态"接"到已有的 DOM 节点上，注意它是**复用**已有 DOM 而不是重新生成，这也是它比重新渲染快的原因。

没有水合，结果就是**页面看得见但点不动**：内容显示正常、SEO 也没问题，但按钮没反应、表单不能提交、下拉菜单打不开。本实验的 SSR 页面就是这种状态的简化版——源码里 1903 B 全是 HTML，没有任何 JS，唯一的交互"刷新"用的是原生 `onclick="location.reload()"`，本质上是让浏览器重新发一次请求、让服务器重新渲染一遍，而不是在客户端更新。

水合的代价在于：JS 仍然要完整下载并执行一遍，这段时间里页面"看得见但不能点"（TTI 之前的空窗），而且框架运行时也要算进体积。这正是 React Server Components 与部分水合（Partial Hydration）要解决的问题——思路是**只给真正需要交互的那部分组件发 JS**，其余部分保持纯静态。

### 选答题（任选一，本次作答第 7、9 题）

**（7）什么条件下 SSG 是最优解？内容更新频繁时如何补救？**

SSG 是最优解的条件可以概括为四条：内容**相对稳定**（读写比高）、对**首屏速度与稳定性**极度敏感、流量可以**完全交给 CDN**、且不需要按请求做个性化。本实验中 SSG 首屏 1891 B、FCP 633 ms、TBT 为 0，构建完成后服务器只做静态文件响应，运行时零计算——也意味着没有数据库、没有应用进程，几乎没有可以宕机的环节。

内容更新变频繁时的补救办法是 **ISR**：给页面设置 `revalidate` 时间，过期后由下一次访问触发该页**在后台增量重新生成**，用户拿到的仍是静态文件，感知不到延迟；或者让 CMS 在数据变更时发 **Webhook 只重建受影响的路径**，而不是全站重新构建。ISR 的取舍是"允许短暂的数据陈旧"，所以当业务要求强一致（比如库存、余额）时，还是要回到 SSR 或客户端实时更新。

**（9）若一个营销页由 AI 生成工具（如 v0）默认输出为 Next.js SSR 应用，结合本实验测量数据分析该默认选择的合理性与代价。**

合理性在于：营销页最看重**首屏**与**SEO**，SSR 能保证首屏 HTML 完整（本实验 SSR 首屏 1903 B，源码含正文）、爬虫可直接索引，也方便接动态内容（比如按渠道参数换文案、按地区显示价格）。对生成工具来说，SSR 还是最"通用"的默认值——它不需要预先知道内容多久变一次。

代价是**运维与成本**：SSR 必须有一个常驻的 Node 进程，无法像 SSG 那样直接托管到 CDN，TTFB 会受后端性能与并发影响，还要承担服务器和扩缩容的成本——本实验中我最终没有把 SSR 上线，正是因为它需要按量计费的云托管服务。

但对照实测数据看，SSG 的首屏 1891 B、FCP 633 ms，与 SSR 的 1903 B、630 ms 几乎持平。所以对内容固定的营销页，我的判断是**默认 SSR 偏保守，改成 SSG 更划算**：同样的首屏表现，却省掉了常驻服务和回源开销；只有当页面确实需要按请求个性化时，才值得为 SSR 付这个成本。再进一步，用 ISR 给少数会变的区块设一个较短的 revalidate，基本就能覆盖绝大多数营销场景。

## 七、AI 使用规范

实验根目录已附 [`AI使用声明.md`](./AI使用声明.md)，记录使用范围与审核记录。

## 八、Debug FAQ

实验过程中遇到的典型问题与解决方式：

| # | 现象 | 原因 | 解决方式 |
| --- | --- | --- | --- |
| 1 | 端口被占用 `EADDRINUSE` | 其他服务占用了 5173 / 3000 | 换端口，或 `netstat -ano \| findstr :3000` 找到 PID 后 `taskkill /PID <pid> /F` |
| 2 | `Cannot find module 'vite'` | 依赖未安装，或装在了别的目录 | 确认 `cd` 到了项目目录再重新 `pnpm install` |
| 3 | Pages 部署后页面白屏 | 静态资源用了绝对路径 `/assets/...`，部署在 `/csr/` 子路径下会请求 `/assets/...` 导致 404 | 构建时注入 base：`GH_PAGES_BASE=/csr/ pnpm run build`，`vite.config.js` 读取该值 |
| 4 | `git push` 报 `Permission to xxx/se3306-exp1.git denied to LZB-dot` | 本机 Git 凭据管理器缓存了另一个账号的凭据，即使 remote URL 里写了用户名也会复用旧凭据 | 改用本机凭据对应的账号建仓库，或用 PAT 推送（`https://<user>:<token>@github.com/...`，推完立刻改回） |
| 5 | GitHub Actions 列表里找不到工作流 | 首次 push 时 Pages 的 Source 还没切成 GitHub Actions，工作流没有触发记录 | 先在 Settings → Pages → Source 选 GitHub Actions，再 `git commit --allow-empty && git push` 触发一次 |
| 6 | 静态托管平台访问返回 401 | 平台默认域名带访问鉴权，匿名请求被拦截；部分平台免费域名还标注「不含中国大陆」 | 换用节点在国内、默认域名免鉴权的平台（本实验最终改用腾讯云 CloudBase 静态托管） |
| 7 | CSR 页面上线后文章不显示 | 上传时多套了一层目录，或 `index.html` 不在站点根路径 | 确认上传后的根目录直接是 `index.html + assets/`，不要多出一层文件夹 |
| 8 | PowerShell 里 `cd lab1-csr && pnpm install` 报错 | PowerShell 5.1 不支持 `&&` 链式命令 | 拆成两条命令分开执行 |

## 九、实验体会

**动手前我以为的 vs 实测后看到的**：做之前我以为"首屏 HTML 小 = 快"，CSR 的 428 B 明明是三个里最小的，按这个逻辑它应该最快。实测下来它的 FCP 反而是 753 ms，比 SSR 的 630 ms 慢了 120 ms。原因想明白之后其实很朴素：HTML 小是因为它什么内容都没带，浏览器还得额外下载 JS、执行、拼 DOM，这些时间一点没省下来。这个反差让我意识到，**衡量性能要看用户真正看到内容的时刻，而不是看传输了多少字节**——以后再看到"体积优化"的宣传，我会先问一句：优化的是哪一段路径上的体积。

**最出乎意料的一环**：SSR 和 SSG 的数字几乎一样（FCP 630 ms vs 633 ms），但两者的运维成本差了一个量级——SSG 传完文件就结束了，SSR 要一直养着一个 Node 进程。也就是说在这个规模下，多花的那份运维成本换来的实测收益接近于零。另一个意外是部署比写代码难：一个 `base` 配置没设对，页面上线就白屏，而代码本身一行没错。

**选型观的变化**：以前我会默认"用框架就用 SPA"，觉得服务端渲染是老技术。现在拿到一个页面，我会先过一遍"选型三问"：内容变不变？要不要个性化？首屏多敏感？三问答完，方案基本就出来了——内容稳定的走 SSG，要 SEO 又要实时的走 SSR + 客户端长连接，只有纯内部工具才用纯 CSR。选型不再是"我喜欢哪个框架"，而是"这个页面的内容在什么时刻是确定的"。

**遗留疑问**：这次三个页面都跑在本机 localhost，网络延迟被压到几乎为零，SSR 回源计算和 SSG 走 CDN 的差距完全没有体现出来。后面想在真实公网环境再测一轮，看看 SSG 走 CDN 之后与 SSR 的差距会不会明显拉开——我预期会，但想用数据确认一下。
