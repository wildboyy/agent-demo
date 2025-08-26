# Simple MCP Server

一个简单的 MCP (Model Context Protocol) 服务器，提供基础的工具调用功能。

## 🚀 功能特性

- **工具管理**：动态注册和管理 MCP 工具
- **参数验证**：自动验证工具参数类型和必需性
- **错误处理**：完善的错误处理和响应
- **RESTful API**：提供标准的 HTTP API 接口
- **CORS 支持**：支持跨域请求

## 📋 可用工具

### 1. `list_tools`
- **描述**：列出该 MCP 服务器提供的所有工具
- **参数**：无
- **返回**：工具列表和服务器信息

### 2. `tool1`
- **描述**：示例工具1，不需要参数，返回成功消息
- **参数**：无
- **返回**：成功消息和时间戳

## 🛠️ 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```

### 3. 生产模式运行
```bash
npm run build
npm start
```

### 4. 使用启动脚本
```bash
chmod +x start.sh
./start.sh
```

## 🌐 API 端点

### 基础端点
- `GET /health` - 健康检查
- `GET /info` - 服务器信息
- `GET /tools` - 工具列表
- `GET /stats` - 统计信息

### 工具端点
- `GET /list_tools` - 直接调用 list_tools 工具
- `GET /tool1` - 直接调用 tool1 工具
- `POST /execute` - 执行指定工具

### 工具信息
- `GET /tools/:toolName` - 获取特定工具信息

## 📡 使用示例

### 1. 查看工具列表
```bash
curl http://localhost:3001/list_tools
```

### 2. 调用 tool1 工具
```bash
curl http://localhost:3001/tool1
```

### 3. 通过 execute 端点调用工具
```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{"toolName":"tool1"}'
```

### 4. 获取服务器信息
```bash
curl http://localhost:3001/info
```

### 5. 查看统计信息
```bash
curl http://localhost:3001/stats
```

## ⚙️ 配置

通过环境变量或 `config.env` 文件配置：

```bash
PORT=3001          # 服务器端口
HOST=localhost     # 服务器主机
LOG_LEVEL=info     # 日志级别
DEBUG=false        # 调试模式
```

## 🔧 扩展工具

### 添加新工具

1. 在 `toolManager.ts` 中注册工具：
```typescript
this.registerTool({
  name: 'new_tool',
  description: '新工具描述',
  parameters: {
    param1: { type: 'string', description: '参数1', required: true }
  }
}, async (args) => {
  // 工具逻辑
  return { result: 'success' }
})
```

2. 工具会自动添加到 API 中

### 工具参数类型

支持以下参数类型：
- `string` - 字符串
- `number` - 数字
- `boolean` - 布尔值
- `array` - 数组
- `object` - 对象

## 📊 响应格式

### 成功响应
```json
{
  "success": true,
  "result": {
    "success": true,
    "data": {...},
    "executionTime": 123,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "result": {
    "success": false,
    "error": "错误描述",
    "executionTime": 123,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   - 修改 `config.env` 中的 `PORT` 值
   - 或使用环境变量：`PORT=3002 npm start`

2. **依赖安装失败**
   - 清除 node_modules：`rm -rf node_modules && npm install`
   - 检查 Node.js 版本：需要 16+ 版本

3. **构建失败**
   - 检查 TypeScript 配置
   - 清理构建目录：`npm run clean && npm run build`

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
