import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2, HelpCircle, Activity, Pill, Building2, Info, AlertTriangle } from 'lucide-react'
import aiService from '@/services/aiService'
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

// Simple helper to parse basic markdown to HTML safely
const parseMarkdown = (text) => {
  if (!text) return ''
  
  // Escape HTML characters
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Headers (### text)
  html = html.replace(/^###\s+(.+)$/gm, '<h4 class="text-sm font-black text-gray-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1 border-b border-gray-150/50 dark:border-gray-700/50 pb-1">$1</h4>')
  
  // Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-gray-955 dark:text-white">$1</strong>')
  
  // Bullet points (- text)
  html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc text-xs text-gray-700 dark:text-gray-300 mt-1">$1</li>')
  
  // Double newlines to paragraphs
  html = html.replace(/\n\n/g, '<div class="h-2"></div>')
  
  // Single newlines to linebreaks
  html = html.replace(/\n/g, '<br />')
  
  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1 text-xs leading-relaxed" />
}

export default function AIHealthAssistant({ patientProfile = null, nearbyCenters = [] }) {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Health Assistant. How can I help you today? Ask me about symptoms, medicines, local PHC recommendations, or health tips.',
      timestamp: new Date().toISOString()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatIsTyping, setChatIsTyping] = useState(false)
  const [connectionState, setConnectionState] = useState('connected') // connected, local
  const chatEndRef = useRef(null)

  // Scroll to bottom on new messages
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
A fever is typically a sign that your body is fighting off an infection (viral or bacterial).

**What to do:**
- **Stay Hydrated:** Drink plenty of fluids (water, clear broths, oral rehydration solutions).
- **Rest:** Avoid heavy physical exertion.
- **Monitor:** Check your temperature every 4-6 hours.
- **Medication:** Over-the-counter paracetamol can help reduce fever. Follow dosage guidelines.

**⚠️ Warning Signs (Consult a Doctor Immediately):**
- Fever exceeds 102°F (38.9°C) or lasts more than 3 days.
- Accompanied by severe headache, stiff neck, shortness of breath, or confusion.`
    } else if (cleanText.includes('headache') || cleanText.includes('migraine')) {
      responseText = `### 🧠 Symptom Checker: Headaches
Headaches are very common and can stem from multiple causes, including dehydration, stress, lack of sleep, or eye strain.

**What to do:**
- **Hydrate:** Drink a large glass of water, as dehydration is a primary trigger.
- **Rest:** Relax in a quiet, dark room. Apply a cool compress to your forehead.
- **Limit Screens:** Take a break from mobile phones and laptops.

**⚠️ Warning Signs (Emergency Care Required):**
- A sudden, extremely severe headache ("thunderclap").
- Headache accompanied by fever, stiff neck, confusion, or difficulty speaking.`
    } else if (cleanText.includes('cough') || cleanText.includes('cold') || cleanText.includes('sore throat') || cleanText.includes('flu')) {
      responseText = `### 🤧 Symptom Checker: Cough, Cold, & Sore Throat
Most respiratory tract symptoms are viral and resolve on their own within 7-10 days.

**What to do:**
- **Warm Liquids:** Drink herbal teas, warm water with honey, or clear soups to soothe the throat.
- **Steam Inhalation:** Inhale steam from a bowl of hot water to relieve congestion.
- **Saltwater Gargle:** Gargle with warm salt water (1/2 tsp salt in warm water) 3-4 times a day.

**⚠️ Warning Signs (See a Doctor):**
- Difficulty breathing, persistent wheezing, or chest tightness.
- Symptoms that worsen significantly after starting to improve, or persist beyond 10 days.`
    } else if (cleanText.includes('stomach') || cleanText.includes('pain') || cleanText.includes('nausea') || cleanText.includes('diarrhea') || cleanText.includes('vomit')) {
      responseText = `### 🤢 Symptom Checker: Gastrointestinal Issues
Indigestion, food poisoning, or stomach flu can cause cramping, nausea, vomiting, or diarrhea.

**What to do:**
- **Sip Liquids:** Drink small sips of water, dilute juices, or Oral Rehydration Salts (ORS) to prevent dehydration.
- **Bland Diet:** Eat light, binding foods like bananas, rice, applesauce, or toast.
- **Avoid Triggers:** Stay away from dairy, caffeine, spicy, or fatty foods.

**⚠️ Warning Signs (Seek Urgent Care):**
- Severe, localized abdominal pain (especially in the lower right side).
- Inability to keep any liquids down for more than 24 hours.`
    } else if (cleanText.includes('paracetamol') || cleanText.includes('acetaminophen') || cleanText.includes('crocin') || cleanText.includes('dolo')) {
      responseText = `### 💊 Medicine Info: Paracetamol
Paracetamol is a widely used over-the-counter analgesic (pain reliever) and antipyretic (fever reducer).

- **Common Uses:** Pain relief (headaches, muscle aches, toothaches) and reducing fever.
- **Standard Adult Dosage:** 500mg - 1000mg every 4 to 6 hours as needed.
- **Maximum Limit:** **Do not exceed 4000mg (4g) in a 24-hour period.**
- **Precautions:** Excess usage can cause severe liver damage. Avoid alcohol and check other cold medications to avoid duplication.`
    } else if (cleanText.includes('metformin')) {
      responseText = `### 💊 Medicine Info: Metformin
Metformin is an oral medication used to manage blood glucose levels in patients with Type 2 Diabetes.

- **How it Works:** It improves insulin sensitivity and reduces glucose absorption in the gut.
- **Dosage Guidelines:** Always follow your physician's prescription. Typically taken **with meals** to minimize gastrointestinal discomfort.
- **Precautions:** Avoid excessive alcohol intake while taking Metformin to minimize the rare risk of lactic acidosis.`
    } else if (cleanText.includes('atorvastatin') || cleanText.includes('statin')) {
      responseText = `### 💊 Medicine Info: Atorvastatin
Atorvastatin lowers cholesterol and triglycerides to reduce the risk of heart disease.

- **Dosage:** Taken once daily, usually in the evening. Dosages range from 10mg to 80mg depending on medical history.
- **Precautions:** Inform your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness.`
    } else if (cleanText.includes('medicine') || cleanText.includes('drug') || cleanText.includes('prescription')) {
      if (activePrescriptions.length > 0) {
        const medsList = activePrescriptions.map((m, i) => `${i + 1}. **${m.medicine}** (${m.dosage})`).join('\n')
        responseText = `### 📋 Your Active Prescriptions
Based on your clinical record, you are prescribed:
${medsList}

*For safety, always follow the dosage instructions on the packaging. Consult your PHC provider before modifying your treatment plan.*`
      } else {
        responseText = `### 💊 General Medicine Safety
I can provide information on common medications like Paracetamol, Metformin, and Atorvastatin.

**Key Safety Rules:**
- Always complete the course of antibiotics as prescribed.
- Never share prescription medications.
- Store drugs in a cool, dry place out of reach of children.`
      }
    } else if (cleanText.includes('phc') || cleanText.includes('center') || cleanText.includes('clinic') || cleanText.includes('recommend') || cleanText.includes('nearby')) {
      if (nearbyCenters && nearbyCenters.length > 0) {
        const list = nearbyCenters.slice(0, 3).map((c, i) => {
          return `${i + 1}. **${c.name}** (${c.type})
   - Block: ${c.block}, District: ${c.district}
   - Contact: ${c.contactNumber || 'Not available'}`
        }).join('\n\n')
        responseText = `### 🏥 Recommended Local Health Centers
Based on your registered district, we recommend visiting:

${list}

*You can schedule appointments or check doctor schedules in the Health Centers tab on your dashboard.*`
      } else {
        responseText = `### 🏥 Nearby Health Centers
I recommend seeking medical consultations at your nearest Primary Health Center (PHC).

- You can search for nearby clinics by clicking **Find Nearby PHC** on your dashboard.
- Select your district and block to see active centers, doctor timetables, and contact numbers.`
      }
    } else if (cleanText.includes('tip') || cleanText.includes('advice') || cleanText.includes('health tips') || cleanText.includes('lifestyle')) {
      const randTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)]
      responseText = `### 💡 Healthy Lifestyle Tip
Here is a quick wellness tip for today:

**${randTip}**

*Small habits compound into major health benefits. Keep tracking your vitals to see your overall health score improve!*`
    } else if (cleanText.includes('symptom') || cleanText.includes('check')) {
      responseText = `### 🩺 Symptom Checker Assistance
I can guide you on symptoms. Try asking me:
- **"I have a fever"**
- **"What to do for a stomach ache?"**
- **"I have a cough and throat irritation"**

*Disclaimer: This is for guidance only. For medical issues, visit a clinic or call 108 immediately.*`
    } else {
      responseText = `I've received your query. I am operating in local fallback mode.

Feel free to ask me about:
- **Symptoms** (e.g. fever, headache, cough, stomach pain)
- **Medicines** (e.g. Paracetamol, Metformin, Atorvastatin)
- **Nearest PHCs** (clinical recommendations)
- **Healthy Lifestyle Tips** (daily tips)

*For medical emergencies, please dial 108 immediately.*`
    }

    setChatMessages(prev => [...prev, {
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString()
    }])
    setChatIsTyping(false)
  }

  const handleSendChatMessage = async (customText = null) => {
    const textToSend = customText || chatInput
    if (!textToSend || !textToSend.trim()) return

    // Append user message
    const userMsg = { sender: 'user', text: textToSend, timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMsg])
    if (!customText) setChatInput('')
    
    // Show typing state
    setChatIsTyping(true)

    // Call backend API
    try {
      const apiHistory = chatMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }))

      const responseData = await aiService.chat(textToSend, apiHistory)
      
      if (responseData && responseData.data && responseData.data.reply) {
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: responseData.data.reply,
          timestamp: new Date().toISOString()
        }])
        setConnectionState('connected')
        setChatIsTyping(false)
      } else {
        throw new Error('Invalid API response format')
      }
    } catch (err) {
      console.warn("Backend AI chat unavailable, falling back to local responder", err)
      setConnectionState('local')
      setTimeout(() => {
        handleClientSideResponse(textToSend)
      }, 700)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[440px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-2xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white flex items-center gap-2">
              AI Health Assistant
              <span className="flex h-2 w-2 relative">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  connectionState === 'connected' ? "bg-emerald-400" : "bg-amber-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  connectionState === 'connected' ? "bg-emerald-500" : "bg-amber-500"
                )}></span>
              </span>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                {connectionState === 'connected' ? 'Interactive Core' : 'Local Fallback'}
              </p>
              {connectionState === 'local' && (
                <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 px-1.5 py-0.2 rounded font-bold uppercase tracking-widest flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> offline
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setChatMessages([
            {
              sender: 'ai',
              text: 'Hello! I am your AI Health Assistant. How can I help you today? Ask me about symptoms, medicines, local PHC recommendations, or health tips.',
              timestamp: new Date().toISOString()
            }
          ])}
          title="Clear Conversation"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 my-4 overflow-y-auto min-h-[220px] max-h-[300px] space-y-3.5 pr-2 bg-gray-50/40 dark:bg-gray-900/10 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800/40 custom-scrollbar">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-end gap-2.5",
              msg.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 bg-primary-50 dark:bg-primary-950/40 text-primary-500 rounded-full flex items-center justify-center shrink-0 border border-primary-100/50 dark:border-primary-900/10 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            <div
              className={cn(
                "p-3.5 rounded-2xl text-xs max-w-[85%] shadow-sm leading-relaxed",
                msg.sender === 'user'
                  ? "bg-primary-600 text-white rounded-br-none font-medium"
                  : "bg-white dark:bg-gray-800 text-gray-850 dark:text-gray-250 rounded-bl-none border border-gray-150/65 dark:border-gray-700/60"
              )}
            >
              {msg.sender === 'ai' ? parseMarkdown(msg.text) : msg.text}
              <span className={cn(
                "block text-[8px] mt-1 text-right",
                msg.sender === 'user' ? "text-white/60" : "text-gray-400 dark:text-gray-500"
              )}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {chatIsTyping && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-7 h-7 bg-primary-50 dark:bg-primary-950/40 text-primary-500 rounded-full flex items-center justify-center shrink-0 border border-primary-100/50 dark:border-primary-900/10 text-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-primary-600 dark:text-primary-400" />
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700/50 text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 max-w-full scrollbar-none">
        {[
          { label: 'Symptom Checker', query: 'Symptom Checker: I have a high fever', icon: Activity, color: 'hover:text-amber-500 hover:border-amber-300 dark:hover:border-amber-900/50' },
          { label: 'Medicine Info', query: 'Tell me about Paracetamol', icon: Pill, color: 'hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-900/50' },
          { label: 'Nearest PHCs', query: 'Recommend a nearby PHC center', icon: Building2, color: 'hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-900/50' },
          { label: 'Get Health Tip', query: 'Give me a daily health tip', icon: HelpCircle, color: 'hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-900/50' }
        ].map((tag, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendChatMessage(tag.query)}
            className={cn(
              "px-3.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border border-gray-150/50 dark:border-gray-700/30 text-[10px] font-bold tracking-wide shrink-0 transition-all cursor-pointer flex items-center gap-1 active:scale-95",
              tag.color
            )}
          >
            <tag.icon className="w-3 h-3" />
            {tag.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendChatMessage()
        }}
        className="flex gap-2.5"
      >
        <input
          type="text"
          placeholder="Ask about symptoms, medicines, or center recommendations..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatIsTyping}
          className="flex-1 input-field py-3.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-800 text-xs shadow-inner focus:border-primary-500 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={chatIsTyping || !chatInput.trim()}
          className="px-5 py-3.5 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/10 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  )
}
