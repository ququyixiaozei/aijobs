# 部署运行手册 — 一步步,可复制粘贴

> 从上到下照做即可。**命令直接复制粘贴到 PowerShell**(按 Win 键搜 “PowerShell” 打开)。
> 涉及网页的步骤写了详细点击。预计 1–2 小时,现金成本 ≈ 一个域名(约 $10–12)。
> 任何一步报错,把**报错原文**贴给我,我给你具体改法。

---

## 步骤 0 · 安装工具(Node / Git / GitHub CLI)
Windows 11 自带 winget。逐条复制运行:
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
```
装完**关闭并重新打开 PowerShell**(让 PATH 生效),再验证(应各打印版本号):
```powershell
node --version
npm --version
git --version
gh --version
```
> 若某条 `winget install` 提示“已安装/找不到源”,忽略,只要上面四个版本号都打印出来即可。

---

## 步骤 1 · 进入项目目录
```powershell
cd D:\n_w\product\jobboard
```

## 步骤 2 · 安装依赖(下载 Next.js 等,几十秒~几分钟)
```powershell
npm install
```

## 步骤 3 · 抓取真实岗位
```powershell
node ingest/run.mjs
```
- 会打印每家公司的结果,并生成 `data/jobs.json`。已验证的 14 家公司开箱即用。
- **若某行显示 `FAIL`**(那家公司 token 不对,可先不管,以后再加):
  1. 浏览器打开那家公司的招聘页,看网址:
     - `boards.greenhouse.io/XXX` 或 `job-boards.greenhouse.io/XXX` → ats=`greenhouse`,token=`XXX`
     - `jobs.lever.co/XXX` → ats=`lever`,token=`XXX`
     - `jobs.ashbyhq.com/XXX` → ats=`ashby`,token=`XXX`
  2. 用编辑器打开 `ingest\companies.mjs`,改那行的 token(或加一行);
  3. 重跑 `node ingest/run.mjs`。

## 步骤 4 · 本地预览(可选,建议看一眼)
```powershell
npm run dev
```
浏览器开 http://localhost:3000 。看完回 PowerShell 按 `Ctrl + C` 停止。

---

## 步骤 5 · 设置 Git 身份(只需一次,用化名保持匿名)
```powershell
git config --global user.name "your-handle"
git config --global user.email "your-handle@users.noreply.github.com"
```

## 步骤 6 · 建本地仓库并提交第一版
```powershell
git init
git add .
git commit -m "init: AI infra jobs board"
```

## 步骤 7 · 登录 GitHub 并推送
先登录(交互式):
```powershell
gh auth login
```
依次选:**GitHub.com** → **HTTPS** → “Authenticate Git…?” 选 **Yes** → **Login with a web browser** → 复制屏幕上的一次性码(形如 `XXXX-XXXX`)→ 回车自动开浏览器 → 粘贴码 → 授权。

登录后,一条命令建私有仓库并推送:
```powershell
gh repo create aijobs --private --source=. --remote=origin --push
```
> 成功后运行 `gh repo view --web` 可在浏览器打开你的仓库。

## 步骤 8 · 打开 Actions 写权限(关键!否则每日自动刷新无法提交)
1. `gh repo view --web` 打开仓库;
2. 仓库的 **Settings** → 左侧 **Actions** → **General**;
3. 拉到底 **Workflow permissions** → 选 **Read and write permissions** → **Save**。

---

## 步骤 9 · 部署到 Vercel(网页操作)
1. 打开 https://vercel.com → 点 **Continue with GitHub** 登录授权;
2. 进 dashboard → **Add New…** → **Project**;
3. 在 “Import Git Repository” 找到 **aijobs**;
   - 没看到就点 **Adjust GitHub App Permissions** → 授权 Vercel 访问该仓库 → 返回;
4. 点 aijobs 旁的 **Import**;
5. **Framework Preset** 会自动识别 **Next.js**(不用改);**Root Directory** 保持默认 `./`;
6. 展开 **Environment Variables**,加一条:
   - Name = `SITE_URL`
   - Value = 先填 `https://aijobs.vercel.app`(拿到真域名后再改)
   - 点 **Add**;
7. 点 **Deploy**,等 1–3 分钟;
8. 完成后点 **Visit** 看站(此时是临时网址 `xxx.vercel.app`)。
> 若部署失败(红色 Error),进部署详情把 **Build Logs** 报错贴给我,我来修(站还没在本机构建过,可能有小毛病)。

---

## 步骤 10 · 买域名 + 绑定(网页操作)
1. 在 **Namecheap** 或 **Cloudflare** 买一个 `.com`(约 $10–12/年);
2. 回 Vercel → 你的项目 → **Settings** → **Domains**;
3. 输入你买的域名(如 `aiinfrajobs.com`)→ **Add**;
4. Vercel 显示要配的 DNS(通常二选一,按它显示的那种做):
   - **A 记录**:把域名的 A 记录指向 `76.76.21.21`;或
   - **Nameservers**:把域名商处的 nameserver 改成 Vercel 给的两个;
   去**域名商后台的 DNS 设置**里照填;
5. 等 DNS 生效(几分钟~几小时;Vercel 域名旁出现绿勾即成功);
6. 改环境变量为真域名:**Settings → Environment Variables** → 编辑 `SITE_URL` 为 `https://你的域名` → **Save**;
7. 重新部署生效:**Deployments** → 最新一条右侧 **⋯** → **Redeploy** → 确认。

---

## 步骤 11 · 确认每日自动刷新
仓库已含 `.github/workflows/ingest.yml`:每天 06:00 UTC 自动重抓岗位 → 提交 → 触发 Vercel 重新部署。
- 手动测一次:仓库 → **Actions** 标签 → 左侧 **ingest** → 右侧 **Run workflow** → **Run workflow**;
- 跑完看仓库是否多了一条 “chore: refresh jobs feed” 提交,Vercel 是否自动重新部署。
> 若 Actions 标签提示需要启用,点启用即可。

---

## 步骤 12 · Google Search Console(= 验证时钟起点,最重要)
1. 打开 https://search.google.com/search-console ;
2. 左上 **Add property** → 选左边的 **Domain** → 输入你的域名 → **Continue**;
3. 它给一条 **TXT 记录**;去**域名商 DNS 设置**加这条(类型 `TXT`,host/name 填 `@` 或留空,value 粘贴它给的字符串)→ 保存;
4. 回 Search Console 点 **Verify**(DNS 生效后才过,可能等几分钟~几小时);
5. 通过后:左侧 **Sitemaps** → 输入 `sitemap.xml` → **Submit**。

---

## 步骤 13 · 之后看什么(接下来几周,这才是真正的测试)
- 每隔几天看 Search Console → **Performance** → **Impressions(曝光)** 是否随时间上涨、哪些搜索词带来曝光;
- **过线信号(约 8–12 周内)**:niche 词(如 “gpu engineer jobs”)曝光持续上升 + 开始有点击 → 加更多公司、加分类页、上变现(雇主自助付费发帖);
- **不过线(8–12 周仍近 0)**:换 niche —— 编辑 `ingest\niche.config.mjs`(关键词)+ `ingest\companies.mjs`(公司),重跑重提交。引擎复用,成本几乎为零。

---

## 附:以后加公司 / 更新岗位(日常)
```powershell
cd D:\n_w\product\jobboard
node ingest/run.mjs
git add data/jobs.json ingest/companies.mjs
git commit -m "update companies/jobs"
git push
```
推送后 Vercel 自动重新部署。(GitHub Action 每天也会自动做这件事。)
