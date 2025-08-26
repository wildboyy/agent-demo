import { Message, ChatSettings } from '../types'

export interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface AIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AIToolResult {
  tool_call_id: string
  role: 'tool'
  content: string
}

export interface AIServiceResponse {
  content: string
  tool_calls?: AIToolCall[]
  tool_results?: Array<{
    tool_call_id: string
    role: string
    content: string
  }>
}

export class AIService {
  private baseUrl: string

  constructor() {
    // 使用相对路径，通过 Vite 代理转发到后端
    this.baseUrl = ''
  }

  async chat(
    messages: Message[],
    settings: ChatSettings,
    tools?: AITool[]
  ): Promise<AIServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          settings,
          tools, // 添加工具信息
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        content: data.content || '',
        tool_calls: data.tool_calls || undefined,
      }
    } catch (error) {
      console.error('AI 服务调用失败:', error)
      throw error
    }
  }

  // 执行工具调用
  async executeTool(toolCall: AIToolCall): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        }),
      })

      if (!response.ok) {
        throw new Error(`工具执行失败! status: ${response.status}`)
      }

      const data = await response.json()
      return data.result || '工具执行成功'
    } catch (error) {
      console.error('工具执行失败:', error)
      return `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

export const aiService = new AIService()
