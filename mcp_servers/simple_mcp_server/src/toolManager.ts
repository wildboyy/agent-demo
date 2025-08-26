import { MCPTool, MCPToolResult, MCPToolRequest, MCPToolResponse } from './types'

export class MCPToolManager {
  private tools: Map<string, MCPTool> = new Map()
  private toolHandlers: Map<string, Function> = new Map()

  constructor() {
    this.initializeDefaultTools()
  }

  // 初始化默认工具
  private initializeDefaultTools() {
    // 注册 list_tools 工具
    this.registerTool({
      name: 'list_tools',
      description: '列出该 MCP 服务器提供的所有工具',
      parameters: {},
      examples: [
        '调用 list_tools 来查看可用的工具列表'
      ]
    }, async () => {
      // 只返回可用的工具列表，不包含 list_tools 本身
      const availableTools = Array.from(this.tools.values())
        .filter(tool => tool.name !== 'list_tools')
        .map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          examples: tool.examples
        }))
      
      return {
        tools: availableTools,
        count: availableTools.length
      }
    })

    // 注册 test_tool 工具（原 tool1）
    this.registerTool({
      name: 'test_tool',
      description: '测试工具，不需要参数，返回成功消息',
      parameters: {},
      examples: [
        '调用 test_tool 来测试工具执行'
      ]
    }, async () => {
      return {
        message: 'test_tool 调用成功！这是一个测试工具。',
        timestamp: new Date().toISOString(),
        randomValue: Math.random()
      }
    })

    // 注册查询余额工具
    this.registerTool({
      name: 'query_balance',
      description: '查询余额',
      parameters: {},
      examples: [
        '调用 query_balance 来查看当前余额'
      ]
    }, async () => {
      return {
        message: '余额查询成功！剩余 10012 元',
        timestamp: new Date().toISOString(),
        status: 'success'
      }
    })

    console.log('✅ MCP 工具初始化完成')
  }

  // 注册工具
  registerTool(tool: MCPTool, handler: Function) {
    this.tools.set(tool.name, tool)
    this.toolHandlers.set(tool.name, handler)
    console.log(`🔧 工具已注册: ${tool.name}`)
  }

  // 获取工具列表
  getTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  // 获取特定工具
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name)
  }

  // 获取服务器信息
  getServerInfo() {
    return {
      name: 'Simple MCP Server',
      version: '1.0.0',
      description: '一个简单的 MCP 服务器，提供基础工具调用功能',
      capabilities: [
        'tool_registration',
        'tool_execution',
        'dynamic_tool_loading'
      ],
      tools: this.getTools()
    }
  }

  // 执行工具
  async executeTool(request: MCPToolRequest): Promise<MCPToolResponse> {
    const startTime = Date.now()
    
    try {
      const { toolName, arguments: args = {} } = request
      
      // 检查工具是否存在
      const tool = this.tools.get(toolName)
      if (!tool) {
        return {
          success: false,
          error: `工具未找到: ${toolName}`
        }
      }

      // 验证参数
      const validationResult = this.validateToolArguments(tool, args)
      if (!validationResult.valid) {
        return {
          success: false,
          error: `参数验证失败: ${validationResult.error}`
        }
      }

      // 获取工具处理器
      const handler = this.toolHandlers.get(toolName)
      if (!handler) {
        return {
          success: false,
          error: `工具处理器未找到: ${toolName}`
        }
      }

      // 执行工具
      const result = await handler(args)
      
      const executionTime = Date.now() - startTime
      
      return {
        success: true,
        result: {
          success: true,
          data: result,
          executionTime,
          timestamp: new Date().toISOString()
        }
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        result: {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          executionTime,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // 验证工具参数
  private validateToolArguments(tool: MCPTool, args: Record<string, any>) {
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      // 检查必需参数
      if (paramDef.required && !(paramName in args)) {
        return {
          valid: false,
          error: `必需参数缺失: ${paramName}`
        }
      }

      // 检查参数类型
      if (paramName in args) {
        const value = args[paramName]
        if (!this.validateParameterType(value, paramDef.type)) {
          return {
            valid: false,
            error: `参数类型错误: ${paramName} 应该是 ${paramDef.type} 类型`
          }
        }
      }
    }

    return { valid: true }
  }

  // 验证参数类型
  private validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      default:
        return true
    }
  }

  // 获取工具统计信息
  getToolStats() {
    return {
      totalTools: this.tools.size,
      toolNames: Array.from(this.tools.keys()),
      registeredTools: this.getTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        parameterCount: Object.keys(tool.parameters).length
      }))
    }
  }
}
