# GitHub Pages 部署说明

## 仓库名称

仓库必须命名为：

```bash
huangguotai-portfolio
```

## GitHub Pages 设置

进入 GitHub 仓库后设置：

```text
Settings -> Pages -> Source -> GitHub Actions
```

不要选择 `gh-pages` 分支部署。

## 首次上传

在项目根目录执行：

```bash
git init
git branch -M main
git add .
git commit -m "Initial portfolio website"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/huangguotai-portfolio.git
git push -u origin main
```

推送到 `main` 后，GitHub Actions 会自动运行：

```bash
pnpm install --frozen-lockfile
pnpm run build:pages
```

并将 `dist/` 部署到 GitHub Pages。

## 后续更新

每次修改网站后：

```bash
git add .
git commit -m "Update portfolio website"
git push
```

GitHub Actions 会自动重新构建和部署。

## 预期访问地址

```text
https://YOUR_GITHUB_USERNAME.github.io/huangguotai-portfolio/
```

## 公开仓库安全提醒

GitHub Pages 是公开网站。不要提交以下内容：

- PSD / CLIP 源文件
- review ZIP 压缩包
- 临时导出文件
- 未公开的个人资料
- 密码、Token、账号凭据

当前 `.gitignore` 已忽略常见 review 包、PSD、CLIP、`node_modules/` 和 `dist/`。
