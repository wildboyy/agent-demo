import { MCPTool, MCPConnection } from '../src/types'

export interface MCPToolRegistry {
  [toolName: string]: {
    tool: MCPTool
    handler: Function
    metadata: {
      category: string
      version: string
      author: string
      lastUpdated: Date
    }
  }
}

export class MCPServiceManager {
  private toolRegistry: MCPToolRegistry = {}
  private connections: Map<string, MCPConnection> = new Map()
  private serviceMetadata = {
    name: 'MCP 服务管理器',
    version: '1.0.0',
    description: '动态 MCP 工具管理服务',
    capabilities: ['tool_registration', 'dynamic_loading', 'health_monitoring']
  }

  constructor() {
    this.initializeDefaultTools()
  }

  // 初始化默认工具
  private initializeDefaultTools() {
    // 创建默认连接（暂时不注册任何工具）
    this.createConnection('mcp_default', 'MCP 服务', 'MCP 工具管理服务')
    
    console.log('✅ MCP 工具初始化完成')
  }

  // 注册新工具
  registerTool(name: string, tool: MCPTool, handler: Function, metadata?: Partial<MCPToolRegistry[string]['metadata']>) {
    this.toolRegistry[name] = {
      tool,
      handler,
      metadata: {
        category: 'utility',
        version: '1.0.0',
        author: 'system',
        lastUpdated: new Date(),
        ...metadata
      }
    }
    console.log(`✅ 工具已注册: ${name}`)
  }

  // 创建连接
  createConnection(id: string, name: string, description: string): MCPConnection {
    const tools = Object.values(this.toolRegistry).map(item => item.tool)
    const connection: MCPConnection = {
      id,
      name,
      description,
      tools,
      isConnected: true
    }
    
    this.connections.set(id, connection)
    console.log(`✅ 连接已创建: ${name} (${tools.length} 个工具)`)
    return connection
  }

  // 获取所有工具
  getAllTools(): MCPTool[] {
    return Object.values(this.toolRegistry).map(item => item.tool)
  }

  // 获取所有连接
  getAllConnections(): MCPConnection[] {
    return Array.from(this.connections.values())
  }

  // 获取工具信息
  getToolInfo(name: string) {
    return this.toolRegistry[name]
  }

  // 执行工具
  async executeTool(name: string, args: any) {
    const toolInfo = this.toolRegistry[name]
    if (!toolInfo) {
      throw new Error(`工具未找到: ${name}`)
    }

    try {
      const result = await toolInfo.handler(args)
      return {
        success: true,
        tool: name,
        result,
        metadata: {
          executedAt: new Date(),
          executionTime: Date.now(),
          toolVersion: toolInfo.metadata.version
        }
      }
    } catch (error) {
      return {
        success: false,
        tool: name,
        error: error instanceof Error ? error.message : '未知错误',
        metadata: {
          executedAt: new Date(),
          executionTime: Date.now()
        }
      }
    }
  }

  // 获取服务状态
  getServiceStatus() {
    return {
      ...this.serviceMetadata,
      status: 'running',
      uptime: process.uptime(),
      tools: Object.keys(this.toolRegistry).length,
      connections: this.connections.size,
      timestamp: new Date().toISOString()
    }
  }

  // 健康检查
  healthCheck() {
    const toolHealth = Object.keys(this.toolRegistry).map(name => ({
      name,
      status: 'healthy',
      lastCheck: new Date()
    }))

    const connectionHealth = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      name: conn.name,
      status: conn.isConnected ? 'connected' : 'disconnected',
      toolCount: conn.tools.length
    }))

    return {
      status: 'healthy',
      tools: toolHealth,
      connections: connectionHealth,
      timestamp: new Date().toISOString()
    }
  }
}

export const mcpServiceManager = new MCPServiceManager()
