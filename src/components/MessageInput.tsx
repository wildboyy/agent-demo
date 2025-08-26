import React, { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  disabled?: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false
}) => {
  const [isComposing, setIsComposing] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value)
    }
  }

  return (
    <div className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="输入您的消息..."
          disabled={disabled}
          className="input-field resize-none min-h-[44px] max-h-32 py-3 pr-12"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
          {value.length}/1000
        </div>
      </div>
      
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
      >
        发送
      </button>
    </div>
  )
}

export default MessageInput
