import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { load } from '@tauri-apps/plugin-store';

type Language = 'en' | 'sk';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    'nav.compress': 'Compress PDF',
    'nav.extract': 'Extract Pages',
    'nav.merge': 'Merge PDFs',
    'nav.split': 'Split PDF',
    'nav.ocr': 'Text Recognition',
    'nav.settings': 'Settings',
    'app.title': 'PDF Toolkit',
    'common.step1': '1. Select File',
    'common.step1.add': '1. Add Files',
    'common.step2': '2. File Renaming (Optional)',
    'common.step3.preset': '3. Choose Preset',
    'common.step2.preset': '2. Choose Preset',
    'common.change': 'Change',
    'common.originalSize': 'Original Size',
    'common.clickToBrowse': 'Click to browse for a PDF',
    'common.localFilesOnly': 'Local files only',
    'compress.title': 'Compress PDF',
    'compress.gsRequired': 'Ghostscript is required for compression.',
    'compress.gsInstall': 'Please install it by running `brew install ghostscript` in your terminal.',
    'compress.button': 'Compress PDF',
    'compress.buttonLoading': 'Compressing...',
    'compress.buttonAnother': 'Compress Another PDF',
    'compress.success': 'Compression successful!',
    'compress.failed': 'Compression failed',
    'preset.low': 'Low',
    'preset.low.desc': 'Best for web & email. Lowest resolution.',
    'preset.medium': 'Medium',
    'preset.medium.desc': 'Good balance of size and quality.',
    'preset.high': 'High',
    'preset.high.desc': 'High resolution for home/office printing.',
    'preset.estSize': 'Est. Size',
    'extract.title': 'Extract Pages',
    'extract.step2': '2. Specify Ranges',
    'extract.step3': '3. File Renaming (Optional)',
    'extract.button': 'Extract Pages',
    'extract.buttonLoading': 'Extracting...',
    'extract.buttonAnother': 'Extract Another PDF',
    'extract.success': 'Extraction successful!',
    'extract.failed': 'Extraction failed',
    'extract.pages': 'Pages to Extract',
    'extract.of': 'of',
    'merge.title': 'Merge PDFs',
    'merge.step2': '2. Output Renaming (Optional)',
    'merge.button': 'Merge PDFs',
    'merge.buttonLoading': 'Merging...',
    'merge.buttonAnother': 'Merge More PDFs',
    'merge.success': 'Merge successful!',
    'merge.failed': 'Merge failed',
    'merge.minFiles': 'Add at least 2 files to merge.',
    'split.title': 'Split PDF',
    'split.step2': '2. Split Mode',
    'split.step3': '3. Output Prefix (Optional)',
    'split.mode.single': 'Split into chunks of N pages',
    'split.mode.ranges': 'Split by custom ranges',
    'split.button': 'Split PDF',
    'split.buttonLoading': 'Splitting...',
    'split.buttonAnother': 'Split Another PDF',
    'split.success': 'Split successful!',
    'split.failed': 'Split failed',
    'ocr.title': 'Text Recognition',
    'ocr.language': 'Document Language',
    'ocr.button': 'Extract Text',
    'ocr.buttonLoading': 'Processing... (This may take a while)',
    'ocr.buttonAnother': 'Process Another PDF',
    'ocr.success': 'Text Recognition successful!',
    'ocr.failed': 'Text Recognition failed',
    'ocr.saveText': 'Save Text to File',
    'ocr.textPreview': 'Extracted Text Preview',
    'common.savedTo': 'Saved to:',
    'compress.reducedTo': 'Reduced to',
    'extract.extracted': 'Extracted',
    'extract.pagesLower': 'pages',
    'merge.filesCombined': 'files combined',
    'split.generated': 'Generated',
    'split.files': 'files',
    'ocr.textSavedTo': 'Text saved to:',
    'settings.title': 'Settings',
    'settings.outputDir': 'Output Directory',
    'settings.outputDirDesc': 'All modified PDFs will be saved here. If left blank, your default Downloads folder is used.',
    'settings.askEveryTime': 'Ask for save location every time',
    'settings.theme': 'Theme Appearance',
    'settings.theme.system': 'System Default',
    'settings.theme.light': 'Light Mode',
    'settings.theme.dark': 'Dark Mode',
    'settings.language': 'Language',
    'settings.language.en': 'English',
    'settings.language.sk': 'Slovak (Slovenčina)',
    'settings.browse': 'Browse',
  },
  sk: {
    'nav.compress': 'Komprimovať PDF',
    'nav.extract': 'Extrahovať strany',
    'nav.merge': 'Zlúčiť PDF',
    'nav.split': 'Rozdeliť PDF',
    'nav.ocr': 'Rozpoznávanie textu',
    'nav.settings': 'Nastavenia',
    'app.title': 'PDF Nástroje',
    'common.step1': '1. Vyberte súbor',
    'common.step1.add': '1. Pridajte súbory',
    'common.step2': '2. Premenovanie súboru (Voliteľné)',
    'common.step3.preset': '3. Vyberte kvalitu',
    'common.step2.preset': '2. Vyberte kvalitu',
    'common.change': 'Zmeniť',
    'common.originalSize': 'Pôvodná veľkosť',
    'common.clickToBrowse': 'Kliknutím vyberte PDF',
    'common.localFilesOnly': 'Iba lokálne súbory',
    'compress.title': 'Komprimovať PDF',
    'compress.gsRequired': 'Pre kompresiu je potrebný Ghostscript.',
    'compress.gsInstall': 'Nainštalujte ho spustením `brew install ghostscript` v termináli.',
    'compress.button': 'Komprimovať PDF',
    'compress.buttonLoading': 'Komprimuje sa...',
    'compress.buttonAnother': 'Komprimovať ďalšie PDF',
    'compress.success': 'Kompresia úspešná!',
    'compress.failed': 'Kompresia zlyhala',
    'preset.low': 'Nízka',
    'preset.low.desc': 'Najlepšie pre web a email. Najnižšie rozlíšenie.',
    'preset.medium': 'Stredná',
    'preset.medium.desc': 'Dobrý pomer veľkosti a kvality.',
    'preset.high': 'Vysoká',
    'preset.high.desc': 'Vysoké rozlíšenie pre domácu/kancelársku tlač.',
    'preset.estSize': 'Odhad. veľkosť',
    'extract.title': 'Extrahovať strany',
    'extract.step2': '2. Zadajte rozsahy',
    'extract.step3': '3. Premenovanie súboru (Voliteľné)',
    'extract.button': 'Extrahovať strany',
    'extract.buttonLoading': 'Extrahuje sa...',
    'extract.buttonAnother': 'Extrahovať ďalšie PDF',
    'extract.success': 'Extrakcia úspešná!',
    'extract.failed': 'Extrakcia zlyhala',
    'extract.pages': 'Strany na extrakciu',
    'extract.of': 'z',
    'merge.title': 'Zlúčiť PDF',
    'merge.step2': '2. Premenovanie výstupu (Voliteľné)',
    'merge.button': 'Zlúčiť PDF',
    'merge.buttonLoading': 'Zlučuje sa...',
    'merge.buttonAnother': 'Zlúčiť viac PDF',
    'merge.success': 'Zlúčenie úspešné!',
    'merge.failed': 'Zlúčenie zlyhalo',
    'merge.minFiles': 'Pridajte aspoň 2 súbory na zlúčenie.',
    'split.title': 'Rozdeliť PDF',
    'split.step2': '2. Režim rozdelenia',
    'split.step3': '3. Predpona výstupu (Voliteľné)',
    'split.mode.single': 'Rozdeliť na časti po N stranách',
    'split.mode.ranges': 'Rozdeliť podľa vlastných rozsahov',
    'split.button': 'Rozdeliť PDF',
    'split.buttonLoading': 'Rozdeľuje sa...',
    'split.buttonAnother': 'Rozdeliť ďalšie PDF',
    'split.success': 'Rozdelenie úspešné!',
    'split.failed': 'Rozdelenie zlyhalo',
    'ocr.title': 'Rozpoznávanie textu',
    'ocr.language': 'Jazyk dokumentu',
    'ocr.button': 'Extrahovať text',
    'ocr.buttonLoading': 'Spracováva sa... (Môže to chvíľu trvať)',
    'ocr.buttonAnother': 'Spracovať ďalšie PDF',
    'ocr.success': 'Rozpoznávanie textu úspešné!',
    'ocr.failed': 'Rozpoznávanie textu zlyhalo',
    'ocr.saveText': 'Uložiť text do súboru',
    'ocr.textPreview': 'Náhľad extrahovaného textu',
    'common.savedTo': 'Uložené do:',
    'compress.reducedTo': 'Zmenšené na',
    'extract.extracted': 'Extrahovaných',
    'extract.pagesLower': 'strán',
    'merge.filesCombined': 'súborov zlúčených',
    'split.generated': 'Vygenerovaných',
    'split.files': 'súborov',
    'ocr.textSavedTo': 'Text uložený do:',
    'settings.title': 'Nastavenia',
    'settings.outputDir': 'Výstupný priečinok',
    'settings.outputDirDesc': 'Všetky upravené PDF sa uložia sem. Ak je prázdne, použije sa priečinok Stiahnuté.',
    'settings.askEveryTime': 'Vždy sa opýtať na miesto uloženia',
    'settings.theme': 'Vzhľad',
    'settings.theme.system': 'Podľa systému',
    'settings.theme.light': 'Svetlý režim',
    'settings.theme.dark': 'Tmavý režim',
    'settings.language': 'Jazyk',
    'settings.language.en': 'Angličtina',
    'settings.language.sk': 'Slovenčina',
    'settings.browse': 'Prehľadávať',
  }
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    async function loadLang() {
      const store = await load('settings.json');
      const savedLang = await store.get('language');
      if (savedLang === 'sk' || savedLang === 'en') {
        setLangState(savedLang as Language);
      }
    }
    loadLang();
  }, []);

  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    const store = await load('settings.json');
    await store.set('language', newLang);
    await store.save();
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}