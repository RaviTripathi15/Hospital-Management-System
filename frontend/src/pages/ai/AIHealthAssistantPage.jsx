import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Trash2, Edit3, Search, Menu, X, Sparkles,
  Copy, RotateCcw, Square, MessageSquare, Pin, Check, ArrowDown,
  ShieldAlert, ThumbsUp, ThumbsDown, Paperclip, Mic, RefreshCw, Clock, Bot, User
} from 'lucide-react'
import aiService from '@/services/aiService'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

// Suggested questions list
const SUGGESTED_PROMPTS = [
  {
    title: "Indian Diet Plan",
    desc: "Create a balanced 7-day Indian meal guide",
    query: "Create a healthy 7-day Indian diet plan with high protein options."
  },
  {
    title: "Manage Blood Pressure",
    desc: "Tips to reduce hypertension naturally",
    query: "What are effective natural ways to reduce high blood pressure?"
  },
  {
    title: "Diabetes Nutrition",
    desc: "Low-glycemic food guide for diabetics",
    query: "What foods should diabetics include and avoid for blood sugar control?"
  },
  {
    title: "Weekly Fitness Routine",
    desc: "30-min daily exercise schedule",
    query: "Design a 30-minute daily home workout plan for beginners."
  },
  {
    title: "Immunity Boosters",
    desc: "Natural remedies and vitamins",
    query: "How can I strengthen my immune system naturally through diet and lifestyle?"
  },
  {
    title: "Symptom Checker",
    desc: "Understand fever, cough, or fatigue",
    query: "What are the common causes and home care steps for mild fever and body pain?"
  }
]

