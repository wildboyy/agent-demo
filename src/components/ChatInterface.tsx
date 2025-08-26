import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useMCP } from '../contexts/MCPContext'
import { useSystemPrompt } from '../contexts/SystemPromptContext'
import { AIService } from '../services/aiService'
import { AIToolCall, AIServiceResponse } from '../services/aiService'

const ChatInterface: React.FC = () => {
  const { state, dispatch } = useChat()
  const { state: mcpState } = useMCP()
  const { getActivePrompt, state: systemPromptState } = useSystemPrompt()
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExecutingTool, setIsExecutingTool] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 创建 AI 服务实例
  const aiService = new AIService()

  // 调试：显示系统提示词上下文状态
  useEffect(() => {
    console.log('🔍 ChatInterface 组件初始化 - 系统提示词状态:', {
      systemPromptState,
      activePrompt: getActivePrompt(),
      hasActivePrompt: !!getActivePrompt()
    })
  }, [systemPromptState, getActivePrompt])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  // 获取可用的工具
  const getAvailableTools = () => {
    const tools: any[] = []
    
    mcpState.connections.forEach((connection: any) => {
      if (connection.tools && Array.isArray(connection.tools)) {
        connection.tools.forEach((tool: any) => {
          const toolDefinition = {
            type: 'function' as const,
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters || {}
            }
          }
          tools.push(toolDefinition)
        })
      }
    })
    
    return tools
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userMessage.trim() || isLoading) return

    const userMessageText = userMessage.trim()
    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 添加用户消息
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: userMsgId,
        role: 'user',
        content: userMessageText,
        timestamp: new Date()
      }
    })

    // 清空输入框
    setUserMessage('')
    setIsLoading(true)

    try {
      // 获取可用工具
      const availableTools = getAvailableTools()
      
      // 获取当前激活的系统提示词
      const activePrompt = getActivePrompt()
      
      console.log('🔍 系统提示词状态:', {
        activePrompt,
        hasActivePrompt: !!activePrompt,
        promptContent: activePrompt?.content
      })
      
      // 构建消息数组，如果存在系统提示词则添加到开头
      let messagesToSend = state.messages.concat({
        id: userMsgId,
        role: 'user',
        content: userMessageText,
        timestamp: new Date()
      })
      
      // 如果有激活的系统提示词，添加到消息数组开头
      if (activePrompt) {
        console.log('📝 添加系统提示词到消息:', activePrompt.content)
        messagesToSend = [
          {
            id: `system_${Date.now()}`,
            role: 'system',
            content: activePrompt.content,
            timestamp: new Date()
          },
          ...messagesToSend
        ]
      } else {
        console.log('⚠️ 没有激活的系统提示词')
      }
      
      console.log('📤 发送给 AI 的消息数组:', messagesToSend)
      
      // 调用 AI 服务
      const aiResponse: AIServiceResponse = await aiService.chat(
        messagesToSend,
        state.settings,
        availableTools.length > 0 ? availableTools : undefined
      )

      // 添加 AI 回复消息
      const assistantMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: assistantMsgId,
          role: 'assistant',
          content: aiResponse.content || '',
          timestamp: new Date(),
          tool_calls: aiResponse.tool_calls || undefined
        }
      })

      // 如果有工具执行结果，直接添加到消息中
      if (aiResponse.tool_results && aiResponse.tool_results.length > 0) {
        console.log('🔄 检测到工具执行结果:', aiResponse.tool_results)

        for (const toolResult of aiResponse.tool_results) {
          // 添加工具执行结果消息
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              role: 'tool',
              content: toolResult.content,
              timestamp: new Date(),
              tool_call_id: toolResult.tool_call_id
            }
          })
        }
      }

    } catch (error) {
      console.error('❌ 聊天失败:', error)
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: `抱歉，我遇到了一些问题: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date()
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

     const clearChat = () => {
     dispatch({ type: 'CLEAR_CHAT' })
   }

  return (
    <div className="flex flex-col h-full">
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">欢迎使用 AI 助手！</p>
            <p className="text-sm mt-2">我可以帮助您解决各种问题，并且能够调用 MCP 工具来增强我的能力。</p>
            {mcpState.connections.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  🎯 检测到 {mcpState.connections.length} 个 MCP 服务连接，
                  我可以使用这些工具来帮助您！
                </p>
              </div>
            )}
          </div>
        ) : (
          state.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'tool'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? '您' : 
                   message.role === 'tool' ? '🔧 工具执行' : '🤖 AI 助手'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}
        
        {/* 加载状态 */}
        {(isLoading || isExecutingTool) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium mb-1">🤖 AI 助手</div>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">
                  {isExecutingTool ? '正在执行工具...' : '正在思考...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isExecutingTool}
          />
          <button
            type="submit"
            disabled={!userMessage.trim() || isLoading || isExecutingTool}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isExecutingTool ? '处理中...' : '发送'}
          </button>
          <button
            type="button"
            onClick={clearChat}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            清空
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface
