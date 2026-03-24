import { useState, useEffect } from "react";
import { Sidebar, Page } from "./components/Sidebar";
import { CompressPage } from "./pages/CompressPage";
import { ExtractPage } from "./pages/ExtractPage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";
import { SettingsPage } from "./pages/SettingsPage";
import { OcrPage } from "./pages/OcrPage";
import { checkGhostscript } from "./lib/invoke";
import { load } from '@tauri-apps/plugin-store';

let store: any = null;
const initStore = async () => {
  if (!store) store = await load('settings.json');
  return store;
};

function App() {
  const [activePage, setActivePage] = useState<Page>("compress");
  const [gsAvailable, setGsAvailable] = useState<boolean>(true);

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
      if (theme === 'dark' || (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    loadTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = async (e: MediaQueryListEvent) => {
      const s = await initStore();
      const theme = await s.get('theme');
      if (theme === 'system' || !theme) {
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0f1117] overflow-hidden font-sans">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <main className="flex-1 overflow-y-auto">
        {activePage === "compress" && <CompressPage gsAvailable={gsAvailable} />}
        {activePage === "extract" && <ExtractPage />}
        {activePage === "merge" && <MergePage />}
        {activePage === "split" && <SplitPage />}
        {activePage === "ocr" && <OcrPage />}
        {activePage === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
