import { useState, useEffect, useCallback } from "react";
import { Sidebar, Page } from "./components/Sidebar";
import { CompressPage } from "./pages/CompressPage";
import { ExtractPage } from "./pages/ExtractPage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";
import { SettingsPage } from "./pages/SettingsPage";
import { OrganizePage } from "./pages/OrganizePage";
import { initStore } from "./lib/store";
import { OcrPage } from "./pages/OcrPage";
import { ConvertPage } from "./pages/ConvertPage";
import { WatermarkPage } from "./pages/WatermarkPage";
import { SecurityPage } from "./pages/SecurityPage";
import { SignPage } from "./pages/SignPage";
import { AiPage } from "./pages/AiPage";
import { MetadataPage } from "./pages/MetadataPage";
import { checkGhostscript } from "./lib/invoke";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface Toast {
  visible: boolean;
  message: string;
  targetPage: Page | null;
  isUpdate?: boolean;
  updateAction?: () => void;
}

function App() {
  const [activePage, setActivePage] = useState<Page>("compress");
  const [gsAvailable, setGsAvailable] = useState<boolean>(true);
  const [toast, setToast] = useState<Toast>({ visible: false, message: "", targetPage: null });
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Background update check on launch
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) {
          setToast({
            visible: true,
            message: `Update v${update.version} is available!`,
            targetPage: null,
            isUpdate: true,
            updateAction: async () => {
              setIsUpdating(true);
              setToast({ visible: true, message: 'Downloading update...', targetPage: null });
              try {
                await update.downloadAndInstall();
                await relaunch();
              } catch (e) {
                console.error(e);
                setToast({ visible: true, message: 'Update failed to install.', targetPage: null });
                setIsUpdating(false);
              }
            }
          });
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    }
    // Delay check slightly to not block initial render
    setTimeout(checkForUpdates, 3000);
  }, []);

  const notify = useCallback((message: string, sourcePage: Page) => {
    setToast({ visible: true, message, targetPage: sourcePage });
    // Auto hide toast after 5 seconds if not clicked
    setTimeout(() => {
      setToast(prev => prev.targetPage === sourcePage && !prev.isUpdate ? { ...prev, visible: false } : prev);
    }, 5000);
  }, []);

  const handleToastClick = () => {
    if (toast.isUpdate && toast.updateAction) {
      if (!isUpdating) {
        toast.updateAction();
      }
      return;
    }
    
    if (toast.targetPage) {
      setActivePage(toast.targetPage);
    }
    setToast({ visible: false, message: "", targetPage: null });
  };

  const getPageClass = (page: Page) => 
    `absolute inset-0 overflow-y-auto transition-opacity duration-300 ${
      activePage === page ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
    }`;

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden transition-colors duration-300 relative">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <main className="flex-1 overflow-hidden relative bg-[var(--bg-base)]">
        <div className={getPageClass("compress")}>
          <CompressPage gsAvailable={gsAvailable} notify={notify} isActive={activePage === "compress"} />
        </div>
        <div className={getPageClass("extract")}>
          <ExtractPage notify={notify} isActive={activePage === "extract"} />
        </div>
        <div className={getPageClass("merge")}>
          <MergePage notify={notify} isActive={activePage === "merge"} />
        </div>
        <div className={getPageClass("split")}>
          <SplitPage notify={notify} isActive={activePage === "split"} />
        </div>
        <div className={getPageClass("organize")}>
          <OrganizePage gsAvailable={gsAvailable} notify={notify} isActive={activePage === "organize"} />
        </div>
        <div className={getPageClass("convert")}>
          <ConvertPage gsAvailable={gsAvailable} notify={notify} isActive={activePage === "convert"} />
        </div>
        <div className={getPageClass("watermark")}>
          <WatermarkPage notify={notify} isActive={activePage === "watermark"} />
        </div>
        <div className={getPageClass("metadata")}>
          <MetadataPage notify={notify} isActive={activePage === "metadata"} />
        </div>
        <div className={getPageClass("security")}>
          <SecurityPage notify={notify} isActive={activePage === "security"} />
        </div>
        <div className={getPageClass("sign")}>
          <SignPage notify={notify} isActive={activePage === "sign"} />
        </div>
        <div className={getPageClass("ai")}>
          <AiPage notify={notify} isActive={activePage === "ai"} />
        </div>
        <div className={getPageClass("ocr")}>
          <OcrPage notify={notify} isActive={activePage === "ocr"} />
        </div>
        <div className={getPageClass("settings")}>
          <SettingsPage />
        </div>
      </main>

      {/* Global Toast Notification */}
      {toast.visible && (
        <div 
          onClick={handleToastClick}
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl transition-all transform translate-y-0 animate-in slide-in-from-bottom-4 duration-300 flex items-center space-x-3 z-50 ${
            toast.isUpdate 
              ? 'bg-[var(--cat-content)] text-white cursor-pointer hover:opacity-90' 
              : 'bg-[var(--text-primary)] text-[var(--bg-base)] cursor-pointer hover:bg-[var(--text-secondary)]'
          }`}
        >
          <div className="flex-1">
            <p className="font-semibold text-sm flex items-center gap-2">
              {isUpdating && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
              {toast.message}
            </p>
            {!isUpdating && (
              <p className="text-xs opacity-80 underline mt-0.5">
                {toast.isUpdate ? 'Click to download and restart' : 'Click to view results'}
              </p>
            )}
          </div>
          {!isUpdating && (
            <button 
              onClick={(e) => { e.stopPropagation(); setToast({ ...toast, visible: false }); }}
              className="opacity-60 hover:opacity-100 transition-opacity ml-2"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;