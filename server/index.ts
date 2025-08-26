import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { serverConfig, validateConfig, printConfig } from './config.js'
import { mcpStorageManager } from './mcpStorage.js'

interface AIResponse {
  content: string
  usage?: any
}

interface CursorResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: any
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: any
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: any
}

interface AnthropicResponse {
  content?: Array<{
    text?: string
  }>
  usage?: any
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// 验证配置
validateConfig()

// 调用AI服务的通用函数
async function callAIService(messages: any[], settings: any): Promise<AIResponse> {
  const provider = serverConfig.ai.provider
  
  if (provider === 'cursor') {
    return await callCursorAPI(messages, settings)
  } else if (provider === 'deepseek') {
    return await callDeepSeekAPI(messages, settings)
  } else if (provider === 'openai') {
    return await callOpenAIAPI(messages, settings)
  } else if (provider === 'anthropic') {
    return await callAnthropicAPI(messages, settings)
  } else {
    throw new Error(`不支持的AI提供商: ${provider}`)
  }
}

// 调用 Cursor AI API
async function callCursorAPI(messages: any[], settings: any): Promise<AIResponse> {
  const { apiKey, apiUrl } = serverConfig.ai.cursor
  
  if (!apiKey) {
    throw new Error('Cursor AI API Key 未配置')
  }
  
  const payload = {
    model: settings?.model || 'claude-3.5-sonnet',
    temperature: settings?.temperature ?? 0.7,
    max_tokens: settings?.maxTokens ?? 1000,
    messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
  }
  
  // 尝试不同的 API 端点
  let response
  let success = false
  
  const endpoints = [
    '/chat/completions',
    '/v1/chat/completions', 
    '/completions',
    '/chat',
    '/v1/completions',
    '/api/chat/completions',
    '/api/completions'
  ]
  
  const requestFormats = [
    { messages: payload.messages, model: payload.model, temperature: payload.temperature, max_tokens: payload.max_tokens },
    { prompt: payload.messages.map(m => `${m.role}: ${m.content}`).join('\n'), model: payload.model, temperature: payload.temperature, max_tokens: payload.max_tokens },
    { input: payload.messages[payload.messages.length - 1].content, model: payload.model, temperature: payload.temperature, max_tokens: payload.max_tokens }
  ]
  
  for (const ep of endpoints) {
    if (success) break
    
    for (const format of requestFormats) {
      try {
        response = await fetch(`${apiUrl}${ep}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(format)
        })
        
        if (response.ok) {
          success = true
          break
        }
      } catch (e) {
        // 继续尝试下一个端点
      }
    }
  }
  
  if (!success) {
    return await simulateCursorAIResponse(messages, settings)
  }
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cursor AI API 请求失败: ${response.status} - ${text}`)
  }
  
  const data = await response.json() as CursorResponse
  
  return {
    content: data?.choices?.[0]?.message?.content || '',
    usage: data?.usage
  }
}

// 模拟 Cursor AI 响应
async function simulateCursorAIResponse(messages: any[], settings: any): Promise<AIResponse> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  const lastMessage = messages[messages.length - 1]?.content || ''
  let response = ''
  
  if (lastMessage.toLowerCase().includes('你好') || lastMessage.toLowerCase().includes('hello')) {
    response = '你好！我是 Cursor AI 助手，很高兴为您服务。我可以帮助您解决各种问题，包括编程、写作、分析等。请告诉我您需要什么帮助。'
  } else if (lastMessage.toLowerCase().includes('编程') || lastMessage.toLowerCase().includes('code')) {
    response = '我很乐意帮助您解决编程问题！作为 Cursor AI，我在编程方面特别擅长。请告诉我您使用的编程语言、遇到的具体问题，或者需要实现的功能。我会提供详细的代码示例和解决方案。'
  } else if (lastMessage.toLowerCase().includes('工具') || lastMessage.toLowerCase().includes('tool')) {
    response = '我理解您想要使用工具。目前我支持多种 MCP 工具，包括文件操作、网络请求、数据分析等。请告诉我您具体需要什么帮助，我会选择合适的工具来协助您。'
  } else if (lastMessage.toLowerCase().includes('cursor')) {
    response = '是的，我是 Cursor AI！我是专门为编程和开发任务优化的 AI 助手。我可以帮助您编写代码、调试问题、解释概念，以及完成各种开发相关的任务。有什么我可以帮助您的吗？'
  } else {
    response = `我收到了您的消息："${lastMessage}"。这是一个模拟的 Cursor AI 响应，因为实际的 Cursor AI API 暂时不可用。\n\n当前使用的模型：${settings.model}\n温度设置：${settings.temperature}\n最大令牌数：${settings.maxTokens}\n\n在实际应用中，这里会调用真实的 Cursor AI 模型来生成回复。`
  }
  
  return {
    content: response,
    usage: {
      prompt_tokens: lastMessage.length,
      completion_tokens: response.length,
      total_tokens: lastMessage.length + response.length
    }
  }
}

// 调用 DeepSeek API
async function callDeepSeekAPI(messages: any[], settings: any): Promise<AIResponse> {
  const { apiKey, apiUrl } = serverConfig.ai.deepseek
  
  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置')
  }
  
  const payload = {
    model: settings?.model || 'deepseek-chat',
    temperature: settings?.temperature ?? 0.7,
    max_tokens: settings?.maxTokens ?? 1000,
    messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
  }
  
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DeepSeek API 请求失败: ${response.status} - ${text}`)
  }
  
  const data = await response.json() as DeepSeekResponse
  
  return {
    content: data?.choices?.[0]?.message?.content || '',
    usage: data?.usage
  }
}

// 调用 OpenAI API
async function callOpenAIAPI(messages: any[], settings: any): Promise<AIResponse> {
  const { apiKey, apiUrl } = serverConfig.ai.openai
  
  if (!apiKey) {
    throw new Error('OpenAI API Key 未配置')
  }
  
  const payload = {
    model: settings?.model || 'gpt-3.5-turbo',
    temperature: settings?.temperature ?? 0.7,
    max_tokens: settings?.maxTokens ?? 1000,
    messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
  }
  
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API 请求失败: ${response.status} - ${text}`)
  }
  
  const data = await response.json() as OpenAIResponse
  
  return {
    content: data?.choices?.[0]?.message?.content || '',
    usage: data?.usage
  }
}

