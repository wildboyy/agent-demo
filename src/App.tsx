import React, { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import Sidebar from './components/Sidebar'
import { ChatProvider } from './contexts/ChatContext'
import { MCPProvider } from './contexts/MCPContext'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <MCPProvider>
      <ChatProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <h1 className="text-xl font-semibold text-gray-900">AI助手应用</h1>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">基于AI编程工具开发</span>
                </div>
              </div>
            </header>
            
            <main className="flex-1 overflow-hidden">
              <ChatInterface />
            </main>
          </div>
        </div>
      </ChatProvider>
    </MCPProvider>
  )
}

export default App
