import React from 'react'
import { Message } from '../types'

interface MessageItemProps {
  message: Message
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleIcon = () => {
    if (isUser) {
      return (
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          用
        </div>
      )
    }
    if (isAssistant) {
      return (
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          AI
        </div>
      )
    }
    return (
      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
        系
      </div>
    )
  }

  const getRoleName = () => {
    if (isUser) return '用户'
    if (isAssistant) return 'AI助手'
    return '系统'
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-3xl`}>
        {!isUser && getRoleIcon()}
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-lg ${
            isUser 
              ? 'bg-primary-600 text-white' 
              : isAssistant 
                ? 'bg-white border border-gray-200 text-gray-900' 
                : 'bg-gray-100 text-gray-700'
          }`}>
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <span>{getRoleName()}</span>
            <span>•</span>
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
        
        {isUser && getRoleIcon()}
      </div>
    </div>
  )
}

export default MessageItem
