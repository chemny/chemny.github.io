# Neo Chen 个人网站

一个可直接部署至 GitHub Pages 的静态网站，无需安装依赖或构建。

## 本地预览

在本目录运行 `python3 -m http.server 8765`，打开 http://localhost:8765 。也可以直接打开 index.html。

## 页面与修改

- index.html：首页，修改个人开场与精选作品。
- works.html：23 个公开原创仓库，支持分类与搜索。
- project-*.html：作品入口页，含仓库简介及 GitHub 链接，后续可补充案例。
- articles.html 与 article-*.html：示例文章列表和阅读页。
- about.html：个人介绍示例。
- styles.css：颜色、布局、字体及手机适配。
- app.js：手机导航、作品分类与搜索。
- content.json：内容资料快照，供后续整理使用；修改该文件不会自动改动 HTML，当前页面以 HTML 为准。

GitHub 项目资料读取于 2026-10-13，只展示 chemny 的公开、非 fork 仓库。个人介绍和文章为示例；页面中的作品图形是风格化示意图，不是项目运行截图。

## GitHub Pages

确认内容后，将本目录内容放入 chemny.github.io 仓库，在 Settings → Pages 选择从分支部署，选择 main / root。已包含 .nojekyll；不需要 Jekyll。网站使用相对链接，也适用于项目子路径。

个人网站初版。个人介绍与文章为示例，项目案例将持续补充。

## 交互式 3D 个人案例

`project-image-to-3d.html` 保留原有项目详情，原占位图已替换为六个当前模型的润色展示封面，点击图片直接打开 `demos/3d/`。作品列表保持原有 Image to 3D 条目，不新增独立案例。`demos/3d/` 为六个案例、八个当前模型版本的完整静态演示。演示资源仅按案例选择加载，不包含历史模型、回退数据、清理记录或本机工程脚本。

模型支持 WebGL，部分资源使用浏览器 DecompressionStream 解压，需要现代浏览器和 HTTP(S) 环境；不可通过 file:// 运行。保留 .nojekyll。大模型首次加载所需时间取决于网络和设备，GitHub Pages 发布后应复查线上资源与解压。
