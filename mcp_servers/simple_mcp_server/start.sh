#!/bin/bash

# Simple MCP Server 启动脚本

echo "🚀 启动 Simple MCP Server..."

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "🔨 构建项目..."
    npm run build
fi

# 启动服务器
echo "🌟 启动服务器..."
npm start
