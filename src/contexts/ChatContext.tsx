import React, { createContext, useContext, useReducer, ReactNode, useRef } from 'react'
import { Message, ChatSettings } from '../types'

interface ChatState {
  messages: Message[]
  settings: ChatSettings
  isLoading: boolean
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ChatSettings> }
  | { type: 'CLEAR_CHAT' }

const initialState: ChatState = {
  messages: [],
  settings: {
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 1000
  },
  isLoading: false
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      }
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: []
      }
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  // 使用 useRef 来维护递增的消息 ID 计数器
  const messageIdCounter = useRef(0)

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${++messageIdCounter.current}`, // 递增 ID
      timestamp: new Date()
    }
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
  }

  const updateMessage = (id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } })
  }

  const clearChat = () => {
    dispatch({ type: 'CLEAR_CHAT' })
    // 重置计数器
    messageIdCounter.current = 0
  }

  const value: ChatContextType = {
    state,
    dispatch,
    addMessage,
    updateMessage,
    clearChat
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
