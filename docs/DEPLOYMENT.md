# 部署说明

## GitHub Pages

仓库使用 `.github/workflows/pages.yml` 构建并发布 `dist/`。

推送到 `main` 后，工作流会：

1. 检出仓库。
2. 使用 Node.js 24。
3. 运行 `npm run build` 和 `npm test`。
4. 上传 `dist/` 为 Pages 产物。

## 飞书妙搭

三个站点可分别发布：

```bash
lark-cli auth login --domain apps
lark-cli apps +create --name "看见缝隙的人" --app-type HTML --as user
lark-cli apps +create --name "Echo Technologies" --app-type HTML --as user
lark-cli apps +create --name "legacy.echo-mirror" --app-type HTML --as user
```

独立发布前，需要为每个站点复制 `shared/` 目录，并把 `src/shared/config.js` 中的跨站地址替换为三个妙搭应用的正式 URL。不要把 `.env`、Git 元数据、测试答案或设计文档打包到发布目录。

