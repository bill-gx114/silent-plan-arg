# 寂静计划 ARG

都市悬疑 ARG《寂静计划》的静态网页项目。新版第一章将原有线性密码链重构为三个相互验证的调查站点：

- 在线游玩：https://bill-gx114.github.io/silent-plan-arg/
- GitHub：https://github.com/bill-gx114/silent-plan-arg

- 林知秋的个人博客
- Echo Technologies 企业官网
- `legacy.echo-mirror` 废弃档案镜像

玩家通过文本修订、图片与时间线、网页版本考古、请求日志和双声道音频取证，建立证据结论并解锁三种结局。

## 本地运行

```bash
npm run build
npm run serve
```

打开 `http://localhost:4173/`。

## 测试

```bash
npm test
```

## 目录

- `src/`：新版第一章源码
- `assets-source/`：可重复生成的证据源文件
- `scripts/`：构建、资产生成与本地服务器
- `tests/`：Node 内置测试套件
- `chapter1/`、`chapter2/`、`chapter3/`：原版章节，保留作为历史参考
- `docs/`：设计、实施计划与部署说明

## Design documentation

- [ARG page design system](docs/superpowers/specs/2026-06-12-arg-page-design-system.md)

## 游玩提示

新版第一章电脑优先。手机可以阅读全部剧情，并提供降低沉浸感的兼容取证路径。
