FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src ./src

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动服务
CMD ["node", "src/server.js"]

