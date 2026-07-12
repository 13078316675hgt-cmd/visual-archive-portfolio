# GitHub Pages 自定义域名部署说明

生产仓库目标：`visual-archive-portfolio`  
生产域名：`https://www.marlsa.cc.cd/`

当前仓库只完成本地部署准备；尚未 push，也未公开部署。

## 生产构建

自定义域名从根路径提供网站，因此生产命令必须是：

```bash
pnpm install --frozen-lockfile
pnpm run review:assets
pnpm run build
```

生产 Vite base：`/`。GitHub Actions 通过公开环境值设置：

```text
VITE_PUBLIC_SITE_URL=https://www.marlsa.cc.cd/
```

`pnpm run build:pages` 只保留为 `/visual-archive-portfolio/` 仓库路径 fallback，不用于自定义域名生产部署。

## GitHub Pages

1. 获得授权后，把远程仓库重命名为 `visual-archive-portfolio` 并更新本地 origin。
2. 在 `Settings -> Pages` 中选择 `GitHub Actions`。
3. 在 Custom domain 中填写 `www.marlsa.cc.cd`。
4. GitHub Actions 使用 `.github/workflows/deploy-pages.yml` 上传 `./dist`。

项目没有 `CNAME` 文件。Actions 部署不依赖分支生成的 CNAME；域名通过仓库 Pages 设置维护。

## DNS 模板

```text
Type: CNAME
Host: www
Value: YOUR-GITHUB-USERNAME.github.io
TTL: Auto 或 300–600 秒
```

不要在 Value 中加入 `https://` 或 `/visual-archive-portfolio/`。GitHub 域名验证 TXT 值必须从 GitHub Profile Settings -> Pages 原样复制。

## 安全

不要提交 `.env`、Token、密码或账号凭据。生产域名是公开配置，不属于秘密。
