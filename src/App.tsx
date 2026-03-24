import { useState, useEffect, useCallback } from "react";
import { Sidebar, Page } from "./components/Sidebar";
import { CompressPage } from "./pages/CompressPage";
import { ExtractPage } from "./pages/ExtractPage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";
import { SettingsPage } from "./pages/SettingsPage";
import { initStore } from "./lib/store";
import { OcrPage } from "./pages/OcrPage";
import { checkGhostscript } from "./lib/invoke";

interface Toast {
  visible: boolean;
  message: string;
  targetPage: Page | null;
}

function App() {
  const [activePage, setActivePage] = useState<Page>("compress");
  const [gsAvailable, setGsAvailable] = useState<boolean>(true);
  const [toast, setToast] = useState<Toast>({ visible: false, message: "", targetPage: null });

  useEffect(() => {
    checkGhostscript().then(available => {
      setGsAvailable(available);
    }).catch(err => {
      console.error("Failed to check ghostscript:", err);
      setGsAvailable(false);
    });

    async function loadTheme() {
      const s = await initStore();
      const theme = await s.get('theme');
      const systemIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (theme === 'dark' || (theme === 'system' && systemIsDark) || (!theme && systemIsDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    loadTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = async (e: MediaQueryListEvent) => {
      const s = await initStore();
      const theme = await s.get('theme');
      if (theme === 'system' || !theme) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const notify = useCallback((message: string, sourcePage: Page) => {
    setToast({ visible: true, message, targetPage: sourcePage });
    // Auto hide toast after 5 seconds if not clicked
    setTimeout(() => {
      setToast(prev => prev.targetPage === sourcePage ? { ...prev, visible: false } : prev);
    }, 5000);
  }, []);

  const handleToastClick = () => {
    if (toast.targetPage) {
      setActivePage(toast.targetPage);
    }
    setToast({ visible: false, message: "", targetPage: null });
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0f1117] overflow-hidden font-sans transition-colors duration-300 relative">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <main className="flex-1 overflow-y-auto relative">
        <div className={activePage === "compress" ? "block" : "hidden"}>
          <CompressPage gsAvailable={gsAvailable} notify={notify} isActive={activePage === "compress"} />
        </div>
        <div className={activePage === "extract" ? "block" : "hidden"}>
          <ExtractPage notify={notify} isActive={activePage === "extract"} />
        </div>
        <div className={activePage === "merge" ? "block" : "hidden"}>
          <MergePage notify={notify} isActive={activePage === "merge"} />
        </div>
        <div className={activePage === "split" ? "block" : "hidden"}>
          <SplitPage notify={notify} isActive={activePage === "split"} />
        </div>
        <div className={activePage === "ocr" ? "block" : "hidden"}>
          <OcrPage notify={notify} isActive={activePage === "ocr"} />
        </div>
        <div className={activePage === "settings" ? "block" : "hidden"}>
          <SettingsPage />
        </div>
      </main>

      {/* Global Toast Notification */}
      {toast.visible && (
        <div 
          onClick={handleToastClick}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all transform translate-y-0 animate-in slide-in-from-bottom-4 duration-300 flex items-center space-x-3 z-50"
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">{toast.message}</p>
            <p className="text-xs opacity-80 underline">Click to view results</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setToast({ ...toast, visible: false }); }}
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
