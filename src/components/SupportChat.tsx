import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Order } from '../types';
import { COUPONS } from '../data/defaultMenu';
import { subscribeToSupportMessages, sendSupportMessageToFirestore } from '../firebase';
import { Send, X, Bot, User, Sparkles, PhoneCall, ShieldCheck } from 'lucide-react';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
  userPhone?: string;
}

export const SupportChat: React.FC<SupportChatProps> = ({
  isOpen,
  onClose,
  activeOrder,
  userPhone = '9006759560'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: '👋 Namaskar! Welcome to Bhumi Cloud Kitchen Support. How can I help you today with your homestyle feast?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to live Firestore chat messages
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToSupportMessages(userPhone, (liveMsgs) => {
      if (liveMsgs && liveMsgs.length > 0) {
        setMessages(liveMsgs);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, userPhone]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    setInputVal('');
    setIsTyping(true);

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: 'usr_' + now,
      sender: 'user',
      text: text,
      timestamp: timeStr,
      userPhone: userPhone,
      orderId: activeOrder?.orderId || '',
      createdAt: now
    };
    setMessages((prev) => [...prev, userMsg]);

    // Send to Firestore
    await sendSupportMessageToFirestore({
      text,
      sender: 'user',
      userPhone,
      orderId: activeOrder?.orderId || ''
    });

    // Generate intelligent response and save to Firestore
    setTimeout(async () => {
      let reply = '🤖 Our kitchen team has noted your query. A kitchen manager is looking into your request!';

      const lower = text.toLowerCase();
      if (lower.includes('track') || lower.includes('order') || lower.includes('status')) {
        if (activeOrder) {
          const statusText =
            activeOrder.orderStatus === 'ORDER_PLACED'
              ? 'Order Placed & Confirmed at kitchen counter'
              : activeOrder.orderStatus === 'PREPARING'
              ? 'Simmering in the kitchen by our head chef'
              : activeOrder.orderStatus === 'OUT_FOR_DELIVERY'
              ? `Out with rider ${activeOrder.deliveryPartnerName || ''} (${activeOrder.deliveryPartnerPhone || ''})`
              : 'Delivered at your doorstep!';
          reply = `📦 Order #${activeOrder.orderId}: Current Status is "${statusText}". Total: ₹${activeOrder.totalAmount}. Destination: ${activeOrder.deliveryAddress}.`;
        } else {
          reply = '📦 You currently have no pending orders. Select your homestyle dishes from the menu to order!';
        }
      } else if (lower.includes('return') || lower.includes('cancel') || lower.includes('refund')) {
        reply = '🔄 Cancellation is allowed within 5 minutes before cooking begins. For any food issue, our kitchen manager will replace the meal or refund immediately.';
      } else if (lower.includes('offer') || lower.includes('coupon') || lower.includes('discount')) {
        const list = COUPONS.map((c) => `• ${c.code}: ${c.subtitle} (min ₹${c.minOrder})`).join('\n');
        reply = `🏷️ Active Offers in Firebase:\n${list}\n\nAdd dishes and apply in your cart!`;
      } else if (lower.includes('fssai') || lower.includes('hygiene') || lower.includes('safety')) {
        reply = '🛡️ Bhumi Cloud Kitchen is 100% compliant with FSSAI License #12345678901233. All dishes are prepared with authentic cold-pressed mustard oil and fresh ingredients.';
      } else if (lower.includes('call') || lower.includes('phone') || lower.includes('contact') || lower.includes('helpline')) {
        reply = '📞 Kitchen Helpline: +91 9006759560 · Email: apu.de123@gmail.com · Jamshedpur & New Cooch Behar.';
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userPhone,
        orderId: activeOrder?.orderId || '',
        createdAt: Date.now()
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // Save bot reply to Firestore
      await sendSupportMessageToFirestore({
        text: reply,
        sender: 'bot',
        userPhone,
        orderId: activeOrder?.orderId || ''
      });
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      id="chatWidget"
      className="fixed bottom-5 right-4 md:right-8 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden flex flex-col h-[480px] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="polish-green text-white p-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
            <Bot className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
              <span>Bhumi Kitchen Support</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-emerald-200">
              🟢 Connected with Firebase Firestore Live
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          aria-label="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FAF8F5]/80 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'polish-green text-white rounded-tr-xs'
                  : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-stone-400 mt-0.5 px-1 font-mono">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-1.5 bg-white border border-stone-200 rounded-full px-3 py-1.5 w-fit shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => handleSend('Where is my order?')}
          className="text-[10px] bg-white border border-stone-200 hover:border-emerald-600 hover:text-emerald-800 text-stone-700 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
        >
          📍 Track Order
        </button>
        <button
          onClick={() => handleSend('FSSAI & Hygiene details')}
          className="text-[10px] bg-white border border-stone-200 hover:border-emerald-600 hover:text-emerald-800 text-stone-700 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
        >
          🛡️ FSSAI Safety
        </button>
        <button
          onClick={() => handleSend('Refund or cancellation policy')}
          className="text-[10px] bg-white border border-stone-200 hover:border-emerald-600 hover:text-emerald-800 text-stone-700 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
        >
          🔄 Cancellation
        </button>
        <button
          onClick={() => handleSend('Kitchen Helpline contact')}
          className="text-[10px] bg-white border border-stone-200 hover:border-emerald-600 hover:text-emerald-800 text-stone-700 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
        >
          📞 Call Helpline
        </button>
      </div>

      {/* Message Input Box */}
      <div className="p-2.5 bg-white border-t border-stone-200 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask kitchen support..."
          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 placeholder:text-stone-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputVal.trim()}
          className="polish-green hover:bg-[#23482e] active:scale-95 disabled:opacity-40 text-white p-2 rounded-xl transition cursor-pointer shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
