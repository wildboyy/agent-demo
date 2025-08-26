export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  tools?: ToolCall[]
  tool_calls?: any[] // AI 助手的工具调用
  tool_call_id?: string // 工具消息的工具调用 ID
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
}

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: string
    required: boolean
    default?: any
  }>
  examples?: string[] // 添加示例字段
}

export interface MCPConnection {
  id: string
  name: string
  description: string
  tools: MCPTool[]
  url?: string // 添加 URL 字段
  lastSync?: string // 最后同步时间
}

// 新增：MCP 工具发现响应
export interface MCPToolsDiscoveryResponse {
  success: boolean
  result?: {
    success: boolean
    data: {
      tools: MCPTool[]
      count: number
    }
    executionTime: number
    timestamp: string
  }
  error?: string
}

// 新增：MCP 连接请求
export interface MCPConnectionRequest {
  name: string
  description: string
  url: string
}

export interface SystemPrompt {
  id: string
  name: string
  content: string
  isActive: boolean
}

export interface ChatSettings {
  model: string
  temperature: number
  max_tokens: number
}
