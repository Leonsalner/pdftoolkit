import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { getAiSpecs, checkModelExists, downloadModel, startAiServer, stopAiServer, SystemSpecs } from '../lib/invoke';
import { invoke } from '@tauri-apps/api/core';
import { DropZone } from '../components/DropZone';
import { Page } from '../components/Sidebar';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function AiPage({ isActive }: { notify: (m: string, s: Page) => void; isActive: boolean }) {
  const { t } = useI18n();
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [modelExists, setModelExists] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your local AI assistant running directly on your Mac. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextText, setContextText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await getAiSpecs();
        setSpecs(s);
        const exists = await checkModelExists(s.recommended_model);
        setModelExists(exists);
      } catch (e) {
        console.error(e);
      }
    }
    init();

    return () => {
      stopAiServer().catch(console.error);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDownload = async () => {
    if (!specs) return;
    setIsDownloading(true);
    try {
      await downloadModel(specs.model_url, specs.recommended_model);
      setModelExists(true);
    } catch (e) {
      alert(`Download failed: ${e}`);
    }
    setIsDownloading(false);
  };

  const handleStart = async () => {
    if (!specs) return;
    setIsStarting(true);
    try {
      await startAiServer(specs.recommended_model);
      setIsServerRunning(true);
    } catch (e) {
      alert(`Failed to start AI server: ${e}`);
    }
    setIsStarting(false);
  };

  const handleStop = async () => {
    await stopAiServer();
    setIsServerRunning(false);
  };

  const handleFileSelect = async (path: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    setIsExtracting(true);
    try {
      // Using existing OCR command for simplicity
      const res: any = await invoke('extract_text_ocr', { inputPath: p, lang: 'eng' });
      if (res && res.text) {
        const text = res.text;
        if (text.length > 15000) {
          alert(t('ai.docTooLarge'));
        } else {
          setContextText(text);
          setMessages(prev => [...prev, { role: 'system', content: `Context loaded from document. Document text:\n\n${text}` }]);
        }
      }
    } catch (e) {
      alert(`Failed to read document: ${e}`);
    }
    setIsExtracting(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Llama.cpp server OpenAI compatible endpoint
      const response = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
        })
      });

      if (!response.ok) throw new Error('Server error');
      
      const data = await response.json();
      const reply = data.choices[0].message.content;
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error communicating with local AI: ${e}` }]);
    }
    
    setIsTyping(false);
  };

  if (!isActive && isServerRunning) {
    // Optionally stop server when navigating away to save battery, 
    // but for now we let it run until component unmounts.
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ai.title')}</h2>
        {isServerRunning && (
          <button onClick={handleStop} className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
            {t('ai.stop')}
          </button>
        )}
      </div>

      {!isServerRunning ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('ai.welcome')}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              {t('ai.description')}
            </p>
          </div>

          {specs && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-w-sm mx-auto border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('ai.detectedRam')}: <span className="font-bold text-gray-900 dark:text-white">{specs.ram_gb} GB</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('ai.recommendedModel')}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{specs.recommended_model}</span></p>
            </div>
          )}

          {!modelExists ? (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isDownloading ? (
                <>{t('ai.downloading')} <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></>
              ) : t('ai.download')}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isStarting ? t('ai.starting') : t('ai.start')}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Chat header / Context area */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('ai.chat')}</span>
              {contextText ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                  {t('ai.contextLoaded')}
                </span>
              ) : (
                <span className="text-xs text-gray-500">{t('ai.noContext')}</span>
              )}
            </div>
            {!contextText && (
               <div className="h-20">
                 {isExtracting ? (
                    <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                      <span className="text-sm text-gray-500 animate-pulse">{t('ai.readingDoc')}</span>
                    </div>
                 ) : (
                    <DropZone onFileSelect={handleFileSelect} />
                 )}
               </div>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                disabled={isTyping}
                className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {t('ai.send')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