// Markdown parser helper for rich chat bubbles
const parseMarkdown = (text) => {
  if (!text) return ''

  // Escape HTML characters safely
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers (### text)
  html = html.replace(/^###\s+(.+)$/gm, '<h4 class="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700/80 pb-1">$1</h4>')
  html = html.replace(/^##\s+(.+)$/gm, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>')
  html = html.replace(/^#\s+(.+)$/gm, '<h2 class="text-lg font-black text-slate-950 dark:text-white mt-5 mb-2.5">$1</h2>')

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
      if (line.includes('---')) continue
      
      const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
      tableRows.push(cols)
      lines[i] = '<!-- TABLE_ROW -->'
    } else {
      if (inTable) {
        let tableHtml = '<div class="overflow-x-auto my-3"><table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">'
        tableRows.forEach((row, rIdx) => {
          tableHtml += `<tr class="${rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100' : 'bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'}">`
          row.forEach(col => {
            tableHtml += `<td class="px-3 py-2 border-b border-slate-200 dark:border-slate-700">${col}</td>`
          })
          tableHtml += '</tr>'
        })
        tableHtml += '</table></div>'
        
        const firstPlaceholder = lines.indexOf('<!-- TABLE_ROW -->')
        if (firstPlaceholder !== -1) {
          lines[firstPlaceholder] = tableHtml
        }
        for (let j = 0; j < lines.length; j++) {
          if (lines[j] === '<!-- TABLE_ROW -->') lines[j] = ''
        }
        inTable = false
      }
    }
  }
  html = lines.join('\n')

  // Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-slate-950 dark:text-white">$1</strong>')

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]+?)```/g, '<pre class="bg-slate-900 text-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-700 text-xs font-mono my-2.5 overflow-x-auto">$1</pre>')

  // Bullet points (- text or * text)
  html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc text-xs md:text-sm text-slate-700 dark:text-slate-200 mt-1">$1</li>')
  html = html.replace(/^\*\s+(.+)$/gm, '<li class="ml-4 list-disc text-xs md:text-sm text-slate-700 dark:text-slate-200 mt-1">$1</li>')

  // Numbered lists (1. text)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal text-xs md:text-sm text-slate-700 dark:text-slate-200 mt-1">$1</li>')

  // Paragraph separator (double newline)
  html = html.replace(/\n\n/g, '<div class="h-2"></div>')

  // Single newline to linebreaks
  html = html.replace(/\n/g, '<br />')

  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1.5 text-xs md:text-sm leading-relaxed" />
}

// Time format helper
const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

// Relative date format helper
const formatChatDate = (isoString) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch (e) {
    return ''
  }
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Input & Generation State
  const [inputMsg, setInputMsg] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitleText, setEditTitleText] = useState('')

  // Action / Feedback State
  const [copiedId, setCopiedId] = useState(null)
  const [feedbackState, setFeedbackState] = useState({}) // { [msgIndex]: 'liked' | 'disliked' }
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)

  // References
  const messageEndRef = useRef(null)
  const chatFeedContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Auto expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [inputMsg])

  // Fetch all chats
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

  // Search debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchConversations()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Initial load
  useEffect(() => {
    fetchConversations(true)
  }, [])

  // Auto scroll
  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGenerating])

  // Scroll detection
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight > 250) {
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
      
      await fetchConversations()
      setActiveChatId(newChat._id)
      setMessages(newChat.messages || [])
      setInputMsg('')
      
      if (optionalMessage) {
        scrollToBottom()
      }
    } catch (err) {
      console.error('Failed to create new conversation', err)
      toast.error('Failed to start new chat')
    } finally {
      setChatLoading(false)
    }
  }

  // Clear current active chat messages
  const handleClearCurrentChat = () => {
    if (messages.length === 0) return
    if (window.confirm('Clear current messages in this conversation?')) {
      setMessages([])
      toast.success('Conversation messages cleared')
    }
  }

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const messageText = (typeof textToSend === 'string' ? textToSend : inputMsg).trim()
    if (!messageText || isGenerating) return

    if (!activeChatId) {
      await handleStartNewChat(messageText)
      setInputMsg('')
      return
    }

    // 1. Append user message immediately
    const userTimestamp = new Date().toISOString()
    const tempUserMsg = { sender: 'user', text: messageText, timestamp: userTimestamp }
    setMessages(prev => [...prev, tempUserMsg])
    
    // 2. Clear input box immediately & reset height
    setInputMsg('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // 3. Show "AI is thinking..."
    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    try {
      const res = await aiService.sendChatMessage(activeChatId, messageText, { signal: abortControllerRef.current.signal })
      const data = res.data || res
      
      // 4. Update messages with AI response
      setMessages(data.chat?.messages || [])
      fetchConversations()
    } catch (err) {
      if (abortControllerRef.current?.signal?.aborted || err.name === 'AbortError' || err.name === 'CanceledError') {
        toast('Response generation stopped')
      } else {
        console.error('Failed to send message', err)
        toast.error('Failed to generate AI response')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle KeyDown inside textarea (Enter = Send, Shift+Enter = New line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Stop Generating
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsGenerating(false)
  }

  // Copy Message
  const handleCopyMessage = (text, msgId) => {
    navigator.clipboard.writeText(text)
    setCopiedId(msgId)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Like / Dislike Feedback
  const handleFeedback = (idx, type) => {
    setFeedbackState(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }))
    if (feedbackState[idx] !== type) {
      toast.success(type === 'liked' ? 'Thanks for your positive feedback!' : 'Feedback submitted to improve responses')
    }
  }

  // Regenerate last response
  const handleRegenerateResponse = async () => {
    if (messages.length < 2 || isGenerating) return
    
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

  // Delete chat
  const handleDeleteChat = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return
    try {
      await aiService.deleteChat(id)
      toast.success('Conversation deleted')
      
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

  // Pin/Unpin chat
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

  // Rename chat
  const handleRenameChat = async (id) => {
    if (!editTitleText.trim()) return
    try {
      await aiService.updateChat(id, { title: editTitleText.trim() })
      toast.success('Conversation renamed')
      setEditingChatId(null)
      fetchConversations()
    } catch (err) {
      console.error('Failed to rename chat', err)
      toast.error('Could not rename chat')
    }
  }

  // Voice recording mock toggle
  const handleToggleVoice = () => {
    if (isVoiceRecording) {
      setIsVoiceRecording(false)
      toast.success('Voice input captured')
    } else {
      setIsVoiceRecording(true)
      toast('Listening for voice input... Speak now.')
      setTimeout(() => {
        setIsVoiceRecording(false)
      }, 4000)
    }
  }

  // Group conversations into Pinned and Recent
  const pinnedChats = conversations.filter(c => c.isPinned)
  const recentChats = conversations.filter(c => !c.isPinned)

  return (
    <div className="h-[calc(100vh-90px)] flex bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-md relative">
      
      {/* ─── HISTORY SIDEBAR ─── */}
      <aside
        className={cn(
          "w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-30 transition-transform duration-300 absolute lg:relative lg:translate-x-0 shrink-0",
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => handleStartNewChat()}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* History Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {historyLoading ? (
            <div className="flex justify-center items-center py-12"><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No past conversations</span>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedChats.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                    Pinned Chats
                  </p>
                  {pinnedChats.map((chat) => {
                    const lastMsg = chat.messages?.[chat.messages.length - 1]?.text || 'No messages'
                    const dateStr = formatChatDate(chat.updatedAt || chat.createdAt)
                    return (
                      <div
                        key={chat._id}
                        onClick={() => loadConversation(chat._id)}
                        className={cn(
                          "group flex flex-col p-2.5 rounded-xl cursor-pointer select-none transition-all duration-200 border text-xs relative",
                          activeChatId === chat._id
                            ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700/50 text-slate-900 dark:text-white"
                            : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {editingChatId === chat._id ? (
                            <input
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              onBlur={() => handleRenameChat(chat._id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(chat._id)}
                              autoFocus
                              className="flex-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-500 text-xs focus:outline-none text-slate-900 dark:text-white"
                            />
                          ) : (
                            <span className="font-bold truncate flex-1 text-slate-900 dark:text-slate-100">{chat.title}</span>
                          )}

                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">{dateStr}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 pr-14 font-normal">
                          {lastMsg}
                        </p>

                        {/* Quick action buttons on hover */}
                        <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100/90 dark:bg-slate-800/90 px-1 py-0.5 rounded-lg">
                          <button
                            onClick={(e) => handleTogglePinChat(chat, e)}
                            title="Unpin Chat"
                            className="p-1 hover:text-emerald-500 text-emerald-500 transition-colors"
                          >
                            <Pin className="w-3 h-3 fill-emerald-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingChatId(chat._id)
                              setEditTitleText(chat.title)
                            }}
                            title="Rename"
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat._id, e)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Recent Section */}
              {recentChats.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1">Recent Chats</p>
                  {recentChats.map((chat) => {
                    const lastMsg = chat.messages?.[chat.messages.length - 1]?.text || 'No messages'
                    const dateStr = formatChatDate(chat.updatedAt || chat.createdAt)
                    return (
                      <div
                        key={chat._id}
                        onClick={() => loadConversation(chat._id)}
                        className={cn(
                          "group flex flex-col p-2.5 rounded-xl cursor-pointer select-none transition-all duration-200 border text-xs relative",
                          activeChatId === chat._id
                            ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700/50 text-slate-900 dark:text-white"
                            : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {editingChatId === chat._id ? (
                            <input
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              onBlur={() => handleRenameChat(chat._id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(chat._id)}
                              autoFocus
                              className="flex-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-500 text-xs focus:outline-none text-slate-900 dark:text-white"
                            />
                          ) : (
                            <span className="font-bold truncate flex-1 text-slate-900 dark:text-slate-100">{chat.title}</span>
                          )}

                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">{dateStr}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 pr-14 font-normal">
                          {lastMsg}
                        </p>

                        {/* Quick action buttons on hover */}
                        <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100/90 dark:bg-slate-800/90 px-1 py-0.5 rounded-lg">
                          <button
                            onClick={(e) => handleTogglePinChat(chat, e)}
                            title="Pin Chat"
                            className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
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
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat._id, e)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 lg:hidden"
        />
      )}

      {/* ─── MAIN CHAT CANVAS ─── */}
      <main className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 relative overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeChatId ? (conversations.find(c => c._id === activeChatId)?.title || 'AI Health Assistant') : 'AI Health Assistant'}</span>
                  {activeChatId && conversations.find(c => c._id === activeChatId)?.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  )}
                </h2>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Enterprise Clinical Guidance • Medical & Wellness Knowledge
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearCurrentChat}
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Clear current conversation"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}

            {activeChatId && (
              <button
                onClick={(e) => {
                  const chatObj = conversations.find(c => c._id === activeChatId)
                  if (chatObj) handleTogglePinChat(chatObj, e)
                }}
                className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl cursor-pointer"
                title="Pin/Unpin Conversation"
              >
                <Pin className={cn("w-4 h-4", conversations.find(c => c._id === activeChatId)?.isPinned && "fill-emerald-500 text-emerald-500")} />
              </button>
            )}
          </div>
        </header>

        {/* Chat Feed */}
        <div
          ref={chatFeedContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative"
        >
          {chatLoading && activeChatId ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs z-10">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            /* SUGGESTED PROMPTS GRID (Shown ONLY before the first message) */
            <div className="max-w-3xl mx-auto py-8 md:py-12 px-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-md mb-5">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white text-center">
                How can I assist your health today?
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-2 text-center max-w-lg font-medium leading-relaxed">
                Ask about diet plans, clinical symptoms, prescription guidance, workout routines, or healthcare center availability.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-8 w-full">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.query)}
                    className="p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 text-left transition-all active:scale-[0.98] shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 rounded-2xl group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {prompt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {prompt.desc}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-emerald-600 dark:text-emerald-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ask AI &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGES LIST */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user'
                const timeStr = formatTime(msg.timestamp)
                const isLiked = feedbackState[index] === 'liked'
                const isDisliked = feedbackState[index] === 'disliked'

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-3 md:gap-4 items-start group",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8.5 h-8.5 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border shadow-xs select-none",
                        isUser
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-800 text-white border-slate-700 dark:bg-slate-800 dark:border-slate-700"
                      )}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5 text-emerald-400" />}
                    </div>

                    {/* Chat Bubble Container */}
                    <div className={cn("flex flex-col max-w-[85%] sm:max-w-[78%]", isUser ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-4 md:px-5 py-3.5 rounded-2xl shadow-xs border transition-all",
                          isUser
                            ? "bg-emerald-600 text-white border-emerald-600 rounded-tr-xs"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-tl-xs"
                        )}
                      >
                        {parseMarkdown(msg.text)}
                      </div>

                      {/* Timestamp & Action Toolbar */}
                      <div className={cn("flex items-center gap-2 mt-1.5 px-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium", isUser ? "flex-row-reverse" : "flex-row")}>
                        {timeStr && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeStr}
                          </span>
                        )}

                        {/* AI Action Toolbar: Copy, Regenerate, Like/Dislike */}
                        {!isUser && (
                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                            <button
                              onClick={() => handleCopyMessage(msg.text, msg._id || index)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === (msg._id || index) ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {index === messages.length - 1 && !isGenerating && (
                              <button
                                onClick={handleRegenerateResponse}
                                className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                                title="Regenerate response"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => handleFeedback(index, 'liked')}
                              className={cn(
                                "p-1 transition-colors cursor-pointer",
                                isLiked ? "text-emerald-500 font-bold" : "text-slate-500 hover:text-emerald-500 dark:text-slate-400"
                              )}
                              title="Good response"
                            >
                              <ThumbsUp className={cn("w-3 h-3", isLiked && "fill-emerald-500")} />
                            </button>

                            <button
                              onClick={() => handleFeedback(index, 'disliked')}
                              className={cn(
                                "p-1 transition-colors cursor-pointer",
                                isDisliked ? "text-red-500 font-bold" : "text-slate-500 hover:text-red-500 dark:text-slate-400"
                              )}
                              title="Poor response"
                            >
                              <ThumbsDown className={cn("w-3 h-3", isDisliked && "fill-red-500")} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* "AI is thinking..." Animated Indicator */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 md:gap-4 items-start"
                >
                  <div className="w-8.5 h-8.5 rounded-xl bg-slate-800 text-white dark:bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs flex items-center gap-3 shadow-xs">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">AI is thinking...</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Floating Scroll-to-Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-full shadow-md hover:bg-slate-100 active:scale-95 transition-all z-10 cursor-pointer"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Medical Disclaimer Banner */}
        <div className="max-w-3xl mx-auto w-full px-4 shrink-0 flex items-center justify-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-350 bg-amber-500/10 py-1.5 border-t border-b border-amber-500/20">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Disclaimer: AI provides wellness advice only. Consult a licensed doctor for medical treatment.</span>
        </div>

        {/* ─── MODERN MULTI-LINE INPUT BOX ─── */}
        <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            
            {/* Input Bar Shell */}
            <div className="relative flex items-end bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500">
              
              {/* Attach File Button */}
              <button
                onClick={() => toast('File attachment support coming soon')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 mb-0.5"
                title="Attach medical document or image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Multi-line Auto Expanding Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMsg}
                disabled={isGenerating}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isGenerating ? "AI is generating a response..." : "Ask anything about your health..."}
                className="flex-1 px-3 py-1.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none text-xs md:text-sm resize-none max-h-40 font-medium leading-relaxed opacity-100"
              />

              {/* Action Buttons: Voice & Send/Stop */}
              <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                
                {/* Voice Input Button */}
                <button
                  onClick={handleToggleVoice}
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    isVoiceRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                  title="Voice Input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send or Stop Button */}
                {isGenerating ? (
                  <button
                    onClick={handleStopGenerating}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="Stop Generating"
                  >
                    <Square className="w-4 h-4 fill-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMsg.trim()}
                    className={cn(
                      "p-2 rounded-xl transition-all cursor-pointer active:scale-95",
                      inputMsg.trim()
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    )}
                    title="Send message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

            {/* Input Bar Footer Specs: Character Counter & Shortcut hint */}
            <div className="flex justify-between items-center px-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold select-none">
              <span>Shift + Enter for new line</span>
              <span>{inputMsg.length} / 2000</span>
            </div>

          </div>
        </footer>

      </main>

    </div>
  )
}