// 调用 Anthropic API
async function callAnthropicAPI(messages: any[], settings: any): Promise<AIResponse> {
  const { apiKey, apiUrl } = serverConfig.ai.anthropic
  
  if (!apiKey) {
    throw new Error('Anthropic API Key 未配置')
  }
  
  const payload = {
    model: settings?.model || 'claude-3-sonnet-20240229',
    max_tokens: settings?.maxTokens ?? 1000,
    messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
  }
  
  const response = await fetch(`${apiUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API 请求失败: ${response.status} - ${text}`)
  }
  
  const data = await response.json() as AnthropicResponse
  
  return {
    content: data?.content?.[0]?.text || '',
    usage: data?.usage
  }
}

// 获取所有 MCP 连接配置
app.get('/api/mcp/connections', async (req, res) => {
  try {
    const storedConnections = mcpStorageManager.getAllConnections()
    
    // 为每个存储的连接重新发现工具
    const fullConnections = await Promise.all(
      storedConnections.map(async (storedConn) => {
        try {
          const listToolsUrl = `${storedConn.url.replace(/\/$/, '')}/list_tools`
          console.log(`🔄 重新发现工具: ${listToolsUrl}`)
          
          const response = await fetch(listToolsUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AgentServer/1.0'
            },
            signal: AbortSignal.timeout(10000)
          })

          if (response.ok) {
            const data = await response.json() as any
            if (data.success && data.result?.success && data.result.data?.tools) {
              return {
                ...storedConn,
                tools: data.result.data.tools,
                lastSync: new Date().toISOString()
              }
            }
          }
          
          // 如果无法获取工具，返回基本信息
          return {
            ...storedConn,
            tools: [],
            lastSync: null
          }
        } catch (error) {
          console.error(`❌ 重新发现工具失败 (${storedConn.url}):`, error)
          return {
            ...storedConn,
            tools: [],
            lastSync: null
          }
        }
      })
    )

    res.json({
      success: true,
      data: fullConnections,
      count: fullConnections.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取 MCP 连接失败'
    })
  }
})

