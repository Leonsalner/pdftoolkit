import { Archive } from "lucide-react";
import { useI18n } from "../lib/i18n";

export function LibraryPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out h-full overflow-y-auto">
      <div className="flex h-full min-h-[32rem] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] px-10 py-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cat-global-bg)] text-[var(--cat-global)]">
            <Archive size={32} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
            {t("nav.library")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{t("library.title")}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{t("library.emptyState")}</p>
        </div>
      </div>
    </div>
  );
}
