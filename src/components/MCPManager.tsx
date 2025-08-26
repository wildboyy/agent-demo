import React, { useState, useEffect, useRef } from 'react'
import { useMCP } from '../contexts/MCPContext'
import { MCPConnectionRequest } from '../types'

const MCPManager: React.FC = () => {
  const { state, addConnection, removeConnection, updateConnection, resetMCPTools } = useMCP()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConnection, setNewConnection] = useState<MCPConnectionRequest>({
    name: '',
    description: '',
    url: ''
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 使用 useRef 来跟踪加载状态，避免 useEffect 重复触发
  const hasLoadedRef = useRef(false)
  // 使用 AbortController 作为锁，确保只有一个加载过程在执行
  const loadingAbortControllerRef = useRef<AbortController | null>(null)

  // 加载持久化的连接配置
  useEffect(() => {
    // 防止重复调用
    if (hasLoadedRef.current) {
      console.log('📝 连接配置已加载，跳过重复调用')
      return
    }
    
    // 如果已经有加载过程在进行，取消它
    if (loadingAbortControllerRef.current) {
      console.log('🔄 取消正在进行的加载过程')
      loadingAbortControllerRef.current.abort()
    }
    
    // 创建新的 AbortController
    loadingAbortControllerRef.current = new AbortController()
    
    console.log('🔄 开始加载持久化连接配置...')
    loadPersistedConnections(loadingAbortControllerRef.current.signal)
    
    // 清理函数
    return () => {
      // 组件卸载时取消加载过程
      if (loadingAbortControllerRef.current) {
        console.log('🧹 组件卸载，取消加载过程')
        loadingAbortControllerRef.current.abort()
        loadingAbortControllerRef.current = null
      }
    }
  }, []) // 移除 hasLoaded 依赖

  const loadPersistedConnections = async (signal?: AbortSignal) => {
    try {
      // 防止重复调用
      if (hasLoadedRef.current) {
        console.log('📝 连接配置已加载，跳过重复调用')
        return
      }
      
      // 检查是否被取消
      if (signal?.aborted) {
        console.log('📝 加载过程被取消')
        return
      }
      
      console.log('🔍 开始加载持久化连接配置...')
      setIsLoading(true)
      
      // 不需要调用 resetMCPTools，直接加载连接即可
      // resetMCPTools() // ❌ 移除这行，避免循环调用
      
      const response = await fetch('/api/mcp/connections', { signal })
      
      // 再次检查是否被取消
      if (signal?.aborted) {
        console.log('📝 加载过程被取消')
        return
      }
      
      if (response.ok) {
        const result = await response.json()
        console.log('📡 后端返回的连接数据:', result.data)
        
        // 再次检查是否被取消
        if (signal?.aborted) {
          console.log('📝 加载过程被取消')
          return
        }
        
        if (result.success && result.data && result.data.length > 0) {
          // 将持久化的连接添加到前端状态
          let addedCount = 0
          for (const conn of result.data) {
            // 每次添加前检查是否被取消
            if (signal?.aborted) {
              console.log('📝 加载过程被取消')
              return
            }
            
            console.log(`🔄 尝试添加连接: ${conn.name} (${conn.id})`)
            const connectionId = addConnection(conn)
            if (connectionId && typeof connectionId === 'string') {
              addedCount++
              console.log(`✅ 成功添加连接: ${conn.name}`)
            } else {
              console.log(`⚠️ 连接添加失败或已存在: ${conn.name}`)
            }
          }
          console.log(`✅ 已加载 ${addedCount} 个持久化连接配置`)
        } else {
          console.log('📝 没有找到持久化的连接配置')
        }
      } else {
        console.log('📝 获取连接配置失败，前端状态已清空')
      }
      
      // 标记为已加载（只有在成功完成时才设置）
      hasLoadedRef.current = true
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('📝 加载过程被取消')
        return
      }
      console.error('加载持久化连接配置失败:', error)
      console.log('📝 由于错误，前端状态已清空')
    } finally {
      // 只有在没有被取消的情况下才设置加载完成
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  const handleAddConnection = async () => {
    if (!newConnection.name.trim() || !newConnection.url.trim()) {
      setConnectionError('名称和 URL 不能为空')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)

    try {
      // 调用后端 API 创建 MCP 连接
      const response = await fetch('/api/mcp/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConnection)
      })

      const result = await response.json()

      if (result.success) {
        // 使用后端返回的完整连接信息，包括正确的 ID
        addConnection(result.data)

        // 重置表单
        setNewConnection({ name: '', description: '', url: '' })
        setShowAddForm(false)
        console.log('✅ MCP 连接创建成功:', result.message)
      } else {
        setConnectionError(result.error || '创建连接失败')
      }
    } catch (error) {
      console.error('创建 MCP 连接失败:', error)
      setConnectionError('网络错误，请检查 URL 是否正确')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRemoveConnection = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/connections/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        removeConnection(id)
        console.log('✅ 连接删除成功')
      }
    } catch (error) {
      console.error('删除连接失败:', error)
    }
  }

  const handleSyncConnection = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/connections/${id}/sync`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // 更新连接的工具列表
          updateConnection(id, {
            tools: result.data.tools,
            lastSync: result.data.lastSync
          })
          console.log('✅ 工具同步成功')
        }
      }
    } catch (error) {
      console.error('同步工具失败:', error)
    }
  }

  const handleBackupConnections = async () => {
    try {
      const response = await fetch('/api/mcp/storage/backup', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert(`备份创建成功！\n备份文件: ${result.data.backupPath}`)
        }
      }
    } catch (error) {
      console.error('创建备份失败:', error)
      alert('创建备份失败')
    }
  }

  const handleReloadConnections = () => {
    console.log('🔄 手动重新加载连接配置...')
    
    // 取消正在进行的加载过程
    if (loadingAbortControllerRef.current) {
      console.log('🔄 取消正在进行的加载过程')
      loadingAbortControllerRef.current.abort()
    }
    
    // 重置加载状态
    hasLoadedRef.current = false
    
    // 创建新的 AbortController
    loadingAbortControllerRef.current = new AbortController()
    
    // 重新加载
    loadPersistedConnections(loadingAbortControllerRef.current.signal)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">MCP工具管理</h3>
        <div className="flex space-x-2">
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-sm px-3 py-1"
          >
            {showAddForm ? '取消' : '添加 MCP 连接'}
          </button>
        </div>
      </div>

      {/* 添加连接表单 */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">添加 MCP 连接</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                连接名称 *
              </label>
              <input
                type="text"
                value={newConnection.name}
                onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：文件搜索服务"
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <input
                type="text"
                value={newConnection.description}
                onChange={(e) => setNewConnection(prev => ({ ...prev, description: e.target.value }))}
                placeholder="连接描述"
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MCP 服务器 URL *
              </label>
              <input
                type="url"
                value={newConnection.url}
                onChange={(e) => setNewConnection(prev => ({ ...prev, url: e.target.value }))}
                placeholder="例如：http://localhost:3001"
                className="input-field w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                服务器必须提供 /list_tools 接口
              </p>
            </div>

            {connectionError && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {connectionError}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleAddConnection}
                disabled={isConnecting}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                {isConnecting ? '连接中...' : '添加连接'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewConnection({ name: '', description: '', url: '' })
                  setConnectionError(null)
                }}
                className="btn-secondary text-sm px-4 py-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 连接列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <p>正在加载连接配置...</p>
          </div>
        ) : state.connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无 MCP 连接</p>
            <p className="text-sm">点击"添加 MCP 连接"来注册新的工具服务</p>
          </div>
        ) : (
          state.connections.map(connection => (
            <div key={`connection-${connection.id}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{connection.name}</h4>
                  {connection.description && (
                    <p className="text-sm text-gray-600">{connection.description}</p>
                  )}
                  {connection.url && (
                    <p className="text-xs text-gray-500 font-mono">{connection.url}</p>
                  )}
                  {connection.lastSync && (
                    <p className="text-xs text-gray-400">
                      最后同步: {new Date(connection.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSyncConnection(connection.id)}
                    className="btn-secondary text-xs px-2 py-1"
                    title="重新同步工具列表"
                  >
                    同步
                  </button>
                  <button
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="btn-secondary text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
              
              {/* 工具列表 */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">
                  可用工具 ({connection.tools.length})
                </h5>
                {connection.tools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {connection.tools.map(tool => (
                      <div key={`${connection.id}-tool-${tool.name}`} className="bg-white border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="font-medium text-gray-900">{tool.name}</h6>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {Object.keys(tool.parameters || {}).length} 参数
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                        {tool.examples && tool.examples.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">示例:</span> {tool.examples[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无可用工具</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MCPManager
