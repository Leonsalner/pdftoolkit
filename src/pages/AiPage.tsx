import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { getAiSpecs, checkModelExists, checkAiToolsExists, downloadModel, downloadAiTools, startAiServer, stopAiServer, SystemSpecs } from '../lib/invoke';
import { invoke } from '@tauri-apps/api/core';
import { DropZone } from '../components/DropZone';
import { PageIntro } from '../components/PageIntro';
import { Page } from '../components/Sidebar';
import { Sparkles, Bot, User, HardDrive, Send, StopCircle, Cpu, ShieldCheck, MessageSquare, Loader2 } from 'lucide-react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Chunk {
  text: string;
  embedding: number[];
}

function chunkText(text: string, chunkSize: number = 2000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function AiPage({}: { notify: (m: string, s: Page) => void; isActive: boolean }) {
  const { t } = useI18n();
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  
  const [modelExists, setModelExists] = useState(false);
  const [toolsExist, setToolsExist] = useState(false);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState('');
  
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your local AI assistant running directly on your Mac. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextText, setContextText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [documentChunks, setDocumentChunks] = useState<Chunk[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await getAiSpecs();
        setSpecs(s);
        const mExists = await checkModelExists(s.recommended_model);
        setModelExists(mExists);
        const tExists = await checkAiToolsExists();
        setToolsExist(tExists);
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
      if (!toolsExist) {
        setDownloadStep('Downloading AI Tools (~25MB)...');
        await downloadAiTools();
        setToolsExist(true);
      }
      
      if (!modelExists) {
        setDownloadStep(`Downloading Model (${specs.recommended_model})... This may take a while.`);
        await downloadModel(specs.model_url, specs.recommended_model);
        setModelExists(true);
      }
    } catch (e) {
      alert(`Download failed: ${e}`);
    }
    
    setDownloadStep('');
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
    setDocumentChunks([]);
    setContextText('');
  };

  const getEmbedding = async (text: string): Promise<number[]> => {
    const res = await fetch('http://localhost:8080/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    });
    if (!res.ok) throw new Error('Embedding failed');
    const data = await res.json();
    return data.data[0].embedding;
  };

  const handleFileSelect = async (path: any) => {
    const p = Array.isArray(path) ? path[0] : path;
    setIsExtracting(true);
    try {
      const res: any = await invoke('extract_text_ocr', { inputPath: p, lang: 'eng' });
      if (res && res.text) {
        const text = res.text;
        
        if (text.length > 8000) {
          setIsEmbedding(true);
          const rawChunks = chunkText(text, 2000, 200);
          const embeddedChunks: Chunk[] = [];
          
          for (let i = 0; i < rawChunks.length; i++) {
            setDownloadStep(`Embedding chunk ${i + 1}/${rawChunks.length}...`);
            const emb = await getEmbedding(rawChunks[i]);
            embeddedChunks.push({ text: rawChunks[i], embedding: emb });
          }
          
          setDocumentChunks(embeddedChunks);
          setContextText('RAG');
          setMessages(prev => [...prev, { role: 'system', content: `Massive document loaded. I will search its contents to answer your questions.` }]);
          setIsEmbedding(false);
          setDownloadStep('');
        } else {
          setContextText(text);
          setMessages(prev => [...prev, { role: 'system', content: `Context loaded from document. Document text:\n\n${text}` }]);
        }
      }
    } catch (e) {
      alert(`Failed to read document: ${e}`);
      setIsEmbedding(false);
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
      let finalMessages = messages.filter(m => m.role !== 'system');
      
      if (documentChunks.length > 0) {
        const queryEmbedding = await getEmbedding(input);
        const scoredChunks = documentChunks.map(c => ({
          ...c,
          score: cosineSimilarity(queryEmbedding, c.embedding)
        }));
        scoredChunks.sort((a, b) => b.score - a.score);
        
        const topChunks = scoredChunks.slice(0, 3).map(c => c.text).join('\n\n...\n\n');
        
        finalMessages.push({
          role: 'system',
          content: `Use the following document excerpts to help answer the user's question:\n\n${topChunks}`
        });
      } else if (contextText && contextText !== 'RAG') {
        finalMessages.push({
          role: 'system',
          content: `Document text:\n\n${contextText}`
        });
      }
      
      finalMessages.push(userMsg);

      const response = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: finalMessages,
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
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full flex flex-col overflow-hidden">
      <PageIntro
        page="ai"
        title={t('ai.title')}
        description={t('ai.desc')}
        className="flex-shrink-0"
        actions={
          isServerRunning ? (
            <button
              onClick={handleStop}
              className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-2 text-sm font-semibold text-[var(--error)] transition-all hover:opacity-80 active:scale-[0.98] flex items-center gap-2 shadow-sm"
            >
              <StopCircle size={16} />
              {t('ai.stop')}
            </button>
          ) : undefined
        }
      />

      {!isServerRunning ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center space-y-10 animate-in fade-in duration-500 py-12">
          <div className="relative">
            <div className="absolute -inset-4 bg-[var(--cat-intelligence)]/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-[var(--cat-intelligence-bg)] border border-[var(--cat-intelligence)]/30 rounded-full flex items-center justify-center shadow-xl">
              <Sparkles className="w-12 h-12 text-[var(--cat-intelligence)]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{t('ai.welcome')}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed text-lg max-w-lg mx-auto">
              {t('ai.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm flex items-start gap-4 text-left">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--cat-intelligence)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] mb-1">Privacy First</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Models run 100% offline. Your data never leaves this machine.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm flex items-start gap-4 text-left">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--cat-intelligence)]">
                <Cpu size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] mb-1">Local Processing</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Uses your Mac's Neural Engine and GPU for high performance.</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-6">
            {specs && (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm text-left flex items-start gap-4">
                <HardDrive className="text-[var(--text-secondary)] mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">System Compatibility</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">{t('ai.detectedRam')}: <span className="font-bold text-[var(--text-primary)]">{specs.ram_gb} GB</span></p>
                    <p className="text-xs text-[var(--text-secondary)]">{t('ai.recommendedModel')}: <span className="font-mono text-[10px] bg-[var(--bg-base)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-primary)]">{specs.recommended_model}</span></p>
                  </div>
                </div>
              </div>
            )}

            {(!modelExists || !toolsExist) ? (
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg flex justify-center items-center gap-3 ${
                    isDownloading
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                      : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98]'
                  }`}
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> {t('ai.downloading')}
                    </span>
                  ) : 'Setup Local AI Support'}
                </button>
                {isDownloading && downloadStep && (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-1 flex-1 max-w-[200px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--cat-intelligence)] animate-infinite-loading" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{downloadStep}</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={isStarting}
                className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg flex justify-center items-center gap-3 ${
                  isStarting
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                    : 'bg-[var(--cat-intelligence)] text-white hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {isStarting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> {t('ai.starting')}
                  </span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    {t('ai.start')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Chat header / Context area */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50 backdrop-blur-sm flex flex-col gap-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--cat-intelligence-bg)] flex items-center justify-center text-[var(--cat-intelligence)] border border-[var(--cat-intelligence)]/20">
                  <MessageSquare size={18} />
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {t('ai.chat')}
                </span>
              </div>
              {contextText ? (
                <div className="flex items-center gap-2 bg-[var(--success-bg)] text-[var(--success)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--success)]/20">
                  <ShieldCheck size={12} />
                  {t('ai.contextLoaded')}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[var(--bg-base)] text-[var(--text-disabled)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--border)]">
                  {t('ai.noContext')}
                </div>
              )}
            </div>
            {!contextText && (
               <div className="h-28">
                 {isExtracting ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed rounded-xl border-[var(--border)] bg-[var(--bg-surface)] animate-pulse">
                      <span className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                        {isEmbedding ? 'Generating Knowledge Base...' : t('ai.readingDoc')}
                      </span>
                      {isEmbedding && downloadStep && <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-disabled)]">{downloadStep}</span>}
                    </div>
                 ) : (
                    <DropZone onFileSelect={handleFileSelect} />
                 )}
               </div>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-8 bg-gradient-to-b from-transparent to-[var(--bg-base)]/30">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]' 
                      : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--cat-intelligence)]'
                  }`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                    msg.role === 'user' 
                      ? 'bg-[var(--text-primary)] text-[var(--bg-base)] rounded-tr-sm' 
                      : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] flex gap-4 flex-row">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--cat-intelligence)] shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-1.5 shadow-sm items-center">
                    <div className="w-1.5 h-1.5 bg-[var(--cat-intelligence)] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[var(--cat-intelligence)] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[var(--cat-intelligence)] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3 max-w-4xl mx-auto w-full">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                disabled={isTyping}
                className="flex-1 rounded-xl border border-[var(--border)] shadow-sm sm:text-sm bg-[var(--bg-base)] text-[var(--text-primary)] px-5 py-3.5 focus:border-[var(--cat-intelligence)] focus:ring-1 focus:ring-[var(--cat-intelligence)]/20 outline-none transition-all placeholder:text-[var(--text-disabled)]"
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className={`px-6 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  isTyping || !input.trim()
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed'
                    : 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.95]'
                }`}
              >
                <Send size={18} />
                {t('ai.send')}
              </button>
            </form>
            <p className="text-[9px] text-[var(--text-disabled)] text-center mt-3 uppercase font-bold tracking-[0.2em]">
              Powered by local Llama-3 and your Neural Engine
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
