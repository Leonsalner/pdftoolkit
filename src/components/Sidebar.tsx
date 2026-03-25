import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import {
  Archive,
  Brain,
  ChevronRight,
  ClipboardList,
  Combine,
  FileMinus,
  FileOutput,
  FileText,
  HelpCircle,
  House,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  Lock,
  Minimize2,
  Paintbrush,
  PenTool,
  Repeat,
  ScanText,
  Settings,
  Shield,
  Sparkles,
  Stamp,
  Tags,
  Wrench,
  Scissors,
} from "lucide-react";

export type Page =
  | "home"
  | "compress"
  | "extract"
  | "merge"
  | "split"
  | "convert"
  | "watermark"
  | "security"
  | "sign"
  | "ai"
  | "ocr"
  | "organize"
  | "metadata"
  | "settings"
  | "clean"
  | "flatten"
  | "forms"
  | "extractImages"
  | "repair"
  | "library";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

interface NavSection {
  id: string;
  titleKey: string;
  categoryVar: string;
  icon: React.ElementType;
  items: { id: Page; labelKey?: string; label?: string; icon: React.ElementType }[];
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t } = useI18n();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const sections: NavSection[] = [
    {
      id: "documents",
      titleKey: "cat.documents",
      categoryVar: "--cat-documents",
      icon: FileText,
      items: [
        { id: "extract", labelKey: "nav.extract", icon: FileOutput },
        { id: "compress", labelKey: "nav.compress", icon: Minimize2 },
        { id: "merge", labelKey: "nav.merge", icon: Combine },
        { id: "split", labelKey: "nav.split", icon: Scissors },
        { id: "organize", labelKey: "nav.organize", icon: LayoutGrid },
        { id: "clean", labelKey: "nav.clean", icon: FileMinus },
        { id: "repair", labelKey: "nav.repair", icon: Wrench },
      ],
    },
    {
      id: "content",
      titleKey: "cat.content",
      categoryVar: "--cat-content",
      icon: Paintbrush,
      items: [
        { id: "convert", labelKey: "nav.convert", icon: Repeat },
        { id: "extractImages", labelKey: "nav.extractImages", icon: ImageIcon },
        { id: "watermark", labelKey: "nav.watermark", icon: Stamp },
        { id: "metadata", labelKey: "nav.metadata", icon: Tags },
        { id: "forms", labelKey: "nav.forms", icon: ClipboardList },
      ],
    },
    {
      id: "security",
      titleKey: "cat.security",
      categoryVar: "--cat-security",
      icon: Shield,
      items: [
        { id: "security", labelKey: "nav.security", icon: Lock },
        { id: "sign", labelKey: "nav.sign", icon: PenTool },
        { id: "flatten", labelKey: "nav.flatten", icon: Layers },
      ],
    },
    {
      id: "intelligence",
      titleKey: "cat.intelligence",
      categoryVar: "--cat-intelligence",
      icon: Brain,
      items: [
        { id: "ai", labelKey: "nav.ai", icon: Sparkles },
        { id: "ocr", labelKey: "nav.ocr", icon: ScanText },
      ],
    },
  ];

  useEffect(() => {
    const parentSection = sections.find((section) => section.items.some((item) => item.id === activePage));
    setExpandedCategory(parentSection?.id ?? null);
  }, [activePage]);

  const renderFooterButton = (page: Page | null, label: string, Icon: React.ElementType, action?: () => void) => {
    const isActive = page !== null && activePage === page;

    return (
      <button
        onClick={action ?? (() => page && onNavigate(page))}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-[var(--text-primary)] text-[var(--bg-base)] shadow-sm"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Icon size={16} strokeWidth={2.2} className="flex-shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-full w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-colors duration-300">
      <div className="border-b border-[var(--border)] p-4 transition-colors duration-300">
        <button onClick={() => onNavigate("home")} className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-left transition-colors hover:bg-[var(--bg-elevated)]">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{t("app.title")}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-disabled)]">
              v3.0
            </p>
          </div>
          <House
            size={16}
            className={activePage === "home" ? "text-[var(--text-primary)]" : "text-[var(--text-disabled)]"}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => setExpandedCategory((current) => (current === section.id ? null : section.id))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
            >
              <section.icon
                size={16}
                strokeWidth={2.3}
                style={{
                  color: expandedCategory === section.id ? `var(${section.categoryVar})` : "var(--text-disabled)",
                }}
              />
              <span
                className="flex-1 text-sm font-semibold"
                style={{
                  color: expandedCategory === section.id ? `var(${section.categoryVar})` : "var(--text-secondary)",
                }}
              >
                {t(section.titleKey)}
              </span>
              <ChevronRight
                size={16}
                className="text-[var(--text-disabled)] transition-transform duration-[250ms] ease-out"
                style={{ transform: expandedCategory === section.id ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>

            <div className={`sidebar-section ${expandedCategory === section.id ? "expanded" : ""}`}>
              <div>
                <div className="space-y-1 pb-1 pt-1">
                  {section.items.map((item) => {
                    const isActive = activePage === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl py-2.5 pl-10 pr-3 text-left text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? "shadow-sm"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        }`}
                        style={
                          isActive
                            ? {
                                backgroundColor: `var(${section.categoryVar}-bg)`,
                                color: `var(${section.categoryVar})`,
                              }
                            : undefined
                        }
                      >
                        <Icon
                          size={16}
                          strokeWidth={2.2}
                          className="flex-shrink-0"
                          style={{ color: isActive ? `var(${section.categoryVar})` : "var(--text-disabled)" }}
                        />
                        <span className="truncate">{item.label ?? (item.labelKey ? t(item.labelKey) : "")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-[var(--border)] p-3 transition-colors duration-300">
        {renderFooterButton(null, t("nav.help"), HelpCircle, () => {})}
        {renderFooterButton("library", t("nav.library"), Archive)}
        {renderFooterButton("settings", t("nav.settings"), Settings)}
      </div>
    </div>
  );
}
