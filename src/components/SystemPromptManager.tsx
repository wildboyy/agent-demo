import React, { useState } from 'react'
import { SystemPrompt } from '../types'
import { useSystemPrompt } from '../contexts/SystemPromptContext'

const SystemPromptManager: React.FC = () => {
  const { state, addPrompt, updatePrompt, deletePrompt, activatePrompt } = useSystemPrompt()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null)
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    content: ''
  })

  // 调试：显示当前状态
  console.log('🔍 SystemPromptManager 状态:', {
    prompts: state.prompts,
    activePrompt: state.activePrompt,
    hasActivePrompt: !!state.activePrompt
  })

  const handleAddPrompt = () => {
    if (newPrompt.name.trim() && newPrompt.content.trim()) {
      addPrompt({
        name: newPrompt.name.trim(),
        content: newPrompt.content.trim(),
        isActive: false
      })
      setNewPrompt({ name: '', content: '' })
      setShowAddForm(false)
    }
  }

  const handleEditPrompt = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt)
    setNewPrompt({ name: prompt.name, content: prompt.content })
    setShowAddForm(true)
  }

  const handleUpdatePrompt = () => {
    if (editingPrompt && newPrompt.name.trim() && newPrompt.content.trim()) {
      updatePrompt({
        ...editingPrompt,
        name: newPrompt.name.trim(),
        content: newPrompt.content.trim()
      })
      setEditingPrompt(null)
      setNewPrompt({ name: '', content: '' })
      setShowAddForm(false)
    }
  }

  const handleDeletePrompt = (id: string) => {
    deletePrompt(id)
  }

  const handleActivatePrompt = (id: string) => {
    activatePrompt(id)
    console.log('提示词已激活')
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingPrompt(null)
    setNewPrompt({ name: '', content: '' })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">系统提示词管理</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-sm px-3 py-1"
        >
          {showAddForm ? '取消' : '添加提示词'}
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="提示词名称"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="提示词内容"
              value={newPrompt.content}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
              className="input-field"
              rows={4}
            />
            <div className="flex space-x-2">
              <button
                onClick={editingPrompt ? handleUpdatePrompt : handleAddPrompt}
                disabled={!newPrompt.name.trim() || !newPrompt.content.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {editingPrompt ? '更新' : '添加'}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示词列表 */}
      <div className="space-y-3">
        {state.prompts.map((prompt) => (
          <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                  {prompt.isActive && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      当前使用
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{prompt.content}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleActivatePrompt(prompt.id)}
                disabled={prompt.isActive}
                className={`text-xs px-2 py-1 rounded ${
                  prompt.isActive
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {prompt.isActive ? '正在使用' : '使用此提示词'}
              </button>
              <button
                onClick={() => handleEditPrompt(prompt)}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
              >
                编辑
              </button>
              <button
                onClick={() => handleDeletePrompt(prompt.id)}
                className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      
    </div>
  )
}

export default SystemPromptManager
