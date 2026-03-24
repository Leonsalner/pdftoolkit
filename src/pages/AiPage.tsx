import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { getAiSpecs, checkModelExists, downloadModel, startAiServer, stopAiServer, SystemSpecs } from '../lib/invoke';
import { invoke } from '@tauri-apps/api/core';
import { DropZone } from '../components/DropZone';
import { Page } from '../components/Sidebar';
import { Sparkles, Bot, User, HardDrive } from 'lucide-react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function AiPage({}: { notify: (m: string, s: Page) => void; isActive: boolean }) {
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

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 border-b border-[var(--border)] pb-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{t('ai.title')}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t('ai.desc')}</p>
        </div>
        {isServerRunning && (
          <button 
            onClick={handleStop} 
            className="text-sm px-4 py-2 bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)] rounded-lg hover:opacity-80 transition-opacity font-medium"
          >
            {t('ai.stop')}
          </button>
        )}
      </div>

      {!isServerRunning ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-[var(--cat-intelligence-bg)] border border-[var(--cat-intelligence)]/30 rounded-full flex items-center justify-center shadow-sm">
            <Sparkles className="w-10 h-10 text-[var(--cat-intelligence)]" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{t('ai.welcome')}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('ai.description')}
            </p>
          </div>

          {specs && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 w-full shadow-sm text-left flex items-start gap-4">
              <HardDrive className="text-[var(--text-secondary)] mt-0.5" size={20} />
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{t('ai.detectedRam')}: <span className="font-bold text-[var(--text-primary)]">{specs.ram_gb} GB</span></p>
                <p className="text-sm text-[var(--text-secondary)]">{t('ai.recommendedModel')}: <span className="font-mono text-xs bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-primary)]">{specs.recommended_model}</span></p>
              </div>
            </div>
          )}

          {!modelExists ? (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
                isDownloading
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-secondary)] active:scale-[0.99]'
              }`}
            >
              {isDownloading ? (
                <>{t('ai.downloading')} <div className="ml-2 w-4 h-4 border-2 border-[var(--text-disabled)] border-t-transparent rounded-full animate-spin" /></>
              ) : t('ai.download')}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
                isStarting
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--success)] text-white hover:opacity-90 active:scale-[0.99]'
              }`}
            >
              {isStarting ? (
                <>{t('ai.starting')} <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></>
              ) : t('ai.start')}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden min-h-0">
          {/* Chat header / Context area */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col gap-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--cat-intelligence)]" />
                {t('ai.chat')}
              </span>
              {contextText ? (
                <span className="text-xs bg-[var(--success-bg)] text-[var(--success)] px-3 py-1 rounded-full font-medium border border-[var(--success)]">
                  {t('ai.contextLoaded')}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-disabled)] font-medium bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border)]">
                  {t('ai.noContext')}
                </span>
              )}
            </div>
            {!contextText && (
               <div className="h-24">
                 {isExtracting ? (
                    <div className="h-full flex items-center justify-center border border-dashed rounded-xl border-[var(--border)] bg-[var(--bg-surface)]">
                      <span className="text-sm text-[var(--text-secondary)] animate-pulse">{t('ai.readingDoc')}</span>
                    </div>
                 ) : (
                    <DropZone onFileSelect={handleFileSelect} />
                 )}
               </div>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-[var(--text-primary)] text-[var(--bg-base)]' : 'bg-[var(--cat-intelligence-bg)] text-[var(--cat-intelligence)]'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[var(--text-primary)] text-[var(--bg-base)] rounded-tr-sm' 
                      : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] flex gap-3 flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--cat-intelligence-bg)] text-[var(--cat-intelligence)]">
                    <Bot size={16} />
                  </div>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-1.5 shadow-sm">
                    <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                disabled={isTyping}
                className="flex-1 rounded-xl border-[var(--border)] shadow-sm sm:text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--text-secondary)] outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-xl hover:bg-[var(--text-secondary)] disabled:opacity-50 transition-colors shadow-sm"
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
