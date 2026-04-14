import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

/* ============================================
   TravelView AI Chatbot — Gemini 2.0 Flash
   ============================================ */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are **TravelView AI**, the official concierge assistant for the TravelView premium travel platform.

## About TravelView
TravelView is an elite AI-powered travel concierge. It helps users:
- Plan and book curated luxury travel experiences in one conversation
- Get hyper-personalized destination recommendations powered by AI ("Soul Matching")
- Access real-time weather, local events, and insider tips ("Live Local Intel")
- Build complete itineraries from scratch with the AI Concierge feature
- Seamlessly book everything — from chat to check-in in a single tap

## Website Navigation
- **Home / Hero section**: Scroll to top — "See The World Differently"
- **Discover (Features)**: Scroll down to the features section showcasing AI Concierge, Soul Matching, Live Local Intel, and Seamless Booking
- **Stories (Testimonials)**: Further down — real traveler reviews
- **Get Started / Book Your Curated Escape**: The CTA at the bottom to start booking
- **Map Button**: Bottom-right corner — opens an interactive world map with live weather for cities
- **Footer**: Links to Destinations, How It Works, Pricing, About, Careers, Contact, Privacy, Terms

## How Booking Works
1. Click "Get Started" or "Book Your Curated Escape"
2. Describe your dream trip in one sentence to the AI Concierge
3. The AI crafts a bespoke itinerary within seconds
4. Review, customize, and confirm
5. From chat to check-in — your entire trip is handled

## How to Curate Your Own Itinerary
1. Tell the AI your travel dates, budget, interests, and any must-see spots
2. The Soul Matching algorithm reads your travel DNA
3. Receive a fully personalized day-by-day plan
4. Adjust anything — add activities, change hotels, swap destinations
5. Confirm and book in one tap

## Your Behavior
- Be warm, enthusiastic, and luxurious in tone — match the premium brand voice
- Use emojis sparingly but tastefully (✦, 🌍, ✈️)
- Keep responses concise (2-4 sentences unless the user asks for detail)
- If the user asks how to navigate the website, give specific section names
- If the user asks about features, explain them with the TravelView branding
- If you don't know something specific about pricing or availability, say "Our team will personalize that for you once you click Get Started!"
- Never break character — you ARE TravelView AI`;

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const genAI = new GoogleGenerativeAI(API_KEY);

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Welcome to TravelView ✦ I'm your AI concierge — here to help you navigate the site, plan your dream trip, or craft a bespoke itinerary. How can I elevate your journey today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Initialize chat session
  const getChat = useCallback(() => {
    if (!chatRef.current) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      chatRef.current = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }],
          },
          {
            role: 'model',
            parts: [
              {
                text: "Understood! I'm TravelView AI, ready to help users explore the platform, navigate the website, book trips, and curate personalized itineraries. I'll maintain a warm, premium tone throughout. How can I assist?",
              },
            ],
          },
        ],
      });
    }
    return chatRef.current;
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chat = getChat();
      const result = await chat.sendMessage(trimmed);
      const response = await result.response;
      const botText = response.text();

      setMessages((prev) => [...prev, { role: 'model', text: botText }]);
    } catch (err: any) {
      console.error('Gemini error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: "I'm having trouble connecting right now. Please try again in a moment ✦",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── FAB Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-fab"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            aria-label="Open chat"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">✦</div>
                <div>
                  <div className="chat-header-title">
                    Travel<span>View</span> AI
                  </div>
                  <div className="chat-header-status">
                    <span className="chat-status-dot" />
                    Online
                  </div>
                </div>
              </div>
              <button
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.role === 'model' && (
                    <div className="chat-msg-avatar">✦</div>
                  )}
                  <div className="chat-msg-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-msg chat-msg-model">
                  <div className="chat-msg-avatar">✦</div>
                  <div className="chat-msg-bubble chat-typing">
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
