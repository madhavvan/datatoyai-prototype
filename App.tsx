import React, { useState, useCallback, useMemo } from 'react';
import { DataRow, ChatMessage, CleaningOperation, ColumnStats } from './types';
import { DataTable } from './components/DataTable';
import { ChatInterface } from './components/ChatInterface';
import { parseCSV, getColumnStats, applyOperation } from './utils/dataProcessing';
import { interpretCleaningRequest } from './services/gemini';
import { Upload, Download, Database, BarChart3, Trash2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const columnStats = useMemo(() => getColumnStats(data), [data]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setData(parsed);
        setFileName(file.name);
        setMessages([{
          id: 'system-1',
          role: 'assistant',
          content: `I've loaded ${file.name} with ${parsed.length} rows and ${Object.keys(parsed[0] || {}).length} columns. How would you like to clean it?`,
          timestamp: Date.now()
        }]);
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Optimistic user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      if (data.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Please upload a dataset first.",
          timestamp: Date.now()
        }]);
        return;
      }

      const operations = await interpretCleaningRequest(text, columnStats);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: operations.length > 0 
          ? `I've identified ${operations.length} operation${operations.length > 1 ? 's' : ''} to apply.` 
          : "I couldn't identify any specific cleaning operations from your request. Could you rephrase?",
        operations: operations,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please check your API key and try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyOperations = useCallback((ops: CleaningOperation[]) => {
    let currentData = [...data];
    ops.forEach(op => {
      currentData = applyOperation(currentData, op);
    });
    setData(currentData);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Operations applied successfully! The dataset has been updated.",
      timestamp: Date.now()
    }]);
  }, [data]);

  const handleDownload = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return val === null ? '' : JSON.stringify(val); // Simple encoding
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cleaned_${fileName || 'data'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">DataToy<span className="text-sky-400">AI</span></h1>
          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400 border border-slate-700 ml-2">Web Edition</span>
        </div>
        
        <div className="flex items-center gap-3">
          {data.length > 0 && (
             <>
                <button 
                  onClick={() => setShowStats(!showStats)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${showStats ? 'bg-slate-800 border-slate-600 text-sky-400' : 'text-slate-400 border-transparent hover:bg-slate-800'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Stats
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
             </>
          )}
          <label className="flex items-center gap-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors shadow-lg shadow-sky-900/20">
            <Upload className="w-4 h-4" />
            {data.length > 0 ? 'Replace Data' : 'Upload Data'}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Data View */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/50">
          {showStats && data.length > 0 ? (
            <div className="h-full overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {columnStats.map(stat => (
                 <div key={stat.name} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-200 truncate" title={stat.name}>{stat.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{stat.type}</p>
                      </div>
                      {stat.missingCount > 0 && (
                        <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {stat.missingCount} missing
                        </span>
                      )}
                   </div>
                   
                   <div className="h-32 mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[
                         { name: 'Missing', value: stat.missingCount },
                         { name: 'Unique', value: stat.uniqueCount },
                         { name: 'Filled', value: data.length - stat.missingCount }
                       ]}>
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#cbd5e1' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {
                              [0, 1, 2].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#3b82f6' : '#10b981'} opacity={0.8} />
                              ))
                            }
                          </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-2">Sample Values:</p>
                      <div className="flex flex-wrap gap-1">
                        {stat.sample.map((s, i) => (
                          <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 max-w-[100px] truncate">
                            {String(s)}
                          </span>
                        ))}
                      </div>
                   </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="flex-1 p-0.5 overflow-hidden">
               <DataTable data={data} />
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
          onApplyOperations={handleApplyOperations}
          isProcessing={isProcessing}
        />
      </main>
    </div>
  );
}

export default App;