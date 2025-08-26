import React from 'react'
import { useChat } from '../contexts/ChatContext'

const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useChat()

  const handleSettingChange = (key: keyof typeof state.settings, value: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">AI 设置</h3>
        <p className="text-sm text-gray-600">配置 AI 助手的对话参数</p>
      </div>

      {/* 模型选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          AI 模型
        </label>
        <select
          value={state.settings.model}
          onChange={(e) => handleSettingChange('model', e.target.value)}
          className="input-field"
        >
          <option value="deepseek-chat">DeepSeek Chat</option>
        </select>
        <p className="text-xs text-gray-500">
          当前使用 DeepSeek Chat 模型
        </p>
      </div>

      {/* 温度控制 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          温度 (Temperature): {state.settings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={state.settings.temperature}
          onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>保守 (0.0)</span>
          <span>平衡 (1.0)</span>
          <span>创意 (2.0)</span>
        </div>
        <p className="text-xs text-gray-500">
          控制回复的随机性和创造性，数值越高越有创意
        </p>
      </div>

      {/* 最大令牌数 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          最大令牌数: {state.settings.max_tokens}
        </label>
        <input
          type="range"
          min="100"
          max="4000"
          step="100"
          value={state.settings.max_tokens}
          onChange={(e) => handleSettingChange('max_tokens', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>简短 (100)</span>
          <span>中等 (1000)</span>
          <span>详细 (4000)</span>
        </div>
        <p className="text-xs text-gray-500">
          控制 AI 回复的最大长度，数值越高回复越详细
        </p>
      </div>

      {/* 当前设置预览 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">当前设置预览</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div>模型: <span className="font-medium">{state.settings.model}</span></div>
          <div>温度: <span className="font-medium">{state.settings.temperature}</span></div>
          <div>最大令牌: <span className="font-medium">{state.settings.max_tokens}</span></div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
