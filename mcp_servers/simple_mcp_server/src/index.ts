import express from 'express'
import cors from 'cors'
import { MCPToolManager } from './toolManager.js'
import { MCPToolRequest } from './types.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || 'localhost'

// 中间件
app.use(cors())
app.use(express.json())

// 创建工具管理器实例
const toolManager = new MCPToolManager()

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Simple MCP Server',
    version: '1.0.0'
  })
})

// 获取服务器信息
app.get('/info', (req, res) => {
  try {
    const serverInfo = toolManager.getServerInfo()
    res.json({
      success: true,
      data: serverInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取服务器信息失败'
    })
  }
})

// 获取工具列表
app.get('/tools', (req, res) => {
  try {
    const tools = toolManager.getTools()
    const stats = toolManager.getToolStats()
    
    res.json({
      success: true,
      data: {
        tools,
        stats,
        count: tools.length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取工具列表失败'
    })
  }
})

// 获取特定工具信息
app.get('/tools/:toolName', (req, res) => {
  try {
    const { toolName } = req.params
    const tool = toolManager.getTool(toolName)
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `工具未找到: ${toolName}`
      })
    }
    
    res.json({
      success: true,
      data: tool
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取工具信息失败'
    })
  }
})

// 执行工具
app.post('/execute', async (req, res) => {
  try {
    const request: MCPToolRequest = req.body
    
    if (!request.toolName) {
      return res.status(400).json({
        success: false,
        error: '工具名称不能为空'
      })
    }
    
    console.log(`🔧 执行工具: ${request.toolName}`, request.arguments || {})
    
    const result = await toolManager.executeTool(request)
    
    res.json(result)
  } catch (error) {
    console.error('执行工具失败:', error)
    res.status(500).json({
      success: false,
      error: '执行工具失败'
    })
  }
})

// 直接调用 list_tools 工具
app.get('/list_tools', async (req, res) => {
  try {
    const result = await toolManager.executeTool({
      toolName: 'list_tools',
      arguments: {}
    })
    
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '调用 list_tools 失败'
    })
  }
})

// 直接调用 test_tool 工具（原 tool1）
app.get('/test_tool', async (req, res) => {
  try {
    const result = await toolManager.executeTool({
      toolName: 'test_tool',
      arguments: {}
    })
    
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '调用 test_tool 失败'
    })
  }
})

// 直接调用查询余额工具
app.get('/query_balance', async (req, res) => {
  try {
    const result = await toolManager.executeTool({
      toolName: 'query_balance',
      arguments: {}
    })
    
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '调用查询余额失败'
    })
  }
})

// 工具统计信息
app.get('/stats', (req, res) => {
  try {
    const stats = toolManager.getToolStats()
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    })
  }
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '端点未找到',
    availableEndpoints: [
      'GET /health - 健康检查',
      'GET /info - 服务器信息',
      'GET /tools - 工具列表',
      'GET /tools/:toolName - 特定工具信息',
      'POST /execute - 执行工具',
      'GET /list_tools - 直接调用 list_tools',
      'GET /test_tool - 直接调用 test_tool',
      'GET /query_balance - 直接调用查询余额',
      'GET /stats - 统计信息'
    ]
  })
})

// 启动服务器
app.listen(PORT, HOST, () => {
  console.log('🚀 Simple MCP Server 启动成功!')
  console.log(`📍 地址: http://${HOST}:${PORT}`)
  console.log(`🔗 健康检查: http://${HOST}:${PORT}/health`)
  console.log(`📋 工具列表: http://${HOST}:${PORT}/tools`)
  console.log(`🔧 执行工具: http://${HOST}:${PORT}/execute`)
  console.log('')
  console.log('📚 可用的工具:')
  toolManager.getTools().forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`)
  })
  console.log('')
  console.log('💡 使用示例:')
  console.log(`  curl http://${HOST}:${PORT}/list_tools`)
  console.log(`  curl http://${HOST}:${PORT}/test_tool`)
  console.log(`  curl http://${HOST}:${PORT}/query_balance`)
  console.log(`  curl -X POST http://${HOST}:${PORT}/execute -H "Content-Type: application/json" -d '{"toolName":"test_tool"}'`)
})
