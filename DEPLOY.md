# 📖 表情包素材站 - 完整部署教程

> 纯前端表情包素材站，支持 GitHub Pages、Vercel、Netlify、本地开发、静态托管等多种部署方式。

---

## 📦 项目结构

```
web10/
├── index.html                    # 主页面
├── css/style.css                 # 样式文件（双主题+响应式）
├── js/app.js                     # 核心逻辑
├── data/data.json                # 表情包数据 (144条)
├── scripts/fetch-data.js         # 数据生成脚本
├── vite.config.js                # Vite 配置（base: './'）
├── package.json                  # 项目配置
├── .github/workflows/deploy.yml  # GitHub Actions 自动部署
├── .nojekyll                     # 禁用 Jekyll 处理
├── .gitignore                    # Git 忽略规则
└── DEPLOY.md                     # 本文档
```

---

## 🚀 方式一：GitHub Pages 自动部署（推荐）

### 1. Git 初始化与推送

```bash
# 进入项目目录
cd web10

# 初始化 Git 仓库
git init
git branch -M main

# 添加所有文件
git add -A

# 首次提交
git commit -m "feat: 初始化表情包素材站"

# 关联远程仓库（先在 GitHub 创建新仓库，例如 your-repo）
git remote add origin https://github.com/你的用户名/your-repo.git

# 推送到远程
git push -u origin main
```

### 2. 配置 GitHub Pages

1. 打开 GitHub 仓库页面 → **Settings** → **Pages**
2. 在 **Build and deployment** 下：
   - **Source** 选择 **GitHub Actions**（不是 Deploy from branch！）
3. 保存配置

### 3. 触发工作流

项目已内置 `.github/workflows/deploy.yml`，包含三种触发方式：

- **自动触发**：推送到 `main`/`master` 分支时自动构建+部署
- **定时触发**：每天北京时间 03:00（UTC 19:00）自动更新数据并提交
- **手动触发**：Actions → 选择 "Deploy to GitHub Pages" → **Run workflow**

工作流包含三个 Job：
- **build**：安装依赖 → 抓取数据 → Vite 构建 → 上传产物
- **deploy**：部署到 GitHub Pages（仅 main/master 分支）
- **commit-data**：定时/手动时自动更新数据到仓库

### 4. 权限配置（重要）

1. 仓库 **Settings** → **Actions** → **General**
2. 找到 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 勾选 **Allow GitHub Actions to create and approve pull requests**
5. 保存

否则 `commit-data` Job 无法推送数据更新。

### 5. 访问地址

部署成功后，访问：

```
https://你的用户名.github.io/your-repo/
```

> 项目已配置 `vite.config.js` 的 `base: './'`，兼容子路径部署，无需额外修改。

---

## 🔧 方式二：本地开发运行

### 方法 A：使用 Vite（推荐）

```bash
cd web10

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npx vite preview
```

### 方法 B：使用 http-server（零依赖）

```bash
cd web10

# 直接启动（推荐，无需构建，已包含 data/data.json）
npm run start
# 或
npx http-server . -p 8080 -c-1
```

然后打开：http://localhost:8080

### 方法 C：直接双击 index.html

由于使用了相对路径和 `resolveDataPath()` 兼容逻辑，**可以直接双击 `index.html` 在 `file://` 协议下运行**，无需任何服务器。

---

## ⚡ 方式三：Vercel 一键部署

### 方法 1：命令行

```bash
cd web10
npm install -g vercel
vercel
# 按提示选择配置，Framework 选 Vite 或 Other
```

### 方法 2：仪表盘导入

1. 打开 [vercel.com](https://vercel.com) → **Add New** → **Project**
2. 导入你的 GitHub 仓库
3. 配置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `./` 或 `web10/`（如果是 monorepo）
4. 点击 **Deploy**

几秒钟后即可通过分配的域名访问。

---

## 🌐 方式四：Netlify 部署

### 方法 1：拖拽部署（最快）

1. `npm run build` 构建
2. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)
3. 将 `dist/` 文件夹拖进去

立即获得可访问链接。

### 方法 2：Git 持续部署

1. Netlify → **Add new site** → **Import an existing project**
2. 选择 GitHub 仓库
3. 配置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Deploy site**

---

## 📡 方式五：其他静态托管

### Cloudflare Pages

1. Cloudflare Dashboard → **Pages** → **Create a project**
2. 连接 Git → 选择仓库
3. 构建设置：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: dist
4. **Save and Deploy**

### 腾讯云 COS / 阿里云 OSS

1. `npm run build`
2. 将 `dist/` 目录内容上传到存储桶
3. 开启 **静态网站托管**
4. 配置默认首页为 `index.html`

### Nginx 部署

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/meme-station/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🛠️ 核心功能配置说明

### vite.config.js 路径兼容

```js
export default {
  base: './'  // 使用相对路径，兼容所有子路径部署
}
```

**为什么这么配置？**

- GitHub Pages 默认部署在子路径 `/repo-name/`，若 base 为 `/`，CSS/JS/JSON 资源会 404
- 使用 `'./'` 后所有资源以相对路径加载，无论部署在根路径还是任意子路径均可正常访问
- 与 `resolveDataPath()` 双重保险，兼容：
  - `file://` 本地双击打开
  - `http://localhost:5173/` 开发服务器
  - `https://user.github.io/repo/` GitHub Pages 子路径
  - `https://domain.com/any/nested/path/` 任意嵌套路径

### resolveDataPath() 自动探测