// 获取特定 MCP 连接
app.get('/api/mcp/connections/:id', async (req, res) => {
  try {
    const { id } = req.params
    const storedConnection = mcpStorageManager.getConnection(id)
    
    if (!storedConnection) {
      return res.status(404).json({
        success: false,
        error: '连接未找到'
      })
    }

    // 重新发现工具
    try {
      const listToolsUrl = `${storedConnection.url.replace(/\/$/, '')}/list_tools`
      const response = await fetch(listToolsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentServer/1.0'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json() as any
        if (data.success && data.result?.success && data.result.data?.tools) {
          const fullConnection = {
            ...storedConnection,
            tools: data.result.data.tools,
            lastSync: new Date().toISOString()
          }
          
          return res.json({
            success: true,
            data: fullConnection
          })
        }
      }
    } catch (error) {
      console.error(`❌ 重新发现工具失败:`, error)
    }

    // 如果无法获取工具，返回基本信息
    const basicConnection = {
      ...storedConnection,
      tools: [],
      lastSync: null
    }
    
    res.json({
      success: true,
      data: basicConnection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取 MCP 连接失败'
    })
  }
})

// 更新 MCP 连接配置
app.put('/api/mcp/connections/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body || {}
    
    // 只允许更新基本信息
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      url: updates.url
    }
    
    const updatedConnection = await mcpStorageManager.updateConnection(id, allowedUpdates)
    
    if (!updatedConnection) {
      return res.status(404).json({
        success: false,
        error: '连接未找到'
      })
    }
    
    res.json({
      success: true,
      message: '连接配置更新成功',
      data: updatedConnection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新 MCP 连接失败'
    })
  }
})

// 删除 MCP 连接
app.delete('/api/mcp/connections/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const success = await mcpStorageManager.removeConnection(id)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: '连接未找到'
      })
    }
    
    res.json({
      success: true,
      message: '连接删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除 MCP 连接失败'
    })
  }
})

