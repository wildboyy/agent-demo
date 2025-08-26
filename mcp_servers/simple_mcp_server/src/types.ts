// MCP 工具参数类型
export type MCPParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object'

// MCP 工具参数定义
export interface MCPParameter {
  type: MCPParameterType
  description: string
  required: boolean
  default?: any
  enum?: any[]
}

// MCP 工具定义
export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, MCPParameter>
  examples?: string[]
}

// MCP 工具执行结果
export interface MCPToolResult {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  timestamp: string
}

// MCP 服务器信息
export interface MCPServerInfo {
  name: string
  version: string
  description: string
  capabilities: string[]
  tools: MCPTool[]
}

// MCP 工具执行请求
export interface MCPToolRequest {
  toolName: string
  arguments?: Record<string, any>
}

// MCP 工具执行响应
export interface MCPToolResponse {
  success: boolean
  result?: MCPToolResult
  error?: string
}
