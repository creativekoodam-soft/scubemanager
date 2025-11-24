import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, X, Bot, Loader2, Square } from 'lucide-react';
import { Booking } from '../types';
import { askStudioAssistant } from '../services/geminiService';

interface AskAIProps {
  bookings: Booking[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

const AskAI: React.FC<AskAIProps> = ({ bookings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your S CUBE assistant. Ask me anything about your bookings in English or Tamil.',
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    const response = await askStudioAssistant(userMsg.text, null, bookings);

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: response,
      timestamp: Date.now()
    }]);
    setIsProcessing(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioQuery(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioQuery = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    // Add a placeholder message for voice input
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: '🎤 (Voice Query)...',
      timestamp: Date.now()
    }]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const response = await askStudioAssistant(null, base64String, bookings);
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response,
          timestamp: Date.now()
        }]);
        setIsProcessing(false);
      };
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-purple-600/40 transition-all transform hover:scale-105 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bg-gradient-to-r from-purple-600 to-pink-600 text-white`}
      >
        <Bot size={28} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end md:px-8 md:pb-8 pointer-events-none">
          <div className="pointer-events-auto w-full md:w-[400px] h-[80vh] md:h-[600px] bg-[#0f0518] md:rounded-2xl shadow-2xl flex flex-col border border-purple-500/30 overflow-hidden animate-fadeIn">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">S Cube AI</h3>
                  <p className="text-[10px] text-green-400">Online • Ask about bookings</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                   <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-purple-400" />
                      <span className="text-xs text-gray-400">Thinking...</span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder="Ask about bookings..."
                  disabled={isProcessing || isRecording}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500"
                />
                
                {isRecording ? (
                  <button 
                    onClick={stopRecording}
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center animate-pulse border border-red-500/50 hover:bg-red-500/30 transition-colors"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button 
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="w-10 h-10 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
                  >
                    <Mic size={18} />
                  </button>
                )}

                <button 
                  onClick={handleSendText}
                  disabled={!inputText.trim() || isProcessing}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/50"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-600 mt-2">
                Voice supported: English & Tamil
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AskAI;
