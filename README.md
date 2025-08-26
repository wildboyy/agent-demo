# AI Agent 应用

一个基于 React + Node.js 的智能 AI 助手应用，支持多种 AI 模型和 MCP (Model Context Protocol) 工具集成。

## 🚀 项目简介

本项目是一个功能完整的 AI 助手应用，具有以下特性：

- **多 AI 模型支持**：支持 DeepSeek、OpenAI、Anthropic、Cursor AI 等主流 AI 服务
- **MCP 工具集成**：支持 Model Context Protocol，可动态接入外部工具服务
- **智能对话**：AI 能够自动识别用户需求并调用相应工具
- **实时工具执行**：支持工具调用后的智能回复和上下文管理
- **现代化 UI**：基于 React 18 + TypeScript + Tailwind CSS 构建

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式框架
- React Context API 状态管理

### 后端
- Node.js + Express
- TypeScript
- MCP 协议支持
- 多 AI 服务集成

## 📋 环境要求

- Node.js 18+ 
- npm 或 yarn
- 现代浏览器（支持 ES6+）

## ⚙️ 环境配置

### 1. 克隆项目
```bash
git clone <repository-url>
cd agent-demo
```

### 2. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 3. 环境变量配置

#### 后端环境变量 (`server.env`)
```bash
# 复制示例配置文件
cp server.env.example server.env

# 编辑配置文件，填入您的 API 密钥
nano server.env  # 或使用您喜欢的编辑器
```

**重要提示**：`server.env` 文件包含敏感信息，已被添加到 `.gitignore` 中，不会被提交到版本控制。

#### 前端环境变量 (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:8787
```

## 🚀 项目启动

### 方式一：分别启动（推荐开发时使用）

#### 启动后端服务器
```bash
# 在项目根目录
npm run start:server:env

# 或者进入 server 目录
cd server
npm run dev:server
```

#### 启动前端开发服务器
```bash
# 在项目根目录
npm run dev
```

### 方式二：一键启动（生产环境）
```bash
# 同时启动前后端（需要先安装 concurrently）
npm install -g concurrently
npm run start:all
```

### 访问地址
- 前端应用：http://localhost:3000
- 后端 API：http://localhost:8787
- 健康检查：http://localhost:8787/health

## 🤖 AI 配置说明

### 支持的 AI 服务

#### 1. DeepSeek（推荐）
- 支持 Function Calling
- 响应速度快
- 中文支持良好

#### 2. OpenAI
- 支持 GPT-4、GPT-3.5
- 功能完整
- 需要科学上网

#### 3. Anthropic
- 支持 Claude 系列模型
- 安全性高
- 需要科学上网

#### 4. Cursor AI
- 代码生成能力强
- 支持多种编程语言

### AI 配置步骤

1. **获取 API Key**：从相应服务商获取 API 密钥
2. **配置环境变量**：在 `server.env` 中设置对应的 API 密钥
3. **选择默认模型**：在 `server.env` 中设置 `AI_PROVIDER`
4. **重启服务**：重启后端服务器使配置生效

## 🔧 MCP 接入说明

### 什么是 MCP？

MCP (Model Context Protocol) 是一个标准化的协议，允许 AI 模型与外部工具和服务进行交互。

### MCP 服务器结构

项目包含一个示例 MCP 服务器 (`mcp_servers/simple_mcp_server`)，提供以下工具：

- **test_tool**：测试工具，返回成功消息
- **query_balance**：余额查询工具，返回固定余额
- **list_tools**：工具列表查询

### 添加新的 MCP 工具

#### 1. 在 MCP 服务器中添加工具
```typescript
// 在 toolManager.ts 中注册新工具
this.registerTool({
  name: 'new_tool',
  description: '新工具描述',
  parameters: {},
  examples: ['使用示例']
}, async () => {
  // 工具执行逻辑
  return {
    message: '工具执行结果',
    timestamp: new Date().toISOString()
  }
})
```

#### 2. 添加路由
```typescript
// 在 index.ts 中添加直接调用路由
app.get('/new_tool', async (req, res) => {
  try {
    const result = await toolManager.executeTool({
      toolName: 'new_tool',
      arguments: {}
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: '工具执行失败' })
  }
})
```

#### 3. 在主应用中连接 MCP 服务器
1. 启动 MCP 服务器
2. 在主应用前端添加 MCP 连接
3. 输入 MCP 服务器地址（如：http://localhost:3001）
4. 系统自动发现可用工具

### MCP 工具开发规范

- **工具名称**：使用英文，符合 `^[a-zA-Z0-9_-]+$` 正则
- **参数定义**：明确定义参数类型和是否必需
- **返回格式**：返回结构化的 JSON 数据
- **错误处理**：提供清晰的错误信息
- **日志记录**：记录工具执行过程

## 📱 使用说明

### 基本对话
1. 在聊天框中输入问题
2. AI 自动分析并调用相应工具
3. 查看工具执行结果和 AI 回复

### 工具管理
1. 在侧边栏查看已连接的 MCP 服务
2. 添加新的 MCP 服务器连接
3. 管理工具连接状态

### 设置配置
1. 调整 AI 模型参数（温度、最大令牌数）
2. 配置系统提示词
3. 管理 MCP 连接

## 🔍 故障排除

### 常见问题

#### 1. 前端无法连接后端
- 检查后端服务是否启动
- 确认端口 8787 是否被占用
- 检查 Vite 代理配置

#### 2. AI 服务调用失败
- 验证 API 密钥是否正确
- 检查网络连接
- 确认 API 服务是否可用

#### 3. MCP 工具无法执行
- 检查 MCP 服务器是否启动
- 验证工具名称和参数
- 查看服务器日志

### 日志查看
```bash
# 后端日志
tail -f server/server.log

# MCP 服务器日志
cd mcp_servers/simple_mcp_server
tail -f server.log
```

## 📚 开发指南

### 项目结构
```
agent-demo/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── contexts/          # React Context
│   ├── services/          # 服务层
│   └── types/             # TypeScript 类型定义
├── server/                 # 后端源代码
│   ├── index.ts           # 主服务器文件
│   ├── config.ts          # 配置管理
│   └── mcpStorage.ts      # MCP 连接管理
├── mcp_servers/           # MCP 服务器示例
│   └── simple_mcp_server/ # 简单 MCP 服务器
└── package.json           # 项目配置
```

### 添加新功能
1. 在前端添加新的 React 组件
2. 在后端添加新的 API 端点
3. 更新类型定义
4. 测试功能完整性

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发起 Pull Request
- 发送邮件至：[your-email@example.com]

---

**注意**：使用前请确保已正确配置所有必要的环境变量和 API 密钥。