// 同步 MCP 连接的工具（重新发现）
app.post('/api/mcp/connections/:id/sync', async (req, res) => {
  try {
    const { id } = req.params
    const storedConnection = mcpStorageManager.getConnection(id)
    
    if (!storedConnection) {
      return res.status(404).json({
        success: false,
        error: '连接未找到'
      })
    }

    // 重新获取工具列表
    let tools: any[] = []
    try {
      const listToolsUrl = `${storedConnection.url.replace(/\/$/, '')}/list_tools`
      console.log(`🔄 重新同步连接: ${listToolsUrl}`)
      
      const response = await fetch(listToolsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentServer/1.0'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as any
      if (data.success && data.result?.success && data.result.data?.tools) {
        tools = data.result.data.tools
        console.log(`✅ 重新同步成功，发现 ${tools.length} 个工具`)
      } else {
        throw new Error('响应格式不符合预期')
      }

    } catch (error) {
      console.error('❌ 重新同步失败:', error)
      return res.status(400).json({
        success: false,
        error: `重新同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    }

    // 返回更新后的连接信息（不保存到存储）
    const updatedConnection = {
      ...storedConnection,
      tools,
      lastSync: new Date().toISOString()
    }
    
    res.json({
      success: true,
      message: '工具同步成功',
      data: updatedConnection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '同步工具失败'
    })
  }
})

// 获取存储统计信息
app.get('/api/mcp/storage/stats', (req, res) => {
  try {
    const stats = mcpStorageManager.getStorageStats()
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取存储统计失败'
    })
  }
})

// 备份连接数据
app.post('/api/mcp/storage/backup', async (req, res) => {
  try {
    const backupPath = await mcpStorageManager.backupConnections()
    res.json({
      success: true,
      message: '备份创建成功',
      data: { backupPath }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建备份失败'
    })
  }
})

// 强制重新加载存储文件
app.post('/api/mcp/storage/reload', async (req, res) => {
  try {
    await mcpStorageManager.reloadConnections()
    res.json({
      success: true,
      message: '存储文件重新加载成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '重新加载失败'
    })
  }
})

// 清空所有连接配置
app.delete('/api/mcp/storage/clear', async (req, res) => {
  try {
    await mcpStorageManager.clearAllConnections()
    res.json({
      success: true,
      message: '所有连接配置已清空'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '清空失败'
    })
  }
})

// 新增：MCP 连接管理
app.post('/api/mcp/connections', async (req, res) => {
  try {
    const { name, description, url } = req.body || {}
    if (!name || !url) {
      return res.status(400).json({ success: false, error: '名称和 URL 是必需的' })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (error) {
      return res.status(400).json({ success: false, error: '无效的 URL 格式' })
    }

    // 检查是否已存在相同 URL 的连接
    const existingConnection = mcpStorageManager.findConnectionByUrl(url)
    if (existingConnection) {
      return res.status(400).json({ success: false, error: `已存在相同 URL 的连接: ${existingConnection.name}` })
    }

    // 尝试连接到 MCP 服务器并获取工具列表
    let tools: any[] = []
    try {
      const toolsResponse = await fetch(`${url}/list_tools`)
      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json() as any
        if (toolsData.tools && Array.isArray(toolsData.tools)) {
          tools = toolsData.tools
        }
      }
    } catch (error) {
      console.log(`⚠️ 无法获取 MCP 服务器工具列表: ${error}`)
    }

    const connection = await mcpStorageManager.addConnection({
      name, description: description || '', url
    })

    const fullConnection = {
      ...connection,
      tools,
      lastSync: new Date().toISOString()
    }

    res.json({ success: true, message: `成功连接到 MCP 服务器，发现 ${tools.length} 个工具`, data: fullConnection })
  } catch (error) {
    console.error('添加 MCP 连接失败:', error)
    res.status(500).json({ success: false, error: '添加 MCP 连接失败' })
  }
})

// 修改：聊天 API 支持 Function Calling
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, settings } = req.body || {}
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: '消息不能为空' })
    }
    
    if (!settings) {
      return res.status(400).json({ success: false, error: '设置不能为空' })
    }
    
    console.log('📨 收到聊天请求:', {
      messageCount: messages.length,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.max_tokens
    })
    
    // 🔧 重要：在调用 AI 之前清理消息格式
    const cleanMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    
    console.log('🧹 清理后的消息:', JSON.stringify(cleanMessages, null, 2))
    
    // 获取可用的工具
    const storedConnections = mcpStorageManager.getAllConnections()
    const allTools: any[] = []
    
    // 动态获取每个连接的工具信息
    for (const connection of storedConnections) {
      try {
        // 获取连接的工具列表
        const toolsResponse = await fetch(`${connection.url}/list_tools`)
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json() as any
          // 处理嵌套的响应格式：data.tools
          let tools = []
          if (toolsData.tools && Array.isArray(toolsData.tools)) {
            tools = toolsData.tools
          } else if (toolsData.result?.data?.tools && Array.isArray(toolsData.result.data.tools)) {
            tools = toolsData.result.data.tools
          }
          
          if (tools.length > 0) {
            for (const tool of tools) {
              // 将 MCP 工具转换为 DeepSeek Function Calling 格式
              const toolDefinition: any = {
                type: 'function',
                function: {
                  name: (tool as any).name,
                  description: (tool as any).description
                }
              }
              
              // 只有当工具有参数时才添加 parameters 字段
              const parameters = (tool as any).parameters || {}
              if (Object.keys(parameters).length > 0) {
                toolDefinition.function.parameters = {
                  type: 'object',
                  properties: Object.entries(parameters).reduce((acc: any, [key, param]) => {
                    acc[key] = {
                      type: (param as any).type,
                      description: (param as any).description,
                      ...((param as any).default !== undefined && { default: (param as any).default })
                    }
                    return acc
                  }, {}),
                  required: Object.entries(parameters)
                    .filter(([_, param]) => (param as any).required)
                    .map(([key]) => key)
                }
              }
              
              allTools.push(toolDefinition)
            }
            console.log(`✅ 从连接 ${connection.name} 获取到 ${tools.length} 个工具`)
          }
        }
      } catch (error) {
        console.log(`⚠️ 无法获取连接 ${connection.name} 的工具列表: ${error}`)
        continue
      }
    }
    

    // 构建 DeepSeek API 请求
    const deepseekRequest = {
      model: settings.model,
      messages: cleanMessages, // 使用清理后的消息
      temperature: settings.temperature || 0.7,
      max_tokens: settings.max_tokens || 1000,
      ...(allTools.length > 0 && { tools: allTools }),
      tool_choice: allTools.length > 0 ? 'auto' : undefined
    }

    console.log('🚀 发送到 DeepSeek 的请求:', JSON.stringify(deepseekRequest, null, 2))

    // 调用 DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverConfig.ai.deepseek.apiKey}`
      },
      body: JSON.stringify(deepseekRequest)
    })


   

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text()
      console.error('❌ DeepSeek API 调用失败:', deepseekResponse.status, errorText)
      return res.status(500).json({ 
        success: false, 
        error: `DeepSeek API 调用失败: ${deepseekResponse.status}`,
        details: errorText
      })
    }

    const deepseekData = await deepseekResponse.json() as any
    const choice = deepseekData.choices?.[0]
    
    if (!choice) {
      return res.status(500).json({ success: false, error: 'DeepSeek API 返回数据格式无效' })
    }

    const response: any = {
      success: true,
      content: choice.message?.content || '',
      tool_calls: choice.message?.tool_calls || undefined,
      usage: deepseekData.usage
    }

    console.log('✅ DeepSeek API 响应:', JSON.stringify(response, null, 2))
    
    // 如果有工具调用，需要执行工具并返回结果
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('🔄 检测到工具调用，开始执行...')
      
      const toolResults: any[] = []
      
      // 执行工具调用的辅助方法
      const executeToolCall = async (toolCall: any): Promise<string> => {
        try {
          const { tool_name, arguments: args } = {
            tool_name: toolCall.function.name,
            arguments: toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {}
          }
          
          // 查找包含该工具的连接
          const storedConnections = mcpStorageManager.getAllConnections()
          let targetConnection: any = null
          let targetTool: any = null

          // 动态获取每个连接的工具信息
          for (const connection of storedConnections) {
            try {
              // 获取连接的工具列表
              const toolsResponse = await fetch(`${connection.url}/list_tools`)
              if (toolsResponse.ok) {
                const toolsData = await toolsResponse.json() as any
                // 处理嵌套的响应格式：data.tools
                let tools = []
                if (toolsData.tools && Array.isArray(toolsData.tools)) {
                  tools = toolsData.tools
                } else if (toolsData.result?.data?.tools && Array.isArray(toolsData.result.data.tools)) {
                  tools = toolsData.result.data.tools
                }
                
                if (tools.length > 0) {
                  const tool = tools.find((t: any) => (t as any).name === tool_name)
                  if (tool) {
                    targetConnection = connection
                    targetTool = tool
                    break
                  }
                }
              }
            } catch (error) {
              console.log(`⚠️ 无法获取连接 ${connection.name} 的工具列表: ${error}`)
              continue
            }
          }

          if (!targetConnection || !targetTool) {
            throw new Error(`未找到工具: ${tool_name}`)
          }

          console.log(`🔧 找到工具 ${tool_name} 在连接 ${targetConnection.name} 中`)

          // 调用 MCP 服务器执行工具
          const toolResponse = await fetch(`${targetConnection.url}/${tool_name}`, {
            method: 'GET', // 根据 MCP 服务器的设计，工具调用使用 GET 方法
            headers: {
              'Accept': 'application/json'
            }
          })

          if (!toolResponse.ok) {
            const errorText = await toolResponse.text()
            throw new Error(`MCP 工具执行失败: ${toolResponse.status}`)
          }

          const toolResult = await toolResponse.json() as any
          
          // 返回工具执行结果
          return toolResult.result?.data?.message || toolResult.result?.data?.balance || toolResult.result?.data || '工具执行成功'
          
        } catch (error) {
          console.error('❌ 工具执行失败:', error)
          throw error
        }
      }
      
      for (const toolCall of choice.message.tool_calls) {
        try {
          console.log(`🔧 执行工具: ${toolCall.function.name}`)
          
          // 执行工具
          const toolResult = await executeToolCall(toolCall)
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: toolResult
          })
          
          console.log(`✅ 工具 ${toolCall.function.name} 执行成功`)
          
        } catch (error) {
          console.error(`❌ 工具 ${toolCall.function.name} 执行失败:`, error)
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`
          })
        }
      }
      
      // 将工具执行结果添加到响应中
      response.tool_results = toolResults
      
      console.log('✅ 工具执行完成，返回结果:', JSON.stringify(toolResults, null, 2))
      
      // 🔄 重要：将工具执行结果发送给 AI，让 AI 继续对话
      console.log('🔄 将工具执行结果发送给 AI 继续对话...')
      
      try {
        // 直接在原始 messages 中添加 AI 的回复和工具结果
        messages.push({
          role: 'assistant',
          content: choice.message.content || '',
          tool_calls: choice.message.tool_calls
        })
        
        // 添加工具执行结果
        toolResults.forEach(result => {
          messages.push({
            role: 'tool',
            content: result.content,
            tool_call_id: result.tool_call_id
          })
        })
        
        console.log('📝 更新后的消息历史:', JSON.stringify(messages, null, 2))
        
        // 清理消息历史，只保留用户和助手的对话，移除工具调用相关字段
        const cleanMessages = messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
          .map(msg => ({
            role: msg.role,
            content: msg.role === 'assistant' ? msg.content : msg.content
          }))
        
        // 如果有工具执行结果，将其作为用户消息添加到清理后的消息中
        if (toolResults.length > 0) {
          const toolResultSummary = toolResults.map(result => result.content).join('; ')
          cleanMessages.push({
            role: 'user',
            content: `工具执行结果: ${toolResultSummary}`
          })
        }
        
        console.log('🧹 清理后的消息历史:', JSON.stringify(cleanMessages, null, 2))
        
        // 再次调用 DeepSeek API，让 AI 基于工具结果继续对话
        const followUpResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serverConfig.ai.deepseek.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: settings.model,
            messages: cleanMessages, // 使用清理后的消息
            temperature: settings.temperature,
            max_tokens: settings.max_tokens,
            tools: allTools
          })
        })
        
        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json() as any
          const followUpChoice = followUpData.choices?.[0]
          
          if (followUpChoice && followUpChoice.message) {
            console.log('✅ AI 基于工具结果继续对话成功')
            
            // 更新响应内容为 AI 的最终回复
            response.content = followUpChoice.message.content || '工具执行完成'
            response.final_response = true // 标记这是最终回复
            
            console.log('🎯 AI 最终回复:', response.content)
          }
        } else {
          console.error('❌ AI 继续对话失败:', followUpResponse.status)
        }
        
      } catch (error) {
        console.error('❌ AI 继续对话时出错:', error)
      }
    }
    
    res.json(response)

  } catch (error) {
    console.error('❌ 聊天 API 调用失败:', error)
    res.status(500).json({ success: false, error: '聊天 API 调用失败' })
  }
})

// 新增：MCP 工具执行 API
app.post('/api/mcp/execute', async (req, res) => {
  try {
    const { tool_name, arguments: args } = req.body || {}
    
    if (!tool_name) {
      return res.status(400).json({ success: false, error: '工具名称是必需的' })
    }

    // 查找包含该工具的连接
    const storedConnections = mcpStorageManager.getAllConnections()
    let targetConnection: any = null
    let targetTool: any = null

    // 动态获取每个连接的工具信息
    for (const connection of storedConnections) {
      try {
        // 获取连接的工具列表
        const toolsResponse = await fetch(`${connection.url}/list_tools`)
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json() as any
          // 处理嵌套的响应格式：data.tools
          let tools = []
          if (toolsData.tools && Array.isArray(toolsData.tools)) {
            tools = toolsData.tools
          } else if (toolsData.result?.data?.tools && Array.isArray(toolsData.result.data.tools)) {
            tools = toolsData.result.data.tools
          }
          
          if (tools.length > 0) {
            const tool = tools.find((t: any) => (t as any).name === tool_name)
            if (tool) {
              targetConnection = connection
              targetTool = tool
              break
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ 无法获取连接 ${connection.name} 的工具列表: ${error}`)
        continue
      }
    }

    if (!targetConnection || !targetTool) {
      return res.status(404).json({ success: false, error: `未找到工具: ${tool_name}` })
    }

    // 调用 MCP 服务器执行工具
    // 根据 MCP 服务器的设计，工具调用使用 GET 方法
    const toolResponse = await fetch(`${targetConnection.url}/${tool_name}`, {
      method: 'GET', // 改为 GET 方法
      headers: {
        'Accept': 'application/json'
      }
      // 移除 body，GET 请求不需要 body
    })

    if (!toolResponse.ok) {
      const errorText = await toolResponse.text()
      console.error(`❌ MCP 工具 ${tool_name} 执行失败:`, toolResponse.status, errorText)
      return res.status(500).json({ 
        success: false, 
        error: `MCP 工具执行失败: ${toolResponse.status}`,
        details: errorText
      })
    }

    const toolResult = await toolResponse.json() as any
    
    res.json({ 
      success: true, 
      result: toolResult.result || toolResult.content || '工具执行成功',
      tool_name,
      connection: targetConnection.name
    })

  } catch (error) {
    console.error('❌ MCP 工具执行失败:', error)
    res.status(500).json({ success: false, error: 'MCP 工具执行失败' })
  }
})

// 健康检查端点
app.get('/health', (req, res) => {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      aiProvider: serverConfig.ai.provider,
      aiConfigured: (() => {
        if (serverConfig.ai.provider === 'cursor') {
          return !!serverConfig.ai.cursor.apiKey
        } else if (serverConfig.ai.provider === 'deepseek') {
          return !!serverConfig.ai.deepseek.apiKey
        } else if (serverConfig.ai.provider === 'openai') {
          return !!serverConfig.ai.openai.apiKey
        } else if (serverConfig.ai.provider === 'anthropic') {
          return !!serverConfig.ai.anthropic.apiKey
        }
        return false
      })(),
      port: serverConfig.server.port,
      features: serverConfig.features
    }
  }
  res.json(response)
})

const port = serverConfig.server.port
const host = serverConfig.server.host

app.listen(port, host, () => {
  console.log(`🚀 API 服务器启动成功!`)
  console.log(`📍 地址: http://${host}:${port}`)
  console.log(`🔗 健康检查: http://${host}:${port}/health`)
  console.log(`💬 聊天接口: http://${host}:${port}/api/chat`)
  console.log('')
  printConfig()
})
