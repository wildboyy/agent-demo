import { config } from 'dotenv'
import { resolve } from 'path'

// 加载配置文件
const serverEnvPath = resolve(process.cwd(), 'server.env')
const dotEnvPath = resolve(process.cwd(), '.env')

config({ path: serverEnvPath })
config({ path: dotEnvPath })

export const serverConfig = {
  ai: {
    provider: process.env.AI_PROVIDER || 'cursor',
    
    cursor: {
      apiKey: process.env.CURSOR_API_KEY || '',
      apiUrl: process.env.CURSOR_API_URL || 'https://api.cursor.com/v1',
      models: ['claude-3.5-sonnet', 'gpt-4o', 'gpt-4o-mini', 'claude-3.5-haiku']
    },
    
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
      models: ['deepseek-chat', 'deepseek-coder', 'deepseek-chat-1.3b']
    },
    
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      apiUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1',
      models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus']
    }
  },
  
  server: {
    port: Number(process.env.PORT) || 8787,
    host: process.env.HOST || 'localhost',
  },
  
  features: {
    enableMCP: process.env.ENABLE_MCP_TOOLS === 'true',
    enableAIChat: process.env.ENABLE_AI_CHAT !== 'false',
    enableSystemPrompts: process.env.ENABLE_SYSTEM_PROMPTS !== 'false',
  }
}

export function validateConfig() {
  const errors: string[] = []
  const provider = serverConfig.ai.provider
  
  if (provider === 'cursor') {
    if (!serverConfig.ai.cursor.apiKey) {
      errors.push('CURSOR_API_KEY 未设置')
    }
  } else if (provider === 'deepseek') {
    if (!serverConfig.ai.deepseek.apiKey) {
      errors.push('DEEPSEEK_API_KEY 未设置')
    }
  } else if (provider === 'openai') {
    if (!serverConfig.ai.openai.apiKey) {
      errors.push('OPENAI_API_KEY 未设置')
    }
  } else if (provider === 'anthropic') {
    if (!serverConfig.ai.anthropic.apiKey) {
      errors.push('ANTHROPIC_API_KEY 未设置')
    }
  }
  
  if (errors.length > 0) {
    console.warn('[配置警告] 以下配置项缺失:')
    errors.forEach(error => console.warn(`  - ${error}`))
  }
  
  return errors.length === 0
}

export function printConfig() {
  console.log('=== 服务器配置 ===')
  console.log(`AI提供商: ${serverConfig.ai.provider}`)
  console.log(`端口: ${serverConfig.server.port}`)
  console.log(`主机: ${serverConfig.server.host}`)
  console.log('================')
}
