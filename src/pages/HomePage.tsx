import {
  Archive,
  Brain,
  ClipboardList,
  Combine,
  FileMinus,
  FileOutput,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  Minimize2,
  PenTool,
  Repeat,
  ScanText,
  Scissors,
  Shield,
  Sparkles,
  Stamp,
  Tags,
  Wrench,
  Layers,
} from "lucide-react";
import { Page } from "../components/Sidebar";
import { useI18n } from "../lib/i18n";

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

interface HomeSection {
  id: string;
  titleKey: string;
  categoryVar: string;
  primary: {
    id: Page;
    titleKey: string;
    descriptionKey: string;
    icon: React.ElementType;
  }[];
  secondary: {
    id: Page;
    titleKey: string;
    icon: React.ElementType;
  }[];
}

const SECTIONS: HomeSection[] = [
  {
    id: "documents",
    titleKey: "cat.documents",
    categoryVar: "--cat-documents",
    primary: [
      { id: "extract", titleKey: "nav.extract", descriptionKey: "extract.desc", icon: FileOutput },
      { id: "merge", titleKey: "nav.merge", descriptionKey: "merge.desc", icon: Combine },
      { id: "split", titleKey: "nav.split", descriptionKey: "split.desc", icon: Scissors },
    ],
    secondary: [
      { id: "compress", titleKey: "nav.compress", icon: Minimize2 },
      { id: "organize", titleKey: "nav.organize", icon: LayoutGrid },
      { id: "clean", titleKey: "nav.clean", icon: FileMinus },
      { id: "repair", titleKey: "nav.repair", icon: Wrench },
    ],
  },
  {
    id: "content",
    titleKey: "cat.content",
    categoryVar: "--cat-content",
    primary: [
      { id: "convert", titleKey: "nav.convert", descriptionKey: "convert.desc", icon: Repeat },
      { id: "watermark", titleKey: "nav.watermark", descriptionKey: "watermark.desc", icon: Stamp },
      { id: "extractImages", titleKey: "nav.extractImages", descriptionKey: "extractImages.desc", icon: ImageIcon },
    ],
    secondary: [
      { id: "metadata", titleKey: "nav.metadata", icon: Tags },
      { id: "forms", titleKey: "nav.forms", icon: ClipboardList },
    ],
  },
  {
    id: "security",
    titleKey: "cat.security",
    categoryVar: "--cat-security",
    primary: [
      { id: "security", titleKey: "nav.security", descriptionKey: "security.desc", icon: Lock },
      { id: "sign", titleKey: "nav.sign", descriptionKey: "sign.desc", icon: PenTool },
    ],
    secondary: [{ id: "flatten", titleKey: "nav.flatten", icon: Layers }],
  },
  {
    id: "intelligence",
    titleKey: "cat.intelligence",
    categoryVar: "--cat-intelligence",
    primary: [
      { id: "ai", titleKey: "nav.ai", descriptionKey: "ai.desc", icon: Sparkles },
      { id: "ocr", titleKey: "nav.ocr", descriptionKey: "ocr.desc", icon: ScanText },
    ],
    secondary: [],
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm">
          <FileText size={14} />
          <span>{t("app.title")}</span>
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {t("nav.home")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{t("home.subtitle")}</p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <div className="mb-3 flex items-center gap-2">
              {section.id === "documents" && <FileText size={14} style={{ color: `var(${section.categoryVar})` }} />}
              {section.id === "content" && <Archive size={14} style={{ color: `var(${section.categoryVar})` }} />}
              {section.id === "security" && <Shield size={14} style={{ color: `var(${section.categoryVar})` }} />}
              {section.id === "intelligence" && <Brain size={14} style={{ color: `var(${section.categoryVar})` }} />}
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
                {t(section.titleKey)}
              </p>
            </div>

            <div
              className={`grid gap-4 mb-3 ${
                section.primary.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
              }`}
            >
              {section.primary.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => onNavigate(card.id)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:shadow-md active:scale-[0.98]"
                  >
                    <Icon size={24} style={{ color: `var(${section.categoryVar})` }} />
                    <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{t(card.titleKey)}</h3>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{t(card.descriptionKey)}</p>
                  </button>
                );
              })}
            </div>

            {section.secondary.length > 0 && (
              <div
                className={`grid gap-3 ${
                  section.secondary.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {section.secondary.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => onNavigate(card.id)}
                      className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-hover)] hover:shadow-md active:scale-[0.98]"
                    >
                      <Icon size={16} style={{ color: `var(${section.categoryVar})` }} />
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{t(card.titleKey)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
