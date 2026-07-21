import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Trash2, HelpCircle, Activity, Pill, Building2,
  Info, AlertTriangle, Copy, Check, ThumbsUp, ThumbsDown, Mic, Paperclip, Square, Clock, Bot, User
} from 'lucide-react'
import aiService from '@/services/aiService'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

// Local health tips for client-side fallback
const FALLBACK_TIPS = [
  "Stay hydrated! Aim for at least 8-10 glasses of water daily.",
  "A 30-minute daily walk can drastically improve cardiovascular health.",
  "Ensure you get 7-8 hours of quality sleep for physical restoration.",
  "Include colorful vegetables in your meals for rich antioxidants.",
  "Practice mindful breathing for 5 minutes to alleviate stress levels.",
  "Remember to rest your eyes if you work on computers (20-20-20 rule)."
]

// Suggested Quick Questions
const QUICK_PROMPTS = [
  "What to do for fever?",
  "Healthy Indian diet plan",
  "How to lower blood pressure?",
  "Daily workout recommendations"
]

// Markdown parser helper for rich chat bubbles
const parseMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  html = html.replace(/^###\s+(.+)$/gm, '<h4 class="text-xs md:text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1">$1</h4>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-slate-950 dark:text-white">$1</strong>')
  html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-3 list-disc text-xs text-slate-700 dark:text-slate-200 mt-0.5">$1</li>')
  html = html.replace(/\n\n/g, '<div class="h-2"></div>')
  html = html.replace(/\n/g, '<br />')
  
  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1 text-xs md:text-sm leading-relaxed" />
}

// Format timestamp
const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

