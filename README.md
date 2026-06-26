# 商情管理系统

PC 端单角色商情管理系统，本地全栈部署版本。

## 技术栈

- 前端：React + Vite + TypeScript
- 后端：Node.js + Express
- 数据：SQL.js SQLite，本地持久化到 `server/data/business.sqlite`
- 图表：Recharts

## 本地启动

```bash
npm install
npm run dev
```

启动后访问：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:3001/api/health

## 常用命令

```bash
npm test
npm run build
npm start
```

## GitHub 仓库

目标远程仓库：

```text
https://github.com/zhaozhiyue1987/test01.git
```

如需手动推送：

```bash
git remote add origin https://github.com/zhaozhiyue1987/test01.git
git branch -M main
git push -u origin main
```

## 数据说明

首次启动后端会自动创建 SQLite 文件并写入示例客户、商情、费用、联系人和走访数据。`server/data/*.sqlite` 已加入 `.gitignore`，不会提交到 GitHub。
