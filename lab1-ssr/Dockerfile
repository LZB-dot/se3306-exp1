# CloudBase 云托管部署用镜像定义（任务二 SSR：需要常驻 Node 服务）
# 说明：本文件仅为「云托管从代码包部署」提供构建入口，本地开发不需要它。
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js ./

# 云托管要求容器监听指定端口；server.js 读取 process.env.PORT，默认 3000
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
