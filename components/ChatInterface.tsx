import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Play, FileJson } from 'lucide-react';
import { ChatMessage, CleaningOperation } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onApplyOperations: (ops: CleaningOperation[]) => void;
  isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onApplyOperations,
  isProcessing 
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-96 max-w-md shrink-0">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          AI Data Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1">Ask me to clean columns, impute values, or transform types.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
           <div className="text-center text-slate-500 mt-10">
             <div className="bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileJson className="w-8 h-8 opacity-50" />
             </div>
             <p>Upload data and ask things like:</p>
             <ul className="text-sm mt-4 space-y-2 text-slate-400">
               <li className="bg-slate-800 p-2 rounded cursor-pointer hover:bg-slate-700 transition" onClick={() => setInput("Fill missing ages with the average")}>"Fill missing ages with average"</li>
               <li className="bg-slate-800 p-2 rounded cursor-pointer hover:bg-slate-700 transition" onClick={() => setInput("Drop rows where Salary is null")}>"Drop rows where Salary is null"</li>
               <li className="bg-slate-800 p-2 rounded cursor-pointer hover:bg-slate-700 transition" onClick={() => setInput("Convert IsActive to boolean")}>"Convert IsActive to boolean"</li>
             </ul>
           </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              <p>{msg.content}</p>
              
              {msg.operations && msg.operations.length > 0 && (
                <div className="mt-3 bg-slate-900/50 rounded p-2 border border-slate-700/50">
                  <p className="text-xs font-semibold text-sky-300 mb-2 uppercase tracking-wider">Suggested Operations</p>
                  <ul className="space-y-1 mb-3">
                    {msg.operations.map((op, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{op.description}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => onApplyOperations(msg.operations!)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" /> Apply Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe how to clean the data..."
            disabled={isProcessing}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-2 p-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
