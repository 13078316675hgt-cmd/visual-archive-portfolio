# 作品集网站素材维护指南

网站页面框架已锁定。日常更新作品时，优先更换素材和清单数据，不重新设计页面。

## 公开素材替换

1. 将确认上站的图片放入 `public/assets/approved/`。
2. 在 `src/data/artworkManifest.js` 中更新对应角色的 `filename`、`src`、`resolution`、`alt` 和 `sourcePath`。
3. 如果图片也用于 Contents，同步检查 `objectPosition`、`scale`、`hoverScale` 和 `transformOrigin`。
4. 高分辨率原图优先；不用低清或过度裁切文件覆盖技术设定图。

## 素材联动关系

- `heroPrimary`：Hero Artwork I、Character Breakdown、Contents 01–02。
- `heroSecondary`：Hero Artwork II、Contents 05。
- `characterSheets[2]`：Character Sheet 03、Costume Detail、Contents 04。
- `portraits[0]`：Portrait Studies、Contents 06。
- `titleBackground`：仅 Title 首屏。
- Resume 和 Contact 不使用图片素材。

## 新增作品的入库与上站流程

1. 新作品先进入 `source-assets/works-YYYY-MM/`。
2. 在 `src/data/worksLibrary.js` 添加元数据。
3. 明确归类：替换现有作品、新增公开作品、未来项目素材或仅归档。
4. 只将已确认上站的素材复制到 `public/assets/approved/`。
5. 仅在作品正式上站时更新 `artworkManifest.js`。
6. 依次运行：

   ```powershell
   pnpm run review:assets
   pnpm run build
   pnpm run review:package
   ```

`source-assets/` 是非公开源素材库，不得在页面 JSX 或公开样式中直接引用。