export default function AIHealthAssistant({ patientProfile = null, nearbyCenters = [] }) {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Health Assistant. Ask me anything about diet, symptoms, medicines, or wellness tips.',
      timestamp: new Date().toISOString()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatIsTyping, setChatIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [feedbackState, setFeedbackState] = useState({})
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [chatInput])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatIsTyping])

  // Client-side fallback responder
  const handleClientSideResponse = (userText) => {
    const cleanText = userText.toLowerCase()
    let responseText = ""
    let activePrescriptions = []

    if (patientProfile && patientProfile.medicalHistory) {
      patientProfile.medicalHistory.forEach(visit => {
        if (visit.prescription && Array.isArray(visit.prescription)) {
          activePrescriptions.push(...visit.prescription)
        }
      })
    }

    if (cleanText.includes('fever') || cleanText.includes('temp') || cleanText.includes('chills')) {
      responseText = `### 🤒 Symptom Checker: Fever & Temperature
A fever is typically a sign that your body is fighting off an infection.

**What to do:**
- **Stay Hydrated:** Drink plenty of fluids (water, clear broths, ORS).
- **Rest:** Avoid heavy physical exertion.
- **Medication:** Over-the-counter paracetamol can help. Follow dosage guidelines.

**⚠️ Warning Signs (Consult a Doctor Immediately):**
- Fever exceeds 102°F (38.9°C) or lasts over 3 days.`
    } else if (cleanText.includes('headache') || cleanText.includes('migraine')) {
      responseText = `### 🧠 Symptom Checker: Headaches
Headaches often stem from dehydration, eye strain, lack of sleep, or stress.

**What to do:**
- **Hydrate:** Drink a large glass of water.
- **Rest:** Relax in a quiet, dark room.
- **Limit Screens:** Take a break from mobile phones and laptops.`
    } else if (cleanText.includes('diet') || cleanText.includes('food') || cleanText.includes('nutrition')) {
      responseText = `### 🥗 Nutrition & Diet Plan
A balanced diet supports daily energy and long-term health.

**Recommendations:**
- **Proteins:** Include lentils (dal), paneer, eggs, or lean chicken.
- **Fiber:** Eat whole grains (roti, brown rice) and green leafy vegetables.
- **Hydration:** Consume buttermilk, coconut water, or fresh lemon water.`
    } else {
      const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)]
      responseText = `Thank you for your question. Here is a wellness recommendation:

**Health Tip:** ${randomTip}

If you are experiencing acute symptoms, please consult a medical practitioner or visit a nearby Health Center.`
    }

    return responseText
  }

  // Send message
  const handleSendMessage = async (textToSend) => {
    const messageText = (typeof textToSend === 'string' ? textToSend : chatInput).trim()
    if (!messageText || chatIsTyping) return

    // 1. Append User message immediately
    const userMsg = { sender: 'user', text: messageText, timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // 2. Show thinking indicator
    setChatIsTyping(true)

    try {
      const historyPayload = chatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
      const data = await aiService.chat(messageText, historyPayload)

      const aiMsg = {
        sender: 'ai',
        text: data.reply || data.message || data.text || handleClientSideResponse(messageText),
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.warn('AI Service unavailable, using smart local fallback response', err)
      const fallbackReply = handleClientSideResponse(messageText)
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setChatIsTyping(false)
    }
  }

  // Keyboard shortcut Enter = Send, Shift+Enter = Newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Copy Message
  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedId(idx)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Feedback Like / Dislike
  const handleFeedback = (idx, type) => {
    setFeedbackState(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }))
    if (feedbackState[idx] !== type) {
      toast.success(type === 'liked' ? 'Thanks for your feedback!' : 'Feedback recorded')
    }
  }

  // Clear chat
  const handleClearChat = () => {
    if (chatMessages.length <= 1) return
    if (window.confirm('Clear current chat messages?')) {
      setChatMessages([{
        sender: 'ai',
        text: 'Hello! I am your AI Health Assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }])
    }
  }

  // Voice recording mock toggle
  const handleToggleVoice = () => {
    if (isVoiceRecording) {
      setIsVoiceRecording(false)
      toast.success('Voice input captured')
    } else {
      setIsVoiceRecording(true)
      toast('Listening... Speak your query.')
      setTimeout(() => setIsVoiceRecording(false), 3500)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[560px] relative overflow-hidden">
      
      {/* Widget Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>AI Health Assistant</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Interactive Symptom & Wellness Companion
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/40">
        
        {/* Suggested Quick Prompts (only when 1 message) */}
        {chatMessages.length <= 1 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Suggested Queries:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {chatMessages.map((msg, index) => {
          const isUser = msg.sender === 'user'
          const timeStr = formatTime(msg.timestamp)
          const isLiked = feedbackState[index] === 'liked'
          const isDisliked = feedbackState[index] === 'disliked'

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2.5 items-start group", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0 border select-none",
                  isUser
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-800 text-white border-slate-700"
                )}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              {/* Bubble content */}
              <div className={cn("flex flex-col max-w-[84%]", isUser ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl shadow-2xs border text-xs md:text-sm",
                    isUser
                      ? "bg-emerald-600 text-white border-emerald-600 rounded-tr-xs"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-tl-xs"
                  )}
                >
                  {parseMarkdown(msg.text)}
                </div>

                {/* Footer specs */}
                <div className={cn("flex items-center gap-2 mt-1 px-1 text-[9.5px] text-slate-400 dark:text-slate-500", isUser ? "flex-row-reverse" : "flex-row")}>
                  {timeStr && <span>{timeStr}</span>}

                  {!isUser && (
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-700/40">
                      <button
                        onClick={() => handleCopyMessage(msg.text, index)}
                        className="p-0.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copy"
                      >
                        {copiedId === index ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => handleFeedback(index, 'liked')}
                        className={cn("p-0.5 transition-colors cursor-pointer", isLiked ? "text-emerald-500" : "hover:text-emerald-500")}
                        title="Like"
                      >
                        <ThumbsUp className={cn("w-3 h-3", isLiked && "fill-emerald-500")} />
                      </button>

                      <button
                        onClick={() => handleFeedback(index, 'disliked')}
                        className={cn("p-0.5 transition-colors cursor-pointer", isDisliked ? "text-red-500" : "hover:text-red-500")}
                        title="Dislike"
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

        {/* Thinking indicator */}
        {chatIsTyping && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>
            <div className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>AI is thinking...</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="relative flex items-end bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40">
          
          <button
            onClick={() => toast('File attachment coming soon')}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 mb-0.5"
            title="Attach File"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={chatInput}
            disabled={chatIsTyping}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatIsTyping ? "AI is thinking..." : "Ask anything about your health..."}
            className="flex-1 px-2 py-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-xs resize-none max-h-28 font-medium opacity-100"
          />

          <div className="flex items-center gap-1 shrink-0 mb-0.5">
            <button
              onClick={handleToggleVoice}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                isVoiceRecording ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
              )}
              title="Voice Input"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || chatIsTyping}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer active:scale-95",
                chatInput.trim() && !chatIsTyping
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
              title="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-1 mt-1 text-[9px] text-slate-400 dark:text-slate-500 font-medium select-none">
          <span>Press Enter to send</span>
          <span>{chatInput.length} / 2000</span>
        </div>
      </div>

    </div>
  )
}
