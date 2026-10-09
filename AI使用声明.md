# AI 使用声明

| 项目 | 内容 |
| --- | --- |
| 课程 | 《现代 Web 前端框架与工程化》SE3306 |
| 实验 | 实验一 · CSR / SSR / SSG 渲染对比 |
| 仓库 | `LZB-dot/se3306-exp1` |
| 学生 | 李泽滨（学号：2024034743037） |
| 日期 | 2026-10-09 |
| AI 参与环节 | 工程骨架、构建与部署配置 |
| 本人完成环节 | 三个任务的实际运行、任务四全部实测数据、报告结论与实验体会 |

---

## 1. 使用范围

### 1.1 借助 AI 完成的环节

| 环节 | 说明 |
| --- | --- |
| 项目脚手架与配置 | `lab1-csr` 的 Vite 项目结构与 `vite.config.js` 的 `base` 配置 |
| 部署配置 | `.github/workflows/deploy.yml` 工作流、`lab1-ssr/Dockerfile` |
| 报告排版 | README 的章节结构与表格框架 |

### 1.2 由本人完成的部分

1. **三个任务的实际运行**：CSR 启动 5173、SSR 启动 3000、SSG 构建出 `dist/`，全部在本地跑通；
2. **任务四的全部实测数据**：首屏 HTML 大小、FCP、LCP、Lighthouse 采集与截图取证；
3. **报告中所有结论性文字**：第六章必答 6 题、选答第 7 / 9 题、第九章实验体会；
4. **第八章 Debug FAQ 中真实遇到的问题记录**；
5. 对生成代码逐条核对后的修改决策（见第 2 节）。

---

## 2. 代码核对与修改记录

对拿到的代码逐处核对后，做了以下修改，每条附原因：

| # | 位置 | 修改内容 | 原因 |
| --- | --- | --- | --- |
| 1 | `lab1-csr/src/main.js`、`lab1-ssr/server.js`、`lab1-ssg/build-ssg.js` | 新增 `escapeHtml()`，标题 / 正文 / 属性插值全部转义 | 用模板字符串拼 HTML 必须转义 `& < > " '`，否则会破坏 DOM 结构或造成 XSS |
| 2 | `lab1-ssr/server.js` | 页面底部输出「本次渲染时间」 | 任务二自检第 3 点要求证明「每次请求都现拼一遍 HTML」，用时间戳变化作为可复现证据 |
| 3 | `lab1-ssg/build-ssg.js` | 输出「构建时间」，改用 `__dirname` 拼接路径并打印字节数 | 任务三自检第 3 点要求证明「内容在构建时已写死」；`__dirname` 保证在任意工作目录下执行都落到正确位置 |
| 4 | `lab1-csr/vite.config.js` | `base` 读取环境变量 `GH_PAGES_BASE`，CI 注入 `/se3306-exp1/csr/` | GitHub Pages 采用 `用户名.github.io/仓库名/` 子路径部署，默认绝对路径资源会 404 |
| 5 | `.github/workflows/deploy.yml` | 装配目录 `site/`，CSR 与 SSG 分别落到 `site/csr/`、`site/ssg/`，并写入 `.nojekyll` | 遵循任务书「三个实验分开部署，各测各的」；`.nojekyll` 防止 Jekyll 忽略下划线开头的产物文件 |
| 6 | `lab1-ssg/package.json` | 删除自行添加的 `preview` 脚本（`node preview.js`） | 任务书明确预览用 `npx serve dist` / `python -m http.server`，不引入任务书之外的自定义脚本 |
| 7 | `lab1-ssr/server.js` | 端口改为读 `process.env.PORT` | 云托管部署时端口由容器注入，写死会导致部署后 502 |

---

## 3. 说明

1. 所有代码都在本地真实运行过，跑不通的不进提交；
2. 报告中实测字段全部来自本人实测，未使用任何推测或估算数值；
3. 三个 lab 均为纯 JS，本实验不涉及框架水合代码，第 6 题关于水合的作答结合讲次 02 第 12 页理解，属理论性回答；
4. DevTools / Lighthouse 的实测数值依赖本地机器性能与网络节流设置，跨机不可直接比较，已在 README 中注明测量环境。
