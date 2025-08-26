import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { SystemPrompt } from '../types'

interface SystemPromptState {
  prompts: SystemPrompt[]
  activePrompt: SystemPrompt | null
}

type SystemPromptAction =
  | { type: 'SET_PROMPTS'; payload: SystemPrompt[] }
  | { type: 'ADD_PROMPT'; payload: SystemPrompt }
  | { type: 'UPDATE_PROMPT'; payload: SystemPrompt }
  | { type: 'DELETE_PROMPT'; payload: string }
  | { type: 'ACTIVATE_PROMPT'; payload: string }
  | { type: 'SET_ACTIVE_PROMPT'; payload: SystemPrompt | null }

const initialState: SystemPromptState = {
  prompts: [
    {
      id: '1',
      name: '默认助手',
      content: '你是一个有用的AI助手，可以帮助用户解决各种问题。',
      isActive: true
    },
    {
      id: '2',
      name: '编程专家',
      content: '你是一个专业的编程助手，擅长各种编程语言和技术栈。请提供详细的技术解答和代码示例。',
      isActive: false
    },
    {
      id: '3',
      name: '创意写作',
      content: '你是一个创意写作助手，可以帮助用户进行创意写作、故事创作和内容策划。',
      isActive: false
    }
  ],
  activePrompt: {
    id: '1',
    name: '默认助手',
    content: '你是一个有用的AI助手，可以帮助用户解决各种问题。',
    isActive: true
  }
}

function systemPromptReducer(state: SystemPromptState, action: SystemPromptAction): SystemPromptState {
  switch (action.type) {
    case 'SET_PROMPTS':
      return { ...state, prompts: action.payload }
    
    case 'ADD_PROMPT':
      return { ...state, prompts: [...state.prompts, action.payload] }
    
    case 'UPDATE_PROMPT':
      return {
        ...state,
        prompts: state.prompts.map(p => p.id === action.payload.id ? action.payload : p),
        activePrompt: state.activePrompt?.id === action.payload.id ? action.payload : state.activePrompt
      }
    
    case 'DELETE_PROMPT':
      const newPrompts = state.prompts.filter(p => p.id !== action.payload)
      const newActivePrompt = state.activePrompt?.id === action.payload ? null : state.activePrompt
      return { ...state, prompts: newPrompts, activePrompt: newActivePrompt }
    
    case 'ACTIVATE_PROMPT':
      const updatedPrompts = state.prompts.map(p => ({
        ...p,
        isActive: p.id === action.payload
      }))
      const newActive = updatedPrompts.find(p => p.id === action.payload) || null
      return { 
        ...state, 
        prompts: updatedPrompts, 
        activePrompt: newActive 
      }
    
    case 'SET_ACTIVE_PROMPT':
      return { ...state, activePrompt: action.payload }
    
    default:
      return state
  }
}

interface SystemPromptContextType {
  state: SystemPromptState
  dispatch: React.Dispatch<SystemPromptAction>
  getActivePrompt: () => SystemPrompt | null
  addPrompt: (prompt: Omit<SystemPrompt, 'id'>) => void
  updatePrompt: (prompt: SystemPrompt) => void
  deletePrompt: (id: string) => void
  activatePrompt: (id: string) => void
}

const SystemPromptContext = createContext<SystemPromptContextType | undefined>(undefined)

export function SystemPromptProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(systemPromptReducer, initialState)

  const getActivePrompt = () => state.activePrompt

  const addPrompt = (prompt: Omit<SystemPrompt, 'id'>) => {
    const newPrompt: SystemPrompt = {
      ...prompt,
      id: Date.now().toString()
    }
    dispatch({ type: 'ADD_PROMPT', payload: newPrompt })
  }

  const updatePrompt = (prompt: SystemPrompt) => {
    dispatch({ type: 'UPDATE_PROMPT', payload: prompt })
  }

  const deletePrompt = (id: string) => {
    dispatch({ type: 'DELETE_PROMPT', payload: id })
  }

  const activatePrompt = (id: string) => {
    dispatch({ type: 'ACTIVATE_PROMPT', payload: id })
  }

  return (
    <SystemPromptContext.Provider value={{
      state,
      dispatch,
      getActivePrompt,
      addPrompt,
      updatePrompt,
      deletePrompt,
      activatePrompt
    }}>
      {children}
    </SystemPromptContext.Provider>
  )
}

export function useSystemPrompt() {
  const context = useContext(SystemPromptContext)
  if (context === undefined) {
    throw new Error('useSystemPrompt must be used within a SystemPromptProvider')
  }
  return context
}
