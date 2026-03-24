import { useState, useEffect } from "react";
import { Sidebar, Page } from "./components/Sidebar";
import { CompressPage } from "./pages/CompressPage";
import { ExtractPage } from "./pages/ExtractPage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";
import { checkGhostscript } from "./lib/invoke";

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
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0f1117] overflow-hidden font-sans">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <main className="flex-1 overflow-y-auto">
        {activePage === "compress" && <CompressPage gsAvailable={gsAvailable} />}
        {activePage === "extract" && <ExtractPage />}
        {activePage === "merge" && <MergePage />}
        {activePage === "split" && <SplitPage />}
      </main>
    </div>
  );
}

export default App;
