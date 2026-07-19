import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Trash2, Edit3, Search, Menu, X, Sparkles,
  Copy, RotateCcw, Square, MessageSquare, Pin, Check, ArrowDown,
  Volume2, ShieldAlert
} from 'lucide-react'
import aiService from '@/services/aiService'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

// Suggested questions list
const SUGGESTED_QUESTIONS = [
  "Create a healthy Indian diet plan.",
  "How can I reduce blood pressure?",
  "What should diabetics eat?",
  "Weekly workout plan.",
  "Improve immunity naturally.",
  "Healthy breakfast ideas.",
  "Daily water intake.",
  "Pregnancy nutrition.",
  "Child vaccination schedule.",
  "Mental health tips."
]

// Markdown parser helper for rich chat bubbles
const parseMarkdown = (text) => {
  if (!text) return ''

  // Escape HTML characters
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers (### text)
  html = html.replace(/^###\s+(.+)$/gm, '<h4 class="text-sm font-bold text-gray-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1 border-b border-gray-150/50 dark:border-gray-700/50 pb-1">$1</h4>')
  html = html.replace(/^##\s+(.+)$/gm, '<h3 class="text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h3>')
  html = html.replace(/^#\s+(.+)$/gm, '<h2 class="text-lg font-black text-gray-950 dark:text-white mt-5 mb-2.5">$1</h2>')

  // Tables parsing (basic)
  const lines = html.split('\n')
  let inTable = false
  let tableRows = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      // Skip separator row (e.g. |---|---|)
      if (line.includes('---')) continue
      
      const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
      tableRows.push(cols)
      lines[i] = '<!-- TABLE_ROW -->'
    } else {
      if (inTable) {
        // Construct Table HTML
        let tableHtml = '<div class="overflow-x-auto my-3"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">'
        tableRows.forEach((row, rIdx) => {
          tableHtml += `<tr class="${rIdx === 0 ? 'bg-gray-100 dark:bg-gray-800 font-bold' : 'bg-white dark:bg-gray-900/50'}">`
          row.forEach(col => {
            tableHtml += `<td class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">${col}</td>`
          })
          tableHtml += '</tr>'
        })
        tableHtml += '</table></div>'
        
        // Find first TABLE_ROW placeholder and replace it with full table
        const firstPlaceholder = lines.indexOf('<!-- TABLE_ROW -->')
        if (firstPlaceholder !== -1) {
          lines[firstPlaceholder] = tableHtml
        }
        // Remove other placeholders
        for (let j = 0; j < lines.length; j++) {
          if (lines[j] === '<!-- TABLE_ROW -->') lines[j] = ''
        }
        inTable = false
      }
    }
  }
  html = lines.join('\n')

  // Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-gray-950 dark:text-white">$1</strong>')

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]+?)```/g, '<pre class="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-150/50 dark:border-gray-800/40 text-xs font-mono my-2.5 overflow-x-auto text-gray-800 dark:text-gray-250">$1</pre>')

  // Bullet points (- text or * text)
  html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc text-xs text-gray-700 dark:text-gray-300 mt-1">$1</li>')
  html = html.replace(/^\*\s+(.+)$/gm, '<li class="ml-4 list-disc text-xs text-gray-700 dark:text-gray-300 mt-1">$1</li>')

  // Numbered lists (1. text)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal text-xs text-gray-700 dark:text-gray-300 mt-1">$1</li>')

  // Paragraph separator (double newline)
  html = html.replace(/\n\n/g, '<div class="h-3"></div>')

  // Single newline to linebreaks (only if not inside list item or table)
  html = html.replace(/\n/g, '<br />')

  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1.5 text-xs md:text-sm leading-relaxed" />
}

export default function AIHealthAssistantPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State lists
  const [conversations, setConversations] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile drawer toggle

  // Action/Inputs state
  const [inputMsg, setInputMsg] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitleText, setEditTitleText] = useState('')

  // UI state Helpers
  const [copiedId, setCopiedId] = useState(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  // References
  const messageEndRef = useRef(null)
  const chatFeedContainerRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Fetch all chats for user
  const fetchConversations = async (selectLatest = false) => {
    try {
      const res = await aiService.getChats({ q: searchQuery })
      const list = res.data || res || []
      setConversations(list)

      if (list.length > 0 && selectLatest && !activeChatId) {
        loadConversation(list[0]._id)
      }
    } catch (err) {
      console.error('Failed to load conversations', err)
      toast.error('Could not load chat history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load specific conversation
  const loadConversation = async (chatId) => {
    setChatLoading(true)
    setActiveChatId(chatId)
    // Close sidebar drawer on mobile after selecting
    setIsSidebarOpen(false)
    try {
      const res = await aiService.getChatDetails(chatId)
      const data = res.data || res || {}
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to load conversation details', err)
      toast.error('Could not load messages')
    } finally {
      setChatLoading(false)
      scrollToBottom()
    }
  }

  // Trigger search with debounce or query update
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchConversations()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Load initial chats on load
  useEffect(() => {
    fetchConversations(true)
  }, [])

  // Auto-scroll to bottom on messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGenerating])

  // Handle scroll detection for back-to-bottom button
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollBottom(true)
    } else {
      setShowScrollBottom(false)
    }
  }

  // Create new conversation
  const handleStartNewChat = async (optionalMessage = '') => {
    try {
      setIsSidebarOpen(false)
      setChatLoading(true)
      
      const payload = {}
      if (optionalMessage) {
        payload.message = optionalMessage
      }
      
      const res = await aiService.createChat(payload)
      const newChat = res.data || res
      
      // Reload history list and load this chat
      await fetchConversations()
      setActiveChatId(newChat._id)
      setMessages(newChat.messages || [])
      
      if (optionalMessage) {
        // Already triggered AI reply
        scrollToBottom()
      }
    } catch (err) {
      console.error('Failed to create new conversation', err)
      toast.error('Failed to start new chat')
    } finally {
      setChatLoading(false)
    }
  }

  // Send message
  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || inputMsg
    if (!messageText.trim()) return

    if (!activeChatId) {
      // Create new conversation on the fly
      await handleStartNewChat(messageText)
      setInputMsg('')
      return
    }

    // Append message locally for instant responsiveness
    const tempUserMsg = { sender: 'user', text: messageText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, tempUserMsg])
    setInputMsg('')
    setIsGenerating(true)

    // Abort controller
    abortControllerRef.current = new AbortController()

    try {
      const res = await aiService.sendChatMessage(activeChatId, messageText, { signal: abortControllerRef.current.signal })
      const data = res.data || res
      
      setMessages(data.chat?.messages || [])
      
      // Reload list to get updated updatedAt timestamps and possible auto-renamed title
      fetchConversations()
    } catch (err) {
      if (abortControllerRef.current?.signal?.aborted || err.name === 'AbortError' || err.name === 'CanceledError') {
        toast('Generation stopped')
      } else {
        console.error('Failed to send message', err)
        toast.error('Failed to generate response')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Stop Generating
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsGenerating(false)
  }

  // Copy Message to Clipboard
  const handleCopyMessage = (text, msgId) => {
    navigator.clipboard.writeText(text)
    setCopiedId(msgId)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Regenerate last response
  const handleRegenerateResponse = async () => {
    if (messages.length < 2 || isGenerating) return
    
    // Find the last user message
    const historyMsgs = [...messages]
    let lastUserMsgIdx = -1
    for (let i = historyMsgs.length - 1; i >= 0; i--) {
      if (historyMsgs[i].sender === 'user') {
        lastUserMsgIdx = i
        break
      }
    }

    if (lastUserMsgIdx === -1) return

    const userText = historyMsgs[lastUserMsgIdx].text
    
    // Slice messages up to the last user message
    setMessages(historyMsgs.slice(0, lastUserMsgIdx + 1))
    setIsGenerating(true)

    abortControllerRef.current = new AbortController()

    try {
      const res = await aiService.sendChatMessage(activeChatId, userText, { signal: abortControllerRef.current.signal })
      const data = res.data || res
      setMessages(data.chat?.messages || [])
      fetchConversations()
    } catch (err) {
      if (!abortControllerRef.current?.signal?.aborted && err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to regenerate response', err)
        toast.error('Failed to regenerate response')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Delete conversation
  const handleDeleteChat = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return
    try {
      await aiService.deleteChat(id)
      toast.success('Conversation deleted')
      
      // Load next active chat if deleted current
      if (activeChatId === id) {
        const remaining = conversations.filter(c => c._id !== id)
        if (remaining.length > 0) {
          loadConversation(remaining[0]._id)
        } else {
          setActiveChatId(null)
          setMessages([])
        }
      }
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete chat', err)
      toast.error('Could not delete chat')
    }
  }

  // Pin/Unpin conversation
  const handleTogglePinChat = async (chat, e) => {
    e.stopPropagation()
    try {
      await aiService.updateChat(chat._id, { isPinned: !chat.isPinned })
      toast.success(chat.isPinned ? 'Conversation unpinned' : 'Conversation pinned')
      fetchConversations()
    } catch (err) {
      console.error('Failed to pin/unpin chat', err)
      toast.error('Could not update pinned status')
    }
  }

  // Rename conversation
  const handleRenameChat = async (id) => {
    if (!editTitleText.trim()) return
    try {
      await aiService.updateChat(id, { title: editTitleText.trim() })
      toast.success('Conversation renamed')
      setEditingChatId(null)
      fetchConversations()
    } catch (err) {
      console.error('Failed to rename chat', err)
      toast.error('Could not rename')
    }
  }

  // Group conversations into Pinned and Recent
  const pinnedChats = conversations.filter(c => c.isPinned)
  const recentChats = conversations.filter(c => !c.isPinned)

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white dark:bg-gray-900 rounded-3xl border border-gray-150/60 dark:border-gray-800/60 overflow-hidden shadow-soft relative">
      
      {/* ─── HISTORY SIDEBAR ─── */}
      <aside
        className={cn(
          "w-72 bg-gray-50/50 dark:bg-gray-905 border-r border-gray-150/60 dark:border-gray-800/60 flex flex-col h-full z-20 transition-transform duration-300 absolute lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-150/60 dark:border-gray-800/60 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => handleStartNewChat()}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-inner-soft"
            />
          </div>
        </div>

        {/* History Chat List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar">
          {historyLoading ? (
            <div className="flex justify-center items-center py-12"><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No conversations found</span>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedChats.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest px-2.5">Pinned</p>
                  {pinnedChats.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => loadConversation(chat._id)}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-200 border border-transparent text-xs font-semibold",
                        activeChatId === chat._id
                          ? "bg-primary-50 border-primary-100/50 text-primary-700 dark:bg-primary-950/20 dark:border-primary-900/20 dark:text-primary-400"
                          : "text-gray-750 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/40"
                      )}
                    >
                      {editingChatId === chat._id ? (
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onBlur={() => handleRenameChat(chat._id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(chat._id)}
                          autoFocus
                          className="flex-1 bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-primary-500 text-xs focus:outline-none"
                        />
                      ) : (
                        <span className="truncate flex-1 pr-2">{chat.title}</span>
                      )}

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => handleTogglePinChat(chat, e)}
                          title="Unpin Chat"
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-indigo-500 transition-colors"
                        >
                          <Pin className="w-3 h-3 fill-indigo-500 text-indigo-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingChatId(chat._id)
                            setEditTitleText(chat.title)
                          }}
                          title="Rename"
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(chat._id, e)}
                          title="Delete"
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-gray-400 hover:text-red-650 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Section */}
              {recentChats.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2.5">Recent</p>
                  {recentChats.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => loadConversation(chat._id)}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-200 border border-transparent text-xs font-semibold",
                        activeChatId === chat._id
                          ? "bg-primary-50 border-primary-100/50 text-primary-700 dark:bg-primary-950/20 dark:border-primary-900/20 dark:text-primary-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/40"
                      )}
                    >
                      {editingChatId === chat._id ? (
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onBlur={() => handleRenameChat(chat._id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(chat._id)}
                          autoFocus
                          className="flex-1 bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-primary-500 text-xs focus:outline-none"
                        />
                      ) : (
                        <span className="truncate flex-1 pr-2">{chat.title}</span>
                      )}

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => handleTogglePinChat(chat, e)}
                          title="Pin Chat"
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingChatId(chat._id)
                            setEditTitleText(chat.title)
                          }}
                          title="Rename"
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(chat._id, e)}
                          title="Delete"
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-gray-400 hover:text-red-650 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-10 lg:hidden"
        />
      )}

      {/* ─── MAIN CHAT AREA ─── */}
      <main className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-gray-900/40 relative">
        
        {/* Chat Area Header */}
        <header className="px-5 py-4 border-b border-gray-150/60 dark:border-gray-800/60 flex items-center justify-between gap-4 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div>
              <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {activeChatId ? (conversations.find(c => c._id === activeChatId)?.title || 'AI Chat') : 'AI Health Assistant'}
                {activeChatId && conversations.find(c => c._id === activeChatId)?.isPinned && (
                  <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                )}
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                AI assistance for general wellness, symptoms, diet, and clinical resources.
              </p>
            </div>
          </div>

          {activeChatId && (
            <button
              onClick={(e) => {
                const chatObj = conversations.find(c => c._id === activeChatId)
                if (chatObj) handleTogglePinChat(chatObj, e)
              }}
              className="p-2 text-gray-450 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors rounded-lg cursor-pointer"
              title="Pin/Unpin Conversation"
            >
              <Pin className={cn("w-4 h-4", conversations.find(c => c._id === activeChatId)?.isPinned && "fill-indigo-500 text-indigo-500")} />
            </button>
          )}
        </header>

        {/* Chat Feed */}
        <div
          ref={chatFeedContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative"
        >
          {chatLoading && activeChatId ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            /* Blank State / Welcome Dashboard with Suggested Questions */
            <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-primary-500 to-indigo-650 rounded-2xl flex items-center justify-center text-white shadow-soft mb-5">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white text-center">
                How can I assist your health journey today?
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md font-medium leading-relaxed">
                Consult with our AI on diet plans, fitness routines, common symptoms, local medical centers, and wellness information.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="p-3 bg-white dark:bg-gray-800 hover:bg-primary-50/50 dark:hover:bg-primary-950/15 border border-gray-150/60 dark:border-gray-800/60 text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-400 font-semibold rounded-2xl text-xs md:text-sm text-left transition-all active:scale-[0.98] shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400 opacity-70" />
                    <span className="truncate">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversational message bubbles list */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user'
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 md:gap-4 items-start group",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8.5 h-8.5 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border shadow-sm",
                        isUser
                          ? "bg-primary-100 text-primary-700 border-primary-200/50 dark:bg-primary-950/40 dark:text-primary-400 dark:border-primary-900/30"
                          : "bg-indigo-100 text-indigo-750 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30"
                      )}
                    >
                      {isUser ? 'C' : <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500/10" />}
                    </div>

                    {/* Chat Bubble Container */}
                    <div className="flex flex-col max-w-[82%] relative">
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl shadow-sm border",
                          isUser
                            ? "bg-primary-600 border-primary-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-gray-805 border-gray-150/60 dark:border-gray-800/40 text-gray-900 dark:text-gray-150 rounded-tl-none"
                        )}
                      >
                        {parseMarkdown(msg.text)}
                      </div>

                      {/* Bubble Action Controls (visible on hover) */}
                      <div
                        className={cn(
                          "flex gap-1.5 mt-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                          isUser ? "self-end flex-row-reverse" : "self-start flex-row"
                        )}
                      >
                        <button
                          onClick={() => handleCopyMessage(msg.text, msg._id || index)}
                          className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-450 dark:text-gray-450 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors cursor-pointer"
                        >
                          {copiedId === (msg._id || index) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        
                        {!isUser && index === messages.length - 1 && !isGenerating && (
                          <button
                            onClick={handleRegenerateResponse}
                            className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-450 dark:text-gray-450 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Generating response typing indicator block */}
              {isGenerating && (
                <div className="flex gap-4 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-indigo-100 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500/10 animate-pulse" />
                  </div>
                  <div className="px-4 py-3.5 bg-white dark:bg-gray-805 border border-gray-150/60 dark:border-gray-800/40 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scroll bottom helper anchor */}
          <div ref={messageEndRef} />
        </div>

        {/* Floating Scroll-to-Bottom Icon */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full shadow-soft hover:bg-gray-50 active:scale-95 transition-all z-10 cursor-pointer"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Medical disclaimer note */}
        <div className="max-w-3xl mx-auto w-full px-4 shrink-0 flex items-center justify-center gap-1.5 text-[9px] md:text-[10px] text-amber-600 dark:text-amber-450 bg-amber-500/5 py-1.5 border-t border-b border-amber-500/10 mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Disclaimer: This AI Health Assistant provides general wellness guidance. Always seek a physician’s advice for diagnosis or treatment.</span>
        </div>

        {/* Input Bar Footer */}
        <footer className="p-4 bg-white dark:bg-gray-900 border-t border-gray-150/60 dark:border-gray-800/60 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative flex items-center bg-gray-50 dark:bg-gray-805 border border-gray-200/50 dark:border-gray-800/80 rounded-2xl p-1 shadow-inner-soft">
              <input
                type="text"
                placeholder={isGenerating ? "AI is generating a reply..." : "Ask your health query here..."}
                value={inputMsg}
                disabled={isGenerating}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 pl-4 pr-12 py-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-xs md:text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {isGenerating ? (
                  <button
                    onClick={handleStopGenerating}
                    className="p-2 bg-red-100 dark:bg-red-950/40 text-red-600 hover:text-red-700 dark:text-red-400 rounded-xl transition-all cursor-pointer active:scale-90"
                    title="Stop Generating"
                  >
                    <Square className="w-4 h-4 fill-red-600 dark:fill-red-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMsg.trim()}
                    className={cn(
                      "p-2 rounded-xl transition-all cursor-pointer active:scale-90",
                      inputMsg.trim()
                        ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow shadow-primary-500/20 hover:scale-105"
                        : "text-gray-300 dark:text-gray-650 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
