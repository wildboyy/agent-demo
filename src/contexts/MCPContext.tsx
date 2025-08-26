import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react'
import { MCPConnection, MCPTool } from '../types'
import { mcpService } from '../services/mcpService'

interface MCPState {
  connections: MCPConnection[]
  availableTools: MCPTool[]
  isConnecting: boolean
}

type MCPAction =
  | { type: 'ADD_CONNECTION'; payload: MCPConnection }
  | { type: 'UPDATE_CONNECTION'; payload: { id: string; updates: Partial<MCPConnection> } }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'UPDATE_TOOLS'; payload: MCPTool[] }
  | { type: 'INITIALIZE_DEFAULT_TOOLS' }

const initialState: MCPState = {
  connections: [],
  availableTools: [],
  isConnecting: false
}

function mcpReducer(state: MCPState, action: MCPAction): MCPState {
  switch (action.type) {
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload],
        availableTools: [...state.availableTools, ...action.payload.tools]
      }
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map(conn =>
          conn.id === action.payload.id
            ? { ...conn, ...action.payload.updates }
            : conn
        )
      }
    case 'REMOVE_CONNECTION':
      const connectionToRemove = state.connections.find(conn => conn.id === action.payload)
      const toolsToRemove = connectionToRemove?.tools || []
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== action.payload),
        availableTools: state.availableTools.filter(tool => 
          !toolsToRemove.some(t => t.name === tool.name)
        )
      }
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload
      }
    case 'UPDATE_TOOLS':
      return {
        ...state,
        availableTools: action.payload
      }
    case 'INITIALIZE_DEFAULT_TOOLS':
      // 从后端获取工具列表
      return state
    default:
      return state
  }
}

interface MCPContextType {
  state: MCPState
  dispatch: React.Dispatch<MCPAction>
  addConnection: (connection: Omit<MCPConnection, 'id'> | MCPConnection) => string | undefined
  updateConnection: (id: string, updates: Partial<MCPConnection>) => void
  removeConnection: (id: string) => void
  getToolByName: (name: string) => MCPTool | undefined
  executeTool: (toolName: string, args: Record<string, any>) => Promise<any>
  initializeDefaultTools: () => Promise<void>
  resetMCPTools: () => void
}

const MCPContext = createContext<MCPContextType | undefined>(undefined)

export function MCPProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mcpReducer, initialState)
  const isInitializedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializationPromiseRef = useRef<Promise<void> | null>(null)

  // 初始化默认工具
  const initializeDefaultTools = async (force = false) => {
    try {
      // 检查是否已经初始化过，除非强制重新初始化
      if (!force && isInitializedRef.current) {
        console.log('MCP 工具已经初始化，跳过重复初始化')
        return
      }

      // 如果已经有初始化在进行中，等待它完成
      if (initializationPromiseRef.current && !force) {
        console.log('等待现有初始化完成...')
        await initializationPromiseRef.current
        return
      }

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()
      
      console.log('开始初始化 MCP 工具...')
      
      // 现在 MCP 工具通过连接管理，不需要从 /api/mcp/tools 获取
      // 标记为已初始化
      isInitializedRef.current = true
      console.log('MCP 工具初始化完成')
      
    } catch (error) {
      console.error('初始化过程中发生错误:', error)
      isInitializedRef.current = false
    }
  }

  useEffect(() => {
    // 只在组件挂载时初始化一次
    if (!isInitializedRef.current) {
      initializeDefaultTools()
    }
    
    // 清理函数
    return () => {
      // 取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 清理所有连接（如果有的话）
      // 不再硬编码特定的连接 ID
      isInitializedRef.current = false
      
      // 清理 Promise 引用
      initializationPromiseRef.current = null
    }
  }, []) // 移除依赖，避免无限循环

  const addConnection = (connection: Omit<MCPConnection, 'id'> | MCPConnection) => {
    // 如果已经包含 ID，直接使用
    if ('id' in connection) {
      const existingConnection = state.connections.find(
        conn => conn.id === connection.id
      )
      
      if (existingConnection) {
        console.log(`⚠️ 连接已存在，跳过重复添加: ${connection.id}`)
        return existingConnection.id
      }
      
      dispatch({ type: 'ADD_CONNECTION', payload: connection })
      console.log(`✅ 已添加现有连接: ${connection.name} (${connection.id})`)
      return connection.id
    }
    
    // 检查是否已存在相同 URL 的连接
    const existingConnection = state.connections.find(
      conn => conn.url === connection.url
    )
    
    if (existingConnection) {
      console.log(`⚠️ 连接已存在，跳过重复添加: ${connection.url}`)
      return existingConnection.id
    }
    
    // 生成新的 ID（这种情况应该很少发生）
    const newConnection: MCPConnection = {
      ...connection,
      id: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    dispatch({ type: 'ADD_CONNECTION', payload: newConnection })
    console.log(`✅ 已添加新连接: ${newConnection.name} (${newConnection.url})`)
    return newConnection.id
  }

  const updateConnection = (id: string, updates: Partial<MCPConnection>) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { id, updates } })
  }

  const removeConnection = (id: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: id })
  }

  const getToolByName = (name: string): MCPTool | undefined => {
    return state.availableTools.find(tool => tool.name === name)
  }

  const executeTool = async (toolName: string, args: Record<string, any>): Promise<any> => {
    return await mcpService.executeTool(toolName, args)
  }

  const resetMCPTools = () => {
    console.log('开始重置 MCP 工具...')
    
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // 清理初始化状态
    isInitializedRef.current = false
    initializationPromiseRef.current = null
    
    console.log('MCP 工具已重置')
  }

  const value: MCPContextType = {
    state,
    dispatch,
    addConnection,
    updateConnection,
    removeConnection,
    getToolByName,
    executeTool,
    initializeDefaultTools,
    resetMCPTools
  }

  return (
    <MCPContext.Provider value={value}>
      {children}
    </MCPContext.Provider>
  )
}

export function useMCP() {
  const context = useContext(MCPContext)
  if (context === undefined) {
    throw new Error('useMCP must be used within a MCPProvider')
  }
  return context
}
