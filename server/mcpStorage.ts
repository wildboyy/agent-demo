import { promises as fs } from 'fs'
import { join } from 'path'

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: string
    required: boolean
    default?: any
  }>
  examples?: string[]
}

export interface StoredMCPConnection {
  id: string
  name: string
  description: string
  url: string
  createdAt: string
  tools?: MCPTool[] // 添加工具字段
}

export class MCPStorageManager {
  private storageFile: string
  private connections: Map<string, StoredMCPConnection> = new Map()

  constructor() {
    // 在 server 目录下创建存储文件
    this.storageFile = join(process.cwd(), 'server', 'mcp-connections.json')
    this.loadConnections()
  }

  // 加载连接信息
  private async loadConnections() {
    try {
      // 检查文件是否存在
      await fs.access(this.storageFile)
      
      // 读取文件内容
      const data = await fs.readFile(this.storageFile, 'utf-8')
      const connections = JSON.parse(data) as StoredMCPConnection[]
      
      // 加载到内存
      this.connections.clear()
      connections.forEach(conn => {
        this.connections.set(conn.id, conn)
      })
      
      console.log(`✅ 已加载 ${this.connections.size} 个 MCP 连接配置`)
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // 文件不存在，清空内存状态并创建空文件
        this.connections.clear()
        await this.saveConnections()
        console.log('📁 创建新的 MCP 连接配置存储文件，内存状态已清空')
      } else {
        console.error('❌ 加载 MCP 连接配置失败:', error)
        // 加载失败时也清空内存状态
        this.connections.clear()
      }
    }
  }

  // 保存连接信息到文件
  private async saveConnections() {
    try {
      const connections = Array.from(this.connections.values())
      const data = JSON.stringify(connections, null, 2)
      
      await fs.writeFile(this.storageFile, data, 'utf-8')
      console.log(`💾 已保存 ${connections.length} 个 MCP 连接配置到文件`)
    } catch (error) {
      console.error('❌ 保存 MCP 连接配置失败:', error)
      throw error
    }
  }

  // 添加新连接
  async addConnection(connection: Omit<StoredMCPConnection, 'id' | 'createdAt'>): Promise<StoredMCPConnection> {
    const id = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const newConnection: StoredMCPConnection = {
      ...connection,
      id,
      createdAt: now
    }
    
    this.connections.set(id, newConnection)
    await this.saveConnections()
    
    console.log(`✅ 已添加 MCP 连接配置: ${newConnection.name} (${id})`)
    return newConnection
  }

  // 更新连接
  async updateConnection(id: string, updates: Partial<StoredMCPConnection>): Promise<StoredMCPConnection | null> {
    const connection = this.connections.get(id)
    if (!connection) {
      return null
    }
    
    const updatedConnection: StoredMCPConnection = {
      ...connection,
      ...updates
    }
    
    this.connections.set(id, updatedConnection)
    await this.saveConnections()
    
    console.log(`✅ 已更新 MCP 连接配置: ${updatedConnection.name} (${id})`)
    return updatedConnection
  }

  // 删除连接
  async removeConnection(id: string): Promise<boolean> {
    const connection = this.connections.get(id)
    if (!connection) {
      return false
    }
    
    this.connections.delete(id)
    await this.saveConnections()
    
    console.log(`✅ 已删除 MCP 连接配置: ${connection.name} (${id})`)
    return true
  }

  // 获取所有连接配置
  getAllConnections(): StoredMCPConnection[] {
    return Array.from(this.connections.values())
  }

  // 根据 ID 获取连接配置
  getConnection(id: string): StoredMCPConnection | undefined {
    return this.connections.get(id)
  }

  // 根据 URL 查找连接配置
  findConnectionByUrl(url: string): StoredMCPConnection | undefined {
    return Array.from(this.connections.values()).find(conn => conn.url === url)
  }

  // 获取存储文件路径
  getStorageFilePath(): string {
    return this.storageFile
  }

  // 获取存储统计信息
  getStorageStats() {
    return {
      totalConnections: this.connections.size,
      storageFile: this.storageFile,
      lastModified: new Date().toISOString(),
      connections: this.getAllConnections().map(conn => ({
        id: conn.id,
        name: conn.name,
        url: conn.url,
        createdAt: conn.createdAt
      }))
    }
  }

  // 备份连接配置
  async backupConnections(backupPath?: string): Promise<string> {
    const backupFile = backupPath || join(process.cwd(), 'server', `mcp-connections-backup-${Date.now()}.json`)
    const connections = Array.from(this.connections.values())
    const data = JSON.stringify(connections, null, 2)
    
    await fs.writeFile(backupFile, data, 'utf-8')
    console.log(`💾 已备份 ${connections.length} 个连接配置到: ${backupFile}`)
    
    return backupFile
  }

  // 从备份恢复
  async restoreFromBackup(backupPath: string): Promise<boolean> {
    try {
      const data = await fs.readFile(backupPath, 'utf-8')
      const connections = JSON.parse(data) as StoredMCPConnection[]
      
      this.connections.clear()
      connections.forEach(conn => {
        this.connections.set(conn.id, conn)
      })
      
      await this.saveConnections()
      console.log(`✅ 已从备份恢复 ${connections.length} 个连接配置`)
      
      return true
    } catch (error) {
      console.error('❌ 从备份恢复失败:', error)
      return false
    }
  }

  // 强制重新加载存储文件
  async reloadConnections(): Promise<void> {
    console.log('🔄 强制重新加载连接配置...')
    await this.loadConnections()
  }

  // 清空所有连接
  async clearAllConnections(): Promise<void> {
    this.connections.clear()
    await this.saveConnections()
    console.log('🗑️ 已清空所有连接配置')
  }
}

export const mcpStorageManager = new MCPStorageManager()
