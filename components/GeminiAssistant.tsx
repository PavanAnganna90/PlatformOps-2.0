import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from './ui/Card';
import { getGeminiResponse } from '../services/geminiService';
import { AiChatMessage } from '../types';
import { storage } from '../services/storage';

export const GeminiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm OpsSight AI, your SRE assistant. I have full visibility into your **local simulation**. Ask me about:\n\n- Why the payment-processor is failing\n- Current vulnerability risks\n- How to fix the Terraform lock",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: AiChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Retrieve fresh state from simulation service
    const nodes = storage.getNodes();
    const logs = storage.getLogs().slice(0, 10); // Last 10 logs
    const vulns = storage.getVulnerabilities();
    const pipes = storage.getPipelines();

    // Context Engineering
    const context = `
      Current System Time: ${new Date().toISOString()}
      
      Infrastructure Nodes:
      ${JSON.stringify(nodes.map(n => ({ name: n.name, status: n.status, metrics: n.metrics, tags: n.tags })))}
      
      Critical Vulnerabilities:
      ${JSON.stringify(vulns.filter(v => v.severity === 'critical' || v.severity === 'high'))}

      Recent Pipelines:
      ${JSON.stringify(pipes.map(p => ({ name: p.name, status: p.status, branch: p.branch })))}

      Recent Logs (Last 10):
      ${JSON.stringify(logs)}
    `;

    const responseText = await getGeminiResponse(userMsg.text, context);

    const modelMsg: AiChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border border-white/10
          ${isOpen ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-r from-primary to-accent hover:scale-110 hover:shadow-primary/50'}
        `}
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white w-8 h-8" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-40 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300
           ${isExpanded ? 'w-[600px] h-[800px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-150px)]' : 'w-96 h-[600px] max-w-[calc(100vw-48px)]'}
        `}>
          <Card className="flex-1 flex flex-col overflow-hidden border-primary/30 shadow-2xl shadow-black/50 bg-slate-900/90 backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <div>
                  <h3 className="font-semibold text-white leading-none">OpsSight AI</h3>
                  <span className="text-[10px] text-slate-400">Powered by Gemini 2.5</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                  {isExpanded ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {msg.text.split('\n').map((line, i) => (
                       <React.Fragment key={i}>
                         {line}
                         <br />
                       </React.Fragment>
                    ))}
                    <div className="text-[10px] opacity-50 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-xs text-slate-400">Analyzing simulated infrastructure...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-slate-900/50 border-t border-slate-700/50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-2 p-1.5 bg-primary/20 hover:bg-primary/40 rounded-md text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};