`js/app.js` 中的 `resolveDataPath()` 函数会自动：
1. 检测 `file://` 协议 → 返回 `data/data.json`
2. 检测 Vite 开发服务器端口 (5173-5180) → 拼接 base
3. 检测 `<base>` 标签 href → 优先使用
4. 检测路径中是否含 `/dist/` → 定位到 dist 下数据
5. 回退到当前路径 + `data/data.json`

### 主题切换逻辑

```
localStorage 保存值 → 优先使用
           ↓ 不存在
系统 prefers-color-scheme 自动适配
           ↓
监听系统主题变化（未手动设置时自动跟随）
```

### 收藏夹持久化

使用 `localStorage['meme_favorites']` 存储表情包 ID 数组，刷新不丢失。

### 定时数据更新

`deploy.yml` 中的 `schedule: cron: '0 19 * * *'` = UTC 19:00 = **北京时间 03:00**

`commit-data` Job 会：
1. 重新运行 `npm run fetch` 生成随机新数据
2. 自动 commit + push 到仓库（需要上面配置的 Workflow write 权限）
3. 触发 build+deploy 流水线

---

## ❓ 常见问题排查

### 1. 页面空白 / 控制台 404 错误

**原因**：data/data.json 或 CSS/JS 路径不正确。

**检查清单**：
- ✅ `vite.config.js` 是否为 `base: './'`
- ✅ 构建后的 `dist/index.html` 中 CSS/JS 引用是否为 `./assets/...` 而不是 `/assets/...`
- ✅ `.nojekyll` 文件是否存在于仓库根目录（防止 GitHub Pages 忽略下划线开头文件）
- ✅ GitHub Pages Source 是否选择 GitHub Actions 而不是 Branch

**手动验证**：
```bash
# 构建后检查 dist/index.html
cat dist/index.html | grep -E "(src|href)="
# 应该看到类似：<link rel="stylesheet" href="./assets/xxx.css">
```

### 2. GitHub Actions 失败：Permission denied

**原因**：Workflow 没有写仓库权限。

**解决**：Settings → Actions → General → Workflow permissions → 选 **Read and write permissions**。

### 3. 本地双击 index.html 数据加载失败

**原因**：部分浏览器对 `file://` 协议的 fetch 有 CORS 限制。

**解决**：建议使用 `npm run start`（http-server）启动本地服务器，或使用 Firefox 浏览器（限制较少）。

### 4. 构建后 data/data.json 没有拷贝到 dist

**解决**：将 `data/` 目录改为放到 `public/` 下（Vite 会自动复制 public 内所有文件到 dist）。或使用 `vite-plugin-static-copy` 插件。本项目已通过 fetch+构建流程保证数据存在。

### 5. 搜索 / 筛选不生效

**检查**：
- F12 Console 是否有 JS 报错
- data/data.json 是否为合法 JSON（可在 [jsonlint.com](https://jsonlint.com) 验证）
- 每条数据是否都有 `category`、`tags` 字段

### 6. 图片加载失败（picsum.photos 被墙）

**解决**：替换数据源。修改 `scripts/fetch-data.js` 中的 `imageUrl` 和 `thumbnailUrl`，例如：

```js
// 使用国内可用的占位图服务
imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
// 或替换为：
// imageUrl: `https://placehold.co/${width}x${height}/ff6b6b/fff?text=${encodeURIComponent(name)}`,
```

然后重新运行 `npm run fetch`。

---

## 📝 脚本命令汇总

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖（Vite） |
| `npm run fetch` | 重新生成 144 条示例数据到 data/data.json |
| `npm run dev` | 启动 Vite 开发服务器 http://localhost:5173 |
| `npm run build` | 生产构建到 dist/ 目录 |
| `npm run start` | 零依赖启动 http-server 静态服务（推荐测试） |

---

## 🎯 功能自检清单

部署后访问站点，检查以下功能是否正常：

- [ ] 12 个分类 Tab 可切换，收藏夹 Tab 显示数量
- [ ] 搜索框输入有 300ms 防抖，支持名称/标签/作者搜索
- [ ] 排序切换（最新/最热/下载量）正确
- [ ] 精选合集横向滚动，点击跳转筛选
- [ ] 标签云 Top30，字体大小渐变，点击筛选
- [ ] 卡片悬停放大，显示收藏/复制/下载按钮
- [ ] 收藏夹数据 localStorage 持久化
- [ ] 点击卡片弹窗：大图预览 + 三方式关闭（×/遮罩/Esc）
- [ ] 详情弹窗复制图片链接成功提示
- [ ] 主题切换按钮：☀️/🌙 + localStorage 持久化
- [ ] 响应式：1200 多列 / 768 双列 / 480 手机单列
- [ ] 滚动超过 400px 显示回到顶部按钮
- [ ] 加载/空/错误三种状态正常显示

---

## 📚 技术栈总结

| 类别 | 选型 | 说明 |
|------|------|------|
| 语言 | 原生 HTML/CSS/JS | 零框架，零构建依赖也可运行 |
| 构建 | Vite 5 | 可选，提供开发服务器和生产构建 |
| 部署 | GitHub Pages | Actions 自动构建部署，定时更新数据 |
| 样式 | CSS 变量 + 媒体查询 | 双主题（亮/暗），三断点响应式 |
| 数据 | data.json + picsum.photos | 144 条示例，按需扩展真实接口 |
| 存储 | localStorage | 主题偏好 + 收藏夹持久化 |

---

**部署成功后，欢迎提交 Star ⭐ 分享给更多朋友！**
